'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Studio, StudioButtons } from '@/components/Studio';
import { ProcessDemo } from '@/components/ProcessDemo';
import { AiDemo } from '@/components/AiDemo';
import { ContactForm } from '@/components/ContactForm';
import { Icon } from '@/components/Icon';
import {
  ABOUT, CONTACT, HERO, PROCESS, PROFILE, SERVICES, STATUS_LABEL, SUMMARY, WORK,
} from '@/data/site';

export default function Home() {
  const [topic, setTopic] = useState<string | undefined>();

  /* Hotspots are navigation, not a modal: each one scrolls to the real
     section it describes, so the content stays linkable and readable
     without the scene. Focus moves with the scroll. */
  const goto = useCallback((id: string) => {
    const map: Record<string, string> = {
      process: 'demo-process',
      ai: 'demo-ai',
      work: 'work',
    };
    const el = document.getElementById(map[id] ?? id);
    if (!el) return;
    el.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }, []);

  const bookDiscovery = () => {
    if (PROFILE.bookingUrl) {
      window.location.href = PROFILE.bookingUrl;
      return;
    }
    setTopic('discovery-call');
    goto('contact');
  };

  return (
    <>
      <SiteHeader />

      <main id="main">
        {/* ---------------- Hero + studio ---------------- */}
        <section className="relative overflow-hidden pb-10 pt-24 sm:pt-28 lg:pb-16 lg:pt-32">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-40 top-10 h-[520px] w-[520px] rounded-full
                       bg-[radial-gradient(closest-side,rgba(184,153,97,.16),transparent)]"
          />
          <div className="shell grid items-center gap-10 lg:grid-cols-[42fr_58fr] lg:gap-8">
            <div className="relative">
              <p className="eyebrow">{HERO.eyebrow}</p>
              <h1 className="mt-4 text-[clamp(2.05rem,4.4vw,3.2rem)] leading-[1.06]">
                {HERO.headline[0]}
                <br />
                {HERO.headline[1]}
              </h1>
              <p className="mt-5 max-w-md text-[clamp(1rem,1.4vw,1.15rem)] leading-relaxed text-ink-soft">
                {HERO.lede}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href={HERO.primary.href} className="btn-primary">
                  {HERO.primary.label}
                  <Icon name="arrow" className="h-4 w-4" />
                </a>
                <button type="button" onClick={bookDiscovery} className="btn-secondary">
                  {HERO.secondary.label}
                </button>
              </div>
              <p className="mt-4 text-[13px] text-ink-soft">
                {PROFILE.location} · Working with teams across time zones
              </p>
            </div>

            <div>
              <Studio onHotspot={goto} />
              <StudioButtons onHotspot={goto} />
            </div>
          </div>
        </section>

        {/* ---------------- Three-part summary ---------------- */}
        <section aria-label="What I focus on" className="border-y border-line bg-surface/70">
          <div className="shell grid gap-6 py-8 sm:grid-cols-3 sm:gap-8">
            {SUMMARY.map((s) => (
              <div key={s.title} className="flex gap-3.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                             bg-sage-soft text-sage"
                  aria-hidden="true"
                >
                  <Icon name={s.icon} />
                </span>
                <div>
                  <h2 className="font-serif text-[19px] leading-tight">{s.title}</h2>
                  <p className="mt-1 text-[14px] text-ink-soft">{s.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- Services ---------------- */}
        <section id="services" className="scroll-mt-24 py-16 sm:py-24">
          <div className="shell">
            <p className="eyebrow">What I can help with</p>
            <h2 className="mt-3 max-w-2xl text-[clamp(1.75rem,3.4vw,2.75rem)] leading-tight">
              Three areas, and the work that usually comes with them.
            </h2>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {SERVICES.map((s) => (
                <article key={s.id} className="card flex flex-col p-6">
                  <h3 className="text-[21px] leading-snug">{s.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{s.who}</p>
                  <div className="mt-5 border-t border-line pt-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft">
                      Typically produces
                    </p>
                    <ul className="mt-3 space-y-2">
                      {s.deliverables.map((d) => (
                        <li key={d} className="flex items-start gap-2 text-[14.5px]">
                          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brass" aria-hidden="true" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-6 max-w-2xl text-[14px] text-ink-soft">
              These are proposed services and the deliverables an engagement usually
              produces — not guaranteed outcomes. What actually makes sense depends on
              the team and the constraints.
            </p>
          </div>
        </section>

        {/* ---------------- Demonstrations ---------------- */}
        <section className="scroll-mt-24 border-y border-line bg-surface/70 py-16 sm:py-24">
          <div className="shell">
            <p className="eyebrow">Demonstrations</p>
            <h2 className="mt-3 max-w-2xl text-[clamp(1.75rem,3.4vw,2.75rem)] leading-tight">
              Two things you can try, rather than take my word for.
            </h2>
            <div className="mt-10 grid gap-6 xl:grid-cols-2">
              <div id="demo-process" className="scroll-mt-24 outline-none">
                <ProcessDemo />
              </div>
              <div id="demo-ai" className="scroll-mt-24 outline-none">
                <AiDemo />
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Selected work ---------------- */}
        <section id="work" className="scroll-mt-24 py-16 outline-none sm:py-24">
          <div className="shell">
            <p className="eyebrow">Selected work</p>
            <h2 className="mt-3 max-w-2xl text-[clamp(1.75rem,3.4vw,2.75rem)] leading-tight">
              Where I have done this, and what the job actually was.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
              These are roles I held inside the businesses named. They are not client
              engagements, and none of these companies has engaged or endorsed this
              consultancy.
            </p>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {WORK.map((w) => (
                <article key={w.slug} className="card flex flex-col p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-sage-soft px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-sage">
                      {STATUS_LABEL[w.status]}
                    </span>
                  </div>
                  <h3 className="mt-3 text-[20px] leading-snug">{w.name}</h3>
                  <p className="mt-1 text-[13px] text-ink-soft">{w.type} · {w.dates}</p>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-ink-soft">{w.context}</p>
                  <Link
                    href={`/work/${w.slug}/`}
                    className="mt-5 inline-flex min-h-[44px] items-center gap-2 text-[15px] font-medium text-sage"
                  >
                    Read what was delivered
                    <Icon name="arrow" className="h-4 w-4" />
                    <span className="sr-only"> — {w.name}</span>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- How I work ---------------- */}
        <section className="border-y border-line bg-surface/70 py-16 sm:py-24">
          <div className="shell">
            <p className="eyebrow">How I work</p>
            <h2 className="mt-3 max-w-2xl text-[clamp(1.75rem,3.4vw,2.75rem)] leading-tight">
              Four steps, in order, every time.
            </h2>
            <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PROCESS.map((p) => (
                <li key={p.n} className="border-t-2 border-sage/30 pt-4">
                  <span className="font-serif text-[28px] text-brass">{p.n}</span>
                  <h3 className="mt-1 text-[19px]">{p.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{p.copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------- About ---------------- */}
        <section id="about" className="scroll-mt-24 py-16 sm:py-24">
          <div className="shell grid gap-10 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="eyebrow">About</p>
              <h2 className="mt-3 max-w-xl text-[clamp(1.75rem,3.4vw,2.75rem)] leading-tight">
                {ABOUT.heading}
              </h2>
              <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-ink-soft">
                {ABOUT.paragraphs.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
              </div>
            </div>
            <aside className="card h-fit p-6">
              <h3 className="text-[17px]">Background</h3>
              <ul className="mt-4 space-y-3">
                {ABOUT.credentials.map((c) => (
                  <li key={c} className="flex items-start gap-2.5 text-[14.5px] text-ink-soft">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brass" aria-hidden="true" />
                    {c}
                  </li>
                ))}
              </ul>
              {PROFILE.resumeUrl && (
                <a href={PROFILE.resumeUrl} className="btn-secondary mt-6 w-full" download>
                  Download CV
                </a>
              )}
            </aside>
          </div>
        </section>

        {/* ---------------- Contact ---------------- */}
        <section id="contact" className="scroll-mt-24 border-t border-line bg-surface/70 py-16 outline-none sm:py-24">
          <div className="shell grid gap-10 lg:grid-cols-[0.85fr_1fr]">
            <div>
              <p className="eyebrow">Contact</p>
              <h2 className="mt-3 text-[clamp(1.75rem,3.4vw,2.75rem)] leading-tight">
                {CONTACT.heading}
              </h2>
              <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-ink-soft">
                {CONTACT.lede}
              </p>
              <dl className="mt-8 space-y-4 text-[15px]">
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft">Email</dt>
                  <dd className="mt-1">
                    <a className="text-sage underline underline-offset-2" href={`mailto:${PROFILE.email}`}>
                      {PROFILE.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft">LinkedIn</dt>
                  <dd className="mt-1">
                    <a className="text-sage underline underline-offset-2" href={PROFILE.linkedin}
                       target="_blank" rel="noopener noreferrer">
                      /in/aniruddhagkdasgupta
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft">Based in</dt>
                  <dd className="mt-1 text-ink-soft">{PROFILE.location}</dd>
                </div>
              </dl>
            </div>
            <ContactForm initialTopic={topic} />
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-10">
        <div className="shell flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif text-[20px]">{PROFILE.name}</p>
            <p className="mt-1 max-w-sm text-[14px] text-ink-soft">{PROFILE.role}</p>
            <p className="mt-0.5 text-[14px] text-ink-soft">{PROFILE.disciplines}</p>
            <p className="mt-3 text-[14px] text-ink-soft">{PROFILE.location}</p>
          </div>
          <div className="flex flex-col gap-2 text-[14px] sm:items-end">
            <a className="text-sage underline underline-offset-2" href={`mailto:${PROFILE.email}`}>
              {PROFILE.email}
            </a>
            <a className="text-sage underline underline-offset-2" href={PROFILE.linkedin}
               target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <p className="mt-2 text-ink-soft">
              © {new Date().getFullYear()} {PROFILE.name}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
