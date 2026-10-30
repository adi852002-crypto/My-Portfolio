import type { Config } from 'tailwindcss';

/* Every colour is a CSS variable, defined in globals.css, because the desk
   lamp swaps the whole palette between a dark green room and daylight.
   Both sets are contrast checked in scripts/check-contrast.mjs. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
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
