import type { Config } from 'tailwindcss';

/* Every colour is a CSS variable, defined in globals.css, because the desk
   lamp swaps the whole palette between a dark green room and daylight.
   Both sets are contrast checked in scripts/check-contrast.mjs. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      /* A phone held sideways has plenty of width and almost no height, so
         the chrome has to give the scene room back. */
      /* `mid` is a laptop: a 1366×768 screen, or 1920×1080 at 125% scaling,
         leaves a browser window around 650–730px tall. There the hero copy
         and the rail used to take five sixths of the height between them and
         the desk was pushed up under the buttons. Declared before `short` so
         the phone-sideways rules still win where both apply. */
      /* Because these are raw queries, Tailwind does not generate `max-sm:`
         or `min-[…]:` variants for this project — they compile to nothing.
         The width ranges that need them are named here instead. */
      screens: {
        xs:    { raw: '(min-width: 360px)' },
        phone: { raw: '(max-width: 639.98px)' },
        tiny:  { raw: '(max-width: 359.98px)' },   // a 320px phone
        wide:  { raw: '(min-width: 1760px)' },
        mid:   { raw: '(max-height: 820px)' },
        /* Any screen with width to spare beside the desk — a laptop, a
           monitor, a tablet or a phone on its side. There the copy steps
           back into the top-left corner and the desk takes the screen.
           After `mid`, so the corner sizes win on a laptop-height window;
           before `short`, so a sideways phone still drops the lede. */
        corner: { raw: '(min-width: 768px) and (orientation: landscape)' },
        short: { raw: '(max-height: 560px)' },
      },
      colors: {
        ivory:          token('ivory'),        // page background
        surface:        token('surface'),      // cards, panels
        sage:           token('sage'),         // links, active state, primary button
        'sage-soft':    token('sage-soft'),    // tinted chip behind sage text
        'sage-hover':   token('sage-hover'),
        ink:            token('ink'),          // primary text
        'ink-soft':     token('ink-soft'),     // secondary text
        'ink-invert':   token('ink-invert'),   // text on a sage button
        line:           token('line'),         // hairline dividers (decorative)
        'line-strong':  token('line-strong'),  // form borders (3:1, WCAG 1.4.11)
        brass:          token('brass'),        // text-safe accent
        'brass-bright': token('brass-bright'), // decorative only, never text
        error:          token('error'),        // form errors, in either room
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans:  ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      maxWidth: { shell: '1320px' },
      transitionTimingFunction: { soft: 'cubic-bezier(.22,.61,.36,1)' },
    },
  },
  plugins: [],
} satisfies Config;
