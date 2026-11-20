import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { StudioStage } from '@/components/StudioStage';
import { HomeBrief } from '@/components/HomeBrief';
import { HERO } from '@/data/site';

/* The overview. The desk is the first screen — the picture, not a backdrop
   behind a headline. Wherever there is width beside it, the introduction
   is a compact block in the top-left corner and the desk takes the screen;
   on an upright phone the copy sits above it. The brief below repeats all
   of it as plain HTML, and everything the desk opens also has its own page. */
export default function Home() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <StudioStage
          intro={
            <div className="mx-auto max-w-[46rem] corner:mx-0 corner:max-w-[31rem]">
              {/* In the corner the headline is a title, not a banner: sized
                  to sit beside the desk rather than over it. */}
              <h1 className="text-[clamp(1.8rem,min(5.2vw,8.2vh),3.9rem)] leading-[1.04]
                             mid:text-[clamp(1.8rem,min(5.2vw,6.9vh),3.4rem)]
                             corner:text-[clamp(1.55rem,min(2.45vw,4.9vh),2.6rem)] short:text-[1.45rem]">
                {HERO.headline[0]}
                <br />
                {HERO.headline[1]}
              </h1>
              <p className="mx-auto mt-3 max-w-[34rem] text-[clamp(0.95rem,min(1.25vw,2.1vh),1.12rem)]
                            leading-relaxed text-ink-soft mid:mt-2 corner:mx-0 corner:mt-3
                            corner:max-w-[31rem] corner:text-[clamp(0.9rem,min(1.05vw,2vh),1.02rem)] short:hidden">
                {HERO.lede}
                <span className="phone:hidden"> {HERO.interactive}</span>
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
