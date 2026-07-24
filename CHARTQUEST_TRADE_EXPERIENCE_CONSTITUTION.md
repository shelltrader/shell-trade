# ChartQuest — Trade Experience Constitution (TEC)

> **STATUS: PROPOSED — pending founder ratification.** ChartQuest Architecture v1.0 · Drafted 2026-07-17.
> **This document is not yet canon.** Adding a canonical document to the frozen architecture requires an ADR, approval, and re-ratification (`docs/architecture-ratified/ARCHITECTURE_CHANGE_POLICY.md`). The ratifying ADR is **Appendix A** of this file. Until the Approver (Founder / delegate) signs it, this is a proposal with the *force* of a constitution and the *status* of a draft. I cannot self-ratify a frozen architecture; you are the Approver.

**Domain:** Trading (the third pillar, beside `docs/canon/trading_canon.md` and `CHARTQUEST_TRADING_EXPERIENCE_SYSTEM_v1.1.md`).
**Governs:** the *felt experience of a single open trade* — its emotional anatomy, its authored emotional-curve templates, the delivery of that emotion, and the player's agency inside it.
**Ranks under:** `trading_canon.md` (trade truth) and TES v1.1 (the confidence journey). **Ranks over:** any trade-feel feature request.
**One-line charter:** *a trade is not a price chart — it is an emotional journey, and this document is the law of that journey.*

---

## 0 · Executive Summary

**The problem (verified, in the founder's own words).** After the Candle Bible and Visual Unification work, Build 270's trades are *"fair and explained, but not FELT."* The origin complaint, device build 252: *"you just click buttons and you're in the trade — there's no meaning, no payoff, no repercussions."* Trade feel scores **3.2 / 5** and the Golden Path Review calls it *"the make-or-break variable of the entire beta"* — *"everything downstream of the first trade — addiction, paying $25, telling friends — is a function of whether the trade itself feels rewarding."* (Sources: `CHARTQUEST_GOLDEN_PATH_REVIEW_2026-07-15.md`, `CHARTQUEST_BETA_RETENTION_AUDIT_2026-07-10.md`.)

**The diagnosis is not "the trade is unfair."** Fairness was fixed by TES v1.1 (Levels 1–3 are authored, explainable wins; the First Loss is authored). The remaining leak is **staging and agency**, and it has a precise, already-verified shape:

1. **The party is quieter than the funeral.** A routine loss shakes the screen (`shakeT=0.5`, `resolveTrade` :12154); the hard-earned first win **never shakes** (`resolveTrade` win branch :12120). The single most-earned moment of the hour gets less feedback than a failure.
2. **The drama is coded, but the delivery is muted.** The trade's emotional arc *exists* — `tradeDrivenCandle` (:2974) drives a dip → hold → recover → run, and the code's own comment calls the dip *"the single most important emotional moment — felt on EVERY win."* Yet `shellEmotion='worried'` is computed every frame on that dip (:12824) **and thrown away**, because Finn's face is baked into `run.png`. The companion the player just bonded with stands calmly smiling while his own money nearly stops out. The scare has no witness.
3. **The trade is a passive cutscene.** Once committed, the only live control is a manual-close button (`#closeTradeBtn` :1309) — and it is **hidden during the first-trade walkthrough** (:18542). The player watches; they do not *decide*.

**The thesis.** These are not three bugs; they are one missing layer. Nobody owns the trade's *felt experience* as an enforceable, authorable system. This constitution installs that layer.

**The keystone insight (this is the whole document in one idea).** The market's price *path* is authored and honest; the player's **agency is over their *position* against that path** — when to hold, when to bank, whether to honor the stop. This dissolves the apparent contradiction between "the outcome is authored" and "the player is responsible for outcomes": the *market* is authored, but *your realized result* is yours. A win you *held through the scare to earn* shakes the screen honestly — and it can ship **now**, staging-only, with **zero change to outcome logic**, because the authored path already breathes and the player's realized P&L against it is already real (`tradeR()` / `#closeTradeBtn`).

**What this buys, and the challenge to the brief.** The prompt proposed "15–20 meaningful candles." I reject it (respectfully, §7): trades already run **30–60 candles** (`MIN_TRADE_CANDLES=30`, :2973) *and still feel flat* — so candle **count is provably not the lever**. The lever is **how the existing candles are spent** (an enforced emotional beat-budget), **whether the coded emotion is delivered** (the witness/juice contract), and **whether the player decides** (the agency system). This document specifies all three, gives you a **library of authored emotional-curve templates** to generate trades *from* (not validate *after*), and a **validation registry (`TX-*`) + machine-readable schema** so a flat trade becomes *impossible to author*, not merely discouraged.

**The guardrail.** This constitution operates in two layers, and never confuses them:
- **NOW (beta scope):** staging-only feel + authored agency. **Outcome logic byte-unchanged** (roadmap constraint P0-4). Everything tagged `[NOW]` ships against the current authored engine.
- **GATED (future):** consequential agency where an honest path can genuinely punish a bad decision. Everything tagged `[GATED]` is **deferred behind the Trading-V2 validate-first kill-chain (Gate 0 → 1 → 2)** and this document **does not authorize building it**. It does not re-open quality-weighted RNG (rejected), and it does not move the First Loss (locked).

### Deliverables map (the ten the brief requested → where they live)

| # | Requested deliverable | Part |
|---|---|---|
| 1 | Trade Experience Constitution | this whole document |
| 2 | Emotional Architecture Specification | **Part III** (the EP phase model) |
| 3 | Trade Validation System | **Part XI** (`TX-*` registry + schema) |
| 4 | Trade Authoring Pipeline | **Part IX** |
| 5 | Emotional Curve Library | **Part VII** (the `EC-*` templates) |
| 6 | Progression Guidelines | **Part VIII** |
| 7 | Anti-Pattern Library ("Trades That Must Never Exist") | **Part X** |
| 8 | Automated Validation Rules | **Part XI** + Appendix A |
| 9 | Future Expansion Strategy | **Part XIII** |
| 10 | Executive Summary | **§0** (this section) |

---

## Part I · Placement, Authority, and the Ownership Map

### I.1 Why this is a new pillar, not a rewrite

Your Architecture Constitution's Principle 3 is **Reference, Never Duplicate**, and Principle 1 is **One Source of Truth**. A large fraction of the brief's requests are *already owned* by ratified canon. Restating them here would manufacture the exact drift the governance layer exists to prevent. So this document **owns only the genuinely un-owned gap** and **references** the rest. The gap is real: the intra-trade emotional layer is described nowhere as an enforceable, generative system.

### I.2 The ownership map (binding)

**This document OWNS:**
- **O1** — The **Intra-Trade Phase Model** (Part III): the named emotional phases of an *open* trade and their minimum dwell budgets.
- **O2** — The **Emotional Curve Template Library** (Part VII): the canonical `EC-*` templates a trade is authored *from*.
- **O3** — The **Witness & Juice Delivery Contract** (Part IV): the law that coded emotion must be *delivered*, accessibly, with celebration ≥ disappointment.
- **O4** — The **In-Trade Player-Agency System** (Part V): the decisions available *during* a trade and their two-tier (`[NOW]`/`[GATED]`) rollout.
- **O5** — The **`TX-*` trade-experience validation registry** + `CHARTQUEST_TRADE_SCHEMA.json` (Part XI): the automated gate.

**This document REFERENCES (and must never restate):**

| Fact needed | Owned by | Cite, don't copy |
|---|---|---|
| Outcome, causality, *quality = win-odds*, deterministic resolution | `trading_canon.md` (Rules 1–24) | Rule 2, Rule 21, Rule 3, Rule 5 |
| Duration tier bands (beginner min 20 / ideal 30–45 / max 90) | `trading_canon.md` §9 | §9 table |
| Setup roster + the 5-part setup contract | `trading_canon.md` §8 | §8 |
| The confidence *journey* curve (Website → Guardian 3) | TES v1.1 §3 | §3 |
| The First Loss (placement, copy, recovery) | TES v1.1 §A3 | §A3 |
| Forbidden Patterns #1–13; validation tiers A/B; acceptance gates; realism ladder; telemetry proxies; monetization boundary | TES v1.1 §7, §A10, §A11, §A5, §A4, §A6 | by id |
| The emotional **principles** (the "10 Commandments") | `Trading_V2_Emotional_Design.md` Part II | Commandments 1–10 |
| The descriptive stage-by-stage "should feel" | `Trading_V2_Emotional_Design.md` Part I | Stages 1–9 |
| All candle/chart **geometry**, motion, accessibility-in-pixels | `CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md` (`V-*`) | by rule/validator |
| Lesson placement, `taught(conceptKey)`, one-concept, `minTrades ≥ 3` | Curriculum Engine (`VR-*`, D1–D8) | by id |
| The Trade lifecycle state machine (`Armed→Open→Resolving→Closed→Logged`) | `CHARTQUEST_AUTHORING_PIPELINE.md` §6.3 | §6.3 |

**This document must NEVER (hard prohibitions on itself):**
- **N1** — Authorize building the Trading-V2 author-first outcome pipeline. That is gated behind the kill-chain (`Trading_V2_Prototype_Plan.md`). Anything requiring it is tagged `[GATED]`.
- **N2** — Re-open quality-weighted RNG. The founder rejected it; quality is a **firewalled read, never a win knob** (`trading_canon` Rule 21; `Trading_V2_Architecture_Final.md`).
- **N3** — Change trade outcome or causality. `[NOW]` work is **staging-only, outcome logic byte-unchanged** (roadmap P0-4).
- **N4** — Move, soften, or duplicate the First Loss (locked: 2nd L2 trade, `cq_firstloss_v`).
- **N5** — Retune movement physics (protected system #4) or any protected system (#9 trade resolution) without an ADR.
- **N6** — Silently resolve an open founder-call. Open decisions are surfaced (Appendix C) and routed to ADRs, never decided here.

### I.3 Precedence

On **trade truth** (does it win, why, at what odds) → `trading_canon.md` and TES v1.1 are supreme; this document is silent and defers. On the **felt experience of the open trade** (its phases, templates, delivery, agency) → this document governs, and code cites it. Where they meet (e.g. "the drawdown must be felt"), this document **implements** the higher law (Commandment 7 "the drawdown is sacred") as concrete, validatable beats — it never overrides it. **If code and this document disagree on feel, the code is the debt** (mirroring the trading-canon and Visual-Constitution stance).

---

## Part II · The Core Principle and the Keystone

### II.1 The core principle

> **A trade is authored around emotion first. Candles exist to serve the emotional journey — never the reverse.**

This is not a licence to lie. The Visual Constitution's "honest before flattering" and Commandment 1 ("the player must always know why") still bind absolutely. Authoring around emotion means: **you choose the feeling the trade must produce, then compose an honest chart that produces it** — exactly the inversion `trading_canon` Rule 3 already demands ("author the future *before* the trade opens"). Emotion-first and honesty-first are the same discipline viewed from two ends.

### II.2 The keystone: agency is over *position*, not over *outcome*

The brief's hardest requirement — *"the player should feel responsible for outcomes"* — appears to collide with `trading_canon`'s spine (the outcome is authored before entry; resolution is deterministic). It does not, once you separate two things a trade conflates:

- **The price path** — authored, honest, readable. *The market's behavior.* Owned by `trading_canon`. The player does not control it and never should (that would be the puppeteering Rule 3 forbids, in reverse).
- **The player's position against that path** — when they entered, whether they hold, when they exit, whether they honor the stop. *The player's behavior.* **This is theirs.** Their **realized result** is a readout of their decisions against an honest market.

This is literally how real trading works, and it is pedagogically perfect: *the market does what it does; your P&L is what you did about it.* A `scary_winner` path (deep dip, then a run to target) is, for the player, a **test of nerve** — and whether they *held* or *panicked out at the bottom* changes what they walk away with, **without changing one candle of the authored path.**

**Two consequences that make this the load-bearing idea:**
1. It ships **`[NOW]`, staging-only.** The authored path already breathes (`tradeDrivenCandle`); realized P&L against it already exists (`tradeR()`, `#closeTradeBtn` :11384). "I held through the scare and got paid" is deliverable today with witness + juice + a hold/exit framing — **zero outcome-logic change** (satisfies N3).
2. It is **honest even before Trading-V2.** `Trading_V2_Emotional_Design.md` argues the emotions can only be "true" once quality=odds is live. For *this* axis — *did my in-trade discipline change my result?* — the answer is true the moment the player can exit early against a real, moving P&L. The market's *predictiveness* is a separate (gated) axis; the player's *responsibility for their own exit* is deliverable now.

### II.3 The felt target (the success sentence)

Every trade is authored to make the player able to say, truthfully:

> **"I made that call."** — not — **"the game decided for me."**

Part XII operationalizes this into measurable gates. It is the single sentence every other law in this document serves.

---

## Part III · Emotional Architecture Specification *(Deliverable 2)*

### III.1 What this owns vs. references

`Trading_V2_Emotional_Design.md` Part I already narrates *nine* experiential stages across the whole trade (Setup → Evaluate → Decide → Enter → **Active → Wins → Loses** → Review → Progression). Stages 1–4 (pre-commit) are owned by `trading_canon` §6 (portal) and that doc; Stage 8 (review) is owned by `trading_canon` §7; Stage 9 (progression) by TES. **This document owns the exploded anatomy of Stages 5–7 — the *open* trade — as an enforceable phase model.** That is the un-owned gap and the seat of the flatness.

### III.2 The Intra-Trade Phase Model (EP-1 … EP-6)

Every open trade is composed of six phases, in order. Each phase names the emotion it must produce, its **minimum dwell** (as a fraction of the trade's candle budget — see §7), the visual dialect it uses (delegated to the Visual Constitution), the agency it exposes (Part V), and the witness it requires (Part IV). The ten emotions the brief listed map onto these phases (right column).

| Phase | Name | Intended emotion | Min dwell | Owns delivery of these brief-emotions |
|---|---|---|---|---|
| **EP-1** | **Exposure** | vulnerability / "here we go" | 1 beat (freeze+zoom) | anticipation |
| **EP-2** | **Confirmation** | budding confidence | ≥ 15% of budget | confidence, excitement (early) |
| **EP-3** | **The Wobble** | doubt / uncertainty | ≥ 10% | uncertainty |
| **EP-4** | **The Scare** *(the drawdown — the peak)* | fear → the urge to bail | **≥ 25%** (the sacred beat) | fear, hope (nascent) |
| **EP-5** | **The Turn** | hope → resolution | ≥ 15% | hope, recovery |
| **EP-6** | **The Verdict** | vindication / relief **or** clean sting → clarity | 1 beat, then hands to Review | excitement, relief, disappointment, reflection |

**Grounding in live code (these phases are not invented — they are the coded arc, made law):** `tradeDrivenCandle` already enforces EP-4/EP-5 dwell — WIN dip `≥10 / cap 22` candles (:3001), recovery `≥7 / cap 20` (:3004); LOSS drop `≥9 / cap 16` (:2993), false-hope `≥7 / cap 13` (:2994); the WIN dip travels 72% toward the stop but never through (:3000). This constitution **promotes those constants from an accident of one function into the governed EP dwell budget** every trade must instantiate, and requires the *other* phases (EP-1 exposure ceremony, EP-6 verdict delivery) to be given the same care.

### III.3 Phase laws

- **EP-LAW-1 · No phase may be skipped.** A trade that jumps EP-1 → EP-6 (enter → instant result) is a cutscene, not a trade (see TMNE-1, Part X). Every phase is present and perceptible.
- **EP-LAW-2 · The Scare is sacred and cannot be null.** EP-4 must contain a *real* adverse move that is *felt* — this implements Commandment 7. A straight-line-to-target trade is forbidden (TMNE-4). (Exception: `comfortable_winner` at the Intro tier may run a *shallow* EP-4, never a *zero* EP-4.)
- **EP-LAW-3 · Emotion is delivered, never only computed.** Each phase's emotion must reach the player through the Witness & Juice Contract (Part IV). A phase whose emotion is computed and discarded (today's `shellEmotion` :12824) is a **defect**, not a subtlety.
- **EP-LAW-4 · One phase, one feeling.** Do not stack two conflicting emotions in one phase (Commandment 9's "one lesson" applied to feeling). Cognitive load is a first-class budget (Part VIII).
- **EP-LAW-5 · The transitions carry the meaning.** The *change* between phases (confidence → doubt, fear → relief) is where the memory forms. Author the *transitions* deliberately; do not merely fill each phase.

### III.4 Accessibility of emotion (inherits TES A2 / Forbidden #13)

Every emotional signal a player must feel to learn carries **≥ 2 non-colour, and ≥ 1 non-audio, channels** (screen-mute and colour-blind players must still feel the scare and the win). The Visual Constitution implements the pixel-level cues; this document requires that **the emotional beat survive greyscale *and* silence** — e.g. the Scare is carried by motion (heartbeat pulse, camera), Finn's posture, *and* the risk-band proximity, not by a red flash alone. (Cross-ref: Commandment set is colour-agnostic; VMC Readability Law 9; TES §A2.)

---

## Part IV · The Witness & Juice Delivery Contract *(owns O3)*

This part turns the two most-cited feel bugs — "the party is quieter than the funeral" and "the scare has no witness" — from audit findings into law. All of Part IV is `[NOW]`, staging-only.

### IV.1 The Parity Law (the one-line, highest-ROI fix)

> **TX-01 · A win's feedback must be ≥ its symmetric loss's feedback, on every channel (shake, flash, particles, sound, haptic).**

Today the win branch sets flash + shells but **no shake** (`resolveTrade` :12120), while the loss sets `shakeT=0.5` (:12154). This inverts the emotional economy: the game punches hardest on failure. The fix is to give the earned win a punch *at least equal* to the routine loss.
· *Prevents:* the single worst feel inversion in the build. · *Player:* the best moment of the hour feels like the best moment. · *Teaches:* success is worth more than failure. · *Respects B10:* this amplifies the celebration that fires **after** the learning card is dismissed (`celebrate()` on `dismissLesson`, :12146) — it does **not** touch the learn-before-dopamine sequencing, which is locked.

### IV.2 The Witness Law (Finn must react)

> **TX-02 · Every phase emotion computed for the companion must be rendered on the companion.** `shellEmotion` (:12824) is currently computed each frame during the Scare and discarded because Finn's face is baked into `run.png`. A bonded companion who feels nothing during the drawdown is the "no witness" bug.

Delivery options are the author's (an expression overlay, a posture/tint shift, a sweat/gulp beat, a body-language cue) — the Finn Canonical Character System owns *how* Finn emotes (no arms, no eyebrows; see `FINN_*` canon). This document requires only that **EP-4's fear and EP-6's outcome visibly register on Finn.** `[NOW]` acceptable minimum: a non-`run.png` expression surface driven by the existing `shellEmotion` state.

### IV.3 The Juice Budget (proportion, not spectacle)

> **TX-03 · Feedback intensity scales with what was *earned*, not with P&L size.** A win *held through a deep Scare* (`scary_winner`) earns a bigger punch than a `comfortable_winner`. A lucky/thin win earns an honest, *smaller* note (Commandment 8). This reuses the existing `celebrate({shake, flash, n, dur, sound})` surface (:12146) — no new juice engine.

### IV.4 The Silence-and-Greyscale Clause

> **TX-04 · The emotional arc must survive mute and colour-blindness.** Every juice beat has a non-audio and non-colour redundant channel (motion, posture, position). (Implements TES §A2 / Forbidden #13 at the feel layer; VMC owns the pixels.)

---

## Part V · The In-Trade Player-Agency System *(owns O4 — the brief's "critical" section)*

### V.1 The principle (from the keystone)

The player acts on their **position**, never on the **path** (§II.2). Every agency affordance is a decision about *their* exposure to an honest, authored market. This is what converts a spectator into a participant and makes the outcome *theirs*.

### V.2 The two tiers of agency (the guardrail made concrete)

| Tier | What it is | Ships | Constraint |
|---|---|---|---|
| **Authored / Expressive** | The player *acts* during the trade, and the act changes their **realized result along the authored path** (exit early = bank the path's current P&L; hold = ride to the authored target). The *path* is unchanged. | **`[NOW]`** | Outcome logic byte-unchanged (N3). Uses `#closeTradeBtn` + `tradeR()` (:11384, :18532). |
| **Consequential** | The player's decision changes the *set of honest futures* they're exposed to (a genuinely predictive hold; a real stop-to-breakeven runner) — where a bad hold can honestly cost. | **`[GATED]`** | Requires the author-first honest-outcome engine → **kill-chain Gate 0→1→2** (N1). This document does **not** authorize it. |

### V.3 The `[NOW]` agency surface (what ships for the beta)

Grounded in the existing seam (`#closeTradeBtn` :1309 → `resolveTrade('manual')` :11384; live P&L + R-multiple every frame :18532):

- **A1 · The Hold is a *choice*, not a default.** At EP-4 (the Scare), surface a *"HOLD YOUR PLAN"* affordance beside the live exit. Inaction becomes a decision the player *made*, not one that happened to them. (Commandment 7; `Trading_V2_Emotional_Design` Stage 5.)
- **A2 · The early exit is a real, dignified option.** Banking early against the authored path is *never punished* — it books the honest current P&L. On a `scary_winner`, exiting at the bottom books a smaller/scratched result and the review says, kindly, *"you were right to be nervous — but the plan would have paid; next time, trust the net."* (Never scolding — Commandment 8.)
- **A3 · Reveal it during the walkthrough.** The manual-close control is currently hidden during the first-trade guide (:18542). The **first** trade must *teach* the existence of the exit as a taught beat (it need not force its use), so agency is known from Trade 1.
- **A4 · "Passing is playing" is honored upstream.** The pre-trade skip (portal, `trading_canon` Rule 18; Commandment 4) is the *first* agency and is already first-class in doctrine; this document requires the *in-trade* surface to match its dignity.

### V.4 Agency laws

- **AG-LAW-1 · No fake agency.** A choice offered during a trade must change the player's **realized result** (or, `[GATED]`, their future). A button that changes nothing is theater and is forbidden (TMNE-6, Part X).
- **AG-LAW-2 · Agency is taught before it is tested.** Never expose a decision whose concept isn't `taught()` (Curriculum D2; `trading_canon` Rule 20). Stop-to-breakeven is not offered before risk is taught.
- **AG-LAW-3 · Restraint and holding are rewarded like action.** Honoring the stop, a correct hold, and a correct pass earn the same order of feedback as a good entry (Commandment 4, 7).
- **AG-LAW-4 · Agency never overrides the safety spine.** The universal stop-out (`hitSL` :12016) and the min-duration breathe-gate (§7) bind regardless of player input. The player controls their exit *within* the honest structure, not the structure.

---

## Part VI · *(reserved — merged into Parts IV–V)*

*(The brief's "Player Agency" and "Emotional Architecture" deliverables are fully specified in Parts III–V; this number is intentionally left as a signpost so downstream references to "Part V agency" and "Part III emotion" remain stable.)*

---

## Part VII · The Emotional Curve Template Library *(Deliverable 5 — the generative heart)*

**Why templates are the anti-flatness engine.** The brief asks for a system that makes bad trades *impossible to author*. A validator that rejects flat trades *after* they exist is necessary but not sufficient. The real fix is **generative**: authors compose a trade by *instantiating a named emotional-curve template*, so the emotion is present *by construction* — the same discipline the Curriculum Engine uses (author from the schema) and the Candle Bible uses (one governing formula). A trade with no `EC-*` template is not authorable (TX-10, Part XI).

Each template is a **phase-dwell allocation + an outcome + an agency hinge + a target psychology + a tier + a code mapping + the one lesson.** Templates delegate *outcome legality* to `trading_canon` and *candle shape* to the Visual Constitution; they own only the **emotional allocation**.

### VII.1 The templates

**EC-1 · `comfortable_winner`** — *the on-ramp.*
Phase shape: shallow EP-4, clean EP-5 up. Outcome: authored win (`[NOW]`). Agency hinge: hold (low-stakes; exit available but unneeded). Psychology: *"I read it, it worked."* Baseline competence. Tier: **Intro / Guardian 1**. Maps: forced 2:1 wins, Trades 1–2 (`_l1Outcome='win'` :11339). Lesson: *see → decide → wait → win.* (`Emotional_Design` Trades 1–2.)

**EC-2 · `scary_winner`** — *the drug.*
Phase shape: **deep EP-4** (dip 72% to stop), false-hope, EP-5 run to target. Outcome: authored win (`[NOW]`). **Agency hinge: HOLD vs. panic-exit at the bottom** — holding books the full authored win; exiting books a scratch and a kind review. Psychology: *"I held through fear and was right."* Tier: **early (Trade 3+)**. Maps: `tradeDrivenCandle` WIN branch (:2989, :3000). Lesson: drawdown is normal; the stop lets you stay calm. *This template is the beating heart of the beta fix.* (`Emotional_Design` Trade 3.)

**EC-3 · `discipline_winner`** — *patience pays.*
Phase shape: EP-5 offers an early-bank temptation *before* full target; holding to target pays more. Outcome: authored win (`[NOW]`). Agency hinge: **bank-early vs. hold-to-target** (real P&L difference via `#closeTradeBtn`). Psychology: *"waiting paid."* Tier: **early–mid**. Lesson: let a good plan finish.

**EC-4 · `patient_winner`** — *the setup matures slowly.*
Phase shape: long EP-2/EP-3 before EP-4. Outcome: authored win. Agency hinge: the *pass* on premature entries (Commandment 4). Psychology: *"a turtle waits."* Tier: **mid**. Lesson: the best entry is worth waiting for.

**EC-5 · `trend_continuation`** — *ride the freight train.*
Phase shape: mild EP-4, EP-5 with-trend. Outcome: authored win. Psychology: trust the trend. Tier: **early (Guardian 2 — trend)**. Lesson: don't fight the strong close (`trading_canon` momentum setup).

**EC-6 · `false_breakout`** — *the wick that lied.*
Phase shape: EP-2 fakes a break (wick beyond structure), EP-4 reveals the failure on the *close*. Outcome: authored loss **or** avoided-entry, telegraphed. Psychology: *"the close is the truth, not the wick."* Tier: **mid (Guardian 3 — BOS)**. Accessibility: the wick-vs-close distinction must be non-colour (VMC). Lesson: a break counts on the close (`trading_canon` BOS).

**EC-7 · `second_chance`** — *there's always another bus.*
Phase shape: player skips/misses entry 1; a fresh, cleaner setup forms. Outcome: authored win on the second. Agency hinge: the pass + the re-engage. Psychology: *"missing one is not missing out."* Tier: **early–mid**. Lesson: patience beats FOMO (TES A8 "FOMO"; Commandment 4).

**EC-8 · `painful_loss`** — *the keystone loss.* **⚠ Reference-only.**
This template's canonical instance is **TES v1.1 §A3, "The First Loss"** — locked placement (2nd L2 trade, `cq_firstloss_v` :11261), a *correct read*, a telegraphed stop-protected loss, followed by an authored recovery win (`session._recoverNextWin` :11254). **This document owns the *form* (a good-read loss, felt over ≥ the tier min, bracketed by wins, cause named on replay) and defers the *instance* entirely to TES.** Do not restate its copy here (N4, Principle 3). Agency hinge: **honor the stop — don't move it** (TES A8 "Moving stops"). Tier: **Level 2 (locked)**.

**EC-9 · `variance_loss`** — *an A-grade loss.* **`[GATED]` (mostly).**
Phase shape: strong read, honest failure, stop caps it; framed as variance ("keep taking these"). Outcome: honest loss. **This requires the honest-outcome engine to be *true* rather than authored** for tiers beyond the single scripted First Loss → **`[GATED]` behind the kill-chain** (N1); the *only* `[NOW]` instance is the authored First Loss (EC-8). Psychology: *"I did it right; the market did its thing."* Tier: **mid+ (gated)**. Lesson: process ≠ outcome (Commandment 8; `trading_canon` Rule 23).

**EC-10 · `greedy_loss`** — *the winner you didn't bank.* **`[GATED]` + guarded.**
Phase shape: a trade in profit that the player *could* have banked; declining the offered exit lets the authored path give it back to a scratch/small loss (teaches take-profit). **Requires consequential agency** (Tier 2, §V.2) → **`[GATED]`**. **Guard:** must never violate Forbidden #9 (never punish the *right* process) — greed is a *taught* mistake and this is an **advanced-tier** template only, never a beginner's, and never fires on a disciplined hold. Psychology: *"take the profit the plan offered."* Tier: **late (gated)**.

### VII.2 Template law

- **EC-LAW-1 · Every trade instantiates exactly one `EC-*` template** (schema `curveTemplate`, Part XI). No free-hand trades.
- **EC-LAW-2 · A template fixes the emotion, never the outcome legality.** Whether the authored outcome is legal is `trading_canon`'s call (Rules 2–5, 21); the template may not smuggle an outcome the canon forbids.
- **EC-LAW-3 · `[GATED]` templates are inert until the kill-chain clears.** Authoring tools expose them as *locked* with a pointer to the gate. Shipping one `[NOW]` is a constitutional violation (N1).
- **EC-LAW-4 · New templates are added by ADR** (Part XIII), never hand-injected.

---

## Part VIII · Progression Guidelines *(Deliverable 6)*

Emotional complexity and agency **ramp with competence** — never as a switch (this parallels, and defers to, TES §A5's Realism Transition Ladder; it does not restate it). Two new ramps this document owns:

### VIII.1 The Emotional-Palette Ramp

| Stage | Templates unlocked | Palette | Agency |
|---|---|---|---|
| **Intro / Guardian 1** (The Gambler) | EC-1 | anticipation → confidence → relief. **Shallow** EP-4 only. | Portal skip; exit *taught* but not needed (A3). |
| **Early (G1–G3)** | + EC-2, EC-5, EC-7, **EC-8 (First Loss, L2)** | + the Scare (real EP-4), the honest sting. | Hold-vs-panic (A1/A2); honor-the-stop. |
| **Mid (G4–G6)** | + EC-3, EC-4, EC-6, **EC-9 `[GATED]`** | + variance, temptation, the false break. | Bank-vs-hold; stop-to-breakeven `[GATED]`. |
| **Late (G7–G10 + Market Maker)** | + **EC-10 `[GATED]`** | full palette; the market can honestly punish. | Full consequential agency `[GATED]`. |

### VIII.2 The cognitive-load law

> **TX-05 · Never introduce a new *emotion* and a new *concept* in the same trade.** (The feeling-side twin of Curriculum Law "one primary concept" / TES Forbidden #5.) The First Loss teaches the stop *using* an emotion the player has already survived in `scary_winner` — never a new concept *and* a new feeling at once. Overwhelm is a churn vector as real as boredom (TES critique B2/B3).

### VIII.3 Boundary note (scope honesty)

The largest beta attrition is **pre-trade** — the traversal wall and the cold-open (Golden Path Review; ~5–7 of 10 reach Guardian 1, *"every dropout lost upstream"*). **This constitution governs the trade; it cannot fix a funnel leak that happens before the trade.** Those fixes live in onboarding/traversal work (VMC platforming rules, protected #4). Surfaced here so no one mistakes a great trade for a fixed funnel.

---

## Part IX · The Trade Authoring Pipeline *(Deliverable 4)*

The brief's requested flow — *objective → emotional journey → decisions → template → candles → validation → playable* — is correct, and it is realized as a **sub-pipeline that slots into the ratified Curriculum Authoring Pipeline** (which already defines a Trade as a lifecycle contract, §6.3: `Armed→Open→Resolving→Closed→Logged`). It does not replace it.

```
TA1  Objective        ← reference the lesson's locked learningObjective (Curriculum S2). Never re-owned.
  ↓
TA2  Emotional target  ← choose the intended feeling + the one EC-* template (Part VII).      [OWNED]
  ↓
TA3  Author the future ← the honest price path + legal outcome.  DELEGATE → trading_canon Rule 3, §8.
  ↓
TA4  Phase budget      ← allocate the candle budget across EP-1..EP-6 with min dwell (Part III). [OWNED]
  ↓
TA5  Agency beat(s)    ← place the in-trade decision(s); tag [NOW]/[GATED] (Part V).            [OWNED]
  ↓
TA6  Candle generation ← DELEGATE → Visual Market Constitution (geometry) + setupFlowCandle/tradeDrivenCandle seam.
  ↓
TA7  Validate          ← TX-* registry + VR-*/V-*/Forbidden by reference (Part XI).             [OWNED gate]
  ↓
TA8  Approve           ← founder sign-off. reference Curriculum S8 (same Approver gate).
  ↓
TA9  Publish / Monitor ← reference Curriculum S9–S10; telemetry proxies TES §A4 + TX gates (Part XII).
```

**Pipeline laws:**
- **PL-1 · Emotion precedes candles.** TA2/TA4 (the feeling) are locked *before* TA6 (the candles), enforcing the core principle (§II.1). A trade authored candles-first ("random candles, hope it teaches") is the anti-pattern this pipeline exists to kill.
- **PL-2 · No side door.** A trade reaches `Open` only through this pipeline (Curriculum Prime Directive). No hand-tuned trade bypasses TA7.
- **PL-3 · Outcome is `trading_canon`'s at TA3, always.** The pipeline authors *feeling and position*, never *win/odds* — that stays firewalled (N2).

---

## Part X · Anti-Pattern Library — "Trades That Must Never Exist" *(Deliverable 7)*

The **outcome-level** forbidden trades already exist as **TES v1.1 §7 Forbidden Patterns #1–13** (random tutorial loss, sub-minimum duration, hidden mechanic, unavoidable stop, two concepts at once, difficulty spike, contradiction, testing the untaught, punishing the right process, burying the outcome, outcome disagreeing with the chart, gating on luck, colour-only signal). **This document does not restate them — they bind by reference.** What follows are the **experience-level** anti-patterns this pillar owns, each bound to a `TX-*` validator (Part XI). The brief asked to *expand this extensively* — here it is.

- **TMNE-1 · The Passive Cutscene.** A trade with zero in-trade agency; the player watches an authored result. *Bound to TX-11.* (Today's default.)
- **TMNE-2 · The Muted Trade.** A trade whose coded emotion is computed and discarded (`shellEmotion` thrown away). *Bound to TX-02.*
- **TMNE-3 · The Quiet Party.** A win with less feedback than a comparable loss. *Bound to TX-01.*
- **TMNE-4 · The Peakless Trade.** No real EP-4 Scare — a straight line to target. *Bound to TX-06 / EP-LAW-2 / Commandment 7.*
- **TMNE-5 · The Undifferentiated Field.** The candle budget spent as uniform filler — no phase structure, no dwell allocation (a 30-candle *flat* trade). *Bound to TX-07.*
- **TMNE-6 · Agency Theater.** A choice offered that changes nothing in the player's realized result. *Bound to TX-12 / AG-LAW-1.*
- **TMNE-7 · The Emotional Monotone.** No transition between phases; the feeling never changes. *Bound to TX-06 / EP-LAW-5.*
- **TMNE-8 · The Unwitnessed Win.** The outcome lands with no reaction from Finn. *Bound to TX-02.*
- **TMNE-9 · The Snapped Resolution.** A trade that resolves before its min-dwell budget (the build-253 "too fast" bug). *Bound to TX-08; already gated live by `MIN_TRADE_CANDLES` (:2973) — this makes it a schema law, not one function's constant.*
- **TMNE-10 · The Laundered Coin Flip.** Any attempt to make quality *cause* the outcome via a weighted roll. *Bound to N2; forbidden forever (`trading_canon` Rule 21).*
- **TMNE-11 · The Gaslit Loss.** A loss reframed as "a good trade" with no on-chart cause named. *Bound to Commandment 8 / `trading_canon` §7 (name the cause on the replay).*
- **TMNE-12 · The Flattering Fluke.** A thin/lucky win celebrated as skill. *Bound to TX-03 / Commandment 8.*
- **TMNE-13 · The Overwhelm.** A new emotion *and* a new concept in one trade. *Bound to TX-05.*
- **TMNE-14 · The Premature Decision.** An agency affordance for an untaught concept. *Bound to AG-LAW-2 / `trading_canon` Rule 20.*
- **TMNE-15 · The Ungated Future.** Shipping a `[GATED]` template or consequential-agency beat without clearing the kill-chain. *Bound to N1 / EC-LAW-3.*

---

## Part XI · The Trade Validation System & Automated Rules *(Deliverables 3 & 8)*

### XI.1 The `TX-*` registry (the trade-experience validation registry)

Your Architecture Constitution mandates *one validation registry per domain* (`VR-*` Curriculum, `PR-*` Pattern, `V-*` Visual). The Trading domain has rules (`trading_canon` "Rule N", TES "Forbidden N") but **no machine registry**. This document proposes **`TX-*`** as that registry — the trade-experience validators — introduced by the ADR (Appendix A). `TX-*` **composes with, and never restates,** the other registries.

| Id | Rule (author-time, blocking unless noted) | Layer | Enforces |
|---|---|---|---|
| **TX-01** | Win feedback ≥ symmetric loss feedback on every channel | `[NOW]` | Parity Law / TMNE-3 |
| **TX-02** | Computed companion emotion is rendered, not discarded | `[NOW]` | Witness Law / TMNE-2, 8 |
| **TX-03** | Juice intensity scales with *earned*, not P&L | `[NOW]` | Juice Budget / TMNE-12 |
| **TX-04** | Emotional arc survives mute + greyscale | `[NOW]` | TES A2 / Forbidden #13 |
| **TX-05** | ≤ 1 new emotion **or** concept per trade, never both | both | Cognitive load / TMNE-13 |
| **TX-06** | Trade contains ≥ 1 real phase transition (not a monotone) | both | EP-LAW-5 / TMNE-4,7 |
| **TX-07** | Candle budget allocated to EP phases w/ min dwell (no uniform filler) | both | Phase model / TMNE-5 |
| **TX-08** | Trade cannot resolve before its dwell budget (breathe-gate) | `[NOW]` (live) | TMNE-9; wraps `MIN_TRADE_CANDLES` |
| **TX-09** | Every agency beat is `taught()` before offered | both | AG-LAW-2 / TMNE-14 |
| **TX-10** | Trade instantiates exactly one `EC-*` template | both | EC-LAW-1 |
| **TX-11** | Non-Intro trades expose ≥ 1 in-trade agency beat | `[NOW]` | AG-LAW / TMNE-1 |
| **TX-12** | Every offered choice changes the realized result (no theater) | both | AG-LAW-1 / TMNE-6 |
| **TX-13** | Outcome/odds untouched by feel work (byte-diff guard on resolution path) | `[NOW]` | N2, N3 / TMNE-10 |
| **TX-14** | `[GATED]` template/agency blocked until kill-chain cleared | both | N1 / EC-LAW-3 / TMNE-15 |

### XI.2 What can be a *live build gate now* vs. planned (mirrors TES §A12)

- **✅ Live-able now (mechanical, low false-fail risk):** TX-08 (already `MIN_TRADE_CANDLES` :2973 — promote to schema), TX-10 (schema requires `curveTemplate`), TX-13 (a byte-diff assertion that the `resolveTrade` outcome path is unchanged by any feel PR — the highest-value drift wire, directly enforcing N3), TX-01 (a static check that the win branch sets a shake ≥ the loss branch's).
- **⏳ Planned (needs careful authoring to avoid false-fail):** TX-06/TX-07 (phase-structure analysis of an authored path), TX-02 (companion-render check), TX-11/TX-12 (agency presence + effect), TX-05/TX-09 (curriculum cross-check via the one `taught()` gate).

### XI.3 The schema

The machine-readable object shape is **`CHARTQUEST_TRADE_SCHEMA.json`** (companion file, this directory), matching the `CHARTQUEST_LESSON_SCHEMA.json` / `CHARTQUEST_PATTERN_SCHEMA.json` convention. Per Architecture Principle 4 (**Schema First**), the schema *is* the definition of an authored trade's shape; this prose describes it and never redefines it. Key fields: `tradeId`, `curveTemplate` (enum of `EC-*`), `lessonRef` (→ Curriculum), `phaseBudget` (EP-1..EP-6 dwell fractions), `agencyBeats[]` (with `tier: NOW|GATED`), `outcomeRef` (→ authored, `trading_canon`-owned; **never an odds field**), `witness` (companion-emotion bindings), `juice` (channel intensities). Validation composes `TX-*` with referenced `VR-*`/`V-*`/Forbidden ids.

---

## Part XII · Success Metrics *(operationalizing "I made that call")*

"It feels better" is not shippable (TES A11). A redesigned trade ships **only when measured** — reusing the TES §A4 telemetry substrate (`ContentLog` → Supabase) and adding agency-specific proxies this document owns.

| Metric (per cohort/level) | Reads | Healthy signal | Owner |
|---|---|---|---|
| **In-trade action rate** | did the player *do* something during the trade? | rising above the passive baseline | TX (new) |
| **Hold-through-Scare rate** | held past EP-4 vs. panic-exit | rising with tier (learning nerve) | TX (new) |
| **Early-exit-vs-target mix** | banked early vs. rode to target | a *distribution*, not all-hold (proves real choice) | TX (new) |
| **"I made that call" survey proxy** | post-trade 1-tap: *"who decided this — you or the game?"* | ≥ 70% "me" after the agency beats land | TX (new) |
| Win-celebration completion | did the amplified celebration play | high (parity fix landed) | TX + A4 |
| Time-to-First-Win, tutorial completion, quit-point map | (existing) | (existing bands) | TES A4 |

**The acceptance gate (adds to TES A11):**
> **TX-ACCEPT · A redesigned trade ships only if testers can point to a decision *they made* that changed their result** — the operational form of §II.3. If they cannot, the trade is still a cutscene, however pretty.

**North-star ordering:** for `[NOW]` beta work, **feel + agency proxies** govern. For any `[GATED]` V2 work, the kill-chain's **QW-1 (quality→win monotonicity)** outranks everything and is *not* this document's to claim (N1).

---

## Part XIII · Future Expansion Strategy *(Deliverable 9)*

- **Adding a template or `TX-*` rule** → an ADR against *this* document (the owning doc), per the Change Policy. Templates are versioned in the schema enum; the registry grows by id. Never hand-inject.
- **The NOW → GATED handoff** → when the founder greenlights Trading-V2 and its kill-chain clears Gate 0→1→2, the `[GATED]` templates (EC-9 broadly, EC-10) and consequential agency (Tier 2) *activate* by flipping their gate flag — the emotional architecture is **already authored to receive them**, so realism arrives as the *designed ramp* TES §A5 promises, not a switch. This document is the receiver; it does not build the sender (N1).
- **Drift protection** (the "ten designers over five years" test): the schema (author-from), the `TX-*` gate (block-on-red), the byte-diff outcome guard (TX-13, N3), and the telemetry (make regression *visible*) together mean a future feel change that flattens a trade, mutes a win, fakes agency, or touches the outcome path **fails a gate with a message pointing here** — the same mechanism that protects the Visual Constitution and TES.
- **Symbol-anchored citations** (Appendix B) let any future author or AI audit every law back to code; a CI symbol-resolution check (as the VMC uses) keeps the map honest.

---

## Appendix A · Ratifying ADR (required to make this canon)

```
# ADR-TX-1 — Ratify the Trade Experience Constitution as the Trading domain's third pillar

Status:        Proposed
Date:          2026-07-17
Owning doc:    CHARTQUEST_TRADE_EXPERIENCE_CONSTITUTION.md (new)
SoT level:     Trading domain (beside trading_canon.md, TES v1.1)

## Problem
Build 270 trades are "fair and explained, but not FELT" (trade feel 3.2/5, "make-or-break
variable of the entire beta"). No canonical document owns the *felt experience* of an open
trade as an enforceable, generative system; the emotional intent lives only in an unratified,
V2-dependent proposal (Trading_V2_Emotional_Design.md).

## Root cause
Architecture is "wrong" by omission: the Trading domain charters "feel" but has no phase model,
template library, delivery contract, agency system, or validation registry for it. Result: the
coded emotional arc is delivered muted, the win under-celebrated, the player passive.

## Alternatives considered
(a) Do nothing — the flatness persists; the beta's fulcrum stays broken.
(b) Fold everything into a standalone "Trade Constitution v1.0" — duplicates trading_canon, TES,
    the 10 Commandments; trips Principles 1/3/6/7 (drift). Rejected.
(c) Amend TES v1.1 — TES owns the *journey*, not the *single-trade anatomy*; overloading it
    blurs a clean ownership line and re-opens a ratified doc. Rejected.
(d) New third pillar that OWNS the gap and REFERENCES the rest (this ADR). Chosen.

## Decision
Ratify TEC as a Trading-domain canonical document; create the TX-* validation registry and
CHARTQUEST_TRADE_SCHEMA.json; add TEC to the Architecture Index and the trading_canon/TES
cross-reference tables. TEC owns O1–O5; references the rest; binds itself with N1–N6.

## Impact
Docs: +TEC, +schema, +TX registry; cross-ref edits (owning docs only) in trading_canon,
TES, Curriculum Authoring Pipeline (Trade §6.3 gains a curveTemplate ref), Architecture Index.
Validators: +TX-* (4 live-able now, rest planned). Assets: existing trades gain a curveTemplate
+ agency beat at next authoring pass (non-breaking; legacy trades grandfather as EC-1 until revised).

## Migration plan (non-breaking)
NOW-tagged rules apply to new/revised trades; existing L1–3 trades map to EC-1/EC-2/EC-8 as-is.
No outcome logic changes (TX-13 guards it). GATED rules inert until the kill-chain clears.

## Tradeoffs
Adds a registry + schema to maintain. Justified: it is the only mechanism that makes flat trades
un-authorable rather than merely discouraged.

## Long-term benefits
The beta's fulcrum becomes measurable and drift-proof; V2 realism has a receiver already built.

## Future risks
Over-scoping into V2 (mitigated by N1 + [GATED] tags + TX-14); registry sprawl (mitigated by ADR-only growth).

## Review date
After the first cohort ships the NOW layer (post-beta).
```

## Appendix B · Code Seam Map (symbol-anchored; line numbers advisory)

| Concern | Symbol / seam | Line | Note |
|---|---|---|---|
| Emotional arc (EP-4/5 dwell) | `tradeDrivenCandle` | :2974 | dip≥10/22, recover≥7/20 (win); drop≥9/16, false-hope≥7/13 (loss); dip 72%→stop :3000 |
| Setup choreography | `setupFlowCandle` | :2910 | momentum→pullback→pullback→confirm (protected #9 — audit, don't touch w/o ADR) |
| Breathe-gate (TX-08) | `MIN_TRADE_CANDLES` | :2973 | =30; two counters `_held`/`_nCand` — latent dup, resolve to one (Appendix C) |
| Parity fix (TX-01) | `resolveTrade` win vs loss | :12120 / :12154 | win: no shake; loss: shakeT=0.5 — the inversion |
| Witness fix (TX-02) | `shellEmotion` | :12824 | computed on the dip, discarded (face baked into run.png) |
| Milestone celebration | `celebrate({shake,flash,n,dur,sound})` | :12146 | fires on `dismissLesson` — B10 sequencing LOCKED; amplify, don't re-order |
| Agency seam (`[NOW]`) | `#closeTradeBtn` → `resolveTrade('manual')` | :1309 / :11384 | live P&L :18532; **hidden in first-trade guide :18542** (fix per A3) |
| Outcome (firewalled) | `authoredTutorialOutcome` | :11252 | all-authored-wins + one First Loss; **quality never couples to outcome** (verified) |
| Candle seam (no `window.CQ`) | `pushCandle` / `candleTop` / `drawCandle` | :2505 / :2536 / :12993 | the real engine; `window.CQ` is aspirational-only |
| **Known defect to fix** | stale `~58% win` comment | :12007 | contradicts all-authored-wins logic; correct it so no one treats 58% as a knob |

## Appendix C · Open Founder-Calls (surfaced, not decided — N6)

This document **routes** these to ADRs; it does not resolve them. Directly relevant to trade feel:
1. **Two duration counters** (`_held`, `_nCand`) both gate `MIN_TRADE_CANDLES` — pick one source of truth for "trade length" (a TX-08 cleanup).
2. **`RESERVE = 0`** (:3386) — no bust protection; if consequential losses ever ship (`[GATED]`), a beginner-floor decision is forced (Trading-V2 Red Team #1).
3. **Reveal the exit control during the first-trade walkthrough** (A3) — a small UX/pedagogy call.
4. **Correct the stale 58% comment** (:12007).
5. Inherited open calls from Phase 3A/3B and the Golden Path Review (Notebook-vs-Journal naming, gold-ENTRY ADR, `setupFlowCandle` alignment, boss renderer floor, Guardian-1 doji teach beat, 5-vs-3 rounds) — none are this document's to decide; listed so the trade-feel work doesn't collide with them.

---

# CHARTQUEST TRADE EXPERIENCE CONSTITUTION
# ⏳ PROPOSED — awaiting founder ratification (Appendix A · ADR-TX-1)

*A trade is not a price chart. It is an emotional journey the player is responsible for. This document is the law of that journey — it owns the feeling and the agency, references the truth and the geometry, and makes a flat, passive, or muted trade impossible to author. It ships its beta layer against today's engine with the outcome untouched, and it keeps a receiver built for the day realism is greenlit — but it never builds that future by itself.*
