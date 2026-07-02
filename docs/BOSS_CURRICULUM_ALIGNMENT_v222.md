# ChartQuest — Boss Curriculum Alignment Audit (build 222, post L2/L3 rebuild)

**Date:** 2026-07-03 (overnight sprint 3) · Audit first, then the listed safe fixes were implemented (build 223). Design-identity items are FLAGGED, not changed — they need the founder's ruling.
**Ownership matrix (per directive):** L1 owns green/red candles, momentum, pullback, confirmation · L2 owns trend, support, resistance · L3 owns BOS, CHOCH. **Interpretation used:** a boss may test its own level's concepts plus *earlier* levels' (cumulative) — reading candles can never be "unlearned"; a stricter same-level-only reading would forbid the Serpent from asking anything about candles at all. Every violation below is a violation even under the cumulative reading.

## Boss-by-boss — all six gates per question

### 🎲 THE GAMBLER (mid-L1) — candle · whowon · confirm · predict · error
| Round | Concept | Taught | Practiced | Applied | Reinforced | Tested |
|---|---|---|---|---|---|---|
| candle | candle anatomy (L1) | `candle` LessonChart scene, candle 40–52 | green/red practice (required) | every pre-ticket read + entry | quick reads all hour; review cards | here |
| whowon | green/red (L1) | same scene | same practice ("buyers won") | quick reads | intermission recap card | here |
| confirm | confirmation (L1) | `confirmation` scene before T3 | required practice | every entry fires ON the confirmation candle | review WHY names it; "Wait for the Close" recap | here |
| predict | momentum read (L1) | Prediction Bet (engineered) | bet round 2 + quick reads | pre-ticket predict on every trade | continuous | here |
| error | chart integrity / chain law (L1, intro) | LIE framing in the prove-phase practice hint | "spot the LIE" practice (prove phase) | every honest chart obeys it (chain-law sweep, build 221) | — (first test) | here |
**Ownership ✓ (all L1). Difficulty: UNLOSEABLE by design** (`onRoundDone` forces every round to pass at level 0). ⚑ FLAGGED for ruling — see Difficulty.

### 🌀 THE FALSE-BREAKOUT EEL (end L1) — fake(b) · predict · confirm · whowon · candle
All five map to L1-owned skills: the beginner `fake` variant auto-completes the level-marking step and scores only the close-read (= confirmation); the chart line is labelled "the old high" (no L2 term leaks). Taught/practiced/applied/reinforced columns as above. **Ownership ✓ · Golden Rule ✓.**
**Difficulty: FAIR.** Binary rounds are ~50% guessable but the set has an un-guessable anchor (Candle Lab build) and 3 lives across 5 rounds — a pure guesser expects ~2.5–3 misses and usually dies; a player who followed the intro passes each round from an explicitly taught rule.

### 🦀 THE TREND CRAB (end L2) — trend · support · resistance · fake(i) · predict
| Round | Taught | Practiced | Applied | Reinforced | Tested |
|---|---|---|---|---|---|
| trend | 🎬 `uptrend` animated lesson at L2 entry (sprint 2) | HIGHER-HIGH practice (required) | pre-ticket question asks the trend; banner "UPTREND PULLBACK"; reasons meter | review WHY; recap card | here |
| support | 🎬 `support` scene after trade 1 | SUPPORT-bounce practice | ticket names "the dip stopped right at the floor (support)" on every L2 pullback; reasons meter "bouncing off support" | review echo "held the floor" | here |
| resistance | 🎬 `resistance` scene after trade 2 | CEILING-reject practice (new, sprint 2) | ticket/target naming + reasons meter "rejecting off resistance" | review echo | here |
| fake (intermediate) | resistance (L2) + close (L1) | zone practice + confirmation practice | close-based entries; levels named in ticket | Eel's beginner variant was the warm-up | here |
| predict | L1 | continuous | every trade | continuous | here |
**Ownership ✓ · Golden Rule ✓ (post-sprint-2). Difficulty: FAIR-to-FIRM** — ray-draw and zone-shade rounds are genuine skill checks; two binary rounds keep the floor accessible. Correct placement of skill rounds after their in-level application.

### 🐉 THE STRUCTURE SERPENT (end L3) — bos · choch · ~~struct~~ · trend(a) · predict(a)
| Round | Verdict |
|---|---|
| bos | ✓ — 🎬 `bos` scene at L3 entry → required practice → detector arms real BOS setups (structure events hastened post-lesson) → tested here |
| choch | ✓ — 🎬 `choch` scene after trade 1 → required practice → detector ChoCh setups → tested here |
| **struct** | **✗ VIOLATION (regression found by this audit):** the classify round's third option, **RANGE, lost its TEACH link** — the build-219 range sentence lived on the ChoCh *text card*, which sprint 2 correctly replaced with the animated scene (whose caption doesn't mention range). Range also never had a practice rep. Under "no exceptions," struct is out. |
| trend (advanced) | ✓ — spaced reinforcement of an L2-owned, fully-chained concept |
| predict (advanced) | ✓ |
**Fix implemented (build 223):** `struct` → **`error` (advanced)** — the chain-law lie at advanced difficulty. Taught + practiced in the intro, reinforced at the Gambler, enforced by every honest chart in the game (build-221 sweep), and thematically native to *Broken Structure Canyon* ("find the corrupt data"). Also: the RANGE sentence was appended to the `choch` scene caption so the concept itself stays taught for the Notebook/glossary even though no boss tests it before L4.
**Difficulty: FIRM, fair** — intermediate structure rounds after in-level application, advanced reinforcement rounds from earlier levels.

## Constitution / curriculum violations found
1. **Serpent `struct`/RANGE regression** (above) — fixed by swap + caption line.
2. No other round in bosses 0–3 tests an untaught, un-practiced, or un-applied concept post-sprint-2. The chain LEARN→PRACTICE→APPLY→REINFORCE→TEST is closed for all 20 questions.

## Difficulty analysis — the honest summary
- **Boss 1 (Gambler): too easy — deliberately.** Every round force-passes. As a confidence-builder it works; as an exam it is theater, and the v76 conversion thesis ("the win is earned") is currently false. ⚑ **Needs ruling** (recommended: real scoring on rounds 4–5 with hearts floored at 1 so it stays unloseable but *feels* earned). Not changed.
- **Boss 2 (Eel): fair.** Guessing loses more often than it wins; every round's rule was explicitly taught.
- **Boss 3 (Crab): fair-to-firm, educational.** The draw/shade rounds are real skill gates that the level's own practices train directly.
- **Systemic:** ⚑ **SKIP-on-loss still grants a full win with permanent credit** (from the first-3-levels audit, still awaiting approval). Until closed, every difficulty statement above is optional for the player. Recommended fix unchanged: SKIP only after ≥3 attempts, passage without `bossesEverBeaten` credit.

## Implemented in build 223
1. `BOSS_CAST[3]` rounds: `struct` → `error` (advanced).
2. `choch` scene caption += "No breaks either way? That's a RANGE — price just drifting sideways."
3. Nothing else — the two ⚑ items await the founder.
