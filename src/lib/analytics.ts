/* ------------------------------------------------------------------
   First-party, cookieless visit counting. Events go to /api/collect on
   this same domain; nothing is sent to any other company.

   - No cookies, no local identifiers: the server derives an anonymous id
     that changes every day and cannot be traced back to an address.
   - Browsers sending Global Privacy Control or Do Not Track are not counted.
   - The site owner's own browser opts out by visiting /admin.
   ------------------------------------------------------------------ */

export type EventType = 'pageview' | 'leave' | 'open' | 'cta' | 'contact' | 'share' | 'download' | 'lamp';

const OPT_OUT = 'analytics-opt-out';

/* One id per page load in this tab, held in memory only. */
const sid = Math.random().toString(36).slice(2, 12);

export function trackingAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.globalPrivacyControl || nav.doNotTrack === '1') return false;
  try { if (localStorage.getItem(OPT_OUT) === '1') return false; } catch { /* storage blocked */ }
  return !/^\/admin/.test(window.location.pathname);
}

export function optOut(on = true) {
  try { on ? localStorage.setItem(OPT_OUT, '1') : localStorage.removeItem(OPT_OUT); } catch { /* fine */ }
}

export function isOptedOut(): boolean {
  try { return localStorage.getItem(OPT_OUT) === '1'; } catch { return false; }
}

export function sessionId() { return sid; }

export function track(type: EventType, name?: string, extra: Record<string, unknown> = {}) {
  if (!trackingAllowed()) return;
  const body = JSON.stringify({
    t: type, n: name, p: window.location.pathname, s: sid,
    l: navigator.language, w: window.innerWidth,
    ...extra,
  });
  try {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon?.('/api/collect', blob)) return;
  } catch { /* fall through to fetch */ }
  fetch('/api/collect', {
    method: 'POST', body, keepalive: true,
    headers: { 'content-type': 'application/json' },
  }).catch(() => undefined);
}

/* The page view that starts a visit carries where it came from. */
export function trackPageview(first: boolean) {
  const q = new URLSearchParams(window.location.search);
  const ref = first ? document.referrer : '';
  let external = false;
  try { external = !!ref && new URL(ref).host !== window.location.host; } catch { /* no referrer */ }
  const utm = q.get('utm_source');
  track('pageview', undefined, first && (external || utm || !ref)
    ? { land: 1, r: external ? ref : '', us: utm ?? '', um: q.get('utm_medium') ?? '', uc: q.get('utm_campaign') ?? '' }
    : {});
}
