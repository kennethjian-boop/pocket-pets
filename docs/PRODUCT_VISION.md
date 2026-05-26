# Product Vision

## App Name

Working title: Pocket Pets.

## Purpose

Pocket Pets is a child-friendly motivation system for Ansel and Thea.

The goal is to help children complete real-life goals, build routines, earn rewards, and feel emotionally connected to progress through:

- Virtual pets
- Daily goals
- Parent-verified rewards
- Stars
- Hearts
- Screen Energy
- Reward Shop
- Secret Egg pet unlocking
- Curated Pet Looks / skins
- Family Boss Battle

This app is not meant to be a complex backend product yet. It is currently an MVP using localStorage for persistence while the family tests the core product flow.

## Target Users

### Children

Children use the app to:

- See their pet
- View today's goals
- Feel motivated by rewards
- Interact with their pet
- Spend stars in the Reward Shop
- See their pet collection
- Choose visual-only pet looks
- Watch the family defeat bosses together

The child experience should feel cute, magical, encouraging, simple, and emotionally rewarding.

### Parent

The parent uses the app to:

- Verify goals
- Award or deduct rewards
- Control Screen Energy
- Manage boss progress
- Claim boss victory rewards
- Reset or start the next boss
- Change the Parent PIN
- View each child's progress quickly

The parent experience should feel fast, practical, clear, uncluttered, and easy to manage daily.

## Product Philosophy

Parent verification is the core of meaningful progress.

Children should feel ownership and motivation, but they should not be able to self-award major rewards.

The child side should be fun and interactive. The parent side should be a practical control dashboard.

## Main Product Loop

1. Child sees today's goals.
2. Child completes real-life goal.
3. Child asks parent to check.
4. Parent verifies the goal.
5. Child earns stars.
6. Boss takes damage.
7. Secret Egg progresses if active.
8. Child feels progress through pet, rewards, and boss battle.
9. Child saves stars or spends them in the Reward Shop.
10. Family works together to defeat the weekly boss.

## Core Reward Meaning

### Stars

Stars are the main shop currency.

Children earn stars through:

- Parent-verified goals
- Parent rewards
- Boss victory rewards

Children spend stars on:

- Screen Energy
- Pet Looks / curated skins
- Secret Egg

### Hearts

Hearts represent pet bond and affection.

Completed today:

- Hearts exist as a visible reward / bond stat.
- Hearts can be awarded by parent rewards and boss victory rewards.
- Hearts have limited spending purpose in the current MVP.

Planned next phase:

- Hearts become mini-game currency.
- Planned rule: 5 hearts = 10 minutes of game time.
- Mini-games are fun-only reward experiences.
- Mini-games must not generate stars, hearts, Screen Energy, boss damage, egg progress, or goal progress.

Recommended first MVP mini-game:

- Pet Catch Game.
- Use the current pet / current skin as the avatar.
- Simple movement, falling items, and timer-based play.
- React-friendly scope; avoid a heavy game engine for the first version.

### Screen Energy

Screen Energy represents a weekly weekend screen time bank.

It is not pet energy.

Important meaning:

- 1 Screen Energy = 10 minutes of weekend screen time.
- Screen Energy should display as a simple number.
- It should not have a fixed cap.
- It should not affect pet mood.
- It should not be farmed by Feed, Pat, or Clean.

Example:

Screen Energy: 6  
Meaning: 60 minutes weekend screen time

## MVP Scope

Completed or active in the current MVP:

- Child dashboard
- Parent dashboard split across focused parent routes
- Parent sidebar navigation
- Child sidebar navigation
- Reward Shop
- Family Boss Battle
- Pets and pet moods
- Curated Pet Looks / skins
- Stars
- Hearts
- Screen Energy
- Secret Egg
- Pet unlocking
- Parent PIN gate
- localStorage persistence

Do not introduce Supabase, backend logic, server auth, analytics, or complex architecture unless explicitly requested later.

## Design Direction

The overall app should feel cute, soft, warm, and child friendly.

Recommended visual style:

- Soft pastel gradients
- Rounded 2xl or 3xl cards
- Playful but readable typography
- Gentle animations
- Clear reward feedback
- Large pet images
- Friendly language

Recommended font:

- Fredoka as main font
- Nunito as fallback

## Page Experience

### Child Dashboard

The child dashboard should feel magical and pet focused.

It should show:

- Pet avatar
- Pet name
- Pet mood
- Pet status
- Stars
- Hearts
- Screen Energy
- Today's Goals
- Feed / Pat / Clean
- Current Look / Pet Looks
- Reward Shop link
- Family Boss link
- Child sidebar navigation

Current child dashboard UI direction:

- Magical, cozy, emotional, storybook aesthetic.
- Reduce giant empty whitespace.
- Keep the pet experience emotionally central.
- Improve lower-page anchoring so the page feels complete.
- Improve Current Look display and wrap long skin names cleanly.
- Move toward a balanced 3-column desktop composition where appropriate.

### Parent Dashboard

The parent side should feel like a clean control dashboard.

Completed route architecture:

- `/parent/dashboard` - overview and quick navigation
- `/parent/goals` - daily goal verification and goal setup
- `/parent/rewards` - stars, hearts, Screen Energy, and deduction controls
- `/parent/family-boss` - boss controls, bonus attacks, claiming rewards, next boss
- `/parent/screen-energy` - Screen Energy controls and reset
- `/parent/settings` - Parent PIN and settings

The parent layout uses a sidebar to move between these pages.

Rationale for the split:

- The old single scrolling parent page was too dense.
- Parent tasks are easier when grouped by responsibility.
- Daily use should be faster, clearer, and less visually cluttered.

The parent pages should not show large pet previews. The pet experience belongs mainly on the child side.

### Parent PIN

Completed:

- Landing page parent access PIN modal.
- Parent PIN stored in localStorage.
- Default fallback PIN exists for MVP setup.
- Parent can change the PIN in settings.

Security scope:

- This is child-resistant gating only.
- It is not real authentication.
- It should not be documented or treated as secure account protection.

### Reward Shop

The shop should teach value and delayed gratification.

It should include:

- Screen Energy items
- Pet Looks / curated skins
- Secret Egg
- Pet Collection / Choose Pet

Current responsive direction:

- Move away from mobile-only stacked layouts.
- Use desktop grids for shop sections and pet skin cards.
- Reduce vertical scrolling where possible.
- Keep purchase state, locked state, owned state, and worn state obvious.

### Family Boss Battle

The Family Boss Battle should make real-life goals feel meaningful.

The boss represents a family habit challenge. Children defeat bosses by completing real-life goals that are verified by the parent.

Children cannot manually attack the boss.

Current UX direction:

- Large boss hero card with bigger boss art.
- Strong HP bar and status badge.
- Recent family attack feed.
- Family contribution bars.
- Victory reward cards.
- Cozy magical boss-event feeling rather than a dry progress meter.
