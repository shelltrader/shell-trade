# ChartQuest — Performance Patch Plan

**Date:** 2026-07-10 · Scope: the one isolated production fix, plus the remaining perf ledger.

---

## 1 · The uncapped `devicePixelRatio`

### Exactly where it exists

`chart-quest.html`, inside `resize()` — the function that sizes the **main game canvas**:

```js
const MAX_ASPECT = 0.58;
function resize() {
  const dpr = window.devicePixelRatio || 1;   // ← here
  ...
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);     // draw in CSS pixels
}
```

There are **13** `devicePixelRatio` reads in the file. **11 already cap at 2.** Two do not:

| Site | What it is | Verdict |
|---|---|---|
| `resize()` (main game canvas) | the full-screen play surface, redrawn every frame | **the target** |
| `drawIntermission()` | reads `dpr` only to derive `IW = imC.width / dpr` | **leave alone** — `#imCanvas` is `display:none` and never sized, so the maths is internally self-consistent (`setTransform(dpr)` cancels it) and nothing renders. Touching it changes nothing and risks the recap screen. |

### Why it exists

Not a decision — an omission. The main canvas was written first; every canvas added afterwards
(lesson charts, thumbnails, intermission chart, scanner, boss previews) uses
`Math.min(devicePixelRatio || 1, 2)`. The main one was never revisited.

### Expected gain (measured, not estimated)

`W = min(innerWidth, round(innerHeight × 0.58))`, `H = innerHeight`.

| Device | dpr | Buffer today | Buffer @ cap 2 | Pixels saved | Canvas VRAM |
|---|---|---|---|---|---|
| iPhone SE | 2 | 750×1334 | 750×1334 | **0%** | 4.0 → 4.0 MB |
| iPhone 13 / 14 | 3 | 1170×2532 | 780×1688 | **55.6%** | 11.8 → 5.3 MB |
| iPhone 16 Pro Max | 3 | 1290×2796 | 860×1864 | **55.6%** | 14.4 → 6.4 MB |
| Pixel 7 | 2.625 | 1082×2402 | 824×1830 | **42.0%** | 10.4 → 6.0 MB |
| Galaxy S | 3 | 1080×2400 | 720×1600 | **55.6%** | 10.4 → 4.6 MB |
| iPad (portrait) | 2 | 1368×2360 | 1368×2360 | **0%** | 12.9 → 12.9 MB |
| Desktop | 1 | 522×900 | 522×900 | **0%** | 1.9 → 1.9 MB |

**The patch is a literal no-op on every dpr ≤ 2 device.** It only changes behaviour on 3× phones
and the Pixel — which is to say, on the flagship devices this beta is aimed at.

Every full-canvas operation per frame (clear, background gradient, candle fills, the parallax
skyline) is fill-rate bound. Cutting the backing store by 2.25× cuts that work by 2.25×. On iOS
Safari, canvas fill rate is the usual frame-time ceiling.

### Risk of changing it

**Low, and provably contained.** I checked each way this could leak:

| Possible leak | Finding |
|---|---|
| Something reads `canvas.width`/`.height` and assumes a dpr | ❌ The main canvas's buffer size is **written at two lines and read nowhere.** |
| `getImageData` / `toDataURL` depends on buffer pixels | ❌ **Neither appears anywhere in the file.** |
| Pointer/hit-testing uses device pixels | ❌ Mapping is `e.clientX - stageX` — CSS pixels. Unaffected. |
| Drawing code uses device pixels | ❌ `ctx.setTransform(dpr,0,0,dpr,0,0)` means every draw call is already in CSS px. |
| Line 19382 also sizes `canvas` | ❌ Different binding — `function mount(canvas, key)`, a parameter, already capped at 2. |
| Sprite mips assume 3× | ❌ Finn's mips are baked at `FINN_H[k] × 4.2` px, independent of canvas dpr. |

**Regression risk:** the game surface renders at 2× instead of 3× on a 3× phone — a slight
softening of canvas-drawn text and 1px strokes. This is what every other canvas in the file
already does, and what most shipped web games do. Nothing else changes: no coordinates, no
physics, no hit-testing, no gameplay.

### The patch

Prepared at **`patches/dpr-cap-main-canvas.patch`**. Validated with `git apply --check` against
the *current* `chart-quest.html` — it applies cleanly.

```diff
 function resize() {
-  const dpr = window.devicePixelRatio || 1;
+  const dpr = Math.min(window.devicePixelRatio || 1, 2);
```
(plus a comment explaining why, and why it's safe.)

### 🚫 Why I did not apply it

`chart-quest.html` is being **actively edited by another session** (last write 19:12:53; a
flag-gated `FINN_V3` renderer refactor is in flight, touching `drawFinnSprite`, `commitTrade`,
`resolveTrade`). Applying a one-liner into a file someone else is mid-refactor on buys nothing —
the game **cannot** ship today regardless (see `DEPLOYMENT_PLAN.md`: `hero.png` is untracked).

Apply it as step 4 of the *game* release, not the website release.

### How to verify the gain on device

```js
// paste in Safari Web Inspector while the game runs
const c = document.getElementById('game');
console.log(devicePixelRatio, c.width, c.height, (c.width*c.height/1e6).toFixed(2)+'Mpx');
```
Expect `Mpx` to fall by ~55% on an iPhone. Then watch the fps counter through a boss fight.

---

## 2 · Remaining performance ledger

| # | Item | Cost | Beta-critical? | Action |
|---|---|---|---|---|
| PF-1 | Main canvas DPR (above) | ~2.25× fill on 3× phones | **Yes** — worst offender | Patch ready; ship with the game release |
| PF-2 | Landing page: **5 `backdrop-filter` layers** (nav, sticky CTA, install sheet, welcome, mk-bar) | The single most expensive CSS effect on low-end Android; each forces a backdrop snapshot | No | Measure on device. If jank appears, drop the blur on `.sticky-cta` and `.mk-bar` first (they're always composited). |
| PF-3 | 48 running animations, 14 `will-change` | Bounded — `[data-fx]` pauses offscreen, `prefers-reduced-motion` kills all | No | Leave |
| PF-4 | `lightweight-charts` 163 KB + `market-data.js` 17 KB | Lazy-loaded when the section nears the viewport; off the critical path | No | Leave |
| PF-5 | `hero-key-art.jpg` 834 KB, `fetchpriority="high"` | Largest Contentful Paint driver on mobile | **Borderline** | Post-beta: ship an AVIF/WebP with a `<picture>` fallback. ~60% smaller. Not worth the risk today. |
| PF-6 | iOS splash set | 240 KB total, fetched once by the OS | No | Leave |
| PF-7 | `website/game.html` is a 1.3 MB HTML document | Parsed on every `/play` | No | Structural; out of scope |

**Recommendation:** ship PF-1 with the game release. Postpone PF-2 and PF-5 until after beta,
gated on real device profiling. Everything else is fine.
