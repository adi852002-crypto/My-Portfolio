'use client';

/* Hosts the WebGL studio and everything around it: the fallback when WebGL
   is unavailable, the accessible content panel the hotspots open, the
   mobile controls, and render pausing when the scene is not on screen. */

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ProcessDemo } from './ProcessDemo';
import { AiDemo } from './AiDemo';
import { WorkPanel } from './WorkPanel';
import { ServicesPanel } from './ServicesPanel';
import { AboutPanel } from './AboutPanel';
import { PANEL_TITLES, type StudioState } from './studio/shots';

const StudioCanvas = dynamic(() => import('./studio/StudioCanvas'), { ssr: false });

type Picked = Exclude<StudioState, 'overview'>;

/* The navigation row under the desk. It is always visible, on every screen
   size, so the scene is never the only way to reach anything. "How I work"
   is not listed here: the notebook on the desk opens it, and the About and
   Services pages both link to it. */
const NAV_BUTTONS: { id: Picked; label: string; describes: string }[] = [
  { id: 'work',    label: 'Work',           describes: 'the laptop — roles, context and what was delivered' },
  { id: 'process', label: 'Process & CRM',  describes: 'the tablet — process mapping, SOPs, CRM and reporting' },
  { id: 'ai',      label: 'AI in action',   describes: 'the monitor — a sample request-handling automation you can run' },
  { id: 'about',   label: 'About',          describes: 'the framed photograph — background, credentials and CV' },
];

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

export function StudioStage() {
  const [state, setState] = useState<StudioState>('overview');
  const [supported, setSupported] = useState<boolean | null>(null);
  const [crashed, setCrashed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [active, setActive] = useState(true);       // render only when visible
  const [fine, setFine] = useState(false);
  const [roomy, setRoomy] = useState(false);   // wide enough for in-scene labels

  const pointer = useRef({ x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setSupported(webglAvailable());

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointerFine = window.matchMedia('(pointer: fine)');
    const wide = window.matchMedia('(min-width: 1024px)');
    const sync = () => {
      setReduced(motion.matches);
      setFine(pointerFine.matches);
      setRoomy(wide.matches);
    };
    sync();
    motion.addEventListener('change', sync);
    pointerFine.addEventListener('change', sync);
    wide.addEventListener('change', sync);
    return () => {
      motion.removeEventListener('change', sync);
      pointerFine.removeEventListener('change', sync);
      wide.removeEventListener('change', sync);
    };
  }, []);

  /* Stop rendering when the section scrolls away or the tab is hidden. */
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setActive(e.isIntersecting && !document.hidden),
      { rootMargin: '120px' },
    );
    io.observe(el);
    const onVis = () => setActive(!document.hidden && !!el.getBoundingClientRect().height);
    document.addEventListener('visibilitychange', onVis);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  const open = useCallback((id: Picked, trigger?: HTMLElement | null) => {
    lastTrigger.current = trigger ?? (document.activeElement as HTMLElement | null);
    setState(id);
  }, []);

  const backToStudio = useCallback(() => {
    setState('overview');
    lastTrigger.current?.focus?.();
  }, []);

  /* Escape closes the panel; focus moves into it when it opens. */
  useEffect(() => {
    if (state === 'overview') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') backToStudio(); };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [state, backToStudio]);

  const onPointerMove = (e: React.PointerEvent) => {
    if (!fine || reduced || !boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    pointer.current = {
      x: (e.clientX - r.left) / r.width - 0.5,
      y: (e.clientY - r.top) / r.height - 0.5,
    };
  };

  const useFallback = supported === false || crashed;

  return (
    <div>
      <div
        ref={boxRef}
        onPointerMove={onPointerMove}
        onPointerLeave={() => { pointer.current = { x: 0, y: 0 }; }}
        className="relative mx-auto w-full overflow-hidden max-w-[860px] lg:max-w-[1060px]
                   h-[clamp(200px,27vh,250px)] sm:h-[clamp(270px,38vh,380px)] lg:h-[clamp(360px,50vh,520px)]"
        style={{
          /* The ground plane already dissolves into the page colour in world
             space, so this is only a whisper at the very corners — not a
             haze over the furniture. One gradient only: compositing two
             mask layers blanked the canvas in Chrome. */
          WebkitMaskImage:
            'radial-gradient(150% 150% at 50% 46%, #000 72%, rgba(0,0,0,0.75) 90%, transparent 100%)',
          maskImage:
            'radial-gradient(150% 150% at 50% 46%, #000 72%, rgba(0,0,0,0.75) 90%, transparent 100%)',
        }}
      >
        {supported === null ? (
          /* Before the capability check resolves, show the poster so the hero
             paints immediately and the box never collapses. */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/scene/poster.webp"
            alt="A pale oak desk: an open laptop in the centre showing selected work, a tablet and a small plant to the left, a framed photograph of Aniruddha Dasgupta beside the laptop, a monitor showing an automation flow to the right, and an open notebook, pen, mug and brass lamp."
            width={1280} height={545} fetchPriority="high"
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : useFallback ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/scene/poster.webp"
            alt="A pale oak desk: an open laptop in the centre showing selected work, a tablet and a small plant to the left, a framed photograph of Aniruddha Dasgupta beside the laptop, a monitor showing an automation flow to the right, and an open notebook, pen, mug and brass lamp."
            width={1280} height={545} fetchPriority="high"
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : (
          <StudioCanvas
            state={state}
            onPick={(id) => open(id)}
            pointer={pointer}
            reduced={reduced}
            showLabels={fine && roomy}
            active={active}
            onLost={() => setCrashed(true)}
          />
        )}

      </div>

      {/* Navigation. Always present, keyboard reachable and 44px tall on
          touch, whether or not the in-scene markers are shown. */}
      <nav aria-label="Studio" className="mt-4">
        <ul className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 sm:gap-x-2">
          {NAV_BUTTONS.map((h, i) => (
            <li key={h.id} className="flex items-center">
              {i > 0 && (
                <span aria-hidden="true" className="mx-1 h-1 w-1 rounded-full bg-brass-bright sm:mx-2" />
              )}
              <button
                type="button"
                onClick={(e) => open(h.id, e.currentTarget)}
                aria-pressed={state === h.id}
                className={`flex min-h-[44px] items-center rounded-full px-3 text-[14px]
                            transition-colors ${
                              state === h.id
                                ? 'font-medium text-sage underline decoration-sage/50 underline-offset-[6px]'
                                : 'text-ink-soft hover:text-ink'
                            }`}
              >
                {h.label}
                <span className="sr-only"> — {h.describes}</span>
              </button>
            </li>
          ))}
          <li className="flex items-center">
            <span aria-hidden="true" className="mx-1 h-1 w-1 rounded-full bg-brass-bright sm:mx-2" />
            <Link
              href="/contact/"
              className="flex min-h-[44px] items-center rounded-full px-3 text-[14px]
                         text-ink-soft transition-colors hover:text-ink"
            >
              Contact
            </Link>
          </li>
        </ul>
      </nav>

      {/* The content panel. Plain HTML, in the document flow, so it is
          readable and linkable without the scene. */}
      {state !== 'overview' && (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="region"
          aria-label={PANEL_TITLES[state as Picked]}
          className="card mt-5 scroll-mt-24 p-5 outline-none sm:p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-[20px]">{PANEL_TITLES[state as Picked]}</h3>
            <button type="button" onClick={backToStudio} className="btn-secondary">
              <span aria-hidden="true">←</span> Back to desk
            </button>
          </div>
          {state === 'work' && <WorkPanel />}
          {state === 'process' && <ProcessDemo />}
          {state === 'ai' && <AiDemo />}
          {state === 'services' && <ServicesPanel />}
          {state === 'about' && <AboutPanel />}
        </div>
      )}
    </div>
  );
}
