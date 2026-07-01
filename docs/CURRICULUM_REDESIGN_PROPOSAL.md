# Chart Quest — Curriculum & Onboarding Rebalance
### Design Proposal (analysis + recommendation — NOT implemented)

**Status:** For review. Nothing in here is built yet. This document analyzes the
existing progression and proposes a redesign for sign-off before any code changes.

**Core problem (confirmed in code):** Chart Quest isn't teaching trading too early —
it's teaching *too many things at once*, and the *names* of things before the
*ideas*. A new player simultaneously juggles controls, jetpack, chart-reading, a
flash quiz, a prediction bet, a boss fight, and trading vocabulary — before they've
ever felt a single winning trade.

---

## 1. How the system works today (the audit)

### 1a. There are TWO progressions, and they've drifted apart

**The curriculum** (`CURRICULUM`, 10 "hours") teaches lessons per hour:

| Hour | Title | Concepts taught (focus) |
|---|---|---|
| 1 | Candle Basics | candles, long vs short |
| 2 | Manage Your Risk | stop loss, wait-for-close (+ trend, S/R in recap) |
| 3 | Market Structure | BOS, Order Block, ChoCh (all three at once) |
| 4 | The VWAP Magnet | VWAP, VWAP trade |
| 5 | Zoom Out | higher timeframes (HTF) |
| 6 | Leverage & Edge | leverage, risk:reward |
| 7 | VWAP & Trend Lines | VWAP review, trendlines |
| 8 | Bullish Structures | flags/triangles/continuation |
| 9 | Bearish Structures | bear patterns, head & shoulders |
| 10 | Confluence Mastery | confluence |

**The boss ladder** (`BOSS_CAST`, 11 Guardians) teaches a *different* concept order.
A boss fires at the end of a cleared hour via `openBoss(session.level)`, so **Boss N
follows Hour N**:

| Fires after | Guardian | Concept the boss is about | Mini-game rounds tested |
|---|---|---|---|
| (intro) | 0 · The Gambler | discipline / process | candle, predict, error |
| Hour 1 | 1 · False-Breakout Eel | fakeouts, **confirmation** | candle, error, predict |
| Hour 2 | 2 · Trend Crab | **trend**, HH/HL | trend, support, resistance |
| Hour 3 | 3 · Structure Serpent | **BOS + ChoCh** | bos, choch, ob, liquidity |
| Hour 4 | 4 · Order-Block Golem | **Order Blocks** | ob, bos, ob, pattern, exec |
| Hour 5 | 5 · Risk Hydra | **risk / sizing** | sl, support, sl |
| Hour 6 | 6 · VWAP Oracle | **VWAP** | vwap, support, resistance, vwap |
| Hour 7 | 7 · Margin King | **leverage** | rr, possize, fake, exec |
| Hour 8 | 8 · Timeframe Titan | **multi-timeframe** | mtf, struct, mtf, predict |
| Hour 9 | 9 · Confluence Kraken | **confluence** | pattern, choch, fake, mtf, exec |
| Hour 10 | 10 · (final) | culmination | — |

**The misalignment:** look down the two tables. Hour 1 teaches *candles*; its boss
tests *confirmation/fakeouts*. Hour 4 teaches *VWAP*; its boss tests *Order Blocks*.
Hour 5 teaches *HTF*; its boss tests *risk*. Hour 6 teaches *leverage*; its boss tests
*VWAP*. From Hour 4 onward the boss consistently tests a concept the player learned
**one or two hours earlier** (or hasn't been taught at all). The boss should be the
exam for the hour that just happened — right now it's an exam for a different class.

**Good news:** the *boss* order is actually a sound teaching sequence on its own —
discipline → confirmation → trend → structure → order blocks → risk → VWAP → leverage
→ multi-TF → confluence. The cheapest, lowest-risk fix is to **re-sequence the
curriculum hours to match the bosses**, not the other way around. (More in §5.)

### 1b. Onboarding: what a brand-new player actually hits

First-play is gated by a `cq_played` flag and driven by `introFlow`, which fires
checkpoints by **candle count** while the player walks:

- **Candle 0-47:** opening cinematic + "REAL CHART LOADED" card + learning controls
  (tap = jump, swipe-up = jetpack, swipe-down = tuck, swipe = turn) + collecting shells.
- **Candle 48:** Flash Quiz portal ("what colour is this candle?").
- **Candle 60:** Prediction Bet portal (bet up/down — the *first* trade-like action).
- **Candle 70-80:** Intro Boss portal → Boss 0, The Gambler (a quiz fight).
- Real trade setups are **suppressed during the entire intro** (`showBanner` early-returns
  while `introFlow.active`). `setupCountdown` doesn't start producing real setups until
  the intro completes.

**Time-to-first-trade:** the earliest "I placed a trade and it paid" moment is the
Prediction Bet around **candle 60**, and the first *real* setup → trade panel is only
**after the intro boss** (≈ candle 80+). On normal pacing that's well past the
**3-5 minute** target — closer to 10-15 minutes, after the player has already absorbed
controls, jetpack, a quiz, and a boss.

### 1c. Terminology gating today is shallow

There is one gate: `beginnerMode()` = `session.level <= 1`. It hides the on-chart
"BOS"/"OB" text labels and swaps the setup banner to "TRADE OPPORTUNITY" — but **only
at Level 1**, and only for those few elements. At Level 2 every professional term
reappears regardless of whether the player has learned it. There is **no concept-unlock
system** that ties terminology visibility to what the player has actually been taught.
Lesson completion is tracked (`lessonProgress`) but isn't wired to what vocabulary the
chart is allowed to show.

### 1d. Cognitive-load inventory (everything competing for attention in session 1)

Movement · jump · jetpack · shell tuck · turn-around · "the chart IS the level" ·
candle colour · candle close · wicks · the HTF mini-panel · the flash quiz · the
prediction bet · the boss fight · long vs short · the trade panel · stop loss ·
"wait for the close" · setup grades. That's ~18 distinct things in the first ~10
minutes. The redesign's job is to **introduce one idea at a time and put the first
win up front.**

---

## 2. Design principles (what we're optimizing for)

1. **Concept first, terminology later.** Teach the *idea* with plain words; reveal the
   professional name only once the idea is understood. ("Price broke above the last
   high" → later → "traders call this a Break of Structure, BOS.")
2. **Trading happens early.** A guided, near-guaranteed **winning trade inside the
   first 3-5 minutes.** "Learn → Click → Profit → *I can do this.*"
3. **The chart is the game.** Movement/jetpack exist to *navigate the market*, not as a
   platformer for its own sake. Every beat should push a market decision.
4. **One new idea per world.** Never stack BOS + OB + ChoCh in a single hour again.
5. **Hide what hasn't been taught.** Level-1 charts show candles, price, and trade
   opportunities — nothing else.

---

## 3. DELIVERABLE 1 — New-player onboarding flow

A short, gated **Tutorial Cove** that replaces the candle-48/60/70 checkpoint intro.
Each step unlocks the next; the player can't be overwhelmed because only one thing is
ever live. Target: **~4-5 minutes total, with the first winning trade by minute 3-4.**

| Step | ~Time | Teaches (idea only) | Player does | Win moment |
|---|---|---|---|---|
| 1. Wake up | 0:00-0:30 | "Walk the market" | taps to move/jump across 3-4 candles | collects first shells |
| 2. The boost | 0:30-1:15 | jetpack | swipes up to clear one tall candle | lands a shell on top |
| 3. Read a candle | 1:15-2:15 | green = up, red = down (one card, plain words) | taps the green candle when asked | "Correct! Green means price went up." |
| 4. **First trade** | 2:15-3:30 | "When price is rising, you can buy and ride it up" | a glowing **opportunity** appears in a clean uptrend; tap → enter → price climbs → close in profit | **"+X SHELLS! You just made your first trade."** |
| 5. Do it again | 3:30-5:00 | repetition builds the loop | 2 more easy guided longs | a small streak; confidence |
| 6. Meet the Gambler | 5:00+ | "trading on a hunch ≠ trading with a reason" | Boss 0 as a *gentle* gate, framed as the difference between gambling and reading the chart | first boss cleared |

Notes:
- The flash quiz and prediction bet aren't deleted — they become **step 3 and step 4**
  respectively, but earlier, simpler, and framed as "your first trade" rather than a
  detour before trading.
- The opening cinematic stays but should be **skippable** and should not block step 1.
- Boss 0 moves to *after* the player has felt a few wins, so it reads as a milestone
  ("you've got the basics") rather than another thing to learn.

## 4. DELIVERABLE 2 — The first 30 minutes

| Minute | Beat | New idea | Terminology shown |
|---|---|---|---|
| 0-5 | Tutorial Cove (§3) | move, candle colour, **first winning long** | none — plain words only |
| 5-9 | Hour 1 proper: easy longs in friendly uptrends; skip-the-bad-one taught | "good trade vs bad trade", wait for the candle to **close** | "opportunity", "good/bad trade" |
| 9-12 | Boss 1 (Eel) | **confirmation** — don't chase the spike, wait for the close | "wait for confirmation" (term "fakeout" optional) |
| 12-18 | Hour 2: trend | "price makes higher highs / higher lows = uptrend" | "uptrend / downtrend" |
| 18-21 | Boss 2 (Crab) | trade *with* the trend | "trend" |
| 21-30 | Hour 3 begins: structure intro | "price broke above the last high" (BOS as an *idea*) | plain language; "BOS" stays hidden until its lesson |

By minute 5 the player has **won a trade**. By minute 30 they understand *direction*
and *trend* and have beaten two Guardians — without ever being shown BOS, OB, ChoCh,
VWAP, confluence, liquidity, or grades.

## 5. DELIVERABLE 3 — Concept unlock sequence (and a new unlock system)

**Proposed system:** a persisted `conceptUnlocked` map (mirrors `lessonProgress`). Each
chart concept has **three visibility tiers**, advanced by progression:

- **Tier 0 — invisible / cue only:** before the concept is introduced, the chart shows
  *only* a neutral visual cue (e.g., a glow) with no label, or nothing at all.
- **Tier 1 — plain language:** after the concept's lesson, the chart labels it in plain
  words ("broke above the high", "the zone big buyers left", "the average-price line").
- **Tier 2 — professional term:** after the concept's **boss** is defeated (mastery),
  the chart shows the real term ("BOS", "Order Block", "VWAP").

**Recommended concept order** (one idea per world, aligned to the existing boss ladder):

| World | Concept introduced (plain) | Unlocked by | Term revealed by |
|---|---|---|---|
| Onboarding | candles, direction, **a trade** | Tutorial Cove | — |
| 1 | confirmation: wait for the close | Hour 1 lesson | Boss 1 (Eel) → "fakeout" |
| 2 | trend + support/resistance | Hour 2 lesson | Boss 2 (Crab) → "trend", "S/R" |
| 3 | break of the last high/low | Hour 3 lesson | Boss 3 (Serpent) → "BOS" |
| 4 | the zone before the big move | Hour 4 lesson | Boss 4 (Golem) → "Order Block" |
| 5 | the safety exit / not betting it all | Hour 5 lesson | Boss 5 (Hydra) → "stop loss / risk" |
| 6 | the fair-value line | Hour 6 lesson | Boss 6 (Oracle) → "VWAP" |
| 7 | borrowing power, carefully | Hour 7 lesson | Boss 7 (King) → "leverage / R:R" |
| 8 | check the bigger picture | Hour 8 lesson | Boss 8 (Titan) → "higher timeframe" |
| 9 | shapes that repeat | Hour 9 lesson | Boss 9 → "patterns" |
| 10 | stacking reasons | Hour 10 lesson | Boss 9/10 (Kraken) → "confluence" |

This sequence (a) teaches one idea per world, (b) puts the professional name *after* the
idea is mastered, and (c) **already matches the boss ladder**, so bosses don't need to
move.

## 6. DELIVERABLE 4 — Terminology unlock sequence

The exact order the *words* become visible to the player (Tier 1 → Tier 2):

```
good trade / opportunity   (always)
→ wait for the close
→ up / down · long / short
→ uptrend / downtrend
→ support / resistance
→ "broke above the high"  →  Break of Structure (BOS)
→ "zone before the move"  →  Order Block (OB)
→ change of character (ChoCh)
→ stop loss / risk
→ fair-value line (VWAP)
→ leverage / risk:reward
→ higher timeframe (HTF)
→ patterns (flags / triangles / head & shoulders)
→ confluence
```

Until each item is unlocked, the chart, the setup banner, the trade panel, and the boss
intros must use the plain-language form. (Today only the on-chart BOS/OB labels and the
banner respect this, and only at Level 1.)

## 7. DELIVERABLE 5 — Boss alignment review (recommendation only — no boss changes yet)

**Verdict: keep all 11 Guardians, keep their names, keep their art, keep their order.**
The boss ladder is the most coherent teaching spine we have. The fix is to **re-sequence
the curriculum hours and the concept-unlock gates to line up with the bosses.**

Boss-by-boss:

| Guardian | Concept | Keep position? | Recommendation |
|---|---|---|---|
| 0 · Gambler | discipline/process | ✅ yes | Move *later in the onboarding* (after first wins) so it reads as a milestone, not a lesson. |
| 1 · Eel | confirmation/fakeout | ✅ yes | Re-aim Hour 1 to teach "wait for the close" so the Eel is the exam for Hour 1. |
| 2 · Crab | trend | ✅ yes | Hour 2 should be Trend + S/R (currently trend is only in the recap). |
| 3 · Serpent | BOS + ChoCh | ✅ yes | Hour 3 = BOS as its own idea. Consider moving **ChoCh** out of Hour 3 into a later beat so structure isn't three-in-one (see Lessons, §8). |
| 4 · Golem | Order Blocks | ✅ yes | Hour 4 should teach OB (today Hour 4 teaches VWAP — the biggest single mismatch). |
| 5 · Hydra | risk/sizing | ✅ yes (as *mastery*) | Introduce a *basic* stop-loss idea in onboarding, but keep the deep risk world at Hydra. "Concept early, mastery later." |
| 6 · Oracle | VWAP | ⚠️ review | Boss order says VWAP at world 6; your example flow put VWAP near the end (phase 9). Decide: keep VWAP mid (no boss change) or move it later (requires re-sequencing bosses). **Recommend keeping mid** to avoid touching bosses. |
| 7 · King | leverage | ✅ yes | Hour 7 = leverage/R:R (today Hour 6). |
| 8 · Titan | multi-timeframe | ✅ yes | Hour 8 = HTF (today Hour 5). |
| 9 · Kraken | confluence | ✅ yes | Final-concept boss; Hour 9-10 feed it (patterns + stacking). |
| 10 · final | culmination | ✅ yes | Unchanged. |

**Net:** no boss moves. The *curriculum* re-orders to: candles+confirmation → trend+S/R
→ BOS → OB → risk → VWAP → leverage → HTF → patterns → confluence.

## 8. DELIVERABLE 6 — Lessons requiring revision

Existing lessons (`LESSONS` / `LESSON_LIBRARY`, 20 entries) are largely reusable — the
*content* is fine; the *sequencing and framing* change. Specific edits:

- **Split Hour 3.** It currently teaches BOS + OB + ChoCh together. Spread to: BOS
  (world 3), OB (world 4), and either keep **ChoCh** with BOS or introduce it as a short
  beat after OB. This is the single highest-impact change.
- **Re-home VWAP, HTF, leverage.** Move the VWAP lesson to align with the Oracle world,
  HTF to the Titan world, leverage to the King world (per §7).
- **Front-load a "first trade" lesson** that doesn't exist yet: a one-screen, plain-words
  "buy when it's going up, sell to lock in profit" guided trade (drives Tutorial Cove §3).
- **Rewrite every concept lesson into two parts:** Part A = the idea in plain language
  (Tier 1); Part B = "traders call this ___" (Tier 2). The `IM_LESSONS` intermission
  lessons already lean this way (plain lead + key points) and are a good template.
- **Demote terminology in early lessons.** Strip "BOS", "OB", "VWAP", "confluence",
  "liquidity", "grade" from any lesson shown before its world.
- **Add explicit "good trade vs bad trade"** framing in Hour 1 (the player's job is the
  decision, not the vocabulary).

## 9. DELIVERABLE 7 — Systems affected by the redesign

What this touches (for scoping the eventual build):

- **`CURRICULUM`** — re-order the 10 hours' `focus` / `intermissionFocus` / titles to
  match the boss-aligned concept sequence (§5, §7).
- **`introFlow`** — replace the candle-48/60/70 checkpoints with the Tutorial Cove
  sequence (§3); move the first real trade *before* the intro boss; make the cinematic
  skippable.
- **New: concept-unlock system** — a `conceptUnlocked` map + a `conceptTier(key)` helper,
  persisted like `lessonProgress`, that the renderer and UI consult.
- **`drawCandle` / labels** — replace the single `beginnerMode()` gate with per-concept
  tiering (BOS/OB/ChoCh/sweep labels driven by `conceptTier`).
- **`showBanner` / setup banner** — banner text and grade visibility driven by
  `conceptTier`, not just Level 1.
- **Trade panel & boss intros** — swap professional terms for plain language until the
  concept's term is unlocked.
- **`teach()`** — its curriculum gate (`cur.focus.includes(key)`) inherits the new hour
  ordering automatically; verify the 2-per-hour throttle still feels right with the new
  pacing.
- **`nextSetupIn` / `setupCountdown`** — allow (easy, guided) setups *during* onboarding
  so the first trade can happen in minutes; currently setups are suppressed in the intro.
- **Mastery (`LESSON_MASTERY`)** and the **dashboard QA/curriculum panels** — update to
  reflect the new ordering so the QA tools and the founder dashboard stay in sync.
- **Boss fights, art, names, mini-games** — **unchanged** (per your instruction).

---

## 10. Open questions for you to decide before we build

1. **VWAP placement.** Keep it mid (world 6, Oracle — no boss change) or push it near the
   end like your example flow (would require re-sequencing the bosses)? *Recommend: keep mid.*
2. **ChoCh.** Bundle with BOS (Serpent, world 3) or split into its own later beat? *Recommend: keep with BOS but introduce it a beat after, inside the same world.*
3. **Risk timing.** Basic stop-loss in onboarding + deep risk world at Hydra (world 5) —
   agree? Or do you want a fuller risk treatment earlier?
4. **Tutorial length.** Is ~5 minutes of guided onboarding acceptable, or do you want the
   player dropped into free play even faster (e.g., 3 minutes) with optional tips?
5. **Scope of first build.** Suggested phase 1: (a) re-sequence the curriculum to the
   boss ladder, (b) build the concept-unlock tiering, (c) rebuild onboarding for the
   3-5 minute first win. Bosses untouched. Agree to that as the first slice?

*No code, assets, or bosses have been changed. Awaiting review.*
