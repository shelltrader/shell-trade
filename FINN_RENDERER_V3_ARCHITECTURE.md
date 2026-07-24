# FINN RENDERER V3 — ARCHITECTURE
### The Living Character Initiative · Phase 1–3, 7

**Status:** 🔴 **PROPOSAL — AWAITING APPROVAL. No code was written or changed.**
**Date:** 2026-07-10 · **Audited against:** `chart-quest.html` **build 259**, `website/index.html`, `finn/*.png`.
**Ranks under:** `docs/canon/finn_canon.md` · `FINN_CANONICAL_CHARACTER_SYSTEM.md` · `FINN_BEHAVIOR_BIBLE.md`.

> **Thesis.** We are not writing "run.png v2." The canon *already specifies* a skeleton (Character System **Doc 3**) and a mind (**Behavior Bible**). Neither has ever been implemented — the renderer can only translate a bitmap, so 95% of the canon is invisible. **V3 is the machine that makes the existing canon executable.** Build it once; the art can change underneath it forever.

---

# §1 · PHASE 1 — FULL TECHNICAL AUDIT

## 1.1 The current stack (as shipped, build 259)

| Subsystem | Where | What it actually does |
|---|---|---|
| Sprite loading | `FINN_SPRITES` IIFE | 6 gameplay PNGs + `hero.png` (separate). Mips pre-shrunk. Ready-gate. |
| Renderer of record | `drawFinnSprite` | Picks 1 of 6 frames, applies whole-sprite transforms, draws one `drawImage`. |
| Fallback | `drawTurtle` procedural | Shape-drawn turtle w/ real eyes, neck-crane, blink. **Never runs** (sprites load). |
| Hero/menu/victory | `drawHeroFinn` | Third ad-hoc path; poses the shared turtle, draws `hero.png`. No idle, no brain. |
| Life layers | `FinnLife` (V2, b257–259) | Blink (eyelid overlay), idle scheduler, gaze-lean, shell-check, breath, flame pulse, exhaust. |
| Blink | `EYE_SETS` + `drawEyelids` | **The only truly articulated element.** Clipped lid overlay per measured eye. |
| Body rock | `ctx.rotate(g*0.032*amp)` + micro-squash | Rigid tilt of the whole bitmap. |
| Root motion | `sy = turtle.y + bob + breath` (13203, 13351) | **Pure vertical translate.** Sine. |
| Landing | `landSqT` squash (Feel Patch V1) | Impact-only squash. Render-only. Correct — but only fires on landing. |
| Jetpack flame | `finnLiveFlame` (13029) | `wob = 0.84 + 0.16·sin(21t)·sin(6.1t+1.3) + 0.05·sin(47t)` |
| Shadow | `ctx.ellipse(w/2, h-0.5, 15, 3.3)` (13227, 13377) | **Fixed** ellipse. Never responds to height or squash. |
| Website Finn | `website/index.html` CSS | A **second, divergent** system (`finnAlive`, `finnLook`, `finnBlink`, `flameFlicker`). |

## 1.2 Every reason Finn still reads as a picture

| # | Finding | Evidence |
|---|---|---|
| 1 | **Root motion is translation, not transformation.** He is *moved*, not *animated*. | `sy = turtle.y + bob + breath` |
| 2 | **No gait squash/stretch.** Squash exists only on landing impact. Steps carry no weight. | `landSqT` only |
| 3 | **One fixed pivot** (feet-centre). No weight transfer between front/rear feet. | `ctx.translate(w/2, h)` |
| 4 | **The rock is a rigid tilt**, not a flex. The whole bitmap leans as a board. | `rotate(g*0.032)` |
| 5 | **He is one rigid body.** No part can lead or lag another → **zero overlapping action / follow-through** — the single strongest aliveness cue in animation. | one `drawImage` |
| 6 | **Legs are not separable.** Measured: opaque spans merge into the body above **86% height**; distinct leg columns exist only in the bottom ~14% (~26px of 186). | pixel scan of `run.png` |
| 7 | **Eyes are baked** → "looking" is faked by leaning the entire body. | `lookToward` → whole-sprite lean |
| 8 | **Neck is baked/hidden** → the Behavior Bible's *Peek* is a body lean, not a neck-crane. | Bible §Peek vs code |
| 9 | **Compass is baked** → canon says it swings under acceleration. It cannot. Zero secondary motion. | Character Bible §4.5 |
| 10 | **Blink is the only articulated element — and it's the only thing that reads alive.** That is the proof the layer approach works. | `drawEyelids` |
| 11 | **Idle layers share one clock** with rational sine ratios → they visibly re-synchronise. Humans detect loops instantly. | `turtle.animT` |
| 12 | **Behaviour is `Math.random()`, not intention.** A screensaver, not a mind. Eyes have no target; the body has no reason. | `FinnLife.schedule` |
| 13 | **Flame is 3 summed sines.** Deterministic, no turbulence field, no thrust/pressure coupling, no exhaust wake → reads plastic. | 13029 |
| 14 | **Shadow is a constant ellipse.** It never scales with height or squash → ground contact is broken, which destroys the weight illusion. | 13227 |
| 15 | **No anticipation, no overshoot, no follow-through, no springs.** Everything starts and stops on the same frame. | — |
| 16 | **No easing.** Raw sine = constant velocity through the extremes. | — |
| 17 | **Three divergent Finns** (game canvas · website CSS · `drawHeroFinn`). They will drift; trailers/marketing share no brain. | 8 CSS refs |

## 1.3 Root cause — it is only three things

> **R1. Motion is translation, not transformation.** (findings 1–4, 14–16)
> **R2. The character is a single rigid body.** (findings 5–9, 13)
> **R3. Behaviour is random, not intentional.** (findings 11–12, 17)

Every other symptom is downstream. **No tweak fixes R2.** That is the whole point of V3.

---

# §2 · PHASE 2 — WHAT IS FUNDAMENTALLY MISSING

Not "what small tweak," but what the architecture *does not possess*:

1. **A skeleton.** Specified in Character System Doc 3. Never built.
2. **Deformation.** No ability to move a part relative to another.
3. **Secondary dynamics.** No springs → no lag, overshoot, follow-through.
4. **A mind.** No attention, no intention, no state → no reason for any motion.
5. **Desynchronisation.** Nothing guarantees layers never re-align.
6. **One character runtime.** Game, website and hero pose are three codebases.
7. **An asset abstraction.** The renderer is welded to "one PNG," so it dies the day the art improves.

---

# §3 · PHASE 3 — MODULAR RIG FEASIBILITY

## 3.1 Verdict: **current assets cannot support a rig. This is measured, not assumed.**

- Legs **fuse into the body silhouette above 86% height** (only the bottom 14% has separated leg columns).
- Every part **occludes** the body. Removing head/leg/compass leaves an **unpainted hole**; the background is a live chart, so nothing can inpaint it at runtime.
- History confirms it: **build 244** sliced legs from the sheet → they clipped through the compass ("*it looked way better before*"). **Build 232** used a walk-sheet → detached shell. Both **deleted in 254**; the regression gate blocks their return.

**Therefore a rig requires parts authored with their occluded regions painted in** — drawn on-model from `content-assets/finn-canon-poses-A/B.png`.

## 3.2 The minimum art set — 7 pieces. Nothing more.

Each piece must *permanently unlock* capability, or it is not on this list.

| # | Piece | Permanently unlocks |
|---|---|---|
| 1 | **Body/shell** — plastron, sockets & **compass painted complete** | Head + legs can move without holes. Compass lives on the body layer, so legs draw *behind* it and **can never clip it** — build 244's failure fixed by *architecture*, not tuning. |
| 2 | **Head** (with neck stub) | Head turn/tilt/nod, **neck stretch**, the Peek, true look-at, overlapping action |
| 3–6 | **4 legs** (near-front, near-rear, far-front, far-rear; far pair −12%, darker) | True diagonal gait, walk/run, anticipation, landing splay |
| 7 | **Pupils** (sclera stays on the head) | True eye-darts, independent gaze, the eyes-lead-head law |

**Optional, P2:** jetpack (shrug/recoil), tail (follow-through). **Never needed as art:** shadow, flame, particles, eyelids — all code.

## 3.3 This *restores* canon; it does not violate it

The **Animation Bible §2 (RUN)** always specified a **diagonal gait**. The design intent was never wrong — only the *implementation* was. And `finn_canon.md` explicitly leaves the door open: legs may be gaited **in rigged productions after proving it beats static.** V3 + the 7 pieces is exactly that proof path.

---

# §4 · THE V3 ARCHITECTURE

## 4.1 Eight layers

```
  World events ─▶ [L4 BRAIN] ─▶ intents ─▶ [L5 MOTOR] ─▶ joint targets
                      ▲                                      │
                 [L4a ATTENTION]                             ▼
                                                     [L3 DYNAMICS]  springs · lag · overshoot
                                                             │
                                                             ▼
                                                     [L2 POSE SOLVER]
                                                             │
                                                             ▼
                                                     [L1 SKELETON]  (Character System Doc 3)
                                                             │
                                                             ▼
                                                  ┌─ [L0 ASSET PROVIDER] ─┐   ◀── THE KEYSTONE
                                                  │  Monolithic │ Rigged  │
                                                  └───────────┬───────────┘
                                                              ▼
                                               [L6 FX] flame · particles · shadow · dust
                                                              ▼
                                               [L7 COMPOSITOR] z-order · mip · mirror
                                                              ▼
                                                           canvas
```

## 4.2 The keystone: the Asset Provider

**The Brain and Motor must never know whether Finn is 1 PNG or 12 parts.**

- **Monolithic provider (today):** the Pose Solver *collapses* every joint onto the root. Only the root transform and the eyelid overlay are expressible. Everything else (brain, attention, springs, weight, idle) still runs and still improves him.
- **Rigged provider (after the 7 pieces):** joints unbind. Legs gait, head turns, neck stretches, pupils dart, compass swings.
- **Swapping the provider requires zero changes to behaviour code.**

That is the whole reason this is "build once, never solve again." Everything in P0 survives into the rigged era.

## 4.3 Layer contracts

| Layer | Owns | Never touches |
|---|---|---|
| L0 Provider | which pixels are which part | behaviour |
| L1 Skeleton | joints, pivots, limits (Doc 3) | art |
| L2 Pose Solver | joint→transform, collapse in monolithic mode | physics |
| L3 Dynamics | springs, lag, overshoot, follow-through | gameplay |
| L4 Brain | state machine, intention | rendering |
| L4a Attention | salience, targets, priority | gameplay |
| L5 Motor | intent→joint targets, blending | assets |
| L6 FX | flame, particles, shadow | character transform |
| L7 Compositor | draw order, mip, mirror, smoothing | everything above |

---

# §5 · PHASE 7 — WALKING: EVERY OPTION, COMPARED

| Option | Real leg motion? | New art | **Permanent?** | Verdict |
|---|---|---|---|---|
| **A.** Whole-sprite transforms (today) | ✗ | none | partial | insufficient |
| **B.** Weight package (gait arc · squash/stretch · pivot transfer · shear-lag · springs) | ✗ legs, but **kills the "picture" feel** | none | **✅ the rig inherits all of it** | **SHIP — P0** |
| **C.** Bottom-band articulation (14%) | foot twitch only | none | ✗ discarded when rig lands | **REJECT** (measured: legs fuse above 86%) |
| **D.** Mesh/FFD warp of the whole sprite | fake bendy legs; smears the body | none | ✗ | **REJECT** |
| **E.** Slice legs out of `run.png` (build 244 redux) | poor (wrong perspective, clips compass) | derived + body inpaint | ✗ | **REJECT — already failed twice** |
| **F.** **Modular rig on the 7-piece atlas** | ✅ full | 7 pieces | **✅✅ unlocks gait + look-at + neck + eyes + expressions + marketing poses** | **THE ANSWER — P1** |
| **G.** Baked walk-cycle frames (new art) | ✅ walk only | 6–8 frames × states | ⚠ unlocks *only* walking | fallback if the artist can't do layers |

**Recommendation: B now (P0, zero art, zero risk) → F as the permanent architecture (P1, 7 pieces).** Reject C, D, E per the project's own rule: *a temporary workaround is rejected even when cheap.* G is strictly dominated by F at similar art cost.

---

# §6 · WHAT V3 EXPLICITLY REJECTS

- Re-enabling `body.png` + `leg.png` (build 244 rig) — deleted, gated, failed.
- Re-enabling `walk-sheet.png` — old art, deleted, gated.
- Any runtime inpainting / hole-filling over the live chart.
- Any "one more tweak" to the whole-sprite bob.
- A second, divergent animation system for the website.

---

# §7 · CONTRACTS

**Never touches:** physics · hitbox **36×24** · `CFG` · collision · camera · movement-feel constants (coyote 90 ms, buffer 120 ms) · trading · lessons · bosses · save schema · deploy mirror rules.
**Render-only.** Frame budget **≤ 0.8 ms** on a mid phone; zero per-frame allocations (pools).
**Regression gate stays green**; deprecated assets stay deleted.
**Protected system #1 (Finn art/render) is touched** → every phase is approval-gated.

**Canon amendments required before P1 ships** (founder decision, recorded in `finn_canon.md`):
1. *"Legs never animate"* → *"Legs never animate **in monolithic mode**; the rigged provider gaits them per Animation Bible §2, after proving it beats static."*
2. Add the 7-piece part atlas to the approved asset list (separately loaded; **must never gate `FINN_SPRITES.ready`**).

---

*Proposal only. No code, art, gameplay, or canon was modified. Companion docs: `FINN_ANIMATION_SYSTEM.md` (the mind + the motion) and `FINN_IMPLEMENTATION_PLAN.md` (P0/P1/P2, risk, effort).*
