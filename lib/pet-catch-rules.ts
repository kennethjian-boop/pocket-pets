/**
 * Pet Catch economy, unchanged from the current implementation.
 *
 * NOTE (owner decision pending): this conflicts with APP_RULES ("mini-games must not
 * generate stars") and with docs/PET_CATCH_GAME.md's tier table. It is preserved
 * as-is until the economy is reconciled. See docs/ECONOMY_DECISIONS_NEEDED.md.
 */
export const PET_CATCH_DURATION_SECONDS = 60;
export const PET_CATCH_HEART_COST = 2;

export function getPetCatchStarsEarned(score: number) {
  if (score > 75) return 20;
  if (score > 50) return 15;
  if (score > 25) return 10;
  return 5;
}

/** Speed and spawn ramp from the original game loop, by elapsed seconds. */
export function getPetCatchPhase(elapsedSeconds: number) {
  if (elapsedSeconds <= 30) return { speedMultiplier: 0.5, spawnChance: 0.045, maxItems: 3 };
  if (elapsedSeconds <= 45) return { speedMultiplier: 0.75, spawnChance: 0.075, maxItems: 5 };
  return { speedMultiplier: 1.2, spawnChance: 0.105, maxItems: 7 };
}
