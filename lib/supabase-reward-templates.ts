'use client';

import { getSupabaseBrowserClient, hasSupabaseBrowserEnv } from '@/lib/supabase-browser';
import {
  defaultRewardTemplates,
  type CurrencyType,
  type RewardTemplate,
  type RewardType,
} from '@/lib/reward-templates';

// ─── DB row shape ────────────────────────────────────────────────────────────

type RewardTemplatesRow = {
  id: string;
  templates: unknown[] | null;
  updated_at: string;
};

// ─── Normalizer ──────────────────────────────────────────────────────────────

const VALID_CURRENCY_TYPES = new Set<CurrencyType>(['stars', 'hearts', 'screen-energy']);
const VALID_REWARD_TYPES = new Set<RewardType>(['positive', 'deduction']);

function normalizeTemplates(value: unknown): RewardTemplate[] {
  if (!Array.isArray(value)) return defaultRewardTemplates;
  const valid: RewardTemplate[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const t = item as Record<string, unknown>;
    if (
      typeof t.id === 'string' &&
      typeof t.label === 'string' &&
      typeof t.icon === 'string' &&
      typeof t.amount === 'number' &&
      VALID_CURRENCY_TYPES.has(t.currencyType as CurrencyType) &&
      VALID_REWARD_TYPES.has(t.rewardType as RewardType)
    ) {
      valid.push(t as unknown as RewardTemplate);
    }
  }
  return valid.length > 0 ? valid : defaultRewardTemplates;
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

export async function fetchRewardTemplates(): Promise<RewardTemplate[] | null> {
  if (!hasSupabaseBrowserEnv()) return null;

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('reward_templates')
    .select('id, templates, updated_at')
    .eq('id', 'family')
    .maybeSingle<RewardTemplatesRow>();

  if (error) {
    console.warn('[RewardTemplates] Fetch error:', error.message);
    return null;
  }

  return data ? normalizeTemplates(data.templates) : null;
}

// ─── Upsert ──────────────────────────────────────────────────────────────────

export async function upsertRewardTemplates(templates: RewardTemplate[]): Promise<void> {
  if (!hasSupabaseBrowserEnv()) return;

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('reward_templates')
    .upsert(
      { id: 'family', templates, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );

  if (error) {
    console.warn('[RewardTemplates] Upsert error:', error.message);
  }
}
