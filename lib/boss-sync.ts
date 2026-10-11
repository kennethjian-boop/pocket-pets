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
import { getSupabaseBrowserClient, hasSupabaseBrowserEnv } from '@/lib/supabase-browser';
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
import { adjustCurrencies, refreshChildFromServer } from '@/lib/child-economy';
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
  /** True when the server reports the prizes had already been delivered (retry/second device). */
  alreadyClaimed: boolean;
};

const CLAIM_MIGRATION_MESSAGE =
  'Prize claiming needs the October database update (migration 202610110001). Nothing was changed.';

/**
 * Atomic, idempotent claim via the claim_boss_victory_rewards() database function:
 * the claimed flag and every child's prize commit together or not at all, and
 * repeats return already_claimed without paying again. There is deliberately no
 * client-side fallback when Supabase is configured, because a multi-row payout
 * cannot be made atomic from the browser.
 */
export async function claimVictoryRewards(children: Child[]): Promise<ClaimResult> {
  if (!hasSupabaseBrowserEnv()) {
    // Local development without Supabase: same rules against the local cache.
    const state = readBossBattleState();
    if (!state.isDefeated) return { ok: false, message: 'The boss is not defeated yet.', state, childStates: {}, alreadyClaimed: false };
    if (state.rewardClaimed) return { ok: false, message: 'Victory prizes were already delivered.', state, childStates: {}, alreadyClaimed: true };
    const childStates: Record<string, ChildDashboardState> = {};
    for (const child of children) {
      const reward = getBossRewardForChild(state, child.id);
      childStates[child.id] = (await adjustCurrencies(child, { stars: reward.stars, hearts: reward.hearts, screenEnergy: reward.screenEnergy })).state;
    }
    writeBossBattleState({ ...state, rewardClaimed: true });
    return { ok: true, state: readBossBattleState(), childStates, alreadyClaimed: false };
  }

  const { data, error } = await getSupabaseBrowserClient().rpc('claim_boss_victory_rewards');
  const state = await loadBossState();
  const childStates: Record<string, ChildDashboardState> = {};
  for (const child of children) childStates[child.id] = await refreshChildFromServer(child);

  if (error) {
    const missing = error.code === 'PGRST202' || /could not find the function/i.test(error.message);
    return {
      ok: false,
      message: missing ? CLAIM_MIGRATION_MESSAGE : /not defeated/i.test(error.message) ? 'The boss is not defeated yet.' : `Couldn't give prizes: ${error.message}`,
      state,
      childStates,
      alreadyClaimed: false,
    };
  }
  const result = (data ?? {}) as { changed?: boolean; already_claimed?: boolean };
  if (result.already_claimed) {
    return { ok: false, message: 'Victory prizes were already delivered.', state, childStates, alreadyClaimed: true };
  }
  return { ok: true, state, childStates, alreadyClaimed: false };
}
