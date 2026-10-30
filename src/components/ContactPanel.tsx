'use client';

import Link from 'next/link';
import { PROFILE } from '@/data/site';
import { Icon } from './Icon';

/* What the phone opens: the three ways to reach him, as real links, and the
   way through to the full form. Nothing here is a service — the site has no
   backend — so every route ends in the visitor's own app. */
export function ContactPanel() {
  const ROUTES = [
    {
      label: 'Call',
      value: PROFILE.phone,
      href: `tel:${PROFILE.phoneHref}`,
      icon: 'phone',
      note: 'Opens your dialler. Mumbai time, so do check the hour.',
      external: false,
    },
    {
      label: 'Email',
      value: PROFILE.email,
      href: `mailto:${PROFILE.email}`,
      icon: 'mail',
      note: 'Opens your own email app with a blank message.',
      external: false,
    },
    {
      label: 'LinkedIn',
      value: '/in/aniruddhagkdasgupta',
      href: PROFILE.linkedin,
      icon: 'people',
      note: 'Profile, background and recent activity.',
      external: true,
    },
  ];

  return (
    <div>
      <p className="max-w-prose text-[15px] text-ink-soft">
        {PROFILE.location}. Working with teams across time zones.
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {ROUTES.map((r) => (
          <li key={r.label}>
            <a
              href={r.href}
              {...(r.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="flex h-full min-h-[44px] flex-col rounded-xl border border-line bg-ivory/60 p-4
                         transition-colors hover:border-sage"
            >
              <span className="flex items-center gap-2 text-[11px] font-medium uppercase
                               tracking-[0.14em] text-sage">
                <Icon name={r.icon} className="h-4 w-4" />
                {r.label}
                {r.external && <span className="sr-only"> (opens in a new tab)</span>}
              </span>
              <span className="mt-2 break-words font-serif text-[17px] leading-snug">{r.value}</span>
              <span className="mt-2 text-[13px] text-ink-soft">{r.note}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Link href="/contact/" className="btn-primary">
          Use the full form
          <Icon name="arrow" className="h-4 w-4" />
        </Link>
        {/* The card in the holder on the desk, as a file a phone can save.
            Generated at build time from this same PROFILE, so the printed
            card and the saved one can never disagree. */}
        <a
          href="/aniruddha-dasgupta.vcf"
          download
          className="inline-flex min-h-[44px] items-center gap-2 text-[15px] font-medium text-sage"
        >
          <Icon name="people" className="h-4 w-4" />
          Save my card
          <span className="text-ink-soft">(.vcf)</span>
        </a>
        {PROFILE.resumeUrl && (
          <a href={PROFILE.resumeUrl} download
             className="inline-flex min-h-[44px] items-center text-[15px] font-medium text-sage">
            Download the CV
          </a>
        )}
      </div>
    </div>
  );
}
