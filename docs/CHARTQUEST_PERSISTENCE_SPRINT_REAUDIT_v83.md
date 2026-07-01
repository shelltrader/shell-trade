# ChartQuest — Persistence + Feature-Removal Sprint: Re-Audit (v83)

**Build:** live **v83** · **Scope:** Levels 1–2 only. Goal of the sprint: *teach through persistent reinforcement, not temporary popups; remove movement-farming and order-block jump pads.*

---

## 1. CHANGES IMPLEMENTED

**PART 1 — Persistent "Current Lesson" layer (new).**
- Added `drawPersistentTeach()` + a `PERSIST_LESSON` map (one line per level).
- Always-on, low-weight (≈22–24% opacity), drawn faintly at the top of the chart so it never blocks a candle (a candle reads straight through it).
- Shows **only the concept for the current level** (never a future concept), and **swaps automatically** as levels advance. One lesson at a time, never stacked. Examples now live:
  - L1: `🟩 GREEN = buyers (price up) · 🟥 RED = sellers (price down)`
  - L2: `🛡 SUPPORT = buyers defend · ⛔ RESISTANCE = sellers defend`
- Hidden behind modals (intermission/boss) and full lesson cards so it never double-stacks.

**PART 2 — Removed temporary teaching; made it persistent.**
- The control coach no longer auto-disappears after ~9s. Each hint is now **persistent until the player performs the action** (jump → boost → tuck), so a control instruction is never lost before it's learned.
- Added a persistent **control legend on Level 1** (faint, top of chart): `👆 TAP = jump · swipe ↑ boost · swipe ↓ dive` (or keyboard equivalent on desktop). Fades after L1 once the player knows the controls.
- The player now always has, on-screen and persistent: **what am I learning** (top lesson line), **what do I do** (L1 control legend / persistent coach), **what's next** (the bottom mission HUD objective: "Reach Guardian N · X candles to go").

**PART 3 — Removed movement-based reward farming.**
- **Collectible shells (coins) no longer spawn** on candle tops. Movement no longer farms currency.
- **Jump combo removed** (jumping no longer scores a "combo").
- **Trade-win combo boost removed.** The whole "🔥 Nx COMBO" streak system is now inert (no increments anywhere), so its callouts/draw never fire.
- Shells are now earned only by **trading** (plus quizzes & bosses) — the educational core.
- Decoupled **leverage** from coins (it used to unlock by coins collected): leverage tiers now unlock by **curriculum level** (2× at L7, 3× at L8, 5× at L9). Still gated to L7 by `conceptTier`, so it's invisible in L1–L2.

**PART 4 — Removed order-block jump pads.**
- Order-block candles **no longer launch the turtle** (`obBounceVy` removed at both physics sites). Every candle — OB or not — is landed on the same way, so movement is **predictable and intentional**.
- Removed the misleading teal "springboard" look before the OB world; an OB is now an ordinary candle until OB is taught (L4), where it becomes a passive **purple educational zone** (no movement effect).
- Fixed the OB lesson copy that promised "in the game it **launches you!**" → now "price often comes back here and **reacts**."

**PART 5 — Attention-budget trims (carried + new).**
- New: coins gone, combo callouts gone, OB teal pads gone.
- Carried (v82): "RISK/TARGET" no longer leaks in the HUD at L1–L4; Win%/NET session stats hidden until past L2; top-HUD overlap fixed; "WHAT NEXT" repetition removed; bottom-bar overlap fixed.

*All changes parse-checked clean (`new Function()` on every script block, 0 errors) and live on v83.*

---

## 2. REMAINING ISSUES

1. **Boss 1 "error" round (HIGH):** still unverified that the spot-the-mistake round at `beginner` uses only candle/prediction concepts. Top blocker (see §10).
2. **Persistent-lesson legibility at 22% opacity (MED):** "low visual weight" and "always readable" are in slight tension — needs a device eyeball to confirm it reads without competing with candles. Easy to nudge opacity.
3. **Coins removed game-wide (MED):** levels 3+ also lose collectibles. In-scope per the directive ("movement = traversal only") but worth a deliberate look at whether later levels need a non-farming reason to move.
4. **"Off the chart" failsafe (LOW):** with OB launches gone, the turtle can no longer be flung high; confirm the fall-recovery still feels fine without the bounce.
5. **Empty `coin`/`combo` code paths (LOW):** now-dead loops remain (harmless, never execute). Cleanup-only.

---

## 3. NEW 5-MINUTE PLAYTEST AUDIT (predicted, v83)

- **0:00–1:00** Cinematic → play. Persistent control legend + "📘 GREEN = buyers / RED = sellers" are *always* on screen. *The player can never "lose" the instruction.*
- **1:00–2:30** Flash Quiz (green=up) → first-win bet (**+5**). No coins to chase, no combos popping — attention stays on the candle.
- **2:30–3:30** First real trade: predict ↑/↓, one tap. The lesson line still reinforces green/red underneath.
- **3:30–4:30** Merged "why + 1 clue" card → 🏆 first win. Movement is calm and predictable (no OB launches yanking the turtle around).
- **4:30–5:00** Into The Gambler.

**Feel after 5 min:** calmer, clearer, less "arcade noise." The player always knows what they're learning and what to do. ✅

---

## 4. NEW 15-MINUTE PLAYTEST AUDIT (predicted, v83)

- **0–5 min:** as above → Boss 1. ~115–150 shells (all from trading/bets, none farmed).
- **5–10 min:** Level 2. The persistent lesson **swaps to** `SUPPORT = buyers defend · RESISTANCE = sellers defend`, reinforcing the new concept continuously. Movement stays predictable; trades + quick reads (+2) drive small, earned shell growth.
- **10–15 min:** approach Boss 2 (Eel). ~180–260 shells.

**Feel after 15 min:** "I always know what I'm learning, and it changed as I leveled. My shells came from *trading*, not jumping. Movement is just how I get around." ✅

---

## 5. KNOWLEDGE-LEAK AUDIT (post-v83)

| Concept | Leaks in L1–L2? | Notes |
|---|---|---|
| Candles / green-red | ✅ taught + persistently reinforced | now always on-screen |
| Long/Short, predict | ✅ taught | UP/DOWN labels |
| Support/Resistance | L2 only | persistent line swaps in at L2 |
| BOS / OB / VWAP / ChoCh / Liquidity / R:R / Leverage | ❌ hidden | `conceptTier` gates all; OB no longer even *visible* (or launching) until L4 |
| RISK / TARGET (HUD) | ❌ fixed (v82) | plain "▲ LONG — riding it up" at L1–L4 |
| Order-block *mechanic* | ❌ removed | no launch, no teal pad pre-L4 |

**No new leaks introduced.** The persistent lesson is explicitly level-keyed, so it can never show a future concept.

---

## 6. UI CLUTTER AUDIT (first 15 min)

| Element | Teaches? | Navigates? | Retains? | Verdict |
|---|---|---|---|---|
| Persistent lesson line | ✅ | — | ✅ | keep (new) |
| L1 control legend | ✅ | ✅ | ✅ | keep (new, L1 only) |
| Mission HUD (objective) | — | ✅ | ✅ | keep |
| Guardian progress / shells / fuel | partial | ✅ | ✅ | keep |
| Collectible coins | ❌ | ❌ | ❌ | **removed** |
| Combo "🔥 Nx" callouts | ❌ | ❌ | ❌ | **removed** |
| OB teal "bounce pad" | ❌ | ❌ | ❌ | **removed** |
| RISK/TARGET HUD chip (L1–L4) | ❌ (leak) | ❌ | ❌ | **removed (v82)** |
| Win%/NET stats (≤L2) | ❌ | ❌ | ❌ | **hidden (v82)** |

Net: the first-15-min screen now spends its attention budget almost entirely on **teaching + navigation**, not arcade noise.

---

## 7. FIRST-BOSS READINESS ASSESSMENT

The Gambler (3 lives, beginner) tests `predict / candle / error`.
- **Predict** — taught (bet + first trade) and now **persistently reinforced** on-screen. ✅
- **Candle reading** — taught (flash quiz) + persistent green/red line. ✅
- **"Error" (spot the bad trade)** — still not explicitly pre-taught. ⚠️

Readiness is *higher* than v82 because the core concepts are now continuously visible right up to the boss door — a player can't have "forgotten" green/red by the time they face him.

---

## 8. ESTIMATED FIRST-BOSS COMPLETION RATE

**~85–92% within 2 attempts** (up from ~80–90% at v82), driven by the persistent reinforcement keeping candle/predict knowledge fresh at the boss door. Still **contingent** on the "error" round being candle-based; if it isn't, expect ~65–75% and a visible spike.

---

## 9. ESTIMATED PLAYER COMPREHENSION SCORE

A rough rubric (does the player leave L1–L2 able to state the idea?):

| Concept | Pre-sprint | **v83** |
|---|---|---|
| Green = up / Red = down | 7/10 | **9/10** (persistent) |
| Strong close = momentum | 6/10 | **8/10** |
| Long = up / Short = down | 6/10 | **8/10** |
| Support/Resistance (L2) | 5/10 | **7/10** (persistent) |
| "Shells come from trading" | 4/10 (coins muddied it) | **8/10** (coins removed) |
| **Overall L1–L2 comprehension** | ~6/10 | **~8/10** |

The biggest jump is from **persistence** (always-on reinforcement) and **removing the coin/combo noise** that competed with the lesson.

---

## 10. TOP 10 REMAINING BLOCKERS BEFORE EXTERNAL TESTING

1. **Verify Boss 1 "error" round is candle-only** at beginner (or add a 1-line "don't gamble — read first" primer). *Highest priority.*
2. **Device pass on the persistent layer** — confirm 22% opacity reads clearly and never fights a tall candle on a small phone.
3. **Confirm coin removal didn't leave dead UI** (e.g., intermission "collected X shells" now reads 0) — reword or hide.
4. **Re-test fall recovery** now that OB launches are gone (no more big bounces to recover from).
5. **Confirm L2 surfaces only trend/level setups** (no early structure setups slipping in).
6. **Quick-read cadence** on device — the world-freeze every ~11–17 candles should feel like a beat, not a stutter.
7. **First-trade win size** sanity check (~+8) against the new small-reward baseline so it still feels meaningful.
8. **Persistent control legend wording** — validate "swipe ↑ boost / swipe ↓ dive" matches the actual gestures on iOS.
9. **Boss 1 → Level 2 handoff** — confirm the persistent lesson swaps cleanly at the level boundary.
10. **Live-version verification** — confirm `chart-quest-v83` in the service worker on your device (my in-browser check was blocked by a transient extension disconnect; the deploy itself is confirmed by the live site auto-opening).

---

**Bottom line:** the sprint did what it set out to do — learning is now **persistent** (a concept/control is never taught then lost), and movement is **traversal-only** (no coin farming, no jump combos, no order-block launch pads). Comprehension and first-boss readiness both improve. The one real gate before external testing is verifying the Boss 1 "error" round, plus a device eyeball on the new persistent layer.
