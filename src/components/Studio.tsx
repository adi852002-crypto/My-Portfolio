'use client';

/* ------------------------------------------------------------------
   The Transformation Studio scene.

   WHAT THIS IS, honestly: a layered 2.5D scene, not a 3D render.
   No rigged character model (GLB/glTF) exists in this project, so the
   character is a transparent PNG cutout photographed head-on, and the
   room is layered SVG. Movement is limited to whole-layer parallax —
   this is image parallax, NOT skeletal animation. The camera never
   moves around the cutout, so its flat edge is never exposed.

   To replace this with a real 3D studio later, swap the contents of
   <SceneArt/> for a canvas. Everything else — hotspot data, labels,
   keyboard handling, the panel, the fallbacks — is independent of how
   the picture is produced. See README "Replacing the scene".
   ------------------------------------------------------------------ */

import { useCallback, useEffect, useRef, useState } from 'react';
import { HOTSPOTS } from '@/data/site';
import { Icon } from './Icon';

type Props = { onHotspot: (id: string) => void };

/* Scene layers, back to front. Depth is the parallax travel in pixels —
   small on purpose: the brief requires text and hotspots to stay easy to hit.
   Every file is drawn on the same 1200x1000 canvas as the poster. */
const LAYERS = [
  { src: '/scene/back.svg', depth: 4 },
  { src: '/scene/mid.svg', depth: 9 },
  { src: '/scene/character.webp', depth: 14 },
  { src: '/scene/front.svg', depth: 22 },
] as const;

export function Studio({ onHotspot }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [parallax, setParallax] = useState(false);
  const [artFailed, setArtFailed] = useState(false);
  const [layersReady, setLayersReady] = useState(false);
  const loaded = useRef(0);
  const frame = useRef(0);

  /* Swap the poster for the layers only once every layer is decoded,
     so the scene never shows half-drawn or doubled. */
  const countLayer = useCallback(() => {
    loaded.current += 1;
    if (loaded.current >= LAYERS.length) setLayersReady(true);
  }, []);

  /* Parallax only on a fine pointer, only when motion is welcome. */
  useEffect(() => {
    const motionOk = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const enoughCores = (navigator.hardwareConcurrency ?? 4) >= 4;
    setParallax(motionOk && finePointer && enoughCores);
  }, []);

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      if (!parallax || !boxRef.current) return;
      const r = boxRef.current.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => setOffset({ x: nx, y: ny }));
    },
    [parallax],
  );

  const reset = useCallback(() => setOffset({ x: 0, y: 0 }), []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const shift = (depth: number) =>
    parallax
      ? { transform: `translate3d(${-offset.x * depth}px, ${-offset.y * depth * 0.5}px, 0)` }
      : undefined;

  return (
    <div
      ref={boxRef}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className="relative mx-auto w-full max-w-[680px] select-none lg:max-w-none"
      /* Fixed aspect ratio reserves the space before art loads: no CLS. */
      style={{ aspectRatio: '1200 / 1000' }}
    >
      {artFailed ? (
        /* Asset loading failed — the scene is decorative, so say so and move on. */
        <div className="flex h-full items-center justify-center rounded-3xl border border-line bg-surface p-8 text-center">
          <p className="max-w-xs text-sm text-ink-soft">
            The studio illustration could not load. Everything on this page is still
            available below.
          </p>
        </div>
      ) : (
        <>
          {/* Flattened poster. Paints first (good LCP), carries the alt text, and
              is the whole scene on its own if the layers never arrive. It fades
              out once all four layers have loaded so nothing is drawn twice. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/scene/poster.webp"
            alt="An illustrated studio: Aniruddha Dasgupta standing beside a curved oak desk, with a workflow board on the wall, a monitor, a visitor chair and plants."
            width={1200}
            height={1000}
            fetchPriority="high"
            decoding="async"
            onError={() => setArtFailed(true)}
            className="absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ease-soft"
            style={{ opacity: layersReady ? 0 : 1 }}
          />

          {/* Parallax layers. Every layer is drawn on the same 1200x1000 canvas
              as the poster, so object-contain lines them up exactly — no manual
              offsets to drift. Decorative: the poster holds the description. */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-soft"
            style={{ opacity: layersReady ? 1 : 0 }}
            aria-hidden="true"
          >
            {LAYERS.map((layer) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={layer.src}
                src={layer.src}
                alt=""
                width={1200}
                height={1000}
                decoding="async"
                onLoad={countLayer}
                onError={countLayer}
                className="absolute inset-0 h-full w-full object-contain will-change-transform"
                style={shift(layer.depth)}
              />
            ))}
          </div>
        </>
      )}

      {/* Hotspots. Real buttons: keyboard reachable, 44px targets, visible
          labels, never colour alone. Hidden below lg, where the three
          buttons under the scene take over (see StudioButtons). */}
      <div className="absolute inset-0 hidden lg:block">
        {HOTSPOTS.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => onHotspot(h.id)}
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
            className="group absolute flex min-h-[44px] -translate-x-1/2 -translate-y-1/2
                       items-center gap-2 rounded-full border border-line bg-surface/95 px-4
                       py-2 text-left shadow-[0_6px_22px_-10px_rgba(23,32,24,.45)]
                       backdrop-blur-[2px] transition-[transform,border-color] duration-200
                       ease-soft hover:-translate-y-[calc(50%+2px)] hover:border-sage
                       focus-visible:-translate-y-[calc(50%+2px)]"
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full
                         bg-sage-soft text-sage"
              aria-hidden="true"
            >
              <Icon name={h.icon} className="h-4 w-4" />
            </span>
            <span className="whitespace-nowrap text-[13px] font-medium text-ink">
              {h.label}
            </span>
            <span className="sr-only"> — {h.describes}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* Below lg the scene labels would crowd and shrink below a usable target,
   so the same three destinations appear as full-width buttons underneath. */
export function StudioButtons({ onHotspot }: Props) {
  return (
    <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:hidden">
      {HOTSPOTS.map((h) => (
        <button
          key={h.id}
          type="button"
          onClick={() => onHotspot(h.id)}
          className="flex min-h-[44px] items-center gap-2 rounded-full border border-line
                     bg-surface px-4 py-2 text-left transition-colors hover:border-sage"
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full
                       bg-sage-soft text-sage"
            aria-hidden="true"
          >
            <Icon name={h.icon} className="h-4 w-4" />
          </span>
          <span className="text-[13px] font-medium">{h.label}</span>
          <span className="sr-only"> — {h.describes}</span>
        </button>
      ))}
    </div>
  );
}
