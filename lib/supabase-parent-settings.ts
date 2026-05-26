'use client';

import { getSupabaseBrowserClient, hasSupabaseBrowserEnv } from '@/lib/supabase-browser';
import { PARENT_PIN_DEFAULT } from '@/lib/parent-pin';

// ─── DB row shape ────────────────────────────────────────────────────────────

type ParentSettingsRow = {
  id: string;
  pin: string;
  settings: Record<string, unknown> | null;
  updated_at: string;
};

// ─── Public types ────────────────────────────────────────────────────────────

export type RemoteParentSettings = {
  pin: string;
};

// ─── Fetch ───────────────────────────────────────────────────────────────────

export async function fetchParentSettings(): Promise<RemoteParentSettings | null> {
  if (!hasSupabaseBrowserEnv()) return null;

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('parent_settings')
    .select('id, pin, settings, updated_at')
    .eq('id', 'family')
    .maybeSingle<ParentSettingsRow>();

  if (error) {
    console.warn('[ParentSettings] Fetch error:', error.message);
    return null;
  }

  if (!data) return null;

  const pin =
    typeof data.pin === 'string' && /^\d{4}$/.test(data.pin)
      ? data.pin
      : PARENT_PIN_DEFAULT;

  return { pin };
}

// ─── Upsert ──────────────────────────────────────────────────────────────────

export async function upsertParentSettings(pin: string): Promise<void> {
  if (!hasSupabaseBrowserEnv()) return;

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from('parent_settings')
    .upsert(
      { id: 'family', pin, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );

  if (error) {
    console.warn('[ParentSettings] Upsert error:', error.message);
  }
}
