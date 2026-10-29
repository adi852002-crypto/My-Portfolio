'use client';

import Link from 'next/link';
import { ABOUT, PROCESS, PROFILE, SERVICES } from '@/data/site';
import { Icon } from './Icon';

/* What the framed photograph opens: who I am, how I work, and the way in
   to the full pages. Everything stated here is on the supplied CV. */
export function AboutPanel() {
  return (
    <div>
      <div className="grid gap-5 md:grid-cols-[1fr_260px]">
        <div>
          <h3 className="font-serif text-[19px] leading-snug">{ABOUT.heading}</h3>
          {ABOUT.paragraphs.slice(0, 2).map((p) => (
            <p key={p.slice(0, 24)} className="mt-3 max-w-prose text-[15px] text-ink-soft">{p}</p>
          ))}

          <h3 className="mt-6 font-serif text-[17px]">How I work</h3>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((p) => (
              <li key={p.n} className="rounded-xl border border-line bg-ivory/60 p-3">
                <span className="text-[11px] font-medium tracking-[0.14em] text-brass">{p.n}</span>
                <span className="mt-0.5 block font-serif text-[15px]">{p.title}</span>
                <span className="mt-1 block text-[13px] text-ink-soft">{p.copy}</span>
              </li>
            ))}
          </ol>

          <p className="mt-4 text-[15px] text-ink-soft">
            That runs across{' '}
            {SERVICES.map((s, i) => (
              <span key={s.id}>
                {i > 0 && (i === SERVICES.length - 1 ? ' and ' : ', ')}
                <Link href={`/services/#${s.id}`} className="text-sage underline underline-offset-2">
                  {s.title.toLowerCase()}
                </Link>
              </span>
            ))}
            .
          </p>

          <div className="mt-4 flex flex-wrap gap-4">
            <Link href="/about/" className="inline-flex min-h-[44px] items-center gap-2 text-[15px] font-medium text-sage">
              Full background <Icon name="arrow" className="h-4 w-4" />
            </Link>
            <Link href="/services/" className="inline-flex min-h-[44px] items-center gap-2 text-[15px] font-medium text-sage">
              Services in full <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-ivory/60 p-4">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-sage">Background</h3>
          <ul className="mt-2 space-y-1.5 text-[14px] text-ink-soft">
            {ABOUT.credentials.map((c) => (
              <li key={c} className="flex gap-2">
                <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brass" />
                {c}
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-line pt-3 text-[14px]">
            <div className="flex gap-2">
              <dt className="text-ink-soft">Based in</dt>
              <dd>{PROFILE.location}</dd>
            </div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-3 text-[14px] font-medium">
            <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="text-sage">
              LinkedIn<span className="sr-only"> (opens in a new tab)</span>
            </a>
            {PROFILE.resumeUrl && (
              <a href={PROFILE.resumeUrl} download className="text-sage">Download CV</a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
