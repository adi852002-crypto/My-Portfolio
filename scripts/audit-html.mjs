/* Static audit of the exported HTML against the acceptance criteria that can
   be checked without a browser. Run: node scripts/audit-html.mjs           */
import { readFileSync, existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const OUT = 'out';
let fails = 0;
const ok = (name, pass, extra = '') => {
  if (!pass) { fails++; console.log(`  FAIL  ${name}${extra ? ' — ' + extra : ''}`); }
  else console.log(`  pass  ${name}`);
};

const load = (p) => new JSDOM(readFileSync(`${OUT}/${p}`, 'utf8')).window.document;

console.log('\n— Exported pages —');
for (const p of [
  'index.html',
  'work/dynamic-travels-transformation/index.html',
  'work/ultimatix-escalation-operations/index.html',
  'work/telstra-service-delivery/index.html',
  '404.html',
  'sitemap.xml',
  'robots.txt',
  'og.png',
  'icon.svg',
  'scene/poster.webp',
  'scene/person.webp',
]) ok(`exists: ${p}`, existsSync(`${OUT}/${p}`));

const home = load('index.html');

console.log('\n— Document structure —');
ok('exactly one h1', home.querySelectorAll('h1').length === 1,
   `found ${home.querySelectorAll('h1').length}`);
ok('html lang set', home.documentElement.getAttribute('lang') === 'en');
ok('<main> landmark', !!home.querySelector('main'));
ok('<header> landmark', !!home.querySelector('header'));
ok('<footer> landmark', !!home.querySelector('footer'));
ok('skip link first focusable', /Skip to content/.test(home.body.innerHTML.slice(0, 900)));
ok('skip link targets #main', home.querySelector('a[href="#main"]') && !!home.querySelector('#main'));

const levels = [...home.querySelectorAll('h1,h2,h3')].map((h) => +h.tagName[1]);
let jump = null;
for (let i = 1; i < levels.length; i++) if (levels[i] - levels[i - 1] > 1) jump = `${levels[i-1]}→${levels[i]}`;
ok('no skipped heading levels', !jump, jump ?? '');

console.log('\n— Content must be real HTML, not baked into images —');
const text = home.body.textContent.replace(/\s+/g, ' ');
for (const phrase of [
  'Better operations.', 'More room to grow.',
  'I help teams simplify processes',
  'Simplify operations', 'Strengthen customer experience', 'Make AI useful',
  'Operations & Process Improvement', 'Customer Success & Service Delivery', 'CRM & Practical AI',
  'Understand', 'Simplify', 'Implement', 'Improve',
  'Let’s make your business work better.',
]) ok(`copy present: "${phrase.slice(0, 38)}"`, text.includes(phrase));

console.log('\n— Honesty checks (nothing invented) —');
const banned = [
  ['Lean Six Sigma', /lean six sigma/i], ['PMP', /\bPMP\b/], ['PRINCE2', /prince ?2/i],
  ['ITIL', /\bITIL\b/], ['Zoho', /zoho/i],
  ['testimonial markup', /testimonial/i],
  ['star rating', /aggregateRating|ratingValue/i],
  ['fake percentage claim', /\b\d{1,3}%\s*(increase|reduction|improvement|uplift|growth)/i],
];
const raw = readFileSync(`${OUT}/index.html`, 'utf8');
for (const [label, re] of banned) ok(`absent: ${label}`, !re.test(raw));
ok('employment framed as roles, not clients',
   text.includes('not client engagements') || text.includes('Past work — employed role'));
ok('demonstrations labelled illustrative / sample',
   /Illustrative/i.test(text) && /Sample data/i.test(text));
ok('AI demo declares sample data', /sample data/i.test(text));
ok('contact does not promise delivery',
   !/we('|’)ll get back|message sent|thanks for your message/i.test(text));
ok('contact states it opens an email app', /opens your own email app/i.test(text));

console.log('\n— Links —');
const anchors = [...home.querySelectorAll('a[href^="#"]')];
const missing = anchors.map((a) => a.getAttribute('href')).filter((h) => h !== '#' && !home.querySelector(h));
ok('all in-page anchors resolve', missing.length === 0, missing.join(', '));
ok('header nav has Work / Services / About',
   ['#work', '#services', '#about'].every((h) => home.querySelector(`header a[href="${h}"]`)));
ok('"Let’s talk" present in header', /Let’s talk/.test(home.querySelector('header').textContent));
ok('hero primary goes to selected work', !!home.querySelector('main a[href="#work"]'));
const ext = [...home.querySelectorAll('a[target="_blank"]')];
ok('external links carry rel=noopener',
   ext.length > 0 && ext.every((a) => (a.getAttribute('rel') ?? '').includes('noopener')));
ok('work detail links present',
   home.querySelectorAll('a[href^="/work/"]').length >= 3);

console.log('\n— Images —');
const imgs = [...home.querySelectorAll('img')];
const noAlt = imgs.filter((i) => i.getAttribute('alt') === null);
ok('every img has an alt attribute', noAlt.length === 0, `${noAlt.length} missing`);
ok('any decorative image uses empty alt',
   imgs.every((i) => i.getAttribute('alt') !== null));
ok('scene poster has descriptive alt',
   imgs.some((i) => (i.getAttribute('alt') ?? '').length > 40));
ok('scene reserves space (no CLS)',
   /aspect-ratio/.test(raw) || imgs.some((i) => i.hasAttribute('width') && i.hasAttribute('height')));

console.log('\n— Forms —');
const fields = [...home.querySelectorAll('input, textarea, select')];
const unlabelled = fields.filter((f) => {
  const id = f.getAttribute('id');
  return !(id && home.querySelector(`label[for="${id}"]`)) && !f.getAttribute('aria-label');
});
ok('every form field has a label', unlabelled.length === 0,
   unlabelled.map((f) => f.getAttribute('name')).join(', '));
ok('phone is not a required field', !home.querySelector('input[name="phone"][required]'));
const topics = [...home.querySelectorAll('select#topic option')].map((o) => o.textContent);
for (const t of ['Operations and processes','Customer success','CRM','AI and automation','Something else'])
  ok(`topic option: ${t}`, topics.includes(t));

console.log('\n— SEO —');
ok('title set', /Operations, Customer Success & AI Transformation/.test(home.title));
const desc = home.querySelector('meta[name="description"]')?.content ?? '';
ok('meta description 50–170 chars', desc.length >= 50 && desc.length <= 170, `${desc.length}`);
const canon = home.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
ok('canonical is the production domain', canon.startsWith('https://aniruddhadasgupta.pages.dev'), canon);
ok('no preview URL as canonical', !/vercel\.app|localhost|example\.com/.test(canon));
ok('og:title + og:image', !!home.querySelector('meta[property="og:title"]') &&
   !!home.querySelector('meta[property="og:image"]'));
ok('favicon + apple touch icon', !!home.querySelector('link[rel="icon"]') &&
   !!home.querySelector('link[rel="apple-touch-icon"]'));

const ld = home.querySelector('script[type="application/ld+json"]');
ok('structured data present', !!ld);
if (ld) {
  const data = JSON.parse(ld.textContent);
  ok('structured data is valid JSON-LD Person', data['@type'] === 'Person');
  ok('structured data makes no rating claim', !('aggregateRating' in data));
}

console.log('\n— Work detail page —');
const detail = load('work/dynamic-travels-transformation/index.html');
ok('detail page has one h1', detail.querySelectorAll('h1').length === 1);
ok('detail states status', /Past work — employed role/.test(detail.body.textContent));
ok('detail declines to claim metrics',
   /no verified metrics/i.test(detail.body.textContent));
ok('detail dates match the CV', /Feb 2026 – Apr 2026/.test(detail.body.textContent));
ok('back link to work section', !!detail.querySelector('a[href="/#work"]'));

console.log(fails ? `\n${fails} CHECK(S) FAILED\n` : '\nALL STATIC CHECKS PASSED\n');
process.exit(fails ? 1 : 0);
