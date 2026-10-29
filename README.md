# Aniruddha Dasgupta — consulting site

The "Transformation Studio" personal site. Next.js 15 (App Router) + TypeScript +
Tailwind, exported as **static HTML** so it drops straight onto the existing
Cloudflare Pages deployment at `aniruddhadasgupta.pages.dev`. No server, no
database, no environment variables.

---

## Install, develop, build

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # writes ./out  — this folder is what you upload
```

### Checks

```bash
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # 16 interaction tests (jsdom + testing-library)
npm run audit      # 70+ static checks against the exported HTML in ./out
npm run contrast   # WCAG contrast check on the design tokens
npm run check      # typecheck + lint + build
```

`npm run audit` must be run **after** `npm run build`, since it reads `./out`.

---

## Deploying

The build output is a plain static folder. Nothing in it needs a runtime.

**Cloudflare Pages (current setup)**
- Drag-and-drop: upload the **contents of `out/`**.
- Or connect the repo with build command `npm run build` and output directory `out`.

`trailingSlash: true` is set, so `/work/telstra-service-delivery/` resolves to a
real `index.html` on any static host.

> `NEXT_PUBLIC_*` variables are not used. There is nothing secret in the bundle.

---

## Editing content

**All business content lives in one file: `src/data/site.ts`.** Nothing is
duplicated inside components.

| What | Where in `src/data/site.ts` |
|---|---|
| Name, email, phone, LinkedIn, location | `PROFILE` |
| Booking link | `PROFILE.bookingUrl` |
| CV download | `PROFILE.resumeUrl` |
| Hero eyebrow, headline, copy, buttons | `HERO` |
| Three-part summary under the hero | `SUMMARY` |
| Service areas and their deliverables | `SERVICES` |
| Selected work (also generates `/work/[slug]`) | `WORK` |
| How I work | `PROCESS` |
| About copy and credentials | `ABOUT` |
| Contact headline and the topic list | `CONTACT` |
| Scene hotspots and their positions | `HOTSPOTS` |

Adding a work item to `WORK` automatically creates its detail page at build time.

### Turning on the booking button

`PROFILE.bookingUrl` is `null`. While it is null, "Book a discovery call"
scrolls to the contact form and preselects the **Discovery call** topic. Set it
to a real booking URL once one exists — it is deliberately not pointed at a
guessed Calendly/Cal.com address.

### Adding the CV download

`PROFILE.resumeUrl` is `null`, so no download link renders. Put an approved PDF
in `public/` and set the path (e.g. `/aniruddha-dasgupta-cv.pdf`).

---

## Turning on the contact form

**Today the form does not send anything, and does not pretend to.** It validates,
composes the message, and opens the visitor's own email client. The button says
"Open in your email app" and the note under it states that nothing is sent from
the website and nothing is stored. No data leaves the browser.

To make it submit for real you need a form endpoint, because a static export has
no server. Two routes:

1. **A form service** (Formspree, Web3Forms, Basin). Easiest: replace the
   `link.click()` hand-off in `src/components/ContactForm.tsx` with a `fetch`
   POST to the endpoint. Only show success **after** the provider responds OK —
   and word it as "the provider accepted it", not "it reached his inbox".
2. **Cloudflare Pages Functions.** Add `functions/api/contact.ts`, keep the API
   key in Pages environment variables, validate and rate-limit server-side.

If you do either, update the privacy wording in the form, which currently
correctly says nothing is stored.

---

## The studio scene — what it actually is

**It is layered 2D art, not a 3D render.** Being precise about this because it
affects what you can ask of it:

- There is **no rigged character model** (no GLB/glTF/FBX) in this project. The
  only character asset supplied was a PNG turnaround sheet.
- The character is a **transparent cutout** taken from that sheet (front view),
  background removed.
- The room is **layered SVG**, drawn procedurally by `scripts/scene.py` (kept in
  the repo for regeneration).
- Movement is **whole-layer parallax on pointer move** — four layers sliding by
  4–22px. This is image parallax. It is **not** skeletal animation, and the
  character does not breathe, blink, gesture or turn.
- The viewing angle is fixed head-on, so the cutout's flat edge is never exposed.

### Scene files (`public/scene/`)

| File | Role |
|---|---|
| `poster.webp` | The whole scene flattened. Paints first, carries the alt text, and is the complete fallback if layers fail. |
| `back.svg` | Wall, workflow board, monitor, slat panel, shelf |
| `mid.svg` | Platform, rug, desk, chairs, laptop, tree |
| `character.webp` | The cutout, alone on the canvas |
| `front.svg` | Foreground vines and the book stack |

**Every file is drawn on the same 1200×1000 canvas.** That is what keeps them
aligned: each is rendered with `object-contain` into an identically-proportioned
box, so there are no manual offsets to drift. Verified — stacking the four layers
reproduces the poster to a mean difference of 1.41/255.

The poster crossfades out only once all four layers have decoded, so the scene is
never shown half-drawn or doubled.

### Replacing the cutout with a real 3D model

The scene is isolated behind one component. Nothing else in the site knows how
the picture is made.

1. Put the GLB in `public/scene/`.
2. In `src/components/Studio.tsx`, replace **only** the block that renders
   `<img>` layers with your canvas (e.g. React Three Fiber). Keep the wrapper
   `<div>` with its `aspectRatio`, so the reserved space and CLS behaviour hold.
3. Leave everything else alone: `HOTSPOTS` in `src/data/site.ts`, the hotspot
   buttons, `StudioButtons`, the parallax gating, the error fallback.
4. Keep the poster as the pre-3D placeholder and the WebGL-unavailable fallback.
5. Validate the model before wiring it up: that it loads, its scale and
   orientation, its bounding box, which animation clips exist, and that it
   resembles the reference sheet. Use only clips that are actually present.

### Regenerating the scene art

```bash
python3 scripts/scene.py     # writes the SVG layers
```
Requires `cairosvg` and `Pillow` to re-render the poster.

---

## Replacing the fonts

The site uses a **system font stack** — Georgia for headings, the system UI sans
for everything else. This was a deliberate choice: Google Fonts was unreachable
from the build environment, and the stack means zero font downloads, zero layout
shift and no licensing question.

To use a licensed webfont, put subset `.woff2` files in `public/fonts/`, add
`@font-face` rules in `src/app/globals.css`, and point `--font-serif` /
`--font-sans` at them. Keep `font-display: swap` and preload only the weights you
actually use.

---

## Accessibility notes

Targets WCAG 2.2 AA. Implemented: semantic landmarks, one `h1`, no skipped
heading levels, skip link, visible focus (never removed), labelled form fields
with `aria-invalid` and referenced error messages, `aria-pressed` on toggles,
44×44px minimum targets, descriptive link text, decorative images with empty
`alt`, and `prefers-reduced-motion` handling that disables parallax and makes the
AI demo complete instantly rather than animating.

`npm run contrast` verifies every colour pair. Two tokens were darkened from the
brief's starting values to reach AA: `brass` `#B89961 → #816B44` for text, and a
separate `line-strong` `#92948D` for form borders (the hairline `#DADDD2` is
decorative only and is never used to convey state).

---

## Content rules this site follows

- No testimonials, client endorsements, client logos or case studies.
- No revenue, savings, growth or efficiency metrics.
- No awards. No Lean Six Sigma, PMP, PRINCE2, ITIL or Zoho CRM certifications.
- Employment dates come from the supplied CV. Dynamic Travels is shown as
  **Feb 2026 – Apr 2026**, with on-call advisory after.
- Roles held as an employee are labelled "Past work — employed role" and the
  page states these are not client engagements and imply no endorsement.
- The two demonstrations are labelled "Illustrative workflow" and "Sample data",
  and the AI demo states it calls no AI service.
- Structured data describes only facts printed on the CV. No ratings.
