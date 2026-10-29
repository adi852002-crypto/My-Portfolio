/* Explicit camera states and their shots. Kept in a plain module so the
   state machine is readable and testable without a renderer. */

export type StudioState = 'overview' | 'process' | 'ai' | 'work';

export type Shot = {
  position: [number, number, number];
  target: [number, number, number];
};

/* An elevated three-quarter view: it shows the desk surface, the floor
   depth under the furniture, and keeps the character plane close to
   face-on so its flat edge never reads. */
export const CAMERA_SHOTS: Record<StudioState, Shot> = {
  overview: { position: [1.60, 1.85, 4.90], target: [0.05, 1.05, -0.55] },
  process:  { position: [-0.60, 1.95, 1.95], target: [-1.25, 1.72, -2.24] },
  ai:       { position: [2.10, 1.72, 1.05], target: [1.90, 1.52, -2.10] },
  work:     { position: [0.95, 1.42, 2.15], target: [0.45, 0.82, -0.15] },
};

export const PANEL_TITLES: Record<Exclude<StudioState, 'overview'>, string> = {
  process: 'Process & CRM',
  ai: 'AI in action',
  work: 'Selected work',
};
