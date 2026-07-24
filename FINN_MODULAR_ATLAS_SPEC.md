# FINN — MODULAR ANIMATION ATLAS SPECIFICATION
### Core engine infrastructure · the permanent animation platform · P1

**Status:** PRODUCTION SPECIFICATION · **no placeholder art exists or should be created.**
**Milestone:** ⏸️ **DEFERRED — the next major CHARACTER milestone AFTER beta** (freeze decision 2026-07-10). Finn's whole-sprite animation is **frozen for beta** (movement = build 259); no further renderer experiments. Articulation via this atlas is how weight/legs finally land — but not before beta ships. The dormant V3 renderer code was removed from the game (unreachable); this spec + the three V3 architecture docs are preserved as the build-ready plan for when this milestone begins.
**Consumes:** `content-assets/finn-canon-poses-A.png`, `-B.png`, `finn-canon-vboost-raw.png` (the canonical source sheets).
**Consumed by:** `FinnV3` rigged Asset Provider (`FINN_RENDERER_V3_ARCHITECTURE.md` §4.2).
**Governed by:** `FINN_CANONICAL_CHARACTER_SYSTEM.md` (Doc 1 geometry, Doc 2 limits, Doc 3 skeleton, Doc 10 validation).

> **What this document is.** A contract an artist — or an AI art workflow — can execute *exactly*, with zero interpretation, producing an atlas the engine loads without a single code change. It defines parts, anchors, z-order, units, constraints, and the export pipeline.
>
> **The one rule that makes a rig possible:** *every part must be painted **complete**, including the area hidden behind the parts in front of it.* A leg cut out of `run.png` leaves a hole in the plastron; that hole is why build 244 failed. **We do not cut. We repaint.**

---

## 1 · Coordinate system — "Atlas Space" (AS)

| Property | Value |
|---|---|
| Origin `(0,0)` | **Ground contact point**, directly between the feet |
| `+x` | **Forward** (the direction Finn faces; canon = right) |
| `+y` | **Up** (art convention; the exporter flips to canvas y-down) |
| Unit | **u** — the canon authoring unit |
| **Master unit** | **SD = 37.5u** (shell diameter). *Every dimension is expressed as a fraction of SD.* |
| Finn's extent | x ∈ [−1.0·SD, +1.0·SD] · y ∈ [0, +1.5·SD] |
| Total silhouette | **2.0 × SD wide, 1.5 × SD tall** (wider than tall — canon) |

**Why SD and not pixels:** the art can be re-rendered at any resolution forever; the rig math never changes. Pixels are an export detail (§7).

---

## 2 · Part manifest — 15 joints, 11 art parts, 4 code parts

Joint IDs **must** match `FinnV3.JOINTS` exactly. Art parts ship as PNGs; code parts are drawn procedurally and require **no art, ever**.

| # | Joint ID | Art? | File | Notes |
|---|---|---|---|---|
| 1 | `root` | — | — | transform only (world) |
| 2 | `shell` | ✅ | `finn_shell.png` | body + plastron. **Leg sockets, neck socket and jetpack strap-bed painted complete.** |
| 3 | `neck` | ✅ | `finn_neck.png` | short green column; hidden at rest, revealed on the Peek |
| 4 | `head` | ✅ | `finn_head.png` | includes mouth + nostrils; **eye sockets painted as white sclera** |
| 5 | `eyeL` *(near)* | ✅ | `finn_eye_near.png` | sclera only, no pupil |
| 6 | `eyeR` *(far)* | ✅ | `finn_eye_far.png` | ~0.60× the near eye (perspective) |
| 7 | `pupilL` | ✅ | `finn_pupil_near.png` | pupil + specular dot |
| 8 | `pupilR` | ✅ | `finn_pupil_far.png` | |
| 9 | `jetpack` | ✅ | `finn_jetpack.png` | gunmetal canister + cap + down-nozzle. **Straps are painted on `shell`, not here.** |
| 10 | `compass` | ✅ | `finn_compass.png` | medallion + chain. Ø = 0.24 · SD |
| 11 | `legFN` | ✅ | `finn_leg_front_near.png` | 0.29 · SD wide |
| 12 | `legFF` | ✅ | `finn_leg_front_far.png` | **0.88× scale, darker** (`turtleBodyShadow #57A83A`) |
| 13 | `legRN` | ✅ | `finn_leg_rear_near.png` | |
| 14 | `legRF` | ✅ | `finn_leg_rear_far.png` | 0.88×, darker |
| 15 | `tail` | ✅ | `finn_tail.png` | ~0.19 · SD nub |
| — | `eyelid.*` | ❌ **code** | — | already shipping (measured lid overlay) |
| — | `shadow` | ❌ **code** | — | planted, height/squash reactive |
| — | `flame` | ❌ **code** | — | fbm turbulence (`FinnV3.flamePower`) |
| — | `particles` | ❌ **code** | — | exhaust, dust, heat |
| — | `glasses` | ⭘ P2 | `finn_glasses.png` | progression cosmetic; parented to `head` |

**Total P1 art: 11 files.** (The 7-piece minimum from the plan expands to 11 once eyes/pupils are split L/R and the neck is separated — same commission, itemised honestly.)

---

## 3 · Draw order (z-order) — back → front

The compositor draws strictly in this order. **Index is stable forever**; new parts insert at fractional indices.

| z | Part | Rationale |
|---|---|---|
| −10 | `shadow` *(code, world-space)* | never part of the character stack |
| 0 | `flame` *(code)* | exits behind/below the pack |
| 10 | `legRF` | far rear |
| 20 | `legFF` | far front |
| 30 | `jetpack` | strapped to the back, behind the shell mass |
| 40 | `tail` | lower-rear |
| 50 | `shell` | the silhouette anchor |
| 60 | `neck` | emerges from the shell front |
| 70 | `head` | |
| 80 | `eyeR` → 81 `pupilR` | far eye |
| 82 | `eyeL` → 83 `pupilL` | near eye |
| 84 | `eyelid.*` *(code)* | |
| 86 | `glasses` *(P2)* | |
| 90 | `legRN` | near rear |
| 100 | `legFN` | near front |
| **110** | **`compass`** | **front-most.** Canon §4.5: the compass is occluded *only* inside the tucked ball. Placing it above the near legs makes that structurally guaranteed. |

> **This z-order alone fixes build 244.** Legs can never draw *through* the compass, because the compass is always drawn after them.

---

## 4 · Anchors — the artist's contract

Each part carries **named anchor points** placed by the artist in the source file. The exporter reads them; the engine never guesses.

### 4.1 Required anchors

| Part | `pivot` (rotation centre) | Additional sockets |
|---|---|---|
| `shell` | shell centre | `socket.neck`, `socket.jetpack`, `socket.compass`, `socket.tail`, `socket.hip.FN`, `socket.hip.FF`, `socket.hip.RN`, `socket.hip.RF` |
| `neck` | base (at `shell.socket.neck`) | `socket.head` (tip) |
| `head` | base (at `neck.socket.head`) | `socket.eye.near`, `socket.eye.far`, `socket.glasses` |
| `eyeL/R` | eye centre | `socket.pupil` |
| `pupilL/R` | pupil centre | — |
| `jetpack` | strap mount | `socket.nozzle` (flame origin) |
| `compass` | **chain top** (pendulum pivot) | — |
| `leg*` | **hip** (top of the leg) | `socket.foot` (contact point) |
| `tail` | base | — |

### 4.2 Anchor laws

1. A child's `pivot` **must coincide** with its parent's corresponding `socket.*`. The exporter **fails the build** if they differ by > 0.5u.
2. Every leg's `pivot` is at the **hip**, so the top pixel row never moves → no seam against the shell.
3. `compass.pivot` is the **chain top**, not the medallion centre — it must swing as a pendulum.
4. `socket.foot` defines ground contact; the shadow and the gait arc read from it.
5. Rear hips sit **≈0.05·SD higher and behind** the front hips (canon depth cue).

---

## 5 · Dimensions & painting rules

| Part | Size (fraction of SD) | Colour / rule |
|---|---|---|
| `shell` | Ø 1.00 (near-circular; w:h ≈ 1 : 1.01) | `#F0862C`; hex scutes low-contrast; one amber gloss top-left; plastron band `#ECDCA0`, 0.13·SD tall |
| `head` | Ø **1.25** | `#7ED957`. **Head:Shell = 1.25 : 1 — immutable** |
| `eye` near | rx 0.141 · ry 0.149 | white sclera + one specular dot |
| `eye` far | **0.60×** the near eye | perspective |
| inter-pupil | **0.413 · SD** (≈15.5u) | |
| `leg` front | 0.29 w · 0.25 h | `#7ED957` |
| `leg` rear | **0.88 ×** front | `#57A83A` (darker) |
| `compass` | Ø 0.24 | ring `#FFD54A`, face `#FBF3D8`, needle `#E5432E` |
| `jetpack` | 0.16 w · 0.30 h | `#6B7280`, cap/nozzle `#3A414B`; **no gold trim, no LED** |
| `tail` | ≈0.19 | `#7ED957` |
| outline | 3.0u, round join | `#7A3A12` |

### 5.1 The **paint-behind** rule (non-negotiable)
Every part is painted **as if nothing were in front of it**:
- `shell` is painted **whole**, including the plastron area behind the near legs and the compass, and the socket area behind the neck.
- `head` is painted with **complete white sclera** in both eye sockets (pupils are separate).
- `leg*` are painted with their **full hip caps**, including the portion tucked under the shell.
- No part may contain pixels belonging to another part (no compass on the shell, no straps on the jetpack).

**Test:** hiding any single part must leave a *clean, believable* silhouette underneath — never a hole.

---

## 6 · Animation constraints (from Doc 2; the exporter writes these into the JSON)

| Joint | Rotation | Translation | Scale | Hard rule |
|---|---|---|---|---|
| `root` | world | world | uniform only | never non-uniform |
| `shell` | 0° open; 360° ball only | with root | squash ≤ ±10%, volume-preserving | — |
| `neck` | ±12° | extend 0 → 0.16·SD | length only | hidden at rest; **never giraffe** |
| `head` | tilt ±15°, yaw ≤ **25°** | rides neck | **locked** | the head never resizes |
| `pupil*` | — | within sclera, **overshoots** the look dir | 0.9–1.1 | never touches the rim |
| `jetpack` | shrug ≤ 3° | with shell | fixed | always mounted, **nozzle straight down** |
| `compass` | swing ≤ 8° | pendulum from chain top | fixed | **never removed; never occluded** (see §6.1) |
| `legFN/FF` | gait ±14° at the hip | foot ±0.06·SD | 1.00 / **0.88** | 4 legs always; never a 5th |
| `legRN/RF` | counter-phase (diagonal) | ” | ” | rear pair darker, behind, higher |
| `tail` | ±10° | — | fixed | secondary only |

### 6.1 Keep-out zones (belt-and-braces over z-order)
- **Compass keep-out:** a circle of radius `1.35 × compass.radius` centred on the medallion. **No leg pivot solution may place leg geometry inside it.** The solver clamps. *(This is build 244's failure encoded as a constraint, in addition to the z-order guarantee.)*
- **Silhouette keep-out:** no part may cross the 3-mass read (jetpack → shell → head). If a pose breaks the silhouette test at 40–90px, the solver clamps.

---

## 7 · Export pipeline

### 7.1 Authoring
- Source: `content-assets/finn-canon-poses-A/B.png` (on-model reference only — **re-paint, never trace-cut**).
- Working file: layered (`.psd`/`.kra`/`.aseprite`), **one layer group per joint ID**, named exactly as §2.
- Anchors: one **named point layer / null** per anchor (§4.1), named `pivot`, `socket.neck`, etc., inside its part's group.
- Authoring resolution: **SD = 600 px** (≥ 4× final on-screen size). Transparent background. No baked shadows, no baked flame.

### 7.2 Export (deterministic, scriptable)
```
finn_atlas_export.py
  1. read layered source
  2. for each joint group:
        trim to alpha bbox   → part PNG (premultiplied off)
        record bbox offset   → so anchors survive the trim
        read anchor nulls    → convert px → AS units (÷ SD_px × 37.5)
  3. validate: every child.pivot ≈ parent.socket.*   (tolerance 0.5u)
               every required anchor present
               no part contains another part's palette-exclusive colour
               union silhouette ≈ run.png silhouette (IoU ≥ 0.97)
  4. pack     → finn/parts/finn_atlas@2x.png  (+ @1x)
  5. emit     → finn/parts/finn_atlas.json
```

### 7.3 `finn_atlas.json` schema
```json
{
  "version": 1,
  "unit": "u", "SD": 37.5,
  "space": { "origin": "ground_between_feet", "x": "forward", "y": "up" },
  "image": { "@1x": "finn_atlas.png", "@2x": "finn_atlas@2x.png", "sd_px": { "@1x": 150, "@2x": 300 } },
  "parts": {
    "shell": {
      "z": 50,
      "frame": { "x": 0, "y": 0, "w": 320, "h": 318 },
      "pivot": { "x": -5.0, "y": 27.0 },
      "sockets": {
        "neck":    { "x": 6.0,  "y": 40.0 },
        "jetpack": { "x": -26.0,"y": 36.0 },
        "compass": { "x": 6.0,  "y": 38.0 },
        "tail":    { "x": -24.0,"y": 11.0 },
        "hip.FN":  { "x": 8.0,  "y": 11.0 },
        "hip.FF":  { "x": 4.0,  "y": 13.0 },
        "hip.RN":  { "x": -12.0,"y": 11.0 },
        "hip.RF":  { "x": -16.0,"y": 13.0 }
      }
    }
  },
  "constraints": { "head": { "yaw": 25, "tilt": 15, "scale": "locked" } }
}
```
> Coordinates above are **illustrative of the schema, not authored values.** The exporter emits the real numbers from the artist's anchors. The engine reads them; nothing is hardcoded.

### 7.4 Runtime contract (engine side)
- Loaded **separately** from `FINN_SPRITES`. **It must never gate `FINN_SPRITES.ready`.**
- Any load failure → provider stays `monolithic` → today's Finn renders. **Never a blank hero.**
- `FinnV3.provider` flips to `'rigged'` only when the atlas *and* JSON validate.
- The deprecated `body.png` / `leg.png` / `walk-sheet.png` names are **permanently forbidden** and remain blocked by the regression gate. This is a new system, not their return.

---

## 8 · Acceptance — an asset becomes canon only if it passes

1. **Doc 10 Master Validation Checklist** (proportions, 4 legs, no arms/hands, no eyebrows, compass + jetpack present, palette, silhouette at 40–90px).
2. **Paint-behind test:** hide any part → clean silhouette, no hole.
3. **Anchor test:** every `child.pivot` = `parent.socket.*` within 0.5u.
4. **Silhouette IoU ≥ 0.97** against `run.png` when posed at rest.
5. **Compass keep-out** never violated across a full gait cycle.
6. **Side-by-side gait A/B beats static** at real device scale — *canon's own gate before legs may animate at all.*
7. Regression gate green; `FINN_SPRITES.ready` still gated on the 6 legacy frames only.

---

## 9 · Canon amendments this unlocks (founder approval required before P1.3 ships)

1. `finn_canon.md`: *"Legs never animate"* → *"Legs never animate **in monolithic mode**. The rigged provider gaits them per Animation Bible §2, **only after proving side-by-side that it beats static.**"*
2. Add `finn/parts/*` to the approved asset list (loaded separately; never gates readiness).
3. Reaffirm: `body.png`, `leg.png`, `walk-sheet.png` remain deleted and gated.

---

*Specification only. No art was created; no placeholder assets exist. The engine (`FinnV3`, build 260) already ships the skeleton and the provider seam this atlas plugs into — the day the 11 files validate, joints unbind with **zero behaviour rewrite.***
