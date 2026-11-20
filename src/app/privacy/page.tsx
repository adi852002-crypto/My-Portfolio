import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { PROFILE } from '@/data/site';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What this site counts, what it keeps, and what it never collects.',
  alternates: { canonical: '/privacy/' },
};

const SECTIONS: { h: string; p: React.ReactNode[] }[] = [
  {
    h: 'What is counted',
    p: [
      'Visits and what happens during them: the pages viewed, which objects on the desk are opened, buttons such as the CV download or the share menu, and roughly how long a page is read.',
      'With each visit, the approximate place it came from (city and country, worked out from the network address), the network’s name, the kind of device, browser and operating system, the browser’s language, and the website or campaign link that led here.',
    ],
  },
  {
    h: 'What is never collected',
    p: [
      'No cookies are set for counting, and nothing is used to follow you across other websites. The network address itself is never stored.',
      'Each visit gets an anonymous code made from a random value that is replaced every day and then deleted, so a visit cannot be linked to a person, or to the same browser on another day.',
      'If your browser sends Global Privacy Control or Do Not Track, nothing is counted at all.',
    ],
  },
  {
    h: 'Messages',
    p: [
      `The contact form saves what you write — your name, email, optional company and message — so ${PROFILE.name.split(' ')[0]} can read and reply to it. It is not shared with anyone, used for marketing, or added to any list.`,
      <>
        To have a message deleted, email{' '}
        <a className="text-sage underline underline-offset-2" href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>.
      </>,
    ],
  },
  {
    h: 'Where it is kept, and for how long',
    p: [
      'Everything is stored in a private database in this site’s own Cloudflare account; Cloudflare hosts the site. Visit records are deleted after about 13 months. Messages are kept until they are deleted.',
      'Search figures (how often the site appears in Google results) come from Google Search Console, which reports them as totals and never names a searcher.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="pt-20 sm:pt-24">
        <article className="shell max-w-3xl">
          <Link href="/" className="inline-flex min-h-[44px] items-center gap-2 text-[15px] text-sage">
            <span aria-hidden="true">←</span> Back to the desk
          </Link>
          <p className="eyebrow">Privacy</p>
          <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.1]">
            What this site counts, and what it does not
          </h1>
          <p className="mt-4 max-w-prose text-[17px] leading-relaxed text-ink-soft">
            This site counts its visits to learn what people find useful. It does so on its own
            server, without cookies, and without sending anything to advertising or tracking companies.
          </p>
          {SECTIONS.map((s) => (
            <section key={s.h} className="mt-10">
              <h2 className="font-serif text-[22px]">{s.h}</h2>
              {s.p.map((p, i) => (
                <p key={i} className="mt-3 max-w-prose text-[16px] leading-relaxed text-ink-soft">{p}</p>
              ))}
            </section>
          ))}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
