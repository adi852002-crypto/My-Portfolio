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
const PAGES = [
  'index.html',
  'work/index.html',
  'services/index.html',
  'about/index.html',
  'contact/index.html',
  'work/dynamic-travels-transformation/index.html',
  'work/ultimatix-escalation-operations/index.html',
  'work/telstra-service-delivery/index.html',
  '404.html',
  'sitemap.xml',
  'robots.txt',
  'og.png',
  'icon.svg',
  'scene/poster.webp',
  'scene/portrait.webp',
];
for (const p of PAGES) ok(`exists: ${p}`, existsSync(`${OUT}/${p}`));

const home = load('index.html');
const services = load('services/index.html');
const about = load('about/index.html');
const workIndex = load('work/index.html');
const contact = load('contact/index.html');

console.log('\n— Document structure (every page) —');
for (const [name, doc] of [
  ['home', home], ['work', workIndex], ['services', services],
  ['about', about], ['contact', contact],
]) {
  ok(`${name}: exactly one h1`, doc.querySelectorAll('h1').length === 1,
     `found ${doc.querySelectorAll('h1').length}`);
  ok(`${name}: <main> landmark`, !!doc.querySelector('main#main'));
  ok(`${name}: <header> landmark`, !!doc.querySelector('header'));
  ok(`${name}: <footer> landmark`, !!doc.querySelector('footer'));
  const levels = [...doc.querySelectorAll('h1,h2,h3,h4')].map((h) => +h.tagName[1]);
  let jump = null;
  for (let i = 1; i < levels.length; i++) if (levels[i] - levels[i - 1] > 1) jump = `${levels[i-1]}→${levels[i]}`;
  ok(`${name}: no skipped heading levels`, !jump, jump ?? '');
}
ok('html lang set', home.documentElement.getAttribute('lang') === 'en');
ok('skip link first focusable', /Skip to content/.test(home.body.innerHTML.slice(0, 900)));
ok('skip link targets #main', !!home.querySelector('a[href="#main"]') && !!home.querySelector('#main'));

console.log('\n— The overview is minimal —');
const homeText = home.body.textContent.replace(/\s+/g, ' ');
ok('intro copy present', homeText.includes('Better operations.') &&
   homeText.includes('I help teams simplify processes'));
ok('one contact action, not a form', home.querySelectorAll('main form').length === 0);
ok('no service-card rows on the overview',
   !homeText.includes('Operations & Process Improvement'));
ok('no long About text on the overview',
   !homeText.includes('I have spent fifteen years'));
ok('no repeated demos on the overview', !homeText.includes('Incoming message (sample)'));
ok('the fallback still describes the scene',
   (home.querySelector('img[src="/scene/poster.webp"]')?.getAttribute('alt') ?? '').length > 80);
ok('overview main is short', home.querySelector('main').textContent.replace(/\s+/g,' ').trim().length < 900,
   `${home.querySelector('main').textContent.replace(/\s+/g,' ').trim().length} chars`);

console.log('\n— The studio navigation is real HTML, always present —');
const buttons = [...home.querySelectorAll('nav[aria-label="Explore the desk"] button')]
  .map((b) => b.textContent.replace(/\s+/g, ' ').trim());
for (const label of ['Work history', 'Customer success', 'Process & CRM', 'AI in action',
                     'About', 'Leave a note', 'Contact'])
  ok(`control: ${label}`, buttons.some((b) => b.startsWith(label)));
ok('Contact is one of the destinations',
   [...home.querySelectorAll('nav[aria-label="Explore the desk"] button')]
     .some((b) => b.textContent.replace(/\s+/g, ' ').trim().startsWith('Contact')));
ok('the contact page is still reachable', !!home.querySelector('footer a[href="/contact/"]'));
ok('controls expose pressed state',
   [...home.querySelectorAll('nav[aria-label="Explore the desk"] ul button[aria-pressed]')].length === 7);
ok('the lamp switch is real HTML, with its state announced',
   [...home.querySelectorAll('nav[aria-label="Explore the desk"] button[aria-pressed]')]
     .some((b) => /Turn the lamp o(ff|n)/.test(b.textContent)));
ok('the row is not hidden on any breakpoint',
   !/aria-label="Explore the desk"[^>]*class="[^"]*\bhidden\b/.test(readFileSync(`${OUT}/index.html`, 'utf8')));
ok('"How I work" stays reachable without the scene',
   !!home.querySelector('footer a[href="/services/"]'));

console.log('\n— Displaced content still exists, on its own page —');
const svcText = services.body.textContent.replace(/\s+/g, ' ');
for (const phrase of ['Operations & Process Improvement', 'Customer Success & Service Delivery',
                      'CRM & Practical AI', 'Understand', 'Simplify', 'Implement', 'Improve'])
  ok(`services page: "${phrase.slice(0, 34)}"`, svcText.includes(phrase));
ok('services page carries the process demo', /Unclear ownership|No clear owner/.test(svcText));
ok('services page carries the AI demo', /Run demo/.test(svcText));

const aboutText = about.body.textContent.replace(/\s+/g, ' ');
ok('about page has the full background', aboutText.includes('I have spent fifteen years'));
ok('about page lists credentials', aboutText.includes('Bundelkhand University'));
ok('about page offers the CV', !!about.querySelector('a[href$=".pdf"]'));

const workText = workIndex.body.textContent.replace(/\s+/g, ' ');
for (const w of ['Dynamic Travels', 'Ultimatix', 'Telstra Australia'])
  ok(`work index lists: ${w}`, workText.includes(w));

ok('contact page carries the form', !!contact.querySelector('form'));

console.log('\n— Honesty checks (nothing invented) —');
const banned = [
  ['Lean Six Sigma', /lean six sigma/i], ['PMP', /\bPMP\b/], ['PRINCE2', /prince ?2/i],
  ['ITIL', /\bITIL\b/], ['Zoho', /zoho/i],
  ['testimonial markup', /testimonial/i],
  ['star rating', /aggregateRating|ratingValue/i],
  ['fake percentage claim', /\b\d{1,3}%\s*(increase|reduction|improvement|uplift|growth)/i],
  ['booking link', /calendly|cal\.com|savvycal|hubspot\.com\/meetings/i],
];
for (const page of PAGES.filter((p) => p.endsWith('.html'))) {
  const raw = readFileSync(`${OUT}/${page}`, 'utf8');
  for (const [label, re] of banned) ok(`${page} absent: ${label}`, !re.test(raw));
}
ok('employment framed as roles, not clients',
   workText.includes('not client engagements') && aboutText.includes('not client engagements'));
ok('work index declines to claim metrics', /no performance figures are claimed/i.test(workText));
ok('demonstrations labelled illustrative / sample',
   /Illustrative|Interactive example/i.test(svcText) && /Sample data/i.test(svcText));
ok('AI demo declares sample data', /sample data/i.test(svcText));
ok('contact does not promise delivery',
   !/we('|’)ll get back|message sent|thanks for your message/i.test(contact.body.textContent));
ok('contact states it opens an email app', /opens your own email app/i.test(contact.body.textContent));

console.log('\n— Links —');
const allDocs = { 'index.html': home, 'work/index.html': workIndex, 'services/index.html': services,
                  'about/index.html': about, 'contact/index.html': contact };
for (const [name, doc] of Object.entries(allDocs)) {
  const anchors = [...doc.querySelectorAll('a[href^="#"]')];
  const missing = anchors.map((a) => a.getAttribute('href')).filter((h) => h !== '#' && !doc.querySelector(h));
  ok(`${name}: in-page anchors resolve`, missing.length === 0, missing.join(', '));

  const internal = [...doc.querySelectorAll('a[href^="/"]')]
    .map((a) => a.getAttribute('href').split('#')[0])
    .filter(Boolean);
  const broken = [...new Set(internal)].filter((h) => {
    /* A link either names a file in the export (the CV, the vCard, an image)
       or a page, which is a directory holding an index.html. */
    if (/\.[a-z0-9]{2,4}$/i.test(h)) return !existsSync(`${OUT}${h}`);
    const file = h === '/' ? 'index.html' : `${h.replace(/^\/|\/$/g, '')}/index.html`;
    return !existsSync(`${OUT}/${file}`);
  });
  ok(`${name}: internal links resolve to exported pages`, broken.length === 0, broken.join(', '));

  const ext = [...doc.querySelectorAll('a[target="_blank"]')];
  ok(`${name}: external links carry rel=noopener`,
     ext.every((a) => (a.getAttribute('rel') ?? '').includes('noopener')));
}
ok('header nav has Work / About', ['/work/', '/about/'].every((h) =>
   !!home.querySelector(`header a[href="${h}"]`)));
ok('"Let’s talk" in header points at contact',
   !!home.querySelector('header a[href="/contact/"]'));
ok('footer indexes every destination',
   ['/work/', '/services/', '/about/', '/contact/'].every((h) =>
     !!home.querySelector(`footer a[href="${h}"]`)));

console.log('\n— Images —');
for (const [name, doc] of Object.entries(allDocs)) {
  const imgs = [...doc.querySelectorAll('img')];
  const noAlt = imgs.filter((i) => i.getAttribute('alt') === null);
  ok(`${name}: every img has an alt attribute`, noAlt.length === 0, `${noAlt.length} missing`);
}
ok('the hero reserves its height (no CLS)', /min-h-\[100svh\]/.test(readFileSync(`${OUT}/index.html`, 'utf8')));

console.log('\n— The visiting card —');
{
  const vcf = `${OUT}/aniruddha-dasgupta.vcf`;
  ok('the card is published as a file', existsSync(vcf));
  const card = existsSync(vcf) ? readFileSync(vcf, 'utf8') : '';
  const src = readFileSync('src/data/site.ts', 'utf8');
  const of = (k) => (src.match(new RegExp(`${k}: '([^']+)'`)) ?? [])[1] ?? '\u0000';
  ok('it carries the real phone number', card.includes(of('phoneHref')));
  ok('it carries the real email', card.includes(of('email')));
  ok('it invents nothing: no company, no title but the stated role',
     !/\nORG:/.test(card) && card.includes(of('role')));
  ok('the contact page offers it without the 3D scene',
     !!contact.querySelector('a[href="/aniruddha-dasgupta.vcf"][download]'));
}

console.log('\n— Forms —');
const fields = [...contact.querySelectorAll('input, textarea, select')];
const unlabelled = fields.filter((f) => {
  const id = f.getAttribute('id');
  return !(id && contact.querySelector(`label[for="${id}"]`)) && !f.getAttribute('aria-label');
});
ok('every form field has a label', unlabelled.length === 0,
   unlabelled.map((f) => f.getAttribute('name')).join(', '));
ok('phone is not a required field', !contact.querySelector('input[name="phone"][required]'));
const topics = [...contact.querySelectorAll('select#topic option')].map((o) => o.textContent);
for (const t of ['Operations and processes','Customer success','CRM','AI and automation','Something else'])
  ok(`topic option: ${t}`, topics.includes(t));

console.log('\n— SEO —');
ok('home title set', /Operations, Customer Success & AI Transformation/.test(home.title));
for (const [name, doc] of Object.entries(allDocs)) {
  const desc = doc.querySelector('meta[name="description"]')?.content ?? '';
  ok(`${name}: meta description 50–200 chars`, desc.length >= 50 && desc.length <= 200, `${desc.length}`);
  const canon = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
  ok(`${name}: canonical on the production domain`,
     canon.startsWith('https://aniruddhadasgupta.pages.dev'), canon);
}
ok('og:title + og:image', !!home.querySelector('meta[property="og:title"]') &&
   !!home.querySelector('meta[property="og:image"]'));
ok('favicon + apple touch icon', !!home.querySelector('link[rel="icon"]') &&
   !!home.querySelector('link[rel="apple-touch-icon"]'));

const sitemap = readFileSync(`${OUT}/sitemap.xml`, 'utf8');
for (const p of ['/', '/work/', '/services/', '/about/', '/contact/'])
  ok(`sitemap lists ${p}`, sitemap.includes(`pages.dev${p}<`));

const ld = home.querySelector('script[type="application/ld+json"]');
ok('structured data present', !!ld);
if (ld) {
  const data = JSON.parse(ld.textContent);
  ok('structured data is a valid JSON-LD Person', data['@type'] === 'Person');
  ok('structured data makes no rating claim', !('aggregateRating' in data));
}

console.log('\n— Work detail page —');
const detail = load('work/dynamic-travels-transformation/index.html');
ok('detail page has one h1', detail.querySelectorAll('h1').length === 1);
ok('detail states status', /Past work — employed role/.test(detail.body.textContent));
ok('detail declines to claim metrics', /no verified metrics/i.test(detail.body.textContent));
ok('detail dates match the CV', /Feb 2026 – Apr 2026/.test(detail.body.textContent));
ok('back link to the work index', !!detail.querySelector('a[href="/work/"]'));

console.log(fails ? `\n${fails} CHECK(S) FAILED\n` : '\nALL STATIC CHECKS PASSED\n');
process.exit(fails ? 1 : 0);
