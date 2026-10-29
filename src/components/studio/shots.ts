/* Camera destinations for the Transformation Desk.

   One overview plus one shot per interactive object. Positions are in
   metres in the same world as Scene.tsx: the desk top sits at y = 0.76,
   the desk spans roughly x ∈ [-1.15, 1.15] and z ∈ [-0.45, 0.45], and the
   camera always looks from the front-right so nothing is seen from behind.

   Each shot is framed to leave the object clear of the canvas edge at the
   widest supported aspect ratio, which is why the destinations sit further
   back than the object's own size would suggest. */

export type StudioState = 'overview' | 'work' | 'process' | 'ai' | 'services' | 'about';

export type Shot = {
  position: [number, number, number];
  target: [number, number, number];
};

export const CAMERA_SHOTS: Record<StudioState, Shot> = {
  /* Elevated three-quarter view, off-centre to the right. High enough to
     read the keyboard and the open notebook, low enough to keep depth,
     and far enough back that the legs, the plant and the lamp all sit
     inside the frame with room to spare. */
  overview: { position: [0.90, 1.17, 1.78], target: [0.04, 0.82, -0.05] },

  /* Laptop — the subject. Square to the screen, with the desk still under
     it so the view never floats free of the room. */
  work: { position: [0.10, 1.02, 0.66], target: [0.02, 0.86, -0.07] },

  /* Tablet on its stand, left of the laptop. */
  process: { position: [-0.33, 0.95, 0.44], target: [-0.58, 0.84, -0.03] },

  /* Monitor, behind and right. */
  ai: { position: [0.36, 1.06, 0.6], target: [0.56, 0.99, -0.26] },

  /* Notebook, seen from above-front so the spread is readable. */
  services: { position: [0.58, 1.13, 0.60], target: [0.50, 0.75, 0.21] },

  /* Framed portrait beside the laptop. */
  about: { position: [-0.09, 1.01, 0.67], target: [-0.28, 0.85, 0.21] },
};

/* A canvas narrower than about 16:9 gets its own framing, shot on the
   wider lens the rig switches to below that aspect, so the whole desk
   fits on a phone without anything being cut at the edges. */
export const MOBILE_OVERVIEW: Shot = {
  position: [0.66, 1.18, 1.63],
  target: [0.04, 0.80, -0.06],
};

export const PANEL_TITLES: Record<Exclude<StudioState, 'overview'>, string> = {
  work: 'Selected work',
  process: 'Process & CRM',
  ai: 'AI in action',
  services: 'Services & how I work',
  about: 'About',
};
