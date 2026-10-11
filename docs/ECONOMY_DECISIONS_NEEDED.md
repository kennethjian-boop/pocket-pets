# Economy Decisions (resolved October 2026)

The owner decided the following; code, tests and docs now match.

| Topic | Decision | Where enforced |
| --- | --- | --- |
| Pet Catch | 2 hearts per 60-second round; **no stars or other currency**. Score and a device-local best score are shown. | `app/child/[childId]/pet-catch`, `lib/pet-catch-rules.ts` |
| Care (Feed/Pat/Clean) | Mood and reactions only — **no stars, hearts, Screen Energy, boss damage or egg progress**. | Migration `202610110001` redefines `perform_care_action_transaction` |
| Care limits | Feed 4, Pat 5, Clean 3 per day; cooldowns 60 s / 20 s / 120 s (unchanged). | Same function |
| Goals | Parent verification is the only way goals complete; verified goals keep their stars and boss damage. | `verify_daily_goal_transaction` (unchanged) |

**Until migration `202610110001` is applied, the live database still gives care-milestone stars**
(the browser cannot override a server function). See the owner actions in the PR.

Still documented, unchanged behaviour: verifying a goal adds +3 mood; uncleaned poop lowers the
displayed mood by 3 per hour after a 10-hour grace period; mood decays 10 points every 12 hours.
