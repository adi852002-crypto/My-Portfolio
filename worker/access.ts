import type { Env } from './env';

/* Cloudflare Access sits in front of /admin and signs every request it lets
   through. The worker checks that signature itself before answering any
   /api/admin call, so the data stays closed even on a route Access does not
   cover (the project's *.pages.dev address, for one). It fails closed: with
   Access not configured, nothing is served. */

type Jwk = JsonWebKey & { kid: string };
let jwks: { at: number; keys: Jwk[] } | null = null;

const b64url = (s: string) => {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(pad + '='.repeat((4 - (pad.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function keys(team: string): Promise<Jwk[]> {
  if (jwks && Date.now() - jwks.at < 3600_000) return jwks.keys;
  const res = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error('certs');
  const body = (await res.json()) as { keys: Jwk[] };
  jwks = { at: Date.now(), keys: body.keys };
  return body.keys;
}

export type Who = { email: string } | null;

export async function verifyAccess(req: Request, env: Env): Promise<Who> {
  if (env.DEV_ADMIN === '1') return { email: 'dev@localhost' };
  const team = env.ACCESS_TEAM_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const aud = env.ACCESS_AUD;
  if (!team || !aud) return null;

  const token =
    req.headers.get('cf-access-jwt-assertion') ??
    /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(req.headers.get('cookie') ?? '')?.[1];
  if (!token) return null;

  const [h, p, s] = token.split('.');
  if (!h || !p || !s) return null;
  try {
    const header = JSON.parse(new TextDecoder().decode(b64url(h))) as { kid?: string; alg?: string };
    if (header.alg !== 'RS256') return null;
    const jwk = (await keys(team)).find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey(
      'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'],
    );
    const ok = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', key, b64url(s), new TextEncoder().encode(`${h}.${p}`),
    );
    if (!ok) return null;
    const claims = JSON.parse(new TextDecoder().decode(b64url(p))) as {
      aud?: string | string[]; exp?: number; iss?: string; email?: string;
    };
    const auds = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!auds.includes(aud)) return null;
    if (!claims.exp || claims.exp * 1000 < Date.now()) return null;
    if (claims.iss && claims.iss !== `https://${team}`) return null;
    return { email: claims.email ?? 'unknown' };
  } catch {
    return null;
  }
}
