import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const rootDir = process.cwd();
const envPath = join(rootDir, '.env.local');

function loadEnvFile(path) {
  try {
    const env = readFileSync(path, 'utf8');
    for (const line of env.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...valueParts] = trimmed.split('=');
      if (!key || process.env[key]) continue;
      process.env[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
    }
  } catch {
    // Allow CI/terminal-provided env vars.
  }
}

function getWeekLabel(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return `${start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} - ${end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env.local or your shell environment.`);
  }
  return value;
}

async function runStep(label, action) {
  const { error } = await action();
  if (error) throw new Error(`${label} failed: ${error.message}`);
  console.log(`OK ${label}`);
}

loadEnvFile(envPath);

const supabase = createClient(
  requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
);

const childIds = ['child-ansel', 'child-thea'];
const blankSkins = { luna: null, bubbo: null, mochi: null, ember: null };
const now = new Date().toISOString();

const freshChildren = [
  {
    child_id: 'child-ansel',
    display_name: 'Ansel',
    stars: 20,
    hearts: 10,
    screen_energy: 0,
    equipped_pet: 'bubbo',
    equipped_skin_by_pet: blankSkins,
    owned_pets: ['bubbo'],
    owned_skins: [],
    secret_egg_state: null,
    completed_missions: {},
  },
  {
    child_id: 'child-thea',
    display_name: 'Thea',
    stars: 20,
    hearts: 10,
    screen_energy: 0,
    equipped_pet: 'luna',
    equipped_skin_by_pet: blankSkins,
    owned_pets: ['luna'],
    owned_skins: [],
    secret_egg_state: null,
    completed_missions: {},
  },
];

const freshBoss = {
  id: 'active',
  boss_id: 'glitch-gremlin',
  boss_name: 'Glitch Gremlin',
  boss_theme: 'Screen chaos',
  boss_description:
    'A mischievous troublemaker that feeds on too much screen time and tech chaos.',
  boss_image: '/bosses/glitch-gremlin/Glitch Gremlin.png',
  max_hp: 100,
  current_hp: 100,
  started_at: now,
  week_label: getWeekLabel(),
  is_defeated: false,
  reward_claimed: false,
  rewards_by_child: {},
  attacks: [],
  updated_at: now,
};

console.log('Resetting Pocket Pets fresh MVP state...');

await runStep('children', () =>
  supabase.from('children').upsert(freshChildren, { onConflict: 'child_id' })
);

await runStep('family boss', () =>
  supabase.from('family_boss_state').upsert(freshBoss, { onConflict: 'id' })
);

await runStep('daily goals', () =>
  supabase.from('daily_goals').delete().in('child_id', childIds)
);

await runStep('care actions', () =>
  supabase.from('care_action_state').delete().in('child_id', childIds)
);

await runStep('reward template overrides', () =>
  supabase.from('reward_templates').delete().eq('id', 'family')
);

console.log('Fresh MVP reset complete.');
