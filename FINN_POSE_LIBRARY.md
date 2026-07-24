# FINN — POSE LIBRARY (Phase 3 · hybrid)
**Status:** PRODUCTION GUIDE · ranks under `FINN_CANONICAL_CHARACTER_SYSTEM.md` (Doc 2 anatomy limits, Doc 3 rig, Doc 8 principles).
**Method (per founder decision):** map every requested pose to the **7 current sprites + transforms first**; where a pose can't be produced faithfully, **do not fake it** — file a brief in `FINN_FUTURE_ASSET_QUEUE.md`.

**Available now:** `run · jump · vboost · land · shell · dazed · hero`, all right-facing ¾; facing-left = whole-sprite mirror (`dir<0`); small head `rotateY` glance (website); blink-lid + flame overlays.

Legend: ✅ from existing art · 🟡 proxy (readable but a truer pose is queued) · 🔴 needs new art → queued. Every pose must pass Doc 10.

| Pose | Source | How | Status |
|---|---|---|---|
| **Idle** | `run` | grounded + Idle-Breathe/blink/weight-shift | ✅ |
| **Hover** | `vboost` | boost pose + 2-axis bob + jetpack micro-corrections (**mascot/marketing only — no gameplay hover**) | ✅ (non-gameplay) |
| **Reading** | `run` | grounded + deliberate eye-scan motion (Doc 5) | 🟡 (a "studying the chart" pose could be queued) |
| **Looking Right** | `run` | default facing | ✅ |
| **Looking Left** | `run` | whole-sprite mirror (`dir<0`) | ✅ |
| **Looking Up** | `jump` | nose-up body proxy | 🟡 (true head-up look = queued) |
| **Looking Down** | `jump` (fall lean) | nose-down body proxy | 🟡 (true head-down look = queued) |
| **Neck Extension** | — | neck is baked/hidden in the sprites | 🔴 **needs art (curious-peek)** → queued **(P0 alive-making)** |
| **Thinking** | `run` | grounded + thinking motion beat | ✅ (proxy) |
| **Tutorial** | `hero`/`run` | grounded + welcoming teach motion, front-leg gesture | ✅ |
| **Pointing (front leg)** | — | no pointing pose in the set; front leg can't be re-posed from a baked frame | 🔴 **needs art** → queued |
| **Victory** | `hero` | `drawHeroFinn`→hero.png (build 255) + cheer-hop | ✅ |
| **Celebration** | `hero` | hop + celebratory puff + sparkle | ✅ |
| **Boss Intro** | `run`/`hero` | grounded, feet planted, faces the threat | ✅ (proxy) |
| **Landing** | `land` | touchdown squash (render-only) | ✅ |
| **Jump Preparation** | `jump` | rising frame; anticipation gather is a transform beat before it | 🟡 (a distinct gather frame could be queued) |

**Anatomy guardrails on every pose:** exactly 4 legs (rear −12%, darker, behind), no arms/hands, no eyebrows, no upright/humanoid, head:shell 1.25:1 frozen, compass + jetpack always present, faces right (or clean mirror), hitbox 36×24 untouched.

**Queued to complete this library:** **Neck Extension (P0)**, Pointing-with-front-leg, true head-look up/down/left, an optional Reading pose. Turnarounds & large expansions are deferred to post-beta (Future Asset Queue P2).
