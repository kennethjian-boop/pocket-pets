/**
 * Runs the real Supabase migration SQL on PGlite (Postgres in WASM) to verify the
 * October 2026 functions. Supabase's auth.role() is stubbed via a session setting.
 * This checks SQL logic and atomicity; it cannot exercise true multi-connection
 * concurrency (PGlite is single-connection) — row locks are reviewed by reading.
 */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

const MIGRATIONS = path.join(import.meta.dirname, '..', 'supabase', 'migrations');
const sql = (file: string) => fs.readFileSync(path.join(MIGRATIONS, file), 'utf8');

let db: PGlite;

async function asRole(role: string) {
  await db.query(`select set_config('test.role', $1, false)`, [role]);
}

async function reset({ defeated = true, claimed = false, reward = { stars: 20, hearts: 1, screenEnergy: 1 } } = {}) {
  await db.exec(`
    drop trigger if exists fail_for_thea on public.children;
    delete from public.children;
    delete from public.care_action_state;
    delete from public.family_boss_state;
    insert into public.children (child_id, display_name, stars, hearts, screen_energy, mood_percent)
      values ('child-ansel', 'Ansel', 100, 2, 3, 70), ('child-thea', 'Thea', 48, 1, 2, 75);
  `);
  await db.query(
    `insert into public.family_boss_state (id, boss_id, boss_name, max_hp, current_hp, is_defeated, reward_claimed, rewards_by_child, attacks)
     values ('active', 'glitch-gremlin', 'Glitch Gremlin', 100, $1, $2, $3, $4, '[]'::jsonb)`,
    [defeated ? 0 : 40, defeated, claimed, JSON.stringify({ __family__: reward })]
  );
  await asRole('authenticated');
}

async function balances() {
  const { rows } = await db.query<{ child_id: string; stars: number; hearts: number; screen_energy: number }>(
    'select child_id, stars, hearts, screen_energy from public.children order by child_id'
  );
  return Object.fromEntries(rows.map((r) => [r.child_id, [r.stars, r.hearts, r.screen_energy]]));
}

async function claimed() {
  const { rows } = await db.query<{ reward_claimed: boolean }>("select reward_claimed from public.family_boss_state where id = 'active'");
  return rows[0].reward_claimed;
}

async function rpc<T = Record<string, unknown>>(call: string, params: unknown[] = []) {
  const { rows } = await db.query<{ result: T }>(`select ${call} as result`, params);
  return rows[0].result;
}

before(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create function auth.role() returns text language sql stable as $$ select current_setting('test.role', true) $$;
  `);
  await db.exec(sql('202605260001_phase1_child_state.sql'));
  await db.exec(`
    alter table public.children
      add column if not exists owned_pets jsonb, add column if not exists owned_skins jsonb,
      add column if not exists secret_egg_state jsonb, add column if not exists completed_missions jsonb;
  `);
  await db.exec(sql('202605270003_care_poop_events.sql'));
  // family_boss_state predates the migrations folder; mirror the columns the app uses.
  await db.exec(`
    create table public.family_boss_state (
      id text primary key, boss_id text, boss_name text, boss_theme text, boss_description text, boss_image text,
      max_hp integer not null default 100, current_hp integer not null default 100, started_at timestamptz default now(),
      week_label text, is_defeated boolean not null default false, reward_claimed boolean not null default false,
      rewards_by_child jsonb, attacks jsonb not null default '[]'::jsonb, updated_at timestamptz not null default now()
    );
  `);
  await db.exec(sql('202610110001_atomic_boss_claim_and_star_free_care.sql'));
});

test('claim pays every child once and marks the boss claimed', async () => {
  await reset();
  const result = await rpc<{ changed: boolean; children: string[] }>('public.claim_boss_victory_rewards()');
  assert.equal(result.changed, true);
  assert.deepEqual(result.children, ['child-ansel', 'child-thea']);
  assert.deepEqual(await balances(), { 'child-ansel': [120, 3, 4], 'child-thea': [68, 2, 3] });
  assert.equal(await claimed(), true);
});

test('repeated claims (double-click, retry after a dropped response) never pay twice', async () => {
  await reset();
  await rpc('public.claim_boss_victory_rewards()');
  const again = await rpc<{ changed: boolean; already_claimed: boolean }>('public.claim_boss_victory_rewards()');
  assert.equal(again.changed, false);
  assert.equal(again.already_claimed, true);
  assert.deepEqual(await balances(), { 'child-ansel': [120, 3, 4], 'child-thea': [68, 2, 3] });
});

test('a failure part-way through rolls back everything (no partial payment)', async () => {
  await reset();
  await db.exec(`
    create or replace function public.test_fail_thea() returns trigger language plpgsql as $$
    begin if new.child_id = 'child-thea' then raise exception 'simulated failure'; end if; return new; end $$;
    create trigger fail_for_thea before update on public.children for each row execute function public.test_fail_thea();
  `);
  await assert.rejects(rpc('public.claim_boss_victory_rewards()'), /simulated failure/);
  await db.exec('drop trigger fail_for_thea on public.children');
  assert.deepEqual(await balances(), { 'child-ansel': [100, 2, 3], 'child-thea': [48, 1, 2] }, 'Ansel was not paid alone');
  assert.equal(await claimed(), false, 'boss is still claimable');
});

test('cannot claim before the boss is defeated, or without a session', async () => {
  await reset({ defeated: false });
  await assert.rejects(rpc('public.claim_boss_victory_rewards()'), /not defeated/);
  await reset();
  await asRole('anon');
  await assert.rejects(rpc('public.claim_boss_victory_rewards()'), /Authenticated parent session required/);
  assert.equal(await claimed(), false);
});

test('uses the parent-configured prize', async () => {
  await reset({ reward: { stars: 35, hearts: 0, screenEnergy: 2 } });
  await rpc('public.claim_boss_victory_rewards()');
  assert.deepEqual(await balances(), { 'child-ansel': [135, 2, 5], 'child-thea': [83, 1, 4] });
});

test('care actions change mood but never balances, even crossing 80 and 100 mood', async () => {
  await reset();
  // Ansel starts at 70 mood: feeding crosses 80 (previously +1 star).
  const result = await rpc<{ star_reward: number; stars: number; mood_percent: number }>(
    "public.perform_care_action_transaction('child-ansel', 'feed')"
  );
  assert.equal(result.star_reward, 0);
  assert.equal(result.mood_percent, 80);
  await db.exec("update public.children set mood_percent = 95 where child_id = 'child-ansel'");
  await rpc("public.perform_care_action_transaction('child-ansel', 'pat')");
  const { rows } = await db.query<{ mood_percent: number }>("select mood_percent from public.children where child_id = 'child-ansel'");
  assert.equal(rows[0].mood_percent, 100);
  assert.deepEqual((await balances())['child-ansel'], [100, 2, 3], 'stars/hearts/energy unchanged');
});

test('care limits are feed 4 / pat 5 / clean 3 and cooldowns still apply', async () => {
  await reset();
  await rpc("public.perform_care_action_transaction('child-thea', 'clean')");
  await assert.rejects(rpc("public.perform_care_action_transaction('child-thea', 'clean')"), /cooldown/);
  for (const [action, limit] of [['feed', 4], ['pat', 5], ['clean', 3]] as const) {
    await db.query(
      `update public.care_action_state set action_counts = jsonb_build_object('feed', 0, 'pat', 0, 'clean', 0) || jsonb_build_object($1::text, $2::int - 1),
         last_timestamps = '{"feed":0,"pat":0,"clean":0}'::jsonb where child_id = 'child-thea'`,
      [action, limit]
    );
    await rpc(`public.perform_care_action_transaction('child-thea', '${action}')`);
    await db.exec(`update public.care_action_state set last_timestamps = '{"feed":0,"pat":0,"clean":0}'::jsonb where child_id = 'child-thea'`);
    await assert.rejects(rpc(`public.perform_care_action_transaction('child-thea', '${action}')`), /limit reached/, `${action} limit ${limit}`);
  }
});
