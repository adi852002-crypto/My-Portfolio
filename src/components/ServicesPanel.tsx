'use client';

import Link from 'next/link';
import { PROCESS, SERVICES } from '@/data/site';
import { Icon } from './Icon';

/* What opens from the notebook. The same content lives at /services, so
   none of it is reachable only through the 3D scene. */
export function ServicesPanel() {
  return (
    <div>
      <p className="mb-5 max-w-prose text-[15px] text-ink-soft">
        Three kinds of work, and the sequence each engagement runs through.
      </p>

      <ul className="grid gap-3 md:grid-cols-3">
        {SERVICES.map((s) => (
          <li key={s.id} className="rounded-xl border border-line bg-ivory/60 p-4">
            <h4 className="font-serif text-[17px] leading-snug">{s.title}</h4>
            <p className="mt-2 text-[14px] text-ink-soft">{s.who}</p>
            <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-sage">
              Typically produces
            </p>
            <ul className="mt-1.5 space-y-1 text-[14px] text-ink-soft">
              {s.deliverables.map((d) => (
                <li key={d} className="flex gap-2">
                  <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brass" />
                  {d}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {PROCESS.map((p) => (
          <li key={p.n} className="rounded-xl border border-line bg-surface p-4">
            <span className="text-[12px] font-medium tracking-[0.14em] text-brass">{p.n}</span>
            <h4 className="mt-1 font-serif text-[16px]">{p.title}</h4>
            <p className="mt-1 text-[13px] text-ink-soft">{p.copy}</p>
          </li>
        ))}
      </ol>

      <Link
        href="/services/"
        className="mt-5 inline-flex min-h-[44px] items-center gap-2 text-[15px] font-medium text-sage"
      >
        Services in full <Icon name="arrow" className="h-4 w-4" />
      </Link>
    </div>
  );
}
