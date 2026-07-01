# Chart Quest — Guardian System Synchronization Audit

**Date:** 2026-06-18 · **Scope:** `chart-quest.html` (game), `dashboard.html`, `/bosses/` assets
**Authoritative source for this pass:** the FINAL LOCKED roster supplied by the owner. Poster "BOSS-#" numbers are ignored; **artwork is authoritative**.

---

## Executive summary

The project currently contains **three overlapping Guardian naming layers**, only one of which is live, plus a roster that is **out of order versus the final lock** in three positions. The good news: the game already funnels identity through one object (`BOSS_CAST`) that rebuilds the other game-side tables at load, so a true single-source architecture is within reach with targeted changes rather than a rewrite.

Three structural problems drive almost every issue found:

1. **Roster order drift.** Three Guardians sit in the wrong slots vs. the final lock: Order-Block Golem (8→4), VWAP Oracle (4→6), Timeframe Titan (6→8). This ripples into lessons, weaknesses, portraits, realms, difficulty, and rewards.
2. **Dead/duplicate data.** The original `BOSSES` object still carries obsolete names and full quiz rounds that are overwritten or unused at runtime; the literal `BOSS_THEME` / `BOSS_GAMES` / `BOSS_WEAKNESS` blocks are overwritten by the rebuild and only sow confusion.
3. **Dashboard is stale.** The QA Center fallback (`defaultCat`) hardcodes the **oldest** name set (slot 0 = "THE MARKET MAKER", "THE FAKEOUT", "THE LIQUIDATOR", "THE STRUCTURE SHARK", "THE VWAP PHANTOM", "THE LEVERAGE KING", "THE LINE WARDEN", "THE FLAG BEARER", "THE NECKLINE REAPER", "THE KRAKEN"), and the live catalog payload omits realm/lesson/portrait/rank/position.

Additionally: **no Codex system exists yet** (0 references in either file). The spec's Codex panels, "Launch Codex Entry," and "Codex Updated" steps are **net-new builds**, not re-syncs.

---

## Part 8 — Issue register

| # | File | System | Issue | Severity | Recommended fix |
|---|------|--------|-------|----------|-----------------|
| 1 | chart-quest.html | Roster order | Order-Block Golem at slot 8, must be 4 | **Critical** | Move creature (identity+battle+lore+weakness+art+realm) to slot 4 in master |
| 2 | chart-quest.html | Roster order | VWAP Oracle at slot 4, must be 6 | **Critical** | Move creature to slot 6 |
| 3 | chart-quest.html | Roster order | Timeframe Titan at slot 6, must be 8 | **Critical** | Move creature to slot 8 |
| 4 | chart-quest.html | Identity | Slot 0 name "THE SPRAT DEALER" → final "THE GAMBLER" | High | Rename in master; lesson → gambling/impulse |
| 5 | chart-quest.html | Identity | Slot 1 "THE REVERSAL EEL" → final "THE FALSE BREAKOUT EEL" | High | Rename; lesson → fakeouts/liquidity grabs |
| 6 | chart-quest.html | Realms | All realm names are old (Casino Floor, The Grid, The Deep, The Haunt, The Tides, Throne Room, Citadel, Crypt, Abyss) | High | Add `realm` to master; rebuild sets `BOSS_THEME.arena = realm` |
| 7 | chart-quest.html | Lessons | No explicit `lesson` field; lesson only implied by rounds | High | Add `lesson` + `description` to master |
| 8 | /bosses/ | Assets | Portraits mapped by OLD slots: boss-4=Oracle, boss-6=Titan, boss-8=Golem | **Critical** | Re-map: boss-4=Golem, boss-6=Oracle, boss-8=Titan |
| 9 | chart-quest.html | Data hygiene | `BOSSES` literals carry obsolete names + dead quiz `rounds` + unused `bossHP`/`playerHP` | Medium | Names/emoji overwritten at load (OK); annotate `rounds`/HP as deprecated; keep only `reward` |
| 10 | chart-quest.html | Data hygiene | Literal `BOSS_THEME`/`BOSS_GAMES`/`BOSS_WEAKNESS` overwritten by rebuild → confusing duplicates | Medium | Convert literals to documented defaults; single source is master |
| 11 | chart-quest.html | Rewards | `reward` lives only in `BOSSES`, not in master | Medium | Add positional `reward` to master; rebuild feeds `BOSSES[k].reward` |
| 12 | dashboard.html | QA Center | `defaultCat` bossMeta = oldest obsolete names + wrong order | **Critical** | Rebuild fallback from final roster |
| 13 | chart-quest.html → dashboard | Catalog bridge | `catalog()` payload omits realm/lesson/portrait/rank/difficulty/position | High | Extend payload with full master fields |
| 14 | chart-quest.html / dashboard.html | Codex | No Codex system exists | High (scope) | Build Guardian Codex from master (game + dashboard) |
| 15 | dashboard.html | QA Center | No per-Guardian launch panel (intro/encounter/dialogue/battle/victory/defeat/codex) | High (scope) | Build Guardian QA panel from master |
| 16 | chart-quest.html | Presentation | Portraits render as hard rectangles; no living-portrait FX | Medium (scope) | Living Portrait + soft-edge/vignette/realm-color integration |
| 17 | chart-quest.html | Difficulty | Moved creatures carry difficulty tags authored for old slots | Medium | Retune round difficulty to new position while keeping lesson mini-game IDs |
| 18 | chart-quest.html | Rank | Ranks were creature-attached; should track progression position | Low | Assign rank by slot in master |

Severity key: **Critical** = wrong content reaches the player; High = visible inconsistency or required new system; Medium/Low = hygiene/polish.

---

## Table 1 — Guardian Master Table (FINAL, authoritative)

| Slot | Name | Realm | Lesson | Weaknesses | Rank | Art (creature) |
|------|------|-------|--------|-----------|------|----------------|
| 0 | The Gambler | Hall of Risks | Random trading, impulsive entries, gambling mentality | Structure, Trend | Plankton | top-hat dealer |
| 1 | The False Breakout Eel | Hall of Mirrors | Fakeouts, liquidity grabs, confirmation | Structure, Liquidity | Minnow | purple eel (full-res) |
| 2 | The Trend Crab | Structure Reef | Trend direction, higher highs, higher lows | Trend, Multi-TF | Crab | armored crab |
| 3 | The Structure Serpent | Broken Structure Canyon | Market structure, BOS, CHOCH | Structure, Order Blocks | Pufferfish | teal serpent |
| 4 | The Order Block Golem | Institutional Ruins | Order blocks, institutional footprints | Structure, Order Blocks | Octopus | stone block golem |
| 5 | The Risk Hydra | Liquidation Abyss | Risk management, position sizing, survival | Risk Mgmt, Trade Mgmt | Dolphin | red many-headed hydra |
| 6 | The VWAP Oracle | Mean Reversion Temple | VWAP, premium/discount, mean reversion | Trend, Multi-TF | Shark | purple jellyfish oracle |
| 7 | The Margin King | Throne of Leverage | Leverage, discipline, emotional control | Risk Mgmt, Trade Mgmt | Whale | crowned fish king |
| 8 | The Timeframe Titan | Chronos Depths | Multi-timeframe analysis | Multi-TF, Structure | Whale | armored trident titan |
| 9 | The Confluence Kraken | Confluence Crypt | Confluence, signal stacking, confirmation | Structure, Liquidity, Multi-TF | Leviathan | purple kraken |
| 10 | The Market Maker | The Abyss | Liquidity, manipulation, psychology, market mechanics | Risk Mgmt, Trade Mgmt, Multi-TF | Trader | hooded figure |

## Table 2 — Progression Table

| Slot | Guardian | Lives | Rounds | Difficulty band | Reward (shells / XP) | Unlock |
|------|----------|-------|--------|-----------------|----------------------|--------|
| 0 | The Gambler | 3 | 3 | beginner | 200 / 80 | start |
| 1 | False Breakout Eel | 3 | 3 | beginner→intermediate | 300 / 120 | clear 0 |
| 2 | Trend Crab | 3 | 3 | beginner→intermediate | 350 / 140 | clear 1 |
| 3 | Structure Serpent | 3 | 4 | intermediate | 400 / 160 | clear 2 |
| 4 | Order Block Golem | 3 | 5 | intermediate→advanced | 450 / 180 | clear 3 |
| 5 | Risk Hydra | 3 | 3 | intermediate→expert | 500 / 200 | clear 4 |
| 6 | VWAP Oracle | 3 | 4 | advanced | 600 / 250 | clear 5 |
| 7 | Margin King | 3 | 5 | advanced | 650 / 260 | clear 6 |
| 8 | Timeframe Titan | 3 | 4 | advanced→expert | 750 / 300 | clear 7 |
| 9 | Confluence Kraken | 2 | 6 | expert | 850 / 340 | clear 8 |
| 10 | Market Maker | 2 | 6 | expert | 1100 / 420 | clear 9 |

Lives and rewards stay **positional** (difficulty ramp). Rounds/lessons/weaknesses/art travel **with the creature**.

## Table 3 — Dashboard Mapping Table

| Dashboard surface | Current source | Problem | Fix |
|-------------------|----------------|---------|-----|
| QA boss list (live) | `catalog()` payload (name/emoji/rounds/arena) | Missing realm/lesson/portrait/rank/position | Extend payload from master |
| QA boss list (fallback) | `defaultCat().bossMeta` | Oldest obsolete names, wrong order | Rebuild from final roster |
| Lessons / levels lists | `defaultCat()` | Independent of Guardian roster (OK) | Leave; verify lesson labels |
| Codex panel | — | Does not exist | Build from master |
| Progression panel | — | Does not exist as Guardian view | Build from master Table 2 |

## Table 4 — QA Mapping Table (target Guardian QA panel)

| Card field | Source (master) | Buttons / dev tools |
|------------|-----------------|---------------------|
| Portrait | `portraitPath` | Launch Intro · Launch Encounter · Launch Dialogue |
| Name | `name` | Launch Battle · Launch Victory · Launch Defeat |
| Realm | `realm` | Launch Codex Entry |
| Lesson | `lesson` | Skip Round · Win · Lose Encounter |
| Difficulty | `difficultyBand` | Unlock · Reset Guardian |
| Position | slot index | View Guardian Data (raw master row) |

All 11 cards pull from a single `guardianMasterData` over the existing `cq-qa` bridge.

## Table 5 — Asset Mapping Table (portraits)

| File | Creature | OLD slot | FINAL slot | Action |
|------|----------|----------|-----------|--------|
| boss-0.webp | Gambler (top hat) | 0 | 0 | keep |
| boss-1.webp | False Breakout Eel | 1 | 1 | keep (full-res) |
| boss-2.webp | Trend Crab | 2 | 2 | keep |
| boss-3.webp | Structure Serpent | 3 | 3 | keep |
| boss-4.webp | **VWAP Oracle → replace with Golem** | 4 | — | **overwrite with Golem art** |
| boss-5.webp | Risk Hydra | 5 | 5 | keep |
| boss-6.webp | **Timeframe Titan → replace with Oracle** | 6 | — | **overwrite with Oracle art** |
| boss-7.webp | Margin King | 7 | 7 | keep |
| boss-8.webp | **Order Block Golem → replace with Titan** | 8 | — | **overwrite with Titan art** |
| boss-9.webp | Confluence Kraken | 9 | 9 | keep |
| boss-10.webp | Market Maker | 10 | 10 | keep |
| extra-abyssal-core.webp | "Final/Abyssal Core" | — | — | held aside, unused |

Net effect after remap: boss-4 = Golem, boss-6 = Oracle, boss-8 = Titan.

## Table 6 — Lesson Mapping Table

| Slot | Guardian | Lesson focus | Battle mini-game IDs (retuned to slot) |
|------|----------|--------------|----------------------------------------|
| 0 | Gambler | impulse/gambling vs. process | candle, predict, error |
| 1 | False Breakout Eel | fakeouts / liquidity grabs / confirmation | candle, error, predict |
| 2 | Trend Crab | trend direction, HH/HL | trend, support, resistance |
| 3 | Structure Serpent | structure, BOS, CHOCH | bos, choch, ob, liquidity |
| 4 | Order Block Golem | order blocks, institutional footprints | ob, bos, ob, pattern, exec |
| 5 | Risk Hydra | risk mgmt, position sizing, survival | sl, support, sl |
| 6 | VWAP Oracle | VWAP, premium/discount, mean reversion | vwap, support, resistance, vwap |
| 7 | Margin King | leverage, discipline, emotional control | rr, possize, fake, exec, exec |
| 8 | Timeframe Titan | multi-timeframe analysis | mtf, struct, mtf, predict |
| 9 | Confluence Kraken | confluence, signal stacking | pattern, choch, fake, mtf, exec, exec |
| 10 | Market Maker | liquidity, manipulation, psychology | exec, mtf, struct, pattern, fake, exec |

## Table 7 — Codex Mapping Table (to be built)

| Codex field | Source (master) |
|-------------|-----------------|
| Entry title | `name` + `realm` |
| Portrait | `portraitPath` (living-portrait treatment) |
| Lore | `lore` |
| Quote | `intro` |
| Lesson mastered | `lesson` |
| Weaknesses | `weak[]` |
| Rank | `rank` |
| Defeated state | `bossesDone` set membership |

---

## Recommended architecture

Promote `BOSS_CAST` to **`guardianMasterData`** — one object, 11 rows, every field the spec lists (id, name, realm, description, lesson, weaknesses, dialogue, quote, portraitPath, rank, unlock, miniGames, difficulty, codex, rewards, progressionPosition). `rebuildBossesFromCast()` stays the single place that derives the legacy runtime tables (`BOSSES` name/emoji/reward, `BOSS_THEME` visual+realm-name, `BOSS_GAMES`, `BOSS_WEAKNESS`) so **no consumer code changes** and **future edits touch one object only**. The dashboard consumes the same data over the existing `cq-qa` catalog bridge, with the fallback rebuilt from the final roster.

**Build order:** (1) master data + rebuild wiring, (2) portrait remap, (3) dashboard catalog + fallback, (4) Guardian QA panel, (5) Living Portrait + immersive integration, (6) Guardian Codex. Items 4–6 are net-new features layered on the synced foundation.
