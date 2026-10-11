# Economy Decisions Needed (Owner)

Status: open — October 2026. The redesign deliberately **did not change** any reward
amounts, prices, limits or pathways. Everything below describes what the code does
today versus what the docs say, so the owner can decide which is right.

## 1. Stars from Pet Catch

| Source | Rule |
| --- | --- |
| Code (`lib/pet-catch-rules.ts`) | 2 hearts per round. Every round earns stars: score 0–25 → 5, 26–50 → 10, 51–75 → 15, 76+ → 20 |
| `docs/PET_CATCH_GAME.md` | Score >50 → 5, >70 → 10, >100 → 15, >130 → 20 (and implicitly 0 below 51) |
| `APP_RULES.md` / `STATE_MODEL.md` | Mini-games must **not** generate stars or hearts |

Effect today: 2 hearts always become at least 5 stars, so hearts convert into stars.
Combined with parent heart rewards, this is a currency conversion pathway.

Decision needed: keep the flat 5-star floor, adopt the PET_CATCH_GAME.md tiers, or make
the game fun-only (no stars).

## 2. Stars from care actions

Code (Supabase RPC `perform_care_action_transaction`): each Feed/Pat/Clean adds +10 mood;
crossing into 80+ awards 1 star, reaching 100 awards 3 stars. APP_RULES documents this,
but PRODUCT_VISION and the earlier "Golden Rule" say care must not give stars.

Decision needed: confirm mood-milestone stars are intended.

## 3. Care limits

| Action | Code (server-enforced) | Docs |
| --- | --- | --- |
| Feed | 4/day, 60 s cooldown | 2/day |
| Pat | 5/day, 20 s cooldown | 5/day |
| Clean | 3/day, 120 s cooldown | 1/day |

The server limits are authoritative. Decision needed: update docs or change the RPC.

## 4. Undocumented mood effects

- Verifying a goal adds +3 mood (in the verification RPC).
- Uncleaned "poop" (auto-scheduled at 10:00 and 16:00 SGT) lowers the *displayed* mood by
  3 per hour after a 10-hour grace period.
- Mood decays 10 points every 12 hours (floor 30).

Decision needed: confirm these are intended so the docs can describe them.

## 5. Hearts' purpose

The Shop guide previously said "Hearts cannot be spent here"; Pet Catch spends them.
Docs plan "5 hearts = 10 minutes game time"; code charges 2 hearts per 60-second round.

## Bug fixed during the redesign (behaviour change, not an economy change)

Cleaned poop reappeared after a reload, because scheduled poop is generated on the device
and was never stored server-side; the care RPC only records the last Clean time. Now any
poop scheduled before the last Clean counts as cleaned. Prices and limits are unchanged.
