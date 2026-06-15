# Shell Trade — Progression Design

### From Beginner to Trader in ~2 hours of core play

This document maps the full game tree: the rank ladder, the worlds (skill clusters), the drills that make up gameplay, the quiz checkpoints, the bosses, the reward economy, and the special events that keep people coming back. It is built to keep the game **simple and pick-up-and-play** while still graduating someone from total beginner to a confident chart-reading trader.

The course stays a separate product. Nothing here depends on it.

---

## 1. Design Philosophy (the spine)

Three rules drive every decision below:

1. **Reward process, not gambling.** Players earn for following rules, managing risk, and reading charts correctly — *never* for "winning big." This is what makes the game teach real skill instead of reckless behavior, and it's the thing that protects the brand.
2. **Two-hour core, infinite tail.** The main path (Worlds 1–8) is beatable in a couple of hours. Everything after graduation — daily challenges, events, replays — is the optional, repeatable tail that drives retention and ad-funded growth.
3. **One concept per beat.** Each lesson introduces exactly one idea, immediately followed by a drill that uses it. No walls of text. If a concept can't be taught in 60–90 seconds plus a drill, it's too advanced for the core game.

**Theme:** the ocean. The player starts as drifting plankton and climbs the food chain of the market. "Shells" are the in-game currency. The market is the sea — sometimes calm, sometimes a storm. This gives a friendly, all-ages surface over genuinely adult content.

---

## 2. The Rank Ladder (Beginner → Trader)

The player holds one **Rank** at a time. Completing a world's boss promotes them. Rank is the visible spine of progression — the headline number that goes up.

| Rank | Unlocked by | Identity |
|------|-------------|----------|
| **Drifter** | Start (tutorial) | Washed ashore, knows nothing |
| **Plankton** | Beat World 1 | Can read a candle |
| **Minnow** | Beat World 2 | Sees structure & levels |
| **Crab** | Beat World 3 | Reads trends |
| **Pufferfish** | Beat World 4 | Recognizes patterns |
| **Octopus** | Beat World 5 | Understands supply, demand & liquidity |
| **Dolphin** | Beat World 6 | Manages risk |
| **Shark** | Beat World 7 | Stacks confluence with indicators |
| **Whale** | Beat World 8 | Trades a full plan |
| **TRADER** | Pass the Final Exam | Graduation — the title the whole game is named for |

Above **TRADER** sits an optional prestige track (**Kraken**, **Leviathan**…) tied purely to the endgame events in Section 6, so the most engaged players always have a next number to chase.

---

## 3. Core Systems

These run underneath every world.

**XP & Rank.** Every drill, quiz, and boss awards XP. XP fills the current rank's bar; a full bar plus a beaten boss = promotion. XP is the "you're making progress" feedback; Rank is the "you leveled up" payoff.

**Shells (soft currency).** Earned from drills, streaks, and events. **No real-world cash value, never redeemable, never purchasable with crypto** — this is the compliant version of the currency idea and keeps the game out of securities/app-store trouble. Shells are spent in the Shop.

**Pearls (rare currency).** Earned only from bosses, perfect runs, and special events. Used for premium cosmetics and to enter high-stakes events. Scarcity makes them aspirational.

**The Shop.** Pure cosmetics and convenience — never pay-to-win:
- Chart skins & candle color themes
- Console / terminal UI themes
- Avatar evolutions (your sea-creature's look)
- Hint tokens (reveal one clue in a drill)
- Streak freezes (protect a daily streak you'll miss)

**The Trading Journal.** Unlocked early (end of World 1) and framed as a core tool, not a feature. Every drill and sim auto-logs an entry; players can tag the setup used and add a note. A stats view surfaces things like "your accuracy on Break-of-Structure drills is 71%." This is the habit that mirrors real trading and quietly makes the game educational.

**Hearts / Energy (optional, recommended off at launch).** A lives system caps sessions and can drive return visits, but it also adds friction for a game whose pitch is "learn in two hours." Recommendation: launch *without* energy gating; add a gentle daily-bonus loop instead (Section 6). Revisit only if retention data calls for it.

**Reward economy at a glance.** Drills pay small and frequent (the dopamine drip). Quizzes pay medium (checkpoint reward). Bosses pay large + a Pearl + a cosmetic unlock + a rank-up (the milestone moment). Events pay variable and time-boxed (the reason to come back).

---

## 4. The World Map (Skill Tree)

Eight worlds, played in order. Each world = a skill cluster = one rank-up. Each world contains **3–5 micro-lessons + drills**, a **Quiz checkpoint**, and a **Boss**.

```
 [Tutorial: Washed Ashore]
            │
        World 1 ── Reading the Chart ........ ▶ Boss: The Fakeout ........... → Plankton
            │
        World 2 ── Structure & Levels ....... ▶ Boss: The Liquidity Hunter .. → Minnow
            │
        World 3 ── Trends & Trendlines ...... ▶ Boss: The Trend Bender ...... → Crab
            │
        World 4 ── Patterns & Formations .... ▶ Boss: Head & Shoulders ...... → Pufferfish
            │
        World 5 ── Supply, Demand & Liquidity ▶ Boss: The Market Maker ...... → Octopus
            │
        World 6 ── Risk Management .......... ▶ Boss: The Liquidator ........ → Dolphin
            │
        World 7 ── Indicators & Confluence .. ▶ Boss: Mixed Signals ......... → Shark
            │
        World 8 ── The Trading Floor ........ ▶ Boss: The Market (Final) .... → Whale
            │
     [FINAL EXAM] ──────────────────────────────────────────────────────── → TRADER
            │
     [Endgame: Daily Drills · Events · Prestige]
```

Worlds 1–4 are the "basics" any player can clear quickly. Worlds 5–8 are where a beginner actually becomes a trader. A player who only finishes 1–4 still leaves knowing how to read a chart — a satisfying free experience that builds the trust you want for email marketing.

---

## 5. World-by-World Breakdown

Each world lists: **what it teaches → the drills (gameplay) → the quiz → the boss → the reward.**

### Tutorial — "Washed Ashore"
*Teaches:* what the game is, how to tap/drag, what a price chart shows.
*Drill:* "Up or Down?" — read three simple charts, swipe the direction price went. Impossible to fail; it just builds confidence.
*Reward:* 50 Shells, the Journal is foreshadowed, rank set to **Drifter**.

### World 1 — Reading the Chart
*Teaches:* candle anatomy (body, wicks/shadows), green vs. red, timeframes.
*Drills:*
- **Candle Builder** — drag open/high/low/close to construct a candle from a description.
- **Wick Reader** — given a candle, answer what the wick says (rejection, indecision).
- **Timeframe Flip** — same move shown on 1m vs 1h; learn that context changes meaning.
*Quiz:* 5 questions on candle parts and color.
*Boss — "The Fakeout":* a sequence of messy candles tries to trick the player into reading the wrong direction; they must call each correctly under a soft timer.
*Reward:* unlock the **Trading Journal**, 300 Shells, 1 Pearl → **Plankton**.

### World 2 — Structure & Levels
*Teaches:* support & resistance, higher-highs/lower-lows, **Break of Structure (BOS)**, **Change of Character (ChoCh)**.
*Drills:*
- **Spot the Level** — tap the price line acting as support/resistance.
- **Mark the Break** — identify the exact candle that breaks structure (BOS).
- **Character Shift** — flag the moment trend intent changes (ChoCh).
*Quiz:* label a chart's swing points and breaks.
*Boss — "The Liquidity Hunter":* price keeps faking breaks to hunt stops; the player must distinguish a *real* BOS from a *fake* one to win.
*Reward:* 400 Shells, Pearl, chart-skin unlock → **Minnow**.

### World 3 — Trends & Trendlines
*Teaches:* trend direction, drawing trendlines, the **Three-Touch Rule**, momentum.
*Drills:*
- **Draw the Line** — drag a trendline so it respects the three-touch rule.
- **Trend Sorter** — classify charts as uptrend / downtrend / range.
- **Momentum Meter** — judge whether a move is gaining or losing steam.
*Quiz:* trend identification + valid vs. invalid trendlines.
*Boss — "The Trend Bender":* the chart slowly curves; the player must re-draw their trendline as the trend evolves and call the break.
*Reward:* 500 Shells, Pearl, console theme → **Crab**.

### World 4 — Patterns & Formations
*Teaches:* the high-value patterns — double top/bottom, bull/bear flags, wedges, head & shoulders.
*Drills:*
- **Name That Pattern** — flashcard-style pattern recognition against a clock.
- **Complete the Pattern** — predict the second half of a forming pattern.
- **Measure the Move** — set the projected target from a confirmed pattern.
*Quiz:* match patterns to their bullish/bearish bias.
*Boss — "Head & Shoulders":* a literal boss creature; the player must correctly identify each part (left shoulder, head, right shoulder, neckline) and call the breakdown to defeat it.
*Reward:* 600 Shells, Pearl, avatar evolution → **Pufferfish**.

### World 5 — Supply, Demand & Liquidity
*Teaches:* supply/demand zones, **Fair Value Gaps (FVG)**, points of interest, liquidity & order books (kept visual and simple).
*Drills:*
- **Zone Painter** — shade the supply or demand zone on the chart.
- **Gap Finder** — locate the fair value gap price is likely to fill.
- **Liquidity Pools** — tap where stops are likely resting (above highs / below lows).
*Quiz:* discount vs. premium, where price is likely drawn.
*Boss — "The Market Maker":* a big player moves price toward liquidity; the player must predict the grab-and-reverse to win.
*Reward:* 800 Shells, Pearl, rare chart skin → **Octopus**.

### World 6 — Risk Management *(the secret core)*
*Teaches:* risk-to-reward ratio, position sizing, stop placement, leverage danger. This world is where most beginners actually become survivable traders.
*Drills:*
- **Set the Stop** — place a logical stop; the game scores placement quality.
- **Position Sizer** — given account size and stop distance, size the trade so risk = 1%.
- **R-Multiple** — compute and pick the trade with the best risk-to-reward.
- **Leverage Roulette** — see how fast over-leverage blows an account (taught as a cautionary drill, not a thrill).
*Quiz:* risk math and "would this trade survive?"
*Boss — "The Liquidator":* a survival challenge — trade a volatile sequence and *avoid liquidation*. Winning is defined by *not blowing up*, reinforcing that survival beats greed.
*Reward:* 1,000 Shells, 2 Pearls, "Risk Manager" badge → **Dolphin**.

### World 7 — Indicators & Confluence
*Teaches:* RSI, volume / VWAP, money flow — and crucially, **stacking confluence** rather than trusting one signal.
*Drills:*
- **RSI Reader** — call overbought/oversold and divergence.
- **Volume Check** — confirm or reject a move using volume.
- **Confluence Stacker** — combine 2–3 signals; the game rewards a *complete* thesis, penalizes single-signal gambling.
*Quiz:* read combined indicators on one chart.
*Boss — "Mixed Signals":* indicators deliberately conflict; the player must weigh them and make the highest-probability call.
*Reward:* 1,200 Shells, 2 Pearls, premium console theme → **Shark**.

### World 8 — The Trading Floor (Capstone)
*Teaches:* putting it all together — build a rule set, then trade it on simulated replay.
*Drills:*
- **Build Your Rules** — assemble a simple strategy from everything learned (entry trigger, stop, target, risk).
- **Backtest Lite** — run the rules across a few historical charts and read the result.
- **Live Replay** — trade a streamed historical chart bar-by-bar, scored on *rule-following*, not raw profit.
*Quiz:* none — the world *is* the test.
*Boss — "The Market" (Final Boss):* a multi-stage simulated trading gauntlet across calm, trending, and crashing conditions. The player must apply chart reading + risk + confluence to come out intact.
*Reward:* 2,000 Shells, 3 Pearls, "Floor Trader" badge → **Whale**.

### FINAL EXAM → TRADER
A mixed-question gauntlet pulling from all eight worlds, plus one fresh Live Replay. Passing awards the **TRADER** title, a graduation animation, a profile badge, and unlocks the endgame. *This is the natural, non-pushy moment to surface "want to go deeper? the full course is here" — they've proven they're serious, and you can route that through email rather than an in-game hard-sell.*

---

## 6. Special Events & Bonuses (the retention engine)

The core game is finite; these are why people open the app on day 30.

**Daily Drill.** One fresh mixed drill per day. Building a **streak** multiplies Shell rewards (Day 1 ×1 → Day 7 ×3). A **Streak Freeze** item (Shop) protects a missed day. This is the single most important retention mechanic — cheap to build, highly habit-forming.

**Bull Run (weekend event).** A time-boxed window where all drills pay double Shells. Drives weekend re-engagement and pairs perfectly with paid-ad pushes.

**Market Crash (survival event).** A high-pressure, randomized crash scenario; survive the longest without blowing up for leaderboard placement and Pearls. Reinforces risk discipline while feeling thrilling.

**Mystery Chart.** A random real historical chart with the ticker hidden; predict the next move. Quick, shareable, and endlessly replayable.

**Flash News.** A surprise "headline" mid-drill spikes volatility — teaches reacting to the unexpected. Random, low-frequency, adds spice.

**Boss Rush.** Unlocked after graduation: re-fight all eight bosses back-to-back for a big Pearl payout and prestige progress.

**Perfect Run bonus.** Clear any world's drills with no hints and no mistakes → bonus Pearl + a cosmetic flair on the rank badge. Rewards mastery, not just completion.

**Prestige loop (post-TRADER).** Ranks above Trader (Kraken, Leviathan…) advance only through event performance and Perfect Runs, giving your most engaged users an endless number to climb.

---

## 7. Pacing — hitting the two-hour promise

A budget so the core stays tight. (Estimates assume ~30–45s lessons and ~60–90s drills.)

| Segment | Content | Approx. time |
|---------|---------|-------------|
| Tutorial | 1 drill | 3 min |
| Worlds 1–4 (basics) | ~3–4 beats + quiz + boss each | ~12–15 min each → ~55 min |
| Worlds 5–8 (trader) | ~3–4 beats + quiz + boss each | ~14–18 min each → ~65 min |
| Final Exam | mixed + replay | ~8 min |
| **Core total** | | **~2 hours 10 min** |

If playtests run long, the lever is *number of drills per world*, not removing worlds — keep all eight concepts, trim repetitions.

---

## 8. What to build next (recommended order)

1. **Lock the spine first:** XP → Rank ladder → World/Boss/Quiz loop for **World 1 only**. Get one full world feeling great end-to-end before scaling.
2. **Ship the Trading Journal early** — it's the educational backbone and a differentiator.
3. **Build the Daily Drill + streak** before any other event; it's the retention foundation everything else sits on.
4. **Clone the World 1 structure** across Worlds 2–8, swapping in each skill's drills.
5. **Add events last**, once the core loop retains.

The whole design degrades gracefully: even just Tutorial + Worlds 1–4 + Daily Drill is a shippable, marketable game. Worlds 5–8 are the upgrade that earns the word "Trader."
