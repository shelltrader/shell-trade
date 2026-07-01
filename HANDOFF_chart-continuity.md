# Handoff — ChartQuest chart-continuity guard

I've been working on ChartQuest's Trade System V2 and a Global Visual Rule in another tool. Picking up in Claude Code now. Here's the exact state so you can continue.

## Design docs (repo root — read these first)
- `ChartQuest_Trade_System_V2_Design.md` — the ideal beginner trade loop (Setup Detection → Entry → Trade Management → Resolution). IMPORTANT: most of this is **already implemented** in `chart-quest.html` (Trader View ritual, momentum → 2-candle pullback → confirmation framework, SL/TP, trade duration, win/loss ceremony, confluence grade, journal/replay). Treat the doc as descriptive of the current build, **not a backlog**. Do not re-implement it.
- `ChartQuest_Global_Visual_Rule.md` — binding rule: the chart must always read as a continuous living market. No dead space > ~15–20% of viewport, no price scale disconnected from candles, no floating labels, live edge always connected. **Continuity overrides rigid camera behavior.**

## What I just changed (`chart-quest.html` — UNCOMMITTED, not yet built)
Implemented the chart-continuity guard for the **main `render()` camera only**:

1. Added a `const CHART_CONTINUITY = { ... }` config block + `function enforceChartContinuity(baseCamX, dt)` immediately after the `const TRADER_STAGE1 = ...` line, just before `function frame(now)` (~line 16785).
2. In `frame()`, the horizontal-camera block now reads:
   ```js
   const baseCameraX = Math.max(0, turtle.x - W * CFG.cameraAnchor);
   maintainCandles(baseCameraX);                          // physics + candle-gen use the TRUE camera
   const cameraX = enforceChartContinuity(baseCameraX, dt); // render + overlays use the reframed camera
   ```

**Behavior:** inert at `camZoom === 1` (normal walking is pixel-for-pixel unchanged). When the camera pulls back (`camZoom < 1`: Trader View / live trade / approaching setup), the deliberate ~52% turtle anchor leaves a large empty gap right of the live edge with the price scale floating over nothing. The guard reframes the world horizontally so printed history fills the left and the live edge sits at ~82% of the viewport (≤18% dead space).

**Safe by construction:** visual-only (never touches physics, collision, candle generation, or the `maxSeenCandleId` fog-of-war); only ever reveals already-printed history (never un-printed future candles → can't spoil a setup/outcome); eased in AND out (no pop); hard-clamped so the turtle can never be pushed off-screen; fully wrapped in try/catch with a fallback to the unmodified camera.

**Verified:** `node --check` passes on the main game `<script>` block; a numeric simulation confirmed dead space ~40–46% → 18%, live edge → 82%, turtle stays on-screen across `camZoom` 0.5 / 0.66 / 0.8. **NOT visually playtested on canvas yet.**

**Tuning knobs** (top of `CHART_CONTINUITY`): `enabled` (kill switch), `targetEdgeFrac` (0.82), `maxDeadSpaceFrac` (0.18, reference for the cap), `maxTurtleFrac` (0.90), `ease` (4.0), `zoomActiveBelow` (0.985).

## Where to take it next
1. **Visually playtest the guard in a build and tune** `CHART_CONTINUITY` if the framing feels off — especially during the two-stage cinematic pull-back and the live-trade fit-to-trade zoom.
2. **Extend the rule to the OTHER reframe paths my guard does NOT cover** (each renders separately from the main `render(cameraX)`):
   - Full-screen Trader View overlay — `openTraderView()` / `cfTraderView` / `#chartFull` (the pre-trade ritual).
   - HTF zoom overlay — `htfZoomState`.
   - Chart trials — `chartTrial` / `drawChartTrialWorld` (uses its own 0.34 anchor + `TRIAL_ZOOM` 0.52).
   - Guardian trials and boss encounters (separate arenas).
   Check each against the rule: no dead space > ~18%, no disconnected scale/labels, live edge connected.
3. **Price gridlines / labels** (in-world grid ~lines 13310–13328; screen-space labels after `ctx.restore()` ~line 13540): I left these untouched and relied on reframing. If any mode still shows labels over empty space, clip the gridlines/labels to the printed-candle x-span.
4. **Build pipeline heads-up:** `build.js` extracts the game script via `html.lastIndexOf('</script>')`, but `chart-quest.html` now has **4** `<script>` blocks — verify the build still emits a valid `index.html` and doesn't concatenate trailing blocks into the obfuscated output.
5. **Run the VISUAL QUALITY TEST** from `ChartQuest_Global_Visual_Rule.md` on each mode: screenshot it — could it be mistaken for a rendering bug? If yes, fix before external testing.

Focus: continuity-guard coverage + tuning. Don't rebuild the trade loop.
