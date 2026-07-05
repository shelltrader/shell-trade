# FINN — CHARACTER BIBLE (CANONICAL)

**Status:** OFFICIAL · Supersedes all prior Finn definitions
**Source of truth:** *Finn Master Animation Set* character sheet (July 2026)
**Applies to:** ChartQuest — all future Finn art, animation, and code
**Renderer of record:** `chart-quest.html → drawTurtle()` (procedural canvas, not sprites)

> The old Finn is deprecated. No previous proportion, hitbox, sprite, or palette is preserved except where this document restates it as canon.

---

## 1. One-line identity

Finn is a small, round, **quadrupedal** cartoon turtle — a nerdy student-trader — with a bright **green** body, an **orange** hexagonal shell, a **gold compass necklace**, and a **gunmetal jetpack** strapped to his back. He **always faces right** and **never stands upright**.

---

## 2. Canonical measurement frame

All numbers are given in **authoring units (u)** — the coordinate space of `drawTurtle()` (`w = 46`, `h = 30`), anchored at the **feet**. Two scale factors map authoring units to the screen; neither changes Finn's design:

| Layer | Value | Purpose |
|---|---|---|
| Authoring frame | 46 u × 30 u | Design space (this document) |
| Collision hitbox | **36 px × 24 px** (`turtle.w × turtle.h`) | Physics — **NEVER changes** |
| Fit scale `s` | `turtle.w / 46` (≈ 0.783 @ default) | Art shrunk to hitbox |
| Hero scale `VIS` | **1.35** | Art rendered 35% larger than hitbox for presence |

**Shell Diameter (SD) is the master unit** for all ratios below. Canonically **SD ≈ 37.5 u** (≈ 40 px on a phone at the default zoom).

---

## 3. Canonical proportions & ratios

| Relationship | Canonical ratio | Notes |
|---|---|---|
| **Head : Shell** (head-to-body) | **1.25 : 1** | Head diameter ≈ 47 u vs shell ≈ 37.5 u. Head is the dominant read — the chibi "student" signature. Game holds the upper end of the 1.0–1.25 range for phone-scale readability. |
| **Shell : Hitbox width** | ~1.04 : 1 | Shell ≈ hitbox width (36 px). Shell is the silhouette anchor. |
| **Shell width : height** | ~1 : 1.01 | Near-circular dome (bubbly, toy-like — never military). |
| **Total standing height : SD** | ~1.5 : 1 | Crown of head to bottom of feet ≈ 56 u. |
| **Total standing width : SD** | ~2.0 : 1 | Jetpack tail to nose tip ≈ 76 u. |
| **Legs : SD (each)** | ~0.29 : 1 | Front pair 11 u wide; rear pair 12% smaller. |
| **Compass : SD** | ~0.24 : 1 | Medallion Ø ≈ 9 u on the plastron. |
| **Jetpack : SD** | 0.16 w × 0.30 h | Canister 6 u × 11 u, high on the rear. |

**Silhouette:** low, rounded, **wider than tall**. Three left-to-right visual masses: **jetpack → shell (with necklace + legs) → head**. The read must survive at 40–90 px over both green and red candles.

---

## 4. Component specification

### 4.1 Shell (orange, hexagonal, dominant)
- **Dome:** near-circular bezier, x −2.3 → 35.0 u (37.3 u wide), y −11.4 → 26.4 u (37.8 u tall).
- **Colour:** ORANGE family (see §6). Deep brown-orange outline, 3.0 u, round join.
- **Surface:** central rounded scute + four soft curved dividers (low-contrast), one amber gloss bubble top-left, one amber rim-light across the top edge. Reads as a friendly turtle shell, **never armor**.
- **Plastron:** pale-cream band along the bottom, full width, 5 u tall.

### 4.2 Head (green, oversized, expressive)
- **Ball:** Ø 47 u (r 23.5), centered at (47.4, 3.9) u at rest, sits **up and forward** against the shell so the face is never swallowed.
- **Eyes:** two, rx 5.3 × ry 5.6 u, at head-local (−2.5, −5) and (13, −5); white sclera, dark pupil that **overshoots** the look direction, single specular dot.
- **Mouth:** friendly curved line; flattens to a small worried arc when `shellEmotion === 'worried'`.
- **Neck:** hidden at rest (head sits on the shell). A short green neck is drawn **only** during the idle "curious peek" and compresses on landing.

### 4.3 Legs — EXACTLY FOUR (quadruped, mandatory)
- **Front (near) pair:** 11 u × 9.5 u rounded capsules at x ≈ 13.8 and 25.6 u, drawn **over** the shell's bottom edge, animated with the walk `step`.
- **Rear (far) pair:** 9.5 u × 8 u, **12% smaller**, a **darker green** (`turtleBodyShadow`), drawn **behind** the near pair and **2 u higher** for depth, animated in **counter-phase** (diagonal gait).
- Finn is **always** on four legs — including idle, run, jump, boost, fall, land, hurt, victory. Legs tuck inward (not disappear) only for Dive Tuck / Shell Spin.

### 4.4 Tail (small green nub)
- Short triangle ≈ 7 u at the **lower-rear**: (2, 26.4) → (−3.5, 31.9) → (3.5, 26.9) u. Green fill, thin outline. Present in all grounded/airborne poses; hidden inside the ball for Tuck/Spin.

### 4.5 Compass necklace (gold, mandatory identity item)
- **Medallion:** Ø ≈ 9 u (r 4.5) on the **plastron front**, ≈ (24, 22) u.
- **Build:** gold outer ring → cream/white face → a short red **N-needle** + faint cross-hairs → tiny center pin. A thin gold chain arcs from the medallion up to the neck base.
- Sits flat against the chest; swings a few degrees under strong vertical acceleration (boost/land) but is **never** removed, hidden (except inside the tucked ball), or restyled.

### 4.6 Jetpack (gunmetal, mandatory equipment)
- **Canister:** 6 u × 11 u, x −5 → 1, y 1 → 12 u — mounted **high on the rear** of the shell, **nozzle pointing down**.
- **Build:** gunmetal capsule + soft metallic highlight, dark cap, dark down-nozzle, two short dark straps nipping the shell rim. No gold trim, no status light (kept simple so the shell out-reads the pack).
- **Flame:** exits the down-nozzle, colour **orange → yellow → white-hot core** (see §6). Idle pilot flame ≈ 4–6 u; full boost ≈ 20–25 u with a warm glow. The pack is present in every pose; the flame scales with `turtle.flameT`.

### 4.7 Glasses (progression cosmetic)
- **Round trading glasses**, thick near-black frame, cyan lens. **Unlock rule:** Levels 1–2 = **no glasses**; unlocked and worn permanently from the first glasses milestone onward (game gate: `bossesEverCount() >= 2`). Not part of the base silhouette; additive when unlocked.

---

## 5. MANDATORY RULES

**Finn MUST ALWAYS:**
- Have **exactly 4 legs** and remain **quadrupedal**.
- **Face right** by default.
- Use the **orange** shell and the **green** body.
- Wear the **compass necklace**.
- Carry the **jetpack**.

**Finn MUST NEVER:**
- Become **humanoid** or **stand upright**.
- Gain a **5th limb** or any extra leg/arm.
- **Lose the compass necklace**.
- **Lose the jetpack**.
- Render the shell in any non-orange hero colour.

Any frame, sprite, or code path that violates the above is non-canon and must be fixed.

---

## 6. Canonical palette

| Token | Hex | Role |
|---|---|---|
| `turtleBody` | `#7ED957` | Green body — head, legs, tail, neck |
| `turtleBodyShadow` | `#57A83A` | Darker green — the rear (far) leg pair |
| `turtleShell` | `#F0862C` | **ORANGE hero shell** — the signature colour |
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
| `engineGlow` | `#FFB020` | Warm amber thruster glow (canon: flame is orange→yellow, no blue) |
| `lens` / `lensShine` | `#48A7C7` / `#BFEAFF` | Glasses lens + glint (progression) |

The `COLOR` object in `chart-quest.html` is the **single source of truth**: every Finn representation (gameplay, HTF minimap marker, academy shell, hero/victory pose) reads from these tokens, so a palette edit cascades everywhere. The only hard-coded Finn art is the `finnIconHTML()` SVG badge, which mirrors these hexes.
