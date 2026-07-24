# Trading V2 — Acceptance Criteria (Canonical)

**Status:** Evaluation framework — NOT implementation. **Date:** 2026-07-06 (revised; supersedes the earlier categorical draft of this file).
**Companions:** [Architecture](Trading_V2_Architecture_Final.md) · [Prototype Plan](Trading_V2_Prototype_Plan.md) · [Red Team](Trading_V2_Red_Team.md) · [Roadmap](Trading_V2_Implementation_Roadmap.md).

**Purpose:** measurable pass/fail gates for whether Trading V2 succeeded. Read against two cohorts — **New** (`?fresh=1` beginner, ideally near the 10-year-old target) and **Veteran** (past L5) — never averaged. `(proposed)` numbers are founder-to-confirm; the *shape* of each threshold is the binding test. n is small early — treat as direction, not proof. Thresholds are **pre-registered** before any test runs.

> **North Star:** **QW-1 (quality→win monotonicity)** outranks everything. If reading better doesn't win more, V2 failed regardless of every other number.

---

## The 7 headline metrics

### QW-1 — Quality → Win Monotonicity *(North Star)*
- **Measure:** log `{qualityBucket, outcome}` per resolved trade (≥500/tier); plot realized win% by bucket. **Critically, with the enforcing gate OFF** (the curve must *emerge*, per [Architecture §C](Trading_V2_Architecture_Final.md)).
- **Success:** win% rises across every bucket (0–2 < 3–4 < 5–6 < 7–8 < 9–10); each within **±5%** *(proposed)* of the tier target; the slope survives with no gate.
- **Failure:** flat, non-monotonic, any bucket off by **>10%**, OR monotonicity only appears when a gate enforces it (→ it's the rejected coin flip).
- **Why:** this is the entire thesis — reading the chart better literally wins more.

### FP-1 — Fairness Perception
- **Measure:** in-game 1-tap "Did that feel fair?" per trade + exit interview; segment by outcome and by quality.
- **Success:** **≥85%** *(proposed)* "fair"; **no** recurring "rigged/cheated" sentiment; A-grade losses still rated fair **≥70%** (the hard case).
- **Failure:** <70% fair overall, OR honest high-quality losses reliably read as unfair.
- **Why:** correctness is worthless if variance feels like rigging. This is the make-or-break emotional metric.

### AT-1 — Attribution ("I know why")
- **Measure:** post-trade "why did that happen?" graded 0–3 (No model / Confabulation / Luck / Correct-and-predictive), **validated** against prediction ability (per [Playtest Protocol](Trading_V2_Beginner_Playtest_Protocol.md) — a confident story that can't predict is confabulation, not attribution).
- **Success:** **≥70%** *(proposed)* of trades graded Correct-and-predictive; confabulation share falling over a session.
- **Failure:** No-model + Confabulation dominate, OR "correct" explanations don't predict above chance.
- **Why:** every review must answer "why did this happen?" *truthfully*, not just plausibly.

### TR-1 — Trade Readability
- **Measure:** the prediction mini-test — show N fresh paused setups, "will it win? how sure?", reveal; compute hit rate + confidence calibration.
- **Success:** hit rate **>65%** *(proposed)* for New on beginner-tier setups, rising with confidence (calibration positive).
- **Failure:** hit rate ≈ chance (≤55%) regardless of confidence → the chart isn't readable; the evidence layer failed.
- **Why:** if the visible evidence doesn't let a player predict, "the chart is the source of truth" is false.

### BC-1 — Beginner Comprehension & Success
- **Measure:** first-session win rate for lesson-followers; ability to state a *correct, testable* rule for entry (exit teach-back, checked against telemetry); early-loss churn.
- **Success:** lesson-followers win **~70%** *(proposed)*; a majority can state a rule that actually beats chance; early-loss churn **<15%**.
- **Failure:** lesson-followers win ≤55%, can't state a working rule, OR first loss is a top churn point.
- **Why:** "beginners still experience success" and "teach expectancy without feeling unfair" are explicit design principles.

### LE-1 — Learning Effectiveness (transfer)
- **Measure:** win% and correct-read rate by per-player rep count on a setup type; mastery-category trend (`masteryScore`); performance on a *held-out* setup type never drilled in the lab.
- **Success:** measurable upward slope over ~15 reps; transfer to a held-out type **above** that type's naïve baseline.
- **Failure:** flat learning curve, OR zero transfer (they learned the lab, not trading).
- **Why:** the product's purpose is *learn trading through gameplay* — not entertain over candles. This is the only metric that tests the actual mission, and it needs a longer study than Gates 0–2.

### CP-1 — Confidence Progression
- **Measure:** track self-rated confidence + selectivity (pass rate on weak setups) + deliberate "pass-two-take-the-strong-one" behavior, over levels.
- **Success:** confidence *and* accuracy rise together (calibrated growth); selectivity on weak setups rises to **≥60%** by L3; deliberate selectivity emerges by ~L2–L3.
- **Failure:** confidence rises while accuracy stays flat (overconfidence — dangerous), OR selectivity never emerges (overtrading persists).
- **Why:** the felt arc "I'm becoming a trader" *and* the guard against teaching false confidence (Red Team, edu #4).

---

## Supporting metrics (secondary gates)

- **EC — Economy solvency (elevated risk: `RESERVE = 0`):** <5% *(proposed)* of New players bust; disciplined-player account curve bounded (no runaway, no grind-to-zero); expectancy positive for selective players, ~neutral/negative for indiscriminate. *If beginners bust, a floor decision is forced (Red Team economy #1/#10).*
- **PR — Progression integrity:** Guardian first-pass rate in a 60–80% *(proposed)* band; ≥3 real applied trades before each boss; no single-level churn cliff; **zero** untaught-concept leaks (`SETUP_UNLOCK`/`conceptTier` asserted at spawn).
- **RT — Retention:** first-loss not a top churn point; D1/D7 meet targets *(founder-set)*; healthy trades/session (engaged, not manic).
- **FL — Feel:** wins with a real drawdown rated *more* satisfying than straight-line wins; headline "trading feel" survey **≥8/10**.

---

## Validity guardrails (or the numbers lie)
- **Blind paired control** (current build vs V2) for all feel/fairness metrics — a single-build score is uninterpretable.
- **Not the founder as sole tester** — the strongest confirmation bias in the room.
- **Curve measured with the gate off** — a gated curve is bookkeeping, not edge.
- **Attribution validated by prediction** — never trust "I understood why" at face value.
- **Unit = trade** for volume; **exclude the 3 forced intro wins** from win/attribution reads.
- **Telemetry confirmed online** — `ContentLog` tolerates being offline; verify data lands or the run is void.

---

*Evaluation framework only. No game code was modified. `(proposed)` numbers are pre-registration starting points; the direction/shape of each threshold is the binding acceptance test.*
