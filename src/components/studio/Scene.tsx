'use client';

/* The Transformation Desk — a real WebGL scene, built procedurally.

   No downloaded models and no HDR environment maps. Device screens, the
   notebook spread, the oak grain and the leaves are canvas textures
   (textures.ts). The only photograph is the desk portrait, which is the
   supplied likeness.

   World scale: 1 unit = 1 metre. The desk top sits at y = 0.74, which is
   a normal desk height, and every object is sized against it: the laptop
   is 0.36m wide, the monitor 0.56m, the mug 80mm across.

   Composition, in order of weight: the laptop is the subject, the monitor
   and tablet support it from behind, and the personal objects — portrait,
   notebook, mug, plant — sit around the edges. Each object is turned a
   few degrees on its own so the desk does not read as a grid. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { ContactShadows, RoundedBox, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  boardPainter, laptopPainter, monitorPainter, notebookPainter,
  oakGrainCanvas, leafCanvas, floorCanvas, type Painter,
} from './textures';
import { CAMERA_SHOTS, MOBILE_OVERVIEW, type StudioState } from './shots';

/* ---------- materials ---------- */
const OAK = '#E0D0B4';          // pale, lightly desaturated
const OAK_EDGE = '#CDB998';
const OAK_LEG = '#D6C3A2';
const GRAPHITE = '#4A4F4C';     // satin, never pure black
const SILVER = '#C3C7C3';
const SAGE_UPH = '#6E7F5E';
const CERAMIC = '#FBF8F1';
const BRASS = '#B89961';
const PAPER = '#FFFEFA';
const HIGHLIGHT = '#B89961';

const DESK_TOP = 0.74;

/* ---------- texture helpers ---------- */

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

function useStill(factory: () => HTMLCanvasElement, repeat?: [number, number]) {
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

const hover = {
  onPointerOver: () => { document.body.style.cursor = 'pointer'; },
  onPointerOut: () => { document.body.style.cursor = ''; },
};

/** The brass wash that marks the selected object. Kept to a thin outline
    rather than a glow over the screen itself. */
function Selected({ size, position, rotation }: {
  size: [number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <meshBasicMaterial color={HIGHLIGHT} transparent opacity={0.22} />
    </mesh>
  );
}

/* ---------- ground ---------- */

function Ground() {
  const map = useStill(floorCanvas);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[3.2, 64]} />
      <meshStandardMaterial map={map} transparent roughness={0.95} metalness={0} depthWrite={false} />
    </mesh>
  );
}

/* ---------- desk ----------------------------------------------------------
   A slim top on four tapered legs with a shallow integrated drawer. The top
   and the legs use different grain so one texture is not stretched over
   everything.                                                              */

function Desk() {
  const topGrain = useStill(oakGrainCanvas);
  const legGrain = useStill(() => oakGrainCanvas(88117, 90), [2, 1]);

  return (
    <group>
      <RoundedBox args={[1.74, 0.032, 0.76]} radius={0.012} smoothness={6}
                  position={[0, DESK_TOP - 0.016, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={topGrain} color={OAK} roughness={0.52} metalness={0} />
      </RoundedBox>

      {/* a bevelled under-edge, so the top does not read as a flat card */}
      <RoundedBox args={[1.71, 0.016, 0.73]} radius={0.006} smoothness={4}
                  position={[0, DESK_TOP - 0.04, 0]}>
        <meshStandardMaterial color={OAK_EDGE} roughness={0.62} />
      </RoundedBox>

      {/* one shallow drawer, right of centre */}
      <group position={[0.38, DESK_TOP - 0.078, 0.0]}>
        <RoundedBox args={[0.5, 0.062, 0.6]} radius={0.008} smoothness={4} castShadow>
          <meshStandardMaterial map={legGrain} color={OAK_EDGE} roughness={0.6} />
        </RoundedBox>
        <mesh position={[0, 0, 0.302]}>
          <boxGeometry args={[0.13, 0.008, 0.008]} />
          <meshStandardMaterial color={BRASS} roughness={0.38} metalness={0.65} />
        </mesh>
      </group>

      {/* four tapered legs, splayed a little — believable, not the subject */}
      {([[-0.74, -0.28, 0.05, -0.04], [0.74, -0.28, -0.05, -0.04],
         [-0.74, 0.28, 0.05, 0.04], [0.74, 0.28, -0.05, 0.04]] as const)
        .map(([x, z, tx, tz], i) => (
          <mesh key={i} position={[x, 0.356, z]} rotation={[tz, 0, tx]} castShadow>
            <cylinderGeometry args={[0.019, 0.03, 0.712, 16]} />
            <meshStandardMaterial map={legGrain} color={OAK_LEG} roughness={0.56} />
          </mesh>
        ))}

      {/* a slim stretcher between the back legs */}
      <mesh position={[0, 0.17, -0.28]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 1.46, 12]} />
        <meshStandardMaterial color={OAK_LEG} roughness={0.6} />
      </mesh>
    </group>
  );
}

/* ---------- laptop → Selected work (the subject of the composition) ------ */

function Laptop({ onPick, lit }: Pickable) {
  const tex = useCanvasTexture(laptopPainter);
  return (
    <group position={[0.06, DESK_TOP, 0.02]} rotation={[0, 0.09, 0]}>
      <RoundedBox args={[0.36, 0.013, 0.25]} radius={0.005} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={SILVER} roughness={0.38} metalness={0.45} />
      </RoundedBox>

      {/* key bed and trackpad */}
      <mesh position={[0, 0.0075, -0.042]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 0.113]} />
        <meshStandardMaterial color="#9AA09C" roughness={0.72} />
      </mesh>
      {Array.from({ length: 5 }).map((_, r) =>
        Array.from({ length: 14 }).map((__, k) => (
          <mesh key={`${r}-${k}`} rotation={[-Math.PI / 2, 0, 0]}
                position={[-0.141 + k * 0.0217, 0.0081, -0.086 + r * 0.0222]}>
            <planeGeometry args={[0.018, 0.018]} />
            <meshStandardMaterial color="#8C938E" roughness={0.8} />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.0078, 0.07]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.096, 0.064]} />
        <meshStandardMaterial color="#AFB5B1" roughness={0.5} metalness={0.2} />
      </mesh>

      <group position={[0, 0.0065, -0.125]} rotation={[-0.27, 0, 0]}>
        <RoundedBox args={[0.36, 0.238, 0.008]} radius={0.005} smoothness={4}
                    position={[0, 0.119, 0]} castShadow>
          <meshStandardMaterial color={SILVER} roughness={0.38} metalness={0.45} />
        </RoundedBox>
        <mesh position={[0, 0.119, 0.0055]} onClick={(e) => { e.stopPropagation(); onPick(); }} {...hover}>
          <planeGeometry args={[0.332, 0.212]} />
          <meshStandardMaterial map={tex} roughness={0.34} emissive="#4A4A40" emissiveIntensity={0.03} />
        </mesh>
        {lit && <Selected size={[0.372, 0.25]} position={[0, 0.119, 0.002]} />}
      </group>
    </group>
  );
}

/* ---------- monitor → AI in action (behind and right of the laptop) ------ */

function Monitor({ onPick, lit }: Pickable) {
  const tex = useCanvasTexture(monitorPainter);
  return (
    <group position={[0.56, DESK_TOP, -0.26]} rotation={[0, -0.26, 0]}>
      <mesh position={[0, 0.007, 0.022]} castShadow receiveShadow>
        <boxGeometry args={[0.16, 0.011, 0.095]} />
        <meshStandardMaterial color={GRAPHITE} roughness={0.52} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.08, 0.01]} rotation={[0.1, 0, 0]} castShadow>
        <boxGeometry args={[0.036, 0.15, 0.018]} />
        <meshStandardMaterial color={GRAPHITE} roughness={0.46} metalness={0.28} />
      </mesh>

      <group position={[0, 0.245, -0.004]} rotation={[-0.05, 0, 0]}>
        <RoundedBox args={[0.46, 0.276, 0.014]} radius={0.007} smoothness={5} castShadow>
          <meshStandardMaterial color={GRAPHITE} roughness={0.44} metalness={0.22} />
        </RoundedBox>
        <mesh position={[0, 0.005, 0.0095]} onClick={(e) => { e.stopPropagation(); onPick(); }} {...hover}>
          <planeGeometry args={[0.432, 0.244]} />
          <meshStandardMaterial map={tex} roughness={0.3} emissive="#4A4A40" emissiveIntensity={0.04} />
        </mesh>
        {lit && <Selected size={[0.5, 0.316]} position={[0, 0.005, 0.005]} />}
      </group>
    </group>
  );
}

/* ---------- tablet on a stand → Process & CRM (left of the laptop) ------- */

function WorkflowTablet({ onPick, lit }: Pickable) {
  const tex = useCanvasTexture(boardPainter);
  return (
    <group position={[-0.58, DESK_TOP, -0.04]} rotation={[0, 0.52, 0]}>
      {/* folio stand behind it */}
      <mesh position={[0, 0.05, -0.046]} rotation={[0.42, 0, 0]} castShadow>
        <boxGeometry args={[0.17, 0.15, 0.008]} />
        <meshStandardMaterial color={GRAPHITE} roughness={0.78} />
      </mesh>

      <group position={[0, 0.099, 0.005]} rotation={[-0.32, 0, 0]}>
        <RoundedBox args={[0.262, 0.187, 0.01]} radius={0.008} smoothness={5} castShadow>
          <meshStandardMaterial color={GRAPHITE} roughness={0.46} metalness={0.2} />
        </RoundedBox>
        <mesh position={[0, 0, 0.0075]} onClick={(e) => { e.stopPropagation(); onPick(); }} {...hover}>
          <planeGeometry args={[0.242, 0.166]} />
          <meshStandardMaterial map={tex} roughness={0.32} emissive="#4A4A40" emissiveIntensity={0.03} />
        </mesh>
        {lit && <Selected size={[0.3, 0.225]} position={[0, 0, 0.004]} />}
      </group>
    </group>
  );
}

/* ---------- notebook and pen → Services / how I work --------------------- */

function Notebook({ onPick, lit }: Pickable) {
  const tex = useCanvasTexture(notebookPainter);
  return (
    <group position={[0.5, DESK_TOP, 0.21]} rotation={[0, -0.24, 0]}>
      <RoundedBox args={[0.38, 0.014, 0.26]} radius={0.003} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={PAPER} roughness={0.95} />
      </RoundedBox>
      {/* page edges, so the paper has thickness */}
      <mesh position={[0, 0.0005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.384, 0.264]} />
        <meshStandardMaterial color="#EFEADC" roughness={1} />
      </mesh>
      <mesh position={[0, 0.0082, 0]} rotation={[-Math.PI / 2, 0, 0]}
            onClick={(e) => { e.stopPropagation(); onPick(); }} {...hover}>
        <planeGeometry args={[0.372, 0.25]} />
        <meshStandardMaterial map={tex} roughness={0.96} />
      </mesh>
      {lit && <Selected size={[0.43, 0.3]} position={[0, 0.0095, 0]} rotation={[-Math.PI / 2, 0, 0]} />}

      <mesh position={[-0.02, 0.012, 0.165]} rotation={[0, 0.16, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0048, 0.0036, 0.135, 12]} />
        <meshStandardMaterial color="#2F3A2C" roughness={0.36} metalness={0.15} />
      </mesh>
      <mesh position={[0.045, 0.012, 0.158]} rotation={[0, 0.16, Math.PI / 2]}>
        <cylinderGeometry args={[0.005, 0.005, 0.022, 12]} />
        <meshStandardMaterial color={BRASS} roughness={0.34} metalness={0.7} />
      </mesh>
    </group>
  );
}

/* ---------- framed portrait → About --------------------------------------
   The photograph is the supplied likeness, cropped to head and shoulders
   and printed onto an ivory card. It is a flat print inside a frame, which
   is what a desk photo is, so no model is implied and the camera never
   travels behind it.                                                       */

function PortraitFrame({ onPick, lit }: Pickable) {
  const photo = useLoader(THREE.TextureLoader, '/scene/portrait.webp');
  photo.colorSpace = THREE.SRGBColorSpace;
  photo.anisotropy = 8;

  return (
    <group position={[-0.28, DESK_TOP, 0.22]} rotation={[0, 0.34, 0]}>
      <group position={[0, 0.088, 0]} rotation={[-0.1, 0, 0]}>
        <RoundedBox args={[0.126, 0.158, 0.012]} radius={0.004} smoothness={4} castShadow>
          <meshStandardMaterial color={OAK_EDGE} roughness={0.52} />
        </RoundedBox>
        <mesh position={[0, 0, 0.0068]}>
          <planeGeometry args={[0.104, 0.136]} />
          <meshStandardMaterial color={PAPER} roughness={0.92} />
        </mesh>
        <mesh position={[0, 0.004, 0.0074]}
              onClick={(e) => { e.stopPropagation(); onPick(); }} {...hover}>
          <planeGeometry args={[0.082, 0.108]} />
          <meshStandardMaterial map={photo} roughness={0.5} />
        </mesh>
        {lit && <Selected size={[0.16, 0.192]} position={[0, 0, 0.004]} />}
        <mesh position={[0, -0.046, -0.028]} rotation={[0.48, 0, 0]} castShadow>
          <boxGeometry args={[0.024, 0.1, 0.005]} />
          <meshStandardMaterial color={OAK_LEG} roughness={0.65} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------- lamp, mug, chair ---------- */

function Lamp() {
  return (
    <group position={[0.76, DESK_TOP, -0.21]} rotation={[0, -1.15, 0]}>
      <mesh position={[0, 0.008, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.055, 0.062, 0.016, 28]} />
        <meshStandardMaterial color={BRASS} roughness={0.36} metalness={0.72} />
      </mesh>
      <mesh position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.009, 0.32, 14]} />
        <meshStandardMaterial color={BRASS} roughness={0.34} metalness={0.72} />
      </mesh>
      <mesh position={[-0.07, 0.328, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.15, 14]} />
        <meshStandardMaterial color={BRASS} roughness={0.34} metalness={0.72} />
      </mesh>
      <group position={[-0.145, 0.318, 0]} rotation={[0, 0, 0.26]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.038, 0.038, 0.085, 24, 1, true]} />
          <meshStandardMaterial color={BRASS} roughness={0.34} metalness={0.72} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.036, 24]} />
          <meshStandardMaterial color="#FFF0D2" emissive="#F4D9A6" emissiveIntensity={1.1} />
        </mesh>
      </group>
    </group>
  );
}

function Mug() {
  return (
    <group position={[0.79, DESK_TOP, 0.14]} rotation={[0, 0.5, 0]}>
      <mesh position={[0, 0.0045, 0]} receiveShadow>
        <cylinderGeometry args={[0.058, 0.058, 0.009, 28]} />
        <meshStandardMaterial color="#EDE7DA" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.049, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.04, 0.034, 0.08, 28]} />
        <meshStandardMaterial color={CERAMIC} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.087, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.034, 24]} />
        <meshStandardMaterial color="#6A5340" roughness={0.26} />
      </mesh>
      <mesh position={[0.05, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.019, 0.0048, 10, 20, Math.PI * 1.3]} />
        <meshStandardMaterial color={CERAMIC} roughness={0.42} />
      </mesh>
    </group>
  );
}

function Chair() {
  return (
    <group position={[0.1, 0, -0.82]} rotation={[0, Math.PI - 0.14, 0]} scale={0.84}>
      <RoundedBox args={[0.46, 0.1, 0.44]} radius={0.05} smoothness={5} position={[0, 0.45, 0]} castShadow>
        <meshStandardMaterial color={SAGE_UPH} roughness={0.96} />
      </RoundedBox>
      <RoundedBox args={[0.42, 0.46, 0.095]} radius={0.047} smoothness={5}
                  position={[0, 0.73, -0.175]} rotation={[0.17, 0, 0]} castShadow>
        <meshStandardMaterial color={SAGE_UPH} roughness={0.96} />
      </RoundedBox>
      <mesh position={[0, 0.27, 0]} castShadow>
        <cylinderGeometry args={[0.026, 0.026, 0.37, 14]} />
        <meshStandardMaterial color="#8E938F" roughness={0.42} metalness={0.4} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.13, 0.05, Math.sin(a) * 0.13]}
                rotation={[0, -a, 0]} castShadow>
            <boxGeometry args={[0.26, 0.022, 0.034]} />
            <meshStandardMaterial color="#8E938F" roughness={0.42} metalness={0.4} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ---------- plant --------------------------------------------------------
   Real leaf shapes on a handful of stems: each leaf is one two-triangle
   plane carrying the leaf texture's own alpha, so the silhouette is a leaf
   rather than a faceted blob, at a fraction of the geometry.               */

function Plant() {
  const leaf = useStill(leafCanvas);

  /* Five stems, each rising from the soil and carrying three leaves near
     its tip. Deterministic, so the plant is the same on every load. */
  const sprigs = useMemo(() => {
    let s = 4711;
    const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
    return [
      { spin: 0.3, lean: 0.16, h: 0.3 },
      { spin: 1.4, lean: 0.34, h: 0.23 },
      { spin: 2.6, lean: 0.26, h: 0.27 },
      { spin: 3.9, lean: 0.4, h: 0.19 },
      { spin: 5.1, lean: 0.3, h: 0.25 },
    ].map((st, i) => ({
      ...st,
      i,
      leaves: Array.from({ length: 3 }, (_, k) => ({
        k,
        up: 0.58 + k * 0.21,
        swing: (k - 1) * 0.9 + (rand() - 0.5) * 0.4,
        droop: 0.5 + rand() * 0.45,
        size: 0.1 + rand() * 0.042,
        tint: rand() > 0.5 ? '#FFFFFF' : '#D9E2CC',
      })),
    }));
  }, []);

  return (
    <group position={[-0.75, DESK_TOP, -0.3]} rotation={[0, 0.4, 0]}>
      {/* warm-white ceramic pot */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.062, 0.048, 0.092, 32]} />
        <meshStandardMaterial color={CERAMIC} roughness={0.56} />
      </mesh>
      <mesh position={[0, 0.095, 0]} castShadow>
        <cylinderGeometry args={[0.064, 0.064, 0.011, 32]} />
        <meshStandardMaterial color="#F4EFE4" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.098, 0]}>
        <cylinderGeometry args={[0.057, 0.057, 0.009, 32]} />
        <meshStandardMaterial color="#4B4437" roughness={1} />
      </mesh>

      {sprigs.map((st) => (
        <group key={st.i} position={[0, 0.098, 0]} rotation={[0, st.spin, 0]}>
          <group rotation={[st.lean, 0, 0]}>
            <mesh position={[0, st.h / 2, 0]} castShadow>
              <cylinderGeometry args={[0.0022, 0.0036, st.h, 6]} />
              <meshStandardMaterial color="#6E8458" roughness={0.86} />
            </mesh>
            {st.leaves.map((lf) => (
              <group key={lf.k} position={[0, st.h * lf.up, 0]} rotation={[0, lf.swing, 0]}>
                <mesh
                  position={[0, lf.size * 0.46, lf.size * 0.3]}
                  rotation={[-0.35 - lf.droop, 0, 0]}
                  castShadow
                >
                  <planeGeometry args={[lf.size * 0.7, lf.size * 1.3]} />
                  <meshStandardMaterial
                    map={leaf}
                    color={lf.tint}
                    transparent
                    alphaTest={0.4}
                    roughness={0.8}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      ))}
    </group>
  );
}

/* ---------- camera rig ----------------------------------------------------
   One shot table, plus a separate overview framed for a narrow canvas.
   Close-ups are fitted by stepping back along the shot's own view vector,
   so a phone sees the whole object instead of a cropped slice.             */

const REF_ASPECT = 2.1;

function CameraRig({
  state, pointer, reduced,
}: { state: StudioState; pointer: React.RefObject<{ x: number; y: number }>; reduced: boolean }) {
  const { camera, size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const narrow = aspect < 1.7;
  /* A narrow canvas is fitted by widening the lens rather than retreating,
     which keeps the desk a decent size on a phone. Wider canvases keep the
     longer lens the brief asks for and step back instead. */
  const fov = narrow ? 38 : 28;
  const pullback = narrow ? 1 : Math.max(1, Math.min(1.7, 1 + (REF_ASPECT - aspect) * 0.42));

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.fov === fov) return;
    cam.fov = fov;
    cam.updateProjectionMatrix();
  }, [camera, fov]);

  const target = useRef(new THREE.Vector3(...CAMERA_SHOTS.overview.target));
  const desiredPos = useRef(new THREE.Vector3(...CAMERA_SHOTS.overview.position));
  const desiredTarget = useRef(new THREE.Vector3(...CAMERA_SHOTS.overview.target));

  useEffect(() => {
    const shot = state === 'overview' && narrow ? MOBILE_OVERVIEW : CAMERA_SHOTS[state];
    const [tx, ty, tz] = shot.target;
    const [px, py, pz] = shot.position;
    desiredTarget.current.set(tx, ty, tz);
    desiredPos.current
      .set(px, py, pz)
      .sub(desiredTarget.current)
      .multiplyScalar(state === 'overview' && narrow ? 1 : pullback)
      .add(desiredTarget.current);
    if (reduced) {
      camera.position.copy(desiredPos.current);
      target.current.copy(desiredTarget.current);
      camera.lookAt(target.current);
    }
  }, [state, camera, reduced, pullback, narrow]);

  useFrame((_, delta) => {
    if (reduced) return;
    // ~800ms to settle; frame-rate independent, and safe to retarget mid-flight
    const k = 1 - Math.pow(0.0001, delta / 0.8);

    const drift = pointer.current ?? { x: 0, y: 0 };
    const wanted = desiredPos.current.clone();
    wanted.x += drift.x * 0.14;
    wanted.y += -drift.y * 0.08;

    camera.position.lerp(wanted, k);
    target.current.lerp(desiredTarget.current, k);
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
  showLabels: boolean;
};

export default function Scene({ state, onPick, pointer, reduced, showLabels }: SceneProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  return (
    <>
      <CameraRig state={state} pointer={pointer} reduced={reduced} />

      {/* One broad daylight source from the upper left, a soft fill to keep
          shadow sides readable, and a small warm pool at the lamp. */}
      <hemisphereLight args={['#FFF8EC', '#DED8C8', 1.02]} />
      <directionalLight
        position={[-2.2, 4.4, 2.6]}
        intensity={1.02}
        color="#FFF6E6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
        shadow-bias={-0.0004}
        shadow-normalBias={0.012}
      />
      <directionalLight position={[2.6, 1.8, 2.4]} intensity={0.5} color="#FFF3E2" />
      <pointLight position={[0.66, DESK_TOP + 0.16, -0.05]} intensity={0.3} color="#F7DCAC" distance={0.7} decay={2} />

      <Ground />
      <Desk />
      <Chair />
      <Lamp />
      <Mug />
      <Plant />

      <Laptop         lit={state === 'work'}     onPick={() => onPick('work')} />
      <Monitor        lit={state === 'ai'}       onPick={() => onPick('ai')} />
      <WorkflowTablet lit={state === 'process'}  onPick={() => onPick('process')} />
      <Notebook       lit={state === 'services'} onPick={() => onPick('services')} />
      <PortraitFrame  lit={state === 'about'}    onPick={() => onPick('about')} />

      {ready && (
        <ContactShadows
          position={[0, 0.0015, 0]}
          scale={2.8}
          resolution={1024}
          blur={2.8}
          opacity={0.24}
          far={1.3}
          color="#5A5141"
        />
      )}

      {/* Discreet markers anchored to their objects. They carry the label
          for assistive tech at all times and show it on hover or focus.
          They hide while a panel is open so they cannot sit over content. */}
      {showLabels && state === 'overview' && (
        <>
          <Marker position={[0.06, 1.01, -0.1]}   label="Selected work" onClick={() => onPick('work')} />
          <Marker position={[-0.58, 0.95, -0.04]} label="Process & CRM" onClick={() => onPick('process')} />
          <Marker position={[0.52, 1.15, -0.29]}  label="AI in action"  onClick={() => onPick('ai')} />
          <Marker position={[0.5, 0.79, 0.21]}    label="How I work"    onClick={() => onPick('services')} />
          <Marker position={[-0.14, 0.775, 0.33]} label="About"         onClick={() => onPick('about')} />
        </>
      )}
    </>
  );
}

/** A 10px dot in a 44px hit area. The name is always available to screen
    readers; the visible label appears on hover and on keyboard focus. */
function Marker({
  position, label, onClick,
}: { position: [number, number, number]; label: string; onClick: () => void }) {
  return (
    <Html position={position} center zIndexRange={[30, 12]}>
      <button
        type="button"
        onClick={onClick}
        data-studio-label=""
        aria-label={label}
        className="group pointer-events-auto relative flex h-11 w-11 items-center justify-center
                   rounded-full outline-none"
      >
        <span
          aria-hidden="true"
          className="block h-2.5 w-2.5 rounded-full bg-brass-bright
                     ring-[3px] ring-surface/90 transition-all duration-200 ease-soft
                     group-hover:h-3 group-hover:w-3 group-hover:bg-sage
                     group-focus-visible:h-3 group-focus-visible:w-3 group-focus-visible:bg-sage"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 translate-y-0.5
                     whitespace-nowrap rounded-full border border-line bg-surface/95 px-2.5 py-1
                     text-[12px] font-medium text-ink opacity-0 shadow-[0_6px_18px_-10px_rgba(23,32,24,.5)]
                     transition-opacity duration-200 ease-soft
                     group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          {label}
        </span>
      </button>
    </Html>
  );
}
