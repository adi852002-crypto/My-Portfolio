import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WORK, STATUS_LABEL, PROFILE } from '@/data/site';
import { Icon } from '@/components/Icon';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return WORK.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = WORK.find((w) => w.slug === slug);
  if (!item) return { title: 'Not found' };
  return {
    title: `${item.name} — ${item.type}`,
    description: item.context.slice(0, 160),
    alternates: { canonical: `/work/${item.slug}/` },
  };
}

export default async function WorkDetail({ params }: Props) {
  const { slug } = await params;
  const item = WORK.find((w) => w.slug === slug);
  if (!item) notFound();

  return (
    <>
      <SiteHeader />
      <main id="main" className="pb-4 pt-24 sm:pt-28">
      <div className="shell max-w-3xl">
        <Link href="/work/" className="inline-flex min-h-[44px] items-center gap-2 text-[15px] text-sage">
          <span aria-hidden="true">←</span> Back to selected work
        </Link>

        <span className="mt-4 block w-fit rounded-full bg-sage-soft px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-sage">
          {STATUS_LABEL[item.status]}
        </span>

        <h1 className="mt-4 text-[clamp(2rem,4.5vw,3rem)] leading-tight">{item.name}</h1>
        <p className="mt-2 text-[15px] text-ink-soft">{item.type} · {item.dates}</p>

        <h2 className="mt-10 font-serif text-[22px]">Context</h2>
        <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">{item.context}</p>

        <h2 className="mt-8 font-serif text-[22px]">My role</h2>
        <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">{item.role}</p>

        <h2 className="mt-8 font-serif text-[22px]">What was delivered</h2>
        <ul className="mt-3 space-y-2.5">
          {item.delivered.map((d) => (
            <li key={d} className="flex items-start gap-2.5 text-[16px] leading-relaxed text-ink-soft">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brass" aria-hidden="true" />
              {d}
            </li>
          ))}
        </ul>

        <h2 className="mt-8 font-serif text-[22px]">Outcome</h2>
        <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
          {item.outcome ?? 'No verified metrics are published for this role, so none are claimed here.'}
        </p>

        {item.link && (
          <p className="mt-8">
            <a className="btn-secondary" href={item.link} target="_blank" rel="noopener noreferrer">
              Visit the project
            </a>
          </p>
        )}

        <div className="mt-12 card p-6">
          <h2 className="font-serif text-[20px]">Working on something similar?</h2>
          <p className="mt-2 text-[15px] text-ink-soft">
            Tell me what is slowing the team down and we can look at it together.
          </p>
          <Link href="/contact/" className="btn-primary mt-5">
            Get in touch <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-10 text-[13px] text-ink-soft">
          {PROFILE.name} · {PROFILE.location}
        </p>
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
