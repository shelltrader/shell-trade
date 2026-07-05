# Boss Canon

**Status:** PERMANENT. The boss/Guardian systems. Boss progression is **protected** — see [protected_systems.md](protected_systems.md).

## Official boss systems
| System | Where | Role |
|---|---|---|
| **`GuardianTrial`** | 9948 | V2 — the boss trial that plays out on the LIVE Trade-Mode chart. **This is the boss engine of record.** |
| `chartTrial` | 10386 | Trial state (wick-swirl / on-chart mechanics) that `GuardianTrial` drives |
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

**Trap:** the deprecated object still parses and is readable. A boss task that greps for "boss HP / rounds" can land on it. Always route through `GuardianTrial` + the `bosses/` art + `BOSS_IDENTITY_SYSTEM_GDD.md`.

## Rules
- Do not change the **number of bosses, their order, their lesson mapping, or their difficulty** without an explicit request — it cascades into progression, gating, and the curriculum constitution.
- Boss art is character art → protected.
- Related audits (point-in-time, not canon): `docs/BOSS_MASTERY_AUDIT_v224.md`, `BOSS_CURRICULUM_ALIGNMENT_v222.md`, `GUARDIAN-TRIAL-FRAMEWORK.md`.
