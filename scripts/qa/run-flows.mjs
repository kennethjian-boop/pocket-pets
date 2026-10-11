#!/usr/bin/env node
/**
 * Pet Adventure Run gameplay checks against the LOCAL fake Supabase (never real data).
 *   node scripts/qa/run-flows.mjs [outDir]
 * Needs `npm run qa:mock` and `npm run qa:dev` running.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { newQaContext, resetMock } from './capture.mjs';

const APP = process.env.QA_APP_URL ?? 'http://localhost:3100';
const MOCK = process.env.QA_MOCK_URL ?? 'http://localhost:54399';
const out = process.argv[2];
if (out) fs.mkdirSync(out, { recursive: true });

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
};
const childRow = async (id) => (await (await fetch(`${MOCK}/__mock/state`)).json()).children.find((c) => c.child_id === id);
const patch = (match, set) => fetch(`${MOCK}/__mock/patch`, { method: 'POST', body: JSON.stringify({ table: 'children', match, set }) });
const attr = async (page, name) => page.locator('[data-run-arena]').getAttribute(name);
const shot = (page, name) => (out ? page.screenshot({ path: path.join(out, `${name}.png`) }) : null);
const waitPhase = (page, phase, timeout = 15000) => page.waitForSelector(`[data-run-arena][data-phase="${phase}"]`, { timeout });

const browser = await chromium.launch();

async function open(viewport, childId, query = '') {
  const ctx = await newQaContext(browser, viewport, { reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${APP}/child/${childId}/adventure-run${query}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Play (Easy|Challenge) for 2/ }).waitFor({ timeout: 15000 });
  return { ctx, page, errors };
}

// ── Ansel (Ember wearing Celestial Guardian) · Easy ────────────────────────────
await resetMock('default');
await patch({ child_id: 'child-ansel' }, { equipped_skin_by_pet: { bubbo: 'dragon-knight-bubbo', ember: 'celestial-guardian-ember' } });
{
  const { ctx, page, errors } = await open('390x844', 'child-ansel', '?qaSeed=4242&qaSeconds=14');
  check('Uses the equipped skin as the runner', (await page.locator('img[alt="Celestial Guardian Ember"]').count()) > 0);
  await shot(page, 'run-select-ansel-390');
  const before = (await childRow('child-ansel')).hearts;
  // Double tap Play: exactly one charge.
  await page.getByRole('button', { name: /^Play Easy for 2/ }).dblclick();
  await waitPhase(page, 'countdown');
  await page.waitForTimeout(400);
  check('Double tap on Play charges 2 hearts once', (await childRow('child-ansel')).hearts === before - 2, `${before} → ${(await childRow('child-ansel')).hearts}`);
  await waitPhase(page, 'playing');

  // Jump raises the pet.
  const groundY = Number(await attr(page, 'data-pet-y'));
  await page.getByRole('button', { name: 'Jump' }).dispatchEvent('pointerdown');
  await page.waitForTimeout(180);
  const jumpY = Number(await attr(page, 'data-pet-y'));
  check('Jump button makes the pet jump', jumpY > groundY + 5, `${groundY} → ${jumpY}`);
  await page.waitForTimeout(900);
  await shot(page, 'run-playing-ansel-390');

  // Pause when the tab is hidden; time stops; resume continues the same run.
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await waitPhase(page, 'paused', 3000);
  const t1 = Number(await attr(page, 'data-elapsed'));
  await page.waitForTimeout(1200);
  const t2 = Number(await attr(page, 'data-elapsed'));
  check('Hidden tab pauses the game clock', t1 === t2 && t1 > 0, `${t1} → ${t2}`);
  await shot(page, 'run-paused-390');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.getByRole('button', { name: /Keep running/ }).click();
  await waitPhase(page, 'playing');
  check('Resume does not charge again', (await childRow('child-ansel')).hearts === before - 2);

  // Keep jumping now and then; score should rise.
  const jumper = setInterval(() => page.keyboard.press('Space').catch(() => {}), 900);
  await page.waitForSelector('[data-run-arena][data-phase="finished"]', { timeout: 30000 });
  clearInterval(jumper);
  const score = Number(await attr(page, 'data-score'));
  check('Score updates during the run', score > 0, `score ${score}`);
  check('Results screen shows score and best', (await page.getByText(/New best score!|What a run!/).count()) > 0 && (await page.getByText(/Best · Easy/).count()) > 0);
  await page.waitForTimeout(900);
  await shot(page, 'run-results-ansel-390');
  const rowAfter = await childRow('child-ansel');
  check('No stars/energy awarded by the game', rowAfter.stars === 135 && rowAfter.screen_energy === 4, `stars ${rowAfter.stars}`);
  const best = await page.evaluate(() => window.localStorage.getItem('pocket-pets-run-best-child-ansel-easy'));
  check('Personal best saved for Ansel · Easy', Number(best) === score, `best ${best}`);

  // Restarting is never free.
  await page.getByRole('button', { name: /Run again/ }).click();
  await waitPhase(page, 'countdown');
  check('Run again charges another 2 hearts', (await childRow('child-ansel')).hearts === before - 4);
  check('No page errors (Ansel)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// ── Thea (Luna, no skin) · Challenge · collisions · landscape ──────────────────
await patch({ child_id: 'child-thea' }, { hearts: 1 });
{
  const { ctx, page } = await open('390x844', 'child-thea');
  await page.getByRole('button', { name: /^Play Easy for 2/ }).click({ force: true });
  await page.waitForTimeout(600);
  check('Thea with 1 heart cannot start and is not charged', (await childRow('child-thea')).hearts === 1 && (await attr(page, 'data-phase')) === 'select');
  await ctx.close();
}
await patch({ child_id: 'child-thea' }, { hearts: 6 });
{
  const { ctx, page, errors } = await open('844x390', 'child-thea', '?qaSeed=77&qaSeconds=12');
  check('Thea runs as Luna', (await page.locator('img[alt^="Luna"]').count()) > 0);
  await page.getByRole('radio', { name: /Challenge/ }).click();
  await shot(page, 'run-select-thea-landscape');
  await page.getByRole('button', { name: /^Play Challenge for 2/ }).click();
  await waitPhase(page, 'playing');
  // No jumping: the pet bumps into things, loses a little, and keeps running.
  await page.getByText(/Oops/).first().waitFor({ timeout: 10000 }).catch(() => {});
  check('Collisions show feedback without ending the game', (await page.getByText(/Oops/).count()) > 0 && (await attr(page, 'data-phase')) === 'playing');
  // Tap the forest itself to jump in landscape.
  const box = await page.locator('[data-run-arena]').boundingBox();
  const y0 = Number(await attr(page, 'data-pet-y'));
  await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.6);
  await page.waitForTimeout(180);
  check('Tapping the forest jumps (landscape)', Number(await attr(page, 'data-pet-y')) > y0 + 3);
  await page.waitForTimeout(700);
  await shot(page, 'run-playing-thea-landscape');
  await waitPhase(page, 'finished', 20000);
  const theaBest = await page.evaluate(() => [
    window.localStorage.getItem('pocket-pets-run-best-child-thea-challenge'),
    window.localStorage.getItem('pocket-pets-run-best-child-ansel-challenge'),
  ]);
  check('Bests are separate per child and mode', theaBest[1] === null, JSON.stringify(theaBest));
  check('Thea charged exactly 2 hearts', (await childRow('child-thea')).hearts === 4);
  await page.waitForTimeout(800);
  await shot(page, 'run-results-thea-landscape');
  check('No page errors (Thea)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// ── Layout: no overflow, nav never covers the game ─────────────────────────────
for (const viewport of ['375x812', '390x844', '430x932', '844x390', '768x1024', '1024x768', '1440x900']) {
  const ctx = await newQaContext(browser, viewport);
  const page = await ctx.newPage();
  for (const route of ['play', 'adventure-run']) {
    await page.goto(`${APP}/child/child-thea/${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    let covered = false;
    if (route === 'adventure-run') {
      covered = await page.evaluate(() => {
        const arena = document.querySelector('[data-run-arena]')?.getBoundingClientRect();
        const nav = [...document.querySelectorAll('nav[aria-label="Pocket Pets"]')].map((n) => n.getBoundingClientRect()).find((r) => r.height > 0 && r.width > 0 && r.top > window.innerHeight / 2);
        const jumpBtn = [...document.querySelectorAll('button[aria-label="Jump"]')].map((b) => b.getBoundingClientRect()).find((r) => r.height > 0);
        return Boolean(nav && ((arena && arena.bottom > nav.top + 1) || (jumpBtn && jumpBtn.bottom > nav.top + 1)));
      });
    }
    check(`${route} @ ${viewport}: no overflow${route === 'adventure-run' ? ', nav clear of game and Jump button' : ''}`, overflow <= 1 && !covered, `overflow ${overflow}, covered ${covered}`);
    if (out && ['390x844', '844x390', '1024x768'].includes(viewport)) await page.screenshot({ path: path.join(out, `${route}@${viewport}.png`) });
  }
  await ctx.close();
}

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll Adventure Run checks passed');
process.exit(failures ? 1 : 0);
