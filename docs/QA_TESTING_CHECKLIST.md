# QA Testing Checklist

This document is used to manually test Pocket Pets.

Run locally with:

```bash
npm run dev
```

Use the active root `app/` routes. Do not test legacy `src/` pages.

## 1. General App Load

### Test

1. Run the app locally.
2. Open `/`.
3. Navigate to Ansel's child page: `/child/child-ansel`.
4. Navigate to Thea's child page: `/child/child-thea`.
5. Open parent access from the landing page.
6. Enter the Parent PIN.
7. Navigate between parent pages.
8. Navigate to Reward Shop.
9. Navigate to Family Boss Battle.

### Pass Criteria

- All pages load without crashing.
- Navigation works.
- Child data appears.
- Parent controls appear.
- Reward Shop appears.
- Boss page appears.
- No child page content is blocked by navigation.

## 2. Parent PIN Test

### Test

1. Open `/`.
2. Click parent access.
3. Enter an incorrect 4-digit PIN.
4. Confirm access is blocked.
5. Enter the current PIN.
6. Confirm parent dashboard opens.
7. Go to `/parent/settings`.
8. Change the PIN.
9. Return to `/` and verify the new PIN works.

### Pass Criteria

- Default fallback PIN works when no localStorage PIN exists.
- Incorrect PIN does not open parent pages from the landing modal.
- New PIN saves to localStorage key `pocket-pets-parent-pin`.
- Settings can update the PIN.
- Copy does not imply real authentication.

## 3. Parent Navigation Test

### Test

1. Open `/parent/dashboard`.
2. Click sidebar links:
   - Dashboard
   - Goals
   - Rewards
   - Family Boss
   - Screen Energy
   - Settings
3. Confirm each route loads.
4. Confirm active sidebar item is highlighted.

### Pass Criteria

- Sidebar appears on parent pages.
- Links route correctly.
- Active state is clear.
- Pages are focused by responsibility.

## 4. Child Navigation Test

### Test

1. Open `/child/child-ansel`.
2. Confirm child sidebar appears on desktop.
3. Click Home, Shop, Boss.
4. Confirm active item updates.
5. Repeat for `/child/child-thea`.
6. Test mobile width.

### Pass Criteria

- Desktop uses left sidebar.
- Mobile uses compact non-blocking nav.
- Links preserve `childId`.
- No fixed bottom nav blocks content.
- Switch User is visible.
- Pocket Pets branding is visible.

## 5. Child Dashboard Test

### Test

1. Open Ansel's child dashboard.
2. Check pet image appears.
3. Check pet name appears.
4. Check stars appear.
5. Check hearts appear.
6. Check Screen Energy appears.
7. Check today's goals appear.
8. Check Feed / Pat / Clean buttons appear.
9. Check Current Look section.

### Pass Criteria

- Pet displays correctly.
- Stats display correctly.
- Screen Energy is shown as a simple number.
- Goals are visible.
- Goals are read only.
- Child cannot verify goals.
- Current Look is readable.

## 6. Screen Energy Test

### Test

1. Go to `/parent/screen-energy`.
2. Add Screen Energy to Ansel.
3. Go to Ansel's child dashboard.
4. Confirm Screen Energy increased.
5. Add more Screen Energy multiple times.
6. Confirm there is no visible cap.
7. Go to Reward Shop.
8. Buy 1 Screen Energy item if Ansel has enough stars.
9. Buy 6 Screen Energy bundle if Ansel has enough stars.

### Pass Criteria

- Screen Energy increases correctly.
- Screen Energy displays as a simple number.
- There is no max cap like 5.
- 1 Screen Energy equals 10 minutes weekend screen time.
- 20 stars purchase adds +1 Screen Energy.
- 100 stars purchase adds +6 Screen Energy.
- Screen Energy does not affect pet mood.

## 7. Care Action Test

### Test

1. Open child dashboard.
2. Click Feed.
3. Click Pat.
4. Click Clean.
5. Watch for animation or feedback.
6. Keep clicking until daily limit is reached.

### Pass Criteria

- Feed works up to daily limit.
- Pat works up to daily limit.
- Clean works up to daily limit.
- After limit, friendly message appears.
- Care actions may affect comfort or mood.
- Care actions do not award stars.
- Care actions do not award Screen Energy.
- Care actions do not damage boss.
- Care actions do not increase Secret Egg progress.
- Care actions do not complete goals.

Daily limits:

- Feed: 2 times per day
- Pat: 5 times per day
- Clean: 1 time per day

## 8. Parent Goal Verification Test

### Test

1. Go to `/parent/goals`.
2. Find Ansel's daily goals.
3. Verify one goal.
4. Check Ansel's stars.
5. Check boss HP.
6. Check Secret Egg progress if Ansel has active egg.
7. Go to child dashboard.
8. Confirm goal shows completed.
9. Unverify the goal if needed.
10. Check whether stars, boss damage, and egg progress reverse safely.

### Pass Criteria

When parent verifies a goal:

- Goal becomes completed.
- Stars increase by goal reward.
- Boss HP decreases by goal damage.
- Secret Egg progress increases by 1 if active.
- Child dashboard updates.
- State persists after refresh.

When parent unverifies before egg hatch:

- Goal becomes incomplete.
- Stars reverse if supported.
- Boss damage reverses if supported.
- Egg progress reduces if supported.
- Hatched pet unlock is never undone.

## 9. Child Cannot Self Verify Goals Test

### Test

1. Open child dashboard.
2. Try to click or complete a goal.
3. Look for checkbox or completion button.

### Pass Criteria

- Child cannot complete goals.
- Child cannot self-award stars.
- Child cannot damage boss.
- Child sees a message like: "Ask a parent to check this when you are done."

## 10. Reward Shop Purchase Test

### Test

1. Give Ansel enough stars from `/parent/rewards`.
2. Go to Reward Shop as Ansel.
3. Buy 1 Screen Energy.
4. Buy 6 Screen Energy Bundle.
5. Try buying item without enough stars.

### Pass Criteria

- Successful purchase deducts correct stars.
- Successful purchase applies correct reward.
- Failed purchase does not deduct stars.
- Not enough stars shows friendly message.
- State persists after refresh.

## 11. Pet Looks / Skin Purchase Test

### Test

1. Give Ansel enough stars.
2. Go to Reward Shop.
3. Confirm skins are grouped by pet.
4. Buy a skin for Ansel's owned pet.
5. Wear the skin.
6. Remove the skin.
7. Try buying a skin for a locked pet.
8. Refresh page.

### Pass Criteria

- Skin costs 50 stars.
- Skin purchase deducts stars once.
- Purchased skin appears owned.
- Worn skin appears selected.
- Only one skin per pet is selected at a time.
- Removing skin returns pet to base mood visuals.
- Locked pet skins cannot be purchased.
- Skin state persists after refresh.
- Skins do not affect goals, rewards, Screen Energy, boss damage, or egg progress.

## 12. Deprecated Equipment Regression Test

### Test

1. Search active child UI for old equipment overlay purchase/equip flows.
2. Confirm Reward Shop uses Pet Looks / skins instead.
3. Confirm no active task asks for `ownedAccessories` or `equippedAccessories`.

### Pass Criteria

- Equipment overlay system is not presented as the current product path.
- Active shop UX is curated skins.
- No new feature depends on equipment overlays.

## 13. Secret Egg Purchase Test

### Test

1. Give Ansel at least 50 stars.
2. Go to Reward Shop.
3. Buy Secret Egg.
4. Confirm stars reduce by 50.
5. Confirm active egg appears.
6. Confirm egg progress starts at 0 / 10.
7. Try buying another Secret Egg before hatch.

### Pass Criteria

- Secret Egg costs 50 stars.
- Stars deduct correctly.
- activeEgg is created.
- Egg starts at 0 / 10.
- Child does not unlock pet immediately.
- Cannot buy another egg while one is active and unhatched.
- Failed second purchase does not deduct stars.

## 14. Secret Egg Progress Test

### Test

1. Ensure child has active unhatched Secret Egg.
2. Go to `/parent/goals`.
3. Verify one daily goal.
4. Check egg progress.
5. Verify more goals.
6. Refresh page.
7. Confirm progress persists.

### Pass Criteria

- Each unique parent-verified goal adds +1 egg progress.
- Same goal does not double count.
- Feed / Pat / Clean do not increase egg progress.
- Boss bonus attacks do not increase egg progress.
- Shop purchases do not increase egg progress.
- Progress persists after refresh.

## 15. Secret Egg Hatch Test

### Test

1. Ensure child has active egg.
2. Verify 10 unique parent-verified goals.
3. Watch for hatch message.
4. Check unlockedPets.
5. Go to Pet Collection.
6. Confirm new pet appears as unlocked.

### Pass Criteria

- Egg hatches at 10 / 10.
- One random locked pet is unlocked.
- Pet is not selected at purchase time.
- Pet is selected randomly at hatch time.
- Duplicate pet is not unlocked.
- activeEgg.hatched becomes true.
- activeEgg.unlockedPetId is set.
- Hatched pet remains unlocked after refresh.

## 16. Pet Collection / Choose Pet Test

### Test

1. Go to Pet Collection / My Pets section in Reward Shop.
2. View all pets.
3. Confirm locked and unlocked states.
4. Click Use Pet on an unlocked pet.
5. Go to child dashboard.
6. Refresh page.
7. Try selecting a locked pet if possible.

### Pass Criteria

- Bubbo, Luna, Mochi, and Ember appear.
- Locked pets show locked state.
- Unlocked pets show unlocked state.
- Active pet shows Current Pet.
- Use Pet button appears only for unlocked pets that are not active.
- Selecting pet updates activePetId.
- Child dashboard updates pet image and name.
- Refresh keeps selected pet.
- Locked pets cannot be selected.

## 17. Pet Mood Test

### Test

1. Open child dashboard during daytime.
2. Check default mood.
3. Use care actions.
4. Verify parent goal.
5. Check if pet can become happy.
6. Lower comfort if debug tool supports testing.
7. Check sad state.
8. Test night time if debug tool exists.

### Pass Criteria

- Daytime default is neutral.
- After care or verified goal, pet can become happy.
- If ignored by evening, pet can become sad.
- From 9 PM to 6 AM, pet should sleep.
- Screen Energy changes do not affect mood.
- Correct pet mood image appears for activePetId.
- If a skin is selected, the selected skin remains visually fixed.

## 18. Family Boss Damage Test

### Test

1. Go to child Family Boss page.
2. Note boss HP.
3. Go to `/parent/goals`.
4. Verify a child goal.
5. Return to Boss page.
6. Check HP.
7. Check attack history.

### Pass Criteria

- Verified goal damages boss.
- Boss HP decreases by goal bossDamage.
- Boss HP does not go below 0.
- Attack history records the action.
- Child cannot manually attack.
- Feed / Pat / Clean do not damage boss.

## 19. Family Boss Defeat Test

### Test

1. Damage boss until HP reaches 0.
2. Check boss status.
3. Check victory reward section.
4. Try claiming victory rewards from `/parent/family-boss`.

### Pass Criteria

- Boss HP stops at 0.
- Boss status becomes Defeated.
- Victory rewards become available.
- Only parent can claim victory rewards.
- Rewards are not automatically claimed by child.

## 20. Boss Victory Reward Test

### Test

1. Defeat boss.
2. Claim victory rewards from parent Family Boss page.
3. Check Ansel's stats.
4. Check Thea's stats.
5. Try claiming again.

### Pass Criteria

Each child receives:

- +20 stars
- +1 heart
- +1 Screen Energy

Also:

- Rewards can only be claimed once.
- Duplicate claim is blocked.
- State persists after refresh.

## 21. Start Next Boss Test

### Test

1. Defeat current boss.
2. Try starting next boss before claiming rewards.
3. Claim rewards.
4. Start next boss.
5. Check active boss name.
6. Repeat until roster wraps.

### Pass Criteria

- Cannot start next boss before claiming rewards.
- After rewards are claimed, next boss can start.
- Next boss rotates to the next boss in roster.
- It does not restart the same boss.
- After Delay Diva, it wraps back to Glitch Gremlin.
- HP resets to 100.
- defeated becomes false.
- rewardClaimed becomes false.

## 22. Family Boss UI Layout Test

### Test

1. Open child Family Boss page on desktop.
2. Confirm boss hero card and large boss art.
3. Confirm HP bar is readable.
4. Confirm recent attacks feed.
5. Confirm family contribution bars.
6. Confirm reward cards.
7. Resize to mobile.

### Pass Criteria

- Page feels like a cozy magical family event.
- HP and status are clear.
- Contributions are clear.
- Navigation does not block content.
- Mobile layout remains readable.

## 23. Reward Shop Responsive Test

### Test

1. Open Reward Shop on desktop.
2. Check Screen Energy shop.
3. Check Secret Egg section.
4. Check Pet Looks skin grids.
5. Check Pet Collection.
6. Resize to mobile.

### Pass Criteria

- Desktop uses balanced grid layouts where appropriate.
- Skin cards wrap cleanly.
- Long skin names do not overflow.
- Scrolling is reasonable.
- Navigation does not cover the bottom of content.

## 24. Persistence Test

### Test

1. Change Ansel's stars.
2. Change Thea's Screen Energy.
3. Buy a skin.
4. Wear a skin.
5. Change active pet.
6. Damage boss.
7. Change Parent PIN.
8. Refresh page.
9. Close and reopen browser tab.

### Pass Criteria

The following persist correctly:

- Stars
- Hearts
- Screen Energy
- activePetId
- unlockedPets
- ownedSkins
- activeSkins
- activeEgg
- completed goals
- boss HP
- boss defeated state
- rewardClaimed state
- Parent PIN

## 25. Old State / Safe Defaults Test

### Test

1. Clear localStorage.
2. Reload app.
3. Check app loads.
4. Inspect both children.
5. Check pet defaults.
6. Check shop and boss page.

### Pass Criteria

- App does not crash.
- Both children have valid state.
- Each child has at least one unlocked pet.
- activePetId is valid.
- screenEnergy defaults safely.
- ownedSkins defaults to empty array.
- activeSkins defaults safely.
- activeEgg defaults to null.
- Boss state loads safely.
- Parent PIN falls back to default.

## 26. Planned Hearts Mini-Game Rule Test

PLANNED / NEXT PHASE:

When mini-games are implemented, test:

1. Child spends 5 hearts.
2. Game starts with 10 minutes available.
3. Timer controls the session.
4. Current pet/current skin appears as avatar if applicable.
5. Finish or exit game.
6. Check all progression state.

Pass criteria:

- Game does not award stars.
- Game does not award hearts.
- Game does not award Screen Energy.
- Game does not damage boss.
- Game does not progress egg.
- Game does not complete goals.
- Game is fun-only.

## 27. Regression Checklist Before Moving On

Before considering a phase complete, confirm:

- App loads without crash.
- Child pages work.
- Parent pages work.
- Reward Shop works.
- Boss page works.
- Screen Energy is uncapped.
- Children cannot self-verify goals.
- Feed / Pat / Clean do not farm rewards.
- Secret Egg only progresses from parent-verified goals.
- Boss only takes damage from parent-verified goals or parent bonus attack.
- Skins remain visual only.
- Rewards persist after refresh.

## Golden QA Rule

Every feature should pass this basic loop:

Real-life goal completed  
-> Parent verifies  
-> Child earns progress  
-> Pet / shop / boss system responds  
-> State persists after refresh

If a feature allows children to farm meaningful rewards by clicking, it breaks the product design.
