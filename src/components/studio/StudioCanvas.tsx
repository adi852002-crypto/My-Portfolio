'use client';

/* Everything WebGL lives behind this module so three.js and R3F are code-split
   out of the first load. StudioStage imports it with next/dynamic. */

import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Scene, { type SafeBand } from './Scene';
import { CAMERA_SHOTS, FOV, type StudioState } from './shots';

export type StudioCanvasProps = {
  state: StudioState;
  onPick: (s: Exclude<StudioState, 'overview'>) => void;
  pointer: React.RefObject<{ x: number; y: number }>;
  reduced: boolean;
  showMarkers: boolean;
  safe: React.RefObject<SafeBand>;
  active: boolean;
  onLost: () => void;
};

export default function StudioCanvas({
  state, onPick, pointer, reduced, showMarkers, active, onLost, safe,
}: StudioCanvasProps) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 1.75]}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 28, position: CAMERA_SHOTS.overview.position, near: 0.1, far: 60 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        /* Filmic tone mapping, so highlights on metal and ceramic roll off
           instead of clipping to white the way they did before. */
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.88,
      }}
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
        showMarkers={showMarkers}
        safe={safe}
      />
    </Canvas>
  );
}
