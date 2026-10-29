import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Icon } from '@/components/Icon';
import { ABOUT, PROFILE, STATUS_LABEL, WORK } from '@/data/site';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Fifteen years in operations that cannot afford to stop — enterprise telecom support, service delivery for global accounts, and the business side of transformation projects.',
  alternates: { canonical: 'https://aniruddhadasgupta.pages.dev/about/' },
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />

      <main id="main" className="pt-20 sm:pt-24">
        <section className="shell grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <p className="eyebrow">About</p>
            <h1 className="mt-3 max-w-2xl text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.08]">
              {ABOUT.heading}
            </h1>
            {ABOUT.paragraphs.map((p) => (
              <p key={p.slice(0, 24)} className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-soft">
                {p}
              </p>
            ))}
          </div>

          <aside className="card h-fit p-6">
            {/* The portrait that sits on the desk in the studio. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/scene/portrait.webp"
              alt={`${PROFILE.name}, head and shoulders`}
              width={480} height={640}
              className="mb-5 w-full rounded-xl border border-line object-cover"
            />
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-sage">Background</p>
            <ul className="mt-3 space-y-2 text-[15px] text-ink-soft">
              {ABOUT.credentials.map((c) => (
                <li key={c} className="flex gap-2">
                  <span aria-hidden="true" className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brass" />
                  {c}
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[15px]">
              <div className="flex gap-2">
                <dt className="text-ink-soft">Based in</dt>
                <dd>{PROFILE.location}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-ink-soft">Email</dt>
                <dd>
                  <a className="text-sage underline underline-offset-2" href={`mailto:${PROFILE.email}`}>
                    {PROFILE.email}
                  </a>
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                LinkedIn<span className="sr-only"> (opens in a new tab)</span>
              </a>
              {PROFILE.resumeUrl && (
                <a href={PROFILE.resumeUrl} download className="btn-secondary">Download CV</a>
              )}
            </div>
          </aside>
        </section>

        <section className="shell mt-16">
          <h2 className="font-serif text-[clamp(1.5rem,2.6vw,2rem)]">Where that experience comes from</h2>
          <p className="mt-3 max-w-2xl text-[16px] text-ink-soft">
            Roles held inside the businesses named. These are not client
            engagements, and no endorsement by those companies is implied.
          </p>
          <ul className="mt-6 grid gap-4 lg:grid-cols-3">
            {WORK.map((w) => (
              <li key={w.slug} className="card p-5">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-sage">
                  {STATUS_LABEL[w.status]}
                </span>
                <h3 className="mt-2 font-serif text-[19px] leading-snug">{w.name}</h3>
                <p className="mt-1 text-[14px] text-ink-soft">{w.dates}</p>
                <p className="mt-3 text-[15px] text-ink-soft">{w.role}</p>
                <Link
                  href={`/work/${w.slug}/`}
                  className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-[15px] font-medium text-sage"
                >
                  Read more <Icon name="arrow" className="h-4 w-4" />
                  <span className="sr-only"> about {w.name}</span>
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
