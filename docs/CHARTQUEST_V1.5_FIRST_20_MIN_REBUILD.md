# ChartQuest V1.5 — First 20 Minutes Rebuild

**Goal:** transform a complete beginner into someone who can read a basic chart *before* the
paywall. Free journey = Guardian 1 (Candles), Guardian 2 (Momentum), Guardian 3 (Support &
Resistance). Target 18–25 min. Paywall moves to **after Guardian 3**.

This document = (A) the required critical audit of every pre-Guardian-3 screen, (B) the target
structure, (C) what I implemented in this pass, (D) the prioritized build-and-test roadmap.

---

## A · CRITICAL AUDIT — every screen before Guardian 3

Each screen scored on: **L**=learning objective · **Appropriate?** · **Leak?** (future concept
leaks early) · **Text?** (unnecessary text) · **Simpler?** · **Fun?** · **Reinforces?**

### 1. Intro cinematic (Market Maker, 6 lines)
- **L:** the premise — you'll learn to read charts by beating 11 Guardians. **Appropriate:** yes.
- **Leak:** none (no trading jargon). **Text:** tight, 6 lines, paced. **Simpler:** at the floor.
- **Fun:** cinematic, passive. **Reinforces:** sets motivation. **Verdict: PASS.**

### 2. Land on chart → first traversal (jump through candles)
- **L:** controls (tap = jump). **Appropriate:** yes. **Leak:** none. **Text:** minimal hint.
- **Fun:** yes (movement). **Reinforces:** candles as terrain. **Verdict: PASS** — could add a 1-line "these are real BTC candles" beat.

### 3. "First real trade is coming → I'm Ready" gate
- **L:** signals a moment of focus. **Appropriate:** yes. **Leak:** none. **Text:** OK (1 line + button).
- **Fun:** neutral (a pause). **Reinforces:** anticipation. **Verdict: PASS.**

### 4. READ THE CANDLE popup *(rebuilt v112)*
- **L:** green candle = buyers, what happens next? **Appropriate:** yes. **Leak:** none (momentum/stats removed).
- **Text:** 4 lines + 2 buttons — passes the 5-second test. **Fun:** decision moment. **Reinforces:** core pattern. **Verdict: PASS.**

### 5. Mini chart inside the popup *(cleaned v112)*
- **L:** one big candle + unknown future. **Leak:** none. **Text:** zero labels in recognition mode. **Verdict: PASS.**

### 6. Post-trade feedback (win/loss) *(de-jargoned v112)*
- **L:** why the guess was right/wrong. **Appropriate:** yes. **Leak:** "MOMENTUM" now withheld for G1–2.
- **Fun:** rewarding on win, reassuring on loss. **Reinforces:** strongly. **Verdict: PASS.**

### 7. Quick-read traversal pop ("that candle: UP or DOWN?") *(simplified v112)*
- **L:** snap candle reading. **Leak:** BULLISH/BEARISH withheld for G1–2. **Fun:** quick, low-stakes. **Reinforces:** yes (spaced repetition). **Verdict: PASS.**

### 8. Setup banner ("⚡ STRONG GREEN CLOSE — TAP TO TRADE")
- **L:** an opportunity appeared. **Text:** OK. **Issue:** says "TRADE" while the player is still *learning to read*.
- **Verdict: MINOR FIX** — read "TAP TO READ" during the recognition phase.

### 9. Lesson portals (concept teaching)
- **L:** the active concept (green/red → strong close). **Appropriate:** yes. **Leak:** gated by `conceptTier`.
- **Issue:** some lesson cards are text-heavy. **Verdict: FIX** — convert text lessons to 1 visual + 1 sentence + 1 interaction.

### 10. Guardian 1 boss — 3 rounds (predict / whowon / candle)
- **L:** prove candle reading. **Appropriate:** yes. **Leak:** none. **Fun:** 3 *different* games already (not 3 predictions).
- **Verdict: GOOD baseline; ENHANCE** with the directive's drag/tap rounds (see C/D).

### 11. Guardian 1 victory (Glasses reward) *(rebuilt v98; Glasses now canonical v114)*
- **L:** "you stopped guessing, you started seeing." **Reinforces:** identity + reward. **Verdict: PASS.**

### 12–14. Guardian 2 approach / boss / victory (Notebook)
- **L:** momentum + the notebook habit. **Issue:** Notebook is currently always-on, not *earned* at G2.
- **Verdict: FIX** — frame the Notebook as the G2 reward and make the player use it once before moving on.

### 15–16. Guardian 3 approach / boss (Support & Resistance)
- **L:** floors/ceilings, price reacts at levels. **Issue:** current G3 rounds are BOS/ChoCh/structure — adjacent but not the plain "support = floor, resistance = ceiling" framing the directive wants.
- **Verdict: FIX** — reframe G3 to plain support/resistance with the directive's 3 rounds.

**Cross-cutting findings**
- **Biggest leak risk:** structure/BOS/VWAP vocabulary appearing before it's taught — already gated by `conceptTier`/`SETUP_UNLOCK`, keep enforcing.
- **Pacing:** Guardian 1→2 is too fast; the cure is *more reinforcement reps*, not filler.
- **Variety:** bosses already use 3 distinct mini-games; the win is adding *physical* interactions (drag/tap) over multiple-choice.

---

## B · Target structure

| Guardian | Lesson | Player learns | Reward | Narrative |
|---|---|---|---|---|
| 1 · The Gambler | Candles | green=up, red=down, strong closes matter | **Trader Glasses** | "You stopped guessing. You started seeing." |
| 2 · The Chaser | Momentum | big candles matter, not all candles are equal | **Trading Notebook** | "Real traders remember what they learn." |
| 3 · The Gatekeeper | Support & Resistance | floor/ceiling, price reacts at levels | **Faction Select** (BTC/ETH/SOL) | — |
| → | **PAYWALL** (soft) | shown only after all three rewards are experienced | — | — |

Target playtime ~7 min each (18–25 total) achieved by *better teaching, more interaction,
more varied mini-games, more reinforcement* — never filler.

---

## C · Implemented in this pass (v114 — safe, shipped)

1. **Paywall moved to after Guardian 3.** Trigger changed from `boss level 1` → `boss level 3`; capstone/paywall "guardians remain" counts are now dynamic. The paywall is soft ("Not now — keep exploring"), so this only changes *when* the offer appears. Guardians 2 and 3 are now part of the free journey.
2. **Trader Glasses = the Guardian 1 reward, on the canonical turtle.** The rookie now has bare canonical eyes and earns the cyan glasses after Guardian 1 (`bossesDone.size >= 1`) — matching both the character sheet and this curriculum.
3. **Turtle conformed to the canonical character sheet** (palette/eyes/shell/jetpack) — see `TURTLE_CANON_MISMATCH_AND_MIGRATION.md`.

These were chosen because they are high-impact, align exactly with the directive, and are
low-risk/verifiable without live playtesting.

---

## D · Build-and-test roadmap (needs a session with you — interactive, must be tested)

Ordered by priority. These add new interactive code or move flows, so they should be built and
tested together rather than shipped blind while you're away.

**P1 — Boss interaction variety (per the directive)**
- G1 R2: *drag a candle upward* to create a green candle (new drag mini-game).
- G1 R3: *tap the strongest candle* among several (new tap-to-select mini-game).
- G2 R1: *identify the momentum candle*; R2 *choose the strongest close*; R3 *predict continuation*.
- G3 R1: *tap support*; R2 *tap resistance*; R3 *predict bounce vs rejection*.
- Build as 4 reusable mini-games: `dragCandle`, `tapStrongest`, `tapLevel(support|resistance)`, `bounceOrReject`.

**P2 — Notebook as the Guardian 2 reward**
- Lock/soft-introduce the Notebook until G2, then a forced first-use moment showing: lessons learned, concepts learned, win rate, trade history, guardian progress. "Real traders remember what they learn."

**P3 — Faction selection as the Guardian 3 reward**
- Remove the start-of-game faction picker; default to BTC for G1–G3; present BTC/ETH/SOL choice after G3 (UI-only: coin shown, labels, prices — no gameplay change). The picker UI already exists (`showFactionPicker`); just move *when* it fires.

**P4 — Guardian 3 reframed to plain Support & Resistance**
- New beginner lesson + setup type (`level_react`): support=floor, resistance=ceiling, price reacts at levels. Keep BOS/ChoCh vocabulary gated to later guardians.

**P5 — Pacing to ~7 min/guardian**
- More reinforcement reps per guardian (extra quick-reads + 1 extra guided trade each), not filler. Tune setup cooldowns and lesson cadence; target ~7 min measured.

**P6 — Copy/lesson polish**
- "TAP TO READ" during the recognition phase; convert text-heavy lesson cards to 1 visual + 1 short sentence + 1 interaction.

---

## Success test
A player finishing Guardian 3 should think: *"I know more about charts than I did 20 minutes
ago."* They will have earned glasses, used a notebook, picked a faction, and read candles,
momentum, and support/resistance — before ever seeing a price.

*Audit + structure + P0 implemented in v114. P1–P6 ready to build & test together.*
