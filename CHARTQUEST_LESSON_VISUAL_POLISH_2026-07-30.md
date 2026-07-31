# ChartQuest — Lesson Visual Polish Pass
**Date:** 2026-07-30 · **Scope:** every educational annotation surface · **Style:** SOFT SCRIM (founder pick)
**Status:** IMPLEMENTED · verified across 15 canvas widths · gated · awaiting founder playtest

---

## 1. Where this started

The founder scored the Knowledge card for **"Short" 2/10**: `SELLERS TAKE OVER` was drawn through
three red candles in red text; `SHORT WINS ↓` had its own leader struck through the words.

That was not one badly-authored scene. Every label in the LessonChart engine was placed at a
**fixed pixel offset from its candle, unmeasured and collision-blind** — it clamped to the canvas
edge and nothing else. Any label wider than its slot landed on the chart. 33 scenes were waiting to
break. Four separate bugs came out of that same line of reasoning:

| Defect | Evidence |
|---|---|
| Tags had no backing and no obstacle test | `SELLERS TAKE OVER` ≈130px wide in a 43px slot |
| `sweepFlag` had **no edge clamp at all** | `SFP → swept the high…` ran ~50px **off-canvas** at 320px |
| `bosFlag` measured its width **in the wrong font**, then double-centred against a magic `-46` | `BOS · closes above` landed **~100px** from its candle |
| Later annotations painted **over** earlier labels | `rr`: the ENTRY line struck through `1R RISK` |

## 2. Style: three built, one chosen

A first pass used a bordered plate with a coloured accent bar. The founder's verdict: the boxes and
the little green/red line were too heavy. Three alternatives were built **on the real engine** (not
mockups) and compared on the `confirmation` lesson plus the hardest scene (`short`):

- **A · Pure type** — no chrome at all, dark halo only
- **B · Underline** — haloed text over an accent rule
- **C · Soft scrim** — a soft dark wash, no border, no bar ← **chosen**

**Soft scrim is now the single style for every educational label in the game.** The losing styles
and the whole style-switch mechanism were deleted rather than left as dead code.

## 3. The seven criteria

### 1 · No text ever touches a candle
Placement enforces a **positive clearance** (`CLR = 4px`), not merely "doesn't overlap". The audit
asserts a real gap and reports the tightest one in the whole product.
**Measured worst case across all scenes and all widths: 3.0px. Never zero, never negative.**

### 2 · No text overlaps candles, other words, or other objects
The solver treats candles and already-placed labels as **hard** obstacles, and zone rectangles
(order block, risk/reward bands) plus the shell's `+5` reward float as **soft** obstacles — avoided
when possible, never allowed to strand a label. Geometry and labels render in **two passes**, so no
line or zone edge can ever paint over text again.

### 3 · Text always visible and clearly identifies its target
White text on a near-opaque scrim is legible over any candle. Every anchored label carries an arrow
to the exact thing it names. **91 labels · 65 arrows** (the other 26 are level labels that ride *on*
their own line, where the line itself is the connection — they only grow a connector when pushed off
it, and a stray 8px stub on `support` was fixed by testing whether the line passes through the plate
rather than testing the plate's centre).

### 4 · Arrows from term to candle are visible
The connector is now a real **arrow** — a shaft leaving the label's edge and a solid head landing on
the candle, stopping just short so it points *at* the target rather than into it. Previously a
hairline with a dot.

### 5 · Clean and organised
One style, one type scale, two tiers (focal / quiet). Colour left the text entirely and lives in the
arrow, so bull/bear still reads instantly and **never rests on colour alone** (Accessibility Law,
TES v1.1). `HL`'s long-standing reserved-gold violation is gone.

### 6 · Optimised for beginner learning
Long labels **wrap** rather than run. Most were authored as `TERM · explanation`, so the break is
free and meaningful — `EQUAL HIGHS / stop losses sit above`, `SFP / swept the high, closed back`.
Two short lines are faster to read than one long one. Labels prefer the chart's dead space, so the
eye goes to the candle first and the words second.

### 7 · Optimised for mobile
**Measured, not assumed:** on a 320px viewport — the narrowest real phone — the actual lesson canvas
is **283px**. Type is *responsive upward*: a phone gets **13/12px**, never a shrunken size. Where a
label cannot fit, a **graceful degradation ladder** runs — natural size → force a wrap → drop a type
tier → least-covering position — every rung still measured and collision-tested.

## 4. Verification

`scripts/lesson_visual_harness.py` regenerates the audit page **from chart-quest.html itself**, and
`window.__audit()` reads the layout the engine actually solved plus the obstacle list it actually
used. This tests shipped code, not a re-implementation.

```
33 scenes · 91 labels · 65 arrows
widths: 240 260 270 283 300 320 342 360 375 390 414 430 480 560 640
        → 0 failures at every width · min candle gap ≥ 3.0px
```

**A correction worth recording.** My earlier report claimed "0 failures at 260–640px". That claim
was false. The sweep set the canvas CSS width and waited for the animation loop to re-measure — but
rAF is throttled while the pane is hidden, so every "width" re-measured the *same* 342px layout. The
harness now drives a synchronous `redraw()` instead of trusting the loop. The moment the sweep became
real it found **real failures at 240, 260, 280 and 430px** that the broken sweep had hidden. Those
are the failures fixed in §3. A verification harness that cannot fail is worth nothing.

## 5. Gate #15 — so it cannot come back

`scripts/lesson_label_gate.js` (verify check 15) asserts the solver+scrim layer exists, the render is
two-pass, `pill()` stays retired, no annotation writes a label with a raw `fillText`, and — added
with this pass — that wrapping, the arrowhead, the clearance constant, the least-bad fallback and
the responsive type scale are all still present, and that the bordered plate has not returned.

**Negative-tested twice:** collapsing the label pass into the geometry pass, and stripping the
arrowhead, each make it fail with the correct message. Restoring makes it pass.

**Gate #12 note.** The candle-language gate fired on this work because it counts every `roundRect(`
as "someone rounded a candle". Re-baselining would have raised the ceiling for *real* rounded-candle
regressions too, so instead the gate now measures what it means: a line opts out only with an
explicit `CQ-LABEL-CHROME` marker. **Baseline stayed at 4; the ratchet is intact.**

## 6. Surfaces covered

`LessonChart` is the single engine behind intro lessons, boss-round lesson intros, Journal term
cards, **Knowledge cards**, concept practice, and all 11 Hour lessons — fixing the engine fixed all
of them. The **Journal trade-review chart** (`tradeChartSVGFull`) had the identical disease (raw
colour-on-chart level text; "pills" at 18–20% alpha so candles showed through the words) and now
speaks the same language: soft scrim, haloed white text, arrows, solver-placed, deferred to a label
pass so nothing lands under a candle. Finn is registered as an obstacle there.

## 7. Two follow-ups — DONE (founder approved both, 2026-07-30)

- **`drawPersistentTeach` type bumped 7/9px → 9/12px.** SHOT 8 had shrunk this card ~22%; the
  founder reversed that call. Header 9px mono, body 12px sans, leading 12→15, card padding and top
  offset adjusted to match. Every dimension is still derived from `measureText`, so the chip sizes
  itself — it just breathes. Verified on a 390px viewport: both lines comfortably legible where 9px
  was squinting. Card top y80 still clears the faction badge (y51–69).
- **The static `im*` diagram family DELETED — 115 lines.** `IM_UP`/`IM_DN`, `imWk`/`imDashed`/
  `imLbl`/`imTg`/`imArr`, `_imYmap`/`_imCdl`, and `imDrawAnatomy`/`Doji`/`WaitClose`/`LongShort`/
  `SR`/`Trendline`/`Structure`. All were reachable only if `LessonChart.mount` threw — and all 11
  `IM_DIAGRAM_SCENE` keys map to real scenes, so `hasLC` is always true. It was dead, and it carried
  its own bugs (9px labels; `long wicks` clipped off a 320px canvas).
  The fallback now **degrades to the lesson's text** and hides the canvas, rather than drawing a
  cramped diagram nobody could read — never a blank rectangle where a diagram should be.
  **Unexpected bonus:** gate #12 dropped from 314 to **300** — the dead code was carrying 14
  instances of candle-language divergence (inline palette hexes, `boxCandles` colour forks, retired
  wick tints). Deleting it converged the Constitution ratchet by 14 without touching live code.

## 7b. Still not changed, and why

- **`drawCandleAcademy`** — 7 font sizes; `GREEN`/`RED` are coloured text above coloured candles.
  Inspected and left: full-screen scripted intro, labels sit on empty background, and the *words*
  carry the meaning so it is not colour-alone. Only nit is asymmetric offsets (−26 vs −18).
- **Scene captions and label wording** — untouched by design. This pass moved pixels only.
- **`BUILD_TAG` / `sw.js`** — untouched. Build 302's changelog is uncommitted work in flight from
  another session. No staleness risk: the service worker is **network-first for HTML**. Bump both at
  release.

## 8. Next steps

1. **Playtest the Knowledge cards first** — `Short`, `wait_close`, `rr`, `bos`, `sfp` were the worst
   offenders and are the fastest read on whether this lands.
2. `svgPlateW` estimates text width arithmetically (`chars × fs × 0.64`) because SVG strings are
   built without a measurement context. It is deliberately generous — plates run slightly roomy
   rather than clipping — but a genuinely long *new* review-chart label should be eyeballed once.
3. Regenerate the audit page after any LessonChart edit:
   `python3 scripts/lesson_visual_harness.py`

---

**Files touched:** `chart-quest.html` (mirrored byte-identical to `index.html` and
`website/game.html`), `scripts/lesson_label_gate.js` *(new)*, `scripts/lesson_visual_harness.py`
*(new)*, `scripts/verify.js`, `scripts/candle_language_gate.js`, `.claude/launch.json`, `.gitignore`
**Gate status:** 15 pass · 0 fail · 0 warn · 1 skip (3b headless boot — puppeteer not installed)
