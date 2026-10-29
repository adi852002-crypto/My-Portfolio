'use client';

import { useEffect, useRef, useState } from 'react';
import { PROFILE } from '@/data/site';

const NAV = [
  { href: '#work', label: 'Work' },
  { href: '#services', label: 'Services' },
  { href: '#about', label: 'About' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Escape closes the menu and focus returns to the control that opened it. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ease-soft ${
        stuck ? 'border-b border-line bg-ivory/85 backdrop-blur-md' : 'border-b border-transparent'
      }`}
    >
      <div className="shell flex items-center justify-between gap-4 py-3">
        <a href="#main" className="flex min-h-[44px] items-center gap-3" aria-label={`${PROFILE.name} — home`}>
          {/* Original monogram: two letterforms in a rule-framed lockup. */}
          <span
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-sage/35
                       bg-sage-soft/60 font-serif text-[17px] leading-none text-sage"
            aria-hidden="true"
          >
            {PROFILE.initials}
          </span>
          <span className="hidden font-serif text-[19px] sm:block">{PROFILE.name}</span>
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="flex min-h-[44px] items-center rounded-full px-4 text-[15px]
                         text-ink-soft transition-colors hover:text-ink"
            >
              {n.label}
            </a>
          ))}
          <a href="#contact" className="btn-primary ml-2">Let’s talk</a>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <a href="#contact" className="btn-primary px-5 text-[14px]">Let’s talk</a>
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-surface"
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor"
                 strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        ref={panelRef}
        hidden={!open}
        className="border-t border-line bg-ivory/95 backdrop-blur-md md:hidden"
      >
        <nav aria-label="Primary (mobile)" className="shell flex flex-col py-2">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="flex min-h-[48px] items-center border-b border-line/70 text-[16px] last:border-0"
            >
              {n.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
