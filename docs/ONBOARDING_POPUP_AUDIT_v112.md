# ChartQuest — Onboarding Popup Audit (5-Second Test) · v112

**Rule applied to every popup before Guardian 3:** a brand-new player must understand the
*entire* screen in under 5 seconds. If not → remove information. Guardian 1 & 2 teach
**pattern recognition only** (GREEN = UP, RED = DOWN, what happens next?) — not trading.

**Terminology withheld until after Guardian 2:** MOMENTUM, BULLISH/BEARISH, win-rate / stats,
grades, R:R, risk. "Early game" is gated on `bossesDone.size < 2`.

---

## 1 · First-trade popup — "READ THE CANDLE"  ✅ REBUILT

1. **Learning objective:** a big green candle means buyers won → guess what happens next.
2. **Words shown:** 9 (`WHAT JUST HAPPENED?` · `🟩 BIG GREEN CANDLE` · `Strong buyers pushed price up.` · `WHAT HAPPENS NEXT?`) + the two buttons (`↑ UP` / `↓ DOWN`).
3. **Under 5 seconds?** Yes.
4. **Still removable?** No — at the irreducible floor (one event, one question).
5. **Un-taught terminology?** None.

**Removed this sprint:** title "⚡ TRADE OPPORTUNITY", "Now predict", "Read the candle, then tap UP or DOWN", and the duplicate instructional sentence.

## 2 · Mini chart inside the popup  ✅ CLEANED

1. **Objective:** show the one big candle + an unknown future.
2. **Words shown:** 0 in recognition mode (just candles, a NOW line, and a `?` in the future box).
3. **Under 5 seconds?** Yes.
4. **Still removable?** No.
5. **Un-taught terminology?** None.

**Removed this sprint:** the on-chart labels `THIS JUST HAPPENED`, `WHAT NEXT?`, and `YOUR CALL — UP or DOWN?` (all three duplicated the popup text).

## 3 · Win-rate / "similar trades" hint  ✅ SUPPRESSED (G1–2)

1. **Objective:** (none for a beginner — it was performance data).
2. **Words shown:** 0 (hidden for the first two guardians).
3. **Under 5 seconds?** N/A — gone.
4. **Still removable?** Already removed for G1–2; returns only after Guardian 2.
5. **Un-taught terminology?** Was leaking `5W–1L`, `83%`, "trust it", "Tap Notebook to review" — all removed.

## 4 · "Fly in to explore" portal read (active recall)  ✅ DE-JARGONED

1. **Objective:** read the last candle, call UP or DOWN.
2. **Words shown:** ~8 in feedback ("A big green candle usually keeps going up.").
3. **Under 5 seconds?** Yes.
4. **Still removable?** The "Tap anywhere → take the trade" line could go, but it's a needed action cue.
5. **Un-taught terminology?** Removed the word `MOMENTUM` for G1–2; plain cause only.

## 5 · Post-trade feedback (win/loss explanation)  ✅ DE-JARGONED

1. **Objective:** confirm why the guess was right/wrong, build confidence.
2. **Words shown:** ~12 ("Correct! Strong green closes often keep rising — buyers stayed in control.").
3. **Under 5 seconds?** Yes.
4. **Still removable?** Loss copy ("that happens to every trader…") is intentionally reassuring — keep.
5. **Un-taught terminology?** Removed the "This is called MOMENTUM" tag for G1–2.

## 6 · Quick-read traversal micro-popup  ✅ SIMPLIFIED

1. **Objective:** snap-judge one candle.
2. **Words shown:** 7 ("Quick read — that candle: UP or DOWN?") + 2 buttons.
3. **Under 5 seconds?** Yes.
4. **Still removable?** No.
5. **Un-taught terminology?** Removed the alternate `BULLISH or BEARISH` phrasing for G1–2 (plain UP/DOWN only).

---

## Surfaces reviewed and left as-is (already pass)

- **Setup banner** ("⚡ STRONG GREEN CLOSE — TAP TO TRADE") — 5 words, one CTA, passes. "Strong green close" is plain description, not jargon.
- **"First real trade is coming → I'm Ready" gate** — single sentence + one button. Passes.
- **GREEN/RED lesson card** — the one concept being taught; passes by design.

## Open follow-ups (flagged, not yet changed — your call)

- **Banner CTA wording:** "TAP TO TRADE" technically says *trade*, but the player is learning. Could read "TAP TO READ" in the recognition phase for full consistency. Low priority, 1-line change.
- **Guardian 1 & 2 boss quizzes:** these are the recognition *tests* themselves. Recommend a separate pass to confirm every question + answer option avoids un-taught terms (e.g., no "bullish", "support/resistance" before they're taught).

## Net effect

The first-trade window dropped from **10+ pieces of information to 4 lines + 2 buttons**, and
every recognition-phase popup is now jargon-free. A beginner sees: *one thing happened →
what happens next → UP or DOWN.* Nothing more.

*Staged in v112.*
