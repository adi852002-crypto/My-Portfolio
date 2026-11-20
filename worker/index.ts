/* The site's only server code. Cloudflare Pages runs it in front of the
   static export for the routes listed in _routes.json; everything else is
   served straight from the edge without touching it.

   /api/collect          anonymous visit and action events from the site
   /api/contact          the contact form
   /api/admin/*          the private dashboard's data (Access-verified)
   page routes           pass through, noting link-preview fetches (shares) */

import { cfOf, json, type Env } from './env';
import { dailySalt, ensureSchema, visitorId } from './db';
import { BOT, browser, device, os, previewer, source } from './ua';
import { verifyAccess } from './access';
import { overview, recentVisits } from './stats';
import { searchConsole } from './gsc';

interface Ctx { waitUntil(p: Promise<unknown>): void }

const OWN_HOST = 'aniruddhadasgupta.com';
const TYPES = new Set(['pageview', 'leave', 'open', 'cta', 'contact', 'share', 'download', 'lamp']);
const clip = (v: unknown, n: number) => (typeof v === 'string' && v ? v.slice(0, n) : null);

/* Best-effort flood control per isolate: a script hammering the endpoint
   gets quietly ignored. Real visitors send a few dozen events at most. */
const bursts = new Map<string, { at: number; n: number }>();
function flooded(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = bursts.get(key);
  if (!b || now - b.at > windowMs) {
    bursts.set(key, { at: now, n: 1 });
    if (bursts.size > 5000) bursts.clear();
    return false;
  }
  b.n += 1;
  return b.n > max;
}

/* Writes are only accepted from the site's own pages. */
function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    const o = new URL(origin).host;
    const h = new URL(req.url).host;
    return o === h || o === OWN_HOST || o === `www.${OWN_HOST}` || o.endsWith('.pages.dev') ||
      o.startsWith('localhost') || o.startsWith('127.0.0.1');
  } catch { return false; }
}

async function identify(req: Request, env: Env) {
  const db = env.DB!;
  await ensureSchema(db);
  const ua = req.headers.get('user-agent') ?? '';
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? '0.0.0.0';
  const day = new Date().toISOString().slice(0, 10);
  const vid = await visitorId(await dailySalt(db, day), ip, ua);
  const cf = cfOf(req);
  return {
    ua, vid,
    country: cf.country ?? null, region: cf.region ?? null, city: cf.city ?? null,
    org: cf.asOrganization ?? null,
    device: device(ua), browser: browser(ua), os: os(ua),
  };
}

const INSERT = `INSERT INTO events
  (ts, vid, sid, type, name, path, ref, src, utm_source, utm_medium, utm_campaign,
   country, region, city, org, device, browser, os, lang, sw, dur)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

async function collect(req: Request, env: Env): Promise<Response> {
  if (!env.DB) return new Response(null, { status: 204 });
  if (!sameOrigin(req)) return new Response(null, { status: 403 });
  const ua = req.headers.get('user-agent') ?? '';
  if (!ua || BOT.test(ua)) return new Response(null, { status: 204 });

  const text = await req.text();
  if (text.length > 4000) return new Response(null, { status: 413 });
  let b: Record<string, unknown>;
  try { b = JSON.parse(text) as Record<string, unknown>; } catch { return new Response(null, { status: 400 }); }
  const type = String(b.t ?? '');
  if (!TYPES.has(type)) return new Response(null, { status: 400 });

  const who = await identify(req, env);
  if (flooded(who.vid, 300, 10 * 60_000)) return new Response(null, { status: 204 });

  let refHost = '';
  try { refHost = b.r ? new URL(String(b.r)).hostname : ''; } catch { /* not a URL */ }
  const utmSource = clip(b.us, 60) ?? '';
  const landing = type === 'pageview' && b.land === 1;
  const src = landing ? source(refHost, utmSource, OWN_HOST) : null;
  const ownRef = !refHost || refHost.replace(/^www\./, '') === OWN_HOST;

  await env.DB.prepare(INSERT).bind(
    Date.now(), who.vid, clip(b.s, 24), type, clip(b.n, 80), clip(b.p, 200),
    landing && !ownRef ? refHost.slice(0, 100) : null, src,
    landing ? utmSource || null : null,
    landing ? clip(b.um, 60) : null,
    landing ? clip(b.uc, 80) : null,
    who.country, who.region, who.city, clip(who.org, 80),
    who.device, who.browser, who.os, clip(b.l, 16),
    typeof b.w === 'number' ? Math.round(b.w) : null,
    type === 'leave' && typeof b.d === 'number' ? Math.min(Math.max(0, Math.round(b.d)), 3600_000) : null,
  ).run();
  return new Response(null, { status: 204 });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function contact(req: Request, env: Env): Promise<Response> {
  if (!env.DB) return json({ ok: false, error: 'not-configured' }, 503);
  if (!sameOrigin(req)) return json({ ok: false, error: 'origin' }, 403);
  const text = await req.text();
  if (text.length > 12_000) return json({ ok: false, error: 'too-long' }, 413);
  let b: Record<string, unknown>;
  try { b = JSON.parse(text) as Record<string, unknown>; } catch { return json({ ok: false, error: 'bad-request' }, 400); }

  /* Two cheap spam checks: a hidden field people never see, and a form
     filled in faster than a person can type. Both get a quiet "ok". */
  if (b.website || (typeof b.elapsed === 'number' && b.elapsed < 2500)) return json({ ok: true });

  const name = clip(b.name, 120)?.trim() ?? '';
  const email = clip(b.email, 200)?.trim() ?? '';
  const message = clip(b.message, 4000)?.trim() ?? '';
  if (name.length < 2 || !EMAIL_RE.test(email) || message.length < 20) {
    return json({ ok: false, error: 'invalid' }, 422);
  }

  const who = await identify(req, env);
  const recent = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM messages WHERE vid = ? AND ts > ?',
  ).bind(who.vid, Date.now() - 3600_000).first<{ n: number }>();
  if ((recent?.n ?? 0) >= 3) return json({ ok: false, error: 'rate' }, 429);

  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO messages (ts, name, email, company, topic, track, availability, message, country, city, vid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(now, name, email, clip(b.company, 160), clip(b.topic, 60), clip(b.track, 40),
      clip(b.when, 160), message, who.country, who.city, who.vid),
    env.DB.prepare(INSERT).bind(
      now, who.vid, clip(b.s, 24), 'message', clip(b.topic, 60) ?? 'form', '/contact/', null, null,
      null, null, null, who.country, who.region, who.city, clip(who.org, 80),
      who.device, who.browser, who.os, null, null, null,
    ),
  ]);
  return json({ ok: true });
}

async function admin(req: Request, env: Env, path: string): Promise<Response> {
  const who = await verifyAccess(req, env);
  const head = { 'x-robots-tag': 'noindex' };
  if (!who) return json({ error: 'unauthorised' }, 401, head);
  if (!env.DB) return json({ error: 'no-database' }, 503, head);
  await ensureSchema(env.DB);

  const url = new URL(req.url);
  const days = Math.min(Math.max(Number(url.searchParams.get('days')) || 7, 1), 400);
  const tz = Math.min(Math.max(Number(url.searchParams.get('tz')) || 330, -720), 840);

  if (path === '/api/admin/me') return json({ email: who.email }, 200, head);
  if (path === '/api/admin/overview') return json(await overview(env.DB, days, tz), 200, head);
  if (path === '/api/admin/visits') return json(await recentVisits(env.DB, days, tz), 200, head);
  if (path === '/api/admin/seo') {
    return json(await searchConsole(env, url.searchParams.get('fresh') === '1'), 200, head);
  }
  if (path === '/api/admin/messages' && req.method === 'GET') {
    const { results } = await env.DB.prepare(
      `SELECT id, ts, name, email, company, topic, track, availability, message, country, city, read
       FROM messages ORDER BY ts DESC LIMIT 200`,
    ).all();
    return json(results, 200, head);
  }
  const m = /^\/api\/admin\/messages\/(\d+)$/.exec(path);
  if (m) {
    const id = Number(m[1]);
    if (req.method === 'DELETE') {
      await env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(id).run();
      return json({ ok: true }, 200, head);
    }
    if (req.method === 'POST') {
      const b = (await req.json().catch(() => ({}))) as { read?: boolean };
      await env.DB.prepare('UPDATE messages SET read = ? WHERE id = ?').bind(b.read === false ? 0 : 1, id).run();
      return json({ ok: true }, 200, head);
    }
  }
  return json({ error: 'not-found' }, 404, head);
}

/* A chat app fetching the page to draw a preview card means somebody has
   just pasted the link somewhere. Count it, then serve the page as usual. */
async function notePreview(req: Request, env: Env, who: string, path: string) {
  if (!env.DB) return;
  await ensureSchema(env.DB);
  const cf = cfOf(req);
  await env.DB.prepare(INSERT).bind(
    Date.now(), `bot:${who}`, null, 'preview', who, path.slice(0, 200), null, null, null, null, null,
    cf.country ?? null, null, null, null, null, null, null, null, null, null,
  ).run();
}

export default {
  async fetch(req: Request, env: Env, ctx: Ctx): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    try {
      if (path === '/api/collect' && req.method === 'POST') return await collect(req, env);
      if (path === '/api/contact' && req.method === 'POST') return await contact(req, env);
      if (path.startsWith('/api/admin/')) return await admin(req, env, path);
      if (path.startsWith('/api/')) return json({ error: 'not-found' }, 404);
    } catch (e) {
      console.error(e);
      return json({ error: 'server' }, 500);
    }

    if (req.method === 'GET') {
      const bot = previewer(req.headers.get('user-agent') ?? '');
      if (bot) ctx.waitUntil(notePreview(req, env, bot, path).catch(() => undefined));
    }
    return env.ASSETS.fetch(req);
  },
};
