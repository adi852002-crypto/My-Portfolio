import test from 'node:test';
import assert from 'node:assert/strict';
import { BOT, device, previewer, source } from '../worker/ua';
import { visitorId } from '../worker/db';
import { verifyAccess } from '../worker/access';
import type { Env } from '../worker/env';

const env = (extra: Partial<Env> = {}) =>
  ({ ASSETS: { fetch: async () => new Response('') }, ...extra }) as Env;

test('crawlers and headless browsers are not counted as visitors', () => {
  assert.ok(BOT.test('Mozilla/5.0 HeadlessChrome/120'));
  assert.ok(BOT.test('Googlebot/2.1'));
  assert.ok(!BOT.test('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1'));
});

test('link-preview fetches are recognised by app', () => {
  assert.equal(previewer('LinkedInBot/1.0 (compatible; Mozilla/5.0)'), 'LinkedIn');
  assert.equal(previewer('WhatsApp/2.23.20.0'), 'WhatsApp');
  assert.equal(previewer('Mozilla/5.0 (Windows NT 10.0) Chrome/142'), null);
});

test('where a visit came from reads in words, utm first', () => {
  const own = 'aniruddhadasgupta.com';
  assert.equal(source('www.linkedin.com', '', own), 'LinkedIn');
  assert.equal(source('lnkd.in', '', own), 'LinkedIn');
  assert.equal(source('www.google.co.in', '', own), 'Google');
  assert.equal(source('', '', own), 'Direct');
  assert.equal(source('aniruddhadasgupta.com', '', own), 'Direct');
  assert.equal(source('', 'whatsapp', own), 'WhatsApp');
  assert.equal(source('www.google.com', 'copy', own), 'Shared link');
});

test('devices are told apart', () => {
  assert.equal(device('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), 'mobile');
  assert.equal(device('Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)'), 'tablet');
  assert.equal(device('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), 'desktop');
});

test('the visitor id is stable within a day and different across days', async () => {
  const a = await visitorId('salt-day-1', '203.0.113.7', 'UA');
  assert.equal(a, await visitorId('salt-day-1', '203.0.113.7', 'UA'));
  assert.notEqual(a, await visitorId('salt-day-2', '203.0.113.7', 'UA'));
  assert.ok(!a.includes('203'), 'the address is not in the id');
});

test('the dashboard data stays locked without Cloudflare Access', async () => {
  const req = new Request('https://aniruddhadasgupta.com/api/admin/overview');
  assert.equal(await verifyAccess(req, env()), null, 'no Access configured: closed');
  const forged = new Request('https://aniruddhadasgupta.com/api/admin/overview', {
    headers: { 'cf-access-jwt-assertion': 'e30.e30.AAAA' },
  });
  assert.equal(
    await verifyAccess(forged, env({ ACCESS_TEAM_DOMAIN: 'example.cloudflareaccess.com', ACCESS_AUD: 'x' })),
    null, 'an unsigned token is refused',
  );
});
