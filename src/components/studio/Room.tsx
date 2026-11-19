'use client';

/* The room the desk stands in. Until now the desk floated in a dark void,
   which made it a model on a turntable; the references it is measured
   against are rooms — a wall behind, a big window, light falling across
   the desk, a plant, a shelf. This is that room, kept quiet so the desk
   stays the subject:

   - a back wall with a steel-framed window behind the right half of the
     desk, so daylight comes in from behind and across, and the glazing
     bars throw soft stripes over the oak
   - a view through it, painted out of focus the way a camera at desk
     distance would see it, with clouds that drift
   - a sheer curtain at the window's edge that moves in the draught
   - a framed print and a shelf beyond the window, a pale oak floor

   Everything here is decoration: none of it raycasts, so nothing in the
   room can steal a click meant for the desk. Every texture is painted at
   load; there is nothing to download. */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NO_RAY = () => null;

/* Where the room sits. The desk's back edge is at z = -0.39. */
export const WALL_Z = -1.0;
const WALL_T = 0.12;
const WALL_FRONT = WALL_Z + WALL_T / 2;
const WALL_X: [number, number] = [-4.2, 4.2];
const WALL_H = 4.6;
/* The window opening: behind the monitor and the lamp, on the right. The
   copy sits top left, over plain wall — glazing bars behind a headline cut
   through the words. */
export const WIN = { x0: 0.05, x1: 2.45, y0: 0.92, y1: 2.82 };

/* ---------- painted textures ---------- */

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function blur(c: CanvasRenderingContext2D, px: number) {
  /* Canvas filters are in every current engine; where one is missing the
     shapes simply stay sharp, which is still a view. */
  if ('filter' in c) c.filter = `blur(${px}px)`;
}

/** The view out of the window, out of focus. Wide, so the clouds can
    drift across it by sliding the texture. */
function viewCanvas(night: boolean) {
  const W = 2048, H = 768;
  const cv = canvas(W, H);
  const c = cv.getContext('2d')!;
  const sky = c.createLinearGradient(0, 0, 0, H);
  if (night) {
    sky.addColorStop(0, '#1A2433');
    sky.addColorStop(0.55, '#2E3B4C');
    sky.addColorStop(0.8, '#55505A');
    sky.addColorStop(1, '#3A3638');
  } else {
    sky.addColorStop(0, '#BFD4E0');
    sky.addColorStop(0.5, '#DCE8EC');
    sky.addColorStop(0.78, '#F1F2EA');
    sky.addColorStop(1, '#E8E6DA');
  }
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);

  // clouds, soft
  if (!night) {
    blur(c, 26);
    c.fillStyle = 'rgba(255,255,255,0.85)';
    const clouds = [[180, 150, 230, 54], [620, 110, 300, 62], [1080, 175, 260, 50],
                    [1500, 120, 320, 66], [1880, 160, 220, 48]];
    for (const [x, y, rx, ry] of clouds) {
      c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(x + rx * 0.4, y - ry * 0.5, rx * 0.6, ry * 0.8, 0, 0, Math.PI * 2); c.fill();
    }
  }

  // distant buildings
  blur(c, night ? 5 : 7);
  const blocks = [
    [40, 420, 170], [230, 360, 120], [380, 470, 200], [610, 330, 110], [740, 430, 170],
    [940, 390, 140], [1110, 460, 210], [1350, 350, 120], [1490, 420, 180], [1700, 380, 150], [1880, 450, 170],
  ];
  for (const [x, top, w] of blocks) {
    c.fillStyle = night ? '#1C2028' : '#C9CDC7';
    c.fillRect(x, top, w, H - top);
    // lit windows at night, unlit glazing by day
    for (let wy = top + 24; wy < H - 120; wy += 34) {
      for (let wx = x + 14; wx < x + w - 14; wx += 26) {
        const lit = night && (Math.sin(wx * 12.9898 + wy * 78.233) * 43758.5453) % 1 > 0.25;
        c.fillStyle = night ? (lit ? 'rgba(255,205,140,0.85)' : 'rgba(60,64,72,0.6)') : 'rgba(170,184,190,0.55)';
        c.fillRect(wx, wy, 12, 16);
      }
    }
  }

  // trees in front of the buildings, nearer and so softer still
  blur(c, night ? 10 : 14);
  for (let i = 0; i < 26; i++) {
    const x = (i / 26) * W + ((i * 137) % 60);
    const r = 70 + ((i * 53) % 60);
    c.fillStyle = night ? 'rgba(18,26,22,0.95)' : ['#8FA57E', '#7C956D', '#A3B58F'][i % 3];
    c.beginPath(); c.ellipse(x, H - 110, r, r * 0.85, 0, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = night ? '#121814' : '#86996F';
  c.fillRect(0, H - 90, W, 90);

  c.filter = 'none';
  return cv;
}

/** Pale oak boards, laid lengthwise. */
function floorCanvas() {
  const W = 1024, H = 1024;
  const cv = canvas(W, H);
  const c = cv.getContext('2d')!;
  const boards = 8;
  const bw = W / boards;
  for (let b = 0; b < boards; b++) {
    const shade = 214 + ((b * 37) % 14) - 7;
    c.fillStyle = `rgb(${shade},${shade - 16},${shade - 38})`;
    c.fillRect(b * bw, 0, bw, H);
    // grain
    for (let i = 0; i < 70; i++) {
      const x = b * bw + Math.random() * bw;
      c.strokeStyle = `rgba(120,95,60,${0.04 + Math.random() * 0.06})`;
      c.lineWidth = 0.6 + Math.random() * 1.4;
      c.beginPath();
      c.moveTo(x, 0);
      for (let y = 0; y <= H; y += 64) c.lineTo(x + Math.sin(y * 0.01 + i) * 3, y);
      c.stroke();
    }
    // the seam, and staggered butt joints
    c.fillStyle = 'rgba(90,70,45,0.35)';
    c.fillRect(b * bw, 0, 2, H);
    const joint = ((b * 311) % H);
    c.fillRect(b * bw, joint, bw, 2);
  }
  return cv;
}

/** Barely-there plaster, so the wall catches light like a wall. */
function plasterCanvas() {
  const S = 512;
  const cv = canvas(S, S);
  const c = cv.getContext('2d')!;
  c.fillStyle = '#F2EEE4';
  c.fillRect(0, 0, S, S);
  const img = c.getImageData(0, 0, S, S);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 9;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  c.putImageData(img, 0, 0);
  return cv;
}

/** A quiet print for the wall: an arch and a sun, in the room's colours. */
function printCanvas() {
  const W = 600, H = 780;
  const cv = canvas(W, H);
  const c = cv.getContext('2d')!;
  c.fillStyle = '#F6F2E8';
  c.fillRect(0, 0, W, H);
  // the mount
  c.fillStyle = '#EDE6D6';
  c.fillRect(70, 70, W - 140, H - 140);
  // the arch
  c.fillStyle = '#7F9070';
  c.beginPath();
  c.moveTo(150, 600); c.lineTo(150, 380);
  c.arc(300, 380, 150, Math.PI, 0); c.lineTo(450, 600); c.closePath(); c.fill();
  // the sun
  c.fillStyle = '#C79B57';
  c.beginPath(); c.arc(395, 250, 58, 0, Math.PI * 2); c.fill();
  // ground line
  c.fillStyle = '#3C433F';
  c.fillRect(120, 600, 360, 6);
  return cv;
}

function useTexture(make: () => HTMLCanvasElement, opts: { repeat?: [number, number]; srgb?: boolean } = {}) {
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(make());
    t.colorSpace = opts.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    t.anisotropy = 8;
    if (opts.repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(...opts.repeat);
    }
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/* ---------- parts ---------- */

function WallBlock({ x0, x1, y0, y1, map }: { x0: number; x1: number; y0: number; y1: number; map: THREE.Texture }) {
  const w = x1 - x0, h = y1 - y0;
  return (
    <mesh position={[(x0 + x1) / 2, (y0 + y1) / 2, WALL_Z]} castShadow receiveShadow raycast={NO_RAY}>
      <boxGeometry args={[w, h, WALL_T]} />
      <meshStandardMaterial map={map} roughness={0.95} metalness={0} envMapIntensity={0.35} />
    </mesh>
  );
}

const STEEL = '#2E3431';

/** The black steel window: an outer frame and glazing bars. The bars cast
    the shadows that fall across the desk. */
function WindowFrame() {
  const bars: { x: number; y: number; w: number; h: number }[] = [];
  const { x0, x1, y0, y1 } = WIN;
  const t = 0.04;
  bars.push({ x: (x0 + x1) / 2, y: y1 - t / 2, w: x1 - x0, h: t });
  bars.push({ x: (x0 + x1) / 2, y: y0 + t / 2, w: x1 - x0, h: t });
  bars.push({ x: x0 + t / 2, y: (y0 + y1) / 2, w: t, h: y1 - y0 });
  bars.push({ x: x1 - t / 2, y: (y0 + y1) / 2, w: t, h: y1 - y0 });
  // four lights across, a transom two thirds up
  for (let i = 1; i < 4; i++) bars.push({ x: x0 + ((x1 - x0) * i) / 4, y: (y0 + y1) / 2, w: 0.024, h: y1 - y0 });
  bars.push({ x: (x0 + x1) / 2, y: y0 + (y1 - y0) * 0.68, w: x1 - x0, h: 0.024 });
  return (
    <group position={[0, 0, WALL_Z]}>
      {bars.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, 0]} castShadow raycast={NO_RAY}>
          <boxGeometry args={[b.w, b.h, 0.05]} />
          <meshStandardMaterial color={STEEL} roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
      {/* the sill, deep enough to read */}
      <mesh position={[(x0 + x1) / 2, y0 - 0.012, WALL_T / 2 + 0.04]} castShadow receiveShadow raycast={NO_RAY}>
        <boxGeometry args={[x1 - x0 + 0.12, 0.024, 0.12]} />
        <meshStandardMaterial color="#EFEAE0" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** The view, set back behind the glass so it parallaxes as the camera
    drifts, and lit by nothing: it is the outdoors. */
function View({ night, reduced }: { night: boolean; reduced: boolean }) {
  const day = useTexture(() => viewCanvas(false));
  const dark = useTexture(() => viewCanvas(true));
  for (const t of [day, dark]) { t.wrapS = THREE.RepeatWrapping; t.repeat.set(0.62, 1); }
  useFrame((_, dt) => {
    if (reduced || night) return;
    day.offset.x = (day.offset.x + dt * 0.0016) % 1;    // clouds, about ten minutes a lap
  });
  const { x0, x1, y0, y1 } = WIN;
  const w = (x1 - x0) * 1.9, h = (y1 - y0) * 1.7;
  return (
    <mesh position={[(x0 + x1) / 2 + 0.2, (y0 + y1) / 2 + 0.1, WALL_Z - 1.4]} raycast={NO_RAY}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={night ? dark : day} toneMapped={false}
                         color={night ? '#B8B8C0' : '#FFFFFF'} />
    </mesh>
  );
}

/** A sheer curtain drawn to the left of the window, moving in the draught. A
    simple cloth: a grid of vertices nudged by two slow waves each frame. */
function Curtain({ reduced, night }: { reduced: boolean; night: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const W = 0.62, H = WIN.y1 - WIN.y0 + 0.5;
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(W, H, 18, 26);
    // gathered: a standing fold along the width
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 38) * 0.018);
    p.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, [H]);
  const base = useMemo(() => Float32Array.from((geo.attributes.position as THREE.BufferAttribute).array), [geo]);
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.getElapsedTime();
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
      const free = (H / 2 - y) / H;                    // hangs from the rail: the hem moves most
      const sway = Math.sin(t * 0.7 + y * 2.2 + x * 3) * 0.022 + Math.sin(t * 0.31 + x * 5) * 0.014;
      p.setZ(i, z + sway * free * free * 1.6);
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <mesh ref={ref} geometry={geo} position={[WIN.x0 + 0.2, (WIN.y0 + WIN.y1) / 2 + 0.18, WALL_FRONT + 0.07]}
          raycast={NO_RAY}>
      <meshStandardMaterial color={night ? '#D9D4C8' : '#FFFDF7'} transparent opacity={0.62}
                            roughness={1} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

/** A floating oak shelf with a few books and a small vase, right of the
    desk, and a framed print above it. */
function ShelfAndPrint() {
  const print = useTexture(printCanvas);
  const books = [
    { w: 0.035, h: 0.22, c: '#6E7F5E' }, { w: 0.028, h: 0.24, c: '#E8E0CF' },
    { w: 0.04, h: 0.2, c: '#3F4743' }, { w: 0.03, h: 0.23, c: '#B89961' },
    { w: 0.026, h: 0.19, c: '#A7B49A' }, { w: 0.034, h: 0.215, c: '#D8CDB6' },
  ];
  let x = 0;
  const SX = 2.72, SY = 1.38, SZ = WALL_FRONT + 0.11;
  return (
    <group>
      {/* the print */}
      <group position={[3.05, 1.98, WALL_FRONT + 0.012]}>
        <mesh castShadow raycast={NO_RAY}>
          <boxGeometry args={[0.5, 0.64, 0.024]} />
          <meshStandardMaterial color="#2F3532" roughness={0.45} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.0125]} raycast={NO_RAY}>
          <planeGeometry args={[0.46, 0.6]} />
          <meshStandardMaterial map={print} roughness={0.85} />
        </mesh>
      </group>

      {/* the shelf */}
      <mesh position={[SX + 0.3, SY, SZ]} castShadow receiveShadow raycast={NO_RAY}>
        <boxGeometry args={[0.9, 0.028, 0.22]} />
        <meshStandardMaterial color="#CDB894" roughness={0.6} />
      </mesh>
      {books.map((b, i) => {
        const bx = SX - 0.05 + x + b.w / 2;
        x += b.w + 0.003;
        return (
          <mesh key={i} position={[bx, SY + 0.014 + b.h / 2, SZ - 0.01]} castShadow receiveShadow
                rotation={[0, 0, i === 5 ? -0.12 : 0]} raycast={NO_RAY}>
            <boxGeometry args={[b.w, b.h, 0.16]} />
            <meshStandardMaterial color={b.c} roughness={0.75} />
          </mesh>
        );
      })}
      {/* a vase with one stem */}
      <group position={[SX + 0.55, SY + 0.014, SZ]}>
        <mesh position={[0, 0.07, 0]} castShadow raycast={NO_RAY}>
          <cylinderGeometry args={[0.035, 0.045, 0.14, 24]} />
          <meshStandardMaterial color="#F4F1EA" roughness={0.35} />
        </mesh>
        <mesh position={[0.01, 0.2, 0]} rotation={[0, 0, -0.12]} raycast={NO_RAY}>
          <cylinderGeometry args={[0.0025, 0.0025, 0.2, 6]} />
          <meshStandardMaterial color="#6B8459" />
        </mesh>
        <mesh position={[0.025, 0.3, 0]} raycast={NO_RAY}>
          <sphereGeometry args={[0.018, 12, 10]} />
          <meshStandardMaterial color="#E9D9B8" roughness={0.8} />
        </mesh>
      </group>
      {/* a low stack of magazines at the far end */}
      <mesh position={[SX + 0.66, SY + 0.03, SZ]} castShadow raycast={NO_RAY}>
        <boxGeometry args={[0.2, 0.03, 0.15]} />
        <meshStandardMaterial color="#E4DCCB" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Floor({ night }: { night: boolean }) {
  const map = useTexture(floorCanvas, { repeat: [3.2, 2.4] });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1.0]} receiveShadow raycast={NO_RAY}>
      <planeGeometry args={[8.4, 4.0]} />
      <meshStandardMaterial map={map} color={night ? '#8C8070' : '#FFFFFF'}
                            roughness={0.78} metalness={0} envMapIntensity={0.45} />
    </mesh>
  );
}

/** A skirting board, so floor and wall meet like a room's do. */
function Skirting() {
  return (
    <mesh position={[0, 0.05, WALL_FRONT + 0.008]} receiveShadow raycast={NO_RAY}>
      <boxGeometry args={[WALL_X[1] - WALL_X[0], 0.1, 0.016]} />
      <meshStandardMaterial color="#EEE9DE" roughness={0.6} />
    </mesh>
  );
}

export function Room({ night, reduced }: { night: boolean; reduced: boolean }) {
  const plaster = useTexture(plasterCanvas, { repeat: [6, 4] });
  return (
    <group>
      {/* the back wall, built round the window opening */}
      <WallBlock x0={WALL_X[0]} x1={WIN.x0} y0={0} y1={WALL_H} map={plaster} />
      <WallBlock x0={WIN.x1} x1={WALL_X[1]} y0={0} y1={WALL_H} map={plaster} />
      <WallBlock x0={WIN.x0} x1={WIN.x1} y0={0} y1={WIN.y0} map={plaster} />
      <WallBlock x0={WIN.x0} x1={WIN.x1} y0={WIN.y1} y1={WALL_H} map={plaster} />
      <WindowFrame />
      <View night={night} reduced={reduced} />
      <Curtain night={night} reduced={reduced} />
      <ShelfAndPrint />
      <Floor night={night} />
      <Skirting />
    </group>
  );
}
