# Character Canon

**Status:** PERMANENT. Defines who the characters are and which implementation is official.

## Finn (the player character)
- **Official / Current / Approved:** the sprite Finn — see **[finn_canon.md](finn_canon.md)** (this doc does not restate it).
- **Deprecated:** `body.png`+`leg.png` rig, `walk-sheet.png`, procedural `drawTurtle` (fallback only).

## Boss roster — the 10 Guardians + the Market Maker
- **Official roster & art:** `bosses/boss-0.png … boss-10.png` (+ `.webp`), one per Guardian realm, culminating in the Market Maker finale. Identity/theme per boss is defined in `docs/BOSS_IDENTITY_SYSTEM_GDD.md` (design authority).
- **Current renderer:** `#bossFight` DOM stage + `BossArena` (18540) animated realm backgrounds. See **[boss_canon.md](boss_canon.md)**.
- **Approved:** exactly **11 named bosses**, fixed order, each mapped to one lesson category (`LESSON_MASTERY`).

### Deprecated / retired character data
| Item | Status |
|---|---|
| Legacy `rounds`/`bossHP`/`playerHP` object (9206) | ⛔ Deprecated — self-labeled "DO NOT treat as a Guardian source" |
| Previous/"drifted" boss roster (9525) | ⛔ Retired |

## Faction avatars (BTC/SOL/XRP/DOGE)
- **Official:** the faction picker (`cq_faction`) with the four assets described in `CFG`/faction data (~2600). Cosmetic identity for the traded ticker; does **not** change Finn.

## Rules
- Characters are **art + identity**, and fall under [protected_systems.md](protected_systems.md). Do not restyle Finn, the bosses, or the factions without an explicit request.
- Adding/removing a boss changes progression — see [progression_canon.md](progression_canon.md) and confirm before touching.
