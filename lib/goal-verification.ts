import type { Child } from '@/lib/mock-data';
import {
  getTodayKey,
  mergeWithDefaultChildState,
  readChildDashboardState,
  saveChildDashboardState,
  setMissionCompletion,
  updateSecretEggProgressForGoal,
  type ChildDashboardState,
  type DailyMission,
} from '@/lib/mission-state';
import {
  addBossAttack,
  getMissionAttackSourceId,
  readBossBattleState,
  removeBossAttackBySourceId,
  writeBossBattleState,
  type BossBattleState,
} from '@/lib/boss-battle';

export interface GoalVerificationResult {
  childState: ChildDashboardState;
  bossState: BossBattleState;
}

function getEggContributionId(child: Child, sourceId: string, completed: boolean) {
  const datedSourceId = `${sourceId}:${getTodayKey()}`;
  if (completed) return datedSourceId;

  const activeEgg = mergeWithDefaultChildState(
    child,
    readChildDashboardState(child.id)
  ).activeEgg;
  return activeEgg?.contributedGoalIds.includes(sourceId) &&
    !activeEgg.contributedGoalIds.includes(datedSourceId)
    ? sourceId
    : datedSourceId;
}

/**
 * Applies every parent-verification effect as one shared transaction.
 * Responsive UIs must call this function rather than updating checkbox state directly.
 */
export function verifyDailyGoal(
  child: Child,
  mission: DailyMission,
  completed: boolean
): GoalVerificationResult {
  const sourceId = getMissionAttackSourceId(child.id, mission.id);

  setMissionCompletion(child.id, child, mission, completed, {
    mirrorToSupabase: false,
  });
  const eggState = updateSecretEggProgressForGoal(
    child.id,
    child,
    getEggContributionId(child, sourceId, completed),
    completed
  );

  const currentBossState = readBossBattleState();
  const bossState = completed
    ? addBossAttack(currentBossState, {
        childId: child.id,
        childName: child.name,
        sourceType: 'mission',
        sourceId,
        title: mission.title,
        damage: mission.bossDamage ?? 10,
      })
    : removeBossAttackBySourceId(currentBossState, sourceId);
  writeBossBattleState(bossState);

  // Always perform the final child-state save/sync, including when no egg is active.
  const childState = saveChildDashboardState(child.id, child, eggState);
  return { childState, bossState };
}
