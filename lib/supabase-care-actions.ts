'use client';

import type { Child } from '@/lib/mock-data';
import {
  fetchChildState,
  mergeSupabaseChildState,
} from '@/lib/supabase-child-state';
import {
  getDefaultDailyActionCounts,
  getDefaultLastActionTimestamps,
  getTodayKey,
  mergeWithDefaultChildState,
  normalizePoopEvents,
  readChildDashboardState,
  writeChildDashboardState,
  writeChildSupabaseSyncMeta,
  type CareActionType,
  type ChildDashboardState,
} from '@/lib/mission-state';
import { fetchCareStateForChild, type CareState } from '@/lib/supabase-care-state';
import { getSupabaseBrowserClient, hasSupabaseBrowserEnv } from '@/lib/supabase-browser';

type CareRpcResult = {
  star_reward?: number;
  stars?: number;
  mood_percent?: number;
  mood_updated_at?: string;
  date?: string;
  action_counts?: Record<string, unknown>;
  last_timestamps?: Record<string, unknown>;
  poop_events?: unknown;
  pat_heart_awarded?: boolean;
};

function getNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export async function performCareActionAuthoritatively(
  child: Child,
  action: CareActionType
): Promise<{ childState: ChildDashboardState; careState: CareState; starReward: number }> {
  if (!hasSupabaseBrowserEnv()) {
    throw new Error('Care actions require a Supabase connection.');
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc('perform_care_action_transaction', {
    p_child_id: child.id,
    p_action: action,
  });
  if (error) throw new Error(error.message);

  const result = (data ?? {}) as CareRpcResult;
  const current = mergeWithDefaultChildState(child, readChildDashboardState(child.id));
  const countDefaults = getDefaultDailyActionCounts();
  const timestampDefaults = getDefaultLastActionTimestamps();
  const actionCounts = result.action_counts ?? {};
  const lastTimestamps = result.last_timestamps ?? {};
  const careState: CareState = {
    childId: child.id,
    date: typeof result.date === 'string' ? result.date : current.careResetDate,
    actionCounts: {
      feed: getNumber(actionCounts.feed, countDefaults.feed),
      pat: getNumber(actionCounts.pat, countDefaults.pat),
      clean: getNumber(actionCounts.clean, countDefaults.clean),
    },
    lastTimestamps: {
      feed: getNumber(lastTimestamps.feed, timestampDefaults.feed),
      pat: getNumber(lastTimestamps.pat, timestampDefaults.pat),
      clean: getNumber(lastTimestamps.clean, timestampDefaults.clean),
    },
    poopEvents: normalizePoopEvents(result.poop_events),
    patHeartAwarded: result.pat_heart_awarded === true,
  };
  let childState = {
    ...current,
    stars: getNumber(result.stars, current.stars),
    comfort: getNumber(result.mood_percent, current.comfort),
    moodUpdatedAt:
      typeof result.mood_updated_at === 'string'
        ? result.mood_updated_at
        : current.moodUpdatedAt,
    dailyActionCounts: careState.actionCounts,
    lastActionTimestamps: careState.lastTimestamps,
    poopEvents: careState.poopEvents,
    patHeartAwarded: careState.patHeartAwarded,
    careResetDate: careState.date,
  };
  writeChildDashboardState(child.id, childState);

  // Reload both committed rows. The RPC result provides immediate state, while
  // these rows are the cross-device source of truth and refresh the cache.
  const [remoteChild, remoteCare] = await Promise.all([
    fetchChildState(child),
    fetchCareStateForChild(child.id),
  ]);
  if (remoteChild) {
    childState = mergeSupabaseChildState(childState, remoteChild);
  }
  if (remoteCare) {
    const today = getTodayKey();
    const isCurrentDay = remoteCare.date === today;
    childState = {
      ...childState,
      dailyActionCounts: isCurrentDay
        ? remoteCare.actionCounts
        : getDefaultDailyActionCounts(),
      lastActionTimestamps: isCurrentDay
        ? remoteCare.lastTimestamps
        : getDefaultLastActionTimestamps(),
      poopEvents: remoteCare.poopEvents,
      patHeartAwarded: isCurrentDay ? remoteCare.patHeartAwarded : false,
      careResetDate: today,
    };
  }
  writeChildDashboardState(child.id, childState);

  const authoritativeCareState: CareState = remoteCare
    ? {
        ...remoteCare,
        date: childState.careResetDate,
        actionCounts: childState.dailyActionCounts,
        lastTimestamps: childState.lastActionTimestamps,
        patHeartAwarded: childState.patHeartAwarded,
      }
    : careState;

  const syncedAt = new Date().toISOString();
  writeChildSupabaseSyncMeta(child.id, {
    migratedToSupabase: true,
    lastRemoteUpdatedAt: remoteChild?.updatedAt ?? syncedAt,
    lastLocalWriteAt: syncedAt,
    lastSupabaseWriteAt: syncedAt,
    lastSyncSource: 'supabase',
    lastSyncError: null,
  });

  return {
    childState,
    careState: authoritativeCareState,
    starReward: Number(result.star_reward ?? 0),
  };
}
