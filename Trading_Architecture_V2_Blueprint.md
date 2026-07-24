# ChartQuest — Trading Architecture V2 (Blueprint)

**Status:** Architecture & design proposal — NOT implemented. **Date:** 2026-07-06.
**Scope:** A complete blueprint for making [`docs/canon/trading_canon.md`](docs/canon/trading_canon.md) real. Touches protected system **#9** ([docs/canon/protected_systems.md](docs/canon/protected_systems.md)). This document is *not* authorization to implement — it is the plan to approve **before** any code changes.

Two hard constraints from prior founder direction shape everything:

1. **Author-first, not quality-weighted RNG.** The founder rejected "roll a die weighted by quality." The fix must be the pre-authored scenario pipeline.
2. **#1 and #2 are one change.** "Outcome emerges from the chart" and "quality emerges from the chart" are the same mechanism, not two features.

---

## PART I — Current Architecture Analysis

The game is one file, `chart-quest.html` (~20.6k lines, 4 script blocks). Everything below is a region of it. Today there are **three separate, contradictory trading engines** stitched together by level number.

### 1. Current trading architecture (the three engines)

| Regime | Candle source | Outcome source | Honest? |
|---|---|---|---|
| **L1–3, between trades** | `scriptedCandle`/`cartoonCandle` (2770/2991) + `setupFlowCandle` (2839) | n/a | Textbook-clean, handcrafted |
| **L1–3, trade open** | `tradeDrivenCandle` (2888) | **coin flip** — `trade._l1Outcome = Math.random()<0.58` (`commitTrade` 11804) | ❌ puppeteered to a pre-decided line |
| **L4+** | `MARKET_DATA` real fetched BTC data (2669) via `nextCandle` (3060) | resolves on real touch `hitTP`/`hitSL` (12459) | ➖ honest candles, but outcome uncorrelated with readable quality |

The dispatcher is `nextCandle` (3028): `chartTrialCandle` → `tradeDrivenCandle` (if L≤3 and a trade is live) → `setupFlowCandle` → `scriptedCandle` → `MARKET_DATA`.

**The core defect, precisely:** at L1–3 the outcome is decided by `Math.random()` at entry and the candles are then *steered* to that decision (`tradeDrivenCandle` drives price to `tpH` on a "win", `slH` on a "loss", with a scripted dip→recover→run arc). At L4+ candles are honest but the *future is not authored to make the read correct* — the setup is detected reactively on whatever the canned data does next, so reading better does not win more. **Both violate Rule 2/21: quality ≠ win probability.** Every graded factor is presentation only.

### 2. Current setup generation

- **L1–2:** `setupSeq`/`setupFlowCandle` (2839) hand-prints a **momentum impulse → 2 shallow pullbacks → confirmation** sequence, each candle role-tagged (`flow`), recognized on arrival by `advanceSetupFlow` (6687). This is *already a proto-authoring pipeline* — it composes a shaped setup ahead of Finn.
- **L3+:** reactive detectors on the live stream — `detectMomentum` (11999), `detectPullback` (12023), plus inline BOS/ChoCh/trend-break/VWAP detection in `maintainCandles` (12510–12543). Gated by `SETUP_UNLOCK` (11994) = `{momentum:1, pullback:2, bos:3, choch:3, trend_break:3, ob:4, vwap_bounce:6}`.
- **Quality:** `gradeSetupQuality` (12044) returns A/B/C from *taught* concepts only (`conceptTier`), and `evaluateConfluence` (3683) produces a 0–100 → A+…F score from 11 factors (`CONFLUENCE_CONFIG` 3634). **Neither feeds the outcome.**

### 3. Current portal system

`spawnPortal` (3394) + `portalHoverY` (2479) float the trade portal at a hover height *ahead of the live edge* (it "floats over empty space ahead of the live edge" per the code's own comment at 2488). Blue = trade is frozen in `PORTAL_COLORS` (3377, [ui_canon.md](docs/canon/ui_canon.md)). Flying in calls `openTraderView` (11701). The portal's **position** is platformer state; canon Rule 18/19 wants it to *mean* commitment and *render on the confirmation candle*, contributing nothing to price.

### 4. Current entry logic

Good news: `openPanel` (6744) already anchors the analyzed candle to `setupZone.to` (the confirmation candle id, 6751) and sets `pending.entry = candles[idx].h` (6781) — **this already matches canon Rule 6.** The debt is the fallback in `openTraderView` (11708) that re-derives `idx` from `turtle.x` when nothing is armed, plus a 2-candle look-ahead exploit guard (6763). Entry is *mostly* a candle event already; it just isn't guaranteed.

### 5. Current stop-loss logic

`calcLevels` (11507) is **already canon-correct**: SL beyond swing lo/hi, floored by volatility `max(60, 3·ATR, 1.6·maxMove)` (Rule 10), on-screen room clamps (Rule 11). **But** at L1–3, `commitTrade` (11794/11805) *overrides* it with `_rd0`-based fixed 2R levels tied to the pre-decided coin flip. Sliders (`slSlider`/`tpSlider`) let the player move SL/TP freely (`refreshPanel` 11585). `RESERVE` protects capital.

### 6. Current take-profit logic

Also in `calcLevels` (11515): TP at nearby swing, clamped to **1.5R–3R** (Rules 13/14 — already canon). Same L1–3 override problem (forced 2R matched to the coin flip).

### 7. Current resolution logic

`maintainCandles` (12446–12489) + `resolveTrade` (12554). Intrabar touch: `high>=tpH`/`low<=slH` including wicks (12454). **Universal rule:** any candle through the SL stops out (12470). At L1–3 the win resolves when *Finn physically climbs to the line* (12481) with a 90-candle cap — because the chart was driven there. At L4+ it resolves on honest touch. `resolveTrade` books `delta = win? amt*rr : loss? -amt : amt*tradeR()`, floors at `RESERVE`, then runs the ceremony + `tradeVerdict` (3690).

### 8. Current progression integration

`SETUP_UNLOCK` gates types by level; `conceptTier` (4870) gates what's graded/shown ("never leak the untaught"); `tradeGatePassed` (4924) requires ≥3 applied trades before a Guardian; a final-stretch cutoff (12500–12502) prevents back-to-back-trade softlock before the boss. Mastery EMA (`masteryBump` 3721) feeds the Trader Report and boss weighting. `MIN_TRADE_CANDLES=30` (2887) paces L1–3 trades.

**Verdict:** ~70% of V2 already exists and is *canon-correct* (`calcLevels`, `evaluateConfluence`, `conceptTier`, `SETUP_UNLOCK`, entry anchoring, the review card, `tradeVerdict`). The rot is concentrated in two places: **the coin flip (`_l1Outcome`) and the puppet (`tradeDrivenCandle`)** at L1–3, and the **missing causal link** (quality→outcome) everywhere. V2 is mostly a *deletion plus one new authoring layer*, not a rewrite.

---

## PART II — Trading Architecture V2 Blueprint

### 1. Architecture overview

**One engine replaces three.** Every trade at every level flows through a single pipeline:

```
  RegimeAuthor  →  ScenarioBuffer  →  Reveal  →  Decide  →  Resolve
  (hidden truth)   (authored OHLC)    (read)     (enter)    (replay)

  ┌───────────────────────────────────────────────────────────────┐
  │ 1. Draw hidden REGIME (bull-cont / bear-cont / reversal / trap)│
  │ 2. Author full OHLC FUTURE consistent with regime + noise seed │
  │ 3. Compute STRUCTURE-anchored SL/TP (calcLevels) on the setup  │
  │ 4. Author future to deterministically touch one line first     │
  │ 5. GRADE quality 0–10 from VISIBLE evidence (evaluateConfluence│
  │ 6. GATE: emit only if (quality, outcome) fits the tier curve   │
  └───────────────────────────────────────────────────────────────┘
        │ scenario = {leadIn, setup, entryId, sl, tp, future[], answer, quality}
        ▼
  ScenarioBuffer feeds nextCandle(): lead-in streams → portal on confirmation
        │
        ▼  player reads, skips or flies in → enters at confirmation-candle close
  Resolver replays authored future[] candle-by-candle → first line touched wins
```

**The single law it obeys (canon §0):** the die is rolled **once, at authoring**, to build a *fully-determined* scenario — a real price path with a real answer. Everything after authoring is deterministic: the candles are *revealed*, the outcome is *replayed*, the grade is *measured* from what's on screen. There is no die at resolution and no die weighted by quality.

**Why this is not a quality-weighted coin flip (the distinction that matters):**

| | Rejected: quality-weighted RNG | V2: author-first |
|---|---|---|
| When is outcome decided | at resolution, `rand() < f(quality)` | at authoring, by replaying an authored path |
| What quality *is* | the weight on a die | a *measurement* of an already-fixed future's readability |
| Why quality correlates with wins | because it's literally the die weight (arbitrary) | because evidence and future are **both children of the same hidden regime**, and a rejection gate enforces the tier curve |
| Can the review point to on-chart proof? | no — the candle was faked to match the die | **yes** — the candle *contains* the information that predicted the result |

Quality and outcome correlate not because we multiply a probability by a score, but because **clearer evidence about a hidden truth predicts that truth better** — the same reason reading charts works in real markets. The "odds" in the Rule 21 table are the *emergent population statistics* of the generator, verified by telemetry, not a per-trade knob.

- **Why it works:** it collapses three contradictory engines into one honest one; it makes every canon rule a property of the data instead of a promise in a comment; and it turns the existing (currently cosmetic) grader into the actual edge, which is the single change canon says converts "Trading 1/10 → 9/10."
- **Risks:** it's a Large change to protected system #9; authoring-time cost per scenario; the biggest risk is a *subtle* re-introduction of outcome-first thinking (e.g., authoring the answer then back-filling candles that don't really justify it — that's just the old bug in a new coat). The rejection gate + "explainability assertion" (below) are the guardrails.
- **Complexity:** **XL** overall, but decomposable into shippable M/L slices (see §10). Net new code is one authoring module (~600–900 lines) + a deterministic resolver; the offset is deleting `tradeDrivenCandle` and the `_l1Outcome` branches.

### 2. Hidden regime system

**How it works.** A `Regime` is the ground-truth "what the market is actually doing" for this scenario, invisible to the player. A small, fixed enum:

| Regime | Truth | Beginner base rate | Advanced base rate |
|---|---|---|---|
| `bull_continuation` | up-trend resumes | high | medium |
| `bear_continuation` | down-trend resumes | high | medium |
| `reversal` (ChoCh) | trend flips | medium | medium |
| `trap` / `false_break` | setup *looks* valid, fails | rare | common |
| `chop` | no edge, range | never emitted as a "setup" (used for skip-practice) | occasional |

The author draws a regime per the **tier's regime distribution** (this is the only randomness, and it happens at authoring). The regime carries a **clarity** dial (0–1): how legibly it will be encoded into the visible candles. Beginner tiers draw high-clarity continuation regimes; advanced tiers draw lower clarity and more traps.

Two honest dials, never a hidden win-rate slider (canon §5):

- **Evidence subtlety** = `clarity` (how obvious the read is).
- **Edge size** = the regime base rate + how often the authored "honest variance" bites (even a true uptrend stops you out first sometimes).

**Why it works.** It is the causal root canon Rule 4 demands: *both* the evidence and the outcome descend from the regime, so every result is explainable from pre-entry evidence, and difficulty scales by making the truth harder to see (subtlety) or the edge thinner (base rate) — exactly the two dials canon permits. It also gives "PASS is a rewarded choice" real teeth: `chop`/`trap` scenarios are genuinely worse, so skipping them is genuinely correct.

- **Risks:** picking regime base rates that drift the economy or the felt win rate; over-fitting the enum (too many regimes = unmaintainable). Keep it to ~5.
- **Complexity:** **S–M.** It's a table + a weighted draw + a clarity field. The intelligence lives in §3.

### 3. Scenario generation pipeline

**How it works.** On the pacing clock (reuse `genSetupIn`/`SETUP_WARMUP`), the author builds a complete `Scenario` object *before the portal ever appears*:

1. **Lead-in.** Emit N context candles that establish the regime's premise (a visible trend for continuation; a prior structure for reversal). This is where `setupFlowCandle`'s existing "impulse → pullback → confirmation" shaping (2839) is generalized into a per-type template.
2. **Setup + confirmation candle.** Author the pattern for the chosen `type` (momentum/pullback/BOS/ChoCh/OB/sweep/VWAP), ending in the **confirmation candle** whose close is the entry (Rule 6). Tag `entryId`.
3. **Levels.** Run the *existing* `calcLevels` (11507) on the authored setup → structure-anchored `sl`, `tp`, `risk`, `reward`. (No override — the L1–3 `commitTrade` hack is deleted.)
4. **Author the future.** Generate a **real OHLC path** from the confirmation candle forward, driven by the regime, that **deterministically touches `tp` or `sl` first** and *breathes* first (the authored dip is a property of the path, so `MIN_TRADE_CANDLES` pacing becomes honest, not a band-aid). The path includes regime-appropriate noise; the "answer" is simply *which line the authored path hits first*.
5. **Answer.** `answer = firstLineTouched(future, sl, tp)` — a fact about the data, not a variable.
6. **Explainability assertion (the anti-regression tripwire).** Before emit, assert the post-hoc reviewer (`plainSetupReason` + `evaluateConfluence`) can point to *visible* evidence consistent with `answer`. If a `trap` wins or a clean continuation loses in a way the chart can't justify, **reject and re-author**. This is what forbids the old "fake the candles to match" pattern from sneaking back.

Everything is authored under the **five-part contract** (canon §8): every emittable type has a taught concept, a detector, an *authoring generator*, a `plainSetupReason`, and a quality contribution. A type missing any of the five is never generated. Roster + `SETUP_UNLOCK` gates unchanged.

The `ScenarioBuffer` then feeds `nextCandle`: lead-in candles stream as ambient chart, the portal spawns on `entryId`, and on entry the `future[]` is revealed one candle per tick.

**Why it works.** This is the literal inversion in canon Rule 3: author the honest future *first*, reveal it *after*. It kills `tradeDrivenCandle` (no more steering), kills the reactive-on-canned-data randomness at L4+, and makes "no instant resolve / price moves, never teleports" (Rules 16–17) structural. It reuses the two hardest existing assets (`setupFlowCandle` shaping and `calcLevels`) rather than rebuilding them.

- **Risks:** (a) authoring a future that *looks* fake (staircase artifacts — the current `tradeDrivenCandle` fought this for 6 builds; V2 must inherit that variance work as a path *generator*, not a *steerer*); (b) authoring cost/latency if scenarios are complex — mitigate by authoring one scenario ahead during idle traversal; (c) the explainability assertion is the crux — if it's weak, outcome-first rot returns.
- **Complexity:** **L–XL.** This is the real build. ~500–700 lines: per-type authoring templates, the future-path generator (the trickiest craft), and the assertion. Much is refactored from `setupFlowCandle` + `tradeDrivenCandle`'s variance logic, redirected from "steer" to "compose."

### 4. Quality generation pipeline

**How it works.** Quality is a **read of the authored scenario's visible evidence**, computed by the *existing* `evaluateConfluence` (3683) / `detectConfluence` (3663) on real authored structure, mapped to 0–10, and gated to *taught* concepts via `conceptTier` (canon Rules 20/21). Because the author encoded the regime into the candles with a known `clarity`, the confluence factors it detects are **genuinely there** (if it reports "trend aligned," the authored lead-in genuinely trends; if "swept liquidity," a real authored wick grabbed a prior authored swing) — this is what "no fake confluence" means concretely.

The population invariant (Rule 21) is enforced at the **gate in §3 step 6**, tuned per tier to the canon table:

| Score | Beginner authored win | Advanced authored win |
|---|---|---|
| 0–2 | ~35–45% (skip it) | ~35–45% |
| 3–4 | ~48–52% | ~48–52% |
| 5–6 | ~58–62% | ~58% |
| 7–8 | ~66–72% | ~62% |
| 9–10 | ~76–82% | ~62% (top flattens — realism) |

Surfaced pre-trade **age-appropriately** (Rule 22): before "confluence" is taught (L10), the ticket shows the current plain "how strong is this?" signal (`extraReasons` 11561 already does this) — not the checklist/grade. The full `CONFLUENCE_CHECKLIST` UI (11602) unlocks at L10 exactly as today.

**Why it works.** It makes canon's causal bridge literal — "the readable quality score and the win probability are the same number" — without any new grader. The grader stops being cosmetic and becomes the edge. Beginners win ~70% because the beginner generator *biases toward clear 7–10 setups*, and they **earn** it by taking the strong ones and skipping the weak ones.

- **Risks:** the quality→win curve is an *emergent* statistic — it must be **verified by telemetry**, not assumed. If authoring drift bends the curve, the promise silently breaks. Ship a dashboard panel that plots realized win% by quality bucket per tier.
- **Complexity:** **S–M.** Mostly wiring (`evaluateConfluence` already exists) + the tier-curve gate constants + a telemetry counter. The intelligence is in tuning, not new systems.

### 5. Entry architecture

**How it works.** Entry = **close of the authored confirmation candle** (`scenario.entryId` → `candles[idx].h`), full stop. `openPanel`'s existing `setupZone.to` anchoring (6751/6781) becomes the *only* path; the `turtle.x` fallback in `openTraderView` (11708) and the look-ahead guard (6763) are removed because the confirmation candle is authored, not discovered. The portal is a **decision gate** (Rule 18): flying in opens the ticket at the candle's price and contributes nothing to entry/SL/TP/outcome; **skipping is a real, rewarded choice** with honest feedback ("good skip — that one was weak" on a genuinely low-quality scenario, since quality is now real).

**Why it works.** Entry becomes immune to platformer drift (Rule 1) — "you bought here" always points at a real candle, forever. It also removes an entire class of bugs (portal-above-candles feeding a phantom entry index).

- **Risks:** low. The main one is UX: the one-tap L1 commit (`pickDir`→`commitTrade`, 11729) must still feel instant while the confirmation-candle anchor is authoritative — but that's already how `openPanel` behaves.
- **Complexity:** **S.** Deletion + tightening, not new architecture.

### 6. Risk architecture

**How it works.** Keep `calcLevels` (11507) verbatim — it is already canon (structure-anchored SL, volatility floor `max(60,3·ATR,1.6·maxMove)`, TP at structure clamped **1.5R–3R**, on-screen room clamps). **Delete** the L1–3 override in `commitTrade` (11793–11807). The SL is fixed at entry and drawn for the trade's life (Rule 12); the R band has an absolute minimum on-screen height so it never compresses into a sliver (Rule 15). Sliders are **demoted to an advanced affordance** unlocked once risk is taught (L5) — structure-based levels are the default and the teacher.

Crucially, because the future is authored as a fixed OHLC path, **sliders stay honest**: if a beginner tightens their stop into the authored dip, the authored dip tags it — a real, teachable consequence, not a rigged one. The path doesn't know or care where the player put the line.

**Why it works.** Risk stops being decorative at L1–3 (where it's currently overridden to match the coin flip) and becomes the same real, structure-anchored promise at every level. "Define your risk first" is taught by the default, not by a slider a beginner shouldn't be touching yet.

- **Risks:** the authored future must guarantee the SL/TP band always fits the reachable world (canon Rule 11) — the author must clamp the path within `CFG.levelMin/Max` and *then* place levels, or place levels then author within them. Edge case: near the price ceiling/floor (the exact bug `_rd0` was hacking around at 11786). V2 handles it honestly by authoring the setup away from the extremes.
- **Complexity:** **S.** Mostly deletion; `calcLevels` is reused as-is.

### 7. Resolution architecture

**How it works.** Resolution is a **deterministic replay** of `scenario.future[]` (Rule 5). Each tick reveals the next authored candle; the *existing* intrabar touch logic in `maintainCandles` (12454–12460, wick-inclusive) decides the exact fill; **first line honestly touched wins.** The universal "through the SL → stop out" rule (12470) stays. Everything L1–3-specific is deleted: `_l1Outcome` (both sites — 11804 and the defensive 12474), the "resolve when Finn climbs to the line" branch (12481–12486), and the `tradeDrivenCandle` dispatch (3031). `MIN_TRADE_CANDLES` remains as a floor but is now satisfied *because the authored path has ≥30 candles before its deciding touch*, not because a gate holds price back. `resolveTrade` (12554), the payout math, ceremony, `tradeVerdict` (3690), and the review card are unchanged — but now every `tradeVerdict` string ("great read, variance" / "that was luck") is **true**, because quality and outcome are finally causally linked.

**Why it works.** "Randomness lives only in authoring; resolution is deterministic" (Rule 5) becomes literal. No hidden dice at the moment of truth; the line that got hit is the line the player saw. The review's process-vs-outcome split (canon §7, the heart of the education) stops being aspirational.

- **Risks:** timing/pacing parity — players must not notice the switch from "steered" to "replayed" (they shouldn't; it looks identical, minus the artifacts). The `tradeR()` manual-close path must read the authored path's current price correctly.
- **Complexity:** **M**, mostly *removal*. The resolver is thin because the touch logic already exists; the work is excising the L1–3 special-casing without destabilizing `resolveTrade`.

### 8. Progression integration

**How it works.** Unchanged spine, now honest. `SETUP_UNLOCK` (11994) and `conceptTier` (4870) gate *which regimes/types the author may draw* and *which quality factors are visible* per level — "never test the untaught" (Rule 20) becomes a property of the generator (it literally cannot author a VWAP setup before L6). The **beginner generator biases toward high-clarity continuation regimes** so a lesson-follower wins ~70% and earns it; advanced tiers flatten the curve and add traps. `tradeGatePassed` (≥3 applied trades, 4924) and the final-stretch softlock cutoff (12500) are unchanged. Duration scales by tier via authored path length (canon §9 table: 20/12/8 candle minimums per tier). Mastery EMA (`masteryBump`) now receives *causally meaningful* signal (a good read that won reflects real skill).

**Why it works.** The curriculum constitution (LEARN→PRACTICE→APPLY→TEST) and the trading doctrine finally reinforce each other: each level's setups test exactly what it taught, and the boss quiz tests what the trades practiced. Difficulty is the two honest dials (subtlety, edge), never a hidden win-rate cut.

- **Risks:** re-tuning the felt difficulty curve across 10 levels + MM is a large *content/tuning* effort (not code). Regressions to `conceptTier` gating ripple widely (it's a spine — architecture_map flags it). Beginner-mode `?fresh=1` verification is mandatory.
- **Complexity:** **M** code, **L** tuning. The gates exist; the work is wiring them to the author and re-balancing per tier with telemetry.

### 9. Economy integration

**How it works.** Mechanically unchanged: shells staked (`riskAmt`), `leverage` as exposure-only capped at working capital (`clampAmt` 11531), `RESERVE` floor, `recommendedRiskAmt` ~8% capped at `TRADE_SIZE_CAP=75` (11545), payout `amt*rr` on the real 1.5–3R. What changes is that the **edge is now real**: a disciplined player has genuine positive expectancy (take 7–10s, skip 0–4s), so account growth reflects skill, not the current cosmetic grade. The "PASS is rewarded" patience economy becomes economically true, not just an XP tick.

**The balancing job:** ~70% win at 2R for beginners is a *large* positive expectancy; the caps (`TRADE_SIZE_CAP`, `RESERVE`, fixed small L1 stakes) must keep compounding bounded. Advanced tiers' flattened curve (~62% at top) tightens expectancy toward realism, which naturally slows late-game runaway. Model the account curve across a 10-level run before shipping.

**Why it works.** Separating *feeling of risk* (shells) from *progression* (XP/mastery) already exists; V2 makes the shell curve a truthful scoreboard of process. A cold streak still advances via good process (Rule 23 framing), so beginners don't rage-quit.

- **Risks:** economy solvency (runaway compounding from a real +EV edge) or the opposite (advanced traps feel punishing → churn). Both are *tuning* risks with real numbers now, so they're testable. Monetization stays a stub — untouched (protected #5).
- **Complexity:** **S–M.** No new economy systems; the work is a solvency simulation + tuning the caps/curves. Highest-value cheap safeguard: a Monte-Carlo of the account curve using the tier win-curves.

### 10. Migration strategy

Author-first is a Large, protected-system change. Ship it **behind a flag, per tier, verified by telemetry** — never as one big-bang swap.

**Phase 0 — Instrument the truth (no behavior change).** Add telemetry that logs, per resolved trade: tier, setup type, quality bucket, outcome. This measures the *current* (broken) quality→win curve as a baseline and gives the acceptance test for every later phase. **Complexity S; risk near-zero.** This is the honest first move even before approval to change outcomes.

**Phase 1 — Build the author offline.** Implement `RegimeAuthor` + `ScenarioBuffer` + the explainability assertion behind a `CQ_TRADING_V2` flag, defaulted off. Unit-test the generator in isolation (assert Rule 21 curve emerges over 10k authored scenarios per tier; assert every scenario passes the explainability assertion). **Complexity L; risk contained** — flag off means shipping code is inert.

**Phase 2 — Cut over L1–3 (the worst offender first).** Behind the flag, replace `tradeDrivenCandle` + `_l1Outcome` with the authored resolver at L1–3 only. This is where the coin flip lives, so it's the highest-value slice. Verify on-device in **beginner mode `?fresh=1`** (mandatory), confirm the felt win rate matches the authored curve, confirm no staircase artifacts. **Complexity L; risk HIGH** (protected #9, first-impression path) — hence flag + regression gate + `regression_checklist.md`.

**Phase 3 — Cut over L4+.** Replace the reactive-on-`MARKET_DATA` path with authored scenarios (real data can still seed *lead-in ambiance*, but the traded setup + future are authored). **Complexity M; risk MEDIUM.**

**Phase 4 — Remove the dead engines.** Once telemetry confirms the curve holds across all tiers, delete `tradeDrivenCandle`, the `_l1Outcome` branches, and the L1–3 override in `commitTrade`. Flip the flag default on. **Complexity M; risk LOW** by now (it's deletion of proven-dead code).

**Rollback plan:** the flag is the rollback — flip `CQ_TRADING_V2` off to restore the shipping engine, per phase. Nothing is deleted until Phase 4, after telemetry proof.

**Governance:** this is a `CQ_ALLOW_PROTECTED=1` task touching resolution + setup generation + entry/portal semantics. It must be split into the Large-change process (Implementation Plan / Files / Not-Modified / Risk / Rollback) **per phase**, each separately approved. `chart-quest.html` is the only game file touched; `index.html` mirrors via `cq.sh ship`; the regression gate (`scripts/verify.js`) runs before every commit.

---

## Rollup: complexity & sequencing

| Section | Build | Delete | Net complexity | Risk |
|---|---|---|---|---|
| Regime system | table + weighted draw | — | S–M | Low |
| Scenario pipeline | author templates + future generator + assertion | — | **L–XL** | High (the craft) |
| Quality pipeline | tier-curve gate + telemetry | — | S–M | Med (verify curve) |
| Entry | tighten to `setupZone.to` | `turtle.x` fallback, look-ahead guard | S | Low |
| Risk | reuse `calcLevels` | L1–3 override in `commitTrade` | S | Low |
| Resolution | deterministic replay | `tradeDrivenCandle`, `_l1Outcome` ×2, Finn-climb branch | M (mostly removal) | Med |
| Progression | wire gates to author | — | M code / L tuning | Med |
| Economy | solvency sim + tuning | — | S–M | Med |
| Migration | flag + telemetry + phased cutover | dead engines (Phase 4) | scaffolding | High (protected #9) |

**The one-sentence blueprint:** replace three contradictory engines with one that **authors an honest future first, measures the readable evidence's quality as that future's win probability, and resolves by deterministic replay** — deleting the coin flip and the puppet, reusing `calcLevels`/`evaluateConfluence`/`conceptTier`/the review card, and rolling out behind a flag per tier with telemetry proving the quality→win curve before any dead code is removed.

---

*This document is a design proposal only. No game code was modified, and nothing here is approved for implementation. Implementing it is an approval-gated Large change to protected system #9 per `docs/canon/CLAUDE_RULES.md`.*
