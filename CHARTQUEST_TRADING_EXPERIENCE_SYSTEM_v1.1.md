# ChartQuest — Trading Experience System (TES) · **VERSION 1.1**

**Status:** PERMANENT · the production constitution for all trading development.
**Supersedes:** [CHARTQUEST_TRADING_EXPERIENCE_SYSTEM.md](CHARTQUEST_TRADING_EXPERIENCE_SYSTEM.md) (v1.0).
**Red-team of record:** [CHARTQUEST_TES_CRITIQUE_2026-07-07.md](CHARTQUEST_TES_CRITIQUE_2026-07-07.md).
**Created:** 2026-07-07.

> **What changed from v1.0 → v1.1.** The philosophy, First-Hour Doctrine, Confidence Curve, authored onboarding, and curriculum-first design are **unchanged**. v1.1 resolves the red-team's production blockers only: it corrects entity names to the canonical roster, adds an accessibility law, authors the First Loss, makes confidence measurable, defines the realism transition, states the monetization boundary, and adds returning-player, mistake-library, dependency-graph, tiered-validation, acceptance-gate, and implementation-safety systems. **No gameplay, market, boss, or curriculum was redesigned.**

### Traceability (every amendment → its red-team finding)

| Amendment | Resolves | Type |
|---|---|---|
| A1 Entity Registry | Critique A1 (Boss 0 ≠ roster) + "Notebook/Journal" split | 🔴 Blocker / inconsistency |
| A2 Accessibility Law | Critique B1 (color-only signal) | 🔴 Blocker / accessibility |
| A3 The First Loss | Critique A2 (loss never designed) | 🔴 Blocker / contradiction |
| A4 Confidence Telemetry | Critique B4 / D3 (confidence unmeasurable) | 🟠 High / production |
| A5 Realism Transition | Critique A4 (no handoff) | 🟡 Medium / contradiction |
| A6 Monetization Boundary | Critique B5 | 🟡 Medium / missing |
| A7 Returning-Player Refresher | Critique B6 / C2 | 🟡 Medium / missing |
| A8 Mistake Library | (new canonical system; supports Forbidden #9) | production |
| A9 Lesson Dependency Graph | Critique (curriculum reorder risk) | production |
| A10 Validation Tiers | Critique D1 / D2 (24 gates unsustainable) | scalability |
| A11 Acceptance Gates | Critique D4 (unfalsifiable scores) | production |
| A12 Implementation Safety | Critique (drift protection) | scalability |
| Boss-failure recovery | Critique A3 / C5 | folded into §3 + A3 |

---

# THE DOCTRINE (preserved from v1.0)

## §0 · The North-Star Journey

Every design decision serves this one arc:

```
Curiosity → First Trade → First Win → Second Win → Understanding
   → Confidence → First Meaningful Challenge → Guardian 1 (The Gambler)
      → "I think I can actually learn this."
```

That final sentence is the product. (v1.0 called the first challenge "Boss 0"; the canonical entity is **Guardian 1 / The Gambler** — see A1.)

## §1 · The First-Hour Doctrine (immutable)

- **Confidence > Difficulty · Education > Realism · Clarity > Complexity · Momentum > Challenge.**
- The first hour is an **invitation**, not a test. Its only job is to make the player want the second hour.

## §2 · The Philosophy (immutable)

ChartQuest teaches trading as a **reading skill** — pattern literacy — not gambling. The chart is a *text*, not an opponent. **Confidence is the substrate of learning** (anxiety blocks acquisition; competence drives intrinsic motivation). **Progression is a staircase, never a cliff** — one concept per stair, landed before the next. **Players must feel intelligent** — the earned "I figured that out" is the dopamine of learning and the reason they return. **Every loss must teach** (an unexplained loss is a punishment; an explained one is a lesson). **Every win must feel earned** (an unearned win rings hollow and breaks trust). **Early frustration is unacceptable** — the first ten minutes decide the account; one early "I feel stupid/cheated" is the whole player, lost.

## §3 · The Player Psychology Model (entity-corrected; confidence now measured — see A4)

Confidence climbs steadily; dips only at genuine challenges and **recovers within the same beat**. (Boss names below now match the canonical roster — A1.)

| Stage | Confidence proxy* | Expected emotion | Learning objective | Potential frustration | Recovery strategy | Journal reinforcement |
|---|---|---|---|---|---|---|
| **Website** | click-through | "Fun, not scary" | Trading can be playful | "Looks like a finance app" | Finn branding, zero jargon, play-free | — |
| **Tutorial** | starts trade | "Green up, red down — I get it" | Read one candle | Too much text / patronizing | 10-year-old words, one idea, show-don't-tell | — |
| **Trade 1** | reaches win | Nervous → relief → joy | Momentum + how a trade works | "What do I do?" | Guided, one-tap, **guaranteed clean win**, 24–30 candles | First entry unlocks the Journal |
| **Trade 2** | takes trade 2 | "I can do that again" | Repeat the read | "Was that luck?" | Second clean win, same pattern | "Same read, same result" |
| **Trade 3** | takes trade 3 | Competence | Apply with less guidance | "Ready for more?" | Third win, reduced hand-holding | 3 wins + streak |
| **Guardian 1 — The Gambler** | clears ≤2 tries | "A real test — I'm ready" → pride | Recognition under mild pressure | Tests the untaught (forbidden) | Tests only taught concepts; **guaranteed-clearable assist ramp** (A3-adjacent); "read it again," never "you failed" | Beat the Gambler by reading, not guessing |
| **The First Loss** (early L2) | continues after | "Not fair!" → understanding | A good read can still lose; the stop saves you | Feeling cheated | Finn reframes instantly; **next trade is an authored win** | "Even a good read loses sometimes — your stop kept it small" (see A3) |
| **Guardian 2** | clears ≤2 tries | "I can handle a new idea" | Trend | Difficulty spike | ≥3 trend trades first; gentle escalation | "Traded with the trend" |
| **Guardian 3** | clears ≤2 tries | Growing mastery | Structure / BOS | Two ideas blur | One concept per level; BOS by construction | "Traded the structure break" |

\* *Confidence is no longer a self-assessed 0–10 number; it is the observable proxy in this column, instrumented per A4.*

**Boss-failure recovery (resolves critique A3/C5):** every Guardian is **guaranteed clearable within a bounded number of attempts.** On each retry, *assistance ramps up* (more time, the correct read highlighted, a hint) — **difficulty never ramps up.** Framing is always "read it again," never "you failed." No player's confidence is allowed to crash on a boss.

## §4 · The Trade Authoring System (immutable template)

No trade exists without a completed record. (Two-tier application — see A10.)

```
Learning Objective · Single Concept · Expected Duration (candles) · Expected Emotional Arc
· Likely Mistake · Recovery · Journal Entry · Reward · Preparation for Next Lesson
```

## §5 · The Curriculum (Levels 1–3) — with the First Loss placed

Teaching order is fixed (`SETUP_UNLOCK`: momentum→pullback→BOS) and dependency-locked (A9). One new concept per level; ≥3 applied trades before each Guardian; never test the untaught.

- **Level 1 — Read the Candle / Ride the Momentum.** A big decisive candle keeps going. Duration 24–30. Preps Guardian 1 (The Gambler): "which way is this big candle pushing?"
- **Level 2 — Trend + Pullback + *the stop (via the First Loss)*.** Buy the dip with the trend, on the confirming close. Duration 20–26. **The First Loss (A3) lives here** — the moment risk management is *felt*, not lectured. Preps Guardian 2.
- **Level 3 — Structure / Break of Structure.** A close beyond the last swing high proves the move. A break counts on the *close*, never the wick. Duration 18–24. Preps Guardian 3.

## §6 · The First-Trades Redesign (specified)

All three onboarding trades are **guaranteed clean, earned, explained wins**, 24–30 candles, on the driven-candle engine with the outcome authored to a win and the chart driven to *agree* (build 253's min-duration + entry-anchor are the enforcing mechanics). Trade 1.1 momentum long · Trade 1.2 momentum short (same concept mirrored) · Trade 1.3 player-led read (the APPLY beat). After 1.3 the player holds one crisp belief — *"the big candle tells me which way"* — which is exactly and only what The Gambler tests. (Full per-trade records: see v1.0 §6; unchanged.)

## §7 · Forbidden Patterns (immutable + one new law)

1. Never a random tutorial loss. 2. Never a sub-minimum-duration trade. 3. Never a hidden mechanic. 4. Never an unavoidable stop-out. 5. Never two concepts at once. 6. Never a difficulty spike without ≥3 prep trades. 7. Never contradict a prior lesson. 8. Never test the untaught. 9. Never punish the right process. 10. Never bury the outcome in noise. 11. Never let the outcome disagree with the chart. 12. Never gate progress behind luck.
**13. (NEW — Accessibility Law, A2) Never encode a required educational signal in colour alone.**

---

# PRODUCTION AMENDMENTS (v1.1)

## A1 · Entity Registry — one name per entity, everywhere

**Rule:** there is exactly **one** canonical name/number for every protected entity. Any doc or code using a variant is a bug. This registry is the single source of truth; it defers to [boss_canon.md](docs/canon/boss_canon.md) and [progression_canon.md](docs/canon/progression_canon.md) for the roster.

| Entity | Canonical term | Notes / corrections |
|---|---|---|
| The bosses | **Guardians** (Guardian 1 … Guardian 10) → **Market Maker** (finale) | 11 bosses, fixed order. Realms 0–9 = Guardians 1–10; realm 10 = Market Maker. |
| First boss | **Guardian 1 — "The Gambler"** | **There is no "Boss 0."** v1.0's "Boss 0" = Guardian 1 / The Gambler. The journey's "First Meaningful Challenge" is Guardian 1. |
| Boss art files | `bosses/boss-0.png … boss-10.png` | **0-based, internal only.** `boss-0` = Guardian 1. Never expose the file index to players. |
| Levels | **Level N = Guardian N's level** (1-based) | Level and Guardian numbers align. Level 1 → Guardian 1. |
| The player's record | **Journal** (canonical) | Code currently also says "Notebook" (nav container earned after Guardian 1) and "Journal" (the trade log). **Standardize player-facing copy to one term.** Recommendation: the feature is the **Journal**; if "Notebook" must remain as the earned artifact, it *contains* the Journal — never two names for the same thing in the same surface. *(Founder decision required to finalize; flagged, not silently chosen.)* |
| The lens reward | **Trader's Glasses** (earned after Guardian 1) | Confirm the earn-point (code comment: after Guardian 1) against any doc that says otherwise — resolve to one. |
| Trading terms | momentum · pullback · Break of Structure (BOS) · stop-loss · take-profit · confirmation candle | Match `plainSetupReason` + the in-game glossary. No synonyms in player copy. |

**Audit obligation:** before any trading feature ships, every boss/level/entity reference in code, docs, and copy is checked against this registry.

## A2 · Accessibility Law (permanent governing principle)

**Critical educational information must NEVER rely solely on colour.** Every signal a player *must* read to learn or to succeed carries **≥2 non-colour channels** drawn from: **shape · icon · arrow/glyph (▲/▼, +/−) · pattern · position · motion · contrast · text label.** Colour is always a *reinforcement*, never the sole channel.

This governs (non-exhaustive): candle direction (green/red), win/loss outcome, long/short controls, the entry/stop/target lines, and any quality/confidence indicator. ~8% of male players cannot reliably read red-vs-green; the foundational Level-1 lesson must be learnable by all of them.

*This is a governing principle, not a UI redesign spec.* It tells every future feature what it must satisfy; it does not dictate the art. Enforced as Forbidden Pattern #13 and (aspirationally) by an implementation-safety check (A12).

## A3 · The First Loss (authored lesson)

The single most important beat in trading education. **Placement:** the first trade of Level 2, after three L1 wins have established competence — early enough that the player has not yet concluded "I never lose," late enough that confidence can absorb it. It is **telegraphed and stop-protected**, never a surprise coin-flip.

| Field | Specification |
|---|---|
| **Learning Objective** | Understand that a *correct read can still lose*, and that a stop keeps a loss small and survivable. |
| **Single Concept** | Risk management / the stop-loss. The loss is the *vehicle* for teaching the stop. |
| **Expected Duration** | 24–30 candles — the loss is *watched and felt*, never snapped. |
| **Expected Emotional Arc** | Setup forms → player reads it *correctly* → enter → price drifts against → a false-hope bounce → a **telegraphed** stop-out ("the market reversed this time") → the stop caps the loss → relief it wasn't worse. |
| **Likely Player Reaction** | "That's not fair — I did everything right." *(This exact reaction is the teaching opportunity.)* |
| **Recovery** | Finn reframes *immediately*, and the **very next trade is an authored win** — the loss is bracketed by wins so net confidence rises. |
| **Journal Entry** | *"Even a good read loses sometimes — your stop kept it small. That's the whole game."* |
| **Finn Coaching** | Warm, specific, instant: *"You read that right. The market just did the rare thing — it happens to everyone. See how small the loss was? That's your stop doing its job. The best traders aren't the ones who never lose — they're the ones who keep every loss tiny. Let's find the next one."* |
| **Confidence Recovery** | Guaranteed within the beat: next trade authored to a win; the loss never carried forward as a wound. |
| **Preparation for Next** | Opens "why we always set a stop" → reward-to-risk (R:R) in later levels. |

**Goal, stated plainly:** *players lose — but they understand exactly why, and they come out trusting the stop instead of fearing the loss.*

## A4 · Confidence Telemetry & the Health Dashboard (developer-only)

Confidence stops being a philosophical adjective and becomes an **instrumented, observable quantity** via `ContentLog` → Supabase. **Dev-only; never shown to players.**

**Proxy metrics** (each per-cohort, per-level):

| Metric | Reads confidence via | Healthy signal |
|---|---|---|
| Time to First Win | how fast the first success lands | short, consistent |
| Average tutorial trade duration | did trades breathe (≥24 candles) | within band |
| Tutorial completion rate | % reaching Guardian 1 | high |
| Guardian retries | frustration at the test | ≥80% clear ≤2 tries |
| Journal usage | engagement with reflection | rising |
| Trade abandonment | setups skipped / not taken | low |
| Session completion | % finishing a level | high |
| Voluntary replay | wanting to re-learn (mastery pull) | present |
| Early exits (quit-point map) | *where* players leave | no cliff at any single beat |

**The Confidence Health Dashboard:** a developer view with green/amber/red per metric, per level, per cohort, plus a quit-point heatmap over the onboarding beats. A beat that trends amber/red is a design regression, caught early. This replaces the self-graded scores of v1.0 §12 (which are demoted to hypotheses — see A11).

## A5 · The Realism Transition Ladder

The market's *authenticity* increases as the player's *competence* does — always deliberately, never as a switch.

| Tier | Where | What it is | Why here | What changes | What NEVER changes |
|---|---|---|---|---|---|
| **1 · Authored Educational** | Guardians 1–3 (L1–3) | Outcome pre-authored; chart driven to agree; confidence-phase wins guaranteed | Build confidence + legibility | — | Outcome always explainable + on-chart |
| **2 · Hybrid Educational** | Guardians 4–6 | Setups still authored, but genuine variance introduced — an A-grade read wins *most* of the time, not always; losses honest but telegraphed + reframed | Teach expectancy + variance now that confidence can absorb it | Wins stop being guaranteed; edge becomes probabilistic | Every loss still explainable + reframed; process praised over outcome |
| **3 · Authentic Market** | Guardians 7–10 + Market Maker | Genuine read-predicts-outcome (author-first pipeline, per [trading_canon.md](docs/canon/trading_canon.md)); real edges, variance, liquidity phenomena | The player is now a trader who can *enjoy* realism | Reads become truly predictive; full market behaviour | Outcomes remain readable; the game never lies to the player |

**The transition is a ramp** (edge and variance dialed up gradually across the tier boundaries) and is **announced in-fiction** ("the markets are getting real now"). Realism never arrives before the player is ready to enjoy it — that is the whole point of sequencing it.

## A6 · Monetization Philosophy (permanent)

**Players are never monetized before trust is earned.** The first three Guardians exist to build confidence; **no paywall, upsell, or friction may appear before the player reaches "I can actually learn this."** Monetization occurs only *after* the player understands the value of continuing — presented as an *invitation to continue a journey they already value*, never a gate sprung on a stranger. Monetization may **never interrupt the confidence build.** (Consistent with the current "3 free Guardians → paywall" funnel; this makes the boundary law, not accident.)

## A7 · Returning-Player Refresher (permanent)

A returning player must never feel lost. On re-entry after a gap:

- **Journal review** surfaced — "last time you learned…" with the relevant entries.
- **Optional lesson replay** — re-watch any concept's animated LessonChart on demand.
- **Boss recap** — where you are, which Guardian is next, what it tests.
- **Progress reminder** — level, streak, rank restored visibly.
- **Confidence restoration** — after a long gap, a low-stakes warm-up read *before* the next real trade. Never a cold-start into a hard trade.

## A8 · Player Mistake Library (canonical catalogue)

How the game *responds* to error — **never punish, always teach.** Every response conforms to Forbidden #9 (never punish the right process) and Forbidden #4 (never an unavoidable loss).

| Mistake | Symptoms | Teaching response | Recovery | Future reinforcement | Journal connection |
|---|---|---|---|---|---|
| **Entering too early** | Commits before the confirmation close | "Wait for the candle to *close* — mid-candle, price can still go anywhere" | Re-offer the setup after the close | Confirmation drills; the "wait for the close" cue | "You jumped early — the close is your green light" |
| **Ignoring confirmation** | Acts on a wick, not a close | Show the wick-that-closed-back = a fake-out | Replay the fake-out vs the real break | BOS lessons hammer close-vs-wick | "A wick lied to you — trust the close" |
| **Moving stops** | Widens the stop to dodge a loss | "A stop you move isn't a stop — it's a bigger loss waiting" | Cap stop edits in the tutorial; explain why | Risk lessons lock the stop as a promise | "Moving your stop turned a small loss into a scare" |
| **FOMO** | Chases after the move already ran | "The best entry already passed — the next setup is worth more than this one" | Offer to wait for a fresh setup | Patience beats; quality > quantity | "You chased — the calm read wins more" |
| **Poor patience** | Won't wait for the pullback | "The trend rests before it runs — the rest *is* your entry" | Highlight the pullback next time | Pullback drills | "Patience paid — the dip was the door" |
| **Overtrading** | Takes every setup, not the good ones | "A trader is paid to *wait* — take the strong reads, skip the weak" | Reward a good *skip* | Quality-selection lessons | "Your best trade today was the one you skipped" |
| **Fighting momentum** | Trades against the obvious big candle | "Don't fight the freight train — trade *with* the strong close" | Pre-trade Quick Read corrects before capital risk | Momentum reinforcement | "You fought the trend — flow with it" |

## A9 · Lesson Dependency Graph (curriculum lock)

Every lesson declares what it **reinforces** (a prior lesson) and what **depends on** it (a future lesson). This makes the curriculum a DAG — impossible to accidentally reorder without breaking a declared dependency (enforced by the gate, A12).

```
Candle reading ─┬─► Momentum ─┬─► Trend ─┬─► Pullback ─┬─► Break of Structure ─► Order Blocks ─► Liquidity ─► VWAP ─► Multi-TF ─► Confluence
                │             │          │             └─► The Stop / First Loss ─► Reward:Risk ─► (all later risk)
                └─(reinforced by everything downstream)   └─(trend reinforces momentum; pullback reinforces trend; BOS reinforces trend+structure)
```

| Lesson | Reinforces | Depended on by |
|---|---|---|
| Candle reading (L1) | — (root) | Momentum |
| Momentum (L1) | Candle reading | Trend, Pullback |
| Trend (L2) | Momentum | Pullback, BOS |
| Pullback (L2) | Trend | BOS |
| The Stop / First Loss (L2) | risk awareness | Reward:Risk, all later risk mgmt |
| Break of Structure (L3) | Trend + structure | Order Blocks, Liquidity |

**Rule:** a lesson may not ship before its dependencies are taught. Reordering that violates a declared edge is a canon violation.

## A10 · Two-Tier Validation (scalability — merges v1.0 §7 ↔ §8)

To keep rigor high without unsustainable overhead, validation is tiered. **The checklist references the Forbidden list rather than restating it** (removing the v1.0 redundancy).

- **Level A — Full validation** *(new lesson · new mechanic · a Guardian · a curriculum milestone)*: the full 12-field authoring record (§4) + the full checklist + on-device beginner (`?fresh=1`) test + all Part-A6 acceptance gates.
- **Level B — Lightweight validation** *(reinforcement · practice · review trade)*: a 4-field record (Objective · Duration · Journal · Prep-Next) + the 5 core checks (single objective? one taught concept? enough observation time? explainable outcome? violates zero Forbidden Patterns?).

## A11 · Production Acceptance Gates (measurable — replaces "it feels better")

A redesigned trade ships **only when measured objectives are met**, never on vibes:

1. **Understood the lesson** — ≥80% of testers name the reason for the trade unprompted.
2. **Completed the Journal** — the entry fires and is legible.
3. **Observed long enough** — candle count ≥ the tier floor.
4. **Could explain the outcome** — testers point at the chart and say *why*.
5. **Confidence recovered after a loss** — next-trade continuation rate holds (via A4).

The v1.0 §12 self-graded scores are **demoted to hypotheses**, each bound to one of these gates before it may be claimed as fact.

## A12 · Implementation Safety (drift protection)

So that ten designers over five years cannot silently violate the constitution:

**Automated (the regression gate, `scripts/verify.js`) — live + planned:**
- ✅ **LIVE** (check [11]): `MIN_TRADE_CANDLES ≥ 24` and `SETUP_UNLOCK` order (`momentum:1 < pullback:2 < bos:3`) intact — the gate **fails the build** on regression.
- ⏳ **PLANNED** (careful implementation, must not false-fail): a Journal-fires-on-trade check, a boss-prerequisite check (`tradeGatePassed` guards every Guardian), and an accessibility-redundancy check (direction signals carry a non-colour channel).

**In-code:** anchoring comments at `MIN_TRADE_CANDLES`, the intro-win path, `SETUP_UNLOCK`, `tradeGate`, and the Journal write, each naming the TES rule it enforces and pointing here.

**Documentary + process:** this file is the highest authority; `trading_canon.md`, `gameplay_canon.md`, and `boss_canon.md` reference it; the A10 validation tier is mandatory in the PRE-FLIGHT for any trade change; the A1 entity audit runs before any trading feature ships.

**The signpost future developers will hit:** any change that lowers tutorial trade duration, reorders the curriculum, skips a boss prerequisite, drops a Journal write, or encodes a required signal in colour alone will **fail the gate or the checklist** — with a message pointing back to this constitution.

---

## Final Review

*"If ChartQuest had a team of ten designers working on it over the next five years, would this constitution prevent the onboarding experience from slowly drifting back into confusion, randomness, and inconsistency?"*

**Yes — and here is why, mechanism by mechanism:**
- **Confusion** is blocked by the entity registry (one name per thing), the accessibility law (everyone can read the signal), and the dependency graph (concepts can't be taught out of order).
- **Randomness** is blocked by the Forbidden Patterns, the min-duration gate (live), the authored confidence phase, and the requirement that every outcome agree with the chart and be explainable.
- **Inconsistency** is blocked by the automated gate (duration + curriculum order, live today), the tiered validation, the measurable acceptance gates, and the confidence telemetry that makes drift *visible* before it compounds.
- **The human failure mode** — a well-meaning future change that quietly erodes the experience — is caught by the build gate, the checklist, and the dashboard, each of which points the developer back to this document with a specific reason.

The philosophy is preserved intact. The production layer is now complete: names are canonical, the first lesson is perceivable by everyone, the first *loss* is authored as carefully as the first win, confidence is a number you can watch move, and drift trips a wire.

---

# CHARTQUEST TRADING EXPERIENCE SYSTEM
# VERSION 1.1
# ✅ RATIFIED FOR PRODUCTION

*This document is the permanent governing constitution for every future trading feature in ChartQuest. It preserves the v1.0 doctrine in full and resolves the red-team's production blockers. Amendments extend it; they do not overwrite it.*
