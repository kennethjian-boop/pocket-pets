import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runOptimisticUpdate } from '../lib/optimistic-update.ts';
import {
  planCurrencyDelta,
  planHeartSpend,
  planScreenEnergyPurchase,
  planSecretEggPurchase,
  planSkinPurchase,
  type EconomyPatch,
  type EconomyRow,
} from '../lib/economy-rules.ts';
import * as petCatchRules from '../lib/pet-catch-rules.ts';

type Row = EconomyRow & { updated_at: number };

function row(overrides: Partial<Row> = {}): Row {
  return {
    stars: 100,
    hearts: 5,
    screen_energy: 2,
    equipped_pet: 'bubbo',
    owned_pets: ['bubbo'],
    owned_skins: [],
    secret_egg_state: null,
    updated_at: 1,
    ...overrides,
  };
}

/** In-memory row with a version, plus an optional "other device" write between read and write. */
function store(initial: Row, interference: Array<(r: Row) => void> = []) {
  let current = { ...initial };
  let writes = 0;
  return {
    get: () => current,
    writes: () => writes,
    io: {
      async read() {
        return { ...current };
      },
      async write(seen: Row, patch: EconomyPatch) {
        const other = interference.shift();
        if (other) {
          other(current);
          current = { ...current, updated_at: current.updated_at + 1 };
        }
        if (seen.updated_at !== current.updated_at) return null;
        writes += 1;
        current = { ...current, ...patch, updated_at: current.updated_at + 1 } as Row;
        return { ...current };
      },
    },
  };
}

test('screen energy purchase spends from fresh balance', async () => {
  const s = store(row({ stars: 120 }));
  const out = await runOptimisticUpdate(s.io, (r) => planScreenEnergyPurchase(r, 100, 6));
  assert.equal(out.ok, true);
  assert.equal(s.get().stars, 20);
  assert.equal(s.get().screen_energy, 8);
});

test('a parent award on another device is not erased by a concurrent purchase', async () => {
  // Child sees 100 stars; parent adds 50 at the same moment.
  const s = store(row({ stars: 100 }), [(r) => (r.stars += 50)]);
  const out = await runOptimisticUpdate(s.io, (r) => planScreenEnergyPurchase(r, 20, 1));
  assert.equal(out.ok, true);
  assert.equal(out.ok && out.attempts, 2);
  assert.equal(s.get().stars, 130, '100 + 50 award - 20 purchase');
});

test('insufficient stars are rejected using the fresh row, not the cache', async () => {
  // The cached UI thought there were enough stars, but another device spent them.
  const s = store(row({ stars: 10 }));
  const out = await runOptimisticUpdate(s.io, (r) => planScreenEnergyPurchase(r, 20, 1));
  assert.equal(out.ok, false);
  assert.equal(!out.ok && out.reason, 'rejected');
  assert.equal(s.writes(), 0);
});

test('duplicate skin purchase is rejected and pet must be owned', async () => {
  const skin = { id: 'astronaut-bubbo', petType: 'bubbo', cost: 50, name: 'Astronaut Bubbo' };
  assert.deepEqual(planSkinPurchase(row({ owned_skins: ['astronaut-bubbo'] }), skin), {
    error: 'You already own this look!',
    code: 'owned',
  });
  const luna = { id: 'magical-idol-luna', petType: 'luna', cost: 50, name: 'Magical Idol Luna' };
  assert.equal('error' in planSkinPurchase(row(), luna), true);
  const ok = planSkinPurchase(row({ stars: 60 }), skin);
  assert.deepEqual(ok, { patch: { stars: 10, owned_skins: ['astronaut-bubbo'] } });
});

test('double-tapped skin purchase only charges once', async () => {
  const skin = { id: 'astronaut-bubbo', petType: 'bubbo', cost: 50, name: 'Astronaut Bubbo' };
  const s = store(row({ stars: 200 }));
  const [a, b] = await Promise.all([
    runOptimisticUpdate(s.io, (r) => planSkinPurchase(r, skin)),
    runOptimisticUpdate(s.io, (r) => planSkinPurchase(r, skin)),
  ]);
  assert.equal([a, b].filter((o) => o.ok).length, 1);
  assert.equal(s.get().stars, 150);
});

test('secret egg rules: one active egg, not when all pets owned', () => {
  const options = { cost: 50, requiredGoals: 10, eggId: 'egg-1' };
  const active = row({ secret_egg_state: { type: 'secret-egg', hatched: false } });
  assert.equal('error' in planSecretEggPurchase(active, options), true);
  const all = row({ owned_pets: ['bubbo', 'luna', 'mochi', 'ember'] });
  assert.equal('error' in planSecretEggPurchase(all, options), true);
  const hatched = row({ secret_egg_state: { type: 'secret-egg', hatched: true } });
  const ok = planSecretEggPurchase(hatched, options);
  assert.equal('patch' in ok && ok.patch.stars, 50);
});

test('hearts spend and parent deltas never go negative', () => {
  assert.equal('error' in planHeartSpend(row({ hearts: 1 }), 2), true);
  assert.deepEqual(planHeartSpend(row({ hearts: 3 }), 2), { patch: { hearts: 1 } });
  assert.deepEqual(planCurrencyDelta(row({ stars: 3 }), { stars: -10 }), { patch: { stars: 0 } });
  assert.deepEqual(planCurrencyDelta(row(), { stars: 20, hearts: 1, screenEnergy: 1 }), {
    patch: { stars: 120, hearts: 6, screen_energy: 3 },
  });
});

test('gives up cleanly after repeated conflicts', async () => {
  const bump = (r: Row) => (r.hearts += 0);
  const s = store(row(), [bump, bump, bump, bump]);
  const out = await runOptimisticUpdate(s.io, (r) => planHeartSpend(r, 1));
  assert.equal(!out.ok && out.reason, 'conflict');
  assert.equal(s.writes(), 0);
});

test('unavailable when the read fails — never writes stale data', async () => {
  const out = await runOptimisticUpdate(
    { read: async () => { throw new Error('offline'); }, write: async () => { throw new Error('should not write'); } },
    () => ({ patch: {} })
  );
  assert.equal(!out.ok && out.reason, 'unavailable');
});

test('Pet Catch costs 2 hearts and exposes no star payout', () => {
  assert.equal(petCatchRules.PET_CATCH_HEART_COST, 2);
  assert.equal(petCatchRules.PET_CATCH_DURATION_SECONDS, 60);
  assert.equal(Object.keys(petCatchRules).some((name) => /star/i.test(name)), false);
});

import { markPoopCleanedBy } from '../lib/poop-rules.ts';

test('poop scheduled before the last Clean stays cleaned after reload', () => {
  const events = [
    { id: 'a', scheduledAt: '2026-10-11T10:00:00+08:00', createdAt: '2026-10-11T02:00:00.000Z', cleanedAt: null },
    { id: 'b', scheduledAt: '2026-10-11T16:00:00+08:00', createdAt: '2026-10-11T08:00:00.000Z', cleanedAt: null },
  ];
  const cleanAt = Date.parse('2026-10-11T12:30:00+08:00');
  const out = markPoopCleanedBy(events, cleanAt);
  assert.ok(out[0].cleanedAt, 'morning poop cleaned');
  assert.equal(out[1].cleanedAt, null, 'afternoon poop still waiting');
  assert.deepEqual(markPoopCleanedBy(events, 0), events);
});
