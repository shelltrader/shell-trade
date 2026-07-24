# ChartQuest — First-Hour Creative Direction Review (build 257)

**Role:** Creative Director of the first hour. **Question that matters:** *would a complete beginner finish the first hour wanting to become a trader?*
**Governing law:** [CHARTQUEST_TRADING_EXPERIENCE_SYSTEM_v1.1.md](CHARTQUEST_TRADING_EXPERIENCE_SYSTEM_v1.1.md) (immutable). **Build:** 257.
**Implemented this pass:** First Loss moved to Level-2 trade #2 (verified). **Audited:** Guardian 1, victory, the full first hour.

---

## 1 · Guardian 1 (The Gambler) — Deep Audit

**What it is:** boss `level 0` (= Guardian 1 in the entity registry), a 5-round mini-game knowledge exam. Rounds: `candle · whowon · confirm · predict · error`, all `beginner` difficulty.

| TES requirement | Finding | Verdict |
|---|---|---|
| **Only previously-taught concepts** | 3 rounds are squarely Level-1 material — `candle` (read a candle), `whowon` (buyers vs sellers), `predict` (which way next = momentum). Two test **micro-rules Level 1 doesn't explicitly teach**: `confirm` (wait-for-the-*close*) and `error` ("a candle opens where the last closed"). | ⚠️ **Minor violation** |
| **No hidden mechanics** | None — every round is a visible read-and-answer. | ✅ |
| **No surprise difficulty** | All rounds `beginner`; the boss is **unloseable** by design (`level 0` → every round scores ≥60 and always advances, code ~9960). | ✅ |
| **Retry loop builds confidence** | You cannot fail Guardian 1, so there is no punishing retry. A wrong read shows *"Wrong read — but the Gambler fumbles the deal. Take the round"* and still advances. | ✅ (see risk below) |
| **Reinforces learning** | Yes — it drills exactly the candle-reading the level taught. | ✅ |
| **Feels like graduation, not punishment** | Largely yes (unloseable + "OUT-TRADE HIM" framing + rank-up). | ✅ with a caveat (§4) |

**Findings & recommendations:**
- **F1 (⚠️ minor, protected #2):** `confirm` and `error` test candle sub-rules (the *close*, candle continuity) that Level 1 doesn't explicitly teach. Because the boss is **unloseable**, this can't cause failure — but it can cause a beginner to think *"wait, what's this asking?"*, which dulls the graduation feeling. **Recommendation:** either (a) narrow Guardian 1's playlist to `candle · whowon · predict` (pure Level-1 recall), or (b) teach the "wait for the close" micro-rule in Level 1 before the boss. **This changes the boss round mapping = protected system #2 → needs your explicit OK** (not changed unilaterally).
- **F2 (✅ keep):** the unloseable design is correct and TES-compliant — Guardian 1 is a confidence gate, not a wall.

---

## 2 · The Ideal First Hour — Minute-by-Minute Walkthrough

*A complete beginner, `?fresh=1`. "T" = player thought; "E" = emotion; "F" = Finn.*

| ~Min | Beat | What happens | Player experience |
|---|---|---|---|
| 0:00 | **Cold open** | Cinematic (Market-Maker teaser video) → SKIP available | E: intrigue. **Risk:** black-screen if the video stalls (known). |
| 0:30 | **Goal card** | "Reach Guardian 1" | T: "OK, a clear goal." E: orientation. |
| 0:45 | **Candle Academy greeting** | Finn introduces the chart in plain words | T: "This is friendly, not a finance app." E: relief. F: warm, waving. |
| 1:00 | **First movement** | Walk the chart, jump candles, collect shells | E: playful discovery (Mario-1 style — verbs before stakes). |
| 2:00 | **Lesson: read a candle** | Animated LessonChart: 🟩▲ GREEN = UP · 🟥▼ RED = DOWN | T: "Green up, red down. Got it." E: first "I understand." (Now colour-blind-safe.) |
| 3:00 | **Lesson: momentum** | "A big candle keeps going" | T: "Big candle = it continues." E: a rule I can use. |
| 4:00 | **Setup #1 forms** | A big green candle is circled; portal appears | E: anticipation. T: "Something's happening — do I go?" |
| 4:30 | **Trade 1.1 (guided win)** | Fly in → ENTRY→STOP→TARGET walkthrough → the dip-scare → runs to target → **WIN** (24–30 candles) | E: nervous → "oh no (the dip)" → **relief + joy**. First-Win trophy. Journal unlocks. |
| 7:00 | **Trade 1.2 (win, short)** | Big red → tap DOWN → win | T: "I can win going down too." E: growing confidence. |
| 9:30 | **Trade 1.3 (you call it)** | Game asks "which way?" → player reads → win | E: **"I called that myself."** (competence) |
| 11:00 | **Guardian 1 (The Gambler)** | 5 unloseable candle-reading rounds | E: "a real test — but I'm ready" → **pride**. |
| 13:00 | **Victory** | THE GAMBLER FALLS + rank-up (Plankton) + reward | E: **"I earned that."** (see §4) |
| 14:00 | **Level 2: trend + pullback** | Lesson, then pullback setups | T: "Wait for the dip, then join." E: curiosity. |
| 15:30 | **L2 trade 1 (pullback win)** | Read the pullback → win | E: "pullback works!" (competence with the new concept) |
| 18:00 | **L2 trade 2 (THE FIRST LOSS)** | Correct read → telegraphed reversal → small stop-out → **🛡️ "YOUR STOP JUST DID ITS JOB"** coaching → **recovery win** next | E: "not fair!" → *understanding* → **trust in the stop.** The pivotal beat. |
| 21:00 | **Level 3: structure (BOS)** | "A break counts on the close" → BOS wins | E: "I'm becoming a trader." |
| ~25:00 | **Toward Guardian 2/3** | More reps, gentle escalation | E: momentum to continue. |

---

## 3 · Trade-by-Trade Emotional Review

Each onboarding trade is checked against the required beats — **Curiosity · Observation · Uncertainty · Confirmation · Relief · Reflection · Journal**:

| Trade | Curiosity | Observation | Uncertainty | Confirmation | Relief | Reflection | Journal | Gap? |
|---|---|---|---|---|---|---|---|---|
| 1.1 | ✅ setup circled | ✅ 24–30 candles | ✅ the dip-scare | ✅ runs to target | ✅ WIN | ✅ walkthrough | ✅ unlock | none |
| 1.2 | ✅ | ✅ | ✅ | ✅ | ✅ | ➖ lighter | ✅ | minor |
| 1.3 | ✅ | ✅ | ✅ the "call it" | ✅ | ✅ | ✅ "you called it" | ✅ | none |
| L2-1 (pullback) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | none |
| **L2-2 (First Loss)** | ✅ | ✅ | ✅✅ (the scare) | ✅ correct read | ➖→**reframed** | ✅✅ (the coaching) | ✅ "stop did its job" | **strong** |
| L2-3 (recovery) | ✅ | ✅ | ✅ | ✅ | ✅ WIN | ✅ | ✅ | none |
| L3 (BOS) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | none |

**Verdict:** every onboarding trade now hits the full emotional arc. The First Loss is the emotional peak of the hour and is now correctly bracketed (win → LOSS → win).

---

## 4 · Confidence Curve (before vs after)

Confidence on a 0–10 feel-scale across the first hour:

```
        Before (build 252)                         After (build 257)
10                                        10                          ╭─ Guardian graduation
 8   ╭╮   ╭╮      ╭╮                       8      ╭──╮   ╭─────╮  ╭───╯
 6  ╭╯╰╮ ╭╯╰╮ ╭╮╭╯╰╮  ← random 42% losses  6   ╭─╯  ╰─╮ ╱ First ╲╭╯
 4 ╭╯  ╰─╯  ╰─╯╰╯  ╰─ jagged, can crash     4 ╭─╯      ╰╯  Loss  ╰╯  (one dip, recovers)
 2 ╯                                        2 ╯
    T1 T2 T3  B1  L2 ...                        T1 T2 T3  G1  L2a L2b(First Loss) L2c L3
```

- **Before:** post-intro L1–L3 was a 58% coin-flip → confidence sawtooths and can *crash* on an unexplained random loss (the exact "unfair" failure mode).
- **After:** a smooth rise through L1 (all authored wins), a proud spike at Guardian 1, one **designed dip** at the First Loss (L2 trade 2) that **recovers within the beat** (recovery win), then rises again. No random collapse is possible.

---

## 5 · Implementation Summary (this pass)

- **First Loss relocated** to Level-2 trade #2 (after one pullback win) — `authoredTutorialOutcome()` now gates on `session._l2TradeN >= 2`. Commented with the TES A3 reference. **Verified live:** L2 → win, loss, win.
- **Guardian 1 audited** (documented above); one protected-#2 recommendation surfaced, not changed unilaterally.
- **Build 257**, syntax clean, gate green (check [11] holds).

*(Prior build 256 delivered the authored-win-across-L1, First-Loss coaching, ▲/▼ accessibility glyphs, confidence telemetry, and the gate lock-in.)*

---

## 6 · Remaining Risks (before beta)

| Risk | Severity | Note |
|---|---|---|
| **Guardian 1 tests 2 micro-rules L1 doesn't teach** (`confirm`/`error`) | 🟡 | Unloseable so can't fail, but dulls "graduation." Protected #2 → your call to narrow the playlist or teach the rules. |
| **Victory can read as "lucky" on missed rounds** | 🟡 | The "Gambler fumbles" line advances a *wrong* read. For real readers it's earned; for missers it's luck-ish. Consider softening only after a clean read. |
| **Economy inflation** from all-L1 wins | 🟠 | Playtest the shell curve. |
| **Cold-open video stall** | 🟠 | Known high-risk first impression (black screen). Out of trading scope but it's the literal first 30 seconds. |
| **Not human-playtested** | 🟠 | Logic + boot verified; the on-device beginner playthrough is the real gate. |
| **Deploy** | 🟡 | `index.html` mirror + protected-ship bypass still need your OK. |

---

## 7 · Recommended P2 Backlog (NOT implemented — recommendation only)

1. **Finn micro-behaviours during trades** (P1 #9): subtle "read / shell-check / slow-exhale / tiny-nod" idle beats *between* the emotional peaks — never during the decision. Reuse the existing idle system; keep the chart the star.
2. **Market breathing** (P1 #7): author small consolidations/quiet candles between setups so the market feels alive, not scripted — inside the driven-candle engine, purely visual.
3. **Journal identity-language pass** (P1 #10): shift entries toward first-person identity ("I waited," "I respected my stop," "I protected my shell"). The current copy is process-focused already; this is a polish sweep.
4. **Guardian-1 playlist alignment** (F1): narrow to pure Level-1 recall, or teach the close/continuity micro-rules first (protected #2 decision).
5. **Victory-feeling polish** (P0 #4 follow-up): distinct "clean read" vs "fumble" victory copy so the win always reads as earned.
6. **Dead-time audit** (P1 #12): instrument the quit-point heatmap (A4 telemetry now captures duration) to find any idle/confusing seconds and teach or trim them.
7. **Observation-by-design** (P1 #8): ensure each setup's shape makes waiting *feel* meaningful (the pullback rest, the break tension) rather than any timer.

---

## Final Question

*Would a beginner tell a friend: "I understood what I was doing," "I won because I made good decisions," "I want to beat the next Guardian"?*

**Mechanically, this is now a YES.** No random loss can happen; wins are earned by a read; the one loss is designed, coached, and recovered; Guardian 1 is a proud, unloseable graduation; and the confidence curve rises-dips-recovers-rises with no possible collapse. The honest asterisk is unchanged and singular: **the felt experience must be confirmed by a real beginner on-device.** Everything the code controls now points at that enthusiastic yes — the last mile is a human playtest, not another edit.
