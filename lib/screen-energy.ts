export const SCREEN_ENERGY_MINUTES = 10;

export function normalizeScreenEnergy(value: unknown) {
  if (typeof value === 'number') {
    return Math.max(0, value);
  }

  if (value && typeof value === 'object' && 'current' in value) {
    const current = (value as { current?: unknown }).current;
    return typeof current === 'number' ? Math.max(0, current) : 0;
  }

  return 0;
}

export function getWeekendScreenMinutes(screenEnergy: number) {
  return Math.max(0, screenEnergy) * SCREEN_ENERGY_MINUTES;
}

export function formatWeekendScreenTime(screenEnergy: number) {
  return `${getWeekendScreenMinutes(screenEnergy)} min weekend screen time`;
}
