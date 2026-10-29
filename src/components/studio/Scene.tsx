'use client';

/* The Transformation Studio as real 3D geometry.

   Everything here is built procedurally — no downloaded models, no HDR
   environment maps, no external textures. Screens are canvas textures
   (see textures.ts). The only image is the character cutout, which is a
   textured plane inside the room (see CHARACTER note below).

   World scale: 1 unit = 1 metre. The character is 1.75m, and the desk,
   chairs and wall are sized against that. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { ContactShadows, RoundedBox, Html } from '@react-three/drei';
import * as THREE from 'three';
import { boardPainter, laptopPainter, monitorPainter, type Painter } from './textures';
import { CAMERA_SHOTS, type StudioState } from './shots';

/* ---------- palette (matches the site tokens) ---------- */
const OAK = '#C9A878';
const OAK_LIGHT = '#DFC79F';
const OAK_DARK = '#A8854F';
const TRAVERTINE = '#EDE5D7';
const SAGE_UPH = '#6E7F5E';
const SAGE_DEEP = '#59684B';
const CREAM = '#EFE9DC';
const LEATHER = '#8A7257';   // muted walnut — secondary to the sage upholstery
const METAL = '#B0B4AE';
const POT = '#E3DBCB';
const LEAF_A = '#4E6B46';
const LEAF_B = '#64855580';

/* ---------- small helpers ---------- */

function useCanvasTexture(factory: () => Painter) {
  const painter = useMemo(factory, [factory]);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(painter.canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [painter]);

  useFrame(({ clock }) => {
    painter.draw(clock.elapsedTime);
    texture.needsUpdate = true;
  });

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/** A curved desk top: an annulus sector extruded to a slab, with a bevel. */
function curvedSlabGeometry(inner: number, outer: number, from: number, to: number, thick: number) {
  const shape = new THREE.Shape();
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps;
    const x = Math.cos(a) * outer, y = Math.sin(a) * outer;
    i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
  }
  for (let i = steps; i >= 0; i--) {
    const a = from + ((to - from) * i) / steps;
    shape.lineTo(Math.cos(a) * inner, Math.sin(a) * inner);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thick,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 3,
    curveSegments: 24,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

/* ---------- furniture ---------- */

function Platform() {
  return (
    <group>
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[3.5, 3.45, 0.12, 64]} />
        <meshStandardMaterial color={OAK_LIGHT} roughness={0.72} metalness={0} />
      </mesh>
      {/* rug */}
      <mesh position={[0, 0.125, 0.35]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.1, 48]} />
        <meshStandardMaterial color={CREAM} roughness={0.95} />
      </mesh>
    </group>
  );
}

function BackWall() {
  return (
    <group position={[0, 0, -2.35]}>
      <mesh position={[0, 1.65, 0]} receiveShadow>
        <boxGeometry args={[7.4, 3.3, 0.14]} />
        <meshStandardMaterial color={TRAVERTINE} roughness={0.9} />
      </mesh>
      {/* warm light strip along the top */}
      <mesh position={[0, 3.24, 0.1]}>
        <boxGeometry args={[7.0, 0.05, 0.03]} />
        <meshStandardMaterial color="#F3D9A8" emissive="#E8C489" emissiveIntensity={0.85} />
      </mesh>
      {/* vertical oak slats */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[1.35 + i * 0.13, 1.5, 0.1]} castShadow>
          <boxGeometry args={[0.07, 2.7, 0.07]} />
          <meshStandardMaterial color={OAK} roughness={0.65} />
        </mesh>
      ))}
    </group>
  );
}

function WorkflowBoard({ onPick, lit }: { onPick: () => void; lit: boolean }) {
  const tex = useCanvasTexture(boardPainter);
  return (
    <group position={[-1.25, 1.78, -2.24]}>
      <RoundedBox args={[2.3, 1.2, 0.07]} radius={0.03} smoothness={4} castShadow>
        <meshStandardMaterial color={CREAM} roughness={0.85} />
      </RoundedBox>
      <mesh
        position={[0, 0, 0.042]}
        onClick={(e) => { e.stopPropagation(); onPick(); }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <planeGeometry args={[2.16, 1.08]} />
        <meshStandardMaterial map={tex} roughness={0.75} />
      </mesh>
      {lit && (
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[2.42, 1.32]} />
          <meshBasicMaterial color="#B89961" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}

function Monitor({ onPick, lit }: { onPick: () => void; lit: boolean }) {
  const tex = useCanvasTexture(monitorPainter);
  return (
    <group position={[1.95, 1.55, -2.1]}>
      <RoundedBox args={[1.32, 0.82, 0.07]} radius={0.028} smoothness={4} castShadow>
        <meshStandardMaterial color="#2C3630" roughness={0.5} metalness={0.15} />
      </RoundedBox>
      <mesh
        position={[0, 0, 0.042]}
        onClick={(e) => { e.stopPropagation(); onPick(); }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <planeGeometry args={[1.2, 0.7]} />
        <meshStandardMaterial map={tex} roughness={0.35} emissive="#2A3A42" emissiveIntensity={0.18} />
      </mesh>
      {lit && (
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[1.44, 0.94]} />
          <meshBasicMaterial color="#B89961" transparent opacity={0.3} />
        </mesh>
      )}
      {/* shelf under the monitor */}
      <mesh position={[0, -0.56, 0.06]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.06, 0.3]} />
        <meshStandardMaterial color={OAK_LIGHT} roughness={0.7} />
      </mesh>
    </group>
  );
}

function CurvedDesk() {
  const geo = useMemo(
    () => curvedSlabGeometry(1.06, 1.96, Math.PI * 0.05, Math.PI * 0.64, 0.09),
    [],
  );
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group position={[0.55, 0, -0.55]}>
      <mesh geometry={geo} position={[0, 0.74, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={OAK} roughness={0.6} metalness={0} />
      </mesh>
      {/* legs */}
      {[
        [1.62, 0.37, 0.28],
        [0.42, 0.37, 1.42],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.74, 12]} />
          <meshStandardMaterial color={OAK_DARK} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Laptop({ onPick, lit }: { onPick: () => void; lit: boolean }) {
  const tex = useCanvasTexture(laptopPainter);
  return (
    <group position={[0.62, 0.78, 0.28]} rotation={[0, -0.42, 0]}>
      {/* base */}
      <RoundedBox args={[0.42, 0.018, 0.3]} radius={0.008} smoothness={3} castShadow>
        <meshStandardMaterial color="#B9BEBA" roughness={0.45} metalness={0.35} />
      </RoundedBox>
      {/* lid */}
      <group position={[0, 0.012, -0.145]} rotation={[-1.08, 0, 0]}>
        <RoundedBox args={[0.42, 0.28, 0.012]} radius={0.008} smoothness={3} position={[0, 0.14, 0]} castShadow>
          <meshStandardMaterial color="#A7ADA9" roughness={0.45} metalness={0.35} />
        </RoundedBox>
        <mesh
          position={[0, 0.14, 0.008]}
          onClick={(e) => { e.stopPropagation(); onPick(); }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = '')}
        >
          <planeGeometry args={[0.385, 0.245]} />
          <meshStandardMaterial map={tex} roughness={0.4} emissive="#3A4034" emissiveIntensity={0.1} />
        </mesh>
        {lit && (
          <mesh position={[0, 0.14, 0.004]}>
            <planeGeometry args={[0.47, 0.33]} />
            <meshBasicMaterial color="#B89961" transparent opacity={0.32} />
          </mesh>
        )}
      </group>
    </group>
  );
}

function Books({ onPick, lit }: { onPick: () => void; lit: boolean }) {
  const colours = [SAGE_UPH, CREAM, OAK_DARK];
  return (
    <group
      position={[-2.0, 0.12, 1.15]}
      rotation={[0, 0.24, 0]}
      onClick={(e) => { e.stopPropagation(); onPick(); }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {colours.map((col, i) => (
        <RoundedBox
          key={i}
          args={[0.62 - i * 0.03, 0.055, 0.42 - i * 0.02]}
          radius={0.012}
          smoothness={3}
          position={[0, 0.03 + i * 0.058, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={lit ? '#D8B878' : col} roughness={0.8} />
        </RoundedBox>
      ))}
    </group>
  );
}

function VisitorChair() {
  return (
    <group position={[-1.55, 0, 0.5]} rotation={[0, 0.62, 0]}>
      <RoundedBox args={[0.72, 0.22, 0.68]} radius={0.09} smoothness={4} position={[0, 0.46, 0]} castShadow>
        <meshStandardMaterial color={SAGE_UPH} roughness={0.95} />
      </RoundedBox>
      <RoundedBox args={[0.72, 0.56, 0.18]} radius={0.09} smoothness={4} position={[0, 0.74, -0.3]} castShadow>
        <meshStandardMaterial color={SAGE_DEEP} roughness={0.95} />
      </RoundedBox>
      {/* arms */}
      {[-0.33, 0.33].map((x) => (
        <RoundedBox key={x} args={[0.1, 0.3, 0.66]} radius={0.05} smoothness={4}
                    position={[x, 0.56, 0]} castShadow>
          <meshStandardMaterial color={SAGE_UPH} roughness={0.95} />
        </RoundedBox>
      ))}
      {/* cushion */}
      <RoundedBox args={[0.34, 0.1, 0.3]} radius={0.05} smoothness={4}
                  position={[0, 0.6, -0.14]} rotation={[0.3, 0, 0]} castShadow>
        <meshStandardMaterial color={CREAM} roughness={0.95} />
      </RoundedBox>
      {[[-0.28, -0.26], [0.28, -0.26], [-0.28, 0.26], [0.28, 0.26]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.2, z]} castShadow>
          <cylinderGeometry args={[0.025, 0.02, 0.4, 10]} />
          <meshStandardMaterial color={OAK_DARK} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function DeskChair() {
  return (
    <group position={[1.02, 0, -0.08]} rotation={[0, 2.45, 0]} scale={0.94}>
      <RoundedBox args={[0.5, 0.13, 0.48]} radius={0.06} smoothness={5} position={[0, 0.47, 0]} castShadow>
        <meshStandardMaterial color={LEATHER} roughness={0.72} />
      </RoundedBox>
      {/* seat cushion, so the seat reads as upholstery not a slab */}
      <RoundedBox args={[0.44, 0.07, 0.42]} radius={0.034} smoothness={5} position={[0, 0.535, 0]} castShadow>
        <meshStandardMaterial color="#9C8569" roughness={0.78} />
      </RoundedBox>
      <RoundedBox args={[0.46, 0.58, 0.13]} radius={0.07} smoothness={5}
                  position={[0, 0.82, -0.2]} rotation={[0.14, 0, 0]} castShadow>
        <meshStandardMaterial color={LEATHER} roughness={0.72} />
      </RoundedBox>
      <mesh position={[0, 0.27, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.42, 12]} />
        <meshStandardMaterial color={METAL} roughness={0.35} metalness={0.6} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.17, 0.07, Math.sin(a) * 0.17]}
                rotation={[0, -a, 0]} castShadow>
            <boxGeometry args={[0.34, 0.035, 0.05]} />
            <meshStandardMaterial color={METAL} roughness={0.35} metalness={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

function SideTable() {
  return (
    <group position={[-2.45, 0, 0.35]}>
      <mesh position={[0, 0.54, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.05, 32]} />
        <meshStandardMaterial color={OAK_LIGHT} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.52, 12]} />
        <meshStandardMaterial color={OAK_DARK} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.24, 0.03, 24]} />
        <meshStandardMaterial color={OAK_DARK} roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Foliage as a deterministic cluster of squashed spheres — reads as leaves,
    costs almost nothing, and never looks like a single green blob. */
function Foliage({ count, radius, size, seed }: { count: number; radius: number; size: number; seed: number }) {
  const blobs = useMemo(() => {
    let s = seed;
    const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
    return Array.from({ length: count }, () => {
      const a = rand() * Math.PI * 2;
      const b = Math.acos(2 * rand() - 1);
      const r = radius * Math.cbrt(rand());
      return {
        p: [
          Math.sin(b) * Math.cos(a) * r,
          Math.cos(b) * r * 0.72,
          Math.sin(b) * Math.sin(a) * r,
        ] as [number, number, number],
        s: size * (0.6 + rand() * 0.7),
        rot: [rand() * 2, rand() * 2, rand() * 2] as [number, number, number],
        dark: rand() > 0.5,
      };
    });
  }, [count, radius, size, seed]);

  return (
    <>
      {blobs.map((b, i) => (
        <mesh key={i} position={b.p} rotation={b.rot} scale={[b.s, b.s * 0.52, b.s]} castShadow>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={b.dark ? LEAF_A : '#648555'} roughness={0.88} flatShading />
        </mesh>
      ))}
    </>
  );
}

function Plant({
  position, potR, potH, trunk, foliage,
}: {
  position: [number, number, number];
  potR: number; potH: number; trunk?: number;
  foliage: { count: number; radius: number; size: number; seed: number; y: number }[];
}) {
  return (
    <group position={position}>
      <mesh position={[0, potH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[potR * 0.92, potR * 0.78, potH, 24]} />
        <meshStandardMaterial color={POT} roughness={0.9} />
      </mesh>
      <mesh position={[0, potH - 0.012, 0]}>
        <cylinderGeometry args={[potR * 0.9, potR * 0.9, 0.03, 24]} />
        <meshStandardMaterial color="#4A4338" roughness={1} />
      </mesh>
      {trunk && (
        <mesh position={[0, potH + trunk / 2, 0]} castShadow>
          <cylinderGeometry args={[0.028, 0.038, trunk, 10]} />
          <meshStandardMaterial color="#7A6A4E" roughness={0.9} />
        </mesh>
      )}
      {foliage.map((f, i) => (
        <group key={i} position={[0, potH + f.y, 0]}>
          <Foliage count={f.count} radius={f.radius} size={f.size} seed={f.seed} />
        </group>
      ))}
    </group>
  );
}

/* ---------- CHARACTER ----------------------------------------------------
   No rigged model (GLB/glTF) was supplied with this project, so the figure
   is the transparent cutout on a plane standing in the room. Its aspect
   ratio is the texture's own (284 x 880 from the source sheet), so it is
   never stretched. It is placed facing the default camera and the camera
   is clamped so the plane is never seen near edge-on.
   ------------------------------------------------------------------------ */
const PERSON_HEIGHT = 1.75;
const PERSON_ASPECT = 284 / 880;

function Character() {
  const texture = useLoader(THREE.TextureLoader, '/scene/person.webp');
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  return (
    <group position={[-0.55, 0, 1.55]}>
      <mesh position={[0, PERSON_HEIGHT / 2 + 0.12, 0]} rotation={[0, 0.22, 0]}>
        <planeGeometry args={[PERSON_HEIGHT * PERSON_ASPECT, PERSON_HEIGHT]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.12}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* his own contact shadow, so he is not floating */}
      <mesh position={[0, 0.127, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 24]} />
        <meshBasicMaterial color="#6E6450" transparent opacity={0.34} />
      </mesh>
    </group>
  );
}

/* ---------- camera rig ---------- */

function CameraRig({
  state, pointer, reduced,
}: { state: StudioState; pointer: React.RefObject<{ x: number; y: number }>; reduced: boolean }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(...CAMERA_SHOTS.overview.target));
  const desiredPos = useRef(new THREE.Vector3(...CAMERA_SHOTS.overview.position));
  const desiredTarget = useRef(new THREE.Vector3(...CAMERA_SHOTS.overview.target));

  useEffect(() => {
    const shot = CAMERA_SHOTS[state];
    desiredPos.current.set(...shot.position);
    desiredTarget.current.set(...shot.target);
    if (reduced) {
      camera.position.copy(desiredPos.current);
      target.current.copy(desiredTarget.current);
      camera.lookAt(target.current);
    }
  }, [state, camera, reduced]);

  useFrame((_, delta) => {
    if (reduced) return;
    // ~800ms to settle; frame-rate independent, and safe to retarget mid-flight
    const k = 1 - Math.pow(0.0001, delta / 0.8);

    const drift = pointer.current ?? { x: 0, y: 0 };
    const wanted = desiredPos.current.clone();
    wanted.x += drift.x * 0.38;
    wanted.y += -drift.y * 0.22;

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

      {/* soft daylight, one warm accent, no environment map */}
      <hemisphereLight args={['#FFF6E4', '#C9BFA8', 1.05]} />
      <directionalLight
        position={[3.2, 5.4, 3.4]}
        intensity={1.5}
        color="#FFF3DF"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0008}
      />
      <pointLight position={[-2.4, 2.6, 1.2]} intensity={14} color="#F2D6A6" distance={8} decay={2} />

      <Platform />
      <BackWall />
      <CurvedDesk />
      <VisitorChair />
      <DeskChair />
      <SideTable />

      <WorkflowBoard lit={state === 'process'} onPick={() => onPick('process')} />
      <Monitor lit={state === 'ai'} onPick={() => onPick('ai')} />
      <Laptop lit={state === 'work'} onPick={() => onPick('work')} />
      <Books lit={state === 'work'} onPick={() => onPick('work')} />

      <Plant position={[-2.72, 0.12, -1.5]} potR={0.3} potH={0.52} trunk={0.95}
             foliage={[
               { count: 22, radius: 0.52, size: 0.17, seed: 7, y: 1.26 },
               { count: 14, radius: 0.36, size: 0.14, seed: 11, y: 0.86 },
             ]} />
      <Plant position={[-2.45, 0.56, 0.35]} potR={0.13} potH={0.2}
             foliage={[{ count: 12, radius: 0.2, size: 0.085, seed: 3, y: 0.16 }]} />
      <Plant position={[2.72, 0.12, -1.1]} potR={0.22} potH={0.36}
             foliage={[{ count: 18, radius: 0.36, size: 0.12, seed: 21, y: 0.3 }]} />

      <Character />

      {ready && (
        <ContactShadows
          position={[0, 0.129, 0]}
          scale={8}
          resolution={1024}
          blur={2.4}
          opacity={0.42}
          far={3}
          color="#5A5141"
        />
      )}

      {/* Labels anchored to their objects in 3D. They hide while a panel is
          open so they cannot sit on top of the content. */}
      {showLabels && state === 'overview' && (
        <>
          <Label position={[-1.25, 2.56, -2.20]} label="Process & CRM" onClick={() => onPick('process')} />
          <Label position={[1.62, 2.14, -2.00]} label="AI in action" onClick={() => onPick('ai')} />
          <Label position={[0.70, 1.28, 0.35]} label="Selected work" onClick={() => onPick('work')} />
        </>
      )}
    </>
  );
}

function Label({
  position, label, onClick,
}: { position: [number, number, number]; label: string; onClick: () => void }) {
  return (
    <Html position={position} center distanceFactor={3.4} zIndexRange={[20, 0]}>
      <button
        type="button"
        onClick={onClick}
        className="pointer-events-auto flex min-h-[44px] items-center gap-2 whitespace-nowrap
                   rounded-full border border-line bg-surface/95 px-4 py-2 text-[13px]
                   font-medium text-ink shadow-[0_8px_26px_-12px_rgba(23,32,24,.55)]
                   transition-transform duration-200 hover:-translate-y-0.5"
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-brass" aria-hidden="true" />
        {label}
      </button>
    </Html>
  );
}
