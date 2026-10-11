import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as rules from '../lib/adventure-run-rules.ts';
import {
  GROUND_Y,
  MODES,
  PET_X,
  RUN_DURATION_SECONDS,
  bestScoreKey,
  createRun,
  currentSpeed,
  jumpAirtime,
  jumpApex,
  stepRun,
  type RunMode,
  type RunState,
} from '../lib/adventure-run-rules.ts';

const DT = 1 / 60;

function run(state: RunState, seconds: number, shouldJump: (s: RunState) => boolean = () => false) {
  const events = [];
  for (let t = 0; t < seconds && !state.finished; t += DT) events.push(...stepRun(state, DT, shouldJump(state)));
  return events;
}

/** A fair-but-simple player: times the jump so its peak is over the next obstacle (or pair). */
function autoPlayer(s: RunState) {
  const ahead = s.obstacles.filter((o) => !o.passed && o.x + o.w > PET_X).sort((a, b) => a.x - b.x);
  if (!ahead.length || !s.grounded) return false;
  let spanEnd = ahead[0].x + ahead[0].w;
  for (const o of ahead.slice(1)) if (o.x < spanEnd + 8) spanEnd = Math.max(spanEnd, o.x + o.w);
  const centre = (ahead[0].x + spanEnd) / 2;
  return centre - PET_X <= (currentSpeed(s) * jumpAirtime(s.mode)) / 2;
}

test('jump rises to the configured apex and lands back on the ground', () => {
  const s = createRun('easy', 1.6, 1);
  stepRun(s, DT, true);
  let peak = 0;
  for (let i = 0; i < 120; i += 1) {
    stepRun(s, DT);
    peak = Math.max(peak, s.petY - GROUND_Y);
  }
  assert.ok(Math.abs(peak - jumpApex('easy')) < 1.5, `peak ${peak.toFixed(1)}`);
  assert.equal(s.grounded, true);
  assert.equal(s.petY, GROUND_Y);
});

test('no double jump in mid-air, but a tap just before landing is buffered', () => {
  const s = createRun('challenge', 1.6, 2);
  stepRun(s, DT, true);
  for (let i = 0; i < 15; i += 1) stepRun(s, DT);
  const vyBefore = s.petVy;
  stepRun(s, DT, true);
  assert.ok(s.petVy < vyBefore, 'mid-air tap does not re-launch');
  // Fall until just above the ground, then tap: the buffered jump fires on landing.
  while (!(s.petVy < 0 && s.petY - GROUND_Y < 4)) stepRun(s, DT);
  stepRun(s, DT, true);
  let relaunched = false;
  for (let i = 0; i < 20; i += 1) {
    if (stepRun(s, DT).some((e) => e.type === 'jump')) relaunched = true;
  }
  assert.equal(relaunched || s.petVy > 0, true);
});

test('hitting an obstacle lowers the score and slows the pet but never ends the game', () => {
  for (const mode of ['easy', 'challenge'] as RunMode[]) {
    const s = createRun(mode, 1.6, 3);
    s.score = 10;
    const events = run(s, 12);
    const hits = events.filter((e) => e.type === 'hit');
    assert.ok(hits.length > 0, `${mode}: standing still eventually bumps something`);
    assert.equal(s.finished, false);
    assert.ok(s.score >= 0);
    const first = hits[0] as { penalty: number };
    assert.equal(first.penalty, MODES[mode].hitPenalty);
  }
});

test('the score never goes below zero', () => {
  const s = createRun('challenge', 1.2, 4);
  run(s, RUN_DURATION_SECONDS + 1);
  assert.ok(s.score >= 0);
  assert.equal(s.finished, true);
});

test('every run is beatable without a single hit (fair gaps) in both modes', () => {
  for (const mode of ['easy', 'challenge'] as RunMode[]) {
    for (let seed = 1; seed <= 40; seed += 1) {
      for (const aspect of [1.05, 1.8]) {
        const s = createRun(mode, aspect, seed * 7919);
        run(s, RUN_DURATION_SECONDS + 1, autoPlayer);
        assert.equal(s.hits, 0, `${mode} seed ${seed} aspect ${aspect}: ${s.hits} hits`);
        assert.equal(s.finished, true);
        assert.ok(s.cleared > 10, `${mode} seed ${seed}: only ${s.cleared} obstacles`);
      }
    }
  }
});

test('gems and cleared obstacles add game points; difficulty ramps up', () => {
  const s = createRun('easy', 1.6, 5);
  const startSpeed = currentSpeed(s);
  const events = run(s, RUN_DURATION_SECONDS + 1, autoPlayer);
  const gemPoints = events.filter((e) => e.type === 'gem').reduce((sum, e) => sum + (e as { points: number }).points, 0);
  assert.ok(gemPoints > 0);
  assert.equal(s.score, gemPoints + s.cleared);
  const challenge = createRun('challenge', 1.6, 5);
  assert.ok(MODES.challenge.endSpeed > MODES.easy.endSpeed);
  assert.ok(currentSpeed(challenge) > startSpeed);
});

test('runs are deterministic for a seed and finish at exactly 60 seconds', () => {
  const a = createRun('challenge', 1.4, 99);
  const b = createRun('challenge', 1.4, 99);
  run(a, 70, autoPlayer);
  run(b, 70, autoPlayer);
  assert.equal(a.score, b.score);
  assert.equal(a.elapsed, RUN_DURATION_SECONDS);
});

test('fun-only: costs 2 hearts, no currency payout, bests separate per child and mode', () => {
  assert.equal(rules.RUN_HEART_COST, 2);
  assert.equal(Object.keys(rules).some((name) => /star|reward|award/i.test(name)), false);
  const keys = new Set([bestScoreKey('child-ansel', 'easy'), bestScoreKey('child-ansel', 'challenge'), bestScoreKey('child-thea', 'easy')]);
  assert.equal(keys.size, 3);
});

test('timing tolerance: Easy forgives a 0.15 s early/late jump, Challenge 0.08 s', () => {
  for (const [mode, slack] of [['easy', 0.15], ['challenge', 0.08]] as [RunMode, number][]) {
    for (const offset of [-slack, slack]) {
      for (let seed = 1; seed <= 15; seed += 1) {
        const s = createRun(mode, 1.4, seed * 104729);
        const player = (st: RunState) => {
          const ahead = st.obstacles.filter((o) => !o.passed && o.x + o.w > PET_X).sort((a, b) => a.x - b.x);
          if (!ahead.length || !st.grounded) return false;
          let spanEnd = ahead[0].x + ahead[0].w;
          for (const o of ahead.slice(1)) if (o.x < spanEnd + 8) spanEnd = Math.max(spanEnd, o.x + o.w);
          const centre = (ahead[0].x + spanEnd) / 2;
          // Positive offset = jump early, negative = jump late.
          return centre - PET_X <= currentSpeed(st) * (jumpAirtime(st.mode) / 2 + offset);
        };
        run(s, RUN_DURATION_SECONDS + 1, player);
        assert.equal(s.hits, 0, `${mode} offset ${offset}s seed ${seed}: ${s.hits} hits`);
      }
    }
  }
});
