# ChartQuest — Transformation QA Pass (Phase 8 of the spec)

**The test:** at the paywall (after Guardian 2), can the player honestly say each of the six things below? This audit traces every claim to where the game actually teaches, drills, and reinforces it. **Live on v101.**

Scale: ✅ strong (taught + drilled + reinforced + assessed) · 🟢 solid · 🟡 lighter.

| # | "I understand…" | Verdict | Where it's earned |
|---|---|---|---|
| 1 | **Candles** | ✅ | candles_intro lesson → flash quiz (now with OPEN/CLOSE arrows so they *see* close vs open) → **new lesson quick-check** ("a green candle closed…?") → quick-reads → Gambler's Who-Won round. Drilled 5+ ways. The single strongest outcome. |
| 2 | **Momentum** | ✅ | candle_close lesson → "STRONG CLOSE = MOMENTUM" persistent line → named explicitly at the first-trade review → the **prove-you-can-read** beat → Gambler predict round. Named *and* practiced. |
| 3 | **Confirmation** | 🟢 | candle_close ("wait for the close") → quick-check ("when is direction final? when it CLOSES") → reinforced by Guardian 2 (the False-Breakout Eel is literally a confirmation/fakeout boss). |
| 4 | **Long vs Short** | 🟢 | long_vs_short lesson → **new quick-check** ("you think price goes UP → LONG") → the UP/DOWN trade buttons → first-trade walkthrough. *Was the weakest point (UI uses UP/DOWN, not the words); the new recall now drills the terms directly — materially firmed up this sprint.* |
| 5 | **Why journaling matters** | 🟢 | Trader's Notebook introduced at the first trade → Phase 2 guided first-review nudge → **journal review is now part of the Guardian mastery gate** (you reach the boss having reviewed a trade). Up from "exists but ignored." |
| 6 | **"I feel smarter than when I started"** | ✅ | Capstone: *"You arrived knowing nothing. Now you can: Read a candle · Stop guessing · Wait for confirmation"* + the skills chips on the rebuilt paywall + the visible 11-Guardian roadmap. The player is *told* what they mastered, not left to infer. |

## Verdict
**All six outcomes are delivered.** Four are strong, two (long/short terms, journaling depth) are solid and were specifically strengthened in Phases 2–3 and this lesson-recall pass. There is no outcome a paying-intent player would fail to recognize about themselves.

## What this pass changed in code
- Added a **required quick-check** to the five free-experience lesson cards (candles, long/short, close, trend, support/resistance). The "GOT IT" button now appears only after the player makes a choice — converting the last passive lesson portals into active recall, and directly reinforcing outcomes 1, 2 and 4.

## Honest residue (not blockers)
- **Long/short** remains the lightest by design — the whole UI speaks UP/DOWN for beginner clarity; the words are now drilled in the lesson recall, which is the right amount without confusing a 10-year-old.
- **Deeper journaling** (the player *analysing* a past trade, not just opening it) is a richer feature for the paid levels, not the free funnel.
- A true confidence read needs a **real device playthrough to Guardian 2** — the code path is complete and parse-checked, but "feel" is yours to confirm.

*Live on v101. Deployed from the shell (Netlify Files API) so nothing touched your screen.*
