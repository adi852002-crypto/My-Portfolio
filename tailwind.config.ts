import type { Config } from 'tailwindcss';

/* A dark, green-black room with the desk lamp doing the work.
   Contrast checked in scripts/check-contrast.mjs — see README. */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory:    '#101A12',   // page background — deep green
        surface:  '#1B261D',   // cards, panels
        sage:     '#A9C089',   // accent: links, active state, primary button
        'sage-soft': '#273523', // tinted chip behind sage text
        ink:      '#ECEFE4',   // primary text
        'ink-soft': '#A5AD9B', // secondary text
        'ink-invert': '#101A12', // text on a sage button
        line:     '#2C3A2F',   // hairline dividers (decorative)
        'line-strong': '#6C7A6E', // borders on form controls (3:1, WCAG 1.4.11)
        brass:    '#D4B37B',   // text-safe accent
        'brass-bright': '#E6C98F', // decorative use only, never text
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
