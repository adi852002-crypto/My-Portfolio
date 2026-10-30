/* Regenerates public/sitemap.xml, public/robots.txt and the vCard from
   SITE_URL and the profile, so moving domain never leaves a stale absolute
   URL behind and the card can never drift from the contact details.
   Run: node scripts/build-sitemap.mjs                                     */
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync('src/data/site.ts', 'utf8');
const SITE = src.match(/SITE_URL = '([^']+)'/)[1].replace(/\/$/, '');
const slugs = [...src.matchAll(/slug: '([^']+)'/g)].map((m) => m[1]);
const today = new Date().toISOString().slice(0, 10);

const urls = [
  ['/', '1.0'],
  ['/work/', '0.9'],
  ['/services/', '0.9'],
  ['/about/', '0.8'],
  ['/contact/', '0.7'],
  ...slugs.map((s) => [`/work/${s}/`, '0.6']),
];

writeFileSync('public/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(([u, p]) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod><priority>${p}</priority></url>`).join('\n') +
  `\n</urlset>\n`);

writeFileSync('public/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`sitemap: ${urls.length} URLs on ${SITE}`);

/* The visiting card, as a file a phone can actually save. Built from the
   same PROFILE the card in the scene is printed from, so the two cannot
   disagree. Only details already published on the site go into it. */
const field = (k) => {
  const m = src.match(new RegExp(`${k}: '([^']+)'`));
  return m ? m[1] : '';
};
const [family, ...given] = field('name').split(' ').reverse();
const vcard = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  `N:${family};${given.reverse().join(' ')};;;`,
  `FN:${field('name')}`,
  `TITLE:${field('role')}`,
  `TEL;TYPE=CELL:${field('phoneHref')}`,
  `EMAIL;TYPE=INTERNET:${field('email')}`,
  `URL:${SITE}/`,
  `URL;TYPE=LinkedIn:${field('linkedin')}`,
  `ADR;TYPE=WORK:;;;${field('location').split(', ')[0]};;;${field('location').split(', ')[1] ?? ''}`,
  `NOTE:${field('location')}. Operations, customer success and practical AI.`,
  'END:VCARD',
  '',
].join('\r\n');
writeFileSync('public/aniruddha-dasgupta.vcf', vcard);
