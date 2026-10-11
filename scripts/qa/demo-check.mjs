#!/usr/bin/env node
/**
 * Verifies a demo-mode build end to end from a clean browser:
 * sign in → pick a child → care action → buy a look → parent PIN → verify a goal,
 * while asserting that no request leaves the page's own origin (fonts excepted).
 *   node scripts/qa/demo-check.mjs [baseUrl] [outDir]
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:3200';
const out = process.argv[3];
if (out) fs.mkdirSync(out, { recursive: true });
const origin = new URL(base).origin;
let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const foreign = [];
await context.route('**/*', (route) => {
  const url = new URL(route.request().url());
  if (url.origin === origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return route.continue();
  foreign.push(url.href);
  return route.abort();
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const shot = (name) => (out ? page.screenshot({ path: path.join(out, `${name}.png`) }) : null);

await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForURL('**/login', { timeout: 15000 });
check('Signed-out visitors land on the login page', page.url().endsWith('/login'));
check('Login explains this is sample data', (await page.getByText(/sample family/i).count()) > 0);
await shot('demo-login');
await page.getByRole('button', { name: 'Sign in' }).click();
await page.getByRole('heading', { name: /Who.s playing today/ }).waitFor({ timeout: 15000 });
check('Sign in with the pre-filled demo details works', true);
await page.waitForTimeout(800);
await shot('demo-players');

await page.getByRole('link', { name: /Play as Ansel/ }).click();
await page.getByRole('button', { name: /^Feed / }).waitFor();
await page.waitForTimeout(800);
await page.getByRole('button', { name: /^Feed / }).click();
await page.waitForTimeout(1200);
check('Care action works in demo mode', (await page.getByText(/Yum yum|enough of that|moment first/).count()) > 0);
await shot('demo-home');

await page.getByRole('link', { name: 'Shop' }).first().click();
await page.locator('li', { hasText: 'Aurora Spirit' }).getByRole('button').click();
await page.getByRole('button', { name: 'Yes, buy it!' }).click();
await page.getByText(/look unlocked/).waitFor({ timeout: 8000 });
check('Purchases work and persist in this browser', (await page.locator('li', { hasText: 'Aurora Spirit' }).getByRole('button', { name: 'Wear' }).count()) > 0);

await page.goto(`${base}/`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Grown-ups' }).click();
await page.keyboard.type('1234');
await page.waitForURL('**/parent/dashboard', { timeout: 15000 });
await page.getByRole('button', { name: 'Verify' }).first().click();
await page.getByText(/verified ·/).waitFor({ timeout: 8000 });
check('Parent can verify a goal in demo mode', true);
await page.waitForTimeout(500);
await shot('demo-parent');

check('No request left the app (no real Supabase, no third parties)', foreign.length === 0, foreign.slice(0, 3).join(', '));
check('No page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
await browser.close();
console.log(failures ? `\n${failures} demo check(s) failed` : '\nDemo checks passed');
process.exit(failures ? 1 : 0);
