# FINN LOCKDOWN — The One Official Finn

**Status:** PERMANENT · OVERRIDES all other Finn definitions, including older lines in `docs/finn-canon/`.
**Last locked:** build 250 (2026-07-04).

> Finn has been the #1 source of regressions in this project (builds 226→250). This document ends that. **Future work uses ONLY the version below. Every other Finn is deprecated.**

---

## 1. Official Finn asset (the lockdown)

**Official grounded/walking sprite:** **`finn/run.png`** — the complete new-art turtle with legs baked in (static legs). Rendered by `drawFinnSprite()` for the grounded `run` state, with a gentle whole-body rock (no leg animation).

**Official per-state sprites** (all under `finn/`, all rendered by `drawFinnSprite`):
| State | Asset | Notes |
|---|---|---|
| Grounded walk / idle | **`run.png`** | Static legs; body-rock only |
| Rising jump | `jump.png` | Nose-up |
| Jetpack boost | `vboost.png` | Shown while `flameT > 0.25` |
| Landing pose | `land.png` | Used when `landT > 0` |
| Shell (spin/tuck ball) | `shell-fall-roll.png` | Ball form |
| Dazed (big fall) | `dazed-after-fall.png` | Grounded only |
| Hero/menu/victory | `hero.png` (via `drawHeroFinn`) | Non-gameplay |
| SVG badge | inline `finnIconHTML()` | HTF marker, academy |

**Approved colors** — the `COLOR` object in `chart-quest.html` is the single source of truth (green `#7ED957` body, orange `#F0862C` shell, gold `#FFD54A` compass, gunmetal `#6B7280` jetpack, orange→yellow flame). Full table: `docs/finn-canon/01-Finn-Character-Bible.md §6`. Do not hard-code Finn colors elsewhere; the sprite art already bakes these.

**Approved proportions** — chibi turtle, **Head : Shell ≈ 1.25 : 1**, wider-than-tall, low quadruped silhouette (jetpack → shell+necklace+legs → head). Collision hitbox **36 × 24 px — NEVER changes**. Hero scale `VIS = 1.35`. Full spec: `docs/finn-canon/01-Finn-Character-Bible.md §2–4`.

**Approved animations** — body-rock/squash on walk, jump nose-up→apex ease, boost `vboost` pose, ball spin/tuck, big-fall dazed, landing squash (build 247), idle personality (breath/blink/curious-peek). Legs **do not animate**. Full spec: `docs/finn-canon/02-Finn-Animation-Bible.md`.

---

## 2. Mandatory identity rules (from the Character Bible — enforced)

Finn MUST ALWAYS: be **quadrupedal** (4 legs, baked into art), **face right** by default, use the **orange shell + green body**, wear the **gold compass necklace**, carry the **gunmetal jetpack**.

Finn MUST NEVER: become humanoid / stand upright, gain a 5th limb, lose the compass, lose the jetpack, or render the shell in a non-orange hero color.

Any frame/sprite/code path that violates these is non-canon and must be fixed.

---

## 3. DEPRECATED Finn versions — never reuse

| Deprecated | What it is | Why retired | Trap |
|---|---|---|---|
| **`finn/body.png` + `finn/leg.png`** | build-244 procedural leg rig (one leg reused 4×, swung at hips) | Legs overlap over the compass; founder: "legs are still bad… it looked way better before" | Assets still load, so `_rigOn`-style checks can silently re-enable it. **Do not gate rendering on 'are body/leg loaded'.** |
| **`finn/walk-sheet.png`** | build-232 baked 12-frame walk cycle (old art) | Old art; renders as detached-shell / closed-green-eyes in-game | Fallback branches may reach for it if `walk.length === 12` |
| **Procedural `drawTurtle()`** | shape-drawn turtle | Superseded by PNG sprites (build 226+) | **Fallback ONLY** (if PNGs fail). NOT the "renderer of record" despite what the Character Bible header says — that line is stale. |
| `drawFinnRigLeg` / `drawFinnRigTail` | rig leg/tail helpers | Rig deprecated | Defined but unused; do not call |

**Doc-vs-code note:** `docs/finn-canon/01-Finn-Character-Bible.md` line 6 says *"Renderer of record: drawTurtle() (procedural)."* That was true at authoring time (July 3) but is **no longer accurate** — the shipping renderer is `drawFinnSprite` with `run.png`. The Bible remains the authority for **design intent** (proportions, palette, rules); this document is the authority for **which renderer/asset ships**. Do not "fix" code to match the stale line.

---

## 4. If Finn's legs/look ever seem wrong again — the decision tree
1. It is **NEVER** correct to fall back to `walk-sheet.png` (old art) or to re-enable the `body.png`+`leg.png` rig.
2. Grounded Finn = **`run.png`** (static legs). If legs look off, the fix is within the `run.png` sprite/its transform — not a different system.
3. Verify at **actual game scale** on device, not a huge zoom (zoom exaggerates).
4. Preview gotcha: the `?fresh=1` intro is a video that won't play headless (black screen). To inspect a sprite, draw it on a **separate overlay canvas** (physics-free), or frame-pump `frame(performance.now())`.
