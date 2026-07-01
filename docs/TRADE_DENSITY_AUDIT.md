# ChartQuest — Trade Density Audit (first 30 minutes)

**Build:** live v74 · **Purpose:** map every meaningful moment in the first 30 minutes, measure the space between them, and list the dead zones.

**Timing model (stated honestly):** the world is canvas-drawn and my automation throttles the render loop, so these are **modeled** timestamps, not stopwatch readings — but they're grounded in the real, verified triggers in code: the intro cinematic length, the control coach (3 hints × 7s), the Flash Quiz at candle 48, the staked bet, the boss flow, `perHour = 140` candles/level, and the setup cadence (`nextSetupIn`: base 10–15 candles in L1–2, gated by structure events every 12–20 candles → the author's stated intent of **3–4 setups per level**). Effective candle cadence ≈ **~1.5 s/candle** while platforming (anchored to the design goal that the first trade lands ~1–2 min in, i.e. candle 48); lessons, quizzes, trades, and bosses **pause** the candle clock.

---

## Timeline — Level 1 (the guided intro)

| Time | Event | Type | Player action | Educational purpose |
|---|---|---|---|---|
| 0:00 | Intro cinematic — glitch + "LEARN REAL CRYPTO TRADING · BEAT 11 GUARDIANS" | Cinematic | Watch | Declare the game's purpose |
| 0:06 | Market Maker reveal + dialogue | Cinematic | Watch | Establish the final goal / stakes |
| 0:15 | Black-gold ENTER portal | Decision | Tap ENTER | Hand control to the player |
| 0:17 | Fall → land on the live chart | Transition | Watch | Continuity into gameplay |
| 0:18 | "THIS IS THE MARKET" metaphor card | Lesson | Read | Explain the whole fantasy |
| 0:20 | Goal HUD: "GUARDIAN 1 / 11 · reach the Guardian" | Progress | Read | Persistent objective |
| 0:22 | Coach: SPACE to JUMP | Tutorial | Jump | Teach control #1 |
| 0:29 | Coach: ↑/W to BOOST | Tutorial | Boost | Teach control #2 |
| 0:36 | Coach: ↓/S to TUCK | Tutorial | Tuck | Teach control #3 |
| **0:38–1:28** | **Platforming to candle 48** (collect shells; a candle-close lesson may fire) | **Movement** | Jump/boost | ⚠ mostly traversal |
| 1:28 | FLASH QUIZ — 3 candle-colour cards (green/red/doji) | Test | Tap answer | Candle literacy |
| 1:48 | Prediction Bet round 0 — free read → 🏆 FIRST WIN +40 🐚 | Reward | Call green/red | The engineered first win |
| 2:05 | Prediction Bet round 1 — **WALLET · RISK 20 → WIN 40** | **Shell risk** | Stake a read | First felt capital decision |
| 2:22 | "Now a REAL trade" — first live setup | Trade | Read + take | First real trade |
| 2:40 | **The Gambler** — reveal → dialogue → 3 rounds (predict/candle/predict) | Boss | Fight | "Skill beats gambling" |
| 3:55 | Gambler defeated — +55 🐚 +80 XP, "1/11 cleared", takeaway | Victory | Claim | Reward + lesson named |
| 4:05 | Intermission → Level 2 | Level-up | Advance | Progression beat |

**Level 1 density:** ~13 meaningful events in ~4 min → strong, *because the intro is hand-authored*. The one soft spot is **0:38–1:28** (the pre-quiz runway).

---

## Timeline — Levels 2–5 (the repeating loop), modeled

After the intro, every level is the same shape: ~140 candles of platforming, punctuated by ~3–4 trade setups and ~1–2 lessons, ending in a Guardian. Representative Level 2:

| Time | Event | Type | Player action | Purpose |
|---|---|---|---|---|
| 4:05 | Level 2 begins | Progress | Move | New session |
| ~4:25 | Lesson: Trend (higher highs/lows) | Lesson | Read | Concept unlock |
| **4:25–5:15** | Platforming to first setup | Movement | Jump | ⚠ traversal |
| ~5:15 | Trade setup #1 (stakes shells) | Trade | Read + take | Apply trend |
| **5:35–6:30** | Platforming to next setup | Movement | Jump | ⚠ traversal |
| ~6:30 | Lesson: Support/Resistance + Trade setup #2 | Lesson + Trade | Read + take | Levels |
| **6:50–7:45** | Platforming | Movement | Jump | ⚠ traversal |
| ~7:45 | Trade setup #3 | Trade | Read + take | Reps |
| ~8:30 | **The Eel** — fake/error/fake (Break Trader: judge real vs fake, choose play, resolve) | Boss | Fight | "Wait for the close" |
| ~9:40 | Eel defeated — +75 🐚 +120 XP, takeaway | Victory | Claim | Reward + lesson |
| ~9:50 | Level 3 | Level-up | Advance | Progress |

**Levels 3–5 (modeled):** Guardian 3 (Trend Crab) ~15:00 · Guardian 4 (Structure Serpent) ~21:00 · Guardian 5 (Order-Block Golem) ~27:30 — so a fresh player reaches **~5 Guardians in 30 minutes**.

---

## The numbers

- **Trade opportunities:** ~3–4 per level → **~1 trade every ~50–70 seconds** in steady state.
- **Lessons:** ~1–2 per level (~one per 2–3 min after the intro).
- **Bosses (the biggest payoff):** 1 per level → **~one every 5–6 minutes**.
- **Level-ups:** 1 per level → ~every 5–6 min.
- **Shells to collect:** frequent (~1 per 4 candles) — but a pickup is **low-agency**, not a decision.

**Average gap between *meaningful decisions* (trade / lesson / boss):** **~50–60 seconds** in steady state (tighter in the authored intro, looser mid-level).

---

## Dead zones (the honest version)

By the strict definition (>60–90s of pure platforming with no learn/trade/risk/progress), ChartQuest has **fewer huge dead zones than it *feels* like** — the shells and frequent small setups keep raw event-density up. The real problem is **borderline dead zones that recur every single level**, plus the low agency of the space between. The recurring offenders:

1. **DEAD ZONE — L1 pre-quiz runway (0:38–1:28, ~50s).** After the control coach ends (~candle 14) the intro *suppresses* setups until the Flash Quiz at candle 48, so a brand-new player platforms ~34 candles with nothing to decide. Right at the threshold, and it's a new player's *first* impression of "the loop."
2. **DEAD ZONE (recurring) — inter-setup traversal (~50–70s, every level).** With only ~3–4 setups per 140-candle level, the gaps between trade decisions are ~50–70s of jumping. This repeats 3–4× per level, ~5 levels in 30 min → **~15–20 of these stretches**. None is catastrophic; together they are the "too much platforming" feeling.
3. **DEAD ZONE — level-transition cold start (~20–40s each).** After a Guardian + intermission, the new level opens with platforming before the first setup/lesson surfaces. ~5 times in 30 min.
4. **LOW-AGENCY TIME (not a strict dead zone, but the core issue).** Even inside "active" stretches, the *verb* is jump-over-candles. Collecting shells and clearing obstacles isn't a *decision*. So the felt decision-density is lower than the event-density suggests.

**Cumulative:** of the ~30 minutes, roughly **9–13 minutes are pure traversal** (jumping with no trade/lesson/risk/progress). That's the headline number — not one giant dead zone, but ~40% of the experience spent connecting moments rather than living in them.

---

## One-line summary

The meaningful moments are now strong and reasonably frequent (~1 decision/min), but **~40% of the first 30 minutes is low-agency traversal** between them, in ~50–70s stretches that recur every level. The fix isn't more events — it's compressing the traversal and giving the connective tissue a verb.
