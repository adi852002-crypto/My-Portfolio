'use client';

/* Everything WebGL lives behind this module so three.js and R3F are code-split
   out of the first load. StudioStage imports it with next/dynamic. */

import { Canvas } from '@react-three/fiber';
import Scene from './Scene';
import { CAMERA_SHOTS, type StudioState } from './shots';

export type StudioCanvasProps = {
  state: StudioState;
  onPick: (s: Exclude<StudioState, 'overview'>) => void;
  pointer: React.RefObject<{ x: number; y: number }>;
  reduced: boolean;
  showLabels: boolean;
  active: boolean;
  onLost: () => void;
};

export default function StudioCanvas({
  state, onPick, pointer, reduced, showLabels, active, onLost,
}: StudioCanvasProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 34, position: CAMERA_SHOTS.overview.position, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          onLost();
        });
      }}
      style={{ background: 'transparent' }}
    >
      <Scene
        state={state}
        onPick={onPick}
        pointer={pointer}
        reduced={reduced}
        showLabels={showLabels}
      />
    </Canvas>
  );
}
