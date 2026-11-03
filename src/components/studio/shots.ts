/* Camera destinations for the Transformation Desk.

   One overview plus one shot per interactive object, in metres in the same
   world as Scene.tsx. Every destination sits on the object's own surface
   normal, so the object is seen square rather than raked, and the path from
   the overview passes in front of the desk rather than through it.

   Phones get their own compositions rather than a pulled-back desktop one:
   the field of view is vertical, so a portrait canvas would otherwise crop
   the desk at the sides. */

export type StudioState = 'overview' | 'work' | 'process' | 'ai' | 'about' | 'note' | 'contact' | 'success' | 'hiring' | 'startups' | 'enterprise';

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

  /* The two boards in the sorter, each square on so its tab and promise
     can be read. They sit side by side, so the shots differ mostly in x. */
  startups:   { position: [-0.305, 1.00, 0.48], target: [-0.37, 0.815, 0.185] },
  enterprise: { position: [-0.155, 1.00, 0.51], target: [-0.22, 0.815, 0.212] },

  /* The printed CV, square on from above — it is a page, so it is read
     the way a page is read. */
  hiring: { position: [-0.80, 1.158, 0.26], target: [-0.80, 0.75, 0.07] },

  /* The green notebook, from above, so the years on its cover can be read. */
  work: { position: [-0.585, 1.19, 0.37], target: [-0.655, 0.77, 0.085] },

  /* The laptop screen, square on. */
  success: { position: [0.07, 1.07, 0.77], target: [0.01, 0.85, -0.06] },

  /* The tablet on its folio stand. */
  process: { position: [-0.30, 1.10, 0.66], target: [-0.57, 0.84, -0.05] },

  /* The monitor, pulled back enough to keep the panel clear of the edge. */
  ai: { position: [0.02, 1.11, 1.00], target: [0.38, 1.05, -0.24] },

  /* The framed portrait, approached from its left so the laptop lid stays
     out of the sight line. */
  about: { position: [-0.27, 0.93, 0.44], target: [-0.33, 0.81, -0.24] },

  /* The open notebook, from above and in front, so what is written on it
     can be read. */
  note: { position: [0.63, 1.22, 0.555], target: [0.56, 0.76, 0.15] },

  /* The phone, close enough that its screen is the frame. Its panel leans
     back, so the camera meets it on its own normal rather than from above. */
  contact: { position: [0.19, 1.036, 0.618], target: [0.19, 0.825, 0.165] },
};

/* Portrait: a narrower slice of the same desk, framed on the devices. */
export const MOBILE_SHOTS: Record<StudioState, Shot> = {
  overview: { position: [0.13, 2.05, 2.64], target: [0.06, 0.99, -0.06] },
  startups:   { position: [-0.325, 1.05, 0.59], target: [-0.37, 0.815, 0.185] },
  enterprise: { position: [-0.175, 1.05, 0.62], target: [-0.22, 0.815, 0.212] },
  hiring:   { position: [-0.80, 1.28, 0.317], target: [-0.80, 0.75, 0.07] },
  work:     { position: [-0.56, 1.335, 0.472], target: [-0.655, 0.77, 0.085] },
  success:  { position: [0.09, 1.14, 1.01], target: [0.01, 0.85, -0.06] },
  process:  { position: [-0.22, 1.18, 0.88], target: [-0.57, 0.84, -0.05] },
  ai:       { position: [-0.09, 1.13, 1.38], target: [0.38, 1.05, -0.24] },
  about:    { position: [-0.25, 0.96, 0.64], target: [-0.33, 0.81, -0.24] },
  note:     { position: [0.65, 1.37, 0.695], target: [0.56, 0.76, 0.15] },
  contact:  { position: [0.19, 1.10, 0.754], target: [0.19, 0.825, 0.165] },
};

export const PANEL_TITLES: Record<Exclude<StudioState, 'overview'>, string> = {
  startups: 'For startups',
  enterprise: 'For enterprise',
  hiring: 'For recruiters',
  work: 'Work history',
  success: 'Customer success',
  process: 'Process & CRM',
  ai: 'AI in action',
  about: 'About',
  note: 'Leave a note',
  contact: 'Contact',
};
