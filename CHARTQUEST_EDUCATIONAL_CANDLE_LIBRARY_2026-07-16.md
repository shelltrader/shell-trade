# ChartQuest Educational Candle Library — v1.0

**Date:** 2026-07-16 · **Phase:** 3A — The Visual Language of Trading
**Status:** CONTENT LIBRARY (production asset). This is **not** a new constitution, schema, or governance layer.
It is authored candle **data**, subordinate to and citing `CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md`
(the sole geometry/colour authority) and the Curriculum Engine / Pattern OS (the sole pedagogy authorities).
It invents **no geometry**: every archetype below is authored `{o,h,l,c}` data on the LessonChart 0–100
price scale, consumed unchanged by the ratified formulas (`bodyW = 0.72·slot`, radius 0, auto-fit + 8% pad).

---

## 1. Why this library exists

Playtesting showed the architecture teaches but the **pictures whisper**. Lessons were technically
correct while their candles were too flat, too similar, or too subtle for a first-time reader.
Per the Constitution's sharpest test:

> **If a candle needs an explanation to be understood, the candle failed — not the child.**

This library fixes that at the *data* layer: one canonical vocabulary of exaggerated, archetypal
candles, from which **every** Golden Path lesson scene is composed. No lesson invents candle
proportions again — it *quotes* this vocabulary.

## 2. The unit grammar (how archetypes are sized)

LessonChart scenes auto-fit, so only **relative** size survives to the screen. To make sizes
auditable, every Golden Path scene is authored against a **standard scene range of R ≈ 60–70
units** (typical span lo≈16 → hi≈84). At R=64 on a ~160px chart, **1 unit ≈ 2.5px**.

| Size class | Body (units) | ≈ px | Reads as | Constitution check |
|---|---|---|---|---|
| **HERO** | 28–40 | 70–100px | "the whole point of the picture" | ≤ 55%·range cap ✓, focal ≥ 1.3× ✓ |
| **STANDARD** | 12–16 | 30–40px | a normal, confident move | ≥ 24px Type-A floor ✓ |
| **SMALL** | 8–10 | 20–25px | deliberately small (a rest, a drift) | ≥ ~0.13·R visible floor ✓ |
| **DOJI** | 0.5–1.5 | 2–4px | "a tie — nobody won" | doji band 2–4px ✓, authored only |

**Hard rules inherited from the Constitution (never re-decided here):**
- Body width / gap / corner radius 0 / colours: engine + `COLOR` object. This library never
  states a pixel width — width *emerges* from `0.72·slot`.
- Directional candles never author a body < 8 units (no accidental dojis). The **only** thing
  in the 0.5–1.5-unit band is an authored DOJI.
- Magnitude is honest: a bigger authored move is a bigger body; ordering is never faked.

**Ratio laws every composed scene must clear:**
- **Focal law:** the focal candle ≥ **1.3×** the median context body — this library targets **≥ 2×**.
- **Relational law:** a taught size relationship ≥ **1.5×** — this library targets **≥ 2.5×**.
- **Pullback law:** a rest candle ≤ **0.5×** the push it rests from.
- **Wick law:** wick-lesson candles carry wick ≥ **2×** body; body-lesson candles carry wick ≤ **0.25×** body.

## 3. The Vocabulary — canonical archetypes

Notation: sizes in scene units. `▲/▼` = direction. All archetypes are green when `c>o`, red when
`c<o`, per the engine; a DOJI is authored `c=o±0.5` (renderer tint is a known Phase-2 engine item —
data keeps the body inside the 2–4px band so it reads as "no body" regardless of tint).

| ID | Name | Shape spec (units) | Educational meaning | Allowed lessons | Forbidden lessons | Beginner misunderstanding it must kill | Exaggeration guidance |
|---|---|---|---|---|---|---|---|
| **G1** | Strong Bullish | ▲ body 28–40, wicks ≤ 3 each | "Buyers won, start to finish" | green-vs-red, long, momentum, confirmation, breakout | doji/indecision, wick lessons | "green just means a green stripe" — size must scream *winning* | body near marubozu; never add long wicks |
| **R1** | Strong Bearish | ▼ body 28–40, wicks ≤ 3 | "Sellers won, start to finish" | green-vs-red, short, stop-loss, bear pole | doji, wick lessons | red = "broken/bad" instead of *sellers won* | mirror of G1 — equal visual weight to G1 so red isn't "weaker" |
| **T1** | Trend Step | ▲/▼ body 12–16, wicks ≤ 4 | one confident stair-step | uptrend, downtrend, HH/HL, trendline, htf | momentum (too small), doji | stairs read as noise if steps vary wildly | uniform-ish steps; overlap ≤ 30% |
| **P1** | Pullback / Rest | body 8–10 **against** the prior move, wicks ≤ 3 | "a short rest, not a crash" | pullback, flags, htf "just a dip" | reversal, momentum | small red after green = "it's crashing!" | ≤ 0.5× the push; 1–2 of them max |
| **M1** | Momentum | ▲ HERO 30–40 after 2–4 drift candles (body ≤ 6…— use D-drift) | "buyers just took control" | momentum, confirmation, breakout, pole | doji, rest | can't tell which candle "is" the momentum | ≥ 3× the drift bodies before it |
| **C1** | Confirmation | ▲ HERO 26–36 whose **close** clears the last swing high by ≥ 8 | "the setup proved itself — enter here" | confirmation, BOS | first-candle lessons | confuses any green candle with confirmation | the close must clear the line by ≥ 8 units, visibly |
| **B1** | Breakout | = C1 vs a drawn level | "closed through the ceiling" | BOS, breakout, fake (as contrast) | support-bounce | wick-through = breakout (it isn't) | body, not wick, crosses the level |
| **V1** | Reversal / Engulfing | HERO 24–32 opposite-colour body fully covering prior body ≥ 2× | "the other side just took over" | reversal, ChoCh, H&S neckline break | continuation | reads as "just another candle" if not engulfing | 2nd body ≥ 2× 1st, opposite colour, engulfs visibly |
| **D1** | Doji | body ≤ 1.5 at mid-range, wicks 10–14 **each**, roughly equal | "a tie — nobody won; the trend may turn" | doji, indecision, exhaustion | any "who won" lesson | tiny ≠ tie unless wicks are LONG both ways | cross shape unmistakable: wicks ≥ 8× body |
| **H1** | Hammer | body 6–9 at the **top** of range, lower wick ≥ 2.5× body, upper ≤ 2 | "sellers pushed down, buyers slammed it back" | hammer, lower-wick defense, trade_win "dipped-held" | doji (has direction!) | hammer vs doji confusion | lower wick ≥ 18 units on a hero-slot candle |
| **S1** | Shooting Star | body 6–9 at the **bottom**, upper wick ≥ 2.5× body | "buyers reached, sellers rejected" | shooting star, upper-wick rejection, sfp, fake | support lessons | "long top wick = strong up" | upper wick ≥ 18 units |
| **W1** | Long Upper Wick | any body 8–14 + upper wick ≥ 2× body | rejection of higher prices | resistance, sweep, sfp, exhaustion | breakout | wick read as achievement, not rejection | wick visibly ≥ 2× ITS body and ≥ neighbours' wicks ×2 |
| **W2** | Long Lower Wick | mirror of W1 | defense of lower prices | support, hammer contexts | breakdown | "long tail = falling" | mirror W1 |
| **X1** | Exhaustion | body 4–7 (small, same colour as trend) + upper wick ≥ 2× body, **after** ≥ 3 T1 steps | "the push is running out of breath" | exhaustion, ChoCh setup, take-profit timing | momentum | small green = "still going up fine" | shrink bodies 3-step sequence into it |
| **I1** | Inside Candle | body 6–9, entire h–l **inside** prior candle's h–l by ≥ 4 each side | "the market paused inside yesterday's fight" | inside bar, rest, pre-breakout coil | trend lessons | reads as random small candle | prior candle HERO so containment is obvious |
| **O1** | Outside Candle | body 20–30, h–l **beyond** prior h–l by ≥ 5 each side | "one candle swallowed the whole last fight" | outside bar, volatility, reversal | calm-trend lessons | reads as just "a big candle" | prior candle STANDARD, this one ≥ 2× |
| **Dr** | Drift (context) | body 3–6, wicks ≤ 3, alternating slight ▲/▼ | "nothing much happening" (sets up M1/B1) | as CONTEXT ONLY before momentum/breakout | never the focal candle | — | must NOT read as doji (keep body ≥ 3 and wicks short) |

**Spacing / count rules for composed scenes** (inherited, restated for authors):
6–10 candles per scene (1–5 in focus sub-mode); ≤ 3 near-equal bodies in a row; no A-B-A-B
wallpaper; the focal candle sits in the readable centre band (indices n·0.4–n·0.8 of the frame,
never candle 0); annotations/glyphs land on the focal candle only.

**Contrast & colour** (inherited): bodies only ever `COLOR` bull/bear/doji; labels never gold
`#ffd60a`/orange on candle-meaning duty (gold = boss/portal); direction never colour-only —
scenes keep ▲/▼/DOJI text tags on the focal candle.

**Animation** (inherited, engine-fixed): candles print left→right (0.26s/candle), annotations
ease in at authored `at` times ≥ 0.3s after their candle prints; sweep wicks extend late
(`sweep:true`) so the "spike then fail" is *felt*. Library rule: the focal candle's annotation
fires **last**, after the eye has the context.

## 4. Composition recipes (how lessons quote the vocabulary)

- **green-vs-red first lesson:** G1 + R1 alternation only — no mid-size candles, no long wicks.
  A child must be able to point at "the strong green one" instantly.
- **momentum:** 3–4 × Dr → M1. Nothing else.
- **pullback:** G1(push) → 2 × P1 → (optional G1 resume). The rest is *visibly* smaller than the push.
- **confirmation:** Dr/G1 push → P1 P1 → C1 clearing the marked line.
- **doji:** 2–3 × T1 climbing → D1. The tie stands out against confident steps.
- **support/resistance:** T1s bouncing with W2/W1 wicks **touching the same line** (± ≤ 1 unit) 3×.
- **BOS / fake:** structure high marked → B1 body-through (BOS) vs S1 wick-through-close-back (fake).
- **hammer / star / wick lessons:** 2 × T1 context + the wick archetype as focal.

## 5. Acceptance test (per scene, before ship)

1. Hide every label. Five seconds. Can a first-timer answer: *who won? where's the important
   candle? bigger or smaller than its neighbours? tie or a win?*
2. Every directional body ≥ 8 units (≥ SMALL class); only authored DOJIs below.
3. Focal ≥ 2× median context (law: 1.3×). Relational ≥ 2.5× (law: 1.5×).
4. The caption describes exactly what the picture shows — no more, no less.
5. Annotation indices still point at the intended candles.

---
*Changes to geometry/colour law belong to the Constitution via ADR — never to this file. This
library may add archetypes (content) without re-ratification, provided every archetype passes
the Constitution's floors.*
