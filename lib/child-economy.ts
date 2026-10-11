'use client';

/**
 * The single gateway for balance-changing writes made from the browser.
 *
 * Each operation reads the latest `children` row, applies a pure rule from
 * economy-rules.ts, and writes with an updated_at version check (see
 * optimistic-update.ts). The local cache is refreshed from the committed row.
 * Without Supabase configured (local dev only) the same rules run against the
 * localStorage cache.
 */
import type { Child } from '@/lib/mock-data';
import { hasSupabaseBrowserEnv } from '@/lib/supabase-browser';
import {
  childRowToState,
  fetchChildRow,
  mergeSupabaseChildState,
  updateChildRowIfUnchanged,
  type ChildRowSnapshot,
} from '@/lib/supabase-child-state';
import {
  mergeWithDefaultChildState,
  readChildDashboardState,
  saveChildDashboardState,
  writeChildDashboardState,
  writeChildSupabaseSyncMeta,
  SECRET_EGG_COST,
  SECRET_EGG_REQUIRED_GOALS,
  type ChildDashboardState,
} from '@/lib/mission-state';
import { getSkinById, type SkinId } from '@/lib/pet-skins';
import { runOptimisticUpdate, type PlanResult } from '@/lib/optimistic-update';
import {
  planCurrencyDelta,
  planHeartSpend,
  planScreenEnergyPurchase,
  planSecretEggPurchase,
  planSetScreenEnergy,
  planSkinPurchase,
  type CurrencyDelta,
  type EconomyPatch,
  type EconomyRow,
} from '@/lib/economy-rules';

export type EconomyResult =
  | { ok: true; state: ChildDashboardState }
  | { ok: false; message: string; code?: string; state: ChildDashboardState };

const OFFLINE_MESSAGE = "Couldn't reach Pocket Pets just now. Nothing was spent — please try again.";

function localState(child: Child) {
  return mergeWithDefaultChildState(child, readChildDashboardState(child.id));
}

function rowFromLocal(state: ChildDashboardState): EconomyRow {
  return {
    stars: state.stars,
    hearts: state.hearts,
    screen_energy: state.screenEnergy,
    equipped_pet: state.activePetId,
    owned_pets: state.unlockedPets,
    owned_skins: state.ownedSkins,
    secret_egg_state: state.activeEgg,
  };
}

function localPatchToState(patch: EconomyPatch): Partial<ChildDashboardState> {
  const updates: Partial<ChildDashboardState> = {};
  if (patch.stars !== undefined) updates.stars = patch.stars;
  if (patch.hearts !== undefined) updates.hearts = patch.hearts;
  if (patch.screen_energy !== undefined) updates.screenEnergy = patch.screen_energy;
  if (patch.owned_skins !== undefined) updates.ownedSkins = patch.owned_skins as SkinId[];
  if (patch.secret_egg_state !== undefined) {
    updates.activeEgg = patch.secret_egg_state as ChildDashboardState['activeEgg'];
    updates.eggMessage = null;
  }
  return updates;
}

async function commit(
  child: Child,
  plan: (row: EconomyRow) => PlanResult<EconomyPatch>
): Promise<EconomyResult> {
  if (!hasSupabaseBrowserEnv()) {
    // Local development fallback only: same rules, applied to the cache.
    const current = localState(child);
    const decision = plan(rowFromLocal(current));
    if ('error' in decision) return { ok: false, message: decision.error, code: decision.code, state: current };
    const state = saveChildDashboardState(child.id, child, localPatchToState(decision.patch), {
      allowEggProgressRegression: decision.patch.secret_egg_state !== undefined,
    });
    return { ok: true, state };
  }

  const outcome = await runOptimisticUpdate<ChildRowSnapshot, EconomyPatch>(
    {
      read: () => fetchChildRow(child),
      write: (current, patch) => updateChildRowIfUnchanged(child, current, patch),
    },
    (row) => plan(row as unknown as EconomyRow)
  );

  if (!outcome.ok) {
    if (outcome.reason === 'rejected') {
      // The rule said no based on fresh data — refresh the cache so the UI is truthful.
      return { ok: false, message: outcome.message, code: outcome.code, state: cacheRow(child, outcome.row) };
    }
    return {
      ok: false,
      message: outcome.reason === 'conflict' ? outcome.message : OFFLINE_MESSAGE,
      code: outcome.reason,
      state: localState(child),
    };
  }

  return { ok: true, state: cacheRow(child, outcome.row) };
}

function cacheRow(child: Child, row: ChildRowSnapshot): ChildDashboardState {
  const remote = childRowToState(row, child);
  const next = mergeSupabaseChildState(localState(child), remote);
  writeChildDashboardState(child.id, next);
  const now = new Date().toISOString();
  writeChildSupabaseSyncMeta(child.id, {
    migratedToSupabase: true,
    lastRemoteUpdatedAt: remote.updatedAt,
    lastLocalWriteAt: now,
    lastSupabaseWriteAt: now,
    lastSyncSource: 'supabase-write',
    lastSyncError: null,
  });
  return next;
}

// ─── Child-side purchases ─────────────────────────────────────────────────────

export function buyScreenEnergy(child: Child, cost: number, amount: number) {
  return commit(child, (row) => planScreenEnergyPurchase(row, cost, amount));
}

export function buySkin(child: Child, skinId: SkinId) {
  const skin = getSkinById(skinId);
  if (!skin) return Promise.resolve<EconomyResult>({ ok: false, message: 'Unknown look.', state: localState(child) });
  return commit(child, (row) => planSkinPurchase(row, skin));
}

export function buySecretEgg(child: Child) {
  const eggId = `secret-egg-${Date.now()}`;
  return commit(child, (row) =>
    planSecretEggPurchase(row, { cost: SECRET_EGG_COST, requiredGoals: SECRET_EGG_REQUIRED_GOALS, eggId })
  );
}

export function spendHearts(child: Child, amount: number) {
  return commit(child, (row) => planHeartSpend(row, amount));
}

/** Pet Catch round reward — existing behaviour, see lib/pet-catch-rules.ts. */
export function awardGameStars(child: Child, stars: number) {
  return commit(child, (row) => planCurrencyDelta(row, { stars }));
}

// ─── Parent-side adjustments ─────────────────────────────────────────────────

export function adjustCurrencies(child: Child, delta: CurrencyDelta) {
  return commit(child, (row) => planCurrencyDelta(row, delta));
}

export function setScreenEnergy(child: Child, value: number) {
  return commit(child, (row) => planSetScreenEnergy(row, value));
}
