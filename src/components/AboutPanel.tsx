'use client';

import Link from 'next/link';
import { ABOUT, PROFILE } from '@/data/site';
import { Icon } from './Icon';

/* What opens from the framed photograph on the desk. The full version
   lives at /about. Everything stated here is on the supplied CV. */
export function AboutPanel() {
  return (
    <div className="grid gap-5 md:grid-cols-[1fr_280px]">
      <div>
        <h4 className="font-serif text-[19px] leading-snug">{ABOUT.heading}</h4>
        {ABOUT.paragraphs.slice(0, 2).map((p) => (
          <p key={p.slice(0, 24)} className="mt-3 max-w-prose text-[15px] text-ink-soft">{p}</p>
        ))}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1">
          <Link
            href="/about/"
            className="inline-flex min-h-[44px] items-center gap-2 text-[15px] font-medium text-sage"
          >
            Read the full background <Icon name="arrow" className="h-4 w-4" />
          </Link>
          {/* The notebook on the desk opens this too; the link keeps it
              reachable when the scene is not rendered. */}
          <Link
            href="/services/"
            className="inline-flex min-h-[44px] items-center gap-2 text-[15px] font-medium text-sage"
          >
            How I work <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-ivory/60 p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-sage">Background</p>
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
  );
}
