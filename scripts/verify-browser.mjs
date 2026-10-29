/* Renders the exported site in headless Chromium with a real WebGL context
   and checks what a screenshot cannot: that each destination reframes the
   3D view, that the return control comes back to the same view, that every
   object on the desk is clickable, and that mobile and reduced motion work.

   Serve the export first, then run this:
     cd out && python3 -m http.server 8099 &
     node scripts/verify-browser.mjs
   Screenshots land in .verify/.                                          */
import { PNG } from 'pngjs';
import fs from 'node:fs';

/* Use the project's playwright when its browsers are installed
   (npx playwright install chromium); otherwise fall back to a global one,
   which is how this runs in the build container. */
const PW_FALLBACK = process.env.PLAYWRIGHT_MODULE
  ?? '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
let chromium;
try {
  ({ chromium } = await import('playwright'));
  await (await chromium.launch()).close();
} catch {
  ({ chromium } = await import(PW_FALLBACK));
}

const BASE = process.env.VERIFY_URL ?? 'http://127.0.0.1:8099/';
const OUT = '.verify';
let fails = 0;
const ok = (name, pass, extra = '') => {
  if (!pass) { fails++; console.log(`  FAIL  ${name}${extra ? ' — ' + extra : ''}`); }
  else console.log(`  pass  ${name}${extra ? ' — ' + extra : ''}`);
};

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

/** Mean absolute pixel difference between two PNG buffers, 0–255. */
function diff(a, b) {
  const A = PNG.sync.read(a), B = PNG.sync.read(b);
  if (A.width !== B.width || A.height !== B.height) return 255;
  let sum = 0;
  for (let i = 0; i < A.data.length; i += 4) {
    sum += Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1])
         + Math.abs(A.data[i + 2] - B.data[i + 2]);
  }
  return +(sum / (A.data.length / 4) / 3).toFixed(2);
}

const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
});

async function open(opts) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas', { timeout: 20000 });
  await page.waitForTimeout(2600);
  return { ctx, page, errors };
}

console.log('\n— Desktop (1440×900) —');
const d = await open({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const canvas = d.page.locator('canvas');

const gl = await d.page.evaluate(() => {
  const c = document.querySelector('canvas');
  return !!(c.getContext('webgl2') || c.getContext('webgl'));
});
ok('a real WebGL context is running', gl);

const overview = await canvas.screenshot({ path: `${OUT}/01-overview.png` });
let i = 2;
for (const [id, label] of [['work', 'Work'], ['process', 'Process & CRM'],
                           ['ai', 'AI in action'], ['about', 'About']]) {
  const btn = d.page.locator('button').filter({ hasText: new RegExp(`^${label}`) }).first();
  await btn.click();
  await d.page.waitForTimeout(1600);
  const after = await canvas.screenshot({ path: `${OUT}/0${i++}-${id}.png` });
  ok(`${id}: the view reframes`, diff(overview, after) > 8, `${diff(overview, after)}/255`);
  ok(`${id}: the panel opens`, !!(await d.page.locator('[role="region"]').first().getAttribute('aria-label')));
  ok(`${id}: the control reports pressed`, (await btn.getAttribute('aria-pressed')) === 'true');

  await d.page.locator('button').filter({ hasText: 'Back to desk' }).first().click();
  await d.page.waitForTimeout(1700);
  const back = await canvas.screenshot();
  ok(`${id}: Back to desk returns to the overview`, diff(overview, back) < 1.5, `${diff(overview, back)}/255`);
  ok(`${id}: the panel closes`, (await d.page.locator('[role="region"]').count()) === 0);
}

await d.page.locator('button').filter({ hasText: /^AI in action/ }).first().click();
await d.page.waitForTimeout(500);
await d.page.keyboard.press('Escape');
await d.page.waitForTimeout(400);
ok('Escape closes the panel', (await d.page.locator('[role="region"]').count()) === 0);
await d.page.waitForTimeout(1600);

await d.page.locator('button').filter({ hasText: /^Process & CRM/ }).first().focus();
await d.page.keyboard.press('Enter');
await d.page.waitForTimeout(700);
ok('keyboard activation works',
   (await d.page.locator('[role="region"]').first().getAttribute('aria-label')) === 'Process & CRM');
await d.page.keyboard.press('Escape');
await d.page.waitForTimeout(1700);

await d.page.evaluate(() => window.scrollTo(0, 0));
await d.page.waitForTimeout(300);
const fold = await d.page.evaluate(() => {
  const links = [...document.querySelectorAll('main a')].filter((a) => a.getAttribute('href') === '/contact/');
  const last = links[links.length - 1];
  return last ? Math.round(last.getBoundingClientRect().bottom) : null;
});
ok('the overview fits roughly one viewport', fold !== null && fold < 960, `${fold}px of 900`);
ok('no console errors on desktop', d.errors.length === 0, d.errors.join(' | '));
await d.page.screenshot({ path: `${OUT}/10-desktop-page.png` });
await d.ctx.close();

console.log('\n— Clicking the objects themselves —');
/* Fractions of the canvas box, read off the rendered overview. Markers are
   disabled first so only the 3D geometry can be hit. */
for (const [name, fx, fy, expect] of [
  ['tablet', 0.287, 0.454, 'Process & CRM'],
  ['portrait', 0.324, 0.505, 'About'],
  ['laptop', 0.515, 0.454, 'Selected work'],
  ['monitor', 0.747, 0.343, 'AI in action'],
  ['notebook', 0.664, 0.694, 'Services & how I work'],
]) {
  const o = await open({ viewport: { width: 1440, height: 900 } });
  await o.page.evaluate(() => {
    for (const el of document.querySelectorAll('[data-studio-label]')) el.style.pointerEvents = 'none';
  });
  const box = await o.page.locator('canvas').boundingBox();
  await o.page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await o.page.waitForTimeout(900);
  const got = await o.page.locator('[role="region"]').first().getAttribute('aria-label').catch(() => null);
  ok(`clicking the ${name} opens "${expect}"`, got === expect, got ?? 'no hit');
  await o.ctx.close();
}

console.log('\n— Mobile (390×844) —');
const m = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const mi = await m.page.evaluate(() => ({
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  navVisible: !!document.querySelector('nav[aria-label="Studio"] button')?.offsetParent,
  small: [...document.querySelectorAll('nav[aria-label="Studio"] button, nav[aria-label="Studio"] a')]
    .map((e) => Math.round(e.getBoundingClientRect().height)).filter((h) => h > 0 && h < 44).length,
}));
ok('no horizontal overflow', mi.overflow === 0, `${mi.overflow}px`);
ok('the navigation row is visible on a phone', mi.navVisible);
ok('every control is at least 44px tall', mi.small === 0);
ok('no console errors on mobile', m.errors.length === 0, m.errors.join(' | '));
await m.page.screenshot({ path: `${OUT}/20-mobile-page.png` });
await m.ctx.close();

console.log('\n— Reduced motion —');
const r = await open({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const before = await r.page.locator('canvas').screenshot();
await r.page.locator('button').filter({ hasText: /^Process & CRM/ }).first().click();
await r.page.waitForTimeout(220);                       // far shorter than the 800ms ease
const settled = await r.page.locator('canvas').screenshot({ path: `${OUT}/30-reduced-motion.png` });
await r.page.waitForTimeout(1600);
const final = await r.page.locator('canvas').screenshot();
ok('the view arrives at once instead of easing', diff(before, settled) > 8 && diff(settled, final) < 2,
   `jump=${diff(before, settled)}/255, drift after=${diff(settled, final)}/255`);
ok('no console errors under reduced motion', r.errors.length === 0, r.errors.join(' | '));
await r.ctx.close();

await browser.close();
console.log(fails ? `\n${fails} CHECK(S) FAILED\n` : '\nALL BROWSER CHECKS PASSED\n');
process.exit(fails ? 1 : 0);
