# Component Map

This document tracks where the major parts of the active root `app/` implementation live.

Last updated: 2026-05-26

## Purpose

Before making changes, check this file to understand:

- Which files control each page
- Where shared state lives
- Where product constants live
- Where shop logic lives
- Where boss logic lives
- Where pet / skin logic lives

## Current Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- localStorage for MVP persistence

Do not introduce backend or Supabase yet unless explicitly requested.

## Active Route Map

### Public / Landing

Files:

- `app/page.tsx`
- `lib/parent-pin.ts`

Responsibilities:

- Shows Pocket Pets landing / user selector.
- Child links go to `/child/child-ansel` and `/child/child-thea`.
- Parent access opens PIN modal.
- PIN check uses `readParentPin()`.

### Parent Layout and Sidebar

Files:

- `app/parent/layout.tsx`
- `app/parent/_components/ParentSidebar.tsx`

Responsibilities:

- Parent pages share fixed/sidebar-style navigation.
- Active parent route is highlighted.
- Sidebar links to overview, goals, rewards, family boss, screen energy, and settings.

### Parent Pages

Completed parent route architecture:

- `app/parent/dashboard/page.tsx` - Overview dashboard and quick navigation.
- `app/parent/goals/page.tsx` - Goal verification and daily goal setup.
- `app/parent/rewards/page.tsx` - Stars, hearts, Screen Energy, deductions, templates.
- `app/parent/family-boss/page.tsx` - Parent boss controls, bonus attacks, claim rewards, next boss.
- `app/parent/screen-energy/page.tsx` - Screen Energy controls and weekly reset.
- `app/parent/settings/page.tsx` - Parent PIN and settings.

Rationale:

- The previous single giant parent page was too dense.
- The split keeps parent tasks focused and easier to scan.

### Child Layout and Sidebar

Files:

- `app/child/layout.tsx`
- `app/child/_components/ChildSidebar.tsx`

Responsibilities:

- `ChildPageFrame` wraps active child pages.
- Desktop child pages use a left sidebar.
- Mobile child pages use compact sticky top navigation.
- Required child links preserve `childId`:
  - Home -> `/child/[childId]`
  - Shop -> `/child/[childId]/shop`
  - Boss -> `/child/[childId]/family`
- Includes Pocket Pets branding and Switch User.

### Child Dashboard Page

Files:

- `app/child/[childId]/page.tsx`
- `lib/mission-state.ts`
- `lib/pet-mood.ts`
- `lib/pet-skins.ts`
- `components/PetAvatar.tsx`
- `components/pets/PetActionOverlay.tsx`

Responsibilities:

- Shows pet image, name, mood, and description.
- Shows stars, hearts, Screen Energy stats.
- Shows today's goals, read-only for child.
- Feed / Pat / Clean care actions with daily limits and cooldowns.
- Shows Current Look and owned skins for the active pet.
- Shows Secret Egg progress.
- Links to Reward Shop and Family Boss via cards and sidebar.
- Syncs state from localStorage every 1 second and on storage events.
- Includes Mood Debug panel for development.

Important notes:

- Child goals are read only.
- Pat can award +1 heart once per day via `patHeartAwarded`.
- `activePetId` and `activePetType` both exist for compatibility.

### Reward Shop Page

Files:

- `app/child/[childId]/shop/page.tsx`
- `lib/mission-state.ts`
- `lib/mock-data.ts`
- `lib/pet-skins.ts`

Responsibilities:

- Screen Energy purchases:
  - 20 stars = +1 Screen Energy
  - 100 stars = +6 Screen Energy
- Secret Egg purchase and progress display.
- Pet Looks / curated skin purchase and wear/remove.
- Pet Collection / Choose Pet.
- Saves state through `saveChildDashboardState`.

Important notes:

- Equipment overlays are deprecated and should not be revived.
- Skins are visual only and do not affect gameplay/rewards.
- Shop responsive direction is desktop grids, reduced vertical scrolling, and clear card states.

### Family Boss Page - Child View

Files:

- `app/child/[childId]/family/page.tsx`
- `lib/boss-battle.ts`

Responsibilities:

- Read-only child view of boss battle.
- Boss hero card with image, name, description, HP, and status.
- Recent Family Attacks.
- This Week's Family Power / contribution bars.
- Victory Rewards display.
- Family Tips / how-to-help section.
- Syncs boss state from localStorage every 1 second.

Important notes:

- No attack button.
- Child cannot manually attack.
- Parent controls live in `/parent/family-boss`.

## Shared State Map

### Child State

Files:

- `lib/mission-state.ts`
- `lib/mock-data.ts`

State handled in `ChildDashboardState`:

- stars
- hearts
- screenEnergy
- activePetId
- activePetType
- unlockedPets
- activeEgg
- eggMessage
- comfort
- completedMissions
- ownedSkins
- activeSkins
- dailyActionCounts
- lastActionTimestamps
- careResetDate
- patHeartAwarded
- goalsDate

### Boss State

Files:

- `lib/boss-battle.ts`

State handled:

- `BossBattleState`
- boss roster
- attacks
- defeated state
- rewardClaimed state
- reward claiming
- next boss rotation

### Parent PIN State

Files:

- `lib/parent-pin.ts`
- `app/page.tsx`
- `app/parent/settings/page.tsx`

Current constants:

- `PARENT_PIN_KEY = 'pocket-pets-parent-pin'`
- `PARENT_PIN_DEFAULT = '1234'`

Scope:

- localStorage-only child-resistant gate.
- Not real authentication.

## localStorage Keys

Current active keys:

- `child-dashboard-state-child-ansel`
- `child-dashboard-state-child-thea`
- `daily-goals-by-child`
- `daily-goal-setup`
- `family-boss-battle-state`
- `pocket-pets-parent-pin`
- reward template key from `app/parent/_lib.ts`

Important:

- Do not rename these keys without a migration plan.
- `src/` is not the active app; root `app/` is active.

## Product Constants Map

### Pet Roster

File:

- `lib/mock-data.ts`

Current pets:

- `bubbo` - Bubbo
- `luna` - Luna
- `mochi` - Mochi
- `ember` - Ember

### Skin Roster

File:

- `lib/pet-skins.ts`

Cost:

- `SKIN_COST = 50`

Current skin groups:

- Bubbo: Astronaut, Dragon Knight, Forest Druid, Pirate Captain, Sakura Festival
- Luna: Candy Princess, Magical Idol, Moon Priestess, Rainbow Carnival, Royal Tea Party
- Mochi: Angel, Forest Spirit, Magical Idol, Royal Prince, Strawberry Shortcake
- Ember: Aurora Spirit, Candy Witch, Celestial Guardian, Dragon Knight, Moonlight Sorcerer

### Boss Roster

File:

- `lib/boss-battle.ts`

Current bosses:

1. Glitch Gremlin
2. Sleepy Fog
3. Mess Monster
4. Grumble Golem
5. Delay Diva

### Shop Items

Files:

- `lib/mock-data.ts`
- `lib/pet-skins.ts`

Current shop categories:

- Screen Energy
- Secret Egg
- Curated Pet Looks / skins
- Pet Collection

## Feature Logic Map

### Goal Verification Logic

Files:

- `app/parent/goals/page.tsx`
- `lib/mission-state.ts`
- `lib/boss-battle.ts`

Expected behavior:

- Parent checks goal.
- Stars are awarded.
- Boss takes damage via source-id deduping.
- Secret Egg progresses once per unique goal.
- State persists.
- Child page updates from localStorage sync.

### Reward Logic

Files:

- `app/parent/rewards/page.tsx`
- `app/parent/screen-energy/page.tsx`
- `app/parent/_lib.ts`
- `lib/mission-state.ts`

Expected behavior:

- Parent can adjust stars, hearts, Screen Energy, and deductions.
- Screen Energy remains uncapped and non-negative.
- Reward changes save to child dashboard state.

### Skin Logic

Files:

- `lib/pet-skins.ts`
- `lib/mission-state.ts`
- `app/child/[childId]/shop/page.tsx`
- `app/child/[childId]/page.tsx`
- `components/PetAvatar.tsx`

Expected behavior:

- Buy skin -> deduct stars -> add to `ownedSkins`.
- Wear skin -> update `activeSkins[petType]`.
- Remove skin -> set `activeSkins[petType]` to null.
- Skin display is visual only.

### Screen Energy Logic

Files:

- `lib/screen-energy.ts`
- `lib/mission-state.ts`
- `app/child/[childId]/shop/page.tsx`
- `app/parent/screen-energy/page.tsx`
- `app/parent/rewards/page.tsx`

Expected behavior:

- Displayed as a simple number.
- No fixed cap.
- 1 Screen Energy = 10 minutes weekend screen time.
- Can be bought in shop.
- Can be awarded/deducted by parent controls.
- Can be awarded by boss victory.
- Does not affect pet mood.

### Family Boss Logic

Files:

- `lib/boss-battle.ts`
- `app/parent/family-boss/page.tsx`
- `app/child/[childId]/family/page.tsx`
- `app/parent/goals/page.tsx`

Expected behavior:

- Verified goals damage boss.
- Unverifying reverses goal damage where supported.
- Parent bonus attacks can damage boss.
- HP cannot go below 0.
- Parent claims rewards once.
- Next boss requires defeated + rewardClaimed.

## Active Components

Shared / active:

- `components/PetAvatar.tsx`
- `components/pets/PetActionOverlay.tsx`
- `components/StatCard.tsx`
- `app/parent/_components/ParentSidebar.tsx`
- `app/parent/_components/PillButton.tsx`
- `app/child/_components/ChildSidebar.tsx`

Legacy or currently not central:

- `components/BottomNavigation.tsx` - no longer used by current child pages after sidebar refactor; may still exist for legacy parent settings route.
- `components/LunaPet.tsx` - contains older accessory concepts.
- `lib/accessory-config.ts` - older accessory config, not active product direction.
- `components/RewardButton.tsx`
- `components/CurrencyRewardButton.tsx`
- `components/RewardCard.tsx`
- `components/PetDisplay.tsx`
- `components/ChildCard.tsx`
- `components/BossCard.tsx`

## Files To Change Carefully

Sensitive files:

- `lib/mission-state.ts`
- `lib/boss-battle.ts`
- `lib/mock-data.ts`
- `lib/pet-skins.ts`
- `app/parent/goals/page.tsx`
- `app/parent/rewards/page.tsx`
- `app/parent/family-boss/page.tsx`
- `app/child/[childId]/shop/page.tsx`
- `app/child/[childId]/page.tsx`

Reasons:

- These files control persistence, rewards, goals, boss damage, egg progress, and skin purchases.
- Do not rename localStorage keys without migration.
- Do not change reward/boss/egg rules during UI polish.

## Files That Should Usually Not Be Touched

- `src/` directory: legacy / inactive. Root `app/` is active.
- `app/layout.tsx`: root layout.
- `app/child/layout.tsx`: child metadata wrapper.
- `lib/screen-energy.ts`: simple stable utility.
- `lib/pet-mood.ts`: mood derivation logic.

## Known Risks / Manual Review

- `src/` ghost codebase exists and can confuse future work; do not edit it.
- `activePetId` and `activePetType` duplicate the same value.
- Some older accessory/equipment files remain in the repo but are not active product direction.
- `components/BottomNavigation.tsx` remains in the repo, but active child pages use `ChildSidebar`.
- The canonical seeded child ids are `child-ansel` and `child-thea`, not bare `ansel` / `thea`.

## Golden Rule

Before modifying code, identify:

1. Which feature is being changed.
2. Which state fields are involved.
3. Which files are relevant.
4. Which product rules must be preserved.
5. How the user will test it.

Do not make broad changes without first mapping the relevant files.
