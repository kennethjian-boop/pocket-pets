// Single screenshot helper: node scripts/qa/shot.mjs <route> <out.png> [WxH] [fullPage]
import { chromium } from 'playwright';
import { newQaContext } from './capture.mjs';
const [url, out, vp = '1000x900', full = 'false'] = process.argv.slice(2);
const b = await chromium.launch();
const ctx = await newQaContext(b, vp);
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push(String(e)));
p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await p.goto('http://localhost:3100' + url, { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
await p.screenshot({ path: out, fullPage: full === 'true' });
if (errs.length) console.log(errs.join('\n'));
if (ctx.realSupabaseHits.length) console.log('REAL HITS', ctx.realSupabaseHits);
await b.close();
