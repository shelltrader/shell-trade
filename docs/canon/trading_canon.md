# Trading Canon

**Status:** PERMANENT (target-state doctrine). The permanent trading philosophy — it governs **every trade in the game, Level 1 through the Market Maker finale.** Trading is protected core; see [protected_systems.md](protected_systems.md).
**Created:** 2026-07-06 (Trading System Redesign).
**Ranks under:** the design constitution — `LEARN → PRACTICE → APPLY → TEST`, ≥3 applied trades before a boss, never test the untaught ([gameplay_canon.md](gameplay_canon.md)). **Ranks over:** any feature request. Once approved, all future trading work must conform to this doc.

> **Core principle.** ChartQuest is **not a platformer with trading — it is a trading game disguised as a platformer.** Educational integrity outranks platforming gimmicks. If a mechanic makes trading worse, it is removed or redesigned, never the doctrine.

---

## ⚠️ Canon vs. the current build (read this first)

This document is the **target doctrine**, not a description of the shipping code. **Build 250 violates its spine:** the outcome of a trade is a coin flip decided at entry (`trade._l1Outcome = Math.random() < 0.58` — `commitTrade` 11804, repeated in the resolver 12474) and the chart is then puppeteered to reach that pre-decided result (`tradeDrivenCandle` 2888). Every graded setup, SL/TP calc, and confluence score is therefore **presentation only** — none of it touches the outcome.

Making the code conform to this canon is a **separate, approval-gated task** (it touches protected systems: trade resolution, setup generation, portal identity). Until then: **when the current code and this doc disagree, this doc is the intent and the code is the debt.**

---

## 0. The one law everything else derives from

**The win must be caused by the chart the player could read.**

| | Pipeline |
|---|---|
| **Broken (Build 250)** | reveal setup → flip a coin → fake the candles to match the coin |
| **Canon** | author the honest future first → set setup quality = how strongly the *visible* evidence predicts that future → resolve on real structure being touched |

**Corollary (the causal bridge):** a setup's readable **quality score and its win probability are the same number** (Rule 21). Reading better literally wins more. This single change is what turns "Trading Feel 1/10" into "9/10"; everything below serves it.

---

## 1. The Trading Constitution

24 immutable rules. Each: a statement, then **Prevents / Player / Teaches**.

### Group A — Truth & Causality (the spine)

**RULE 1 — The chart is the only source of truth.** Entry, stop, target, outcome, and grade all derive from candle data — never from platformer state (portal x/y, Finn's position, jump timing).
· *Prevents:* entries born from Finn's body instead of the market. · *Player:* the game feels about the chart, not about landing a jump. · *Teaches:* price — not luck or position — is what you read.

**RULE 2 — Outcome is caused by the setup, never by a coin flip.** Win probability is a monotonic function of readable setup quality.
· *Prevents:* the core "wins/losses feel arbitrary" disconnect. · *Player:* "I won because I read it right" becomes literally true. · *Teaches:* skill matters — the entire point of the game.

**RULE 3 — Author the future *before* the trade opens; never puppeteer candles after entry.** The full price path and its honest answer are composed when the setup forms. Post-entry candles are *revealed*, not *steered*. Retires the steer-to-a-fake-line role of `tradeDrivenCandle` (2888).
· *Prevents:* flat/staircase artifacts, instant resolves, "I won but price never reached target." · *Player:* price moves like a market, not a puppet. · *Teaches:* the future was always in the chart — reading is possible because it's real.

**RULE 4 — Every outcome must be explainable from evidence visible *before* entry.** If the post-trade review cannot point to on-chart proof that predicted the result, the setup is illegal and is never generated.
· *Prevents:* mystery results, superstition. · *Player:* every trade ends in an "ohhh, I see it now." · *Teaches:* pattern recognition over guessing.

**RULE 5 — Resolution is deterministic; randomness lives only in authoring.** Once a scenario is authored, the trade resolves purely on price-vs-structure (first line honestly touched). No RNG at resolution time.
· *Prevents:* hidden dice at the moment of truth. · *Player:* the line that got hit is the line you saw. · *Teaches:* how a real stop/target fills.

### Group B — Entry

**RULE 6 — Entry price is a defined market event, never the portal or Finn.** Entry = the **close of the confirmation candle** of the setup (a candle id, not an x/y).
· *Prevents:* entries drifting to wherever Finn flew in. · *Player:* "you bought here" always points at a real candle. · *Teaches:* you enter on confirmation, at a price.

**RULE 7 — One setup, one way in, one entry.** Flying into the trade portal is the only entry action. The banner is information; the portal is commitment.
· *Prevents:* double-entry confusion. · *Player:* zero ambiguity about how to trade. · *Teaches:* entry is a single deliberate decision.

**RULE 8 — Entry must sit inside chart structure.** The entry candle is a real, on-surface candle at a real level. No entries in empty space above/below the candles.
· *Prevents:* portal-above-candles, unrealistic entry locations. · *Player:* the trade always starts somewhere that looks like a chart. · *Teaches:* levels are physical things on the chart.

### Group C — Stop Loss

**RULE 9 — The stop is anchored to invalidation structure, not a slider or a fixed pixel band.** It sits just beyond the level that would prove the read wrong (swing low for a long, swing high for a short), then widened to clear noise.
· *Prevents:* arbitrary, meaningless stops. · *Player:* "if price gets here, I was wrong" — intuitive. · *Teaches:* stops are placed by logic.

**RULE 10 — Minimum stop distance guarantees noise can't tag it.** Never below the volatility floor (`max(structure, 3·ATR, 1.6·maxMove)` — the existing `calcLevels` 11510 logic is correct; make it permanent).
· *Prevents:* instant, noise-driven stop-outs. · *Player:* a stop-out always required a real move against you. · *Teaches:* signal vs. noise.

**RULE 11 — Maximum stop distance keeps R meaningful and on-screen.** The entry→stop band always renders at a legible minimum height and never exceeds the world's reachable price band.
· *Prevents:* compressed / off-screen risk. · *Player:* you can always see your risk. · *Teaches:* risk is a visible, sized thing.

**RULE 12 — The stop is a promise fixed at entry and always visible.** Max loss is locked when the trade opens and drawn for the trade's whole life.
· *Prevents:* surprise losses. · *Player:* "I knew exactly what I could lose." · *Teaches:* define risk first — the #1 real habit.

### Group D — Take Profit

**RULE 13 — The target is anchored to the next structural objective.** TP sits at the next meaningful level in the trade's favor, then clamped to the fair R band.
· *Prevents:* wishful / degenerate targets. · *Player:* "I'm aiming at that level." · *Teaches:* you exit at structure, not at a wish.

**RULE 14 — Reward:risk is permanently bounded to 1.5R–3R.** Never below 1.5R, never a fantasy 10R. (The `min(max(structure, 1.5R), 3R)` clamp in `calcLevels` 11515 is canon.)
· *Prevents:* insane risk math. · *Player:* every trade risks a little to make more. · *Teaches:* the R-multiple mindset, every trade.

**RULE 15 — SL and TP may never compress into a sliver.** The R band has an absolute minimum on-screen height; the whole setup must fit and read at the current zoom.
· *Prevents:* the "sliver band → resolves in one candle" bug class. · *Player:* the trade always has room to breathe. · *Teaches:* you can always see the plan.

### Group E — Time

**RULE 16 — No instant resolutions; a trade breathes across a minimum candle count.** (Keep `MIN_TRADE_CANDLES` 2887 as a floor — once Rule 3 is real it becomes honest pacing, not a band-aid.)
· *Prevents:* trades resolving in a second. · *Player:* tension — the dip, the recovery — is felt. · *Teaches:* trades play out over time; patience is a skill.

**RULE 17 — Duration scales with tier, and price *moves*, never teleports.** Beginner trades are longer and gentler; advanced trades can be sharper (see §9).
· *Prevents:* uniform, fake pacing. · *Player:* the game grows up with the player. · *Teaches:* timeframes vary; reading speed improves.

### Group F — Portal

**RULE 18 — The portal is a decision gate, not a price.** It represents *commitment* ("do I take this?"), never the entry price. It is skippable, and skipping is a valid, praised decision.
· *Prevents:* the portal contaminating entry price/outcome. · *Player:* flying in feels like a choice, not a dice roll. · *Teaches:* selective entry — you don't trade everything.

**RULE 19 — The portal always renders on the setup, on the candle surface.** Clamped to the confirmation candle's band; never floats above/below the chart or out past the live edge. (Its **color identity is frozen** — blue = trade, `PORTAL_COLORS` 3377 per [ui_canon.md](ui_canon.md); only its *meaning* is defined here.)
· *Prevents:* portals floating in empty space. · *Player:* the "way in" is visibly attached to the setup. · *Teaches:* reinforces where the trade lives.

### Group G — Quality & Learning

**RULE 20 — Grade only on taught concepts; never leak the untaught.** (Already canon via `conceptTier`.)
· *Prevents:* premature jargon. · *Player:* never judged on something you weren't taught. · *Teaches:* aligns with the curriculum constitution.

**RULE 21 — The quality score and the win odds are the same number.** A trade's readable quality (0–10) maps directly to its authored probability of success. Stacking reasons literally stacks the odds.
· *Prevents:* the cosmetic-grade disconnect (an A+ and an F winning equally). · *Player:* "the more it lined up, the more it won." · *Teaches:* confluence = edge, the core lesson of trading.

**RULE 22 — Quality is shown honestly at the moment of decision (age-appropriately).** Before "confluence" is taught, show it as a simple "how strong is this?" signal — but show *something true*, so the player chooses with it.
· *Prevents:* skill being only judged after, never exercised before. · *Player:* "I chose the strong one on purpose." · *Teaches:* decision-making, not just labeling.

**RULE 23 — Losses are lessons; process and outcome are shown separately.** An A-grade loss is framed as variance; an F-grade win is framed as luck. Praise process, be honest about outcome.
· *Prevents:* results-chasing, feeling punished for a good trade. · *Player:* losing well feels okay; winning badly feels like a warning. · *Teaches:* expectancy — the hardest, most valuable mindset.

### Group H — Integrity

**RULE 24 — The trading doctrine outranks platformer gimmicks.** If any movement, camera, portal, or level feature degrades trade truth, the *feature* yields — never the doctrine.
· *Prevents:* the whole "platformer broke the trade" class. · *Player:* the trading always feels first-class. · *Teaches:* the game never lies to make a jump feel cool.

---

## 2. Entry Rules

**What determines entry: the confirmation candle close. Nothing else.** (Rules 1, 6, 8.)

- **The confirmation candle** = the decisive close that proves the setup (the strong close after the pullback; the break candle). It is chosen when the scenario is authored, so entry is deterministic and never drifts. Anchor is the candle **id** (`setupZone.to` 6751), read as `pending.entry = candles[idx].h` (6781) — not `turtle.x`.
- **Kill the fallback** in `openTraderView` (11701) that re-derives the entry index from Finn's position. Always use the authored confirmation candle.

**Why confirmation-candle-close beats every alternative:**

| Candidate | Verdict | Why |
|---|---|---|
| Portal position | ❌ | Platformer state; violates Rules 1, 6, 18. This is the current bug. |
| Raw candle close | ➖ base | Real and on-chart, but not selective. |
| **Confirmation candle close** | ✅ **canon** | Real market logic (enter after the setup proves itself), visually honest forever, immune to platformer drift. |
| Predetermined location | ✅ anchor | The confirmation candle *is* predetermined at authoring time — that's what makes entry deterministic. |

---

## 3. Stop Loss Rules

- **Placement:** just beyond the setup's invalidation level (swing low for longs, swing high for shorts), pushed out to clear noise.
- **Minimum distance:** the volatility floor — `max(structure, 3·ATR, 1.6·maxMove)` (keep `calcLevels` 11510). Ordinary noise can never tag it.
- **Maximum distance:** capped so the R band fits the reachable world and renders legibly (Rules 11, 15).
- **Visual clarity:** one red line labeled STOP LOSS, drawn entry→stop as a shaded risk band, visible the entire trade. No sliver bands, ever.
- **Educational requirement:** every stop is explainable in one 10-year-old sentence — *"If price falls back below here, our idea was wrong."*
- **On the sliders:** demote them. The structure-based stop is the default and the teacher. Manual slider adjustment is an **advanced** affordance, unlocked once risk is taught (L5) — not the beginner's job.

---

## 4. Take Profit Rules

- **Placement:** the next structural objective in the trade's favor (recent swing high/low), clamped to the R band.
- **Minimum R:R:** 1.5R (permanent). **Maximum R:R:** 3R (permanent). Keep the `calcLevels` clamp (11515).
- **Visual:** one green line labeled TAKE PROFIT, with a green target band from entry→TP, so reward and risk read as two sized zones.
- **Language:** shown as plain "risk 10 to make 20," not "2:1," until R:R is formally taught.

---

## 5. Quality Rules (the 0–10 framework)

Quality = the count and independence of **taught** reasons that agree, plus clean risk. Per Rule 21, **this number is the win probability.**

| Score | Meaning | Example (by what's taught) | Authored win prob* |
|---|---|---|---|
| 0–2 | Terrible — take nothing | Against the trend, no structure, bad level | ~35–45% (skip it) |
| 3–4 | Thin — one weak reason | A candle, but fighting the trend | ~48–52% (coin flip) |
| 5–6 | Okay — primary signal + trend | Momentum with the trend | ~58–62% |
| 7–8 | Strong — 3 reasons stack | Trend + level + structure break agree | ~66–72% |
| 9–10 | Elite — full confluence + HTF + clean R | Everything lines up, ≥2R, higher timeframe agrees | ~76–82% |

\* **Difficulty scales by two honest dials only: evidence subtlety and edge size — never a hidden win-rate slider.** Beginner levels bias the *generator* toward 7–10 setups with obvious evidence, so a lesson-follower wins ~70% and **earns** it. Advanced levels flatten the top of the curve toward realism (a 10/10 might be ~62%) — because at the top even great trades lose more, and that *is* the lesson.

**Reuse what exists:** `evaluateConfluence` (3683) / `detectConfluence` (3663) already score trend, structure break, ChoCh, sweep, order block, VWAP, support/resistance, R:R ≥ 2, and HTF alignment. The work is **not** building a grader — it is **wiring the grade into the odds** (Rule 21) and **surfacing an age-appropriate version pre-trade** (Rule 22). Natural learning: over reps the player *notices* that "more stuff lined up" won more often — the name "confluence" arrives at L10, but it's been felt since L2.

---

## 6. Portal Rules

**What the portal represents: the moment of commitment — the threshold between *watching* and *risking*.**

- **Emotional purpose:** courage and choice — the little leap of "I'm deciding to be in the market." Carries mild "here we go" weight; it does **not** decide the outcome.
- **Gameplay purpose:** a decision gate and rhythm beat — it pauses traversal, opens analysis, and rewards reaching it. It is **skippable**, and skipping is a real, valid decision.
- **Educational purpose:** it dramatizes *discipline* — "a setup formed; should I take it?" It teaches selective entry. It must never teach that the portal is the price.

**Concrete rules:**
1. The trade portal spawns **on the confirmation candle**, clamped to the candle surface (Rule 19) — no every-frame re-hover above the live edge (`portalHoverY` 2479 / `spawnPortal` 3394).
2. Flying in opens the ticket at the *candle's* entry price (Rule 6). The portal contributes **nothing** to price, SL, TP, or outcome.
3. Skipping gives feedback — *"Good skip, that one was weak"* on a low-quality setup; a gentle *"that was a strong one"* on a high-quality skip.
4. **Frozen:** portal color identity (blue = trade) and boss-portal identity (gold/orange, 3×) are [ui_canon.md](ui_canon.md) — unchanged. This doc redefines only the trade portal's *meaning*, never its color, size, or the auth→cinematic→academy→play flow.

---

## 7. Review Rules

**Goal:** in one card, the player learns *what they read, what they planned, what happened, and the one lesson.*

**The review, top to bottom:**
1. **Your read** — the setup in plain words + the actual candles highlighted (`plainSetupReason` 12058, `tradeChartSVGFull` 7487).
2. **Your plan** — entry / stop / target as three labeled lines on the replay; the risk you accepted, visible.
3. **What price did** — the honest authored replay animating entry→exit, so they *see* the move that hit the line.
4. **Process vs. outcome (the heart)** — read-strength shown *separately* from result. The four honest verdicts (`tradeVerdict` 3690) — strong+win "textbook," strong+loss "great read, variance," weak+win "that was luck," weak+loss "not enough reasons" — must become **true** (they are true the moment Rule 21 holds).
5. **The one lesson** — a single sentence, 10-year-old words.

**Signal (keep):** the read, the plan, price-vs-plan, the process/outcome split, the one lesson.
**Noise (cut or defer):** P&L to the decimal, XP arithmetic, streak counters, un-taught jargon, multi-factor grids before L10.

**Make losses valuable:** show the **stop did its job** ("being wrong stayed cheap — the plan worked"); **name the cause on the replay** (highlight the candle where the read failed, so the loss is evidence, not a mystery); **frame A-grade losses as variance and F-grade wins as luck** so the player chases *process*, not results. This is the most important thing the review does.

---

## 8. Setup Generation (supporting — required by §2, §5)

**How setups are generated (the inversion, Rule 3):** on the pacing clock, the generator (1) **authors a full scenario** — lead-in, setup pattern, *and* the honest continuation; (2) grades it by how strongly the visible evidence predicts that continuation; (3) that grade **is** the win probability (Rule 21); (4) reveals it — the player reads, decides, enters on confirmation, and the already-authored path resolves honestly on real structure.

**The fixed setup roster (8 types, each gated to the level its concept is taught — keep `SETUP_UNLOCK` 11994):**

| Type | Unlocks | Core read (10-year-old words) |
|---|---|---|
| Momentum / strong close | L1 | green keeps going up, red keeps going down |
| Level pullback | L2 | buy the dip with the trend |
| Break of Structure (BOS) | L3 | price breaks the last high/low |
| Change of Character (ChoCh) | L3 | the trend flips |
| Trend break | L3 | price closes out of its range |
| Order Block tap | L4 | price returns to the origin candle |
| Liquidity sweep | L5 | stops get grabbed, then it reverses |
| VWAP bounce | L6 | price reacts at fair value |

**The five-part contract — no setup type may exist without all five:** (1) a **taught concept** behind it; (2) a **detector** (recognize it); (3) an **authored generator** (produce it *with* an honest answer); (4) a **plain-language reason** (`plainSetupReason`); (5) a **quality contribution** (how it moves the 0–10 score). *A trade that can't satisfy all five is never generated* — this is how "no nonsense trades" and "every trade teachable" are guaranteed.

---

## 9. Trade Duration (supporting — required by Rules 16–17)

World runs ≈1 candle/second during a driven trade.

| Tier | Minimum | Ideal | Maximum | Character |
|---|---|---|---|---|
| Beginner (L1–3) | 20 candles | 30–45 (~30–60s) | 90 | Long, gentle; one clear scare, then resolution |
| Intermediate (L4–7) | 12 | 20–30 | 60 | Faster, genuine back-and-forth |
| Advanced (L8–10 + MM) | 8 | 12–20 | 40 | Sharp; the occasional fast stop-out is allowed (realism), never below the min |

**Permanent duration laws:** (1) never resolve before the tier minimum; (2) price *moves* toward its outcome — no teleport-to-line; (3) a stop-out always requires a real sustained move (Rule 10), even in advanced tiers; (4) the maximum exists so a trade never stalls the level — if it hits max without a clean line it resolves at the honest current R (a "time exit," itself a teachable concept later).

---

## Cross-references & registration

- **Ranks under** [gameplay_canon.md](gameplay_canon.md) (the LEARN→PRACTICE→APPLY→TEST constitution) and respects [progression_canon.md](progression_canon.md) (levels/gating/save) and [ui_canon.md](ui_canon.md) (portal colors, screen flow).
- **Protected-system note:** trade resolution, setup generation, and the entry/portal semantics defined here are protected core. Implementing this canon is an **approval-gated task** per [development_guardrails.md](development_guardrails.md) and [protected_systems.md](protected_systems.md).
- **Registered in canon:** listed in the [README.md](README.md) document table, and frozen as protected system **#9** in [protected_systems.md](protected_systems.md).
- When a `docs/*_AUDIT_*.md` report conflicts with this doc, **this canon wins.**
