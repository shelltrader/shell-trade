# ChartQuest — Trade System V2

### Design Sprint: The Ideal Trade Loop (Levels 1–3)

**Status:** Pre-external-testing • **Scope:** The core trade experience • **Audience:** Complete beginners, zero trading experience
**Constraint:** Candle direction, patience, waiting, entry, stop loss, take profit only. No VWAP, support/resistance, trendlines, or advanced confluence yet.
**Governing visual constraint:** This loop must obey the [Global Visual Rule — Chart Continuity](ChartQuest_Global_Visual_Rule.md) at every step. The chart must always read as a continuous living market; chart continuity overrides rigid camera behavior. The moments below that reframe the chart (Trader View in §4, the entry wait in §5, the trade watch in §6) are the highest continuity-risk points in the game and carry inline continuity constraints.

---

## 1. The Problem, Restated as a Design Target

Trades resolve too fast, so nothing has time to *matter*. When a trade is over in a second, the player never forms a memory of it — there's no anticipation, no commitment, no payoff. Wins feel like a number ticking up; losses feel like a number ticking down. The "trading fantasy" is weak because the player is *clicking*, not *trading*.

Emotional investment in any game comes from four ingredients, and our current loop is missing most of them:

| Ingredient | What it means | Current loop |
| --- | --- | --- |
| **Anticipation** | Wanting something before you get it | Missing — no wait |
| **Commitment** | You staked something you care about | Weak — shells feel free |
| **Agency** | *You* made the call | Weak — the call is instant |
| **Attributed payoff** | You see the result *and understand why* | Missing — result feels random |

**The fix is not more features. It is pacing, stakes, and ceremony.** We slow the loop down on purpose, give the player something real to risk, force a few meaningful decisions, and then make the resolution explain *why it happened*. Everything below serves those four ingredients.

---

## 2. The Trading Fantasy We Are Selling

> *"I am a patient hunter. I wait in the reeds. I don't chase. When the setup appears, I know it on sight, I commit, and I let the trade breathe. When I win, it's because I followed my rules — not because I got lucky."*

This is the single most important sentence in the document. Every mechanic either reinforces the **patient, disciplined hunter** or it doesn't belong in Levels 1–3. The turtle is the perfect avatar for this fantasy — slow, deliberate, armored, unbothered. We lean into it: a turtle does not chase. A turtle waits.

**The core teaching philosophy: process over outcome.** A beginner's instinct is "did I make money?" We are training the opposite instinct: "did I follow my plan?" A losing trade taken correctly is a *good* trade. A winning trade taken on a whim is a *lucky* trade — and luck runs out. The entire reward system is built to reward the *decision*, not just the result.

---

## 3. The Core Loop at a Glance

```
            ┌─────────────────────────────────────────────────────────┐
            │                    THE TRADE LOOP                         │
            └─────────────────────────────────────────────────────────┘

   1. SETUP DETECTION  →  2. ENTRY  →  3. TRADE MANAGEMENT  →  4. RESOLUTION
   "I found a setup"      "I waited,    "I watched it          "I won because
                          I entered,    play out"               I followed
                          I risked"                             the rules"

   scan & zoom out        arm SL/TP      hold through the       win/loss ceremony
   tag the pattern        risk shells    drawdown               + attributed reason
   confirm the trend      wait for       resist the urge        → Trade Journal
   (or PASS)              the trigger    to bail                → process grade
```

One loop, four phases. The same four phases run at every level — Levels 1–3 add agency and pressure on top, they never replace the loop. A beginner who learns the rhythm in Level 1 is never asked to learn a *new* rhythm; they're asked to do the same dance with more freedom and higher stakes.

**Target loop length:** ~75–120 seconds at Level 1 (today it's a few seconds). That single change — giving the loop *time* — is the heart of V2.

---

## 4. Phase 1 — Setup Detection · *"I found a setup"*

### What happens
The turtle is running along the live BTC chart as it does today. But it can no longer trade anywhere. The player must **find a valid setup** — and at Levels 1–3 there is exactly one setup to learn: the **Two-Candle Pullback**.

**The Two-Candle Pullback (the only pattern in this tier):**
1. **Momentum candle** — a strong candle in the trend direction (Level 1: green/up only). "The market is moving."
2. **Pullback candle(s)** — one or two candles *against* the trend. "The market takes a breath. Beginners panic here. We wait."
3. **Confirmation candle** — price resumes in the trend direction. *This* is the trigger. (Handled in Phase 2.)

This is the perfect beginner pattern because it is **nothing but candle direction** — exactly what the constraints allow. No lines, no indicators. Green, red, green. Go.

### Trader View (zoom-out mode)
The player pulls the camera back from the close-up side-scroller into **Trader View** — a zoomed-out chart showing the last ~20 candles. This is the moment the player stops being a platformer character and starts *reading a chart*.

- Zooming out is a **deliberate, satisfying ritual** — the world shrinks, ambient sound dampens, time slows. It physically feels like "stepping back to think."
- In Trader View the player confirms the **context**: "Are we generally going up? Yes. Did we just pull back? Yes." That's the whole checklist at Level 1.
- Trader View is also our **anti-impulse tool**. You cannot enter from the zoomed-in view. To trade, you must first zoom out and look at the bigger picture — structurally forcing the patient, considered behavior we want.

> **⚠ Continuity constraint:** Trader View is the single biggest chart-continuity risk in the game. Zooming out must reveal *more market*, never a dead right edge or a price scale floating past the last candle. The live edge stays populated and the future buffer stays tight — governed by the [Global Visual Rule](ChartQuest_Global_Visual_Rule.md).

### Player decision
**Is this a valid setup — yes or no?** And critically, **PASS is a real, rewarded choice.** If there's no clean pullback, the correct move is to do nothing. We grant a small **Patience reward** (XP + a "Patience" stat tick) for correctly passing on a non-setup. This directly attacks the #1 beginner killer: overtrading.

### Emotional beat
The hunt. Eyes scanning. "Is this it? …not yet… wait… *there*." Low, tense ambient audio while scanning, resolving into a clean recognition chime when a true setup is tagged.

### Dopamine moment
**Recognition.** The player spots the pattern themselves and tags the candles; the game confirms with a crisp "**Setup Found**" stamp and the candles briefly highlight. The reward here is the feeling of *"I can read this now."* That's the hook that makes a beginner feel like a trader on day one.

### Educational value
Trend direction + pullback = opportunity. Taught entirely through candle color and shape. The player builds pattern-recognition through repetition, not lecture.

### Anti-pattern guarded against
Trading everywhere / FOMO. The setup gate plus rewarded passing teaches selectivity before anything else.

---

## 5. Phase 2 — Entry · *"I waited… I entered correctly… I risked something"*

This phase is three small ceremonies stacked together. None of them is hard; all of them are *deliberate*. This is where commitment is manufactured.

### Step A — Arm the trade (set SL & TP *before* entering)
The player places the **Stop Loss** and **Take Profit** *before* committing. This is the most important habit in all of trading, and we teach it as the very first thing you do.

- **Stop Loss** = *"the line the turtle won't cross."* Rendered as a churning whirlpool / dark current *below* the entry. Cross it and you're swept away.
- **Take Profit** = *"the treasure ledge."* A glowing shell-laden ledge *above* the entry.
- At **Level 1 these are pre-suggested** with a fixed **1:2 risk/reward** (the TP is always twice as far as the SL). The player just confirms placement — learning *that* SL/TP exist and that reward should beat risk, without yet doing the math.

### Step B — Risk the shells
The player stakes **shells** (the game currency) on the trade. This is what converts a number into a feeling.

- The risked shells are visually **pulled out of the turtle's pouch and set down on the chart, on the line.** You can *see* what you're risking sitting there, exposed.
- **Level 1: fixed stake** (e.g., 50 shells) so the beginner isn't paralyzed by sizing. The lesson at L1 is simply "you can lose this."
- Shells must feel *earned and scarce* enough that losing them stings — but L1 has a **floor / safety net** so a beginner can't go broke and rage-quit. Stakes that hurt, consequences that don't end the game.

### Step C — Wait for the trigger, then commit
The setup is armed, but **you do not enter yet.** You must wait for the **confirmation candle** — price actually resuming in the trend direction — to *close*. This is the patience test, live.

- A candle is still forming. Will it confirm or fail? **Tension.** The player's finger hovers.
- **Jumping in early** (before the candle confirms) is allowed but penalized — worse entry, or the setup invalidates. **Waiting for the close** is rewarded with a clean entry. The game *mechanically teaches* "wait for confirmation."
- On confirmation, the player commits with a single decisive action: the turtle **dives into the candle / plants a flag.** It feels like a *commitment*, not a click.

### Player decisions
Where to place SL/TP (confirm at L1, freeform later) • how many shells to risk (fixed at L1) • when to pull the trigger • or abort the setup entirely if the trigger never comes.

### Emotional beat
Commitment and exposure. *"My shells are on the line. I'm in. No take-backs."* The shift from observer to participant.

### Dopamine moment
The **snap of confirmation** — the trigger candle closes green, a satisfying lock-in sound, shells click into place on the chart, the turtle dives. A clean, physical "I'm IN" beat.

### Educational value
The professional sequence, drilled in: **define your risk → define your reward → wait for confirmation → then and only then commit.** Reward is set before hope can distort it.

### Anti-pattern guarded against
Entering with no plan, no stop, and no confirmation — the way every blown beginner account starts.

---

## 6. Phase 3 — Trade Management · *"I watched the trade play out"*

This is the phase that fixes "trades feel too fast." **The trade now has duration, and the player watches it breathe.**

### What happens
After entry, price plays out over a defined number of **live candles**. The turtle rides the wick as price travels toward the treasure ledge (TP) or the whirlpool (SL). This is the *movie* of the trade, and the player is in the front row with shells on the line.

- **Trade duration (L1):** resolves over **~4–6 candles**, roughly **30–60 seconds** of watch time. Long enough to feel like *something is happening to me*; short enough to stay in the loop. *(Tunable — see §10.)*
- To control pacing without waiting on real market time, candles advance on a **trade clock** (accelerated/segmented live feed) so duration is designed, not left to BTC's mood.
- **Audio carries the tension:** a heartbeat that quickens as price nears the whirlpool, brightens as it climbs toward the ledge.

> **⚠ Continuity constraint:** As the trade clock advances candles toward TP/SL, the future buffer *ahead* of price must stay limited and intentional — the path forward can never read as empty space, and the live edge must stay connected throughout the watch. Governed by the [Global Visual Rule](ChartQuest_Global_Visual_Rule.md).

### The emotional core: the drawdown
Real trades almost always dip *against* you before they work. **We bake this in on purpose.** At Level 1 a winning trade should *first* drift toward the stop — the player feels fear, the urge to bail — and *then* recover and run to TP. That fear-then-relief arc is the emotional engine of the whole loop. A trade that goes straight to TP teaches nothing and feels cheap; a trade you *sweated* and then won feels *earned*.

### Player decisions (kept minimal early — agency ramps later)
- **Level 1: HOLD. That's the entire job.** You set the plan; now you must *let it work*. The one available action — panic-closing early — is framed as **breaking your plan**, and the journal will note it. The hardest, most valuable beginner lesson is "stop touching it," and L1 teaches exactly that.
- (Levels 2–3 introduce one real in-trade decision — see §9.)

### On-screen reminder
A small HUD line keeps the rule visible: **"Your plan: hold to the ledge or the whirlpool."** Reinforcement at the exact moment of temptation.

### Emotional beat
Hope, fear, the white-knuckle urge to bail, and the discipline to sit on your hands. The player *lives inside* the trade instead of skipping past it.

### Dopamine moment
**Near-misses and recovery.** Price wicks toward the whirlpool and pulls back; the heartbeat spikes and settles. Each candle that survives is a micro-payoff. The relief when the drawdown reverses is its own hit of dopamine — and it's the feeling that brings players back.

### Educational value
Trades take time and they wobble. Drawdown is normal, not a verdict. Your stop is there *so you don't have to panic* — it's already doing its job. Discipline = letting a good plan play out.

### Anti-pattern guarded against
Panic-selling at the first dip; babysitting and over-managing a trade that just needs room.

---

## 7. Phase 4 — Trade Resolution · *"I won because I followed the rules"*

Resolution is **ceremony**, and the ceremony's job is to **attribute the result to the player's behavior.** This is where wins become exciting, losses become meaningful, and learning gets locked in.

### WIN presentation
- The turtle reaches the **treasure ledge.** The final candle closes into TP in **slow motion.** Beat of silence — then the ledge **erupts in shells**, coins burst across the screen, triumphant sting, the turtle does a little victory animation.
- Risked shells return **plus the reward** (1:2 → stake 50, win +100). The payout is *shown growing*, not just totaled.
- **Critically, the win is attributed to behavior, not luck:**
  > **TRADE WON** — *+100 shells*
  > ✓ You waited for confirmation
  > ✓ You held through the drawdown
  > ✓ You respected your stop
  > **+Discipline · +XP**

  The player reads *why* they won. That is the literal sentence "I won because I followed the rules," delivered back to them as a reward.

### LOSS presentation
Losses must feel **meaningful, not cruel.** The goal is a lesson with a sting, not a punishment that makes a beginner quit.

- The shells on the line are **swept into the whirlpool** — visceral, you watch them go. Somber tone, dimmed color. Real, but brief.
- Then the **Trade Journal opens automatically** and reframes the loss as information:
  > **TRADE LOST** — *−50 shells*
  > The trend didn't continue. This happens — even to good traders.
  > ✓ Your loss was *small* because you set your stop.
  > ✓ You followed your plan. **This was a good trade that lost.**
- **The frame is everything:** a controlled loss taken by the rules is a *success of process*. We explicitly praise the small, contained loss. A beginner who learns to *lose well* is a beginner who survives.
- **Process-vs-outcome split:** if the player *broke* a rule (jumped the trigger, panic-closed, moved the stop), the journal flags it differently — *"This loss came from breaking your plan, not from the market."* Same outcome, different lesson. And a **lucky win** taken on a broken process is gently flagged too — *"You won, but you didn't follow the plan. Don't trust this one."*

### The Trade Journal (the spine of learning)
Every trade auto-logs: setup type, entry, SL, TP, shells risked/won, result, **and a Process Grade** (did you follow the rules, yes/no, on each step). The journal is not a footnote — it's where reinforcement compounds. Reviewing trades earns XP; streaks of *well-taken* trades (win **or** loss) build a **Discipline** stat that gates progression and feeds the end-of-world Boss quiz.

### Emotional beat
Elation on a win; a clean, honest sting on a loss — but **always closure and always a lesson.** The player never leaves a trade confused about what just happened.

### Dopamine moment
The win eruption is the obvious one. The subtler, stickier one: the **"good loss" reframe** — turning a loss into a *"+Discipline, you did it right"* moment converts a punishing emotion into a forward-pulling one. That's how we keep beginners playing through losing streaks.

### Educational value
Outcome ≠ decision quality. Small losses are the cost of doing business. Following the rules is the actual win condition. The journal makes the lesson permanent.

---

## 8. Cross-Cutting Systems

**Shells (stakes).** The emotional currency. Visible-on-the-line risk, scarcity that makes losses sting, a Level-1 floor so beginners can't bust. Shells fund the *feeling* of risk; XP/Discipline fund *progression*. Keeping them separate means a player on a cold streak still advances by trading *well*.

**The Patience Economy.** Doing nothing is a rewarded action. Correctly passing a non-setup grants Patience XP. This is the explicit counterweight to overtrading and the mechanical embodiment of "a turtle does not chase."

**Process Score.** Every step of every trade is graded yes/no on rule-following, independent of profit. Drives the Discipline stat. This is the single most important *educational* system in the game — it teaches beginners to value the right things.

**Fixed Risk/Reward (1:2 at L1).** Built into the suggested SL/TP. Teaches "reward should beat risk" by feel, before any math. Becomes adjustable as levels progress.

**Trade Journal.** The persistent record and the review-for-XP loop. Connects individual trades to the season-long arc and to the Boss quizzes that gate each world.

---

## 9. The Level 1 → 3 Progression Ramp

One loop, escalating agency and pressure. The player never relearns the dance — they're trusted with more of it.

| | **Level 1 — "The Patient Hunter"** | **Level 2 — "Reading the Wait"** | **Level 3 — "Trusting the Plan Under Pressure"** |
| --- | --- | --- | --- |
| **Core teaches** | The loop itself: patience, confirmation, hold | Agency: your call, your levels | Emotional discipline & live management |
| **Direction** | Long only (uptrend pullbacks) | Long **and** short (pullbacks both ways) | Long & short, mixed conditions |
| **SL / TP** | Pre-suggested, fixed 1:2 — confirm only | Player places own SL/TP within guardrails | Variable RR; player owns placement |
| **Shell risk** | Fixed stake (e.g., 50) | Risk slider unlocked — choose your size | Larger stakes; sizing matters |
| **In-trade action** | **Hold only** | Hold, or abort before trigger | **One real action:** move stop to breakeven once in profit (risk-free runner) |
| **Setups** | Clean pullbacks only | Clean pullbacks, both directions | Adds **fakeouts** — setups that look valid but fail |
| **Trade duration** | ~30–60s (4–6 candles) | ~45–75s, more variable | ~60–90s, includes a deep-drawdown "conviction" trade |
| **Emotional target** | "I can read this. I can wait." | "I'm making the calls now." | "I held my nerve when it got scary." |
| **Ends with** | Boss 1 quiz (✓ done) | Boss 2 quiz | Boss 3 quiz |

Each level's Boss quiz tests exactly what that level taught — so the trade loop and the existing boss system reinforce each other instead of living in separate worlds.

---

## 10. Pacing & Tuning Spec (starting values for testing)

These are deliberate starting points to validate in external testing, not final numbers.

- **Full loop length (L1):** 75–120s — *the headline metric. If testers blow through faster, the slow-down isn't landing.*
- **Trade watch duration (L1):** 30–60s over 4–6 candles on the trade clock.
- **Fixed stake (L1):** 50 shells. **RR:** 1:2 (win +100 / loss −50).
- **Patience reward:** small XP + Patience tick per correct pass.
- **Drawdown design (L1 wins):** winning trades dip ~40–60% of the way to the stop before recovering — enough to scare, not enough to stop out.
- **Shell floor (L1):** player cannot drop below a set minimum — losses sting, never end the run.

**Key questions for the test build:**
1. Do players *feel the wait*, or do they try to skip it? (If they skip, the wait isn't tense enough or the pass-reward isn't visible enough.)
2. Does the drawdown produce real fear — and is the recovery a real relief?
3. Does the "good loss" reframe keep losing players engaged, or do they still churn?
4. Is "hold only" satisfying at L1, or does it feel passive? (If passive, surface more in-trade micro-feedback rather than adding decisions.)
5. Do players internalize *process over outcome* — i.e., do they start valuing the Discipline stat?

---

## 11. How This Hits the Brief

Every required feeling now maps to a concrete mechanic:

| Brief's target feeling | Delivered by |
| --- | --- |
| "I found a setup." | Phase 1 — scan, Trader View zoom, tag the two-candle pullback yourself |
| "I waited patiently." | Phase 1 rewarded PASS + Phase 2 wait-for-confirmation trigger |
| "I entered correctly." | Phase 2 — arm SL/TP, then commit only on the confirmation close |
| "I risked something." | Phase 2 — shells pulled from the pouch onto the line, visible and exposed |
| "I watched the trade play out." | Phase 3 — 30–60s of live candles, the drawdown, the heartbeat |
| "I won because I followed the rules." | Phase 4 — win/loss ceremony that attributes the result to behavior + the journal's Process Grade |

And every CONSIDER item is load-bearing: **two-candle pullback** is the only setup (Phase 1–2) • **Trader View zoom** is the think-like-a-trader gate (Phase 1) • **risking shells** is the stakes engine (Phase 2) • **trade duration** is the core fix (Phase 3) • **emotional investment** comes from stakes + commitment + the drawdown arc • **reward presentation** is the attributed win/loss ceremony (Phase 4) • **learning reinforcement** is the Process Grade + Trade Journal + Boss tie-in.

**Nothing banned leaked in:** no VWAP, no support/resistance, no trendlines, no multi-signal confluence. The entire tier runs on candle direction, patience, waiting, entry, stop, and take profit — exactly as constrained.
