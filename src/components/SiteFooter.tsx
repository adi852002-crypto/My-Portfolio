import Link from 'next/link';
import { PROFILE } from '@/data/site';

/* One footer for every page. It is also the plain-HTML index of the site,
   so every destination the studio opens is reachable without the scene. */
const COLUMNS = [
  {
    heading: 'Pages',
    links: [
      { href: '/work/', label: 'Selected work' },
      { href: '/services/', label: 'Services & how I work' },
      { href: '/about/', label: 'About' },
      { href: '/contact/', label: 'Contact' },
    ],
  },
  {
    heading: 'Services',
    links: [
      { href: '/services/#operations', label: 'Operations & process improvement' },
      { href: '/services/#customer-success', label: 'Customer success & service delivery' },
      { href: '/services/#crm-ai', label: 'CRM & practical AI' },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-line py-10">
      <div className="shell grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-serif text-[20px]">{PROFILE.name}</p>
          <p className="mt-1 max-w-sm text-[14px] text-ink-soft">{PROFILE.role}</p>
          <p className="mt-0.5 text-[14px] text-ink-soft">{PROFILE.disciplines}</p>
          <p className="mt-3 text-[14px] text-ink-soft">{PROFILE.location}</p>
          <div className="mt-4 flex flex-col gap-1.5 text-[14px]">
            <a className="text-sage underline underline-offset-2" href={`mailto:${PROFILE.email}`}>
              {PROFILE.email}
            </a>
            <a className="text-sage underline underline-offset-2" href={PROFILE.linkedin}
               target="_blank" rel="noopener noreferrer">
              LinkedIn<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft">
              {col.heading}
            </p>
            <ul className="mt-3 space-y-2 text-[14px]">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-ink-soft transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <p className="shell mt-8 text-[13px] text-ink-soft">
        © {new Date().getFullYear()} {PROFILE.name}
      </p>
    </footer>
  );
}
