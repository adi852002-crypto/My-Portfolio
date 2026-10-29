import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { StudioStage } from '@/components/StudioStage';
import { HERO } from '@/data/site';

/* The overview. The desk fills the first screen; the introduction and the
   navigation rail sit over it. Everything the desk opens also lives on its
   own page, linked from the footer. */
export default function Home() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <StudioStage
          intro={
            <div className="mx-auto max-w-[46rem]">
              <h1 className="text-[clamp(2.2rem,5.2vw,3.9rem)] leading-[1.04]">
                {HERO.headline[0]}
                <br />
                {HERO.headline[1]}
              </h1>
              <p className="mx-auto mt-3 max-w-[34rem] text-[clamp(0.98rem,1.25vw,1.12rem)]
                            leading-relaxed text-ink-soft">
                {HERO.lede}
              </p>
            </div>
          }
        />
      </main>

      <SiteFooter />
    </>
  );
}
