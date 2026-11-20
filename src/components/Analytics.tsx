'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { track, trackPageview, trackingAllowed } from '@/lib/analytics';

/* Mounted once in the layout. Counts page views, how long a page is
   actually looked at (time the tab is hidden does not count), and clicks
   on anything that says what it is: email, phone, LinkedIn, the CV, and
   any element carrying data-track="type:name". */
export function Analytics() {
  const path = usePathname();
  const first = useRef(true);
  const engaged = useRef(0);
  const visibleSince = useRef<number | null>(null);

  /* Engaged time, flushed whenever the tab goes out of view or the page
     changes, so a closed tab still reports how long it was read. */
  useEffect(() => {
    if (!trackingAllowed()) return;
    visibleSince.current = document.visibilityState === 'visible' ? performance.now() : null;
    const flush = () => {
      if (visibleSince.current !== null) {
        engaged.current += performance.now() - visibleSince.current;
        visibleSince.current = null;
      }
      if (engaged.current > 500) track('leave', undefined, { d: Math.round(engaged.current) });
      engaged.current = 0;
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') flush();
      else visibleSince.current = performance.now();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', flush);
    return () => {
      flush();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', flush);
    };
  }, [path]);

  useEffect(() => {
    if (!trackingAllowed()) return;
    trackPageview(first.current);
    first.current = false;
  }, [path]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target as Element | null;
      if (!el?.closest) return;
      const tagged = el.closest<HTMLElement>('[data-track]');
      if (tagged) {
        const [type, name] = (tagged.dataset.track ?? '').split(':');
        if (type) track(type as Parameters<typeof track>[0], name);
        return;
      }
      const a = el.closest<HTMLAnchorElement>('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') ?? '';
      if (href.startsWith('mailto:')) track('contact', 'email');
      else if (href.startsWith('tel:')) track('contact', 'phone');
      else if (/linkedin\.com\/in\//i.test(href)) track('contact', 'linkedin');
      else if (/\.pdf($|\?)/i.test(href)) track('download', 'cv');
      else if (/\.vcf($|\?)/i.test(href)) track('download', 'vcard');
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
}
