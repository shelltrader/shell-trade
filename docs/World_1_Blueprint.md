# Chart Quest — World 1 Blueprint: "Reading the Chart"

### Build-ready spec for approval

This is the complete, implementable spec for World 1. It nails the full loop — lessons, drills, quiz, boss, rewards, and the systems they touch — so it can serve as the template every later world is cloned from. Every drill includes real example content, exact scoring, and edge cases. An approval checklist is at the end.

---

## 0. World 1 at a glance

| Field | Value |
|-------|-------|
| **World** | 1 of 8 |
| **Title** | Reading the Chart |
| **Teaches** | Candle anatomy (body), green vs. red, wicks/shadows & rejection, timeframes |
| **Prerequisite** | Tutorial complete (rank = Drifter) |
| **Structure** | 3 lesson+drill beats → Quiz → Boss |
| **Unlocks on completion** | Trading Journal, World 2, rank **Plankton** |
| **Target play time** | 12–15 min |
| **Completion XP** | ~250 XP (fills the Drifter→Plankton bar) |
| **Headline reward** | 300 Shells + 1 Pearl (from boss) |

**Learning objective (one sentence):** by the end of World 1 the player can look at any candle and say what the price did, who won (buyers or sellers), and what the wick is telling them — on any timeframe.

---

## 1. Screen flow

```
 World 1 Map screen
   │
   ├─▶ Beat 1: Lesson "The Candle Body"  ──▶ Drill: Candle Builder  ──▶ result
   │
   ├─▶ Beat 2: Lesson "Wicks & Shadows"  ──▶ Drill: Wick Reader     ──▶ result
   │
   ├─▶ Beat 3: Lesson "Timeframes"       ──▶ Drill: Timeframe Flip  ──▶ result
   │
   ├─▶ Quiz Checkpoint (5 questions)  ──▶ pass (4/5) gate
   │
   └─▶ BOSS: "The Fakeout"  ──▶ WIN ──▶ Reward + Journal unlock + Rank up
```

Each node is its own screen. The Map screen shows nodes as a path with progress checkmarks; the next available node pulses. Completed nodes are replayable (for Shells / Perfect Runs) but only pay full Shells on first clear (replays pay 25%).

**Global rules for all drills in this world**
- Each drill = **5 rounds**.
- A round is **never hard-failed** — a wrong answer shows the correct answer with a one-line explanation, then continues. (World 1 must feel impossible to get stuck on.)
- One **Hint token** may be spent per round to reveal a clue.
- A **Perfect Run** = all 5 rounds correct, first try, no hints → bonus.
- Difficulty ramps within the 5 rounds: rounds 1–2 obvious, 3–4 moderate, 5 a light curveball.

---

## 2. Beat 1 — Lesson "The Candle Body" + Drill: Candle Builder

### Lesson 2.1 (≈45 sec)
Three swipeable cards, ≤2 sentences each, each with an animated diagram.

- **Card 1 — "A candle is a story of time."** "Each candle shows what price did over one chunk of time: where it *opened* and where it *closed*." *Visual:* a single candle with Open and Close labeled on the body.
- **Card 2 — "Green = up. Red = down."** "If price closed *higher* than it opened, the candle is green. Lower, and it's red." *Visual:* a green candle and a red candle side by side, open/close arrows animating.
- **Card 3 — "The body shows who won."** "A tall body means one side dominated. A tiny body means buyers and sellers were evenly matched." *Visual:* tall green body vs. tiny doji-ish body.

Tap "Got it" → launches the drill.

### Drill 2.2 — Candle Builder
**Goal:** internalize body = open→close and color = direction by *constructing* candles.

**Screen layout:** a price axis on the left; a draggable Open handle and Close handle; a live candle that redraws as the player drags; a prompt card at top.

**Interaction:** the prompt gives a scenario in plain words; the player drags Open and Close to the correct prices, and the candle's color must auto-resolve correctly. Submit with a "Lock it in" button.

**Scoring per round:** correct (both handles within tolerance AND color correct) = **+8 Shells, +10 XP**. Wrong = show correct candle + explanation, **0 Shells**, round continues.
**Perfect Run bonus:** +20 Shells, +20 XP.
**Tolerance:** handle within ±1 grid unit of target counts as correct (forgiving on touch screens).

**The 5 rounds (actual content):**
1. "Price opened at 100 and closed at 120." → tall **green** body, open 100 / close 120. *(obvious)*
2. "Price opened at 80 and closed at 60." → **red** body, open 80 / close 60. *(obvious)*
3. "Price opened and closed at almost the same level (50 → 51)." → tiny **green** body near 50 — teaches the doji/indecision idea. *(moderate)*
4. "Buyers won decisively this hour, finishing far above the open." → player must infer green + tall body (no exact numbers given — tests concept, not arithmetic). *(moderate)*
5. "The candle is red. Its open is 90. Where did it close — above or below 90?" → close must be **below** 90; reinforces that red = close under open. *(curveball: reasons from color to direction)*

**Edge cases / rules:**
- If a player drags Close above Open but the prompt implies red, the candle visibly turns green in real time — that contradiction *is* the teaching moment; the explanation calls it out.
- Snap handles to the grid to avoid pixel-hunting.
- Hint reveals the correct color only (not the prices).

**Journal:** drill auto-logs an entry tagged `Candle Anatomy` with the player's accuracy (e.g., "4/5").

---

## 3. Beat 2 — Lesson "Wicks & Shadows" + Drill: Wick Reader

### Lesson 3.1 (≈60 sec)
- **Card 1 — "Wicks are the leftovers."** "The thin lines above and below the body are *wicks* (or shadows). They show the highest and lowest price reached before the candle closed." *Visual:* candle with upper and lower wick, High/Low labeled.
- **Card 2 — "A long wick = rejection."** "A long upper wick means price tried to go higher and got slapped back down — sellers rejected it. A long lower wick means buyers rejected lower prices." *Visual:* a long-upper-wick candle with a downward "rejected" arrow.
- **Card 3 — "Wicks reveal the fight."** "The body shows who won; the wicks show how hard the other side fought. Long wicks = a big struggle and possible reversal." *Visual:* pin-bar / hammer shape highlighted.

### Drill 3.2 — Wick Reader
**Goal:** read what a wick is signaling.

**Screen layout:** one candle shown large; a multiple-choice prompt below with 3 answer chips.

**Interaction:** player reads the candle and taps the chip that best describes the story. Single tap to answer.

**Scoring:** correct = **+8 Shells, +10 XP**. Perfect Run bonus +20 Shells / +20 XP.

**The 5 rounds (candle → correct answer):**
1. Candle with a **long upper wick**, small body. → "Sellers rejected higher prices." *(obvious)*
2. Candle with a **long lower wick**, small body (hammer). → "Buyers stepped in down low." *(obvious)*
3. Candle with **two long wicks**, tiny body. → "Indecision — neither side won." *(moderate)*
4. Tall **green body, almost no wicks**. → "Buyers were in full control." *(moderate)*
5. **Green** body but with a **huge upper wick**. → "Buyers won, but sellers fought back hard near the top" — the early seed of the *fakeout* idea the boss will test. *(curveball)*

**Edge cases:**
- Answer chips are concept phrases, never jargon-only — accessible to a first-timer.
- Wrong answer highlights the relevant wick in red and replays the rejection animation.
- Hint dims the two wrong chips' confidence (removes one obviously-wrong chip).

**Journal:** logs tagged `Wicks & Rejection` with accuracy.

---

## 4. Beat 3 — Lesson "Timeframes" + Drill: Timeframe Flip

### Lesson 4.1 (≈60 sec)
- **Card 1 — "Each candle is a clock."** "A candle can cover 1 minute, 1 hour, or 1 day. The *timeframe* tells you how much time one candle holds." *Visual:* same candle labeled 1m, then 1h, then 1D.
- **Card 2 — "Zoom changes the story."** "Twelve red 1-hour candles can be a single small red wick on the daily chart. Same price — different picture." *Visual:* a cluster of small candles collapsing into one larger candle.
- **Card 3 — "Higher timeframe = bigger truth."** "Smaller timeframes show detail and noise; higher timeframes show the real trend. Always check both." *Visual:* a noisy 1m vs. a clean 1D.

### Drill 4.2 — Timeframe Flip
**Goal:** understand that the same move looks different across timeframes, and that higher timeframes carry more weight.

**Screen layout:** two charts shown — a "zoomed in" (lower timeframe) and a "zoomed out" (higher timeframe) version of the same data. A prompt asks a comparison question.

**Interaction:** mix of tap-to-answer and a "match the move" mini-interaction where the player taps which higher-timeframe candle corresponds to a highlighted cluster of lower-timeframe candles.

**Scoring:** correct = **+8 Shells, +10 XP**. Perfect Run bonus +20 Shells / +20 XP.

**The 5 rounds:**
1. "This run of 6 green 1-hour candles becomes what on the daily chart?" → one larger green candle. *(obvious)*
2. "A scary red drop on the 1-minute chart — how does it look on the 1-hour?" → a small lower wick / minor dip. *(teaches noise; moderate)*
3. Match: highlighted cluster of lower-TF candles → tap the matching higher-TF candle. *(moderate)*
4. "Which timeframe better shows the overall trend?" → the higher timeframe. *(concept)*
5. "The 5-minute says UP, the daily says DOWN. Which carries more weight?" → the daily — seeds the confluence thinking from World 7. *(curveball)*

**Edge cases:**
- Keep both charts visually simple — no indicators, just clean candles.
- The match interaction must highlight the cluster boundary clearly so it's about concept, not eyesight.
- Hint highlights the matching region faintly.

**Journal:** logs tagged `Timeframes`.

---

## 5. Quiz Checkpoint

Five multiple-choice questions, drawn from all three beats. **Pass = 4 of 5.** Fail → "Review & retry" (replays a 20-sec recap carousel, then re-quiz with question order reshuffled). No Shell penalty for a retry; pass bonus only awarded once.

**Scoring:** +10 Shells, +10 XP per correct. Pass bonus: +30 Shells, +20 XP.

**The questions (with answers):**

1. **What does the body of a candle represent?**
   A) The highest and lowest price ✗
   B) The open and close prices ✓
   C) The trading volume ✗
   *Explain:* The body spans open→close; wicks show high/low.

2. **A candle is green when…**
   A) It closed higher than it opened ✓
   B) It closed lower than it opened ✗
   C) It had a long wick ✗

3. **A long upper wick usually means…**
   A) Buyers took full control ✗
   B) Price was rejected at higher levels by sellers ✓
   C) Nothing — wicks don't matter ✗

4. **A candle with two long wicks and a tiny body signals…**
   A) Strong uptrend ✗
   B) Indecision between buyers and sellers ✓
   C) A guaranteed crash ✗
   *Explain:* No guarantees in trading — it signals a balanced fight.

5. **The 5-minute chart says up, the daily chart says down. Which is the stronger signal?**
   A) The 5-minute ✗
   B) The daily ✓
   C) They're always equal ✗

> Note: option (C) on Q4 deliberately reinforces the "no guarantees / manage risk" mindset early.

---

## 6. BOSS — "The Fakeout"

### Story / framing
A slippery creature made of deceptive candles. It tries to trick the player into reading the wrong direction — flashing big bodies while long wicks tell the opposite truth. To win, the player must read *the whole candle*, not just its color. This boss tests everything in World 1 and plants the seed for World 2's "real vs. fake breaks."

### Format
- **Boss HP:** 5. **Player HP:** 3 (shown as 3 shells/hearts).
- **7 rounds.** Each round shows a candle (or a 2–3 candle sequence) and asks one question with 2–3 answer chips.
- **Correct answer:** deal 1 damage to boss + a satisfying hit animation.
- **Wrong answer:** player loses 1 HP; boss taunts; correct answer is shown.
- **Soft timer:** 10 seconds per round. Timeout = treated as wrong (−1 player HP) but with a gentler "Too slow!" message. Timer is generous and can be toggled off in accessibility settings.
- **Win:** boss HP reaches 0 (needs 5 correct out of 7 → built-in 2-mistake buffer, but 3 wrongs ends the run first).
- **Lose:** player HP reaches 0 → "The Fakeout got you!" → retry from round 1 (rounds reshuffle; no penalty, encourages another go).

### The 7 rounds (candle → question → correct answer → why)
1. Tall **green** body, almost no wicks. → "Who's in control?" → **Buyers.** *(warm-up)*
2. Tall **red** body, no wicks. → "Who's in control?" → **Sellers.** *(warm-up)*
3. **Green** body with a **massive upper wick.** → "Is this as bullish as it looks?" → **No — sellers rejected the highs.** *(first fakeout)*
4. **Red** body with a **massive lower wick** (hammer). → "Is this as bearish as it looks?" → **No — buyers defended the lows.** *(fakeout)*
5. Two candles: a strong green, then a **doji** (tiny body, two wicks). → "What does the second candle add?" → **Momentum is stalling / indecision.** *(sequence reading)*
6. A green candle whose **close is near its low** despite being green. → "How strong is this candle really?" → **Weak — it gave back most of its gains.** *(nuance)*
7. **Final:** a deceptive sequence — big green body, then a candle with a huge upper wick closing red. → "What's the real story?" → **Reversal — buyers tried, sellers took over.** *(the full lesson)*

### Boss rewards
- **Win:** **300 Shells + 1 Pearl + 100 XP**, the **Trading Journal unlocks** (celebration screen explaining the tool), rank promoted to **Plankton**, World 2 unlocked.
- **Flawless (no HP lost):** **+1 bonus Pearl** and a "Sharp Eyes" badge flair on the Plankton rank icon.
- A short graduation animation: the player's plankton avatar glows / evolves a notch.

---

## 7. Reward economy summary (World 1)

| Source | Shells | XP | Other |
|--------|--------|----|----|
| Candle Builder (5 correct) | 40 | 50 | — |
| ↳ Perfect Run bonus | +20 | +20 | — |
| Wick Reader (5 correct) | 40 | 50 | — |
| ↳ Perfect Run bonus | +20 | +20 | — |
| Timeframe Flip (5 correct) | 40 | 50 | — |
| ↳ Perfect Run bonus | +20 | +20 | — |
| Quiz (5 correct + pass) | 80 | 70 | — |
| **Boss win** | **300** | **100** | **1 Pearl, Journal, Rank up** |
| ↳ Flawless bonus | — | — | +1 Pearl, badge flair |
| **Typical total (no perfects)** | **~500** | **~320** | promotion to Plankton |

Numbers are tuned so the boss is clearly the milestone payout, drills are the steady drip, and perfection is worth chasing without being required.

---

## 8. Systems integration

**Trading Journal hookup.** Each drill writes a `JournalEntry { worldId, beatId, tag, accuracy, timestamp }`. The Journal stays locked (greyed, with a "?" teaser) until the boss is beaten, then unlocks with a one-screen tutorial and back-fills the World 1 entries so it already looks populated and useful.

**State / data model (minimum).**
```
PlayerProgress {
  rank: enum,            // Drifter → Plankton after W1
  xp: int,
  shells: int,
  pearls: int,
  worldProgress: { worldId: { beatsComplete[], quizPassed: bool, bossBeaten: bool, perfectRuns[] } }
}
DrillResult { drillId, correctCount, usedHint: bool, firstTry: bool }
```

**Analytics events to fire (for your paid-ads funnel tuning).**
`world_start`, `lesson_complete`, `drill_complete{drillId, correctCount}`, `quiz_attempt{score}`, `quiz_pass`, `boss_start`, `boss_win{flawless}`, `boss_loss{round}`, `journal_unlocked`, `rank_up{rank}`. Watch `boss_loss{round}` and `drill_complete{correctCount}` to find where players struggle and where the difficulty curve needs tuning.

**Art / audio notes.** Clean flat-vector candles, high-contrast green/red with a colorblind-safe alternate palette (blue/orange) in settings. Satisfying snap on handle drops, a rising chime on correct, a soft thud on wrong (never harsh — this is a friendly learning game). Boss has a light, comedic menace, not scary.

**Accessibility.** Colorblind palette toggle; boss timer can be disabled; all color-based info also conveyed by shape/label (a green candle is also labeled "UP"); text scalable.

---

## 9. Approval checklist

Please confirm or redline each before I (or your dev) build:

- [ ] **Theme & tone** — ocean/creature framing and friendly "can't get stuck" difficulty for World 1.
- [ ] **Scope** — 3 lesson+drill beats + quiz + boss is the right size for World 1.
- [ ] **The three drills** — Candle Builder, Wick Reader, Timeframe Flip as specified.
- [ ] **Quiz** — 5 questions, pass at 4/5, content as written.
- [ ] **Boss format** — 5 boss HP / 3 player HP, 7 rounds, 10-sec soft timer, retry-friendly.
- [ ] **Reward numbers** — 300 Shells + Pearl headline; drill/quiz drip amounts.
- [ ] **Journal unlocks at boss defeat** (vs. earlier/later).
- [ ] **Energy/lives** — confirmed OFF for launch.

Once you approve (or mark changes), this becomes the literal build ticket for World 1 and the template I clone for Worlds 2–8.
