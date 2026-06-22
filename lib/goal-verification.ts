import type { Child } from '@/lib/mock-data';
import type { ChildDashboardState } from '@/lib/mission-state';
import type { BossBattleState } from '@/lib/boss-battle';
import { verifyDailyGoalAuthoritatively } from '@/lib/supabase-goal-verification';

export interface GoalVerificationResult {
  childState: ChildDashboardState;
  bossState: BossBattleState;
  changed: boolean;
}

/**
 * The only goal-verification progression gateway. All rewards and progression
 * are committed by the Supabase transaction before local caches are updated.
 */
export function verifyDailyGoal(
  child: Child,
  goalId: string,
  completed: boolean
): Promise<GoalVerificationResult> {
  return verifyDailyGoalAuthoritatively(child, goalId, completed);
}
