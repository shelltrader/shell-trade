# Progression Canon

**Status:** PERMANENT. Levels, gating, and save. Progression + lesson order are **protected** — see [protected_systems.md](protected_systems.md).

## Official progression shape
- **10 Guardian levels → Market Maker finale.** Fixed order.
- Each level: teach a concept → practice → **≥3 applied trades** → Guardian test. Gated by `conceptTier(key)` (4870) and `tradeGatePassed()`.
- Lesson→category map: `LESSON_MASTERY` (3714). Lesson data: `LESSONS` (4419). Teach order is the curriculum constitution — **never test the untaught.**

## Official save model
- **Primary:** `localStorage`, `cq_*` keys. **Versioned** keys (`cq_*_v`) exist so a bumped version invalidates stale saved state — respect this pattern when adding state.
- Key families (non-exhaustive): `cq_faction`, `cq_played`, `cq_lesson`, `cq_max`, `cq_flow`, `cq_firstwin_v`, `cq_traded_v`, `cq_lossmsg_v`, `cq_minigames_v`, `cq_mgseen_*`, `cq_content_*`, `cq_px_*` (cached price), `cq_music`, `cq_pid`.
- **Telemetry (not save):** `ContentLog.emit(...)` → Supabase `ingest` edge function → `player_mastery` table. Analytics only; the game must boot and play with Supabase offline (there is an offline stub, 1607–1626).
- **Auth:** Supabase `signInWithPassword`; "Play as Guest" path must always work.

## Approved economy (in-game only)
- Shells (`player.shells`) + leverage tiers are the in-game economy. **This is not real money.** Real-money monetization is a **stub / not implemented** — see [system_inventory.md](system_inventory.md) §8. Do not wire a paywall without an explicit request.

## Deprecated
| Item | Status |
|---|---|
| Leverage-on-onboarding, coin-based unlock popups | ⛔ Removed for onboarding (reintroduced later in advanced lessons) |
| Order-block launch pads, movement combo scoring | ⛔ Retired (see [gameplay_canon.md](gameplay_canon.md)) |

## Rules
- Changing level count, lesson order, gating thresholds, or save-key semantics is a **progression change** — confirm scope first; it can silently break existing players' saves and the curriculum guarantees.
- When adding saved state, use a **versioned `cq_*_v` key** and default gracefully when absent.
