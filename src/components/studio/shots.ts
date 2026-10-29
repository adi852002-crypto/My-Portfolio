/* Camera destinations for the Transformation Desk.

   One overview plus one shot per interactive object, in metres in the same
   world as Scene.tsx. Every destination sits on the object's own surface
   normal, so the object is seen square rather than raked, and the path from
   the overview passes in front of the desk rather than through it.

   Phones get their own compositions rather than a pulled-back desktop one:
   the field of view is vertical, so a portrait canvas would otherwise crop
   the desk at the sides. */

export type StudioState = 'overview' | 'work' | 'process' | 'ai' | 'about';

export type Shot = {
  position: [number, number, number];
  target: [number, number, number];
};

/** Vertical field of view, in degrees. Restrained, to avoid wide-angle
    distortion across a desk this close to the camera. */
export const FOV = 22;

/* Landscape: a low, almost straight-on view just above the desk surface,
   close enough that the desk runs past both edges of a full-bleed frame. */
export const CAMERA_SHOTS: Record<StudioState, Shot> = {
  overview: { position: [0.10, 2.19, 2.71], target: [0.02, 1.02, -0.05] },

  /* The laptop screen, square on. */
  work: { position: [0.07, 1.07, 0.77], target: [0.01, 0.85, -0.06] },

  /* The tablet on its folio stand. */
  process: { position: [-0.30, 1.10, 0.66], target: [-0.57, 0.84, -0.05] },

  /* The monitor, pulled back enough to keep the panel clear of the edge. */
  ai: { position: [0.02, 1.11, 1.00], target: [0.38, 1.05, -0.24] },

  /* The framed portrait, approached from its left so the laptop lid stays
     out of the sight line. */
  about: { position: [-0.27, 0.93, 0.44], target: [-0.33, 0.81, -0.24] },
};

/* Portrait: a narrower slice of the same desk, framed on the devices. */
export const MOBILE_SHOTS: Record<StudioState, Shot> = {
  overview: { position: [0.13, 2.05, 2.64], target: [0.06, 0.99, -0.06] },
  work:     { position: [0.09, 1.14, 1.01], target: [0.01, 0.85, -0.06] },
  process:  { position: [-0.22, 1.18, 0.88], target: [-0.57, 0.84, -0.05] },
  ai:       { position: [-0.09, 1.13, 1.38], target: [0.38, 1.05, -0.24] },
  about:    { position: [-0.25, 0.96, 0.64], target: [-0.33, 0.81, -0.24] },
};

export const PANEL_TITLES: Record<Exclude<StudioState, 'overview'>, string> = {
  work: 'Selected work',
  process: 'Process & CRM',
  ai: 'AI in action',
  about: 'About',
};
