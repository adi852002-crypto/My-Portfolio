import type { D1Database } from './env';

/* The whole schema. Every statement is idempotent, so the worker runs it
   once per isolate and nobody has to paste SQL into a console. */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS events (
     id INTEGER PRIMARY KEY,
     ts INTEGER NOT NULL,          -- ms since epoch
     vid TEXT NOT NULL,            -- anonymous visitor: a hash that changes every day
     sid TEXT,                     -- one page load in one tab
     type TEXT NOT NULL,           -- pageview, leave, open, cta, contact, share, download, lamp, preview, message
     name TEXT,                    -- what was opened / clicked / shared
     path TEXT,
     ref TEXT,                     -- referring host, first page of a visit only
     src TEXT,                     -- where the visit came from, classified
     utm_source TEXT, utm_medium TEXT, utm_campaign TEXT,
     country TEXT, region TEXT, city TEXT, org TEXT,
     device TEXT, browser TEXT, os TEXT, lang TEXT, sw INTEGER,
     dur INTEGER                   -- engaged ms, on leave events
   )`,
  `CREATE INDEX IF NOT EXISTS events_ts ON events (ts)`,
  `CREATE INDEX IF NOT EXISTS events_vid_ts ON events (vid, ts)`,
  `CREATE INDEX IF NOT EXISTS events_type_ts ON events (type, ts)`,
  /* One random salt per UTC day. Yesterday's is deleted when today's is
     made, after which no stored hash can be linked back to an address. */
  `CREATE TABLE IF NOT EXISTS salts (day TEXT PRIMARY KEY, salt TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS messages (
     id INTEGER PRIMARY KEY,
     ts INTEGER NOT NULL,
     name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, topic TEXT,
     track TEXT, availability TEXT, message TEXT NOT NULL,
     country TEXT, city TEXT, vid TEXT,
     read INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE INDEX IF NOT EXISTS messages_ts ON messages (ts)`,
  `CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, ts INTEGER NOT NULL, body TEXT NOT NULL)`,
];

let ready: Promise<void> | null = null;

export function ensureSchema(db: D1Database): Promise<void> {
  if (!ready) {
    ready = db.batch(SCHEMA.map((s) => db.prepare(s))).then(() => undefined);
    ready.catch(() => { ready = null; });
  }
  return ready;
}

/* Events are kept for 13 months, so a year can be compared with the last. */
export const RETENTION_MS = 400 * 24 * 3600 * 1000;

const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export async function dailySalt(db: D1Database, day: string): Promise<string> {
  const row = await db.prepare('SELECT salt FROM salts WHERE day = ?').bind(day).first<{ salt: string }>();
  if (row) return row.salt;
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  await db.batch([
    db.prepare('INSERT OR IGNORE INTO salts (day, salt) VALUES (?, ?)').bind(day, salt),
    db.prepare('DELETE FROM salts WHERE day < ?').bind(day),
    db.prepare('DELETE FROM events WHERE ts < ?').bind(Date.now() - RETENTION_MS),
  ]);
  /* Another request may have won the race; use whichever salt was stored. */
  const won = await db.prepare('SELECT salt FROM salts WHERE day = ?').bind(day).first<{ salt: string }>();
  return won?.salt ?? salt;
}

/* The visitor id: the same person on the same day gets the same id, and
   nothing else. The address and browser string are never stored. */
export async function visitorId(salt: string, ip: string, ua: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}|${ip}|${ua}`);
  return hex(await crypto.subtle.digest('SHA-256', data)).slice(0, 20);
}
