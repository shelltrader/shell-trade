# Visual Market — Phase 1 Rendering Architecture Audit

**Status:** PHASE 1 — AUDIT ONLY. This document changes **zero** code. It writes to nothing but itself. No line of `chart-quest.html`, `index.html`, `dashboard.html`, or any source file is touched by Phase 1.
**Date:** 2026-07-15
**Author role:** Technical Director, finalizing the Phase-1 audit.
**Law:** `CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md` (project root) is the highest authority for every visual market representation. Its **Appendix A.6 JSON spine** is the canonical config source of truth. On trade truth/causality, `docs/canon/trading_canon.md` and `CHARTQUEST_TRADING_EXPERIENCE_SYSTEM_v1.1.md` remain supreme. On protected behavior, `docs/canon/protected_systems.md` governs.

---

## Executive summary

ChartQuest draws candles in **98 distinct places** across five files and four incompatible data schemas, governed by no shared engine. There are **twenty-plus** independent body-width formulas (none implementing the Constitution's one-formula rule), **five green + four red** palette variants, **~236 inline `#16c784`** and **~159 inline `#ea3943`** literals that bypass the single `COLOR` object, and a load-bearing terrain seam (`candleTop`) copy-pasted or inlined across six sites. This is the "every path invents its own proportions" disease the Visual Market Constitution was ratified to cure. The right cure is **one canonical rendering engine** — but this codebase is a single ~20,320-line HTML file, deployed by a hand-run `cp`, with a scope-isolated mini-game IIFE, no module system, a **dead** build pipeline, and **no automated test harness** (verified: there is no `package.json`, no installed `puppeteer`; `scripts/verify.js` check 3b unconditionally SKIPs). Any architecture that ignores those facts is fiction. This audit therefore recommends a global-namespace engine (`window.CQ`) authored once inline and reachable by all four script blocks, driven entirely by the A.6 spine, with thin named adapters reconciling the schemas, a **zero-allocation gameplay fast path**, and enforcement by a small pre-deploy validator whose **pure-static half is buildable today** and whose rendered half is gated on first standing up a headless runtime. Five adversarial reviews (Nintendo, Valve/ship-safety, Riot, Blizzard/maintainability, Apple) materially reshaped the recommendation: the frozen seam is widened from `candleTop` alone to **`{candleTop, c.x, c.w, gap}` collectively** because candle *width* is a physics hitbox, not a draw parameter; the per-frame `CandleDraw` object is **removed from the canvas hot path**; and the verification substrate is elevated to the **first** deliverable because none of the parity gates can run without it. This document is the migration contract for Phases 2+; it is honest about every tradeoff and optimized for the next decade, not the next sprint.

---

## Table of contents

1. [The Reality Constraint](#1-the-reality-constraint)
2. [Current Rendering Architecture](#2-current-rendering-architecture)
3. [Complete Candle-Site Inventory](#3-complete-candle-site-inventory)
4. [Renderer Dependency Graph](#4-renderer-dependency-graph)
5. [Duplicate Rendering Logic](#5-duplicate-rendering-logic)
6. [Duplicate Constants and Duplicate Calculations](#6-duplicate-constants-and-duplicate-calculations)
7. [Magic Numbers](#7-magic-numbers)
8. [Representation Conflicts](#8-representation-conflicts)
9. [Current Technical Debt](#9-current-technical-debt)
10. [Architecture Recommendations](#10-architecture-recommendations)
11. [Migration Order](#11-migration-order)
12. [Regression Risks](#12-regression-risks)
13. [Rollback Strategy](#13-rollback-strategy)
14. [Backwards-Compatibility Contract](#14-backwards-compatibility-contract)
15. [Visual-Regression & Testing Strategy](#15-visual-regression--testing-strategy)
16. [Performance](#16-performance)
17. [Potential Future Simplifications](#17-potential-future-simplifications)
18. [Success Criteria (Phase 1)](#18-success-criteria-phase-1)
19. [Appendix — Adversarial Review Log](#19-appendix--adversarial-review-log)

---

## 1. The Reality Constraint

Every architectural decision in this document is forced by what this codebase actually *is*, not by what an ideal module tree wants it to be. Naming these truths first is not throat-clearing — it is the frame that kills the wrong answers.

**One file.** `chart-quest.html` is ~20,320 lines and **1,361,174 bytes**. It is the source of truth. All game rendering — gameplay, lessons, bosses, quizzes, SVG charts, HUD, mini-games — lives inside it as inline `<script>`.

**Four script blocks, and one of them is a sealed room.** The file carries four `<script>` regions with materially different scope:

| Block | Lines | Scope reality |
|---|---|---|
| CDN | 1590 | Supabase UMD `<script src>` |
| **Block 1** | 1591–18565 | The main game. All core renderers. A single shared function scope — `const CFG`, `const COLOR`, and ~401 function declarations are visible across the block (and, cross-tag, to Blocks 3/4). |
| **Block 2** | 18599–19678 | The mini-game / LessonChart library, authored as a `'use strict'` **IIFE**. Its closure sees **zero** Block-1 symbols — grep-confirmed: `COLOR` (2412) and the candle helpers have no references inside 18599–19678. It reaches Block 1 **only** through the `window.*` bridge at 19675 (which today exports `LessonChart / openConceptPractice / openIntroLesson / CONCEPT_PRACTICE` and imports `window.ContentLog`). |
| Block 3 | 19680–19898 | QA testing bridge; inert unless `?qa=1`. References Block-1 symbols cross-tag. |
| Block 4 | 19899–20318 | Content-event logger; publishes `window.ContentLog`. |

The Block-2 isolation is the single most important architectural fact in this document. **A canonical engine authored as a top-of-Block-1 `const CQ` is `undefined` inside Block 2.** The engine *must* be published on `window`, or the mini-game and every LessonChart renderer cannot see it. This is non-negotiable and it rules out the naive "just make it a const" answer.

**No module system.** There is no `import`/`export`, no bundler in the deploy path.

**No build step — and the one that exists is dead.** `build.js:112` intends a minify pipeline that writes into `index.html`. It is **not run**: `index.html` is byte-identical to `chart-quest.html` (cksum `4183363700`, both 1,361,174 bytes — verified), i.e. unminified. `chart-quest.min.html` is a **stale Jul-3 artifact**, 5.9 MB, linked by nothing. Adopting a real bundler means resurrecting a tool the team already let rot, and adding a transpile step to a team whose deploy is `cp`. That is a high-risk, low-payoff move for what is, in the end, *one file's worth of pure drawing functions.*

**No test harness.** There is **no `package.json`** and **no installed `puppeteer`** (verified). `scripts/verify.js` runs eleven checks — Finn assets, syntax parse, lessons, bosses, saves, `BUILD_TAG` bump, the `sha256(index.html)==sha256(chart-quest.html)` mirror, binaries, protected-diff, TES order — and its **only** runtime/headless gate (check 3b) unconditionally prints `SKIP — puppeteer not installed`. So today, **nothing renders a candle in CI**; the closest thing to a test surface is the `?qa=1` bridge and `lesson-chart-preview.html`, driven by hand.

**Manual mirror deploy.** Deploy is `cp chart-quest.html → index.html` and again to `website/game.html`. Three byte-identical copies (verified, all cksum `4183363700`). Any engine change is triplicated by hand. `dashboard.html` is a **separate founder app** with its own `boxCandles` clone (896) that no chart-quest-only engine can reach — and it is **currently dirty in the working tree**, so even the "byte-clone" assumption must be re-verified at migration time, not presumed.

### How this reshapes the brief's ideal module tree

The brief imagines a fifteen-module tree (`ChartConstants`, `ChartTypes`, `ChartScale`, `CandleColors`, `WickRenderer`, `MarketRenderer`, `PatternRenderer`, …). **There are no files to hold those modules.** The reshaping is therefore precise and total:

- The fifteen modules survive as **frozen sub-objects of a single global `window.CQ`**, not as files.
- The engine is authored **once**, inline, as a "Block 0" at the very top of Block 1, and **published on `window` immediately** so all four blocks reach the identical object.
- It **deploys on the existing `cp` for free** — one authored copy, three deployed mirrors.
- Enforcement cannot lean on a bundler; it comes from a **small pre-deploy validator** whose static half is pure Node (buildable now) and whose rendered half needs a headless runtime that **must be stood up first** (see §15).
- Two ideal modules (`PatternRenderer`, `PatternUtilities`) are **not Phase-1 deliverables** and — heeding the maintainability review — are **not even reserved as empty stubs**, because a frozen namespace gains sub-objects later without foreclosing anything, and naming them now only creates a spec to maintain and a temptation to fill.

This is the low-regret path. The durability risk here is not "we lack a toolchain"; it is *twenty divergent width formulas, five palettes, four schemas, and a terrain seam copy-pasted six times.* A namespace with a frozen spine and a validator kills all four. A bundler kills none of them.

---

## 2. Current Rendering Architecture

Today there is **no rendering architecture** in the engineering sense — there is a population of ~98 renderers that each independently decide width, height mapping, wick, and color, occasionally reusing a helper but far more often re-deriving or inlining. The only gold-standard site is `drawCandle` (12839), the live gameplay renderer, which is the sole consumer that reads the `COLOR` object by name instead of inlining hexes.

The system divides along the four-block seam and, within Block 1, along surface families:

- **Generation (pixel-baked).** `scriptedCandle`/`setupFlowCandle`/`tradeDrivenCandle` produce candle *data* as **world pixels above the ground**, dispatched through `nextCandle` (or replayed from seeded `MARKET_DATA` at level ≥ 4), decorated by `decorateCandleWicks`, sized by `candleW` (the one canonical width), spaced by `maintainCandles`, and pushed through the `pushCandle` factory into `market.level[]`. The height *is* the price proxy; a parallel `market.price` scalar tracks dollars.
- **The load-bearing seam.** `candleTop(c) = groundY − max(c.open, c.h)` (2523) converts a candle to a walkable pixel top. It feeds terrain, movement hitboxes (five separate passes in `update()`), portals (`portalHoverY`, `PORTAL_HOVER_GAP`), collectibles, coin spawns, and `candleAtScreen`. It is the one place a rendering number becomes a physics number.
- **Canvas renderers (Block 1).** `drawCandle` plus overlays `drawFlowRead`, `drawQuickRead`, `drawSetupSpotlight`, `drawVWAP`, `drawTrendLines`, and the orchestrator `render` (14424), which sets up a single world-layer `save/restore`, computes the price→Y scale **twice per frame**, and dispatches the HUD.
- **A separate OHLC model** for `drawHTFZoom`/`drawHTFPanel` (`htf[]` with its own `{lo,hi,open,h}` and its own `CY()`/`ppp`).
- **SVG-string renderers (Block 1).** `setupChartSVG*`, `tradeChartSVGFull`, `ddGuessChartSVG`, and the boss trio `bossCandleSVG` / `candleExtremeXY` / `bossCandleSVGTrend` — the last built by string `.replace('</svg>','')` surgery, with a hit-test that re-declares the renderer's coordinate constants verbatim.
- **Quiz / Academy / Intermission (Block 1).** A dozen renderers with fixed candle widths (22/24/26/32/44) and inline hexes.
- **Block-2 mini-game / LessonChart (sealed).** `mgCandles`, `ChartView`/`candlesN`, `boxCandles` (a forked palette), `LessonChart` (a third palette), authored `SCENES`, `CONCEPT_PRACTICE`, `runBuild`.

### The 4-block map

```
BLOCK 1 (1591–18565) — shared scope
  CFG:2312  COLOR:2412  CSS vars:1155
  Generation: scriptedCandle/setupFlowCandle/tradeDrivenCandle → nextCandle → maintainCandles → pushCandle
  PIXEL MODEL A {x,w,h(=close),open(=prev.h),wick,color DERIVED};  candleTop:2523 = LOAD-BEARING SEAM
  Canvas: drawCandle:12839 (only COLOR-named site) + render:14424 (price-scale ×2) + overlays + HUD
  Separate OHLC A': drawHTFZoom/drawHTFPanel (htf[])
  SVG: setupChartSVG*/tradeChartSVGFull/ddGuessChartSVG + boss trio (MODEL C {o,c,up,lo} fixed 0..100)
  Edu: buildQuizCandles/drawQuizChart/imDraw*/drawCandleAcademy/drawQuizCandle/drawPredictionBet
BLOCK 2 IIFE (18599–19678) — ISOLATED closure
  mgCandles (MODEL B {o,c,hi,lo}), ChartView, boxCandles (MODEL D closes[] FORK), LessonChart (3rd palette)
  window.* bridge:19675 is the ONLY channel to Block 1
BLOCK 3 QA (19680) ?qa=1 — refs Block-1 consts cross-tag
BLOCK 4 window.ContentLog (19899)
OTHER FILES
  dashboard.html boxCandles:896 (byte-clone, separate app) · lesson-chart-preview.html (own palette)
  index.html + website/game.html (byte-mirrors, cksum 4183363700) · chart-quest.min.html (STALE)
```

---

## 3. Complete Candle-Site Inventory

This is the "nothing may be missed" deliverable: every candle-touching site, with file:line, surface, kind, representation, key formula, and color source. **98 sites.**

| # | Name | file:line | Surface | Kinds | Representation | Key formula | Colors-source |
|---|------|-----------|---------|-------|----------------|-------------|---------------|
| 1 | CFG | chart-quest.html:2312 | gameplay | config/width/height/wick/spacing | pixel-config | minW24 maxW56 targetVis8.5 anchor0.52 minBody15 pxPerPct1600 lvl80-700 gap0 spinWick26 sweep160-260 | (config) |
| 2 | COLOR | chart-quest.html:2412 | gameplay | color | palette obj (SINGLE SOURCE) | greenBody#16c784/edge#0c9c69/stripe#5dedb5; red#ea3943/#c0212c/#f3838a; wick#c9d1d9 | named |
| 3 | CSS :root vars | chart-quest.html:1155 | hud | color | CSS vars (2nd defn) | --green#16c784 --red#ea3943 --blue#4cc3ff --gold#ffd60a | CSS var |
| 4 | pushCandle | chart-quest.html:2492 | gameplay | model/gen/color | pixel {x,w,h,open,wick,color} | open=prev.h; color=h>=open?g:r DERIVED; vol synth | derived→COLOR |
| 5 | candleTop | chart-quest.html:2523 | gameplay | geom/hittest | pixel | groundY-max(open,h) — LOAD-BEARING SEAM | n/a |
| 6 | portalHoverY | chart-quest.html:2537 | gameplay | geom/hittest | pixel(reads candleTop) | min candleTop over col − 250 | n/a |
| 7 | chartComplexity | chart-quest.html:2806 | gameplay | gen | scalar 0..1 | clamp((level-1)/8) | n/a |
| 8 | scriptedCandle | chart-quest.html:2828 | gameplay | gen/height | pixel | LVL_SCRIPTS target-h + anti-staircase rand | derived |
| 9 | setupFlowCandle | chart-quest.html:2897 | gameplay | gen/height | pixel {flow} | momentum→2 pullback→confirm, clamped | derived |
| 10 | tradeDrivenCandle | chart-quest.html:2946 | gameplay | gen/height | pixel | drive to TP/SL ≥30 candles; DRIVE_EASE0.10; safety clamps | derived |
| 11 | cartoonCandle | chart-quest.html:3049 | gameplay(LEGACY) | gen/height | pixel | mean-revert; DEAD (superseded) | derived |
| 12 | nextCandle | chart-quest.html:3086 | gameplay | gen/dispatch/wick | pixel dispatcher | lvl≤3 trade/setup/scripted; lvl≥4 MARKET_DATA step=dPct*1600 | derived |
| 13 | decorateCandleWicks | chart-quest.html:3200 | gameplay | wick/gen | mutates wick/wick2 | ~70% clean; spin-pole; clamp off SL/TP | n/a |
| 14 | initCandles | chart-quest.html:3236 | gameplay | gen/model | pixel seed 3 | h 130/175/100; colors advisory | derived |
| 15 | candleW | chart-quest.html:3257 | gameplay | width | scalar px (CANONICAL) | round(clamp((W*0.52)/8.5,24,56)*rand(.92,1.1)) | n/a |
| 16 | maintainCandles | chart-quest.html:3264 | gameplay | gen/spacing/model | pixel driver | print W+200 ahead; gap0; OB tag; side-effects (NOT pure) | n/a |
| 17 | candleAtScreen | chart-quest.html:4254 | gameplay | hittest | reads pixel | cameraX=turtle.x−W*0.52; wx>=c.x && wx<c.x+c.w; uses candleTop | n/a |
| 18 | maybeMegaCandle | chart-quest.html:8408 | gameplay | wick/gen | mutates wick + coins | pole 105-145px; deterministic nextAt=22+((lvl*7)%12) | n/a |
| 19 | onCandleEntered | chart-quest.html:11747 | gameplay | gen(consumer) | stream | market-minute clock; intro/prove gating | n/a |
| 20 | drawCandle | chart-quest.html:12839 | gameplay | draw/width/wick/geom/color | pixel | top=candleTop; bot=max(gY−min(open,h),top+15); bw=w+1; bx=sx−.5 | COLOR named + inline #ff7a45/#7fd6ff |
| 21 | enforceChartContinuity | chart-quest.html:18211 | gameplay | camera/geom | camera reads x/w | keep printed live-edge at target screen frac | n/a |
| 22 | drawFlowRead | chart-quest.html:11562 | overlay | draw/geom/hittest | reads pixel by id | dup bodyBot clamp (≡12853); manual −camY | inline #16c784/#ff9f43/#7fd6ff/#ffd60a |
| 23 | drawQuickRead | chart-quest.html:11697 | overlay | draw/geom/hittest | reads pixel by id | verbatim copy of drawFlowRead geom; −camY; assumes camZoom=1 | inline |
| 24 | drawHTFZoom | chart-quest.html:13896 | overlay | draw/width/wick/geom/model | OHLC htf[] {lo,hi,open,h} SEPARATE | CY(v)=cY+cH(1−(v−lo)/rng); pitch/cw clamp5..28; own ppp | inline + COLOR mix |
| 25 | drawVWAP | chart-quest.html:14248 | overlay | draw/geom | reads c.vwap | sx=c.x+w/2−cameraX; sy=gY−vwap | inline rgba |
| 26 | drawVolumeBars | chart-quest.html:14278 | overlay(DEAD) | draw/width | reads c.vol | barH; w−2/x+1 DIVERGENT; zero callers | inline |
| 27 | drawTrendLines | chart-quest.html:14294 | overlay | draw/geom | reads pixel | hi=max(open,h)+wick own recompute; 3-bar pivot | inline rgba |
| 28 | drawHTFPanel | chart-quest.html:14342 | hud | draw/width/wick/geom/model | OHLC htf[] SEPARATE | cw=14 fixed; own per-row lo/hi norm | COLOR named + inline |
| 29 | render | chart-quest.html:14424 | gameplay | draw/camera/orchestr | orchestrator | 1x save/restore world layer; price-scale x2; setupZone inlines candleTop | mixed |
| 30 | drawSetupSpotlight | chart-quest.html:14879 | overlay | draw/geom | reads pixel by id | INLINES candleTop; −camY; early-out if setupFlow active | inline rgba purple |
| 31 | drawHUD | chart-quest.html:15091 | hud | draw/dashboard | screen coords | dispatches drawHTFPanel(15317)+drawHTFZoom(15318) | inline |
| 32 | drawBull | chart-quest.html:5588 | quiz | draw/color | mascot (no OHLC) | vector head/body | inline #16c784 etc |
| 33 | drawBear | chart-quest.html:5626 | quiz | draw/color | mascot (no OHLC) | vector | inline #ea3943 etc |
| 34 | buildQuizCandles | chart-quest.html:5666 | quiz | gen/model | hybrid {open,h,color STORED,wick} value-space | h clamp 60-260; cx-scaled; returns 7 + hidden 8th | stored token |
| 35 | drawQuizChart | chart-quest.html:5691 | quiz | width/wick/color/draw | value-space via QY() | cW2=cw2/(n+1.5) FULL slot; sharp; minBody2 | COLOR fill + inline bg |
| 36 | imDrawSpark | chart-quest.html:5980 | intermission | draw/color/model | closes[] polyline | imClose sparkline; dpr≤2 | inline |
| 37 | imDrawAnatomy | chart-quest.html:6019 | intermission | width/wick/color/draw | synthetic 2-candle | cw=24 FIXED; sharp; wick lw2 | inline |
| 38 | imDrawDoji | chart-quest.html:6033 | intermission | width/wick/color/draw | 3 OHLC via _imCdl | cw=22 FIXED; minBody2 | inline |
| 39 | imDrawWaitClose | chart-quest.html:6044 | intermission | width/wick/color/draw | 2 OHLC via _imCdl | cw=26 FIXED | inline |
| 40 | imDrawLongShort | chart-quest.html:6055 | intermission | draw/color | arrows (no candle) | imArr up/down | inline |
| 41 | imDrawSR | chart-quest.html:6063 | intermission | width/wick/color/draw | 7 OHLC via _imCdl | cw=min(16,slot*0.5) | inline |
| 42 | imDrawTrendline | chart-quest.html:6072 | intermission | width/wick/color/draw/geom | 7 OHLC via _imCdl | cw=min(15,slot*0.5); dashed line | inline |
| 43 | imDrawStructure | chart-quest.html:6084 | intermission | width/wick/color/draw/model | IM_UP/DN {o,c}+imWk±3 | cw=min(20,slot*0.52); own forEach lw1.3 | inline (+#a855f7) |
| 44 | imSizeChart | chart-quest.html:6125 | intermission | camera | canvas sizing | dpr=min(devicePixelRatio,2) | n/a |
| 45 | imDrawReplay | chart-quest.html:6148 | replay | width/wick/color/draw/geom/model | real recorded game candles | cw=clamp(2.5,7,slot*0.6); minBody1.5 | inline |
| 46 | setupChartSVG | chart-quest.html:6979 | svg-chart | draw/width/height/wick/color/geom/model | pixel array reused | 2-pass auto-range wick cap 40%; bw2=xw−4 NO rx | inline #16c784/#ea3943/#8b98a8/#ff7a45 |
| 47 | setupChartSVGFull | chart-quest.html:7113 | svg-chart | (same) | pixel | bw2=xw−5 rx1; wick2.5; marker arrows | inline |
| 48 | tradeChartSVGFull | chart-quest.html:7594 | svg-chart | (same) | candleSnap[]+trade meta | bw2=xw−10 rx1; VWAP path; SL/TP lines | inline |
| 49 | renderReviewChart | chart-quest.html:8174 | replay | draw(delegate) | — | innerHTML tradeChartSVGFull per overlay toggle | n/a |
| 50 | openReviewChart | chart-quest.html:8200 | replay | draw(delegate) | — | routes startReplay 240ms full regen | n/a |
| 51 | ddGuessChartSVG | chart-quest.html:9022 | minigame | draw/width/height/color/geom/model | pixel BODY-ONLY (no wick) | bw=xw*0.6 rx1; auto-range body only | inline |
| 52 | bossCandleSVG | chart-quest.html:9273 | boss | draw/width/height/wick/color/geom/model | OHLC {o,c,up,lo} FIXED 0..100 | Y=pad+(1−v/100)*..; bw=min(46,slot*0.5) rx1.5 | inline #16c784/#ea3943/#c9d1d9 |
| 53 | candleExtremeXY | chart-quest.html:9290 | boss | hittest/geom | OHLC {o,c,up,lo} | RE-DECLARES bossCandleSVG consts verbatim | n/a |
| 54 | bossCandleSVGTrend | chart-quest.html:9303 | boss | draw/geom/hittest | reuses bossCandleSVG via string .replace | strip </svg>, append polyline + r9 dots | inline #ffd60a |
| 55 | renderBossRound | chart-quest.html:10094 | boss | draw(delegate) | — | innerHTML boss chart per round | n/a |
| 56 | drawCandleAcademy | chart-quest.html:15527 | academy | width/wick/color/draw/geom | per-card synthetic | cw 32/44/32 FIXED; rr radius3; doji/demo sharp | COLOR fill + inline edges #0d9460/#b52a30/#8b98a8 |
| 57 | drawQuizCandle | chart-quest.html:16319 | quiz | width/wick/color/draw/geom | {o,c} norm 0..1 via pxOf | cw PASSED (52/54); rr5; minBody5; wick lw3 #8b98a8 | COLOR fill + inline edge |
| 58 | drawFlashQuiz | chart-quest.html:16363 | quiz | draw/width/color/hittest | delegates to drawQuizCandle | passes cw 52 vs 54 same helper | inline |
| 59 | drawPredictionBet | chart-quest.html:16468 | quiz | width/color/draw/geom/model | forming candle norm | bodyW=44 HARD@16521; rr5; minBody6; finalNorm .78/.22 | COLOR fill + inline edge |
| 60 | educational bodyW=44 | chart-quest.html:16521 | lesson | width | fixed override | const bodyW=44 (ignores candleW) | n/a |
| 61 | MG IIFE wrapper | chart-quest.html:18600 | minigame | scope | closure boundary | const MG=(fn(){'use strict'})(); returns {run,REG} | n/a |
| 62 | mgCandles | chart-quest.html:18625 | minigame | gen/model | OHLC {o,c,hi,lo} ABSOLUTE base100 | mulberry32 rng; anti-doji floor; chain law | inline (callers) |
| 63 | fromPath/padLead | chart-quest.html:18630 | minigame | gen/model | {o,c,hi,lo} | PATTERNS level arrays → candles | inline |
| 64 | gen* structure | chart-quest.html:18676 | minigame | gen/model | {o,c,hi,lo}+extra[] | genBOS/Zone/Liquidity; DIFF_N/VOL/TIME | inline |
| 65 | ChartView | chart-quest.html:18635 | minigame | height/width/camera/draw/hittest/geom | reads {o,c,hi,lo} | Y auto-fit; cw=max(2.5,slot*0.6); own DPR | inline #ff9f43 |
| 66 | ChartView.candlesN | chart-quest.html:18652 | minigame | draw/color/width/wick | {o,c,hi,lo} | bw=max(2,cw); edge #5cf0b4/#ff7a82 (3rd edge combo) | inline body + fork edges |
| 67 | boxCandles | chart-quest.html:19041 | minigame | draw/color/width/height | closes[] only, open=prev | cw=max(2.5,bw/n*0.55); FORK #1fe08a/#ff4d5e | inline FORK |
| 68 | ART tiles | chart-quest.html:19042 | minigame | draw/color/geom | hardcoded closes[] | 19 renderers via boxCandles | inline fork + #4cc3ff |
| 69 | drawArcadeTile | chart-quest.html:19060 | minigame | draw/color | chrome | ART[m.art] into rounded panel | inline #4cc3ff |
| 70 | renderLib | chart-quest.html:19082 | minigame | draw | — | REG cards via rAF | n/a |
| 71 | thumb | chart-quest.html:19102 | minigame | draw/color/width/height | {o,c,hi,lo} | cw=max(1.6,slot*0.6); 4th draw path | inline canonical |
| 72 | LessonChart C | chart-quest.html:19160 | lesson | color | palette obj (3rd) | green#16c784/wick#1fd790; red#ea3943/#ff5663; shell#36d9e0 | C.* named |
| 73 | LessonChart SCENES | chart-quest.html:19163 | lesson | model/gen | authored {o,h,l,c} (h/l) | ~30 scenes + typed anns | n/a |
| 74 | LessonChart draw/chartRender | chart-quest.html:19282 | lesson | draw/width/height/wick/camera/color | reads {o,c,h,l} | slot*0.72 cap48 NO-min; print-on animation | C.* + inline rgba highlights |
| 75 | drawShell | chart-quest.html:19323 | lesson | draw/color | icon | radial halo; C.shell diamond | C.* named + inline |
| 76 | CONCEPT_PRACTICE | chart-quest.html:19331 | lesson | model/draw/hittest/color/width | authored {o,h,l,c} | bw=min(42,slot*0.66); edge #0c9c69/#c0212c (5th combo) | inline |
| 77 | FW.sequence runBuild | chart-quest.html:19648 | minigame | draw/hittest/width/height | resp{open,close}0-100 | FIXED 16px body (SHOT-14: was 44); drag handles | inline canonical + #ffd60a |
| 78 | Cross-block global bridge | chart-quest.html:19675 | minigame | scope | window.* | exports LessonChart/openConceptPractice/openIntroLesson/CONCEPT_PRACTICE; imports ContentLog | n/a |
| 79 | TF/ARCADE/CATS consts | chart-quest.html:19010 | minigame | color/geom | module consts | ARCADE per-game accents; CATS filter | inline accents |
| 80 | Block 3 QA bridge | chart-quest.html:19680 | harness | scope | IIFE ?qa=1 | refs b1 consts (candleAcademy/openBoss) cross-tag | n/a |
| 81 | Block 4 ContentLog | chart-quest.html:19899 | harness | scope | window.ContentLog IIFE | logger + postMessage | n/a |
| 82 | Supabase CDN | chart-quest.html:1590 | harness | — | external UMD | supabase-js@2 | n/a |
| 83 | Block 1 script | chart-quest.html:1591 | gameplay | scope | shared script-scope | all core renderers; ~401 fn decls | n/a |
| 84 | boxCandles (clone) | dashboard.html:896 | dashboard | draw/color/width | closes[] | byte-clone of chart-quest:19041; #1fe08a/#ff4d5e | inline FORK |
| 85 | drawArcadeTile | dashboard.html:915 | dashboard | draw/color | chrome | ART.* tile compositor | inline |
| 86 | drawMGTiles | dashboard.html:973 | dashboard | draw | — | minigame tile grid | inline |
| 87 | draw (chart demo) | dashboard.html:1564 | dashboard | draw/color | closes[]/candle-data | body #16c784/#ea3943 + stripe #3ff0ad/#ff5d6c | inline (4 green variants) |
| 88 | underchartDemo | dashboard.html:1618 | dashboard | draw/color | candle-data | demo | inline |
| 89 | chartScaleDemo | dashboard.html:1639 | dashboard | draw/color | candle-data | demo | inline |
| 90 | chartCenterDemo | dashboard.html:1721 | dashboard | draw/color | candle-data | demo | inline |
| 91 | eduChartDemo | dashboard.html:1783 | dashboard | draw/color | candle-data | strp #3ff0ad/#ff5d6c | inline |
| 92 | candle draw + drawShell | lesson-chart-preview.html:441 | harness | draw/color | own C.* + CSS vars | parallel palette; well-structured | C.* named + CSS var |
| 93 | index.html (BYTE-MIRROR) | index.html:2412 | gameplay(deployed) | mirror | identical | cksum 4183363700; manual cp | mirrors all |
| 94 | website/game.html (MIRROR) | website/game.html:2412 | marketing | mirror | identical | cksum 4183363700; 3rd synced copy | mirrors all |
| 95 | marketing SVG palette | website/index.html:87 | marketing | color | static SVG | UPPERCASE #16C784/#EA3943 + #0f9d68; 5th green | inline uppercase |
| 96 | loader gradient | website/play.html:47 | marketing | color | CSS gradient | decorative #16c784 (no candles) | inline |
| 97 | chart-quest.min.html (STALE) | chart-quest.min.html:1 | harness(stale) | mirror | minified Jul-3 | 74/54 literals; NOT a migration target | inline |
| 98 | build.js (DEAD pipeline) | build.js:112 | harness | — | — | writes minified into index.html; unused (index is unminified) | n/a |

---

## 4. Renderer Dependency Graph

```mermaid
flowchart TD
  subgraph B1["BLOCK 1 (1591-18565) — shared script-scope (const/fn visible to b3/b4)"]
    CFG["CFG:2312 widths/pxPerPct1600/minBody15"]
    COLOR["COLOR:2412 palette (single source)"]
    CSS["CSS --green/--red:1155 (2nd defn)"]
    subgraph GEN1["Generation (pixel-baked, mutate market.level px + market.price $)"]
      SCR[scriptedCandle:2828]
      SET[setupFlowCandle:2897]
      TRD[tradeDrivenCandle:2946]
      CAR[cartoonCandle:3049 DEAD]
      NXT[nextCandle:3086 dispatch / MARKET_DATA replay]
      DEC[decorateCandleWicks:3200]
      CW[candleW:3257 CANONICAL width]
      MNT[maintainCandles:3264 side-effects]
      PSH[pushCandle:2492 factory]
    end
    MODEL1["PIXEL MODEL A {x,w,h(=close),open(=prev.h),wick,color DERIVED}<br/>candleTop:2523 = groundY-max(open,h) — LOAD-BEARING SEAM"]
    subgraph REND1["Canvas renderers"]
      DRW[drawCandle:12839 COLOR-named]
      RND[render:14424 orchestrator: 1x save/restore, price-scale x2]
      FLW[drawFlowRead:11562]
      QCK[drawQuickRead:11697]
      SPT[drawSetupSpotlight:14879]
      VWP[drawVWAP:14248]
      TRN[drawTrendLines:14294]
      HUD[drawHUD:15091]
    end
    subgraph HTF["Separate OHLC MODEL A' (htf[] {lo,hi,open,h})"]
      HZ[drawHTFZoom:13896 own CY()/ppp]
      HP[drawHTFPanel:14342 cw=14]
    end
    subgraph SVG["SVG renderers (inline hex, bespoke widths)"]
      SS[setupChartSVG:6979]
      SSF[setupChartSVGFull:7113]
      TSF[tradeChartSVGFull:7594]
      DD[ddGuessChartSVG:9022 body-only]
      BOSS["bossCandleSVG:9273 MODEL C {o,c,up,lo} FIXED 0..100"]
      BEX[candleExtremeXY:9290 DUP consts]
      BST[bossCandleSVGTrend:9303 string .replace surgery]
    end
    subgraph EDU["Quiz/Academy/Intermission (inline hex)"]
      BQ["buildQuizCandles:5666 hybrid {open,h,color STORED}"]
      DQ[drawQuizChart:5691]
      IM[_imCdl+imDraw*:6019-6148 fixed cw 22/24/26]
      AC[drawCandleAcademy:15527 cw 32/44]
      QC[drawQuizCandle:16319 cw passed 52/54]
      PB[drawPredictionBet:16468 bodyW=44@16521]
    end
  end
  subgraph B2["BLOCK 2 IIFE (18599-19678) — ISOLATED closure scope"]
    MG["mgCandles:18625 MODEL B {o,c,hi,lo} ABSOLUTE"]
    CV[ChartView:18635 cw=slot*0.6]
    CVN[candlesN:18652 edges #5cf0b4/#ff7a82]
    BOX["boxCandles:19041 MODEL D closes[] #1fe08a/#ff4d5e FORK"]
    CN[LessonChart C:19160 3rd palette wick#1fd790]
    LC["LessonChart draw:19282 reads {o,h,l,c} slot*0.72"]
    SC["SCENES:19163 authored {o,h,l,c}"]
    CP[CONCEPT_PRACTICE:19331 slot*0.66]
    RB[runBuild:19648 fixed 16px]
    BR[window.* bridge:19675]
  end
  subgraph B3["BLOCK 3 QA (19680) ?qa=1 — refs b1 consts cross-tag"]
  end
  subgraph B4["BLOCK 4 window.ContentLog (19899)"]
  end
  subgraph OTHER["Other files"]
    DASH[dashboard.html boxCandles:896 BYTE-CLONE]
    LPV[lesson-chart-preview.html:441 own C.* palette]
    IDX[index.html BYTE-MIRROR cksum 4183363700]
    WG[website/game.html BYTE-MIRROR]
    WI[website/index.html:87 static SVG #16C784 uppercase]
    MIN[chart-quest.min.html STALE Jul-3]
    BLD[build.js:112 DEAD minify pipeline]
  end

  CFG --> CW --> MNT
  SCR --> NXT
  SET --> NXT
  TRD --> NXT
  NXT --> MNT
  DEC --> PSH
  MNT --> PSH --> MODEL1
  MODEL1 --> DRW
  COLOR --> DRW
  RND --> DRW
  RND --> HUD
  MODEL1 --> FLW
  MODEL1 --> QCK
  MODEL1 --> SPT
  MODEL1 --> VWP
  MODEL1 --> TRN
  MODEL1 -. reuses candles.slice .-> SS
  MODEL1 -. .-> SSF
  MODEL1 -. .-> TSF
  MODEL1 -. .-> DD
  HUD --> HZ
  HUD --> HP
  BOSS --> BST
  BOSS -. verbatim consts .-> BEX
  BEX --> BST
  MG --> CV --> CVN
  BOX --> CVN
  CN --> LC
  SC --> LC
  BR -->|window.LessonChart etc| B1
  B4 -->|window.ContentLog| B2
  BOX -. byte clone .-> DASH
  DRW -. cp chart-quest.html .-> IDX
  DRW -. copy .-> WG
  CFG -. constitution A.6 target .-> CW
  COLOR -. bypassed by 236x inline .-> SVG
  COLOR -. bypassed .-> EDU
  CSS -. 3rd defn .-> COLOR
```

**Narrative.** The graph shows one healthy spine — generation → `pushCandle` → PIXEL MODEL A → `drawCandle` reading `COLOR` — surrounded by a corona of renderers that each break off the shared model and re-invent geometry and color. The dashed edges are the pathology: `COLOR` is "bypassed by 236× inline" into SVG and EDU; the boss renderer feeds its hit-test "verbatim consts"; MODEL A is reused as `candles.slice()` by four SVG renderers that then apply their own scale; and the whole subgraph is triplicated by `cp` into `index.html` and `website/game.html`. Block 2 is a walled subgraph reachable only through the `window.*` bridge — the structural fact that forces the engine onto `window`.

---

## 5. Duplicate Rendering Logic

The clusters below are quantified from the inventory. Each is a place where one behavior is implemented many times.

**Cluster 1 — Body-width formulas: 20+ bespoke implementations, none following the Constitution's one-formula rule (A.1/A.6).** The canonical rule is `slot = usableChartWidth / targetVisibleCount; bodyW = round(clamp(slot × WIDTH_RATIO, BW_MIN, BW_MAX))`. What exists instead: `candleW round(clamp((W*0.52)/8.5,24,56)*rand(.92,1.1))` (3257, the live gameplay width); `cw2/(n+1.5)` (5691); fixed `24`/`22`/`26` (6019/6033/6044); `min(16,slot*0.5)` (6063); `min(15,slot*0.5)` (6072); `min(20,slot*0.52)` (6084); `clamp(2.5,7,slot*0.6)` (6148); `xw-4`/`xw-5`/`xw-10` (6979/7113/7594); `xw*0.6` (9022); `min(46,slot*0.5)` (9273); fixed `32/44` (15527); passed `52/54` (16319); **hardcoded `44`** (16521); `max(2.5,slot*0.6)` (18635); `max(2.5,bw/n*0.55)` (19041); `max(1.6,slot*0.6)` (19102); `min(48,slot*0.72)` cap-no-min (19282); `min(42,slot*0.66)` (19331); **fixed `16`** (19648); plus `dashboard.html:896`. **Canonical target:** one engine `width()` implementing A.6 (`WIDTH_RATIO` A/C 0.72, B 1.0; `bwBands`; envelope 12–56). *Adversarial correction (see §10): for the gameplay surface this is an **identity passthrough of the generator's stored `c.w`, not a re-derivation** — because `c.w` is a physics boundary.*

**Cluster 2 — price→Y (height-scale) mapping: re-derived per renderer.** `candleTop` (2523) + inline body-bottom (12853); `_imYmap` (6030); auto-range Y in `setupChartSVG` (6979), `setupChartSVGFull` (7113), `tradeChartSVGFull` (7594), `ddGuessChartSVG` (9022); fixed-domain `Y=pad+(1−v/100)*..` (9273); `CY()`+`ppp` (13896); per-row lo/hi (14342); `_pAt` gridlines (14458) **and** `_syp` labels (14739) — **two scale computes in the same frame**; `groundY−vwap` (14248); auto-fit (18635); `boxCandles` Y (19041); `LessonChart` Y (19282); `dashboard.html:1564`. **Canonical target:** a single `priceToY(v, viewport)` with one auto-range pass, and `render()` computing the scale **once** per frame.

**Cluster 3 — Wick renderers: re-implemented per surface with divergent color/width.** `decorateCandleWicks` model mutation (3200); `drawCandle` layered wick with `#ff7a45`/`#7fd6ff` (12866); `_imCdl` lineWidth2 (6030); `imDrawStructure` lineWidth1.3 (6113); SVG 1.5/2.5 (6979/7113); boss `#c9d1d9` 2.5 (9273); HTF (13896/14342); `drawQuizCandle` `#8b98a8` lineWidth3 (16331); `ChartView.candlesN` (18652); `LessonChart` animated lineWidth3 (19299). **Canonical target:** one `drawWick` primitive taking a palette wick token + a width token.

**Cluster 4 — Palette: 3 named palette objects + 2 forked palettes + ~236 inline literals bypass `COLOR`.** `COLOR` (2412, the only site any renderer honors — `drawCandle`); CSS vars (1155); `LessonChart C` (19160, different wicks `#1fd790`/`#ff5663`); `lesson-chart-preview.html` `C.*` (441); `boxCandles` FORK `#1fe08a`/`#ff4d5e` (19041 + dashboard 896); dashboard stripe `#3ff0ad`/`#ff5d6c` (1564); marketing UPPERCASE `#16C784`/`#EA3943` + `#0f9d68` (website/index.html:87); ~236 inline `#16c784` / ~159 `#ea3943`. **Canonical target:** `COLOR` (extended, see §10) as sole palette, published on `window`; de-inline the literals **by classification, not blind grep**; delete the `#1fe08a`/`#ff4d5e` fork.

**Cluster 5 — `candleTop` body-top / body-bottom(min-body) copy-pasted verbatim or inlined instead of called.** Original at 12853 (`bot=max(gY-min(open,h),top+minBody)`); verbatim copies in `drawFlowRead` (11568) and `drawQuickRead` (11706); inlined (not called) in `render` setupZone (14635) and `drawSetupSpotlight` (14898/14899). **Canonical target:** a `candleBodyBottom(c)` helper + always call `candleTop(c)` — but this collapse is **render-only** and must never leak the min-body clamp into a hit-test (see §10, §12).

**Cluster 6 — `boxCandles` closes[] renderer cloned byte-for-byte across files.** `chart-quest.html:19041` and `dashboard.html:896`. Cross-app blast radius; the dashboard is a separate founder app.

**Cluster 7 — Boss chart coordinate constants duplicated verbatim between renderer and hit-test.** `bossCandleSVG` VW/VH/pad/Y/slotW/cx (9273) re-declared identically in `candleExtremeXY` (9290); `bossCandleSVGTrend` composes via `.replace('</svg>','')` (9303). **Canonical target:** a single boss-layout function whose geometry both draw and tap-mapping **read back** (not recompute).

**Cluster 8 — Full-file byte mirrors kept in lockstep by manual copy.** `chart-quest.html` → `index.html` → `website/game.html` (all cksum 4183363700); `chart-quest.min.html` stale. `build.js:112` intends this but is dead.

**Cluster 9 — Minimum-body-height floor scattered with divergent values.** `CFG.minBody=15` (2332); `max(2,..)` (5707/6113); `max(5,..)` (16327); `max(6,..)` (16538); `max(1.5,..)` (6165); `max(3,..)` (6979); `max(4,..)` (7113). **Canonical target:** one `BODY_MIN` token in the spine.

---

## 6. Duplicate Constants and Duplicate Calculations

### Duplicate constants registry

| Constant | Divergent values | Where |
|---|---|---|
| **Green body hex** | `#16c784` (COLOR/CSS/C) · `#1fe08a` (arcade FORK) · `#16C784` (marketing UPPER) · `#3ff0ad` (dash stripe) · `#0f9d68` (marketing dark) · `#3ddc6a` (quiz label) · `#5dedb5` (greenStripe) | 2412 · 1155 · 19160 · 441 · 19041+dash896 · dash1564 · web/index:87 · ~236× inline |
| **Red body hex** | `#ea3943` (COLOR/--red) · `#ff4d5e` (FORK) · `#EA3943` (UPPER) · `#ff5d6c` (dash) · `#f3838a` (redStripe) · `#ff5663` (LessonChart wick) | 2412 · 1155 · 19041+dash896 · dash1564 · web/index:87 · ~159× inline |
| **Green edge/border** | `#0c9c69` · `#5cf0b4` · `#0d9460` · `#5dedb5` (stripe reused) | 2412 · 18652 · 15527/16319/16468 · drawCandle |
| **Red edge/border** | `#c0212c` · `#ff7a82` · `#b52a30` · `#b89600` (doji) | 2412 · 18652 · 15527/16319/16468 · 16319 |
| **Wick color** | `#c9d1d9` (COLOR/boss) · `#8b98a8` (academy/quiz) · `#1fd790`/`#ff5663` (C) · `#5cf0b4`/`#ff7a82` (candlesN) | 2412/9273 · 15527/16331 · 19160 · 18652 |
| **Min-body floor** | `15` · `2` · `5` · `6` · `1.5` · `3` · `4` | 2332 · 5707/6113 · 16327 · 16538 · 6165 · 6979 · 7113 |
| **Width ratio / slot factor** | `0.52` (gameplay) · `0.72` (LessonChart/spine) · `0.66` · `0.6` · `0.55` · `0.5` · `0.52` · `44` fixed · `16` fixed · `24/26/22/32` fixed | 3257 · 19282 · 19331 · 18635/19102/6148/9022 · 19041/dash896 · 6063/9273 · 6084 · 16521 · 19648 · 6019-6044/15527 |

### Duplicate calculations registry

- **price→Y scale, computed twice in one frame:** `render()` gridlines `_pAt` (14458) and price labels `_syp` (14739) run the same `_step`/`_raw`/`_mag`/`_norm` magnitude algorithm, in different coordinate spaces (world vs screen), plus a third `ppp` in `drawHTFZoom` (13896). *Not "free" to unify (see §16): the step/domain math is genuinely duplicated and should be one call, but the two transform applications operate in different spaces and directions and must remain separate consumers.*
- **candleTop body-bottom min-body clamp:** the identical `max(groundY-min(open,h), top+minBody)` at 12853, 11568, 11706, and inlined at 14899/14635.
- **Boss coordinate constants:** VW/VH/pad/Y/slotW/cx computed identically at 9273 and 9290.
- **SVG wick auto-range cap:** `bodyRange*0.4 (+1/+2)` repeated at 6979, 7113, 7594.
- **Full SVG-string regeneration:** `tradeReplaySVG` fully rebuilt + `innerHTML` every 240 ms (8183 via 8200); `renderReviewChart` rebuilds on every overlay toggle (8174).

---

## 7. Magic Numbers

| Value | Meaning | Locations |
|---|---|---|
| **236** | inline `#16c784` (canonical green) literals bypassing `COLOR.greenBody` — **grep-verified** — triplicated across index.html + website/game.html | chart-quest.html (SVG 6000–9999 ~72, quiz 5000–6999 ~51, HUD/overlay 10000–15999 ~34, …); index.html; website/game.html |
| **159** | inline `#ea3943` (canonical red) literals bypassing `COLOR.redBody` — **grep-verified** | chart-quest.html; index.html; website/game.html |
| **44** | educational fixed candle body width overriding `candleW()` (`drawPredictionBet`) | 16521 |
| **16** | block-2 build-a-candle fixed body width ("SHOT-14: was 44, ~3× too wide") | 19648 |
| **1600** | `pxPerPct` — price($)→pixel-height scale; `step=dPct*pxPerPct` in replay | 2330 CFG |
| **0.52** | `cameraAnchor` — camera x-anchor fraction **and** width slot basis `(W*0.52)/8.5` (dual meaning) | 2358 CFG · 3257 candleW · 4254 candleAtScreen |
| **8.5** | `candleTargetVisible` — target on-screen count feeding width (**conflicts with spine's `12`**, see §9/§10) | 2353 CFG |
| **15** | `CFG.minBody` — forced visible body px so a doji is never 0px (drawn body may exceed \|h-open\|) | 2332 · 12853 · 11568/11706 copies |
| **250** | `PORTAL_HOVER_GAP` — portal Y offset above highest candleTop | 2534 |
| **0..100** | boss-chart FIXED price domain (no auto-range) — the only renderer not scanning lo/hi; also `mgCandles` base price 100 | 9273 · 9290 · 18625 |
| **0.72** | Constitution `WIDTH_RATIO` (A/C) — matched only by LessonChart:19282 (capped, not clamped); unimplemented elsewhere | Constitution A.6 · 19290 |
| **240** | replay `setInterval` period (ms) — full `tradeReplaySVG` regeneration + innerHTML every tick (hottest allocation path) | 8183 startReplay (via 8200) |
| **0.4** | SVG wick auto-range contribution cap (`bodyRange*0.4 +1/+2`) — repeated in all pixel-baked SVG renderers | 6979 · 7113 · 7594 |
| **30 / 0.10** | `MIN_TRADE_CANDLES` (min candles to reach predetermined TP/SL) and `DRIVE_EASE` (trade-driven step easing) | 2945 / 2938 |

---

## 8. Representation Conflicts

There are **five** live candle schemas. The dangerous ones are not the different-looking schemas but the **identical-looking ones with different semantics**.

- **MODEL A (gameplay, pixel-baked):** `{id,x,w,h,open,wick,wick2,color,vol,price,…}` where `h = close` and `open = previous candle's h` are **absolute world pixels above `groundY`** (height *is* the price-proxy), `color` is **derived** (`h>=open ? green : red`), and `$price` rides a parallel `market.price` scalar. `candleTop(c) = groundY − max(open,h)` feeds terrain/movement/portals/collectibles — **the load-bearing hitbox seam.** A canonical OHLC engine adapting this must store only `close(=h)` and `open(=prev close)`; high/low are reconstructed as `max(open,h)+wick` / `min(open,h)−wick2`. **And critically, `x` and `w` are physics geometry, not draw parameters** (see §9, §10).
- **MODEL B (block-2 mini-game) `{o,c,hi,lo}`:** `hi`/`lo` are **absolute price levels** (`mgCandles`, base `p=100`).
- **MODEL C (boss SVG) `{o,c,up,lo}`:** `up`/`lo` are **wick lengths relative to the body** (NOT absolute levels), on a **fixed 0..100 domain with no auto-range**. Different field semantics from MODEL B under the same-looking field names — **a genuine trap.**
- **Authored-vs-generated field-name split inside Block 2 alone:** hand-authored `SCENES`/`CONCEPT_PRACTICE`/`LESSON` use `{o,h,l,c}`; generators (`mgCandles`/`genBOS`/`genZone`) use `{o,c,hi,lo}`. `ChartView` reads `hi/lo`; `LessonChart.draw` reads `h/l`. An adapter must normalize both.
- **MODEL D (closes[]-only):** `boxCandles` infers `open = closes[i-1]`; no stored O/H/L. Leanest model, byte-cloned into `dashboard.html`.
- **Hybrid (`buildQuizCandles`) `{open,h,color,wick,wick2}`:** gameplay `open/h` naming but value-space (no baked x) and `color` **stored** not derived — a fifth schema.

**Why it matters, beyond aesthetics.** Two conflicts are physics-visible, not cosmetic:

1. **Drawn body ≠ model body.** `drawCandle` body-bottom `= max(groundY−min(open,h), top+minBody)`, so for tiny candles the **drawn/hittable** body height exceeds `|h−open|`. The walkable top (`max`) is unaffected, but body-bottom is **not** `candleTop`'s mirror. Any helper collapsing the six copies must keep this a **render affordance** that never reaches physics or tap-mapping.
2. **`$price` and `level(px)` drift** at the world ceiling/floor (`levelMin80`/`levelMax700`): replay advances `$` via raw `dPct` but height via the *clamped* step, so the two diverge at the clamp.

An engine with a single canonical interface is impossible **without a normalization/adapter layer**, and the MODEL B/C look-alike trap must be resolved **at the boundary, in named functions a reviewer can diff**, not silently inside twenty renderers.

---

## 9. Current Technical Debt

Severity-ranked. "Critical" means it blocks or endangers the canonical-engine goal itself.

**Critical**

1. **Four+ incompatible candle schemas with no adapter layer.** Any "one canonical engine" is impossible without a normalization layer; the pixel model's `candleTop` seam is coupled to terrain/movement and must be preserved as a compatibility shim through any refactor.
2. **Candle *width* `c.w` is an unfrozen load-bearing hitbox, not a draw parameter.** Verified consumers: wall-collision blocks at `c.x` and `c.x+c.w` every frame (12527–12530); the on-screen hit-test extent `wx>=c.x && wx<c.x+c.w` (4261); coin spawns at `c.x+c.w/2` (3291); liquidity pickups gate on `c.x+c.w/2` (8447); the right-wall snap sets `turtle.x=c.x+c.w` (12530). The drawn body equals this extent via `bw=c.w+1` (12858) with `gap0` so candles **touch** and form a continuous walkable road. Routing gameplay width through a band-clamped, re-jittered `width()` breaks the body↔hitbox correspondence. **The frozen seam is `{candleTop, c.x, c.w, gap}` collectively — not `candleTop` alone.**

**High**

3. **Block-2 IIFE scope isolation.** Block-1 `COLOR` and candle functions have zero references in 18599–19678; Block 2 reaches Block 1 only via the `window.*` bridge (19675). A canonical engine authored as a top-of-Block-1 `const` is `undefined` inside Block 2 and **must** be published on `window`. Migration lynchpin.
4. **~236 inline `#16c784` + ~159 `#ea3943` bypass `COLOR`; 3 parallel palettes + 2 forks + an uppercase marketing variant.** A palette change today requires editing hundreds of literals across three byte-mirrors and reconciling 5 green + 4 red variants. Only `drawCandle` is gold-standard.
5. **20+ independent width formulas, none implementing A.6.** The one-formula rule is unimplemented anywhere; each surface renders at a different, non-deterministic width.
6. **`candleTop` body-bottom clamp copy-pasted in 3 overlays and inlined in 2 more.** Highest-regression seam — a change to `candleTop`/`groundY` semantics diverges movement/terrain/portals from the drawn body across the copies.

**Medium**

7. **Full SVG-string regeneration + `innerHTML` on every render; replay regenerates the entire `tradeReplaySVG` every 240 ms.** Hottest allocation/DOM-thrash path.
8. **Price→Y scale computed twice per frame in `render()`** (14458 + 14739) plus a 3rd `ppp` in `drawHTFZoom` — redundant work and divergence risk, entangled with the frozen camera transform.
9. **`boxCandles` cloned byte-for-byte into `dashboard.html:896`** (separate founder app; **currently dirty in the working tree** — the clone relationship must be re-verified, not assumed).
10. **`candleExtremeXY` re-declares `bossCandleSVG` constants verbatim; `bossCandleSVGTrend` string-`.replace` surgery.** Boss layout lives in two places; any change desyncs tappable trend dots from drawn candles.
11. **Deploy is a manual `cp`; the minify pipeline is dead; `chart-quest.min.html` is stale.** No build/bundle step; every engine change is triplicated across byte-mirrors.
12. **Generation is non-deterministic** (`Math.random` in width jitter, anti-staircase, counter-candles, wick decoration, sweep magnitude, shell/mega spawns). Only the seeded `MARKET_DATA` price envelope is reproducible; terrain is not byte-reproducible run-to-run.
13. **`targetVisibleCount` mismatch: code `8.5` (2353) vs spine `12`.** Adopting the spine value on gameplay changes slot → width → on-screen count → traversal. "Pixel-identical gameplay" and "adopt the spine" are mutually exclusive on this surface until a deliberate call is made.
14. **The Constitution asserts a CI validator exists (line 1132: "A validator runs them against every authored/generated chart before it ships").** Verified false today: `scripts/verify.js` runs zero V-validators and renders nothing. This must be marked aspirational, not treated as foundation.

**Low**

15. **`drawVolumeBars` (14278) dead code** with divergent geometry (`c.w-2`/`x+1` vs drawCandle's `c.w+1`/`x-0.5`) — would misalign if re-enabled.
16. **`cartoonCandle` (3049) legacy dead code**, superseded by `scriptedCandle`.
17. **`chart-quest.min.html` (5.9 MB, Jul-3) stale artifact** linked by nothing — delete or regenerate, not a migration target.

---

## 10. Architecture Recommendations

The canonical engine is `window.CQ` — a single frozen global namespace defined as a "Block 0" at the very top of Block 1 and published on `window` before any renderer or the Block-2 IIFE runs, so all four script blocks reach the identical object (Block 1 by lexical `CQ`, Blocks 2/3/4 by `window.CQ`). It carries the ideal fifteen-module tree as **frozen sub-objects**, driven entirely by the A.6 spine.

**Why namespace, not bundler.** The durability risk is duplication (20 widths, 5 palettes, 4 schemas, a seam × 6), not lack of a toolchain. A frozen namespace + a validator retire all four; a bundler retires none and resurrects a tool the team already let rot. The engine is one self-contained IIFE; if year-3 brings a real build for other reasons, it lifts out to `cq-market.js` with a one-line change. The namespace is the low-regret path that does not foreclose the build step; the build step forecloses the manual `cp` the team actually runs.

### 10.1 The published surface (naming resolved)

The adversarial reviews found **two names** in circulation — `window.CQ` (rich module tree) and `window.CQChart` (a smaller palette+width bridge). **Resolved: there is one global, `window.CQ`,** carrying the full surface below. Every `window.CQChart` reference is retired. (Note the adjacent `window.CQ_CHECKOUT_URL` at 10690 — `window.CQ` as an object does not collide, but the namespace neighborhood is called out so no one reuses the prefix ambiguously.)

### 10.2 Ideal module tree → buildable sub-objects

| Ideal module | Lives as | Backed by |
|---|---|---|
| `ChartConstants` | `CQ.SPINE` (the A.6 object — see 10.3 on single-sourcing) | Appendix A.6 |
| `ChartTypes` | `CQ.types` `{A,B,C}` + per-type bands | A.6 `bwBands`, `widthRatio` |
| `ChartTheme`/`ChartColors`/`CandleColors` | `CQ.color`, `CQ.theme` | A.6 `color`; `COLOR` derived from SPINE (10.4) |
| `CandleScale` | `CQ.scale(...)` + `CQ.scaleGameplay(...)` | A.6 `monotonicHeightMap`, `pxPerPct 1600` |
| `CandleSpacing`/`CandleMetrics` | `CQ.layout`, `CQ.width`, `CQ.gap`, `CQ.metrics` | A.1/A.6 margins, spacing, floors |
| `CandleGeometry` | `CQ.geometry(...)` (the single geometry authority) | body-top/bottom/wick endpoints |
| `WickRenderer` | `CQ.wick` | A.2/A.6 `wick` |
| `BodyRenderer` | `CQ.width` (+ backends) | A.1 |
| `MarketRenderer` | `CQ.renderChart(spec)` orchestrator | — |
| `ChartValidator` | `CQ.validate(...)` | V-01…V-52 |
| `ChartUtilities` | `CQ.util` (clamp, roundPx, seededJitter, contrast) | — |

`PatternRenderer`/`PatternUtilities` are **not shipped, not even as stubs** — structure overlays (BOS/CHoCH/zones) are generation-authored annotations; folding them in now would drag generation into the engine (forbidden, §10.9). A frozen object gains sub-objects later without foreclosing anything.

### 10.3 Single-source the spine (no verbatim second copy)

The whole point is to kill duplicated constants, so `CQ.SPINE` must **not** be a hand-transcribed copy of the A.6 JSON. The pre-deploy validator (§15) **parses the fenced A.6 JSON block out of `CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md` and asserts byte-equality with (or injects it into) `CQ.SPINE`.** No hand-synced second copy of `widthRatio`/`bwBands`/floors is permitted to ship — otherwise the disease is re-created one level up.

### 10.4 Construction order (a real bug avoided)

`CQ` is frozen at construction, at the top of Block 1 — **before** `COLOR` (2412) exists. Therefore `CQ.theme.COLOR` **cannot** be a reference to the not-yet-declared `COLOR` const. Invert the dependency: the palette literals live **inside `CQ.SPINE.color`** (frozen, self-contained), and the standalone `COLOR` at 2412 becomes a **derived alias** (`const COLOR = CQ.SPINE.color`) declared after `CQ`. Then `CQ` is genuinely the sole authority and there is no forward reference. (Note: `Object.freeze` appears zero times in the codebase today; the freeze discipline is new and is itself something the validator should assert.)

### 10.5 The canonical candle interface + adapters

The engine core speaks **one** language — abstract OHLC in a price domain, plus a small flag bag:

```
CanonCandle = {
  space,             // 'price' | 'worldpx'  — REQUIRED unit tag (10.6)
  o, h, l, c,        // absolute values in `space`
  flags?: { doji?, bos?, choch?, sweep?, spin?, ob?, pattern?, flowRole? }
}
```

`isDoji`, color, and body pixels are **derived, never stored** (retiring the hybrid `buildQuizCandles` schema). Each source model gets a **pure, named adapter** — the trap resolved at the boundary:

```
CQ.adapt.fromOHLCAbs(c)     // MODEL B {o,c,hi,lo} -> {space:'price', o, h:hi, l:lo, c}
CQ.adapt.fromWickLength(c)  // MODEL C {o,c,up,lo} -> {space:'price', o, h:max(o,c)+up, l:min(o,c)-lo, c}
CQ.adapt.fromCloses(cl,i)   // MODEL D closes[]    -> {space:'price', o:cl[i-1], h:max(o,c), l:min(o,c), c:cl[i]}
CQ.adapt.fromValueSpace(c)  // hybrid {open,h}     -> {space:'price', o:open, h:max(open,h), l:min(open,h), c:h}
CQ.adapt.fromAuthored(c)    // block-2 {o,h,l,c}   -> identity + space:'price'
CQ.adapt.fromGameplay(c)    // MODEL A pixel-baked -> {space:'worldpx', o:c.open, h:max+wick, l:min-wick2, c:c.h} (10.6/10.7)
```

`fromWickLength` is the **only** place `up`/`lo` are read as lengths; nothing downstream can misread them as levels. `fromGameplay` is **fully specified**, not hand-waved: `h = max(o,c)+wick`, `l = min(o,c)−wick2`, all in world-px, and it carries the gameplay hazard/decoration channel (sweep/spin wick colors, mega-pole extension) as an explicit style override, **not** stuffed into an ad-hoc flag bag.

### 10.6 The unit contract (the B/C trap, avoided one level up)

The reviews caught that a single `CanonCandle.h` would silently mean *price* for boss/quiz/minigame and *world-px* for gameplay — re-creating the exact look-alike trap. **Resolution: `space` is a required field**, and `CQ.geometry` **asserts** the candle's `space` matches the `Scale` it is given (`scaleGameplay` requires `worldpx`; `scale()` requires `price`). The cleaner discipline, which this audit recommends, is that **gameplay does not round-trip through `CanonCandle` at all** — it already owns its scale, so it consumes `CQ.width`/`CQ.color`/`CQ.wick`/`CQ.gap` directly (see 10.7). The unit tag is the belt; keeping gameplay off the OHLC interface is the suspenders.

### 10.7 The load-bearing seam: gameplay keeps its own scale AND its own width

MODEL A is not a normal adapter case. `candleTop`, `c.x`, and `c.w` are **already physics**. Ripping either the vertical scale or the horizontal width out of gameplay moves terrain under Finn — the softlock class the Constitution forbids. Resolution — **the engine is layered, and gameplay opts into only the pure sub-modules:**

- **Scale:** gameplay uses `CQ.scaleGameplay(groundY)` — an **identity passthrough** so `CQ.geometry` can still be the single geometry authority without recomputing price→Y:
  ```
  CQ.scaleGameplay(groundY) -> Scale {
    priceToY(v) = groundY - v,             // v is already world-px
    top(c)      = groundY - max(c.o, c.c)  // === candleTop(c), byte-identical semantics
    bottom(c)   = max(groundY - min(c.o,c.c), top(c) + BODY_MIN)  // === drawCandle bot
  }
  ```
  **Performance-critical caveat (from the Apple/Nintendo reviews):** `scaleGameplay(groundY)` is **memoized per-frame** (a cached singleton rebuilt only on resize), never constructed per call. `candleTop` is called in **five** `update()` passes per frame per candle; it must remain pure arithmetic (`groundY - Math.max(c.open, c.h)`) with **zero object construction**. The delegate inlines to that math; it does not route physics through a constructed `Scale`.
- **Width:** gameplay width is an **identity passthrough of the generator's stored `c.w`** — *not* re-derived and *not* re-jittered. `CQ.geometry` receives `bodyW = c.w` as a given for Type B gameplay; **`CQ.width()` is bypassed on this surface.** Jitter is a **generation** concern that produced `c.w` once (and baked it into `c.x` spacing at `gap0`); draw consumes `c.w` verbatim. The `+1` continuity bleed (`bw=c.w+1`, `bx=sx-0.5`) is an **invariant applied after any clamp, never subject to `BW_MAX`** — it is what makes the road seamless.

So: **one geometry/width/color/wick core, two scale strategies, and width unified on A/C surfaces only.** On gameplay, width and scale are *preserved*, not unified — and that is correct. `candleTop` keeps its public name and becomes a one-line delegate at the very end of migration, collapsing the six copy-pasted body-bottom clamps to one **render-only** call site.

### 10.8 Render-target-agnostic API — with a zero-allocation gameplay path

Both Canvas and SVG-string surfaces exist and must not fork geometry. But the naive "emit a `CandleDraw` object per candle" design **directly violates** the no-per-frame-allocation perf law (§16) on the one surface that must hold 30 fps on a $120 Android. Resolution — **split the API by surface:**

```
// Cold surfaces (SVG string, gallery, validator) — allocation is cheap, introspection is useful:
CQ.geometry(canon, i, layout, scale, type, opts) -> CandleDraw   // {body,edge,sheen,wick,separator}
CQ.backends.svg().emit(draw) -> string

// Hot surface (gameplay canvas) — ZERO allocation, primitives only:
CQ.paintCandle(ctx, canon, i, layout, scale, type, opts) -> void  // computes into reused scratch scalars; fillRect/stroke inline
```

`CQ.paintCandle` never materializes a `CandleDraw`; it computes body/wick into module-level scratch scalars (or one reused, mutated scratch struct per frame) and issues `ctx` calls directly, exactly like today's `drawCandle`. `CQ.backends.canvas(ctx)` is a **singleton bound once**, not a per-candle factory. `scale` and `layout` are hoisted out of the per-candle loop and computed **once per frame** in `render()`. The `CandleDraw` object model is reserved for SVG/gallery/validator, which run far less often and benefit from a serializable draw description (V-badges, introspection).

### 10.9 Canonical API surface (pseudocode signatures)

All numbers cite A.6. `viewport = { cssWidth, cssHeight, isPhone, dpr:min(devicePixelRatio,2) }`.

```
CQ.SPINE                                  // frozen A.6, single-sourced (10.3)
CQ.types.of(surface) -> 'A'|'B'|'C'
CQ.bands(type, isPhone) -> [BW_MIN,BW_MAX]        // A.6 bwBands

CQ.layout(viewport, targetVisibleCount, type) -> { usableWidth, leftMargin, rightMargin, slot, xOf(i) }
CQ.width(slot, type) -> round(clamp(slot*WIDTH_RATIO[type], BW_MIN, BW_MAX))   // A/C ONLY; B gameplay bypasses (10.7)
CQ.gap(slot, bodyW, type) -> number               // B:0 ; A: max(slot-bodyW-1, 0.20*slot) ; C: 0.28*slot

CQ.scale(candles, box, opts) -> Scale             // ONE auto-range pass; monotonic (V-43)
CQ.scaleGameplay(groundY) -> Scale                // identity passthrough == candleTop; MEMOIZED per-frame (10.7)

CQ.color(canon, type) -> { body, edge, sheen }    // derived c>=o; doji band -> #b8c0cc, edge always drawn
CQ.theme.COLOR                                    // === CQ.SPINE.color (10.4)

CQ.wick.width(bodyW) -> clamp(bodyW*0.05, 1.6, 3.0)
CQ.wick.minDrawnLen(type) -> (A/C) 6 : (B) 28

CQ.geometry(canon,i,layout,scale,type,opts) -> CandleDraw    // cold surfaces
CQ.paintCandle(ctx,canon,i,layout,scale,type,opts) -> void   // hot gameplay, zero-alloc

CQ.validate(canons, layout, scale, type, env) -> { pass, failures:[{id,msg}] }   // V-01..V-52

CQ.renderChart({ source, adapt, target, type, viewport, count, groundY?, ctx?, domain? })
   // canon = source.map(adapt); layout = CQ.layout(...);
   // scale = groundY!=null ? CQ.scaleGameplay(groundY) : CQ.scale(canon, box, {domain});
   // per candle: target==='canvas' ? CQ.paintCandle(...) : backend.emit(CQ.geometry(...))
```

### 10.10 Before / after — how a renderer calls the engine (pseudocode only)

**Gameplay `drawCandle` (12839) — Canvas, Type B, passthrough scale AND passthrough width, zero-alloc.**

*Before:* hand-rolls `top = candleTop(c)`, `bot = max(groundY-min(open,h), top+CFG.minBody)`, `bw = c.w+1`, `bx = sx-0.5`, picks `COLOR.greenBody/redBody` inline, strokes its own wick with inline `#ff7a45`/`#7fd6ff`.

*After:*
```
function drawCandle(c, cameraX) {
  ...fog/cull unchanged...                      // culling stays in the renderer
  const scale = frameScaleGameplay;             // memoized once per frame in render()
  CQ.paintCandle(ctx,
    CQ.adapt.fromGameplay(c),                    // {space:'worldpx', o,h,l,c}
    c.i,
    { slot:c.w, bodyW:c.w, xOf: (cameraX) },     // WIDTH IS c.w — CQ.width bypassed; +1 bleed applied post-clamp
    scale, 'B',
    { bleed:true, hazard:{ sweep:c.sweep, spin:c.wick>=CFG.spinMinWick } });
}
// candleTop stays public, stays pure arithmetic:
function candleTop(c){ return groundY - Math.max(c.open, c.h); }
```
No `CanonCandle`/`CandleDraw`/`Scale` is allocated per candle; hazard/signal colors are passed as an explicit override (they are game state, not palette — keeping §10.9's purity boundary honest).

**Boss `bossCandleSVG` (9273) — SVG string, Type C, fixed 0..100 domain, one shared layout.**

*Before:* own `Y(v)`, `bw=min(46,slot*0.5)`, inline hexes, `rx:1.5`; hit-test `candleExtremeXY` re-declares the constants verbatim.

*After:*
```
function bossLayout(cands){                       // ONE geometry, cached per round
  const L = CQ.layout({cssWidth:300,cssHeight:150}, cands.length, 'C');
  const s = CQ.scale(cands.map(CQ.adapt.fromWickLength), {h:150}, {domain:[0,100]});
  return cands.map((c,i)=> CQ.geometry(CQ.adapt.fromWickLength(c), i, L, s, 'C'));
}
function bossCandleSVG(cands){
  return bossLayout(cands).map(d => CQ.backends.svg().emit(d)).join('');
}
function candleExtremeXY(cands, i, side){          // READS the same layout, does not recompute
  const d = bossLayout(cands)[i];
  return side==='low' ? {x:d.wick.x, y:d.wick.y2} : {x:d.wick.x, y:d.wick.y1};
}
```
`rx:1.5 → 0` (`cornerRadiusPx`) — but because boss is a **protected, signature surface**, that corner-radius flattening is broken out as a **founder-sign-off visual change with a before/after render**, not bundled into the plumbing commit. Draw and hit-test now read one cached geometry, closing the trend-dot desync.

**Educational `drawQuizCandle` (16319) / `drawPredictionBet` (16521) — Canvas, Type C.**

*After:* `CQ.geometry(CQ.adapt.fromAuthored(c), …, 'C')`; the `bodyW=44` and passed `cw` both vanish — `44` now **emerges** (~44–56) from `CQ.width` for a 6–8-candle Type-C scene, exactly as the Constitution's "resolving the 15-vs-44 inconsistency" demands. This is an **intended** change, asserted against V-13, not diffed-to-zero.

### 10.11 Palette expansion (a prerequisite the naive plan missed)

`COLOR` today holds only body/edge/stripe/wick greens and reds (+ Finn). The de-inline migration also retires hazard `#ff7a45`/`#7fd6ff`, setup purple `#a855f7`, blue `#4cc3ff`, gold `#ffd60a`, orange `#ff9f43`, and VWAP/overlay rgba — **none of which are `COLOR` tokens today.** So "single palette authority" requires **growing `CQ.SPINE.color`** with a full named token set (`hazardSweep`, `hazardSpin`, `setup`, `info`, `warnGold`, `accentOrange`, `vwap`) at their exact current values. The "pixel-identical color" claim is scoped to **body fills only**; every other de-inline is a named-token migration, not a hex swap.

---

## 11. Migration Order

Phase 2+, not now. Phase 1 changes zero code. Lowest-risk first; each step is one migration commit, independently shippable, verified, and re-mirrored. **Re-sync `index.html` + `website/game.html` after every step** — the `sha256` mirror gate fails the commit otherwise; never hand-edit the mirror.

**STEP 0 — Scaffolding (no renderer migrates).** Three sub-deliverables, all dev-only:

- **0a. The engine namespace + the `window.CQ` bridge.** Author Block 0; publish on `window`; single-source `CQ.SPINE` from A.6 (10.3); make `COLOR` a derived alias (10.4). Verify `typeof window.CQ.width === 'function'` from a booted `?qa=1` iframe. **Block-2 migration is blocked until `window.CQ` is verified present at runtime**, because a mis-published engine PARSES cleanly and only fails at runtime inside the sealed IIFE.
- **0b. The verification substrate (the actual first blocker).** There is no `package.json`, no `puppeteer`; `verify.js` 3b always SKIPs. **Commit a `package.json` pinning a headless runtime (puppeteer or headless-canvas), install it in CI, and convert 3b from optional-SKIP to a hard gate.** Extend it into a golden-image differ: Canvas surfaces → `getImageData` diff at fixed DPR; SVG surfaces → normalized string diff; both driven from the `?qa=1` bridge against a real boot. Add a `snapshot`/`perf` verb inside the `?qa=1` guard (~15 lines) so the bridge can read back `toDataURL` and dump the geometry ledger. **Without this, not one parity gate in this plan can execute** — it is the honest precondition for everything below.
- **0c. The static half of the validator, wired into `cq.sh`.** Pure-Node greps that need no runtime: **default-deny** inline-hex and forked-width detection across the candle-draw script blocks (fail on any hex literal or forbidden width expression except inside `CQ` and an explicitly-annotated hazard set — an allowlist of symbols would rot exactly like the stale `:line` refs in this very audit); a `candleTop`/`c.w` symbol-citation check; and a normalized-diff check of the `dashboard.html:896` clone against `chart-quest.html:19041`. Fail-closed from commit one, so Waves 1–5 cannot re-introduce drift while the rendered validators wait on 0b.

**STEP 1 — Palette de-inline (lowest risk).** Repoint the classified body literals to `CQ.color`/`COLOR`. **Not a blind grep:** first classify each of the 236+159 sites as (a) canonical body → `CQ.color`, (b) hazard/state → named `CQ.SPINE.color` token (10.11), (c) intentional fork to delete (`#1fe08a`/`#ff4d5e`), (d) out-of-scope (dashboard). Only then repoint. Frozen surfaces: pixel-identical for body fills.

**STEP 2 — SVG boss & review charts (medium; boss is PROTECTED).** `setupChartSVG*`, `tradeChartSVGFull`, `ddGuessChartSVG`, and the boss trio. Deterministic string output → parity by normalized markup diff. Boss uses MODEL C (`{o,c,up,lo}` wick-lengths on fixed 0..100) — the adapter must not confuse it with MODEL B. Draw and hit-test read one cached `bossLayout`; then a manual tap-mapping check via `?qa=1`. Corner-radius flattening is its own sign-off commit.

**STEP 3 — Educational/quiz/academy/intermission (medium).** `imDraw*`, `drawCandleAcademy`, `drawQuizChart`, `drawQuizCandle`/`drawFlashQuiz`, `drawPredictionBet` (kill `bodyW=44`). Type A/C, no terrain coupling. Width unification here is an **intended change** asserted against V-12/V-13, re-baselined after sign-off. Quiz answer / prediction outcome logic is untouched.

**STEP 4 — Block-2 mini-game / LessonChart (medium-high; needs the bridge).** `ChartView`/`candlesN`, `mgCandles`, `boxCandles`, `LessonChart` + `C` palette, `thumb`, `runBuild` (kill fixed-16). **Prerequisite: Step 0a `window.CQ` verified.** Adapter normalizes both `{o,c,hi,lo}` and `{o,h,l,c}`; reconcile the `#1fe08a`/`#ff4d5e` fork and the `C` palette into `CQ`. `dashboard.html:896` is **out of scope** (separate app) — flag, don't touch. Lesson order and "never test the untaught" are frozen; only rendering changes. Verify the intro LEARN→PRACTICE→APPLY→TEST flow with `?fresh=1` (BEGINNER MODE) end-to-end.

**STEP 5 — Gameplay `drawCandle` + terrain (highest risk; LAST, parity-gated).** `drawCandle` and its world-layer consumers (`drawFlowRead`, `drawQuickRead`, `drawSetupSpotlight`, `drawVWAP`, `drawTrendLines`, `drawHTFZoom`/`drawHTFPanel`). **The frozen seam `{candleTop, c.x, c.w, gap}` does not migrate** — only the *drawing* of body/wick changes; the price→pixel geometry and the horizontal width/spacing that terrain reads are byte-identical. `candleTop` and `c.w` get their own numeric-equality gate (§15). `candleBodyBottom` is extracted but must return bit-identical values and is consumed for **drawing only**. Gate behind the movement/terrain regression checklist (`docs/canon/`). Do **not** flip the flag to `new` until the pixel diff (seeded, not jitter-disabled) is clean and the geometry ledger is bit-identical.

**Cleanup (separate commits):** delete `chart-quest.min.html` and the dead `build.js`; delete `drawVolumeBars` and `cartoonCandle`. And — because the deploy already runs Node for the validator — **fold mirror-generation into that same script** so `index.html`/`website/game.html` become *derived*, checksum-asserted artifacts rather than hand-`cp`'d byte-mirrors (this designs out the mirror-drift class of bug and the "never hand-edit index.html" foot-gun; see §17).

---

## 12. Regression Risks

Per surface, with trigger and guard.

| Surface | Risk | Trigger | Guard |
|---|---|---|---|
| **Terrain / vertical hitbox** | Finn falls through / floats | change to `candleTop` (2523), `CFG` geometry, or `candleBodyBottom` clamp drift | Freeze `candleTop` byte-for-byte; helper returns identical values; per-candle numeric ledger assert (§15) |
| **Terrain / horizontal hitbox** | wall-collision, coin, liquidity, right-snap land wrong; road gaps/overlaps | routing gameplay width through band-clamped/re-jittered `CQ.width`; clipping the `+1` bleed at `BW_MAX` | **`c.w` frozen**; gameplay width = identity passthrough of stored `c.w`; `+1` applied post-clamp; per-candle `c.w`/gap equality gate |
| **Camera** | "scrolls then jerks back" (pole-spin / frame-pacing family, builds 233–247) | touching `enforceChartContinuity` (18211) or `render` camera math while migrating world-layer draw | Do not touch camera/continuity in the draw migration; the double-scale dedup is its own flagged step behind the camera regression checklist (§16) |
| **Boss gating / taps** | trend-dot taps land on wrong candle; a round breaks | `candleExtremeXY` desyncs from `bossCandleSVG`; `.replace` surgery on `bossCandleSVGTrend` | One cached `bossLayout` read by both draw + hit-test; manual tap-map check; boss protected |
| **Block-2 scope trap** | engine `undefined` inside IIFE; mini-game/LessonChart blank | authoring engine as a bare Block-1 `const`, or a bridge typo — **parses clean, fails only at runtime** | Step 0a runtime assertion gate; Block-2 blocked until `window.CQ` verified present |
| **Mirror drift** | deployed game diverges from source; `sha256` gate FAIL | forgetting to re-sync, or hand-editing `index.html` | `scripts/cq.sh mirror` after every step; gate #8; never edit the mirror; ultimately derive it (§17) |
| **Stale `.min.html`** | migrating or diffing against the Jul-3 artifact | treating the 5.9 MB stale file as a target | Explicitly excluded; delete in cleanup |
| **`dashboard.html` clone** | cross-app blast radius if "unify all renderers" is over-read | editing `dashboard.html:896` to match | Out of scope; **dirty in working tree — re-verify the clone, don't assume**; static-diff check in 0c |
| **Non-determinism** | false pixel-diff failures | `Math.random` in width jitter / anti-staircase / wick decoration / mega spawns | **Seed** the PRNG (mulberry32 exists at 18625) for the diff run — do **not** disable RNG, which would render a terrain layout that never ships |

---

## 13. Rollback Strategy

Three independent layers, strongest first, applied **per step**.

1. **Per-surface feature flag (primary).** Each migrated surface reads `window.CQ_ENGINE.<surface>` (or a `?engine=legacy` global override) and dispatches to `new` vs the retained legacy fn. Each surface ships defaulting to `legacy`; flip to `new` only after its parity diff is clean. Flipping one flag reverts one surface **live** — no redeploy, no code change.
2. **Keep legacy until parity + bake.** The old fn stays beside the new one for the entire step; it is deleted **only** after (a) pixel/markup parity within budget (frozen surfaces: 0-diff; intended-change surfaces: signed-off logged diff) and (b) a bake period on the deployed mirror with the flag on `new`. Deletion is its **own** commit, never bundled with the migration.
3. **`git revert` per step.** Each step is exactly one migration commit (+ one later deletion commit); surfaces migrate independently, so a revert is surgical (reverting Step 4 leaves Steps 1–3 intact). Re-run `scripts/cq.sh mirror` after any revert to re-sync the mirrors.

---

## 14. Backwards-Compatibility Contract

Phase 1 is rendering architecture only. Behavior does not change. What must **not** change:

| # | Frozen | Where | Invariant |
|---|---|---|---|
| 1 | **Trade logic** | `resolveTrade` (12554), `commitTrade` (11739); `trading_canon.md` | Outcome decision, setup gen, entry/SL/TP, portal role — byte-unchanged |
| 2 | **Education** | `LESSONS`, `conceptTier`, `LESSON_MASTERY` | Lesson order & gates unchanged; never test the untaught |
| 3 | **Boss** | `openBoss`/`bossRound`; `BOSSES` | Roster, order, HP, difficulty, gating unchanged |
| 4 | **Progression** | level count, gating thresholds, `cq_*` keys | Thresholds + save-key semantics intact; new state only via versioned keys |
| 5 | **Movement + terrain geometry** | `CFG` (2312) + `update()`; **`candleTop` (2523), `c.x`, `c.w`, `gap`** | Physics model unchanged; the full terrain seam byte-identical — gameplay renders **within the §15 tolerance model**, and the geometry ledger is **exact** |
| 6 | **UI flow & portal colors** | `ui_canon.md` | auth→cinematic→academy→play order + purple/blue/gold portal identity fixed |
| 7 | **Mirror integrity** | `chart-quest.html` → `index.html` → `website/game.html` | Source-of-truth relationship; never hand-edit the mirror |

**What Phase 1's plan *does* change (allowed, Phase 2+):** how candle bodies/wicks are *drawn* — width unified on A/C surfaces (one A.6 `width()`), palette (single `CQ` authority, de-inlined by classification, fork deleted), price→Y projection (single `priceToY`, computed once per frame), and the min-body floor (one `BODY_MIN` token). Each must be pixel/markup-identical on frozen surfaces **or** an explicitly sanctioned, logged constitution-alignment change on intended-change surfaces.

**"Pixel-identical" is retired as a bare phrase.** It is replaced everywhere by the single tolerance model of §15: exact numeric for the geometry ledger; ≤0.1% changed-pixels AA budget for canvas; exact normalized string-diff for SVG. And every one of the six surface families is classified **up front** as **FROZEN** (bit-identical required: gameplay, boss geometry, terrain) or **INTENDED-CHANGE** (re-baseline after sign-off: forked-palette tiles, educational fixed-widths, boss corner radius) — never one global percentage budget spanning both.

**Scope stop.** Approval to migrate rendering does **not** authorize touching any protected system's behavior. If a step appears to require it: stop, name the protected system, get explicit founder yes (`protected_systems.md`). Protected-diff steps require `CQ_ALLOW_PROTECTED=1` and a human regression-checklist pass.

---

## 15. Visual-Regression & Testing Strategy

The strategy is **capture → freeze → diff**, built from the surfaces that already exist — because there is no framework and one must not be smuggled in without owning it.

**The precondition, stated plainly.** Every "prove pixel parity / run V-01…V-52 / assert bit-identical `candleTop`" gate requires rendering candles in a real DOM/canvas — i.e. the headless runtime that **does not exist today** (no `package.json`, no `puppeteer`, 3b SKIPs). Standing that up (Step 0b) is therefore the **first** deliverable, before Wave 1. If the team will not own a `node_modules` tree, the honest fallback is human-in-the-loop A/B in the gallery as the *only* gate — and that must be stated as such, not dressed up as automation.

**Capture surfaces, by reach:**

- **`lesson-chart-preview.html`** — the existing dev harness (`SCENES`, own `C.*` palette at 441). Golden surface for the Type-A/C LessonChart engine; drive the scene picker, freeze rAF after the print-on animation, screenshot → `golden/preview/<scene>.png`. Covers only the lesson renderer.
- **`chart-gallery.html`** (dev-only, built Phase 2) — the highest-leverage artifact. A grid: **rows = 6 surface families** (gameplay B, educational A, replay, boss C, notebook, minigame) × **columns = 7 candle cases** (bull, bear, large, tiny, doji, long-wick, short-wick). Each cell renders the same seeded fixture **twice — legacy left, canonical right** — with live V-01…V-52 pass/fail badges. It pins the fixtures against the generator's `Math.random`, renders old/new in one DOM at one DPR, and makes the 4-model adapter visible (a bad `{o,c,up,lo}` normalization diffs only the boss row).
- **`?qa=1` bridge** (Block 3, 19680) — navigates the *real* renderers into known states (`level(n)`, `boss(level,diff)`, `mini(id)`, `lesson(key)`) without the intro hour. Add the `snapshot`/`perf` verb (Step 0b). Inert unless `?qa=1`.
- **Screenshot diffing** — driven by the Claude browser tools (navigate → freeze rAF → canvas read-back → compare) for Phase-1/2 manual gating without a Playwright toolchain.

**Diff protocol per migrated renderer.** Baseline on `chart-quest.html` at HEAD → `golden/<surface>/<case>@<viewport>.png` **plus** the JSON geometry ledger `{bodyW, bodyTop, candleTop, bodyBottom, wickW, wickLen, color}` per candle. Candidate: same fixtures, seed, viewport, DPR. Compare on two axes: **pixel diff** (≤0.1% changed-pixels AA budget for canvas, since `bx=sx-0.5` guarantees sub-pixel bleed; exact normalized string-diff for SVG) and **geometry-ledger diff** (exact: `candleTop`, `c.w`, `c.x` bit-identical on frozen surfaces; intended changes asserted against the specific V-rule, not diffed-to-zero).

**Determinism: seed, never disable.** The diff run replaces `Math.random` with a seeded mulberry32 so the **same jittered terrain** is produced pre and post. Disabling jitter would render a layout that never occurs in the shipped game — false confidence exactly where parity matters most.

**The two gates a pixel diff cannot see (numeric, not visual):**
1. **The terrain seam.** `candleTop(c)`, `c.x`, and `c.w` feed terrain/portals/collectibles/`candleAtScreen`. A sub-pixel shift is invisible to an image diff but drops Finn through the floor. Gate: **exact numeric equality** of all three for every candle across a scripted L1–L3 traversal + one `MARKET_DATA` replay, via the `snapshot` verb — separate from the pixel budget.
2. **Boss tap-hit-test.** Assert tap-map coordinates equal draw coordinates (both from one cached `bossLayout`) — numeric, not screenshot.

**The test matrix.** 7 cases × 6 surfaces × 6 environments (desktop 1280×800, tablet 768×1024, mobile 360×800, landscape, portrait, **reduced-motion**) = **294 cells**, exercised as nested in-page loops, not a runner. Include one DPR-1 and one DPR-2 mobile run (floors are CSS-px pre-DPR, V-50). **Reduced-motion is a first-class row**, rendered twice (continuous + discrete-step) and asserted to carry full directional meaning via static cues (V-52 greyscale-separability with motion removed). Cost control: full 294 only on baseline and final candidate; iterate on the 84-cell smoke set (desktop+mobile) plus the full reduced-motion row, with the gallery's live V-badges announcing failures.

**Acceptance gates → V-01…V-52** (the Constitution invents the thresholds; this strategy only exercises them). Static/per-candle: width **V-12/V-13** (and assert the retired constants `44`/`32`/`16`/`candleW`-clamp/`min(46,slot*0.5)` appear nowhere in draw symbols — the F-C8 "forked width" root bug); color **V-19/V-20/V-21/V-36**; shape/wick **V-14…V-18**; floors **V-01…V-05**; accessibility **V-22/V-50/V-52**; monotonicity **V-43**. Per-chart rhythm (Type B, all zoom windows 8/12/16): **V-06…V-11, V-23, V-25, V-30…V-35, V-39…V-41, V-51**. Runtime (via `?qa=1` perf): **V-26…V-29, V-37, V-42**. Pedagogy/mirror: **V-46…V-48** re-run via `catalog`/`level`/`boss`; **V-49** (child playtest) is the downstream ship gate, out of Phase-1 scope. Also test the **runtime conformance layer** negatively: feed a malformed window, assert retry(8)→fallback→`chart_conformance_fail` telemetry fires — and confirm that counter actually reaches the backend (grep `ALLOWED_ORIGINS` after any migration; this repo has a history of a silent 403 masking telemetry).

**The one-line gate.** A migration ships only when, for all matrix cells: the pixel diff is within budget *or* an asserted constitution correction; the terrain seam (`candleTop`/`c.x`/`c.w`) is numerically bit-identical; every applicable V-rule passes; and the perf set shows no frame-time regression and holds ≥30 fps on the named low-end device with degrade-not-slow-mo. Anything less is "different and untested" — a ship-blocker for a teaching instrument aimed at a ten-year-old.

---

## 16. Performance

The migration's risk is adding an abstraction layer to a per-frame hot path. The guardrails below are load-bearing, not aspirational, and two of them exist to resolve a contradiction the reviews caught between the architecture and the perf strategy.

**The allocation contract (the resolved contradiction).** Today `drawCandle` allocates **nothing**. The naive engine would allocate a `CanonCandle` (via `map`), a `Scale` with closures, a `layout` literal with a fresh `xOf` closure, an `opts` object, and a nested `CandleDraw` (~5 sub-objects) **per candle per frame** — ~7–10k short-lived objects/sec at 12–16 candles × 60 fps, the GC sawtooth that drops frames on the $120 Android the ≥30 fps gate protects. **Resolution (from §10.8):** the gameplay canvas path is `CQ.paintCandle`, which computes into reused scratch scalars and issues `ctx` calls directly — **zero per-frame allocation**; `scale`/`layout` are hoisted and computed once per frame; the backend is a bound singleton; `candleTop` stays pure arithmetic and `scaleGameplay` is a memoized per-frame singleton (never constructed inside the five `update()` physics passes). The `CandleDraw` object model is reserved for cold SVG/gallery/validator surfaces. **The perf gate asserts allocations/frame in the gameplay draw path equals baseline (zero)** — and measures **bytes-allocated-per-frame**, not just GC-pause count, because a rising allocation rate can hide behind a flat pause count until it suddenly doesn't on a memory-constrained phone.

**Named per-frame hazards to benchmark before/after (from the inventory):**

| Hazard | Location | Guardrail |
|---|---|---|
| Full `tradeReplaySVG` regeneration + `innerHTML` every 240 ms | replay (8183/8200) | Reuse/patch DOM nodes, don't rebuild strings. **Caveat:** the recommended SVG backend is `emit -> string`; that alone does **not** deliver node-diffing. Either the SVG backend retains/mutates DOM nodes, or replay-node-diffing is scoped as a **separate** optimization — do not claim the engine fixes the 240 ms path for free. |
| Price→Y scale computed twice per frame | `render()` 14458 + 14739 (+ 3rd `ppp` 13896) | Unify the **step/domain** computation into one `CQ.scale` call per frame; keep the two transform applications (world gridlines vs screen labels — different spaces, opposite directions, Trade-Mode extends labels below ground) as separate consumers. This is a **camera-adjacent** edit (the 233–247 regression family) — its **own flagged step behind the camera regression checklist**, not a free byproduct. |
| `renderReviewChart` re-renders on every overlay toggle | 8174 | Cache the base chart; redraw only the overlay layer. |
| Width jitter / wick decoration allocations | gen | Precompute seeded jitter at generation, store on the candle (already required for replay determinism) — doubles as an allocation win. |
| `bossCandleSVGTrend` `.replace('</svg>','')` surgery | 9303 | Compose from the cached `bossLayout` geometry, not string splicing. |
| Boss hit-test recompute per tap | 9290 | Cache `bossLayout` per round; hit-test **reads it back** (O(1)), not a fresh O(n) layout+scale derivation per tap. |

**The highest-ROI perf fix, named and un-frozen.** The **main gameplay canvas** `resize()` at **chart-quest.html:2459** sizes its backing store at **uncapped** `window.devicePixelRatio` (`canvas.width = W*dpr`). Every *other* gameplay/chart canvas in the file already caps at `min(devicePixelRatio, 2)` — 2459 is the only uncapped **main-gameplay** canvas backing-store sizing. (Three other raw `window.devicePixelRatio` reads exist and were checked: `1895` and `20178` are telemetry/viewport fields, not canvas backing stores; `6177` sizes the *intermission* chart canvas and is a smaller, secondary instance of the same defect — fold it into this fix.) On a 3×-DPR phone the main-canvas case is 9× fill-rate vs 4× at a cap of 2 — a ~2.25× reduction in per-frame pixel work on exactly the ≥30 fps-gated low-end devices. Capping 3→2 is **not pixel-identical** (it changes the backing store), so it must be **carved out of the "frozen" set as a sanctioned change gated by perf-parity (frame-time/fps), not pixel-parity**, and scheduled as an early, engine-independent perf step. This is the single biggest cheap win and the plan must not freeze it out by accident.

**How to measure (no framework).** `performance.now()` deltas around the rAF loop into a ring buffer; export p50/p95/p99 frame time and dropped-frame count (>33.3 ms), exposed via a `?qa=1` `perf` verb. The binding gate is **sustained ≥30 fps on a named low-end baseline device** (a measured ~$120 Android, not a throttled laptop) with **deliberate degrade** (fewer visible candles, disable sheen shimmer) rather than silent slow-motion — and because the dt clamp is `[8,40]ms`, a phone below 25 fps blows the clamp every frame and drifts into slow-motion, so the benchmark asserts **wall-clock sync**, not just fps. Run all benchmarks over a **seeded `MARKET_DATA` replay** so any frame-time delta is attributable to the engine, not a luckier random run.

**The benchmark acceptance set (baseline vs candidate, same seed/device):** p95 gameplay-scroll frame time ≤ baseline; sustained fps ≥30 with degrade-not-slow-mo verified; allocations/tick over a 30 s replay ↓; `render()` self-time ↓ (scale once, not twice); overlay-toggle redraw cost ↓; GC pause count ≤ baseline **and** bytes/frame ≤ baseline.

---

## 17. Potential Future Simplifications

The decade view — what the namespace makes reachable once the six waves land.

**Derive the mirrors; retire the manual `cp`.** Since the pre-deploy step already runs Node (the validator), fold **mirror-generation** into that same script: validate, then emit `index.html` + `website/game.html` from `chart-quest.html` and checksum-assert. This designs out the entire mirror-drift class of bug, removes the "never hand-edit `index.html`" foot-gun by making the mirror non-authoritative, and is a trivial tool next to the validator the team is already committing to. Building the 150-line validator while refusing the 20-line mirror generator is an inconsistent stance; do both.

**Promote Block 0 to `cq-market.js` and unify the dashboard.** The single inline engine already rides the `cp` across the three game mirrors, but it **cannot** reach `dashboard.html`, whose `boxCandles` clone (896) carries the very `#1fe08a`/`#ff4d5e` fork this effort deletes elsewhere. For a decade-horizon doc, "document the divergence and leave it forever" under-commits to the stated goal — the fork merely relocates. The namespace already makes the clean lift-out a one-line change (`const CQ = require('./cq-market.js')` / `<script src>`). **Committed end-state: promote to `cq-market.js` loaded by both `chart-quest.html` and `dashboard.html`**, sequenced *after* the game surfaces unify so the dashboard never gates the game's refactor. This is the only place an external file (not a bundler) earns its keep.

**Pattern Library readiness.** Once `CQ.geometry` is the single geometry authority and the adapters normalize every schema, the Constitution's Pattern Library (BOS/CHoCH/zone/liquidity overlays) becomes a **thin annotation layer over one geometry** rather than six bespoke re-implementations — but it stays generation-authored data feeding the engine, never generation logic *inside* it.

**Chart Composer readiness — the real 5–10-year test.** A Chart Composer is inherently *stateful, interactive* rendering: drag handles, live re-layout, hit-testing during edit. Three current surfaces already need this shape — `runBuild` (19648) drags candle handles, `CONCEPT_PRACTICE` couples hit-test + draw, and the boss draw/hit-test dedup (§10.10) proves geometry must emit tappable coordinates. So the durable move is to make **`CQ.geometry` return hit regions as a first-class output** (state stays in the caller; geometry+hit-test is one authority), rather than treating hit-testing as a gameplay-only afterthought. Do this and Composer/boss/concept-practice share one geometry→hitbox authority instead of re-forking it; skip it and the Composer arrives as another Block-2-style stateful IIFE re-implementing width/geometry/hit-test on top of `CQ`. The engine as drawn is a rendering engine; the Composer needs a charting *substrate*, and the geometry-returns-hit-regions contract is the bridge.

**Deletions that simplify by subtraction:** `chart-quest.min.html` (stale), `build.js` (dead), `drawVolumeBars` (dead, divergent), `cartoonCandle` (legacy). Each is a confusion hazard, not a target.

---

## 18. Success Criteria (Phase 1)

Phase 1 is audit-only; "success" is that this document is concrete and checkable, and that Phase 2 can proceed against it without re-litigating scope. Made concrete:

- [x] **Every candle site enumerated** — 98 sites, file:line, surface, kind, representation, formula, color source (§3).
- [x] **The dependency graph is explicit** — generation → model(s) → renderers → surfaces, with the byte-mirror and scope-isolation edges (§4).
- [x] **Duplication is quantified, not asserted** — 20+ width formulas, 15+ price→Y impls, 12 wick renderers, 5 green + 4 red palettes, **236 `#16c784` + 159 `#ea3943` grep-verified**, 9 min-body floors (§5–§7).
- [x] **The four+ schemas and their conflicts are named**, including the MODEL B/C look-alike trap and the two physics-visible conflicts (§8).
- [x] **Debt is severity-ranked**, with `c.w` correctly elevated to a critical load-bearing seam alongside `candleTop` (§9).
- [x] **The recommendation is buildable in this codebase** — `window.CQ`, single-sourced spine, construction-order-safe palette, adapters, zero-alloc gameplay path, API surface, before/after pseudocode (§10).
- [x] **A sequenced, lowest-risk-first migration** with per-step verify + commit + mirror re-sync, gameplay last (§11).
- [x] **Regression risks are per-surface with guards** (§12); **rollback is per-step** with feature flags (§13).
- [x] **The backwards-compat contract is explicit** about what must not change and retires "pixel-identical" for a real tolerance model (§14).
- [x] **The testing strategy uses only real, existing tools** and is honest that the runtime substrate must be built first (§15).
- [x] **Performance guardrails resolve the allocation contradiction** and name the DPR fix at 2459 (§16).
- [x] **Every CRITICAL and MAJOR adversarial finding is integrated** into the recommendation (§10–§16) and logged (§19).

**Phase 2 entry gate (the one thing that must be true before any code moves):** the verification substrate of Step 0b exists and `verify.js` 3b is a hard gate — because without it, not one parity claim in this document can be checked, and "change candles, hope, `cp`" is exactly the silent-failure mode this audit exists to prevent.

---

## 19. Appendix — Adversarial Review Log

Five lenses stress-tested the recommendation. Each row is a finding and how the recommendation now resolves it. Findings are integrated into the body sections cited.

### Nintendo EPD (60 fps traversal, pixel-identical rendering, terrain integrity)

| Severity | Finding | Resolution |
|---|---|---|
| Critical | **`c.w` is an unfrozen load-bearing hitbox**, not a draw parameter (wall-collision 12527–12530, hit-test 4261, coins 3291, liquidity 8447, right-snap 12530). Routing gameplay width through band-clamped/re-jittered `CQ.width` breaks body↔hitbox. | Frozen seam widened to **`{candleTop, c.x, c.w, gap}`**; gameplay width is an **identity passthrough of stored `c.w`**, `CQ.width` bypassed on B; per-candle `c.w` equality gate added (§9.2, §10.7, §12, §15). |
| Critical | **Architecture vs perf docs contradict on per-frame allocation** — a `CandleDraw` per candle vs "no per-frame allocation." | Split API: **`CQ.paintCandle` zero-alloc** on gameplay canvas; `CandleDraw` reserved for cold SVG/gallery; explicit allocations/frame = baseline gate (§10.8, §16). |
| Major | **`candleTop` delegated through a per-call `Scale` factory** re-introduces allocation in the physics loop (5 `update()` passes). | `scaleGameplay` **memoized per-frame singleton**; `candleTop` stays pure arithmetic, zero construction (§10.7, §16). |
| Major | **Width jitter consumed at generation but re-applied at draw** → gaps/overlaps. | Jitter is a **generation concern producing `c.w`**; draw consumes `c.w` verbatim; `CQ.width` jitter branch is A/C-only (§10.7). |
| Major | **The `+1`/`bx-0.5` "candles touch" bleed demoted to an opts flag under a clamp that can defeat it.** | `+1` continuity bleed is an **invariant applied after any clamp, never subject to `BW_MAX`**; visual-continuity assertion in the gameplay gate (§10.7, §15). |
| Major | **"0 differing pixels" contradicts the migration's own intended pixel changes.** | Every surface classified **FROZEN vs INTENDED-CHANGE** up front; no single global budget spanning both (§14). |
| Major | **Disabling `Math.random` for the diff run renders a chart that never ships.** | **Seed** with mulberry32, never disable (§15). |
| Minor | Folding hazard colors into `SPINE.wick.hazard` violates the engine's purity boundary. | Hazard/signal colors stay in the gameplay renderer as an explicit per-candle override; engine owns body/edge/wick only (§10.10). |
| Minor | Boss `rx:1.5→0` is an un-flagged aesthetic change to a protected surface. | Broken out as a **founder-sign-off visual change with before/after render**, separate from plumbing (§10.10, §11). |
| Minor | `render()` double-scale "fixed for free" understates a world-vs-screen transform difference. | Unify **step/domain** only; keep two transform consumers; treat as a camera-adjacent flagged step (§16). |
| Nit | Reserved `PatternRenderer` stubs are speculative. | **Not shipped, not even as stubs** (§10.2). |
| Minor | Render-only body-bottom clamp must never leak into a hit-test. | `candleBodyBottom` documented **render-only**; hit-tests use `min(open,h)` (§8, §12). |

### Valve / ship-safety (no harness, silent failures, mirror drift)

| Severity | Finding | Resolution |
|---|---|---|
| Critical | **The verification backbone rests on an uninstalled, previously-rotted dependency** — no `package.json`, no `puppeteer`, `verify.js` 3b always SKIPs; every parity/validator gate is unrunnable today. | **Step 0b elevated to the first deliverable**: commit `package.json`, install the runtime, make 3b a hard gate; honest fallback stated if the team won't own `node_modules` (§11, §15, §18 entry gate). |
| Critical | **"Verify each step" cannot detect the block-2 scope trap it names** — a mis-published engine parses clean, fails only at runtime. | Runtime assertion gate (`typeof window.CQ.width==='function'` + non-empty Block-2 output) before any Block-2 migration (§11 Step 0a, §12). |
| Major | **Two names/APIs for the lynchpin global** (`window.CQ` vs `window.CQChart`). | Standardized on **`window.CQ`**; `CQChart` retired; `CQ_CHECKOUT_URL` adjacency noted (§10.1). |
| Major | **The Constitution's claimed CI validator is fiction treated as foundation.** | Marked **aspirational**; validator re-scoped into pure-Node static half (buildable now) + rendered half gated on 0b (§9.14, §11 Step 0c). |
| Major | **"Pixel-identical" set as the bar and simultaneously admitted impossible;** blind hex de-inline would sweep hazard/accent hues into the palette. | Single tolerance model replaces the phrase; de-inline **by per-site classification**, not grep (§14, §10.11, §11 Step 1). |
| Major | **The bit-identical `candleTop` gate has no runnable substrate today.** | `snapshot` verb added to `?qa=1`; exact numeric ledger gate, blocking, gated on 0b (§15). |
| Major | **Enforcement lands in Phase 2, so Waves 1–5 re-introduce drift unguarded.** | **Static-grep half moved to Step 0c**, fail-closed from commit one; rendered validators wait on 0b (§11). |
| Minor | `dashboard.html` is dirty; its clone is assumed stable. | Clone relationship **re-verified at migration time** via a static-diff check, not presumed (§9.9, §12, §11 Step 0c). |
| Nit | Reserved stubs + full frozen tree for a zero-code phase are speculative. | Ship the minimal object the first waves consume; defer `freeze`/extra slots (§10.2). |

### Riot (API completeness, adapter soundness, hidden duplicate paths)

| Severity | Finding | Resolution |
|---|---|---|
| Critical | **Per-frame `CandleDraw` violates the no-alloc law.** | Zero-alloc `CQ.paintCandle` on canvas; `CandleDraw` for cold surfaces (§10.8, §16). |
| Critical | **Terrain seam is `c.w` too, and width is changed while claimed frozen** — `candleTop` is Y-only, giving false confidence. | Frozen seam = `{candleTop, c.x, c.w, gap}`; Step-4 gate asserts body left/right edges + gap per candle, not just `candleTop` (§9.2, §14, §15). |
| Critical | **Gameplay width "unification" is illusory or breaks gap-0.** | Stated explicitly: gameplay width is an **identity passthrough**, jitter applied once at generation; real unification target is **A/C surfaces only** (§10.7). |
| Major | **Frozen `CQ.SPINE` transcribed verbatim from A.6 is a second source of truth.** | Validator **parses A.6 JSON and asserts byte-equality** with `CQ.SPINE`; no hand-copy ships (§10.3). |
| Major | **F-C8 static grep uses an allowlist that can't see the 99th renderer.** | Inverted to **default-deny**: fail on any hex/forbidden-width literal in candle-draw blocks except inside `CQ`/annotated hazards (§11 Step 0c). |
| Major | **`targetVisibleCount` 8.5 (code) vs 12 (spine)** makes "pixel-identical gameplay" and "adopt the spine" mutually exclusive. | Flagged as a **deliberate call**: amend the spine to 8.5 (preferred — the game is tuned to it) or accept a playtested retune and withdraw the pixel-identical claim (§9.13, §10). |
| Major | **`CanonCandle` carries price-units and world-pixels under identical names** — the B/C trap re-created. | **Required `space` tag** asserted by `CQ.geometry`; recommended discipline keeps **gameplay off the OHLC interface entirely** (§10.5, §10.6). |
| Major | **`fromGameplay` hand-waved** — no wick/hazard/mega-pole mapping. | Fully specified: `h=max+wick`, `l=min-wick2` in world-px, plus a first-class hazard/decoration channel (§10.5). |
| Major | **`COLOR` lacks the ~dozen non-body tokens** the de-inline assumes. | Palette expansion sub-task: grow `CQ.SPINE.color` with named tokens; "pixel-identical color" scoped to body fills (§10.11). |
| Major | **Dashboard punt leaves the fork alive** — duplication relocates. | **Committed end-state: promote to `cq-market.js`** loaded by both apps, after game surfaces unify (§17). |
| Minor | Jitter range mismatch (code 0.92–1.1 vs spine ±4–8%). | Preserve gameplay's stored generation jitter; spine ±4–8% applies to authored A/C; log as a per-surface intended change (§10.7). |
| Minor | Boss "single geometry" is actually two recomputations. | Draw caches `bossLayout`; hit-test **reads it back** (§10.10, §16). |

### Blizzard / maintainability (does `window.CQ` scale for a decade?)

| Severity | Finding | Resolution |
|---|---|---|
| Critical | **The "single source of truth" is authored inside the hand-triplicated file** — engine copied 3× per deploy; core claim false. | Honest framing: inline+`cp` is not a single source. **Derive the mirrors** from source via the validator script; **committed `cq-market.js` end-state** (§17). |
| Major | **Frozen `CQ` references `COLOR@2412` before it exists** (TDZ/construction-order bug). | Palette lives in **`CQ.SPINE.color`**; `COLOR` becomes a **derived alias** declared after `CQ` (§10.4). |
| Major | **`CanonCandle` carries price and world-px under one name** — B/C trap one level up. | `space` tag + keep gameplay off the interface (§10.5, §10.6). |
| Major | **MarketRenderer allocates per candle per frame** on the hot path. | Zero-alloc `CQ.paintCandle`; measure against ≥30 fps gate before committing the abstraction (§10.8, §16). |
| Major | **Passthrough scale is a permanent two-path fork** and doesn't truly unify the body-bottom seam. | Passthrough contract **named and frozen as a tested invariant** (byte-identical `candleTop`/body-bottom); `CQ.geometry` asserts the min-body floor under passthrough equals `CFG.minBody`; gameplay body-bottom documented as a physics surface (§10.7, §8, §12). |
| Major | **Enforcement gated on a hand-maintained symbol allowlist that rots.** | Default-deny scan + a lint/naming convention that `draw*Candle`/`*ChartSVG` must reference `CQ` (§11 Step 0c). |
| Major | **No home for the stateful Chart Composer.** | **`CQ.geometry` returns hit regions as a first-class output**; Composer/boss/concept-practice share one geometry→hitbox authority (§17). |
| Minor | Color de-inline would flatten intentional hazard/fork colors and is a 3× hand-edit. | Classification pass before repoint; done after mirror-generation is automated so it is one edit (§10.11, §11, §17). |
| Minor | Building a 150-line validator while refusing a 20-line mirror generator is inconsistent. | **Fold mirror-generation into the same script** (§17). |
| Nit | Reserved `CQ.pattern.*` stubs are speculative generality. | Deleted; add when the pattern phase is designed (§10.2). |

### Apple (perf & correctness under constraint; scope discipline)

| Severity | Finding | Resolution |
|---|---|---|
| Critical | **Reference `drawCandle` rewrite allocates ~10 objects/candle/frame** — violates the no-alloc law. | Zero-alloc `CQ.paintCandle`; hoisted scale/layout; singleton backend; explicit allocation-count assertion (§10.8, §10.10, §16). |
| Critical | **`candleTop` redefined as an allocating factory call on the physics hot path.** | Memoized `scaleGameplay`; `candleTop` pure arithmetic; per-frame allocation ceiling on `candleTop` added to the perf set (§10.7, §16). |
| Major | **Highest-ROI perf fix (cap main-canvas DPR at 2459) is unidentified and frozen out.** | **Named at chart-quest.html:2459**; carved out of "frozen" as a **perf-parity-gated** (not pixel-gated) early step (§16). |
| Major | **The SVG string-emit backend hardcodes the 240 ms rebuild it's supposed to eliminate.** | Either the SVG backend retains/mutates DOM nodes, or replay-node-diffing is a **separate** optimization — no false claim the engine fixes it for free (§16). |
| Major | **`render()` double-scale "for free" edits camera-entangled math.** | Reclassified as its **own flagged step behind the camera regression checklist**; unify step/domain only, camera transform lines untouched (§16, §12). |
| Minor | Boss hit-test rebuilds full layout per tap — a second derivation that can drift. | Cache `bossLayout`; hit-test reads it back, O(1) (§10.10, §16). |
| Minor | Backend-agnostic `CandleDraw` is over-engineered for the hot canvas path. | Hot path uses primitive `paintCandle`; `CandleDraw` reserved for cold SVG/gallery/validator (§10.8). |
| Nit | Perf gate checks GC-pause count but not allocation rate. | Gate adds **bytes-allocated-per-frame** ceiling, not just pause count (§16). |

**Net effect of the review.** The strategy-level architecture survived — namespace-over-bundler, the layered identity-passthrough scale, boundary adapters for the B/C trap, and gameplay-migrates-last are all confirmed correct. Three changes were forced and are now load-bearing in the recommendation: (1) the frozen seam is **`{candleTop, c.x, c.w, gap}`**, because candle width is physics; (2) the gameplay canvas path is **zero-allocation** (`CQ.paintCandle`), reconciling the architecture with its own perf law; and (3) the **verification substrate is the first deliverable**, because none of the parity gates can run without it. With those integrated, this survives the decade; without them, the gameplay migration fails its own parity gate on day one.

---

*Grounding: `CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md` (A.6 spine, §Automated Validation Rules); `chart-quest.html` (CFG:2312, COLOR:2412, candleTop:2523, candleW:3257, candleAtScreen:4254, wall-collision 12527–12530, coin 3291, liquidity 8447, drawCandle:12839, resize DPR:2459, render:14424, bossCandleSVG:9273/candleExtremeXY:9290/bossCandleSVGTrend:9303, Block-2 bridge:19675, ?qa=1:19680); `scripts/verify.js` (3b SKIP); verified: no `package.json`/`puppeteer`, mirrors cksum 4183363700, inline `#16c784`×236 / `#ea3943`×159; `docs/canon/protected_systems.md`. Phase 1 writes no code and modifies no file but this one.*
