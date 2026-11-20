'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ABOUT, PROCESS, PROFILE, SERVICES } from '@/data/site';
import { Icon } from './Icon';

/* The frame on the desk is a few centimetres across, so the panel it opens
   leads with the face, large. Three supplied photographs, all cropped to the
   same 4:5 head-and-shoulders frame; the thumbnails swap the large one. */
const PHOTOS = [
  { id: 'office', alt: 'Aniruddha Dasgupta smiling, in a navy blazer and white shirt, in a bright office' },
  { id: 'studio', alt: 'Aniruddha Dasgupta smiling, in a navy suit and tie, against a white wall' },
  { id: 'suit',   alt: 'Aniruddha Dasgupta in a dark suit and striped tie, standing in a meeting room' },
] as const;

function Portrait() {
  const [shown, setShown] = useState(0);
  const photo = PHOTOS[shown];
  return (
    <figure className="mx-auto w-full max-w-[300px] md:max-w-none">
      <div className="overflow-hidden rounded-2xl border border-line bg-ivory shadow-[0_6px_28px_rgba(40,36,28,0.12)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.id}
          src={`/about/${photo.id}.webp`}
          alt={photo.alt}
          width={640} height={800}
          decoding="async"
          className="block aspect-[4/5] h-auto w-full object-cover motion-safe:animate-[fade-in_.35s_ease-out]"
        />
      </div>
      <figcaption className="mt-3 flex items-center justify-between gap-3">
        <span>
          <span className="block font-serif text-[17px] leading-tight">{PROFILE.name}</span>
          <span className="block text-[13px] text-ink-soft">{PROFILE.location}</span>
        </span>
        <span role="group" aria-label="Choose a photo" className="flex gap-1.5">
          {PHOTOS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={i === shown}
              aria-label={`Photo ${i + 1} of ${PHOTOS.length}`}
              onClick={() => setShown(i)}
              className={`h-11 w-9 overflow-hidden rounded-md border-2 transition-[border-color,opacity]
                          ${i === shown ? 'border-sage' : 'border-transparent opacity-70 hover:opacity-100'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/about/${p.id}-thumb.webp`} alt="" width={128} height={160}
                   loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </button>
          ))}
        </span>
      </figcaption>
    </figure>
  );
}

/* What the framed photograph opens: who I am, how I work, and the way in
   to the full pages. Everything stated here is on the supplied CV. */
export function AboutPanel() {
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(220px,280px)_1fr] md:gap-8">
      <div className="space-y-4">
        <Portrait />
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
          <div className="mt-3 flex flex-wrap gap-3 border-t border-line pt-3 text-[14px] font-medium">
            <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="text-sage">
              LinkedIn<span className="sr-only"> (opens in a new tab)</span>
            </a>
            {PROFILE.resumeUrl && (
              <a href={PROFILE.resumeUrl} download className="text-sage">Download CV</a>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-serif text-[19px] leading-snug">{ABOUT.heading}</h3>
        {ABOUT.paragraphs.slice(0, 2).map((p) => (
          <p key={p.slice(0, 24)} className="mt-3 max-w-prose text-[15px] text-ink-soft">{p}</p>
        ))}

        <h3 className="mt-6 font-serif text-[17px]">How I work</h3>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
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
    </div>
  );
}
