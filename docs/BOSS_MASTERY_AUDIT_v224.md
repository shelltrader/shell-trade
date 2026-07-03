# ChartQuest — Boss Curriculum Alignment & Mastery Audit (build 224)

**Date:** 2026-07-04 · **Method:** code-traced against the build-224 working tree (all line refs current) + the live verifications recorded in BOSS_ROUND_TPAT_AUDIT_v218, BOSS_CURRICULUM_ALIGNMENT_v222, L2_L3_LEARNING_LOOP_REBUILD_v221. Audit presented BEFORE implementation; the implemented set is the addendum.
**Ownership rule applied (per directive, strict):** L1 owns ONLY green/red candles, momentum, pullback, confirmation · L2 ONLY trend, support, resistance · L3 ONLY BOS, ChoCh. **Stated interpretation:** candle-reading is the *medium* of every question (like literacy in a math exam); a round violates ownership when an unowned concept is the *graded skill*, not when candles must be read to answer.

---

## 1 · COMPLETE CONCEPT MAP (Levels 1–3)

| Concept (owner) | 1 · Taught | 2 · Practiced | 3 · Applied in gameplay | 4 · Reinforced | 5 · Tested |
|---|---|---|---|---|---|
| **Green/Red candles** (L1) | `candle` LessonChart scene, intro candle 40–52 | green/red practice (required tap) | every pre-ticket read (`openPortalPredict`); every entry | quick reads (~6/hour, capped 224); intermission recap "Candles Intro/Doji/Close" cards | Gambler `candle`,`whowon` · Eel `whowon`,`candle` |
| **Momentum** (L1) | `momentum` scene before T1 | momentum practice (required) | T1 entry; banner "STRONG GREEN CLOSE"; predict question | review cards; quick reads | Gambler `predict` · Eel `predict` |
| **Pullback** (L1) | `pullback` scene before T2 | pullback practice | every framework trade IS a pullback entry; banner "UPTREND PULLBACK" | review WHY names it | (applied concept — tested via `fake`/`predict` composites) |
| **Confirmation** (L1) | `confirmation` scene before T3 | confirmation practice | **every entry fires on the confirmation candle** (`armBeginnerSetup`) | review; "Wait for the Close" intermission card | Gambler `confirm` · Eel `confirm`, `fake(b)` close-call |
| **Chart integrity / chain law** (L1, candle anatomy) | LIE practice hint, prove phase | "tap the one that FLOATS" (prove phase) | every honest chart obeys it (gen sweep, 221) | Gambler tested it | Gambler `error` — and (pre-fix) Serpent `error` ⚠ ownership |
| **Trend** (L2) | 🎬 `uptrend` scene at L2 entry (LEVEL_FLOW) | HIGHER-HIGH practice (required) | trend predict question on every L2+ ticket; banner label; reasons meter | review; recap card | Crab `trend` |
| **Support** (L2) | 🎬 `support` scene after L2-T1 | SUPPORT-bounce practice | ticket names "the dip stopped at the floor (support)"; SL sits at structure; reasons meter | review echo | Crab `support`, `fake` zone context |
| **Resistance** (L2) | 🎬 `resistance` scene after L2-T2 | CEILING-reject practice | target naming; reasons "rejecting off resistance" | review echo | Crab `resistance` + `fake` swing-mark step |
| **BOS** (L3) | 🎬 `bos` scene at L3 entry | BOS practice (required) | detector arms real BOS setups (events hastened post-lesson) — **probabilistic, see §6** | recap card; structure predict question | Serpent `bos` |
| **ChoCh** (L3) | 🎬 `choch` scene after L3-T1 (+RANGE line) | ChoCh practice (required) | detector ChoCh setups — probabilistic | recap card | Serpent `choch` |

**Mastery gate (all bosses):** 3 trades · 2 wins · 3 correct reads · journal-review (post-Notebook), reset per hour, always completable (218 fix), enforced at `imNext`.

## 2 · BOSS-BY-BOSS (rosters as served, build 224)

**🎲 Gambler — candle · whowon · confirm · predict · error.** Ownership ✓ all L1. Difficulty: *unloseable by design*, but misses are now felt (fumble line, 224). Educational ✓ (every round = a taught rule). Memorable ✓ (the fumble beat + "spot the lie"). Fun ✓. Learning vs guessing: guessing is irrelevant here by design; the feedback still teaches.
**🌀 Eel — fake(b) · predict · confirm · whowon · candle.** Ownership ✓ (fake-beginner grades only the close-call; the level line is plain-language "the old high"). Difficulty **fair**: ~50% binary rounds anchored by the un-guessable Candle Lab; a pure guesser expects ~2.5–3 misses vs 3 lives → usually dies; a taught player passes on rules. Educational ✓, memorable ✓ (identity: the trap), fun ✓.
**🦀 Crab — trend · support · resistance · fake(i) · ⚠ predict.** `predict` is an L1-owned graded skill → **strict-ownership violation (HIGH)**. `fake(i)`: composite — novel graded skill = marking resistance (L2 ✓), the close-call is L1-as-medium → compliant under the stated interpretation, and it's the boss's best round (real skill, zone-taught). Difficulty fair-to-firm; draw/shade rounds are guess-proof. Educational ✓✓ (the level's own practices train exactly these rounds).
**🐉 Serpent — bos · choch · ⚠ error · ⚠ trend · ⚠ predict.** THREE rounds grade unowned skills (L1 chain-law, L2 trend, L1 momentum) → **strict-ownership violations (HIGH)**. bos/choch themselves are fully chained ✓. Difficulty pre-fix: 2 owned skill-rounds + 3 reinforcement rounds — the pre-paywall exam should be the purest, not the most diluted.

## 3 · GUARDIAN TRIAL AUDIT (the part no prior audit covered)

Two systems exist; **both are OFF in the live game** (`TRIALS_ON` = `?trials=1`/localStorage only, [9854]; the `openBoss` preamble gate [11119] never fires without it):
1. **Guardian Trials 2.0** ([9856–9871]): movement trials (cross_green, cross_red, highest; wick/liquidity authored for later Guardians), defined only for the Gambler, delegating into the chart-trial engine.
2. **Chart-trial sequence** (`startGuardianSequence` [10372]: green_ascent → red_descent → liquidity swirl).

| Question | Answer |
|---|---|
| Concept reinforced | green=up / red=down (obvious, physical) and a wordless liquidity seed (an L4 concept — pre-taught flavor, not a test) |
| Connection obvious? | Yes for the crossings; the liquidity swirl is flavor |
| Improves learning? | Marginal — duplicates what quick reads + the crossing terrain already teach |
| Improves gameplay? | Mixed — a cinematic beat before a boss, but it re-runs on EVERY boss entry incl. retries (`_guardianCleared` resets each `openBoss`), which would compound retry friction badly with the new PASS-FOR-NOW loss loop |
| Worth keeping? | **As shipped: it isn't kept — it's dark.** Recommendation: LEAVE OFF for launch (zero risk, zero work), treat as post-launch content for later Guardians where wick/liquidity trials match taught concepts (L4+). Deleting ~700 flag-gated lines days before launch buys nothing and risks the block-1 surface — schedule deletion or promotion post-launch. |

## 4 · TRADE CONNECTION AUDIT (the "trading game" test)

| Concept | Lesson | Practice | **Trade** | Boss |
|---|---|---|---|---|
| green/red · momentum · pullback · confirmation | ✓ | ✓ | ✓ every framework trade | ✓ |
| trend | ✓ | ✓ | ✓ (predict question is a per-trade decision) | ✓ |
| support / resistance | ✓ | ✓ | ✓ named on every L2 pullback ticket + SL/TP sit at the levels | ✓ |
| **bos** | ✓ | ✓ | **◐ probabilistic** — detector needs a free structure event; hastened after the lesson but not guaranteed within the 3 gate trades | ✓ |
| **choch** | ✓ | ✓ | **◐ probabilistic** (rarer than bos) | ✓ |
| chain law (`error`) | ✓ | ✓ | ✗ by nature — it's a reading-integrity check, not a tradable signal (flagged per directive; accepted: no honest trade exists for "corrupt data") | ✓ |

**Flag (HIGH, low-risk fix exists):** BOS can skip the Trade stage in a given run. The framework's confirmation entry *is* a mini break-of-structure by construction (the confirm candle closes above the pullback swing) — at L3, once BOS is taught, labeling that setup as the BOS it literally is (type + candle flag) makes the Trade stage **deterministic**: banner reads "BREAK", the predict question asks structure, the review explains BOS. ChoCh has no honest equivalent relabel (the framework trades continuation); it stays probabilistic-plus-hastened and is flagged as the accepted residual.

## 5 · DIFFICULTY — learning or guessing?

Guess-pass odds per round type: binary classify/predict ≈ 50% · error tap ≈ 1/n ≈ 8–12% · build/draw/shade/sequence ≈ ~0%. With 3 lives over 5 rounds, a pure guesser clears the Eel ≈ 1-in-5 runs and the Crab ≈ 1-in-12; post-fix Serpent ≈ ~0 (no binary rounds). Conclusion: **players who reach a boss through the level's loop pass on taught rules; guessers bleed out** — except at the Gambler, where losing is impossible by design (and now honest about misses). The PASS-FOR-NOW hatch (224) keeps a stuck player moving without granting the win.

## 6 · MASTERY AUDIT

| Finding | Detail | Rank |
|---|---|---|
| L1 repetition | 5–12+ interactions per concept before the Eel — mastery-grade | ✓ |
| Trend reps | lesson + practice + a decision on every ticket (~5–6 touches) | ✓ |
| Support/resistance reps | ~4 touches each; **resistance is introduced after T2 — only ~1 applied trade before the Crab** | MEDIUM — acceptable at launch; watch playtests; the boss's own zone round is effectively rep 5 |
| BOS/ChoCh reps | 3–5 touches; thinnest chains in the game; BOS trade not guaranteed (§4) | **HIGH** for BOS (fix below) · MEDIUM for ChoCh (accepted residual) |
| Introduced too quickly? | No concept is tested in the hour it first appears without lesson+practice+trade in between | ✓ |
| Introduced too late? | resistance (above); ChoCh lands mid-L3 with 2 trades of runway — fine | ✓/MEDIUM |
| Recall taps | LESSON_RECALL for trend/sr/bos/choch retired with the text cards (222) — replaced 1-for-1 by the required practice taps; net interactions unchanged | note only |

## 7 · RECOMMENDATIONS (ranked)

| # | Rank | Recommendation |
|---|---|---|
| 1 | **HIGH** | **Crab roster:** `predict` → `trend` (intermediate) — second, harder trendline rep; boss becomes pure L2 + the fake composite | 
| 2 | **HIGH** | **Serpent roster:** `error`/`trend`/`predict` out → **bos(i) · choch(i) · bos(a) · choch(a)** — a pure, escalating structure exam ("once to learn it, once to prove it"); 4 rounds vs 3 lives stays fair and guess-proof |
| 3 | **HIGH** | **Guarantee the BOS Trade stage:** at L3, post-lesson, the framework setup arms as the BOS it literally is (`setupZone.type='bos'` + confirm candle flagged) |
| 4 | MEDIUM | ChoCh trade application stays probabilistic — keep the event-hastening, monitor playtests | 
| 5 | MEDIUM | Resistance's 1-trade runway before the Crab — monitor; a swap of the support/resistance beat order is the lever if playtests show it | 
| 6 | LOW | Guardian Trials: leave dark for launch; post-launch either promote (wick/liquidity trials to L4+ where owned) or delete | 
| 7 | LOW | `fake` composite interpretation (novel-skill grading) documented here as the ownership ruling of record |

**CRITICAL: none open** — softlock class (218), free-win hatch (224), invisible-corruption round (220), floating-candle drills (221) all closed previously.

---

## ADDENDUM — IMPLEMENTED (build 225): items 1–3 only (high impact / low risk; no rewrites, no creep). See chat report for the verification transcript.
