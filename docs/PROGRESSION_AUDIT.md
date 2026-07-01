# Chart Quest — Progression Audit
### Findings only — no code changed. Review before any fixes.

Audit of the full journey, first launch → The Market Maker (Boss 10), against the
current (post-rebalance) curriculum, concept-unlock system, and Guardian data.

**Headline:** the foundation is sound and the data model has a single source of truth
(`BOSS_CAST`), but **two Guardians test concepts their world hasn't taught yet**, **ChoCh
has no lesson**, there are **stale duplicate data blocks** (old boss-name comments and a
mislabelled intro-boss comment), and the **dashboard hard-codes a copy of the boss/lesson
data** that has already drifted on Boss 10.

---

## 1. Full progression map

How it runs today: Guardian **N fires after Hour N** is cleared (`openBoss(session.level)`).
A concept's chart label unlocks when the player **reaches** its hour (plain words) and
turns professional once the world is **cleared** (`conceptTier`). Live boss rounds come
from `BOSS_CAST.rounds` (everything else is overwritten by `rebuildBossesFromCast`).

| Hour / World | Title | Lessons taught (focus) | Concept unlocked | → Guardian (after hour) | Live boss rounds | Aligned? |
|---|---|---|---|---|---|---|
| 0 · Onboarding | (intro flow) | candle colour (flash quiz), prediction bet | candle | **0 · The Gambler** 🎲 | candle, predict, error | OK (intro) |
| 1 | YOUR FIRST TRADES | candles_intro, long_vs_short, candle_close | confirmation | **1 · False-Breakout Eel** 🌀 | candle, error, predict | ✅ |
| 2 | TREND & LEVELS | what_is_trend, support_resist | trend, S/R | **2 · Trend Crab** 🦀 | trend, support, resistance | ✅ |
| 3 | MARKET STRUCTURE | bos | bos, (choch) | **3 · Structure Serpent** 🐉 | bos, choch, **ob, liquidity** | ❌ |
| 4 | THE BIG-PLAYER ZONES | ob, sweep | ob, sweep | **4 · Order-Block Golem** 🧱 | ob, bos, ob, **pattern**, exec | ❌ |
| 5 | MANAGE YOUR RISK | what_is_sl, risk_reward | risk | **5 · Risk Hydra** 🐙 | sl, support, sl | ✅ |
| 6 | THE FAIR-VALUE LINE | vwap, vwap_trade | vwap | **6 · VWAP Oracle** 🔮 | vwap, support, resistance, vwap | ✅ |
| 7 | LEVERAGE & EDGE | leverage_intro, risk_reward | leverage | **7 · Margin King** 👑 | rr, possize, fake, exec, exec | ⚠️ (no leverage round) |
| 8 | ZOOM OUT | htf, htf_align | htf | **8 · Timeframe Titan** 🌊 | mtf, struct, mtf, predict | ✅ |
| 9 | CHART PATTERNS | bull_patterns, bear_patterns | patterns | **9 · Confluence Kraken** 🦑 | pattern, choch, fake, mtf, exec | ✅ |
| 10 | CONFLUENCE MASTERY | confluence | confluence | **10 · The Market Maker** 🎩 | confluence quiz + trend read | ✅ |

**Data-model health (all verified):**
- `BOSS_CAST` is the single source of truth. `rebuildBossesFromCast()` overwrites
  `BOSSES`, `BOSS_THEME` (realm), `BOSS_GAMES` (rounds + lives) and `BOSS_WEAKNESS` from it.
- `guardianUnlock(N)` = "Defeat \<Guardian N-1\>" (sequential) — consistent.
- `guardianRow(N)` exports name, realm, lesson, weaknesses, rank, difficulty, lives,
  rounds, reward, portrait, dialogue, lore, unlock state — all from `BOSS_CAST`.
- All 19 mini-game round IDs (`candle, predict, error, trend, support, resistance, bos,
  choch, ob, liquidity, sl, vwap, rr, possize, fake, exec, mtf, struct, pattern`) exist in
  the live mini-game registry — **no broken boss/QA launches.**
- `conceptTier` gating is internally consistent: BOS/OB/ChoCh/sweep labels, the setup
  banner, the setup-zone box and the OB framing are all hidden until their world.

---

## 2. Detected issues

### 🔴 Critical — a boss tests un-taught concepts

**Issue A — Boss 3 (Serpent) tests Order Blocks + liquidity before Hour 4.**
Its rounds are `bos, choch, ob, liquidity`. After Hour 3 the player has learned **bos**
only. **ob** and **liquidity (sweep)** belong to Hour 4 (the very next world); **choch**
has no lesson at all (see Gap below). So 3 of 4 rounds test material the player hasn't met.

**Issue B — Boss 4 (Golem) tests a chart pattern before Hour 9.**
Its rounds are `ob, bos, ob, pattern, exec`. **pattern** is taught in Hour 9. The Golem
should be a pure Order-Block exam; the `pattern` round is four worlds early.

### 🟠 Medium — sync drift & dead data

**Issue C — Dashboard hard-codes a *copy* of the boss/lesson data, and it has drifted.**
`bossMeta`, `bossRounds`, `lessonMeta` in `dashboard.html` are hand-typed duplicates of the
game's `BOSS_CAST` / `LESSON_LIBRARY`. Names/realms currently match, **but `bossRounds[10]`
is `exec, mtf, struct, pattern, fake, exec` while the live Boss 10 rounds are the confluence
quiz** — already out of sync. Any future `BOSS_CAST` edit silently desyncs the dashboard.

**Issue D — Stale duplicate round blocks with *old boss names*.**
The `BOSS_GAMES` object literal (bosses 0-9) is dead code — `rebuildBossesFromCast`
overwrites it on load — yet it still carries comments for a **previous roster**:
`7: // Line Warden`, `8: // Flag Bearer`, `9: // Neckline Reaper`. Its round lists also
disagree with the live ones (e.g. it lists Boss 2 as `sl/rr/possize`, the live Crab is
`trend/support/resistance`). Confusing for anyone reading the file.

**Issue E — Intro-boss comment mislabels the Guardian.**
The intro flow says `Checkpoint 3 … Intro Boss — THE MARKET MAKER`, but it calls
`openBoss(0)` = **THE GAMBLER**. The Market Maker is Boss **10** (the finale). The code is
correct; the comment is stale and misleading.

### 🟡 Minor — design observations

**Issue F — Labels unlock on *hour reached*, not *lesson completed*.**
`conceptTier` tier-1 (plain label) triggers at `maxHourReached >= concept.hour`. A player
who skips the optional in-world lesson still sees the plain label on entering that world.
In practice the label and the lesson live in the same hour, so nothing appears *before* its
world — but it's tied to progression, not to literally finishing the lesson card.

**Issue G — Margin King (Boss 7) never tests leverage.** Its rounds are
`rr/possize/fake/exec` — all previously taught, so no integrity problem, but the leverage
*world's* boss doesn't exercise the leverage *concept*. Thematic gap only.

---

## 3. Recommended fixes (proposed — not yet applied)

Boss **rounds** (which mini-games a Guardian tests) are not in the "do-not-touch" list
(names / order / art / realms / ranks / economy / rewards / core loop), so these are
in-scope. All edits live in `BOSS_CAST.rounds`.

| # | Fix | Concretely |
|---|---|---|
| A | Make the Serpent a pure structure exam | Boss 3 rounds → `bos, choch, struct, predict` (drop `ob` + `liquidity`; they're the Golem's job next world). |
| B | Make the Golem a pure Order-Block exam | Boss 4 rounds → `ob, bos, ob, liquidity, exec` (replace `pattern` with `liquidity`/`sweep`, which Hour 4 now teaches). |
| C | Stop the dashboard from hand-copying data | Have the dashboard read boss/lesson/round data from the live game **catalog** (`guardianRow` over postMessage) instead of the hard-coded `bossMeta`/`bossRounds`/`lessonMeta`. Short-term: at minimum correct `bossRounds[10]`. |
| D | Delete the dead `BOSS_GAMES` literal | It's fully overwritten at load; removing it kills the old "Line Warden / Flag Bearer / Neckline Reaper" comments and the misleading round lists. Same for the `BOSSES` inline `rounds/bossHP/playerHP` (already marked DEPRECATED). |
| E | Fix the intro-boss comment | `Intro Boss — THE MARKET MAKER` → `Intro Boss — THE GAMBLER`. |
| G | (Optional) give the King a leverage beat | Add a leverage/risk-sizing round so the leverage world's boss tests leverage. |

(Issue F is a deliberate design choice; flag for decision, no fix required unless you want
labels strictly gated on lesson completion.)

## 4. Curriculum gaps

1. **ChoCh has no lesson.** `LESSON_LIBRARY` contains no `choch` entry, Hour 3's
   `intermissionFocus` is `['bos','setup']` (no choch), and `CONCEPTS.choch` falls back to
   the `bos` lesson. ChoCh is *tested* (Bosses 3 & 9) and *labelled* on the chart, but the
   player is only ever taught it inside the Serpent fight. **Recommend:** add a `choch`
   lesson and add `choch` to Hour 3's focus/intermission so it's taught before it's tested.
2. **"Learn-by-doing" concepts have no lesson card:** `exec` (execution), `possize`
   (position sizing), `predict`, `error`, `struct`. They're tested as mini-games and picked
   up through play/quizzes, which is acceptable — but worth a deliberate decision rather
   than an accident.
3. **Trendlines is taught only in recap.** It appears in Hours 2 & 9 `intermissionFocus`
   but never in a `focus` list, so it never pops as an in-world lesson — only in the
   intermission. Fine if intentional.

## 5. Curriculum redundancies

1. **Three boss-round definitions, one truth.** `BOSS_CAST.rounds` (live) +
   `BOSS_GAMES` literal (dead) + `BOSSES` inline rounds (dead, flagged). Two are pure
   redundancy and actively mislead (Issue D).
2. **Dashboard duplicates game data** (`bossMeta` / `bossRounds` / `lessonMeta`) — a fourth
   copy of the same facts, already drifted on Boss 10 (Issue C).
3. **`risk_reward` is a focus lesson in both Hour 5 and Hour 7.** Reasonable reinforcement
   (risk world + leverage world), but flagged as a duplicate.
4. **Repeated rounds within a boss** — Golem `ob, bos, ob, …` and Titan `mtf, struct, mtf, …`
   repeat a concept inside one fight. Intentional (drilling), noted for completeness.

---

## Summary of what's healthy vs. what needs work

**Healthy:** single source of truth (`BOSS_CAST`); sequential unlock requirements; every
mini-game ID resolves; concept-unlock gating is consistent; curriculum is boss-aligned for
8 of 11 Guardians; dashboard names/realms match.

**Needs work (priority order):** (A) Serpent tests OB/liquidity early · (B) Golem tests a
pattern early · (Gap 1) ChoCh has no lesson · (C) dashboard hard-copies data and Boss 10
rounds drifted · (D/E) delete dead `BOSS_GAMES` + fix the Market-Maker intro comment.

*No code, data, or assets were modified. Awaiting your go-ahead on the fixes above.*
