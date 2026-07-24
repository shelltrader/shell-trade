# ChartQuest — Beginner Comprehension Playtest Protocol

**Status:** Test design / analysis — NOT implementation. No changes to trading. **Date:** 2026-07-06.
**Series:** V2 evaluation ([Blueprint](Trading_Architecture_V2_Blueprint.md) · [Emotional Design](Trading_V2_Emotional_Design.md) · [Acceptance Criteria](Trading_V2_Acceptance_Criteria.md) · [Red-Team](Trading_V2_Red_Team_Audit.md)).
**Purpose:** Before investing in a major redesign, find out whether the **current** trading system actually causes player pain — specifically, whether beginners understand **why they won** and **why they lost**. Runs on the shipped build, unmodified.

---

## 0. The one idea that makes this test trustworthy

The current build decides the outcome with a coin flip (`_l1Outcome = Math.random()`) and paints the candles to match. **There is no true "why."** That has a sharp consequence for how we measure:

> A beginner can *always* invent a confident reason for a random result. So "Did you understand why you won?" answered "yes" proves **nothing** on its own — it cannot distinguish real understanding from **confabulation** (a satisfying story about noise).

This test therefore never trusts self-reported understanding at face value. It **validates** stated understanding against something objective: **can the player predict?** If their sense of "I knew that would happen" has no predictive power (and under a coin flip it can't), then their "understanding" is an illusion. Separating those two cases is the whole job, because they point to opposite decisions:

| What we find | What it means | Decision |
|---|---|---|
| Beginners are **confused** — can't explain, feel it's random/unfair | Real, felt pain | **Build V2** |
| Beginners **confabulate confidently** and feel fine | No felt pain (a designer/education concern, not a player one) | **Weak case for V2** |
| Beginners genuinely **read and predict** | The premise ("feels arbitrary") is wrong | **Don't build V2 for this reason** |

A naive one-question survey collapses rows 1 and 2 into "they said yes." The safeguards below keep them apart.

---

## 1. Testing protocol

### 1.1 Participants (n = 10)
- **Trading-naïve.** Screen out anyone who has traded stocks/crypto or used a charting app. One screening question: *"Have you ever bought or sold a stock or crypto, or watched price charts?"* → exclude "yes."
- **As close to the target player as possible** (the game is written for a 10-year-old). If testers are adults-new-to-trading, that's acceptable for a first pass **but flagged**: a naïve adult is not a 10-year-old, and comprehension/patience differ. Note the age mix in results.
- Solo sessions. No coaching from friends/parents mid-play.

### 1.2 Conditions
- **The current shipped build, unchanged.** This is the point — we measure the live coin-flip system.
- **Beginner mode:** launch with `?fresh=1` (clean state) on the **target device (mobile)**.
- Each tester plays the same starting flow (auth/guest → intro → Level 1+).

### 1.3 The critical "intro trades" caveat
The first **3 guided trades are forced wins** (`_introTrade`), not random. They are *not* representative of the "why did I win?" question. **Tag every trade with its index**; analyze comprehension primarily on **post-intro trades (#4 onward)**, which are the true coin-flip trades. Report intro trades separately.

### 1.4 Moderator & bias controls (non-negotiable — the red-team demands these)
- **The founder is not the moderator.** (Founder presence/knowledge is the strongest confirmation bias in the room.) A neutral person reads a fixed script; if the founder must observe, they stay silent and off-camera.
- **Fixed, neutral wording.** No leading prompts ("wasn't that unfair?"). Every probe is identical across testers.
- **Verbatim capture** (audio/screen recording) so answers can be re-graded independently.
- **Pre-register the thresholds in §4 before running.** Results may not be reinterpreted to fit a hoped-for verdict.
- **Unit of analysis = the trade, not the player.** 10 testers × ~15 post-intro trades ≈ **~150 trade-observations** — enough for direction, not for tight statistics. Treat everything as *signal, not proof* (n=10).

### 1.5 Session shape (~30–35 min/tester)
1. **Screen & consent** (2 min).
2. **Play** (~15–20 min): reach roughly **10–20 trades**. Moderator runs the per-trade micro-probe (§2.1) after each resolution and the pre-trade capture (§2.2) before each commit. Think-aloud encouraged but not required.
3. **Consistency probe** (~5 min, §2.3): replay two of the player's own near-identical setups with opposite outcomes; ask them to explain each.
4. **Prediction mini-test** (~5 min, §2.4): 4 fresh paused setups — predict + reveal. *This is the objective comprehension measure.*
5. **Exit interview** (~5–8 min, §2.5).

### 1.6 Ground-truth cross-reference (no code changes)
The game already emits trade telemetry (`ContentLog` → Supabase) including the real outcome and the (currently cosmetic) quality grade. **Pull it** to cross-reference each probe against the objective outcome/quality — without modifying trading. If telemetry is offline, record outcomes manually from screen capture. (If neither is available, the run is invalid — see §5.)

### 1.7 The smallest viable version
If time/resources force the absolute minimum, the irreducible core that still answers truthfully is:
> **Per-trade "why?" + "you or luck?" (§2.1)  ➕  the end-of-session prediction mini-test (§2.4).**
Everything else (pre-trade capture, consistency probe, full exit) is cheap rigor that hardens the answer against confabulation. Drop them last, not first.

---

## 2. Exact questions & survey format

All wording is child-appropriate (10-year-old reading level). Response formats in brackets.

### 2.1 Per-trade micro-probe — fires immediately after **every** trade resolves
Keep it to one spoken sentence + two taps; do not disrupt flow.

1. **Recall:** *"Did you just win or lose that one?"* → [Won / Lost / Not sure]
   - (If "Not sure," that alone is a comprehension red flag — log it.)
2. **The core "why":** *"Why do you think that happened?"* → **open-ended, capture verbatim.** Graded later with the §3 rubric.
3. **Agency vs luck:** *"Was that because of something *you* figured out, or was it luck?"* → [I figured it out / A bit of both / Luck / Not sure]
4. **Fairness (neutral phrasing):** *"Did that one feel fair?"* → [Yes / No / Not sure]

### 2.2 Pre-trade prediction capture — fires just **before/at** commit, before the result is known
This is the confabulation detector. Two taps.

1. *"Do you think this trade will win or lose?"* → [Win / Lose]
2. *"How sure are you?"* → [Just guessing / Kind of sure / Really sure]

> Later we check: **does pre-trade confidence predict the actual outcome?** Under a coin flip it cannot. So if "Really sure" trades win no more often than "Just guessing," any post-trade "understanding" is confabulation.

### 2.3 Consistency probe — end of session
Moderator selects, from the player's own logged trades, **two setups that looked nearly identical but had opposite outcomes** (guaranteed to exist under a coin flip). Replay each:
- *"Here's a trade you took. Why did this one [win/lose]?"* (verbatim)
- Then the twin: *"Here's another one that looks a lot like it. Why did this one [lose/win]?"* (verbatim)
- **Tell:** confident, contradictory causal stories for the same setup = confabulation demonstrated on the spot.

### 2.4 Prediction mini-test — the objective comprehension measure
Show **4 fresh, paused setups** (no shells at risk). For each:
1. *"Will this one win or lose?"* → [Win / Lose]
2. *"How sure?"* → [Guessing / Kind of / Really sure]
3. Reveal the actual outcome; record hit/miss.
→ Yields a **hit rate** and a **confidence–accuracy calibration** per tester. Real understanding ⇒ hit rate above chance and rising with confidence. Coin-flip system ⇒ hit rate ≈ 50% regardless of confidence.

### 2.5 Exit interview (verbatim)
1. *"In your own words, how does this game decide if you win a trade?"* — **the mental-model question.**
2. *"When you won, did you usually know why? Can you give me one example?"*
3. *"When you lost, did you usually know why? Can you give me one example?"*
4. *"Can you tell me a rule for when a trade will go UP?"* — teach-back; we test this rule against reality.
5. *"Did winning or losing ever feel unfair, or confusing? When?"*
6. *"Did you ever feel smart? Did you ever feel tricked?"*
7. *"Is winning here more about skill, or more about luck?"* → [Skill / Both / Luck]
8. *"Do you want to keep playing? Why or why not?"*

### 2.6 Logging schema (one row per trade)
`tester_id · trade_index · is_intro(3 forced wins?) · setup_type · outcome(win/loss) · pre_prediction(win/loss) · pre_confidence(1–3) · Q1_why_verbatim · Q1_grade(0–3) · Q2_agency · Q4_fair · quality_grade(from telemetry)`
Plus one exit row per tester and one prediction-mini-test block per tester.

---

## 3. Grading rubric for "why did that happen?" (Q1)

Grade every verbatim answer 0–3. Two people grade a 20% sample independently to check agreement (inter-rater reliability); reconcile the rubric if they diverge.

| Grade | Label | What it sounds like | Reading |
|---|---|---|---|
| **0** | **No model** | "I don't know." · shrug · "It just did." | No understanding — pure confusion |
| **1** | **Confabulation** | Confident but generic/circular/restates the outcome: "I'm good at this." · "It went up because it went up." · "The green one is lucky." | *Feels* like understanding; isn't. The critical, likely-dominant category |
| **2** | **Luck / random** | "I guess I got lucky." · "It's random." · "50/50." | Honest, but no felt agency |
| **3** | **Correct taught concept** | Names the actual taught idea and it would generalize: "The big green candle meant buyers were strong, so it kept going up." | Genuine — but **must be validated** by prediction ability (§2.4); a correct-sounding story on a coin flip is still confabulation unless it predicts |

**Key:** Grade 3 is only *real* understanding if that tester also predicts above chance. A grade-3 explanation with a ~50% hit rate is confabulation wearing the right vocabulary.

---

## 4. How the two questions get answered (analysis plan)

### 4.1 The two headline outputs
- **Q: Do beginners understand why they WON?** → distribution of win-probes across rubric grades 0–3, **filtered to post-intro trades**, cross-checked against prediction ability.
- **Q: Do beginners understand why they LOST?** → same for loss-probes. *(Expect an asymmetry — self-serving bias makes people explain wins as skill and losses as bad luck. That asymmetry is itself a finding.)*

### 4.2 The validity gate (confabulation check)
Cross-tabulate **claimed understanding** (Q2 = "I figured it out", or Q1 grade ∈ {1,3}) against **predictive validity** (mini-test hit rate / pre-trade calibration):

| | Predicts > chance | Predicts ≈ chance |
|---|---|---|
| **Claims understanding** | Real understanding (surprising here) | **Confabulation** (feels understood, isn't) |
| **No claim** | (rare) | Honest confusion / luck-attribution |

The cell that most trade-observations land in is the answer.

### 4.3 Supporting reads
- **Agency:** % "I figured it out" vs "Luck" — split by win vs loss.
- **Fairness:** % "No/Not sure" on Q4 — especially on **losses**.
- **Consistency probe:** count of testers who gave contradictory confident explanations for twin setups.
- **Mental model (Exit Q1):** classify each as *correct / confabulated / "it's random."*
- **Teach-back (Exit Q4):** test each stated "rule" against the telemetry — does following it actually win more? (Under a coin flip: no.)
- **Churn intent (Exit Q8):** want-to-continue vs. not, correlated with recent losses.

---

## 5. Success & failure criteria (pre-registered)

"Success/failure" here means **the verdict on whether the problem is real**, not whether players did well. Decide these numbers *before* running. With n=10 these are **directional bands**, not significance tests.

### VERDICT A — The pain is REAL → a redesign like V2 is justified
Declare if **most** of these hold:
- **≥ 40%** of post-intro **loss**-probes are Grade 0 ("don't know") **or** explicitly luck-attributed-and-bothered.
- Prediction mini-test hit rate **≤ ~55%** overall (≈ chance) — they genuinely can't read it.
- **≥ 30%** of loss-probes flagged **"unfair" or "confusing."**
- Exit mental model is **"random / I don't get it"** for a majority.
- Churn intent rises after losing streaks.
→ *The system does not deliver understanding, and players feel the lack.* Build.

### VERDICT B — The pain is NOT felt → weak case for V2 (the uncomfortable outcome)
Declare if:
- Low "don't know" (**< 20%**) and low unfairness (**< 15%**), **and** high enjoyment / "would keep playing," **but**
- Prediction hit rate **≈ chance**, **and** explanations are dominated by **Grade 1 confabulation**, **and** the consistency probe catches contradictions.
→ *Players are happily confabulating.* There is little **experiential** pain to fix — the concern is designer-integrity plus a **latent educational** risk (they *think* they're learning and aren't). V2's feel-ROI is low; either don't build it as a feel fix, or reframe/justify it explicitly as an **education-integrity** investment and re-scope accordingly.

### VERDICT C — Understanding is genuinely present → premise is wrong
Declare if:
- **Grade 3** dominates **and** prediction hit rate is **> ~65%** with confidence-calibration.
→ Surprising under a coin flip. Investigate: likely the forced intro wins or the driven-candle arc is teaching something readable, or the sample skewed expert. Re-examine trade indices before concluding. Either way, "results feel arbitrary" is not supported.

### VERDICT D — Ambiguous / underpowered
Mixed pattern, or too few post-intro trades captured.
→ **Escalate to scale, cheaply:** ship a two-tap in-game instrument — *"Did that feel fair?"* / *"Did you know why?"* — to a larger beta cohort on the current build, and decide from that volume. Do **not** green-light a redesign on a muddy n=10.

### When to DISCARD the run entirely (test-validity failures)
- Fewer than ~8 post-intro trades captured per tester (not enough to read comprehension).
- No ground-truth outcomes available (telemetry offline **and** no screen capture) — can't validate anything.
- Testers weren't actually trading-naïve, or the founder moderated/coached.
- Probes drifted from the fixed script (leading questions crept in).
A discarded run tells you nothing — rerun clean rather than over-read a broken one.

---

## 6. What this test can and cannot tell you

**Can:** whether beginners understand win/loss causes on the current build; whether they feel it's fair; whether apparent understanding is real or confabulated; a go/reconsider signal for the whole V2 investment — *before* touching protected system #9.

**Cannot** (needs a longer/larger study): learning **transfer** to real trading, **retention** over days, whether **V2 specifically** fixes what this finds, or true behavior of the **10-year-old** target if testers are adults. This is a diagnosis of *is the wound real*, not a prescription.

---

*Test design only. No game code was modified; the study runs on the shipped build. Thresholds marked "~" and the percentage bands are pre-registration starting points for the founder to lock before the first session. n=10 yields direction, not proof.*
