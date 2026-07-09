# Boss Canon

**Status:** PERMANENT. The boss/Guardian systems. Boss progression is **protected** — see [protected_systems.md](protected_systems.md).

## Official boss systems
| System | Where | Role |
|---|---|---|
| **boss exam** (`openBoss` → `launchRound` → `bossRound`) | ~11189 | The boss IS a mini-game knowledge exam: an ordered playlist of `MG` rounds tied to the level's lesson category. **This is the boss engine of record.** |
| `#bossFight` DOM + `bfState` | 442 (CSS) + handlers | Boss fight UI: intro card, HP/hearts, win/lost states |
| `BossArena` | 18540 | Per-realm animated background (one `REALM` per Guardian, 0–10) |
| `triggerIntroBoss` | 16653 | Summons the intro boss |

## Approved roster
- **11 named bosses**, fixed order: 10 Guardians (realms 0–9) → the **Market Maker** (realm 10, finale).
- Art: `bosses/boss-0.png … boss-10.png` (+ `.webp`). Intros in `bosses/intros/`.
- Each Guardian maps to one **lesson category** (`LESSON_MASTERY`, 3714) and only tests concepts already taught (LEARN→PRACTICE→APPLY→TEST). Identity/theme authority: `docs/BOSS_IDENTITY_SYSTEM_GDD.md`.
- Boss can only be summoned once the level's trade gate is passed (`tradeGatePassed()`), never before the concept is taught.

## Deprecated / retired — DO NOT resurrect
| Item | Where | Why |
|---|---|---|
| Legacy `rounds`/`bossHP`/`playerHP` object | 9206 | Self-labeled `⚠ LEGACY OBJECT — DO NOT treat as a Guardian source`; the old round/HP model is **deprecated and unused** |
| Drifted/previous roster | 9525 | A hand-maintained copy had drifted to a previous roster; retired |

**Removed (build 251):** the flag-gated **Guardian Trial** movement gauntlet (`GuardianTrial` / `chartTrial` / `startGuardianSequence`) and its on-chart climb/descend/wick sub-trials were deleted — they were disabled by default (`?trials=1`) and no longer used. The boss is now the mini-game exam only.

**Trap:** the deprecated legacy object still parses and is readable. A boss task that greps for "boss HP / rounds" can land on it. Always route through `openBoss` / `bossRound` + the `bosses/` art + `BOSS_IDENTITY_SYSTEM_GDD.md`.

## Rules
- Do not change the **number of bosses, their order, their lesson mapping, or their difficulty** without an explicit request — it cascades into progression, gating, and the curriculum constitution.
- Boss art is character art → protected.
- Related audits (point-in-time, not canon): `docs/BOSS_MASTERY_AUDIT_v224.md`, `BOSS_CURRICULUM_ALIGNMENT_v222.md`. (`GUARDIAN-TRIAL-FRAMEWORK.md` describes the movement gauntlet removed in build 251 — historical only.)
