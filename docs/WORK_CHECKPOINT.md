# Work checkpoint (resume here)

Branch: `design/premium-pet-adventure` · PR #1 (do not merge/deploy prod)
QA: `npm run qa:mock` + `npm run qa:dev`, then `npm test`, `npm run qa:flows`, `npm run qa:capture`.
Demo: `npm run demo` → http://localhost:3200 · `node scripts/qa/demo-check.mjs http://localhost:3200`

## Phase 2 (owner decisions, Oct 2026) — complete
- [x] Pet Catch: 2 hearts/round, no stars; device-local best score
- [x] Care: no stars (migration 202610110001 redefines care RPC; limits 4/5/3, cooldowns unchanged)
- [x] Atomic idempotent `claim_boss_victory_rewards` RPC + client (no non-atomic fallback) + mock + PGlite SQL tests
- [x] Demo mode (in-browser sample backend); Vercel preview builds auto-use it (next.config.ts)
- [x] Polish + 6-viewport sweep (Pet Catch iPad-landscape height, sky, hearts hint, price coins)
- [x] Docs aligned (ECONOMY_DECISIONS_NEEDED now "resolved", ARCHITECTURE_CURRENT, QA_AUTOMATION)

## Last verified
- tsc ✓ · eslint 0 errors (1 legacy warning) · npm test 18/18 · next build ✓ · qa:flows 21/21 · demo-check 8/8
- Vercel previews are behind Vercel Authentication (owner login); content not verifiable from here.

## Owner actions before merge
1. Apply migration 202610110001 (staging first). Until then prize claiming shows a "needs database update" message and care still gives stars server-side.
2. Open the Vercel preview and confirm the dark "Preview · sample family" strip is visible before signing in.
