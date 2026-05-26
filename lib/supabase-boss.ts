'use client';

import { getSupabaseBrowserClient, hasSupabaseBrowserEnv } from '@/lib/supabase-browser';
import type { BossBattleState, BossAttack, BossRewardConfig } from '@/lib/boss-battle';

// ─── DB row shape ────────────────────────────────────────────────────────────

type BossStateRow = {
  id: string;
  boss_id: string;
  boss_name: string;
  boss_theme: string;
  boss_description: string;
  boss_image: string;
  max_hp: number;
  current_hp: number;
  started_at: string;
  week_label: string;
  is_defeated: boolean;
  reward_claimed: boolean;
  rewards_by_child: Record<string, unknown> | null;
  attacks: unknown[] | null;
  updated_at: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const SELECT =
  'id, boss_id, boss_name, boss_theme, boss_description, boss_image, max_hp, current_hp, started_at, week_label, is_defeated, reward_claimed, rewards_by_child, attacks, updated_at';

// ─── Normalizers ─────────────────────────────────────────────────────────────

function normalizeAttacks(value: unknown): BossAttack[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (a): a is BossAttack =>
      a !== null &&
      typeof a === 'object' &&
      typeof (a as Record<string, unknown>).id === 'string' &&
      typeof (a as Record<string, unknown>).childId === 'string' &&
      typeof (a as Record<string, unknown>).damage === 'number'
  );
}

function normalizeRewardsByChild(value: unknown): Record<string, BossRewardConfig> {
  if (!value || typeof value !== 'object') return {};
  const result: Record<string, BossRewardConfig> = {};
  for (const [childId, reward] of Object.entries(value as Record<string, unknown>)) {
    if (reward && typeof reward === 'object') {
      const r = reward as Record<string, unknown>;
      result[childId] = {
        stars: typeof r.stars === 'number' ? r.stars : 0,
        hearts: typeof r.hearts === 'number' ? r.hearts : 0,
        screenEnergy: typeof r.screenEnergy === 'number' ? r.screenEnergy : 0,
      };
    }
  }
  return result;
}

// ─── Row → domain mapper ──────────────────────────────────────────────────────

function toSupabaseBossState(row: BossStateRow): BossBattleState {
  return {
    bossId: row.boss_id,
    bossName: row.boss_name,
    bossTheme: row.boss_theme,
    bossDescription: row.boss_description,
    bossImage: row.boss_image,
    maxHp: row.max_hp,
    currentHp: row.current_hp,
    startedAt: row.started_at,
    weekLabel: row.week_label,
    isDefeated: row.is_defeated,
    rewardClaimed: row.reward_claimed,
    rewardsByChild: normalizeRewardsByChild(row.rewards_by_child),
    attacks: normalizeAttacks(row.attacks),
  };
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

export async function fetchBossState(): Promise<BossBattleState | null> {
  if (!hasSupabaseBrowserEnv()) return null;

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('family_boss_state')
    .select(SELECT)
    .eq('id', 'active')
    .maybeSingle<BossStateRow>();

  if (error) {
    console.warn('Unable to fetch boss state from Supabase.', error.message);
    return null;
  }

  return data ? toSupabaseBossState(data) : null;
}

// ─── Upsert (fire-and-forget from boss-battle) ────────────────────────────────

export async function upsertBossState(state: BossBattleState): Promise<void> {
  if (!hasSupabaseBrowserEnv()) return;

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from('family_boss_state').upsert(
    {
      id: 'active',
      boss_id: state.bossId,
      boss_name: state.bossName,
      boss_theme: state.bossTheme,
      boss_description: state.bossDescription,
      boss_image: state.bossImage,
      max_hp: state.maxHp,
      current_hp: state.currentHp,
      started_at: state.startedAt,
      week_label: state.weekLabel,
      is_defeated: state.isDefeated,
      reward_claimed: state.rewardClaimed,
      rewards_by_child: state.rewardsByChild ?? {},
      attacks: state.attacks,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.warn('Unable to upsert boss state to Supabase.', error.message);
  }
}
