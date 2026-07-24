> **STATUS: RATIFIED** — ChartQuest Architecture v1.0 · Ratified 2026-07-15
> **Do not modify directly.** Part of the official ChartQuest ratified architecture. Changes require an ADR, migration notes, approval, and re-ratification — see `docs/architecture-ratified/ARCHITECTURE_CHANGE_POLICY.md`.

# ChartQuest Visual Market Constitution

**Status: PERMANENT — highest authority for every visual market representation in ChartQuest.**
**Ratified: 2026-07-15**

*This document governs the visual layer only. On trade truth and causality, `docs/canon/trading_canon.md` and `CHARTQUEST_TRADING_EXPERIENCE_SYSTEM_v1.1.md` remain supreme. Where the code and this document disagree, the code is wrong.*

---

## Table of Contents

1. [Preamble](#preamble)
2. [Document Authority & Precedence](#document-authority--precedence)
3. [Core Design Philosophy](#core-design-philosophy)
4. [Educational First Principle](#educational-first-principle)
5. [Educational Philosophy — Design For A Ten-Year-Old](#educational-philosophy--design-for-a-ten-year-old)
6. [Readability Laws](#readability-laws)
7. [Candle Standards](#candle-standards)
8. [Candle Scaling Standards](#candle-scaling-standards)
9. [Wick Standards](#wick-standards)
10. [Body Width Standards](#body-width-standards)
11. [Minimum and Maximum Body Height](#minimum-and-maximum-body-height)
12. [Minimum Visible Movement](#minimum-visible-movement)
13. [Color Standards](#color-standards)
14. [Contrast Rules](#contrast-rules)
15. [Spacing Rules](#spacing-rules)
16. [Zoom Rules](#zoom-rules)
17. [Camera Rules](#camera-rules)
18. [Platforming Rules](#platforming-rules)
19. [Chart Rhythm Rules](#chart-rhythm-rules)
20. [Game-Feel Invariants](#game-feel-invariants)
21. [The Platformer Constitution](#the-platformer-constitution)
22. [The Three Chart Types](#the-three-chart-types)
    - [Type A — Educational Illustration](#type-a--educational-illustration)
    - [Type B — Gameplay Pattern](#type-b--gameplay-pattern)
    - [Type C — Challenge Chart](#type-c--challenge-chart)
    - [The Readability Floor — Never Relaxed for Any Type](#the-readability-floor--never-relaxed-for-any-type)
23. [Educational Illustration Rules](#educational-illustration-rules)
24. [Gameplay Chart Rules](#gameplay-chart-rules)
25. [Replay Rules](#replay-rules)
26. [Notebook Rules](#notebook-rules)
27. [Boss Chart Rules](#boss-chart-rules)
28. [Pattern Library Standards](#pattern-library-standards)
29. [Pattern Library Specification](#pattern-library-specification)
30. [Lesson Standards](#lesson-standards)
31. [Trade Standards](#trade-standards)
32. [Difficulty Standards](#difficulty-standards)
33. [Forbidden Candle Configurations](#forbidden-candle-configurations)
34. [Forbidden Chart Configurations](#forbidden-chart-configurations)
35. [Accessibility Standards](#accessibility-standards)
36. [Mobile Readability Standards](#mobile-readability-standards)
37. [QA Checklist](#qa-checklist)
38. [Automated Validation Rules](#automated-validation-rules)
39. [Appendix A — Standards Table (Single Source of Truth)](#appendix-a--standards-table-single-source-of-truth)
40. [Appendix B — Ratification & Adversarial Review Log](#appendix-b--ratification--adversarial-review-log)

---

## Preamble

This is a constitution, not a suggestion.

For roughly the last two years, ChartQuest has carried a single root architectural bug: the candle — the atom of everything the player learns, walks on, and is examined against — has no owner. Nine or more independent draw paths each invent their own version of it. The gameplay world draws one candle (`drawGameplayCandle`, chart-quest.html:12852), the prediction illustration draws another with a hard-coded 44px body (`drawPredictionCandle`, :16521), the lesson card draws a third (:15613), the mini-panel a fourth (:14344), the boss SVG a fifth (`bossCandleSVG`, :9273), the trader-view a sixth (:13962), the style-LOCKED LessonChart engine a seventh (`LessonChart`, :19290), `drawQuizCandle` an eighth (:16319), and the harness a ninth. Each picks its own body width, its own corner radius, its own edge, its own wick, and its own doji floor. The consequence is that a candle literally changes shape, size, and colour depending on which screen a ten-year-old is looking at — and every new lesson that ships invents new proportions, deepening the fork.

This document ends that. It is the **single ratified Standards Table** for how a candle is drawn anywhere in ChartQuest. It nominates the style-LOCKED LessonChart engine (`LessonChart`, chart-quest.html:19290, graded "10/10", mirrored by `lesson-chart-preview.html`) as the *proportion* source of truth: its **0.72-of-slot** readable body proportion and its **sharp, radius-0** body become law. From here forward, no section of this constitution, and no line of code, may invent a candle number. Every draw path consumes the governing formula defined here and cites this document.

**One honest correction to the original thesis.** An earlier draft promised "a candle never changes size between screens." That over-claimed, and the adversarial review was right to reject it: because the target visible-candle count differs per context (an illustration frames 6–10 candles, the world frames 12, an exam frames up to 14), the *slot* differs, so the same bull candle is legitimately a different pixel size in a lesson, the world, and an exam. What this constitution actually guarantees is stronger and true: **one governing formula, one palette, one shape, and one set of readability floors** — *formula consistency and shape consistency*, not identical pixel dimensions. A candle is always recognisably the same object; it is sized to its context by a rule every path shares.

This constitution is written to stand for **approximately ten years**. It is written for two readers at once: a ten-year-old who must understand a candle by *looking* at it, and a future AI or developer who must be able to audit any pixel back to a governing rule. Its numbers are not preferences; they are law with a stated rationale and a code citation.

**If the code and this document ever disagree, the code is wrong.** A draw path that renders a 15px "flat" body, a 5px rounded corner, or a gold doji is not an alternative interpretation — it is a defect to be brought into conformance. Conformance is one-directional: the code is corrected to the constitution, never the reverse. Amending this document is a deliberate, ratified act; drifting from it in code is not.

## Document Authority & Precedence

This constitution governs the **visual layer** — the geometry, colour, contrast, camera, feel, and readability of the candle and the chart it lives in. It does not govern trade truth. It **extends**, and never replaces, the two supreme trade-truth authorities:

- **`docs/canon/trading_canon.md`** — the permanent, target-state source of truth for trading causality: what a candle *means*, what makes an outcome honest, and how evidence maps to result.
- **`CHARTQUEST_TRADING_EXPERIENCE_SYSTEM_v1.1.md`** — the ratified trading constitution, including the **Accessibility Law** (direction is never conveyed by hue alone).

**Precedence is explicit and non-negotiable:**

1. On any question of **trade truth or causality** — whether an outcome is fair, what a pattern predicts, how a scenario resolves — those two documents are **supreme**. This constitution is silent there and defers completely. A visual rule may never bend a trade outcome, reveal a hidden result, or imply causality the trade-truth canon does not sanction.
2. On any question of **how a candle is drawn** — width, height, corner, edge, wick, doji band, colour, contrast, camera motion, game feel, platformer rhythm — **this document governs**, and every other file cites it.
3. Where the two layers meet — for example, the Accessibility Law's demand that direction never be colour-only — this constitution **implements** the higher law in concrete pixels (sheen position, glyph, edge) rather than restating or overriding it.

### Citations are symbol-anchored, not line-anchored

Every code citation in this document is a **(symbol, line)** pair — for example, `drawGameplayCandle` (:12852) or `CFG.minBody` (:2332). **The symbol is authoritative; the line number is advisory** and will drift on the first edit. This closes the maintainability trap the review flagged: a ten-year constitution must not rest its proof on the single most fragile reference that exists. Two enforcement hooks make the symbol anchors real:

- **Grep signature.** Each cited symbol carries enough surrounding token context that a content search relocates it after a refactor.
- **CI resolution check.** A build step asserts every cited symbol still resolves in `chart-quest.html`; when a citation goes stale, the build fails so the document cannot silently drift from the code it governs. The visual-systems maintainer owns this check (see [Automated Validation Rules](#automated-validation-rules) → *Enforcement, ownership, and the runtime layer*).

### Reserved portal colours

This constitution inherits, and must never collide with, the **reserved portal colours** defined in `docs/canon/ui_canon.md`. These four hues carry fixed navigational meaning and are forbidden as candle-body colours:

| Reserved hue | Value | Meaning |
|---|---|---|
| Purple | `#a855f7` | Lesson |
| Blue | `#4cc3ff` | Trade |
| Gold | `#ffd60a` | Boss |
| Orange | `#ff9f43` | Boss |

A candle body is never purple, blue, gold, or orange. This directly retires the quiz doji drawn in reserved gold `#ffd60a` (`drawQuizCandle`, :16327), which collided with portal semantics; the ratified doji is neutral `#b8c0cc`. Gameplay hazard wicks (spin-pole `#7fd6ff`, sweep `#ff7a45`) are deliberately kept *distinct* from portal blue `#4cc3ff`, and that separation is itself a governed rule, not a coincidence.

The single colour authority for everything in this document is the global **`COLOR` object (`COLOR`, chart-quest.html:2412)**. Inline literals in the boss SVG, the LessonChart engine's private palette, and the card edge hexes are all retired into it. There is one palette, and it lives in one place.

## Core Design Philosophy

ChartQuest teaches candlestick reading to a ten-year-old by making candles into a world they can walk through. That premise creates three obligations the visual layer must honour simultaneously, in this priority order:

1. **Legible before beautiful.** A candle's first job is to be understood at a glance. Polish — sheen, jitter, motion — is added only on top of a shape that already reads. A gorgeous candle nobody can parse is a failed candle.
2. **Consistent before clever.** The same concept must look the same everywhere. A bull candle in a lesson, in the gameplay world, and in a boss exam must be recognisably one thing. Novelty in candle proportions is prohibited; novelty belongs in *scenarios*, not in *shapes*.
3. **Honest before flattering.** The visual layer never lies to make a trade feel better. It does not hide a loss, inflate a win, or encode an outcome in a way the trade-truth canon has not authorised. Sheen, colour, and motion describe what *is*, not what we wish the player felt. In particular, **magnitude is drawn honestly**: a bigger price move is a taller body, and the ordering of moves is preserved even where floors and caps apply (see [Minimum Visible Movement](#minimum-visible-movement) → *Order preservation*).

Three chart types exist, and the constitution grants each a bounded license to exaggerate while holding a shared readability floor beneath all of them:

- **Type A — Educational Illustration.** Exaggerated and authored. Everything is amplified so the move reads instantly. Minimum body **24px**; readable body width **32–56px** on desktop.
- **Type B — Gameplay Pattern.** Candles *are* terrain — a continuous, walkable road. Readable, fun, curated. Minimum body **18px** (16px phone); target **12** candles on screen.
- **Type C — Challenge / Boss.** The knowledge exam. May be realistic; exaggeration ramps to off, but the readability floor still holds. Body down to **14px** (12px phone); density up to **14** candles.

Across all three, a fixed set of guarantees never relaxes: a non-doji body never falls below the hard floor (**14px desktop / 12px phone**), a **1px neutral separator** is drawn wherever opposite-direction candles touch, a non-colour direction cue is always present, body-versus-background contrast is always **≥ 3:1**, a doji appears only where realism or authoring makes it a doji, corners are always radius **0**, and **no section invents a number**.

## Educational First Principle

ChartQuest is a teaching instrument first and a game second. The binding learning loop is **LEARN → PRACTICE → APPLY → TEST**, with **at least three trades per level before a boss**, and the iron rule that the game **never tests the untaught**. The visual layer serves that loop and is subordinate to it — and, per the adversarial review, that subordination is now **machine-enforced**, not merely asserted in prose (see [Automated Validation Rules](#automated-validation-rules), pedagogical validators V-46–V-48).

This yields a first principle the rest of the constitution enforces:

> **Every visual choice must make the correct lesson easier to see, and must never make a wrong lesson easier to believe.**

Concretely, the visual layer must not manufacture a pattern the scenario did not author (procedural generation that violates educational intent is a known, catalogued failure), must not let an *accidental* candle masquerade as a *taught* one (an accidental flat body reading as a doji is the same failure the ratified 18px floor exists to kill), must not flatten the *relationship* a concept depends on (an engulfing candle must visibly engulf), and must not encode meaning in a channel a colour-blind or young reader cannot perceive. When teaching clarity and visual realism conflict, in Type A and Type B **clarity wins** — that is precisely why exaggeration is licensed. Realism is a relaxation granted to Type C, and even there it yields to the readability floor and to honest magnitude ordering.

## Educational Philosophy — Design For A Ten-Year-Old

The end player is ten years old. Everything downstream follows from taking that literally.

**A candle must be understood by looking, before any word is read.** Text is a caption on a picture that already communicates, never the crutch that makes a broken picture legible. The direction of a move, the difference between a strong candle and a hesitant one, the fact that two candles disagree — all of this must arrive through *shape, size, sheen position, and edge*, in the first glance, before the player parses a single label.

From this comes the constitution's sharpest test:

> **If a candle needs an explanation to be understood, the candle failed — not the child.**

A ten-year-old reads *magnitude by size*, *direction by where the light sits*, and *difference by contrast* — not by decoding a hue or reading a number. So the visual grammar is built from those primitives: a bigger move is a taller body; a bull candle carries its bright sheen (`#5dedb5`) on its **top** edge and, in labelled contexts, a **▲**; a bear candle carries its darker sheen (`#f3838a`) on its **bottom** edge and a **▼**; a doji is a **cross** labelled "DOJI". A hue-blind reader must be able to name every candle correctly using sheen *position*, glyph, and edge alone — never colour.

**Comprehension is measured, not asserted.** An earlier draft claimed illustrations make a concept "impossible to misunderstand." No visual can guarantee that, and nothing in a geometry spec proves it. This constitution replaces the boast with a testable standard: a Type-A illustration is authored so that **a first-time ten-year-old, shown the chart with labels hidden, names the concept correctly at ≥ 90%** in playtest (see [QA Checklist](#qa-checklist) → *Human Playtest Gate*). Comprehension is evidenced, not promised.

The same standard governs language elsewhere in ChartQuest — all game text is worded for a ten-year-old — and the visual layer must match that reading age. A candle that only an adult chart-reader would recognise is, for this product, an unreadable candle.

## Readability Laws

The following laws are numbered, testable, and absolute. Every value is drawn from the ratified spine ([Appendix A](#appendix-a--standards-table-single-source-of-truth)); later sections define the full formulas, but no later section may weaken a floor stated here. Each law is written so that a reviewer — human or AI — can render a candle, measure it, and return a binary pass/fail.

**All pixel thresholds in this document are CSS reference pixels** (device-independent), measured *before* `devicePixelRatio` scaling. An "18px body" means 18 CSS px; on a 2× display its backing store is 36 device px, but the law is stated and measured in CSS px. This removes the unit ambiguity the review flagged, where a validator could "pass" a body the child sees as a stub.

1. **Understand-by-looking.** Every candle must be identifiable — direction, relative magnitude, and doji-vs-directional — with all text hidden. *Test:* strip labels; a first-time viewer names each candle correctly (formalised as the ≥ 90% Human Playtest Gate).

2. **Minimum visible directional body.** Any candle authored/read as directional (not a doji) renders at **≥ 18px on desktop / ≥ 16px on phone**, snapping *up* when the mapped price delta is smaller, and never below the hard floor of **14px desktop / 12px phone**. *Test:* no non-doji body measures under 18px (16px phone). This directly retires `CFG.minBody = 15` (:2332), the documented cause of "candles too flat."

3. **Order-preserving magnitude.** Snapping and capping never reorder moves: within one chart, if `|delta(A)| > |delta(B)|` then `bodyH(A) ≥ bodyH(B)`. The floor and the 55% cap are applied by a **monotonic remap of the whole price-to-pixel scale**, not by clamping each candle independently. *Test:* sort on-screen candles by `|delta|`; body heights are non-decreasing.

4. **Median clarity.** In gameplay, the **median** visible body across the on-screen window is **≥ 60px**, so a candle at the 18px floor reads as clearly *smaller* (≤ 0.3 × median) than a normal move rather than equal to it. *Test:* median on-screen body ≥ 60px; every floored candle ≤ 0.3 × median.

5. **Doji is a doji only when it is one.** A body in the **2–4px** band exists only where the candle is genuinely a doji — *authored* as one in Types A and B, or, in Type C, where the realistic price delta itself lands in the doji band. It is drawn as a cross with a "DOJI" label in neutral `#b8c0cc`, never in gold, never as an accidental hairline. *Test:* every 2–4px body is a legitimate doji (authored in A/B, or realism-driven in C); no *directional* candle lands in that band.

6. **One governing body width.** Body width is `round( clamp( slot × WIDTH_RATIO[type], BW_MIN, BW_MAX ) )`, where `slot = usableChartWidth / targetVisibleCount`, `WIDTH_RATIO = 0.72` for the readable illustration/exam types (A, C) and `1.0` for the continuous walkable road (B). *Test:* every draw path produces this value; the retired constants — 44 (:16521), 32 (:15613), 14 (:14344), the `candleW` clamp[24,56] (:3257) — appear nowhere.

7. **Sharp corners, everywhere.** Corner radius is **0** for all three chart types, because bodies are walkable platforms in gameplay and both 10/10 references (gameplay :12912, engine :19301) are radius 0. *Test:* no candle uses radius 1.5, 3, or 5 (retiring :9284, :15623, :16540).

8. **Mandatory neutral separator on opposite touch.** Wherever an opposite-direction candle is adjacent, a **1px neutral separator** (`#05070a`) is drawn — because bull `#16c784` versus bear `#ea3943` luminance contrast is **1.85:1**, and even the same-hue edge strokes fail to reach 3:1 against both neighbours. The separator is chosen to clear **≥ 3:1 against both** touching bodies, so it — not colour, and not a same-hue edge — carries the boundary. *Test:* every opposite-direction junction shows the neutral separator, and its contrast against each neighbour ≥ 3:1.

9. **Never colour-only (Accessibility Law).** Direction is always carried by at least one non-colour channel. In labelled contexts (Types A and C): **top sheen + ▲** for bull, **bottom shadow + ▼** for bear, **cross + "DOJI"** for a doji. In gameplay (Type B): **sheen position + opposite-edge inset + separator**, plus a **▲/▼ glyph on bodies ≥ 28px wide**. *Test:* a greyscale render of any chart still communicates every candle's direction (machine greyscale-separability check).

10. **Body-vs-background contrast.** Every candle body clears **≥ 3:1** against background `#0a0e14`, targeting **4.5:1**; bull `#16c784` (8.8:1) and bear `#ea3943` (4.76:1) both pass. *Test:* measured contrast ratio ≥ 3:1 for every body.

11. **Wick reads as structure, not direction.** The wick is neutral `#c9d1d9` at `clamp( bodyW × 0.05, 1.6, 3.0 )` px (default 1.6px), where the **1.6px floor wins** whenever it would exceed 8% of a sub-20px body. A wick shorter than **6px is not drawn** in illustration/exam contexts (a wickless candle is authored, not accidental); in gameplay the drawn wick is **0 (authored wickless) or ≥ 28px** (see [Wick Standards](#wick-standards)). Cyan `#7fd6ff` and orange `#ff7a45` wicks are *only* hazard mechanics, never direction. *Test:* no wick carries a bull/bear hue; none violates the length precedence for its type.

12. **No draw path invents a number.** Every candle-drawing site consumes the governing formulas and cites this document; the sole colour source is `COLOR` (:2412). *Test:* grep finds no inline candle geometry constant and no inline colour literal outside `COLOR`.

## Candle Standards

Every candle in ChartQuest is drawn by **one** law, no matter which screen renders it. Before this table there were nine-plus independent draw paths — gameplay (`drawGameplayCandle`, :12852), prediction (:16521), card (:15613), mini-panel (:14344), boss SVG (`bossCandleSVG`, :9273), trader-view (:13962), the LessonChart engine (:19290), `drawQuizCandle` (:16319), and the harness — each inventing its own body width, corner radius, edge, wick, and doji floor. That is the root architectural bug. This section ends it: no draw path may invent a number; every path consumes the governing formula and cites this document.

A candle has four parts, and each has exactly one governing rule:

| Part | Governing rule | Value |
|---|---|---|
| **Body width** | `bodyW = round( clamp( slot * WIDTH_RATIO[type], BW_MIN, BW_MAX ) )` | ratio `0.72` (A, C) / `1.0` (B) |
| **Body height** | mapped from price by a monotonic scale, then floored to the minimum-visible band | `>= 18px` desktop / `16px` phone |
| **Corner radius** | SHARP rectangle for ALL three chart types | `0` |
| **Separator / edge** | 1px definition edge on every body; a 1px **neutral separator** (`#05070a`) is **mandatory** where an opposite-direction candle is adjacent | `1px` |

**Two width ratios, one formula.** The single governing formula is universal, but `WIDTH_RATIO` is type-dependent, and this is a deliberate fix to a geometry contradiction the review exposed. The style-LOCKED engine's `0.72` ratio was designed for a *gapped* illustration (bodies at `0.72 × slot`, gaps at `0.28 × slot`, tiling to exactly one slot). Forcing that gapped ratio onto Type B — which must be a **gapless, continuous walkable road** — would leave a `0.28 × slot` hole between every candle (≈ 8px at a 30px slot), a hole the `+1px` overlap cannot close and the platformer physics would drop Finn through. So the walkable road uses `WIDTH_RATIO = 1.0` (slot-filling, drawn with the `bw = c.w+1`, `bx = sx-0.5` bleed so tops fuse), while the readable illustration and exam types keep `0.72`. The formula is one; the ratio is chosen by the type's job.

The corner radius is `0` everywhere because a candle must never change *shape* between the lesson and the world — bodies are walkable platforms in gameplay, and both "10/10" reference paths (gameplay :12912, engine :19301) already draw radius `0`. This retires radius `1.5` (boss SVG :9284), `3` (card :15623), and `5` (prediction :16540).

**Resolving the 15-vs-44 inconsistency.** The two most-cited magic numbers — gameplay `minBody = 15` (a body *height* floor, `CFG.minBody` :2332) and educational `bodyW = 44` (a fixed body *width*, :16521) — were different dimensions invented in different paths, and together they are the clearest symptom of the root bug. **The one governing rule retires both as hardcoded literals.** Width is *always* derived from the slot, so `44` is no longer typed — it *emerges* (~44–56) for typical 6–8-candle educational scenes. Height is *always* mapped by a monotonic scale and floored, so `15` is retired and can never again make small moves look flat or accidentally doji-shaped. Neither number is a knob any longer; both are outputs of the table.

**The doji is a labelled special case — never an accident.** A doji is a *taught* concept (indecision). It is the only candle allowed inside the 2–4px body band. In Types A and B it appears **only where authored**; in Type C (realistic) a candle whose true delta lands in the band renders as a doji without a hand-flag (see [Type C](#type-c--challenge-chart)). In every case it carries a cross/plus shape, a `DOJI` label, and neutral `#b8c0cc`. No *directional* candle may fall into the 2–4px band. Full specification is in [Minimum Visible Movement](#minimum-visible-movement).

> **Validator:** `cornerRadiusPx = 0`, `separatorStrokePx = 1`, `separatorMandatoryOnOppositeTouch = true`, `separatorContrastVsBothBodiesMin = 3`, `bodyWidthRatioOfSlot_AC = 0.72`, `bodyWidthRatioOfSlot_B = 1.0`, `noInlineColourLiterals = true`.

## Candle Scaling Standards

All size flows from the **slot**:

```
usableChartWidth = canvasCssWidth - leftMargin - rightMargin      # explicit, defined below
slot             = usableChartWidth / targetVisibleCount
bodyW            = round( clamp( slot * WIDTH_RATIO[type], BW_MIN, BW_MAX ) )
```

`usableChartWidth` is defined precisely as the **canvas width in CSS px minus the left and right chart margins** — it is the horizontal space actually available to candles, before the inter-candle gap is subtracted from each slot. This definition is fixed so the derived `bodyW` is deterministic and auditable given a scene's authored `targetVisibleCount`.

**The margins are pinned, so the slot is fully determined.** `leftMargin` and `rightMargin` are **not** free-handed per scene — they are named constants of the layout. For the **full-bleed gameplay road (Type B)** both are **0**: the road runs edge to edge and the `bw = c.w + 1` bleed keeps it seamless. For the **framed illustration and exam charts (Types A and C)** both are `max(12px, 0.04 × canvasCssWidth)` — a symmetric gutter that also seats any price-axis label. With the margins pinned this way, `slot` — and therefore `bodyW` — is fully determined by the authored `targetVisibleCount` alone, which is exactly the auditability the governing rule promises (values recorded in [Appendix A.1](#a1-geometry)).

This single expression replaces the forked `candleW()` clamp `[24,56]` (:3257), the fixed `44` (:16521), the fixed `32` (:15613), the fixed `14` (:14344), `min(46, slot*0.5)` (:9279), `clamp(pitch-3, 5, 28)` (:13962), and the caller-passed `cw` (:16319). The `0.72` ratio is adopted from the style-LOCKED LessonChart engine `bw = min(48, slot*0.72)` (:19290) — **ratio adopted; the clamp cap is raised 48 → 56** to serve wider desktop illustration scenes. (This is a conscious change, not a "verbatim" copy; the earlier draft's "verbatim" claim was inaccurate and is corrected here.)

**Width is deterministic, size is per-context.** Because `targetVisibleCount` is a per-scene authored value, the same bull candle is a different pixel width in a 6-candle lesson than a 10-candle lesson — and that is correct. The invariant is that *given the authored count*, width is fully determined by the formula; nothing is free-handed. The clamp bounds `BW_MIN`/`BW_MAX` change per chart type and per viewport, but the ratio and the formula never do:

| Type | Purpose | `WIDTH_RATIO` | Desktop `BW_MIN`–`BW_MAX` | Phone (360) `BW_MIN`–`BW_MAX` | Target visible |
|---|---|---|---|---|---|
| **A — Educational** | Exaggerated illustration (gapped) | `0.72` | `32`–`56` | `24`–`48` | `6–10` (or `1–5` focus sub-mode) |
| **B — Gameplay** | Candles-as-terrain (continuous road) | `1.0` | `24`–`56` | `18`–`44` | `12` |
| **C — Challenge/Boss** | May be realistic (gapped) | `0.72` | `14`–`46` | `12`–`40` | `6–14` |

Type B requires **organic width jitter of ±4–8%** (`rand 0.92–1.08` around the base) — it is *mandatory*, not merely permitted, because zero-jitter terrain reads as synthetic wallpaper (see [Gameplay Chart Rules](#gameplay-chart-rules)); the `BW_MIN` floor still holds *after* jitter. Types A and C draw clean authored shapes (no jitter). Type A's sheen width is `bw * 0.16`. Height mapping in the gameplay world uses a monotonic scale (`pxPerPct = 1600` baseline) across world bounds `levelMin = 80px … levelMax = 700px`.

> **Validator:** `bodyWidthRatioOfSlot_AC = 0.72`, `bodyWidthRatioOfSlot_B = 1.0`, `bodyWidthMinPx = 12`, `bodyWidthMaxPx = 56`, `onscreenCandlesGameplayTarget = 12` (range `8`–`16`), `usableChartWidthDefined = true`.

## Wick Standards

The wick reads as *price structure*, not direction. One body-relative formula governs its width across every type, and the **absolute floor always wins**:

```
wickWidth = clamp( bodyW * 0.05, 1.6, 3.0 )   // default 1.6px; 1.6 floor overrides the 8% cap on sub-20px bodies
```

This unifies the five forked wick widths (`1.5 / 2 / 2.5 / 3px`) into one rule anchored on the engine's `1.6px` reference. The wick-to-body width guideline is roughly **1:16 to 1:27** for normal bodies, but on a narrow body (down to the 12–14px hard floor) the `1.6px` floor legitimately exceeds 8% — and that is intended, because a sub-1.6px wick is invisible. The effective ratio cap is therefore `max(0.08, 1.6 / bodyW)`, so the floor and the cap can never contradict each other (the review's unsatisfiable-pair bug is removed).

| Wick property | Value |
|---|---|
| Default width | `1.6px` |
| Width formula | `clamp(bodyW*0.05, 1.6, 3.0)` (floor wins) |
| Effective ratio cap | `max(0.08, 1.6/bodyW)` |
| Default colour | `#c9d1d9` (neutral grey, unified) |
| Minimum visible length (A / C) | `6px` (below this, not drawn) |
| Gameplay drawn length (B) | `0` (authored wickless) **or** `28`–`74px` |
| Pattern-candle exemption | authored hammer / doji / marubozu wicks map to true high/low, **exempt** from the `[28,74]` clamp |
| Hazard: spin-pole width / min length | `2.5px` / `26px` |
| Hazard: sweep width / length | `3px` / `160`–`260px` |

**Colour is neutral, always.** The default `#c9d1d9` retires the four forked conventions: body-coloured gameplay wicks, grey `2/2.5px` card/boss wicks, and the engine's `greenWick #1fd790` / `redWick #ff5663` (which never existed in the COLOR object). Cyan `#7fd6ff` (spin-pole) and orange `#ff7a45` (sweep) appear **only** as gameplay hazard mechanics.

**Length precedence, and honest shadows.** The review caught two wick faults, both fixed here. (1) The universal `< 6px → not drawn` rule and the gameplay `[28,74]` envelope disagreed in the `6–27px` range; the precedence is now explicit — **in Type B a drawn wick is either 0 (authored wickless) or ≥ 28px**, and the `6px` figure governs only the illustration/exam types. (2) A hard `[28,74]` clamp would fabricate or erase the very shadows the game teaches (a real hammer's long lower wick, a marubozu's absence of wick). Therefore **authored pattern candles whose lesson *is* the shadow — hammer, doji, shooting-star, marubozu — are exempt from the clamp and map their wick to the true high/low**, so the game never teaches a false shadow. This keeps "honest before flattering" intact.

**Structural wicks must not masquerade as hazards.** A tall inert wick and a cyan spin-pole are both vertical spikes; hue alone cannot separate them for a colour-blind child. So a structural wick is capped in gameplay so it never rivals the hazard-wick salience, and **hazard wicks carry a non-colour distinction** (an animated cap/glyph the inert wick never has). A wick tall enough to be mistaken for a mechanic must be flagged as one.

> **Validator:** `wickWidthMinPx = 1.6`, `wickWidthMaxPx = 3`, `wickRatioCapFormula = max(0.08, 1.6/bodyW)`, `minVisibleWickPx_AC = 6`, `gameplayWickZeroOrMinPx = 28`, `patternWickClampExempt = true`, `hazardWickHasNonColourCue = true`.

## Body Width Standards

Body width has exactly one source: `round( clamp( slot × WIDTH_RATIO[type], BW_MIN, BW_MAX ) )`. No path passes a fixed width, and no path passes its own `cw`. The `0.72`-of-slot readable proportion is the only style-LOCKED ratio in the codebase (engine :19290), which is why it becomes law for the illustration and exam types; the walkable road uses `1.0` for continuity (see [Candle Standards](#candle-standards)).

Retired width literals, and where they lived:

- `candleW()` clamp `[24, 56]` — `candleW` (:3257)
- fixed `44` (educational) — :16521
- fixed `32` (card) — :15613
- fixed `14` (mini-panel) — :14344
- `min(46, slot*0.5)` (boss SVG) — :9279
- `clamp(pitch-3, 5, 28)` (trader-view) — :13962
- caller-passed `cw` (quiz) — :16319

The absolute clamp envelope across all types is `12px` (Type C phone floor) up to `56px`. Per-type bounds are in [Candle Scaling Standards](#candle-scaling-standards). Type A's historical `44px` now lands as a *derived* value inside its `32–56` desktop band for typical 6–8-candle scenes — a coincidence of good scaling, not a magic number.

**Rounding headroom (Type A).** With `WIDTH_RATIO 0.72` and gap `0.28 × slot`, width + gap tile to exactly one slot — so any upward rounding, or the clamp raising width to `BW_MIN`, could push bodies into contact (the F-CH6a failure). To reserve headroom, the educational gap is computed from the **actual rounded body width**: `gap = max( slot - bodyW - 1, 0.20 × slot )`, guaranteeing at least a 1px channel plus room for the definition edge, so illustration candles never touch.

> **Validator:** `bodyWidthMinPx = 12`, `bodyWidthMaxPx = 56`, `bodyWidthRatioOfSlot_AC = 0.72`, `bodyWidthRatioOfSlot_B = 1.0`, `educationalGapFromRoundedWidth = true`.

## Minimum and Maximum Body Height

A body must always read as clearly directional, and no single candle may swallow the screen.

| Rule | Desktop | Phone (smallest) |
|---|---|---|
| Minimum visible non-doji body | `18px` | `16px` |
| Hard floor (never below, any type) | `14px` | `12px` |
| Educational target (Type A) | `24px` | `24px` |
| Maximum body height | `min( 55% of visible chart height, 420px )` | same |

A non-doji body whose mapped price delta would render smaller than the minimum is **floored up** to `18px` (`16px` phone) so it always looks directional. It is then **capped** at the smaller of `55%` of visible chart height and the absolute `420px` gameplay ceiling — the `min()` binds, and this is stated so the two caps never race. Type A's educational floor is higher — `24px` — because illustration exaggerates so a ten-year-old reads the move instantly inside the `H*0.44` illustration area (:16497–16542).

**Snapping and capping are monotonic (no magnitude lie).** Both the floor and the cap are applied by remapping the whole chart's price-to-pixel scale, never by clamping candles one at a time. This preserves ordering (Readability Law 3): a 0.1% move and a 1.7% move never both land on the 18px floor as equals, and a 30% move and an 80% move never both flatten onto the 420px cap as equals. Where a Type-C exam would legitimately contain a move beyond the cap, the scene is authored so no single move exceeds it; where gameplay volatility exceeds the cap, a **governed logarithmic compression** applies to the top decile with a distinct "capped" marker, so two large moves stay visibly ordered. Magnitude is never collapsed.

> **Validator:** `minReadableBodyPx_desktop = 18`, `minReadableBodyPx_phone = 16`, `hardFloorBodyPx_desktop = 14`, `hardFloorBodyPx_phone_smallest = 12`, `educationalMinBodyPx_typeA = 24`, `maxBodyHeightBinds = "min(0.55*visibleHeight, 420)"`, `monotonicHeightMap = true`, `logCompressionAboveCap = true`.

## Minimum Visible Movement

This is the smallest price change a ten-year-old must still tell apart from a doji.

| Quantity | Desktop | Phone |
|---|---|---|
| Absolute directional floor | `18px` | `16px` |
| Hard floor | `14px` | `12px` |
| Floored-body ceiling (reads as "small") | `≤ 0.3 × median` | `≤ 0.3 × median` |
| Median visible body (gameplay) | `≥ 60px` | `≥ 60px` |

**Any candle read as directional** (not a doji) renders `≥ 18px` on desktop / `≥ 16px` on phone even when the mapped delta is smaller — the body floors up. This single floor retires five unrelated accidental-doji floors that each caused the "candles too flat" bug: `15` (:2332), `6` (:16538), `5` (:16327), `3` (:9284), and `2` (:14393).

**The median-clarity rule, corrected.** The floor only teaches "this was a small move" if normal moves are visibly bigger. The earlier draft set the gameplay median at `≥ 30px` while also requiring a floored candle to read as `≤ 0.3 × median` — an unsatisfiable pair, because `0.3 × 30 = 9 < 18`. This constitution resolves it in the single direction the design intends: **the `0.3` fraction is a ceiling on floored candles** (a floored body must read as clearly *small*), and to satisfy `18 ≤ 0.3 × median` the **gameplay median is raised to `≥ 60px`**. The two rules now agree by construction, and there is exactly one meaning for the `0.3` constant across the whole document.

**Order preservation** (Readability Law 3) sits alongside the floor: flooring is applied through a monotonic scale, so among floored candles themselves and between floored and normal candles, larger deltas never render shorter than smaller ones.

**The doji band** is fenced off tightly:

| Doji property | Value |
|---|---|
| Body height band | `2`–`4px` |
| Availability | authored (A, B) or realism-driven (C) — never a *directional* accident |
| Body colour | `#b8c0cc` (neutral) |
| Edge colour | `#7a8494` |
| Shape cue | cross/plus: long, roughly equal upper + lower wicks, near-zero body |
| Label cue | `DOJI` (A, C); flat-marker tile in B, see [Gameplay Chart Rules](#gameplay-chart-rules) |
| Forbidden colour | gold `#ffd60a` (reserved boss/portal — retires the quiz-doji gold at :16327) |
| Edge draw gate | **always drawn for a doji**, exempt from the `bodyH ≥ 3` edge gate |

No *directional* candle may fall into the 2–4px band; every directional candle is floored at `18px`. A doji is never an accidental flat line and never carries a hue-bearing body. The doji's edge and cross are drawn even at a 2px body — the review caught that the generic `bodyH ≥ 3` edge gate would erase the smallest doji's outline, so dojis are explicitly exempt from that gate.

> **Validator:** `minReadableBodyPx_desktop = 18`, `minReadableBodyPx_phone = 16`, `flooredBodyMaxFractionOfMedian = 0.3`, `medianVisibleBodyMinPx_gameplay = 60`, `dojiBandMinPx = 2`, `dojiBandMaxPx = 4`, `dojiEdgeAlwaysDrawn = true`, `monotonicHeightMap = true`.

## Color Standards

The global **COLOR object (`COLOR`, :2412) is the only source of candle colour.** No draw path may write an inline literal. Every hex below is a role, not a decoration.

| Role | Body | Edge | Sheen / accent |
|---|---|---|---|
| **Bull (up)** | `#16c784` | `#0c9c69` | `#5dedb5` |
| **Bear (down)** | `#ea3943` | `#c0212c` | `#f3838a` |
| **Doji** | `#b8c0cc` | `#7a8494` | — |
| **Opposite-touch separator** | — | `#05070a` | — |
| **Wick** | `#c9d1d9` | — | — |
| **Neutral / disabled** | `#8b98a8` | — | — |
| **Background** | `#0a0e14` | — | — |
| **Ground** | `#5a6b82` | — | — |

**Reserved portal colours — never used for a candle body:** purple `#a855f7` (lesson), blue `#4cc3ff` (trade), gold `#ffd60a` (boss), orange `#ff9f43` (boss). Hazard-mechanic wicks are the only cyan/orange candles: spin-pole `#7fd6ff` (must stay lighter and distinct from portal blue `#4cc3ff`) and sweep `#ff7a45`.

Retired forked hexes fold back into the COLOR object: `engineGreenWick #1fd790` → `#c9d1d9`; `engineRedWick #ff5663` → `#c9d1d9`; `cardGreenEdge #0d9460` → `#0c9c69`; `cardRedEdge #b52a30` → `#c0212c`; boss inline `#16c784`/`#ea3943` → cite COLOR (no literals); `quizDojiGold #ffd60a` → `#b8c0cc`.

**The Accessibility Law (TES v1.1): direction is NEVER conveyed by hue alone.** Every candle carries a redundant, non-colour cue, and the cue-set is **type-dependent** (this fixes the review's finding that a single glyph rule rejected all gameplay candles):

- **Labelled contexts (Types A, C).** Bull — green body **+ bright top-sheen stripe (`#5dedb5`) on the TOP edge + a `▲` glyph**. Bear — red body **+ darker bottom shadow (`#f3838a`) on the BOTTOM edge + a `▼` glyph**. Doji — cross/plus **+ `DOJI` label +** neutral `#b8c0cc`.
- **Gameplay (Type B).** Direction is carried by **sheen position + an opposite-edge dark inset + the neutral separator**, and a **`▲`/`▼` glyph is added on any body ≥ 28px wide**. Glyphs are not painted on every walkable candle (that would clutter the road), but the position cues are floored for perceptibility (see [Accessibility Standards](#accessibility-standards)).

A hue-blind reader distinguishes every candle by sheen **position** (top vs bottom), the opposite-edge inset, the glyph where present, and the separator — never by colour.

> **Validator:** `nonColourCueRequired = true`, `nonColourCueTypeDependent = true`, `glyphBodyWMinPx_B = 28`, `noInlineColourLiterals = true`.

## Contrast Rules

| Contrast pair | Minimum | Target / measured |
|---|---|---|
| Body vs background | `3:1` | `4.5:1` (bull 8.8:1, bear 4.76:1) |
| Adjacent body vs body (opposite direction) | carried by separator | bull vs bear is `1.85:1` — hue cannot separate |
| Neutral separator vs each touching body | `3:1` | `#05070a` clears ≥ 4.5:1 vs both |
| Sheen vs body (Type B position cue) | `3:1` | see below |
| Doji vs background | `3:1` | — |
| Wick vs background | — | `~12:1` |

Both directional bodies clear the target against the background: green `#16c784` measures `8.8:1` and red `#ea3943` measures `4.76:1` on bg `#0a0e14` — pass. The wick `#c9d1d9` on `#0a0e14` measures `~12:1` — pass.

**The critical case is adjacency, and the fix is a neutral separator — not a same-hue edge.** The verified luminance contrast between bull `#16c784` and bear `#ea3943` is **1.85:1**, far below 3:1, so hue alone cannot separate two touching opposite-direction candles. The earlier draft mandated a *same-hue darker edge* (`#0c9c69` / `#c0212c`) to carry the boundary — but the review recomputed those edges and found they clear only ~1.2–1.7:1 against the neighbouring bodies, so the edge failed the exact job it was created for. This constitution therefore mandates a **1px neutral separator `#05070a`** wherever opposite-direction candles touch; being near-black, it clears **≥ 4.5:1 against both** bull and bear bodies, so it genuinely carries the boundary. The per-body edges (`#0c9c69` / `#c0212c`) remain as definition strokes for polish, but the *load-bearing* boundary is the neutral separator, and the validator checks its contrast against **both** neighbours, not merely its presence.

**Sheen-vs-body contrast (Type B).** Because gameplay leans on sheen *position* as a primary non-colour cue, the sheen must be perceptible against its own body: sheen-vs-body contrast **≥ 3:1**, with the position cue backed by a dark opposite-edge inset that clears the same floor even where a bright sheen cannot (luminous green bodies make a lighter-still stripe hard to separate). See [Accessibility Standards](#accessibility-standards).

> **Validator:** `contrastBodyVsBgMin = 3`, `contrastBodyVsBgTarget = 4.5`, `separatorContrastVsBothBodiesMin = 3`, `sheenVsBodyContrastMin_B = 3`, `separatorStrokePx = 1`, `separatorMandatoryOnOppositeTouch = true`.

## Spacing Rules

Horizontal spacing differs by chart type because the two families serve different jobs — a continuous road versus legible individual shapes.

| Context | Gap rule | Value |
|---|---|---|
| **Gameplay (Type B)** | continuous walkable road — candles fill the slot and bleed | gap `0`; `bw = c.w + 1`, `bx = sx - 0.5`; `WIDTH_RATIO 1.0` |
| **Educational (Type A)** | breathing room so each shape is legible | `gap = max( slot - bodyW - 1, 0.20 × slot )` |
| **Exam (Type C)** | realistic spacing, legible | `gap = 0.28 × slot` (from rounded width) |

Gameplay draws slot-filling bodies with a hair of overlap so candle tops form one unbroken walkable surface — this is canon, and it descends from `gapMin = gapMax = 0` (:2324). Educational and exam charts leave a computed channel so a ten-year-old reads each shape as its own object; the gap is derived from the *rounded* body width so rounding never pushes bodies into contact.

**Repetition and texture are also spacing.** To keep the chart from becoming flat, boring, or mechanical terrain:

- No more than **2 identical candles** in a row, and the "identical" test also catches the **A-B-A-B alternation** of exactly two heights (wallpaper) — a run alternating between two fixed heights with no third value fails, even though no three touch.
- Across any 8-candle window, at least **4 distinct body-height buckets** must appear (height texture), so uniform terrain is rejected.
- No more than **3 near-equal candles** — where "near-equal/flat" means two candle body-tops differ by `≤ 18px`.
- A flat stretch may not exceed **3 candles or 220px** (`~0.6×` the `367px` jump reach) before the terrain must change height by `≥ 130px`.

> **Validator:** `gapGameplayPx = 0`, `gapEducationalFromRoundedWidth = true`, `gapRatioExam = 0.28`, `maxIdenticalCandles = 2`, `forbidTwoValueAlternation = true`, `heightBucketsMinPer8 = 4`, `nearEqualBodyTopDeltaPx = 18`, `maxFlatRunCandles = 3`, `maxFlatRunPx = 220`.

## Zoom Rules

Zoom is **discrete, not continuous** — three fixed levels, each pinned to an exact on-screen candle count that keeps body width inside its clamp:

| Level | On-screen candles |
|---|---|
| **Close** | `8` |
| **Default** | `12` |
| **Wide** | `16` |

Gameplay defaults to **12** visible candles — the tuned count that keeps bodies inside the `24`–`56px` desktop band (from `candleTargetVisible` :2353). Educational charts have **no zoom**: each authored scene auto-fits with **8% price padding** and shows **6–10 candles** (or `1–5` in the focus sub-mode). Boss/challenge charts use **fixed framing** at **6–14 candles**.

**Every zoom level is a validated window.** Because the on-screen set changes with zoom, a chart authored to pass at Default (12) could hide a below-median stretch or an over-long flat run at Wide (16), or fail jump cadence at Close (8). The rhythm and readability aggregates (median, flat-run, variety, verticality, cadence) therefore run at **all three zoom windows**, over every contiguous sliding window of the level's candle count — the worst window governs. Zoom level is an explicit input to the per-chart validator.

**Pinch-zoom is disabled on the game canvas** (`maximum-scale=1` / `user-scalable=no`) — a documented WCAG 1.4.4 exception, because pinch breaks canvas input. The three discrete zoom levels are the accessible substitute; text and static UI outside the canvas remain pinch-zoomable.

> **Validator:** `onscreenCandlesGameplayTarget = 12`, `onscreenCandlesGameplayMin = 8`, `onscreenCandlesGameplayMax = 16`, `validateAtAllZoomWindows = true`, `slidingWindowWorstCase = true`.

## Camera Rules

The camera exists to make a scrolling price-world feel like solid ground under a running character. It has caused two of the longest-lived motion bugs in the project, and both are closed here by law — and, per the Nintendo review, the camera is now given a **positive feel spec**, not merely a defensive one.

**Anchor and velocity look-ahead.** Finn (legacy `turtle.x`) is held near horizontal centre at a **base anchor of 0.52** (`cameraAnchor` :2354). But a purely static anchor with lag makes the world slosh behind the player, so the anchor **leads with velocity**: it shifts forward from `0.52` toward `0.62` in proportion to Finn's horizontal speed, so the player sees where they are *going*, not only where they were. At rest the anchor is 0.52; at full run it is 0.62.

**Horizontal smoothing.** Camera follow is an **exponential moving average on `camera.x`, alpha 0.12 per frame** (`cameraSmoothingAlpha`) — **never a rigid snap** — and the alpha **tightens with speed** (up to ~0.18 at full run) so fast traversal does not visibly lag. This is the single most important camera law, because:

> A rigid camera that orbits `turtle.x` produces the "chart scrolls then jerks back" **pole-spin** — the world rotates around the character's x instead of trailing it. This was **build 233**. The fix is EMA smoothing on the **camera**, not on the sprite. Chasing it in the character animation (builds 236–241) never worked because the character was never the cause.

**Frame-time handling.** Raw `dt` is **clamped to [8, 40] ms** (`dtClampMinMs` / `dtClampMaxMs`) and then EMA-smoothed at a **named `dtSmoothingAlpha = 0.10`** (the earlier draft's unenforceable "~0.10" is now a named, validated constant):

> Raw `dt` fed straight into a rigid camera produced the "not fluid / glitchy" motion chased across **builds 234 and 242**. A single long frame teleported the world; a burst of short frames stuttered it. The clamp bounds the per-frame step and the EMA erases the spikes. Diagnose motion regressions with a passive rAF observer and a fixed-`dt` frame-pump — never by re-deriving the gait formula.

**Landing settle and impact kick.** After a landing the camera performs a short **vertical settle** (a brief eased over-then-return, ≤ 80ms) so a jump resolves with weight, and a **heavy landing** (fall above a threshold) fires a small **impact micro-kick**. Both are *decorative* and are suppressed under `prefers-reduced-motion`; the load-bearing framing (anchor, EMA, clamp, deadzone) is never suppressed.

**Vertical framing.** Vertical follow uses a **40px deadzone** (`verticalDeadzonePx`): small hops do not move the camera, so the horizon stays stable and only real climbs pan the view. The world spans **80–700px** tall (`levelMin` / `levelMax`); vertical pan is **clamped to those bounds and velocity-limited**, and the camera always keeps the ground row on screen so the player never loses the road.

**Scroll ceiling — quantified.** The earlier draft's "1.5× walk 58 + jump" was under-specified. The **maximum horizontal player speed** is defined as `walkSpeed 58 + jump horizontal contribution ≈ 58 px/tick` peak, and the **scroll ceiling is 1.5 × that maximum**; above the ceiling the world tears between frames. This is a hard ceiling, not a target, and it is paired with a **motion-readability gate**: at the ceiling, a captured frame's directional cue (sheen position / glyph) must remain identifiable by test observers, or the ceiling is lowered until it does.

**Zoom, not pinch.** The gameplay camera offers **3 discrete zoom levels** — Close (8 candles), Default (12), Wide (16). Pinch-zoom is **off** on the game canvas (documented WCAG 1.4.4 exception because pinch hijacks canvas input); the three discrete steps are the accessible substitute. Educational charts (Type A) use no camera — each scene **auto-fits with 8% price padding**. Boss/challenge charts (Type C) use **fixed framing** (6–14 candles). Camera *motion* law applies to the Type-B world only.

**Reduced-motion traversal mode.** EMA smoothing and the dt clamp *reduce* nausea, but the largest motion source is the full-screen auto-scroll itself, and for a vestibular-sensitive child that is not addressed by smoothing alone. So `prefers-reduced-motion` additionally enables a genuine **low-motion traversal mode**: the viewport advances **one candle per input (discrete stepping), with no continuous scroll**, and the trade decision may be presented as a **static read-then-answer** chart. This is a first-class mode, not a suppression of decoration. See [Accessibility Standards](#accessibility-standards).

> **Validator:** `cameraAnchorBase = 0.52`, `cameraAnchorMaxAtFullRun = 0.62`, `cameraSmoothingAlpha = 0.12`, `dtClampMinMs = 8`, `dtClampMaxMs = 40`, `dtSmoothingAlpha = 0.10`, `verticalDeadzonePx = 40`, `scrollCeilingFactor = 1.5`, `lookAheadScalesWithVelocity = true`, `reducedMotionTraversalMode = true`.

## Platforming Rules

Finn's movement model is fixed and honest. The terrain must be built to *this* model — not the model bent to fit pretty charts.

**The movement facts (`CFG` block, :2312).**

| Property | Value |
|---|---|
| Walk speed | **58** px/tick (CFG unit) |
| Gravity | **2300** |
| Jump velocity | **−780** |
| Boost 1 / Boost 2 | **−1242 / −1518** (`maxBoosts 2`) |
| Coyote time | **0.09s (90ms)** |
| Jump buffer | **0.12s (120ms)** |
| Jump reach (horizontal, measured) | **≈ 367px** |
| BOS (step/boost) impulse | **130–200px**, within jump reach |

**On the reach constant — measured, not mis-derived.** The review correctly showed that a naive kinematic derivation (`airtime × walkSpeed`) does not reproduce 367px, and flagged the "always reachable" guarantee as resting on an impossible identity. The resolution: **`jumpReachPx ≈ 367` is the empirically measured horizontal reach of Finn's full jump arc** — including both boosts and the coyote/buffer window — in the CFG's own units, **not** a walk-speed-times-airtime product. `walkSpeed 58` is stated in the CFG's per-tick unit. Because the reach is a *measured envelope* of the actual movement model, the reachability guarantee is validated against that measured envelope, and a CI check **re-measures the reach whenever any movement constant changes** — via a **headless simulation harness that steps the CFG movement model** (`update(dt)` plus the `CFG` constants `walkSpeed`, `gravity`, `jumpVelocity`, `jetpack1/2Velocity`, `jetpackHang`, coyote/buffer) frame-by-frame and records the horizontal reach envelope of Finn's full jump arc — failing the build if the terrain rules and the freshly measured reach diverge. The guarantee is honest because it is empirical, and it cannot silently drift.

**Hard constraints — never relax:**

- **No free flight. No hover. No diagonal boost.** Boosts are bounded vertical impulses (2 max), not flight. A chart may not require any traversal these three constraints forbid.
- **Candles ARE terrain.** The top edge of every body is walkable ground. This is why the corner radius is **0** everywhere (sharp tops) — a rounded platform is a lie about where the ground is — and why Type B uses `WIDTH_RATIO 1.0` so the road is continuous.
- **Continuous walkable road.** Gameplay gap is **0** (`gapMin=gapMax=0` :2324), slot-filling with a hair overlap — **`bw = c.w+1`, `bx = sx−0.5`** — so adjacent tops fuse into one road. Any gap in that road must be an *authored* jump, never a rendering seam.

**Reachability law.** Because Finn's measured reach is 367px and his climb per step is 130–200px, every jump the terrain *demands* must fit inside both windows, and every non-jump step must be genuinely walkable:

- Max required horizontal gap: **367px** (`maxHorizontalGapPx`).
- Every jumpable step height: **130–200px** (`jumpStepDeltaPx`).
- Jumps offered every **4–6 candles** (`jumpCadenceCandles`).
- **No dead middle band.** A consecutive body-top delta must be either **≤ 18px (a smooth walk)** or **≥ 130px (an authored, jumpable step)** — never in the `18–130px` gap, which is too big to walk cleanly and too small to be a real jump ("gravel terrain"). At most **one** small organic bump in `(18, 60]` per 6 candles is tolerated for life; nothing in `(60, 130)` is allowed.

**TEST.** For each authored gap or step, confirm `gap ≤ 367` and `130 ≤ stepHeight ≤ 200`; confirm no consecutive body-top delta falls in the forbidden `(18, 130)` dead band (beyond the tolerated single small bump). Any value outside these is an unreachable — or feel-dead — obstacle and FAILs. This is what keeps traversal a *skill*, not a wall (and it is why the deleted Guardian-Trial movement gauntlet, build 251, must never be resurrected — the boss is a knowledge exam, not a platforming wall).

## Chart Rhythm Rules

Rhythm is where the visual layer and the platforming layer meet: the same body-top Y that reads as a price move *is* the step Finn climbs. These rules bound the shape of the terrain over time — and, per the Nintendo review, they now legislate **variety and peaks positively**, not merely forbid the absence of variety.

**Near-equal / flat.** Two candles are "flat" relative to each other if their **body-top Y differs by ≤ 18px** (`nearEqualDefinitionPx`). This equals the non-doji minimum visible body (18px desktop): a step smaller than the smallest legible move is, correctly, no step at all.

**The rhythm limits (Type B):**

| Rule | Limit | Spine key |
|---|---|---|
| Consecutive near-equal candles | **3** | `maxConsecutiveNearEqualCandles 3` |
| Flat run distance | **220px** (≈ 0.6× jump reach 367) | `maxBoringFlatRunPx 220` |
| Identical candles in a row (incl. A-B-A-B) | **2** | `maxIdenticalCandles 2` |
| Height buckets per 8-candle window | **≥ 4** | `heightBucketsMinPer8 4` |
| Forbidden body-top delta band | **none in (18, 130)px** | `deadBandForbidden` |
| Forced height change after a flat run | **≥ 130px** step (BOS 130–200) | `netElevationChangeMinPx 130` |
| Verticality cadence | net **≥ 130px** every **10** candles | `verticalityCadenceCandlesMax 10` |
| Vertical dynamic range | **≥ 300px span** per 20 candles | `verticalSpanMinPx 300` |
| On-screen candles | **12** (8–16) | `onscreenCandlesGameplayTarget 12` |
| Median visible body | **≥ 60px** | `medianVisibleBodyMinPx 60` |

**The variety law (positive, not merely anti-flat).** A chart can clear every "not-too-flat" limit and still be a metronomic staircase — identical +130px steps forever — which a child learns in two seconds and then autopilots. So variety is *required*, measurably:

- **Step-size variety.** Across any 12-candle window, the coefficient of variation of the jump-step deltas is **≥ 0.35** — steps must genuinely differ in size, not merely exist.
- **No metronome.** No more than **2 consecutive** jump-steps share the same signed magnitude bucket (a regular up-down-up-down of equal magnitude fails).
- **A peak per screen.** At least once per 12 candles there is a **peak step in the top magnitude quartile (≥ 185px, near the BOS ceiling of 200)** — every screenful contains one moment worth reacting to.

**The rhythm law (plain English for the ten-year-old, exact for the machine):** after **3 near-equal candles OR 220px of flat road**, the terrain **must** change height by **≥ 130px** — a step Finn can actually jump. Across any 10-candle stretch, the ground must post a net climb or drop of at least 130px; across any 20-candle stretch it must use at least **300px** of the 620px vertical stage. Steps must vary in size and deliver a peak each screen. Nothing sits still, and nothing repeats into a trance.

**Why these exact numbers.** Each is pinned to Finn's body:

- 220px ≈ 0.6× measured jump reach (367px), so a flat stretch never grows longer than the distance he can clear in one hop — dead space is impossible.
- 130px is the floor of the BOS impulse window (130–200px), so every forced change is guaranteed *jumpable*, never a soft bump or an unclimbable cliff.
- 185px is the top quartile of the 130–200 window — a genuine, near-ceiling peak.
- 300px is roughly half the 80–700 stage, so a level actually *uses* its vertical room instead of oscillating in a thin slice.
- Median 60px keeps the 18px directional floor reading as clearly *smaller* than a normal move, so small steps and big steps stay distinguishable — the rhythm has dynamic range.

**Grounding & failure history.** The legacy floor `CFG.minBody = 15` (:2332) is the documented cause of "candles too flat," and the legacy width path — `candleW` (:3257), `round(clamp((W*0.52)/8.5, 24, 56) * rand(0.92,1.1))`, fed by `candleTargetVisible 8.5` (:2353, ~12 on screen) — is one of the forked width paths the governing width rule now replaces. Prior to these rhythm limits, nothing bounded flat terrain and nothing *required* variety; the result was the recurring "charts become flat terrain / boring platforming" bug. These rules close it by measurement, in candle counts and pixels, so that **NO CHART MAY BE BORING** is a test the build can run — not a hope.

## Game-Feel Invariants

Correctness and readability keep a chart from being *wrong*; game feel keeps traversal from being *dead*. The Nintendo review's decisive point stands: nearly every other law in this document is a floor or a ceiling, but the verb of the game — the jump — had no feel spec at all, even though build 247 shipped a hard-won Movement Feel Patch. This section makes that juice **law**, protected the way the readability floors are protected, so a future tuning pass can never quietly strip it.

**Protected input-forgiveness minimums (never tune below):**

- **Coyote time ≥ 90ms** (`coyoteMs`, from CFG 0.09s) — a jump pressed just after leaving a ledge still fires.
- **Jump buffer ≥ 120ms** (`jumpBufferMs`, from CFG 0.12s) — a jump pressed just before landing still fires on touchdown.

These are *minimums*: they may be raised for feel, never lowered, because below them the controls read as unresponsive to a ten-year-old's hands.

**Mandatory tactile feedback on the jump verb:**

- **Takeoff anticipation.** Every jump renders **≥ 1 anticipation frame** (a brief crouch) before launch, so the jump has a windup rather than a teleport.
- **Landing squash.** Every landing renders a **render-only squash** (≈ 0.85 vertical scale for ≈ 60ms) plus the camera settle — the world resolves with weight. Squash is render-only and never alters collision.
- **Impact feedback.** Landing on a candle fires the **move/land SFX and a haptic pulse** (`GameMusic.move`, `hapticMove`), with the decorative portion respecting `prefers-reduced-motion` while the functional landing itself is never suppressed.

**Momentum honesty.** Traversal preserves momentum within the fixed model — no snapping to a grid, no instantaneous stops that read as a cursor rather than a character. Coyote/buffer/squash exist precisely so the character feels continuous.

> **Validator:** `coyoteMs >= 90`, `jumpBufferMs >= 120`, `landingSquashScale = 0.85`, `landingSquashMs ~= 60`, `takeoffAnticipationFrames >= 1`, `landFiresSfxAndHaptic = true`, `squashIsRenderOnly = true`. These assert the hooks are wired, exactly as the camera validators assert the camera params.

## The Platformer Constitution

In ChartQuest a candle is never *only* a number. In the gameplay world (Chart Type B) the top edge of every candle body is the ground Finn walks, jumps from, and lands on — candles **are** the level geometry. That fact makes the visual layer and the platforming layer the same layer, and it makes one law supreme over all of it:

> **NO CHART MAY BE BORING.**

This is not an aesthetic wish. It is an enforceable, numeric contract that every authored or procedurally generated Type-B chart must pass *before* it ships as terrain **and** while it renders at runtime. Boredom is a build-time and run-time failure, not a taste. Every clause below states a law, gives the number it is anchored to in the ratified spine, and gives the test a machine runs against the candle array. A chart that fails any test is not "less fun" — it is malformed geometry and must be regenerated.

**The boredom scan (the operational form of NO CHART MAY BE BORING).** A Type-B chart PASSES only if *all* hold, evaluated over every sliding on-screen window at all three zoom levels, on the final post-jitter rendered geometry:

| Predicate | Threshold | Spine key |
|---|---|---|
| Consecutive near-equal candles | ≤ 3 | `maxConsecutiveNearEqualCandles 3` |
| Near-equal definition | body-top ΔY ≤ 18px | `nearEqualDefinitionPx 18` |
| Flat run length | ≤ 220px | `maxBoringFlatRunPx 220` |
| Identical / two-value alternation | ≤ 2 in a row, no A-B-A-B | `maxIdenticalCandles 2` |
| Height buckets per 8 candles | ≥ 4 | `heightBucketsMinPer8 4` |
| No dead-band step | no ΔY in (18,130) | `deadBandForbidden` |
| Jump offered every | 4–6 candles | `jumpCadenceCandles [4,6]` |
| Jump step height | 130–200px | `jumpStepDeltaPx [130,200]` |
| Required horizontal gap | ≤ 367px | `maxHorizontalGapPx 367` |
| Step-delta variety (CV per 12) | ≥ 0.35 | `stepDeltaCVmin 0.35` |
| No metronome (same magnitude bucket) | ≤ 2 consecutive | `maxConsecutiveSameMagnitudeBucket 2` |
| Peak step per 12 candles | ≥ 185px | `peakStepMinPx 185` |
| Net elevation change per 10 candles | ≥ 130px | `netElevationChangeMinPx 130` |
| Vertical span per 20 candles | ≥ 300px | `verticalSpanMinPx 300` |
| Median visible body | ≥ 60px | `medianVisibleBodyMinPx 60` |
| Width jitter present | ±4–8% | `widthJitterRequired` |

If any row fails, the generator regenerates or the author revises — the chart does not ship, and at runtime the live window that fails triggers deterministic regeneration (see [Automated Validation Rules](#automated-validation-rules) → runtime layer). Fun is therefore *testable*, *repeatable*, and *non-negotiable*: a chart is boring exactly when it violates one of these numbers, and never otherwise. Fun is the emergent guarantee of enforcing every clause at once — plus the [Game-Feel Invariants](#game-feel-invariants) that make each jump feel good and the [Camera Rules](#camera-rules) that make the world move well.

## The Three Chart Types

ChartQuest draws candles for three jobs, and the difference between them is a *bounded license to exaggerate over a shared readability floor* — not a license to invent geometry. Type A illustrates, Type B is walked, Type C examines. Exaggeration is not a per-type on/off switch but a **measured gain that ramps** across the learner's journey (see [Difficulty Standards](#difficulty-standards)), so a child never meets a de-exaggerated candle for the first time at the exam.

### Type A — Educational Illustration

**Purpose.** Teach exactly ONE concept per chart, exaggerated so a ten-year-old reads the move instantly. This is the didactic layer: a single bullish engulfing, a single doji, a single "buying pressure wins" — drawn big, clean, labelled, and **composed around a focal candle**. Its success is measured, not asserted: a first-time child names the concept at ≥ 90% with labels hidden.

**Where it lives.** The educational / illustration draw path (:16521, the retired fixed `bodyW=44`, corner radius 5), `drawQuizCandle` (:16319), the illustration area sized at `H*0.44` (:16497–16542), plus the style-LOCKED LessonChart engine (:19290, the "10/10" reference) and its mirror `lesson-chart-preview.html`. Type A is the proportion source of truth: its `0.72`-of-slot width and `radius-0` body became law for the illustration/exam family.

**Exaggeration: MAXIMUM.** Bodies floored high (≥ 24px), wicks clean, shapes archetypal. The retired `44` (:16521) is now *derived* from `bodyW = round(clamp(slot*0.72, 32, 56))` and lands ~44–56px for a typical 6–8-candle scene.

**Authored, zero jitter.** Every Type A candle is hand-placed. Organic jitter is *forbidden* — clean geometric shapes so the concept, not noise, is what the child perceives. No generator emits a Type A chart.

**The focal-candle law (composition, not just legibility).** Legible is not the same as *instantly obvious what matters*. A lesson of ten equally-loud candles forces the child to be *told* which one matters. So each Type-A scene declares exactly one focal candle (or focal pair), and:

- the focal body is the **largest in the scene, ≥ 1.3× the median neighbour body**;
- it sits in the **readable centre band** of the frame;
- context candles are drawn at **reduced sheen/alpha** so the focal candle pops;
- the `▲/▼/DOJI` glyph appears on the focal candle and is **not** painted on context candles.

**The relational-pattern law.** Many taught concepts are *relationships*, not single candles — a bullish engulfing is defined by candle 2's body being larger than candle 1's. The floor must never flatten that relationship into two equal candles. So when a pattern's concept is a size relationship (engulfing, doji-after-trend, exhaustion), the authored scale guarantees the defining relationship is visible by **≥ 1.5× body ratio** (or the relevant separation), and that ratio dominates the flat floor. The `Teaches` field declares whether a concept is single-candle or relational (see [Pattern Library Specification](#pattern-library-specification)).

**Focus sub-mode (1–5 candles).** Type A's purpose sometimes *is* a single candle ("here is one doji") or a single pair ("here is one engulfing"). A **focus illustration** of 1–5 candles is an explicit Type-A sub-mode: it **suspends the density and rhythm aggregates** (median, flat-run, variety — which assume plurality) and keeps only the per-candle floors, the focal/relational laws, labels, and contrast.

| Property | Desktop | Phone (360, smallest) |
|---|---|---|
| Body width `BW_MIN`–`BW_MAX` | 32–56px | 24–48px |
| Target visible candles | 6–10 (or 1–5 focus) | 6–10 (or 1–5) |
| Min visible body | 24px | 24px |
| Focal body vs median neighbour | ≥ 1.3× | ≥ 1.3× |
| Relational defining ratio | ≥ 1.5× | ≥ 1.5× |
| Sheen width | `bw*0.16` | `bw*0.16` |
| Doji band | 2–4px (authored) | 2–4px |
| Corner radius | 0 | 0 |
| Separator / edge | 1px | 1px |
| Zoom | none — auto-fit each scene, 8% price padding | same |

**Readability floor (Type A):** body ≥ 24px, separator/edge present, non-colour cue + explicit labels, contrast ≥ 3:1 — never lower here. Type A carries the highest floor, because it is a child's first look.

### Type B — Gameplay Pattern

**Purpose.** Teach *decisions*. Type B candles are the scrolling world Finn traverses — readable, beautiful, fun to walk and jump, forming curated patterns the player learns to act on. The body is literally a walkable platform; the chart is the level.

**Where it lives.** The scrolling gameplay world — `drawGameplayCandle` (:12852), the body rect at :12912 (radius 0, one of the two 10/10 references), gameplay wicks at :12869, the width function `candleW` (:3257), the CFG block (:2312) including the retired `minBody=15` (:2332) and `gapMin=gapMax=0` (:2324).

**Exaggeration: MODERATE, and ramped.** Patterns are curated and readable; bodies floored at 18px desktop / 16px phone (raising the retired `CFG.minBody=15`), with the **median visible body ≥ 60px** so the floor reads as clearly *smaller* than a normal move. Exaggeration gain decreases across a realm's levels (see [Difficulty Standards](#difficulty-standards)) so the learner meets progressively less-amplified candles before the Type-C exam.

**Always authored; jitter is required.** Type B is never raw RNG terrain — patterns are curated for lesson intent and platformer rhythm. Organic **width jitter of ±4–8% is mandatory** (not merely permitted): zero-jitter terrain reads as synthetic wallpaper and *fails*. The `BW_MIN` floor holds after jitter, and the seed is stored so replay is deterministic.

**The single-cue trap, closed.** Because glyphs are not painted on every walkable candle, a hue-blind child in a run of same-direction candles would otherwise depend on a 1–2.5px sheen stripe alone. That is too thin to be the sole cue. So Type B carries **two** floored position cues plus a glyph escape hatch (see [Accessibility Standards](#accessibility-standards)): a sheen stripe **≥ 3px at alpha ≥ 0.8, sheen-vs-body contrast ≥ 3:1**, a **dark opposite-edge inset** that clears 3:1 even on luminous bodies, and a **`▲/▼` glyph on any body ≥ 28px wide**.

| Property | Desktop | Phone (360, smallest) |
|---|---|---|
| `WIDTH_RATIO` | 1.0 (continuous road) | 1.0 |
| Body width `BW_MIN`–`BW_MAX` | 24–56px | 18–44px |
| Target visible candles | 12 (Close 8 / Default 12 / Wide 16) | 12 |
| Min visible body | 18px | 16px |
| Median visible body | ≥ 60px | ≥ 60px |
| Organic width jitter | ±4–8% (required, seeded) | ±4–8% |
| Gap / continuity | 0 — `bw=c.w+1`, `bx=sx-0.5` (walkable road) | same |
| Top sheen | ≥ 3px, alpha ≥ 0.8, contrast ≥ 3:1 | same |
| Glyph | on bodies ≥ 28px wide | ≥ 28px |
| Corner radius | 0 | 0 |
| Camera | anchor 0.52→0.62, EMA 0.12→0.18, dt clamp [8,40]ms | same |

**Platformer rhythm (Type B only).** All of [Chart Rhythm Rules](#chart-rhythm-rules) applies: the flat-run, dead-band, variety, peak, verticality, and vertical-span laws, plus the [Game-Feel Invariants](#game-feel-invariants). This is what kills "charts become flat terrain / boring platforming."

**Readability floor (Type B):** body ≥ 18px (16 phone), separator on opposite-touch, non-colour cue (sheen position + inset + separator, glyph ≥ 28px), contrast ≥ 3:1, median ≥ 60px.

**Dojis as terrain.** A doji is a 2–4px body — flat ground in the walkable world. An authored doji *may* appear in gameplay, rendered as a **distinct flat-marker tile with the cross overlaid**, and it is **exempt from the flat-run boredom rule** because it is authored and labelled by its marker, not accidental dead space. Where a level teaches indecision between the LEARN illustration (A) and the TEST exam (C), this is how the concept is practised in APPLY.

### Type C — Challenge Chart

**Purpose.** Test mastery. Type C is the exam: denser and more *realistic* than the teaching stages, because the goal is to prove the player can read a candle when it is no longer exaggerated for them. It relaxes exaggeration — but never legibility, and never honest magnitude.

**Where it lives.** The boss mini-game exam charts — the boss SVG draw (`bossCandleSVG`, :9273, its retired `min(46, slot*0.5)` width at :9279, its retired radius-1.5 body and doji-floor-3 at :9284) and the boss round loop `bossRound` (~:11189, entered via `openBoss` after `tradeGatePassed()`). The boss is a **knowledge exam**, not a movement gauntlet — the Guardian-Trial traversal gauntlet was deleted in build 251 and must not be resurrected. Bosses only test *taught* concepts.

**Exaggeration: OFF — but previewed first.** Type C is the only type where exaggeration is fully off. To avoid the "cliff" the review flagged — practising only on amplified candles, then meeting realism for the first time at the graded exam — a boss's realism level must have been **previewed at ≥ 1 earlier Type-B practice level** via the exaggeration-gain ramp. Realistic bodies may shrink to the hard floor of 14px desktop / 12px phone, but no smaller.

**Organic dojis are legitimate here.** In a realistic exam, a candle whose true delta lands in the 2–4px band **is** a doji and renders as one — cross, neutral `#b8c0cc`, non-colour cue — **without a hand-flag**. This resolves the collision the review found between "may be realistic" and "doji only when authored": in Type C, realism governs the doji/directional decision; in Types A and B, authoring governs. What is never allowed, in any type, is a *directional* candle accidentally shrinking into the band.

**Composition law (an exam must pose a real question).** Per-candle legibility does not guarantee an interesting exam. A wall of 14 near-identical realistic candles is legible and dull. So Type C inherits a composition requirement: the **decision-relevant candle(s) must be distinguishable in the frame** (a focal read), and the exam must contain **genuine variety** — the answer candle clears a **contrast-of-magnitude threshold (≥ 1.3×)** against its neighbours, so the exam tests reading, not eyestrain.

| Property | Desktop | Phone (360, smallest) |
|---|---|---|
| `WIDTH_RATIO` | 0.72 | 0.72 |
| Body width `BW_MIN`–`BW_MAX` | 14–46px | 12–40px |
| Target visible candles | 6–14 (fixed framing, no pinch) | 6–14 |
| Min visible body (hard floor) | 14px | 12px |
| Answer candle vs neighbours | ≥ 1.3× magnitude | ≥ 1.3× |
| Doji band | 2–4px (authored or realism-driven) | 2–4px |
| Corner radius | 0 | 0 |
| Separator | 1px on opposite-touch | 1px |
| Exaggeration | OFF (previewed via ramp) | OFF |

**Readability floor (Type C):** body ≥ 14px (12 phone), separator, non-colour cue with glyph + label, contrast ≥ 3:1. This is the constitution's absolute hard floor — the lowest a body may ever be drawn.

### The Readability Floor — Never Relaxed for Any Type

Exaggeration, density, jitter, and realism slide between the three types. The following are **constitutional invariants**: they hold identically for A, B, and C, and no draw path may lower them.

1. **Non-doji body ≥ hard floor 14px desktop / 12px phone.** Type A floors at 24px and Type B at 18/16px, but *no* directional candle in *any* type renders below 14/12.
2. **1px neutral separator (`#05070a`) wherever opposite-direction candles touch,** clearing ≥ 3:1 against both neighbours — because bull vs bear luminance is 1.85:1 and same-hue edges fail. The separator, not colour, carries the boundary. (WCAG 1.4.11.)
3. **Non-colour redundant direction cue always present (Accessibility Law, TES v1.1),** type-appropriate: labelled glyph + sheen in A/C; sheen position + inset + separator + ≥28px glyph in B. A greyscale render distinguishes every candle.
4. **Body-vs-background contrast ≥ 3:1** against bg `#0a0e14` (target 4.5:1).
5. **No directional candle in the 2–4px band.** A doji occupies the band only as a genuine doji (authored in A/B, realism-driven in C); every directional candle is floored above it. Retires the five accidental-doji floors and the "candles too flat" bug.
6. **Corner radius 0** for every type — sharp bodies, because in Type B they are walkable platforms.
7. **Honest, order-preserving magnitude** — floors and caps applied by monotonic remap; larger deltas never render shorter.
8. **No section invents a number.** Every draw path consumes the governing formulas and cites the Standards Table. Trade-truth (`docs/canon/trading_canon.md` + `CHARTQUEST_TRADING_EXPERIENCE_SYSTEM_v1.1.md`) stays supreme on causality; this charter governs the visual layer only.

*The floor is what makes all three types one game. A candle may be exaggerated (A), traversable (B), or realistic (C) — but a ten-year-old must always be able to tell up from down, tell either from a doji, and see which move was bigger, at a glance.*

**Continuity of motion between types.** When the same authored candle appears across contexts — a lesson illustration becoming a world platform, a world candle opening in replay or the Notebook — the transition **eases (a short morph or match-cut) rather than hard-cutting**, so the child perceives one persistent object. Consistency of proportion is necessary; continuity of motion is what makes it feel like the same thing.

## Educational Illustration Rules

**Chart type: A — Educational Illustration** (exaggerated, authored). This is the surface the illustration/prediction draw (:16521) and the style-LOCKED LessonChart engine (:19290, mirrored by `lesson-chart-preview.html`) serve. Its job is singular: a ten-year-old must read the move *instantly*, and name it correctly ≥ 90% with labels hidden. Everything is authored, nothing is procedural, exaggeration is ON.

**Inherited geometry.** Body width `round( clamp( slot * 0.72, BW_MIN, BW_MAX ) )`, `slot = usableChartWidth / targetVisibleCount`. Corner radius **0** (matching the two 10/10 references). This retires the price-independent fixed `bodyW = 44px` and its rounded `cornerRadius 5`: 44 now *emerges* (~44–56px). The educational gap is derived from the rounded width (`gap = max(slot - bodyW - 1, 0.20 × slot)`) so bodies never touch.

| Parameter | Desktop | Phone (360) |
|---|---|---|
| Body width `BW_MIN`–`BW_MAX` | 32–56px | 24–48px |
| Target visible candles | 6–10 (1–5 focus sub-mode) | 6–10 |
| Minimum non-doji body | 24px | 24px |
| Focal body vs median neighbour | ≥ 1.3× | ≥ 1.3× |
| Doji band (authored) | 2–4px | 2–4px |

**Strict here:** exaggeration ON; body ≥ 24px; a declared **focal candle** ≥ 1.3× median neighbour in the centre band with context candles dimmed; **relational patterns** show their defining size relationship at ≥ 1.5×; 1px separator on opposite-touch; **explicit labels + non-colour cue** (bull green + top sheen `#5dedb5` at `bw*0.16` + `▲`; bear red + bottom sheen `#f3838a` + `▼`; doji neutral `#b8c0cc` cross + `DOJI`); body-vs-bg contrast ≥ 3:1.

**Relaxed here:** price realism (authored 0–100 scale), density (6–10, or 1–5 focus), organic jitter (none — clean shapes).

**Framing:** no zoom; auto-fit each scene with 8% price padding.

**Doji is a taught concept, never an accident.** Only an authored doji falls into the 2–4px band; cross-shaped, labelled, neutral. Never gold `#ffd60a` (reserved). Its edge/cross is always drawn, exempt from the `bodyH ≥ 3` gate.

## Gameplay Chart Rules

**Chart type: B — Gameplay Pattern** (candles as terrain), drawn at `drawGameplayCandle` (:12852). Candles are *walkable platforms*: readable, fun, authored patterns. This surface owns the platformer feel, so it inherits the geometry spine **and** the camera/rhythm/game-feel laws.

**Inherited geometry.** Governing width formula with `WIDTH_RATIO = 1.0` (continuous road), corner radius **0** (sharp tops are structurally required — a candle top is a floor Finn stands on). Retires `candleW`'s `clamp[24,56]` (:3257).

| Parameter | Desktop | Phone (360) |
|---|---|---|
| `WIDTH_RATIO` | 1.0 | 1.0 |
| Body width `BW_MIN`–`BW_MAX` | 24–56px | 18–44px |
| Target visible candles | 12 | 12 |
| Minimum non-doji body | 18px | 16px |
| Median visible body | ≥ 60px | ≥ 60px |

**Strict here:**
- **Minimum directional body 18px desktop / 16px phone.** Retires `CFG.minBody = 15` (:2332), the documented cause of "candles too flat."
- **Median visible body ≥ 60px** so the 18px floor reads as clearly *smaller*, and every floored candle ≤ 0.3 × median.
- **Continuous road:** gap 0 with hair overlap `bw = c.w+1, bx = sx-0.5` (canon; :2324).
- **Two floored non-colour position cues** (sheen ≥ 3px/alpha ≥ 0.8/contrast ≥ 3:1 on top for bull, bottom for bear; dark opposite-edge inset ≥ 3:1) **plus a `▲/▼` glyph on bodies ≥ 28px wide**.
- **Neutral wick** `#c9d1d9`, width `clamp(bodyW*0.05, 1.6, 3.0)` (1.6 floor wins); drawn wick is **0 or ≥ 28px** in gameplay; authored pattern-candle wicks (hammer/doji/marubozu) map to true high/low. Retires body-coloured wicks and `#1fd790`/`#ff5663`. Hazard wicks stay distinct *as mechanics* and carry a non-colour cue: spin-pole `#7fd6ff` 2.5px, sweep `#ff7a45` 3px.

**Required here:** organic width jitter of **±4–8% (seeded)** for terrain life — zero-jitter terrain fails; ≥ 4 height buckets per 8-candle window.

**Platformer rhythm & feel (kills "flat/boring platforming").** All of [Chart Rhythm Rules](#chart-rhythm-rules) — flat-run ≤ 3 candles/220px, no dead-band step in (18,130), CV ≥ 0.35 per 12, a ≥ 185px peak per 12, net ≥ 130px per 10, ≥ 300px span per 20, no metronome — plus the [Game-Feel Invariants](#game-feel-invariants) (coyote ≥ 90ms, buffer ≥ 120ms, landing squash, takeoff anticipation, land SFX/haptic). No required jump exceeds measured reach 367px; every step stays in BOS 130–200px.

**Camera (kills pole-spin and raw-dt glitch).** Anchor 0.52 leading to 0.62 with velocity; EMA on `camera.x` 0.12→0.18; dt clamped [8,40]ms then `dtSmoothingAlpha 0.10`; vertical deadzone 40px; scroll ≤ 1.5× max horizontal speed; look-ahead, landing settle, impact kick (decorative, reduced-motion-suppressed). The 3 discrete zoom levels substitute for pinch (canvas `maximum-scale=1`).

## Replay Rules

**Chart type: inherits the source surface** — a replayed gameplay run is Type B, a replayed boss round is Type C, a replayed lesson is Type A. Replay draws *the candle the player actually traded*, so its supreme rule is the **Consistency Law**.

**Consistency Law.** Given the same authored inputs, every draw path produces the same geometry and colour — because they all consume the one governing formula. Replay is pixel-faithful to the moment of the trade, so the player's memory of "the green candle I bought" matches what they see on review, eased by a match-cut rather than a hard swap.

**Determinism (the one trap unique to replay).** Type-B gameplay's mandatory ±4–8% jitter is **seeded at generation and stored with the candle** — never re-rolled at replay, which would break consistency. Replay reads geometry from record; it never re-samples `rand`. All validators run on the **stored post-jitter geometry**, so replay cannot expose a violation the live run did not have.

**Legibility at small sizes.** Replay panels are often smaller than the live world. The hard floor never yields: **14px desktop / 12px phone** for any non-doji body. If a panel cannot seat all candles above the hard floor, scale the *whole* chart proportionally (fewer visible candles, within 8–16) rather than let bodies fall below floor or clip.

**Median relief on reduced-scale surfaces.** The gameplay `median ≥ 60px` rule is unsatisfiable on a tiny panel where 55% of a 60px-tall card is 33px. So on review surfaces **below 120px chart height, the median threshold scales:** `median ≥ min(60, 0.5 × chartHeight)`; the hard floor and non-colour cues still hold. Full Type-B rhythm rules apply only at or above 120px chart height.

**Never in replay:** no re-authoring of outcomes, no colour-only encoding, no *directional* candle in the 2–4px band; a stored doji keeps its neutral `#b8c0cc` cross + `DOJI`.

## Notebook Rules

**Chart type: A/C review surface** — the Notebook stores taught concepts (Type A illustrations) and captured trade moments (Type C exam candles, or the traded Type B candle) for study. It is a *reference* surface, governed by the Consistency Law exactly as Replay is.

**Same candle, same rule.** Notebook thumbnails and detail views consume the one governing width formula, corner radius **0**, neutral wick `#c9d1d9`, and the single `COLOR` object (:2412) — no inline literals, no per-notebook palette. A concept illustrated in the lesson and later opened in the Notebook eases between the two rather than changing shape.

**Legible at small sizes (the Notebook's defining constraint).**

| Floor | Desktop | Phone (smallest) |
|---|---|---|
| Non-doji body hard floor | 14px | 12px |
| Doji band (authored / realism-driven) | 2–4px | 2–4px |
| Minimum visible wick | 6px | 6px |
| Body-vs-bg contrast | ≥ 3:1 | ≥ 3:1 |

When a stored chart is too dense to seat every candle above the hard floor at thumbnail size, scale the whole chart down proportionally and reduce the visible window — never shrink a body below 14/12px, never clip a shape into unreadability. Non-colour cues and the opposite-touch separator are mandatory at every thumbnail scale, because tiny bodies are where hue-only encoding fails first. The `median ≥ 60px` rule scales with chart height below 120px exactly as in Replay.

**Doji integrity.** The Notebook is where a child re-studies "indecision." A doji here is a neutral `#b8c0cc` cross with a `DOJI` label — never gold, never a hairline mistakable for a squashed directional candle. No stored *directional* candle may drift into the 2–4px band.

## Boss Chart Rules

**Chart type: C — Challenge/Boss** (may be realistic). The boss is a mini-game **knowledge exam**, not a movement test: `openBoss → bossRound` (~:11189). The Guardian-Trial movement gauntlet was deleted in **build 251** — **do not resurrect a movement boss.** Boss charts are read, judged, and answered; never platformed across. The roster is 11 bosses (10 Guardians for realms 0–9 plus the Market Maker in realm 10); a boss is summoned only after `tradeGatePassed()`.

**Exam integrity: test only what was taught.** Per the binding core loop — **LEARN → PRACTICE → APPLY → TEST**, **≥ 3 trades per level before the boss**, *never test the untaught* — a boss chart may present only concepts already taught, and its realism level must have been previewed at ≥ 1 earlier practice level. This is machine-enforced by the pedagogical validators (V-46–V-48).

**Inherited geometry — readability floor holds even when harder.** Same governing width formula (`WIDTH_RATIO 0.72`), corner radius **0**. Realism is permitted; the readability floor and honest magnitude are not negotiable.

| Parameter | Desktop | Phone (360) |
|---|---|---|
| Body width `BW_MIN`–`BW_MAX` | 14–46px | 12–40px |
| Target visible candles | 6–14 | 6–14 |
| Non-doji body hard floor | 14px | 12px |
| Answer candle vs neighbours | ≥ 1.3× magnitude | ≥ 1.3× |
| Doji band (authored / realism-driven) | 2–4px | 2–4px |

**Strict here (never relaxed, even in the hardest exam):**
- Non-doji body ≥ 14px desktop / 12px phone.
- **1px neutral separator on every opposite-direction touch** — dense exam charts have the most adjacent opposite candles, so this is where the 1.85:1 bull/bear luminance problem bites hardest, and where a same-hue edge would have failed.
- **Glyph + label cue** (`▲`/`▼`/`DOJI`) present, plus sheen position — a hue-blind child must be able to *answer* without colour.
- **Composition:** the answer candle is a focal read at ≥ 1.3× its neighbours' magnitude; the exam contains genuine variety, not N near-identical bodies.
- **Label placement on dense frames — no annotation overflows its candle.** On any Type C frame with **≥ 10 candles** and on **every phone frame**, only the **focal/answer candle** (and any candle the question explicitly references) carries its `▲`/`▼`/`DOJI` glyph and text; context-candle labels are **suppressed or offset** so no annotation overlaps a neighbouring body — the same focal-only discipline [Type A](#type-a--educational-illustration) uses. A `DOJI` word or glyph wider than its own candle is never painted across its neighbours; it is anchored to the focal read or moved to a caption lane.
- Colour comes solely from `COLOR`; the retired `bossCandleSVG` inline `#16c784`/`#ea3943` (:9273), radius 1.5 (:9284), and `min(46, slot*0.5)` width (:9279) are all superseded.

**Relaxed here:** exaggeration OFF (previewed via the ramp), realistic body sizes, density up to 14 candles, bodies to the 14/12 floor. Framing is **fixed** — no scrolling, no zoom, no camera; a still chart the player evaluates.

**Organic dojis are legitimate.** A realistic exam candle whose true delta lands in the band renders as a doji without a hand-flag — realism governs the doji decision in Type C.

**Reserved boss colours stay off candle bodies.** Gold `#ffd60a` and orange `#ff9f43` are boss/portal UI colours — they signal "this is a boss," and must never bleed onto a candle body or doji. A boss chart stays readable when harder through separator, glyph, sheen, composition, and the floor — never by recolouring the market.

## Pattern Library Standards

A **pattern** is an authored candle sequence that must do three jobs at once: teach a named concept, function as walkable terrain, and host a trade setup. The Pattern Library is the canonical store of these sequences. It exists to end the root architectural bug — *"every new lesson invents new candle proportions"* — nine-plus independent draw paths each minting their own geometry. No pattern enters the library by inventing geometry; every pattern **consumes** the governing width rule and cites the Standards Table.

**The ten constraints on every library entry.**

1. **One rule of geometry.** Body width is always `round( clamp( slot × WIDTH_RATIO[type], BW_MIN, BW_MAX ) )` (`WIDTH_RATIO` 0.72 for A/C, 1.0 for B). No entry hard-codes a body width, a corner radius other than `0`, or an inline colour literal. Colour comes only from `COLOR` (:2412).
2. **Exactly one declared chart type** (A / B / C), which selects the entry's `BW` band, target density, and readability floor. A pattern may *transition* across types over a level (A illustration → B terrain → C exam), easing between contexts; each rendered instance is one type and is validated as that type.
3. **The readability floor is a gate, not a goal.** A pattern that cannot pass its type's floor does not enter the library. Floors: A `≥ 24px`; B `≥ 18/16px`; C `≥ 14/12px`. The universal hard floor `14/12px` is never crossed by any non-doji candle.
4. **Directional candles read as directional and in order.** Any directional candle floors up to `≥ 18/16px`; the gameplay median stays `≥ 60px` so the floor reads as *smaller*; and magnitude ordering is preserved by the monotonic scale. Retires `CFG.minBody = 15` (:2332).
5. **Dojis are dojis only when they are.** A doji occupies the 2–4px band, drawn as a cross with `DOJI` in neutral `#b8c0cc` (edge `#7a8494`), authored in A/B or realism-driven in C. No *directional* candle enters the band. Gold `#ffd60a` is forbidden (retires quiz-doji gold at :16327).
6. **The Accessibility Law is non-negotiable** and type-appropriate: A/C carry glyph + sheen + label; B carries sheen position + opposite-edge inset + separator + a ≥28px glyph. Because bull vs bear luminance is 1.85:1, a **1px neutral separator** (`#05070a`, ≥ 3:1 vs both) is mandatory wherever opposite candles touch.
7. **Terrain must be jumpable, never boring, and feel good.** Rhythm limits in candle counts and pixels: ≤ 3 near-equal, ≤ 2 identical (incl. A-B-A-B), no dead-band step in (18,130), flat run ≤ 3 candles/220px before a ≥ 130px step, CV ≥ 0.35 per 12, a ≥ 185px peak per 12, ≥ 300px span per 20, net ≥ 130px per 10. Every step in BOS 130–200px, no gap over measured reach 367px, and the [Game-Feel Invariants](#game-feel-invariants) wired.
8. **Composition is authored, not incidental.** Type A declares a focal candle (≥ 1.3× median neighbour) and shows any relational concept at ≥ 1.5×. Type C's answer candle is a focal read at ≥ 1.3× its neighbours.
9. **Authored, then verified — never procedurally guessed.** Procedural output must pass every threshold below and be signed off before entering the library; a boss/lesson chart must *contain* the concept it teaches/tests. Patterns are not market recordings — A and B trade realism for legibility.
10. **Trade truth defers upward.** This library governs the **visual** layer only. What a trade *means*, whether it wins, and why, is owned by `docs/canon/trading_canon.md` and `CHARTQUEST_TRADING_EXPERIENCE_SYSTEM_v1.1.md`. A pattern specifies *where* the decisive candle sits and *how clearly* it reads; it may never encode a trade outcome as a visual win-knob.

**Do-not-resurrect.** The Guardian-Trial movement gauntlet was deleted at build 251. No library pattern may reintroduce a boss that is a traversal gauntlet; the boss is a knowledge exam.

## Pattern Library Specification

Every pattern is a single record with a **header block** and **nine authored fields**. A pattern is incomplete — and rejected — until all fields are filled and it passes validation and the [Human Playtest Gate](#qa-checklist). This section defines the template and the acceptance test for each field. It deliberately specifies **no concrete pattern**; it specifies how any future pattern is built.

**Header block (required metadata).**

```
Pattern ID:            <stable-kebab-id>
Chart Type:            A | B | C            (selects BW band, density, floor)
Realm / Level:         <realm 0–10> / <level>
Teaches (concept):     <single named concept>
Concept scope:         single-candle | relational
Prerequisites taught:  <concepts this pattern may assume>
Exaggeration gain:     <1.0 … 0.0>          (position on the ramp)
Platform target:       desktop + phone (smallest 360)   [both must pass]
Playtest record:       <link to ≥5-child, ≥90%, ≥1 CVD result>   [required to ship]
Cites:                 Visual Market Constitution — Standards Table
Trade-truth owner:     docs/canon/trading_canon.md (causality NOT defined here)
```

**The authoring template — fill every field.**

```
### Purpose
### Difficulty
### Lesson
### Terrain quality
### Traversal quality
### Trade opportunities
### Visual clarity
### Approved uses
### Forbidden uses
```

**Field-by-field acceptance criteria.**

**Purpose.** One sentence, in ten-year-old wording, stating what the player should *feel or understand*. Names exactly one primary concept (matching the header `Teaches`). A pattern with two "main points" is split.

**Difficulty.** Declares the rung and *how* difficulty is expressed — via chart type, density, platformer rhythm, **and the exaggeration-gain step** — **never** by dropping below the readability floor. Records the target on-screen count and resulting `slot` so derived `bodyW` can be checked, and which floor applies (A 24 / B 18·16 / C 14·12).

**Lesson.** States the LEARN→PRACTICE→APPLY→TEST stage(s) served and the concept assumed. **Never test the untaught:** any concept referenced in an APPLY/TEST use must appear in `Prerequisites taught` or be the pattern's own `Teaches` concept, introduced first in LEARN — enforced by the teach-order DAG validator (V-46). Type A/C carry explicit `▲/▼/DOJI` labels.

**Terrain quality.** Defines the candles-as-platform surface. Bodies sharp (`radius 0`) with hair-overlap bleed (`bw = c.w+1`, `bx = sx−0.5`, `WIDTH_RATIO 1.0`) so tops form a continuous road; gameplay gap `0`. Top sheen ≥ 3px at alpha ≥ 0.8, contrast ≥ 3:1, plus dark opposite-edge inset. **Mandatory** width jitter ±4–8% (seeded), ≥ 4 height buckets per 8-candle window. Max body height `min(55% visible height, 420px)`.

**Traversal quality.** Proves the pattern is walkable, never dead, and feels good. Satisfies: ≤ 3 near-equal (Δ ≤ 18px), ≤ 2 identical (incl. A-B-A-B), no step in the (18,130) dead band, ≤ 220px flat before a ≥ 130px step; jump cadence 4–6; each step 130–200px; no gap over 367px; net ≥ 130px per 10; ≥ 300px span per 20; CV ≥ 0.35 and a ≥ 185px peak per 12. Camera anchor 0.52→0.62, EMA 0.12→0.18, dt clamp [8,40]/`dtSmoothingAlpha 0.10`; coyote ≥ 90ms, buffer ≥ 120ms, landing squash + SFX/haptic. Scroll ceiling 1.5× max horizontal speed.

**Trade opportunities.** Specifies **where** the setup sits and **how clearly it reads** — visual layer only. Records the decisive candle(s), confirms each meets its type floor and is unambiguously directional (never in the 2–4px band unless the setup *is* a taught doji). Opposite-direction touches carry the neutral separator. Count and placement must let a level reach **≥ 3 trades before its boss** (V-47). **Outcome, probability, and causality are owned by `trading_canon.md`.** The trade portal's reserved colour is blue `#4cc3ff`; never a candle body.

**Visual clarity.** The validation checklist the pattern passes on desktop **and** the smallest 360px phone (all CSS-px, pre-DPR):

| Threshold | Value | Source |
|---|---|---|
| Body width ratio of slot | 0.72 (A/C) / 1.0 (B) | engine :19290 / road continuity |
| Body width band (A / B / C desktop) | 32–56 / 24–56 / 14–46 | Standards Table |
| Body width band (A / B / C phone-360) | 24–48 / 18–44 / 12–40 | Standards Table |
| Min directional body (desktop / phone) | 18 / 16 | Minimum Visible Movement |
| Hard floor body (desktop / phone) | 14 / 12 | Standards Table |
| Educational min body (Type A) | 24 | Standards Table |
| Median visible body (gameplay) | ≥ 60 | median-clarity |
| Floored body ≤ fraction of median | 0.3 | Standards Table |
| Doji band | 2–4 | dojiBand |
| Corner radius | 0 | :12912, :19301 |
| Separator (opposite-touch) | 1px `#05070a`, ≥ 3:1 vs both | Contrast Rules |
| Wick width | `clamp(bodyW*0.05, 1.6, 3.0)`, floor wins | Standards Table |
| Wick length (B) | 0 or ≥ 28px; pattern-candles map true high/low | Wick Standards |
| Min visible wick (A/C, else not drawn) | 6 | wick |
| Wick colour (default) | `#c9d1d9` | COLOR:2412 |
| Body-vs-bg contrast | ≥ 3:1, target 4.5 | contrast |
| Sheen-vs-body (B) | ≥ 3:1, ≥ 3px, alpha ≥ 0.8 | Accessibility |
| Non-colour direction cue | required, type-appropriate | Accessibility Law |
| Focal / relational ratio (A) | ≥ 1.3× / ≥ 1.5× | Type A |

**Approved uses.** Enumerates the cleared contexts — realm/level, lesson stage, chart-type instances. A pattern approved only for LEARN may not silently appear in a TEST.

**Forbidden uses.** Baseline forbidden list for **every** pattern: inventing any number outside this table; corner radius other than `0`; inline colour literals; hue-only direction; a *directional* candle in the doji band or an unlabelled/accidental doji; gold `#ffd60a` or any reserved portal colour on a candle body; body-coloured or engine-hex wicks (`#1fd790`/`#ff5663`); a flat run beyond 3 candles/220px; a step in the (18,130) dead band; a required jump beyond 367px; a metronome staircase; zero-jitter terrain; resurrecting the Guardian-Trial gauntlet; encoding a trade outcome as a visual win-knob.

## Lesson Standards

Lessons are the LEARN and PRACTICE stages, and the home of **Type A — Educational Illustration**. The style-LOCKED LessonChart engine (:19290, 10/10, mirrored by `lesson-chart-preview.html`) is the proportion source of truth; its `0.72`-of-slot width and sharp `radius 0` body are law. A lesson never renegotiates geometry — it inherits it.

**Type A rules a lesson may never lower.**
- **Exaggeration ON** (at the ramp's high end). Educational min body 24px, drawn in the illustration area (`H*0.44`, :16497–16542).
- **Width from the one rule.** `bodyW = round(clamp(slot*0.72, 32, 56))` desktop, 24–48 phone; the retired fixed 44 *emerges*. Gap derived from rounded width.
- **Composition:** a declared focal candle ≥ 1.3× median neighbour, centre band, context candles dimmed; relational concepts at ≥ 1.5×.
- **Density/framing:** no zoom; auto-fit with 8% padding; 6–10 candles (or 1–5 focus).
- **Sheen and separator:** sheen `bw*0.16`; 1px neutral separator on opposite-touch.
- **Labels mandatory:** `▲`/`▼`/`DOJI` plus sheen-position cue.
- **Dojis are taught, not stumbled into:** authored 2–4px, neutral, cross, labelled; edge always drawn.
- **Comprehension is measured:** the lesson passes the ≥ 90% label-hidden Human Playtest Gate before shipping.

**Sequencing law — never test the untaught.** A lesson introduces one concept in LEARN, rehearses it in PRACTICE; only then may an APPLY trade or a TEST/boss reference it. The `Prerequisites taught` field is the contract, enforced by the teach-order DAG (V-46), not by hope.

**Wording.** All lesson text and concepts are worded for a ten-year-old. The lesson portal's reserved colour is purple `#a855f7`; never a candle body.

## Trade Standards

Trades are the **APPLY** stage. This constitution governs the **visual presentation** of a setup and nothing more. What a setup *means*, its probability, and its honest outcome are supreme in `docs/canon/trading_canon.md` and `CHARTQUEST_TRADING_EXPERIENCE_SYSTEM_v1.1.md`. On causality, trade-truth wins; this document wins only on how candles are drawn.

**The counting law.** Every level presents **at least 3 trades before its boss**; the boss is summoned only after `tradeGatePassed()` (`openBoss → bossRound` ~:11189). Machine-enforced by V-47. A pattern's `Trade opportunities` field must place enough legible setups without inventing off-screen trades.

**Visual honesty of a setup (what this doc enforces).**
- **The decisive candle reads as decisive** — meets its type floor, is unambiguously directional (`≥ 18px` gameplay / `≥ 24px` illustration), never in the doji band unless a doji *is* the taught signal, and is a focal read where the setup depends on it.
- **Boundaries never blur** — wherever opposite candles touch at a setup, the 1px neutral separator is present.
- **Non-colour cue always** — direction legible by sheen position, glyph, separator; never hue alone.
- **Honest magnitude** — rendered candles faithfully represent the authored data; ordering is preserved. Puppeteering a candle's *shape* to contradict its authored setup is forbidden here; puppeteering its *outcome* is forbidden by `trading_canon.md`. The picture is honest and the result is honest.

**What this doc does not decide.** Win/loss, reward, streak logic, confidence scoring, and the causal regime→evidence→outcome pipeline are owned entirely by trade-truth canon. No visual rule may be read as a probability or a win-knob. The trade portal's reserved colour is blue `#4cc3ff` — never a candle body.

## Difficulty Standards

Difficulty is expressed through **chart type, exaggeration gain, on-screen density, platformer rhythm, timing, and which concepts are in play** — **never** by degrading readability below the floor. The review's key correction is honoured here: **difficulty is not merely density-to-the-floor.** A harder level is not just a more crowded, smaller-candle version of an easy one (which feels claustrophobic); it adds rhythm, timing, verticality, and less exaggeration.

**The type ramp.**

| | Type A — Educational | Type B — Gameplay | Type C — Challenge/Boss |
|---|---|---|---|
| Purpose | teach instantly | readable, fun, walkable | exam; may be realistic |
| Exaggeration gain | 1.0 | 1.0 → 0.6 → 0.3 across a realm | 0 (previewed first) |
| Min body (desktop / phone) | 24 | 18 / 16 | 14 / 12 |
| Body width band (desktop) | 32–56 | 24–56 | 14–46 |
| On-screen candles | 6–10 (or 1–5 focus) | 12 (8–16) | 6–14 |
| Realism | authored 0–100 | curated | realistic allowed |

**Exaggeration is a measured, ramped parameter.** Within a Type-B realm the gain steps down (e.g. `1.0 → 0.6 → 0.3`) so the learner meets progressively less-amplified candles in PRACTICE/APPLY before the Type-C exam turns it to 0. A boss's realism level must have been previewed at ≥ 1 earlier practice level — no first-contact-at-the-exam cliff.

**What the gain physically does (transfer function).** Gain is not a mood label — it is a measured multiplier on rendered magnitude, so V-48's "realism previewed" is a quantity, not an adjective. Let `honestH(c)` be the truthful, monotonic price-to-pixel height of candle *c* (the mapping of [Readability Law 3](#readability-laws) / V-43), and let `exaggeratedH(c)` be that **same** monotonic map driven to its maximum authored amplification — the Type-A illustration height, floored and still under the `min(55%, 420px)` cap. Then the rendered body height is `renderedH(c) = lerp( honestH(c), exaggeratedH(c), gain )`. **gain = 1.0** renders the fully-amplified Type-A illustration; **gain = 0.0** renders the honest realistic mapping (Type C); the Type-B ramp `1.0 → 0.6 → 0.3` interpolates between them. Because **both endpoints are order-preserving and both respect every floor**, monotonic magnitude ordering and the readability floors hold at *every* value of gain — the parameter changes only *how much* a move is amplified, never *whether* the bigger move still looks bigger. No new free constant is introduced: both endpoints are already defined by this table.

**The density lever (one of several).** The three zoom steps set the window: Close 8 / Default 12 / Wide 16; gameplay default 12. Because `bodyW` derives from `slot = width / visibleCount`, raising the count shrinks bodies toward the floor — density is *a* lever, and the floor is its stop. But density is never the *only* lever, so hard levels don't become uniformly cramped. Pinch-zoom is off on the canvas (WCAG 1.4.4 exception); the 3 discrete levels substitute.

**The rhythm & timing levers.** Harder levels add rhythmic interest, not just smaller candles: tighter jump cadence (toward the 4-candle end), more frequent peak-magnitude steps, more required verticality range, faster (still capped) scroll. Flat difficulty *floors* hold at every rung (≤ 3 near-equal, ≤ 2 identical, ≤ 220px flat, no dead-band step), so "harder" never means "deader."

**The boss rung.** Bosses are Type C **knowledge exams**, not traversal gauntlets (Guardian-Trial deleted at build 251). Roster: 11 bosses — 10 Guardians (realms 0–9) plus the Market Maker (realm 10). Gated: summoned only after ≥ 3 trades and `tradeGatePassed()`, and **only tests taught concepts** — the sequencing law reaches the exam (V-46–V-48). Type C may relax exaggeration and use realistic, dense charts (to 14/12px, up to 14 candles) but keeps every floor, the composition/variety law, the doji band, contrast, glyph-plus-label cue, and the neutral separator.

**The floor that never moves — for any type, at any difficulty.**
- Non-doji body ≥ 14px desktop / 12px phone.
- 1px neutral separator wherever opposite candles touch (≥ 3:1 vs both).
- A non-colour direction cue always present (Accessibility Law).
- Body-vs-background contrast ≥ 3:1.
- No *directional* candle in the doji band; honest, order-preserving magnitude.
- Corner radius 0.
- No section — and no difficulty setting — invents a number; every draw path cites this table.

## Forbidden Candle Configurations

These are the candle shapes that shipped, or nearly shipped, and broke the game. Each is now illegal by construction — a constitutional violation the Validator must fail before it reaches a ten-year-old. Every threshold is consumed verbatim from the Standards Table.

**F-C1 · The Flat Candle** — a directional body below the readable floor (the "candles too flat" bug, root `CFG.minBody = 15` :2332). *Violates* `minReadableBodyPx 18/16`. *Check:* every non-doji body ≥ 18px desktop / 16px phone, never below 14/12.

**F-C2 · The Sub-Floor Candle** — any body below 14px desktop / 12px phone. Retires the five accidental floors (15 :2332, 6 :16538, 5 :16327, 3 :9284, 2 :14393). *Violates* `hardFloorBodyPx 14/12` (all types). *Check:* `bodyH ≥ 14/12` for every non-doji candle, even Type C.

**F-C3 · The Accidental Doji** — a *directional* candle that shrank into the 2–4px band. *Violates* the doji-band reservation. *Check (two-sided):* every 2–4px body is a legitimate doji (authored in A/B, realism-driven in C); every candle without doji status is ≥ 18px (desktop). A candle is a doji or directional-and-floored — never a directional candle that shrank into the band.

**F-C4 · The Gold Doji** — a doji in reserved gold `#ffd60a` (retires quiz path :16327). *Violates* the reserved-portal-colour rule. *Check:* no candle body uses `#a855f7`/`#4cc3ff`/`#ffd60a`/`#ff9f43`; every doji is `#b8c0cc` body / `#7a8494` edge, cross + `DOJI`.

**F-C5 · The Colour-Only Green Candle** — a bull encoded by hue alone (no sheen, glyph, or separator), the "green candles fail to communicate buying pressure" failure. *Violates* the Accessibility Law; bull `#16c784` vs bear `#ea3943` luminance is 1.85:1, so hue cannot carry direction. *Check:* `nonColourCueRequired = true`; render a hue-stripped copy and confirm every candle separable by sheen POSITION, glyph, inset, and separator. Fail if direction is recoverable only from colour.

**F-C6 · The Edgeless / Same-Hue-Edged Touch** — two opposite candles butting with no separator, **or** separated only by a same-hue darker edge that fails 3:1. Because bull vs bear is 1.85:1 and the old `#0c9c69`/`#c0212c` edges clear only ~1.2–1.7:1 against neighbours, they merge into one blob — guaranteed in Type B where gap 0 is canon. *Violates* `separatorMandatoryOnOppositeTouch`, `separatorContrastVsBothBodiesMin 3`. *Check:* every adjacent opposite pair shows the 1px neutral `#05070a` separator, and `contrast(separator, leftBody) ≥ 3 AND contrast(separator, rightBody) ≥ 3`.

**F-C7 · The Rounded Candle** — non-zero corner radius (1.5 :9284, 3 :15623, 5 :16521/:16540). A candle rounded in the lesson but sharp in the world changes shape between screens, and a rounded top is not a continuous walkable road. *Violates* `cornerRadiusPx 0`. *Check:* `cornerRadius === 0` on every body; no `arcTo`/`borderRadius`/radius arg on a candle rect.

**F-C8 · The Forked Width** — a hard-coded or path-local width (44 :16521, 32 :15613, 14 :14344, `min(46,slot*0.5)` :9279, `clamp(pitch-3,5,28)` :13962, raw `candleW[24,56]` :3257). The root architectural bug. *Violates* the governing width rule. *Check (static):* no numeric width literal **within the enumerated candle-draw symbols** — `drawGameplayCandle` (:12852), `drawPredictionCandle` (:16521), `LessonChart` (:19290), `bossCandleSVG` (:9273), `drawQuizCandle` (:16319), the lesson-card (:15613), mini-panel (:14344) and trader-view (:13962) draws — scoped to those symbol bodies, not a whole-file grep (which cannot tell a candle-geometry constant from any other number). *Check (runtime):* `bodyW === round(clamp(slot × WIDTH_RATIO[type], BW_MIN, BW_MAX))` for the active type's bounds and ratio, `12 ≤ bodyW ≤ 56`.

**F-C9 · The Forked / Coloured Wick** — any retired width (1.5/2/2.5/3px) or colour (body-coloured, `#1fd790`, `#ff5663`). *Violates* the wick formula/colour. *Check:* every non-hazard wick is `#c9d1d9`, width `clamp(bodyW*0.05, 1.6, 3.0)` (1.6 floor wins), effective ratio cap `max(0.08, 1.6/bodyW)`. Only permitted non-neutral wicks: `#7fd6ff` (spin, 2.5px, with non-colour hazard cue) and `#ff7a45` (sweep, 3px).

**F-C10 · The Phantom / Dishonest Wick** — a hairline stub, a wick outside the tuned envelope, or a *clamped* wick that fabricates/erases a taught shadow. *Violates* the wick length precedence. *Check:* in A/C a drawn wick is ≥ 6px (else not drawn); in B it is 0 or ≥ 28px; a general gameplay wick is within `[28,74]`, but authored hammer/doji/marubozu candles are **exempt** and map to true high/low; the wickless state carries an authored flag.

**F-C11 · The Screen-Filling / Magnitude-Collapsing Candle** — a body over `min(55% visible height, 420px)`, or a scale that collapses two large moves onto the cap as equals. *Violates* the max-height cap and order preservation. *Check:* `bodyH ≤ min(0.55×visibleHeight, 420)`; above the cap, governed log compression keeps large moves ordered and distinguishable; sorting by `|delta|` yields non-decreasing heights.

**F-C12 · The Inline-Colour Candle** — hardcoded hexes bypassing `COLOR` (boss inline `#16c784`/`#ea3943`, card edges `#0d9460`/`#b52a30`, engine `C{}`). *Violates* `noInlineColourLiterals`. *Check:* static grep — no colour hex literal in a candle draw call; every fill/stroke references `COLOR`.

## Forbidden Chart Configurations

A single legal candle is not enough. The *arrangement* — as terrain, scene, and scrolling world — is where "boring platforming," "flat terrain," and "glitchy motion" live. These govern the chart as a whole, evaluated over every sliding on-screen window at all three zoom levels on the final post-jitter geometry.

**F-CH1 · The Flat Terrain Run** — a run of near-equal candles (body-tops within 18px) that goes dead, the "charts become flat terrain / boring platforming" failure. *Check:* ≤ 3 consecutive near-equal candles and no flat span > 220px without a following ≥ 130px step (within BOS 130–200, under reach 367).

**F-CH2 · The Missing Verticality** — terrain that never meaningfully climbs. The old F-CH2 threshold was the 40px deadzone — absurdly permissive. It is raised: a level whose **total vertical span stays under 200px over any 12 candles FAILs**, and every 20-candle stretch must span **≥ 300px** of the 620px stage. *Check:* net ≥ 130px change per 10 candles; span ≥ 300px per 20; jump cadence 4–6 with steps 130–200px.

**F-CH3 · The Un-Jumpable Gap / Step** — a required gap over measured reach 367px, or a step outside BOS 130–200px. *Check:* every required gap ≤ 367px; every jumpable step in `[130,200]`; validated against the *measured* reach envelope, re-measured on any movement-constant change.

**F-CH3b · The Dead-Band Step** — a consecutive body-top delta in the forbidden `(18,130)px` gap: too big to walk cleanly, too small to be a real jump ("gravel terrain"). *Check:* every consecutive body-top delta is ≤ 18px or ≥ 130px, except at most one organic bump in `(18,60]` per 6 candles; nothing in `(60,130)`.

**F-CH4 · The Cloned Run / Wallpaper** — more than 2 identical candles, **or** an A-B-A-B alternation of exactly two heights, **or** fewer than 4 height buckets in an 8-candle window. Signals RNG that ignored educational intent. *Check:* ≤ 2 identical in a row; no two-value alternation; ≥ 4 height buckets per 8; required ±4–8% jitter present.

**F-CH4b · The Metronome Staircase** — regular identical-magnitude steps that pass every anti-flat rule yet read as a trance (the Nintendo "maximally monotonous legal chart"). *Check:* step-delta CV ≥ 0.35 per 12-candle window; ≤ 2 consecutive steps in the same signed magnitude bucket; ≥ 1 peak step ≥ 185px per 12 candles.

**F-CH5 · The Under/Over-Dense Chart** — on-screen count outside the tuned window, shrinking bodies below floor or emptying the world. *Check:* gameplay count within `[8,16]` (target 12); Type A 6–10 (or 1–5 focus); Type C 6–14; the resulting `slot × WIDTH_RATIO` width lands inside the active type's `[BW_MIN, BW_MAX]`.

**F-CH6 · The Wrong-Continuity Chart** — (a) a Type A/C chart with candles touching (gap 0 robs each shape of study room), or (b) a Type B chart with gaps instead of the continuous road (drops Finn through terrain that should be solid). *Check:* Type B renders gap 0 with the `+1/-0.5` bleed and `WIDTH_RATIO 1.0`; Type A gap derived from rounded width; Type C gap `0.28×slot`.

**F-CH7 · The Pole-Spin Camera** — a rigid camera orbiting `turtle.x` that jerks the world back (build 233). *Check:* camera X is an EMA (`alpha 0.12→0.18`) toward the velocity-led anchor (0.52→0.62), never `camera.x = turtle.x`; frame-pump yields monotonic `camera.x` (no per-step reversal).

**F-CH8 · The Raw-dt Jitter** — motion integrated against raw, unclamped dt (builds 234/242). *Check:* every frame's dt clamped to `[8,40]ms` then EMA-smoothed at `dtSmoothingAlpha 0.10`; a synthetic 200ms frame produces no lurch beyond the clamped step.

**F-CH9 · The Runaway Scroll** — scroll velocity over 1.5× max horizontal speed, tearing the world and smearing candles the child must read. *Check:* instantaneous scroll ≤ 1.5 × max horizontal speed; at the ceiling, a captured frame's directional cue remains identifiable (motion-readability gate).

**F-CH10 · The Vertical Runaway / Out-of-Bounds World** — vertical motion with no deadzone, or terrain leaving world bounds. *Check:* vertical motion only past the 40px deadzone; terrain Y within `[80,700]`; ground row always in view.

**F-CH11 · The Un-Fitted Educational Scene** — a Type A illustration not auto-fitted (clipped, no padding, exaggeration wrongly off, no focal candle, or body under 24px). *Check:* auto-fit with 8% padding; 6–10 (or 1–5 focus) candles; exaggeration at ramp-high; every body ≥ 24px; a declared focal candle ≥ 1.3× median neighbour; relational concepts ≥ 1.5×; gap from rounded width; explicit labels.

**F-CH12 · The Chart-Type Confusion** — realistic dense candles in a Type A lesson (exaggeration wrongly off), exaggerated candles in a Type C exam (wrongly on), or relaxing a never-relax floor "because it's only a boss chart." *Check:* each scene declares its type and satisfies that type's strict list and floor (A ≥ 24; B ≥ 18/16, median ≥ 60; C ≥ 14/12); independently assert every never-relax invariant on all three.

**F-CH13 · The Low-Median Chart** — a gameplay chart whose typical candle hovers near the floor, so the 18px floor no longer reads as *small*. *Check:* median visible body ≥ 60px; every floored (18px) candle ≤ 0.3 × median (the single, consistent direction of the 0.3 constant). This resolves the former V-06/F-CH13 contradiction: 0.3 is a **ceiling on floored candles**, and median ≥ 60 makes `18 ≤ 0.3×60` hold.

**F-CH14 · The Pinch-Zoomed Canvas / Missing Zoom Ladder** — pinch enabled on the game canvas, or the 3-level substitute missing. *Check:* canvas sets `maximum-scale=1 / user-scalable=no`, AND exactly 3 discrete zoom levels are wired (8/12/16).

**F-CH15 · The Procedural Override of Educational Intent** — a generator producing a chart that contradicts the taught concept, or a boss that exams before the concept was taught. *Check:* every teaching (A) and exam (C) chart is authored (or generated then verified) to *contain* its concept with the required cue and label; any generated gameplay run passes every F-C and F-CH check on rendered geometry; the teach-order DAG (V-46) confirms no boss tests the untaught.

**F-CH16 · The Runtime-Only Failure** — a chart that passes author-time validation but violates a floor in a live scroll window on the player's device (the procedural + runtime silent-failure gap). *Check:* the runtime conformance layer re-runs the geometry/rhythm assertions on every window; on failure it regenerates deterministically (bounded retries) then falls back to a known-good authored chart, and increments the `chart_conformance_fail` telemetry counter so the failure is never silent (see [Automated Validation Rules](#automated-validation-rules)). *Player-safety clause:* regeneration acts only on **not-yet-entered (off-screen) windows before they are presented** — a window already under Finn is never mutated (or, if a fallback must change visible terrain, it is match-cut eased), because terrain the player stands on must never pop.

## Accessibility Standards

### The Never-Colour-Only Law

Direction is **never** conveyed by hue alone. This is the ratified Accessibility Law of `CHARTQUEST_TRADING_EXPERIENCE_SYSTEM_v1.1.md`; on the visual layer it is absolute and machine-enforced (`nonColourCueRequired = true`). A green body that reads as "up" only because it is green is a **defect**. The engineering trigger is a hard contrast fact, verified in review: bull `#16c784` versus bear `#ea3943` body-to-body luminance contrast is **1.85:1** — two touching opposite candles cannot be separated by colour at all. The boundary is carried by shape, position, and a neutral separator, never by hue.

### The Redundant-Cue System (type-dependent)

Every candle ships **multiple** simultaneous, non-colour signals of direction. A reader who perceives no colour still resolves each candle. The cue-set depends on type, which fixes the review's finding that a single glyph-on-every-candle rule rejected all gameplay candles:

| Direction | Colour (one of several) | Position cue | Glyph | Boundary |
|---|---|---|---|---|
| **Bull** | body `#16c784` | bright top sheen `#5dedb5` on the **TOP** edge | `▲` (A/C; B if body ≥ 28px) | neutral separator `#05070a` on opposite-touch |
| **Bear** | body `#ea3943` | darker bottom shadow `#f3838a` on the **BOTTOM** edge | `▼` (A/C; B if body ≥ 28px) | neutral separator on opposite-touch |
| **Doji** | neutral `#b8c0cc` | cross/plus shape | `DOJI` label (A/C); flat-marker tile (B) | edge `#7a8494`, always drawn |

**Labelled contexts (Types A, C):** sheen position + `▲/▼/DOJI` glyph + separator. **Gameplay (Type B):** because glyphs are not painted on every walkable candle, direction rests on **two floored position cues** — a sheen stripe **≥ 3px at alpha ≥ 0.8 with sheen-vs-body contrast ≥ 3:1**, and a **dark opposite-edge inset** that clears 3:1 even on luminous green bodies where a lighter-still sheen cannot — **plus a `▲/▼` glyph on any body ≥ 28px wide**. The load-bearing signal is **position**, and it is never left to a single thin stripe; a hue-blind reader distinguishes every candle by sheen position, the opposite-edge inset, the glyph where present, and the separator.

The colour authority is the single global `COLOR` object (:2412). No draw path inlines a direction hex; the retired forks all resolve to `COLOR`. Inline literals are a validation FAIL.

### Colour-Blind Safety

- **Body vs background:** min 3:1, target 4.5:1. Bull `#16c784` (8.8:1) and bear `#ea3943` (4.76:1) pass.
- **Adjacent bodies:** bull vs bear is 1.85:1 — hue fails, so a **1px neutral separator `#05070a` is mandatory** on every opposite-touch, clearing ≥ 3:1 against both neighbours. The separator, not colour and not a same-hue edge, is the boundary.
- **Sheen vs body (Type B):** ≥ 3:1, backed by the dark inset.
- **Wick vs background:** `#c9d1d9` on `#0a0e14` is ~12:1. Wicks read as structure, not direction.
- **Doji vs background:** ≥ 3:1; neutral `#b8c0cc` plus cross + `DOJI` make it unmistakable without colour.
- **Greyscale gate:** a hue-stripped render of any chart must still separate every candle by position/glyph/separator (machine check, run at 360px, including a same-direction gameplay run).

### Reduced Motion Honoured — and a real low-motion mode

`prefers-reduced-motion` suppresses **decorative** movement only: idle sheen shimmer, parallax, camera settle/impact kick, celebratory animation. The camera-readability system (EMA smoothing, dt clamp) is a nausea *reducer* and is never disabled. But the largest motion source is the full-screen auto-scroll itself, which smoothing alone does not fix for a vestibular-sensitive child — so reduced-motion additionally enables a **first-class low-motion traversal mode**: the viewport advances **one candle per input (discrete stepping), no continuous scroll**, and the trade decision may be presented as a **static read-then-answer** chart. Directional meaning is carried entirely by static cues, so a reduced-motion reader loses nothing load-bearing.

### The Pinch-Zoom / WCAG 1.4.4 Exception

The game canvas ships `maximum-scale=1` / `user-scalable=no` — a **deliberate, documented exception to WCAG 1.4.4**, taken because pinch-zoom hijacks the touch input the canvas needs for movement. The exception is **narrow and compensated**: it applies only to the interactive game canvas, and the substitute is the **three discrete zoom levels** (Close 8 / Default 12 / Wide 16). Text and static UI outside the canvas remain pinch-zoomable and legible.

## Mobile Readability Standards

Every chart must pass on the **smallest** supported viewport, not the largest. "Looks fine on my laptop" is not a ship criterion. All thresholds are CSS reference pixels, measured before DPR scaling.

### Viewport Matrix

| Class | Viewport (CSS px) | Role |
|---|---|---|
| Minimum supported (graceful) | **320 × 568** | Below the readability gate — density auto-reduces to hold floors |
| Phone (smallest — **governing gate**) | **360 × 800** | Worst-case full-readability gate |
| Phone | 375 × 667 | |
| Phone | 390 × 844 | |
| Phone (largest) | 430 × 932 | |
| Tablet | 820 × 1180 | |
| Landscape / split-screen | tested for each phone width | must not overlap the road or clip controls |

The **360 × 800** column governs full readability. Below 360 (down to 320, and folding-phone cover screens), the game does not simply shrink bodies below floor: it **reduces the visible candle count** so `bodyW`/`bodyH` floors still hold, and if a viewport is too small to seat even the minimum window above the hard floor it shows a graceful "rotate / screen too small" message rather than rendering illegible candles. Landscape and split-screen are explicitly tested. This documents the product decision the review asked for: full readability is *guaranteed* at ≥ 360; 320–359 degrades density gracefully; below that, a message.

### Minimum Readable Body on the Smallest Viewport

On phone, the minimum **readable** non-doji body is **16px**, with a **hard floor of 12px** below which no directional candle ever renders. A directional body whose mapped delta would draw smaller floors up to 16px. (Desktop: 18px readable, 14px hard floor.) Per-type body-width clamps on the smallest phone (360):

| Type | Phone `BW_MIN` | Phone `BW_MAX` |
|---|---|---|
| A — Educational | 24 | 48 |
| B — Gameplay terrain | 18 | 44 |
| C — Challenge/Boss | 12 | 40 |

Width is always `round( clamp( slot × WIDTH_RATIO[type], BW_MIN, BW_MAX ) )`. The ratio is law across every viewport; only the clamp bounds change per type and per phone-vs-desktop.

### Coordinate Space & devicePixelRatio Capped at 2 (P1-11)

All thresholds are **CSS reference px, pre-DPR**. The game canvas currently uses an **uncapped** `devicePixelRatio` (**P1-11**, ~:2418) while other canvases cap at 2 — a defect: on a 3× phone the backing store balloons, hurting frame pacing for zero readability gain past 2×. **Law:** every chart canvas caps `dpr = min(window.devicePixelRatio, 2)`. Machine-checkable ship gate.

### Frame-Rate Floor & Low-End Device Gate

The dt clamp `[8,40]ms` means a phone running below 25fps blows the clamp every frame and drifts into slow-motion, desyncing from wall-clock. The audience's hand-me-down phones will not all deliver 60fps, so: a **named low-end baseline device** (a measured ~$120-class Android, not a throttled laptop) is in the test matrix, and the gate is **sustained ≥ 30fps** on it. When measured dt repeatedly exceeds the clamp, the game **degrades deliberately** (reduce visible candle count, disable sheen shimmer) rather than silently slow-mo. This is QA row 11.

### Text and Touch Targets

- **Text ≥ 12px** — no chart label, glyph caption, axis text, or `DOJI`/`▲`/`▼` annotation renders below 12px on any supported viewport.
- **Dense-frame label placement** — where bodies sit near the width floor (dense Type C or any phone frame), glyphs and labels never overflow onto adjacent candles: only the focal/answer candle is annotated, and context labels are suppressed or offset (see [Boss Chart Rules](#boss-chart-rules)). A label is never allowed to be wider than the candle it describes without being moved to a caption lane.
- **Touch targets** for the three zoom controls and any on-chart control are ≥ ~44px and must not overlap the walkable candle road.
- Pinch is off on the game canvas (WCAG 1.4.4 exception); the three zoom levels are the touch substitute.

## QA Checklist

A human runs this gate **per chart, before it ships**. Every row is pass/fail. **One fail blocks the ship** — there is no "mostly passes."

| # | Gate | Pass condition | Fail example |
|---|---|---|---|
| 1 | **Min readable body** | Every directional body ≥ 18px desktop / 16px phone; none below hard floor 14/12. | A 9px candle on 360×800 reads as a flat line. |
| 2 | **Trend & magnitude clarity** | Direction *and which move was bigger* legible in one glance, colour ignored; ordering preserved. | Two different-sized moves both floored to 18px. |
| 3 | **No accidental doji** | No *directional* candle in the 2–4px band; dojis are authored (A/B) or realism-driven (C), cross + `DOJI`. | A small real move drew at 3px as indecision. |
| 4 | **No flat / dead terrain** | ≤ 3 near-equal, no flat > 220px without a ≥ 130px step, no step in (18,130), no metronome; CV ≥ 0.35 and a ≥ 185px peak per 12. | Eight near-equal candles, or a metronomic staircase. |
| 5 | **Readable momentum** | Median visible body ≥ 60px; floored candles ≤ 0.3 × median. | Every candle near the floor — small and big look identical. |
| 6 | **Platform quality** | Continuous road (gap 0); no required jump > 367px; every step in BOS 130–200px; ≥ 300px span per 20. | A 400px gap — unreachable softlock. |
| 7 | **Game feel** | Coyote ≥ 90ms, buffer ≥ 120ms, landing squash + SFX/haptic, takeoff anticipation wired. | Jump lands like a cursor snapping to a grid. |
| 8 | **Camera quality** | No pole-spin; no raw-dt stutter; velocity look-ahead 0.52→0.62; scroll never tears. | "Chart scrolls then jerks back" (build 233). |
| 9 | **Mobile readability** | Passes the full checklist on 360×800; degrades gracefully 320–359; landscape/split tested. | Fine on laptop, unreadable on the smallest phone. |
| 10 | **Visual hierarchy** | Reserved portal colours never on a candle body; wicks neutral `#c9d1d9`; hazard cyan/orange only as mechanics with a non-colour cue; opposite-touch separator neutral `#05070a`. | A gold doji collides with boss/portal semantics. |
| 11 | **Low-end performance** | Sustained ≥ 30fps on the named low-end baseline device; deliberate degrade, not slow-mo. | Cheap Android drifts into permanent slow-motion. |
| 12 | **Lesson consistency** | A candle is the same shape/proportion in the lesson (:19290) and the world (:12852): governing width, radius 0, neutral separator; eased transition. | Rounded 5px in the lesson, sharp in the world. |

### Human Playtest Gate (comprehension is measured, not assumed)

A developer is not a ten-year-old and cannot self-certify child comprehension. So the constitution's central claim gets an empirical gate with teeth: **before any new pattern or lesson ships, ≥ 5 first-time children aged 8–11 must each, on a label-hidden render, name direction (up / down / doji) and relative magnitude with ≥ 90% correct across the set; at least 1 participant must be colour-vision-deficient** (or a validated CVD-simulation pass is run). Results are logged per pattern ID in the `Playtest record` header field. **A pattern with no playtest record is unshippable — the same status as a failed V-check.**

## Automated Validation Rules

These are machine-checkable. A validator runs them against every authored/generated chart before it ships, and the runtime layer re-runs the geometry/rhythm subset on every live window. **If any test fails, the chart cannot ship.** Every threshold is quoted verbatim from the Standards Table ([Appendix A](#appendix-a--standards-table-single-source-of-truth)) — the validator invents nothing.

### Rule Table

| ID | Assertion | Threshold | Scope | Result |
|---|---|---|---|---|
| V-01 | Directional body ≥ min readable | 18 desktop / 16 phone | All | pass / **FAIL** |
| V-02 | Directional body ≥ hard floor | 14 desktop / 12 phone | All | pass / **FAIL** |
| V-03 | Type A educational body ≥ target | 24 | A | pass / **FAIL** |
| V-04 | Doji band respected | 2–4px | All | pass / **FAIL** |
| V-05 | No *directional* candle in band; doji legitimate (authored A/B, realism C) | band reserved | All | pass / **FAIL** |
| V-06 | Floored body reads as small | `≤ 0.3 × median` (ceiling) | Gameplay | pass / **FAIL** |
| V-07 | Median visible body | ≥ 60 | B | pass / **FAIL** |
| V-08 | Max flat run (count) | 3 | B | pass / **FAIL** |
| V-09 | Max flat run (px) | 220 | B | pass / **FAIL** |
| V-10 | Max identical / no A-B-A-B | ≤ 2, no two-value alternation | B | pass / **FAIL** |
| V-11 | Near-equal definition | ΔY ≤ 18 | B | pass / **FAIL** |
| V-12 | Body width in clamp | 12 ≤ bodyW ≤ 56 | All | pass / **FAIL** |
| V-13 | Body width matches formula (± jitter in B) | `round(clamp(slot×WIDTH_RATIO,BW_MIN,BW_MAX))`; B allows ±8% | All | pass / **FAIL** |
| V-14 | Wick width clamp | 1.6 ≤ wickW ≤ 3.0 (floor wins) | All | pass / **FAIL** |
| V-15 | Wick:body ratio (floor-aware) | `≤ max(0.08, 1.6/bodyW)` | All | pass / **FAIL** |
| V-16 | Wick length precedence | A/C: 0 or ≥ 6; B: 0 or ≥ 28; pattern-candles exempt | All | pass / **FAIL** |
| V-17 | Corner radius sharp | 0 | All | pass / **FAIL** |
| V-18 | Definition edge present | 1px | All | pass / **FAIL** |
| V-19 | Neutral separator on opposite touch | `#05070a`, present | All | pass / **FAIL** |
| V-20 | Body vs bg contrast | ≥ 3 (target 4.5) | All | pass / **FAIL** |
| V-21 | Separator contrast vs both bodies | ≥ 3 vs left AND right | All | pass / **FAIL** |
| V-22 | Non-colour cue present (type-dependent) | A/C: glyph+sheen; B: sheen pos + inset + separator (+glyph ≥ 28px) | All | pass / **FAIL** |
| V-23 | Gameplay gap continuous | 0 | B | pass / **FAIL** |
| V-24 | Educational gap from rounded width | `max(slot-bodyW-1, 0.20×slot)` | A | pass / **FAIL** |
| V-25 | On-screen candle count | 12 (8–16) | B | pass / **FAIL** |
| V-26 | Camera anchor (velocity-led) | 0.52 → 0.62 | Runtime | pass / **FAIL** |
| V-27 | Camera EMA smoothing | 0.12 → 0.18 | Runtime | pass / **FAIL** |
| V-28 | dt clamp + named EMA | clamp [8,40]; `dtSmoothingAlpha 0.10` | Runtime | pass / **FAIL** |
| V-29 | Vertical deadzone | 40 | Runtime | pass / **FAIL** |
| V-30 | Max required jump horiz | ≤ 367 (measured envelope) | B | pass / **FAIL** |
| V-31 | Jump step delta bounds | 130–200 | B | pass / **FAIL** |
| V-32 | Jump cadence | 4–6 candles | B | pass / **FAIL** |
| V-33 | Verticality cadence | ≥ 130px net per 10 | B | pass / **FAIL** |
| V-34 | Vertical dynamic range | ≥ 300px span per 20; ≥ 200px per 12 | B | pass / **FAIL** |
| V-35 | No dead-band step | no ΔY in (18,130) beyond 1 bump/6 | B | pass / **FAIL** |
| V-36 | No inline colour literals | all hues from `COLOR` :2412 | All paths | pass / **FAIL** |
| V-37 | DPR capped at 2 | `dpr = min(dpr, 2)` (P1-11) | Runtime | pass / **FAIL** |
| V-38 | Text floor | ≥ 12px on 360×800 | Mobile | pass / **FAIL** |
| V-39 | Step-delta variety | CV ≥ 0.35 per 12-candle window | B | pass / **FAIL** |
| V-40 | No metronome / peak present | ≤ 2 same-bucket consecutive; ≥ 1 peak ≥ 185px per 12 | B | pass / **FAIL** |
| V-41 | Height texture | ≥ 4 buckets per 8; jitter ±4–8% present | B | pass / **FAIL** |
| V-42 | Game-feel hooks wired | coyote ≥ 90, buffer ≥ 120, squash 0.85/60ms, anticipation ≥ 1, land SFX+haptic | Runtime | pass / **FAIL** |
| V-43 | Monotonic magnitude | sorted by \|delta\|, heights non-decreasing | All | pass / **FAIL** |
| V-44 | Type A focal / relational | focal ≥ 1.3× median neighbour; relational ≥ 1.5× | A | pass / **FAIL** |
| V-45 | Type C composition | answer candle ≥ 1.3× neighbours; genuine variety | C | pass / **FAIL** |
| V-46 | Teach-order DAG | every APPLY/TEST concept taught at ≤ same level; no cycles | Pedagogy | pass / **FAIL** |
| V-47 | Trades before boss | ≥ 3 per level before its boss | Pedagogy | pass / **FAIL** |
| V-48 | Boss prerequisites taught | every boss-exam concept in the taught set; realism previewed | Pedagogy | pass / **FAIL** |
| V-49 | Playtest record present | ≥ 5 children 8–11, ≥ 90%, ≥ 1 CVD | Ship | pass / **FAIL** |
| V-50 | Coordinate space | thresholds in CSS px, pre-DPR | All | pass / **FAIL** |
| V-51 | Zoom-window coverage | rhythm/median pass at all 3 zoom windows, worst sliding window | B | pass / **FAIL** |
| V-52 | Greyscale separability | hue-stripped render separates every candle (incl. same-direction B run) | All | pass / **FAIL** |

### Pseudo-Assertion List (validator implementation)

```
# ── PER-CANDLE (every candle c, on final post-jitter geometry) ────
isPhone     = viewport.width <= 430
minReadable = isPhone ? 16 : 18
hardFloor   = isPhone ? 12 : 14

assert c.isDoji OR c.bodyPx >= minReadable                          # V-01
assert c.isDoji OR c.bodyPx >= hardFloor                            # V-02
if type == A: assert c.isDoji OR c.bodyPx >= 24                     # V-03

# Doji band reserved; nothing directional lands in 2–4px
if 2 <= c.bodyPx <= 4: assert c.isLegitimateDoji(type)             # V-04, V-05
if c.isDoji: assert c.shape=="cross" AND c.label=="DOJI"
             AND c.bodyColor=="#b8c0cc" AND c.edgeDrawn             # V-04 (edge always)

# Width (type ratio; B tolerates jitter)
slot   = usableChartWidth / targetVisibleCount
ratio  = (type==B) ? 1.0 : 0.72
base   = round(clamp(slot*ratio, BW_MIN[type][isPhone], BW_MAX[type][isPhone]))
if type==B: assert 0.92*base <= c.bodyW <= 1.08*base                # V-13 (jitter band)
else:       assert c.bodyW == base                                 # V-13
assert 12 <= c.bodyW <= 56                                          # V-12
assert c.bodyW == inFormula and not widthLiteral(c)                 # V-13 static

# Wick (floor wins over ratio)
assert 1.6 <= c.wickW <= 3.0                                        # V-14
assert c.wickW <= max(0.08*c.bodyW, 1.6)                            # V-15
if type in {A,C}: assert c.wickLenPx==0 OR c.wickLenPx>=6           # V-16
if type==B and not c.isPatternCandle: assert c.wickLenPx==0 OR c.wickLenPx>=28  # V-16

# Shape, separator, colour
assert c.cornerRadius == 0                                          # V-17
assert c.edgePx == 1                                               # V-18
if adjacentOpposite(c):
    assert c.separator=="#05070a"                                   # V-19
    assert contrast(sep,leftBody)>=3 AND contrast(sep,rightBody)>=3 # V-21
assert contrast(c.bodyColor,"#0a0e14") >= 3                         # V-20
assert nonColourCue(c, type) present                               # V-22
if type==B: assert sheenHeight>=3 AND sheenAlpha>=0.8
            AND contrast(sheen,body)>=3
            AND (c.bodyW<28 OR glyphPresent(c))                     # V-22
assert c.bodyColor in COLOR and not inlineLiteral(c)               # V-36
assert measuredInCssPx(c)                                          # V-50

# ── PER-CHART (aggregate; every sliding window; all 3 zoom levels) ─
assertSortedByDeltaHeightsNonDecreasing(candles)                   # V-43
if type == A:
  assert focalBody >= 1.3*medianNeighbour                          # V-44
  if relational: assert definingRatio >= 1.5                       # V-44
  assert gap == max(slot-bodyW-1, 0.20*slot)                       # V-24
if type == C:
  assert answerCandle >= 1.3*neighbourMagnitude and hasVariety     # V-45
if type == B:
  for w in slidingWindows(candles, zoom in {8,12,16}):             # V-51
    median = medianBodyPx(w)
    assert median >= 60                                            # V-07
    for c in directional(w): assert c.bodyPx <= 0.3*median         # V-06
    assert maxRun(nearEqual, 18) <= 3                              # V-08, V-11
    assert maxFlatSpanPx(18) <= 220                                # V-09
    assert maxRun(identical) <= 2 and noTwoValueAlternation(w)     # V-10
    assert distinctHeightBuckets(w[0:8]) >= 4                      # V-41
    assert jitterPresent(w, 0.04, 0.08)                           # V-41
    assert noStepDeltaIn(w, open(18,130))                         # V-35
    assert cv(stepDeltas(w[0:12])) >= 0.35                        # V-39
    assert maxSameMagnitudeBucketRun(w) <= 2                       # V-40
    assert peakStep(w[0:12]) >= 185                                # V-40
    assert gapPx == 0                                              # V-23
    assert 8 <= count(w) <= 16                                     # V-25
    assert everyRequiredJumpHorizPx(w) <= 367                      # V-30
    assert allJumpStepDeltaPx(w) within [130,200]                  # V-31
    assert jumpCadence(w) within [4,6]                             # V-32
    assert netElevationPer10(w) >= 130                             # V-33
    assert verticalSpanPer20(w) >= 300 and per12 >= 200            # V-34
  assert greyscaleSeparable(candles)                               # V-52

# ── RUNTIME (camera / frame / feel) ───────────────────────────────
assert cameraAnchor in [0.52, 0.62] scaling with velocity          # V-26
assert 0.12 <= cameraSmoothingAlpha <= 0.18                        # V-27
assert 8 <= clampedDt <= 40 and dtSmoothingAlpha == 0.10           # V-28
assert verticalDeadzonePx == 40                                    # V-29
assert coyoteMs>=90 and jumpBufferMs>=120
       and landingSquash and takeoffAnticipation and landHaptic    # V-42
assert chartCanvas.dpr == min(window.devicePixelRatio, 2)          # V-37

# ── PEDAGOGY / SHIP ──────────────────────────────────────────────
assert teachOrderDAG.acyclic and everyExamConceptTaughtEarlier     # V-46
assert tradesBeforeBoss(level) >= 3                                # V-47
assert bossExamConcepts ⊆ taughtSet and realismPreviewed          # V-48
assert pattern.playtestRecord.correct >= 0.90 and cvdParticipant  # V-49
assert everyChartText.px >= 12 on 360x800                          # V-38

ship = all(V-01 .. V-52) == pass
# If ANY assertion FAILs, the chart cannot ship.
```

### Runtime conformance layer

The world is procedurally generated with seeded jitter and scrolls at runtime, so a chart that passes author-time validation can still present a below-floor or all-flat *window* on the player's device. Author-time checking alone is therefore a silent-failure gap. The runtime layer closes it:

- On **generation** and on every **live on-screen window**, the geometry/rhythm subset (V-01–V-11, V-23, V-30–V-35, V-39–V-41, V-51) runs on the actual rendered geometry.
- On failure, the mandated action is **deterministic regeneration** (seeded, reproducible) with a **bounded retry count of 8**, then a **fall back to a known-good authored chart** — never shipping the bad window.
- **Regeneration is off-screen only — terrain under the player is never mutated.** Because candle tops *are* the ground Finn stands on, re-geometrying a live window beneath him would itself create the softlock/pop failure class this document forbids elsewhere (an unreachable gap, or a candle-top that jumps under his feet). The conformance check therefore runs on each window *before it is presented* — while it is still off-screen and not-yet-entered — and any failing window is regenerated or replaced **there**, before Finn arrives. A window already under Finn is **never** re-geometried; in the rare case a fallback must swap terrain the player can already see, it is **match-cut eased** exactly like the [type-transition continuity rule](#the-three-chart-types), so no candle-top ever moves beneath his feet.
- Every failure increments the **`chart_conformance_fail`** telemetry counter, so silent failures surface in the funnel instead of reaching a child unseen.

### Enforcement, ownership, and the runtime layer

A gate with no owner and no CI hook is documentation, not enforcement — and this project's history (migrations silently 403-ing telemetry, manifests dropping directories) shows unenforced rules get bypassed on a busy night. Therefore:

- **Owner:** the visual-systems maintainer owns the validator, the symbol-citation CI check, and the runtime layer.
- **CI binding:** a **pre-deploy script parses/renders each authored chart and runs V-01…V-52, exiting non-zero on any FAIL**, and is wired into the publish step that copies `chart-quest.html` → `index.html` (the manual, unversioned deploy path). The symbol-resolution check (see [Document Authority](#document-authority--precedence)) runs in the same step so stale citations fail the build.
- **Runtime + telemetry:** the runtime conformance layer above ships with the game and reports `chart_conformance_fail`.

The ship rule is binary and non-negotiable: `ship = AND(all assertions) AND playtestRecordPresent`. A single FAIL — one 9px body on a 360×800 phone, one gold doji, one inline `#16c784`, one uncapped DPR, one metronome staircase, one boss testing the untaught, one missing playtest record — blocks the chart. This is the mechanism that finally retires the root architectural bug: a chart that does not consume this table's governing formulas cannot pass V-13, V-17, V-19, or V-36, and therefore cannot ship.

## Appendix A — Standards Table (Single Source of Truth)

This appendix is the machine spine. Every number elsewhere in the document is a human-readable rendering of a value here; where prose and this table ever disagree, **this table governs**. The fenced JSON block below is the exact object the validator consumes.

### A.1 Geometry

| Key | Value |
|---|---|
| Governing width | `round( clamp( slot × WIDTH_RATIO[type], BW_MIN, BW_MAX ) )` |
| `slot` | `usableChartWidth / targetVisibleCount` |
| `usableChartWidth` | `canvasCssWidth − leftMargin − rightMargin` |
| `leftMargin` / `rightMargin` (pinned) | B (full-bleed) `0`; A/C (framed) `max(12px, 0.04 × canvasCssWidth)` |
| `WIDTH_RATIO` | A/C `0.72`, B `1.0` |
| Corner radius | `0` (all types) |
| Body width envelope | `12`–`56px` |
| Min visible directional body | `18` desktop / `16` phone |
| Hard floor body | `14` desktop / `12` phone |
| Educational min body (A) | `24` |
| Max body height | `min( 55% visible height, 420px )` |
| Median visible body (gameplay) | `≥ 60` |
| Floored body ceiling | `≤ 0.3 × median` |
| Doji band | `2`–`4px`; edge always drawn |
| Height mapping | monotonic; `pxPerPct 1600` baseline; log-compress top decile above cap |

### A.2 Wick

| Key | Value |
|---|---|
| Width | `clamp(bodyW×0.05, 1.6, 3.0)`, floor wins |
| Effective ratio cap | `max(0.08, 1.6/bodyW)` |
| Default colour | `#c9d1d9` |
| Min drawn length (A/C) | `6` (else 0) |
| Drawn length (B) | `0` or `≥ 28`; pattern-candles map true high/low |
| Hazard spin / sweep | `#7fd6ff` 2.5px (≥26) / `#ff7a45` 3px (160–260) + non-colour cue |

### A.3 Colour (from `COLOR` :2412)

| Role | Body | Edge | Sheen |
|---|---|---|---|
| Bull | `#16c784` (8.8:1) | `#0c9c69` | `#5dedb5` |
| Bear | `#ea3943` (4.76:1) | `#c0212c` | `#f3838a` |
| Doji | `#b8c0cc` | `#7a8494` | — |
| Opposite-touch separator | — | `#05070a` (≥ 3:1 vs both) | — |
| Wick / neutral / bg / ground | `#c9d1d9` / `#8b98a8` / `#0a0e14` / `#5a6b82` | — | — |
| Reserved (never a body) | purple `#a855f7`, blue `#4cc3ff`, gold `#ffd60a`, orange `#ff9f43` | — | — |

Verified contrasts: bull vs bear `1.85:1` (hue cannot separate — separator required); wick vs bg `~12:1`.

### A.4 Rhythm, feel & camera

| Key | Value |
|---|---|
| Near-equal ΔY | `≤ 18px` |
| Max flat run | `3` candles / `220px` |
| Forbidden dead-band step | none in `(18,130)px` (≤ 1 bump in (18,60] per 6) |
| Max identical / no A-B-A-B | `≤ 2`; two-value alternation forbidden |
| Height buckets per 8 | `≥ 4` |
| Width jitter (B) | `±4–8%` (required, seeded) |
| Jump cadence / step | `4–6` candles / `130–200px` |
| Max horizontal gap | `≤ 367px` (measured reach) |
| Step-delta CV per 12 | `≥ 0.35` |
| Same-magnitude-bucket run | `≤ 2` |
| Peak step per 12 | `≥ 185px` |
| Net elevation per 10 | `≥ 130px` |
| Vertical span per 20 / per 12 | `≥ 300px` / `≥ 200px` |
| Coyote / buffer | `≥ 90ms` / `≥ 120ms` |
| Landing squash / anticipation | `0.85 × ~60ms` / `≥ 1 frame` |
| Camera anchor / EMA | `0.52→0.62` / `0.12→0.18` |
| dt clamp / EMA | `[8,40]ms` / `dtSmoothingAlpha 0.10` |
| Vertical deadzone / scroll ceiling | `40px` / `1.5×` max horizontal speed |

### A.5 Density, mobile, pedagogy

| Key | Value |
|---|---|
| On-screen candles | A `6–10` (1–5 focus) / B `12` (8–16) / C `6–14` |
| Zoom levels | Close 8 / Default 12 / Wide 16; validate all three |
| Governing viewport / min supported | `360×800` / `320×568` (graceful) |
| DPR cap / frame floor | `min(dpr,2)` / `≥ 30fps` low-end baseline |
| Text floor | `≥ 12px` |
| Trades before boss | `≥ 3` |
| Teach-order | acyclic DAG; never test the untaught; boss realism previewed |
| Playtest gate | `≥ 5` children 8–11, `≥ 90%`, `≥ 1` CVD |
| Coordinate space | CSS reference px, pre-DPR |

### A.6 The spine (validator JSON)

```json
{
  "widthRatio": { "A": 0.72, "B": 1.0, "C": 0.72 },
  "usableChartWidth": "canvasCssWidth - leftMargin - rightMargin",
  "leftRightMarginPinned": { "B_fullBleed": 0, "AC_framed": "max(12, 0.04*canvasCssWidth)" },
  "cornerRadiusPx": 0,
  "bodyWidthMinPx": 12,
  "bodyWidthMaxPx": 56,
  "bwBands": {
    "A": { "desktop": [32,56], "phone360": [24,48] },
    "B": { "desktop": [24,56], "phone360": [18,44] },
    "C": { "desktop": [14,46], "phone360": [12,40] }
  },
  "minReadableBodyPx_desktop": 18,
  "minReadableBodyPx_phone": 16,
  "hardFloorBodyPx_desktop": 14,
  "hardFloorBodyPx_phone_smallest": 12,
  "educationalMinBodyPx_typeA": 24,
  "maxBodyHeightRule": "min(0.55*visibleChartHeight, 420)",
  "medianVisibleBodyMinPx_gameplay": 60,
  "flooredBodyMaxFractionOfMedian": 0.3,
  "monotonicHeightMap": true,
  "logCompressionAboveCap": true,
  "dojiBandMinPx": 2,
  "dojiBandMaxPx": 4,
  "dojiEdgeAlwaysDrawn": true,
  "dojiRealismDrivenInTypeC": true,
  "wick": {
    "widthFormula": "clamp(bodyW*0.05, 1.6, 3.0)",
    "floorWinsOverRatio": true,
    "effectiveRatioCap": "max(0.08, 1.6/bodyW)",
    "colorDefault": "#c9d1d9",
    "minDrawnLen_AC": 6,
    "drawnLen_B": "0 or >=28",
    "patternCandleClampExempt": true,
    "hazard": { "spinPole": "#7fd6ff", "spinWidthPx": 2.5, "sweep": "#ff7a45", "sweepWidthPx": 3, "hazardHasNonColourCue": true }
  },
  "color": {
    "authority": "COLOR@chart-quest.html:2412",
    "bg": "#0a0e14", "ground": "#5a6b82", "wick": "#c9d1d9", "neutral": "#8b98a8",
    "bull": { "body": "#16c784", "edge": "#0c9c69", "sheen": "#5dedb5", "contrastVsBg": 8.8 },
    "bear": { "body": "#ea3943", "edge": "#c0212c", "sheen": "#f3838a", "contrastVsBg": 4.76 },
    "doji": { "body": "#b8c0cc", "edge": "#7a8494" },
    "oppositeTouchSeparator": "#05070a",
    "reservedPortalNeverBody": { "purple": "#a855f7", "blue": "#4cc3ff", "gold": "#ffd60a", "orange": "#ff9f43" },
    "bullVsBearContrast": 1.85,
    "noInlineColourLiterals": true
  },
  "contrast": {
    "bodyVsBgMin": 3, "bodyVsBgTarget": 4.5,
    "separatorVsBothBodiesMin": 3, "separatorStrokePx": 1, "separatorMandatoryOnOppositeTouch": true,
    "sheenVsBodyMin_B": 3, "wickVsBg": 12
  },
  "accessibility": {
    "nonColourCueRequired": true, "cueTypeDependent": true,
    "typeAC": "sheenPosition + glyph + label",
    "typeB": "sheenPosition(>=3px,alpha>=0.8) + darkOppositeEdgeInset + separator + glyphIfBodyW>=28",
    "glyphBodyWMinPx_B": 28,
    "greyscaleSeparable": true,
    "reducedMotionTraversalMode": true
  },
  "spacing": {
    "gapGameplayPx": 0, "gameplayBleed": "bw=c.w+1, bx=sx-0.5",
    "gapEducational": "max(slot-bodyW-1, 0.20*slot)", "gapExam": "0.28*slot",
    "maxIdenticalCandles": 2, "forbidTwoValueAlternation": true, "heightBucketsMinPer8": 4
  },
  "rhythm": {
    "nearEqualBodyTopDeltaPx": 18,
    "maxFlatRunCandles": 3, "maxFlatRunPx": 220,
    "deadBandForbiddenOpen": [18,130], "deadBandBumpTolerance": "1 in (18,60] per 6",
    "jumpCadenceCandles": [4,6], "jumpStepDeltaPx": [130,200], "maxHorizontalGapPx": 367,
    "jumpReachIsMeasuredEnvelope": true, "reMeasureOnMovementConstantChange": true,
    "stepDeltaCVminPer12": 0.35, "maxConsecutiveSameMagnitudeBucket": 2, "peakStepMinPxPer12": 185,
    "netElevationChangeMinPxPer10": 130, "verticalSpanMinPxPer20": 300, "verticalSpanMinPxPer12": 200,
    "widthJitterRequiredPct": [4,8]
  },
  "gameFeel": {
    "coyoteMsMin": 90, "jumpBufferMsMin": 120,
    "landingSquashScale": 0.85, "landingSquashMs": 60, "squashRenderOnly": true,
    "takeoffAnticipationFramesMin": 1, "landFiresSfxAndHaptic": true
  },
  "camera": {
    "anchorBase": 0.52, "anchorMaxAtFullRun": 0.62,
    "smoothingAlpha": 0.12, "smoothingAlphaMax": 0.18,
    "dtClampMinMs": 8, "dtClampMaxMs": 40, "dtSmoothingAlpha": 0.10,
    "verticalDeadzonePx": 40, "world": [80,700], "scrollCeilingFactor": 1.5,
    "lookAheadScalesWithVelocity": true, "motionReadabilityGate": true
  },
  "zoom": {
    "levels": { "close": 8, "default": 12, "wide": 16 },
    "gameplayTarget": 12, "gameplayMin": 8, "gameplayMax": 16,
    "validateAtAllWindows": true, "slidingWindowWorstCase": true,
    "pinchOnCanvas": false, "wcag144Exception": true
  },
  "density": { "A": [6,10], "A_focus": [1,5], "B": 12, "C": [6,14] },
  "mobile": {
    "coordinateSpace": "css-px-pre-dpr",
    "governingViewport": "360x800", "minSupported": "320x568",
    "gracefulDensityReduceBelow360": true, "testLandscapeSplit": true,
    "dprCap": 2, "minFpsBaseline": 30, "textFloorPx": 12
  },
  "pedagogy": {
    "coreLoop": "LEARN->PRACTICE->APPLY->TEST",
    "minTradesBeforeBoss": 3, "neverTestUntaught": true,
    "teachOrderDAGAcyclic": true, "bossRealismPreviewedFirst": true,
    "exaggerationGainRamp": [1.0, 0.6, 0.3, 0.0],
    "exaggerationGainDef": "renderedH = lerp(honestMappedH, maxExaggeratedH, gain); 1.0=TypeA max amplification, 0.0=honest realism; monotonic order + floors hold at every gain; endpoints already defined (no new constant)",
    "playtestMinChildren": 5, "playtestAgeBand": [8,11], "playtestCorrectMin": 0.90, "playtestCVDMin": 1
  },
  "composition": {
    "typeA_focalBodyVsMedianNeighbourMin": 1.3,
    "typeA_relationalDefiningRatioMin": 1.5,
    "typeC_answerVsNeighbourMagnitudeMin": 1.3,
    "denseLabelPlacement": "typeC>=10 candles OR any phone frame: annotate focal/answer candle only; suppress/offset context labels; no glyph/label overflows its own candle"
  },
  "runtime": {
    "conformanceLayer": true, "regenRetryMax": 8, "fallbackKnownGood": true,
    "telemetryCounter": "chart_conformance_fail", "validateOnFinalPostJitterGeometry": true,
    "regenOffScreenOnly": true, "neverMutateWindowUnderPlayer": true, "visibleFallbackMatchCutEased": true
  },
  "enforcement": {
    "owner": "visual-systems maintainer",
    "preDeployScriptExitsNonZeroOnFail": true,
    "boundToPublishStep": "chart-quest.html -> index.html",
    "citationsSymbolAnchored": true, "ciSymbolResolutionCheck": true,
    "widthLiteralCheckScopedToCandleSymbols": true,
    "reachMeasuredByHeadlessCFGSim": true,
    "shipRule": "AND(V-01..V-52) AND playtestRecordPresent"
  }
}
```

## Appendix B — Ratification & Adversarial Review Log

The assembled draft was subjected to a four-lens adversarial panel. Every **CRITICAL** and **MAJOR** finding was resolved in the ratified text; the resolutions are recorded here with the exact change. A handful of minor items were consciously deferred, with reason. A subsequent ratification audit (score 93/100, PASS) then sealed five residual minors — logged in [§B.6](#b6-ratification-audit--residual-minors-sealed-2026-07-15).

### B.1 Nintendo (game feel — "no moment is boring")

| Finding (sev) | Resolution in text |
|---|---|
| Boredom scan only forbids *absence* of variety; a metronome staircase passes (CRIT) | Added the **positive variety law** — step-delta CV ≥ 0.35 per 12, ≤ 2 same-magnitude-bucket consecutive, ≥ 1 peak ≥ 185px per 12 (Chart Rhythm; F-CH4b; V-39/40). |
| No landing juice / anticipation / feel spec (CRIT) | Added **[Game-Feel Invariants](#game-feel-invariants)**: coyote ≥ 90ms, buffer ≥ 120ms protected; landing squash 0.85/60ms; takeoff anticipation ≥ 1 frame; land SFX + haptic (V-42). |
| 18–130px band is legal dead terrain (MAJ) | Added the **dead-band rule** — consecutive body-top ΔY must be ≤ 18 or ≥ 130 (F-CH3b; V-35). |
| Jitter capped but never required; A-B-A-B wallpaper legal (MAJ) | Jitter **±4–8% now mandatory**; ≥ 4 height buckets per 8; two-value alternation forbidden (Spacing; V-10/41). |
| Type A has no focal/composition law (MAJ) | Added the **focal-candle law** — focal ≥ 1.3× median neighbour, centre band, dimmed context (Type A; V-44). |
| Camera is defensive-only, no look-ahead (MAJ) | Added **velocity look-ahead 0.52→0.62**, speed-tightened EMA, landing settle, impact kick (Camera; V-26/27). |
| 55% cap has no vertical-range floor (MAJ) | Added **vertical dynamic range ≥ 300px per 20 candles**; raised F-CH2 to < 200px/12 = FAIL (V-34). |
| Jitter never re-validated (min) | Resolved — all validators run on **final post-jitter rendered geometry** (Automated Validation; runtime layer). |
| Difficulty = density collapses feel (min) | Resolved — **difficulty decoupled** into type, exaggeration-gain, rhythm/timing, verticality levers (Difficulty). |
| Type C no anti-monotony (min) | Resolved — **Type C composition law** (answer ≥ 1.3× neighbours, genuine variety; V-45). |
| Structural vs hazard wick indistinct (min) | Resolved — hazard wicks carry a **non-colour cue**; inert wicks capped below hazard salience (Wick). |
| No transition continuity between types (nit) | Resolved — **continuity-of-motion** easing/match-cut note (Three Chart Types). |

### B.2 Riot (rigor & enforceability — recomputed the numbers)

| Finding (sev) | Resolution in text |
|---|---|
| 0.3-of-median used as floor and ceiling — unsatisfiable (CRIT) | Fixed to a **single meaning: 0.3 is a ceiling on floored candles**, and **median raised 30 → 60** so `18 ≤ 0.3×60` (Minimum Visible Movement; F-CH13; V-06/07). |
| Wick 1.6px floor vs 0.08 ratio cap contradict for bodyW < 20 (CRIT) | **Floor wins**; effective cap `max(0.08, 1.6/bodyW)` (Wick; V-15). |
| 0.72 width vs gap-0 walkable road incompatible (CRIT) | **Type B uses `WIDTH_RATIO 1.0`** (continuous road); 0.72 governs A/C only (Candle Standards; V-13/23). |
| jumpReach 367px impossible under walkSpeed 58 (CRIT) | Reframed as an **empirically measured reach envelope** (not a kinematic identity), with CI **re-measurement** on any movement-constant change (Platforming). |
| Mandatory same-hue edge fails 3:1 (CRIT) | Replaced with a **1px neutral separator `#05070a`**, validated **≥ 3:1 vs both** neighbours (Contrast; V-21). |
| V-22 glyph rule rejects all Type B candles (CRIT) | Cue-set made **type-dependent**; Type B uses sheen position + inset + separator + ≥28px glyph (Color/Accessibility; V-22). |
| Gameplay wick [28,74] vs 6px, and clamp erases hammer/doji (MAJ) | Precedence stated (B: 0 or ≥ 28); **pattern-candles exempt**, map true high/low (Wick; V-16). |
| "Never changes size between screens" false (MAJ) | Corrected to **formula/shape consistency**, not identical size; `usableChartWidth` defined (Preamble; Candle Scaling). |
| Magnitude collapses above 55%/420 cap (MAJ) | `min()` binds; **governed log compression** above cap; Type C authored under cap (Min/Max Body Height; V-11/43). |
| median ≥ 30 unsatisfiable on small surfaces (MAJ) | **Scaled relief** below 120px chart height: `median ≥ min(60, 0.5×chartHeight)` (Replay/Notebook). |
| Zoom validation scope undefined (MAJ) | Rhythm/median run at **all 3 zoom windows**, worst sliding window (Zoom; V-51). |
| Type B sheen has no size/contrast floor (MAJ) | Floored — **≥ 3px, alpha ≥ 0.8, contrast ≥ 3:1** + dark inset (Accessibility; V-22). |
| Doji edge excluded by bodyH ≥ 3 gate (min) | Doji edge **always drawn**, exempt from the gate (Minimum Visible Movement; V-04). |
| Single-candle charts unspecified (min) | Added the **Type A focus sub-mode (1–5 candles)** (Type A). |
| "Verbatim" inaccurate; dt EMA unnamed (nit) | Corrected to "ratio adopted; cap raised 48 → 56"; **`dtSmoothingAlpha 0.10`** named + validated (Candle Scaling; Camera; V-28). |

### B.3 Valve (real players, real devices, silent failure)

| Finding (sev) | Resolution in text |
|---|---|
| No real-player playtest gate (CRIT) | Added the **Human Playtest Gate** — ≥ 5 children 8–11, ≥ 90%, ≥ 1 CVD; no record = unshippable (QA; V-49). |
| Validator pre-ship only; procedural runtime gap (CRIT) | Added the **runtime conformance layer** — regenerate (8 retries) → known-good fallback → `chart_conformance_fail` telemetry (Automated Validation; F-CH16). |
| Sheen is sole gameplay cue, no floor (CRIT) | **Two floored cues + glyph escape hatch** (Accessibility; V-22). |
| gap 0 vs 0.72 width contradictory (CRIT) | Resolved via **Type B `WIDTH_RATIO 1.0`** (as Riot). |
| V-13 exact equality vs jitter (CRIT) | V-13 rewritten as a **tolerance band** (0.92–1.08 × base) for Type B (Automated Validation). |
| No declared coordinate space (MAJ) | **All px = CSS reference px, pre-DPR** (Readability Laws; V-50). |
| Snapping destroys magnitude order (MAJ) | **Monotonic order-preserving remap** (Readability Law 3; V-43). |
| Reduced-motion premise untouched (MAJ) | Added a **first-class low-motion traversal mode** (discrete stepping / static read) (Camera/Accessibility). |
| No frame-rate floor / low-end gate (MAJ) | **≥ 30fps** on a named low-end baseline; deliberate degrade (Mobile; QA row 11). |
| 360px unjustified (MAJ) | Documented decision: **guaranteed ≥ 360; 320–359 graceful density reduce; message below**; landscape/split tested (Mobile). |
| Type C realism vs authored-only doji (MAJ) | **Organic dojis legitimate in Type C** without a hand-flag (Type C; V-05). |
| Line-number citations fragile (MAJ) | Citations are **symbol-anchored**, with a **CI symbol-resolution check** (Document Authority). |
| Validator has no owner/CI/runtime (MAJ) | Named **owner + pre-deploy CI binding + runtime layer** (Automated Validation → Enforcement). |
| Aggregates over shifting window (min) | Resolved — **sliding-window worst-case at all zoom levels** (Zoom; V-51). |
| maxScrollVelocity under-specified (min) | **Quantified** + motion-readability gate (Camera). |
| Type A rounding can breach slot (nit) | **Gap derived from rounded width** with 0.20×slot headroom (Body Width; V-24). |

### B.4 Duolingo / pedagogy (education-first integrity)

| Finding (sev) | Resolution in text |
|---|---|
| Floor-snapping destroys proportionality (CRIT) | **Monotonic magnitude invariant** (Readability Law 3; Core Philosophy; V-43). |
| Relational patterns erased by floor (CRIT) | **Relational-pattern law** — defining ratio ≥ 1.5× dominates the floor (Type A; Pattern Library; V-44). |
| Core pedagogy entirely unenforced (CRIT) | Added **pedagogical validators** — teach-order DAG, ≥ 3 trades before boss, boss prerequisites taught (V-46/47/48). |
| V-06 vs V-01 contradiction at median > 60 (MAJ) | Resolved with the single-direction 0.3 ceiling + median 60 (as Riot). |
| Type A no focal/salience (MAJ) | Focal-candle law (as Nintendo; V-44). |
| Gameplay strips glyphs, sheen sole cue (MAJ) | Two floored cues + ≥28px glyph (as Valve/Riot; V-22). |
| Exaggeration → realism cliff (MAJ) | **Exaggeration is a ramped gain** (1.0→0.6→0.3→0); boss realism previewed first (Difficulty; Type C; V-48). |
| Doji pedagogy undefined in Type B (min) | **Authored doji-as-terrain** flat-marker tile, exempt from boredom rule (Type B). |
| One-concept-per-chart vs relational (min) | `Teaches` declares **concept scope (single/relational)** with a relationship-legibility criterion (Pattern Library Specification). |
| "Impossible to misunderstand" overclaims (nit) | Downgraded to the **measured ≥ 90% playtest** standard (Educational Philosophy). |

### B.5 Consciously deferred

- **Second structural Type-B cue beyond the dark inset (a persistent body bevel/notch).** The constitution mandates two floored cues plus a ≥28px glyph and a greyscale-separability gate, which the panel accepts as sufficient; an additional permanent bevel is left to art tuning rather than made law, to avoid over-constraining the terrain silhouette. Revisit if a greyscale gate fails in playtest.
- **Full re-verification of every floor at 320px as a first-class gate.** Deferred in favour of the documented product decision (full readability guaranteed ≥ 360; graceful density reduction 320–359). Reason: the audience-device telemetry does not yet justify treating 320 as the governing gate; the graceful path prevents illegible rendering in the meantime. Revisit when device-distribution telemetry lands.

### B.6 Ratification audit — residual minors sealed (2026-07-15)

A final ratification pass (score **93/100, PASS** — no missing sections, no numeric self-contradictions, WCAG contrasts independently re-verified) surfaced five refinement-level minors. None was a major or critical architectural gap; all five are now resolved in the text above.

| Ratification-audit finding (minor) | Resolution in text |
|---|---|
| Runtime regeneration (F-CH16) could mutate terrain under a live player — a latent softlock/pop, the exact class the doc treats as critical elsewhere | Runtime conformance layer now acts **off-screen only**: a not-yet-entered window is checked/replaced before presentation; a window under Finn is never re-geometried, or is match-cut eased ([Runtime conformance layer](#automated-validation-rules); F-CH16; spine `runtime.regenOffScreenOnly`). |
| Exaggeration-gain ramp `[1.0,0.6,0.3,0]` had no physical transfer function (validated but undefined) | Defined gain as a **measured multiplier** — `renderedH = lerp(honestH, exaggeratedH, gain)`, monotonic order + floors hold at every gain, no new constant introduced ([Difficulty Standards](#difficulty-standards); spine `pedagogy.exaggerationGainDef`). |
| `leftMargin`/`rightMargin` were unpinned, so `slot` was not fully auditable from `targetVisibleCount` alone | **Pinned:** Type B full-bleed `0`; Types A/C `max(12px, 0.04×canvasCssWidth)` ([Candle Scaling](#candle-scaling-standards); [Appendix A.1](#a1-geometry); spine `leftRightMarginPinned`). |
| Reach re-measurement and the static width-literal check named mechanisms that did not exist | Named the **headless CFG-stepping sim harness** for reach; **scoped** the static width-literal check to the enumerated candle-draw symbols, not a whole-file grep ([Platforming](#platforming-rules); F-C8; spine `enforcement`). |
| Label/glyph collision on dense small charts (a 12px body under a wider `DOJI` label) was unaddressed | Added a **dense-frame label-placement rule** — Type C ≥ 10 candles and all phone frames annotate the focal/answer candle only; context labels suppressed/offset ([Boss Chart Rules](#boss-chart-rules); [Mobile](#mobile-readability-standards); spine `composition.denseLabelPlacement`). |

With these sealed, the standing open items reduce to the two conscious design deferrals in [§B.5](#b5-consciously-deferred) — neither an architectural gap.

---

*End of the ChartQuest Visual Market Constitution. One formula, one palette, one shape, one set of floors — enforced before ship, at runtime, and by real children. If the code disagrees, the code is wrong.*








