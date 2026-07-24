# FINN — SINGLE SOURCE OF TRUTH

**Status:** PERMANENT (target-state spec). **Date:** 2026-07-06. **Against:** build 251 (`chart-quest.html`).
**Ranks under:** [`docs/canon/finn_canon.md`](docs/canon/finn_canon.md) (the lockdown — design authority) and consistent with [`FINN_CANON_AUDIT.md`](FINN_CANON_AUDIT.md) (the reference audit). This doc is the **implementation-level** SSoT: the exact assets, references, loader, states, and animation systems that are approved. **Everything not listed here is LEGACY.**

> **The one rule:** Finn is the PNG. Every approved frame is a whole-sprite bitmap drawn by `drawFinnSprite`; animation is transforms + frame selection only. **Legs never animate.** The procedural turtle exists only as a load-failure fallback. No walk-sheet, no leg rig — ever.

This is a **spec**, not a cleanup. Executing the removals in §7/§8 is an approval-gated change to **protected system #1** per `CLAUDE_RULES.md`.

---

## 1. Approved assets (`finn/`)

Exactly **seven** files. Six gameplay sprites + one non-gameplay hero pose. Nothing else in `finn/` is approved.

| # | Asset | Purpose | Rendered by | Gameplay? |
|---|---|---|---|---|
| 1 | `finn/run.png` | Grounded walk/idle (static legs, body-rock) **and** the airborne wick-fling dash | `drawFinnSprite` | ✅ |
| 2 | `finn/jump.png` | Rising jump, apex, and fall (nose-up→ease-down) | `drawFinnSprite` | ✅ |
| 3 | `finn/vboost.png` | Jetpack boost pose (`flameT > 0.25`) | `drawFinnSprite` | ✅ |
| 4 | `finn/shell-fall-roll.png` | Spin/tuck ball (dive/roll) | `drawFinnSprite` | ✅ |
| 5 | `finn/land.png` | Landing-squash frame (`landT > 0`) | `drawFinnSprite` | ✅ |
| 6 | `finn/dazed-after-fall.png` | Big-fall dazed (grounded only) | `drawFinnSprite` | ✅ |
| 7 | `finn/hero.png` | Hero / menu / victory pose | `drawHeroFinn` (non-gameplay) | ⭘ |

> **Provenance (not runtime, retained):** `content-assets/finn-canon-poses-A/B.png` are the offline source sheets the crops were composed from — kept as source art, referenced only in a code comment.
>
> **Open discrepancy on #7:** canon (`finn_canon.md §1`) designates `hero.png` as the official hero/menu/victory sprite, but the current `drawHeroFinn` (4318) reuses `run.png` via `drawTurtle` and **does not load `hero.png`**. Resolution is a founder decision — *either* wire `hero.png` into `drawHeroFinn`, *or* update canon to drop it. Until then it stays **approved** (do not delete).

---

## 2. Approved sprite references

The **only** keys that may exist in `FINN_SPRITES.img` and `FINN_SPRITES.mip`:

```
run · jump · vboost · shell · land · dazed
```

- `FINN_SPRITES.img[key]` — the loaded `Image` per state.
- `FINN_SPRITES.mip[key]` — the pre-shrunk canvas for clean ≤2:1 minification.
- **No `walk`, no `body`, no `leg`.** **No `FINN_SPRITES.walk[]` / `FINN_SPRITES.walkC[]` arrays.**

Approved height table `FINN_H` (12938) — exactly six entries:
```
{ run: 31, jump: 32, vboost: 36, shell: 25, land: 25, dazed: 23 }
```
(The `body: 31` entry is LEGACY — see §7.)

---

## 3. Approved loader

**One** loader: the `FINN_SPRITES` IIFE (`chart-quest.html` ~12882). Approved shape:

- Loads exactly the **six** gameplay files (`run, jump, vboost, shell, land, dazed`).
- Per file: `onload` builds a **mip** (pre-shrink to ~2× on-screen size); `onerror` is a no-op.
- `FINN_SPRITES.ready` flips **true only when all six load** — that readiness flag is the sole gate for the sprite path (`drawTurtle` 13159). Any miss → `ready` stays false → procedural fallback.
- **Never gate rendering on "is a deprecated asset loaded"** (`finn_canon.md §3` — the reactivation trap).

The loader must **not**: fetch `walk-sheet.png` / `body.png` / `leg.png`, nor slice a walk sheet into frame arrays.

Approved object shape after cleanup:
```
FINN_SPRITES = { ready: bool, img: {6 keys}, mip: {≤6 keys} }
```
(Remove the `walk: []` and `walkC: []` fields.)

---

## 4. Approved states

The pose-selection in `drawFinnSprite` (13072–13090) resolves to exactly these **six** `key` values. This is the complete state machine:

| State `key` | Condition | Asset | Pose transform |
|---|---|---|---|
| `dazed` | `finnDazedT > 0 && !airborne` | `dazed` | tiny woozy wobble |
| `shell` | `turtle.spinning \|\| turtle.tucked` | `shell` | rotate about shell centre (ball) |
| `vboost` | airborne & `flameT > 0.25` | `vboost` | upright boost, `rot = 0` |
| `run` (airborne) | airborne & `vxBoost > 140` (wick-fling dash) | **`run`** | jetpack frame, lean `-0.08` **— renders `run.png`, NOT a walk sheet** |
| `jump` | airborne & rising/apex/fall | `jump` | nose-up `-0.10` → ease nose-down |
| `land` | `landT > 0` | `land` | touchdown squash |
| `run` (grounded) | default (on ground) | `run` | **static legs** + body-rock/squash |

> **Canonical correction baked in:** the airborne wick-fling state (`key='run'`) must draw **`run.png`**. The current build still overrides it with walk-sheet frames at 13106–13112 — that branch is LEGACY (§7).

---

## 5. Approved animation systems

All animation is **whole-sprite transforms + frame selection**. The art is never dissected; **legs never swing**.

- **Grounded walk/idle** — body-rock + in-phase micro-squash, amplitude eased by `_gait` (idle-march → run). Legs are baked into `run.png` and stay put.
- **Idle personality** — march-in-place body bounce, slow breath underlay, double-blink, ~11s curious-peek lean, ±1.4° weight-shift.
- **Jump** — nose-up on rise, smooth ease to nose-down through apex/fall (no frame snap).
- **Boost** — `vboost` pose while the jetpack flame is lit.
- **Ball** — `shell` rotates about the shell centre for spin/tuck.
- **Dazed** — woozy wobble, grounded only, after big falls.
- **Landing squash** — feet-anchored squash-&-stretch scaled by impact (Feel Patch V1, render-only).
- **Facing** — mirror on `turtle.dir < 0` (transform, never a redraw).
- **Live jetpack flame** — `finnLiveFlame()` at `FINN_NOZZLE`, power `_finnFlameP` (render-only trail).
- **Rendering quality** — mip pre-shrink + `imageSmoothingQuality='high'`; sub-pixel position (no quantize judder).
- **Invariants** — hero scale `VIS = 1.35`; collision hitbox **36 × 24 px, NEVER changes**; identity rules per `finn_canon.md §2` (quadruped, faces right, orange shell, green body, gold compass, gunmetal jetpack).

---

## 6. Approved fallback & non-gameplay renderers (retained)

These are **not** legacy — they stay, with defined roles:

| Function | Line | Role | Rule |
|---|---|---|---|
| `drawTurtle` | 13156 | Dispatcher → `drawFinnSprite` when `ready`; otherwise the procedural fallback | **Fallback ONLY.** Never the primary renderer. Deleting it breaks Finn (it's the entry point). |
| `drawHeroFinn` | 4318 | Non-gameplay hero/menu/victory pose | Keep; resolve the `hero.png` wiring gap (§1). |
| `drawTurtleFalling` | 16963 | Opening/market-maker **cinematic** turtle | Cinematic-only; separate from the gameplay sprite system. Retained as an active cinematic element (touching it = protected UI-flow change). |

---

## 7. LEGACY — everything else (removal targets)

Anything Finn/turtle-related **not** named in §1–§6 is legacy. Concretely:

| Legacy item | Where | Type |
|---|---|---|
| `finn/walk-sheet.png` (868 KB) | disk + loader 12888 | deprecated asset |
| `finn/body.png` | disk (untracked) + loader 12889 | deprecated rig asset |
| `finn/leg.png` | disk (untracked) + loader 12889 | deprecated rig asset |
| `walk` / `body` / `leg` loader keys | 12888–12889 | deprecated loader entries |
| Walk-sheet slicing → `FINN_SPRITES.walk` / `walkC` | 12895–12913 | deprecated frame arrays |
| Airborne walk-sheet render branch | 13106–13112 | deprecated render path (the live canon violation) |
| `drawFinnRigLeg` | 12973 | deprecated rig helper (dead) |
| `drawFinnRigTail` | 12984 | deprecated rig helper (dead) |
| `FINN_H.body` entry | 12938 | vestigial dimension |

*(Order of removal matters — see the audit's deletion plan. The rig assets and loader keys are load-bearing for `FINN_SPRITES.ready`; remove the loader keys before deleting the files, or Finn falls back to procedural permanently.)*

---

## 8. Exact post-cleanup state — what remains

When cleanup is done, this is the **complete** Finn footprint. If something isn't on these lists, it shouldn't exist.

**`finn/` directory — 7 files:**
```
run.png · jump.png · vboost.png · shell-fall-roll.png · land.png · dazed-after-fall.png · hero.png
```
*(Deleted: `walk-sheet.png`, `body.png`, `leg.png`.)*

**Loader `files` map — 6 keys:**
```
{ run, jump, vboost, shell, land, dazed }
```

**`FINN_SPRITES` object:**
```
{ ready, img:{6}, mip:{≤6} }        // no walk[], no walkC[]
```

**`FINN_H` — 6 keys:** `run, jump, vboost, shell, land, dazed`  *(no `body`)*

**Finn/turtle functions that remain:**
```
drawFinnSprite   (primary sprite renderer)
drawTurtle       (dispatcher + procedural fallback ONLY)
drawHeroFinn     (non-gameplay hero pose)
finnLiveFlame    (jetpack flame)
drawTurtleFalling(cinematic-only turtle)
```
*(Deleted: `drawFinnRigLeg`, `drawFinnRigTail`.)*

**States — 6 `key` values:** `run · jump · vboost · shell · land · dazed`
*(Airborne wick-fling dash uses `run` → `run.png`, no walk sheet.)*

**Renderer of record:** `drawFinnSprite` with `run.png` for grounded Finn. `drawTurtle`'s procedural body is the fallback only.

---

*Spec only. No game code, assets, or canon were modified. This document defines the target state; executing §7/§8 is an approval-gated change to protected system #1. On any conflict about design intent, `finn_canon.md` wins; on the exact asset/loader/state inventory, this document is the reference.*
