/**
 * Pure economy rules evaluated against a FRESH `children` row.
 *
 * These encode the existing shop / Pet Catch / parent-adjustment behaviour
 * unchanged; they only move the checks from the (possibly stale) local cache to
 * the latest saved row, so balances cannot be overwritten across devices.
 * No reward amounts, prices or pathways are changed here.
 */
import type { PlanResult } from './optimistic-update.ts';

export const ALL_PET_IDS = ['bubbo', 'luna', 'mochi', 'ember'] as const;
export type EconomyPetId = (typeof ALL_PET_IDS)[number];

export interface EconomyRow {
  stars: number;
  hearts: number;
  screen_energy: number;
  equipped_pet: string;
  owned_pets: unknown;
  owned_skins: unknown;
  secret_egg_state: unknown;
}

export type EconomyPatch = Partial<
  Pick<EconomyRow, 'stars' | 'hearts' | 'screen_energy' | 'owned_skins' | 'secret_egg_state'>
>;

export type CurrencyDelta = { stars?: number; hearts?: number; screenEnergy?: number };

const n = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);

export function ownedPetsOf(row: EconomyRow): string[] {
  const list = Array.isArray(row.owned_pets) ? row.owned_pets.filter((p): p is string => typeof p === 'string') : [];
  // The equipped pet is always owned (mirrors normalizeOwnedPets).
  return Array.from(new Set([row.equipped_pet, ...list].filter(Boolean)));
}

export function ownedSkinsOf(row: EconomyRow): string[] {
  return Array.isArray(row.owned_skins) ? row.owned_skins.filter((s): s is string => typeof s === 'string') : [];
}

export function hasActiveEgg(row: EconomyRow) {
  const egg = row.secret_egg_state as { type?: unknown; hatched?: unknown } | null;
  return Boolean(egg && typeof egg === 'object' && egg.type === 'secret-egg' && egg.hatched !== true);
}

export function planScreenEnergyPurchase(row: EconomyRow, cost: number, amount: number): PlanResult<EconomyPatch> {
  if (n(row.stars) < cost) return { error: 'Not enough stars yet!', code: 'insufficient' };
  return { patch: { stars: n(row.stars) - cost, screen_energy: n(row.screen_energy) + amount } };
}

export function planSkinPurchase(
  row: EconomyRow,
  skin: { id: string; petType: string; cost: number; name: string }
): PlanResult<EconomyPatch> {
  const owned = ownedSkinsOf(row);
  if (owned.includes(skin.id)) return { error: 'You already own this look!', code: 'owned' };
  if (!ownedPetsOf(row).includes(skin.petType)) return { error: 'Unlock this pet first!', code: 'locked' };
  if (n(row.stars) < skin.cost) return { error: 'Not enough stars yet!', code: 'insufficient' };
  return { patch: { stars: n(row.stars) - skin.cost, owned_skins: [...owned, skin.id] } };
}

export function planSecretEggPurchase(
  row: EconomyRow,
  options: { cost: number; requiredGoals: number; eggId: string }
): PlanResult<EconomyPatch> {
  if (hasActiveEgg(row)) return { error: 'You already have a Secret Egg hatching!', code: 'active-egg' };
  const owned = ownedPetsOf(row);
  if (ALL_PET_IDS.every((pet) => owned.includes(pet))) return { error: 'You have unlocked all pets!', code: 'all-pets' };
  if (n(row.stars) < options.cost) return { error: 'Not enough stars for a Secret Egg.', code: 'insufficient' };
  return {
    patch: {
      stars: n(row.stars) - options.cost,
      secret_egg_state: {
        id: options.eggId,
        type: 'secret-egg',
        progress: 0,
        requiredGoals: options.requiredGoals,
        contributedGoalIds: [],
        hatched: false,
        unlockedPetId: null,
      },
    },
  };
}

export function planHeartSpend(row: EconomyRow, amount: number): PlanResult<EconomyPatch> {
  if (n(row.hearts) < amount) return { error: `You need ${amount} hearts to play.`, code: 'insufficient' };
  return { patch: { hearts: n(row.hearts) - amount } };
}

/** Parent adjustments and rewards: apply deltas, never going below zero (existing behaviour). */
export function planCurrencyDelta(row: EconomyRow, delta: CurrencyDelta): PlanResult<EconomyPatch> {
  const patch: EconomyPatch = {};
  if (delta.stars) patch.stars = Math.max(0, n(row.stars) + Math.trunc(delta.stars));
  if (delta.hearts) patch.hearts = Math.max(0, n(row.hearts) + Math.trunc(delta.hearts));
  if (delta.screenEnergy) patch.screen_energy = Math.max(0, n(row.screen_energy) + Math.trunc(delta.screenEnergy));
  if (Object.keys(patch).length === 0) return { error: 'Nothing to change.', code: 'noop' };
  return { patch };
}

export function planSetScreenEnergy(_row: EconomyRow, value: number): PlanResult<EconomyPatch> {
  return { patch: { screen_energy: Math.max(0, Math.floor(value)) } };
}
