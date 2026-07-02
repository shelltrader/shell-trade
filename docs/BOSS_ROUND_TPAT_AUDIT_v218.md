# Boss-Round TEACH → PRACTICE → APPLY → TEST Audit — Levels 1–3 (build 218 tree)

**Date:** 2026-07-03 · **Status: AUDIT ONLY — no code changed. Replacement/move plan at the end awaits approval (Change Control Rule).**
**Rule applied (verbatim):** every boss question must show (1) where the concept is first TAUGHT, (2) where it is PRACTICED, (3) where it is APPLIED in a trade, (4) where it is TESTED. Any concept that cannot satisfy all four must be replaced or moved.
**Scope:** the four Guardians a player meets in Levels 1–3 — Gambler (mid-L1 intro, `BOSS_CAST[0]`), False-Breakout Eel (end L1, `[1]`), Trend Crab (end L2, `[2]`), Structure Serpent (end L3, `[3]`) — 20 rounds, rosters at [chart-quest.html:9394/9403/9412/9421]. Rounds are served raw (`openBoss` → `BOSS_GAMES[level]`, line 11020): **there is no taught-concept filter**, so compliance lives or dies in the cast lists below.

## The delivery systems (where each gate CAN happen)

| Gate | Mechanisms in code |
|---|---|
| TEACH | Intro LessonChart scenes (`beginGreenRedLearn` 15942, portal at candle 40 / forced at 52 → 12163–12168; concept chain per trade → 12600); level-entry force-taught cards (`closeIntermission` → `teachForced` per `CURRICULUM.focus`, 6390); contextual `teach()` (curriculum-gated, 4859–4861); intermission review cards (`imLessonsForHour` 5535 renders `intermissionFocus` — incl. "Wait for the Close" 5514 — on the screen *before* the boss) |
| PRACTICE | Required: `CONCEPT_PRACTICE` overlays (19074: greenred / momentum / pullback / confirmation only) and `LESSON_RECALL` one-tap checks (4922: candles_intro, long_vs_short, candle_close, what_is_trend, support_resist only). Optional: "TRY IT" MG drills (`LESSON_GAME` 4908). Ambient: quick reads (`spawnQuickRead` 11983, every 11–16 candles) |
| APPLY | The beginner trade framework — every L1–L3 trade is momentum → pullback → **entry on the confirmation candle** (`armBeginnerSetup` 6564); the pre-ticket prediction (`openPortalPredict` 11712 — a read the trade then acts on); banner labels ("UPTREND PULLBACK", 6440); the reasons meter (`tpReason` 11404/11425). **Note:** structure setups (bos/choch/trend_break) are dead at L≤3 — the detector is explicitly skipped (`else if (session.level <= 3) {}` 12268-region) even though `SETUP_UNLOCK` promises `bos: 3` (11779). That contradiction matters below. |
| TEST | The boss round itself (`MG.run`, pass = raw ≥70; Gambler auto-passes every round — 10544) |

---

## Round-by-round verdicts

### 🎲 THE GAMBLER — mid-L1 (rounds: candle · whowon · confirm · predict · error)

| Round | 1 · TAUGHT | 2 · PRACTICED | 3 · APPLIED in a trade | 4 · TESTED | Verdict |
|---|---|---|---|---|---|
| **candle** (Candle Lab: build + classify) | LessonChart `candle` scene — body, green/red, wicks (block-2 caption; entered candle 40–52, 12163) | `CONCEPT_PRACTICE.greenred` — required tap (19074) | Every guided trade begins by reading the chart in the predict step (11712) and enters on a green close | Gambler R1 | ✅ **PASS** |
| **whowon** (buyers or sellers?) | Same scene — "green = buyers won" is the literal lesson framing | Same practice — prompt is *"Tap a GREEN candle (buyers won)"* | Quick reads through the hour (11983) + the pre-ticket call | Gambler R2 | ✅ **PASS** |
| **confirm** (Read the Close) | `confirmation` LessonChart scene before T3 ("closes back up… this is where you enter", 12600 chain) + "Wait for the Close" review card at the intermission (5514/5535) | `CONCEPT_PRACTICE.confirmation` — required (19074) | **Every** trade entry fires on the confirmation candle (6564); the review card names it | Gambler R3 | ✅ **PASS** |
| **predict** (next candle up/down) | Taught by doing: engineered Prediction Bet with explicit framing (15904) | Bet round 2 (staked) + continuous quick reads | `openPortalPredict` before every ticket — the prediction the trade acts on (11712) | Gambler R4 | ✅ **PASS** |
| **error** (spot the impossible candle — body breaks its own wick) | ⚠ Partial — the `candle` scene names wicks ("how far price reached") but the *body-must-fit-inside-wick* rule is never stated | ✗ none | ✗ none — no trade ever asks the player to spot a corrupt candle | Gambler R5 | ❌ **FAIL (2/4)** |

### 🌀 THE FALSE-BREAKOUT EEL — end of L1 (rounds: fake · liquidity · confirm · whowon · candle)

| Round | 1 · TAUGHT | 2 · PRACTICED | 3 · APPLIED | 4 · TESTED | Verdict |
|---|---|---|---|---|---|
| **fake** (Break Trader) | Split: the *close-decides* half is taught (confirmation scene + intermission close card ✓). The *first step* — "Tap the swing high that forms **resistance**" with an on-screen label `'resistance'` (block-2, ~18586) — uses an **hour-2 concept never taught in L1** | ✗ none required | Partial — trades enter on closes, but the player never judges a fake break | Eel R1 | ❌ **FAIL as composed** (step 1 fails TEACH) |
| **liquidity** ("tap where stop orders rest") | ✗ — `CONCEPTS.sweep` is **hour 4** (4778); contextual `teach('sweep')` is curriculum-gated to L4; only the wordless mega-pole seeding exists | ✗ | ✗ | Eel R2 | ❌ **FAIL (1/4)** |
| **confirm** | as Gambler R3 (and the pre-Eel intermission shows the close card) | ✓ | ✓ | Eel R3 | ✅ **PASS** |
| **whowon** | as Gambler R2 | ✓ | ✓ | Eel R4 | ✅ **PASS** |
| **candle** | as Gambler R1 | ✓ | ✓ | Eel R5 | ✅ **PASS** |

### 🦀 THE TREND CRAB — end of L2 (rounds: trend · support · resistance · struct · bos)

| Round | 1 · TAUGHT | 2 · PRACTICED | 3 · APPLIED | 4 · TESTED | Verdict |
|---|---|---|---|---|---|
| **trend** (draw the trendline) | ✓ "WHAT IS A TREND?" card force-taught at L2 entry (6390; measured live) | ⚠ Required recall = one tap (4922); the drawing drill is **optional** | ⚠ Named, not used: banner says "UPTREND PULLBACK" (6440) and the reasons meter counts trend agreement (11404) — but no player decision requires reading the trend | Crab R1 | ⚠ **CONDITIONAL** — passes only with required practice + an explicit trend decision in a trade |
| **support** (shade the zone) | ✓ "SUPPORT & RESISTANCE" card at L2 entry (6390) | ⚠ recall only; zone drill optional | ⚠ implicit at best — SL/TP sit at structure ("nearby support/resistance", openPanel) but are never named as such to the player | Crab R2 | ⚠ **CONDITIONAL** |
| **resistance** (shade the zone) | ✓ same card | ⚠ same | ⚠ same | Crab R3 | ⚠ **CONDITIONAL** |
| **struct** (classify: uptrend / downtrend / **range**) | ⚠ up/down covered by the trend card; **"range" is taught nowhere in L1–L3** | ✗ | ✗ | Crab R4 | ❌ **FAIL** |
| **bos** (tap the structure break) | ✗ — BOS is the **hour-3** card, taught at L3 entry (6390), one boss later | ✗ | ✗ (structure trades dead at L≤3, 12268) | Crab R5 | ❌ **FAIL (1/4)** |

### 🐉 THE STRUCTURE SERPENT — end of L3 (rounds: bos · choch · ob · struct · predict)

| Round | 1 · TAUGHT | 2 · PRACTICED | 3 · APPLIED | 4 · TESTED | Verdict |
|---|---|---|---|---|---|
| **bos** | ✓ "BREAK OF STRUCTURE" card at L3 entry (6390; measured live) | ✗ — **no recall entry** (4922 map lacks bos), no required practice, drill optional | ✗ — `SETUP_UNLOCK` says `bos: 3` (11779) but the L≤3 branch keeps the structure-setup detector dead (12268): **the game promises BOS trades at L3 and never delivers them** | Serpent R1 | ⚠ **CONDITIONAL-FAIL** — teach exists; practice and apply are both missing for the boss's own headline concept |
| **choch** | ✓ "CHANGE OF CHARACTER" card at L3 entry | ✗ same as bos | ✗ same | Serpent R2 | ⚠ **CONDITIONAL-FAIL** |
| **ob** (Order Block sequence) | ✗ — OB is **hour 4** (4775); `teach('ob')` curriculum-gated to L4 | ✗ | ✗ | Serpent R3 | ❌ **FAIL (1/4)** |
| **struct** | ⚠ as Crab R4 — "range" still untaught at L3 | ✗ | ✗ | Serpent R4 | ❌ **FAIL** |
| **predict** (advanced) | ✓ L1 | ✓ continuous reads | ✓ pre-ticket every trade | Serpent R5 | ✅ **PASS** |

**Tally: 8 PASS · 5 CONDITIONAL · 7 FAIL.** Only the Gambler is fully clean apart from `error` — and the Gambler is also the one boss that can't be lost (10544), so the *first* boss whose rounds actually gate progress (the Eel) opens with two non-compliant rounds.

---

## Replace-or-move plan (proposed — NOT implemented)

**Principle:** every roster slot must hold a concept that passes all four gates *at the moment that boss fires*, given two enabling fixes that close the systemic PRACTICE/APPLY holes (they were already P1 items in FIRST3_LEVELS_AUDIT §E.2):

- **Enabler 1 — required practice for L2/L3 concepts:** add `CONCEPT_PRACTICE` entries (trend, support/resistance, bos, choch) into the level-entry teach chain, and recall entries for bos/choch. Without this, every Crab/Serpent round fails gate 2 no matter how rounds are shuffled.
- **Enabler 2 — let L3 trades use structure:** flip the dead-branch condition so the bos/trend_break setup detector runs at L3 (`session.level <= 3` → `<= 2` at 12268-region). This honors the *existing* `SETUP_UNLOCK: { bos: 3 }` contract and gives the Serpent's three gate-trades a genuine APPLY step. *Change-control statement: touches trade-type mix at L3 only; strengthens LEARN→PRACTICE→APPLY→TEST; trade count, order, boss timing unchanged.*

### Proposed rosters

| Boss | Current | Proposed | Rationale |
|---|---|---|---|
| **Gambler** | candle · whowon · confirm · predict · **error** | candle · whowon · confirm · predict · **error*** | *Keep `error` ONLY if a ~10-second "tap the broken candle" beat is added to the intro's candle lesson/practice (within L1's authorized scope — it's candle anatomy). Otherwise drop to 4 rounds. Recommend: add the beat — the round is a good anatomy check. |
| **Eel** | **fake** · **liquidity** · confirm · whowon · candle | **fake (reworked)** · **predict** · confirm · whowon · candle | `liquidity` → **moved out** (Golem, boss 4, already carries a `liquidity` round at the hour sweep is taught — the Eel copy is premature *and* redundant). `fake` → **reworked at beginner difficulty**: auto-mark the prior high (the round already draws the line), say "the old high" in plain words (the game's own tier-0/1 language system, 4756), and score only the taught skill — the real-vs-fake **close** call. The Eel *is* the fakeout boss; gutting `fake` would gut its identity, and the close-read half passes all four gates today. |
| **Crab** | trend · support · resistance · **struct** · **bos** | trend · support · resistance · **fake (full)** · **predict** | `bos` → **moved out** (Serpent already tests it, at the hour it's taught). `struct` → out (range untaught). `fake` **moves in at full strength**: by end-of-L2, resistance is taught + practiced (Enabler 1) and the close-read is old news — the full round (find the swing, judge the break) passes all four gates here, and thematically "the trend vs. the fake break" is exactly the Crab's lesson. Plus dependency: the L2 pre-ticket predict question should ask the **trend** ("which way is the trend pushing?") so trend's APPLY gate is a real decision, not a label. |
| **Serpent** | bos · choch · **ob** · **struct** · predict | bos · choch · **struct (enabled)** · **trend (advanced)** · predict | `ob` → **moved out** (Golem, boss 4, already has `ob` as its opening round — where it's taught). `struct` becomes legal with **one added line** to the L3 entry cards — "no breaks either way = a RANGE (price moving sideways)" — plus its practice rep under Enabler 1; classify-the-structure is the natural capstone of the structure level. `trend` at advanced difficulty replaces the fifth slot as spaced reinforcement (taught L2, practiced L2, applied L2–L3). bos/choch stay but are only compliant **with both Enablers** (required practice + real BOS trades at L3). |

**Net moves:** `liquidity` Eel→(already at)Golem · `bos` Crab→(already at)Serpent · `ob` Serpent→(already at)Golem — i.e., all three violations resolve by *deletion*, because the correct home already has the round. `fake` Eel→Crab at full strength with a taught-language rework staying behind at the Eel. No boss loses its identity; no round tests anything its level hasn't taught, practiced, and traded first.

**Effort if approved:** roster edits = 4 lines in `BOSS_CAST`; fake-round beginner variant ≈ 1–2 h (block 2 → full browser verify per scope-trap rule); Enabler 1 ≈ half day (block 2 + chain wiring); Enabler 2 = one condition + verification of L3 setup cadence; range line + recall entries ≈ 1 h; broken-candle intro beat ≈ 1–2 h. Bundle: one flow build, browser-verified, then QR.

*Nothing above has been implemented. Awaiting your approval on: (a) the four rosters, (b) Enabler 1, (c) Enabler 2, (d) the Gambler `error` decision (add practice beat vs. drop the round).*

---

## ADDENDUM — APPROVED IN FULL & IMPLEMENTED (build 219, 2026-07-03)

All of (a)–(d) shipped and browser-verified at 375×812 on a fresh beginner boot:

- **Rosters served live** (`BOSS_GAMES` after rebuild): Gambler `candle,whowon,confirm,predict,error` · Eel `fake,predict,confirm,whowon,candle` · Crab `trend,support,resistance,fake,predict` · Serpent `bos,choch,struct,trend,predict`.
- **Enabler 1:** `CONCEPT_PRACTICE` gained trend / sr / bos / choch / brokencandle (all candle data validity-checked live; brokencandle corrupt at exactly index 2); `LESSON_RECALL` gained bos + choch; new `LESSON_PRACTICE` map + `dismissLesson` hook auto-opens the required practice 520 ms after each concept card — verified live: dismissing the L2 trend card opened the HIGHER-HIGH practice. Once-ever via `cq_prac_*` flags (wiped by `?fresh=1`; flag set at open so a ✕-close never re-traps).
- **Enabler 2:** detector branch now `session.level <= 2` with a `!setupFlow` mutual-exclusion guard. Verified live: synthetic BOS candle at L3 armed `setupZone.type='bos'` with the plain-language "⚡ BREAK" banner + trade portal; silent while a beginner sequence is mid-flight; silent at L2. The contextual BREAK OF STRUCTURE lesson portal also fires at L3 as designed.
- **Gambler `error`:** the intro now runs candle lesson → green/red practice → **broken-candle practice** ("a body can never poke past its own wick") → prediction bet.
- **Extras from the approved plan:** `fake` beginner variant (line labelled "the old high", guided first tap auto-scores, the word "resistance" absent — verified; intermediate+ unchanged, "resistance" present); RANGE line added to the ChoCh card; pre-ticket predict question is now level-aware (L2 "Which way is the TREND pushing?", L3 "Structure just moved — which way next?").

Static: all 4 script blocks compile in both files, cross-block declarations clean, index.html regenerated with exactly the 5 known hunks, BUILD_TAG + sw.js cache at 219, LAN server confirmed serving 219. Zero console errors across the verification session.

## ADDENDUM 2 — CQ-0025: the broken-candle beat reworked (build 220, 2026-07-03)

The playtest flagged the new beat as bad. Diagnosis found it worse than pacing: **the 'error' round's corruption has always been invisible.** The corrupt candle (close set past its own high) renders as an ordinary wickless-top bar — the MG renderer extends the wick to `max(hi,o,c)`, and ~half of honest candles have no wick by design (SHOT 25) — so the round was solvable only by luck, and the practice beat faithfully reproduced the same unfindable lie (plus it stacked two practices back-to-back at minute 2, and its corrupt body drew crammed against the canvas ceiling).

**Fix (build 220):** the corruption is now the **FLOATING candle** — it breaks the game's own hard law (open = previous close), levitating visibly off the chain on both sides. Applied to BOTH the Gambler's `error` round (`gen` shifts the bad candle up by 2.2×vol; new objective/validate copy) and the `brokencandle` practice (connected staircase, liar floats 16 units above it, "every candle must START exactly where the last one STOPPED"). The beat also **moved out of the green/red chain** (restoring lesson → practice → bet) to the **start of the prove phase** — a "spot the lie" warm-up seconds before the Gambler tests it; PRACTICE still precedes TEST.

Verified live at 375×812: practice data (all shapes valid, chain broken only at the floater, staircase rejoins beneath it), the overlay visual (floater unmistakable — screenshot), the boss round visual (floater unmistakable — screenshot), the correct-tap win path ("You caught the lie" + reward line), chain A (green/red practice → bet, no stacking), chain B (prove opens the beat once, world resumes clean: unpaused, prove phase intact, final-stretch floater fires after). Zero console errors; index.html regenerated (5 hunks); build 220 live on the LAN server.
