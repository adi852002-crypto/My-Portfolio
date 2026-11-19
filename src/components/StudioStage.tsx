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
import { TrackPanel } from './TrackPanel';
import { HiringPanel } from './HiringPanel';
import { SuccessPanel } from './SuccessPanel';
import { PANEL_TITLES, type StudioState } from './studio/shots';
import type { SafeBand } from './studio/Scene';
import { PROFILE, TRACKS } from '@/data/site';

const StudioCanvas = dynamic(() => import('./studio/StudioCanvas'), { ssr: false });

type Picked = Exclude<StudioState, 'overview'>;

/* The two tracks come first and are marked primary: they are the choice
   the site is asking a visitor to make, not another room to wander into. */
const DESTINATIONS: { id: Picked; label: string; describes: string; primary?: true }[] = [
  { id: 'startups',   label: 'For startups',   primary: true,
    describes: 'the green board in the sorter — streamline, then make the team AI-ready' },
  { id: 'enterprise', label: 'For enterprise', primary: true,
    describes: 'the cream board in the sorter — hand over a process and have someone own it' },
  { id: 'hiring',  label: 'For recruiters', primary: true,
    describes: 'the printed CV — open to senior operations and transformation roles' },
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
  /* The room opens in daylight, the way the photographs it is measured
     against are lit. A visitor who switched the lamp on gets the evening
     room back — the inline script in the document head has already
     applied it, so this only has to agree. */
  const [lampOn, setLampOn] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem('lamp') === 'on') setLampOn(true);
    } catch { /* private mode, or storage blocked: daylight is the default */ }
  }, []);

  /* Which request the AI walk-through should start on. A sticky note sets
     it before opening the panel; the panel's own switcher takes over after
     that, so nothing here is sticky beyond the first run. */
  const [aiSample, setAiSample] = useState<number | null>(null);

  const pointer = useRef({ x: 0, y: 0 });
  const boxRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);

  /* On a phone the rail is one row that scrolls sideways. Faded edges alone
     did not say so — past "For recruiters" all that showed was a sliver of a
     dot, and seven of the ten destinations went unseen. A small arrow at
     each end that has more says it plainly, and a tap moves the row on. */
  const railRef = useRef<HTMLUListElement>(null);
  const [railMore, setRailMore] = useState({ left: false, right: false });
  const syncRail = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const left = el.scrollLeft > 4;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setRailMore((m) => (m.left === left && m.right === right ? m : { left, right }));
  }, []);
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    syncRail();
    const ro = new ResizeObserver(syncRail);
    ro.observe(el);
    el.addEventListener('scroll', syncRail, { passive: true });
    return () => { ro.disconnect(); el.removeEventListener('scroll', syncRail); };
  }, [syncRail, state]);
  const nudgeRail = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: reduced ? 'auto' : 'smooth' });
  };

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
    try { localStorage.setItem('lamp', lampOn ? 'on' : 'off'); } catch { /* not essential */ }
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
      const fade = fadeRef.current?.getBoundingClientRect();
      const gap = Math.min(28, hero.height * 0.035);

      /* In the corner layout the copy claims only the top-left block, so
         the desk may rise to just under the header everywhere else. The
         camera is given that block and keeps whatever projects into its
         columns below it. Stacked, the copy spans the width and its bottom
         edge is simply the top of the band, as before. */
      const corner = state === 'overview' && intro
        && window.matchMedia('(min-width: 768px) and (orientation: landscape)').matches;
      const header = Math.min(96, hero.height * 0.12);
      const top = corner
        ? header / hero.height
        : state === 'overview' && intro
          ? (intro.bottom - hero.top + gap) / hero.height
          : 0.1;
      const copy = corner && intro
        ? {
            left: Math.max(0, (intro.left - hero.left - gap) / hero.width),
            right: Math.min(1, (intro.right - hero.left + gap) / hero.width),
            bottom: (intro.bottom - hero.top + gap) / hero.height,
          }
        : undefined;
      /* Over the rail the room fades out to the flat page colour. The upper
         part of that fade is still mostly room, so the desk's front edge may
         settle into it — that is what the fade is for. Only its lower half,
         where it is close to opaque, is off limits. With a panel open the
         rail is hidden, so the panel's own top is the limit. */
      const floor = state === 'overview' && fade && fade.height
        ? fade.top + fade.height * 0.45
        : foot ? foot.top - gap : hero.bottom;
      const bottom = (floor - hero.top) / hero.height;
      safe.current = {
        top: Math.min(0.55, Math.max(0, top)),
        bottom: Math.max(0.45, Math.min(1, bottom)),
        copy,
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
    /* Switching from one panel to another (startups ↔ enterprise) keeps the
       original trigger: the control that did the switching lives inside the
       panel being replaced, so there would be nothing to return focus to. */
    const from = trigger ?? (document.activeElement as HTMLElement | null);
    if (!from || !panelRef.current?.contains(from)) lastTrigger.current = from;
    setState(id);
  }, []);

  /* Focus goes back to whatever opened the panel — but only once the desk
     is showing again. The rail is display:none while a panel is open, so
     focusing its button in the same tick as the state change did nothing,
     and keyboard users were dropped at the top of the page. */
  const restoreFocus = useRef(false);
  const backToDesk = useCallback(() => {
    restoreFocus.current = true;
    setState('overview');
  }, []);
  useEffect(() => {
    if (state !== 'overview' || !restoreFocus.current) return;
    restoreFocus.current = false;
    const el = lastTrigger.current;
    const id = requestAnimationFrame(() => el?.focus?.({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, [state]);

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
      alt="A pale oak desk: an open laptop at the centre, a monitor behind and to the right with three handwritten notes stuck to its edge, a tablet on a stand to the left, a framed photograph, a green notebook, a card in a wooden holder, a phone, a mug, a brass lamp and a small plant."
      width={1280} height={900} fetchPriority="high"
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
              /* On every pointer type now. They were hidden on touch to keep
                 a small screen clear, but they are how a still desk says its
                 objects open — and a tap on one opens it directly. */
              showMarkers
              safe={safe}
              note={note}
              lampOn={lampOn}
              onNote={(sample) => { setAiSample(sample); open('ai'); }}
              onLamp={() => setLampOn((v) => !v)}
              active={active}
              onLost={() => setCrashed(true)}
            />
          )}
        </div>

        {/* A soft wash of the page colour behind the copy. The desk now
            stands in a room — a wall, a window, a view — and copy set
            straight onto a photograph-like scene loses its contrast
            wherever the scene is busy. Stacked, the wash runs across the
            top; in the corner it is a glow from the top-left. It fades
            out well before the desk, so the picture keeps its depth. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-[58%] corner:hidden"
          style={{
            opacity: state === 'overview' ? 1 : 0,
            transition: 'opacity 300ms ease',
            background: 'linear-gradient(to bottom, rgb(var(--ivory) / 0.92) 0%,'
              + ' rgb(var(--ivory) / 0.8) 55%, rgb(var(--ivory) / 0) 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[5] hidden corner:block"
          style={{
            opacity: state === 'overview' ? 1 : 0,
            transition: 'opacity 300ms ease',
            background: 'radial-gradient(58% 62% at 0% 0%, rgb(var(--ivory) / 0.9) 0%,'
              + ' rgb(var(--ivory) / 0.72) 45%, rgb(var(--ivory) / 0) 100%)',
          }}
        />

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
            aria-hidden={state !== 'overview'}
            className="shell pt-[clamp(5.25rem,9vh,6.5rem)] text-center transition-opacity mid:pt-[4.75rem]
                       corner:pt-[clamp(5.25rem,11vh,7.5rem)] corner:text-left short:pt-[4.25rem]
                       duration-200 ease-soft"
            style={{ opacity: state === 'overview' ? 1 : 0 }}
          >
            {/* The block the camera keeps the desk clear of. Measured as a
                box, not a line: in the corner it only claims the top left,
                and the desk is free to rise beside it. */}
            <div ref={introRef} className="corner:w-fit">
            {intro}

            {/* The choice the page is asking a visitor to make, directly
                under the line that sets it up. Both open the same panel
                the boards in the sorter open, so the copy and the desk
                never say different things. */}
            {/* Always side by side: stacked, the pair cost a phone 52px that
                the desk needed. A 320px screen fits them with a slightly
                smaller label. */}
            <div className="mx-auto mt-4 flex w-fit flex-row items-center gap-2
                            sm:gap-3 mid:mt-3 corner:mx-0 corner:mt-5 short:mt-2.5">
              {TRACKS.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={(e) => open(t.id, e.currentTarget)}
                  tabIndex={state === 'overview' ? 0 : -1}
                  className={`pointer-events-auto inline-flex min-h-[44px] items-center justify-center
                              gap-2 whitespace-nowrap rounded-full border px-5 text-[15px] font-medium
                              transition-colors phone:px-4 tiny:gap-1.5 tiny:px-3 tiny:text-[14px]
                              short:min-h-[38px] short:px-4 short:text-[13.5px] ${
                                i === 0
                                  ? 'border-sage bg-sage text-ink-invert hover:bg-sage-hover'
                                  /* The outline button carries the room's own colour
                                     behind its label, so it reads as a button over
                                     whatever the desk is doing behind it. */
                                  : 'border-line-strong bg-ivory/75 text-ink backdrop-blur-[2px] hover:border-sage hover:text-sage'
                              }`}
                >
                  {t.label}
                  <span aria-hidden="true">→</span>
                  <span className="sr-only"> — {t.promise}</span>
                </button>
              ))}
            </div>
            </div>
          </div>

          {/* The navigation rail, centred on a hairline. Always visible, on
              every pointer type, so the destinations are discoverable
              without hunting the scene. */}
          <div ref={footRef} className="mt-auto">
          <nav
            aria-label="Explore the desk"
            className={`relative pb-5 pt-14 sm:pb-9 sm:pt-20 mid:pb-4 corner:pb-3 corner:pt-14 short:pb-2 short:pt-8
                        ${state === 'overview' ? '' : 'hidden'}`}
          >
            {/* The desk runs to the bottom of the frame, so without this the
                rail would sit on pale oak with the objects showing through.
                The room fades out over the padding above the rail, and
                everything from the rail down is the flat page colour — ivory
                in the lit room, daylight white with the lamp off — so the
                labels always read against a clean field. */}
            <div
              ref={fadeRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b
                         from-transparent to-ivory sm:h-20 corner:h-14 short:h-8"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 top-14 bg-ivory sm:top-20 corner:top-14 short:top-8"
            />
            <div className="relative shell">
            {/* Said in words, once, just above the controls: the desk is not
                a picture of a desk. */}
            <p className="mb-1.5 flex items-center justify-center gap-2 text-center text-[13px]
                          text-ink-soft short:hidden">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-brass"
                   fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {fine
                  ? <path d="M5 3l14 8-6 2-3 6-5-16z" />
                  : <><path d="M9 11V5a2 2 0 1 1 4 0v6" /><path d="M13 9a2 2 0 1 1 4 0v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-1.5-2.5a1.7 1.7 0 0 1 2.8-1.9L9 14" /></>}
              </svg>
              <span className="phone:hidden">
                Everything on this desk is interactive — {fine ? 'click' : 'tap'} any object to open it
              </span>
              <span className="hidden phone:inline">
                {fine ? 'Click' : 'Tap'} anything on the desk — it all opens
              </span>
            </p>
            <div className="relative mx-auto w-fit px-2 py-1 sm:px-0 sm:py-0 phone:-mx-5 phone:w-auto
                            phone:px-0 short:w-auto">
            {/* One row from a laptop width up. The hairlines that used to sit
                either side of it are gone: the shell stops at 1320px, so on
                every screen they pushed "Contact" onto a second row, and that
                row cost the desk 44px of height.
                On a phone, upright or sideways, the row scrolls sideways
                instead of wrapping: wrapped, it was four rows deep and took a
                third of the screen, and the desk had nowhere left to stand. */}
            <ul ref={railRef} className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0 lg:gap-x-0.5
                           phone:pointer-events-auto phone:rail-scroll phone:flex-nowrap
                           phone:justify-start phone:px-4 short:pointer-events-auto short:rail-scroll
                           short:flex-nowrap short:justify-start">
              {DESTINATIONS.map((d) => (
                <li key={d.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={(e) => open(d.id, e.currentTarget)}
                    aria-pressed={state === d.id}
                    className={`pointer-events-auto flex min-h-[44px] items-center gap-2 whitespace-nowrap
                                rounded-full px-3 text-[14px] transition-colors lg:px-2.5 short:gap-1.5 short:px-2
                                short:text-[13px] ${
                                  d.primary
                                    ? `border font-medium ${
                                        state === d.id
                                          ? 'border-sage bg-sage text-ink-invert'
                                          : 'border-sage/50 text-sage hover:border-sage hover:bg-sage-soft'
                                      }`
                                    : state === d.id
                                      ? 'font-medium text-sage'
                                      : 'text-ink-soft hover:text-ink'
                                }`}
                  >
                    {!d.primary && (
                      <span
                        aria-hidden="true"
                        className={`h-[6px] w-[6px] rounded-full transition-colors ${
                          state === d.id ? 'bg-sage' : 'bg-brass-bright'
                        }`}
                      />
                    )}
                    {d.label}
                    <span className="sr-only"> — {d.describes}</span>
                  </button>
                </li>
              ))}
            </ul>
            {/* Pointer affordances only: the buttons in the row are all in the
                tab order and focusing one scrolls it into view, so these are
                hidden from assistive tech and from the keyboard. */}
            {([['left', -1, 'M15 18l-6-6 6-6'], ['right', 1, 'M9 18l6-6-6-6']] as const).map(([side, dir, d]) =>
              railMore[side] && (
                <button
                  key={side}
                  type="button"
                  aria-hidden="true"
                  tabIndex={-1}
                  onClick={() => nudgeRail(dir)}
                  className={`pointer-events-auto absolute top-1 z-10 flex h-11 w-9 items-center justify-center
                              text-ink-soft ${side === 'left' ? 'left-0 pl-1' : 'right-0 pr-1'}`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line-strong
                                   bg-ivory/90 shadow-sm">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor"
                         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
                  </span>
                </button>
              ))}
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
            <div className="shell pointer-events-auto pb-6 pt-6 short:pb-3 short:pt-3">
              {/* Plain HTML, so it is readable without the scene. */}
              <div
                ref={panelRef}
                tabIndex={-1}
                role="region"
                aria-label={PANEL_TITLES[state as Picked]}
                // sideways on a phone there is no scene to protect, so the panel takes the room
                className="card mx-auto max-h-[52svh] max-w-[1000px] overflow-y-auto p-5
                           shadow-[0_24px_60px_-30px_rgba(23,32,24,.35)] outline-none
                           sm:p-6 short:max-h-[76svh] short:p-4"
              >
                <div className="sticky -top-5 z-10 -mx-5 mb-4 flex flex-wrap items-center
                                justify-between gap-3 bg-surface px-5 pb-3 pt-1 sm:-top-6 sm:-mx-6 sm:px-6">
                  <h2 className="text-[20px]">{PANEL_TITLES[state as Picked]}</h2>
                  <button type="button" onClick={backToDesk} className="btn-secondary">
                    <span aria-hidden="true">←</span> Back to desk
                  </button>
                </div>
                {(state === 'startups' || state === 'enterprise') && (
                  <TrackPanel id={state} onSwitch={(to) => open(to)} />
                )}
                {state === 'work' && <WorkPanel />}
                {state === 'success' && <SuccessPanel />}
                {state === 'process' && <ProcessDemo />}
                {state === 'ai' && <AiDemo seed={aiSample} />}
                {state === 'about' && <AboutPanel />}
                {state === 'note' && <NotePanel value={note} onChange={setNote} />}
                {state === 'contact' && <ContactPanel />}
                {state === 'hiring' && <HiringPanel />}
              </div>
            </div>
          )}
          </div>
        </div>
      </section>
    </>
  );
}
