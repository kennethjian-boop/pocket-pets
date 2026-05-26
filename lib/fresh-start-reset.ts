const FRESH_START_RESET_VERSION = 'fresh-mvp-2026-05-26-v1';
const FRESH_START_RESET_STORAGE_KEY = 'pocket-pets-fresh-start-reset-version';

const GAMEPLAY_STORAGE_KEYS_TO_CLEAR = [
  'child-dashboard-state-child-ansel',
  'child-dashboard-state-child-thea',
  'daily-goals-by-child',
  'daily-goal-setup',
  'family-boss-battle-state',
  'pocket-pets-reward-templates',
  'pocket-pets-sync-meta-child-ansel',
  'pocket-pets-sync-meta-child-thea',
];

export function getFreshStartResetVersion() {
  return FRESH_START_RESET_VERSION;
}

export function ensureFreshStartLocalReset() {
  if (typeof window === 'undefined') return;

  try {
    const currentVersion = window.localStorage.getItem(FRESH_START_RESET_STORAGE_KEY);
    if (currentVersion === FRESH_START_RESET_VERSION) return;

    for (const key of GAMEPLAY_STORAGE_KEYS_TO_CLEAR) {
      window.localStorage.removeItem(key);
    }

    window.localStorage.setItem(FRESH_START_RESET_STORAGE_KEY, FRESH_START_RESET_VERSION);
  } catch {
    // If localStorage is unavailable, the app can still hydrate from Supabase/defaults.
  }
}
