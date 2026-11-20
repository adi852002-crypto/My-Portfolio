'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/* Two chart forms, one hue. Every count here is a single series, so the
   site's sage carries it; labels and values stay in the text colours. */

export const fmt = (n: number) => n.toLocaleString('en-IN');

export function duration(ms: number): string {
  if (!ms) return '0s';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

/* A column per day, with a hover / focus readout and a table view. */
export function DailyColumns({
  rows, label, secondaryLabel,
}: {
  rows: { d: string; v: number; v2?: number }[];
  label: string;
  secondaryLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  /* Drawn at the size it is shown, so the axis text stays legible on a
     phone instead of being scaled down with the whole picture. */
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(720);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(280, Math.round(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [table]);
  const max = Math.max(1, ...rows.map((r) => r.v));
  const nice = useMemo(() => {
    const step = Math.pow(10, Math.floor(Math.log10(max)));
    const top = Math.ceil(max / step) * step;
    return top < max ? max : top;
  }, [max]);

  const H = W < 500 ? 170 : 200, padL = 34, padB = 22, padT = 8;
  const plotW = W - padL - 6, plotH = H - padB - padT;
  const band = plotW / Math.max(rows.length, 1);
  const barW = Math.min(24, band * 0.62);
  const every = Math.ceil(rows.length / Math.max(2, Math.floor(W / 90)));
  const dayLabel = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  if (table) {
    return (
      <div>
        <button type="button" className="mb-2 text-[13px] text-sage underline underline-offset-2" onClick={() => setTable(false)}>
          Show chart
        </button>
        <div className="max-h-64 overflow-auto rounded-lg border border-line">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-surface text-left text-ink-soft">
              <tr><th className="px-3 py-2 font-medium">Day</th><th className="px-3 py-2 text-right font-medium">{label}</th>
                {secondaryLabel && <th className="px-3 py-2 text-right font-medium">{secondaryLabel}</th>}</tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.d} className="border-t border-line">
                  <td className="px-3 py-1.5">{dayLabel(r.d)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmt(r.v)}</td>
                  {secondaryLabel && <td className="px-3 py-1.5 text-right tabular-nums">{fmt(r.v2 ?? 0)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const h = hover !== null ? rows[hover] : null;
  return (
    <div className="relative" ref={box}>
      <button type="button" className="absolute right-0 top-[-2.1rem] text-[13px] text-sage underline underline-offset-2" onClick={() => setTable(true)}>
        Show as table
      </button>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img"
           aria-label={`${label} per day; use Show as table for the numbers`}
           onPointerLeave={() => setHover(null)}>
        {[0, 0.5, 1].map((f) => {
          const y = padT + plotH - f * plotH;
          return (
            <g key={f}>
              <line x1={padL} x2={W - 6} y1={y} y2={y} stroke="rgb(var(--line))" strokeWidth="1" />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="11" fill="rgb(var(--ink-soft))">
                {fmt(Math.round(nice * f))}
              </text>
            </g>
          );
        })}
        {rows.map((r, i) => {
          const bh = (r.v / nice) * plotH;
          const x = padL + i * band + (band - barW) / 2;
          const y = padT + plotH - bh;
          const rad = Math.min(4, bh / 2, barW / 2);
          return (
            <g key={r.d}>
              {bh > 0 && (
                <path
                  d={`M${x},${padT + plotH} V${y + rad} Q${x},${y} ${x + rad},${y} H${x + barW - rad} Q${x + barW},${y} ${x + barW},${y + rad} V${padT + plotH} Z`}
                  fill="rgb(var(--sage))" opacity={hover === null || hover === i ? 1 : 0.55}
                />
              )}
              {/* The hit target is the whole day's band, not the bar. */}
              <rect x={padL + i * band} y={padT} width={band} height={plotH} fill="transparent"
                    tabIndex={0} aria-label={`${dayLabel(r.d)}: ${r.v} ${label.toLowerCase()}`}
                    onPointerEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                    className="outline-none focus-visible:stroke-[rgb(var(--ink))]" />
              {i % every === 0 && (
                <text x={padL + i * band + band / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="rgb(var(--ink-soft))">
                  {dayLabel(r.d)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-lg border border-line bg-surface px-3 py-2 text-[12px] shadow-md"
          style={{ left: `${Math.min(80, Math.max(2, ((padL + hover * band) / W) * 100))}%` }}
        >
          <p className="text-ink-soft">{dayLabel(h.d)}</p>
          <p><span className="text-[15px] font-semibold tabular-nums text-ink">{fmt(h.v)}</span> <span className="text-ink-soft">{label.toLowerCase()}</span></p>
          {secondaryLabel && (
            <p><span className="font-semibold tabular-nums text-ink">{fmt(h.v2 ?? 0)}</span> <span className="text-ink-soft">{secondaryLabel.toLowerCase()}</span></p>
          )}
        </div>
      )}
    </div>
  );
}

/* A ranked list with a proportional bar behind each row — the usual form
   for "top sources", "top cities" and the like. */
export function BarList({
  rows, unit, empty = 'Nothing yet', labelOf,
}: {
  rows: { k: string; n: number }[];
  unit?: string;
  empty?: string;
  labelOf?: (k: string) => string;
}) {
  if (!rows.length) return <p className="py-3 text-[13px] text-ink-soft">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.n));
  return (
    <ul className="space-y-1">
      {rows.map((r) => (
        <li key={r.k} className="relative flex min-h-[30px] items-center justify-between gap-3 px-2 text-[13px]"
            title={`${labelOf ? labelOf(r.k) : r.k}: ${fmt(r.n)}${unit ? ` ${unit}` : ''}`}>
          <span aria-hidden="true" className="absolute inset-y-0.5 left-0 rounded-[4px] bg-sage-soft"
                style={{ width: `${Math.max(2, (r.n / max) * 100)}%` }} />
          <span className="relative truncate text-ink">{labelOf ? labelOf(r.k) : r.k}</span>
          <span className="relative tabular-nums text-ink-soft">{fmt(r.n)}</span>
        </li>
      ))}
    </ul>
  );
}

export function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-[12px] text-ink-soft">{label}</p>
      <p className="mt-1 font-serif text-[28px] leading-none tabular-nums text-ink">{value}</p>
      {note && <p className="mt-1.5 text-[12px] text-ink-soft">{note}</p>}
    </div>
  );
}
