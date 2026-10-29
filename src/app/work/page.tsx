import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Icon } from '@/components/Icon';
import { STATUS_LABEL, WORK } from '@/data/site';

export const metadata: Metadata = {
  title: 'Selected work',
  description:
    'Business transformation at Dynamic Travels, enterprise escalation operations on Ultimatix, and service delivery leadership on the Telstra Australia account.',
  alternates: { canonical: '/work/' },
};

export default function WorkIndex() {
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
          <p className="eyebrow">Selected work</p>
          <h1 className="mt-3 max-w-3xl text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.08]">
Fifteen years of it, most recently as the business owner of the change.
          </h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink-soft">
            Every role below was held as an employee, officer or founder of the
            business named. They are not client engagements, and none of these
            companies has engaged or endorsed this consultancy. No performance
            figures are claimed, because none have been independently verified.
          </p>
        </section>

        <section className="shell mt-12 grid gap-5 lg:grid-cols-3">
          {WORK.filter((w) => w.featured).map((w) => (
            <article key={w.slug} className="card flex flex-col p-6">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-sage">
                {STATUS_LABEL[w.status]}
              </span>
              <h2 className="mt-2 font-serif text-[21px] leading-snug">{w.name}</h2>
              <p className="mt-1 text-[14px] text-ink-soft">{w.dates}</p>
              <p className="mt-4 text-[15px] text-ink-soft">{w.context}</p>
              <Link
                href={`/work/${w.slug}/`}
                className="mt-auto inline-flex min-h-[44px] items-center gap-2 pt-5 text-[15px] font-medium text-sage"
              >
                Read more <Icon name="arrow" className="h-4 w-4" />
                <span className="sr-only"> about {w.name}</span>
              </Link>
            </article>
          ))}
        </section>

        <section className="shell mt-14">
          <h2 className="font-serif text-[clamp(1.4rem,2.4vw,1.8rem)]">Earlier roles</h2>
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {WORK.filter((w) => !w.featured).map((w) => (
              <li key={w.slug}>
                <Link
                  href={`/work/${w.slug}/`}
                  className="flex min-h-[56px] flex-wrap items-baseline gap-x-4 gap-y-1 py-3
                             transition-colors hover:text-ink"
                >
                  <span className="font-serif text-[18px]">{w.name}</span>
                  <span className="text-[15px] text-ink-soft">{w.role.replace(/\.$/, '')}</span>
                  <span className="ml-auto whitespace-nowrap text-[14px] text-ink-soft">{w.dates}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
