# App Rules

This document is the source of truth for Pocket Pets MVP rules.

Do not break these rules during implementation.

## Status Legend

- COMPLETED: implemented in the current MVP.
- ACTIVE REFACTOR: direction already started and should be preserved.
- PLANNED / NEXT PHASE: product direction that is not fully implemented yet.

## Core Safety Rules

COMPLETED:

- Children cannot self-verify goals.
- Children cannot manually attack the boss.
- Children cannot claim boss rewards.
- Children cannot self-award stars, hearts, or Screen Energy.
- Parent verification is the core source of meaningful progress.
- Feed / Pat / Clean must not become reward farming.

## Reward Types

COMPLETED:

1. Stars
2. Hearts
3. Screen Energy

## Stars Rules

COMPLETED:

Stars are the main shop currency.

Children earn stars through:

- Parent-verified goals
- Parent rewards
- Family Boss victory rewards

Children spend stars in the Reward Shop on:

- Screen Energy
- Pet Looks / curated skins
- Secret Egg

When a shop purchase succeeds:

- Deduct the correct number of stars.
- Apply the purchased item.
- Save state to localStorage.
- Show clear feedback.

When a shop purchase fails:

- Do not deduct stars.
- Show a friendly message explaining why.

## Hearts Rules

COMPLETED:

- Hearts represent pet bond and affection.
- Hearts are visible on child and parent pages.
- Hearts can be awarded through parent rewards and Family Boss victory rewards.
- Hearts currently have limited spending purpose.

PLANNED / NEXT PHASE:

- Hearts become mini-game currency.
- Planned rule: 5 hearts = 10 minutes of game time.
- Games are fun-only reward experiences.
- Games must not generate stars.
- Games must not generate hearts.
- Games must not generate Screen Energy.
- Games must not damage the boss.
- Games must not progress eggs.
- Games must not complete or progress goals.

Recommended first mini-game:

- Pet Catch Game.
- Use the current pet / current skin as avatar.
- Falling items, simple movement, timer-based gameplay.
- Keep implementation React-friendly and simple.

## Screen Energy Rules

COMPLETED:

Screen Energy is a weekly weekend screen time bank.

It is not pet energy.

Important rules:

- Screen Energy accumulates across the week.
- Screen Energy displays as a simple number.
- Do not display it as 4/5 or 5/5.
- There is no fixed max cap.
- 1 Screen Energy = 10 minutes weekend screen time.
- Screen Energy does not affect pet mood.
- Screen Energy is not earned from Feed, Pat, or Clean.
- Screen Energy can be earned through parent rewards, boss rewards, or shop purchases.

Example:

Screen Energy: 6  
Meaning: 60 minutes weekend screen time

## Care Action Rules

COMPLETED:

Care actions are:

- Feed
- Pat
- Clean

Care actions should be fun pet interactions, not reward farming systems.

Feed / Pat / Clean must not:

- Give stars
- Give Screen Energy
- Damage the boss
- Increase Secret Egg progress
- Hatch the Secret Egg
- Count as goal completion

Care actions may:

- Slightly improve pet comfort
- Trigger animations
- Trigger speech bubbles
- Trigger hearts, sparkles, bubbles, or small visual effects
- Affect mood within limits

Current anti-spam rules:

- Feed: max 2 times per day
- Pat: max 5 times per day
- Clean: max 1 time per day
- Cooldowns prevent rapid repeated clicking

When the daily limit is reached, show a friendly message only.

## Today's Goals Rules

COMPLETED:

Children can see today's goals but cannot complete them by themselves.

Child page goals are read only.

The child page should show a hint such as:

> Ask a parent to check this when you are done.

Each goal should have:

- id
- title
- description
- category
- starReward
- bossDamage

Parent verification of a goal should:

- Mark the goal completed
- Award starReward
- Damage boss by bossDamage
- Increase Secret Egg progress if child has an active unhatched egg
- Save state to localStorage
- Update child dashboard

Parent unverification of a goal should:

- Mark goal incomplete
- Reverse stars if supported
- Reverse boss damage if supported
- Reduce egg progress if the egg has not hatched
- Never undo a pet unlock after the egg has hatched

## Goal Bank Rules

COMPLETED:

- The app supports a Goal Bank.
- Parent can select 3 goals for each child.
- If parent does not choose, the app can randomise 3 goals daily for each child.
- Randomised goals stay the same for the day.
- Randomised goals do not change on refresh.
- Goals reset when date changes.
- Parent can manually randomise.

Goal categories may include:

- reading
- kindness
- chores
- self-care
- learning
- calm
- family

## Pet Mood Rules

COMPLETED:

Current pets:

- Bubbo
- Luna
- Mochi
- Ember

Each base pet uses mood images:

- neutral
- happy
- sad
- sleep / sleepy

Screen Energy must not affect pet mood.

Mood priority:

1. Sleep
2. Sad
3. Happy
4. Neutral

Mood logic:

- Sleep: show sleep if current time is between 9 PM and 6 AM.
- Sad: show sad if not sleeping and comfort < 35, or after 6 PM when completed missions today = 0 and care actions today = 0.
- Happy: show happy if not sleeping, not sad, comfort >= 70, and either completed missions today > 0 or total care actions today > 0.
- Neutral: default daytime state.

Skin interaction:

- Base pets use the mood system.
- Selected curated skins remain visually fixed.
- Skins are visual only and do not affect mood, rewards, goals, eggs, boss damage, or gameplay.

## Family Boss Battle Rules

COMPLETED:

The Family Boss Battle is a shared family challenge.

Core rules:

- One active boss at a time.
- Boss HP starts at 100.
- Parent-verified goals damage boss.
- Default daily goal damage can be 10.
- Parent bonus attacks can also damage boss.
- Children cannot manually attack.
- Feed / Pat / Clean do not damage boss.
- Boss HP cannot go below 0.
- Boss is defeated at 0 HP.
- Parent claims victory rewards once.
- Child page is read only.

Victory rewards:

Each child receives:

- +20 stars
- +1 heart
- +1 Screen Energy

Boss victory rewards must only be claimed once.

If rewards have already been claimed, prevent duplicate claiming.

## Boss Roster Rules

COMPLETED:

Boss roster order:

1. Glitch Gremlin
2. Sleepy Fog
3. Mess Monster
4. Grumble Golem
5. Delay Diva

When the boss is defeated and parent starts the next boss:

- Rotate to the next boss in the roster.
- Do not restart the same boss.
- If the current boss is the last boss, wrap back to the first boss.

If victory rewards are not claimed, Start Next Boss should be disabled or blocked.

## Boss Status Rules

COMPLETED:

- 76 to 100 HP: Strong
- 41 to 75 HP: Wobbling
- 1 to 40 HP: Weak
- 0 HP: Defeated

## Reward Shop Rules

COMPLETED:

Shop item types:

1. Screen Energy
2. Pet Looks / curated skins
3. Secret Egg
4. Pet Collection / Choose Pet

Screen Energy items:

- 20 stars = +1 Screen Energy
- 100 stars = +6 Screen Energy

The 100 star bundle should teach better value and delayed gratification.

## Curated Pet Looks / Skin Rules

COMPLETED:

Equipment overlays are deprecated and removed from the active MVP direction.

Why equipment was removed:

- Visual overlays were inconsistent across pets.
- Composition and anchoring were fragile.
- Scaling across multiple pets and many permutations became too complex.
- Curated full-look skins give better visual quality and simpler state.

Skin behavior:

- Each skin costs 50 stars.
- Skins are only purchasable for owned pets.
- A child can own many skins.
- One selected skin per pet at a time.
- A selected skin can be removed to return to base mood images.
- Skins are visual only.
- Skins do not affect gameplay, rewards, boss damage, egg progress, goals, care limits, or Screen Energy.
- Base pets still use mood images.
- Selected skins remain visually fixed rather than mood-reactive.

Current curated skins:

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

Future scalability rationale:

- New looks can be added as curated art files and `SKIN_ROSTER` entries.
- No need to test every accessory overlay against every mood and pet pose.
- The skin system keeps monetization/reward decisions separate from gameplay balance.

## Secret Egg Rules

COMPLETED:

Secret Egg is a high value delayed gratification item.

Rules:

- Cost: 50 stars.
- Buying Secret Egg does not immediately unlock a pet.
- Buying Secret Egg creates activeEgg for that child.
- Egg requires 10 cumulative parent-verified daily goals to hatch.
- Feed / Pat / Clean do not increase egg progress.
- Boss bonus attacks do not increase egg progress.
- Shop purchases do not increase egg progress.
- Only parent-verified daily goals increase hatch progress.
- Each verified goal = +1 egg progress.
- Parent unverifying a goal can reduce progress if egg has not hatched.
- Once hatched, do not undo the pet unlock.

Secret Egg edge cases:

- If child already has an active unhatched egg, cannot buy another.
- If child owns all pets, Secret Egg is unavailable.
- If not enough stars, no purchase and no deduction.

## Secret Egg Unlock Rules

COMPLETED:

The Secret Egg unlocks one random pet that the child does not currently own.

Important:

- Do not unlock pets in fixed order.
- Choose random locked pet only when the egg hatches.
- Do not choose the random pet at purchase time.
- Do not unlock a duplicate pet.

At hatch time:

1. Get all pets in PET_ROSTER.
2. Filter pets not in child.unlockedPets.
3. Randomly choose one locked pet.
4. Add chosen pet to unlockedPets.
5. Set activeEgg.hatched = true.
6. Set activeEgg.unlockedPetId = chosen pet id.
7. Show celebration message.

## Pet Collection Rules

COMPLETED:

After a pet is unlocked, child can switch pets in the shop's Pet Collection / My Pets area.

For each pet:

If unlocked:

- Show pet image.
- Show pet name.
- Show description.
- Show Unlocked.
- If active, show Current Pet.
- If not active, show Use Pet button.

If locked:

- Show locked state.
- Show helper text: Hatch a Secret Egg to unlock.

When child clicks Use Pet:

- Check pet is in unlockedPets.
- Set activePetId.
- Save to localStorage.
- Show feedback.

Child dashboard should use activePetId to show:

- Correct pet name
- Correct pet image
- Correct mood image folder
- Correct pet description

## Parent Dashboard Rules

COMPLETED:

The parent dashboard has been split from one giant scrolling page into focused routes:

- `/parent/dashboard`
- `/parent/goals`
- `/parent/rewards`
- `/parent/family-boss`
- `/parent/screen-energy`
- `/parent/settings`

Sidebar behavior:

- Sidebar appears on parent pages.
- Active route is highlighted.
- Parent can move between task areas without losing the overall parent context.

Page responsibilities:

- Dashboard: overview, child stats, quick navigation cards.
- Goals: daily goal verification, manual/random/auto goal setup.
- Rewards: stars, hearts, Screen Energy, deductions, custom templates.
- Family Boss: boss controls, bonus attacks, victory rewards, next boss.
- Screen Energy: weekly screen time bank controls and reset.
- Settings: Parent PIN and app settings.

Rationale:

- The old parent page was too dense and hard to scan.
- Splitting by responsibility improves daily parent workflow.
- Parent UX should be clean, practical, and fast.

## Parent PIN Rules

COMPLETED:

- Landing page has a parent access PIN modal.
- PIN is localStorage-based.
- Current key: `pocket-pets-parent-pin`.
- Default fallback PIN: `1234`.
- Parent can change PIN inside `/parent/settings`.

Security scope:

- This is child-resistant only.
- This is not real authentication.
- Do not describe it as secure account protection.
- Do not add backend auth unless explicitly requested.

## Child Navigation Rules

COMPLETED / ACTIVE REFACTOR:

- Floating bottom navigation is being removed from child pages because it blocked Reward Shop and Family Boss content and was poor on desktop.
- Child pages use a left sidebar on desktop, similar in structure to the parent sidebar but more magical/playful.
- Mobile uses a compact top navigation that does not block content.

Required child nav items:

- Home -> `/child/[childId]`
- Shop -> `/child/[childId]/shop`
- Boss -> `/child/[childId]/family`

Rules:

- Preserve childId in all child links.
- Show active page clearly.
- Include Pocket Pets branding.
- Include Switch User.
- Navigation must not overlap or block content.

## Child Page Rules

COMPLETED / ACTIVE REFACTOR:

Child pages should be magical and motivating.

They should show:

- Pet avatar
- Pet name
- Pet mood or selected skin
- Pet status
- Stars
- Hearts
- Screen Energy
- Today's Goals
- Feed / Pat / Clean care actions
- Current Look / Pet Looks
- Reward Shop link
- Family Boss link
- Child sidebar navigation

Children can see goals.

Children cannot verify goals.

Children should see completed or pending state based on parent verification.

Current UI direction:

- Reduce giant empty whitespace.
- Keep dashboard balanced and anchored.
- Improve Current Look readability.
- Wrap long skin names.
- Favor a balanced desktop composition while staying responsive on mobile.

## Reward Shop Responsive Rules

ACTIVE REFACTOR:

- Move away from mobile-only stacked layouts.
- Use desktop grid layouts where appropriate.
- Use responsive pet skin grids.
- Reduce unnecessary vertical scrolling.
- Keep cards readable and action states obvious.

## Family Boss UX Rules

COMPLETED / ACTIVE REFACTOR:

Family Boss should feel like a cooperative family event.

Current page direction:

- Boss hero card
- Larger boss art
- Improved HP bar
- Contribution bars
- Recent family attack feed
- Victory reward cards
- Cozy magical boss event feeling

The page should communicate:

- The family is working together.
- Real-life goals make meaningful progress.
- Children contribute, but parents verify and claim rewards.

## Golden Rule

Do not let the app become a click-farming game.

The meaningful progress loop must stay:

Real-life goal completed  
-> Parent verifies  
-> Child earns progress  
-> Pet / shop / boss system responds

Feed / Pat / Clean and future mini-games are for emotional connection and celebration only.
