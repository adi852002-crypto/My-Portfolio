import type { Env } from './env';

/* Google Search Console, read with a service account: the account is added
   as a user on the property, and its JSON key is stored as an encrypted
   Cloudflare secret. Results are cached for six hours, because Search
   Console's numbers move about once a day and run two to three days behind. */

const CACHE_MS = 6 * 3600 * 1000;

const b64url = (bytes: Uint8Array | string) => {
  const bin = typeof bytes === 'string' ? bytes : String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

async function accessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${head}.${body}`)),
  );
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${head}.${body}.${b64url(sig)}`,
    }),
  });
  if (!res.ok) throw new Error(`Google sign-in failed (${res.status})`);
  return ((await res.json()) as { access_token: string }).access_token;
}

type Row = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };

async function query(token: string, site: string, body: object): Promise<Row[]> {
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (res.status === 403) throw new Error('The service account has not been added as a user on this Search Console property.');
  if (!res.ok) throw new Error(`Search Console answered ${res.status}`);
  return ((await res.json()) as { rows?: Row[] }).rows ?? [];
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);

export type Seo =
  | { configured: false }
  | { configured: true; error: string }
  | {
      configured: true;
      site: string;
      range: { start: string; end: string };
      totals: { clicks: number; impressions: number; ctr: number; position: number };
      daily: { date: string; clicks: number; impressions: number }[];
      queries: Row[];
      pages: Row[];
      countries: Row[];
      devices: Row[];
      fetchedAt: number;
    };

export async function searchConsole(env: Env, fresh = false): Promise<Seo> {
  if (!env.GSC_SERVICE_ACCOUNT || !env.GSC_SITE) return { configured: false };
  const db = env.DB;
  const key = `gsc:${env.GSC_SITE}`;
  if (db && !fresh) {
    const hit = await db.prepare('SELECT ts, body FROM cache WHERE key = ?').bind(key).first<{ ts: number; body: string }>();
    if (hit && Date.now() - hit.ts < CACHE_MS) return JSON.parse(hit.body) as Seo;
  }
  try {
    const sa = JSON.parse(env.GSC_SERVICE_ACCOUNT) as { client_email: string; private_key: string };
    const token = await accessToken(sa);
    const end = new Date(Date.now() - 2 * 86400_000);
    const start = new Date(end.getTime() - 27 * 86400_000);
    const range = { startDate: ymd(start), endDate: ymd(end) };
    const [daily, queries, pages, countries, devices, totals] = await Promise.all([
      query(token, env.GSC_SITE, { ...range, dimensions: ['date'], rowLimit: 100 }),
      query(token, env.GSC_SITE, { ...range, dimensions: ['query'], rowLimit: 15 }),
      query(token, env.GSC_SITE, { ...range, dimensions: ['page'], rowLimit: 10 }),
      query(token, env.GSC_SITE, { ...range, dimensions: ['country'], rowLimit: 8 }),
      query(token, env.GSC_SITE, { ...range, dimensions: ['device'], rowLimit: 5 }),
      query(token, env.GSC_SITE, { ...range, rowLimit: 1 }),
    ]);
    const t = totals[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    const out: Seo = {
      configured: true,
      site: env.GSC_SITE,
      range: { start: range.startDate, end: range.endDate },
      totals: { clicks: t.clicks, impressions: t.impressions, ctr: t.ctr, position: t.position },
      daily: daily.map((r) => ({ date: r.keys?.[0] ?? '', clicks: r.clicks, impressions: r.impressions })),
      queries, pages, countries, devices,
      fetchedAt: Date.now(),
    };
    if (db) {
      await db.prepare('INSERT OR REPLACE INTO cache (key, ts, body) VALUES (?, ?, ?)')
        .bind(key, Date.now(), JSON.stringify(out)).run();
    }
    return out;
  } catch (e) {
    return { configured: true, error: e instanceof Error ? e.message : 'Could not reach Search Console' };
  }
}
