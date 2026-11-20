/* Bundles worker/ into out/_worker.js, the single-file server Cloudflare
   Pages runs in "advanced mode", and writes out/_routes.json so the worker
   only wakes for the API and the HTML pages — never for images, scripts or
   styles, which stay plain static files.
   Run after `next build`:  node scripts/build-worker.mjs                 */
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';

await build({
  entryPoints: ['worker/index.ts'],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  platform: 'neutral',
  outfile: 'out/_worker.js',
  minify: true,
  legalComments: 'none',
});

/* Page routes are included so link-preview fetches (a shared link being
   pasted into LinkedIn or WhatsApp) can be counted. */
writeFileSync('out/_routes.json', JSON.stringify({
  version: 1,
  include: [
    '/api/*',
    '/', '/about', '/about/', '/services', '/services/', '/contact', '/contact/',
    '/work', '/work/*',
  ],
  exclude: [],
}, null, 2));

console.log('worker: out/_worker.js + out/_routes.json');
