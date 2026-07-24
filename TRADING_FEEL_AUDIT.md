# TRADING FEEL AUDIT — First Three Bosses

**Status:** Feel audit of the SHIPPED build (build 250). No code modified, no fixes implemented. **Date:** 2026-07-06.
**Lens:** a first-time player, zero trading knowledge, playing Levels 1→3 and their Guardians for the first time (`?fresh=1`).
**Companions:** the V2 decision series ([Architecture](Trading_V2_Architecture_Final.md) · [Red Team](Trading_V2_Red_Team.md) · [Playtest Protocol](Trading_V2_Beginner_Playtest_Protocol.md)).

---

## What a first-timer actually experiences (the real journey)

A structural fact that reframes the whole audit: **the Guardian fights are not trades.** The trade opportunities are in the *traversal* of L1–L3; the boss encounter is a **movement gauntlet** (`startGuardianSequence` 10447 → climb green candles up → descend red candles down → twirl a wick for shells) followed by a **concept mini-game exam** (`bossRound` 9906, `MG.REG`). So "trading in the first three bosses" = the ~3–5 trades per level that gate the boss (`tradeGateRequired` 4918: n=3 / w=2 / p=3 for levels ≤4).

The journey:

| Stage | What the player does | Outcome source |
|---|---|---|
| **Intro** | 1 quiz card ("what colour?"), a few "green or red?" bet cards, then the **first guided trade(s)** with an ENTRY→STOP→TARGET walkthrough | **Forced win** — "FIRST 3 GUIDED TRADES → ALWAYS a clean 2:1 WIN" (`commitTrade` 11790–11796) |
| **L1** (candle direction / momentum) | one-tap **UP/DOWN** on "🟩 BIG GREEN — what happens next?" (`refreshPanel` 11617, `pickDir` 11723) | **Coin flip** `Math.random()<0.58` (11804), candles driven to it (`tradeDrivenCandle` 2888) |
| **L1 Guardian** | movement gauntlet + mini-game exam ("OUT-TRADE HIM" 9699) | movement skill + quiz |
| **L2** (trend / support / pullback) | momentum + pullback setups (`setupFlowCandle` 2839: impulse→2 pullbacks→confirm) | **Coin flip**, driven |
| **L3** (structure: BOS/ChoCh/break) | + structure setups (reactive detector) | **Coin flip** (session.level ≤ 3), driven |

The single most important thing to hold in mind: **for all of L1–L3, the trade outcome is decided by `Math.random()` at entry, and the stop/target are then overwritten to fit that pre-decided result** (`_rd0` block, 11793–11807, which *replaces* the structural `calcLevels` 11507). Everything the player "reads" is decoration on a coin flip. That one fact is the root of nearly every feel problem below.

---

## The 10 focus dimensions, scored (0–10, first-timer POV)

| # | Dimension | Score | One-line verdict |
|---|---|---|---|
| 1 | **Trade quality** | **2/10** | Quality is computed (`evaluateConfluence` 3683) but never touches the outcome — it is pure decoration. |
| 2 | **Trade pacing** | **6/10** | The one genuine strength: `MIN_TRADE_CANDLES=30` + the driven dip→recover→run gives a ~30–60s arc. But it's the *same* arc every time. |
| 3 | **Entry quality** | **5/10** | Entry correctly anchors to the confirmation candle (`setupZone.to` 6751 → `pending.entry` 6781) — but at L1 it's a one-tap guess, so it doesn't *feel* like an entry. |
| 4 | **Stop-loss quality** | **2/10** | The stop is `_rd0×1.2` placed to fit the coin flip (11794), not beyond a swing low. It answers no "if price gets here I was wrong" question. |
| 5 | **Take-profit quality** | **2/10** | TP is fixed `_rd0×2` (11794), not the next structural level. "Why is the target *there*?" has no chart answer. |
| 6 | **Emotional tension** | **6/10** | The engineered dip (to ~72% of the stop, 2914) really does create fear→relief. Best-feeling moment in the game — but repetitive and agency-free. |
| 7 | **Educational value** | **3/10** | The teaching scaffolding is excellent; it teaches over a random outcome, so it teaches a *false* lesson (a lucky win gets praised as skill). |
| 8 | **Player understanding** | **2/10** | The player can only *confabulate* a "why" — there is no true cause to point to on a loss. |
| 9 | **Trust / fairness** | **3/10** | The identical scripted arc is catchable ("it always dips then recovers on wins"); once sensed, the whole thing reads as on-rails. |
| 10 | **Progression** | **4/10** | The gate rewards traversal + a partly-luck win count; the boss tests *movement + quizzes*, not the trade loop. Reading skill doesn't advance you. |

**Composite: ~3.5/10** — consistent with the "≈1/10" complaint once you weight dimensions 1, 4, 5, 8 (the causal core) most heavily.

---

## Every trade opportunity, evaluated against the 7 questions

Legend: ✅ yes · ⚠️ partial · ❌ no.

### Opportunity A — The intro guided trade(s) *(forced 2R win)*
| Question | Verdict | Why |
|---|---|---|
| Setup visually obvious? | ✅ | A deliberately huge green momentum candle; the walkthrough points at it. |
| Entry make sense? | ✅ | Guided ENTRY→STOP→TARGET freeze (`firstTradeGuide` 4027) — the one moment entry is explained. |
| Stop make sense? | ⚠️ | Drawn and labelled, but placed at a fixed 1.2R (11794), not at invalidation structure. |
| Target make sense? | ⚠️ | Fixed 2R; "twice as far" is shown, but not tied to a level. |
| Risk readable? | ✅ | This is the *only* place risk is clearly walked through. |
| Long enough for emotion? | ✅ | 30-candle drive; first-win eruption. |
| Can explain outcome? | ⚠️ | "I won because I followed the steps" — true here *only because it's forced*. |
**Feel:** the high point. Warm, guided, winning. **The problem it plants:** it teaches "follow the lesson → win 100%."

### Opportunity B — L1 momentum trades *(one-tap UP/DOWN, coin flip)*
| Question | Verdict | Why |
|---|---|---|
| Setup visually obvious? | ✅ | `detectMomentum` fires only on a standout ≥1.8× candle early (12009); unmistakable. |
| Entry make sense? | ⚠️ | Anchored correctly, but a one-tap guess with no felt "I'm entering here." |
| Stop make sense? | ❌ | No stop decision at all at L1; the hidden stop is coin-flip-fitted. |
| Target make sense? | ❌ | No target decision; hidden fixed 2R. |
| Risk readable? | ❌ | One-tap UP/DOWN hides risk entirely — the player never sees "risk X to make Y." |
| Long enough for emotion? | ✅ | The 30-candle dip→recover→run arc. |
| Can explain outcome? | ❌ | Outcome is `Math.random()`; any "why" is invented. **This is the core failure.** |
**Feel:** a quiz that pays out randomly, dressed as a trade.

### Opportunity C — L2 pullback trades
| Question | Verdict | Why |
|---|---|---|
| Setup visually obvious? | ✅ | `setupFlowCandle` prints impulse→2 shallow pullbacks→confirmation, role-tagged. |
| Entry make sense? | ⚠️ | Confirmation-candle entry is real logic; still commit-heavy, low ceremony. |
| Stop make sense? | ❌ | Same `_rd0` override; not below the pullback low. |
| Target make sense? | ❌ | Same fixed 2R. |
| Risk readable? | ⚠️ | L2 shows sliders/plain reason, but the numbers don't drive the outcome. |
| Long enough for emotion? | ✅ | Same 30-candle arc. |
| Can explain outcome? | ❌ | Still a coin flip. |
**Feel:** a nicer-looking setup, same hollow core.

### Opportunity D — L3 structure trades (BOS / ChoCh / break)
| Question | Verdict | Why |
|---|---|---|
| Setup visually obvious? | ⚠️ | Structure is subtler than a giant green candle; reactive detector can circle a less-obvious candle. |
| Entry make sense? | ⚠️ | Reasonable, but the concept (break of structure) is new and the outcome won't confirm the read. |
| Stop make sense? | ❌ | Same override. |
| Target make sense? | ❌ | Same override. |
| Risk readable? | ⚠️ | Sliders present; still cosmetic. |
| Long enough for emotion? | ✅ | Same arc. |
| Can explain outcome? | ❌ | Coin flip — and now the *concept* is harder, so an unexplained loss is more confusing. |
**Feel:** the disconnect widens — harder concept, still-random result.

---

## TOP 10 PROBLEMS (ranked by feel impact)

1. **Outcome is a coin flip; the chart is decoration.** `_l1Outcome = Math.random()<0.58` (11804). Reading better cannot win more. Root of dimensions 1, 7, 8, 9.
2. **Stop & target are theatre.** The `_rd0` override (11793–11807) *replaces* structural `calcLevels`, placing SL/TP to fit the pre-decided result. They teach nothing and answer no "why here?"
3. **The player cannot truthfully explain a loss.** There is no real cause to point at; the review's attribution (`tradeVerdict` 3690) is applied to noise, so it can praise luck and mislabel a good read.
4. **The forced-win → coin-flip cliff betrays trust.** Trades 1–3 are 100% wins; then it silently drops to ~58% with no framing. The first unexplained loss (≈ trade 4–6) lands as betrayal because the intro over-promised "follow the lesson → win."
5. **L1 trading is a one-tap guess, not a decision.** UP/DOWN (`pickDir` 11723) with no stop, target, size, or pass — the player exercises almost no agency before the outcome.
6. **The tension is real but on-rails.** The identical dip-to-72%-then-recover arc (2914) is catchable; once a player notices "wins always dip then bounce," the fear evaporates and the chart reads as rigged.
7. **Risk is invisible at L1.** The one-tap flow never shows "risk X to make Y," so the #1 real habit (define risk first) isn't even seen, let alone felt.
8. **The boss doesn't reinforce trading.** After 30–60s trades, the Guardian is a *movement* gauntlet + concept quiz (`startGuardianSequence` 10447, `bossRound` 9906). Trading and progression are separate worlds; "OUT-TRADE HIM" (9699) is delivered by platforming.
9. **Progression rewards traversal + luck, not reading.** The gate (`tradeGateRequired` 4918: 3 done / 2 won / 3 predicts) counts partly-random wins; you advance by surviving the level, not by reading well.
10. **Portal/entry ambiguity for a first-timer.** The trade portal floats ahead of the live edge (`portalHoverY` 2479), the banner is info-only, and the fly-in vs. the ticket vs. the "what happens next?" screen are three surfaces for one decision — confusing on first contact.

---

## TOP 10 IMPROVEMENTS (what would move the score)

1. **Make outcome emerge from the chart** (the V2 core) — the only fix that raises dimensions 1/7/8/9 together. Everything else is polish until this is true.
2. **Restore structural, readable stops & targets** — drop the `_rd0` override; use `calcLevels` (already canon-correct) and draw the risk/reward bands with plain "risk 10 to make 20" labels.
3. **Pre-frame the first loss** — teach "even great trades lose sometimes; that's why we set a stop" *before* trade 4, so the first loss is expected, not a betrayal.
4. **Give L1 a real (tiny) decision** — even confirming a suggested stop/target (not just UP/DOWN) so the player *sees* risk before committing.
5. **Vary the driven arc** — different dip depths, some clean runs, some losses that bounce first — so the chart stops reading as on-rails (protects the one thing that feels good).
6. **Make the review point at a real, pre-visible cause** — highlight the candle/evidence that predicted the result (only truthful once outcome is chart-derived).
7. **Reward a PASS** — surface skipping a weak setup as a scored, praised choice (needs quality to be real to be honest).
8. **Tie the boss to the trade loop** — have the Guardian test the *reading* the level practiced, not just movement + quiz.
9. **Show an honest pre-trade "how strong is this?" read** — age-appropriate, but only after quality actually affects odds.
10. **Instrument the loop** — log fairness/attribution per trade so "does it feel bad and why" becomes data, not opinion (see [Playtest Protocol](Trading_V2_Beginner_Playtest_Protocol.md)).

---

## Fixes grouped by size

### Quick wins (low risk, cheap, shippable for the next playtest)
- **Pre-frame the first loss** (Improvement 3): one lesson beat before trade 4. Pure framing; big trust payoff.
- **Vary the driven arc** (Improvement 5): tune `tradeDrivenCandle`'s dip depth / run cleanliness so no two trades feel identical.
- **Show the risk band + "risk X to make Y" at L1** (part of 4/7): draw the existing entry/stop/target as labelled bands even in the one-tap flow.
- **Soften the 100% intro cliff**: make the transition from guided wins to real trades explicit rather than silent.

### Medium changes (one system, moderate risk)
- **Drop the `_rd0` SL/TP override; use `calcLevels`** (Improvement 2) and make the drive respect the real structural stop. Makes SL/TP/risk readable without touching the outcome engine.
- **Add one real L1 decision** (confirm the suggested plan) (Improvement 4).
- **De-couple portal/banner/ticket confusion** — one clear "decision gate → ticket" path.

### Major redesigns (protected system #9, approval-gated — the V2 path)
- **Outcome emerges from the chart** (Improvement 1) — the author-first pipeline. Validate first (Gate 0 playtest → Gate 1 offline curve → Gate 2 flagged lab) before building.
- **Quality → odds, honestly** (Improvements 6/7/9).
- **Boss reinforces the trade loop** (Improvement 8).

---

## If we changed only THREE things before the next playtest

Chosen for **maximum feel-per-risk** — all shippable without the V2 redesign, and together they also *sharpen the diagnosis*: if trading still feels bad after these three, the culprit is conclusively the coin-flip outcome, which green-lights the V2 validation path.

1. **Pre-frame the first loss and soften the forced-win cliff.** The biggest cheap trust win. Today the intro promises "follow the lesson → win 100%," then silently flips a coin — the first unexplained loss reads as betrayal. Teach "even good trades lose sometimes — that's why we set a stop" *before* it can happen. *(Quick, framing-only, near-zero risk.)*

2. **Restore structural, readable stops & targets with a plain risk/reward band.** Drop the `_rd0` cosmetic override; use the already-correct `calcLevels`, have the driven path respect the real structural stop, and label the bands "risk 10 → make 20." This makes entry, stop, target, and risk *readable* for the first time — four of the ten dimensions move at once. *(Medium, reuses existing canon code, outcome engine untouched.)*

3. **Break the on-rails tell by varying the trade arc.** Give wins different dip depths and run shapes, and let some losses bounce before failing, so the chart stops reading as a puppet on a string. This protects the one genuinely good feeling (the drawdown tension) from being caught as fake. *(Quick, tuning-only.)*

**The honest caveat:** none of these three touches the root problem — the outcome is still a coin flip, so the player still cannot *truthfully* explain a win or loss. They will make the next playtest feel meaningfully better and buy trust, but they are also the perfect experiment: **if feel is still low after fixing framing, readability, and the tell, then arbitrariness is proven to be the wound — and that is the evidence that justifies building Trading V2.**

---

*Feel audit only. No game code was modified. Line references are to build 250. The deepest fix (chart-derived outcomes) remains an approval-gated change to protected system #9 per `CLAUDE_RULES.md`.*
