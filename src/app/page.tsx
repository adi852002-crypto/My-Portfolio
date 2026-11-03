import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { StudioStage } from '@/components/StudioStage';
import { HomeBrief } from '@/components/HomeBrief';
import { HERO } from '@/data/site';

/* The overview. The desk fills the first screen; the introduction and the
   navigation rail sit over it, and the brief below repeats all of it as
   plain HTML. Everything the desk opens also lives on its own page. */
export default function Home() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <StudioStage
          intro={
            <div className="mx-auto max-w-[46rem]">
              <h1 className="text-[clamp(1.8rem,min(5.2vw,8.2vh),3.9rem)] leading-[1.04] short:text-[1.6rem]">
                {HERO.headline[0]}
                <br />
                {HERO.headline[1]}
              </h1>
              <p className="mx-auto mt-3 max-w-[34rem] text-[clamp(0.95rem,min(1.25vw,2.1vh),1.12rem)]
                            leading-relaxed text-ink-soft short:hidden">
                {HERO.lede}
              </p>
            </div>
          }
        />

        {/* The same thing in plain HTML, for everyone who scrolls before
            they explore — and for a search engine, which only ever does. */}
        <HomeBrief />
      </main>

      <SiteFooter />
    </>
  );
}
