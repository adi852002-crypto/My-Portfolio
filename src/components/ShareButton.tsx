'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { PROFILE, SITE_URL } from '@/data/site';
import { track } from '@/lib/analytics';

/* Share the site. On a phone it opens the system share sheet, which already
   lists the visitor's own apps. Elsewhere it opens a short menu. Every link
   carries utm tags, so a visit that arrives through a share is counted as
   one, by channel. */

const TEXT = `${PROFILE.name} — ${PROFILE.role}`;

const link = (channel: string) =>
  `${SITE_URL}/?utm_source=${channel}&utm_medium=share`;

const CHANNELS = [
  {
    id: 'linkedin', label: 'LinkedIn',
    href: () => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link('linkedin'))}`,
  },
  {
    id: 'whatsapp', label: 'WhatsApp',
    href: () => `https://wa.me/?text=${encodeURIComponent(`${TEXT} ${link('whatsapp')}`)}`,
  },
  {
    id: 'email', label: 'Email',
    href: () => `mailto:?subject=${encodeURIComponent(TEXT)}&body=${encodeURIComponent(link('email'))}`,
  },
  {
    id: 'x', label: 'X',
    href: () => `https://x.com/intent/post?text=${encodeURIComponent(TEXT)}&url=${encodeURIComponent(link('x'))}`,
  },
] as const;

export function ShareButton({ className = '', label = 'Share' }: { className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); button.current?.focus(); }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function onClick() {
    /* The system sheet only where it is the norm: touch devices. On a
       desktop it is a small, unfamiliar dialog, so the menu is better. */
    const touch = window.matchMedia('(pointer: coarse)').matches;
    if (touch && navigator.share) {
      try {
        await navigator.share({ title: TEXT, text: TEXT, url: link('native') });
        track('share', 'native');
      } catch { /* dismissed: nothing was shared */ }
      return;
    }
    setOpen((v) => !v);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link('copy'));
      track('share', 'copy');
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1400);
    } catch { /* clipboard blocked: the links still work */ }
  }

  return (
    <div ref={wrap} className={`relative inline-flex ${className}`}>
      <button
        ref={button}
        type="button"
        onClick={onClick}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className="pointer-events-auto inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-2
                   text-[13px] text-ink-soft transition-colors hover:text-ink"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v13" />
        </svg>
        {label}
      </button>

      {open && (
      <div
        id={menuId}
        className="pointer-events-auto absolute bottom-full left-1/2 z-50 mb-2 w-[13.5rem] -translate-x-1/2
                   rounded-xl border border-line bg-surface p-1.5 text-left shadow-[0_8px_30px_rgba(40,36,28,0.16)]"
      >
        <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft">
          Share this site
        </p>
        <button
          type="button"
          onClick={copy}
          className="flex min-h-[40px] w-full items-center rounded-lg px-2.5 text-[14px] text-ink hover:bg-ivory"
        >
          {copied ? 'Link copied' : 'Copy link'}
        </button>
        {CHANNELS.map((c) => (
          <a
            key={c.id}
            href={c.href()}
            target={c.id === 'email' ? undefined : '_blank'}
            rel="noopener noreferrer"
            data-track={`share:${c.id}`}
            onClick={() => setTimeout(() => setOpen(false), 50)}
            className="flex min-h-[40px] items-center rounded-lg px-2.5 text-[14px] text-ink hover:bg-ivory"
          >
            {c.label}
            {c.id !== 'email' && <span className="sr-only"> (opens in a new tab)</span>}
          </a>
        ))}
        <span aria-live="polite" className="sr-only">{copied ? 'Link copied' : ''}</span>
      </div>
      )}
    </div>
  );
}
