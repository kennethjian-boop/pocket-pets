'use client';

import type { Child } from '@/lib/mock-data';
import {
  enrichDailyGoalInstances,
  getCompletedMissionsFromDailyGoals,
  getTodayKey,
  mergeWithDefaultChildState,
  readChildDashboardState,
  readDailyGoalsByChild,
  writeChildDashboardState,
  writeChildSupabaseSyncMeta,
  writeDailyGoalsByChild,
  type ChildDashboardState,
  type DailyGoalsRecord,
} from '@/lib/mission-state';
import { writeBossBattleStateLocal, type BossBattleState } from '@/lib/boss-battle';
import { getSupabaseBrowserClient, hasSupabaseBrowserEnv } from '@/lib/supabase-browser';
import { fetchChildState } from '@/lib/supabase-child-state';
import { mergeSupabaseChildState } from '@/lib/supabase-child-state';
import { fetchDailyGoalsForChild } from '@/lib/supabase-goals';
import { fetchBossState } from '@/lib/supabase-boss';

export interface AuthoritativeGoalVerificationResult {
  childState: ChildDashboardState;
  bossState: BossBattleState;
  changed: boolean;
}

type VerificationRpcResult = {
  changed?: boolean;
};

export async function verifyDailyGoalAuthoritatively(
  child: Child,
  goalId: string,
  completed: boolean
): Promise<AuthoritativeGoalVerificationResult> {
  if (!hasSupabaseBrowserEnv()) {
    throw new Error('Goal verification requires a Supabase connection.');
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc('verify_daily_goal_transaction', {
    p_child_id: child.id,
    p_goal_id: goalId,
    p_completed: completed,
  });

  if (error) {
    throw new Error(error.message);
  }

  const [remoteChild, remoteGoals, remoteBoss] = await Promise.all([
    fetchChildState(child),
    fetchDailyGoalsForChild(child.id, getTodayKey()),
    fetchBossState(),
  ]);

  if (!remoteChild || !remoteGoals || !remoteBoss) {
    throw new Error('Verification committed, but the committed state could not be reloaded.');
  }

  const goalItems = enrichDailyGoalInstances(remoteGoals.goals);
  const completedMissions = getCompletedMissionsFromDailyGoals(goalItems);
  const childState = {
    ...mergeSupabaseChildState(
      mergeWithDefaultChildState(child, readChildDashboardState(child.id)),
      remoteChild
    ),
    completedMissions,
    goalsDate: remoteGoals.date,
  };
  const dailyRecord: DailyGoalsRecord = {
    date: remoteGoals.date,
    source: remoteGoals.setupMode === 'auto' ? 'random' : remoteGoals.setupMode,
    goals: remoteGoals.goalIds,
    goalItems,
    completed: completedMissions,
    previousGoals: remoteGoals.previousGoalIds,
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
  writeDailyGoalsByChild({
    ...readDailyGoalsByChild(),
    [child.id]: dailyRecord,
  });
  writeBossBattleStateLocal(remoteBoss);

  return {
    childState,
    bossState: remoteBoss,
    changed: Boolean((data as VerificationRpcResult | null)?.changed),
  };
}
