'use client';

import { getSupabaseBrowserClient, hasSupabaseBrowserEnv } from '@/lib/supabase-browser';
import {
  getDefaultDailyActionCounts,
  getDefaultLastActionTimestamps,
  type DailyActionCounts,
  type LastActionTimestamps,
} from '@/lib/mission-state';

// ─── Public types ────────────────────────────────────────────────────────────

export type CareState = {
  childId: string;
  date: string;
  actionCounts: DailyActionCounts;
  lastTimestamps: LastActionTimestamps;
  patHeartAwarded: boolean;
};

// ─── DB row shape ────────────────────────────────────────────────────────────

type CareStateRow = {
  child_id: string;
  date: string;
  action_counts: Record<string, unknown> | null;
  last_timestamps: Record<string, unknown> | null;
  pat_heart_awarded: boolean;
  updated_at: string;
};

// ─── Normalizers ─────────────────────────────────────────────────────────────

function normalizeActionCounts(value: unknown): DailyActionCounts {
  const defaults = getDefaultDailyActionCounts();
  if (!value || typeof value !== 'object') return defaults;
  const obj = value as Record<string, unknown>;
  return {
    feed: typeof obj.feed === 'number' ? Math.max(0, Math.floor(obj.feed)) : defaults.feed,
    pat: typeof obj.pat === 'number' ? Math.max(0, Math.floor(obj.pat)) : defaults.pat,
    clean: typeof obj.clean === 'number' ? Math.max(0, Math.floor(obj.clean)) : defaults.clean,
  };
}

function normalizeLastTimestamps(value: unknown): LastActionTimestamps {
  const defaults = getDefaultLastActionTimestamps();
  if (!value || typeof value !== 'object') return defaults;
  const obj = value as Record<string, unknown>;
  return {
    feed: typeof obj.feed === 'number' ? Math.max(0, obj.feed) : defaults.feed,
    pat: typeof obj.pat === 'number' ? Math.max(0, obj.pat) : defaults.pat,
    clean: typeof obj.clean === 'number' ? Math.max(0, obj.clean) : defaults.clean,
  };
}

function toCareState(row: CareStateRow): CareState {
  return {
    childId: row.child_id,
    date: row.date,
    actionCounts: normalizeActionCounts(row.action_counts),
    lastTimestamps: normalizeLastTimestamps(row.last_timestamps),
    patHeartAwarded: row.pat_heart_awarded === true,
  };
}

const SELECT = 'child_id, date, action_counts, last_timestamps, pat_heart_awarded, updated_at';

// ─── Fetch ───────────────────────────────────────────────────────────────────

export async function fetchCareStateForChild(childId: string): Promise<CareState | null> {
  if (!hasSupabaseBrowserEnv()) return null;

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('care_action_state')
    .select(SELECT)
    .eq('child_id', childId)
    .maybeSingle<CareStateRow>();

  if (error) {
    console.warn('[CareState] Fetch error for', childId, ':', error.message);
    return null;
  }

  return data ? toCareState(data) : null;
}

// ─── Upsert (fire-and-forget) ─────────────────────────────────────────────────

export async function upsertCareStateForChild(
  childId: string,
  state: Omit<CareState, 'childId'>
): Promise<void> {
  if (!hasSupabaseBrowserEnv()) return;

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('care_action_state')
    .upsert(
      {
        child_id: childId,
        date: state.date,
        action_counts: state.actionCounts,
        last_timestamps: state.lastTimestamps,
        pat_heart_awarded: state.patHeartAwarded,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'child_id' }
    );

  if (error) {
    console.warn('[CareState] Upsert error for', childId, ':', error.message);
  }
}
