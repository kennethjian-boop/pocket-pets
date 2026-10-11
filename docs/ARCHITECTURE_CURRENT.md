# Pocket Pets — Current Architecture (October 2026)

Several older docs (`STATE_MODEL.md`, `CLAUDE_IMPLEMENTATION_RULES.md`, `PRODUCT_VISION.md`)
still describe a localStorage-only MVP. **That is no longer true.** This page describes
what actually runs today.

## Persistence

Supabase is the source of truth; localStorage is a display cache for fast first paint.

| Data | Where | How it changes |
| --- | --- | --- |
| Balances, pets, skins, egg, mood (`children`) | Supabase | Economy gateway (below), verification RPC, care RPC |
| Today's goals (`daily_goals`) | Supabase | Parent randomise/save; verification RPC marks completion |
| Care counts/cooldowns (`care_action_state`) | Supabase | `perform_care_action_transaction` RPC only |
| Boss (`family_boss_state`) | Supabase | Verification RPC adds hits; parent mutations via `lib/boss-sync.ts` |
| Reward templates, parent PIN | Supabase + local cache | Parent pages |

localStorage keys are unchanged (`child-dashboard-state-*`, `daily-goals-by-child`,
`family-boss-battle-state`, `pocket-pets-parent-pin`, …). New, UI-only keys:
`pocket-pets-hatch-seen-<child>` and `pocket-pets-boss-seen-<child>`.

## Authoritative write paths

- **Goal verification** — `verify_daily_goal_transaction` (stars, boss hit, egg progress/hatch, mood).
- **Care actions** — `perform_care_action_transaction` (limits, cooldowns, mood). From migration
  `202610110001` it never changes balances (owner decision).
- **Every other balance change** — `lib/child-economy.ts`. Each operation reads the latest
  `children` row, applies a pure rule from `lib/economy-rules.ts`, and writes only if
  `updated_at` is unchanged (`lib/optimistic-update.ts`), retrying on conflict. This
  replaced writes of absolute balances computed from a possibly stale local cache, which
  could erase a parent's award made on another device. Used by: shop purchases, Pet Catch
  heart spend, parent rewards/deductions and Screen Energy. These are single-row changes, so the
  version check makes them atomic.
- **Boss mutations** — `lib/boss-sync.ts`, version-checked on `family_boss_state.updated_at`.
- **Victory prizes** — `claim_boss_victory_rewards()` (migration `202610110001`): one transaction
  pays every child and sets `reward_claimed`, or nothing happens. Repeats return `already_claimed`.
  There is no browser fallback, because a multi-row payout cannot be made atomic client-side.

One additive migration, `202610110001_atomic_boss_claim_and_star_free_care.sql`, is included and
tested on PGlite (`tests/sql-migrations.test.ts`). It is **not applied automatically**.

## App structure

- `app/child/[childId]/layout.tsx` mounts one shared shell (`ChildStateProvider` + top bar,
  bottom tab bar under 1280px wide, sidebar at ≥1280px). Pages read live state via
  `useChildState()`. State refreshes on focus and every 30 s.
- Child navigation uses a **docked** bottom tab bar (it takes its own space in the layout and
  never covers content). This supersedes the older "no bottom nav" note, which was about a
  *floating* bar that hid Shop/Boss content.
- Parent pages share `useFamilyData()` (both children, goals, boss) and `ParentUI.tsx`.
- Design tokens live in `app/globals.css` (`@theme`). Icons: `components/ui/Icon.tsx`.
  A `short:` variant targets phones in landscape.

## Security notes (need owner decisions — not changed)

1. **One shared family login.** Row-level security allows any authenticated session to read and
   write all tables directly. A child on a logged-in device could, with developer tools, change
   balances or verify goals by calling the API. Today's protections are in the UI and the PIN.
2. **Parent PIN** is a child-resistant gate, not authentication. It's stored in plain text in
   `parent_settings`, which any authenticated session can read. The default is `1234`.
3. Pet Catch no longer awards anything, so there is no client-claimed currency left.

A proper fix means server-side RPCs for every economy action, tighter RLS, and a separate
parent role. That needs new migrations and a security-policy decision, so it was not done.

## Demo mode and previews

`NEXT_PUBLIC_DEMO_MODE=1` routes the Supabase client to an in-browser sample backend
(`lib/demo-backend/`; data lives in that browser's localStorage). `next.config.ts` turns it on
automatically for Vercel preview builds (not `main`/production), so PR previews never touch real
data. Set `POCKET_PETS_PREVIEW_BACKEND=supabase` on Vercel to point previews at a staging project
instead. `npm run demo` serves the same demo locally.

## QA tooling

See `docs/QA_AUTOMATION.md`.
