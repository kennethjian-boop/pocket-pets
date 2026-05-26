# Pocket Pets — Master Blueprint v1

## Current MVP Status

See the implementation update at the end of this document and the focused docs in `/docs` for current route, navigation, skin, PIN, and mini-game direction. Older sections in this blueprint are strategy context and may mention deprecated systems such as equipment overlays.

---

## Project Overview

Pocket Pets is a family-focused gamified behaviour reinforcement web app designed primarily for young children.

The core purpose is not to create a game addiction or productivity tracker.

The purpose is to:

* reinforce positive habits
* reduce family friction
* encourage emotional regulation
* make responsibility enjoyable
* strengthen parent-child connection
* encourage teamwork between siblings
* make routines feel magical instead of forced

The app combines:

* virtual pets
* reward systems
* streak systems
* family boss battles
* emotional progression

while keeping screen interaction intentionally short and lightweight.

Pocket Pets should feel emotionally warm, safe, playful, calm, and rewarding.

It should NEVER feel like:

* school homework software
* behaviour punishment software
* addictive mobile gaming
* overstimulating children entertainment
* transactional parenting

---

# Core Product Philosophy

## 1. The App Supports Parenting

The app is an assistant to parenting.

It should never replace:

* praise
* conversations
* emotional coaching
* family bonding

The app helps create consistency and emotional reinforcement.

---

## 2. The App Should Reinforce Real Life

The goal is NOT to keep children inside the app.

The goal is to motivate:

* better routines
* kindness
* responsibility
* cooperation
* emotional regulation

The app should encourage children to leave the screen and engage with real life.

Maximum ideal interaction time:

* 3 to 5 minutes per session

---

## 3. Emotional Attachment Is More Important Than Rewards

Children should emotionally care about:

* their pet
* their streaks
* their world
* family progress

The emotional layer is more important than:

* numerical rewards
* currency optimization
* grinding systems

---

## 4. Encourage Positive Identity Formation

The app should subtly reinforce identity.

Examples:

* kind children unlock healer pets
* brave children unlock knight pets
* readers unlock wizard pets
* consistent children unlock guardian pets

The app should reinforce:
“I am a kind and responsible person.”

not:
“I do things only for rewards.”

---

## 5. Gentle Consequences Over Harsh Punishment

The app should avoid:

* guilt-heavy punishment
* dramatic negative animations
* manipulative emotional systems
* fear-based reinforcement

Instead:

* pets become sleepy
* worlds pause progression
* pets become low energy
* adventures pause temporarily

Consequences should feel natural and emotionally safe.

---

# Core User Types

## Parent User

Primary controller of the system.

Responsibilities:

* reward behaviour
* remove points calmly
* manage rewards
* manage streaks
* configure systems
* review behaviour trends

Parent UX priorities:

* extremely fast
* low friction
* minimal typing
* mobile-friendly
* calm and uncluttered

---

## Child User

Experiences the magical world.

Children should:

* interact with pets
* view progress
* feed pets
* see streaks
* spend rewards
* participate in family quests

Children should NOT:

* configure rewards
* directly manage points
* view punishment systems
* access admin controls

---

# Core Systems

# 1. Stars System ⭐

Primary common currency.

Used for:

* feeding pets
* screen energy
* small rewards
* cosmetic unlocks
* mini interactions

Stars are earned through:

* routines
* chores
* reading
* kindness
* listening
* emotional regulation

Stars should be:

* easy to earn
* frequently visible
* emotionally rewarding

Avoid excessive deduction systems.

---

# 2. Hearts System ❤️

Rare premium emotional currency.

Hearts are ONLY earned for:

* kindness
* honesty
* bravery
* emotional regulation
* helping sibling
* perseverance

Hearts unlock:

* rare pet evolutions
* special cosmetics
* legendary eggs
* family events
* milestone rewards

Purpose:
Teach that character traits matter more than chores.

---

# 3. Screen Energy System 🔋

Screen time should NOT be shown as raw minutes everywhere.

Instead:
Children earn “Screen Energy.”

Examples:

* 1 battery = 10 minutes
* daily storage cap
* partial expiration to prevent hoarding

Purpose:

* soften conflict around screen time
* make usage visual and finite
* reduce direct parent-child negotiation

---

# 4. Pet System 🐣

Each child owns their own pet.

Pets are the emotional anchor of the app.

Pets should:

* blink
* bounce slightly
* react emotionally
* evolve over time
* have moods

Pets should NEVER:

* die
* become disturbing
* emotionally guilt children

Pet moods:

* happy
* sleepy
* excited
* calm
* low energy

Pet interaction time should remain intentionally short.

---

# 5. Streak System 🔥

One of the most important systems.

Examples:

* reading streak
* brushing teeth streak
* calm morning streak
* kindness streak
* no shouting streak

Streaks should feel:

* visually exciting
* emotionally meaningful
* motivating without pressure

Streak rewards:

* eggs
* cosmetics
* special pet forms
* mystery rewards

---

# 6. Family Quest & Boss System 👾

Shared family progression system.

Purpose:
Encourage teamwork instead of sibling rivalry.

Family contributes toward:

* boss battles
* village progression
* gardens
* castles
* adventures

Examples:

* Dust Monster
* Sleep Dragon
* Tantrum Slime

Bosses are defeated through:

* kindness
* cooperation
* routines
* emotional regulation

Rewards:

* movie nights
* outings
* desserts
* family activities

---

# Parent App Structure

## Parent Dashboard

Displays:

* all children
* stars
* hearts
* streaks
* pet moods
* screen energy
* recent activity

---

## Quick Reward Actions

Most important UX feature.

Parent should reward behaviour in under 2 seconds.

Examples:

Positive:

* +5 Good Listening
* +10 Reading
* +5 Calm Down
* +8 Helped Family
* +10 Kind To Sibling

Negative:

* -5 Screaming
* -8 Hitting
* -5 Not Listening

Minimal typing required.

---

## Reward Management

Parent configures:

* reward costs
* screen energy rules
* special unlocks
* streak rewards

---

## Behaviour Timeline

Simple historical view.

Shows:

* rewards given
* deductions
* streak changes
* important milestones

Purpose:
Observe trends over time.

---

## Parent Security

Protected via:

* pin
* password
* biometrics

Children should never access admin controls.

---

# Child App Structure

## Home Page

Displays:

* pet
* mood
* stars
* hearts
* screen energy
* streaks
* today’s missions

Simple and visual.

---

## Pet Interaction Page

Short daily interaction.

Actions:

* feed
* pat
* clean
* collect daily gift

Interaction should remain under 5 minutes.

---

## Rewards Shop

Children spend stars on:

* screen energy
* treats
* unlockables
* cosmetics
* small rewards

---

## Family Quest Page

Displays:

* active boss
* progress bar
* family contribution
* unlock rewards

---

# UX/UI Design Philosophy

Pocket Pets should visually feel like:

* Nintendo
* Duolingo
* Tamagotchi
* cozy mobile games

NOT:

* enterprise dashboards
* educational portals
* overstimulating games

---

## Visual Rules

Use:

* rounded corners
* soft gradients
* large buttons
* expressive characters
* calm spacing
* minimal text
* large touch targets

Avoid:

* clutter
* dense text
* excessive menus
* flashing visuals
* hyper stimulation

---

## Child UX Principles

Children should:

* understand screens immediately
* never feel overwhelmed
* always know what to tap

Interaction should feel:

* rewarding
* warm
* simple
* calm

---

## Parent UX Principles

Parent UX must prioritize:

* speed
* low friction
* clarity
* quick rewarding
* mobile usability

Parent should never feel burdened by the system.

---

# Technical Architecture

## Frontend

* Next.js App Router
* TypeScript
* Tailwind CSS
* Framer Motion

---

## Backend

* Supabase

Used for:

* authentication
* database
* storage
* realtime sync

---

## Hosting

* Vercel

---

## Animation Strategy

Initial MVP:

* CSS animations
* simple motion
* lightweight interactions

Later:

* Lottie animations
* richer pet interactions

Avoid heavy game engines.

---

# Database Overview

Core tables:

## users

Parent accounts.

## children

Child profiles.

## pets

Pet states and progression.

## rewards_log

History of rewards and deductions.

## streaks

Habit streak tracking.

## rewards

Configurable rewards.

## family_quests

Shared quest progression.

---

# MVP Scope

# Phase 1

Build ONLY:

* authentication
* parent dashboard
* child pages
* stars system
* screen energy system
* simple pet
* streaks
* family boss
* reward shop

Purpose:
Validate emotional engagement and behaviour reinforcement.

---

# Phase 2

Add:

* pet evolutions
* sound effects
* hearts system
* cosmetics
* better animations

---

# Phase 3

Potential future additions:

* AI-generated stories
* bedtime summaries
* adaptive quests
* voice interactions

Do NOT build these early.

---

# Anti-Goals

Pocket Pets should NEVER become:

* addictive screen entertainment
* competitive sibling ranking app
* punishment-heavy behaviour tracker
* productivity optimization app
* overly complicated economy simulator
* noisy or overstimulating game

---

# Development Principles

## 1. Build Incrementally

Never overbuild early.

Validate:

* emotional attachment
* habit reinforcement
* parent usability
* child engagement

before expanding scope.

---

## 2. Prioritize UX Over Features

A smaller polished experience is better than a massive unfinished system.

---

## 3. Keep Parent Friction Extremely Low

If rewarding behaviour feels troublesome, the system will fail.

---

## 4. Keep Child Sessions Short

The app should support real life.
Not replace it.

---

## 5. Emotional Warmth Over Efficiency

Children should feel:

* encouraged
* proud
* safe
* connected

Never manipulated.

---

# App Navigation Architecture

# Parent App Navigation

The parent experience should feel:

* fast
* calm
* highly efficient
* mobile-first
* low friction

Bottom navigation structure:

## 1. Dashboard

Main overview page.

Displays:

* all children
* pet moods
* stars
* hearts
* streaks
* screen energy
* quick stats

Purpose:
Instant understanding of family state.

---

## 2. Rewards

Primary interaction page.

Parent can:

* reward behaviour
* deduct points
* trigger bonuses
* add notes

This is likely the MOST frequently used page.

Must optimize for:

* one-handed use
* quick taps
* minimal typing

---

## 3. Family Quest

Displays:

* active family boss
* progress
* contribution tracking
* unlock rewards

Purpose:
Encourage teamwork.

---

## 4. History

Displays:

* behaviour logs
* streak changes
* rewards history
* milestone achievements

Purpose:
Help parent observe trends.

---

## 5. Settings

Manage:

* reward costs
* child profiles
* pet settings
* screen energy rules
* authentication
* security

---

# Child App Navigation

The child experience should feel:

* magical
* playful
* extremely simple
* emotionally warm

Children should always understand:

* where they are
* what they can do
* what they earned

Avoid complicated navigation.

---

## 1. My Pet

Primary home screen.

Displays:

* pet
* pet mood
* stars
* hearts
* streaks
* screen energy

Primary actions:

* feed
* pat
* clean
* interact

This should be the emotional center of the app.

---

## 2. Missions

Displays:

* daily habits
* streak progress
* completed tasks
* positive milestones

Children DO NOT claim rewards themselves.
Parent controls rewards.

Purpose:
Build awareness and motivation.

---

## 3. Reward Shop

Displays:

* rewards
* unlockables
* cosmetics
* screen energy purchases

Purpose:
Teach delayed gratification and choices.

---

## 4. Family Quest

Displays:

* current boss
* family progress
* contribution animations
* reward previews

Purpose:
Encourage sibling cooperation.

---

# Detailed Parent User Flow

# Morning Flow

Parent opens app.

Quickly rewards:

* waking on time
* brushing teeth
* calm behaviour

Total interaction target:
under 30 seconds.

---

# After School Flow

Parent quickly logs:

* reading
* homework
* kindness
* emotional behaviour

Parent may trigger:

* screen energy rewards
* streak bonuses

---

# Night Flow

Parent checks:

* family quest progress
* streak continuation
* reward eligibility

Optional:
Short encouragement message.

---

# Detailed Child User Flow

# Daily Child Session

Ideal session length:
3–5 minutes.

Child opens app.

Sees:

* pet animation
* mood
* stars
* streak
* family quest progress

Child:

* feeds pet
* pats pet
* views progress
* spends rewards if desired
* checks family boss

Session ends naturally.

No infinite gameplay loops.

---

# Emotional Reinforcement System

Pocket Pets should consistently reinforce:

* pride
* connection
* responsibility
* teamwork
* consistency

The app should frequently celebrate:

* effort
* emotional growth
* kindness
* improvement

NOT just achievement.

---

# Notification Philosophy

Notifications should remain:

* gentle
* minimal
* emotionally positive

Examples:

* Mochi is excited to see you.
* Your kindness streak is growing.
* The family almost defeated the Dust Monster.

Avoid:

* guilt-heavy reminders
* excessive notifications
* aggressive retention tactics

---

# Security & Access Rules

## Parent Access

Protected by:

* Face ID
* biometric
* pin
* password

Parent-only areas:

* reward management
* deductions
* settings
* analytics

---

## Child Access

Child-safe simplified experience.

Children cannot:

* modify rewards
* access admin pages
* alter balances
* bypass restrictions

---

# MVP Technical Priorities

# Priority 1

Authentication.

Must support:

* single parent account
* multiple children profiles
* secure admin separation

---

# Priority 2

Reward logging system.

Must be:

* extremely fast
* realtime updating
* mobile optimized

---

# Priority 3

Pet state system.

Must support:

* mood changes
* animations
* interaction tracking
* progression

---

# Priority 4

Family quest progression.

Must support:

* shared progression
* contribution tracking
* reward unlocks

---

# Codex Collaboration Rules

## 1. Build Small Iterations

Never ask Codex to:

* build entire app
* redesign everything
* overengineer systems

Instead:

* one page
* one feature
* one refinement
* one test cycle

---

## 2. Preserve UX Simplicity

Codex prompts should always reinforce:

* minimal clutter
* large touch targets
* calm visual hierarchy
* emotional warmth
* low parent friction

---

## 3. Validate Before Expanding

Every major feature should first answer:

* do children emotionally engage?
* does it reduce household friction?
* does parent continue using it consistently?

Only expand after validation.

---

## 4. Avoid Premature Complexity

Do NOT build early:

* multiplayer systems
* AI systems
* advanced economies
* complex inventories
* social systems
* open worlds

Keep focus on:

* habits
* emotions
* simplicity
* family connection

---

# Detailed MVP Application Architecture

# Frontend Structure

Framework:

* Next.js App Router
* TypeScript
* Tailwind CSS
* Framer Motion

Project philosophy:

* beginner friendly
* modular but not overengineered
* clean folder structure
* scalable incrementally

---

# Proposed App Route Structure

# Public Routes

## Landing Page

Route:
/

Purpose:

* simple app introduction
* parent login entry
* future marketing page

---

## Login Page

Route:
/login

Purpose:

* parent authentication
* secure access

---

# Protected Parent Routes

## Parent Dashboard

Route:
/parent/dashboard

Displays:

* child cards
* stars
* streaks
* pet moods
* quick stats

---

## Rewards Management

Route:
/parent/rewards

Purpose:

* reward actions
* deduct actions
* quick interaction buttons

Most frequently used parent page.

---

## Family Quest Management

Route:
/parent/family

Purpose:

* manage current boss
* configure rewards
* monitor progress

---

## History & Analytics

Route:
/parent/history

Purpose:

* behaviour logs
* reward history
* streak history

MVP analytics should remain intentionally lightweight.

---

## Parent Settings

Route:
/parent/settings

Purpose:

* child profiles
* rewards setup
* screen energy rules
* authentication settings

---

# Child Routes

## Child Home

Route:
/child/[childId]

Purpose:

* main child experience
* pet display
* quick overview

---

## Child Pet Interaction

Route:
/child/[childId]/pet

Purpose:

* feed pet
* clean pet
* interact with pet

---

## Child Missions

Route:
/child/[childId]/missions

Purpose:

* streak tracking
* daily habits
* completed achievements

---

## Child Reward Shop

Route:
/child/[childId]/shop

Purpose:

* spend stars
* unlock rewards
* cosmetic purchases

---

## Child Family Quest

Route:
/child/[childId]/family

Purpose:

* view boss progression
* contribution animations
* shared achievements

---

# Core Component Structure

# Shared Components

## Navigation Components

* BottomNav
* TopHeader
* PageContainer

---

## Card Components

* ChildCard
* PetCard
* RewardCard
* QuestCard
* StreakCard

---

## Feedback Components

* RewardAnimation
* StarPopup
* SuccessToast
* MoodBubble

---

## Interaction Components

* RewardButton
* DeductionButton
* FeedButton
* ScreenEnergyButton

---

# Parent-Specific Components

## Quick Reward Panel

Very high priority.

Should support:

* rapid taps
* configurable reward presets
* low friction usage

---

## Child Overview Grid

Displays:

* mood
* stars
* streaks
* energy
* quick actions

---

# Child-Specific Components

## Animated Pet Display

MVP animation goals:

* blinking
* bouncing
* emotional state changes

Avoid heavy rendering systems.

---

## Daily Progress Display

Simple visual progress.

Should prioritize:

* clarity
* encouragement
* simplicity

---

# Detailed Database Schema

# users

Stores parent accounts.

Fields:

* id
* email
* created_at

---

# children

Stores child profiles.

Fields:

* id
* user_id
* name
* avatar_color
* created_at

---

# pets

Stores pet states.

Fields:

* id
* child_id
* pet_name
* pet_type
* mood
* hunger_level
* cleanliness_level
* evolution_stage
* animation_state
* updated_at

---

# balances

Stores currencies.

Fields:

* id
* child_id
* stars_balance
* hearts_balance
* screen_energy
* updated_at

---

# reward_logs

Stores reward history.

Fields:

* id
* child_id
* action_type
* value
* category
* note
* created_at

Examples:

* positive reward
* deduction
* bonus
* streak reward

---

# streaks

Stores streak tracking.

Fields:

* id
* child_id
* streak_type
* current_count
* best_count
* updated_at

---

# rewards

Stores configurable rewards.

Fields:

* id
* user_id
* reward_name
* cost_stars
* reward_type
* enabled

---

# family_quests

Stores active boss progression.

Fields:

* id
* user_id
* quest_name
* progress
* target
* reward_description
* status

---

# family_contributions

Tracks child contribution.

Fields:

* id
* family_quest_id
* child_id
* contribution_value
* contribution_type
* created_at

---

# Authentication Architecture

# Parent Authentication

Handled through Supabase Auth.

Methods:

* email/password
* magic link later if desired

---

# Child Access Model

Children do NOT log in separately initially.

Simpler MVP approach:

* parent enters child mode
* child accesses simplified interface

This reduces:

* complexity
* password management
* friction

---

# State Management Strategy

Initial MVP:

* React state
* server actions
* Supabase queries

Avoid adding:

* Redux
* Zustand
* complex architecture

early.

---

# Storage Strategy

Initial storage needs:

* optional pet assets
* future unlockable images
* reward icons

Handled through:

* Supabase Storage

---

# Animation Strategy

# MVP Animation Principles

Animations should feel:

* cozy
* soft
* emotionally alive

Avoid:

* chaotic movement
* overstimulation
* excessive particle effects

---

# Recommended MVP Animations

## Pet Animations

* idle bounce
* blinking
* sleeping
* happy wiggle

---

## Reward Feedback

* star popups
* gentle confetti
* glow effects

---

# Implementation Order

# Phase 1A — Foundation

Build:

* Next.js app setup
* Tailwind setup
* Supabase connection
* authentication
* protected routes

Goal:
Working secure foundation.

---

# Phase 1B — Parent Dashboard

Build:

* dashboard UI
* child cards
* balances
* quick reward system

Goal:
Fast parent interaction flow.

---

# Phase 1C — Child Experience

Build:

* child homepage
* pet display
* stars
* streak display
* screen energy display

Goal:
Emotional engagement.

---

# Phase 1D — Family Quest

Build:

* boss system
* progress tracking
* contribution system

Goal:
Sibling teamwork reinforcement.

---

# Phase 1E — Polish

Build:

* animations
* transitions
* responsive polish
* small delight moments

Goal:
Make app emotionally enjoyable.

---

# Success Metrics

Pocket Pets MVP succeeds if:

## Parent Side

* parent consistently uses app daily
* rewarding behaviour feels easy
* household friction reduces

---

## Child Side

* children voluntarily check pets
* children care about streaks
* children discuss quests/pets
* children show emotional attachment

---

## Family Side

* more cooperation
* less negotiation
* routines become smoother
* more positive reinforcement moments

---

## Current MVP Implementation Update - 2026-05-26

This blueprint contains older long-form product thinking. Preserve it as strategy context, but use this update plus the focused docs in `/docs` as the current implementation truth.

### COMPLETED

- Root `app/` is active. Do not use `src/` for current work.
- Parent dashboard has been split into focused routes:
  - `/parent/dashboard`
  - `/parent/goals`
  - `/parent/rewards`
  - `/parent/family-boss`
  - `/parent/screen-energy`
  - `/parent/settings`
- Parent pages use a left sidebar for navigation.
- Landing page has a simple Parent PIN modal.
- Parent PIN is localStorage-based:
  - key: `pocket-pets-parent-pin`
  - default fallback: `1234`
  - editable in `/parent/settings`
- Parent PIN is child-resistant only. It is not real authentication.
- Child routes are:
  - `/child/[childId]`
  - `/child/[childId]/shop`
  - `/child/[childId]/family`
- Current seeded child ids are `child-ansel` and `child-thea`.
- Child pages now use a sidebar / compact mobile nav direction instead of the old floating bottom nav.
- Family Boss uses a richer boss-event layout: hero card, larger boss art, HP bar, attack feed, contribution bars, and reward cards.
- Reward Shop supports Screen Energy, Secret Egg, Pet Collection, and curated Pet Looks / skins.

### REMOVED / DEPRECATED

- The old equipment overlay system is deprecated and should not be extended.
- Do not build new product work around `ownedAccessories`, `equippedAccessories`, accessory slots, or overlay composition.
- Reason: overlays had inconsistent visuals, anchoring/scaling problems, and too many pet/mood/accessory permutations.

### CURRENT PET LOOKS / SKINS

Curated skins replaced equipment overlays.

Current rules:

- 50 stars each.
- Only purchasable for owned pets.
- One selected skin per pet at a time.
- Base pets still use mood images.
- Selected skins remain visually fixed.
- Skins are visual only.
- Skins do not affect gameplay, rewards, boss damage, egg progress, goals, care limits, or Screen Energy.

Current pets:

- Bubbo
- Luna
- Mochi
- Ember

Current skin groups:

- Bubbo: Astronaut, Dragon Knight, Forest Druid, Pirate Captain, Sakura Festival
- Luna: Candy Princess, Magical Idol, Moon Priestess, Rainbow Carnival, Royal Tea Party
- Mochi: Angel, Forest Spirit, Magical Idol, Royal Prince, Strawberry Shortcake
- Ember: Aurora Spirit, Candy Witch, Celestial Guardian, Dragon Knight, Moonlight Sorcerer

### ACTIVE REFACTOR

- Child dashboard polish: magical/cozy/storybook feel, less empty whitespace, stronger lower-page anchoring, improved Current Look section, wrapped skin names, and balanced desktop composition.
- Reward Shop responsive polish: desktop grids, responsive skin cards, less vertical scrolling, clearer spacing.
- Child navigation polish: sidebar on desktop, compact non-blocking nav on mobile.

### PLANNED / NEXT PHASE

- Hearts become mini-game currency.
- Planned rule: 5 hearts = 10 minutes game time.
- Mini-games are fun-only reward experiences, not progression systems.
- Games must not generate stars, hearts, Screen Energy, boss damage, egg progress, or goal progress.
- Recommended first mini-game: Pet Catch Game using current pet/current skin as avatar, falling items, simple movement, and timer-based play.

---
