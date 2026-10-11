/**
 * Optimistic-concurrency helper for shared Supabase rows.
 *
 * Every economy write (shop purchase, Pet Catch, parent reward, boss claim) used
 * to write an absolute balance computed from a possibly stale local cache, so a
 * purchase on the child's iPad could silently erase stars a parent had just
 * awarded on their phone. Instead we read the row, compute the change from the
 * fresh values, and only write if the row's version (updated_at) is unchanged.
 * On a version conflict we re-read and try again.
 *
 * Kept free of Supabase/browser imports so it can be unit tested with node --test.
 */

export type PlanResult<Patch> = { patch: Patch } | { error: string; code?: string };

export interface OptimisticIo<Row, Patch> {
  /** Fresh read of the row. Returns null when it does not exist or cannot be read. */
  read(): Promise<Row | null>;
  /**
   * Conditional write: apply `patch` only if the stored row still matches `current`'s
   * version. Returns the written row, or null on a version conflict. Throws on
   * transport errors.
   */
  write(current: Row, patch: Patch): Promise<Row | null>;
}

export type OptimisticOutcome<Row> =
  | { ok: true; row: Row; attempts: number }
  | { ok: false; reason: 'rejected'; message: string; code?: string; row: Row }
  | { ok: false; reason: 'unavailable'; message: string }
  | { ok: false; reason: 'conflict'; message: string };

export async function runOptimisticUpdate<Row, Patch>(
  io: OptimisticIo<Row, Patch>,
  plan: (row: Row) => PlanResult<Patch>,
  maxAttempts = 4
): Promise<OptimisticOutcome<Row>> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let current: Row | null;
    try {
      current = await io.read();
    } catch (error) {
      return { ok: false, reason: 'unavailable', message: errorMessage(error) };
    }
    if (!current) {
      return { ok: false, reason: 'unavailable', message: 'Could not load the latest saved state.' };
    }

    const decision = plan(current);
    if ('error' in decision) {
      return { ok: false, reason: 'rejected', message: decision.error, code: decision.code, row: current };
    }

    let written: Row | null;
    try {
      written = await io.write(current, decision.patch);
    } catch (error) {
      return { ok: false, reason: 'unavailable', message: errorMessage(error) };
    }
    if (written) return { ok: true, row: written, attempts: attempt };
  }

  return {
    ok: false,
    reason: 'conflict',
    message: 'Something else changed at the same moment. Please try again.',
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
