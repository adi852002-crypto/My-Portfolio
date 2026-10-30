'use client';

import Link from 'next/link';
import { SERVICES, WORK } from '@/data/site';
import { Icon } from './Icon';

/* What the laptop opens. Two columns, and the difference between them is
   the point: on the left what an engagement sets up, on the right where
   that experience comes from. The right-hand column is roles held inside
   those businesses — not clients, and no outcome is claimed for either. */
export function SuccessPanel() {
  const offer = SERVICES.find((s) => s.id === 'customer-success')!;
  /* Looked up by slug, not by position, so reordering the work list cannot
     silently point this link at a different role. */
  const escalation = WORK.find((w) => w.slug === 'ultimatix-escalation-operations');

  /* Drawn from the CV, so it cannot drift from the work history. */
  const FROM = [
    { did: 'Specialist enterprise escalation operations', at: 'TCS — Ultimatix' },
    { did: 'Liaison across HR, IT, SAP Ariba and Procurement', at: 'TCS — Ultimatix' },
    { did: 'MIS dashboards and executive reporting', at: 'TCS — Ultimatix' },
    { did: 'Quality, SLA adherence and performance coaching', at: 'TCS — Telstra Australia' },
    { did: 'Operational leadership for around 200 associates', at: 'TCS — Telstra Australia' },
    { did: 'SOPs across sales, operations, marketing and support', at: 'Dynamic Travels' },
  ];

  return (
    <div>
      <p className="max-w-prose text-[15px] text-ink-soft">{offer.who}</p>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-sage">
            What an engagement sets up
          </h3>
          <ul className="mt-3 space-y-2 text-[15px] text-ink-soft">
            {offer.deliverables.map((d) => (
              <li key={d} className="flex gap-2">
                <span aria-hidden="true" className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-brass" />
                {d}
              </li>
            ))}
          </ul>
          <p className="mt-3 max-w-prose text-[14px] text-ink-soft">
            These are what the work typically produces, not a promised result.
            What it achieves depends on the team it lands in.
          </p>
        </div>

        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-sage">
            Where that comes from
          </h3>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {FROM.map((f) => (
              <li key={f.did} className="flex flex-wrap items-baseline gap-x-3 py-2 text-[15px]">
                <span>{f.did}</span>
                <span className="ml-auto whitespace-nowrap text-[13px] text-ink-soft">{f.at}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 max-w-prose text-[14px] text-ink-soft">
            Roles held inside the businesses named. Not client engagements, and
            no performance figures are claimed, because none are verified.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-5">
        <Link href="/services/#customer-success"
              className="inline-flex min-h-[44px] items-center gap-2 text-[15px] font-medium text-sage">
          Services in full <Icon name="arrow" className="h-4 w-4" />
        </Link>
        {escalation && (
          <Link href={`/work/${escalation.slug}/`}
                className="inline-flex min-h-[44px] items-center gap-2 text-[15px] font-medium text-sage">
            The escalation work in detail <Icon name="arrow" className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
