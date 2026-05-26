# State Model

This MVP currently uses localStorage for persistence.

Do not introduce Supabase, backend persistence, API routes, or server auth unless explicitly requested.

The goal is to keep state simple, understandable, and easy to debug.

## Status Legend

- COMPLETED: implemented in the current MVP.
- ACTIVE REFACTOR: implementation exists or is being refined.
- PLANNED / NEXT PHASE: product direction that is not fully implemented yet.

## Main State Concepts

COMPLETED:

The app manages:

- Children
- Pets
- Daily goals
- Care actions
- Stars
- Hearts
- Screen Energy
- Reward Shop purchases
- Curated Pet Looks / skins
- Secret Egg
- Family Boss Battle
- Parent PIN

Deprecated:

- Equipment / accessory overlay state is no longer the active product direction.
- New work should use curated skins, not equipment overlays.

## Children

COMPLETED:

Current child ids in code:

- `child-ansel`
- `child-thea`

Each child has independent child dashboard state stored under a child-specific localStorage key.

Base child data lives in `lib/mock-data.ts`.

## Child Dashboard State

COMPLETED:

Current active state type lives in `lib/mission-state.ts`:

```ts
interface ChildDashboardState {
  stars: number;
  hearts: number;
  screenEnergy: number;
  activePetId: PetRosterItem['id'];
  activePetType: PetRosterItem['id'];
  unlockedPets: PetRosterItem['id'][];
  activeEgg: SecretEggState | null;
  eggMessage: string | null;
  comfort: number;
  completedMissions: Record<string, boolean>;
  ownedSkins: SkinId[];
  activeSkins: Record<PetType, SkinId | null>;
  dailyActionCounts: DailyActionCounts;
  lastActionTimestamps: LastActionTimestamps;
  careResetDate: string;
  patHeartAwarded: boolean;
  goalsDate: string;
}
```

Notes:

- `activePetId` and `activePetType` currently duplicate the same value for backward compatibility.
- Do not rename localStorage keys without a migration plan.
- Missing fields should be normalized with safe defaults.

## Pet Roster

COMPLETED:

`PET_ROSTER` lives in `lib/mock-data.ts`.

Current pets:

- `bubbo` - Bubbo
- `luna` - Luna
- `mochi` - Mochi
- `ember` - Ember

Rules:

- Every pet can be unlocked through Secret Egg.
- Child dashboard uses `activePetId`.
- If `activePetId` is invalid, fall back safely to the first unlocked pet.

## Pet Mood State

COMPLETED:

Mood is derived from current app state. Do not store derived mood permanently unless needed.

Mood inputs:

- Current time
- Child comfort
- Completed missions today
- Care actions today

Screen Energy must not be used in mood logic.

Mood priority:

1. Sleep
2. Sad
3. Happy
4. Neutral

Rules:

- Sleep: current time is between 9 PM and 6 AM.
- Sad: comfort < 35, or after 6 PM with no completed missions and no care actions.
- Happy: comfort >= 70 and at least one completed mission or care action today.
- Neutral: default daytime state.

Skin interaction:

- Base pets use mood images.
- Active curated skins are visually fixed.
- Skins do not create alternate mood states yet.

## Care Actions

COMPLETED:

Care actions are limited per day.

```ts
type DailyActionCounts = {
  feed: number;
  pat: number;
  clean: number;
};
```

Current daily limits:

- Feed: 2
- Pat: 5
- Clean: 1

Care actions must not affect:

- Stars
- Screen Energy
- Boss damage
- Egg progress
- Goal completion

Care actions may affect:

- Comfort
- Pet animation
- Speech bubble
- Mood

## Daily Goals

COMPLETED:

Goal completion is parent verified.

Daily goal templates live in `lib/mission-state.ts`.

Goal fields:

- id
- title
- description
- category
- starReward
- bossDamage

When a parent verifies a goal:

- Add goal id to completedMissions.
- Add goal.starReward to stars.
- Damage boss by goal.bossDamage.
- Add +1 egg progress if activeEgg exists and is not hatched.
- Save state.

When a parent unverifies a goal:

- Remove completed state.
- Reverse stars if supported by current flow.
- Reverse boss damage if supported by current flow.
- Reduce egg progress before hatch.
- Do not undo a hatched pet unlock.

## Goal Bank

COMPLETED:

Goal selection state is stored by child and date.

Current storage:

- `daily-goals-by-child`
- `daily-goal-setup`

Rules:

- Parent can select 3 goals for each child.
- If parent does not select, app can randomise 3 goals daily.
- Randomised goals stay the same for the day.
- Goals reset only when date changes.
- Parent can manually randomise goals.

## Secret Egg

COMPLETED:

```ts
interface SecretEggState {
  id: string;
  type: 'secret-egg';
  progress: number;
  requiredGoals: number;
  contributedGoalIds: string[];
  hatched: boolean;
  unlockedPetId: PetRosterItem['id'] | null;
}
```

Rules:

- Cost: 50 stars.
- Requires 10 parent-verified daily goals.
- Only parent-verified daily goals increase progress.
- Feed / Pat / Clean must not increase progress.
- Boss bonus attacks must not increase progress.
- Shop purchases must not increase progress.
- The egg unlocks one random locked pet at hatch time.
- Unverifying a goal can reduce egg progress only before hatch.
- Once the egg has hatched, do not undo the unlocked pet.

## Curated Pet Looks / Skins

COMPLETED:

Skin types and roster live in `lib/pet-skins.ts`.

```ts
type PetType = 'luna' | 'bubbo' | 'mochi' | 'ember';

interface PetSkin {
  id: SkinId;
  petType: PetType;
  name: string;
  imagePath: string;
  cost: number;
}
```

Current state fields:

```ts
ownedSkins: SkinId[];
activeSkins: Record<PetType, SkinId | null>;
```

Current cost:

- `SKIN_COST = 50`

Rules:

- Skins are visual only.
- Skins are only purchasable for owned pets.
- Purchasing a skin deducts 50 stars and adds it to `ownedSkins`.
- A child cannot buy the same skin twice.
- One selected skin per pet at a time.
- Active skin can be removed.
- Active skin is saved by pet type in `activeSkins`.
- Skins do not affect gameplay, rewards, boss damage, egg progress, goals, care limits, mood logic, or Screen Energy.

Current skin roster:

Bubbo:

- Astronaut Bubbo
- Dragon Knight Bubbo
- Forest Druid Bubbo
- Pirate Captain Bubbo
- Sakura Festival Bubbo

Luna:

- Candy Princess Luna
- Magical Idol Luna
- Moon Priestess Luna
- Rainbow Carnival Luna
- Royal Tea Party Luna

Mochi:

- Angel Mochi
- Forest Spirit Mochi
- Magical Idol Mochi
- Royal Prince Mochi
- Strawberry Shortcake Mochi

Ember:

- Aurora Spirit Ember
- Candy Witch Ember
- Celestial Guardian Ember
- Dragon Knight Ember
- Moonlight Sorcerer Ember

## Deprecated Equipment State

REMOVED / DEPRECATED:

The older equipment overlay model is not the active MVP direction.

Do not add new work based on:

- `ownedAccessories`
- `equippedAccessories`
- accessory overlays
- max equipped accessory slots

Reason:

- Overlay composition was inconsistent.
- Visual anchoring and scale were fragile.
- Every pet / mood / accessory combination would require too much testing.
- Curated skins are simpler and higher quality.

Note:

- Some legacy files such as `lib/accessory-config.ts` and `components/LunaPet.tsx` still exist but are not the current active product path.

## Shop Items

COMPLETED:

Shop sources:

- `lib/mock-data.ts` - Screen Energy rewards and Secret Egg item
- `lib/pet-skins.ts` - curated skin roster
- `app/child/[childId]/shop/page.tsx` - purchase UI and handlers

Current Screen Energy shop items:

- `screen-energy-1`: 20 stars -> +1 Screen Energy
- `screen-energy-6`: 100 stars -> +6 Screen Energy

Current Secret Egg item:

- `secret-egg`: 50 stars -> active egg, hatches after 10 parent-verified goals

## Family Boss State

COMPLETED:

Boss state lives in `lib/boss-battle.ts`.

```ts
type BossBattleState = {
  bossId: string;
  bossName: string;
  bossTheme: string;
  bossDescription: string;
  bossImage: string;
  maxHp: number;
  currentHp: number;
  startedAt: string;
  weekLabel: string;
  isDefeated: boolean;
  rewardClaimed: boolean;
  attacks: BossAttack[];
};
```

Attack history:

```ts
type BossAttack = {
  id: string;
  childId: string;
  childName: string;
  sourceType: 'mission' | 'parent_bonus';
  sourceId?: string;
  title: string;
  damage: number;
  createdAt: string;
};
```

Rules:

- Boss HP cannot go below 0.
- `isDefeated` becomes true when HP reaches 0.
- Children cannot manually attack.
- Feed / Pat / Clean must not damage boss.
- Parent-verified goals and parent bonus attacks can damage boss.

## Boss Roster

COMPLETED:

Current boss roster:

1. Glitch Gremlin
2. Sleepy Fog
3. Mess Monster
4. Grumble Golem
5. Delay Diva

Boss image paths live in `lib/boss-battle.ts`.

## Boss Reset / Next Boss

COMPLETED:

When starting the next boss:

- Require current boss to be defeated.
- Require victory rewards to be claimed.
- Move to next boss in `BOSS_ROSTER`.
- Wrap to first boss after the last boss.
- Reset HP to 100.
- Set defeated to false.
- Set rewardClaimed to false.

If rewards are not claimed, block the action.

## Boss Victory Rewards

COMPLETED:

When boss is defeated, parent can claim victory rewards once.

Each child receives:

- +20 stars
- +1 heart
- +1 Screen Energy

Rules:

- Only parent can claim.
- Rewards can only be claimed once.
- Prevent duplicate claiming.
- Save state after claiming.

## Parent PIN State

COMPLETED:

Parent PIN helpers live in `lib/parent-pin.ts`.

Current constants:

```ts
PARENT_PIN_KEY = 'pocket-pets-parent-pin';
PARENT_PIN_DEFAULT = '1234';
```

Rules:

- Landing page reads the PIN before allowing parent access.
- Settings page can update the PIN.
- This is localStorage-only child-resistant gating, not real authentication.
- Do not rename the key without migration.

## localStorage Keys

COMPLETED:

Current keys in active root app:

- `child-dashboard-state-child-ansel`
- `child-dashboard-state-child-thea`
- `daily-goals-by-child`
- `daily-goal-setup`
- `family-boss-battle-state`
- `pocket-pets-parent-pin`
- reward template key from `app/parent/_lib.ts`

Rules:

- Avoid creating many duplicate localStorage keys.
- Do not rename existing keys without a migration plan.
- Normalize missing fields and old shapes on load.

## Safe Defaults

COMPLETED:

When loading state from localStorage:

- Validate missing fields.
- Add safe defaults.
- Ensure each child has unlockedPets.
- Ensure each child has activePetId.
- Ensure screenEnergy is a non-negative number.
- Ensure ownedSkins is an array of valid skin ids.
- Ensure activeSkins only references owned valid skins.
- Ensure activeEgg is null or valid.
- Ensure daily action counts exist.

## Hearts Mini-Game State

PLANNED / NEXT PHASE:

No game state is implemented yet.

Planned product rule:

- 5 hearts = 10 minutes game time.

Mini-game state should stay separate from reward progression state.

Games must not write:

- stars
- hearts, except spending the entry cost if implemented
- Screen Energy
- boss attacks
- egg progress
- completed goals

Recommended first game:

- Pet Catch Game
- Current pet / skin avatar
- Falling items
- Timer
- Simple movement

## Golden Rule

Do not let the app become a click-farming game.

The meaningful progress loop must stay:

Real-life goal completed  
-> Parent verifies  
-> Child earns progress  
-> Pet / shop / boss system responds

Feed / Pat / Clean and future mini-games are for emotional connection only.
