# UI / UX Principles

This document defines the visual and experience direction for Pocket Pets.

The app has two different users:

1. Children
2. Parent

The UI should not treat both sides the same.

## Overall Design Goal

The app should feel:

- Cute
- Soft
- Warm
- Encouraging
- Child friendly
- Easy to understand
- Not overwhelming

The app is not a serious productivity dashboard for children.

It should feel like a small magical pet world that responds to real-life effort.

The parent side should be practical, cleaner, and faster.

## Child Experience

The child side should feel:

- Magical
- Cozy
- Emotional
- Storybook-like
- Rewarding
- Pet focused
- Simple enough for young children

The child should immediately understand:

- What pet they have
- How the pet feels, or what look the pet is wearing
- What goals they have today
- How many stars they have
- How many hearts they have
- How much Screen Energy they have
- What rewards they can work toward
- How the family boss battle is going

The child should not feel like they are using an admin dashboard.

## Parent Experience

The parent side should feel:

- Fast
- Clear
- Practical
- Clean
- Not cluttered
- Easy to operate daily

The parent should be able to quickly:

- Check Ansel's status
- Check Thea's status
- Verify goals
- Add or remove rewards
- Adjust Screen Energy
- See boss progress
- Claim victory rewards
- Start the next boss
- Change the Parent PIN

The parent pages should not be dominated by large pet visuals.

Pet experience belongs mainly on the child side.

## Visual Style

Use:

- Soft pastel backgrounds
- Warm gradients
- Rounded 2xl or 3xl cards where appropriate
- Large friendly buttons
- Gentle shadows
- Spacious layout
- Clear section titles
- Friendly iconography
- Encouraging microcopy

Avoid:

- Harsh dark UI
- Sharp corners
- Tiny text
- Too many controls in one place
- Dense admin table layouts
- Overly serious dashboard styling for child pages
- Too many competing colors
- Overly complex animations
- Decorative clutter that reduces readability

## Typography

Recommended font direction:

- Main font: Fredoka
- Fallback: Nunito or system rounded sans serif

The app should feel playful but still readable.

Use larger font sizes for children. Use clear labels for parent controls.

## Navigation Principles

### Parent Navigation

COMPLETED:

- Parent pages use a left sidebar.
- Sidebar links between:
  - `/parent/dashboard`
  - `/parent/goals`
  - `/parent/rewards`
  - `/parent/family-boss`
  - `/parent/screen-energy`
  - `/parent/settings`
- Active route should be clear.
- Sidebar should be practical, compact, and readable.

### Child Navigation

COMPLETED / ACTIVE REFACTOR:

- Floating bottom navigation is removed from active child pages because it blocked content.
- Desktop child pages should use a left sidebar similar to the parent sidebar.
- Child sidebar can be slightly more magical/playful, but still clean.
- Mobile should use a compact top/stacked nav that does not block content.

Required child nav items:

- Home
- Shop
- Boss
- Switch User
- Pocket Pets branding

Navigation must preserve the current `childId`.

## Layout Principles

### Child Pages

Child pages should prioritize:

1. Pet visual / current look
2. Child's current rewards
3. Today's goals
4. Pet care actions
5. Reward Shop and Family Boss access

Current child dashboard composition goals:

- Reduce giant empty whitespace.
- Keep the pet as the emotional center.
- Improve dashboard balance.
- Improve lower-page anchoring.
- Improve Current Look section.
- Wrap long skin names cleanly.
- Move toward a balanced 3-column desktop composition where appropriate.

### Parent Pages

Parent pages should prioritize:

1. The specific parent task for that route
2. Fast scanning
3. Clear action feedback
4. Low decoration

The parent route split should keep each page focused:

- Dashboard: overview
- Goals: verification and setup
- Rewards: reward/deduction controls
- Family Boss: boss control
- Screen Energy: screen time bank control
- Settings: PIN/settings

## Child Dashboard UI Rules

The child dashboard should show:

- Pet image
- Pet name
- Pet mood or selected skin
- Pet status message
- Stars
- Hearts
- Screen Energy
- Today's goals
- Feed / Pat / Clean buttons
- Current Look / Pet Looks
- Reward Shop link
- Family Boss link
- Pet Collection / My Pets access through shop

Important:

- Goals are read only on child page.
- Child should see whether a goal is pending or completed.
- Child should see a hint like: "Ask a parent to check this when you are done."

## Parent Page UI Rules

Parent pages should avoid:

- Large pet previews
- Too much decoration
- Too many nested cards
- Confusing reward buttons
- Hidden important controls

The parent should be able to use these pages quickly.

## Reward Shop UI Rules

The Reward Shop should teach value and delayed gratification.

The shop should clearly show:

- Item name
- Item cost
- Item benefit
- Whether item is available
- Whether item is already owned
- Whether child has enough stars
- What happens after purchase

Screen Energy items should explain:

- 1 Screen Energy = 10 minutes weekend screen time
- 6 Screen Energy bundle is better value

Secret Egg should explain:

- Costs 50 stars
- Does not hatch immediately
- Requires 10 parent-verified goals
- Unlocks one random new pet

Pet Looks / skins should show:

- Pet group
- Skin image
- Cost
- Owned state
- Worn state
- Locked state if pet is not owned

Responsive direction:

- Prefer desktop grid layouts where space allows.
- Use responsive pet skin grids.
- Reduce vertical scrolling.
- Keep card spacing readable and not overly wide.

## Pet Looks / Skin UI Rules

COMPLETED:

Equipment overlays are deprecated. Use curated Pet Looks / skins.

Skin UI should communicate:

- Skins are visual only.
- Skins cost 50 stars.
- Skins can only be bought for owned pets.
- One selected skin per pet at a time.
- Base pet mood images return when no skin is selected.

Do not imply skins affect:

- Goals
- Rewards
- Boss damage
- Egg progress
- Screen Energy
- Care limits
- Mood logic

## Pet Collection UI Rules

Pet Collection / My Pets should show:

- All pets in the roster
- Locked pets
- Unlocked pets
- Current active pet
- Use Pet button for unlocked pets

For locked pets:

- Show locked state.
- Show helper message: "Hatch a Secret Egg to unlock."

The child should feel excited to unlock more pets.

## Family Boss UI Rules

Family Boss Battle should feel like a shared family mission.

The page should clearly show:

- Boss image
- Boss name
- Boss theme
- Boss story
- HP bar
- Status badge
- Recent family attacks
- Family contribution bars
- Victory rewards
- How to help

Current UX direction:

- Boss hero card
- Larger boss art
- Improved HP bar
- Contribution bars
- Recent family attack feed
- Reward cards
- Cozy magical boss-event feeling

The child should understand:

- They help by completing real-life goals.
- Parent must verify the goal.
- Verified goals damage the boss.
- The family wins together.

## Parent PIN UX Rules

COMPLETED:

- Parent access uses a PIN modal on the landing page.
- Parent can change PIN in settings.
- Copy should make this feel like parent access, not bank-level security.

Do not overstate the security scope. It is child-resistant only.

## Feedback and Animation

Important actions should have visible feedback.

Examples:

- Stat number pulse when stars change
- Toast message after purchase
- Button press animation
- Pet bounce after care action
- Boss HP damage label
- Success message after goal verification
- Egg hatch celebration
- Pet changed message
- Skin bought / worn / removed message

Do not leave users guessing whether something worked.

## Microcopy Style

Use warm, simple, encouraging language.

Good examples:

- "Great effort!"
- "Ask a parent to check this when you are done."
- "Your pet feels happy!"
- "You earned 5 stars!"
- "The boss took 10 damage!"
- "Your Secret Egg is hatching!"
- "You unlocked a new pet!"
- "You need more stars for this reward."

Avoid:

- Technical language
- Punishing language
- Long explanations
- Harsh error messages

## Mobile Responsiveness

The app should work on mobile, even if desktop is easier during development.

Mobile rules:

- Cards should stack vertically.
- Buttons should be large enough to tap.
- Text should remain readable.
- Parent controls should not become too cramped.
- Child pet card should stay visually prominent.
- Navigation must not block page content.

## Hearts Mini-Game UX

PLANNED / NEXT PHASE:

Hearts will become mini-game currency.

Planned rule:

- 5 hearts = 10 minutes game time.

Games should feel:

- Light
- Fun
- Optional
- Short
- Rewarding without being addictive

Games must not generate:

- Stars
- Hearts
- Screen Energy
- Boss damage
- Egg progress
- Goal progress

Recommended first game:

- Pet Catch Game with current pet/current skin as avatar.

## MVP Design Discipline

Do not polish endlessly before the core flow works.

Priority order:

1. Product logic works.
2. State persists correctly.
3. User can understand what happened.
4. UI is clean and usable.
5. Visual polish comes after.

Do not sacrifice product clarity for decoration.

## Golden UI Rule

Child page = magical pet world.

Parent pages = practical control dashboard.

Reward Shop = delayed gratification and value.

Family Boss = shared family mission.

Mini-games = fun-only heart-funded rewards, not progression engines.
