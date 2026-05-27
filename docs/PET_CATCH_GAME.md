# Pet Catch Game

## Purpose
Pet Catch Game is a 1-minute mini game inside Pocket Pets. It is designed as a short, fun reward activity for children.

## Entry Cost
Each play costs 2 Hearts.

If the child has fewer than 2 Hearts, they cannot start the game.

## Game Duration
Each round lasts exactly 60 seconds.

## Avatar
The playable avatar must use the child’s currently equipped pet/skin.

Do not hardcode Dragon Knight Bubbo.

## Items
Positive items:
- Star: +1
- Candy: +1
- Gem: +1
- Rainbow: +5

Negative item:
- Bomb: -2

Score cannot go below 0.

## Falling Speed
- 0–30s: slow speed, 0.5x
- 31–45s: medium speed, 0.75x
- 46–60s: fast speed, 1.2x

## Spawn Rate
The game should start easier with fewer falling items.
More items should appear toward the end of the round.

## Star Reward After Game
Final score converts into Star currency:

- Score > 50: 5 Stars
- Score > 70: 10 Stars
- Score > 100: 15 Stars
- Score > 130: 20 Stars

Use the highest eligible reward only.

Example:
Score 115 = 15 Stars, not 5 + 10 + 15.

## Important MVP Rules
- Hearts are spent to start the game.
- Stars are awarded only after the game ends.
- No Screen Energy rewards.
- No Boss Battle damage.
- No mission completion.
- No farming through Feed, Pat, or Clean.
- Game rewards must be parent-safe and capped by the 2 Heart entry cost.

## First Implementation Goal
Implement the game as a working MVP mini game using:
- current equipped pet/skin
- 2 Heart entry cost
- 60-second round
- score-based Star reward
- mobile and iPad friendly controls