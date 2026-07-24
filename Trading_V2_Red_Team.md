# Trading V2 — Red Team of the Final Architecture

**Status:** Adversarial analysis — NOT implementation. **Date:** 2026-07-06. **Against:** build 250 + [`Trading_V2_Architecture_Final.md`](Trading_V2_Architecture_Final.md).
**Scope note:** the earlier [`Trading_V2_Red_Team_Audit.md`](Trading_V2_Red_Team_Audit.md) attacked *Prototype A*. This document attacks the **full architecture** — the regime model, evidence layer, quality firewall, path authoring, and review. No defense is offered. The job is to destroy the design.

---

## TOP 10 TECHNICAL RISKS

1. **The authored future-path generator is the staircase war, round two.** `tradeDrivenCandle` took ~6 builds to stop looking flat/teleporting *while steering*. Authoring a full believable OHLC future is the same craft, harder, and the failure mode ("looks fake") is invisible in unit tests and only shows on-device.
2. **The regime is not actually deterministic downstream.** The authored path must survive `decorateCandleWicks` (3143), wick clamps, off-screen culling, EMA-dt camera, and intrabar *wick-inclusive* touch (12454). A decorative wick can tag a "favorable" regime's stop, flipping the authored outcome.
3. **Two-layer state doubles the state to persist and desync.** A macro bias that persists across setups is new global state that must survive `?fresh=1`, saves, watchdogs, and the 4-`<script>`-block scope trap (build-202 class). Macro/local desync = incoherent charts.
4. **The conflict penalty is a tuning black hole.** "Disagreeing evidence lowers quality" sounds clean but requires defining *disagreement* across 11 factors — a combinatorial rules matrix that will mis-fire, making clean setups read weak or traps read strong, silently bending the curve.
5. **`calcLevels` may not compose with authored setups.** It sizes from *detected* ATR/swings; if the authored path doesn't respect the level it places (or produces a sliver band near the world ceiling — the `_rd0` bug at 11786), resolution is incoherent. "Reuse verbatim" is optimistic.
6. **Deleting `_l1Outcome` has more tentacles than expected** (2903/11804/12474 + the Finn-climb branch 12481 + the 90-candle cap). A partial excision yields a trade that never resolves (softlock) or double-resolves.
7. **Watchdogs fight long authored trades.** Anti-stuck (13187), off-chart failsafe (13097), intro watchdog (18663) assume current cadence; a legitimately 40-candle authored path trips them or gets its state yanked mid-scenario.
8. **`frame()` blast radius.** One throw in the generator (e.g., a regime that can't fit levels near the ceiling) freezes the entire game — the highest-severity failure in a single-rAF architecture.
9. **Performance of authoring-one-ahead.** Composing + validating a full scenario during live traversal can hitch the frame; the "measure, don't enforce" stance still needs *some* rejection of degenerate scenarios, which can loop.
10. **The offline harness lies by omission.** Gate 1 proves the *math* in isolation but cannot reproduce the live pipeline (wicks, camera, watchdogs). A curve that's clean offline can be corrupted in-game, and we won't know until Gate 2.

## TOP 10 EDUCATIONAL RISKS

1. **Expectancy is developmentally too advanced.** Teaching a 10-year-old "you did everything right and still lost, that's variance" via *real* drained shells may install fatalism ("nothing I do matters") rather than expectancy. The coin flip's "follow lesson → win" is a cleaner primary lesson.
2. **The strength meter replaces reading with meter-watching.** Players optimize "wait for 3 bars lit," a skill that exists nowhere outside ChartQuest, instead of reading trend/structure.
3. **Confluence leaks by feel before L10.** A true pre-trade strength signal teaches the *concept* of stacking reasons before the word is taught — violating the curriculum constitution in spirit even if `conceptTier` hides vocabulary.
4. **A clean monotone curve teaches false precision.** Real edges are noisy and regime-dependent; "9/10 ≈ 80% win" installs a confidence that gets a real trader wrecked. We may be teaching a comforting, tradable-looking lie.
5. **Traps punish curiosity.** Kids learn by exploring ("what if I take the weird one?"). If exploration reliably = authored loss, they stop exploring and only take spoon-fed setups — the opposite of building a reader.
6. **"Visible before entry" is an unverifiable promise.** The architecture asserts every cause was legible pre-entry; in practice the tell (a subtle sweep) may be invisible to a novice, so the review still *tells* rather than *teaches*.
7. **One-family validation over-generalizes.** Gates 1–2 test continuation-vs-trap; success there says nothing about whether players can read BOS/OB/sweep/VWAP — yet it will be read as "V2 teaches trading."
8. **Regime taxonomy is itself untaught jargon risk.** Exhaustion/accumulation/distribution have no lesson; if their *evidence* appears before the concept is scaffolded, the player is judged on the untaught.
9. **Fair losing streaks are pedagogically toxic even when correct.** Variance guarantees 4-loss runs of good trades; "+Discipline" four times while shells drain is a hard sell to a child and may teach "this game hates me."
10. **We may be optimizing the wrong educational metric.** The real beginner win might be literacy + engagement (green=up, patience, stops exist) — already shipped. V2's sophistication could teach *less* by adding noise to a clean primary lesson.

## TOP 10 PLAYER-EXPERIENCE RISKS

1. **Variance reads as rigging.** Three 8/10s lost in a row (entirely possible honestly) *proves* to the player the game is against them. Fairness is a felt frequency, not a true probability.
2. **The honest stop-out feels like a snipe.** Intrabar wick fills faithfully reproduce the most rage-inducing real-trading moment — tagged by one wick, then reverses.
3. **Removing the puppet may remove the drama.** The scare is currently *engineered* (dip to 72% of stop). Honest variance won't reliably deliver it — and if we author it in, we're puppeteering again at authoring time.
4. **The meter manufactures broken promises.** "Strong" → loss feels like the game lied, and by design ~20–30% of strong trades must lose.
5. **Losing the ~58% kindness reads as a difficulty spike.** Players who leaned on it experience V2 as "meaner," and attribute it to unfairness, not realism.
6. **Process feedback lands as blame.** "You didn't wait for enough reasons" reads to a child as scolding. Accurate ≠ kind.
7. **Skip-feedback whiplash.** "Good skip, that was weak" → a near-identical setup wins. Honest post-hoc feedback on skips will contradict outcomes and feel like moving goalposts.
8. **The tutorial over-promises.** The game teaches "follow the lesson → win"; the first lesson-following loss feels like betrayal, *stronger* because the pedagogy set the expectation it breaks.
9. **Two players, same read, different outcome.** Authored variance means "I lost the one you won" spreads as inconsistency = unfairness.
10. **The improvement may be real but sub-threshold.** Even a true 6→6.5 nudge isn't 9/10 and can't justify a protected-system-#9 redesign; Gate 2 may not be able to tell "meaningful" from "marginal."

## TOP 10 ECONOMY RISKS

1. **`RESERVE = 0` means no bust protection — the biggest new risk.** The old L1–3 kindness was a floor; it's gone (3304). Honest losses can zero a beginner's shells → rage-quit. V2 without a re-introduced floor is economically hostile to the exact audience it must retain.
2. **Honest +EV for the disciplined can runaway-compound.** ~70% at 2R is a large edge; with `TRADE_SIZE_CAP=75` (11545) and no reserve, the curve can still balloon until shells stop mattering, or oscillate wildly.
3. **Honest −EV for the indiscriminate can grind to zero fast.** Beginners who take everything (the default before selectivity is learned) now genuinely lose — the economy punishes the learning phase.
4. **Leverage × honest variance = ruin.** The leverage system (3436) multiplies exposure; honest losing streaks under leverage, with no reserve, is a fast bust — and leverage unlocks at L7 exactly when traps get common.
5. **Stakes may stop feeling meaningful, or feel *too* meaningful.** Calibrating shell scarcity so losses sting but don't bust — with no floor — is a narrow, untested band.
6. **The economy and the curriculum can contradict.** If the +EV edge only materializes for players who've learned selectivity (L3+), L1–2 players experience a losing economy while being told "follow the lesson." Mixed message.
7. **Expectancy tuning is now load-bearing and coupled to feel.** Every regime base-rate change moves both the felt fairness *and* the account curve; you can't tune one without perturbing the other.
8. **No counterfactual for skipped trades** means we can't validate that "correct passes" actually protected capital — the economic justification for patience is unmeasured.
9. **Telemetry gaps corrupt economy validation.** `ContentLog` tolerates being offline; if economy data is patchy, solvency modeling (EC) is guesswork.
10. **Re-introducing a floor re-introduces dishonesty.** Any "you can't drop below X" safety net is itself a small lie about consequences — so the economy fix may quietly reintroduce the very "the game protects you" feeling V2 exists to remove.

---

## The three attacks most likely to actually kill V2
1. **The wound isn't felt** (Gate 0 fails) — players are happy with the coin flip.
2. **The curve is a tautology** (Gate 1 fails without a gate) — the mechanism is the rejected flip in disguise.
3. **`RESERVE = 0` + honest variance busts beginners** — the economy becomes hostile to the target player, and every fix reintroduces dishonesty.

If any of these holds, no amount of architecture elegance saves it.

---

*Adversarial analysis only. No game code was modified. This document exists to be heeded or disproven before spend — not to be balanced.*
