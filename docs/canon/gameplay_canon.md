# Gameplay Canon

**Status:** PERMANENT. The core loop and movement model. Movement is **protected core** — see [protected_systems.md](protected_systems.md).

## Core loop (official)
`LEARN → PRACTICE → APPLY → TEST` — the permanent design constitution. A concept is taught, practiced, applied in ≥3 trades, then tested at the boss. **Never test the untaught.** (This predates and outranks any feature request.)

- Traverse a live candlestick chart (the level *is* the chart) → collect shells → hit setups → open trades (LONG/SHORT) → resolve → reach the Guardian → boss trial → next level.
- 10 Guardian levels → Market Maker finale ("Escape the Market").

## Movement model (official — single system, do not duplicate)
- **Physics:** `update(dt)` (~13034) + `CFG` tunables (2254). One implementation. High gravity (`2300`), discrete 3-tier jump (tap / boost1 / boost2), shell-tuck dive, wick-spin.
- **Responsiveness (build 247):** coyote time `0.09`, jump buffer `0.12`, render-only landing squash. These fix dropped inputs only — they do **not** change reach/height/difficulty.
- **Input:** keyboard (Space/W/S, A/D) fires instantly; touch uses a ~60 ms tap-timer for jump + swipe-up boost / swipe-down dive (build 247).
- **Constraints that are canon:** no free flight, no hover, no fuel HUD, no diagonal boost. Boost is vertical, capped at 2 per air-time.

## Approved tunables (change deliberately, never as a side effect)
`CFG.walkSpeed`, `gravity`, `jumpVelocity`, `jetpack1/2Velocity`, `jetpackHang`, `coyoteTime`, `jumpBufferTime`, `spinDur`, `tuckMinVy`. All in the `CFG` block at 2254. A movement-feel change edits these + the draw; it must not touch lesson/boss/economy code.

## Deprecated / prototype
| Item | Where | Status |
|---|---|---|
| "Flow Reads" (movement = reading) prototype | 12117 | ❓ Prototype — do not build on until classified |
| Order-block launch pads | removed (PART 4) | ⛔ Retired — every candle lands the same way |
| Combo/streak scoring on movement | removed (PART 3) | ⛔ Retired — movement isn't a score minigame |
| Fuel HUD meter | hidden | 🟡 Fuel still limits boosts but is not shown |

## Rules
- **Do not make Finn easier** as a side effect. Responsiveness ≠ difficulty. (Founder mandate from the Movement Feel Patch.)
- Any movement change is verified on-device (QR, beginner mode `?fresh=1`) before it's considered done.
