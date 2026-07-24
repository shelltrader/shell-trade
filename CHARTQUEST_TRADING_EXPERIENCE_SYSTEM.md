# ChartQuest — Trading Experience System (TES)

**Status:** PERMANENT · the highest authority for all trading *experience* design.
**Created:** 2026-07-07.
**Authored as:** Creative Director of Trading Education · Lead Game Designer · Educational Psychologist · Trading Mentor · Behavioral Learning Specialist · Gameplay Systems Designer · UX Director · Product Director.

**Relationship to existing canon.** The TES governs **why a trade exists and how it feels**. [docs/canon/trading_canon.md](docs/canon/trading_canon.md) governs **the mechanical truth of a trade** (entry = confirmation candle, no coin-flip target-state, duration/quality rules). The [design constitution](docs/canon/gameplay_canon.md) (`LEARN → PRACTICE → APPLY → TEST`) is the curriculum spine the TES fills with emotion. **When any of these conflict with a feature request, they win.** When the TES and trading_canon overlap, TES defines the *goal*, trading_canon defines the *mechanism*.

> **The mission is not to build a realistic market simulator. It is to build the most engaging, confidence-building trading-education experience ever created.** If a mechanic makes a beginner feel stupid, cheated, or bored, it is wrong — no matter how realistic it is.

---

## 0. The North-Star Journey

Every design decision in ChartQuest serves this one arc:

```
Curiosity → First Trade → First Win → Second Win → Understanding
   → Confidence → First Meaningful Challenge → Boss 0
      → "I think I can actually learn this."
```

That final sentence — *"I think I can actually learn this"* — is the product. Retention, virality, and conversion are all downstream of it. If a player reaches Boss 0 believing they are capable, ChartQuest has succeeded. If they reach it feeling lost or unlucky, no later feature can save the account.

**The First-Hour Doctrine (immutable):**
- **Confidence > Difficulty.**
- **Education > Realism.**
- **Clarity > Complexity.**
- **Momentum > Challenge.**
The first hour is an **invitation**, not a test. Its only job is to make the player *want the second hour*.

---

# PART 1 — The System

The TES is the canonical source of truth for: every trade, every lesson, every level, every boss, every progression rule, every trading mechanic, every educational objective, and every emotional beat. It is composed of eight instruments, each defined below:

1. **The Philosophy** (Part 2) — the beliefs that make ChartQuest different.
2. **The Player Psychology Model** (Part 3) — the intended emotional curve.
3. **The Trade Authoring System** (Part 4) — the template every trade must satisfy.
4. **The Curriculum** (Part 5) — the teaching order for Levels 1–3.
5. **The First-Trades Redesign** (Part 6) — the onboarding trades, specified.
6. **The Forbidden Patterns** (Part 7) — the permanent "never do this" rulebook.
7. **The Validation Checklist** (Part 8) — the pre-ship gate for any trade.
8. **The Testing Protocol** (Part 9) — how we prove it works.

No future update may overwrite these principles. It may *extend* them.

---

# PART 2 — The Trading Philosophy

**Why ChartQuest teaches trading differently.**
Everywhere else, trading is taught through fear, loss, and gambling. ChartQuest teaches it as a **reading skill** — pattern literacy — the way you'd teach reading music or a second language. The chart is not an opponent; it is a *text*. The player's job is to learn to read it, one word (candle), sentence (setup), and paragraph (trend) at a time. We are building **fluency**, not luck.

**Why confidence matters.**
A frightened beginner cannot learn — anxiety is a filter that blocks acquisition (the "affective filter" in language learning; the amygdala-hijack in behavioral terms). A curious, safe, slightly-proud beginner learns fast. Confidence is not a reward we hand out at the end; it is the *substrate* on which all learning is laid. We manufacture it deliberately and protect it fiercely.

**Why progression matters.**
Mastery is a staircase, never a cliff. Each concept is one stair; a player must land it before the next appears. Skipping stairs (introducing two concepts at once, or testing the untaught) doesn't accelerate learning — it collapses the staircase and the player falls. Ordered, gated progression *is* the curriculum.

**Why players must feel intelligent.**
The dopamine of learning is the feeling *"I figured that out."* That earned-insight moment is what makes a player return tomorrow. We engineer it: we set up a readable pattern, let the player make the call, and then let the market prove them right. The win must belong to the *player's read*, not to the game's kindness.

**Why every loss must teach.**
An unexplained loss is a punishment; an explained loss is a lesson. A loss must always show its cause on the chart ("the market did the rare thing — and your stop kept it small") so the player leaves with knowledge, not a bruise. A loss the player can explain increases confidence; a loss they can't destroys it.

**Why every win must feel earned.**
An unearned win teaches nothing and rings hollow; the player senses the game was easy *on purpose* and stops trusting it. An earned win — "I read it, I called it, it happened" — is the core loop and the reason to play again. We never fake a win the player didn't earn with a read.

**Why early frustration is unacceptable.**
The first ten minutes decide the account. A beginner who feels stupid or cheated early leaves forever — and tells others. The expected cost of a single early frustration is the *entire lifetime value of that player*. Therefore the first hour tolerates zero unexplained losses, zero untaught tests, and zero moments of "wait, what was I supposed to do?"

---

# PART 3 — The Player Psychology Model

The intended emotional curve. Confidence must climb steadily, with only **small, immediately-recovered dips** at genuine challenges. It must never crash.

| Stage | Confidence (0–10) | Expected emotion | Learning objective | Potential frustration | Recovery strategy | Journal reinforcement |
|---|---|---|---|---|---|---|
| **Website** | — (curiosity) | "This looks fun, not scary" | Trading can be playful | "Looks like a finance app / too hard for me" | Finn branding, zero jargon, "play free" — a game, not a broker | — |
| **Tutorial** | 3 → 5 | "Oh — green up, red down. I get it." | Read a single candle | Too much text / feeling patronized | 10-year-old words, show-don't-tell, ONE idea at a time | — |
| **Trade 1** | 5 → 7 | Nervous excitement → relief → joy | Momentum: a big candle keeps going; how a trade works | "What am I supposed to do?" | Guided walkthrough, one-tap entry, **guaranteed clean win**, 24–30 candles to *watch* | First entry: "You rode a strong green close — buyers stayed in control." Journal unlocks. |
| **Trade 2** | 7 → 8 | "I can do that again" | Repeat the read → pattern recognition | "Was the first one just luck?" | Second clean win on the *same* pattern — proves it wasn't luck | "Same read, same result. That's a pattern." |
| **Trade 3** | 8 | Competence: "I'm actually getting this" | Apply the read with *less* guidance | "Am I ready for more?" | Third win, hand-holding reduced, a "prove you can read" call | 3 wins logged + streak. "You called this one yourself." |
| **Boss 0** (the Gambler) | 8 → (dip) → 9 | "A real test — but I'm ready" → pride | Recognition under mild pressure | "The boss tests something I wasn't taught" | Boss tests **only taught concepts**; retry is free and framed as "read it again," not "you failed" | Boss cleared — "You beat the Gambler by reading, not guessing." |
| **Boss 1** | 8 → 9 | "I can handle a new idea" | Trend (higher highs / higher lows) | Difficulty spike | ≥3 applied trend trades *before* the boss; gentle escalation | "You traded with the trend." |
| **Boss 2** | 8 → 9 | Growing mastery | Support / resistance (levels react) | New concept feels abstract | Concept shown on the live chart before it's tested | "You bought at support." |
| **Boss 3** | 8 → 9 | "I'm becoming a trader" | Structure — Break of Structure | Two ideas blur together | One concept per level; BOS built *by construction* into the setup | "You traded the structure break." |

**The confidence law:** confidence may dip at a genuine challenge (a boss, a first real loss) but must **recover within the same session beat** — never carried as a wound into the next stage. A dip that doesn't recover is a design failure.

---

# PART 4 — The Trade Authoring System

**No trade may exist in ChartQuest without a completed authoring record.** This template is mandatory for every trade, at every level, forever.

```
TRADE AUTHORING RECORD
──────────────────────
Learning Objective ....... The ONE thing the player should be able to do after this trade.
Single Concept ........... Exactly one taught concept (never two). Must already be taught.
Expected Duration ........ Candle count, within the tier band (Part 6). Never < the tier floor.
Expected Emotional Arc ... The beat sequence (e.g. calm → setup forms → decide → scare-dip → hold → run → win).
Likely Mistake ........... The specific wrong thing a beginner will do here.
Recovery ................. How the game responds to that mistake so it teaches, never punishes.
Journal Entry ............ The one-line, 10-year-old takeaway written to the player's Journal.
Reward ................... Shells / XP / unlock — proportionate to the read, never to luck.
Preparation for Next ..... The thread this trade leaves that the next lesson picks up.
```

A trade missing any field is **not shippable**. The field that is skipped most often — *Preparation for Next* — is the one that turns a pile of trades into a curriculum. It is not optional.

---

# PART 5 — The Level Curriculum (Levels 1–3)

The teaching order is fixed and matches the game's `SETUP_UNLOCK` spine (momentum → pullback → BOS). Each level teaches **one** new concept, drills it in **≥3 applied trades** (`tradeGate`), then tests it — and *only* it — at the boss.

### Level 1 — "Read the Candle / Ride the Momentum"
- **Concept:** a big, decisive candle keeps going its way. Green closes strong → up. Red closes strong → down.
- **Why first:** it is the single most legible signal on any chart, requires zero prior knowledge, and it *is* the atomic unit of everything later (a trend is momentum repeating; a pullback is momentum resting; a break is momentum proving itself).
- **What the player should notice:** the biggest candle on screen is the one that matters, and price tends to continue after it.
- **Duration:** 24–30 candles — the player needs time to *watch* the continuation happen and feel the dip-then-run arc.
- **Boss prep:** Boss 0 (the Gambler) asks one thing — "which way is this big candle pushing?" — which is exactly and only what Level 1 taught.

### Level 2 — "Trend + Pullback"
- **Concept:** in a trend, price rests (a small pullback) and then resumes. Buy the dip *with* the trend; sell the bounce *with* the downtrend.
- **Why second:** it is momentum in context — it requires L1 (reading a candle) and adds the idea that direction has memory (a trend). It teaches *patience*: wait for the pullback, then for the confirmation close.
- **What the player should notice:** the trend's staircase (higher highs / higher lows), and that the safest entry is *after* a short rest, on a confirming candle.
- **Duration:** 20–26 candles — slightly faster than L1; the player reads quicker now and a touch more pace rewards their growing competence, but there is still full time to see the pullback and the confirmation.
- **Boss prep:** Boss 1 tests trend reading — taught and drilled in L2.

### Level 3 — "Structure / Break of Structure"
- **Concept:** when price closes *beyond* the last swing high (or low), the move has proven itself — that's a Break of Structure, and it often continues.
- **Why third:** it formalizes "the market proved it" — it requires trend (L2) and candle-close discipline (L1), and it introduces the single most important confirmation rule in trading: **a break only counts on the close, never on a wick.**
- **What the player should notice:** the old high/low as a line, and the decisive *close* through it (not the wick poke that closes back = a fake-out).
- **Duration:** 18–24 candles — the player is now fluent enough to enjoy a crisper trade, but the break and its close must still be clearly observable.
- **Boss prep:** the L3 setup is a BOS *by construction* (the confirmation candle closes beyond the pullback swing), so every L3 player is guaranteed to have traded the exact concept the boss tests.

**Curriculum invariants (never violate):** teach order momentum → pullback → BOS; one new concept per level; ≥3 applied trades before each boss; never test the untaught; every concept is shown on the live chart before it is tested.

---

# PART 6 — The First-Trades Redesign (specified before implementation)

The onboarding trades, fully authored. **All three are guaranteed clean wins** (the confidence-building phase tolerates no random loss). They run on the existing driven-candle engine (`tradeDrivenCandle`) with the outcome pre-authored to a win and the chart driven to *agree* with it — the win is *shown*, tagged when Finn reaches the target, never a mystery. Duration is enforced by `MIN_TRADE_CANDLES` (30) plus the tier band.

### Trade 1.1 — "Your first read" (Momentum LONG)
- **Learning Objective:** recognize that a big green close means "up," and take the trade.
- **Single Concept:** momentum (green = buyers in control).
- **Expected Duration:** 24–30 candles.
- **Expected Emotional Arc:** calm chart → a big green candle forms and is highlighted → guided "tap UP" → enter on the confirmation close → gentle rise → **a small scary dip toward the stop ("oh no…")** → it holds ("the stop protected me") → runs to the target ("I was RIGHT!") → win + trophy.
- **Likely Mistake:** hesitation, or not understanding what to tap.
- **Recovery:** the UP action is highlighted; the full ENTRY→STOP→TARGET walkthrough freezes the world and points at each line; the player cannot get it wrong.
- **Journal Entry:** *"You rode a strong green close — buyers stayed in control. That's MOMENTUM."*
- **Reward:** shells + the once-ever **First Win** trophy + the Journal unlocks.
- **Preparation for Next:** "Next time, watch the market take a short rest before it runs — that rest is your best entry."

### Trade 1.2 — "The other direction" (Momentum SHORT)
- **Learning Objective:** the same read works downward — a big red close means "down."
- **Single Concept:** momentum (red = sellers in control). *Same concept, mirrored* — this is reinforcement, not a new idea.
- **Expected Duration:** 24–30 candles.
- **Expected Emotional Arc:** big red candle → "tap DOWN" → enter → drift down → small bounce scare → holds → runs to target → win.
- **Likely Mistake:** assuming "down = bad / can't trade it."
- **Recovery:** the game frames the short plainly — "you can win when price falls, too" — and guarantees the clean win.
- **Journal Entry:** *"A strong red close = sellers in control. You can win going DOWN, too."*
- **Reward:** shells + XP + "two in a row" streak beat.
- **Preparation for Next:** "You've read two big candles right. Ready to call one yourself?"

### Trade 1.3 — "You call it" (Momentum, player-led)
- **Learning Objective:** read the direction *independently* and commit — the APPLY beat.
- **Single Concept:** momentum (player identifies the direction with reduced guidance; the SEE → GUESS → RESULT → LEARN loop).
- **Expected Duration:** 24–30 candles.
- **Expected Emotional Arc:** setup forms → the game asks "which way?" (the player reads it, not the game) → correct call rewarded → the same dip → run → win → "you called that one yourself."
- **Likely Mistake:** guessing against the obvious big candle.
- **Recovery:** if the read is wrong, the pre-trade "Quick Read" corrects it *before* committing capital (a free retry of the read), so the committed trade is still a clean win and the *lesson* — "big candle → its direction" — lands.
- **Journal Entry:** *"You read it yourself and called it right. Three for three."*
- **Reward:** shells + the 3-trade gate clears → the road to Boss 0 opens.
- **Preparation for Next:** "The Gambler thinks trading is luck. Prove it's reading."

**After Trade 1.3:** the player has three clean, earned wins, a Journal with three entries, and a single crisp belief — *"the big candle tells me which way."* That is precisely and only what Boss 0 will test.

---

# PART 7 — Forbidden Patterns (the permanent "Never Do This" rulebook)

These are production law. A build that violates any of them is broken, regardless of what it "improves."

1. **Never a random tutorial loss.** In the confidence-building phase (all of Level 1), outcomes are authored — clean wins or *telegraphed, explained* teaching-losses. Never a surprise coin-flip loss.
2. **Never a 3-candle trade.** No trade may resolve before the tier's minimum candle count. A trade that ends before the player can observe it teaches nothing and reads as arbitrary.
3. **Never a hidden mechanic.** Nothing that affects the outcome may be invisible. If the player can't see the cause, it doesn't exist.
4. **Never an unavoidable stop-out.** A loss must always have been *readable* or *survivable*. No setup may be authored where the player's correct action still loses to a hidden move.
5. **Never two concepts at once.** One new idea per level. Introducing a second before the first is landed collapses the staircase.
6. **Never a difficulty spike without preparation.** Every test is preceded by ≥3 applied trades of exactly that concept. The boss never asks what the level didn't drill.
7. **Never contradict a previous lesson.** If L1 says "green closes go up," L2 may not quietly punish acting on that. New nuance *extends*; it never negates.
8. **Never test the untaught.** (The curriculum constitution.) A concept must be taught, practiced, and applied before it is tested.
9. **Never punish the right process.** An A-grade read that loses to genuine variance must be *praised* ("great read — the market did the rare thing"), never scored as a mistake.
10. **Never bury the outcome in noise.** One clear result at a time. No overlapping popups, no stacked celebrations, no jargon the player hasn't met.
11. **Never make the outcome disagree with the chart.** The candles must always visibly justify the win or loss (the driven chart must *agree* with the authored outcome).
12. **Never gate progress behind luck.** The 3-trade gate advances on *participation and reading*, not on a required win streak the RNG could deny.

---

# PART 8 — Lesson Validation Checklist (every trade must pass before shipping)

A trade ships only if the answer to **all** of these is yes:

1. **Single objective?** Is there exactly one learning objective, stateable in one sentence?
2. **One concept, already taught?** Does it use exactly one concept, and has that concept been taught and practiced already?
3. **Enough observation time?** Does it last ≥ the tier's minimum candles, giving the player time to watch it unfold?
4. **Explainable outcome?** Can a complete beginner say *why* it won or lost, pointing at the chart?
5. **Journal reinforces?** Does the Journal entry restate the lesson in 10-year-old words?
6. **Confidence up?** Does the player finish more confident than they started (win *or* explained loss)?
7. **Prepares the next lesson?** Does it leave a thread the next concept picks up?
8. **Beginner-legible?** Would someone who has never opened a chart understand what happened?
9. **No forbidden pattern?** Does it violate zero items in Part 7?
10. **Emotionally arced?** Does it have a felt beginning, tension, and resolution — not a flat line?
11. **Reward proportionate?** Is the reward tied to the *read*, not to luck or grind?
12. **Reversible mistake?** If the player errs, does the game teach rather than punish?

---

# PART 9 — Testing Protocol

Every redesigned trade is verified in **beginner mode (`?fresh=1`)** on-device, against measurable criteria:

| Metric | How measured | Success criterion |
|---|---|---|
| **Candle count** | Count candles from entry to resolution | Within the tier band; never < `MIN_TRADE_CANDLES` (30) at L1 |
| **Observation time** | Wall-clock from setup-highlight to entry | ≥ 3 s to read before the entry is offered |
| **Clarity** | Beginner names the reason for the trade unprompted | ≥ 80% name it correctly |
| **Emotional engagement** | Beginner reacts at the dip and the win (observed) | Visible tension at the dip, relief/joy at the win |
| **Lesson retention** | Ask the concept back after 3 trades | ≥ 80% restate the concept in their words |
| **Journal usefulness** | Beginner can re-explain a past trade from its entry | Journal entry alone is enough to reconstruct the lesson |
| **Boss preparedness** | Beginner clears Boss 0 within 2 attempts | ≥ 80% clear within 2 tries |
| **The final-question test** | After L1–3, the beginner's spontaneous verdict | *"I understand why that happened, and I want to learn more"* — not *"the game is unfair"* |

Each redesigned trade is signed off "BEGINNER MODE VERIFIED" only after meeting every criterion.

---

# PART 10 — Implementation (plan)

The good news: **build 253 already implemented the load-bearing TES mechanics**, so this is a *conform-and-extend* pass, not a rebuild:
- **Min-duration** is enforced (`MIN_TRADE_CANDLES = 30`, gated on the Finn-reaches-line trigger) → kills the 3-candle trade (Forbidden #2).
- **Entry anchoring** to the confirmation candle is fixed on the intro trade → outcomes read as on-chart (Forbidden #3/#11).
- **Live P&L** is prominent → the player watches the arc (Part 3 engagement).
- **Focus music** on the trade → the emotional beat is scored (Part 3).
- The **intro trades are already forced wins**; the **3-trade gate** and **curriculum order** (`SETUP_UNLOCK`) already exist.

**Remaining refactor to fully conform L1–3 (protected system #9 — requires a PRE-FLIGHT + approval before code):**
1. **Extend the authored-win / telegraphed-loss window across all of Level 1** (today only the intro 3 are forced wins; the post-intro L1 trades are still a 58% coin flip — Forbidden #1). Confidence phase = no random losses.
2. **Set per-tier duration bands** (L1: 24–30, L2: 20–26, L3: 18–24) instead of a single floor.
3. **Guarantee a Journal entry + one-line review on every trade** (Part 4 field, Part 8 #5) — verify it fires at L1–3.
4. **Wire the *Preparation for Next* line** into each trade's post-review so the curriculum thread is felt.

This refactor is scoped, low-risk (it tightens existing systems rather than adding new ones), and is presented for approval as the immediate next step (see the PRE-FLIGHT accompanying this document).

---

# PART 11 — Regression Protection

So that six months of future development cannot silently undo this work, the following are locked in:

- **Automated (the regression gate, `scripts/verify.js`):** new checks assert (a) `MIN_TRADE_CANDLES ≥ 24` (tutorial trades can never again resolve in 3 candles), and (b) the curriculum order in `SETUP_UNLOCK` is intact (`momentum:1, pullback:2, bos:3`) so the teaching order can never be silently reordered. The gate **FAILS the build** if either regresses.
- **In-code:** anchoring comments at `MIN_TRADE_CANDLES`, the intro-win path, `SETUP_UNLOCK`, and `tradeGate` that name the TES rule they enforce and point here.
- **Documentary:** this file is the highest authority; `trading_canon.md` and `gameplay_canon.md` reference it; any audit that conflicts loses to it.
- **Process:** the Part 8 checklist is mandatory in the PRE-FLIGHT for any trade change.

---

# PART 12 — Executive Report

**Scores** (current state after build 253/254 + this doctrine; target = 9+ once Part 10 lands):

| Dimension | Now | With Part 10 | Note |
|---|---|---|---|
| Overall Trading Experience | 6 | 9 | Min-duration + live P&L fixed the worst of it; confidence-phase RNG is the last gap |
| Educational | 7 | 9 | Curriculum + journal are strong; outcomes now explainable |
| Confidence Curve | 5 | 9 | Intro wins are forced; extending that through L1 is the key lift |
| Beginner Friendliness | 7 | 9 | 10-year-old wording + guided first trade already excellent |
| Progression | 8 | 9 | Gated order + 3-trade gate already canon |
| Emotional Engagement | 6 | 9 | Focus music + dip-run arc + live P&L; needs the full duration bands |
| Curriculum Quality | 8 | 9.5 | momentum→pullback→BOS is a genuinely well-ordered spine |

**Top 10 improvements this doctrine makes:**
1. Names *confidence*, not realism, as the first-hour objective — and makes it law.
2. Defines the exact emotional curve, stage by stage, with recovery for every dip.
3. Makes every trade carry an authoring record (no trade without an objective).
4. Forbids random tutorial losses and 3-candle trades permanently.
5. Specifies the first three trades in full — guaranteed, earned, explained wins.
6. Ties every trade to a Journal entry a beginner can re-read and understand.
7. Requires each trade to *prepare the next* — turning trades into a curriculum.
8. Adds a 12-point pre-ship checklist and measurable playtest criteria.
9. Locks the curriculum order and minimum duration into the automated gate.
10. Answers the final question by design: the beginner's outcome is *understanding*, not grievance.

**Remaining risks:**
- **Confidence-phase RNG** (post-intro L1 is still a coin flip) — the single most important Part 10 item.
- **Journal fire-reliability** at L1–3 must be verified on-device, not assumed.
- **Boss 0 framing** — a retry must read as "read it again," never "you failed."
- **The long game:** the driven-chart is an *honest presentation of an authored outcome*, not yet the full author-first pipeline (Option B in trading_canon). For L1–3 confidence-building this is correct and sufficient; for advanced levels it should evolve toward genuine read-predicts-outcome.

**Recommendations for Bosses 4–10:** keep the one-concept-per-level spine (order blocks → liquidity → VWAP → multi-timeframe → confluence). As competence grows, shift the emotional target from *confidence* (L1–3) toward *mastery and agency* (L7+): let advanced players feel the edge is theirs by making reads genuinely predictive (author-first), tightening durations, and allowing *earned* variance (A-grade trades that lose to honest chance, richly reframed). Never let realism arrive before the player is ready to enjoy it.

---

## The Final Question

*A complete beginner who has never opened a chart plays the redesigned first three levels. Do they say "I lost because the game is unfair," or "I understand why that trade happened, and I want to learn more"?*

**By this design, the second answer is the natural outcome** — because: every Level-1 outcome is authored to be a clean, earned win (no unfair loss is possible); every trade lasts long enough to be watched and felt; every outcome visibly agrees with the chart; every trade writes a plain-words Journal entry the player can re-read; every concept is taught, drilled, and only then tested; and the one belief the player carries into Boss 0 — *"the big candle tells me which way"* — is exactly and only what Boss 0 asks. An attentive beginner cannot arrive at "unfair," because nothing unfair is allowed to happen. They arrive at *"I can actually learn this."*

That is the product.
