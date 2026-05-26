'use client';

import { getSupabaseBrowserClient, hasSupabaseBrowserEnv } from '@/lib/supabase-browser';
import type { DailyGoalsRecord, GoalSetupMode } from '@/lib/mission-state';

// ─── DB row shape ────────────────────────────────────────────────────────────

type DailyGoalsRow = {
  child_id: string;
  date: string;
  goal_ids: unknown[] | null;
  setup_mode: string;
  previous_goal_ids: unknown[] | null;
  updated_at: string;
};

// ─── Public type ─────────────────────────────────────────────────────────────

export type SupabaseDailyGoalState = {
  childId: string;
  date: string;
  goalIds: string[];
  setupMode: GoalSetupMode;
  previousGoalIds: string[];
  updatedAt: string;
};

// ─── Normalizer ──────────────────────────────────────────────────────────────

const VALID_SETUP_MODES = new Set<GoalSetupMode>(['auto', 'manual', 'random']);

function toSupabaseDailyGoalState(row: DailyGoalsRow): SupabaseDailyGoalState {
  return {
    childId: row.child_id,
    date: row.date,
    goalIds: Array.isArray(row.goal_ids)
      ? row.goal_ids.filter((id): id is string => typeof id === 'string')
      : [],
    setupMode: VALID_SETUP_MODES.has(row.setup_mode as GoalSetupMode)
      ? (row.setup_mode as GoalSetupMode)
      : 'auto',
    previousGoalIds: Array.isArray(row.previous_goal_ids)
      ? row.previous_goal_ids.filter((id): id is string => typeof id === 'string')
      : [],
    updatedAt: row.updated_at,
  };
}

const SELECT = 'child_id, date, goal_ids, setup_mode, previous_goal_ids, updated_at';

// ─── Fetch ───────────────────────────────────────────────────────────────────

export async function fetchDailyGoalsForChild(
  childId: string
): Promise<SupabaseDailyGoalState | null> {
  if (!hasSupabaseBrowserEnv()) {
    console.log('[Goals] Supabase env not available — using localStorage for', childId);
    return null;
  }

  const supabase = getSupabaseBrowserClient();
  console.log('[Goals] Fetching from Supabase for child_id:', childId);
  const { data, error } = await supabase
    .from('daily_goals')
    .select(SELECT)
    .eq('child_id', childId)
    .maybeSingle<DailyGoalsRow>();

  if (error) {
    console.warn('[Goals] Fetch error for', childId, '—', error.message);
    return null;
  }

  const result = data ? toSupabaseDailyGoalState(data) : null;
  if (result) {
    console.log('[Goals] Row found for', childId, '— date:', result.date, 'ids:', result.goalIds, 'mode:', result.setupMode);
  } else {
    console.log('[Goals] No row in Supabase for', childId, '— will use localStorage');
  }
  return result;
}

// ─── Upsert (fire-and-forget from mission-state) ──────────────────────────────

export async function upsertDailyGoalsForChild(
  childId: string,
  record: DailyGoalsRecord,
  setupMode: GoalSetupMode
): Promise<void> {
  if (!hasSupabaseBrowserEnv()) return;

  console.log('[Goals] Upserting to Supabase for', childId, '— date:', record.date, 'ids:', record.goals, 'mode:', setupMode);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from('daily_goals').upsert(
    {
      child_id: childId,
      date: record.date,
      goal_ids: record.goals,
      setup_mode: setupMode,
      previous_goal_ids: record.previousGoals ?? [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'child_id' }
  );

  if (error) {
    console.warn('[Goals] Upsert error for', childId, '—', error.message);
  } else {
    console.log('[Goals] Upsert succeeded for', childId);
  }
}
