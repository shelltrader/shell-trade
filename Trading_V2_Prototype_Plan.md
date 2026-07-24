# Trading V2 — Prototype Plan (The Smallest Proving Experiment)

**Status:** Experiment design — NOT implementation. No code, no trading changes. **Date:** 2026-07-06. **Against:** build 250.
**Companions:** [Architecture](Trading_V2_Architecture_Final.md) · [Red Team](Trading_V2_Red_Team.md) · [Acceptance Criteria](Trading_V2_Acceptance_Criteria.md) · [Playtest Protocol](Trading_V2_Beginner_Playtest_Protocol.md).

> **Goal:** prove or disprove Trading V2 with the least risk possible. This is a **kill-chain**, not a build plan: three cheap gates in sequence, each able to *end the project* before the next spend. You do not pass Gate N+1 until Gate N passes. Most of the value here is the permission to **stop early**.

---

## The three gates (increasing cost, each a kill switch)

| Gate | Question it answers | Cost | Touches game code? | Can it kill V2? |
|---|---|---|---|---|
| **0 — Is the wound real?** | Do beginners actually feel trading is arbitrary / can't explain outcomes? | ~1 week, 10 testers | No | **Yes** — if the current build already feels fair, stop |
| **1 — Does the curve emerge honestly?** | Does quality→win correlation arise from the regime/evidence model *without* an enforcing gate? | ~2–4 days | No (offline harness) | **Yes** — if it only appears when enforced, the mechanism is the rejected coin flip |
| **2 — Does it feel better?** | In the real loop, does honest resolution feel fairer/more explainable than the puppet? | ~1–2 weeks | Yes (flagged) | **Yes** — if imperceptible or worse in a paired test, stop |

---

## Gate 0 — The beginner comprehension playtest (no code)
Already fully specified in [`Trading_V2_Beginner_Playtest_Protocol.md`](Trading_V2_Beginner_Playtest_Protocol.md).
- **Scope:** 10 trading-naïve testers on the **current shipped build** (`?fresh=1`), measuring whether they understand *why* they won/lost, validated against prediction ability (confabulation guard).
- **Files touched:** none.
- **Systems touched:** none (observation + telemetry read only).
- **Kills V2 if:** the current system already reads as fair/understood, OR players confabulate happily and retain — i.e., the wound is a designer purity concern, not a felt one.
- **Rollback:** n/a.

**Do not proceed to Gate 1 unless Gate 0 shows real, felt pain.**

---

## Gate 1 — The offline curve harness (the smallest *code* experiment)

**This is the true minimum-viable proof of the mechanism**, and it carries **zero risk to the shipping game.**

### Scope
A standalone, headless dev script (or an extension of the existing `lesson-chart-preview.html` dev tool — **not** `chart-quest.html`) that:
1. Implements ONE regime family — **continuation vs trap**, conditioned on a macro bias, with a clarity dial (per [Architecture §A/§B](Trading_V2_Architecture_Final.md)).
2. Authors the evidence + the honest future for each scenario.
3. Grades quality with a **copy** of `evaluateConfluence`'s logic, reading **only visible evidence** (the firewall).
4. Resolves deterministically on structure touch.
5. Runs **10,000+ scenarios** and plots realized win% by quality bucket — **with the enforcing gate turned OFF.**

### Files touched
- One **new** dev-only file (or the existing preview harness). **`chart-quest.html` is untouched.**

### Systems touched
- None in the game. Reuses only the *logic* of `calcLevels` / `evaluateConfluence` by copy, in isolation.

### Assumptions tested
- That a quality→win curve **emerges** from the regime/evidence coupling (not from enforcement).
- That authored futures resolve deterministically and coherently.
- That `evaluateConfluence` produces a usable quality spread on authored evidence.

### Success criteria
- Win% is **monotonic** across quality buckets and the slope is meaningful (bottom bucket clearly < top bucket), **with no enforcing gate.**
- Removing/adding the (optional) conflict penalty moves the curve in the expected direction (evidence the mechanism is causal, not coincidental).

### Failure criteria (kill signals)
- The curve is **flat** without an enforcing gate → quality doesn't predict outcome → the mechanism doesn't work; **stop** (or redesign the regime/evidence coupling before any game code).
- The curve only appears when a gate forces it → **it is the rejected coin flip in disguise**; kill this approach.

### Rollback strategy
- Delete the dev file. Zero game impact.

---

## Gate 2 — The flagged "Trade Lab" (Prototype A — the feel test)

Only if Gates 0 and 1 pass.

### Scope
A **flag-gated** (`?v2proto=1`) lab mode inside `chart-quest.html` that plays real trades through the **existing** ticket → resolution → review UI, using the Gate-1 continuation-vs-trap generator, with **the coin flip and puppet removed for lab trades only.** Everything is inert when the flag is off. Measures **feel** in the real loop.

### Files touched
- **`chart-quest.html` only**, additive and flag-gated. No `index.html` mirror until it graduates; no save-schema changes.

### Systems touched (minimal, additive, guarded)
- `nextCandle` (3028): one branch to stream authored candles when a lab scenario is active.
- `commitTrade` (11739): gate the `_l1Outcome` block behind `!v2proto`.
- Telemetry: log `{regime, clarity, qualityBucket, outcome, R}`.
- **Reused unchanged:** `calcLevels`, `evaluateConfluence`, the ticket, `resolveTrade`, the review card.
- **Honest classification:** this touches protected system #9. Even flagged, it is a **LARGE, approval-gated change** per `CLAUDE_RULES.md` — isolation lowers *risk*, not *classification*.

### Assumptions tested
- Does honest resolution *feel* fairer/more explainable than the puppet? (PX)
- Does an authored path *breathe* (produce the drawdown scare) without steering?
- Does the integrated loop reveal any technical incompatibility (wick clamps, watchdogs, camera) the offline harness couldn't?

### Success criteria
- In a **blind, paired** test (current build vs lab, non-founder beginners), the lab scores **higher on "felt fair" and "I knew why"** with a meaningful gap.
- No staircase/teleport artifacts; authored wins reliably include a real drawdown.
- The live win% curve matches the offline curve (no integration corruption).

### Failure criteria (kill signals)
- **No significant difference** in a paired test → the improvement is imperceptible → not worth the redesign.
- Authored paths look fake, or only look real by re-importing `tradeDrivenCandle`'s hacks → "author-first without a puppet" isn't achievable here.
- Honest losses reliably produce "rigged/unfair" sentiment the review can't defuse.

### Rollback strategy
- **Flag off = original behavior** (branch skipped, coin flip restored). Rollback = don't set the flag.
- Hard removal: additive/isolated, no save keys, no mirror — delete the scenario block + two guarded hooks to fully revert. One-hunk-group revert, no migration.

---

## Why this ordering prevents 6 weeks of waste
Gate 0 (1 week, no code) can kill the whole thing before an engineer opens the file. Gate 1 (2–4 days, no game code) can kill the *mechanism* before touching protected system #9. Only a project that survives both earns the flagged in-game spend of Gate 2 — and even that is reversible by a flag. **The expensive, irreversible work (full architecture, all regimes, economy re-tune, L4+ integration) is never started until all three gates are green.**

---

*Experiment design only. No game code was modified. The purpose of this plan is to make it cheap and fast to discover we are wrong.*
