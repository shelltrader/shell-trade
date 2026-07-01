# ChartQuest — Teach-Order / Curriculum Gating Map

**The core rule (fixes shots 2 & 22):** a concept may only appear in a *practice trade* or
a *boss test* **after** it has been formally **TAUGHT** with an animated `LessonChart`.
No term is ever shown cold.

Every concept moves through three gates, in order:

1. **TEACH** — an animated `LessonChart` lesson (the new component). Concise, grade-5, ≤3-second read, always on a chart.
2. **PRACTICE** — the concept shows up, hands-on, in the **3 trades** before the boss.
3. **TEST** — the boss round / mini-game exercise checks it. The boss is the *final exam*, never first contact.

A concept's `TEACH` gate must be **unlocked and completed** before its `PRACTICE`/`TEST` can fire.
This is enforced by a single `taught(conceptKey)` check the lesson, trade, and boss systems all read.

---

## Guardian 1 — The Gambler · "Read the candle"
Theme: a single candle tells you who won.

| Concept | TEACH (lesson) | PRACTICE (3 trades) | TEST (boss round) |
|---|---|---|---|
| Candle (body = open→close) | ✅ What Is a Candle? | read green/red each trade | Read the Close |
| Green = buyers won / Red = sellers won | ✅ (same) | — | Read the Close |
| Wick (high/low reached) | ✅ Wick | — | Candle Lab |
| Candle **Close** (only the close counts) | ✅ Wait for the Close | wait-for-close entry | Read the Close |
| Doji (indecision) | ✅ The Doji | — | Candle Lab |
| Long vs Short | ✅ Long vs Short | pick a direction | Prediction |
| **Momentum / continuation** ⚠️ | **ADD lesson "Momentum"** (currently only shown at the boss — shot 22) | the 3 setups are momentum→pullback→continuation | Prediction |

⚠️ **Fix (shot 22):** "Strong closes show momentum" + "predict a simple continuation" are listed as
*mastered* on the reward screen but never taught first. Add a short **Momentum** `LessonChart`
lesson in Hour 1 and let the 3 pre-boss trades practice it, so the boss is a real test.

---

## Guardian 2 — The False Breakout Eel · "Not every breakout is real"
Theme: liquidity, sweeps, false breakouts, confirmation. (Trading Glasses unlocked here.)

| Concept | TEACH (lesson) | PRACTICE (3 trades) | TEST (boss round) |
|---|---|---|---|
| Support = buyers defend / Resistance = sellers defend | ✅ Support & Resistance | react at levels | Support / Resistance Zone |
| **Liquidity** (stops rest at equal highs/lows) | ✅ **Liquidity ID** ← *reference scene built* | spot the resting liquidity | Liquidity ID |
| Liquidity **sweep** (spike grabs stops, then reverses) | ✅ (same lesson, sweep beat) | avoid chasing the spike | Read the Close (trap) |
| **Confirmation** (wait for the close past the level) | ✅ Confirmation | enter only on confirmed close | Candle Lab |
| Trading Glasses (what they do) ⚠️ | **ADD lesson/popup + cinematic** (never explained — shot 7) | — | — |

⚠️ **Fix (shot 7):** the Trading Glasses reward is given with no explanation. Add a short
"what the glasses do" lesson/popup and a cinematic for earning them, gated here.

---

## Guardian 3 — The Trend Crab · "Pick the line"
Theme: trend + structure. **This is the last boss before the paywall — highest polish.**

| Concept | TEACH (lesson) | PRACTICE (3 trades) | TEST (boss round) |
|---|---|---|---|
| Trend (higher highs + higher lows) | ✅ The Trend ← *reference scene built* | trade with the trend | Trend call |
| Swing high / swing low | ✅ (within BOS lesson) | mark the swing | — |
| **Break of Structure (BOS)** ⚠️ | ✅ **Break of Structure** ← *reference scene built* — **must come BEFORE any BOS exercise** | enter on the BOS close | BOS round |
| Order Block (last opposing candle before the break) | ✅ Order Block | retest entry | OB round |
| Trendline | ✅ Trendline | bounce off the line | Trendline round |

⚠️ **Fix (shot 2):** the BOS exercise/round currently appears at "Intermediate" before the BOS
*teach* lesson. Re-order so **Break of Structure (TEACH)** is unlocked and completed before any
BOS practice or boss round can run.

---

## Journal additions (shot 1)
- Every term in **Knowledge** becomes tappable → opens its `LessonChart` lesson (same animated diagram, reused).
- New **"Wisdom"** tab: trader-psychology / patience / emotion quotes, discovered as **"lost wisdom"** in the charts. (Scaffold with placeholder quotes; you supply final copy.)
- "Trader's Journal Unlocked" splits into 3 lines (shot 22): `Trader's Journal Unlocked` / `Record trades · Recover Lost Wisdom` / `Track your journey`.

---

## Implementation note
A single source of truth — `CURRICULUM` (ordered concept list with `teach`/`guardian` fields) — plus a
`taught(key)` gate read by the lesson list, the trade scripts, and the boss mini-game registry.
The `LessonChart` engine (preview built: `lesson-chart-preview.html`) renders every TEACH lesson,
every journal term, and the fullscreen post-trade cards (STOP DID ITS JOB / STOPPED OUT) — one
consistent, animated, screenshot-worthy look everywhere.
