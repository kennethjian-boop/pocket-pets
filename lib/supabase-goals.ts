'use client';

import { getSupabaseBrowserClient, hasSupabaseBrowserEnv } from '@/lib/supabase-browser';
import type { DailyGoalsRecord, GoalSetupMode } from '@/lib/mission-state';

type DailyGoalsRow = {
  id?: string | null;
  child_id: string;
  date: string;
  goal_ids: unknown[] | null;
  setup_mode: string;
  previous_goal_ids: unknown[] | null;
  updated_at: string;
};

export type SupabaseDailyGoalState = {
  id: string | null;
  childId: string;
  date: string;
  goalIds: string[];
  setupMode: GoalSetupMode;
  previousGoalIds: string[];
  updatedAt: string;
};

const VALID_SETUP_MODES = new Set<GoalSetupMode>(['auto', 'manual', 'random']);
const SELECT_WITH_ID = 'id, child_id, date, goal_ids, setup_mode, previous_goal_ids, updated_at';
const SELECT = 'child_id, date, goal_ids, setup_mode, previous_goal_ids, updated_at';

function toSupabaseDailyGoalState(row: DailyGoalsRow): SupabaseDailyGoalState {
  return {
    id: row.id ?? null,
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

export async function fetchDailyGoalsForChild(
  childId: string,
  date: string
): Promise<SupabaseDailyGoalState | null> {
  if (!hasSupabaseBrowserEnv()) {
    console.log('[Goals] Supabase env not available - using localStorage for', childId);
    return null;
  }

  const supabase = getSupabaseBrowserClient();
  console.log('[Goals] Fetching from Supabase for child_id/date:', childId, date);

  let { data, error } = await supabase
    .from('daily_goals')
    .select(SELECT_WITH_ID)
    .eq('child_id', childId)
    .eq('date', date)
    .order('updated_at', { ascending: false })
    .limit(1)
    .returns<DailyGoalsRow[]>();

  if (error && error.message.toLowerCase().includes('id')) {
    const retry = await supabase
      .from('daily_goals')
      .select(SELECT)
      .eq('child_id', childId)
      .eq('date', date)
      .order('updated_at', { ascending: false })
      .limit(1)
      .returns<DailyGoalsRow[]>();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.warn('[Goals] Fetch error for', childId, '-', error.message);
    return null;
  }

  const result = data?.[0] ? toSupabaseDailyGoalState(data[0]) : null;
  if (result) {
    console.log(
      '[Goals] Row found for',
      childId,
      '- id:',
      result.id ?? 'none',
      'date:',
      result.date,
      'ids:',
      result.goalIds,
      'mode:',
      result.setupMode
    );
  } else {
    console.log('[Goals] No row in Supabase for', childId, date);
  }
  return result;
}

export async function upsertDailyGoalsForChild(
  childId: string,
  record: DailyGoalsRecord,
  setupMode: GoalSetupMode
): Promise<SupabaseDailyGoalState | null> {
  if (!hasSupabaseBrowserEnv()) return null;

  console.log(
    '[Goals] Upserting to Supabase for',
    childId,
    '- date:',
    record.date,
    'ids:',
    record.goals,
    'mode:',
    setupMode
  );

  const supabase = getSupabaseBrowserClient();
  let { data, error } = await supabase
    .from('daily_goals')
    .upsert(
      {
        child_id: childId,
        date: record.date,
        goal_ids: record.goals,
        setup_mode: setupMode,
        previous_goal_ids: record.previousGoals ?? [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'child_id,date' }
    )
    .select(SELECT_WITH_ID)
    .single<DailyGoalsRow>();

  if (error && error.message.toLowerCase().includes('id')) {
    const retry = await supabase
      .from('daily_goals')
      .upsert(
        {
          child_id: childId,
          date: record.date,
          goal_ids: record.goals,
          setup_mode: setupMode,
          previous_goal_ids: record.previousGoals ?? [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'child_id,date' }
      )
      .select(SELECT)
      .single<DailyGoalsRow>();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.warn('[Goals] Upsert error for', childId, '-', error.message);
    return null;
  }

  console.log('[Goals] Upsert succeeded for', childId);
  return data ? toSupabaseDailyGoalState(data) : null;
}
