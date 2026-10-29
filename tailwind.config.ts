import type { Config } from 'tailwindcss';

/* Tokens taken from the approved "Transformation Studio" visual.
   Contrast checked in scripts/check-contrast.mjs — see README. */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory:    '#F7F5EF',   // page background
        surface:  '#FFFEFA',   // cards, panels
        sage:     '#46563C',   // primary accent
        'sage-soft': '#E3E7DA',
        ink:      '#172018',   // primary text
        'ink-soft': '#51564F',  // secondary text (darkened from #5D625B for AA)
        line:     '#DADDD2',   // hairline dividers (decorative)
        'line-strong': '#92948D', // borders on form controls (3:1, WCAG 1.4.11)
        brass:    '#816B44',   // text-safe accent (darkened from #B89961 for 4.5:1 on ivory)
        'brass-bright': '#B89961', // decorative use only, never text
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans:  ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      maxWidth: { shell: '1240px' },
      transitionTimingFunction: { soft: 'cubic-bezier(.22,.61,.36,1)' },
    },
  },
  plugins: [],
} satisfies Config;
