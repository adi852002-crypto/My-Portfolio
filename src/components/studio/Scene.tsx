'use client';

/* The Transformation Desk — real WebGL geometry, built procedurally.

   No downloaded models, no HDR environment map, no image textures except
   the desk portrait, which is the supplied likeness.

   World scale: 1 unit = 1 metre. The desk top is 1.80 × 0.76 m and sits at
   y = 0.745; every object on it is modelled at its real size, so a 13-inch
   laptop is 0.30 m wide and a 24-inch monitor is 0.53 m wide.

   Composition, in order of weight: the laptop is the focal point just off
   centre, the monitor sits behind and to its right, the tablet reads to the
   left, and the personal objects — portrait, notebook, mug, plant — fill in
   around them at smaller scale.

   The studio is suggested rather than built. The ground fades to the page
   colour inside the frame, so the scene needs no mask or white haze over
   the furniture to hide a rectangular edge. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, RoundedBox, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  laptopPainter, monitorPainter, tabletPainter, phonePainter,
  workCoverPainter, cardPainter, trackBoardPainter, cvSheetPainter,
  stickyNotePainter, STICKY_NOTES, type StickyNote,
  notebookCanvas, drawNotebook, oakGrainCanvas, steamCanvas, type Painter,
} from './textures';
import { CAMERA_SHOTS, FOV, MOBILE_SHOTS, type StudioState } from './shots';
import { Room, WIN, WALL_Z } from './Room';
import { HIRING, PROFILE, TRACKS, WORK } from '@/data/site';

/* ---------- materials ---------- */
const OAK = '#D2BE9B';          // pale, lightly desaturated
const OAK_EDGE = '#BFA986';
const OAK_LEG = '#C3AE89';
const GRAPHITE = '#3A403D';     // satin, never pure black
const SILVER = '#C4C8C4';
const SILVER_DARK = '#A8ADA9';
const SAGE_UPH = '#6E7F5E';
const SAGE_DEEP = '#5A6A4C';
const CERAMIC = '#FFFEFA';
const BRASS = '#B89961';
const LEAF_DARK = '#4E6B46';
const LEAF_MID = '#6B8459';
const LEAF_LIGHT = '#879D6F';
const SOIL = '#4A4338';

const DESK_TOP = 0.745;

/* ---------- helpers ---------- */

function useCanvasTexture(factory: () => Painter) {
  const painter = useMemo(factory, [factory]);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(painter.canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [painter]);

  useFrame(({ clock }) => {
    painter.draw(clock.elapsedTime);
    texture.needsUpdate = true;
  });

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function useStillTexture(factory: () => HTMLCanvasElement, repeat?: [number, number]) {
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(factory());
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    if (repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeat[0], repeat[1]);
    }
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

type Pickable = { onPick: () => void; lit: boolean };

/** A hairline of brass behind the glass, so the selected device is
    unmistakable without tinting what is on its screen. */
function Rim({ w, h, show }: { w: number; h: number; show: boolean }) {
  if (!show) return null;
  return (
    <mesh position={[0, 0, -0.0004]} raycast={() => null}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={BRASS} toneMapped={false} />
    </mesh>
  );
}

/** A sheet of glass over a screen. Thin, barely rough, and reflective
    enough to pick up the window — which is what stops a screen reading as
    a printed sticker. */
function Glass({ w, h, z = 0.0012 }: { w: number; h: number; z?: number }) {
  return (
    <mesh position={[0, 0, z]} raycast={() => null}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial
        transparent
        opacity={0.07}
        roughness={0.06}
        metalness={0.9}
        envMapIntensity={1.6}
        color="#FFFFFF"
      />
    </mesh>
  );
}

/* A laptop keyboard, laid out row by row the way a real one is and drawn
   in a single instanced mesh, so 60-odd keys cost one draw call. */
const KEY_UNIT = 0.0182;
const KEY_GAP = 0.0022;
const KEY_ROWS: { z: number; depth: number; units: number[] }[] = [
  { z: -0.0455, depth: 0.0092, units: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  { z: -0.0325, depth: 0.0152, units: [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5] },
  { z: -0.0165, depth: 0.0152, units: [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25] },
  { z: -0.0005, depth: 0.0152, units: [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75] },
  { z: 0.0155, depth: 0.0152, units: [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25] },
];

function Keyboard() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const keys = useMemo(() => {
    const out: { x: number; z: number; w: number; d: number }[] = [];
    for (const row of KEY_ROWS) {
      const width = row.units.reduce((a, b) => a + b, 0) * KEY_UNIT;
      let x = -width / 2;
      for (const u of row.units) {
        const w = u * KEY_UNIT;
        out.push({ x: x + w / 2, z: row.z, w: w - KEY_GAP, d: row.depth });
        x += w;
      }
    }
    return out;
  }, []);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3();
    keys.forEach((k, i) => {
      pos.set(k.x, 0, k.z);
      scale.set(k.w, 0.0022, k.d);
      m.compose(pos, q, scale);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [keys]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, keys.length]} castShadow raycast={() => null}>
      <boxGeometry />
      <meshStandardMaterial color="#444945" roughness={0.62} metalness={0.08} envMapIntensity={0.5} />
    </instancedMesh>
  );
}

const hover = {
  onPointerOver: () => { document.body.style.cursor = 'pointer'; },
  onPointerOut: () => { document.body.style.cursor = ''; },
};

/* ---------- desk ---------- */

function Desk() {
  const grain = useStillTexture(oakGrainCanvas, [2.2, 1]);
  const edge = useStillTexture(oakGrainCanvas, [0.5, 0.08]);
  return (
    <group>
      {/* slim top, softly rounded corners, bevelled edge */}
      <RoundedBox
        args={[1.82, 0.036, 0.78]} radius={0.014} smoothness={8}
        position={[0, DESK_TOP - 0.018, 0]} castShadow receiveShadow
      >
        <meshStandardMaterial map={grain} roughness={0.45} metalness={0.02} envMapIntensity={0.3} />
      </RoundedBox>

      {/* a shallow apron with one integrated drawer, instead of a pedestal */}
      <RoundedBox
        args={[1.68, 0.072, 0.62]} radius={0.014} smoothness={5}
        position={[0, DESK_TOP - 0.072, -0.03]} castShadow
      >
        <meshStandardMaterial map={edge} color="#C9B390" roughness={0.58} envMapIntensity={0.45} />
      </RoundedBox>
      <mesh position={[0.4, DESK_TOP - 0.072, 0.272]}>
        <planeGeometry args={[0.46, 0.056]} />
        <meshStandardMaterial color="#CDB894" roughness={0.62} envMapIntensity={0.5} />
      </mesh>
      <mesh position={[0.4, DESK_TOP - 0.072, 0.276]} castShadow>
        <boxGeometry args={[0.13, 0.008, 0.008]} />
        <meshStandardMaterial color={BRASS} roughness={0.42} metalness={0.55} />
      </mesh>

      {/* four slim tapered legs, very slightly splayed */}
      {([[-0.78, -0.3, 0.035, 0.012], [0.78, -0.3, -0.035, 0.012],
         [-0.78, 0.3, 0.035, -0.012], [0.78, 0.3, -0.035, -0.012]] as const)
        .map(([x, z, tiltZ, tiltX], i) => (
          <mesh key={i} position={[x, 0.355, z]} rotation={[tiltX, 0, tiltZ]} castShadow>
            <cylinderGeometry args={[0.016, 0.027, 0.71, 18]} />
            <meshStandardMaterial color={OAK_LEG} roughness={0.55} />
          </mesh>
        ))}
    </group>
  );
}

/* ---------- laptop → Selected work (the focal point) ---------- */

function Laptop({ onPick, lit }: Pickable) {
  const tex = useCanvasTexture(laptopPainter);
  const W = 0.305, D = 0.215;            // 13-inch
  return (
    <group position={[0.02, DESK_TOP, 0.07]} rotation={[0, 0.07, 0]}>
      <RoundedBox args={[W, 0.016, D]} radius={0.005} smoothness={4}
                  position={[0, 0.008, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={SILVER} roughness={0.3} metalness={0.72} envMapIntensity={1.25} />
      </RoundedBox>
      {/* the milled well the keys sit in */}
      <mesh position={[0, 0.0158, -0.0225]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.262, 0.108]} />
        <meshStandardMaterial color="#2B302D" roughness={0.82} metalness={0.05} envMapIntensity={0.35} />
      </mesh>
      <group position={[0, 0.0166, -0.0225]}>
        <Keyboard />
      </group>
      {/* trackpad, a shade brighter than the deck and very slightly inset */}
      <mesh position={[0, 0.0157, 0.0585]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.102, 0.066]} />
        <meshStandardMaterial color="#B6BBB7" roughness={0.3} metalness={0.42} envMapIntensity={1.1} />
      </mesh>

      {/* lid, open to about 105° */}
      <group position={[0, 0.015, -D / 2]} rotation={[-0.26, 0, 0]}>
        <RoundedBox args={[W, 0.202, 0.007]} radius={0.005} smoothness={4}
                    position={[0, 0.101, 0]} castShadow>
          <meshStandardMaterial color={SILVER_DARK} roughness={0.32} metalness={0.72} envMapIntensity={1.2} />
        </RoundedBox>
        <group position={[0, 0.101, 0.005]}>
          <mesh onClick={(e) => { e.stopPropagation(); onPick(); }} {...hover}>
            <planeGeometry args={[0.283, 0.178]} />
            <meshBasicMaterial map={tex} toneMapped={false} color={lit ? '#FFF6E6' : '#FFFFFF'} />
          </mesh>
          <Rim w={0.291} h={0.186} show={lit} />
          <Glass w={0.3} h={0.195} />
        </group>
      </group>
    </group>
  );
}

/* ---------- monitor → AI in action (behind and right, smaller) ---------- */

function Monitor({ onPick, lit, reduced, onNote }: Pickable & { reduced: boolean; onNote: (i: number) => void }) {
  const tex = useCanvasTexture(monitorPainter);
  const W = 0.48, H = 0.285;             // 22-inch, sat low on its stand
  return (
    <group position={[0.38, DESK_TOP, -0.24]} rotation={[0, -0.3, 0]}>
      <mesh position={[0, 0.008, 0.035]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.014, 0.12]} />
        <meshStandardMaterial color={GRAPHITE} roughness={0.38} metalness={0.55} envMapIntensity={1.1} />
      </mesh>
      <mesh position={[0, 0.082, 0.012]} rotation={[0.1, 0, 0]} castShadow>
        <boxGeometry args={[0.033, 0.155, 0.018]} />
        <meshStandardMaterial color={GRAPHITE} roughness={0.36} metalness={0.6} envMapIntensity={1.15} />
      </mesh>

      {/* notes stuck along the left edge of the panel */}
      {NOTE_PLACES.map((place, i) => (
        <StickyNoteMesh key={place.seed} note={STICKY_NOTES[i]} seed={place.seed}
                        reduced={reduced} position={place.position} rotation={place.rotation}
                        onOpen={() => onNote(STICKY_NOTES[i].sample)} />
      ))}

      <group position={[0, 0.30, -0.004]} rotation={[-0.05, 0, 0]}>
        <RoundedBox args={[W, H, 0.016]} radius={0.007} smoothness={4} castShadow>
          <meshStandardMaterial color={GRAPHITE} roughness={0.42} metalness={0.35} envMapIntensity={0.9} />
        </RoundedBox>
        <group position={[0, 0.006, 0.0105]}>
          <mesh onClick={(e) => { e.stopPropagation(); onPick(); }} {...hover}>
            <planeGeometry args={[W - 0.022, H - 0.03]} />
            <meshBasicMaterial map={tex} toneMapped={false} color={lit ? '#FFF6E6' : '#FFFFFF'} />
          </mesh>
          <Rim w={W - 0.014} h={H - 0.022} show={lit} />
          <Glass w={W - 0.014} h={H - 0.022} />
        </group>
      </group>
    </group>
  );
}

/* A note stuck to the edge of the monitor. Paper, so it is lit like paper,
   with a little lift so it still reads on the dark side of the screen. */
function StickyNoteMesh({
  note, seed, position, rotation, size = 0.068, reduced, onOpen,
}: {
  note: StickyNote; seed: number;
  position: [number, number, number]; rotation: number; size?: number; reduced: boolean;
  onOpen: () => void;
}) {
  const [reading, setReading] = useState(false);
  const painter = useMemo(() => stickyNotePainter(note, seed), [note, seed]);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(painter.canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    painter.draw(1);
    return t;
  }, [painter]);
  useEffect(() => () => texture.dispose(), [texture]);

  const group = useRef<THREE.Group>(null);
  const written = useRef(1);     // how much of the writing is showing
  const lifted = useRef(0);      // how far the note has come off the bezel

  /* Picking a note up rewrites it: the strokes go on a little at a time,
     the way they would if someone were writing it in front of you. */
  const pick = () => {
    if (reduced) { written.current = 1; painter.draw(1); texture.needsUpdate = true; return; }
    written.current = 0;
    painter.draw(0);
    texture.needsUpdate = true;
  };

  useFrame((_, delta) => {
    if (written.current < 1) {
      written.current = Math.min(1, written.current + delta / 1.15);
      painter.draw(written.current);
      texture.needsUpdate = true;
    }
    const want = written.current < 1 ? 1 : 0;
    lifted.current += (want - lifted.current) * Math.min(1, delta * 7);
    if (group.current) {
      group.current.position.z = position[2] + lifted.current * 0.014;
      const s = 1 + lifted.current * 0.07;
      group.current.scale.set(s, s, 1);
    }
  });

  return (
    <group ref={group} position={position} rotation={[0, 0, rotation]}>
      {/* What the note says, on the one surface where it can be read: a
          label beside it. The paper itself stays handwriting, because at
          this size on a monitor bezel that is what it would be. */}
      {reading && (
        <Html position={[size * 0.72, 0, 0.01]} center zIndexRange={[28, 10]} wrapperClass="pointer-events-none">
          <span className="pointer-events-none block w-max max-w-[15rem] rounded-md border border-line
                           bg-surface/95 px-2 py-1 text-left text-[12px] leading-snug text-ink shadow-sm">
            {note.ask}
            <span className="mt-0.5 block text-[11px] text-ink-soft">Open the walk-through</span>
          </span>
        </Html>
      )}
      {/* A slightly larger invisible target in front of the paper, so a
          finger lands on the note it was aiming at. Kept under a quarter
          bigger, which is the most it can grow without reaching the note
          above or below. */}
      <mesh
        position={[0, 0, 0.0008]}
        onClick={(e) => { e.stopPropagation(); setReading(false); pick(); onOpen(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; setReading(true); pick(); }}
        onPointerOut={() => { document.body.style.cursor = ''; setReading(false); }}
      >
        <planeGeometry args={[size * 1.22, size * 1.22]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh
        castShadow
        onClick={(e) => { e.stopPropagation(); setReading(false); pick(); onOpen(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; setReading(true); pick(); }}
        onPointerOut={() => { document.body.style.cursor = ''; setReading(false); }}
      >
        <boxGeometry args={[size, size, 0.0012]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.95}
          metalness={0}
          envMapIntensity={0.5}
          emissive={note.colour}
          emissiveIntensity={0.14}
        />
      </mesh>
    </group>
  );
}

const NOTE_PLACES: { seed: number; position: [number, number, number]; rotation: number }[] = [
  { seed: 17, position: [-0.258, 0.372, 0.0105], rotation: 0.07 },
  { seed: 43, position: [-0.268, 0.296, 0.0105], rotation: -0.05 },
  { seed: 91, position: [-0.252, 0.221, 0.0105], rotation: 0.1 },
];

/* ---------- tablet on a folio stand → Process & CRM ---------- */

function Tablet({ onPick, lit }: Pickable) {
  const tex = useCanvasTexture(tabletPainter);
  const W = 0.248, H = 0.172;
  return (
    <group position={[-0.56, DESK_TOP, -0.03]} rotation={[0, 0.36, 0]}>
      {/* folio flap behind, so the tablet leans on something */}
      <mesh position={[0, 0.062, -0.052]} rotation={[0.42, 0, 0]} castShadow>
        <boxGeometry args={[W - 0.02, 0.14, 0.008]} />
        <meshStandardMaterial color={GRAPHITE} roughness={0.74} />
      </mesh>
      <mesh position={[0, 0.005, 0.012]} castShadow receiveShadow>
        <boxGeometry args={[W, 0.01, 0.07]} />
        <meshStandardMaterial color={GRAPHITE} roughness={0.74} />
      </mesh>

      <group position={[0, 0.093, -0.016]} rotation={[-0.33, 0, 0]}>
        <RoundedBox args={[W, H, 0.009]} radius={0.008} smoothness={5} castShadow>
          <meshStandardMaterial color={GRAPHITE} roughness={0.4} metalness={0.4} envMapIntensity={1.0} />
        </RoundedBox>
        <group position={[0, 0, 0.0062]}>
          <mesh onClick={(e) => { e.stopPropagation(); onPick(); }} {...hover}>
            <planeGeometry args={[W - 0.016, H - 0.016]} />
            <meshBasicMaterial map={tex} toneMapped={false} color={lit ? '#FFF6E6' : '#FFFFFF'} />
          </mesh>
          <Rim w={W - 0.008} h={H - 0.008} show={lit} />
          <Glass w={W - 0.008} h={H - 0.008} />
        </group>
      </group>
    </group>
  );
}

/* ---------- the card, in its holder → Contact ----------------------------
   The holder is a solid of oak with a sawn slot across it and a brass
   inlay running the length of the cut, so the card stands in the slot at
   a slight lean rather than lying flat where nobody would read it.
   ------------------------------------------------------------------------ */

function CardHolder({ onPick, lit }: Pickable) {
  const tex = useCanvasTexture(useMemo(() => () => cardPainter({
    name: PROFILE.name,
    role: 'Operations & Transformation',
    email: PROFILE.email,
    phone: PROFILE.phone,
    place: PROFILE.location,
  }), []));
  const W = 0.085, H = 0.055;          // 85 x 55 mm
  return (
    /* Beside the phone, where a card actually lives: both routes to him
       sit in one view, and neither crowds the laptop. */
    <group position={[0.155, DESK_TOP, 0.198]} rotation={[0, 0.2, 0]}>
      {/* the block */}
      <RoundedBox args={[0.12, 0.026, 0.05]} radius={0.006} smoothness={4}
                  position={[0, 0.013, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={OAK_EDGE} roughness={0.6} envMapIntensity={0.5} />
      </RoundedBox>
      {/* the sawn slot, and the brass inlay along it */}
      <mesh position={[0, 0.0262, -0.004]} rotation={[-0.14, 0, 0]}>
        <boxGeometry args={[0.1, 0.004, 0.009]} />
        <meshStandardMaterial color="#2C2518" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.0274, 0.012]}>
        <boxGeometry args={[0.108, 0.0016, 0.004]} />
        <meshStandardMaterial color={BRASS} roughness={0.26} metalness={0.9} envMapIntensity={1.3} />
      </mesh>

      {/* the card itself, leaning back in the slot */}
      <group position={[0, 0.026, -0.004]} rotation={[-0.19, 0, 0]}>
        <mesh position={[0, H / 2, 0]} castShadow
              onClick={(e) => { e.stopPropagation(); onPick(); }} {...hover}>
          <boxGeometry args={[W, H, 0.0008]} />
          <meshStandardMaterial map={tex} roughness={0.82} envMapIntensity={0.55}
                                 emissive={lit ? BRASS : '#000000'}
                                 emissiveIntensity={lit ? 0.2 : 0} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------- phone on a stand → Contact -----------------------------------
   A phone the size of a real one, 71 x 147 mm, leaning back on a small
   aluminium stand. Its screen is the card you would hand someone.
   ------------------------------------------------------------------------ */

function Phone({ onPick, lit }: Pickable) {
  const tex = useCanvasTexture(phonePainter);
  const W = 0.071, H = 0.147, T = 0.008;
  const lean = 0.3;
  return (
    <group position={[0.235, DESK_TOP, 0.155]} rotation={[0, -0.16, 0]}>
      {/* stand: a wedge with a lip for the phone to sit in */}
      <mesh position={[0, 0.005, -0.004]} castShadow receiveShadow>
        <boxGeometry args={[0.085, 0.01, 0.062]} />
        <meshStandardMaterial color={SILVER_DARK} roughness={0.34} metalness={0.7} envMapIntensity={1.1} />
      </mesh>
      <mesh position={[0, 0.021, -0.024]} rotation={[-lean, 0, 0]} castShadow>
        <boxGeometry args={[0.03, 0.062, 0.008]} />
        <meshStandardMaterial color={SILVER_DARK} roughness={0.34} metalness={0.7} envMapIntensity={1.1} />
      </mesh>
      <mesh position={[0, 0.013, 0.024]} castShadow>
        <boxGeometry args={[0.072, 0.012, 0.009]} />
        <meshStandardMaterial color={SILVER_DARK} roughness={0.34} metalness={0.7} envMapIntensity={1.1} />
      </mesh>

      <group position={[0, 0.014, 0.019]} rotation={[-lean, 0, 0]}>
        <RoundedBox args={[W, H, T]} radius={0.009} smoothness={5} position={[0, H / 2, 0]} castShadow>
          <meshStandardMaterial color={GRAPHITE} roughness={0.36} metalness={0.55} envMapIntensity={1.1} />
        </RoundedBox>
        <group position={[0, H / 2, T / 2 + 0.0008]}>
          <mesh onClick={(e) => { e.stopPropagation(); onPick(); }} {...hover}>
            <planeGeometry args={[W - 0.007, H - 0.009]} />
            <meshBasicMaterial map={tex} toneMapped={false} color={lit ? '#FFF6E6' : '#FFFFFF'} />
          </mesh>
          <Rim w={W - 0.002} h={H - 0.004} show={lit} />
          <Glass w={W - 0.003} h={H - 0.005} />
        </group>
      </group>
    </group>
  );
}

/* ---------- framed portrait → About -------------------------------------
   The photograph is the supplied likeness, cropped to head and shoulders
   and printed onto an ivory card. It is a flat print inside a frame, which
   is what a desk photo is, so no model is implied.
   ------------------------------------------------------------------------ */

function PortraitFrame({ onPick, lit }: Pickable) {
  /* The same photograph the About panel opens on, so the frame and the
     panel agree. */
  const photo = useLoader(THREE.TextureLoader, '/about/office.webp');
  photo.colorSpace = THREE.SRGBColorSpace;
  photo.anisotropy = 8;

  /* A 5×7 frame, big enough that the face reads from the overview, and
     tall enough to clear the boards in front of it in the close-up. */
  const W = 0.13, H = 0.17;
  return (
    <group position={[-0.31, DESK_TOP, -0.27]} rotation={[0, 0.34, 0]}>
      <group position={[0, H / 2 + 0.012, 0]} rotation={[-0.1, 0, 0]}>
        <RoundedBox args={[W, H, 0.012]} radius={0.004} smoothness={4} castShadow>
          <meshStandardMaterial color={OAK_EDGE} roughness={0.56} />
        </RoundedBox>
        <mesh position={[0, 0, 0.0072]}>
          <planeGeometry args={[W - 0.015, H - 0.015]} />
          <meshStandardMaterial color="#FBF8F0" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.003, 0.0078]}
              onClick={(e) => { e.stopPropagation(); onPick(); }} {...hover}>
          <planeGeometry args={[W - 0.03, (W - 0.03) * 5 / 4]} />
          <meshStandardMaterial map={photo} roughness={0.56} envMapIntensity={0.4}
                                 emissive={lit ? BRASS : '#000000'}
                                 emissiveIntensity={lit ? 0.22 : 0} />
        </mesh>
        {/* strut, so the frame stands rather than floats */}
        <mesh position={[0, -H / 2 + 0.012, -0.028]} rotation={[0.46, 0, 0]} castShadow>
          <boxGeometry args={[0.022, 0.082, 0.005]} />
          <meshStandardMaterial color="#B49B74" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------- props: notebook, mug, lamp, chair ---------- */

function Notebook({ note, onPick, lit }: Pickable & { note: string }) {
  const canvas = useMemo(notebookCanvas, []);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [canvas]);
  useEffect(() => () => texture.dispose(), [texture]);
  useEffect(() => {
    drawNotebook(canvas, note);
    texture.needsUpdate = true;
  }, [canvas, note, texture]);
  const tex = texture;

  return (
    <group position={[0.56, DESK_TOP, 0.15]} rotation={[0, -0.2, 0]}>
      {/* open book: a block of paper with a soft spine ridge */}
      <RoundedBox args={[0.3, 0.014, 0.21]} radius={0.003} smoothness={3}
                  position={[0, 0.007, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#F6F2E7" roughness={0.95} />
      </RoundedBox>
      <mesh position={[0, 0.0145, 0]} rotation={[-Math.PI / 2, 0, 0]}
            onClick={(e) => { e.stopPropagation(); onPick(); }} {...hover}>
        <planeGeometry args={[0.29, 0.2]} />
        <meshStandardMaterial map={tex} roughness={0.96}
                               emissive={lit ? BRASS : '#000000'}
                               emissiveIntensity={lit ? 0.16 : 0} />
      </mesh>
      <mesh position={[0, 0.0152, 0]}>
        <boxGeometry args={[0.004, 0.002, 0.2]} />
        <meshStandardMaterial color="#D8D2C2" roughness={0.95} />
      </mesh>
      {/* pen laid across the page */}
      <mesh position={[0.012, 0.0205, 0.074]} rotation={[0, -0.1, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0042, 0.0034, 0.125, 12]} />
        <meshStandardMaterial color={SAGE_DEEP} roughness={0.38} metalness={0.15} />
      </mesh>
      <mesh position={[0.074, 0.0205, 0.068]} rotation={[0, -0.1, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0036, 0.0036, 0.022, 12]} />
        <meshStandardMaterial color={BRASS} roughness={0.34} metalness={0.6} />
      </mesh>
    </group>
  );
}

function WorkBook({ onPick, lit }: Pickable) {
  const rows = useMemo(() => WORK.map((w) => ({ name: w.name, dates: w.dates.split(' · ')[0] })), []);
  const tex = useCanvasTexture(useMemo(() => () => workCoverPainter(rows), [rows]));
  return (
    <group position={[-0.655, DESK_TOP, 0.085]} rotation={[0, 0.3, 0]}>
      <RoundedBox args={[0.2, 0.021, 0.145]} radius={0.005} smoothness={4}
                  position={[0, 0.0105, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={SAGE_DEEP} roughness={0.82} />
      </RoundedBox>
      {/* the cover, with the years blocked on it */}
      <mesh position={[0, 0.0212, 0]} rotation={[-Math.PI / 2, 0, 0]}
            onClick={(e) => { e.stopPropagation(); onPick(); }} {...hover}>
        <planeGeometry args={[0.19, 0.136]} />
        <meshStandardMaterial map={tex} roughness={0.84} envMapIntensity={0.5}
                               emissive={lit ? BRASS : '#000000'}
                               emissiveIntensity={lit ? 0.07 : 0} />
      </mesh>
      <mesh position={[0, 0.0105, 0]}>
        <boxGeometry args={[0.196, 0.013, 0.141]} />
        <meshStandardMaterial color="#F1ECDE" roughness={0.95} />
      </mesh>
      {/* The pen rests on the desk in front of the book, not across the
          cover, where it would lie over the years it is meant to mark. */}
      <mesh position={[0.004, 0.0042, 0.096]} rotation={[0, 0.08, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0042, 0.0034, 0.125, 12]} />
        <meshStandardMaterial color="#2E3330" roughness={0.36} metalness={0.2} />
      </mesh>
      <mesh position={[0.056, 0.0042, 0.1]} rotation={[0, 0.08, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0036, 0.0036, 0.022, 12]} />
        <meshStandardMaterial color={BRASS} roughness={0.34} metalness={0.6} />
      </mesh>
    </group>
  );
}

/* ---------- The file sorter: the two tracks, standing up --------------
   The two doors into the work are the only thing on this desk a visitor
   has to choose between, so they are one object with two boards in it —
   a sorter you would actually keep by the laptop. Each board is its own
   destination; the tabs read from across the room. */
function TrackSorter({ onPick, lit }: {
  onPick: (id: 'startups' | 'enterprise') => void;
  lit: 'startups' | 'enterprise' | null;
}) {
  const boards = useMemo(() => TRACKS.map((t, i) => ({
    id: t.id as 'startups' | 'enterprise',
    painter: trackBoardPainter(
      { tab: t.tab, audience: t.audience, promise: t.promise, bullets: [...t.gets] },
      i === 0 ? 'sage' : 'cream',
    ),
  })), []);

  const W = 0.128, H = 0.094;            // the boards, a little over A6
  return (
    <group position={[-0.295, DESK_TOP, 0.195]} rotation={[0, 0.17, 0]}>
      {/* the oak base, with two sawn slots */}
      <RoundedBox args={[0.3, 0.024, 0.062]} radius={0.006} smoothness={4}
                  position={[0, 0.012, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={OAK_EDGE} roughness={0.62} envMapIntensity={0.5} />
      </RoundedBox>
      {[-0.077, 0.077].map((x) => (
        <mesh key={x} position={[x, 0.0245, -0.003]} rotation={[-0.12, 0, 0]}>
          <boxGeometry args={[0.136, 0.004, 0.01]} />
          <meshStandardMaterial color="#2C2518" roughness={0.9} />
        </mesh>
      ))}
      {/* a brass rule along the front, the same hand as the card holder */}
      <mesh position={[0, 0.0255, 0.026]}>
        <boxGeometry args={[0.286, 0.0016, 0.004]} />
        <meshStandardMaterial color={BRASS} roughness={0.26} metalness={0.9} envMapIntensity={1.3} />
      </mesh>

      {boards.map((b, i) => (
        <group key={b.id} position={[i === 0 ? -0.077 : 0.077, 0.024, -0.003]}
               rotation={[-0.17, 0, 0]}>
          {/* the board itself — card stock, lit like paper; the printed
              face in front of it is unlit so the type keeps its contrast */}
          <mesh position={[0, H / 2, 0]} castShadow
                onClick={(e) => { e.stopPropagation(); onPick(b.id); }} {...hover}>
            <boxGeometry args={[W, H, 0.0022]} />
            <meshStandardMaterial color={i === 0 ? '#44553A' : '#E8E2D2'}
                                  roughness={0.92} envMapIntensity={0.4} />
          </mesh>
          <BoardFace painter={b.painter} w={W} h={H} lit={lit === b.id}
                     onPick={() => onPick(b.id)} />
        </group>
      ))}
    </group>
  );
}

/* The printed face of a board, unlit like the screens so the type keeps
   its contrast whichever way the lamp is pointing. */
function BoardFace({ painter, w, h, lit, onPick }: {
  painter: Painter; w: number; h: number; lit: boolean; onPick: () => void;
}) {
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(painter.canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    painter.draw(1);
    return t;
  }, [painter]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group position={[0, h / 2, 0.0013]}>
      <mesh onClick={(e) => { e.stopPropagation(); onPick(); }} {...hover}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} color={lit ? '#FFF6E6' : '#FFFFFF'} />
      </mesh>
      <Rim w={w + 0.004} h={h + 0.004} show={lit} />
    </group>
  );
}

/* ---------- The printed CV, lying in front of the keyboard -----------
   The one object a recruiter is looking for. A single sheet with a brass
   clip, left where a printout gets left. */
function CvSheet({ onPick, lit }: Pickable) {
  const rows = useMemo(
    () => WORK.slice(0, 4).map((w) => ({ name: w.name, dates: w.dates })),
    [],
  );
  const tex = useCanvasTexture(useMemo(
    () => () => cvSheetPainter(PROFILE.name, PROFILE.role, HIRING.promise, rows),
    [rows],
  ));
  const W = 0.19, H = 0.134;
  return (
    /* Left of the work notebook, where the desk is clear. In front of the
       laptop it was legible but it pushed the whole composition back, and
       a smaller desk is a worse trade than a page a little off-centre. */
    <group position={[-0.80, DESK_TOP, 0.07]} rotation={[0, -0.13, 0]}>
      {/* the sheet, a hair off the oak so it casts its own shadow */}
      <mesh position={[0, 0.0012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow
            onClick={(e) => { e.stopPropagation(); onPick(); }} {...hover}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={tex} roughness={0.93} envMapIntensity={0.45}
                               emissive={lit ? BRASS : '#000000'}
                               emissiveIntensity={lit ? 0.07 : 0} />
      </mesh>
      {/* the paper has a thickness, or it reads as a decal on the desk */}
      <mesh position={[0, 0.0006, 0]} castShadow>
        <boxGeometry args={[W, 0.0011, H]} />
        <meshStandardMaterial color="#EFEADC" roughness={0.95} />
      </mesh>
      {/* a brass clip over the top-left corner */}
      <group position={[-W / 2 + 0.026, 0.0024, -H / 2 + 0.016]} rotation={[0, 0.14, 0]}>
        <mesh castShadow>
          <torusGeometry args={[0.0085, 0.0011, 8, 20, Math.PI * 1.35]} />
          <meshStandardMaterial color={BRASS} roughness={0.3} metalness={0.85} envMapIntensity={1.2} />
        </mesh>
        <mesh position={[0, 0, 0.002]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.0056, 0.0009, 8, 18, Math.PI * 1.5]} />
          <meshStandardMaterial color={BRASS} roughness={0.3} metalness={0.85} envMapIntensity={1.2} />
        </mesh>
      </group>
    </group>
  );
}

/* Steam off the coffee: a few soft blobs rising, widening and fading, each
   on its own clock. It stops entirely under reduced motion. */
function Steam({ reduced }: { reduced: boolean }) {
  const map = useStillTexture(steamCanvas);
  const puffs = useRef<THREE.Mesh[]>([]);
  const SEEDS = useMemo(() => [0, 0.33, 0.66, 0.16, 0.5, 0.83], []);

  useFrame(({ clock, camera }) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    puffs.current.forEach((m, i) => {
      if (!m) return;
      const life = (t * 0.22 + SEEDS[i]) % 1;
      const rise = life * 0.17;
      m.position.y = 0.01 + rise;
      /* Each puff leans its own way and wanders more the higher it gets,
         so the column breaks up instead of reading as a vertical smear. */
      const lean = (SEEDS[i] - 0.5) * 2;
      m.position.x = (Math.sin((life + SEEDS[i]) * 5.3) * 0.5 + lean) * 0.034 * life * life;
      m.position.z = Math.cos((life + SEEDS[i] * 2) * 4.1) * 0.02 * life;
      const spread = (0.026 + SEEDS[i] * 0.012) + life * 0.085;
      m.scale.set(spread, spread, spread);
      /* face the camera, so it reads as vapour from every destination
         rather than a card that turns edge-on as the view swings */
      m.quaternion.copy(camera.quaternion);
      const mat = m.material as THREE.MeshBasicMaterial;
      /* fade in off the surface, then away as it spreads */
      mat.opacity = Math.min(life * 6, 1) * Math.max(0, 1 - life) ** 1.3 * 0.9;
    });
  });

  if (reduced) return null;
  return (
    <group position={[0.64, DESK_TOP + 0.086, 0.095]}>
      {SEEDS.map((_, i) => (
        <mesh
          key={i}
          ref={(m) => { if (m) puffs.current[i] = m; }}
          raycast={() => null}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={map}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function Mug() {
  return (
    <group position={[0.64, DESK_TOP, 0.095]}>
      <mesh position={[0, 0.048, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.037, 0.031, 0.084, 28]} />
        <meshStandardMaterial color={CERAMIC} roughness={0.36} metalness={0} envMapIntensity={0.85} />
      </mesh>
      <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.031, 24]} />
        <meshStandardMaterial color="#5E4B38" roughness={0.26} />
      </mesh>
      <mesh position={[0.047, 0.051, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.019, 0.0045, 10, 20, Math.PI * 1.25]} />
        <meshStandardMaterial color={CERAMIC} roughness={0.36} metalness={0} envMapIntensity={0.85} />
      </mesh>
      {/* a small cork coaster, so the mug sits on something */}
      <mesh position={[0, 0.003, 0]} receiveShadow>
        <cylinderGeometry args={[0.048, 0.048, 0.006, 28]} />
        <meshStandardMaterial color="#C8AE86" roughness={0.9} />
      </mesh>
    </group>
  );
}

/* The arm reaches in over the desk, not out past its edge: the shade ends
   up above the mug, which is where the warm pool falls. */
function Lamp({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <group
      position={[0.79, DESK_TOP, -0.03]} rotation={[0, 0.44, 0]} scale={0.78}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      {...hover}
    >
      {/* weighted base */}
      <mesh position={[0, 0.009, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.058, 0.064, 0.018, 28]} />
        <meshStandardMaterial color={BRASS} roughness={0.26} metalness={0.92} envMapIntensity={1.35} />
      </mesh>
      {/* post */}
      <mesh position={[0, 0.185, 0]} castShadow>
        <cylinderGeometry args={[0.0085, 0.0095, 0.35, 16]} />
        <meshStandardMaterial color={BRASS} roughness={0.24} metalness={0.92} envMapIntensity={1.35} />
      </mesh>
      {/* arm reaching out over the desk */}
      <mesh position={[-0.1, 0.358, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0085, 0.0085, 0.21, 16]} />
        <meshStandardMaterial color={BRASS} roughness={0.24} metalness={0.92} envMapIntensity={1.35} />
      </mesh>
      {/* shade, hanging down at the end of the arm */}
      <group position={[-0.2, 0.312, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.082, 28, 1, true]} />
          <meshStandardMaterial color={BRASS} roughness={0.22} metalness={0.92}
                                 envMapIntensity={1.4}
                                 emissive={on ? '#8A6228' : '#000000'}
                                 emissiveIntensity={on ? 0.95 : 0}
                                 side={THREE.FrontSide} />
        </mesh>
        {/* the inside of the shade, which is what you actually see glowing */}
        <mesh>
          <cylinderGeometry args={[0.0385, 0.0385, 0.08, 28, 1, true]} />
          <meshBasicMaterial color={on ? '#FFDFA8' : '#6A6456'} toneMapped={false} side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, 0.041, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.04, 24]} />
          <meshStandardMaterial color={BRASS} roughness={0.36} metalness={0.6} />
        </mesh>
        <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.038, 24]} />
          <meshBasicMaterial color="#FFE9C0" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/* Pulled out and turned, the way a chair is left when someone has just
   stood up — tucked squarely in front of the desk it read, from the low
   camera, as a green block under the desk's front edge. */
function Chair() {
  return (
    <group position={[-0.42, 0, 0.92]} rotation={[0, 0.62, 0]}>
      <RoundedBox args={[0.46, 0.1, 0.44]} radius={0.05} smoothness={6} position={[0, 0.43, 0]} castShadow>
        <meshStandardMaterial color={SAGE_UPH} roughness={0.96} />
      </RoundedBox>
      <RoundedBox args={[0.42, 0.33, 0.095]} radius={0.046} smoothness={6}
                  position={[0, 0.63, -0.17]} rotation={[0.19, 0, 0]} castShadow>
        <meshStandardMaterial color={SAGE_UPH} roughness={0.96} />
      </RoundedBox>
      <mesh position={[0, 0.26, 0]} castShadow>
        <cylinderGeometry args={[0.027, 0.027, 0.38, 14]} />
        <meshStandardMaterial color={SILVER_DARK} roughness={0.34} metalness={0.7} envMapIntensity={1.1} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.15, 0.055, Math.sin(a) * 0.15]}
                rotation={[0, -a, 0]} castShadow>
            <boxGeometry args={[0.3, 0.026, 0.04]} />
            <meshStandardMaterial color={SILVER_DARK} roughness={0.34} metalness={0.7} envMapIntensity={1.1} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ---------- plant: real leaves on curved stems ---------------------------
   A leaf is a closed bezier outline extruded a fraction of a millimetre,
   so it is a smooth shape with a soft edge rather than a faceted blob.
   Stems are tubes along short curves. Everything is deterministic.
   ------------------------------------------------------------------------ */

function leafGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.34, 0.1, 0.78, 0.26, 1, 0);
  s.bezierCurveTo(0.78, -0.26, 0.34, -0.1, 0, 0);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.012, bevelEnabled: true, bevelThickness: 0.01,
    bevelSize: 0.012, bevelSegments: 2, curveSegments: 20,
  });
  g.translate(0, 0, -0.006);
  return g;
}

type Leaf = {
  stem: [number, number, number][];
  tilt: number; spin: number; size: number; tone: number;
};

const LEAVES: Leaf[] = (() => {
  let s = 90210;
  const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  return Array.from({ length: 13 }, (_, i) => {
    const a = (i / 13) * Math.PI * 2 + rand() * 0.5;
    const reach = 0.1 + rand() * 0.085;
    const rise = 0.13 + rand() * 0.13;
    return {
      stem: [
        [0, 0, 0],
        [Math.cos(a) * reach * 0.3, rise * 0.55, Math.sin(a) * reach * 0.3],
        [Math.cos(a) * reach, rise, Math.sin(a) * reach],
      ] as [number, number, number][],
      tilt: -0.35 - rand() * 0.5,
      spin: a,
      size: 0.075 + rand() * 0.045,
      tone: rand(),
    };
  });
})();

function Plant({ reduced }: { reduced: boolean }) {
  const geo = useMemo(leafGeometry, []);
  useEffect(() => () => geo.dispose(), [geo]);

  /* A slow sway, as if in the draught from the window: two small rotations
     out of step with each other, so it never reads as a loop. */
  const crown = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (reduced || !crown.current) return;
    const t = clock.getElapsedTime();
    crown.current.rotation.z = Math.sin(t * 0.55) * 0.022 + Math.sin(t * 1.31) * 0.008;
    crown.current.rotation.x = Math.sin(t * 0.42 + 1.3) * 0.016;
  });

  const stems = useMemo(
    () => LEAVES.map((l) => new THREE.CatmullRomCurve3(l.stem.map((p) => new THREE.Vector3(...p)))),
    [],
  );

  return (
    <group position={[-0.82, DESK_TOP, -0.17]}>
      {/* matte warm-white ceramic pot */}
      <mesh position={[0, 0.056, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.062, 0.05, 0.112, 32]} />
        <meshStandardMaterial color={CERAMIC} roughness={0.72} metalness={0} envMapIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.108, 0]}>
        <cylinderGeometry args={[0.063, 0.063, 0.008, 32]} />
        <meshStandardMaterial color="#F4F0E6" roughness={0.86} />
      </mesh>
      {/* The soil sits a millimetre above the rim's top face. At exactly the
          same height the two surfaces fought for the same pixels and the
          pot's top showed as black and white wedges. */}
      <mesh position={[0, 0.113, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.055, 28]} />
        <meshStandardMaterial color={SOIL} roughness={1} />
      </mesh>

      <group ref={crown} position={[0, 0.112, 0]}>
        {LEAVES.map((l, i) => {
          const tip = l.stem[2];
          const tone = l.tone < 0.34 ? LEAF_DARK : l.tone < 0.7 ? LEAF_MID : LEAF_LIGHT;
          return (
            <group key={i}>
              <mesh castShadow>
                <tubeGeometry args={[stems[i], 10, 0.0042, 7, false]} />
                <meshStandardMaterial color="#5E7049" roughness={0.78} />
              </mesh>
              <group position={tip} rotation={[0, -l.spin, 0]}>
                <mesh rotation={[l.tilt, 0, 0]} scale={[l.size, l.size * 0.62, l.size]} castShadow>
                  <primitive object={geo} attach="geometry" />
                  <meshStandardMaterial
                    color={tone}
                    roughness={0.62}
                    metalness={0}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              </group>
            </group>
          );
        })}
      </group>
    </group>
  );
}

/* ---------- camera rig ---------- */

/* The band of the frame the page leaves free, as fractions of the hero
   height, measured live from the DOM: below the introduction and above
   the navigation rail or the open panel. */
/** The free band of the frame, as fractions of its height (0 = top). With
    the copy in a corner, `copy` is that block (fractions of width and
    height): the desk may rise to `top` beside it, but only to `copy.bottom`
    in the columns it covers. */
export type SafeBand = {
  top: number;
  bottom: number;
  copy?: { left: number; right: number; bottom: number };
};

const UP_Y = new THREE.Vector3(0, 1, 0);

function CameraRig({
  state, pointer, reduced, safe,
}: {
  state: StudioState;
  pointer: React.RefObject<{ x: number; y: number }>;
  reduced: boolean;
  safe: React.RefObject<SafeBand>;
}) {
  const { camera, size } = useThree();
  /* The close framing is for a narrow window, not merely a tall one: a
     tablet held upright has the width to show the whole desk, and cropping
     it there loses half the objects for no reason. */
  const portrait = size.width < 640;
  const shots = portrait ? MOBILE_SHOTS : CAMERA_SHOTS;

  const target = useRef(new THREE.Vector3(...shots.overview.target));
  const shot = useRef(shots.overview);

  /* Scratch objects, so the per-frame maths allocates nothing. */
  const wantPos = useRef(new THREE.Vector3());
  const wantTarget = useRef(new THREE.Vector3());
  const dir = useRef(new THREE.Vector3());
  const probe = useRef(new THREE.Vector3());
  const fwd = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3());
  const scratch = useRef(new THREE.PerspectiveCamera());

  /* The top of the monitor, which is the highest thing that carries
     anything to read. The plant is deliberately not here: a leaf reaching
     up past the copy looks like a room, and holding the whole plant below
     the text would shrink the desk for nothing. */
  /* Both top corners, not just the middle of the top edge. The monitor is
     turned towards the laptop, so its far (left) corner sits further back
     and projects higher on screen than the centre does — measuring only the
     centre let that corner slide under the buttons. Worked out from the
     Monitor group below: stand at (0.38, DESK_TOP, -0.24) turned -0.3 rad,
     panel 0.48 × 0.285 centred 0.30 up and tilted back 0.05 rad. The top
     sticky note is here too, for the same reason. */
  const PEAKS: [number, number, number][] = [
    [0.38, 1.19, -0.24],
    [0.154, 1.19, -0.322],
    [0.613, 1.19, -0.18],
    [0.13, 1.152, -0.306],
  ];

  /* And the front edge of the three objects nearest the viewer — the work
     notebook, the card holder and the open notebook — where they meet the
     desk. The rail's band is opaque, so anything that falls below the band
     is not dimmed, it is gone. These keep the front row in the picture. */
  const FRONTS: [number, number, number][] = [
    [-0.295, DESK_TOP, 0.235],
    [-0.655, DESK_TOP, 0.18],
    [0.155, DESK_TOP, 0.235],
    [0.56, DESK_TOP, 0.235],
  ];

  /* For the whole-desk framing on a portrait screen. The desk top is
     1.82 × 0.78 m centred on the origin; the plant stands at its left end
     with leaves arching out past it, the lamp at its right. */
  const SIDES: [number, number, number][] = [
    [-0.91, DESK_TOP, 0.39], [0.91, DESK_TOP, 0.39],
    [-0.91, DESK_TOP, -0.39], [0.91, DESK_TOP, -0.39],
    [-1.03, 1.0, -0.17],                       // outermost plant leaf
    [0.86, DESK_TOP + 0.02, -0.03],            // lamp base
  ];
  /* The outermost things on the desk that open something, with a little
     margin: the left edge of the CV, the plant beside it, the lamp's base
     and the notebook's right edge. */
  const SIDES_OPEN: [number, number, number][] = [
    [-0.93, DESK_TOP, 0.12], [-0.93, DESK_TOP, -0.05],
    [0.88, DESK_TOP + 0.02, -0.03], [0.7, DESK_TOP, 0.24],
  ];
  /* On a phone the plant is not allowed above the copy: the copy is centred
     and narrow, so a leaf there sits across the words. */
  const PEAKS_PORTRAIT: [number, number, number][] = [
    [-0.82, 1.22, -0.17],
  ];
  /* The whole desk means its front edge too, not just the front row — and
     pulled back this far, its legs and the chair are in the picture as
     well. Centring only the top left the desk sitting low with an empty
     band of dark above it, so the feet of the front legs count too and the
     whole piece of furniture is centred. */
  const DESK_FRONT: [number, number, number][] = [
    [-0.91, DESK_TOP, 0.39], [0.91, DESK_TOP, 0.39],
  ];
  /* These only decide where the desk sits, never how small it gets: if the
     legs do not fit as well, the desktop is pinned under the copy and the
     legs run on into the fade over the rail. */
  const LEG_FEET: [number, number, number][] = [
    [-0.79, 0, 0.3], [0.79, 0, 0.3],
  ];

  /* The tops of everything else, so nothing on the desk slides under the
     corner copy: the plant's crown and its outermost leaf, the lamp's head,
     the photograph, the tablet and the sorter boards. */
  const TOPS: [number, number, number][] = [
    [-1.0, 1.06, -0.17],
    [0.79, 1.07, -0.03],
    [-0.33, 1.0, -0.24],
    [-0.56, 0.99, -0.04],
    [-0.3, 0.9, 0.19],
  ];

  /* Recompute the destination from the shot and the band the page leaves
     free. The object is centred in that band and pulled back enough to
     fill it, so the desk never sits under the headline or the panel. */
  const solve = () => {
    const band = safe.current ?? { top: 0, bottom: 1 };
    const height = Math.min(1, Math.max(0.3, band.bottom - band.top));
    const centre = (band.top + band.bottom) / 2 - 0.5;

    const s = shot.current;
    wantTarget.current.set(...s.target);
    dir.current.set(...s.position).sub(wantTarget.current);

    /* The overview keeps its distance whatever the window shape: the desk is
       meant to run past both edges, so it slides down the frame rather than
       shrinking. A close-up does pull back when the band is tight, enough to
       fit the object between the copy and the panel, but never so far that
       it stops being a close-up. */
    /* A close-up should fill about seven tenths of the band, not all of it,
       so the object keeps a margin above the panel and below the header.
       The shots frame their object at roughly 0.55 of a full frame. */
    const fit = state === 'overview'
      ? 1
      : Math.min(1.8, Math.max(1, 0.62 / height));
    const baseDistance = dir.current.length();
    dir.current.normalize();

    const fov = (camera as THREE.PerspectiveCamera).fov ?? FOV;

    /* Sliding the picture up or down the frame has to leave its size alone,
       or the desk shrinks every time the copy needs more room. Moving the
       camera and its target along world Y would do that — the camera ends
       up further from the desk. Moving them along the camera's own up
       vector instead keeps the distance exactly, so the composition only
       ever changes size when it is deliberately pulled back below. */
    fwd.current.copy(dir.current).negate();
    right.current.crossVectors(fwd.current, UP_Y);
    /* Straight down there is no "up" to speak of and the cross product
       collapses; no shot is that steep, but a NaN here would take the whole
       camera with it. */
    if (right.current.lengthSq() < 1e-6) right.current.set(1, 0, 0);
    right.current.normalize();
    up.current.crossVectors(right.current, fwd.current).normalize();

    const aspect = Math.max(0.2, size.width / Math.max(1, size.height));
    /* `slideX` moves the picture sideways the same way `slide` moves it up
       and down — along the camera's own axes, so the size is untouched. */
    const place = (d: number, slide: number, slideX = 0) => {
      const seen = 2 * d * Math.tan((fov * Math.PI) / 360);
      wantTarget.current.set(...s.target)
        .addScaledVector(up.current, slide * seen)
        .addScaledVector(right.current, slideX * seen * aspect);
      wantPos.current.copy(dir.current).multiplyScalar(d).add(wantTarget.current);
      return seen;
    };

    let distance = baseDistance * fit;
    let slide = centre;
    let slideX = 0;
    let visible = place(distance, slide);

    /* On the overview, confirm it by projecting the composition: the tallest
       things in the scene must stay clear of the copy, and the front row of
       objects must stay clear of the rail's band, which is opaque — anything
       below it is not dimmed, it is gone. If both cannot hold at this size
       the camera pulls back until they can, then the whole picture is
       centred in what the page has left free. */
    if (state !== 'overview') return;

    const cam = scratch.current;
    cam.fov = fov;
    cam.aspect = aspect;
    cam.near = 0.05;
    cam.far = 40;

    const screenY = (p: [number, number, number]) => {
      probe.current.set(...p).project(cam);
      return (1 - probe.current.y) / 2;        // 0 is the top of the frame
    };
    const screenX = (p: [number, number, number]) => {
      probe.current.set(...p).project(cam);
      return (probe.current.x + 1) / 2;        // 0 is the left edge
    };

    /* The desk is the picture, on every screen: all of it, plant to lamp,
       as large as the page allows. On a phone that is the width; on a wide
       screen it is usually the height between the header and the rail,
       less the corner the copy sits in. The camera pulls back or comes
       closer until the composition just fits, then centres it. */
    const portraitFrame = size.width < size.height;
    /* Of the width: a phone keeps a few pixels either side; a wide screen
       keeps real air round the desk, so it reads as an object in a room
       rather than a band across the window. */
    const WIDTH_FILL = portraitFrame ? 0.94 : 0.92;
    /* A phone shows the whole desk, corners and all. A wide screen frames
       like the photographs it is measured against: the devices large, the
       desk running on to the edges of the frame — but never so far that
       anything that opens is cut, so it fits the outermost objects that
       open (the CV, the notebook, the lamp) rather than the desk's corners. */
    const sides = portraitFrame ? SIDES : SIDES_OPEN;

    /* A little more air than the geometry strictly needs: the monitor's
       top corner sitting a hair under the buttons reads as a collision
       even when it is not one. The pointer drift below moves the camera a
       few centimetres after this has run; the margin absorbs that too. */
    const TOP = band.top + 0.045;
    const BOTTOM = band.bottom - 0.01;
    const room = Math.max(0.12, BOTTOM - TOP);
    const copy = band.copy;
    const MAX_PULL = baseDistance * 4;
    const MIN_PULL = baseDistance * 0.5;
    const peaks = PEAKS.concat(PEAKS_PORTRAIT, TOPS);
    const fronts = FRONTS.concat(DESK_FRONT);

    for (let pass = 0; pass < 18; pass++) {
      cam.position.copy(wantPos.current);
      cam.up.set(0, 1, 0);
      cam.lookAt(wantTarget.current);
      cam.updateMatrixWorld(true);
      cam.updateProjectionMatrix();

      /* `highest` is measured against the limit that applies where each
         point lands: under the corner copy that is the copy's bottom edge,
         anywhere else just under the header. Offsetting each point by the
         difference lets one number stand for both. */
      let highest = 1, lowest = 0, feet = 0, left = 1, rightmost = 0;
      for (const p of peaks) {
        const x = screenX(p);
        const limit = copy && x > copy.left && x < copy.right ? Math.max(TOP, copy.bottom) : TOP;
        highest = Math.min(highest, screenY(p) - (limit - TOP));
      }
      for (const p of fronts) lowest = Math.max(lowest, screenY(p));
      for (const p of LEG_FEET) feet = Math.max(feet, screenY(p));
      for (const p of sides) {
        const x = screenX(p);
        left = Math.min(left, x);
        rightmost = Math.max(rightmost, x);
      }

      const span = lowest - highest;
      const need = Math.max(span / room, (rightmost - left) / WIDTH_FILL);
      if (need > 1.003 && distance < MAX_PULL) {
        distance = Math.min(MAX_PULL, distance * Math.min(1.6, need));
        visible = place(distance, slide, slideX);
        continue;
      }
      if (need < 0.985 && distance > MIN_PULL) {
        distance = Math.max(MIN_PULL, distance * Math.max(0.75, need * 1.002));
        visible = place(distance, slide, slideX);
        continue;
      }
      const dx = (left + rightmost) / 2 - 0.5;

      /* Centre the whole piece of furniture — desk, legs and chair — where
         there is room for all of it; otherwise pin the desk top under the
         copy and let the legs run on into the fade over the rail, which is
         where a cut-off reads as the room going dark rather than as a
         collision. A positive delta means the picture sits too low. */
      const all = Math.max(lowest, feet);
      const delta = all - highest <= room
        ? (highest + all) / 2 - (TOP + BOTTOM) / 2
        : highest - TOP;
      if (Math.abs(delta) < 0.003 && Math.abs(dx) < 0.003) break;
      slide -= delta;
      slideX += dx;
      visible = place(distance, slide, slideX);
    }
  };

  useEffect(() => {
    shot.current = shots[state];
    solve();
    if (reduced) {
      camera.position.copy(wantPos.current);
      target.current.copy(wantTarget.current);
      camera.lookAt(target.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, camera, reduced, shots, size.width, size.height]);

  /* The first arrival: the camera starts further back and higher and
     drifts in to the desk over a couple of seconds, so the room is
     discovered rather than switched on. Skipped with reduced motion, and
     abandoned the moment the visitor opens something. */
  const intro = useRef(true);
  const placed = useRef(false);
  useEffect(() => { if (state !== 'overview') intro.current = false; }, [state]);

  useFrame((_, delta) => {
    solve();                                   // the band can change as the page reflows
    if (!placed.current) {
      placed.current = true;
      if (!reduced) {
        const d = wantPos.current.distanceTo(wantTarget.current);
        camera.position.copy(wantPos.current).addScaledVector(dir.current, d * 0.42);
        camera.position.y += 0.38;
        target.current.copy(wantTarget.current);
      } else {
        intro.current = false;
      }
    }
    if (reduced) {
      camera.position.copy(wantPos.current);
      target.current.copy(wantTarget.current);
      camera.lookAt(target.current);
      return;
    }
    // ~800ms to settle; frame-rate independent, and safe to retarget mid-flight
    if (intro.current && camera.position.distanceTo(wantPos.current) < 0.004) intro.current = false;
    const k = 1 - Math.pow(0.0001, delta / (intro.current ? 2.4 : 0.8));

    const drift = pointer.current ?? { x: 0, y: 0 };
    wantPos.current.x += drift.x * 0.14;
    /* Vertical drift kept small: it is applied after the composition is
       solved, so it is the one thing that can nudge the monitor towards the
       copy. Sideways drift carries the parallax on its own. */
    wantPos.current.y += -drift.y * 0.04;

    camera.position.lerp(wantPos.current, k);
    target.current.lerp(wantTarget.current, k);
    camera.lookAt(target.current);
  });

  return null;
}

/* ---------- hover: everything on the desk answers the pointer ---------- */

type Hovered = string | null;

/** Wraps one object on the desk. Any part of it — not just its screen —
    lifts it a centimetre, names it, and opens it on a click: the whole
    object is the target, which is what "everything on the desk is
    interactive" has to mean in practice. The marker's label shows while
    it is hovered, so the pointer gets a name before it commits. */
function Hoverable({
  id, hovered, setHovered, onPick, reduced, children,
}: {
  id: string;
  hovered: Hovered;
  setHovered: (fn: (h: Hovered) => Hovered) => void;
  onPick?: () => void;
  reduced: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const on = hovered === id;
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const want = on ? 0.011 : 0;
    g.position.y = reduced ? want : g.position.y + (want - g.position.y) * (1 - Math.exp(-dt * 14));
  });
  return (
    <group
      ref={ref}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(() => id);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered((h) => (h === id ? null : h));
        document.body.style.cursor = '';
      }}
      onClick={onPick ? (e) => { e.stopPropagation(); onPick(); } : undefined}
    >
      {children}
    </group>
  );
}

/* ---------- the scene ---------- */

export type SceneProps = {
  state: StudioState;
  onPick: (s: Exclude<StudioState, 'overview'>) => void;
  pointer: React.RefObject<{ x: number; y: number }>;
  reduced: boolean;
  showMarkers: boolean;
  safe: React.RefObject<SafeBand>;
  note: string;
  lampOn: boolean;
  onLamp: () => void;
  /** A sticky note was picked up: open the walk-through on that request. */
  onNote: (sample: number) => void;
};

export default function Scene({
  state, onPick, pointer, reduced, showMarkers, safe, note, lampOn, onLamp, onNote,
}: SceneProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [hovered, setHoveredState] = useState<Hovered>(null);
  const setHovered = (fn: (h: Hovered) => Hovered) => setHoveredState(fn);
  useEffect(() => () => { document.body.style.cursor = ''; }, []);
  const H = { hovered, setHovered, reduced };

  return (
    <>
      <CameraRig state={state} pointer={pointer} reduced={reduced} safe={safe} />

      {/* A studio to reflect. Built here rather than downloaded: a warm
          window up and to the left, a cool bounce from the right and a pale
          floor, baked once into an environment map. Without it the metal,
          glass and ceramic have nothing to mirror and read as plastic. */}
      <Environment key={lampOn ? 'lamp' : 'day'} resolution={256} frames={1} background={false}>
        <mesh scale={30}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshBasicMaterial color={lampOn ? '#20261F' : '#8B8576'} side={THREE.BackSide} />
        </mesh>
        {/* the window */}
        <Lightformer form="rect" intensity={lampOn ? 0.5 : 2.1} color={lampOn ? '#CBD8DE' : '#FFF3DF'}
                     position={[-5, 5, 2]} rotation-y={Math.PI / 3.1} scale={[7, 7, 1]} />
        {/* a softer second pane beside it */}
        <Lightformer form="rect" intensity={lampOn ? 0.22 : 0.85} color={lampOn ? '#D6E0E4' : '#FFF8EC'}
                     position={[-3.4, 3.4, 5]} rotation-y={Math.PI / 5} scale={[4, 5, 1]} />
        {/* cool bounce off the right-hand wall */}
        <Lightformer form="rect" intensity={lampOn ? 0.18 : 0.5} color="#C7D2D8"
                     position={[5.5, 2.6, 1.5]} rotation-y={-Math.PI / 2.6} scale={[6, 5, 1]} />
        {/* the ceiling and the floor, so verticals pick up a gradient */}
        <Lightformer form="rect" intensity={lampOn ? 0.14 : 0.55} color={lampOn ? '#E8E2D2' : '#FBF6EA'}
                     position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={0.06} color="#2C3329"
                     position={[0, -3, 1]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
        {/* the window behind the desk, which screens and metal now face */}
        {!lampOn && (
          <Lightformer form="rect" intensity={1.6} color="#F4F7F6"
                       position={[(WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, WALL_Z - 0.6]}
                       scale={[WIN.x1 - WIN.x0, WIN.y1 - WIN.y0, 1]} />
        )}
        {/* the lamp, as the shiny surfaces see it */}
        {lampOn && (
          <Lightformer form="circle" intensity={2.6} color="#FFD9A2"
                       position={[2.2, 1.2, 1.4]} scale={[1.4, 1.4, 1]} />
        )}
      </Environment>

      {/* one broad daylight from the upper left, a soft fill, and the lamp */}
      <hemisphereLight args={lampOn ? ['#9FB2BC', '#1A211A', 0.3] : ['#FFF8EC', '#CFC6B1', 0.72]} />
      {/* By day the sun comes in through the window behind the desk, from
          the right, so the glazing bars lay soft stripes across the oak and
          the objects cast their shadows towards the viewer — the light every reference photo
          has. At night the room is lit from the front-left as before, and
          the lamp does the rest. Only one of the two casts shadows. */}
      {!lampOn && (
        <directionalLight
          position={[3.6, 4.1, -3.0]}
          intensity={2.6}
          color="#FFF1DC"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-2.6}
          shadow-camera-right={2.6}
          shadow-camera-top={2.6}
          shadow-camera-bottom={-2.6}
          shadow-camera-near={0.5}
          shadow-camera-far={12}
          shadow-bias={-0.0004}
          shadow-normalBias={0.02}
          shadow-radius={4}
        />
      )}
      <directionalLight
        position={[-2.2, 4.4, 1.9]}
        intensity={lampOn ? 0.78 : 0.75}
        color={lampOn ? '#C8D7E0' : '#FFF4E4'}
        castShadow={lampOn}
        shadow-mapSize={[1536, 1536]}
        shadow-camera-left={-2.4}
        shadow-camera-right={2.4}
        shadow-camera-top={2.4}
        shadow-camera-bottom={-2.4}
        shadow-camera-near={0.5}
        shadow-camera-far={9}
        shadow-bias={-0.00035}
        shadow-normalBias={0.012}
      />
      {/* a weak fill from the right so the shaded sides keep their shape */}
      <directionalLight position={[2.6, 1.9, 2.0]} intensity={lampOn ? 0.22 : 0.6}
                        color={lampOn ? '#AFC0C8' : '#F3EEE2'} />
      {/* The lamp is the light in this room: a warm pool under the shade,
          a wider spill across the desk, and darkness beyond its reach. */}
      {lampOn && (
        <>
          <pointLight position={[0.65, 0.93, 0.04]} intensity={2.8} color="#FFD79C" distance={1.5} decay={2} />
          <pointLight position={[0.34, 1.22, 0.3]} intensity={1.5} color="#FFCE93" distance={2.6} decay={2} />
          {/* a cool sliver from the left, so the far side of the desk is not black */}
          <pointLight position={[-1.5, 1.3, 0.8]} intensity={0.8} color="#A6BECB" distance={3.4} decay={2} />
        </>
      )}

      <Room night={lampOn} reduced={reduced} />
      <Desk />
      <Chair />
      <Plant reduced={reduced} />
      <Hoverable id="work" onPick={() => onPick('work')} {...H}>
        <WorkBook lit={state === 'work'} onPick={() => onPick('work')} />
      </Hoverable>
      <Hoverable id="note" onPick={() => onPick('note')} {...H}>
        <Notebook note={note} lit={state === 'note'} onPick={() => onPick('note')} />
      </Hoverable>
      <Hoverable id="hiring" onPick={() => onPick('hiring')} {...H}>
        <CvSheet lit={state === 'hiring'} onPick={() => onPick('hiring')} />
      </Hoverable>
      <Mug />
      <Steam reduced={reduced} />
      <Hoverable id="lamp" onPick={onLamp} {...H}>
        <Lamp on={lampOn} onToggle={onLamp} />
      </Hoverable>

      <Hoverable id="process" onPick={() => onPick('process')} {...H}>
        <Tablet lit={state === 'process'} onPick={() => onPick('process')} />
      </Hoverable>
      <Hoverable id="about" onPick={() => onPick('about')} {...H}>
        <PortraitFrame lit={state === 'about'} onPick={() => onPick('about')} />
      </Hoverable>
      {/* The sorter holds two destinations, so each board answers on its
          own and the sorter itself is not wrapped. */}
      <TrackSorter   lit={state === 'startups' ? 'startups' : state === 'enterprise' ? 'enterprise' : null}
                     onPick={(id) => onPick(id)} />
      <Hoverable id="success" onPick={() => onPick('success')} {...H}>
        <Laptop lit={state === 'success'} onPick={() => onPick('success')} />
      </Hoverable>
      <Hoverable id="ai" onPick={() => onPick('ai')} {...H}>
        <Monitor lit={state === 'ai'} onPick={() => onPick('ai')} reduced={reduced} onNote={onNote} />
      </Hoverable>
      <Hoverable id="contact" onPick={() => onPick('contact')} {...H}>
        <Phone lit={state === 'contact'} onPick={() => onPick('contact')} />
        <CardHolder lit={state === 'contact'} onPick={() => onPick('contact')} />
      </Hoverable>

      {ready && (
        <ContactShadows
          position={[0, 0.001, 0]}
          scale={3.2}
          resolution={1024}
          blur={1.9}
          opacity={0.6}
          far={1.6}
          color={lampOn ? '#060A06' : '#6A5F4C'}
        />
      )}

      {/* Discreet markers anchored to each object. They hide while a panel
          is open so they never sit on top of the content. */}
      {showMarkers && state === 'overview' && (
        <>
          <Marker i={0} active={hovered === 'success'} position={[0.02, 0.965, -0.04]} label="Customer success" onClick={() => onPick('success')} />
          <Marker i={1} position={[-0.37, 0.875, 0.185]} label="For startups"
                  onClick={() => onPick('startups')} />
          <Marker i={2} position={[-0.22, 0.875, 0.212]} label="For enterprise"
                  onClick={() => onPick('enterprise')} />
          <Marker i={3} active={hovered === 'work'} position={[-0.655, 0.8, 0.085]} label="Work history"  onClick={() => onPick('work')} />
          <Marker i={4} active={hovered === 'process'} position={[-0.56, 0.93, -0.04]} label="Process & CRM" onClick={() => onPick('process')} />
          <Marker i={5} active={hovered === 'ai'} position={[0.38, 0.86, -0.24]}  label="AI in action"  onClick={() => onPick('ai')} />
          <Marker i={6} active={hovered === 'about'} position={[-0.33, 0.885, -0.24]} label="About"        onClick={() => onPick('about')} />
          <Marker i={7} active={hovered === 'note'} position={[0.56, 0.80, 0.15]}   label="Leave a note" onClick={() => onPick('note')} />
          <Marker i={8} active={hovered === 'contact'} position={[0.235, 0.93, 0.155]} label="Contact"      onClick={() => onPick('contact')} />
          <Marker i={9} active={hovered === 'hiring'} position={[-0.80, 0.79, 0.07]}  label="For recruiters" onClick={() => onPick('hiring')} />
          {/* The lamp is a control, not a destination, so it is marked as
              one: the same dot, reachable by keyboard, but it opens
              nothing. */}
          <Marker i={10} active={hovered === 'lamp'} position={[0.79, 1.07, -0.03]} kind="lamp"
                  label={lampOn ? 'Turn the lamp off' : 'Turn the lamp on'} onClick={onLamp} />
        </>
      )}
    </>
  );
}

/* A small dot on the object. The name appears on hover or keyboard focus,
   so the scene is not covered in floating pills. The hit area stays 44px. */
function Marker({
  position, label, onClick, kind = '', active = false, i = 0,
}: {
  position: [number, number, number]; label: string; onClick: () => void;
  /** '' for a destination, 'lamp' for the switch, which opens nothing. */
  kind?: '' | 'lamp';
  /** The object it marks is under the pointer: show the name. */
  active?: boolean;
  /** Its place in the stagger of the idle pulse. */
  i?: number;
}) {
  return (
    <Html position={position} center zIndexRange={[30, 10]}>
      <button
        type="button"
        onClick={onClick}
        data-studio-marker={kind}
        data-active={active || undefined}
        className="group pointer-events-auto flex h-11 w-11 items-center justify-center
                   rounded-full bg-transparent focus:outline-none"
      >
        {/* A slow ring that breathes out from each marker in turn, so a
            still frame of the desk still says "these open". Off when the
            visitor has asked for reduced motion. */}
        <span
          aria-hidden="true"
          className="marker-pulse pointer-events-none absolute h-[13px] w-[13px] rounded-full border border-brass-bright"
          style={{ animationDelay: `${(i * 0.37) % 4}s` }}
        />
        <span
          className="relative flex h-[13px] w-[13px] items-center justify-center rounded-full
                     border border-sage/45 bg-surface/90 shadow-[0_1px_4px_rgba(0,0,0,0.18)]
                     transition-all duration-200 ease-soft
                     group-hover:h-[17px] group-hover:w-[17px] group-hover:border-sage
                     group-data-[active]:h-[17px] group-data-[active]:w-[17px] group-data-[active]:border-sage
                     group-focus-visible:h-[17px] group-focus-visible:w-[17px]
                     group-focus-visible:ring-2 group-focus-visible:ring-sage
                     group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-ivory"
          aria-hidden="true"
        >
          <span className="h-[5px] w-[5px] rounded-full bg-brass-bright" />
        </span>
        <span
          className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 translate-y-0.5
                     whitespace-nowrap rounded-md border border-line bg-surface/95 px-2 py-1
                     text-[12px] font-medium text-ink opacity-0 shadow-sm transition-opacity
                     duration-200 group-hover:opacity-100 group-focus-visible:opacity-100
                     group-data-[active]:opacity-100"
        >
          {label}
        </span>
      </button>
    </Html>
  );
}
