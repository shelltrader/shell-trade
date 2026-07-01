# ChartQuest — First Trade Perfect Sprint (audit)

**Build:** live **v79** · **Goal:** turn the first trade from *SEE → READ → FOLLOW INSTRUCTIONS* into *SEE → GUESS → RESULT → LEARN*. This audits whether it actually happened — and where it still breaks.

## What shipped (verified live)

- **S1 — the answer is gone.** The Level-1 panel now reads only: **WHAT JUST HAPPENED · 🟥 STRONG RED CLOSE · What happens next?** No "usually goes down." Verified live: the panel text contains no hint words, and the chart no longer prints "YOUR PREDICTION: price goes DOWN."
- **S2 — one-tap commit.** The buttons are **↑ UP / ↓ DOWN**, the ENTER TRADE button is hidden, and tapping commits instantly. Verified: `pickDir('long')` committed a trade in one call.
- **S3/S4 — the always-shown chart teaches without giving the answer.** The panel's chart (shown automatically, no portal) keeps YOU ARE HERE, the NOW divider, the empty future zone, the giant **?**, and the highlighted last candle — but the directional arrow is replaced by a **neutral up/down fork** and the only text is "WHAT HAPPENS NEXT — UP or DOWN?". Verified: at Level 1 the chart asks; at Level 2 it still reveals (clean regression).
- **S5 — confluences have a purpose.** Right after the first trade, the Validator's **"🔎 Traders collect clues"** card explains: each clue is a *confluence*, one is weak, more stack into stronger trades, "that trade had 1 clue," and every Guardian teaches a new one. Verified present.
- **S6 — learning before dopamine.** The big FIRST WIN celebration is delayed (420ms → 1900ms) so the explanation card lands first.

**Screenshots:** I can't capture the live animated canvas (my tooling times out on it), so I extracted the **actual deployed chart function** and rendered it: see `first_trade_chart_L1.svg` (the real Level-1 chart) and `first_trade_preview.html` (the full new panel + chart). These are the real deployed output, not mockups.

---

## The 7 questions — brutally honest

**1. Does the first trade feel like a prediction?** **Yes.** No hint, a neutral fork instead of an answer arrow, and a one-tap call. It's a guess now, not instruction-following. This is the core win and it's real.

**2. Can the player be wrong?** **Yes — on the first *real* trade.** It resolves on actual price; pick against the candle and you lose shells. **The nuance that matters:** the player's very first *call* is the engineered **Prediction Bet** (the hook — always wins). The first **real** trade that follows (the one with this new panel) is genuine and losable. So "your first guess wins" (confidence) but "your first real trade can go wrong" (skill). Decide which one your funnel calls "the first trade."

**3. Is the chart teaching without text?** **Largely yes.** YOU ARE HERE, the future zone, the big **?**, the fork, and the highlighted candle carry it; the only words are the one-line question. Verified the answer no longer prints at Level 1.

**4. Does the player understand confluences?** **Introduced, not yet proven.** The "collect clues" card gives the purpose ("you'll stack more"). Whether it *lands* vs. gets skimmed needs a playtest — one card can only seed the idea.

**5. Is there unnecessary reading remaining?** **At the trade: no.** **Around it: yes.** The cinematic, the "THIS IS THE MARKET" card, the control coach, and the Flash Quiz still front-load reading before the player plays. I audited SPRINT 7 but deliberately **did not cut** it — those touch the verified intro flow and I didn't want to risk the funnel blind. Recommendations below.

**6. Would an 8-year-old understand?** **Much closer.** "What happens next? ↑ UP / ↓ DOWN," one tap, instant result. The long/short jargon is now hidden behind UP/DOWN labels.

**7. Is the first trade genuinely fun?** **Closer to yes.** A real guess + one tap + immediate result + a reward you understand = the "I called it!" beat now exists. The ceiling is the surrounding reading (Q5) and whether the result→learn→reward timing lands on a device (S6 is a timing heuristic, not a hard sequence).

---

## Where it still breaks (I tried)

1. **The candle color telegraphs the answer.** A red close shown in red ⇒ "down" is heavily cued. It's a genuine-but-easy prediction — fine for Level 1 confidence, but the skill bar here is low by design. Know that you're testing "can you read a candle's color," not "can you predict."
2. **One-tap removes the safety net.** An exploratory tap instantly stakes real shells — no "are you sure?". Intended, but a curious beginner can fat-finger a trade. Consider making the very first real trade a free practice, or a brief un-cancellable "committing…" beat.
3. **S3 was delivered via the panel, not the literal fullscreen.** I upgraded the always-shown panel chart (no portal, genuine prediction) instead of rebuilding the read-only fullscreen overlay into a decision surface — that rebuild was high-risk on the game's most important screen. **Honest gap:** the optional "⤢ TAP TO EXPAND" fullscreen still reveals the answer at Level 1 (I didn't neutralize `setupChartSVGFull`). A Level-1 player who expands sees the recommended direction. Easy follow-up.
4. **S6 is a delay, not a guarantee.** I pushed the celebration to 1.9s so the lesson lands first; if the lesson queue is busy the order isn't guaranteed. A robust version fires the celebration on the lesson's dismissal.
5. **S5 vs S7 tension.** The confluence card adds reading right after the first trade (LEARN card + confluence card back-to-back) — exactly when S7 wants less reading. High-value, but two cards in a row is a lot; consider merging "why you won" + "you collected 1 clue" into one card.
6. **Unverified on a device.** The SVG charts I rendered and checked; the in-game canvas, the panel in context, the v78 candle exaggeration, and all timing need a real-device playtest. I can't eyeball the live moment.

---

## Recommendations (priority order)

1. **Close the expand→answer leak:** apply the same predict-mode suppression to `setupChartSVGFull` (the fullscreen), so Level 1 never reveals the direction anywhere.
2. **Make S6 a hard sequence:** fire the celebration when the explanation card is dismissed, not on a timer.
3. **Do S7 (cut the pre-trade reading):** fold "THIS IS THE MARKET" into one line, make the coach contextual (one hint when first needed), and trim the Flash Quiz toward a single card. This is the biggest remaining "playing-first" win.
4. **Merge the LEARN + confluence cards** into one post-first-trade beat.
5. **Consider the bet:** let the player's first *call* (the bet) also be losable, or frame it explicitly as practice — so "prediction" means the same thing every time.
6. **Device playtest** the whole first 5 minutes and the candle exaggeration.

---

## Bottom line

The headline is done and verified: **the first trade is now a genuine prediction.** No answer is handed over, the chart asks instead of tells, the call is one tap, the lesson lands after the commit, and confluences finally have a purpose. The player can be wrong on their first real trade, which is what makes it educational.

What's left is **honest and small**: one leak in the optional fullscreen, a timing heuristic that should be a hard sequence, and the surrounding onboarding reading that I flagged but didn't cut. Fix the fullscreen leak and trim the pre-trade reading, and the first trade is not just lean and genuine — it's *clean end to end*.
