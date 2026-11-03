'use client';

import Link from 'next/link';
import { HIRING, PROFILE } from '@/data/site';
import { Icon } from './Icon';

/* The third door. A recruiter arrives with different questions from a
   client — what kind of role, where, and is the CV one click away — so
   this answers those and gets out of the way.

   Every line is either a stated preference or a role on the CV. Nothing
   here states a salary, a notice period or anyone he has applied to. */
export function HiringPanel() {
  return (
    <div>
      <p className="max-w-prose font-serif text-[19px] leading-snug sm:text-[21px]">
        {HIRING.promise}
      </p>
      <p className="mt-2 max-w-prose text-[15px] text-ink-soft">{HIRING.where}</p>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-sage">
            What I am looking for
          </h3>
          <ul className="mt-3 space-y-2 text-[15px] text-ink-soft">
            {HIRING.looking.map((l) => (
              <li key={l} className="flex gap-2">
                <span aria-hidden="true" className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brass" />
                {l}
              </li>
            ))}
          </ul>

          <h3 className="mt-5 text-[11px] font-medium uppercase tracking-[0.14em] text-sage">
            Tools and credentials
          </h3>
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {HIRING.tools.map((t) => (
              <li key={t} className="rounded-full border border-line px-2.5 py-1 text-[13px] text-ink-soft">
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-sage">
            What I bring, and where it came from
          </h3>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {HIRING.brings.map((b) => (
              <li key={b.fact} className="py-2">
                <p className="text-[15px]">{b.fact}</p>
                <p className="text-[13px] text-ink-soft">{b.from}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-sage/40 bg-sage-soft/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          {PROFILE.resumeUrl && (
            <a href={PROFILE.resumeUrl} download className="btn-primary">
              Download the CV
              <Icon name="arrow" className="h-4 w-4" />
            </a>
          )}
          <a
            href={`mailto:${PROFILE.email}?subject=${encodeURIComponent('Role — ')}`}
            className="inline-flex min-h-[44px] items-center text-[15px] font-medium text-sage"
          >
            Email me about a role
          </a>
          <a
            href={PROFILE.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center text-[15px] font-medium text-sage"
          >
            LinkedIn<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
        <p className="mt-3 text-[13px] text-ink-soft">{HIRING.note}</p>
      </div>

      <p className="mt-4 text-[14px] text-ink-soft">
        Hiring for a piece of work rather than a person?{' '}
        <Link href="/services/#tracks" className="font-medium text-sage underline underline-offset-2">
          The two consulting tracks
        </Link>
        .
      </p>
    </div>
  );
}
