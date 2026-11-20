/* The few Cloudflare types the worker uses, written out so the site does not
   need @cloudflare/workers-types. They match the runtime's own shapes. */

export interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta?: { rows_read?: number; rows_written?: number; last_row_id?: number };
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(col?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(sql: string): Promise<unknown>;
}

export interface Env {
  /* Static files of the export. */
  ASSETS: { fetch(req: Request): Promise<Response> };
  /* The analytics database. Bound in the Pages project's settings. */
  DB?: D1Database;
  /* Cloudflare Access, which guards /admin. Both are public identifiers,
     not secrets: the team's domain and the application's audience tag. */
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  /* Search Console: the property as Search Console names it, and a service
     account's JSON key, stored as an encrypted secret. */
  GSC_SITE?: string;
  GSC_SERVICE_ACCOUNT?: string;
  /* Local development only: lets /api/admin answer without Access. */
  DEV_ADMIN?: string;
}

/* What Cloudflare attaches to each request about where it came from. */
export interface CfProps {
  country?: string;
  region?: string;
  city?: string;
  asOrganization?: string;
  timezone?: string;
}

export function cfOf(req: Request): CfProps {
  return ((req as unknown as { cf?: CfProps }).cf) ?? {};
}

export function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extra,
    },
  });
}
