#!/usr/bin/env node
/**
 * End-to-end flow checks against the LOCAL fake Supabase (scripts/qa/mock-supabase.mjs).
 * These exercise real UI + the real client data layer, but not the real database or
 * its SQL — they are not a substitute for testing against a staging Supabase project.
 *
 *   node scripts/qa/flows.mjs [--only=care,shop] [--skip=catch]
 */
import { chromium } from 'playwright';
import { newQaContext, resetMock } from './capture.mjs';

const APP = process.env.QA_APP_URL ?? 'http://localhost:3100';
const MOCK = process.env.QA_MOCK_URL ?? 'http://localhost:54399';
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const only = args.only?.split(',');
const skip = args.skip?.split(',') ?? [];

const db = async () => (await fetch(`${MOCK}/__mock/state`)).json();
const patch = (body) => fetch(`${MOCK}/__mock/patch`, { method: 'POST', body: JSON.stringify(body) });
const childRow = async (id) => (await db()).children.find((c) => c.child_id === id);

let failures = 0;
function check(name, condition, detail = '') {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!condition) failures += 1;
}

async function waitFor(fn, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await fn()) return true;
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

const flows = {
  async care(browser) {
    await resetMock('default');
    const ctx = await newQaContext(browser, '390x844', { reducedMotion: 'no-preference' });
    const page = await ctx.newPage();
    await page.goto(`${APP}/child/child-ansel`, { waitUntil: 'networkidle' });
    const before = (await db()).care_action_state[0].action_counts;
    await page.getByRole('button', { name: /^Feed Ember/ }).click();
    const fed = await waitFor(async () => (await db()).care_action_state[0].action_counts.feed === before.feed + 1);
    check('Feed calls the authoritative care RPC once', fed);
    // Rapid double tap on Pat must only perform one action (in-flight guard + cooldown).
    const pat = page.getByRole('button', { name: /^Pat Ember/ });
    await pat.click();
    await pat.click({ force: true }).catch(() => {});
    await page.waitForTimeout(1200);
    const counts = (await db()).care_action_state[0].action_counts;
    check('Double-tapped Pat performs exactly one action', counts.pat === before.pat + 1, `pat ${before.pat} → ${counts.pat}`);
    await page.getByRole('button', { name: /^Pat Ember/ }).click();
    await page.waitForTimeout(600);
    check('Cooldown blocks an immediate repeat', (await db()).care_action_state[0].action_counts.pat === before.pat + 1);
    await ctx.close();
  },

  async shop(browser) {
    await resetMock('default');
    const ctx = await newQaContext(browser, '390x844');
    const page = await ctx.newPage();
    await page.goto(`${APP}/child/child-ansel/shop`, { waitUntil: 'networkidle' });
    const start = (await childRow('child-ansel')).stars;
    const aurora = page.locator('li', { hasText: 'Aurora Spirit' });
    await aurora.getByRole('button').click();
    await page.getByRole('dialog').waitFor();
    // Another device (parent phone) awards 50 stars while the sheet is open.
    await patch({ table: 'children', match: { child_id: 'child-ansel' }, set: { stars: start + 50 } });
    await page.getByRole('button', { name: 'Yes, buy it!' }).click();
    await waitFor(async () => (await childRow('child-ansel')).owned_skins.includes('aurora-spirit-ember'));
    let row = await childRow('child-ansel');
    check('Purchase keeps a concurrent parent award', row.stars === start, `expected ${start}, got ${row.stars}`);
    check('Purchased look is owned', row.owned_skins.includes('aurora-spirit-ember'));

    const candy = page.locator('li', { hasText: 'Candy Witch' });
    await candy.getByRole('button').click();
    const confirm = page.getByRole('button', { name: 'Yes, buy it!' });
    await confirm.dblclick({ force: true }).catch(() => {});
    await page.waitForTimeout(1500);
    row = await childRow('child-ansel');
    check('Double-tapped confirm charges once', row.stars === start - 50, `stars ${row.stars}`);

    // Not enough stars: Thea has 48, egg costs 50.
    await page.goto(`${APP}/child/child-thea/shop#screen`, { waitUntil: 'networkidle' });
    const theaBefore = (await childRow('child-thea')).stars;
    if (process.env.QA_DEBUG_SHOTS) await page.screenshot({ path: process.env.QA_DEBUG_SHOTS + '/shop-thea.png' });
    // aria-disabled buttons are still tappable (they explain why) — Playwright needs force.
    await page.locator('li', { hasText: '6 Screen Energy' }).getByRole('button').click({ force: true });
    await page.waitForTimeout(500);
    check('Unaffordable item never opens a purchase', (await page.getByRole('dialog').count()) === 0 && (await childRow('child-thea')).stars === theaBefore);
    await ctx.close();
  },

  async verify(browser) {
    await resetMock('default');
    const ctx = await newQaContext(browser, '390x844');
    const page = await ctx.newPage();
    await page.goto(`${APP}/parent/dashboard`, { waitUntil: 'networkidle' });
    const start = await db();
    const anselStars = start.children.find((c) => c.child_id === 'child-ansel').stars;
    const attacks = start.family_boss_state[0].attacks.length;
    const ansel = page.locator('section', { hasText: 'Ansel' }).first();
    await ansel.getByRole('button', { name: 'Verify' }).first().click();
    const ok = await waitFor(async () => (await db()).family_boss_state[0].attacks.length === attacks + 1);
    const after = await db();
    check('Verify adds a boss hit', ok);
    check('Verify adds the goal stars', after.children.find((c) => c.child_id === 'child-ansel').stars === anselStars + 15);
    await ansel.getByRole('button', { name: /Undo verification of Pack Away Toys/ }).click();
    await ansel.getByRole('button', { name: 'Undo', exact: true }).click();
    await waitFor(async () => (await db()).family_boss_state[0].attacks.length === attacks);
    const undone = await db();
    check('Undo reverses stars and boss hit', undone.children.find((c) => c.child_id === 'child-ansel').stars === anselStars && undone.family_boss_state[0].attacks.length === attacks);

    // The child's Boss page reads the live boss (not just a local cache).
    const kid = await ctx.newPage();
    await kid.goto(`${APP}/child/child-thea/family`, { waitUntil: 'networkidle' });
    check('Child boss page shows live HP', (await kid.getByText(`${undone.family_boss_state[0].current_hp} / 100`).count()) > 0);
    await ctx.close();
  },

  async claim(browser) {
    await resetMock('victory');
    const before = await db();
    const ctxA = await newQaContext(browser, '1440x900');
    const ctxB = await newQaContext(browser, '390x844');
    const a = await ctxA.newPage();
    const b = await ctxB.newPage();
    await Promise.all([
      a.goto(`${APP}/parent/family-boss`, { waitUntil: 'networkidle' }),
      b.goto(`${APP}/parent/family-boss`, { waitUntil: 'networkidle' }),
    ]);
    await a.getByRole('button', { name: 'Give prizes' }).click();
    await waitFor(async () => (await db()).family_boss_state[0].reward_claimed === true);
    await a.waitForTimeout(800);
    // Second device still shows the stale "Give prizes" button.
    await b.getByRole('button', { name: 'Give prizes' }).click();
    await b.waitForTimeout(1500);
    const after = await db();
    const gain = (id) =>
      after.children.find((c) => c.child_id === id).stars - before.children.find((c) => c.child_id === id).stars;
    check('Victory prizes delivered once to Ansel', gain('child-ansel') === 20, `+${gain('child-ansel')}`);
    check('Victory prizes delivered once to Thea', gain('child-thea') === 20, `+${gain('child-thea')}`);
    check('Second device is told prizes were already claimed', (await b.getByText(/already claimed/i).count()) > 0);
    await ctxA.close();
    await ctxB.close();
  },

  async pin(browser) {
    await resetMock('default');
    const ctx = await newQaContext(browser, '390x844', { parentUnlocked: false });
    const page = await ctx.newPage();
    await page.goto(`${APP}/`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Grown-ups' }).click();
    await page.keyboard.type('9999');
    const rejected = await page.getByText("That's not the parent code.").waitFor({ timeout: 5000 }).then(() => true, () => false);
    check('Wrong PIN is rejected', rejected);
    await page.keyboard.type('1234');
    await page.waitForURL('**/parent/dashboard');
    await page.waitForTimeout(800);
    check('Correct PIN opens parent area without asking twice', (await page.getByRole('heading', { name: 'Today' }).count()) > 0);
    await ctx.close();
  },

  async catch(browser) {
    await resetMock('default');
    const ctx = await newQaContext(browser, '390x844', { reducedMotion: 'no-preference' });
    const page = await ctx.newPage();
    await page.goto(`${APP}/child/child-thea/pet-catch`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Play for 2/ }).click({ force: true });
    await page.waitForTimeout(500);
    check('Thea (1 heart) cannot start a round', (await childRow('child-thea')).hearts === 1 && (await page.getByText('You need 2 hearts').count()) > 0);

    await page.goto(`${APP}/child/child-ansel/pet-catch`, { waitUntil: 'networkidle' });
    const before = await childRow('child-ansel');
    await page.getByRole('button', { name: /Play for 2/ }).click();
    await waitFor(async () => (await childRow('child-ansel')).hearts === before.hearts - 2);
    check('Starting a round spends 2 hearts', (await childRow('child-ansel')).hearts === before.hearts - 2);
    const arrow = page.getByRole('button', { name: 'Move left' });
    await arrow.hover();
    await page.mouse.down();
    await page.waitForTimeout(1500);
    await page.mouse.up();
    await page.getByText("Time's up!").waitFor({ timeout: 75000 });
    await page.waitForTimeout(1500);
    const after = await childRow('child-ansel');
    const gained = after.stars - before.stars;
    check('Round end awards stars once (existing tiers)', [5, 10, 15, 20].includes(gained), `+${gained}`);
    await ctx.close();
  },
};

const browser = await chromium.launch();
for (const [name, fn] of Object.entries(flows)) {
  if ((only && !only.includes(name)) || skip.includes(name)) continue;
  console.log(`\n▶ ${name}`);
  try {
    await fn(browser);
  } catch (error) {
    failures += 1;
    console.log(`FAIL  ${name} threw: ${error.message.split('\n')[0]}`);
  }
}
await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll flow checks passed');
process.exit(failures ? 1 : 0);
