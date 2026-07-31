# CHARTQUEST — SHELL SPAWN SPECIFICATION

**Status:** RATIFIED · build 301 · 2026-07-27
**Governs:** `COLLECTIBLE_CONSTITUTION.md` → this document is its implementation contract.
**Owner in code:** `window.CQREACH`, chart-quest.html (defined immediately after `candleTop()`)

---

## 1. REACHABILITY VALIDATION ARCHITECTURE

```
                        SPAWN REQUEST
                              │
                     CQREACH.place(arr, item, opt)
                              │
                    ┌─────────▼─────────┐
                    │  VALIDATION PIPE  │   ordered, cheapest first,
                    │  returns FIRST    │   returns {ok, reason, why}
                    │  failing reason   │
                    └─────────┬─────────┘
                              │
   1. GROUND_NOT_READY   groundY > 0 && candles.length > 0
   2. NOT_FINITE         isFinite(x) && isFinite(y)
   3. BELOW_FLOOR        y < groundY                        (dead space)
   4. ABOVE_CEILING      y >= groundY - CFG.levelMax        (no launch pad)
   5. NO_TERRAIN         a candle exists under x
   6. INSIDE_TERRAIN     (surfaceAt(x) - y) >= minClear     (10px)
   7. UNREACHABLE        (surfaceAt(x) - y) <= maxRise      (335px, one boost)
                              │
                 ┌────────────┴────────────┐
            REJECTED                   APPROVED
                 │                          │
      return null; caller drops    stamp gy (terrain space)
      the candidate and tries      via anchor(), then push
      elsewhere. NEVER repaired.              │
                                              ▼
                                        LIVES IN WORLD
                                              │
              ┌───────────────────────────────┼───────────────────────────┐
              ▼                               ▼                           ▼
        resize()                     continuous audit             render guard
   re-project y from gy            ~2×/sec, heals terrain      refuse to draw
   (drift impossible)              that changed shape          below baseline
```

### Why "reject, never repair"

The brief was explicit and it is right. A clamp makes every placement mean *"wherever it ended up"*, which is how a world accumulates shells in odd spots that nobody can explain. A rejection makes each placement mean *"this spot was legal"*. Rejections are cheap — the generator simply tries the next candle.

### The one nuance

`reanchor()` and `audit(heal)` **do** move already-approved items. This is not a loophole:

- **Rejection** applies to a *candidate at request time* — something that was never legal.
- **Re-anchoring** applies to a *resident that was legal when placed*, whose terrain moved. Restoring its intended relationship to that terrain is the opposite of papering over a bad placement.

`audit()` removes an item in exactly one case: `NO_TERRAIN` — there is nothing to stand on, so it can never be earned and must not be teased. Everything else is restored, because deleting a reward the player may already be running toward (a Lost Wisdom chapter, worst case) is its own broken promise.

---

## 2. API

| Call | Purpose |
|---|---|
| `CQREACH.LAW` | The law, as a string, in the build. |
| `CQREACH.envelope` | `{hop, boost1, boost2, maxRise, minClear, ceilHeight}` — derived from `CFG`. |
| `CQREACH.region()` | `{groundY, floor, ceiling, envelope}` |
| `CQREACH.ready()` | World geometry initialised? |
| `CQREACH.surfaceAt(x)` | Walkable world-y at x, or `null`. |
| `CQREACH.candleAt(x)` | The candle under x, or `null`. |
| `CQREACH.launchSurfaceNear(x)` | Highest candle top within a stride (query only). |
| `CQREACH.validate(x, y, opt)` | `{ok, reason, why, clearance}` |
| **`CQREACH.place(arr, item, opt)`** | **The only sanctioned way to create a collectible.** Returns the item, or `null`. |
| `CQREACH.anchor(item, fields)` | Stamp terrain-space `gy` for the named absolute-y fields. |
| `CQREACH.reanchor()` | Re-project every owned collectible after `groundY` moves. |
| `CQREACH.audit(heal)` | Sweep; returns violations, optionally healing. |
| `CQREACH.clearAll()` | Drop every owned collectible (chart rebuild / hour change). |
| `CQREACH.cullPast(x)` | Drop every owned collectible beyond a world-x (trade truncation). |
| **`CQREACH.setWick(c, w)`** | **The only sanctioned way to grow a live candle's wick.** Carries pole shells with it. |
| `CQREACH.own(name, ref, fields)` | Register a future collectible family. |
| `CQREACH.log` | `{approved, rejected, byReason, last[]}` — the spawn ledger. |

### `opt`

| Key | Meaning |
|---|---|
| `kind` | Label for the debug ledger (`'spin-pole'`, `'body-top'`, `'data-box'`, `'lost-page'`, …). |
| `pole` | This pickup hangs on a wick; the wick is the intended route, not an obstacle. |
| `fields` | Which fields are absolute world-y. Defaults to `['y']`; Lost Pages use `['y','tipY']`. |

### Adding a new collectible family

1. Declare the array.
2. `CQREACH.own('myThings', () => myThings, ['y'])`.
3. Spawn **only** through `CQREACH.place(myThings, {...}, {kind:'my-thing'})`.

Registration is what makes `reanchor` / `clearAll` / `cullPast` / `audit` cover it automatically. There is no step 4.

---

## 3. THE OWNED REGISTRY

| Array | Absolute-Y fields | Notes |
|---|---|---|
| `coins` | `y` | Shells. Pole shells also carry `_wf` (fraction along the shaft) and `_wpad`. |
| `boxes` | `y` | Breakable data boxes. |
| `wisdomPages` | `y`, `tipY` | Lost Pages — two independent absolute-y fields. |

Portals and Finn are deliberately **not** registered: both already re-derive from `candleTop` every frame and were never subject to this bug. The audit confirmed that asymmetry is exactly why the symptom presented as *"shells and boxes in impossible places"* and never *"portals in impossible places"*.

---

## 4. EVERY SPAWN SITE (9)

All routed through `CQREACH.place()`:

| # | Site | Kind | y formula | Purpose |
|---|---|---|---|---|
| 1 | `maintainCandles` | `spin-pole` | `candleTop − wick − 10` | every-10 twirl pole; seeds the liquidity-grab lesson |
| 2 | `maintainCandles` | `body-top` | `min(topThis, topPrev) − 14` | ambient; sits in the natural walking path |
| 3 | `maintainCandles` | `high-cache` | `body-top − 18` | rewards the tall route |
| 4 | `maybeMegaCandle` | `mega-pole` | `top − wick − 12` | the climb pays the prize |
| 5–7 | `maybeSpawnWisdomPage` (pole promotion) | `wisdom-pole` | `top − wick × {0.38, 0.72, 1.0}` | the shaft stack |
| 8 | `maybeSpawnBox` | `data-box` | `candleTop − 34` | rare optional bonus |
| 9 | `maybeSpawnWisdomPage` | `lost-page` | authored + clamped | notice → investigate → discover |

If the gate refuses a Lost Page, `placed[kind]` stays false and the next suitable candle gets it — **a chapter is never lost, only moved.**

---

## 5. WICK GROWTH — THE SECOND MUTATION VECTOR

`wick` is the *only* candle geometry still mutated after `pushCandle` (`h` / `open` / `x` / `w` never are — verified across the whole file). Four sites grow it, and each could fire *after* shells were anchored to the shorter wick, stranding "the shell at the tip" at 12% of the shaft.

All four now go through **`CQREACH.setWick(c, w)`**, and pole shells remember `_wf` / `_wpad` so they ride up with the pole:

| Site | Growth |
|---|---|
| `maybeMegaCandle` | → 105–145px |
| Lost-Wisdom backward clamp (`_pc.wick`) | → up to 300px |
| Lost-Wisdom fallback promotion | → 120–145px |
| Lost-Wisdom tip re-grow | → up to 300px |

`decorateCandleWicks` is exempt **by design**: it dresses the candle *descriptor* before `pushCandle`, so no collectible can be attached yet. The build gate encodes this exemption explicitly rather than allowing raw writes generally.

---

## 6. DEBUG OVERLAY — `?reach`

Developer-only. Gated purely on the query string, so no build flag can leak it to players.

Shows:
- Playable envelope — green surface trace, green dashed one-boost reach line, amber ceiling
- Unsafe zone — red band below the baseline (where the off-chart failsafe re-grounds Finn)
- Per-shell clearance readout, red with the failing reason if it leaves the safe band
- Live spawn ledger — approved / rejected counts and the last rejections with reasons

> **Trap, encoded in the gate:** the flag is captured beside `_CQ_MUTE`, *before* the `?fresh` handler strips the query string via `history.replaceState`. The standard beginner-mode test link is `?fresh=1&mute=1&reach=1`; a flag read any later is silently always-false exactly when it is needed. Gate check 6 enforces the ordering.

---

## 7. BUILD ENFORCEMENT — `verify.js` #14

`scripts/collectible_law_gate.js` fails the build on any of:

1. `CQREACH` owner missing or not published on `window`
2. Any raw `coins.push` / `boxes.push` / `wisdomPages.push` (the original bypass)
3. Fewer than 7 `CQREACH.place()` call sites
4. `resize()` not calling `window.CQREACH.reanchor()` — or calling bare `CQREACH` (a TDZ crash at first resize)
5. `groundY` gaining a second writer
6. Raw live-candle `.wick` assignment outside `decorateCandleWicks` / `setWick`
7. `_REACH_DEBUG` not query-gated, or captured after the URL strip
8. `initCandles()` not clearing collectibles

Negative-tested: reintroducing a raw `coins.push` and removing the `resize()` re-anchor each turn the gate red.

---

## 8. TRAPS FOR THE NEXT ENGINEER

- **Smaller y = higher on screen.** Clearance is `surface − y`.
- **TDZ is live in this file.** `?guest` / `?dev` calls `resolveAuth()` at top level, which reaches `initCandles()` *before* the collectible `const`s (and `CQREACH` itself) initialise. Touch them through `window.CQREACH` there, never bare. This crashed boot during development and the gate now enforces it.
- **`coins` / `boxes` / `wisdomPages` are `const`.** Splice in place; never reassign.
- **`_lastKeptX` used to fall back to `Infinity`**, which silently disabled the trade-truncation cull entirely. It is `-Infinity` now: when no terrain survives, everything must go.
- **Measure reachability from the candle directly beneath the pickup**, not the highest neighbour. The neighbour is the *permissive* direction and can approve something nothing can reach.
- **chart-quest.html, index.html and website/game.html must stay byte-identical.** Run `scripts/cq.sh mirror` and `scripts/cq.sh site`, and bump `sw.js` `CACHE`.
