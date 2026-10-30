import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ContactForm } from '@/components/ContactForm';
import { CONTACT, PROFILE } from '@/data/site';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Tell me what is slowing your team down. The form opens your own email app with the message prepared — nothing is sent from this website.',
  alternates: { canonical: '/contact/' },
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />

      <main id="main" className="pt-20 sm:pt-24">
        <section className="shell grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center gap-2 text-[15px] text-sage"
            >
              <span aria-hidden="true">←</span> Back to the desk
            </Link>
            <p className="eyebrow">Contact</p>
            <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.08]">{CONTACT.heading}</h1>
            <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink-soft">{CONTACT.lede}</p>

            <dl className="mt-8 grid gap-5 text-[15px] sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft">Email</dt>
                <dd className="mt-1">
                  <a className="text-sage underline underline-offset-2" href={`mailto:${PROFILE.email}`}>
                    {PROFILE.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft">Phone</dt>
                <dd className="mt-1">
                  <a className="text-sage underline underline-offset-2" href={`tel:${PROFILE.phoneHref}`}>
                    {PROFILE.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft">LinkedIn</dt>
                <dd className="mt-1">
                  <a className="text-sage underline underline-offset-2" href={PROFILE.linkedin}
                     target="_blank" rel="noopener noreferrer">
                    /in/aniruddhagkdasgupta
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft">Based in</dt>
                <dd className="mt-1 text-ink-soft">{PROFILE.location}</dd>
              </div>
              {/* The same card that sits in the holder on the desk, as a file
                  a phone can save. Built at build time from these details. */}
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft">My card</dt>
                <dd className="mt-1">
                  <a className="text-sage underline underline-offset-2"
                     href="/aniruddha-dasgupta.vcf" download>
                    Save to contacts (.vcf)
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <ContactForm />
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
