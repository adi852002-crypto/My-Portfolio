'use client';

/* Hosts the WebGL studio and everything around it: the fallback when WebGL
   is unavailable, the accessible content panel the hotspots open, the
   mobile controls, and render pausing when the scene is not on screen. */

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ProcessDemo } from './ProcessDemo';
import { AiDemo } from './AiDemo';
import { WorkPanel } from './WorkPanel';
import { Icon } from './Icon';
import { PANEL_TITLES, type StudioState } from './studio/shots';

const StudioCanvas = dynamic(() => import('./studio/StudioCanvas'), { ssr: false });

type Picked = Exclude<StudioState, 'overview'>;

const HOTSPOT_BUTTONS: { id: Picked; label: string; icon: string; describes: string }[] = [
  { id: 'process', label: 'Process & CRM', icon: 'flow', describes: 'Process mapping, SOPs, CRM implementation and reporting' },
  { id: 'ai', label: 'AI in action', icon: 'chip', describes: 'A sample request-handling automation you can run' },
  { id: 'work', label: 'Selected work', icon: 'doc', describes: 'Roles, context and what was delivered' },
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
        className="relative mx-auto w-full max-w-[760px] lg:max-w-none"
        style={{
          aspectRatio: '1200 / 820',
          /* Feather the edges so the scene melts into the ivory page
             instead of sitting in a visible rectangle. One gradient only:
             compositing two mask layers blanked the canvas in Chrome. */
          WebkitMaskImage:
            'radial-gradient(118% 112% at 52% 46%, #000 62%, rgba(0,0,0,0.55) 84%, transparent 100%)',
          maskImage:
            'radial-gradient(118% 112% at 52% 46%, #000 62%, rgba(0,0,0,0.55) 84%, transparent 100%)',
        }}
      >
        {supported === null ? (
          /* Before the capability check resolves, show the poster so the hero
             paints immediately and the box never collapses. */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/scene/poster.webp"
            alt="An illustrated studio: Aniruddha Dasgupta standing beside a curved oak desk, with a workflow board on the wall, a monitor, a visitor chair and plants."
            width={1200} height={1000} fetchPriority="high"
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : useFallback ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/scene/poster.webp"
            alt="An illustrated studio: Aniruddha Dasgupta standing beside a curved oak desk, with a workflow board on the wall, a monitor, a visitor chair and plants."
            width={1200} height={1000} fetchPriority="high"
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

      {/* Below lg, and whenever labels are not shown in the scene, the same
          three destinations are plain buttons under the studio. */}
      <div className={`mt-4 grid gap-2 sm:grid-cols-3 ${fine && roomy ? 'lg:hidden' : ''}`}>
        {HOTSPOT_BUTTONS.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={(e) => open(h.id, e.currentTarget)}
            aria-pressed={state === h.id}
            className={`flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-left
                        transition-colors ${
                          state === h.id
                            ? 'border-sage bg-sage-soft'
                            : 'border-line bg-surface hover:border-sage'
                        }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage-soft text-sage"
                  aria-hidden="true">
              <Icon name={h.icon} className="h-4 w-4" />
            </span>
            <span className="text-[13px] font-medium">{h.label}</span>
            <span className="sr-only"> — {h.describes}</span>
          </button>
        ))}
      </div>

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
              <span aria-hidden="true">←</span> Back to studio
            </button>
          </div>
          {state === 'process' && <ProcessDemo />}
          {state === 'ai' && <AiDemo />}
          {state === 'work' && <WorkPanel />}
        </div>
      )}
    </div>
  );
}
