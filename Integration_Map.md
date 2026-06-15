# Chart Quest — Integration Map

### How the progression blueprint maps onto the game you already built

I read the actual `shell-trade.html`. Short version: **you don't need to build most of the blueprint — it already exists in the game, just under different names.** Your game already implements a Beginner→Trader curriculum, lessons, quizzes, and the core "find-and-trade-a-setup" loop. So integration is mostly *reconciling vocabulary and adding a few genuinely new systems* — not rebuilding.

This document maps every blueprint element to the real code and labels it **✅ ALREADY EXISTS / 🔧 EXTEND / 🆕 NEW**, then gives a reconciled plan and a build order.

---

## 1. What the game already has (the big realization)

Your game is much further along than the blueprint assumed. The relevant systems already in `shell-trade.html`:

| System | Where | What it does |
|--------|-------|--------------|
| **`CURRICULUM`** (6 "Hours") | ~line 1300 | A real Beginner→Trader progression: Hour 1 Candle Basics → Hour 2 Risk → Hour 3 Structure (BOS/OB) → Hour 4 VWAP → Hour 5 HTF → Hour 6 Leverage & R:R. Each hour has focus lessons, a difficulty/speed ramp, title, subtitle, tip. |
| **`LESSONS`** | ~line 1080 | ~20 rich contextual lesson cards (candles, doji, long/short, stop loss, trend, support/resistance, BOS, OB, sweep, VWAP, HTF, leverage, R:R). Curriculum-gated, throttled to 2 pop-ups/hour. |
| **`QUIZ_QUESTIONS`** | ~line 1238 | Multiple-choice quizzes keyed to each lesson, delivered in the intermission. |
| **Core loop** | throughout | Endless runner where Shell walks the candlestick chart; setups (BOS + Order Block) are auto-detected; a full trade ticket (LONG/SHORT, risk %, stop loss, take profit, leverage, live R:R) opens on tap. |
| **Intermission** | ~line 1461+ | After each hour: lesson recap + Bull/Bear teacher characters + a "Guess the Direction" mini-game. |
| **Currency & progress** | `player` ~579, `session` ~1434 | Shells (real P&L), XP, `player.level`, leverage tiers unlocked by collecting coins. |
| **Win/lose condition** | `endHour` ~1445 | Grow Shells +2% in the hour = cleared; drop −5% = bust/reset. |
| **`session.tradeLog`** | line 1442 | **Already records every trade** (direction, result, delta, entry/exit price, candle snapshot). |
| **Candle Academy** | ~line 639 | 5-card tap-through intro on every fresh load. |

**Implication:** my "Worlds," "lessons," "quiz checkpoints," and "drills" are largely your **Hours, LESSONS, QUIZ_QUESTIONS, and the setup-trade loop.** The blueprint isn't a different game — it's a superset of this one.

---

## 2. Blueprint → code, element by element

| Blueprint element | Status | Reality in the game |
|-------------------|--------|---------------------|
| Worlds / skill clusters | ✅ ALREADY EXISTS | `CURRICULUM` Hours 1–6. Your progression spine is built and well-sequenced for crypto. |
| Lesson cards before content | ✅ ALREADY EXISTS | `LESSONS` + `teach()` gating. |
| Quiz checkpoints | ✅ ALREADY EXISTS | `QUIZ_QUESTIONS`, shown in intermission. |
| "Drills" (Candle Builder, Wick Reader, etc.) | 🔧 EXTEND | The *loop itself* is the drill: walk the chart, inspect candles, find the setup, place the trade. Candle inspector + setup detection already do this. The standalone drills are optional extra framing, not required. |
| Timeframe concept | ✅ ALREADY EXISTS | HTF panel (5m/15m/1h) + `htf_align` lesson. |
| Risk management teaching | ✅ ALREADY EXISTS | Hour 2 + stop-loss/R:R lessons + the risk slider in the trade ticket. |
| Rank ladder (Drifter→…→Whale→TRADER) | 🆕 NEW (cosmetic) | Game uses numeric `player.level` and "HOUR X" labels. Ranks are a naming/identity layer on top — low effort, high motivation. |
| **Boss fights** ("The Fakeout," etc.) | 🆕 NEW | No boss concept exists. The intermission mini-game is the closest infrastructure to reuse. This is the biggest genuinely-new gameplay addition. |
| **Trading Journal (player-facing)** | 🔧 EXTEND | `session.tradeLog` already captures the data — there's just no screen to view it. This is half-built: high value, low effort. |
| Shells currency | ✅ ALREADY EXISTS | `player.shells`, P&L-driven. |
| Pearls (rare currency) | 🆕 NEW | Doesn't exist. Optional. |
| Perfect Runs | 🆕 NEW | Doesn't exist. Optional polish. |
| Daily Drill + streaks | 🆕 NEW | Doesn't exist. Highest-value retention add; can reuse the intermission mini-game + quiz engine. |
| Events (Bull Run, Market Crash, Mystery Chart) | 🆕 NEW / partial | Mystery Chart ≈ the existing "Guess the Direction" mini-game. The rest are new. |

---

## 3. Conflicts to reconcile (decisions for you)

These are real mismatches between the blueprint and the game. My recommendation on each:

**a) 8 Worlds vs. 6 Hours.** The game's 6-hour curriculum is real, working, and well-ordered for crypto. The blueprint's 8 worlds added *Trends/Trendlines* and *Patterns/Formations* (double tops, flags, wedges, head & shoulders) which the game doesn't teach yet.
→ **Recommendation:** keep the game's 6-Hour spine as the backbone. Fold the extra material in as *new Hours 7–8* later (e.g., "Hour 7: Chart Patterns") rather than renumbering everything now. Don't force 8 onto 6.

**b) "Worlds" vs. "Hours" naming.** The game already frames each level as "1 hour of market time = 60 candles," which is elegant and true to trading.
→ **Recommendation:** keep "Hour" as the level unit; layer the **rank name** (Plankton, Minnow…) as the player's *identity/title* that advances as hours are cleared. Best of both — keep the smart "hour" metaphor, add the aspirational ladder.

**c) World 1 "Reading the Chart" vs. Hour 1 "Candle Basics."** These are the same thing. My World 1 blueprint (Candle Builder / Wick Reader / Timeframe Flip + Fakeout boss) maps onto Hour 1, which already teaches `candles_intro`, `long_vs_short`, has the Candle Academy, the candle inspector, and a candles quiz.
→ **Recommendation:** treat the World 1 doc as the *enrichment spec for Hour 1*, not a new build. The only net-new piece is the **boss**.

**d) Boss model.** The game has no bosses; it has the per-hour intermission mini-game.
→ **Recommendation:** implement a boss as a special end-of-hour challenge that reuses the intermission/mini-game rendering — e.g., "The Fakeout" becomes a 7-round version of Guess-the-Direction using deceptive (big-body, big-wick) candles. Minimal new infrastructure.

---

## 4. The reconciled plan — what to actually build

Ordered by value-to-effort, this is the real integration work (everything else is already done):

1. **🔧 Trading Journal screen (highest value, lowest effort).** `session.tradeLog` already holds the data. Add a viewable panel: list of trades with direction, win/loss, R, and the candle snapshot, plus simple stats ("setup win rate"). This is the single best addition and it's mostly UI over existing data.

2. **🆕 Rank ladder layer.** Map `player.level` / cleared hours → rank names (Drifter→Plankton→…→Whale→TRADER). Show the rank on the HUD and a promotion celebration when an hour is cleared. Pure presentation over existing progression.

3. **🆕 Boss per hour (start with Hour 1 "The Fakeout").** Reuse intermission rendering; a short multi-round read-the-candle gauntlet with an HP bar that gates the rank-up. Build one, then clone.

4. **🆕 Daily Drill + streak (retention engine).** Reuse the quiz + mini-game engines to serve one fresh challenge per day; track a streak counter and a Shell multiplier. This is what drives the return visits your paid-ad plan needs.

5. **🆕 Optional later:** Pearls currency, Perfect Runs, extra events (Bull Run weekend, Market Crash survival), and new Hours 7–8 for chart patterns.

Items 1–2 are essentially free given what's already coded. Item 4 is the retention priority once the core feels good.

---

## 5. Bottom line

Your instinct to protect the game's simplicity was right, and the good news is the engine already does the hard part: it teaches a real Beginner→Trader curriculum with lessons, quizzes, and live trading. The blueprint's value now narrows to a short, concrete list — **a Journal screen, a rank-name layer, boss fights, and a daily-streak loop** — layered on top of systems that already exist, without touching the core runner.

Recommended next step: let me build the **Trading Journal** first (mostly free, immediately useful), then wire in the **rank ladder** and a **single Hour-1 boss** as a proof of concept you can play before we scale it across the other hours.
