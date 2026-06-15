# Claude Implementation Rules

This document tells Claude how to work on this project.

Claude should follow these rules before making code changes.

## Role

Claude is the engineer inside VS Code.

ChatGPT is the product brain, planner, and QA reviewer.

Claude should implement clearly scoped tasks only.

Do not make broad product decisions unless explicitly asked.

## Current Tech Stack

The current MVP uses:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- localStorage for persistence

Do not introduce new major dependencies unless necessary.

Do not introduce Supabase, backend logic, real authentication, database schemas, analytics, multiplayer systems, or API routes unless explicitly requested.

## Active Codebase

Root `app/` is active.

Do not touch `src/` unless the user explicitly asks. The `src/` tree is legacy / inactive for this MVP.

## Working Style

Before making changes:

1. Read the relevant docs in `/docs`.
2. Inspect the current files.
3. Identify the smallest safe implementation path.
4. Preserve existing working features.
5. Modify only the files needed for the task.

After making changes:

1. Summarise what changed.
2. List files modified.
3. Explain how to test.
4. Mention any risks or follow-up needed.

## Do Not Overbuild

Do not rewrite the whole app.

Do not redesign the whole UI unless the task is specifically UI redesign.

Do not move large amounts of code unnecessarily.

Do not introduce backend persistence.

Do not add real authentication.

Do not change unrelated features.

Do not change product rules.

## Important Product Rules To Preserve

- Children cannot self-verify goals.
- Children cannot manually attack the boss.
- Children cannot claim boss rewards.
- Children cannot self-award hearts or Screen Energy. Stars are limited to defined reward paths, including care mood thresholds.
- Parent verification is the core source of meaningful progress.
- Feed / Pat / Clean add 10 mood and may award stars only when crossing mood thresholds: 1 star at 80+, or 3 stars at 100.
- Feed / Pat / Clean cannot generate Screen Energy.
- Feed / Pat / Clean cannot damage the boss.
- Feed / Pat / Clean cannot increase Secret Egg progress.
- Feed / Pat / Clean cannot hatch Secret Egg.
- Stars are shop currency.
- Hearts are pet bond now and planned mini-game currency later.
- Planned hearts rule: 5 hearts = 10 minutes game time.
- Mini-games must not generate stars, hearts, Screen Energy, boss damage, egg progress, or goal progress.
- Screen Energy is an uncapped weekly weekend screen time bank.
- Screen Energy should display as a simple number.
- Screen Energy must not affect pet mood.
- Secret Egg unlocks one random locked pet.
- Family Boss is a shared family teamwork goal.
- Parent pages should be practical and clean.
- Child pages should be magical and motivating.
- Curated skins are visual only.
- Equipment overlays are deprecated / removed from the active product direction.

## Current Route Architecture

Parent routes:

- `/parent/dashboard`
- `/parent/goals`
- `/parent/rewards`
- `/parent/family-boss`
- `/parent/screen-energy`
- `/parent/settings`

Child routes:

- `/child/[childId]`
- `/child/[childId]/shop`
- `/child/[childId]/family`

Current seeded child ids:

- `child-ansel`
- `child-thea`

## Navigation Rules

Parent:

- Parent pages use `app/parent/_components/ParentSidebar.tsx`.
- Keep parent sidebar practical and compact.
- Active route should be highlighted.

Child:

- Active child pages use `app/child/_components/ChildSidebar.tsx`.
- Floating bottom nav should not be reintroduced for child pages.
- Child navigation must preserve `childId`.
- Required child items: Home, Shop, Boss, Switch User, Pocket Pets branding.
- Navigation must not block content.

## Parent PIN Rules

Current helper:

- `lib/parent-pin.ts`

Current key/default:

- `PARENT_PIN_KEY = 'pocket-pets-parent-pin'`
- `PARENT_PIN_DEFAULT = '1234'`

Scope:

- This is localStorage-only child-resistant gating.
- It is not real authentication.
- Do not describe it as secure account protection.
- Do not rename the key without migration.

## State Safety

When changing state logic:

- Avoid duplicate state sources.
- Avoid creating unnecessary localStorage keys.
- Preserve existing user data where possible.
- Add safe defaults for missing fields.
- Validate old state shape if new fields are added.
- Keep state easy to debug.

Important child fields:

- stars
- hearts
- screenEnergy
- activePetId
- activePetType
- unlockedPets
- ownedSkins
- activeSkins
- activeEgg
- completedMissions
- dailyActionCounts
- lastActionTimestamps
- patHeartAwarded

Deprecated fields / concepts:

- ownedAccessories
- equippedAccessories
- equipment overlays
- max equipped accessory slots

If fields are missing, add safe defaults.

Example defaults:

```ts
unlockedPets: ['bubbo'];
activePetId: 'bubbo';
ownedSkins: [];
activeSkins: { luna: null, bubbo: null, mochi: null, ember: null };
screenEnergy: 0;
activeEgg: null;
```

## Curated Skin Rules

Current source:

- `lib/pet-skins.ts`

Rules:

- Skins cost 50 stars.
- Skins are only purchasable for owned pets.
- A child cannot buy duplicate skins.
- One active skin per pet at a time.
- Skins are visual only.
- Base pets still use the mood system.
- Selected skins remain visually fixed.
- Skins do not affect gameplay, rewards, boss damage, egg progress, goals, care limits, or Screen Energy.

## Implementation Priority

When given a task, prefer this order:

1. Fix product logic.
2. Preserve data.
3. Make UI clear.
4. Add feedback messages.
5. Polish visuals only after flow works.

## Testing Expectations

Every implementation should include manual testing steps.

Testing steps should be simple enough for a beginner to follow.

Use canonical child routes when testing:

- `/child/child-ansel`
- `/child/child-thea`

## UI Quality

The app should feel child friendly.

Use:

- Rounded cards
- Soft colors
- Clear spacing
- Friendly labels
- Large readable buttons
- Encouraging messages
- Simple language

Parent UI should be cleaner and less magical.

Child UI can be more playful.

Reward Shop should increasingly use responsive grids and reduced vertical scrolling.

Family Boss should feel like a cozy magical family event.

## Feedback Quality

Important actions should show clear feedback.

Examples:

- Purchase success
- Not enough stars
- Skin bought / worn / removed
- Pet changed
- Egg hatched
- Goal verified
- Boss damaged
- Rewards claimed
- PIN changed

Do not leave users guessing whether something worked.

## Error Handling

Handle these edge cases:

- Missing localStorage data
- Old localStorage shape
- Not enough stars
- Duplicate skin purchase
- Selecting locked pet
- Buying skin for locked pet
- Buying egg while another egg is active
- Buying egg when all pets are unlocked
- Boss reward already claimed
- Starting next boss before claiming rewards
- Invalid activePetId
- Missing pet images
- Incorrect Parent PIN

## File Modification Discipline

Before modifying files, Claude should identify:

- Which files are relevant
- Which files will be changed
- Which files should not be touched

Avoid changing many files unless necessary.

If a task can be completed in 2 to 4 files, prefer that.

## Response Format After Implementation

After making code changes, Claude should respond with:

## Summary

Briefly explain what was changed.

## Files Modified

- file path 1
- file path 2

## How To Test

1. Step one
2. Step two
3. Step three

## Notes / Risks

Mention any possible issue, incomplete part, or assumption.

## Response Format For Audit Only

When asked to audit without coding, Claude should not edit files.

Use this format:

## A. Current Architecture Summary

## B. Relevant Files

## C. Current Feature Status

## D. Bugs / Risks Found

## E. Recommended Next Step

## F. Files You Would Modify Next

## Important Reminder

This project is for motivating children through real-life routines.

The app should not become a game where children farm rewards by clicking.

The meaningful progress loop must remain:

Real-life goal completed -> parent verifies -> child earns progress.
