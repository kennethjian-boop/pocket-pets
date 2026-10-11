#!/usr/bin/env node
/**
 * Capture screenshots of Pocket Pets against the local fake Supabase.
 *
 * Prereqs (two terminals):
 *   node scripts/qa/mock-supabase.mjs
 *   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54399 NEXT_PUBLIC_SUPABASE_ANON_KEY=qa-anon-key npx next dev -p 3100
 *
 * Usage:
 *   node scripts/qa/capture.mjs <outDir> [--routes=home,shop] [--viewports=375x812,1440x900] [--scenario=default] [--full]
 *
 * Any request to a real *.supabase.co host is aborted, and the run fails.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const APP = process.env.QA_APP_URL ?? 'http://localhost:3100';
const MOCK = process.env.QA_MOCK_URL ?? 'http://localhost:54399';

const args = Object.fromEntries(
  process.argv.slice(3).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  })
);
const outDir = process.argv[2] ?? 'qa-shots';

export const ROUTES = {
  landing: '/',
  login: '/login',
  home: '/child/child-ansel',
  'home-thea': '/child/child-thea',
  shop: '/child/child-ansel/shop',
  'shop-thea': '/child/child-thea/shop',
  boss: '/child/child-ansel/family',
  catch: '/child/child-ansel/pet-catch',
  'catch-thea': '/child/child-thea/pet-catch',
  'p-overview': '/parent/dashboard',
  'p-goals': '/parent/goals',
  'p-rewards': '/parent/rewards',
  'p-boss': '/parent/family-boss',
  'p-energy': '/parent/screen-energy',
  'p-settings': '/parent/settings',
};

export const VIEWPORTS = ['375x812', '390x844', '430x932', '768x1024', '1024x768', '1440x900'];

export function fakeSession() {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
  const payload = Buffer.from(
    JSON.stringify({ sub: 'qa-user', role: 'authenticated', exp, email: 'qa@example.test' })
  ).toString('base64url');
  return {
    access_token: `${header}.${payload}.qa-signature`,
    refresh_token: 'qa-refresh',
    token_type: 'bearer',
    expires_in: 60 * 60 * 24 * 30,
    expires_at: exp,
    user: { id: 'qa-user', aud: 'authenticated', role: 'authenticated', email: 'qa@example.test' },
  };
}

export async function newQaContext(browser, viewport, { parentUnlocked = true, reducedMotion = 'reduce' } = {}) {
  const [width, height] = viewport.split('x').map(Number);
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: width < 800 ? 2 : 1,
    hasTouch: width < 1024,
    isMobile: width < 800,
    reducedMotion,
  });
  const session = fakeSession();
  await context.addInitScript(
    ({ session, parentUnlocked }) => {
      try {
        window.localStorage.setItem('sb-localhost-auth-token', JSON.stringify(session));
        if (parentUnlocked) window.sessionStorage.setItem('pocket-pets-parent-pin-unlocked', 'yes');
      } catch {}
    },
    { session, parentUnlocked }
  );
  const realHits = [];
  await context.route(/supabase\.co/, (route) => {
    realHits.push(route.request().url());
    return route.abort();
  });
  context.realSupabaseHits = realHits;
  return context;
}

export async function resetMock(name = 'default') {
  const res = await fetch(`${MOCK}/__mock/reset?scenario=${name}`, { method: 'POST' });
  if (!res.ok) throw new Error('Mock Supabase is not running');
}

async function main() {
  const routes = args.routes ? args.routes.split(',') : Object.keys(ROUTES);
  const viewports = args.viewports ? args.viewports.split(',') : VIEWPORTS;
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const problems = [];

  for (const viewport of viewports) {
    await resetMock(args.scenario ?? 'default');
    const context = await newQaContext(browser, viewport);
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    for (const name of routes) {
      const route = ROUTES[name];
      await page.goto(APP + route, { waitUntil: 'networkidle' });
      await page.waitForTimeout(Number(args.wait ?? 900));
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - doc.clientWidth;
      });
      if (overflow > 1) problems.push(`${name}@${viewport}: horizontal overflow ${overflow}px`);
      const file = path.join(outDir, `${name}@${viewport}.png`);
      await page.screenshot({ path: file, fullPage: args.full === 'true' });
      console.log('captured', file);
    }
    if (consoleErrors.length) problems.push(`${viewport}: page errors: ${consoleErrors.join(' | ')}`);
    if (context.realSupabaseHits.length) {
      throw new Error(`Blocked requests to real Supabase: ${context.realSupabaseHits.join(', ')}`);
    }
    await context.close();
  }

  await browser.close();
  if (problems.length) {
    console.log('\nPROBLEMS:\n' + problems.join('\n'));
  } else {
    console.log('\nNo overflow or page errors detected.');
  }
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('capture.mjs')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
