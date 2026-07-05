# FINN CHARACTER SHEET — INCONSISTENCIES FOUND & RESOLVED

Issues identified inside the provided *Finn Master Animation Set*, and the canonical resolution applied for each. All resolutions favour: (a) the sheet's stated rules, (b) Task 5's boost constraints, and (c) maintaining current ChartQuest gameplay feel.

| # | Inconsistency in the sheet | Evidence | Canonical resolution |
|---|---|---|---|
| 1 | **Broken frame numbering** | Two `12` frames (Dive Tuck **and** Shell Spin Rolling); two `18` frames (Hurt **and** Victory/Cheer); numbers **13** and **19** skipped. | Renumber 1–20 sequentially. Numbering is metadata only; art is unaffected. |
| 2 | **Leg count is asserted, not shown** | Header note "All animations use 4 legs (no extra leg)" is itself a correction flag; most side-view frames clearly show only 2 legs. | Canon = **exactly 4 legs**. Side view = near pair prominent + far pair behind (12% smaller, darker). Implemented in `drawTurtle`. |
| 3 | **Jetpack / thrust angle drift** | "Boost Up (Diagonal)" and "Boost Up (Strong)" show diagonal thrust; "Vertical Boost" implies straight up. | **Boost is VERTICAL, not diagonal** (Task 5). Flame vector = straight down-nozzle. Diagonal boost dropped from gameplay. |
| 4 | **Art implies out-of-scope mechanics** | "Hover (Hold Boost)" + multiple "Boost Up" frames imply hover / sustained flight / fuel. | Task 5 forbids free flight, hover, and fuel. These frames are **mood art only**; gameplay keeps the discrete two-tap boost. Hover is **not** a game state. |
| 5 | **Head-size variance** | Head reads ≈ shell in idle/run but larger/rounder in victory/boost. | Fix **Head : Shell = 1.25 : 1** across all poses. |
| 6 | **Shell roundness variance** | Dome varies between rounded and near-circular; a true circle only in Spin frames. | Dome = near-circular bezier in all open poses; **true circle only** during Tuck/Spin ball. |
| 7 | **Compass necklace appears/disappears** | Medallion visible in idle/hero/victory; occluded or missing in run/dive/fall/boost. | Necklace is **ALWAYS present** (only geometrically hidden inside the tucked ball). |
| 8 | **Tail barely/never drawn** | No consistent tail across the sheet. | Canon = small green nub, lower-rear, present in all open poses; inside the ball for Tuck/Spin. |
| 9 | **Glasses continuity** | Level 1–2 "no glasses" → "unlocked" shown, but later frames drawn without glasses regardless. | Once unlocked, glasses **persist in every subsequent pose** (game gate unchanged). |
| 10 | **Wall Slide / Wall Jump (frames 16–17)** | Present in sheet; ChartQuest has no wall mechanic. | **Out of scope** this pass — art-only until a wall mechanic ships. No physics added (Task 4: gameplay unchanged). |
| 11 | **Duplicate Run / Fall states** | Run 1 / Run 2 (a 2-frame cycle, fine); Fall / Fall (Fast) as two states. | Canon = one **Fall** state; lean + speed-lines intensify with downward velocity rather than a separate "fast" state. |
| 12 | **"Vertical Boost" risks reading upright** | Frame 5 tilts Finn toward near-bipedal. | Keep body **low & quadrupedal**; communicate up-thrust via flame length + speed lines + slight nose-up tilt only. Never a standing pose (violates ALWAYS-quadruped). |

**Net effect:** 12 issues resolved. None required a physics change. The three hard-rule impacts (4 legs, always-on compass, orange shell) are enforced in code; the boost-vector and no-hover impacts are enforced by keeping the existing movement system exactly as-is.
