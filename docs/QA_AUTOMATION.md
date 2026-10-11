# QA Automation

**Never run QA against the real family Supabase project.** Simply opening pages writes to it
(mood decay, reward templates). The tools below use a local fake Supabase, and the screenshot
tools abort any request to `*.supabase.co`.

## Unit tests

```bash
npm test
```

Covers the economy rules, the optimistic-update retry logic (including simulated cross-device
conflicts and double taps), Pet Catch being fun-only, the poop-clean fix, and
`tests/sql-migrations.test.ts`, which runs the real migration SQL on PGlite (Postgres in WASM)
to check atomic, idempotent prize claims and star-free care.

## Demo (sample family, no real data)

```bash
npm run demo          # builds into .next-demo and serves http://localhost:3200
node scripts/qa/demo-check.mjs http://localhost:3200   # end-to-end check, asserts no external requests
```

## Running the app against the fake backend

```bash
npm run qa:mock      # terminal 1: fake Supabase on :54399 (in-memory, seeded)
npm run qa:dev       # terminal 2: next dev on :3100 pointed at the fake backend
```

Then open http://localhost:3100. Scenarios: `curl -X POST "localhost:54399/__mock/reset?scenario=default"`
(`default`, `fresh` — no goals yet, `victory` — boss defeated, `rich` — lots of stars).
`GET /__mock/state` shows the database.

## Browser checks (both servers running)

```bash
npm run qa:flows                         # end-to-end flows (~2 min, includes a full Pet Catch round)
npm run qa:capture                       # every route × 375/390/430/768/1440 into qa-shots/
node scripts/qa/states.mjs qa-shots/states   # game, purchase sheet, victory, empty-goals, night
node scripts/qa/shot.mjs /child/child-thea out.png 390x844
```

The fake backend reimplements the two SQL RPCs in JavaScript. It catches UI and client
data-layer problems; it does **not** prove the SQL or RLS behave the same way. Before relying
on a change in production, test it against a staging Supabase project.
