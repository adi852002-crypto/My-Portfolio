'use client';

import Link from 'next/link';
import { STATUS_LABEL, WORK } from '@/data/site';
import { Icon } from './Icon';

/* The work list as it appears inside the studio panel. The full section
   further down the page carries the same content, so nothing here is
   reachable only through the 3D scene. */
export function WorkPanel() {
  return (
    <div>
      <p className="mb-4 max-w-prose text-[15px] text-ink-soft">
        Roles held inside the businesses named. Not client engagements, and no
        endorsement is implied.
      </p>
      <ul className="grid gap-3 sm:grid-cols-3">
        {WORK.map((w) => (
          <li key={w.slug} className="rounded-xl border border-line bg-ivory/60 p-4">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-sage">
              {STATUS_LABEL[w.status]}
            </span>
            <h4 className="mt-2 font-serif text-[17px] leading-snug">{w.name}</h4>
            <p className="mt-1 text-[13px] text-ink-soft">{w.dates}</p>
            <Link
              href={`/work/${w.slug}/`}
              className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-[14px] font-medium text-sage"
            >
              Read more <Icon name="arrow" className="h-4 w-4" />
              <span className="sr-only"> about {w.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
