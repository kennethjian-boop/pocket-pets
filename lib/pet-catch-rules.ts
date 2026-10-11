/**
 * Pet Catch rules (owner decision, Oct 2026): a round costs 2 hearts and lasts
 * 60 seconds. The game is fun-only — it never awards stars or any other currency.
 */
export const PET_CATCH_DURATION_SECONDS = 60;
export const PET_CATCH_HEART_COST = 2;

/** Speed and spawn ramp from the original game loop, by elapsed seconds. */
export function getPetCatchPhase(elapsedSeconds: number) {
  if (elapsedSeconds <= 30) return { speedMultiplier: 0.5, spawnChance: 0.045, maxItems: 3 };
  if (elapsedSeconds <= 45) return { speedMultiplier: 0.75, spawnChance: 0.075, maxItems: 5 };
  return { speedMultiplier: 1.2, spawnChance: 0.105, maxItems: 7 };
}
