'use client';

import Link from 'next/link';
import { PROFILE, TRACKS, WORK, type Track } from '@/data/site';
import { bookingHref, hasCalendar } from '@/lib/booking';
import { Icon } from './Icon';

/* One of the two doors into the work. The shape is deliberate: who it is
   for, how an engagement actually runs, what comes out of it, and where
   the experience behind it comes from — then the one thing to do next.

   Nothing here claims a result. The three steps are how the work is run,
   not what it will achieve, and the row at the bottom is a role held
   inside the business named, labelled as such. */
export function TrackPanel({ id, onSwitch }: { id: Track['id']; onSwitch?: (to: Track['id']) => void }) {
  const track = TRACKS.find((t) => t.id === id)!;
  const other = TRACKS.find((t) => t.id !== id)!;
  const role = WORK.find((w) => w.slug === track.from);

  return (
    <div>
      <p className="max-w-prose font-serif text-[19px] leading-snug sm:text-[21px]">
        {track.promise}
      </p>
      <p className="mt-2 max-w-prose text-[15px] text-ink-soft">{track.who}</p>

      {/* How it runs. Numbered, because the order is the point. */}
      <ol className="mt-5 grid gap-3 sm:grid-cols-3">
        {track.shape.map((s, i) => (
          <li key={s.step} className="rounded-xl border border-line bg-ivory/60 p-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border
                             border-brass text-[12px] font-medium text-brass">
              {i + 1}
            </span>
            <h3 className="mt-2.5 text-[15px] font-medium">{s.step}</h3>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{s.detail}</p>
          </li>
        ))}
      </ol>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-sage">
            What comes out of it
          </h3>
          <ul className="mt-3 space-y-2 text-[15px] text-ink-soft">
            {track.gets.map((g) => (
              <li key={g} className="flex gap-2">
                <span aria-hidden="true" className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brass" />
                {g}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-sage">
            Where the experience comes from
          </h3>
          <p className="mt-3 max-w-prose text-[15px] text-ink-soft">{track.fromNote}</p>
          <p className="mt-2 text-[13px] text-ink-soft">
            A role held inside the business named — not a client engagement, and no
            endorsement implied.
          </p>
          {role && (
            <Link
              href={`/work/${role.slug}/`}
              className="mt-2 inline-flex min-h-[44px] items-center gap-2 text-[15px] font-medium text-sage"
            >
              {role.name} in detail <Icon name="arrow" className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* The one thing to do next. */}
      <div className="mt-6 rounded-xl border border-sage/40 bg-sage-soft/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <Link href={bookingHref(track)} className="btn-primary">
            {track.cta}
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
          <a
            href={`mailto:${PROFILE.email}?subject=${encodeURIComponent(track.label)}`}
            className="inline-flex min-h-[44px] items-center text-[15px] font-medium text-sage"
          >
            Or just email me
          </a>
        </div>
        <p className="mt-3 text-[13px] text-ink-soft">
          {hasCalendar
            ? 'Pick a time that suits you — 30 minutes, no preparation needed.'
            : 'This opens the contact form with the subject already chosen. Put a '
              + 'couple of times that suit you in it and a slot gets agreed in one '
              + 'reply — there is no scheduling page yet, so nothing is held until then.'}
        </p>
      </div>

      <p className="mt-4 text-[14px] text-ink-soft">
        Came to the wrong door?{' '}
        {onSwitch ? (
          <button
            type="button"
            onClick={() => onSwitch(other.id)}
            className="min-h-[44px] font-medium text-sage underline underline-offset-2"
          >
            {other.label}
          </button>
        ) : (
          <Link href="/services/#tracks" className="font-medium text-sage underline underline-offset-2">
            {other.label}
          </Link>
        )}
      </p>
    </div>
  );
}
