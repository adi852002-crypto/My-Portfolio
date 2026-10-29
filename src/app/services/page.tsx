import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ProcessDemo } from '@/components/ProcessDemo';
import { AiDemo } from '@/components/AiDemo';
import { Icon } from '@/components/Icon';
import { PROCESS, SERVICES } from '@/data/site';

export const metadata: Metadata = {
  title: 'Services & how I work',
  description:
    'Operations and process improvement, customer success and service delivery, CRM and practical AI — what each involves and what an engagement typically produces.',
  alternates: { canonical: 'https://aniruddhadasgupta.pages.dev/services/' },
};

export default function ServicesPage() {
  return (
    <>
      <SiteHeader />

      <main id="main" className="pt-20 sm:pt-24">
        <section className="shell">
          <p className="eyebrow">Services</p>
          <h1 className="mt-3 max-w-3xl text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.08]">
            Three kinds of work, and the sequence each one runs through.
          </h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink-soft">
            These are offers, not promised outcomes. Each list says what an
            engagement typically produces, not what it will achieve for you —
            that depends on your team.
          </p>
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
