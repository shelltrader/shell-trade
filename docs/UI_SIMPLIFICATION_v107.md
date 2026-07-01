# ChartQuest — UI Simplification & Retention Sprint (v107)

**Goal:** make the game feel cleaner, simpler, more premium, less like a dashboard. The chart, candles, and turtle are the heroes; the interface gets out of the way. *No new features, lessons, bosses, or systems — only removal and clarity.* **Built & staged in v107.**

**The test applied to every element:** does it teach, guide, motivate, or reward? If no to all four → removed or demoted.

---

## 1 · Full UI audit (first 10 minutes)
| Element | Verdict | Why |
|---|---|---|
| Top **ticker line** (`LEVEL 1 · 9/190 · BTC/USDT 1m · BINANCE`) | **REMOVED** | Pure dashboard metadata — candle count, trading pair, exchange. Answers none of teach/guide/motivate/reward for a new player. |
| **FUEL** label + 88px meter | **DEMOTED** | Gameplay feedback, not premium info. Shrunk to a tiny unlabeled sliver. |
| **GUARDIAN n / 11** (top center) | **KEPT — hero** | The "why am I here." Priority 1. |
| **SHELLS** (top right) | **KEPT** | The score players watch. Priority 2. |
| **LV + XP bar** (top center, thin) | **KEPT — supporting** | Progress, intentionally quiet. Priority 3. |
| Mission **"X candles to go"** | **REMOVED** | Distance metadata duplicated by the progress bar right below it. |
| Mission label **"MISSION — LEVEL n"** | **SIMPLIFIED → "YOUR GOAL"** | Plainer, less technical. |
| **Sticky lesson** (top-left) | **REDESIGNED** | Now a tiny 2-line card (header + concept), static. |
| Bottom **NOTEBOOK** | **PROMOTED** | One of the most important systems — now the widest, brightest button. |
| Bottom **SIGN IN** | **DEMOTED** | A new player doesn't need it mid-game (we don't ask to save until after Guardian 1). |
| Bottom **WALLET** | **KEPT** (audited) | Standard prominence — it's where shells live. |
| **Empty space above chart** | **PROTECTED** | Removing the ticker line gives it back. |

## 2 · Every element REMOVED
- The ticker metadata line (level · candle-count · BTC/USDT · 1m · BINANCE).
- The "FUEL" text label.
- "· N candles to go" from the mission readout.

## 3 · Every element RELOCATED / DEMOTED
- **Fuel meter** → shrunk to a small quiet sliver in the top-left corner (was a labelled 88×7 bar; now 50×4, no label).
- **Sign-in button** → narrowed, transparent, muted grey (was a glowing purple full-width button).
- **Mission label** → "MISSION — LEVEL n" became a smaller muted "YOUR GOAL".

## 4 · New top bar design
A clean three-part hierarchy, nothing competing:
- **Center (hero):** `⚔ GUARDIAN n / 11` in red, with a thin XP/level bar tucked beneath it.
- **Right:** `🐚 SHELLS` + the big glowing balance (turns green/red live during a trade).
- **Left:** just a tiny fuel sliver. No ticker, no pair, no candle count.

## 5 · New bottom bar design
- **📖 NOTEBOOK** — the hero: ~1.7× wider than the others, filled cyan, brightest glow.
- **🐚 WALLET** — standard gold button.
- **👤 Sign in** — small, muted, transparent; present but unobtrusive.

## 6 · Sticky Lesson Card design
A tiny top-left card, **two lines, static, never animated**:
```
CURRENT LESSON        ← small, quiet, letter-spaced header
🟩 GREEN = UP · 🟥 RED = DOWN   ← the one concept you're on
```
It only swaps when you actually learn the next concept (GREEN/RED → MOMENTUM → LONG/SHORT) — never on a timer. Reinforcement, not teaching. Uses a sliver of the protected empty space, nothing more.

## 7 · Before vs after
- **Top bar, before:** fuel label + 88px meter · `LEVEL 1 · 9/190 · BTC/USDT 1m · BINANCE` · guardian · LV/XP · shells — six competing things.
- **Top bar, after:** fuel sliver · **GUARDIAN n/11** · thin XP · **SHELLS** — three, clearly ranked.
- **Mission, before:** "MISSION — LEVEL 1 · ⚔ Reach GUARDIAN 1 · 181 candles to go" + bar.
- **Mission, after:** "YOUR GOAL · ⚔ Reach GUARDIAN 1" + bar.
- **Bottom bar, before:** Notebook, Wallet, Sign-in all roughly equal.
- **Bottom bar, after:** **NOTEBOOK** dominant, Wallet normal, sign-in a quiet chip.

## 8 · Player-attention check
First thing the eye lands on, per screen, after this pass: **the chart / candles / turtle**, then the Guardian goal — exactly the target. The interface reads as ~5% of the screen's weight, the chart as the hero.

---

## Honest notes
- All changes are removal/restyling of *existing* elements — low risk — but the exact pixel balance of the new top bar and the sticky card position want your eyes on a phone; every value is a one-line tune.
- I did **not** touch the intermission, paywall, or boss screens this pass (they're their own surfaces, shown between gameplay, not the in-game HUD). Say the word if you want the same treatment applied there.

*Staged in v107.*
