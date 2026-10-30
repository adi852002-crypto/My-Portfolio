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
  laptopPainter, monitorPainter, notebookPainter, tabletPainter,
  oakGrainCanvas, floorCanvas, type Painter,
} from './textures';
import { CAMERA_SHOTS, MOBILE_SHOTS, type StudioState } from './shots';

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

/* ---------- ground ---------- */

function Ground() {
  const map = useStillTexture(floorCanvas);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[2.4, 72]} />
      <meshStandardMaterial map={map} transparent roughness={0.97} metalness={0} depthWrite={false} />
    </mesh>
  );
}

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

function Monitor({ onPick, lit }: Pickable) {
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

/* ---------- framed portrait → About -------------------------------------
   The photograph is the supplied likeness, cropped to head and shoulders
   and printed onto an ivory card. It is a flat print inside a frame, which
   is what a desk photo is, so no model is implied.
   ------------------------------------------------------------------------ */

function PortraitFrame({ onPick, lit }: Pickable) {
  const photo = useLoader(THREE.TextureLoader, '/scene/portrait.webp');
  photo.colorSpace = THREE.SRGBColorSpace;
  photo.anisotropy = 8;

  const W = 0.096, H = 0.125;
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
          <planeGeometry args={[W - 0.03, (W - 0.03) * 4 / 3]} />
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

function Notebook() {
  const tex = useCanvasTexture(notebookPainter);
  return (
    <group position={[0.56, DESK_TOP, 0.235]} rotation={[0, -0.2, 0]}>
      {/* open book: a block of paper with a soft spine ridge */}
      <RoundedBox args={[0.3, 0.014, 0.21]} radius={0.003} smoothness={3}
                  position={[0, 0.007, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#F6F2E7" roughness={0.95} />
      </RoundedBox>
      <mesh position={[0, 0.0145, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.29, 0.2]} />
        <meshStandardMaterial map={tex} roughness={0.96} />
      </mesh>
      <mesh position={[0, 0.0152, 0]}>
        <boxGeometry args={[0.004, 0.002, 0.2]} />
        <meshStandardMaterial color="#D8D2C2" roughness={0.95} />
      </mesh>
      {/* pen laid across the page */}
      <mesh position={[0.02, 0.0205, 0.055]} rotation={[0, -0.26, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0042, 0.0034, 0.125, 12]} />
        <meshStandardMaterial color={SAGE_DEEP} roughness={0.38} metalness={0.15} />
      </mesh>
      <mesh position={[0.072, 0.0205, 0.038]} rotation={[0, -0.26, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0036, 0.0036, 0.022, 12]} />
        <meshStandardMaterial color={BRASS} roughness={0.34} metalness={0.6} />
      </mesh>
    </group>
  );
}

function ClosedNotebook() {
  return (
    <group position={[-0.58, DESK_TOP, 0.245]} rotation={[0, 0.24, 0]}>
      <RoundedBox args={[0.2, 0.021, 0.145]} radius={0.005} smoothness={4}
                  position={[0, 0.0105, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={SAGE_DEEP} roughness={0.82} />
      </RoundedBox>
      <mesh position={[0, 0.0105, 0]}>
        <boxGeometry args={[0.196, 0.013, 0.141]} />
        <meshStandardMaterial color="#F1ECDE" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.0255, -0.012]} rotation={[0, 0.1, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0042, 0.0034, 0.125, 12]} />
        <meshStandardMaterial color="#2E3330" roughness={0.36} metalness={0.2} />
      </mesh>
      <mesh position={[0.052, 0.0255, -0.0075]} rotation={[0, 0.1, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0036, 0.0036, 0.022, 12]} />
        <meshStandardMaterial color={BRASS} roughness={0.34} metalness={0.6} />
      </mesh>
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

function Lamp() {
  return (
    <group position={[0.79, DESK_TOP, -0.03]} rotation={[0, -2.1, 0]} scale={0.78}>
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
          <meshStandardMaterial color={BRASS} roughness={0.22} metalness={0.92} envMapIntensity={1.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.041, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.04, 24]} />
          <meshStandardMaterial color={BRASS} roughness={0.36} metalness={0.6} />
        </mesh>
        <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.038, 24]} />
          <meshStandardMaterial color="#FFF0D2" emissive="#F3D7A4" emissiveIntensity={1.15} />
        </mesh>
      </group>
    </group>
  );
}

function Chair() {
  return (
    <group position={[0.02, 0, 0.78]} rotation={[0, 0.07, 0]}>
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

function Plant() {
  const geo = useMemo(leafGeometry, []);
  useEffect(() => () => geo.dispose(), [geo]);

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
      <mesh position={[0, 0.112, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.055, 28]} />
        <meshStandardMaterial color={SOIL} roughness={1} />
      </mesh>

      <group position={[0, 0.112, 0]}>
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
export type SafeBand = { top: number; bottom: number };

function CameraRig({
  state, pointer, reduced, safe,
}: {
  state: StudioState;
  pointer: React.RefObject<{ x: number; y: number }>;
  reduced: boolean;
  safe: React.RefObject<SafeBand>;
}) {
  const { camera, size } = useThree();
  const portrait = size.width / size.height < 1.25;
  const shots = portrait ? MOBILE_SHOTS : CAMERA_SHOTS;

  const target = useRef(new THREE.Vector3(...shots.overview.target));
  const shot = useRef(shots.overview);

  /* Scratch objects, so the per-frame maths allocates nothing. */
  const wantPos = useRef(new THREE.Vector3());
  const wantTarget = useRef(new THREE.Vector3());
  const dir = useRef(new THREE.Vector3());
  const probe = useRef(new THREE.Vector3());
  const scratch = useRef(new THREE.PerspectiveCamera());

  /* The highest points of the composition, used to check that nothing is
     sitting under the copy: the top of the monitor and the top of the
     plant. */
  const PEAKS: [number, number, number][] = [
    [0.38, 1.19, -0.24],
    [-0.82, 1.12, -0.17],
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
    const fit = state === "overview" ? 1 : Math.min(1.55, Math.max(1, 1 / height));
    const baseDistance = dir.current.length();
    const distance = baseDistance * fit;
    dir.current.normalize();

    const fov = (camera as THREE.PerspectiveCamera).fov ?? 22;
    const visible = 2 * distance * Math.tan((fov * Math.PI) / 360);

    /* Raising the camera and its target together slides the picture down
       the frame without changing the angle. The cosine corrects for the
       camera looking downwards rather than level. */
    const pitchCos = Math.max(0.2, Math.sqrt(1 - dir.current.y * dir.current.y));
    const lift = (centre * visible) / pitchCos;

    wantTarget.current.y += lift;
    wantPos.current.copy(dir.current).multiplyScalar(distance).add(wantTarget.current);

    /* On the overview, confirm it: project the tallest things in the scene
       and, if either still reaches into the copy, slide the picture further
       down until it does not. A couple of passes is enough to converge. */
    if (state !== 'overview') return;

    const cam = scratch.current;
    cam.fov = fov;
    cam.aspect = Math.max(0.2, size.width / Math.max(1, size.height));
    cam.near = 0.05;
    cam.far = 40;

    for (let pass = 0; pass < 3; pass++) {
      cam.position.copy(wantPos.current);
      cam.up.set(0, 1, 0);
      cam.lookAt(wantTarget.current);
      cam.updateMatrixWorld(true);
      cam.updateProjectionMatrix();

      let highest = 1;                      // 0 is the top of the frame
      for (const peak of PEAKS) {
        probe.current.set(...peak).project(cam);
        highest = Math.min(highest, (1 - probe.current.y) / 2);
      }

      const overshoot = band.top + 0.02 - highest;
      if (overshoot <= 0.002) break;

      const push = (overshoot * visible) / pitchCos;
      wantTarget.current.y += push;
      wantPos.current.y += push;
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

  useFrame((_, delta) => {
    solve();                                   // the band can change as the page reflows
    if (reduced) {
      camera.position.copy(wantPos.current);
      target.current.copy(wantTarget.current);
      camera.lookAt(target.current);
      return;
    }
    // ~800ms to settle; frame-rate independent, and safe to retarget mid-flight
    const k = 1 - Math.pow(0.0001, delta / 0.8);

    const drift = pointer.current ?? { x: 0, y: 0 };
    wantPos.current.x += drift.x * 0.14;
    wantPos.current.y += -drift.y * 0.08;

    camera.position.lerp(wantPos.current, k);
    target.current.lerp(wantTarget.current, k);
    camera.lookAt(target.current);
  });

  return null;
}

/* ---------- the scene ---------- */

export type SceneProps = {
  state: StudioState;
  onPick: (s: Exclude<StudioState, 'overview'>) => void;
  pointer: React.RefObject<{ x: number; y: number }>;
  reduced: boolean;
  showMarkers: boolean;
  safe: React.RefObject<SafeBand>;
};

export default function Scene({ state, onPick, pointer, reduced, showMarkers, safe }: SceneProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  return (
    <>
      <CameraRig state={state} pointer={pointer} reduced={reduced} safe={safe} />

      {/* A studio to reflect. Built here rather than downloaded: a warm
          window up and to the left, a cool bounce from the right and a pale
          floor, baked once into an environment map. Without it the metal,
          glass and ceramic have nothing to mirror and read as plastic. */}
      <Environment resolution={256} frames={1} background={false}>
        <mesh scale={30}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshBasicMaterial color="#4F4B44" side={THREE.BackSide} />
        </mesh>
        {/* the window */}
        <Lightformer form="rect" intensity={2.1} color="#FFF3DF"
                     position={[-5, 5, 2]} rotation-y={Math.PI / 3.1} scale={[7, 7, 1]} />
        {/* a softer second pane beside it */}
        <Lightformer form="rect" intensity={0.85} color="#FFF8EC"
                     position={[-3.4, 3.4, 5]} rotation-y={Math.PI / 5} scale={[4, 5, 1]} />
        {/* cool bounce off the right-hand wall */}
        <Lightformer form="rect" intensity={0.5} color="#E7EDF2"
                     position={[5.5, 2.6, 1.5]} rotation-y={-Math.PI / 2.6} scale={[6, 5, 1]} />
        {/* the ceiling and the floor, so verticals pick up a gradient */}
        <Lightformer form="rect" intensity={0.3} color="#FBF6EA"
                     position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={0.12} color="#E3DAC7"
                     position={[0, -3, 1]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>

      {/* one broad daylight from the upper left, a soft fill, and the lamp */}
      <hemisphereLight args={['#FFF8EC', '#CFC6B1', 0.42]} />
      <directionalLight
        position={[-2.2, 4.4, 1.9]}
        intensity={1.95}
        color="#FFF4E4"
        castShadow
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
      <directionalLight position={[2.6, 1.9, 2.0]} intensity={0.6} color="#F3EEE2" />
      {/* the lamp's own pool of light, falling off as light really does */}
      <pointLight position={[0.62, 1.05, -0.12]} intensity={0.9} color="#F7DCA8" distance={1.5} decay={2} castShadow={false} />

      <Ground />
      <Desk />
      <Chair />
      <Plant />
      <ClosedNotebook />
      <Notebook />
      <Mug />
      <Lamp />

      <Tablet        lit={state === 'process'} onPick={() => onPick('process')} />
      <PortraitFrame lit={state === 'about'}   onPick={() => onPick('about')} />
      <Laptop        lit={state === 'work'}    onPick={() => onPick('work')} />
      <Monitor       lit={state === 'ai'}      onPick={() => onPick('ai')} />

      {ready && (
        <ContactShadows
          position={[0, 0.001, 0]}
          scale={3.2}
          resolution={1024}
          blur={1.8}
          opacity={0.52}
          far={1.6}
          color="#6A5F4C"
        />
      )}

      {/* Discreet markers anchored to each object. They hide while a panel
          is open so they never sit on top of the content. */}
      {showMarkers && state === 'overview' && (
        <>
          <Marker position={[0.02, 0.965, -0.04]} label="Work"          onClick={() => onPick('work')} />
          <Marker position={[-0.56, 0.93, -0.04]} label="Process & CRM" onClick={() => onPick('process')} />
          <Marker position={[0.38, 0.86, -0.24]}  label="AI in action"  onClick={() => onPick('ai')} />
          <Marker position={[-0.33, 0.885, -0.24]} label="About"        onClick={() => onPick('about')} />
        </>
      )}
    </>
  );
}

/* A small dot on the object. The name appears on hover or keyboard focus,
   so the scene is not covered in floating pills. The hit area stays 44px. */
function Marker({
  position, label, onClick,
}: { position: [number, number, number]; label: string; onClick: () => void }) {
  return (
    <Html position={position} center zIndexRange={[30, 10]}>
      <button
        type="button"
        onClick={onClick}
        data-studio-marker=""
        className="group pointer-events-auto flex h-11 w-11 items-center justify-center
                   rounded-full bg-transparent focus:outline-none"
      >
        <span
          className="relative flex h-[13px] w-[13px] items-center justify-center rounded-full
                     border border-sage/45 bg-surface/90 transition-all duration-200 ease-soft
                     group-hover:h-[15px] group-hover:w-[15px] group-hover:border-sage
                     group-focus-visible:h-[15px] group-focus-visible:w-[15px]
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
                     duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          {label}
        </span>
      </button>
    </Html>
  );
}
