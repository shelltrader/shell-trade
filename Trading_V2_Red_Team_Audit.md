# ChartQuest Trading V2 — Red-Team Audit (Pre-Mortem)

**Status:** Adversarial analysis — NOT implementation. **Date:** 2026-07-06.
**Companions:** [`Trading_Architecture_V2_Blueprint.md`](Trading_Architecture_V2_Blueprint.md) · [`Trading_V2_Emotional_Design.md`](Trading_V2_Emotional_Design.md) · [`Trading_V2_Acceptance_Criteria.md`](Trading_V2_Acceptance_Criteria.md).
**Method:** Written from the stance of the most skeptical engineer on the team. Assume Trading V2 *fails*. Attack the proposal. Grounded in the actual `chart-quest.html` codebase, not abstractions.

---

## Context: what is under attack

**Prototype A ("The Trade Lab")** — the smallest proposed proving experiment:
- A flag-gated (`?v2proto=1`) lab mode that plays real trades through the *existing* ticket → resolution → review UI.
- Swaps in **one** author-first scenario family (continuation-vs-trap, with a *clarity* dial that spreads quality across buckets ~2–9).
- **Removes the coin flip** (`_l1Outcome`) and the puppet (`tradeDrivenCandle`) for those trades; resolves honestly on real price-vs-level touch.
- Reuses `calcLevels` (sizing) and `evaluateConfluence` (grading) unchanged.
- Logs `{regime, clarity, qualityBucket, outcome, R}` per trade to measure **PX-1** (quality→win monotonicity, the North Star).
- Changes nothing in live progression when the flag is off.

The thesis Prototype A exists to test rests on three load-bearing beliefs; if any is false, V2 is dead:
1. **Buildable** — an honest OHLC *future* can be authored here that resolves deterministically and doesn't look faked.
2. **The curve emerges** — realized win% rises with readable quality, from authoring, *not* a quality-weighted coin flip.
3. **Honesty feels better** — an honestly-resolved trade feels less rigged and more explainable than the puppet.

The audit below tries to falsify all three.

---

## 1. Ten reasons Prototype A might not improve player experience

1. **The lab isn't the game.** It tests trades sterile and back-to-back — no traversal, no level stakes, no lesson scaffold. Feel is contextual (trade 6 of a level you care about ≠ trade 34 of a grind). The lab could feel *worse* (grindy) or falsely fine, and neither generalizes.
2. **The founder is a poisoned tester.** You know the mechanism, you know it's "honest now," and you *want* it to feel better — the strongest possible confirmation bias. Your "yes, I understood why" says nothing about a 10-year-old who's never seen a candle.
3. **Honesty is invisible.** Players see candles move; they can't see *honesty*. A well-crafted puppet and an honest path can look identical on screen. If the improvement is imperceptible, we rebuilt protected system #9 to fix a problem only the designers can feel.
4. **The current build may already feel fine to beginners.** The coin flip is invisible, `tradeDrivenCandle` already manufactures the dip→recover→run scare, and the ceremony already attributes wins to behavior. The felt uplift for a true beginner may be ~zero.
5. **Honest markets are meaner to beginners.** The ~58% floor is a *kindness*. Under an honest curve, a beginner taking mediocre setups loses more — for reasons they can't yet read — which raises early frustration and churn, the opposite of the goal.
6. **Killing the puppet may kill the drama.** The scare is *engineered* today (dip to 72% of stop, hold, recover). Honest variance won't reliably produce that arc — unless we author it in, at which point we're puppeteering again at authoring time. Anticlimactic honest paths make feel go *down*.
7. **The strength meter turns reading into homework.** A true pre-trade quality signal invites optimization ("wait for 3 bars lit"), not chart-reading — and makes a losing 9/10 feel like the game broke a promise.
8. **Attribution fatigue.** Players already skip review cards. Making the "you won because X" *true* doesn't make it more *read*. Honesty nobody reads delivers no experiential value.
9. **No control = no signal.** The 50-Q checklist is self-report on one build. "Did I feel cheated? No" is meaningless without a blind paired comparison against the current build. It's noise dressed as data.
10. **Sub-threshold uplift can't justify the cost.** Even a real 6→6.5 nudge isn't 9/10, and the prototype can't distinguish "meaningful" from "marginal" — while the full redesign (all 8 setup types, economy re-tune, integration) is enormous.

## 2. Ten biggest technical risks

1. **The staircase war, relocated.** `tradeDrivenCandle` took ~6 builds to stop looking flat/teleporting. Authoring a believable OHLC *future* is the same craft problem minus mid-flight correction. High odds the paths look fake — and "fixing" them re-imports the exact hacks we're deleting.
2. **The authored path isn't actually deterministic.** It must survive `decorateCandleWicks`, the wick clamps, off-screen culling, EMA-dt camera, and *intrabar wick-inclusive* touch detection. Any one can tag an "authored win's" stop with a decorative wick or resolve a candle early.
3. **Cross-`<script>`-block scope trap.** The documented build-202 failure: redeclarations across the 4 blocks crash silently. New scenario state colliding with `trade`/`setupZone`/`market`/`pending` dies without a stack trace.
4. **`frame()` blast radius.** One throw in the generator or the new `nextCandle` branch freezes the entire game. A generator that throws on an edge case (regime that can't fit levels near the price ceiling) is a hard freeze.
5. **Rejection sampling stalls.** "Emit only if (quality, outcome) fits the curve" can loop forever if over-constrained (a quality-9 trap that must lose honestly *and* fit on-screen). Authoring one-ahead during traversal → frame hitches or an infinite loop.
6. **`calcLevels` may not compose with authored setups.** It sizes from *detected* ATR/swings; if it places a stop the authored future ignores, or a sliver band near the world ceiling (the exact bug `_rd0` hacks around at 11786), resolution is incoherent. "Reuse as-is" may be false.
7. **Coin-flip removal has tentacles.** `_l1Outcome` is read in ≥3 places (2903 / 11804 / 12474) and entangled with the Finn-climbs-to-line resolution (12481) and the 90-candle cap. A partial gate can leave a trade that never resolves (softlock) or double-resolves.
8. **Watchdogs fight the new engine.** Anti-stuck (13187), off-chart failsafe (13097), and intro watchdog (18663) assume the current cadence. A legitimately 40-candle authored trade can trip one, or a watchdog can yank state mid-scenario.
9. **Telemetry silently no-ops.** Metrics ride `ContentLog.emit` → Supabase, which is *designed to tolerate being offline*. Play 60 trades offline and the PX-1 curve data never lands — the experiment produces no measurable result and nobody notices.
10. **"Flag-off = inert" is the same claim that preceded past regressions.** This is the single most-churned, most-regression-prone file in the project. Any shared-state init or branch reorder in `nextCandle` can subtly alter live behavior. "Additive and safe" has burned this project before.

## 3. Ten biggest educational risks

1. **"Good reads sometimes lose" reads as "it's random."** Expectancy is the hardest concept in trading; delivered to a child via an actual loss, it can teach fatalism ("nothing I do matters"). The coin flip teaches a cleaner "follow the lesson → win."
2. **The meter becomes the game; reading dies.** Players learn "wait for 3 bars lit," not "read trend + level" — a skill that exists nowhere outside ChartQuest.
3. **Confluence leaks by feel before L10.** Hiding the *word* doesn't hide the *concept*. A true pre-trade strength signal teaches confluence early, violating the curriculum constitution in spirit.
4. **We may install a comforting lie.** Real edges are noisy and regime-dependent; a clean monotonic quality→win curve teaches a false precision ("9/10 wins ~80%") that gets a real trader wrecked.
5. **One-family transfer is unproven.** Learning authored continuation-vs-trap says nothing about reading BOS/OB/sweep/VWAP. We'd validate "they learned *this*" and over-claim "V2 teaches trading."
6. **Traps punish curiosity.** Kids learn by exploring ("what if I take this weird one?"). If exploration = authored loss, they stop exploring and only take spoon-fed setups — the opposite of building a reader.
7. **The lab has no lessons.** Prototype A strips LEARN→PRACTICE→APPLY, so any "did they learn?" signal is confounded — they already knew or pattern-matched the lab.
8. **Fair losing streaks are developmentally toxic.** Variance guarantees a 4-loss streak of good trades. "+Discipline" four times while shells drain may be beyond a 10-year-old's frustration tolerance — "process over outcome" might simply be too advanced for the age.
9. **Told ≠ understood.** "You lost because the trend quietly failed here" — if the player can't independently see it live, honest resolution is still a black box with a nicer label. Legibility isn't guaranteed by correctness.
10. **We may be optimizing the wrong lesson.** The real educational win for a beginner might be literacy + engagement (green=up, patience, stops exist) — which ships today. V2's sophistication could teach *less* by adding noise to a clean primary lesson.

## 4. The easiest ways the quality→win curve could become misleading

1. **It's a tautology.** The rejection gate *enforces* the target curve at authoring. "The curve holds" proves the bookkeeping works, not that quality *causes* wins. Perfect monotonicity is achievable with zero real edge in the candles.
2. **Grader-outcome coupling.** If `evaluateConfluence` reads the same features the author used to encode the regime, quality and outcome correlate *by shared construction* — the curve measures the generator agreeing with itself.
3. **The clarity dial is a laundered win-dial.** If `clarity` moves both visible quality *and* the authored outcome, that's mechanically the quality-weighted coin flip you rejected — wearing an "author-first" costume. The curve looks honest and isn't.
4. **Skip bias starves the tail.** If the player skips weak setups (as intended), the low-quality buckets get near-zero N — exactly where monotonicity must be proven. The "curve" rests on 3 data points at the bottom.
5. **Small-sample illusion.** ~50 trades ÷ 5 buckets ≈ 10 each. Noise routinely fabricates a monotonic ordering or destroys a real one. Fifty points will be over-read either way.
6. **Bucket boundaries paint the picture.** Bin edges (0–2 / 3–4 / …) are a free parameter. Choosing them after seeing data, or authoring quality to cluster mid-bucket, manufactures monotonicity.
7. **Clean variance = deleted realism.** Tuning variance so 9/10s rarely lose and 2/10s rarely win to make the curve "pretty" flattens the very variance that teaches expectancy. A clean curve is evidence we removed realism, not captured it.
8. **Founder-as-expert compresses the data.** You'll read the family near-perfectly, pushing all trades into high-quality/high-win and starving the rest of the curve. It measures an expert, not a beginner.
9. **We measure P(win | quality, *taken*), not the population curve.** Canon promises a population statistic; only taken trades are observable. Passing behavior reshapes the conditional silently, so we may report the wrong quantity entirely.
10. **No counterfactual.** Skipped trades' outcomes are never observed, so we can't confirm the low-quality tail truly loses or that passing was correct. The curve is half-blind by design.

## 5. Ways a player can still feel trading is unfair even if the architecture is correct

1. **Variance reads as rigging.** Take three 8/10s, lose all three (entirely possible honestly) — the player *knows* it's rigged against them. Fairness is a felt frequency, not a true probability.
2. **The honest stop-out feels like a snipe.** Intrabar wick fills mean a path can tag the stop by one wick and reverse — a real fill, and the single most rage-inducing experience in real trading, now faithfully reproduced.
3. **Legibility ≠ live visibility.** If the failure cause is only obvious in hindsight on the replay, the live moment still felt like a mystery and the explanation feels like an excuse.
4. **The strength meter manufactures broken promises.** "Strong" → loss feels like the game *lied*, even though strong ≠ certain — and by design ~20–30% of strong trades must lose.
5. **Losing the safety net reads as a difficulty spike.** Players who leaned on the ~58% floor experience V2 as "the game got meaner" and call it unfair, not realistic.
6. **Process feedback lands as blame.** "You didn't wait for enough reasons" reads to a child as scolding. Accurate ≠ kind.
7. **Skip-feedback whiplash.** "Good skip, that was weak" → an identical-looking setup wins. Honest post-hoc feedback on skips will contradict outcomes and feel like moving goalposts.
8. **Streaks dominate memory.** Losses are remembered ~3× wins. A fair +EV curve still produces streaks that feel unfair — and players quit *during* the streak, never reaching the mean.
9. **Same read, different outcome, across players.** Authored variance means two kids taking "the same" 7/10 get different results. "I lost the one you won" spreads as inconsistency = unfairness.
10. **The tutorial over-promises.** The game teaches "follow the lesson → win." The first lesson-following *loss* feels like a betrayal — *stronger* precisely because the pedagogy set the expectation it then breaks.

---

## What evidence would convince me NOT to build V2

Kill it on **any one** of these — and the test must be built to *make these findable*, not to flatter the thesis:

1. **Imperceptibility in a blind, paired test.** Non-founder beginners play the current build and Prototype A, control-matched. If "trading feel" and "felt cheated" show **no significant difference**, we're fixing a designer's discomfort, not a player's pain. *Kill.*
2. **The curve is bookkeeping, not edge.** If a monotonic curve only survives *because* of the rejection gate or a clarity dial that co-moves quality and outcome — i.e., removing the gate collapses it to flat — then the mechanism is the rejected coin flip in disguise. *Kill.*
3. **Beginners do worse.** If honest resolution measurably *raises* early-loss churn or *drops* D1 versus the coin-flip build, the current system's kindness is load-bearing and V2 harms the actual audience. *Kill.*
4. **The path can't be authored believably within a bounded effort.** If authored futures still look faked, or only look real by re-importing `tradeDrivenCandle`'s hacks, then "author-first without a puppet" isn't achievable in this engine. The premise is false. *Kill.*
5. **Fairness doesn't survive variance.** If honest high-quality losses reliably produce "rigged/unfair" sentiment the review can't defuse, technical correctness buys nothing emotionally. The core thesis is dead. *Kill.*

**What would NOT convince me it's working** (false-comfort traps): a clean curve *from the founder alone*; a good feel score *without a control*; "it didn't crash." None of those test the actual bet.

**The uncomfortable meta-conclusion:** the strongest evidence to *not* build V2 is **evidence that the current build's problem is a purity concern, not a felt one.** Before rebuilding protected system #9, prove the *player* is hurt — that beginners actually feel trading is arbitrary, fail to learn, or churn *because of the coin flip*. If they already feel it's fair, learn the basics, and retain, then V2 is spending enormous risk to satisfy an integrity principle the market never asked for.

So the first thing to fund isn't Prototype A. It's a **one-question instrument on the *current* build** — "did that trade feel fair? / did you know why it happened?" — shipped to real beginners. If the current numbers are already good, the honest move is to *not build V2*. Prototype A is only worth building if the live data first proves the wound is real.

---

*Adversarial analysis only. No game code was modified, and nothing here is approved for implementation. The purpose of this document is to be disproven or heeded before spend, not to be a verdict.*
