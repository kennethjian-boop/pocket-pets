#!/usr/bin/env node
// Screenshots of interactive / scenario states: node scripts/qa/states.mjs <outDir>
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { newQaContext, resetMock } from './capture.mjs';

const APP = process.env.QA_APP_URL ?? 'http://localhost:3100';
const out = process.argv[2] ?? 'qa-shots/states';
fs.mkdirSync(out, { recursive: true });
const shot = (page, name) => page.screenshot({ path: path.join(out, `${name}.png`) });

const browser = await chromium.launch();
const vp = '390x844';

// Pet Catch mid-game and results.
await resetMock('default');
{
  const ctx = await newQaContext(browser, vp, { reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  await page.goto(`${APP}/child/child-ansel/pet-catch`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Play for 2/ }).click();
  await page.waitForTimeout(1200);
  await shot(page, 'catch-countdown');
  await page.waitForTimeout(14000);
  await shot(page, 'catch-playing');
  await page.getByText("Time's up!").waitFor({ timeout: 70000 });
  await page.waitForTimeout(1600);
  await shot(page, 'catch-results');
  await ctx.close();
}

// Shop purchase sheet + egg tab + pets tab (Thea has an active egg).
await resetMock('rich');
{
  const ctx = await newQaContext(browser, vp);
  const page = await ctx.newPage();
  await page.goto(`${APP}/child/child-ansel/shop`, { waitUntil: 'networkidle' });
  await page.locator('li', { hasText: 'Candy Witch' }).getByRole('button').click();
  await page.waitForTimeout(600);
  await shot(page, 'shop-confirm');
  await page.getByRole('button', { name: 'Yes, buy it!' }).click();
  await page.waitForTimeout(500);
  await shot(page, 'shop-bought');
  await page.goto(`${APP}/child/child-thea/shop#egg`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await shot(page, 'shop-egg-active');
  await page.goto(`${APP}/child/child-ansel/shop#egg`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await shot(page, 'shop-egg-buy');
  await ctx.close();
}

// Victory: child view + parent view.
await resetMock('victory');
{
  const ctx = await newQaContext(browser, vp);
  const page = await ctx.newPage();
  await page.goto(`${APP}/child/child-thea/family`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await shot(page, 'boss-victory-child');
  await page.goto(`${APP}/parent/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.locator('main').evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.waitForTimeout(400);
  await shot(page, 'parent-today-victory');
  await ctx.close();
}

// Fresh day with no goals set.
await resetMock('fresh');
{
  const ctx = await newQaContext(browser, vp);
  const page = await ctx.newPage();
  await page.goto(`${APP}/child/child-thea`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(300);
  await shot(page, 'home-no-goals');
  await page.goto(`${APP}/parent/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await shot(page, 'parent-today-no-goals');
  await ctx.close();
}

// Night scene via debug hour override.
await resetMock('default');
{
  const ctx = await newQaContext(browser, vp);
  const page = await ctx.newPage();
  await page.goto(`${APP}/child/child-thea?debug=1`, { waitUntil: 'networkidle' });
  await page.getByLabel('Fake hour').fill('22');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await shot(page, 'home-night');
  await ctx.close();
}

await browser.close();
console.log('states captured to', out);
