# Work checkpoint (resume here)

Branch: `design/premium-pet-adventure` · PR #1 (do not merge/deploy prod)
QA: `npm run qa:mock` + `npm run qa:dev`, then `npm test`, `npm run qa:flows`, `npm run qa:capture`.

## Phase 2 tasks (owner decisions, Oct 2026)
- [x] Pet Catch: 2 hearts/round, no stars (client + docs + tests)
- [x] Care: no stars (client + new migration redefining care RPC; limits 4/5/3, cooldowns unchanged)
- [x] Atomic idempotent `claim_boss_victory_rewards` RPC (migration) + client + mock + PGlite SQL tests
- [ ] Demo mode (in-browser sample backend); Vercel preview builds auto-use it
- [ ] Polish pass + 6-viewport sweep (375/390/430/768/1024x768/1440), both children
- [ ] Docs (economy resolved, owner actions), PR body, push, verify preview

## Status
- Phase 1 complete (PR #1 opened).
- Economy + atomic claim done; migration 202610110001 tested on PGlite (tests/sql-migrations.test.ts); flows 20/20.
- QA mock now wraps lib/demo-backend/core.mjs (shared with demo mode).
