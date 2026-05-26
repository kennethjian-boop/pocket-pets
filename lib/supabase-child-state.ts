'use client';

import { getSupabaseBrowserClient, hasSupabaseBrowserEnv } from '@/lib/supabase-browser';
import { getPetByChildId, type Child, type PetRosterItem } from '@/lib/mock-data';
import {
  VALID_SKIN_IDS,
  type PetType,
  type SkinId,
} from '@/lib/pet-skins';
import { normalizeScreenEnergy } from '@/lib/screen-energy';
import type { ChildDashboardState } from '@/lib/mission-state';

export type SupabaseChildState = {
  childId: string;
  displayName: string;
  stars: number;
  hearts: number;
  screenEnergy: number;
  equippedPet: PetRosterItem['id'];
  equippedSkinByPet: Record<PetType, SkinId | null>;
  updatedAt: string;
};

type ChildrenRow = {
  child_id: string;
  display_name: string;
  stars: number;
  hearts: number;
  screen_energy: number;
  equipped_pet: string;
  equipped_skin_by_pet: Record<string, unknown> | null;
  updated_at: string;
};

type CurrencyUpdate = Partial<
  Pick<SupabaseChildState, 'stars' | 'hearts' | 'screenEnergy'>
>;

const VALID_PETS = new Set<PetRosterItem['id']>(['luna', 'bubbo', 'mochi', 'ember']);

function normalizePet(value: unknown, fallback: PetRosterItem['id']): PetRosterItem['id'] {
  return typeof value === 'string' && VALID_PETS.has(value as PetRosterItem['id'])
    ? value as PetRosterItem['id']
    : fallback;
}

function normalizeActiveSkins(value: unknown): Record<PetType, SkinId | null> {
  const activeSkins: Record<PetType, SkinId | null> = {
    luna: null,
    bubbo: null,
    mochi: null,
    ember: null,
  };

  if (!value || typeof value !== 'object') return activeSkins;

  for (const petType of Object.keys(activeSkins) as PetType[]) {
    const skinId = (value as Record<string, unknown>)[petType];
    activeSkins[petType] =
      typeof skinId === 'string' && VALID_SKIN_IDS.has(skinId)
        ? skinId as SkinId
        : null;
  }

  return activeSkins;
}

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
    updatedAt: row.updated_at,
  };
}

function toChildrenUpsert(child: Child, state: Partial<ChildDashboardState>) {
  const fallbackPet = getPetByChildId(child.id)?.pet ?? 'bubbo';
  const equippedPet = normalizePet(state.activePetId ?? state.activePetType, fallbackPet);
  const activeSkins = normalizeActiveSkins(state.activeSkins);

  return {
    child_id: child.id,
    display_name: child.name,
    stars: Math.max(0, Math.floor(state.stars ?? child.stars)),
    hearts: Math.max(0, Math.floor(state.hearts ?? child.hearts)),
    screen_energy: normalizeScreenEnergy(state.screenEnergy ?? child.screenEnergy),
    equipped_pet: equippedPet,
    equipped_skin_by_pet: activeSkins,
  };
}

export function mergeSupabaseChildState(
  localState: ChildDashboardState,
  remoteState: SupabaseChildState
): ChildDashboardState {
  return {
    ...localState,
    stars: remoteState.stars,
    hearts: remoteState.hearts,
    screenEnergy: remoteState.screenEnergy,
    activePetId: remoteState.equippedPet,
    activePetType: remoteState.equippedPet,
    activeSkins: {
      ...localState.activeSkins,
      ...remoteState.equippedSkinByPet,
    },
  };
}

export async function fetchChildState(
  child: Child
): Promise<SupabaseChildState | null> {
  if (!hasSupabaseBrowserEnv()) return null;

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('children')
    .select(
      'child_id, display_name, stars, hearts, screen_energy, equipped_pet, equipped_skin_by_pet, updated_at'
    )
    .eq('child_id', child.id)
    .maybeSingle<ChildrenRow>();

  if (error) {
    console.warn('Unable to fetch Supabase child state.', error.message);
    return null;
  }

  return data ? toSupabaseChildState(data, child) : null;
}

export async function upsertChildStateFromDashboard(
  child: Child,
  state: Partial<ChildDashboardState>
) {
  if (!hasSupabaseBrowserEnv()) return null;

  const supabase = getSupabaseBrowserClient();
  const payload = toChildrenUpsert(child, state);
  const { data, error } = await supabase
    .from('children')
    .upsert(payload, { onConflict: 'child_id' })
    .select(
      'child_id, display_name, stars, hearts, screen_energy, equipped_pet, equipped_skin_by_pet, updated_at'
    )
    .single<ChildrenRow>();

  if (error) {
    console.warn('Unable to upsert Supabase child state.', error.message);
    return null;
  }

  return data ? toSupabaseChildState(data, child) : null;
}

export async function updateChildCurrencies(
  child: Child,
  updates: CurrencyUpdate
) {
  if (!hasSupabaseBrowserEnv()) return null;

  const payload: Record<string, number | string> = {
    child_id: child.id,
    display_name: child.name,
  };

  if (updates.stars !== undefined) {
    payload.stars = Math.max(0, Math.floor(updates.stars));
  }
  if (updates.hearts !== undefined) {
    payload.hearts = Math.max(0, Math.floor(updates.hearts));
  }
  if (updates.screenEnergy !== undefined) {
    payload.screen_energy = normalizeScreenEnergy(updates.screenEnergy);
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('children')
    .upsert(payload, { onConflict: 'child_id' })
    .select(
      'child_id, display_name, stars, hearts, screen_energy, equipped_pet, equipped_skin_by_pet, updated_at'
    )
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
      {
        child_id: child.id,
        display_name: child.name,
        equipped_pet: equippedPet,
      },
      { onConflict: 'child_id' }
    )
    .select(
      'child_id, display_name, stars, hearts, screen_energy, equipped_pet, equipped_skin_by_pet, updated_at'
    )
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
    .select(
      'child_id, display_name, stars, hearts, screen_energy, equipped_pet, equipped_skin_by_pet, updated_at'
    )
    .single<ChildrenRow>();

  if (error) {
    console.warn('Unable to update Supabase equipped skin.', error.message);
    return null;
  }

  return data ? toSupabaseChildState(data, child) : null;
}
