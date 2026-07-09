# Architecture Map

**Status:** PERMANENT (update when structure changes). How ChartQuest fits together, where the risk lives.

## The shape of the thing
ChartQuest is a **single-file browser game**: `chart-quest.html` — ~20,600 lines, **810 functions**, 4 inline `<script>` blocks, no modules. Everything below is a **region of that file** unless noted. `index.html` is a byte-identical mirror; `chart-quest.min.html` is an (currently stale) obfuscated build.

## System relationships (data + control flow)

```
                         ┌─────────────────────────────────────────┐
                         │  frame(now)  — single rAF loop           │
                         │  EMA-smoothed dt → update(dt) → draw     │
                         └───────┬───────────────────────┬─────────┘
                                 │                        │
              ┌──────────────────▼───────┐     ┌──────────▼───────────────┐
              │ update(dt)  [MOVEMENT]   │     │ draw  [RENDER]            │
              │ CFG + physics + input    │     │ candles → Finn → HUD → FX │
              │ coyote/buffer/spin/tuck  │     │ drawFinnSprite(run.png)   │
              └───┬───────────┬──────────┘     └───┬──────────┬───────────┘
                  │           │                    │          │
        ┌─────────▼──┐   ┌────▼─────────┐   ┌──────▼───┐  ┌───▼────────┐
        │ LESSONS /  │   │ SETUP/TRADE  │   │ GameMusic│  │ BossArena  │
        │ conceptTier│   │ resolution   │   │ CineAudio│  │ /bossRound
        │ (gating)   │   │ (economy)    │   │ (audio)  │  │ (boss)     │
        └─────┬──────┘   └──────┬───────┘   └──────────┘  └────┬───────┘
              │                 │                              │
        ┌─────▼─────────────────▼──────────────────────────────▼──────┐
        │ SAVE: localStorage cq_*   +   Supabase (auth + ContentLog)   │
        └──────────────────────────────────────────────────────────────┘
```

## Dependency notes
- **Everything funnels through `frame()`** → `update()` + `draw()`. A throw in either can kill the rAF loop (the whole game freezes). High blast radius.
- **`conceptTier()`** is read by lessons, the HUD (what to show), the candle inspector, AND boss gating. It's a spine — changing teach-order ripples widely.
- **`CFG`** is read by movement, camera, candle generation, and setup sizing. A "tuning" edit can change traversal, chart density, and setup reach at once.
- **`FINN_SPRITES`** (asset loader) feeds `drawFinnSprite`; the deprecated `body/leg/walk-sheet` assets are still loaded here (the reactivation trap — see [finn_canon.md](finn_canon.md)).
- **Save + telemetry** are cross-cutting; almost every system writes a `cq_*` key or emits a `ContentLog` event.

## High-risk areas (change carefully, verify in-browser)
| Area | Why risky |
|---|---|
| `drawFinnSprite` frame-select (13760–13985) | 5 render paths, deprecated branches lurking; the recurring Finn regression |
| `frame()` / `update()` (13034, ~18590) | one throw freezes the game; EMA dt + camera coupling |
| Input handlers (3935–4103) | canvas-vs-DOM tap boundary; break it and mobile buttons die |
| Opening cinematic (17179) | video-gated; can strand the player on black |
| `conceptTier` + `LESSONS` (4419/4870) | curriculum spine; silent "test the untaught" regressions |
| Boss gating vs legacy boss object (9206 vs 9948) | wrong-object trap |

## Frequently modified areas (from build history 226→250)
- **Finn rendering/animation** — the single most-churned region (~15 builds). Now locked by [finn_canon.md](finn_canon.md).
- **Movement feel / `CFG`** — builds 233–247.
- **Camera & frame pacing** — builds 233–234.
- **First-15-minutes / onboarding flow** — many audit-driven passes.

## Regression-prone areas (where fixes have caused new breaks)
1. **Finn legs/art** — a "fix" reverted the whole character (248→250).
2. **Idle vs blocked gait** — animation edits chasing an anti-stuck *physics* bug (236–242).
3. **Camera follow** — pole-spin jerk mistaken for a sprite bug (233).
4. **Intro flow** — soft-locks from setup/portal cutoffs (CQ-0024).
5. **Cross-`<script>`-block scope** — redeclarations across the 4 blocks crash silently (build 202 trap).

## Mitigations already in place
- Anti-softlock watchdogs (anti-stuck 13187, off-chart failsafe 13097, intro watchdog 18663).
- EMA dt smoothing (234). Versioned `cq_*_v` save keys. Offline Supabase stub.
- **This canon folder** (the structural mitigation).
