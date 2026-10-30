import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PROFILE, SITE_URL } from '@/data/site';

const SITE = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Aniruddha Dasgupta | Operations, Customer Success & AI Transformation',
    template: '%s | Aniruddha Dasgupta',
  },
  description:
    'Aniruddha Dasgupta is a business operations and transformation consultant in Mumbai. I help teams simplify processes, improve customer experience and put AI to work.',
  alternates: { canonical: SITE },
  openGraph: {
    type: 'website',
    url: SITE,
    siteName: 'Aniruddha Dasgupta',
    locale: 'en_IN',
    title: 'Aniruddha Dasgupta | Operations, Customer Success & AI Transformation',
    description:
      'I help teams simplify processes, improve customer experience and put AI to work. Based in Mumbai, India.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Aniruddha Dasgupta — Transformation Studio' }],
  },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

/* The room starts with the lamp on, so the browser chrome starts dark; the
   lamp switch updates this meta at runtime. Next wants it here, not in
   `metadata`, or it is dropped from the export. */
export const viewport: Viewport = {
  themeColor: '#101A12',
  colorScheme: 'dark light',
};

/* Structured data covers only facts printed on the supplied CV:
   name, role, location, contact and the LinkedIn profile.
   No ratings, no organisation claims, no invented credentials. */
const personLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: PROFILE.name,
  jobTitle: PROFILE.role,
  url: SITE,
  email: `mailto:${PROFILE.email}`,
  telephone: PROFILE.phoneHref,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Mumbai',
    addressRegion: 'Maharashtra',
    addressCountry: 'IN',
  },
  sameAs: [PROFILE.linkedin],
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'Bundelkhand University, Jhansi' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-lamp="on">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]
                     focus:rounded-full focus:bg-sage focus:px-5 focus:py-3 focus:text-ink-invert"
        >
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
        />
      </body>
    </html>
  );
}
