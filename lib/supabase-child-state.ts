'use client';

import { getSupabaseBrowserClient, hasSupabaseBrowserEnv } from '@/lib/supabase-browser';
import { getPetByChildId, type Child, type PetRosterItem } from '@/lib/mock-data';
import {
  VALID_SKIN_IDS,
  type PetType,
  type SkinId,
} from '@/lib/pet-skins';
import { normalizeScreenEnergy } from '@/lib/screen-energy';
import type { ChildDashboardState, SecretEggState } from '@/lib/mission-state';
import { INITIAL_MOOD_PERCENT, clampMoodPercent } from '@/lib/pet-mood';

// ─── Public types ────────────────────────────────────────────────────────────

export type SupabaseChildState = {
  childId: string;
  displayName: string;
  stars: number;
  hearts: number;
  screenEnergy: number;
  equippedPet: PetRosterItem['id'];
  equippedSkinByPet: Record<PetType, SkinId | null>;
  // Phase 2
  ownedPets: PetRosterItem['id'][];
  ownedSkins: SkinId[];
  secretEggState: SecretEggState | null;
  // Phase 3 — verification state
  completedMissions: Record<string, boolean>;
  moodPercent: number;
  moodUpdatedAt: string;
  updatedAt: string;
};

// ─── DB row shape ────────────────────────────────────────────────────────────

type ChildrenRow = {
  child_id: string;
  display_name: string;
  stars: number;
  hearts: number;
  screen_energy: number;
  equipped_pet: string;
  equipped_skin_by_pet: Record<string, unknown> | null;
  // Phase 2
  owned_pets: unknown[] | null;
  owned_skins: unknown[] | null;
  secret_egg_state: Record<string, unknown> | null;
  // Phase 3
  completed_missions: Record<string, unknown> | null;
  mood_percent: number | null;
  mood_updated_at: string | null;
  updated_at: string;
};

type CurrencyUpdate = Partial<
  Pick<SupabaseChildState, 'stars' | 'hearts' | 'screenEnergy'>
>;

export type ChildDashboardUpsertOptions = {
  includeEggPurchase?: boolean;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const VALID_PETS = new Set<PetRosterItem['id']>(['luna', 'bubbo', 'mochi', 'ember']);

// Single source of truth for the SELECT column list — update here to add columns.
const SELECT_COLUMNS =
  'child_id, display_name, stars, hearts, screen_energy, equipped_pet, equipped_skin_by_pet, owned_pets, owned_skins, secret_egg_state, completed_missions, mood_percent, mood_updated_at, updated_at';

// ─── Normalizers ─────────────────────────────────────────────────────────────

function normalizePet(value: unknown, fallback: PetRosterItem['id']): PetRosterItem['id'] {
  return typeof value === 'string' && VALID_PETS.has(value as PetRosterItem['id'])
    ? (value as PetRosterItem['id'])
    : fallback;
}

function normalizeActiveSkins(value: unknown): Record<PetType, SkinId | null> {
  const result: Record<PetType, SkinId | null> = {
    luna: null,
    bubbo: null,
    mochi: null,
    ember: null,
  };
  if (!value || typeof value !== 'object') return result;
  for (const petType of Object.keys(result) as PetType[]) {
    const skinId = (value as Record<string, unknown>)[petType];
    if (typeof skinId === 'string' && VALID_SKIN_IDS.has(skinId)) {
      result[petType] = skinId as SkinId;
    }
  }
  return result;
}

function normalizeOwnedPets(
  value: unknown,
  fallbackPet: PetRosterItem['id']
): PetRosterItem['id'][] {
  if (!Array.isArray(value)) return [fallbackPet];
  const valid = value.filter(
    (pet): pet is PetRosterItem['id'] =>
      typeof pet === 'string' && VALID_PETS.has(pet as PetRosterItem['id'])
  );
  return Array.from(new Set([fallbackPet, ...valid]));
}

function normalizeOwnedSkinsArray(value: unknown): SkinId[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.filter(
        (item): item is SkinId =>
          typeof item === 'string' && VALID_SKIN_IDS.has(item)
      )
    )
  );
}

function normalizeCompletedMissions(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== 'object') return {};
  const result: Record<string, boolean> = {};
  for (const [missionId, done] of Object.entries(value as Record<string, unknown>)) {
    if (done === true) result[missionId] = true;
  }
  return result;
}

function normalizeSecretEggState(value: unknown): SecretEggState | null {
  if (!value || typeof value !== 'object') return null;
  const egg = value as Record<string, unknown>;
  if (egg.type !== 'secret-egg') return null;

  return {
    id: typeof egg.id === 'string' ? egg.id : `secret-egg-${Date.now()}`,
    type: 'secret-egg',
    progress: typeof egg.progress === 'number' ? Math.max(0, egg.progress) : 0,
    requiredGoals: typeof egg.requiredGoals === 'number' ? egg.requiredGoals : 10,
    contributedGoalIds: Array.isArray(egg.contributedGoalIds)
      ? egg.contributedGoalIds.filter((id): id is string => typeof id === 'string')
      : [],
    hatched: egg.hatched === true,
    unlockedPetId:
      typeof egg.unlockedPetId === 'string' &&
      VALID_PETS.has(egg.unlockedPetId as PetRosterItem['id'])
        ? (egg.unlockedPetId as PetRosterItem['id'])
        : null,
  };
}

// ─── Row <→ domain mappers ────────────────────────────────────────────────────

function toSupabaseChildState(row: ChildrenRow, child: Child): SupabaseChildState {
  const fallbackPet = getPetByChildId(child.id)?.pet ?? 'bubbo';

  return {
    childId: row.child_id,
    displayName: row.display_name,
    stars: Math.max(0, row.stars ?? child.stars),
    hearts: Math.max(0, row.hearts ?? child.hearts),
    screenEnergy: normalizeScreenEnergy(row.screen_energy ?? child.screenEnergy),
    equippedPet: normalizePet(row.equipped_pet, fallbackPet),
    equippedSkinByPet: normalizeActiveSkins(row.equipped_skin_by_pet),
    ownedPets: normalizeOwnedPets(row.owned_pets, fallbackPet),
    ownedSkins: normalizeOwnedSkinsArray(row.owned_skins),
    secretEggState: normalizeSecretEggState(row.secret_egg_state),
    completedMissions: normalizeCompletedMissions(row.completed_missions),
    moodPercent: clampMoodPercent(row.mood_percent ?? INITIAL_MOOD_PERCENT),
    moodUpdatedAt: row.mood_updated_at ?? row.updated_at,
    updatedAt: row.updated_at,
  };
}

function toChildrenUpsert(
  child: Child,
  state: Partial<ChildDashboardState>,
  options: ChildDashboardUpsertOptions
) {
  const fallbackPet = getPetByChildId(child.id)?.pet ?? 'bubbo';
  const equippedPet = normalizePet(state.activePetId ?? state.activePetType, fallbackPet);
  const activeSkins = normalizeActiveSkins(state.activeSkins);

  const payload: Record<string, unknown> = {
    child_id: child.id,
    display_name: child.name,
    stars: Math.max(0, Math.floor(state.stars ?? child.stars)),
    hearts: Math.max(0, Math.floor(state.hearts ?? child.hearts)),
    screen_energy: normalizeScreenEnergy(state.screenEnergy ?? child.screenEnergy),
    equipped_pet: equippedPet,
    equipped_skin_by_pet: activeSkins,
    owned_skins: state.ownedSkins ?? [],
    mood_percent: clampMoodPercent(state.comfort ?? INITIAL_MOOD_PERCENT),
    mood_updated_at: state.moodUpdatedAt ?? new Date().toISOString(),
  };

  // Goal completion, egg progress/hatching, and pet unlocks are owned by the
  // verification transaction. Generic dashboard snapshots must never replace them.
  if (options.includeEggPurchase) {
    payload.secret_egg_state = state.activeEgg ?? null;
  }

  return payload;
}

// ─── Merge helper (used by mission-state hydration) ──────────────────────────

export function mergeSupabaseChildState(
  localState: ChildDashboardState,
  remoteState: SupabaseChildState
): ChildDashboardState {
  return {
    ...localState,
    // Phase 1 fields
    stars: remoteState.stars,
    hearts: remoteState.hearts,
    screenEnergy: remoteState.screenEnergy,
    activePetId: remoteState.equippedPet,
    activePetType: remoteState.equippedPet,
    activeSkins: {
      ...localState.activeSkins,
      ...remoteState.equippedSkinByPet,
    },
    // Phase 2 fields
    unlockedPets: remoteState.ownedPets,
    ownedSkins: remoteState.ownedSkins,
    // Egg state is authoritative in Supabase, including an authoritative null.
    activeEgg: remoteState.secretEggState,
    // Phase 3 — remote wins: parent verification must reflect across devices
    completedMissions: remoteState.completedMissions,
    comfort: remoteState.moodPercent,
    moodUpdatedAt: remoteState.moodUpdatedAt,
  };
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

export async function fetchChildState(
  child: Child
): Promise<SupabaseChildState | null> {
  if (!hasSupabaseBrowserEnv()) return null;

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('children')
    .select(SELECT_COLUMNS)
    .eq('child_id', child.id)
    .maybeSingle<ChildrenRow>();

  if (error) {
    console.warn('Unable to fetch Supabase child state.', error.message);
    return null;
  }

  return data ? toSupabaseChildState(data, child) : null;
}

// ─── Full upsert (called on every save from mission-state) ───────────────────

export async function upsertChildStateFromDashboard(
  child: Child,
  state: Partial<ChildDashboardState>,
  options: ChildDashboardUpsertOptions = {}
) {
  if (!hasSupabaseBrowserEnv()) return null;

  const supabase = getSupabaseBrowserClient();
  const payload = toChildrenUpsert(child, state, options);
  const { data, error } = await supabase
    .from('children')
    .upsert(payload, { onConflict: 'child_id' })
    .select(SELECT_COLUMNS)
    .single<ChildrenRow>();

  if (error) {
    console.warn('Unable to upsert Supabase child state.', error.message);
    return null;
  }

  return data ? toSupabaseChildState(data, child) : null;
}

// ─── Targeted update helpers (Phase 1 — update specific fields only) ─────────
// These upserts omit Phase 2 columns intentionally: PostgreSQL ON CONFLICT UPDATE
// only touches the columns listed in the SET payload, leaving the rest unchanged.

export async function updateChildCurrencies(child: Child, updates: CurrencyUpdate) {
  if (!hasSupabaseBrowserEnv()) return null;

  const payload: Record<string, number | string> = {
    child_id: child.id,
    display_name: child.name,
  };

  if (updates.stars !== undefined) payload.stars = Math.max(0, Math.floor(updates.stars));
  if (updates.hearts !== undefined) payload.hearts = Math.max(0, Math.floor(updates.hearts));
  if (updates.screenEnergy !== undefined)
    payload.screen_energy = normalizeScreenEnergy(updates.screenEnergy);

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('children')
    .upsert(payload, { onConflict: 'child_id' })
    .select(SELECT_COLUMNS)
    .single<ChildrenRow>();

  if (error) {
    console.warn('Unable to update Supabase child currencies.', error.message);
    return null;
  }

  return data ? toSupabaseChildState(data, child) : null;
}

export async function updateEquippedPet(
  child: Child,
  equippedPet: PetRosterItem['id']
) {
  if (!hasSupabaseBrowserEnv()) return null;

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('children')
    .upsert(
      { child_id: child.id, display_name: child.name, equipped_pet: equippedPet },
      { onConflict: 'child_id' }
    )
    .select(SELECT_COLUMNS)
    .single<ChildrenRow>();

  if (error) {
    console.warn('Unable to update Supabase equipped pet.', error.message);
    return null;
  }

  return data ? toSupabaseChildState(data, child) : null;
}

export async function updateEquippedSkin(
  child: Child,
  petType: PetType,
  skinId: SkinId | null,
  currentActiveSkins: Record<PetType, SkinId | null>
) {
  if (!hasSupabaseBrowserEnv()) return null;

  const equippedSkinByPet = normalizeActiveSkins({
    ...currentActiveSkins,
    [petType]: skinId,
  });

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('children')
    .upsert(
      {
        child_id: child.id,
        display_name: child.name,
        equipped_skin_by_pet: equippedSkinByPet,
      },
      { onConflict: 'child_id' }
    )
    .select(SELECT_COLUMNS)
    .single<ChildrenRow>();

  if (error) {
    console.warn('Unable to update Supabase equipped skin.', error.message);
    return null;
  }

  return data ? toSupabaseChildState(data, child) : null;
}

export async function updateChildMood(
  child: Child,
  moodPercent: number,
  moodUpdatedAt = new Date().toISOString()
) {
  if (!hasSupabaseBrowserEnv()) return null;

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('children')
    .upsert(
      {
        child_id: child.id,
        display_name: child.name,
        mood_percent: clampMoodPercent(moodPercent),
        mood_updated_at: moodUpdatedAt,
      },
      { onConflict: 'child_id' }
    )
    .select(SELECT_COLUMNS)
    .single<ChildrenRow>();

  if (error) {
    console.warn('Unable to update Supabase child mood.', error.message);
    return null;
  }

  return data ? toSupabaseChildState(data, child) : null;
}
