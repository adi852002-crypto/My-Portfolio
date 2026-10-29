import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { StudioStage } from '@/components/StudioStage';
import { Icon } from '@/components/Icon';
import { HERO, OVERVIEW_CTA, PROFILE } from '@/data/site';

/* The overview. A short introduction, one workspace, a compact row of
   controls and a single contact action — nothing else. Everything the
   studio opens also lives on its own page, linked from the footer. */
export default function Home() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <section className="relative pb-4 pt-20 sm:pt-22 lg:pt-24">
          {/* a single warm wash behind the desk, not a boxed background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-24 h-[640px] w-[min(1100px,96vw)]
                       -translate-x-1/2 rounded-full
                       bg-[radial-gradient(closest-side,rgba(184,153,97,.14),transparent)]"
          />

          <div className="shell relative">
            <div className="max-w-[46rem]">
              <p className="eyebrow">{HERO.eyebrow}</p>
              <h1 className="mt-3 text-[clamp(2rem,4.6vw,3.25rem)] leading-[1.05]">
                {HERO.headline[0]}{' '}
                <span className="whitespace-nowrap">{HERO.headline[1]}</span>
              </h1>
              <p className="mt-3 max-w-xl text-[clamp(1rem,1.3vw,1.1rem)] leading-relaxed text-ink-soft">
                {HERO.lede}
              </p>
            </div>

            <div className="mt-5 lg:mt-3">
              <StudioStage />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-5">
              <p className="text-[15px] text-ink-soft">{OVERVIEW_CTA.lede}</p>
              <Link href={OVERVIEW_CTA.href} className="btn-primary">
                {OVERVIEW_CTA.label}
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
              <p className="ml-auto text-[13px] text-ink-soft">
                {PROFILE.location} · Working with teams across time zones
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
