import Link from 'next/link';
import { HIRING, PROFILE, TRACKS, WORK } from '@/data/site';
import { bookingHref } from '@/lib/booking';
import { Icon } from './Icon';

/* Everything the desk says, said again in plain HTML below it.

   The scene is the best version of this page for someone willing to look
   around. It is the worst version for the two people most likely to
   arrive: a founder skimming on a phone between meetings, and a recruiter
   with forty tabs open. Both scroll before they explore, and before this
   section existed scrolling got them the footer.

   Nothing here is new material — it is the same tracks, the same roles
   and the same CV, in the order someone deciding whether to make contact
   reads them. */

/* Four facts, each of which appears on the CV and on a role page here.
   They are facts about scope and tenure, not claims about results. */
const GLANCE = [
  { n: '15 years', of: 'inside operations that cannot stop' },
  { n: '9 of them', of: 'at Tata Consultancy Services' },
  { n: '~200', of: 'associates under operational leadership' },
  { n: 'End to end', of: 'a CRM implementation, owned from the business side' },
];

export function HomeBrief() {
  const featured = WORK.filter((w) => w.featured).slice(0, 3);

  return (
    <div className="border-t border-line">
      {/* At a glance ------------------------------------------------- */}
      {/* Clears the fixed header for anyone who lands exactly here — a
          jump link, or one flick of a scroll wheel. */}
      <section aria-labelledby="glance" className="shell pb-12 pt-20 sm:pb-16 sm:pt-24">
        <h2 id="glance" className="sr-only">At a glance</h2>
        <dl className="grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
          {GLANCE.map((g) => (
            <div key={g.n}>
              <dt className="font-serif text-[26px] leading-none text-sage sm:text-[30px]">{g.n}</dt>
              <dd className="mt-2 text-[15px] leading-relaxed text-ink-soft">{g.of}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-7 max-w-prose text-[14px] text-ink-soft">
          Scope and tenure, not results. No performance figures appear anywhere on
          this site, because none have been independently verified.
        </p>
      </section>

      {/* The three doors, in text ------------------------------------ */}
      <section aria-labelledby="doors" className="shell border-t border-line py-12 sm:py-16">
        <h2 id="doors" className="font-serif text-[26px] leading-tight sm:text-[32px]">
          Three reasons people get in touch
        </h2>
        <p className="mt-2 max-w-prose text-[15px] text-ink-soft">
          Two are pieces of work. The third is a job.
        </p>

        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          {TRACKS.map((t) => (
            <article key={t.id} className="card flex flex-col p-5 sm:p-6">
              <p className="eyebrow">{t.label}</p>
              <h3 className="mt-2 font-serif text-[19px] leading-snug">{t.promise}</h3>
              <p className="mt-2.5 flex-1 text-[15px] leading-relaxed text-ink-soft">{t.who}</p>
              <Link
                href={`/services/#${t.id}`}
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-[15px] font-medium text-sage"
              >
                How it runs <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </article>
          ))}

          <article className="card flex flex-col border-brass/40 p-5 sm:p-6">
            <p className="eyebrow">{HIRING.label}</p>
            <h3 className="mt-2 font-serif text-[19px] leading-snug">{HIRING.promise}</h3>
            <p className="mt-2.5 flex-1 text-[15px] leading-relaxed text-ink-soft">{HIRING.where}</p>
            <Link
              href="/about/#open-to-roles"
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-[15px] font-medium text-sage"
            >
              What I am looking for <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </article>
        </div>
      </section>

      {/* How it starts ----------------------------------------------- */}
      <section aria-labelledby="starts" className="shell border-t border-line py-12 sm:py-16">
        <h2 id="starts" className="font-serif text-[26px] leading-tight sm:text-[32px]">
          How it starts
        </h2>
        <ol className="mt-7 grid gap-4 sm:grid-cols-3">
          {[
            {
              t: 'A call, thirty minutes',
              d: 'You describe what is going wrong. I ask the questions I would ask on day one. '
                + 'No charge and no deck — if it is not a fit, you will know inside the half hour.',
            },
            {
              t: 'A scope in writing',
              d: 'What I would do, in what order, over how long, and what you would have at the '
                + 'end. Nothing is agreed until that document exists and you are happy with it.',
            },
            {
              t: 'The work, in the open',
              d: 'The same reporting discipline I would put under your process goes over the '
                + 'engagement itself, so you always know where it stands.',
            },
          ].map((s, i) => (
            <li key={s.t} className="rounded-xl border border-line bg-surface p-5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border
                               border-brass text-[13px] font-medium text-brass">
                {i + 1}
              </span>
              <h3 className="mt-3 text-[16px] font-medium">{s.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Selected work ----------------------------------------------- */}
      <section aria-labelledby="recent" className="shell border-t border-line py-12 sm:py-16">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="recent" className="font-serif text-[26px] leading-tight sm:text-[32px]">
            Where the experience comes from
          </h2>
          <Link href="/work/" className="inline-flex min-h-[44px] items-center gap-2 text-[15px] font-medium text-sage">
            Every role, back to 2007 <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {featured.map((w) => (
            <li key={w.slug}>
              <Link href={`/work/${w.slug}/`}
                    className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-4 transition-colors hover:text-sage">
                <span className="text-[17px]">{w.name}</span>
                <span className="text-[14px] text-ink-soft">{w.type}</span>
                <span className="ml-auto whitespace-nowrap text-[14px] text-ink-soft">{w.dates}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-prose text-[14px] text-ink-soft">
          Roles held as an employee, officer or founder of the business named. Not
          client engagements, and no endorsement by those companies is implied.
        </p>
      </section>

      {/* The ask ----------------------------------------------------- */}
      <section aria-labelledby="ask" className="shell border-t border-line py-12 sm:py-16">
        <div className="rounded-2xl border border-sage/40 bg-sage-soft/50 p-6 sm:p-8">
          <h2 id="ask" className="font-serif text-[24px] leading-tight sm:text-[28px]">
            Tell me what is slowing the team down.
          </h2>
          <p className="mt-2 max-w-prose text-[15px] text-ink-soft">
            One call, thirty minutes, and a straight answer about whether this is
            something I can help with.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href={bookingHref()} className="btn-primary">
              Book a call <Icon name="arrow" className="h-4 w-4" />
            </Link>
            <a href={`mailto:${PROFILE.email}`}
               className="inline-flex min-h-[44px] items-center text-[15px] font-medium text-sage">
              {PROFILE.email}
            </a>
            {PROFILE.resumeUrl && (
              <a href={PROFILE.resumeUrl} download
                 className="inline-flex min-h-[44px] items-center text-[15px] font-medium text-sage">
                Download the CV
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
