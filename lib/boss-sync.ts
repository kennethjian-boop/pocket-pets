'use client';

/**
 * Parent-only Family Boss mutations, applied to the latest saved boss row.
 *
 * Previously these rebuilt the whole boss from the parent's local cache and
 * upserted it, which could erase attacks recorded by goal verification on
 * another device, and two devices could both claim victory rewards. Now each
 * mutation is version-checked, and the victory claim is idempotent: rewards are
 * only granted by the device that successfully flips reward_claimed.
 */
import type { Child } from '@/lib/mock-data';
import { hasSupabaseBrowserEnv } from '@/lib/supabase-browser';
import {
  addBossAttack,
  getBossRewardForChild,
  getNextBoss,
  createDefaultBossBattleState,
  readBossBattleState,
  setSharedBossReward,
  writeBossBattleState,
  writeBossBattleStateLocal,
  type BossBattleState,
  type BossRewardConfig,
} from '@/lib/boss-battle';
import {
  bossRowToState,
  bossStateToRowPatch,
  fetchBossRow,
  fetchBossState,
  updateBossRowIfUnchanged,
  upsertBossState,
  type BossRowSnapshot,
} from '@/lib/supabase-boss';
import { runOptimisticUpdate, type PlanResult } from '@/lib/optimistic-update';
import { adjustCurrencies } from '@/lib/child-economy';
import type { ChildDashboardState } from '@/lib/mission-state';

export type BossResult =
  | { ok: true; state: BossBattleState }
  | { ok: false; message: string; state: BossBattleState };

type BossPlan = (state: BossBattleState) => PlanResult<BossBattleState>;

async function readOrSeedBossRow() {
  const row = await fetchBossRow();
  if (row) return row;
  // First run on an empty project: seed the active boss, as the old upsert path did.
  await upsertBossState(createDefaultBossBattleState());
  return fetchBossRow();
}

async function mutateBoss(plan: BossPlan): Promise<BossResult> {
  if (!hasSupabaseBrowserEnv()) {
    const current = readBossBattleState();
    const decision = plan(current);
    if ('error' in decision) return { ok: false, message: decision.error, state: current };
    writeBossBattleState(decision.patch);
    return { ok: true, state: readBossBattleState() };
  }

  const outcome = await runOptimisticUpdate<BossRowSnapshot, BossBattleState>(
    {
      read: readOrSeedBossRow,
      write: (current, next) => updateBossRowIfUnchanged(current, bossStateToRowPatch(next)),
    },
    (row) => plan(bossRowToState(row))
  );

  if (outcome.ok) {
    const state = bossRowToState(outcome.row);
    writeBossBattleStateLocal(state);
    return { ok: true, state };
  }
  if (outcome.reason === 'rejected') {
    const state = bossRowToState(outcome.row);
    writeBossBattleStateLocal(state);
    return { ok: false, message: outcome.message, state };
  }
  return {
    ok: false,
    message:
      outcome.reason === 'conflict'
        ? outcome.message
        : "Couldn't reach Pocket Pets. Nothing was changed — please try again.",
    state: readBossBattleState(),
  };
}

/** Latest boss for display (falls back to the local cache when offline). */
export async function loadBossState(): Promise<BossBattleState> {
  const remote = await fetchBossState();
  if (remote) {
    writeBossBattleStateLocal(remote);
    return remote;
  }
  return readBossBattleState();
}

export function launchBonusAttack(child: Child, title: string, damage: number) {
  return mutateBoss((state) => {
    if (state.isDefeated) return { error: 'This boss is already defeated.' };
    return {
      patch: addBossAttack(state, {
        childId: child.id,
        childName: child.name,
        sourceType: 'parent_bonus',
        title,
        damage,
      }),
    };
  });
}

export function updateVictoryReward(reward: BossRewardConfig) {
  return mutateBoss((state) => {
    if (state.rewardClaimed) return { error: 'Rewards are locked after claiming. Start the next boss to edit again.' };
    return { patch: setSharedBossReward(state, reward) };
  });
}

export function startNextBoss() {
  return mutateBoss((state) => {
    if (!state.isDefeated) return { error: 'Defeat this boss first.' };
    if (!state.rewardClaimed) return { error: 'Claim the victory rewards before starting the next boss.' };
    return { patch: createDefaultBossBattleState(getNextBoss(state.bossId)) };
  });
}

export type ClaimResult = BossResult & {
  childStates: Record<string, ChildDashboardState>;
  failedChildren: string[];
};

/**
 * Flip reward_claimed first (only one device can win), then grant each child's
 * reward with a version-checked currency delta.
 */
export async function claimVictoryRewards(children: Child[]): Promise<ClaimResult> {
  const flip = await mutateBoss((state) => {
    if (!state.isDefeated) return { error: 'The boss is not defeated yet.' };
    if (state.rewardClaimed) return { error: 'Victory rewards were already claimed.' };
    return { patch: { ...state, rewardClaimed: true } };
  });
  if (!flip.ok) return { ...flip, childStates: {}, failedChildren: [] };

  const childStates: Record<string, ChildDashboardState> = {};
  const failedChildren: string[] = [];
  for (const child of children) {
    const reward = getBossRewardForChild(flip.state, child.id);
    const result = await adjustCurrencies(child, {
      stars: reward.stars,
      hearts: reward.hearts,
      screenEnergy: reward.screenEnergy,
    });
    childStates[child.id] = result.state;
    if (!result.ok && result.code !== 'noop') failedChildren.push(child.name);
  }
  return { ...flip, childStates, failedChildren };
}
