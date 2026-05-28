'use client';

import { getSupabaseBrowserClient, hasSupabaseBrowserEnv } from '@/lib/supabase-browser';
import type { DailyGoalInstance, DailyGoalsRecord, GoalSetupMode } from '@/lib/mission-state';

export type DailyGoalsWriteReason =
  | 'randomise_click'
  | 'manual_save'
  | 'verification_update';

type DailyGoalsRow = {
  id?: string | null;
  child_id: string;
  date: string;
  goals?: unknown[] | null;
  goal_ids: unknown[] | null;
  setup_mode: string;
  previous_goal_ids: unknown[] | null;
  updated_at: string;
};

export type SupabaseDailyGoalState = {
  id: string | null;
  childId: string;
  date: string;
  goals: DailyGoalInstance[];
  goalIds: string[];
  setupMode: GoalSetupMode;
  previousGoalIds: string[];
  updatedAt: string;
};

export type FetchDailyGoalsResult = {
  state: SupabaseDailyGoalState | null;
  errorMessage: string | null;
};

const VALID_SETUP_MODES = new Set<GoalSetupMode>(['auto', 'manual', 'random']);
const SELECT_WITH_ID = 'id, child_id, date, goals, goal_ids, setup_mode, previous_goal_ids, updated_at';
const SELECT = 'child_id, date, goal_ids, setup_mode, previous_goal_ids, updated_at';

function isMissingConflictConstraintError(message: string) {
  return /no unique|no exclusion|on conflict/i.test(message);
}

function normalizeGoalItem(item: unknown): DailyGoalInstance | null {
  if (!item || typeof item !== 'object') return null;
  const goal = item as Partial<DailyGoalInstance>;
  if (typeof goal.id !== 'string') return null;
  return {
    id: goal.id,
    title: typeof goal.title === 'string' ? goal.title : goal.id,
    description: typeof goal.description === 'string' ? goal.description : '',
    category: goal.category,
    reward: typeof goal.reward === 'number' ? goal.reward : goal.starReward ?? 0,
    starReward: typeof goal.starReward === 'number' ? goal.starReward : goal.reward ?? 0,
    bossDamage: typeof goal.bossDamage === 'number' ? goal.bossDamage : 10,
    completed: goal.completed === true,
  };
}

function toSupabaseDailyGoalState(row: DailyGoalsRow): SupabaseDailyGoalState {
  const goals = Array.isArray(row.goals)
    ? row.goals.map(normalizeGoalItem).filter((goal): goal is DailyGoalInstance => Boolean(goal))
    : [];
  const goalIds = goals.length > 0
    ? goals.map((goal) => goal.id)
    : Array.isArray(row.goal_ids)
      ? row.goal_ids.filter((id): id is string => typeof id === 'string')
      : [];

  return {
    id: row.id ?? null,
    childId: row.child_id,
    date: row.date,
    goals,
    goalIds,
    setupMode: VALID_SETUP_MODES.has(row.setup_mode as GoalSetupMode)
      ? (row.setup_mode as GoalSetupMode)
      : 'auto',
    previousGoalIds: Array.isArray(row.previous_goal_ids)
      ? row.previous_goal_ids.filter((id): id is string => typeof id === 'string')
      : [],
    updatedAt: row.updated_at,
  };
}

export async function fetchDailyGoalsForChildResult(
  childId: string,
  date: string
): Promise<FetchDailyGoalsResult> {
  if (!hasSupabaseBrowserEnv()) {
    console.log('[Goals] Supabase env not available - using localStorage for', childId);
    return { state: null, errorMessage: 'Supabase browser env not available.' };
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

  if (error && /id|goals/i.test(error.message)) {
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
    return { state: null, errorMessage: error.message };
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
  return { state: result, errorMessage: null };
}

export async function fetchDailyGoalsForChild(
  childId: string,
  date: string
): Promise<SupabaseDailyGoalState | null> {
  const result = await fetchDailyGoalsForChildResult(childId, date);
  return result.state;
}

export async function upsertDailyGoalsForChild(
  childId: string,
  record: DailyGoalsRecord,
  setupMode: GoalSetupMode,
  reason: DailyGoalsWriteReason
): Promise<SupabaseDailyGoalState | null> {
  if (!hasSupabaseBrowserEnv()) return null;

  const goalTitles = (record.goalItems ?? []).map((goal) => goal.title);
  console.info('[Goals] WRITE', {
    reason,
    child_id: childId,
    date: record.date,
    goal_titles: goalTitles,
    automatic: false,
  });

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
  const goals = record.goalItems ?? [];
  const payload = {
    child_id: childId,
    date: record.date,
    goals,
    goal_ids: record.goals,
    setup_mode: setupMode,
    previous_goal_ids: record.previousGoals ?? [],
    updated_at: new Date().toISOString(),
  };
  console.info('[Goals] WRITE payload', payload);

  let { data, error } = await supabase
    .from('daily_goals')
    .upsert(payload, { onConflict: 'child_id,date' })
    .select(SELECT_WITH_ID)
    .single<DailyGoalsRow>();

  if (error && isMissingConflictConstraintError(error.message)) {
    console.warn('[Goals] Upsert conflict target unavailable; falling back to select/update/insert.', error.message);
    const existing = await supabase
      .from('daily_goals')
      .select(SELECT_WITH_ID)
      .eq('child_id', childId)
      .eq('date', record.date)
      .order('updated_at', { ascending: false })
      .limit(1)
      .returns<DailyGoalsRow[]>();

    if (existing.error) {
      error = existing.error;
    } else if (existing.data?.[0]?.id) {
      const update = await supabase
        .from('daily_goals')
        .update(payload)
        .eq('id', existing.data[0].id)
        .select(SELECT_WITH_ID)
        .single<DailyGoalsRow>();
      data = update.data;
      error = update.error;
    } else {
      const insert = await supabase
        .from('daily_goals')
        .insert(payload)
        .select(SELECT_WITH_ID)
        .single<DailyGoalsRow>();
      data = insert.data;
      error = insert.error;
    }
  }

  if (error) {
    console.error('[Goals] WRITE failed', {
      reason,
      child_id: childId,
      date: record.date,
      payload,
      error,
    });
    return null;
  }

  console.info('[Goals] WRITE saved result', {
    reason,
    child_id: childId,
    date: record.date,
    row_id: data?.id ?? null,
    updated_at: data?.updated_at ?? null,
    goals_length: Array.isArray(data?.goals) ? data.goals.length : 0,
    goal_ids: Array.isArray(data?.goal_ids) ? data.goal_ids : [],
  });
  return data ? toSupabaseDailyGoalState(data) : null;
}
