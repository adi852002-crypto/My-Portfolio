/* Regenerates public/sitemap.xml and public/robots.txt from SITE_URL and the
   work list, so moving domain never leaves a stale absolute URL behind.
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
