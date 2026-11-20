'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarList, DailyColumns, Stat, duration, fmt } from './charts';
import { isOptedOut, optOut } from '@/lib/analytics';

/* ------------------------------------------------------------------
   The private dashboard. Everything it shows comes from /api/admin/*,
   which answers only to a request Cloudflare Access has signed in.
   ------------------------------------------------------------------ */

type KV = { k: string; n: number };
type Overview = {
  range: { days: number; since: number; tz: number };
  kpi: Record<'visitors' | 'visits' | 'pageviews' | 'avgEngagedMs' | 'opens' | 'contacts' | 'messages'
    | 'shares' | 'downloads' | 'previews' | 'live' | 'unread', number>;
  funnel: { visitors: number; opened: number; contacted: number };
  daily: { d: string; visitors: number; pageviews: number }[];
  lists: Record<'sources' | 'referrers' | 'campaigns' | 'countries' | 'cities' | 'orgs' | 'devices'
    | 'browsers' | 'systems' | 'languages' | 'pages' | 'opens' | 'ctas' | 'contacts' | 'shares'
    | 'sharedArrivals' | 'previews' | 'downloads', KV[]>;
};
type Visit = {
  start: number; end: number; engagedMs: number; place: string; country: string | null;
  org: string | null; device: string | null; browser: string | null; os: string | null;
  lang: string | null; source: string; ref: string | null; campaign: string | null;
  steps: { ts: number; type: string; name: string | null; path: string | null }[];
};
type Message = {
  id: number; ts: number; name: string; email: string; company: string | null; topic: string | null;
  track: string | null; availability: string | null; message: string; country: string | null;
  city: string | null; read: number;
};
type GscRow = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };
type Seo =
  | { configured: false }
  | { configured: true; error: string }
  | {
      configured: true; site: string; range: { start: string; end: string };
      totals: { clicks: number; impressions: number; ctr: number; position: number };
      daily: { date: string; clicks: number; impressions: number }[];
      queries: GscRow[]; pages: GscRow[]; countries: GscRow[]; devices: GscRow[]; fetchedAt: number;
    };

/* Names the dashboard shows for what the site records. */
const OBJECT: Record<string, string> = {
  startups: 'For startups (green board)', enterprise: 'For enterprise (cream board)',
  hiring: 'For recruiters (CV)', work: 'Work history (notebook)', success: 'Customer success (laptop)',
  process: 'Process & CRM (tablet)', ai: 'AI in action (monitor)', about: 'About (photo frame)',
  note: 'Leave a note (notepad)', contact: 'Contact (phone)',
};
const ACTION: Record<string, string> = {
  email: 'Email link', phone: 'Phone link', linkedin: 'LinkedIn profile', note: 'Desk note (email)',
  operations: 'Form: operations', 'customer-success': 'Form: customer success', crm: 'Form: CRM',
  ai: 'Form: AI & automation', 'discovery-call': 'Form: discovery call', other: 'Form: something else', form: 'Contact form',
  cv: 'CV (PDF)', vcard: 'Contact card (vCard)',
};
const SHARE: Record<string, string> = {
  native: 'Phone share sheet', copy: 'Copied link', whatsapp: 'WhatsApp', linkedin: 'LinkedIn',
  email: 'Email', x: 'X',
};
const plural = (n: number, one: string, many = `${one}s`) => `${fmt(n)} ${n === 1 ? one : many}`;
const COUNTRY = typeof Intl !== 'undefined' && 'DisplayNames' in Intl
  ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;
const country = (c: string | null) => {
  if (!c) return '';
  try { return COUNTRY?.of(c) ?? c; } catch { return c; }
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const RANGES = [
  { days: 1, label: 'Today' }, { days: 7, label: '7 days' },
  { days: 30, label: '30 days' }, { days: 90, label: '90 days' },
];

type Load = 'loading' | 'ok' | 'signin' | 'nodb' | 'error';

async function get<T>(url: string): Promise<{ status: number; data: T | null }> {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
  const data = res.ok ? ((await res.json()) as T) : null;
  return { status: res.status, data };
}

function ago(ts: number) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

function Card({ title, children, className = '', aside }: {
  title: string; children: React.ReactNode; className?: string; aside?: React.ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-surface p-5 ${className}`}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-[18px]">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Dashboard() {
  const [days, setDays] = useState(7);
  const [state, setState] = useState<Load>('loading');
  const [ov, setOv] = useState<Overview | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [seo, setSeo] = useState<Seo | null>(null);
  const [who, setWho] = useState('');
  const [updated, setUpdated] = useState(0);
  const [excluded, setExcluded] = useState(true);
  const [shown, setShown] = useState(15);
  const tz = useMemo(() => -new Date().getTimezoneOffset(), []);

  /* The owner's own browsing should not count: opening the dashboard
     switches counting off for this browser. */
  useEffect(() => { optOut(true); setExcluded(isOptedOut()); }, []);

  const load = useCallback(async () => {
    try {
      const q = `days=${days}&tz=${tz}`;
      const [me, o, v, m] = await Promise.all([
        get<{ email: string }>('/api/admin/me'),
        get<Overview>(`/api/admin/overview?${q}`),
        get<Visit[]>(`/api/admin/visits?${q}`),
        get<Message[]>('/api/admin/messages'),
      ]);
      if (me.status === 401 || o.status === 401) { setState('signin'); return; }
      if (o.status === 503) { setState('nodb'); return; }
      if (!o.data) { setState('error'); return; }
      setWho(me.data?.email ?? '');
      setOv(o.data);
      setVisits(v.data ?? []);
      setMessages(m.data ?? []);
      setUpdated(Date.now());
      setState('ok');
    } catch {
      setState('error');
    }
  }, [days, tz]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 60_000);
    return () => clearInterval(t);
  }, [load]);
  useEffect(() => {
    if (state !== 'ok' || seo) return;
    get<Seo>('/api/admin/seo').then((r) => setSeo(r.data ?? { configured: true, error: 'Could not load' }));
  }, [state, seo]);

  const refreshSeo = async () => {
    setSeo(null);
    const r = await get<Seo>('/api/admin/seo?fresh=1');
    setSeo(r.data ?? { configured: true, error: 'Could not load' });
  };

  async function setRead(id: number, read: boolean) {
    await fetch(`/api/admin/messages/${id}`, {
      method: 'POST', credentials: 'include',
      headers: { 'content-type': 'application/json' }, body: JSON.stringify({ read }),
    });
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, read: read ? 1 : 0 } : m)));
  }
  async function remove(id: number) {
    if (!window.confirm('Delete this message for good? This cannot be undone.')) return;
    await fetch(`/api/admin/messages/${id}`, { method: 'DELETE', credentials: 'include' });
    setMessages((ms) => ms.filter((m) => m.id !== id));
  }

  /* Desk opens arrive as "id|desk" or "id|menu": fold them per object. */
  const objects = useMemo(() => {
    const m = new Map<string, { total: number; desk: number }>();
    for (const r of ov?.lists.opens ?? []) {
      const [id, how] = r.k.split('|');
      const e = m.get(id) ?? { total: 0, desk: 0 };
      e.total += r.n;
      if (how === 'desk') e.desk += r.n;
      m.set(id, e);
    }
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [ov]);
  const deskShare = useMemo(() => {
    const t = objects.reduce((a, [, e]) => a + e.total, 0);
    const d = objects.reduce((a, [, e]) => a + e.desk, 0);
    return t ? Math.round((d / t) * 100) : 0;
  }, [objects]);

  const dailyRows = useMemo(() => {
    if (!ov) return [];
    const have = new Map(ov.daily.map((r) => [r.d, r]));
    const out: { d: string; v: number; v2: number }[] = [];
    const n = Math.max(ov.range.days, 1);
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(Date.now() + tz * 60_000 - i * 86400_000).toISOString().slice(0, 10);
      const r = have.get(d);
      out.push({ d, v: r?.visitors ?? 0, v2: r?.pageviews ?? 0 });
    }
    return out;
  }, [ov, tz]);

  const unread = messages.filter((m) => !m.read).length;
  const previews = (ov?.lists.previews ?? []).filter((r) => !r.k.includes('(crawl)'));
  const crawls = (ov?.lists.previews ?? []).filter((r) => r.k.includes('(crawl)'));

  if (state === 'signin' || state === 'nodb' || state === 'error' || (state === 'loading' && !ov)) {
    return (
      <div className="mx-auto max-w-xl py-24">
        <h1 className="font-serif text-[28px]">Site analytics</h1>
        <p className="mt-3 text-[15px] text-ink-soft">
          {state === 'loading' && 'Loading…'}
          {state === 'signin' &&
            'This dashboard opens only after signing in through Cloudflare Access. If you have just signed in, reload the page; if Access is not set up yet, the data stays locked until it is.'}
          {state === 'nodb' && 'The analytics database is not connected to the site yet (the DB binding in the Cloudflare Pages settings).'}
          {state === 'error' && 'The dashboard could not reach its data just now.'}
        </p>
        {state !== 'loading' && (
          <button type="button" className="btn-secondary mt-6" onClick={() => { setState('loading'); void load(); }}>
            Try again
          </button>
        )}
      </div>
    );
  }
  if (!ov) return null;
  const k = ov.kpi;
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');

  return (
    <div className="pb-20">
      {/* Header and range: one row, above everything they control. */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-line bg-ivory/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-serif text-[20px]">AD</Link>
            <h1 className="font-serif text-[20px]">Site analytics</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-[12px] text-ink-soft">
              <span className={`h-2 w-2 rounded-full ${k.live ? 'bg-sage' : 'bg-line-strong'}`} aria-hidden="true" />
              {k.live} on the site now
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div role="group" aria-label="Date range" className="flex rounded-full border border-line p-0.5">
              {RANGES.map((r) => (
                <button key={r.days} type="button" aria-pressed={days === r.days}
                        onClick={() => setDays(r.days)}
                        className={`whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] sm:px-3 ${days === r.days ? 'bg-sage text-ink-invert' : 'text-ink-soft hover:text-ink'}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => void load()} className="rounded-full border border-line px-3 py-1.5 text-[13px] text-ink-soft hover:text-ink">
              Refresh
            </button>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[12px] text-ink-soft">
        Updated {ago(updated)}{who ? ` · signed in as ${who}` : ''}
        {excluded ? ' · this browser is not counted' : ''}
      </p>

      {/* Headline numbers */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Stat label="Visitors" value={fmt(k.visitors)} note="counted per day" />
        <Stat label="Visits" value={fmt(k.visits)} />
        <Stat label="Page views" value={fmt(k.pageviews)} />
        <Stat label="Avg time engaged" value={duration(k.avgEngagedMs)} note="per visit" />
        <Stat label="Desk objects opened" value={fmt(k.opens)} note={`${deskShare}% clicked on the desk`} />
        <Stat label="Contact actions" value={fmt(k.contacts)} note={`${fmt(k.messages)} form messages`} />
        <Stat label="Shares" value={fmt(k.shares)} note={`${fmt(previews.reduce((a, r) => a + r.n, 0))} link previews`} />
        <Stat label="CV downloads" value={fmt((ov.lists.downloads.find((d) => d.k === 'cv')?.n) ?? 0)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Visitors per day" className="lg:col-span-2">
          <DailyColumns rows={dailyRows} label="Visitors" secondaryLabel="Page views" />
        </Card>
        <Card title="From visit to conversation">
          <ol className="space-y-3">
            {[
              { l: 'Visited', n: ov.funnel.visitors, of: ov.funnel.visitors },
              { l: 'Opened something on the desk', n: ov.funnel.opened, of: ov.funnel.visitors },
              { l: 'Got in touch', n: ov.funnel.contacted, of: ov.funnel.visitors },
            ].map((s) => (
              <li key={s.l}>
                <div className="flex justify-between text-[13px]">
                  <span>{s.l}</span>
                  <span className="tabular-nums text-ink-soft">{fmt(s.n)} · {pct(s.n, s.of)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-sage-soft">
                  <div className="h-2 rounded-full bg-sage" style={{ width: s.of ? `${(s.n / s.of) * 100}%` : 0 }} />
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[12px] text-ink-soft">
            Got in touch = clicked email, phone or LinkedIn, or sent the form.
          </p>
        </Card>
      </div>

      {/* Messages first among the detail: they are the ones to act on. */}
      <Card title={`Messages${unread ? ` · ${unread} new` : ''}`} className="mt-4">
        {!messages.length ? (
          <p className="text-[13px] text-ink-soft">No messages yet. The contact form saves here.</p>
        ) : (
          <ul className="divide-y divide-line">
            {messages.map((m) => (
              <li key={m.id} className="py-4 first:pt-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[15px]">
                    {!m.read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brass align-middle" aria-label="New" />}
                    <span className="font-medium">{m.name}</span>{' '}
                    <span className="text-ink-soft">&lt;{m.email}&gt;</span>
                    {m.company && <span className="text-ink-soft"> · {m.company}</span>}
                  </p>
                  <p className="text-[12px] text-ink-soft">
                    {ago(m.ts)}{m.city || m.country ? ` · ${[m.city, country(m.country)].filter(Boolean).join(', ')}` : ''}
                  </p>
                </div>
                <p className="mt-1 text-[12px] text-ink-soft">
                  {ACTION[m.topic ?? ''] ?? m.topic}{m.track ? ` · came in through ${m.track}` : ''}
                  {m.availability ? ` · times that suit: ${m.availability}` : ''}
                </p>
                <p className="mt-2 max-w-3xl whitespace-pre-wrap text-[14px] text-ink">{m.message}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
                  <a className="btn-primary !min-h-0 !px-4 !py-1.5 !text-[13px]"
                     href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message on aniruddhadasgupta.com')}`}
                     onClick={() => void setRead(m.id, true)}>
                    Reply
                  </a>
                  <button type="button" className="rounded-full border border-line px-3 py-1.5 text-ink-soft hover:text-ink"
                          onClick={() => void setRead(m.id, !m.read)}>
                    Mark as {m.read ? 'unread' : 'read'}
                  </button>
                  <button type="button" className="rounded-full border border-line px-3 py-1.5 text-ink-soft hover:text-ink"
                          onClick={() => void remove(m.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Where visits came from"><BarList rows={ov.lists.sources} unit="visitors" /></Card>
        <Card title="Referring websites"><BarList rows={ov.lists.referrers} empty="No referring sites yet" /></Card>
        <Card title="Countries"><BarList rows={ov.lists.countries} labelOf={country} /></Card>
        <Card title="Cities">
          <BarList rows={ov.lists.cities} labelOf={(k) => { const [c, cc] = k.split(', '); return `${c}, ${country(cc)}`; }} />
        </Card>
        <Card title="Networks"
              aside={<span className="text-[11px] text-ink-soft">company on office networks, else the provider</span>}>
          <BarList rows={ov.lists.orgs} />
        </Card>
        <Card title="Pages viewed"><BarList rows={ov.lists.pages} unit="views" /></Card>
        <Card title="Devices"><BarList rows={ov.lists.devices} labelOf={cap} /></Card>
        <Card title="Browsers"><BarList rows={ov.lists.browsers} /></Card>
        <Card title="Operating systems"><BarList rows={ov.lists.systems} /></Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="On the desk" className="xl:col-span-1"
              aside={<span className="text-[11px] text-ink-soft">opened · on the desk itself</span>}>
          {!objects.length ? <p className="py-3 text-[13px] text-ink-soft">Nothing opened yet</p> : (
            <ul className="space-y-1">
              {objects.map(([id, e]) => {
                const max = objects[0][1].total;
                return (
                  <li key={id} className="relative flex min-h-[30px] items-center justify-between gap-3 px-2 text-[13px]">
                    <span aria-hidden="true" className="absolute inset-y-0.5 left-0 rounded-[4px] bg-sage-soft" style={{ width: `${(e.total / max) * 100}%` }} />
                    <span className="relative truncate">{OBJECT[id] ?? id}</span>
                    <span className="relative tabular-nums text-ink-soft">{fmt(e.total)} · {fmt(e.desk)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card title="Contact actions"><BarList rows={ov.lists.contacts} labelOf={(k) => ACTION[k] ?? k} /></Card>
        <Card title="Downloads"><BarList rows={ov.lists.downloads} labelOf={(k) => ACTION[k] ?? k} /></Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Shared from the site"><BarList rows={ov.lists.shares} labelOf={(k) => SHARE[k] ?? cap(k)} empty="No shares yet" /></Card>
        <Card title="Visits from shared links"><BarList rows={ov.lists.sharedArrivals} empty="None yet" unit="visitors" /></Card>
        <Card title="Link previews"
              aside={<span className="text-[11px] text-ink-soft">your link pasted into an app</span>}>
          <BarList rows={previews} empty="None yet" />
          {!!crawls.length && (
            <p className="mt-3 text-[12px] text-ink-soft">
              Search engines fetched pages {plural(crawls.reduce((a, r) => a + r.n, 0), 'time')}
              ({crawls.map((c) => `${c.k.replace(' (crawl)', '')} ${c.n}`).join(', ')}).
            </p>
          )}
        </Card>
      </div>

      <SeoCard seo={seo} onRefresh={() => void refreshSeo()} />

      <Card title="Recent visits" className="mt-4"
            aside={<span className="text-[11px] text-ink-soft">newest first · {Math.min(shown, visits.length)} of {visits.length}</span>}>
        {!visits.length ? <p className="text-[13px] text-ink-soft">No visits in this range yet.</p> : (
          <ul className="divide-y divide-line">
            {visits.slice(0, shown).map((v) => (
              <li key={`${v.start}-${v.place}`} className="py-3">
                <details>
                  <summary className="flex cursor-pointer list-none flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[14px]">
                      <span className="font-medium">{v.place ? v.place.split(', ').map((p, i, a) => (i === a.length - 1 ? country(p) : p)).join(', ') : 'Unknown place'}</span>
                      <span className="text-ink-soft"> · {cap(v.device ?? '')} · {v.browser} on {v.os} · from {v.source}</span>
                    </span>
                    <span className="text-[12px] tabular-nums text-ink-soft">
                      {ago(v.start)} · {duration(v.engagedMs)} · {plural(v.steps.length, 'step')}
                    </span>
                  </summary>
                  <div className="mt-2 text-[13px] text-ink-soft">
                    {v.org && <p>Network: {v.org}</p>}
                    {v.ref && <p>Referred by: {v.ref}{v.campaign ? ` · campaign ${v.campaign}` : ''}</p>}
                    {v.lang && <p>Language: {v.lang}</p>}
                    <ol className="mt-2 flex flex-wrap gap-1.5">
                      {v.steps.map((s, i) => (
                        <li key={i} className="rounded-full border border-line px-2.5 py-0.5 text-[12px] text-ink">
                          {s.type === 'pageview' ? `Viewed ${s.path}` :
                            s.type === 'open' ? `Opened ${OBJECT[(s.name ?? '').split('|')[0]] ?? s.name}` :
                            s.type === 'message' ? 'Sent the contact form' :
                            s.type === 'lamp' ? `Turned the lamp ${s.name}` :
                            s.type === 'share' ? `Shared: ${SHARE[s.name ?? ''] ?? s.name}` :
                            `${cap(s.type)}: ${ACTION[s.name ?? ''] ?? s.name}`}
                        </li>
                      ))}
                    </ol>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
        {visits.length > shown && (
          <button type="button" className="btn-secondary mt-3" onClick={() => setShown((n) => n + 15)}>
            Show more visits
          </button>
        )}
      </Card>

      <p className="mt-6 text-[12px] text-ink-soft">
        Visitors are counted per day: the anonymous id changes daily, so the same person on two days counts twice.
        Visitors with Global Privacy Control or Do Not Track switched on are not counted. Locations and networks are
        approximate. See the site’s <Link href="/privacy/" className="underline">privacy page</Link>.
      </p>
    </div>
  );
}

function SeoCard({ seo, onRefresh }: { seo: Seo | null; onRefresh: () => void }) {
  if (!seo) {
    return <Card title="Google Search" className="mt-4"><p className="text-[13px] text-ink-soft">Loading Search Console…</p></Card>;
  }
  if (!seo.configured) {
    return (
      <Card title="Google Search" className="mt-4">
        <p className="max-w-2xl text-[14px] text-ink-soft">
          Not connected yet. Once a Search Console service account is added, this shows the searches the site
          appears in, clicks, average position and top pages for the last 28 days.
        </p>
      </Card>
    );
  }
  if ('error' in seo) {
    return (
      <Card title="Google Search" className="mt-4" aside={<button type="button" className="text-[13px] text-sage underline" onClick={onRefresh}>Retry</button>}>
        <p className="text-[14px] text-ink-soft">{seo.error}</p>
      </Card>
    );
  }
  const t = seo.totals;
  return (
    <Card title="Google Search" className="mt-4"
          aside={<span className="text-[11px] text-ink-soft">{seo.range.start} to {seo.range.end} · Google reports 2–3 days behind ·{' '}
            <button type="button" className="underline" onClick={onRefresh}>refresh</button></span>}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Clicks from Google" value={fmt(t.clicks)} />
        <Stat label="Times shown in results" value={fmt(t.impressions)} />
        <Stat label="Click-through rate" value={`${(t.ctr * 100).toFixed(1)}%`} />
        <Stat label="Average position" value={t.position ? t.position.toFixed(1) : '—'} />
      </div>
      <div className="mt-5">
        <h3 className="mb-8 text-[13px] text-ink-soft">Times shown in results per day</h3>
        <DailyColumns rows={seo.daily.map((r) => ({ d: r.date, v: r.impressions, v2: r.clicks }))}
                      label="Impressions" secondaryLabel="Clicks" />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {[{ h: 'Searches you appear in', rows: seo.queries }, { h: 'Top pages in search', rows: seo.pages }].map((s) => (
          <div key={s.h}>
            <h3 className="mb-2 text-[13px] font-medium">{s.h}</h3>
            {!s.rows.length ? <p className="text-[13px] text-ink-soft">No data yet — new sites take a few weeks to appear.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="text-left text-ink-soft">
                    <tr>
                      <th className="py-1.5 pr-2 font-medium">{s.h.startsWith('Top') ? 'Page' : 'Search'}</th>
                      <th className="py-1.5 text-right font-medium">Clicks</th>
                      <th className="py-1.5 text-right font-medium">Shown</th>
                      <th className="py-1.5 text-right font-medium">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.rows.map((r) => (
                      <tr key={r.keys?.[0]} className="border-t border-line">
                        <td className="max-w-[16rem] truncate py-1.5 pr-2">{(r.keys?.[0] ?? '').replace(/^https?:\/\/[^/]+/, '') || '/'}</td>
                        <td className="py-1.5 text-right tabular-nums">{fmt(r.clicks)}</td>
                        <td className="py-1.5 text-right tabular-nums">{fmt(r.impressions)}</td>
                        <td className="py-1.5 text-right tabular-nums">{r.position.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
