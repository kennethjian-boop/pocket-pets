# Feature Roadmap

This roadmap keeps the MVP focused.

Do not overbuild. Complete one stable product flow at a time.

## Current MVP Status

COMPLETED:

- Child dashboard
- Parent dashboard split across focused routes
- Parent sidebar navigation
- Parent PIN modal on landing page
- Parent PIN change in settings
- Reward Shop
- Family Boss Battle
- Feed / Pat / Clean interactions
- Stars
- Hearts
- Screen Energy
- Secret Egg
- Pet mood images
- Pet Collection / Choose Pet
- Curated Pet Looks / skins
- localStorage persistence

ACTIVE REFACTOR:

- Child navigation is moving from floating bottom nav to left sidebar / compact mobile top nav.
- Reward Shop is moving toward better desktop grids and less vertical scrolling.
- Child dashboard is being polished for better balance, less empty space, stronger lower-page anchoring, and better Current Look handling.
- Family Boss UI is being refined into a cozy magical family-event page.

PLANNED / NEXT PHASE:

- Hearts become mini-game currency.
- First mini-game recommendation: Pet Catch Game.
- 5 hearts = 10 minutes game time.
- Games are fun-only and must not generate rewards or progression.

## Completed Architecture Changes

### Parent Dashboard Split

COMPLETED:

The old single scrolling parent dashboard has been split into focused routes:

- `/parent/dashboard`
- `/parent/goals`
- `/parent/rewards`
- `/parent/family-boss`
- `/parent/screen-energy`
- `/parent/settings`

Rationale:

- Reduce page density.
- Make parent daily workflows faster.
- Separate goal verification, reward management, boss controls, Screen Energy, and settings.
- Keep parent UX practical and clean.

### Parent PIN

COMPLETED:

- Landing page parent access PIN modal.
- localStorage key: `pocket-pets-parent-pin`.
- Default fallback PIN: `1234`.
- Settings page can change the PIN.

Scope:

- Child-resistant only.
- Not real authentication.

### Equipment Removed

COMPLETED:

The equipment overlay system is deprecated / removed from the active product direction.

Reason:

- Inconsistent visuals.
- Overlay composition problems.
- Scaling and permutation problems across pets and moods.

Replacement:

- Curated full-look pet skins.

## Completed Feature: Curated Pet Looks / Skins

COMPLETED:

Current pets:

- Bubbo
- Luna
- Mochi
- Ember

Current rules:

- 50 stars each.
- Only purchasable for owned pets.
- One selected skin per pet at a time.
- Base pets still use mood system.
- Selected skins remain visually fixed.
- Skins are visual only.
- Skins do not affect gameplay/rewards.

Current skins:

Bubbo:

- Astronaut
- Dragon Knight
- Forest Druid
- Pirate Captain
- Sakura Festival

Luna:

- Candy Princess
- Magical Idol
- Moon Priestess
- Rainbow Carnival
- Royal Tea Party

Mochi:

- Angel
- Forest Spirit
- Magical Idol
- Royal Prince
- Strawberry Shortcake

Ember:

- Aurora Spirit
- Candy Witch
- Celestial Guardian
- Dragon Knight
- Moonlight Sorcerer

## Active Refactor: Child Navigation

ACTIVE REFACTOR:

Problem:

- Floating bottom navigation blocked Family Boss and Reward Shop content.
- It was a poor fit for desktop layouts.

Direction:

- Child pages should use a left sidebar similar to parent pages.
- Mobile should use a compact top/stacked nav that does not block content.

Required items:

- Home -> `/child/[childId]`
- Shop -> `/child/[childId]/shop`
- Boss -> `/child/[childId]/family`

Acceptance criteria:

- Sidebar appears on child desktop pages.
- Active item is highlighted.
- Switch User is visible.
- Pocket Pets branding is visible.
- childId is preserved in links.
- Navigation does not overlap page content.

## Active Refactor: Reward Shop Responsive Polish

ACTIVE REFACTOR:

Goals:

- Move away from mobile-only stacked layouts.
- Use desktop grid layouts.
- Use responsive pet skin grids.
- Reduce vertical scrolling.
- Improve desktop spacing.
- Keep purchase / owned / worn / locked states obvious.

Acceptance criteria:

- Shop is usable on desktop without feeling stretched or sparse.
- Skin cards wrap cleanly.
- Long skin names remain readable.
- Navigation does not block the bottom of the page.

## Active Refactor: Child Dashboard Polish

ACTIVE REFACTOR:

Direction:

- Magical, cozy, emotional, storybook aesthetic.
- Reduce giant empty whitespace.
- Improve dashboard balance.
- Better lower-page anchoring.
- Improve Current Look section.
- Wrap long skin names.
- Move toward balanced 3-column desktop layout where useful.

Acceptance criteria:

- Pet remains emotional center.
- Stats and goals are easy to scan.
- Current Look is readable and not cramped.
- Lower page does not feel abandoned.
- Mobile remains readable.

## Active Refactor: Family Boss UI/UX

COMPLETED / ACTIVE REFACTOR:

Current direction:

- Boss hero card.
- Larger boss art.
- Improved HP bar.
- Contribution bars.
- Recent family attack feed.
- Reward cards.
- Cozy magical boss-event feeling.

UX philosophy:

- Family Boss should feel cooperative and emotionally meaningful.
- Children should understand that real-life goals help the family.
- Parent remains the only verifier and reward claimer.

Acceptance criteria:

- Family Boss page feels exciting.
- Children understand how to help.
- HP and family contributions are easy to read.
- Reward cards are clear.
- Content is not blocked by navigation.

## Planned Next Phase: Hearts Mini-Games

PLANNED / NEXT PHASE:

Product rule:

- 5 hearts = 10 minutes game time.

Games are:

- Fun-only reward experiences.
- Short, timer-based.
- Optional celebration loops, not progression systems.

Games must NOT generate:

- Stars
- Hearts
- Screen Energy
- Boss damage
- Egg progress
- Goal progress

Recommended first game:

- Pet Catch Game.

Pet Catch Game MVP concept:

- Current pet / current skin used as avatar.
- Falling items.
- Simple left/right movement.
- Timer-based gameplay.
- Heart-funded playtime.
- React-friendly implementation.

Acceptance criteria:

- Spending hearts is explicit.
- Timer ends play.
- Game cannot farm rewards.
- Game has no impact on goals, boss, eggs, stars, hearts earnings, or Screen Energy.

## Later Enhancements

Only after MVP flow is stable:

- Supabase database
- Real parent login
- Child login or child mode hardening
- Weekly reset automation
- Badges / trophies
- Pet bond levels
- Pet phrases
- Custom family rewards
- Multiple boss difficulties
- Boss milestone messages
- Pet collection album
- Sound effects
- Richer animations
- More pets
- More bosses
- Seasonal events

Do not add backend, analytics, multiplayer, or real auth until explicitly requested.
