# Trading V2 — Final Architecture & Viability Review

**Status:** Architecture + feasibility review — NOT implementation. No code, no trading changes. **Date:** 2026-07-06. **Against:** build 250.
**Series:** supersedes the draft [`Trading_Architecture_V2_Blueprint.md`](Trading_Architecture_V2_Blueprint.md) as the canonical architecture; companions: [Prototype Plan](Trading_V2_Prototype_Plan.md) · [Red Team](Trading_V2_Red_Team.md) · [Acceptance Criteria](Trading_V2_Acceptance_Criteria.md) · [Roadmap](Trading_V2_Implementation_Roadmap.md) · [Emotional Design](Trading_V2_Emotional_Design.md) · [Playtest Protocol](Trading_V2_Beginner_Playtest_Protocol.md).

> **Reviewer stance:** principal architect trying to prevent 6 weeks of wasted work. The default answer to "should we build this?" is **no** until the evidence forces a yes.

---

## PART 1 — Is Trading V2 actually viable?

### 1. Strongest arguments FOR
- **The current architecture is indefensible on the merits.** Outcome = `Math.random()` (`commitTrade` 11804) with candles puppeteered to match (`tradeDrivenCandle` 2888). Every graded factor is cosmetic. For a product whose *purpose* is "learn trading through gameplay," an outcome uncorrelated with the chart is a foundational defect, not a polish item.
- **The fix is mostly deletion + one honest layer, not a rewrite.** `calcLevels` (11507, structure-anchored SL/TP, 1.5–3R) and `evaluateConfluence` (3683) are already canon-correct and reusable. Entry already anchors to the confirmation candle (`setupZone.to`, 6751). The rot is concentrated in two functions.
- **It's the only path to the stated goal.** "I won because I read the chart" is *impossible* while the chart is a puppet. No amount of ceremony/UX polish reaches 9/10 on top of a coin flip; players eventually feel the disconnect.
- **It compounds educational value.** Once quality→outcome is real, the existing review card, `tradeVerdict` (3690), and `learnExplain` (12073) become *true* instead of theatrical — the teaching infrastructure already built starts working.

### 2. Strongest arguments AGAINST
- **The wound may not be felt.** A beginner can't see a coin flip; `tradeDrivenCandle` already manufactures the dip→recover→run arc; the ceremony already attributes wins. The 1/10 rating is a *designer's* judgment — we have **no evidence a naïve player feels it.** (This is the single biggest reason to pause; see [Playtest Protocol](Trading_V2_Beginner_Playtest_Protocol.md).)
- **Honest markets are meaner.** The current L1–3 ~58% floor is a *kindness*. With `RESERVE = 0` (3304) there is now **no bust protection** — honest losses can zero a beginner's shells. V2 could *increase* early churn, the opposite of the goal.
- **The mechanism can silently become the rejected coin flip.** If "quality" is allowed to *choose* the outcome distribution, we've rebuilt the weighted flip in author's clothing (see the firewall in §3C — this is the make-or-break design constraint).
- **Believable authored futures are unproven in this engine.** `tradeDrivenCandle` spent ~6 builds fighting staircase/flat/teleport artifacts *while steering*; authoring a full future without steering is the same craft problem, unproven.
- **Scope risk.** It touches protected system #9 and, done fully, ripples into economy re-tuning, all 8 setup types, and the boss/curriculum integration — a large surface for a single-file, regression-prone codebase.

### 3. Technical feasibility — **Medium-High risk, but bounded**
Feasible in principle (the resolution + sizing + grading substrate already exists), but the **authored future-path generator is the crux** — believable OHLC that resolves deterministically and survives `decorateCandleWicks`, wick clamps, intrabar touch, and the EMA-dt camera. That one component carries most of the technical risk and is exactly what the offline harness (Prototype Plan, Gate 1) exists to de-risk first.

### 4. Educational feasibility — **Feasible, with a real hazard**
V2 can teach *expectancy* (the hardest, most valuable trading concept) honestly. Hazard: expectancy delivered to a 10-year-old via real losses can read as "it's random / nothing I do matters." The architecture must make the *reason* for every outcome **visible before entry** (not just explainable after) or it teaches fatalism. Legibility, not mere correctness, is the bar.

### 5. Player-experience feasibility — **The genuine unknown**
"Correct" ≠ "feels fair." Variance guarantees good reads that lose and bad reads that win; humans read streaks as rigging regardless of the math. Whether honest resolution *feels* better than a well-crafted puppet is **not knowable from first principles** — it must be measured (Prototype Plan, Gate 2).

### 6. Biggest unknowns
1. Does a naïve player actually feel the current system is arbitrary? (Is the wound real?)
2. Can we author believable, deterministic futures without re-importing the puppet's hacks?
3. Does a quality→win correlation **emerge** from the regime/evidence model *without* being enforced by a gate?
4. Does honest resolution feel *fairer*, or does variance just feel like a meaner rig?
5. Does the economy survive honest losses with `RESERVE = 0`?

### 7. Biggest assumptions (each is a place the project can die)
- That players *want* honesty they can't see.
- That "reading better wins more" can be made real without a hidden win-rate dial.
- That authored variance still produces the emotional drawdown arc the puppet currently scripts.
- That beginners tolerate honest losing streaks.
- That `evaluateConfluence` is a sufficient quality read on authored evidence.

### 8. What would make this fail?
- Building it **before** proving the wound is real (fixing a problem only designers have).
- A "quality→outcome" coupling that reduces to the rejected coin flip.
- Authored futures that look fake (the staircase war, round two).
- A first honest loss that reads as betrayal because the tutorial over-promised "follow the lesson → win."
- An economy that busts beginners now that `RESERVE = 0`.

---

## PART 3 — The Full Trading V2 Architecture

**The organizing principle (and the fix to the #1 red-team objection):**

> **The regime produces both the evidence and the honest future. Quality is a firewalled *read* of the visible evidence only — it never touches the outcome. The quality→win correlation must EMERGE and be MEASURED, never enforced.** The player's edge is *reading accuracy*, not a setup's authored win rate.

This is the crucial refinement over the earlier blueprint: the blueprint's "rejection-sampling gate that enforces the tier curve" is **removed**, because an enforced curve is a bookkeeping tautology (Red Team, §curve). Instead the curve is an emergent property we observe and tune toward — if it doesn't emerge, that's a kill signal, not a thing to fake.

### A. Hidden Market State (the regime model)

**Preferred model: a two-layer state.**
1. **Macro bias** (persists across several setups): `up` / `down` / `neutral` — the "higher-timeframe truth." Gives the world memory and makes HTF alignment a *real* readable factor.
2. **Local regime** (per scenario, sampled conditioned on the macro bias):

| Regime | Truth | Evidence signature | Honest outcome tendency |
|---|---|---|---|
| `continuation` | trend persists | trend + shallow pullback + strong confirm + HTF agrees | favorable *with* the bias |
| `reversal` (CHoCH) | trend flips | sweep of prior extreme + change of character + HTF turning | favorable *against* old bias |
| `exhaustion` | move runs out of gas | momentum shrinking, failed pushes, divergence | fade / chop — mixed |
| `trap` (false break) | break that fails | a break that *looks* like BOS but carries a sweep-and-fail tell | unfavorable (the teaching loss) |
| `range` (accum/dist) | two-sided, pre-breakout | balance at a level, rejections both sides | neutral until it resolves |

**Why this model.** It is the smallest set that (a) covers the founder's list (continuation/reversal/exhaustion/trap/accumulation/distribution collapse cleanly into these five), (b) makes HTF alignment and structure *honestly* readable, (c) produces a natural quality gradient — coherent regimes (clean continuation) emit *agreeing* evidence → high confluence; traps emit *conflicting* evidence → low confluence — so **quality correlates with favorability by construction of the market, not by fiat.** Difficulty scales by shifting the regime *mix* (more traps/reversals later) and the *clarity* dial, never a win-rate knob.

### B. Evidence Layer

**What players see:** momentum candles, pullbacks, BOS, CHoCH, liquidity sweeps, order blocks, VWAP reactions, HTF alignment — the exact factors `evaluateConfluence` already detects.

**How evidence emerges naturally.** Each regime has a *signature* (above). The lead-in candles are authored to contain that signature at a chosen **clarity** (0–1). Clarity controls *legibility only* — how obvious the tell is — **not** the outcome. A high-clarity trap and a low-clarity trap both *fail*; clarity only changes whether the player can *see* the sweep-and-fail tell. This is the honest mechanism: the player's edge is spotting the tell, not being handed a pre-weighted win.

**How difficulty scales — three honest dials:**
1. **Clarity** ↓ over levels (tells get subtler).
2. **Regime mix** → more traps/reversals/exhaustion at higher levels.
3. **Evidence gating** via `SETUP_UNLOCK` (11994) + `conceptTier` (4870) — only taught evidence ever appears (never test the untaught).

### C. Quality Layer

**Reuse `evaluateConfluence` (3683) wholesale.** KEEP: the factor set (trend/BOS/CHoCH/sweep/OB/VWAP/S-R/RR/HTF), the taught-concept gating, the 0–100→grade mapping. REPLACE: its *role* — from cosmetic post-hoc badge to the **pre-trade decision signal**, surfaced age-appropriately (a simple "how strong?" meter before "confluence" is named at L10, per canon Rule 22). ADD one thing: a **conflict penalty** — evidence that *disagrees* (a bullish break with a bearish sweep tell) must *lower* quality, so traps read as genuinely weak.

**The firewall (non-negotiable):** quality is computed **only from visible evidence.** It may never read the hidden regime or the authored outcome. This is what prevents the laundered coin flip.

**Quality → probability:** *emergent and measured, never enforced.* Because favorable regimes emit coherent evidence and traps emit conflicting evidence, higher quality *statistically* accompanies favorable outcomes. We **measure** the resulting curve (Acceptance Criteria QW-1); if it isn't monotone, we tune the regime/evidence coupling — we do **not** bolt on a gate to fake it.

**Quality → decision:** the meter lets the player *choose* the strong setups and *skip* the weak ones. The edge is the choice. This makes "passing is playing" real and teaches selectivity.

### D. Resolution Layer

- **Entry** = close of the authored confirmation candle (`setupZone.to` → `candles[idx].h`, already anchored, 6781). Kill the `turtle.x` fallback in `openTraderView` (11708).
- **Stop** = structure-anchored via `calcLevels` (11507), volatility-floored `max(60, 3·ATR, 1.6·maxMove)`. Reused verbatim.
- **Target** = next structure, clamped 1.5–3R via `calcLevels` (11515). Reused verbatim.
- **Future path** = authored OHLC from the regime, deterministic, that **breathes** (a real drawdown is a property of the regime's path, not a scripted puppet). Replaces `tradeDrivenCandle`.
- **Completion** = first line honestly touched, intrabar wick-inclusive (reuse `maintainCandles` 12454–12460). Deterministic replay; no RNG at resolution.

**How resolution stays honest:** the outcome is a property of the pre-authored path (fixed at authoring from the *regime*, not from quality); resolution is deterministic replay; quality is firewalled from it. Delete `_l1Outcome` (2903/11804/12474) and the "Finn climbs to the line" branch (12481).

### E. Review Layer

Reuse the review card (`tradeChartSVGFull` 7487, `plainSetupReason` 12058, `learnExplain` 12073, `tradeVerdict` 3690). Guarantee "I understand why" by four rules:
1. **The cause was visible pre-entry.** The review highlights the exact evidence/candle that predicted the result — and it was on screen *before* the player committed (legibility, not hindsight).
2. **Process vs outcome, now true.** `tradeVerdict`'s four verdicts (strong+win "textbook", strong+loss "variance", weak+win "luck", weak+loss "too few reasons") become honest the moment quality is firewalled and outcome is regime-authored.
3. **Variance is named as variance.** An A-grade loss shows "your read was right; this regime went the other way this time — here's the evidence you correctly read," so it teaches expectancy, not fatalism.
4. **Traps are taught, not punished.** A trap loss highlights the sweep-and-fail tell: "this looked like a breakout but swept and failed — here's the tell for next time."

---

*Architecture review only. No game code was modified. The design's survival depends on Part 4's attacks and Part 5's measured curve — this document is a hypothesis to be falsified, not a green light.*
