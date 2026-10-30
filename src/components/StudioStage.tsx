'use client';

/* Hosts the WebGL desk and everything around it: the fallback when WebGL
   is unavailable, the accessible content panel each object opens, the
   navigation row, and render pausing when the scene is off screen.

   Two ways in, one state machine behind them. In the scene, each object
   carries a small marker that names itself on hover or keyboard focus. Below
   the scene, the same destinations are an ordinary row of controls, always
   visible, which is what makes them discoverable and usable by touch. */

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ProcessDemo } from './ProcessDemo';
import { AiDemo } from './AiDemo';
import { WorkPanel } from './WorkPanel';
import { AboutPanel } from './AboutPanel';
import { NotePanel } from './NotePanel';
import { ContactPanel } from './ContactPanel';
import { SuccessPanel } from './SuccessPanel';
import { PANEL_TITLES, type StudioState } from './studio/shots';
import type { SafeBand } from './studio/Scene';
import { PROFILE } from '@/data/site';

const StudioCanvas = dynamic(() => import('./studio/StudioCanvas'), { ssr: false });

type Picked = Exclude<StudioState, 'overview'>;

const DESTINATIONS: { id: Picked; label: string; describes: string }[] = [
  { id: 'work',    label: 'Work history',   describes: 'the green notebook — every role, 2007 onwards' },
  { id: 'success', label: 'Customer success', describes: 'the laptop — what an engagement sets up, and where it comes from' },
  { id: 'process', label: 'Process & CRM',  describes: 'the tablet — process mapping, SOPs, CRM and reporting' },
  { id: 'ai',      label: 'AI in action',   describes: 'the monitor — a sample request-handling automation' },
  { id: 'about',   label: 'About',          describes: 'the framed photograph — background, how I work and CV' },
  { id: 'note',    label: 'Leave a note',   describes: 'the notebook — write something and send it by email' },
  { id: 'contact', label: 'Contact',        describes: 'the phone — call, email, LinkedIn and the CV' },
];

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

export function StudioStage({ intro }: { intro: React.ReactNode }) {
  const [state, setState] = useState<StudioState>('overview');
  const [supported, setSupported] = useState<boolean | null>(null);
  const [crashed, setCrashed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [active, setActive] = useState(true);       // render only when visible
  const [fine, setFine] = useState(false);
  const [note, setNote] = useState('');
  /* The desk lamp is the light in this room. Switch it off and the daylight
     comes up: the page palette and the scene change together. */
  const [lampOn, setLampOn] = useState(true);

  const pointer = useRef({ x: 0, y: 0 });
  const boxRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);

  /* The slice of the hero the page is not using. The scene composes inside
     it, so the desk is never under the headline or the open panel however
     short or wide the window is. */
  const safe = useRef<SafeBand>({ top: 0, bottom: 1 });
  const panelRef = useRef<HTMLDivElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.documentElement.dataset.lamp = lampOn ? 'on' : 'off';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', lampOn ? '#101A12' : '#F7F5EF');
  }, [lampOn]);

  useEffect(() => {
    setSupported(webglAvailable());

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointerFine = window.matchMedia('(pointer: fine)');
    const sync = () => {
      setReduced(motion.matches);
      setFine(pointerFine.matches);
    };
    sync();
    motion.addEventListener('change', sync);
    pointerFine.addEventListener('change', sync);
    return () => {
      motion.removeEventListener('change', sync);
      pointerFine.removeEventListener('change', sync);
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

  /* Remeasure whenever the page could have reflowed. The camera reads this
     every frame, so no re-render is needed to act on it. */
  useEffect(() => {
    const measure = () => {
      const hero = boxRef.current?.getBoundingClientRect();
      if (!hero || !hero.height) return;
      const intro = introRef.current?.getBoundingClientRect();
      const foot = footRef.current?.getBoundingClientRect();
      const gap = Math.min(28, hero.height * 0.035);

      const top = state === 'overview' && intro
        ? (intro.bottom - hero.top + gap) / hero.height
        : 0.1;
      const bottom = foot ? (foot.top - hero.top - gap) / hero.height : 1;
      safe.current = {
        top: Math.min(0.55, Math.max(0, top)),
        bottom: Math.max(0.45, Math.min(1, bottom)),
      };
    };
    measure();

    const ro = new ResizeObserver(measure);
    if (boxRef.current) ro.observe(boxRef.current);
    if (introRef.current) ro.observe(introRef.current);
    if (footRef.current) ro.observe(footRef.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [state]);

  const open = useCallback((id: Picked, trigger?: HTMLElement | null) => {
    lastTrigger.current = trigger ?? (document.activeElement as HTMLElement | null);
    setState(id);
  }, []);

  const backToDesk = useCallback(() => {
    setState('overview');
    lastTrigger.current?.focus?.();
  }, []);

  /* Escape closes the panel; focus moves into it when it opens. */
  useEffect(() => {
    if (state === 'overview') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') backToDesk(); };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [state, backToDesk]);

  const onPointerMove = (e: React.PointerEvent) => {
    if (!fine || reduced || !boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    pointer.current = {
      x: (e.clientX - r.left) / r.width - 0.5,
      y: (e.clientY - r.top) / r.height - 0.5,
    };
  };

  const useFallback = supported === false || crashed;
  const poster = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/scene/poster.webp"
      alt="A pale oak desk: an open laptop at the centre, a monitor behind and to the right, a tablet on a stand to the left, a framed photograph, a notebook, a brass lamp and a small plant."
      width={1280} height={610} fetchPriority="high"
      className="absolute inset-0 h-full w-full object-cover"
    />
  );

  return (
    <>
      {/* The hero is the desk. The scene runs full bleed behind the page,
          and the introduction and the navigation rail sit over it. */}
      <section
        ref={boxRef}
        onPointerMove={onPointerMove}
        onPointerLeave={() => { pointer.current = { x: 0, y: 0 }; }}
        className="relative isolate min-h-[100svh] w-full overflow-hidden"
      >
        {/* The lamp's glow, continued onto the page behind the desk, so the
            scene and the copy read as one room rather than two layers. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: lampOn ? 1 : 0,
            transition: 'opacity 450ms ease',
            background:
              'radial-gradient(62% 48% at 72% 68%, rgba(196,150,86,0.17), transparent 72%),' +
              'radial-gradient(70% 55% at 30% 24%, rgba(112,140,104,0.1), transparent 70%)',
          }}
        />

        {/* `isolate` keeps the scene and its markers in their own stacking
            context, so a marker can never float over the rail or the copy
            on a short window — the page layer above always wins. */}
        <div className="absolute inset-0 isolate z-0">
          {supported === null ? poster : useFallback ? poster : (
            <StudioCanvas
              state={state}
              onPick={(id) => open(id)}
              pointer={pointer}
              reduced={reduced}
              showMarkers={fine}
              safe={safe}
              note={note}
              lampOn={lampOn}
              onLamp={() => setLampOn((v) => !v)}
              active={active}
              onLost={() => setCrashed(true)}
            />
          )}
        </div>

        {/* A low scrim at the very foot of the frame, so the desk settles
            into the room rather than being cut off by the rail's band. It
            follows the lamp: shadow in the lit room, daylight with it off. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[30%]"
          style={{
            background: 'linear-gradient(to top, rgb(var(--ivory)) 3%,'
              + ' rgb(var(--ivory) / 0.5) 34%, rgb(var(--ivory) / 0) 100%)',
          }}
        />

        <div className="pointer-events-none relative z-10 flex min-h-[100svh] flex-col">
          <div
            ref={introRef}
            aria-hidden={state !== 'overview'}
            className="shell pt-[clamp(5.25rem,9vh,6.5rem)] text-center transition-opacity
                       duration-200 ease-soft"
            style={{ opacity: state === 'overview' ? 1 : 0 }}
          >
            {intro}
          </div>

          {/* The navigation rail, centred on a hairline. Always visible, on
              every pointer type, so the destinations are discoverable
              without hunting the scene. */}
          <div ref={footRef} className="mt-auto">
          <nav
            aria-label="Explore the desk"
            className={`relative pb-5 pt-14 sm:pb-9 sm:pt-20 ${state === 'overview' ? '' : 'hidden'}`}
          >
            {/* The desk runs to the bottom of the frame, so without this the
                rail would sit on pale oak with the objects showing through.
                The room fades out over the padding above the rail, and
                everything from the rail down is the flat page colour — ivory
                in the lit room, daylight white with the lamp off — so the
                labels always read against a clean field. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b
                         from-transparent to-ivory sm:h-20"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 top-14 bg-ivory sm:top-20"
            />
            <div className="relative shell">
            <div className="mx-auto w-fit px-2 py-1 sm:px-0 sm:py-0">
            <ul className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0">
              <li aria-hidden="true" className="hidden h-px w-12 bg-line lg:block xl:w-20" />
              {DESTINATIONS.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={(e) => open(d.id, e.currentTarget)}
                    aria-pressed={state === d.id}
                    className={`pointer-events-auto flex min-h-[44px] items-center gap-2 rounded-full
                                px-3 text-[14px] transition-colors ${
                                  state === d.id
                                    ? 'font-medium text-sage'
                                    : 'text-ink-soft hover:text-ink'
                                }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-[6px] w-[6px] rounded-full transition-colors ${
                        state === d.id ? 'bg-sage' : 'bg-brass-bright'
                      }`}
                    />
                    {d.label}
                    <span className="sr-only"> — {d.describes}</span>
                  </button>
                </li>
              ))}
              <li aria-hidden="true" className="hidden h-px w-12 bg-line lg:block xl:w-20" />
            </ul>
            {/* Place and light on one line: on a 320px screen the rail wraps
                to four rows, and a second line put the switch below the fold. */}
            <p className="flex flex-wrap items-center justify-center gap-x-1 pb-1
                          text-center text-[13px] text-ink-soft">
              <span>{PROFILE.location}</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setLampOn((v) => !v)}
                aria-pressed={!lampOn}
                className="pointer-events-auto inline-flex min-h-[44px] items-center gap-2 rounded-full
                           px-2 text-[13px] text-ink-soft transition-colors hover:text-ink"
              >
                <span
                  aria-hidden="true"
                  className={`h-[6px] w-[6px] rounded-full transition-colors ${
                    lampOn ? 'bg-brass-bright' : 'bg-line-strong'
                  }`}
                />
                {lampOn ? 'Turn the lamp off' : 'Turn the lamp on'}
              </button>
            </p>
            </div>
            </div>
          </nav>

          {/* The panel sits over the lower frame, and the camera frames the
              selected object in the space left above it. */}
          {state !== 'overview' && (
            <div className="shell pointer-events-auto pb-6 pt-6">
              {/* Plain HTML, so it is readable without the scene. */}
              <div
                ref={panelRef}
                tabIndex={-1}
                role="region"
                aria-label={PANEL_TITLES[state as Picked]}
                className="card mx-auto max-h-[52svh] max-w-[1000px] overflow-y-auto p-5
                           shadow-[0_24px_60px_-30px_rgba(23,32,24,.35)] outline-none sm:p-6"
              >
                <div className="sticky -top-5 z-10 -mx-5 mb-4 flex flex-wrap items-center
                                justify-between gap-3 bg-surface px-5 pb-3 pt-1 sm:-top-6 sm:-mx-6 sm:px-6">
                  <h2 className="text-[20px]">{PANEL_TITLES[state as Picked]}</h2>
                  <button type="button" onClick={backToDesk} className="btn-secondary">
                    <span aria-hidden="true">←</span> Back to desk
                  </button>
                </div>
                {state === 'work' && <WorkPanel />}
                {state === 'success' && <SuccessPanel />}
                {state === 'process' && <ProcessDemo />}
                {state === 'ai' && <AiDemo />}
                {state === 'about' && <AboutPanel />}
                {state === 'note' && <NotePanel value={note} onChange={setNote} />}
                {state === 'contact' && <ContactPanel />}
              </div>
            </div>
          )}
          </div>
        </div>
      </section>
    </>
  );
}
