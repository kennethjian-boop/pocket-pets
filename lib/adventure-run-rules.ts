/**
 * Pet Adventure Run — pure game engine (no React, no browser APIs) so physics,
 * fairness and scoring can be unit tested.
 *
 * World units: the play field is 100 units tall; its width is 100 × aspect.
 * The pet runs in place at x = PET_X while the world scrolls left.
 * Fun-only: score is game points. Nothing here touches any currency.
 */

export type RunMode = 'easy' | 'challenge';
export type ObstacleKind = 'log' | 'mushroom' | 'puddle';
export type GemKind = 'gem' | 'rainbow';

export const RUN_DURATION_SECONDS = 60;
export const RUN_HEART_COST = 2;
export const GROUND_Y = 14;
export const PET_X = 22;
export const PET_W = 15;
export const PET_H = 22;

export interface ModeConfig {
  label: string;
  startSpeed: number;
  endSpeed: number;
  gravity: number;
  jumpVelocity: number;
  /** Seconds of grace after leaving the ground during which a jump still counts. */
  coyoteTime: number;
  /** Seconds a jump press is remembered before landing. */
  jumpBuffer: number;
  hitPenalty: number;
  slowFactor: number;
  slowSeconds: number;
  /** Gap between obstacles in units, at the start and end of the run. */
  gapStart: [number, number];
  gapEnd: [number, number];
  /** Chance of a short double obstacle after the halfway point. */
  doubleChance: number;
  /** Hitbox forgiveness: pet half-width factor and obstacle height factor. */
  petHitbox: number;
  obstacleHitbox: number;
}

export const MODES: Record<RunMode, ModeConfig> = {
  easy: {
    label: 'Easy',
    startSpeed: 30,
    endSpeed: 42,
    gravity: 180,
    jumpVelocity: 100,
    coyoteTime: 0.12,
    jumpBuffer: 0.18,
    hitPenalty: 1,
    slowFactor: 0.7,
    slowSeconds: 0.8,
    gapStart: [70, 105],
    gapEnd: [55, 85],
    doubleChance: 0,
    petHitbox: 0.3,
    obstacleHitbox: 0.75,
  },
  challenge: {
    label: 'Challenge',
    startSpeed: 40,
    endSpeed: 62,
    gravity: 270,
    jumpVelocity: 116,
    coyoteTime: 0.08,
    jumpBuffer: 0.12,
    hitPenalty: 3,
    slowFactor: 0.55,
    slowSeconds: 1.1,
    gapStart: [62, 92],
    gapEnd: [48, 72],
    doubleChance: 0.5,
    petHitbox: 0.36,
    obstacleHitbox: 0.85,
  },
};

const OBSTACLE_SIZE: Record<ObstacleKind, { w: number; h: number }> = {
  log: { w: 14, h: 8 },
  mushroom: { w: 9, h: 12 },
  puddle: { w: 15, h: 2.5 },
};

export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  x: number;
  w: number;
  h: number;
  hit: boolean;
  passed: boolean;
}

export interface Gem {
  id: number;
  kind: GemKind;
  x: number;
  y: number;
  taken: boolean;
}

export type RunEvent =
  | { type: 'jump' }
  | { type: 'land' }
  | { type: 'gem'; id: number; kind: GemKind; points: number; x: number; y: number }
  | { type: 'hit'; id: number; penalty: number; x: number }
  | { type: 'cleared'; id: number; x: number }
  | { type: 'finished' };

export interface RunState {
  mode: RunMode;
  /** Round length in seconds (60 in the game; shorter only in QA builds). */
  duration: number;
  width: number;
  elapsed: number;
  distance: number;
  score: number;
  gems: number;
  cleared: number;
  hits: number;
  petY: number;
  petVy: number;
  grounded: boolean;
  sinceGrounded: number;
  jumpQueuedFor: number;
  slowLeft: number;
  invulnerableLeft: number;
  obstacles: Obstacle[];
  gemsOnField: Gem[];
  nextObstacleAt: number;
  nextId: number;
  finished: boolean;
  seed: number;
}

/** Small deterministic PRNG (mulberry32) so runs can be reproduced in tests. */
export function nextRandom(state: RunState) {
  state.seed = (state.seed + 0x6d2b79f5) | 0;
  let t = state.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function createRun(mode: RunMode, aspect: number, seed = Date.now(), duration = RUN_DURATION_SECONDS): RunState {
  const width = 100 * Math.max(1.05, aspect);
  return {
    mode,
    duration,
    width,
    elapsed: 0,
    distance: 0,
    score: 0,
    gems: 0,
    cleared: 0,
    hits: 0,
    petY: GROUND_Y,
    petVy: 0,
    grounded: true,
    sinceGrounded: 0,
    jumpQueuedFor: 0,
    slowLeft: 0,
    invulnerableLeft: 0,
    obstacles: [],
    gemsOnField: [],
    // First obstacle arrives after a calm couple of seconds.
    nextObstacleAt: width + 40,
    nextId: 1,
    finished: false,
    seed: seed | 0,
  };
}

export function progressOf(state: RunState) {
  return Math.min(1, state.elapsed / state.duration);
}

export function currentSpeed(state: RunState) {
  const cfg = MODES[state.mode];
  const base = cfg.startSpeed + (cfg.endSpeed - cfg.startSpeed) * progressOf(state);
  return state.slowLeft > 0 ? base * cfg.slowFactor : base;
}

/** Airtime of a full jump in seconds. */
export function jumpAirtime(mode: RunMode) {
  const cfg = MODES[mode];
  return (2 * cfg.jumpVelocity) / cfg.gravity;
}

/** Highest point the pet's feet reach above the ground. */
export function jumpApex(mode: RunMode) {
  const cfg = MODES[mode];
  return (cfg.jumpVelocity * cfg.jumpVelocity) / (2 * cfg.gravity);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function spawn(state: RunState, atX: number) {
  const cfg = MODES[state.mode];
  const p = progressOf(state);
  const kinds: ObstacleKind[] = ['log', 'mushroom', 'puddle'];
  const kind = kinds[Math.floor(nextRandom(state) * kinds.length)];
  const size = OBSTACLE_SIZE[kind];
  state.obstacles.push({ id: state.nextId++, kind, x: atX, w: size.w, h: size.h, hit: false, passed: false });

  // Gems: one over the obstacle (reward for jumping) and sometimes a ground trail after it.
  const apex = jumpApex(state.mode);
  state.gemsOnField.push({
    id: state.nextId++,
    kind: nextRandom(state) < 0.12 ? 'rainbow' : 'gem',
    x: atX + size.w / 2,
    y: GROUND_Y + size.h + Math.min(apex * 0.75, 18) + 4,
    taken: false,
  });
  if (nextRandom(state) < 0.6) {
    for (let i = 0; i < 3; i += 1) {
      state.gemsOnField.push({ id: state.nextId++, kind: 'gem', x: atX + size.w + 22 + i * 7, y: GROUND_Y + 6, taken: false });
    }
  }

  // Keep every gap comfortably longer than what the pet covers in one jump.
  const minFair = currentSpeed({ ...state, slowLeft: 0 }) * jumpAirtime(state.mode) + size.w + PET_W;
  let gap = lerp(cfg.gapStart[0], cfg.gapEnd[0], p) + nextRandom(state) * (lerp(cfg.gapStart[1], cfg.gapEnd[1], p) - lerp(cfg.gapStart[0], cfg.gapEnd[0], p));
  gap = Math.max(gap, minFair);
  if (p > 0.5 && kind === 'puddle' && nextRandom(state) < cfg.doubleChance) {
    // A long double puddle that one well-timed jump clears (challenge only).
    const second = OBSTACLE_SIZE.puddle;
    state.obstacles.push({ id: state.nextId++, kind: 'puddle', x: atX + size.w + 1, w: second.w * 0.4, h: second.h, hit: false, passed: false });
    gap += second.w;
  }
  state.nextObstacleAt = atX + gap;
}

const overlap = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 && b0 < a1;

/**
 * Advance the run by dt seconds. `jumpPressed` is true on the frame the player taps.
 * Mutates and returns state plus the events that happened this step.
 */
export function stepRun(state: RunState, dt: number, jumpPressed = false): RunEvent[] {
  const events: RunEvent[] = [];
  if (state.finished) return events;
  const cfg = MODES[state.mode];
  const step = Math.min(0.05, Math.max(0, dt));

  state.elapsed = Math.min(state.duration, state.elapsed + step);
  state.slowLeft = Math.max(0, state.slowLeft - step);
  state.invulnerableLeft = Math.max(0, state.invulnerableLeft - step);
  if (jumpPressed) state.jumpQueuedFor = cfg.jumpBuffer;
  else state.jumpQueuedFor = Math.max(0, state.jumpQueuedFor - step);

  // Jump (with coyote time and input buffering so taps feel responsive).
  const canJump = state.grounded || state.sinceGrounded < cfg.coyoteTime;
  if (state.jumpQueuedFor > 0 && canJump && state.petVy <= 0) {
    state.petVy = cfg.jumpVelocity;
    state.grounded = false;
    state.sinceGrounded = cfg.coyoteTime;
    state.jumpQueuedFor = 0;
    events.push({ type: 'jump' });
  }

  // Vertical motion.
  if (!state.grounded) {
    state.petVy -= cfg.gravity * step;
    state.petY += state.petVy * step;
    state.sinceGrounded += step;
    if (state.petY <= GROUND_Y) {
      state.petY = GROUND_Y;
      state.petVy = 0;
      state.grounded = true;
      state.sinceGrounded = 0;
      events.push({ type: 'land' });
    }
  }

  // Scroll the world.
  const dx = currentSpeed(state) * step;
  state.distance += dx;
  for (const o of state.obstacles) o.x -= dx;
  for (const g of state.gemsOnField) g.x -= dx;
  state.nextObstacleAt -= dx;
  if (state.elapsed < state.duration - 2 && state.nextObstacleAt <= state.width + 20) spawn(state, state.nextObstacleAt);

  // Collisions use slightly forgiving hitboxes.
  const petLeft = PET_X - PET_W * cfg.petHitbox;
  const petRight = PET_X + PET_W * cfg.petHitbox;
  const feet = state.petY;
  for (const o of state.obstacles) {
    if (o.hit || o.passed) continue;
    const hitLeft = o.x + o.w * 0.15;
    const hitRight = o.x + o.w * 0.85;
    if (state.invulnerableLeft <= 0 && overlap(petLeft, petRight, hitLeft, hitRight) && feet < GROUND_Y + o.h * cfg.obstacleHitbox) {
      o.hit = true;
      state.hits += 1;
      state.score = Math.max(0, state.score - cfg.hitPenalty);
      state.slowLeft = cfg.slowSeconds;
      state.invulnerableLeft = cfg.slowSeconds + 0.4;
      events.push({ type: 'hit', id: o.id, penalty: cfg.hitPenalty, x: o.x });
    } else if (o.x + o.w < petLeft) {
      o.passed = true;
      if (!o.hit) {
        state.cleared += 1;
        state.score += 1;
        events.push({ type: 'cleared', id: o.id, x: o.x });
      }
    }
  }

  for (const g of state.gemsOnField) {
    if (g.taken) continue;
    const dxp = Math.abs(g.x - PET_X);
    const petMid = state.petY + PET_H / 2;
    if (dxp < PET_W * 0.55 && Math.abs(g.y - petMid) < PET_H * 0.6) {
      g.taken = true;
      const points = g.kind === 'rainbow' ? 5 : 1;
      state.score += points;
      state.gems += 1;
      events.push({ type: 'gem', id: g.id, kind: g.kind, points, x: g.x, y: g.y });
    }
  }

  state.obstacles = state.obstacles.filter((o) => o.x + o.w > -10);
  state.gemsOnField = state.gemsOnField.filter((g) => g.x > -10 && !g.taken);

  if (state.elapsed >= state.duration) {
    state.finished = true;
    events.push({ type: 'finished' });
  }
  return events;
}

/** Device-local personal best, kept separately per child and mode. */
export function bestScoreKey(childId: string, mode: RunMode) {
  return `pocket-pets-run-best-${childId}-${mode}`;
}
