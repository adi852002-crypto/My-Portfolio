import type { D1Database } from './env';

/* The dashboard's numbers. Everything is computed from the one events
   table at request time; at a personal site's volume that is a few
   thousand rows, well inside D1's free daily reads. */

const GAP = 30 * 60 * 1000; // a pause longer than this starts a new visit

export function rangeStart(days: number, tzMin: number): number {
  const day = 86400_000;
  const local = Date.now() + tzMin * 60_000;
  return Math.floor(local / day) * day - (days - 1) * day - tzMin * 60_000;
}

type KV = { k: string; n: number };

export async function overview(db: D1Database, days: number, tzMin: number) {
  const since = rangeStart(days, tzMin);
  const shift = tzMin * 60; // seconds, for grouping by the owner's calendar day
  const NOT_BOT = `ts >= ?1 AND type != 'preview'`;

  const top = (col: string, where: string, count = 'COUNT(DISTINCT vid)', limit = 10) =>
    db.prepare(
      `SELECT ${col} AS k, ${count} AS n FROM events
       WHERE ts >= ?1 AND ${where} AND ${col} IS NOT NULL AND ${col} != ''
       GROUP BY k ORDER BY n DESC LIMIT ${limit}`,
    ).bind(since);

  const stmts = {
    kpi: db.prepare(
      `SELECT
         COUNT(DISTINCT vid) AS visitors,
         SUM(type = 'pageview') AS pageviews,
         SUM(type = 'open') AS opens,
         SUM(type IN ('contact', 'message')) AS contacts,
         SUM(type = 'message') AS messages,
         SUM(type = 'share') AS shares,
         SUM(type = 'download') AS downloads,
         COALESCE(SUM(CASE WHEN type = 'leave' THEN dur END), 0) AS engaged
       FROM events WHERE ${NOT_BOT}`,
    ).bind(since),
    visits: db.prepare(
      `SELECT COUNT(*) AS visits FROM (
         SELECT ts - LAG(ts) OVER (PARTITION BY vid ORDER BY ts) AS gap
         FROM events WHERE ${NOT_BOT}
       ) WHERE gap IS NULL OR gap > ${GAP}`,
    ).bind(since),
    previews: db.prepare(`SELECT COUNT(*) AS n FROM events WHERE ts >= ?1 AND type = 'preview'`).bind(since),
    live: db.prepare(
      `SELECT COUNT(DISTINCT vid) AS n FROM events WHERE ts >= ?1 AND type != 'preview'`,
    ).bind(Date.now() - 5 * 60_000),
    daily: db.prepare(
      `SELECT date(ts / 1000 + ${shift}, 'unixepoch') AS d,
              COUNT(DISTINCT vid) AS visitors, SUM(type = 'pageview') AS pageviews
       FROM events WHERE ${NOT_BOT} GROUP BY d ORDER BY d`,
    ).bind(since),
    engagedVisitors: db.prepare(
      `SELECT
         COUNT(DISTINCT CASE WHEN type = 'open' THEN vid END) AS opened,
         COUNT(DISTINCT CASE WHEN type IN ('contact', 'message') THEN vid END) AS contacted
       FROM events WHERE ${NOT_BOT}`,
    ).bind(since),
    sources: top('src', `type = 'pageview'`),
    referrers: top('ref', `type = 'pageview'`),
    campaigns: top('utm_campaign', `type = 'pageview'`),
    countries: top('country', `type = 'pageview'`),
    cities: top(`city || ', ' || country`, `type = 'pageview' AND city IS NOT NULL`),
    orgs: top('org', `type = 'pageview'`),
    devices: top('device', `type = 'pageview'`),
    browsers: top('browser', `type = 'pageview'`),
    systems: top('os', `type = 'pageview'`),
    languages: top(`substr(lang, 1, 2)`, `type = 'pageview'`),
    pages: top('path', `type = 'pageview'`, 'COUNT(*)'),
    opens: top('name', `type = 'open'`, 'COUNT(*)', 20),
    ctas: top('name', `type = 'cta'`, 'COUNT(*)'),
    contactsBy: top('name', `type IN ('contact', 'message')`, 'COUNT(*)'),
    sharesBy: top('name', `type = 'share'`, 'COUNT(*)'),
    sharedArrivals: top('src', `type = 'pageview' AND utm_medium = 'share'`),
    previewsBy: top('name', `type = 'preview'`, 'COUNT(*)'),
    downloadsBy: top('name', `type = 'download'`, 'COUNT(*)'),
    unread: db.prepare(`SELECT COUNT(*) AS n FROM messages WHERE read = 0`),
  };

  const names = Object.keys(stmts) as (keyof typeof stmts)[];
  const results = await db.batch(names.map((n) => stmts[n]));
  const r = Object.fromEntries(names.map((n, i) => [n, results[i].results])) as Record<
    keyof typeof stmts, Record<string, number | string | null>[]
  >;

  const kpi = r.kpi[0] ?? {};
  const visits = Number(r.visits[0]?.visits ?? 0);
  const list = (rows: Record<string, unknown>[]) => rows as unknown as KV[];
  return {
    range: { days, since, tz: tzMin },
    kpi: {
      visitors: Number(kpi.visitors ?? 0),
      visits,
      pageviews: Number(kpi.pageviews ?? 0),
      avgEngagedMs: visits ? Math.round(Number(kpi.engaged ?? 0) / visits) : 0,
      opens: Number(kpi.opens ?? 0),
      contacts: Number(kpi.contacts ?? 0),
      messages: Number(kpi.messages ?? 0),
      shares: Number(kpi.shares ?? 0),
      downloads: Number(kpi.downloads ?? 0),
      previews: Number(r.previews[0]?.n ?? 0),
      live: Number(r.live[0]?.n ?? 0),
      unread: Number(r.unread[0]?.n ?? 0),
    },
    funnel: {
      visitors: Number(kpi.visitors ?? 0),
      opened: Number(r.engagedVisitors[0]?.opened ?? 0),
      contacted: Number(r.engagedVisitors[0]?.contacted ?? 0),
    },
    daily: r.daily as unknown as { d: string; visitors: number; pageviews: number }[],
    lists: {
      sources: list(r.sources), referrers: list(r.referrers), campaigns: list(r.campaigns),
      countries: list(r.countries), cities: list(r.cities), orgs: list(r.orgs),
      devices: list(r.devices), browsers: list(r.browsers), systems: list(r.systems),
      languages: list(r.languages), pages: list(r.pages),
      opens: list(r.opens), ctas: list(r.ctas), contacts: list(r.contactsBy),
      shares: list(r.sharesBy), sharedArrivals: list(r.sharedArrivals),
      previews: list(r.previewsBy), downloads: list(r.downloadsBy),
    },
  };
}

type Ev = {
  ts: number; vid: string; type: string; name: string | null; path: string | null;
  ref: string | null; src: string | null; utm_source: string | null; utm_medium: string | null;
  utm_campaign: string | null; country: string | null; region: string | null; city: string | null;
  org: string | null; device: string | null; browser: string | null; os: string | null;
  lang: string | null; dur: number | null;
};

export type Visit = {
  start: number; end: number; engagedMs: number; place: string; country: string | null;
  org: string | null; device: string | null; browser: string | null; os: string | null;
  lang: string | null; source: string; ref: string | null; campaign: string | null;
  steps: { ts: number; type: string; name: string | null; path: string | null }[];
};

/* Recent visits, newest first: one entry per visitor per sitting, with the
   pages and actions in order. */
export async function recentVisits(db: D1Database, days: number, tzMin: number, limit = 60) {
  const since = rangeStart(days, tzMin);
  const { results } = await db.prepare(
    `SELECT ts, vid, type, name, path, ref, src, utm_source, utm_medium, utm_campaign,
            country, region, city, org, device, browser, os, lang, dur
     FROM events WHERE ts >= ? AND type != 'preview' ORDER BY ts DESC LIMIT 4000`,
  ).bind(since).all<Ev>();

  const byVid = new Map<string, Ev[]>();
  for (const e of results.reverse()) {
    const list = byVid.get(e.vid) ?? [];
    list.push(e);
    byVid.set(e.vid, list);
  }

  const visits: Visit[] = [];
  for (const evs of byVid.values()) {
    let cur: Ev[] = [];
    const flush = () => {
      if (!cur.length) return;
      const first = cur[0];
      const landing = cur.find((e) => e.src) ?? first;
      visits.push({
        start: first.ts,
        end: cur[cur.length - 1].ts,
        engagedMs: cur.reduce((a, e) => a + (e.type === 'leave' ? e.dur ?? 0 : 0), 0),
        place: [first.city, first.region, first.country].filter(Boolean).join(', '),
        country: first.country,
        org: first.org,
        device: first.device, browser: first.browser, os: first.os, lang: first.lang,
        source: landing.src ?? 'Direct',
        ref: landing.ref,
        campaign: landing.utm_campaign,
        steps: cur
          .filter((e) => e.type !== 'leave')
          .map((e) => ({ ts: e.ts, type: e.type, name: e.name, path: e.path })),
      });
      cur = [];
    };
    for (const e of evs) {
      if (cur.length && e.ts - cur[cur.length - 1].ts > GAP) flush();
      cur.push(e);
    }
    flush();
  }
  visits.sort((a, b) => b.start - a.start);
  return visits.slice(0, limit);
}
