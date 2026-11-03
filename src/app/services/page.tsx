import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ProcessDemo } from '@/components/ProcessDemo';
import { AiDemo } from '@/components/AiDemo';
import { Icon } from '@/components/Icon';
import { PROCESS, SERVICES, TRACKS } from '@/data/site';
import { bookingHref } from '@/lib/booking';

export const metadata: Metadata = {
  title: 'Services & how I work',
  description:
    'Two ways to work together: streamlining and AI readiness for startups, and '
    + 'taking ownership of a process for enterprise teams. What each involves, and '
    + 'what an engagement typically produces.',
  alternates: { canonical: '/services/' },
};

export default function ServicesPage() {
  return (
    <>
      <SiteHeader />

      <main id="main" className="pt-20 sm:pt-24">
        <section className="shell">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 text-[15px] text-sage"
          >
            <span aria-hidden="true">←</span> Back to the desk
          </Link>
          <p className="eyebrow">Services</p>
          <h1 className="mt-3 max-w-3xl text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.08]">
            Two ways to work together, and three kinds of work inside them.
          </h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink-soft">
            These are offers, not promised outcomes. Each list says what an
            engagement typically produces, not what it will achieve for you —
            that depends on your team.
          </p>
        </section>

        {/* The two doors, in full, for anyone who arrived here rather than
            at the desk. Same content as the boards in the sorter. */}
        <section id="tracks" className="shell mt-12 scroll-mt-24">
          <h2 className="sr-only">Who I work with</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {TRACKS.map((t, i) => (
              <article
                key={t.id}
                id={t.id}
                className={`card scroll-mt-24 p-6 ${i === 0 ? 'border-sage/45' : ''}`}
              >
                <p className="eyebrow">{t.label}</p>
                <h3 className="mt-2 font-serif text-[22px] leading-snug">{t.promise}</h3>
                <p className="mt-3 text-[15px] text-ink-soft">{t.who}</p>

                <ol className="mt-4 space-y-3">
                  {t.shape.map((step, n) => (
                    <li key={step.step} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center
                                       rounded-full border border-brass text-[12px] text-brass">
                        {n + 1}
                      </span>
                      <span>
                        <span className="block text-[15px] font-medium">{step.step}</span>
                        <span className="mt-1 block text-[14px] leading-relaxed text-ink-soft">
                          {step.detail}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>

                <h4 className="mt-5 text-[11px] font-medium uppercase tracking-[0.14em] text-sage">
                  What comes out of it
                </h4>
                <ul className="mt-2 space-y-1.5 text-[15px] text-ink-soft">
                  {t.gets.map((g) => (
                    <li key={g} className="flex gap-2">
                      <span aria-hidden="true" className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brass" />
                      {g}
                    </li>
                  ))}
                </ul>

                <p className="mt-4 text-[14px] leading-relaxed text-ink-soft">
                  {t.fromNote}{' '}
                  <span className="text-ink-soft">
                    A role held inside the business named — not a client engagement.
                  </span>
                </p>

                <div className="mt-5">
                  <Link href={bookingHref(t)} className="btn-primary">
                    {t.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="shell mt-12 grid gap-4 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <article key={s.id} id={s.id} className="card scroll-mt-24 p-6">
              <h2 className="font-serif text-[21px] leading-snug">{s.title}</h2>
              <p className="mt-3 text-[15px] text-ink-soft">{s.who}</p>
              <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-sage">
                Typically produces
              </p>
              <ul className="mt-2 space-y-1.5 text-[15px] text-ink-soft">
                {s.deliverables.map((d) => (
                  <li key={d} className="flex gap-2">
                    <span aria-hidden="true" className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brass" />
                    {d}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="shell mt-16">
          <h2 className="font-serif text-[clamp(1.5rem,2.6vw,2rem)]">How an engagement runs</h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((p) => (
              <li key={p.n} className="card p-5">
                <span className="text-[12px] font-medium tracking-[0.16em] text-brass">{p.n}</span>
                <h3 className="mt-1.5 font-serif text-[18px]">{p.title}</h3>
                <p className="mt-1.5 text-[14px] text-ink-soft">{p.copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="process" className="shell mt-16 scroll-mt-24">
          <h2 className="font-serif text-[clamp(1.5rem,2.6vw,2rem)]">Process & CRM</h2>
          <p className="mt-3 max-w-2xl text-[16px] text-ink-soft">
            The same example the workflow board opens in the studio. Pick a
            problem and watch the flow resolve into something with an owner.
          </p>
          <div className="mt-6">
            <ProcessDemo />
          </div>
        </section>

        <section id="ai" className="shell mt-16 scroll-mt-24">
          <h2 className="font-serif text-[clamp(1.5rem,2.6vw,2rem)]">AI in action</h2>
          <p className="mt-3 max-w-2xl text-[16px] text-ink-soft">
            The same demonstration the monitor opens in the studio. It runs in
            your browser on sample data and calls no AI service.
          </p>
          <div className="mt-6">
            <AiDemo />
          </div>
        </section>

        <section className="shell mt-16">
          <Link href="/contact/" className="btn-primary">
            Talk about a piece of work
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
