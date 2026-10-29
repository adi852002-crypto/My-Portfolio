'use client';

import Link from 'next/link';
import { STATUS_LABEL, WORK } from '@/data/site';
import { Icon } from './Icon';

/* The work list as it appears inside the panel: the three most recent in
   full, then the earlier roles as a compact line each, so fifteen years
   fits without turning the panel into a CV. /work carries all of it. */
export function WorkPanel() {
  const featured = WORK.filter((w) => w.featured);
  const earlier = WORK.filter((w) => !w.featured);

  return (
    <div>
      <p className="mb-4 max-w-prose text-[15px] text-ink-soft">
        Roles held inside the businesses named. Not client engagements, and no
        endorsement is implied.
      </p>

      <ul className="grid gap-3 sm:grid-cols-3">
        {featured.map((w) => (
          <li key={w.slug} className="rounded-xl border border-line bg-ivory/60 p-4">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-sage">
              {STATUS_LABEL[w.status]}
            </span>
            <h3 className="mt-2 font-serif text-[17px] leading-snug">{w.name}</h3>
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

      <h3 className="mt-6 text-[11px] font-medium uppercase tracking-[0.14em] text-sage">
        Earlier
      </h3>
      <ul className="mt-2 divide-y divide-line border-y border-line">
        {earlier.map((w) => (
          <li key={w.slug}>
            <Link
              href={`/work/${w.slug}/`}
              className="flex min-h-[44px] flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2
                         text-[14px] transition-colors hover:text-ink"
            >
              <span className="font-medium">{w.name}</span>
              <span className="text-ink-soft">{w.role.replace(/\.$/, '')}</span>
              <span className="ml-auto whitespace-nowrap text-[13px] text-ink-soft">{w.dates}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/work/"
        className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-[15px] font-medium text-sage"
      >
        All roles in full <Icon name="arrow" className="h-4 w-4" />
      </Link>
    </div>
  );
}
