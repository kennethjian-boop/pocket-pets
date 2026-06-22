'use client';

import type { Child } from '@/lib/mock-data';
import {
  mergeSupabaseChildState,
  fetchChildState,
} from '@/lib/supabase-child-state';
import {
  mergeWithDefaultChildState,
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
};

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

  const [remoteChild, careState] = await Promise.all([
    fetchChildState(child),
    fetchCareStateForChild(child.id),
  ]);
  if (!remoteChild || !careState) {
    throw new Error('Care action committed, but its state could not be reloaded.');
  }

  const childState = {
    ...mergeSupabaseChildState(
      mergeWithDefaultChildState(child, readChildDashboardState(child.id)),
      remoteChild
    ),
    dailyActionCounts: careState.actionCounts,
    lastActionTimestamps: careState.lastTimestamps,
    poopEvents: careState.poopEvents,
    patHeartAwarded: careState.patHeartAwarded,
    careResetDate: careState.date,
  };
  writeChildDashboardState(child.id, childState);
  const syncedAt = new Date().toISOString();
  writeChildSupabaseSyncMeta(child.id, {
    migratedToSupabase: true,
    lastRemoteUpdatedAt: remoteChild.updatedAt,
    lastLocalWriteAt: syncedAt,
    lastSupabaseWriteAt: syncedAt,
    lastSyncSource: 'supabase',
    lastSyncError: null,
  });

  return {
    childState,
    careState,
    starReward: Number((data as CareRpcResult | null)?.star_reward ?? 0),
  };
}

