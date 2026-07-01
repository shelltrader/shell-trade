# ChartQuest — Guardian Trial Framework

**Status:** Design spec + implementation plan (v1)
**Goal:** Stop boss fights from feeling like quizzes. Make them feel like *gameplay challenges that teach trading through movement.* The player never stops being Finn; the Guardian is always an active opponent.

This document is the **single source of truth** for every current and future Guardian fight. Every trial must conform to it.

---

## 1. The three rules (non-negotiable)

Every Guardian Trial must satisfy all three:

1. **Teach exactly ONE trading concept.** No trial mixes lessons.
2. **Finn must physically interact.** Moving, jumping, boosting, climbing, dodging, timing, positioning. If Finn is standing still while the player taps UI, the trial is wrong.
3. **The Guardian reacts to performance.** Correct play *damages* the Guardian (a crystal shatters, it recoils, roars). Incorrect play *empowers* it (it laughs, glows brighter, the arena darkens).

**The authoring question for every trial:** *"What is Finn physically doing while the player demonstrates this trading skill?"* If you can't answer in one sentence about movement, redesign it.

---

## 2. We do NOT build new game systems

Everything is a **remix of what already exists.** Confirmed reusable seams in `chart-quest.html`:

| Need | Reuse this (already in the engine) |
|---|---|
| Finn's body + state | `turtle` object (`x,y,vy,dir,onGround,halt,tucked,spinning,fuel`) |
| Physics constants | `CFG` (`walkSpeed:58`, `gravity:2300`, `jumpVelocity:-780`, `jetpack1/2Velocity`, `levelMin:80`, `levelMax:700`) |
| Movement verbs | `jump()`, `fireJetpack()`, `shellTuck()`, auto-walk in `update(dt)` |
| Input (already wired) | tap = jump · swipe up / ↑ / W = boost · swipe down = tuck · swipe ←/→ = `turtle.dir` |
| Candles as platforms | `candles[]` (each `{x,w,h,open,color,...}`), `candleTop(c)`, landing collision in `update()` |
| Rendering Finn | `drawTurtle(cameraX)` |
| Camera | `cameraX` (horizontal pan), `camY`, `camZoom` (Trade-Mode zoom-out) |
| Boss shell + HP | `bfState` (`rounds, idx, bossHP, maxBossHP, playerHP`), crystal segments (`#bfHP .seg`) |
| Round lifecycle | `launchRound()` → trial → **`onRoundDone(score, passed)`** → between-round card → `bossWin()` |
| Guardian reactions | `bossHitFX('hit'\|'hurt')`, `bossBurst('hit'\|'hurt')`, `bossTaunt()`, `shakeBig` |

**Integration principle:** a Guardian Trial is just *what runs between `launchRound()` and `onRoundDone()`.* Today that slot is `MG_run` (a DOM quiz). The framework swaps in a **movement trial on the canvas** and, when it resolves, calls the same `onRoundDone(score, passed)` — so crystal HP, reactions, between-round flow, and victory all keep working untouched.

---

## 3. The 6–8 interaction primitives

Think in **primitives**, not in "19 minigames." Every trial is a *combination* of these. This keeps the game fresh and the codebase small and maintainable.

Each primitive below lists: **Finn's verb · the input · how we detect success · what it can teach.**

### P1 — JUMP TO TARGET
- **Finn:** auto-walks toward a row of candle-platforms; the player **taps to jump** onto the chosen one.
- **Detect:** which candle Finn *lands on* (existing landing collision: `footL/footR` vs `candleTop(c)`).
- **Teaches:** "pick the X candle" (bullish vs bearish, the doji, the strong close, the breakout candle).

### P2 — CHOOSE A ROUTE (2–3 lanes)
- **Finn:** approaches a fork; the player **swipes up / down (or left to a lower lane)** to commit to one path.
- **Detect:** which lane Finn enters; wrong lanes **crumble** (reuse a candle "shatter" visual), correct lane is solid.
- **Teaches:** direction calls (LONG vs SHORT), real-break vs fake-out, trend-with vs trend-against.

### P3 — CLIMB THE CORRECT PATH
- **Finn:** the *correct trend* becomes a **climbable staircase of candles**; the player jumps/boosts up it. The wrong path collapses.
- **Detect:** Finn reaches the top platform (a target zone) by following the valid structure.
- **Teaches:** trend (higher highs/lows), trendlines, support holding → continuation.

### P4 — REACH BEFORE TIME EXPIRES
- **Finn:** a target zone is marked; a shrinking timer bar runs. The player must **get Finn there in time** (run + jump + boost).
- **Detect:** Finn inside the target rect before `t<=0`.
- **Teaches:** "act on the close, not the wick" (reach the zone only after the candle closes), momentum urgency.

### P5 — DODGE THE HAZARD
- **Finn:** hazards sweep across the arena (reuse the **liquidity-sweep wick** visual / `sweepCdT`). The player **tucks (swipe down) or jumps** to avoid them.
- **Detect:** Finn avoided contact for the window (no `sweep` hit).
- **Teaches:** liquidity sweeps / stop-hunts ("don't get trapped by the wick"), staying out of chop.

### P6 — WAIT FOR THE RIGHT MOMENT (timing)
- **Finn:** stands ready; a candle is *forming*. The player must **act only when it CLOSES the right way** (tap/boost at the green window, not the red fake).
- **Detect:** input fired inside the correct timing window.
- **Teaches:** confirmation / "wait for the close," patience as edge (confluence).

### P7 — COLLECT THE OBJECTIVE
- **Finn:** shells/markers appear only on the *correct* structure (e.g. on the order block, on support). The player **routes Finn to grab them** (reuse `coins[]` + pickup).
- **Detect:** required pickups collected (and *not* the decoys).
- **Teaches:** order blocks, support/resistance zones, where to enter.

### P8 — BOOST TO THE REWARD
- **Finn:** the reward/target sits high; only a **double-boost (swipe up ×2 / jetpack)** reaches it, and only from the right launch candle.
- **Detect:** Finn reaches the high zone via boost.
- **Teaches:** breakouts ("ride the momentum up"), risk:reward (reach the 2R target).

> Eight primitives cover the entire current curriculum. New Guardians = new *combinations* + new chart data, not new engines.

---

## 4. The GuardianTrial data schema

A trial is **data**, not bespoke code. One runner interprets it.

```js
// A single trial = one concept, expressed as primitive(s) over a chart.
{
  id: 'jump_bullish',
  concept: 'sr',                 // ties to CONCEPTS/lessons (gating + the ONE thing taught)
  primitive: 'JUMP_TARGET',      // P1..P8 (a trial may chain a few, e.g. ['CLIMB','REACH'])
  prompt: 'Land on the candle BUYERS won',   // <= ~6 words, shown briefly, big
  chart: genTrialChart('jump_bullish'),       // reuse the mini-game gens (candles[], answer)
  answerTest: (landedCandle) => landedCandle.isAnswer,  // success predicate
  timeLimit: 0,                  // 0 = untimed; >0 = P4 timer (seconds)
  onCorrect: 'hurt',             // Guardian reaction key (P? -> bossHitFX)
  onWrong:   'taunt',
  retries: 1                     // wrong play empowers the boss, then re-arm (never hard-fail boss 1)
}
```

A Guardian is just an **ordered list of trials** (one per crystal):

```js
GUARDIAN_TRIALS[0] = [ trialA, trialB, trialC ];   // The Gambler — 3 crystals, 3 trials
```

This maps 1:1 onto the existing `bfState.rounds` array, so `bfState.bossHP = trials.length` and each cleared trial shatters a crystal — **no HP rework needed.**

---

## 5. Lifecycle (how a trial runs inside the existing boss)

```
openBoss(level)                         [existing — splash + portal vortex]
  └─ launchRound()                      [existing seam]
       └─ if FLAG && GUARDIAN_TRIALS[level]:
            GuardianTrial.run(trial, onDone)        ← NEW (movement on canvas)
               1. INTRO   ~1.2s: dim arena, show prompt (big, <6 words), Guardian looms
               2. PLAY    : reuse turtle physics + input; draw candle targets/lanes/hazards
               3. RESOLVE : answerTest() → correct or wrong
               4. REACT   : correct → bossHitFX('hurt') + crystal shatter
                            wrong   → bossHitFX('hit')/bossTaunt() + boss empowered, re-arm
               5. onDone(score, passed)  →  onRoundDone(score, passed)   [existing]
          else:
            MG_run(...)                  [existing DOM quiz — fallback while flag is off]
  └─ onRoundDone → between-round card → next launchRound() → ... → bossWin()  [all existing]
```

**Why this is safe:** the trial only *replaces the middle*. Everything around it (HP, reactions, victory, between-round, retry, the unfailable-first-boss rule) is the code already shipped. The flag (`?trials=1` / `localStorage cq_trials`) keeps the live game on the current quizzes until each primitive is tested.

---

## 6. Rendering & physics reuse (the actual hooks)

- **Canvas:** render the trial on the main `canvas`/`ctx` with the boss DOM overlay set to *not* cover it during PLAY (the boss header/HP/art stay as a thin top band; the arena floor is the chart). Finn is drawn with the existing `drawTurtle(cameraX)`.
- **Arena candles:** build a short `candles[]` for the trial from the existing mini-game generators (they already return `{cs, answer}`); tag the answer candle. Landing/standing uses the **existing collision** in `update()` (`candleTop`, `footL/footR`), so "jump onto the candle" needs *zero new physics.*
- **Camera:** pin `cameraX` so the whole trial (3–5 candles) is on screen at once — reuse the Trade-Mode `camZoom` to frame it. No new camera code.
- **Input:** already global — tap→`jump()`, swipe-up→`fireJetpack()`, swipe-down→`shellTuck()`, swipe-←/→→`turtle.dir`. The trial just *reads the result* (where Finn ends up), it doesn't add new controls.
- **Boundaries:** clamp `turtle.x` to the arena and use the existing "off the chart" failsafe so Finn can never fall out of a trial.

---

## 7. The first 5 trials (converted — objectives identical, interaction transformed)

| # | Guardian / concept | OLD (quiz) | NEW (movement) | Primitives |
|---|---|---|---|---|
| 1 | Gambler · *who won* | Tap the bullish candle | **Jump onto** the candle buyers won; the red ones crumble | P1 + P2 |
| 2 | Gambler · *momentum* | Predict up/down | Strong candle closes → **boost up** the continuation lane; wrong lane collapses | P8 + P2 |
| 3 | Eel · *wait for close* | "Who really won?" | A wick spikes; **wait, then act only when it CLOSES** the right way (timing window) | P6 + P4 |
| 4 | Trend Crab · *trend* | Tap higher-low / pick trend | The valid trend is a **climbable staircase**; climb it to the top; the fake path collapses | P3 |
| 5 | Trend Crab · *support* | Shade the zone | **Collect** the shells that sit on support; price bounces UP off it as you stand there | P7 + P4 |

Each keeps its existing educational objective and *reuses the existing chart generators* (`genZone`, the predict/whowon/confirm gens) for the candle data — we only change what the player *does* with the chart.

---

## 8. Guardian reactions (catalog — reuse existing FX)

**On correct (Guardian hurt):** crystal segment shatters (`#bfHP .seg` dims) · `bossHitFX('hurt')` → coin burst + recoil · camera `shakeBig` · roar sting · eye flash.

**On wrong (Guardian empowered):** `bossTaunt()` (dice/laugh particles) · eye glows brighter · arena darkens (vignette up) · smoke increases · **no crystal lost** (boss 1 stays unfailable per the shipped rule; later bosses may cost a heart).

The reaction is driven entirely by the `onCorrect`/`onWrong` keys in the trial schema mapping to these existing functions — authors never write FX code.

---

## 9. Mobile rules (hard requirements)

- Understandable in **< 3 seconds**, prompt ≤ ~6 words, no paragraph to read.
- **Large targets** — full candle-width jump pads, full-height lanes. No precise dragging, no tiny hit-boxes.
- The player's eyes stay on **Finn + the chart**, never on menus.
- One clear verb per trial ("JUMP," "BOOST UP," "WAIT," "CLIMB").
- Safe-area aware; never require a gesture that fights the browser (no edge swipes).

---

## 10. Authoring recipe (for every future Guardian)

1. Pick the **one** concept (from `CONCEPTS`).
2. Answer **"what is Finn doing?"** → pick 1–2 **primitives**.
3. Reuse a chart **generator** for the candle data; tag the answer.
4. Write a **≤6-word prompt**.
5. Set `onCorrect`/`onWrong` reaction keys.
6. Add the trial to `GUARDIAN_TRIALS[level]` (one per crystal).
7. Test on mobile behind `?trials=1`. Ship the primitive once it feels right.

If a proposed trial can't be expressed as a combination of P1–P8 with a clear Finn verb, **it doesn't belong in a Guardian fight** — it belongs in the Journal as a reference, not a boss.

---

## 11. Implementation plan (flag-gated, test-per-primitive)

1. **Scaffold** `GuardianTrial.run(trial, onDone)` + the trial schema, behind `?trials=1`. (No live impact.)
2. **Primitive P1 (Jump to target)** first — it reuses landing collision verbatim, lowest risk. Convert Trial 1. Test on device.
3. Add **P2 (route), P6 (timing), P3 (climb)** — convert Trials 2–4, test each.
4. Add **P4/P7** for Trial 5; tune reactions + crystal feedback.
5. When all five feel good on mobile, flip the flag default-ON and retire the DOM quizzes for those rounds.
6. Every new Guardian thereafter is **pure data** (`GUARDIAN_TRIALS[level] = [...]`) — no new engine code.

**Why flag-gated + incremental:** boss fights are the highest-stakes screens; a movement bug (Finn falls out, target unreachable, crystal won't break) would break the core loop. Gating + per-primitive device testing guarantees the live game is never at risk while we build.
