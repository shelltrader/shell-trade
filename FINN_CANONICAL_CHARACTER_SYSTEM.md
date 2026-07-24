# FINN — CANONICAL CHARACTER SYSTEM
### The permanent, highest-authority production specification for Finn, the mascot of ChartQuest

**Status:** PERMANENT · MASTER REFERENCE · Documentation only (no art was created or changed to write this)
**Date locked:** 2026-07-10
**Applies to:** every future Finn asset — game sprites, cinematics, ads, social, website interactions, merch, and any AI-generated image or animation.

---

## 0. How to use this document (authority & precedence)

This file is the **front door** to Finn. It does **not** replace existing canon — it **absorbs and extends** it. Everything already approved stays approved.

**Precedence, on any conflict:**

1. **`docs/canon/finn_canon.md`** (the build-250 *lockdown*) — wins on **which asset/renderer ships** and the **legs-never-animate** implementation reality.
2. **`docs/finn-canon/01-Finn-Character-Bible.md`** — wins on **design intent**: proportions, palette, components, silhouette, mandatory rules.
3. **`docs/finn-canon/02-Finn-Animation-Bible.md`** — wins on the **13 gameplay animation contracts**.
4. **`FINN_SINGLE_SOURCE_OF_TRUTH.md`** — wins on the exact **asset/loader/state inventory**.
5. **This document** — the unifying layer. It restates the above for convenience and adds the **eight missing production systems** (rig, physics, motion language, expression library, idle system, animation principles, do/don't, validation). Where this doc adds detail, it must never contradict 1–4; if it ever appears to, 1–4 win and this doc is corrected.

> **The one rule that outranks everything:** *Finn is the PNG.* Every shipping frame is a whole-sprite bitmap drawn by `drawFinnSprite`; in-game animation is **transforms + frame selection only**. **Legs never animate in the shipping product.** The systems below (rig, gait, secondary motion) define the **canonical logical model** any *future rigged* production (Pixar, Spine, After Effects, 3D) must obey — they are the target for high-end animation, not a license to re-dissect the game sprite.

---

## GAP ANALYSIS — what canon already locks vs. what this document adds

| Domain | Already canon (preserved verbatim) | Source | Added here |
|---|---|---|---|
| Identity, silhouette, mandatory rules | ✅ Fully locked | Bible §1,§3,§5 | Restated; nothing changed |
| Proportions & measurement frame | ✅ Fully locked (SD, ratios, hitbox) | Bible §2–3 | Restated + **perspective/scale rules** |
| Component geometry | ✅ Locked (shell, head, legs, tail, compass, jetpack, glasses) | Bible §4 | **Per-part motion/rotation/translation limits & neighbor relationships** (Doc 2) |
| Palette & materials | ✅ Palette locked | Bible §6 | **Material/lighting/shading/texture definitions** (Doc 1) |
| 13 gameplay animations | ✅ Locked | Anim Bible | Restated as reference; not re-opened |
| Legs-don't-animate lockdown | ✅ Locked | finn_canon.md | Reconciled with the rig/gait model (Doc 3) |
| **Logical rig / joint hierarchy** | ❌ Not documented | — | **NEW — Doc 3** |
| **Movement physics model** | ⚠️ Partial (gameplay feel constants) | Feel Patch V1 | **NEW — Doc 4** |
| **Motion language ("how Finn thinks")** | ❌ Not documented | — | **NEW — Doc 5** |
| **ChartQuest expression library** | ⚠️ Only `happy`/`worried` | Anim Bible | **NEW — 15 emotions, Doc 6** |
| **Idle system (A–E)** | ⚠️ One idle | Anim Bible §1 | **NEW — 5 layered idles, Doc 7** |
| **Immutable animation principles** | ⚠️ Scattered | various | **NEW — consolidated, Doc 8** |
| **Do/Don't w/ real failure cases** | ⚠️ Scattered | finn_canon §3, 00-Inconsistencies | **NEW — grounded in real regressions, Doc 9** |
| **Master validation checklist** | ❌ Not documented | — | **NEW — Doc 10** |

**Two structural clarifications this document makes permanent (both prevent historical drift):**

- **Finn has NO arms and NO hands.** He is a quadruped. The **front leg pair** performs any "gesture" (the victory cheer-lift). Drawing arms/hands is **humanoid drift** — a hard canon violation. Wherever a generic character template says "arms/hands," read **front legs**.
- **Finn has NO discrete eyebrows.** Brow emotion is carried by the **upper-eyelid angle** + **pupil position** + **mouth**. Adding drawn eyebrows invents a new body shape and is forbidden. Wherever a template says "eyebrows," read **upper-lid brow-line**.

---

# DOCUMENT 1 — CANONICAL CHARACTER CONSTRUCTION MANUAL
*An engineering blueprint. All linear values in authoring units (u); the drawing space is 46u × 30u, feet-anchored. **Shell Diameter (SD) ≈ 37.5u is the master unit.***

### 1.1 Overall dimensions
| Measure | Value | Rule |
|---|---|---|
| Authoring frame | 46u × 30u | Design space (`drawTurtle` coordinate space) |
| Collision hitbox | **36px × 24px** | Physics — **NEVER changes**, in any product |
| Fit scale `s` | `hitbox.w / 46` ≈ **0.783** @ default | Art shrunk to hitbox |
| Hero presence scale `VIS` | **1.35** | Art drawn 35% larger than hitbox |
| SD (master unit) | **≈ 37.5u** (≈ 40px @ phone default) | All ratios derive from SD |
| Total standing height | ≈ **56u** (1.5 × SD) | Crown of head → soles |
| Total standing width | ≈ **76u** (2.0 × SD) | Jetpack tail → nose tip |

### 1.2 Relative proportions (the identity math — immutable)
| Relationship | Canonical ratio |
|---|---|
| **Head : Shell** | **1.25 : 1** (head Ø ≈ 47u, shell ≈ 37.5u) — the chibi "student" signature; the head is the dominant read |
| Shell : hitbox width | ~1.04 : 1 (shell ≈ silhouette anchor) |
| Shell width : height | ~1 : 1.01 (near-circular dome — bubbly, never military) |
| Each front leg : SD | ~0.29 : 1 (11u wide) |
| Rear legs | **12% smaller** than front, **darker green**, 2u higher, drawn behind |
| Compass : SD | ~0.24 : 1 (medallion Ø ≈ 9u) |
| Jetpack : SD | 0.16w × 0.30h (canister 6u × 11u) |

### 1.3 Head, eyes, jetpack, glasses — placement (head-local unless noted)
- **Head:** Ø ≈ 47u (r 23.5), rest-center ≈ (47.4, 3.9)u, sits **up & forward** on the shell so the face is never swallowed.
- **Eye spacing:** two eyes, **rx 5.3 × ry 5.6u**, centers at head-local **(−2.5, −5)** and **(13, −5)** → **inter-pupil ≈ 15.5u**. White sclera + single specular dot.
- **Pupil:** dark, sized ~55–65% of the sclera; **overshoots the look direction** (leads the eye) — this is the charm signature; do not center pupils rigidly.
- **Jetpack placement:** canister 6u × 11u at x −5→1, y 1→12u — **high on the rear** of the shell, **nozzle pointing straight down**, two short straps nipping the shell rim.
- **Compass placement:** medallion Ø ≈ 9u at ≈ (24, 22)u on the **plastron front**, gold chain arcing to the neck base.
- **Glasses (progression cosmetic only):** round frame over both eyes, thick near-black rim, cyan lens; **not part of the base silhouette**; unlocked at `bossesEverCount() >= 2` and then **worn permanently**.

### 1.4 Color palette (single source of truth — from `COLOR` in `chart-quest.html`)
| Token | Hex | Role |
|---|---|---|
| `turtleBody` | `#7ED957` | Green body — head, legs, tail, neck |
| `turtleBodyShadow` | `#57A83A` | Darker green — rear (far) leg pair |
| `turtleShell` | `#F0862C` | **ORANGE hero shell — the signature color** |
| `turtleShellHi` | `#FFC46B` | Amber shell gloss highlight |
| `turtleShellShadow` | `#B5561A` | Burnt-orange scute shadow |
| `turtleShellRim` | `#FFD79A` | Bright amber rim / edge light |
| `turtleOutline` | `#7A3A12` | Deep brown-orange outline (and mouth line) |
| `turtleBelly` | `#ECDCA0` | Pale-cream plastron band |
| `compassGold` | `#FFD54A` | Necklace ring + chain |
| `compassFace` | `#FBF3D8` | Necklace face |
| `compassNeedle` | `#E5432E` | Necklace N-needle |
| `jetpackBody` | `#6B7280` | Gunmetal pack body |
| `jetpackDark` | `#3A414B` | Cap / nozzle / shading |
| `jetpackStrap` | `#2A2F38` | Straps |
| `flameOuter` | `#FF9F43` | Orange flame body |
| `flameInner` | `#FFD27A` | Warm inner flame |
| `engineGlow` | `#FFB020` | Warm amber thruster glow (**flame is orange→yellow, NEVER blue**) |
| `lens` / `lensShine` | `#48A7C7` / `#BFEAFF` | Glasses lens + glint (progression) |

### 1.5 Material definitions
- **Body (green):** soft matte rubber/skin. One broad soft-light gradient top-left → shadow bottom-right. No specular except the eye dots. Never glossy/wet.
- **Shell (orange):** semi-gloss ceramic/toy plastic. Hex scute pattern in low contrast; ONE amber gloss bubble top-left + a rim light across the top edge. Reads as a friendly shell — **never metal, never armor plating**.
- **Plastron (cream):** matte, slightly lighter than body, full-width band 5u tall along the shell base.
- **Jetpack (gunmetal):** brushed metal — one soft vertical highlight, dark cap & nozzle. Simple on purpose so the shell out-reads it. **No gold trim, no status LED.**
- **Compass (gold):** polished metal ring, cream face, red needle. Small, jewel-like.
- **Flame:** additive/screen-blend, orange→yellow→white-hot core, warm glow. Soft-edged, flickering.

### 1.6 Silhouette rules
- Read as **three left-to-right masses: jetpack → shell (with necklace + legs) → head.**
- **Low, rounded, wider than tall.** The silhouette must be recognizable as Finn **in pure black at 40–90px**, over both green (`#16C784`) and red (`#EA3943`) candles.
- The **big round head + round shell + down-nozzle jetpack** is the identity read. If a silhouette test fails, the pose is wrong.

### 1.7 Perspective, lighting, shading, texture, scale rules
- **Perspective:** Finn is drawn in a **¾ side view, facing right**, near-orthographic (slight, consistent lens). No dramatic foreshortening, no worm's/bird's-eye hero angles that distort the head:shell ratio. Cinematics may orbit, but the **1.25:1 head:shell and the 3-mass silhouette must hold at every frame.**
- **Lighting:** single **key light upper-left**, warm; soft ambient fill; gentle contact shadow under the feet. Consistent across all assets so Finn never looks lit from a new direction shot-to-shot.
- **Shading:** cel / soft-cel — **2–3 tones per material max** (base + one shadow + one highlight/rim). No painterly rendering, no heavy gradients, no outlines other than the canon `turtleOutline` family.
- **Texture:** essentially flat. Only the shell carries pattern (hex scutes, low contrast). No skin pores, scales-detail, fabric, or noise. Keep it toy-clean.
- **Scale rules:** at **≤ 90px** drop micro-detail (scute dividers, gloss bubble) before you ever thin the outline or shrink the head — **readability of the 3 masses beats detail**. Never render Finn below the size where both eyes + compass + jetpack read.

### 1.8 Forbidden changes — what must NEVER change (see Doc 9 for the full rulebook)
Head:shell ratio · the orange shell · the green body · the gold compass · the gunmetal jetpack · the quadruped stance · faces-right default · the 36×24 hitbox · orange→yellow flame (never blue) · the 3-mass silhouette.

---

# DOCUMENT 2 — ANATOMICAL CONSTRUCTION GUIDE
*Every part: purpose · shape · volume · movement · rotation / translation / scale limits · relationship to neighbors. Limits are the animation envelope; exceeding them is drift.*

### Shell (the anchor)
- **Purpose:** silhouette anchor, home of the jetpack/compass, the "ball" for spin/tuck.
- **Shape / volume:** near-circular hexagonal dome (37.3u × 37.8u) + cream plastron band. Solid, bubbly.
- **Rotation:** 0° in all open poses; free 360° **only** as the tucked/spun ball.
- **Translation:** it is the body core — everything else hangs off it; it translates with ROOT only.
- **Scale:** fixed. Squash allowed **≤ ±10%** (landing/impact), always volume-preserving, never permanent.
- **Neighbors:** parent of jetpack, compass, neck; legs overlap its lower edge.

### Neck (mostly hidden)
- **Purpose:** lets the head crane for "life" (curious peek, landing dip).
- **Shape/volume:** short green column, **hidden at rest** (head sits on shell).
- **Rotation:** ±12° tilt. **Translation:** extends **0 → ~6u** forward/up on the curious peek; compresses on landing.
- **Scale:** length only, within the extension range.
- **Neighbors:** child of shell, parent of head. Never long enough to read as a giraffe/humanoid.

### Head (the star)
- **Purpose:** the dominant read and the emotional instrument.
- **Shape/volume:** Ø 47u ball, sits up-forward.
- **Rotation:** tilt **±15°**; 3D glance yaw **≤ 25°** (idle look-around). **Translation:** rides the neck (≤6u). **Scale:** **fixed — the head never resizes** (historical drift #5). Breathing is body-driven, not head-scale.
- **Neighbors:** child of neck; carries eyes, pupils, lids, mouth, glasses.

### Eyes / Pupils / Eyelids
- **Eyes:** rx 5.3 × ry 5.6u, spacing ~15.5u, white sclera + specular dot. Scale fixed.
- **Pupils:** dark, **lead the look direction** (overshoot), travel within the sclera; never touch the rim hard.
- **Eyelids (upper = the "brow-line"):** close top-down for blink (`ry → ~15%`) over ~0.12s; the **upper-lid angle carries brow emotion** (angry = inner-down, sad/worried = inner-up, surprised = fully open). **There are no separate eyebrows.**
- **Neighbors:** eyes move **first**, before head, before body (Doc 8).

### Mouth
- **Purpose:** primary valence signal.
- **Shape:** a single friendly curved line. Flattens to a small worried arc (`worried`), opens small for surprise/cheer.
- **Limits:** subtle — Finn is understated (a calm student, "allergic to FOMO"). No wide cartoon gape except victory.

### Glasses (progression)
- **Purpose:** mastery cosmetic. **Rotation/translation:** ride the head exactly; `adjustT` gives a small **push-up** on victory. Lens height follows the eyelid during blink. Once unlocked, present every subsequent frame.

### Legs — EXACTLY FOUR (quadruped, mandatory)
- **Purpose:** stance, gait read, the only "gesture" limbs (front pair). **There are no arms.**
- **Shape/volume:** front pair 11u × 9.5u rounded capsules (x ≈ 13.8, 25.6u), over the shell edge; rear pair 9.5u × 8u, **12% smaller, darker green (`turtleBodyShadow`), 2u higher, behind**, counter-phase.
- **Rotation/translation (design intent):** diagonal gait, feet stretch **±2.2u**; gather+extend on jump; draw inward on boost; splay on fall/land. **Retract inside the ball ONLY for tuck/spin.**
- **⚠️ Shipping reality (lockdown):** in the game the legs are **baked static into `run.png` and DO NOT animate** — life comes from body-rock. The gait spec above is the **design intent for future rigged productions**; it must beat static legs in a side-by-side before use (build-244's rig did not — it overlapped the compass and was rejected).
- **Limits:** always 4, always visible in open poses, **never a 5th limb**, never re-posed into arms/hands.

### Tail (small nub)
- **Shape:** ~7u green triangle, lower-rear. Present in every open pose; inside the ball for tuck/spin. Subtle bounce only.

### Compass necklace (mandatory identity)
- **Rotation/translation:** rests flat; **swings a few degrees** under strong vertical acceleration (boost/land), then settles. **Never removed or restyled**; occluded **only** inside the tucked ball.
- **Neighbors:** hangs from neck base to plastron; chain is the constraint.

### Jetpack + Nozzle + Flame (mandatory equipment)
- **Jetpack:** fixed to the shell rear; may **shrug ≤ 3°** with big impulses. Always mounted.
- **Nozzle:** points **straight down** — thrust is **vertical, never diagonal** (resolved drift #3).
- **Flame:** idle pilot 4–6u; jump burst 8–12u; boost column **20–25u** (double-boost largest). Orange→yellow→white-hot. Scales with `flameT`. **Never blue.**

---

# DOCUMENT 3 — RIG SPECIFICATION (logical rig — documented, not built)
*The canonical joint hierarchy any **rigged** Finn (Spine/AE puppet/3D) must use. The shipping web game deliberately uses **no rig** — it draws one whole PNG per state and animates by transform + frame-swap. This spec exists so a high-end production stays on-model. Pivots in authoring units, feet-anchored.*

```
ROOT  (feet-anchor / world transform)               pivot: (23, 30) between the feet
 └─ SHELL  (body core / center of gravity)           pivot: shell center ≈ (16, 8)
     ├─ NECK                                          pivot: shell-front top ≈ (30, 2)
     │   └─ HEAD                                      pivot: head base ≈ (40, 12)
     │       ├─ EYE.L / EYE.R                         pivot: each eye center
     │       │   └─ PUPIL.L / PUPIL.R                 pivot: eye center (offset-driven)
     │       ├─ EYELID.L / EYELID.R  (brow-line)      pivot: eye top edge
     │       └─ GLASSES  (progression; parented to HEAD)  pivot: bridge between eyes
     ├─ JETPACK                                       pivot: strap mount on shell rear ≈ (-2, 6)
     │   └─ NOZZLE (down) └─ FLAME (fx)               pivot: nozzle mouth (bottom of canister)
     ├─ COMPASS  (chain-constrained to neck base)     pivot: chain top ≈ (24, 14)
     ├─ LEG.FRONT.NEAR / LEG.FRONT.FAR                pivot: hip at shell lower edge
     ├─ LEG.REAR.NEAR / LEG.REAR.FAR (12% smaller)    pivot: hip, 2u higher, behind
     └─ TAIL                                          pivot: lower-rear shell base ≈ (2, 26)
```

| Node | Parent | Children | Pivot | Rotation | Translation | Scale | Constraints | Animation ownership |
|---|---|---|---|---|---|---|---|---|
| ROOT | — | Shell | between feet | world only | world | 1.0 (uniform for zoom) | never non-uniform | world / camera |
| Shell | ROOT | jetpack, compass, neck, 4 legs, tail | shell center | 0° open; 360° ball only | with ROOT | squash ≤ ±10% (volume-preserving) | ball-mode gate | body-rock, squash |
| Neck | Shell | Head | shell-front top | ±12° | extend 0→6u | length only | hidden at rest | curious-peek, land-dip |
| Head | Neck | eyes, lids, glasses | head base | tilt ±15°, yaw ≤25° | rides neck | **locked** | never resize | look, tilt, glance |
| Eye.L/R | Head | Pupil, Eyelid | eye center | — | — | locked | — | blink, widen |
| Pupil.L/R | Eye | — | eye center | — | overshoot look dir | 0.9–1.1 (dilation) | stay off rim | look target |
| Eyelid.L/R | Eye | — | eye top | brow-line angle | — | ry→15% blink | mirror per eye | blink, brow emotion |
| Glasses | Head | — | bridge | with head | with head | push-up (victory) | only when unlocked | cosmetic |
| Jetpack | Shell | Nozzle→Flame | strap mount | shrug ≤3° | with shell | fixed | always mounted | shrug, flame |
| Flame | Nozzle | — | nozzle mouth | vertical only | — | length 4→25u | never blue, never sideways | `flameT` |
| Compass | Shell | — | chain top | swing ≤ a few° | pendulum | fixed | chain constraint; never remove | inertia swing |
| Leg.Front.N/F | Shell | — | hip | gait (intent) | ±2.2u (intent) | front=1.0 | **static in game** | gait *(rigged only)* |
| Leg.Rear.N/F | Shell | — | hip (2u higher) | counter-phase | ±2.2u | **0.88** (12% smaller) | darker green, behind | gait *(rigged only)* |
| Tail | Shell | — | lower-rear | subtle | subtle | fixed | inside ball for tuck | secondary bounce |

**Rig invariants:** ROOT scale is **uniform only** (never squash the whole character non-uniformly). The **head node scale is locked**. The **4 leg nodes are never deleted** (retract inside the ball geometrically). The compass and jetpack nodes are **never disabled**. A rig that can produce a 5th limb, an upright spine, or a resized head is **mis-built**.

---

# DOCUMENT 4 — MOVEMENT PHYSICS
*How Finn moves. Two contexts: **GAMEPLAY** (hard constraints — do not violate) and **MASCOT/CINEMATIC** (expressive, for ads & film).*

### 4.1 Hard gameplay constraints (from Task 5 / lockdown — never contradicted)
- **No hover. No free-flight. No fuel meter.** Boost is a **discrete two-tap** system.
- Jump and boost both **fire the jetpack** (Finn always uses the pack to leave the ground).
- Frame pacing uses **EMA-smoothed `dt`** (build 234) — never raw rAF dt into world scroll.
- Feel constants (Movement Feel Patch V1): **coyote 90ms**, **jump-buffer 120ms**, **60ms tap-timer**, **render-only landing squash**. These are the canonical "feel" — changing them changes Finn's weight.

### 4.2 Weight & balance
- Finn is a **small, dense, round** creature — think **a heavy toy, ~pumpkin-sized**. He settles with weight; he does not float like a balloon.
- Balance point is the **shell center (COG)**, low and forward-of-feet-center. He is bottom-heavy → always wants to return to the planted quadruped rest.

### 4.3 Momentum & inertia
- **Shell inertia:** the shell leads; head + compass + tail **lag one beat** and settle (follow-through).
- Direction changes carry a brief overshoot then a settle — never instant snapping.

### 4.4 Locomotion
- **Walking/running (grounded):** leg-driven (intent) / **body-rock-driven (shipping)** — a 1–3px vertical bob, tiny forward micro-lean, in-phase micro-squash. Speed reads through rock amplitude + speed lines, **not** faster leg-swing (legs are static in game).
- **Jumping:** anticipation gather → jetpack puff (`flameT 0.18`) → **+6–10° nose-up** rise → smooth ease to **−6 to −14° nose-down** through apex/fall. Never a frame snap at apex.
- **Boost:** **+8–12° nose-up max — stays quadrupedal, never rotates upright.** Thrust reads through a **20–25u vertical flame** + speed lines. Reduced-gravity hang, then falls.
- **Landing:** feet-anchored **squash 0→1→0 over 0.22s**, neck/head dip then recover, small dust puff. Render-only — never alters physics.
- **Turning:** eyes lead → head yaw → whole-sprite **mirror** on `dir < 0` (never a redraw); a brief anticipation lean before the flip.
- **Looking:** eyes move first, then head tilt/yaw (≤25°), neck may extend on a curious peek.

### 4.5 Hover / jetpack stabilization (MASCOT/CINEMATIC ONLY)
- In film/ads Finn **may hover** as mood art (the Bible flags hover frames as "mood only"). When he does: a **subtle 2-axis bob** (breathe up/down ~2–4u, micro side-drift), **jetpack micro-corrections** (tiny counter-thrust puffs + ≤3° pack shrug to "hold station"), compass pendulum, legs **draw slightly in and paddle-idle**, tail streams. Still quadrupedal, still nose-level.
- **Hard line:** hover **never appears in gameplay** and never implies fuel/flight mechanics. Marketing hover must still pass every silhouette/anatomy rule.

### 4.6 Breathing, idle sway, secondary motion
- **Breathing:** continuous 1–3px body bob, slow sinusoid — the "never lifeless" baseline (Doc 7).
- **Idle sway:** ±1.4° weight-shift lean.
- **Secondary motion (always on):** compass swing, tail bounce, flame flicker, glasses micro-settle, head follow-through. These are what make Finn feel alive; they run under every state.

---

# DOCUMENT 5 — MOTION LANGUAGE (the acting bible — the most important document)
*How Finn **thinks through movement**. Finn is a calm, curious student-scientist of the market — "slow & steady," "allergic to FOMO," protective of his shell. He observes before he acts. Every beat below is **eyes → head → body** ordered (Doc 8). Timings are guides, not metronomes.*

**Reusable micro-beats (the vocabulary):**
- **The Peek:** neck cranes out ~6u, look L→R→up, tiny smile, settle. (Curiosity signature; the idle already uses it ~every 11s.)
- **The Read:** eyes scan across (as if along a chart), a small confirming **nod**, blink.
- **The Settle:** after any big motion, one beat of overshoot then rest — never a hard stop.
- **The Shell-Check:** under threat/surprise, a fast micro-tuck of the head toward the shell, then re-emerge (protective instinct, never a full tuck unless diving).

**Emotional → physical scripts:**

- **Curious:** Eyes dart to target *first* → neck extends → head tilts 8–12° → **pause (hold)** → blink → return. *(Never lead with the body.)*
- **Thinking:** Eyes scan slowly L→R (the Read) → tiny nod → single blink → micro-smile → continue. Body near-still, breathing only.
- **Confused:** Head tilt one way → **double-blink** → look left → look right → tiny shell-shrug (jetpack ≤3° shrug, no arms) → settle.
- **Focused / locked-in (waiting for a setup):** Eyes narrow (upper lids lower slightly) → head steadies dead-level → breathing slows → compass stills → total stillness except a slow blink. *Calm intensity.*
- **Cautious (avoiding FOMO):** Eyes flick to the tempting move → a **held beat** → a small head-shake "no" → shell-check → resets to level. This is Finn's core virtue made physical — **restraint reads as a deliberate non-action, not passivity.**
- **Delighted (a win):** Eyes widen → mouth opens to a smile → a **small hop** (front legs lift — *never a biped stand*) → jetpack celebratory puff → settle with a happy bob.
- **Determined (a dive/commitment):** Eyes set forward → brow-line lowers → head pulls toward shell → gather → commit. Weight before speed.
- **Recovering (after a loss/hit):** Recoil back ~−8° → worried mouth → a beat of stillness → a slow breath → head lifts back to level → small resolute nod. **Finn always recovers his composure** — he never stays defeated.

**Cadence rule:** Finn's default tempo is **unhurried**. Snappy, twitchy motion is off-character (that's FOMO energy). Speed is earned by moments (a win hop, a boost), then he returns to calm.

---

# DOCUMENT 6 — EXPRESSION LIBRARY (ChartQuest emotions)
*Not generic moods — the emotional beats of learning to trade. Each defines: **Eyes · Brow-line · Mouth · Neck · Shell · Jetpack · Body posture.** All stay inside the anatomy limits (Doc 2). `shellEmotion` currently ships `happy`/`worried`; this library is the target set for cinematics/marketing and future in-game states.*

| Expression | Eyes | Brow-line | Mouth | Neck | Shell | Jetpack | Posture |
|---|---|---|---|---|---|---|---|
| **Waiting for setup** | narrowed, steady, scanning slowly | slightly lowered, even | flat-calm | at rest | still | idle pilot | dead-level, patient, breathing slow |
| **Spotting a breakout** | pop wide, pupils lead up-right | raised (open) | small "oh!" then grin | cranes forward | settled | pilot flick | leans in, weight forward |
| **Avoiding FOMO** | flick to temptation, then away | one lid quirks | small pressed line / tiny head-shake | slight pull-back | shell-check | idle | holds ground, restrained |
| **Learning (a-ha)** | up-left then a lock | rises | opens to a soft smile | small nod | still | pilot | tiny confirming nod, calm |
| **Reading charts** | tracking L→R, deliberate | even | neutral-focused | subtle follow | still | idle | steady, scholarly |
| **Celebrating** | bright, wide | high | open smile | up | perky | celebratory puff | front-legs hop (still quad) |
| **Winning (boss cleared)** | sparkle, up | high | big smile | up-proud | perky, gloss catch | warm burst | cheer-hop, glasses push-up |
| **Recovering** | soft, blinking back | inner-up (worried→easing) | worried arc → easing | dips then lifts | slight tuck → out | sputter → idle | recoil → slow breath → level |
| **Losing (a trade)** | down briefly, not crushed | inner-up | small worried arc | lowers | protective lean | idle | −8° recoil, one beat, then resolve |
| **Teaching** | warm, to the "camera"/player | relaxed | gentle open smile | slight extend | open | idle | welcoming, front-leg gesture (not an arm) |
| **Boss introduction** | steady, brave; a swallow | set, level | firm line | pulls in a touch (shell-check) | squares up | pilot, ready | grounded, feet planted, facing the threat |
| **Boss victory** | triumphant, bright | high | big open smile | up | gloss highlight | celebratory puff + sparkle | cheer-hop, chest (compass) forward |
| **Level complete** | content, satisfied | relaxed | easy smile | at rest | settled | idle pilot | happy bob, small nod to player |
| **Player mistake (gentle)** | to player, kind, not scolding | slightly raised (empathetic) | soft "hmm" smile | tilt | still | idle | encouraging tilt — **never angry/mocking** |
| **Educational default (idle presence)** | alive, occasional dart | even | faint friendly smile | at rest | breathing | pilot flicker | the Doc 7 idle system |

**Tone guard:** Finn is a **kind mentor**, never smug, never punishing. On player error he is **empathetic and encouraging** — this protects the educational trust that the whole product depends on.

---

# DOCUMENT 7 — IDLE SYSTEM (Finn must never look lifeless)
*Five layered idles that blend + randomize so 30 seconds never looks like a loop. All run over the **breathing baseline** (1–3px body bob) + **secondary motion** (compass, tail, flame flicker) that never stop.*

| Idle | Feel | Breathing | Blink | Eye darts | Micro-posture | Jetpack | Neck / Shell | Timing |
|---|---|---|---|---|---|---|---|---|
| **A · Baseline breathe** | calm rest | 1–3px slow sinusoid | single, ~2.4–4s, non-metronomic | rare, small | ±1.4° weight-shift | idle pilot flicker | none / gentle | continuous under all idles |
| **B · Curious peek** | inquisitive | continues | **double-blink** | look L→R→up | neck cranes ~6u, tiny smile | pilot | neck extends then settles | ~every 11s (jittered ±3s) |
| **C · Weight shift** | "standing around" | continues | single | slow drift to one side | lean ±1.4°, subtle rock | idle | shell settles | ~6–9s |
| **D · Jetpack correction** | alive equipment | continues | none | steady | tiny bob from a **micro-puff** | brief pilot flare + ≤3° shrug | — | ~8–14s, rare |
| **E · Chart-egg glance** | personality wink | continues | single | glances at a passing candle/player, small approving nod | micro nod | pilot | slight head turn (yaw ≤25°) | rare (~15–25s), the "delight" beat |

**Randomization & transition rules:**
- **A always runs.** B–E are **overlays** chosen by a weighted random timer, **never two at once**, with a **minimum 2s gap** so beats don't collide.
- Each overlay **eases in and out** (no pop) and **returns to A**.
- **Jitter every interval ±20–30%** so cadence is never predictable.
- Seed timers with `animT + seed` (matches the shipping blink driver) so two Finns on one screen don't sync.
- **Goal test:** a viewer watching 30s must never see the exact same beat twice back-to-back, and Finn must never hold a frozen frame for more than one breath.

---

# DOCUMENT 8 — ANIMATION PRINCIPLES (immutable)
1. **Never perfectly still.** Breathing + secondary motion run under every state.
2. **Eyes move before head; head moves before body.** Always. This single rule creates most of Finn's "thought."
3. **Anticipation before action** — a gather before a jump, a look before a turn.
4. **Ease in / ease out** — no linear moves; no hard stops (always a Settle).
5. **Secondary motion & follow-through** — compass, tail, head, glasses lag and settle one beat after the shell.
6. **Weight before speed** — sell mass first; Finn is dense and unhurried. Snappiness is off-character except earned moments.
7. **Readable silhouette every frame** — the 3-mass read (jetpack→shell→head) must survive as a black shape.
8. **Slow-in on stillness** — Finn holds calm; restraint is characterization (anti-FOMO).
9. **Blink is life, not a metronome** — random 2.4–4s, ~0.12s, double-blink on the peek.
10. **Legs don't animate in-game** — motion comes from body-rock; only rigged productions may gait the legs, and only within the diagonal-gait intent after proving it beats static.
11. **Proportions are frozen** — the head never resizes, the head:shell 1.25:1 never drifts, the hitbox never changes.
12. **No new shapes** — never invent arms, hands, eyebrows, a 5th limb, or an upright spine.

---

# DOCUMENT 9 — DO / DON'T GUIDE (grounded in real ChartQuest regressions)
*Every DON'T below is a failure that actually happened in this project (builds 226→250) or a resolved sheet inconsistency. This section exists to stop them recurring.*

### DO
- **Do** keep Finn quadrupedal, low, wider-than-tall, facing right.
- **Do** keep the orange shell, green body, gold compass, gunmetal jetpack in **every** open pose.
- **Do** animate with **whole-sprite transforms + frame selection** in-game.
- **Do** give life via **body-rock, breathing, secondary motion, and the idle system** — not leg-swing.
- **Do** keep flame **orange→yellow→white**, vertical, scaling with `flameT`.
- **Do** verify every animation **in the browser at real device scale** (visible preview), never by formula.
- **Do** run the **silhouette-in-black** and **head:shell = 1.25:1** checks on every new asset.
- **Do** treat player-error expressions as **kind and encouraging**.

### DON'T (each = a real failure)
- **Don't** make Finn humanoid or stand upright. *(Recurring drift; boost frame #5 nearly read biped — resolved to nose-up ≤12°, stay quad.)*
- **Don't** add arms, hands, eyebrows, or a **5th limb**. *(Sheet asserted "no extra leg" because frames drifted.)*
- **Don't** re-enable the **procedural leg rig** (`body.png`+`leg.png`) — legs overlap the compass; founder: *"legs are still bad… it looked way better before."*
- **Don't** use the **walk-sheet** (`walk-sheet.png`) — old art, renders as **detached shell / closed green eyes** in-game.
- **Don't** gate rendering on "is a deprecated asset loaded" — it silently **re-enables** the dead rig (the reactivation trap).
- **Don't** resize the head between poses. *(Head-size variance, drift #5.)*
- **Don't** vary shell roundness in open poses (true circle only in the ball). *(Drift #6.)*
- **Don't** drop or restyle the compass. *(It vanished in run/dive/fall/boost frames — drift #7; it must ALWAYS be present.)*
- **Don't** make the flame blue, or thrust diagonally. *(Drift #3 — vertical, orange→yellow only.)*
- **Don't** imply hover/fuel/flight in gameplay. *(Out-of-scope mood art only — drift #4.)*
- **Don't** render the shell any non-orange hero color, or the body non-green.
- **Don't** change the **36×24 hitbox** — ever.
- **Don't** "fix" code to match the stale Bible line that says the procedural `drawTurtle` is the renderer of record — **the shipping renderer is `drawFinnSprite` with `run.png`.**

### Classic AI-generation failure modes to catch
Over-detailed painterly rendering · realistic turtle instead of chibi toy · shell as armor/metal · human-proportioned upright body · two legs instead of four · a tiny head (loses the student read) · added eyebrows/teeth/tongue · gold-trimmed sci-fi jetpack · blue rocket flame · compass omitted · glasses on before unlock (or gone after unlock).

---

# DOCUMENT 10 — MASTER VALIDATION CHECKLIST
*Every future Finn asset (art, animation, cinematic, ad, AI-gen, merch) must pass **all** of these to become canon. Any single ✗ = not canon, do not ship.*

**Instant recognition**
- ☐ Recognizable as Finn in **under 1 second**?
- ☐ Silhouette-in-black reads the **3 masses** (jetpack → shell → head) at 40–90px?

**Proportions & anatomy**
- ☐ Head : Shell = **1.25 : 1** (head did not shrink or balloon)?
- ☐ Shell size/roundness on-model (near-circle in open poses; true circle only as ball)?
- ☐ **Exactly 4 legs**, quadruped, low stance — **no arms, no hands, no 5th limb, no upright spine**?
- ☐ **No eyebrows**, no invented shapes; brow emotion via upper-lid + pupil only?
- ☐ Neck natural (hidden at rest; extends only for peek/land, no giraffe)?
- ☐ Eyes spacing/pupil-overshoot on-model; both eyes read?

**Mandatory identity items**
- ☐ Orange shell? Green body? **Gold compass present**? **Gunmetal jetpack present, nozzle down**?
- ☐ Flame (if lit) orange→yellow→white and **vertical** (never blue/diagonal)?
- ☐ Faces right (or is a clean mirror)? Glasses correct for progression state?

**Color & render**
- ☐ Palette matches the canon tokens (no off-brand greens/oranges)?
- ☐ Cel/soft-cel, 2–3 tones per material, single upper-left key light — consistent with prior assets?

**Motion (for animation)**
- ☐ **Never perfectly still** — breathing + secondary motion present?
- ☐ **Eyes before head, head before body**? Anticipation + ease + follow-through?
- ☐ Legs static (in-game) / or gaited only within diagonal-gait intent and proven to beat static?
- ☐ Weight/mass sells before speed; tempo calm/unhurried; no FOMO twitch?
- ☐ Hitbox 36×24 untouched (gameplay)? Verified **in browser at device scale**?

**Character & tone**
- ☐ Reads as the **kind, curious, disciplined student-mentor** (never smug/punishing)?
- ☐ Would an **animation director** approve this take?
- ☐ **Consistent with every previous Finn asset** (no drift from the shipping look)?

---

## FINAL QUESTION — the Pixar test

**Could Pixar's Lead Character Animator animate Finn consistently for the next five years using only this documentation?**

**YES.** Here is why the answer is yes, not "good enough":

1. **He is fully constructed, not described.** Doc 1–2 give exact units, ratios, the master unit (SD), pivots, material and lighting laws — an animator can *build* Finn from scratch and land on-model, not approximate him.
2. **He has a rig.** Doc 3 hands any pipeline (Spine, AE, 3D) a complete joint hierarchy with pivots, limits, constraints, and ownership — and reconciles it with the shipping "no-rig PNG" reality so no one re-introduces the leg regressions.
3. **He has physics and a body.** Doc 4 defines weight, momentum, inertia, hover-for-film-only, and the hard gameplay lines — so his mass feels identical whether he's in a level or a 30-second ad.
4. **He can act.** Doc 5–6 are the difference between a mascot and a character: a motion language ("eyes → head → body," the Peek, the Read, restraint-as-character) and 15 ChartQuest-specific emotions, each specified part-by-part.
5. **He is alive at rest.** Doc 7's five randomized, non-syncing idles guarantee the "never lifeless" bar.
6. **He cannot drift.** Doc 8–10 encode immutable principles, a DON'T list built from the project's *actual* failures, and a pass/fail gate — so five different animators over five years converge on **one Finn**.
7. **It protects, not replaces, canon.** Every locked decision (proportions, palette, the PNG-is-Finn lockdown, legs-don't-animate, the 36×24 hitbox) is carried forward intact, with clear precedence — so this system is additive and permanent.

The only things a future animator still needs from a *human* are **taste and performance** — the judgment calls this document deliberately leaves open (comic timing on a specific gag, staging a specific shot). Everything about **who Finn is and what he may never become** is now fixed on the page.

---

*This document is documentation only. No artwork was created, no sprite generated, no animation built, no existing design modified. It extends the Finn canon; it does not replace it. On any conflict, the precedence in §0 governs.*
