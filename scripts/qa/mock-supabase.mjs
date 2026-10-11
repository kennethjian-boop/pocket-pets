#!/usr/bin/env node
/**
 * Local fake Supabase for visual QA and browser tests.
 *
 * NEVER point QA runs at the real family project: loading pages writes mood
 * decay, reward templates, etc. This server emulates the small PostgREST
 * subset Pocket Pets uses (select / insert / upsert / update with eq, is,
 * order, limit), the two authoritative RPCs, and the auth endpoints that
 * supabase-js may call. State lives in memory and resets on demand.
 *
 *   node scripts/qa/mock-supabase.mjs            # listens on :54399
 *   POST /__mock/reset?scenario=default|fresh|victory|rich
 *   GET  /__mock/state
 */
import http from 'node:http';
import { URL } from 'node:url';

const PORT = Number(process.env.MOCK_SUPABASE_PORT ?? 54399);

function sgDateKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const by = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${by.year}-${by.month}-${by.day}`;
}

// Monotonic timestamps so optimistic-lock comparisons are never ambiguous.
let lastStamp = 0;
function stamp() {
  const now = Math.max(Date.now(), lastStamp + 1);
  lastStamp = now;
  return new Date(now).toISOString().replace('Z', '+00:00');
}

const GOAL_BANK = {
  'read-15-minutes': { title: 'Read for 15 Minutes', description: 'Read quietly and enjoy a book', category: 'reading', starReward: 10, bossDamage: 10 },
  'pack-away-toys': { title: 'Pack Away Toys', description: 'Put toys back where they belong', category: 'chores', starReward: 15, bossDamage: 10 },
  'brush-teeth-twice': { title: 'Brush Teeth Twice', description: 'Morning and night brushing complete', category: 'self-care', starReward: 10, bossDamage: 10 },
  'use-gentle-words': { title: 'Use Gentle Words', description: 'Speak kindly even when upset', category: 'kindness', starReward: 15, bossDamage: 10 },
  'help-with-dinner': { title: 'Help with Dinner', description: 'Help with one simple dinner task', category: 'chores', starReward: 15, bossDamage: 10 },
  'calm-down-brave': { title: 'Calm Down Brave', description: 'Try calming down when upset', category: 'calm', starReward: 15, bossDamage: 10 },
};

function goal(id, completed = false) {
  const g = GOAL_BANK[id];
  return { id, ...g, reward: g.starReward, completed };
}

function child(overrides) {
  return {
    display_name: 'Child',
    stars: 0,
    hearts: 0,
    screen_energy: 0,
    equipped_pet: 'bubbo',
    equipped_skin_by_pet: {},
    owned_pets: [],
    owned_skins: [],
    secret_egg_state: null,
    completed_missions: {},
    mood_percent: 70,
    mood_updated_at: stamp(),
    created_at: stamp(),
    updated_at: stamp(),
    ...overrides,
  };
}

function bossRow(overrides = {}) {
  return {
    id: 'active',
    boss_id: 'glitch-gremlin',
    boss_name: 'Glitch Gremlin',
    boss_theme: 'Screen chaos',
    boss_description: 'A mischievous troublemaker that feeds on too much screen time and tech chaos.',
    boss_image: '/bosses/glitch-gremlin/Glitch Gremlin.png',
    max_hp: 100,
    current_hp: 100,
    started_at: stamp(),
    week_label: 'Oct 11 - Oct 17',
    is_defeated: false,
    reward_claimed: false,
    rewards_by_child: { __family__: { stars: 20, hearts: 1, screenEnergy: 1 } },
    attacks: [],
    updated_at: stamp(),
    ...overrides,
  };
}

function attack(childId, childName, title, damage, minutesAgo, sourceType = 'mission') {
  return {
    id: `${sourceType}-${childId}-${title}-${minutesAgo}`,
    childId,
    childName,
    sourceType,
    sourceId: sourceType === 'mission' ? `mission:${childId}:${title}:${sgDateKey()}` : undefined,
    title,
    damage,
    createdAt: new Date(Date.now() - minutesAgo * 60000).toISOString(),
  };
}

function withHp(row) {
  const dmg = row.attacks.reduce((s, a) => s + (a.damage ?? 0), 0);
  row.current_hp = Math.max(0, row.max_hp - dmg);
  row.is_defeated = row.current_hp === 0;
  return row;
}

function scenario(name) {
  const today = sgDateKey();
  const db = {
    children: [],
    daily_goals: [],
    care_action_state: [],
    family_boss_state: [],
    reward_templates: [],
    parent_settings: [{ id: 'family', pin: '1234', settings: {}, updated_at: stamp() }],
  };

  if (name === 'fresh') {
    db.children.push(
      child({ child_id: 'child-ansel', display_name: 'Ansel', stars: 20, hearts: 10, equipped_pet: 'bubbo', owned_pets: ['bubbo'] }),
      child({ child_id: 'child-thea', display_name: 'Thea', stars: 20, hearts: 10, equipped_pet: 'luna', owned_pets: ['luna'] })
    );
    db.family_boss_state.push(bossRow());
    return db;
  }

  const ansel = child({
    child_id: 'child-ansel',
    display_name: 'Ansel',
    stars: name === 'rich' ? 420 : 135,
    hearts: 6,
    screen_energy: 4,
    equipped_pet: 'ember',
    owned_pets: ['bubbo', 'ember'],
    owned_skins: ['dragon-knight-bubbo', 'celestial-guardian-ember'],
    equipped_skin_by_pet: { bubbo: 'dragon-knight-bubbo', ember: null },
    mood_percent: 82,
    completed_missions: { 'read-15-minutes': true },
  });
  const thea = child({
    child_id: 'child-thea',
    display_name: 'Thea',
    stars: name === 'rich' ? 260 : 48,
    hearts: 1,
    screen_energy: 2,
    equipped_pet: 'luna',
    owned_pets: ['luna'],
    owned_skins: ['moon-priestess-luna'],
    equipped_skin_by_pet: { luna: null },
    mood_percent: 64,
    secret_egg_state: {
      id: 'secret-egg-qa',
      type: 'secret-egg',
      progress: 6,
      requiredGoals: 10,
      contributedGoalIds: [],
      hatched: false,
      unlockedPetId: null,
    },
  });
  db.children.push(ansel, thea);

  db.daily_goals.push(
    { id: 'goal-row-ansel', child_id: 'child-ansel', date: today, goals: [goal('read-15-minutes', true), goal('pack-away-toys'), goal('use-gentle-words')], updated_at: stamp() },
    { id: 'goal-row-thea', child_id: 'child-thea', date: today, goals: [goal('brush-teeth-twice'), goal('help-with-dinner'), goal('calm-down-brave')], updated_at: stamp() }
  );

  db.care_action_state.push({
    child_id: 'child-ansel',
    date: today,
    action_counts: { feed: 1, pat: 2, clean: 0 },
    last_timestamps: { feed: Date.now() - 3600000, pat: Date.now() - 3500000, clean: 0 },
    poop_events: [],
    pat_heart_awarded: false,
    updated_at: stamp(),
  });

  const attacks = name === 'victory'
    ? [
        attack('child-ansel', 'Ansel', 'Read for 15 Minutes', 40, 30),
        attack('child-thea', 'Thea', 'Brush Teeth Twice', 35, 60),
        attack('child-thea', 'Thea', 'Super helpful morning', 25, 90, 'parent_bonus'),
      ]
    : [
        attack('child-ansel', 'Ansel', 'Read for 15 Minutes', 10, 25),
        attack('child-thea', 'Thea', 'Help with Dinner', 10, 300),
        attack('child-ansel', 'Ansel', 'Pack Away Toys', 10, 1500),
        attack('child-thea', 'Thea', 'Kind sharing at the park', 10, 1600, 'parent_bonus'),
      ];
  db.family_boss_state.push(withHp(bossRow({ attacks })));
  return db;
}

let db = scenario('default');

// ─── PostgREST helpers ────────────────────────────────────────────────────────

const PRIMARY_KEYS = {
  children: ['child_id'],
  daily_goals: ['child_id', 'date'],
  care_action_state: ['child_id'],
  family_boss_state: ['id'],
  reward_templates: ['id'],
  parent_settings: ['id'],
};

function parseFilters(searchParams) {
  const filters = [];
  for (const [key, raw] of searchParams.entries()) {
    if (['select', 'order', 'limit', 'on_conflict', 'columns', 'offset'].includes(key)) continue;
    const dot = raw.indexOf('.');
    filters.push({ column: key, op: raw.slice(0, dot), value: raw.slice(dot + 1) });
  }
  return filters;
}

function sameValue(cell, value) {
  if (cell === null || cell === undefined) return value === 'null';
  if (typeof cell === 'boolean') return String(cell) === value;
  if (typeof cell === 'number') return Number(value) === cell;
  if (typeof cell === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(cell)) {
    const a = Date.parse(cell);
    const b = Date.parse(value);
    if (!Number.isNaN(a) && !Number.isNaN(b)) return a === b;
  }
  return String(cell) === value;
}

function matches(row, filters) {
  return filters.every(({ column, op, value }) => {
    const cell = row[column];
    if (op === 'eq') return sameValue(cell, value);
    if (op === 'neq') return !sameValue(cell, value);
    if (op === 'is') return value === 'null' ? cell === null || cell === undefined : String(cell) === value;
    if (op === 'gte') return cell >= value;
    if (op === 'lte') return cell <= value;
    return true;
  });
}

function project(row, select) {
  if (!select || select === '*') return { ...row };
  const out = {};
  for (const col of select.split(',').map((c) => c.trim()).filter(Boolean)) out[col] = row[col] ?? null;
  return out;
}

function applyOrderLimit(rows, searchParams) {
  let result = [...rows];
  const order = searchParams.get('order');
  if (order) {
    const [col, dir] = order.split('.');
    result.sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (dir === 'desc' ? -1 : 1));
  }
  const limit = searchParams.get('limit');
  if (limit) result = result.slice(0, Number(limit));
  return result;
}

function touch(table, row) {
  // Mirrors the set_updated_at trigger on children / care state.
  if (table === 'children' || table === 'care_action_state' || table === 'daily_goals') row.updated_at = stamp();
  else if (!row.updated_at) row.updated_at = stamp();
  return row;
}

function respond(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Expose-Headers': 'Content-Range',
    ...extraHeaders,
  });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

function sendRows(req, res, rows, select) {
  const projected = rows.map((r) => project(r, select));
  const wantsObject = (req.headers.accept ?? '').includes('vnd.pgrst.object');
  if (wantsObject) {
    if (projected.length !== 1) {
      return respond(res, 406, {
        code: 'PGRST116',
        message: 'JSON object requested, multiple (or no) rows returned',
        details: `The result contains ${projected.length} rows`,
      });
    }
    return respond(res, 200, projected[0]);
  }
  return respond(res, 200, projected, { 'Content-Range': `0-${Math.max(0, projected.length - 1)}/*` });
}

// ─── RPCs (port of the SQL in supabase/migrations) ────────────────────────────

class RpcError extends Error {}

function rpcVerify({ p_child_id, p_goal_id, p_completed }) {
  const today = sgDateKey();
  const daily = db.daily_goals.find((r) => r.child_id === p_child_id && r.date === today);
  if (!daily) throw new RpcError(`No daily goals found for child ${p_child_id} on ${today}.`);
  const g = daily.goals.find((x) => x.id === p_goal_id);
  if (!g) throw new RpcError(`Goal ${p_goal_id} is not assigned to child ${p_child_id} today.`);
  const c = db.children.find((r) => r.child_id === p_child_id);
  const boss = db.family_boss_state.find((r) => r.id === 'active');
  if (!c || !boss) throw new RpcError('Missing child or boss.');
  const was = g.completed === true;
  if (was === p_completed) return { changed: false, child_id: p_child_id, goal_id: p_goal_id, completed: p_completed };

  const starReward = Math.max(0, Number(g.starReward ?? g.reward ?? 0));
  const damage = Math.max(0, Number(g.bossDamage ?? 10));
  const sourceId = `mission:${p_child_id}:${p_goal_id}`;
  const contributionId = `${sourceId}:${today}`;
  g.completed = p_completed;
  const completedMissions = Object.fromEntries(daily.goals.map((x) => [x.id, x.completed === true]));

  let egg = c.secret_egg_state ? { ...c.secret_egg_state } : null;
  const owned = [...(c.owned_pets ?? [])];
  if (egg && !egg.hatched) {
    let contributions = [...(egg.contributedGoalIds ?? [])];
    const required = Math.max(1, egg.requiredGoals ?? 10);
    let progress = Math.max(0, egg.progress ?? 0);
    if (p_completed) {
      if (!contributions.includes(contributionId)) {
        contributions.push(contributionId);
        progress = Math.min(required, Math.max(progress + 1, contributions.length));
      }
      if (progress >= required) {
        const locked = ['bubbo', 'luna', 'mochi', 'ember'].filter((p) => !owned.includes(p));
        const unlocked = locked.length ? locked[Math.floor(Math.random() * locked.length)] : null;
        if (unlocked) owned.push(unlocked);
        egg = { ...egg, progress: required, contributedGoalIds: contributions, hatched: true, unlockedPetId: unlocked };
      } else {
        egg = { ...egg, progress, contributedGoalIds: contributions };
      }
    } else if (contributions.includes(contributionId)) {
      contributions = contributions.filter((x) => x !== contributionId);
      egg = { ...egg, progress: Math.max(0, Math.min(progress - 1, contributions.length)), contributedGoalIds: contributions };
    }
  }

  let attacks = [...boss.attacks];
  if (p_completed) {
    if (!attacks.some((a) => a.sourceId === contributionId)) {
      attacks = [{
        id: `mission-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        childId: p_child_id,
        childName: c.display_name,
        sourceType: 'mission',
        sourceId: contributionId,
        title: g.title ?? p_goal_id,
        damage,
        createdAt: new Date().toISOString(),
      }, ...attacks];
    }
  } else {
    attacks = attacks.filter((a) => a.sourceId !== contributionId && a.sourceId !== sourceId);
  }

  daily.updated_at = stamp();
  c.stars = Math.max(0, c.stars + (p_completed ? starReward : -starReward));
  c.owned_pets = owned;
  c.secret_egg_state = egg;
  c.completed_missions = completedMissions;
  if (p_completed) {
    c.mood_percent = Math.min(100, (c.mood_percent ?? 70) + 3);
    c.mood_updated_at = stamp();
  }
  touch('children', c);
  boss.attacks = attacks;
  withHp(boss);
  boss.updated_at = stamp();
  return { changed: true, child_id: p_child_id, goal_id: p_goal_id, completed: p_completed, egg_hatched: egg?.hatched ?? false, unlocked_pet_id: egg?.unlockedPetId ?? null };
}

function rpcCare({ p_child_id, p_action }) {
  const today = sgDateKey();
  const nowMs = Date.now();
  if (!['feed', 'pat', 'clean'].includes(p_action)) throw new RpcError(`Unknown care action: ${p_action}.`);
  const c = db.children.find((r) => r.child_id === p_child_id);
  if (!c) throw new RpcError(`Child ${p_child_id} was not found.`);
  let care = db.care_action_state.find((r) => r.child_id === p_child_id);
  let counts = { feed: 0, pat: 0, clean: 0 };
  let stamps = { feed: 0, pat: 0, clean: 0 };
  let poop = [];
  if (care) {
    poop = Array.isArray(care.poop_events) ? care.poop_events : [];
    if (care.date === today) {
      counts = { ...counts, ...care.action_counts };
      stamps = { ...stamps, ...care.last_timestamps };
    }
  }
  const limit = { feed: 4, pat: 5, clean: 3 }[p_action];
  const cooldown = { feed: 60000, pat: 20000, clean: 120000 }[p_action];
  if ((counts[p_action] ?? 0) >= limit) throw new RpcError(`Daily ${p_action} limit reached.`);
  if (nowMs - (stamps[p_action] ?? 0) < cooldown) throw new RpcError('Care action cooldown is still active.');
  counts[p_action] = (counts[p_action] ?? 0) + 1;
  stamps[p_action] = nowMs;
  if (p_action === 'clean') poop = poop.map((e) => (e.cleanedAt ? e : { ...e, cleanedAt: new Date().toISOString() }));
  const cur = Math.max(30, Math.min(100, c.mood_percent ?? 70));
  const next = Math.min(100, cur + 10);
  const reward = cur < 100 && next >= 100 ? 3 : cur < 80 && next >= 80 ? 1 : 0;
  c.stars = Math.max(0, c.stars + reward);
  c.mood_percent = next;
  c.mood_updated_at = stamp();
  touch('children', c);
  if (!care) {
    care = { child_id: p_child_id };
    db.care_action_state.push(care);
  }
  Object.assign(care, { date: today, action_counts: counts, last_timestamps: stamps, poop_events: poop, pat_heart_awarded: false, updated_at: stamp() });
  return {
    changed: true,
    child_id: p_child_id,
    action: p_action,
    star_reward: reward,
    stars: c.stars,
    mood_percent: next,
    mood_updated_at: c.mood_updated_at,
    date: today,
    action_counts: counts,
    last_timestamps: stamps,
    poop_events: poop,
    pat_heart_awarded: false,
  };
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────

const requestLog = [];

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : null);
      } catch {
        resolve(null);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    });
    return res.end();
  }

  const body = await readBody(req);

  if (url.pathname === '/__mock/reset') {
    db = scenario(url.searchParams.get('scenario') ?? 'default');
    requestLog.length = 0;
    return respond(res, 200, { ok: true });
  }
  if (url.pathname === '/__mock/state') return respond(res, 200, db);
  if (url.pathname === '/__mock/log') return respond(res, 200, requestLog);
  if (url.pathname === '/__mock/patch') {
    // Test hook: simulate a write from another device.
    const { table, match, set } = body ?? {};
    const row = db[table]?.find((r) => Object.entries(match).every(([k, v]) => r[k] === v));
    if (!row) return respond(res, 404, { error: 'no row' });
    Object.assign(row, set);
    touch(table, row);
    if (table === 'family_boss_state') withHp(row);
    return respond(res, 200, row);
  }

  if (url.pathname.startsWith('/auth/v1/')) {
    if (url.pathname.endsWith('/logout')) return respond(res, 204);
    if (url.pathname.endsWith('/settings')) return respond(res, 200, { external: {} });
    return respond(res, 200, {});
  }

  if (url.pathname.startsWith('/rest/v1/rpc/')) {
    const fn = url.pathname.split('/').pop();
    requestLog.push({ method: 'RPC', fn, body });
    try {
      if (fn === 'verify_daily_goal_transaction') return respond(res, 200, rpcVerify(body));
      if (fn === 'perform_care_action_transaction') return respond(res, 200, rpcCare(body));
      return respond(res, 404, { message: `Unknown RPC ${fn}` });
    } catch (error) {
      return respond(res, 400, { code: 'P0001', message: error.message });
    }
  }

  if (url.pathname.startsWith('/rest/v1/')) {
    const table = url.pathname.split('/').pop();
    const rows = db[table];
    if (!rows) return respond(res, 404, { code: '42P01', message: `relation "public.${table}" does not exist` });
    const filters = parseFilters(url.searchParams);
    const select = url.searchParams.get('select');
    requestLog.push({ method: req.method, table, filters, body });

    if (req.method === 'GET') {
      return sendRows(req, res, applyOrderLimit(rows.filter((r) => matches(r, filters)), url.searchParams), select);
    }

    if (req.method === 'PATCH') {
      const hit = rows.filter((r) => matches(r, filters));
      for (const row of hit) {
        Object.assign(row, body);
        touch(table, row);
        if (table === 'family_boss_state' && body && !('current_hp' in body)) withHp(row);
      }
      return sendRows(req, res, hit, select);
    }

    if (req.method === 'POST') {
      const prefer = req.headers.prefer ?? '';
      const merge = prefer.includes('merge-duplicates');
      const keys = url.searchParams.get('on_conflict')?.split(',') ?? PRIMARY_KEYS[table];
      const items = Array.isArray(body) ? body : [body];
      const written = [];
      for (const item of items) {
        const existing = rows.find((r) => keys.every((k) => r[k] === item[k]));
        if (existing && merge) {
          Object.assign(existing, item);
          touch(table, existing);
          written.push(existing);
        } else if (existing) {
          return respond(res, 409, { code: '23505', message: `duplicate key value violates unique constraint "${table}_pkey"` });
        } else {
          const row = touch(table, { ...item });
          rows.push(row);
          written.push(row);
        }
      }
      return sendRows(req, res, written, select);
    }
  }

  respond(res, 404, { message: 'not found' });
});

server.listen(PORT, () => {
  console.log(`[mock-supabase] listening on http://localhost:${PORT}`);
});
