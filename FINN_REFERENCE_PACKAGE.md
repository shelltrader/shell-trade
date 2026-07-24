# FINN — REFERENCE PACKAGE (Phase 1)
**Status:** PRODUCTION REFERENCE · ranks under `FINN_CANONICAL_CHARACTER_SYSTEM.md` (the master system) and `docs/canon/finn_canon.md` (the lockdown).
**Date:** 2026-07-10 · **Companion visual:** the *Finn — Construction & Pivot Reference* artifact — **anchored ON the live official sprite `finn/run.png` (build 254)**, measurements overlaid, no turtle redrawn.
**Fidelity rule honored:** nothing here invents Finn. Existing art is cataloged; missing views are **specified for commission**, never generated.

---

## 1. The truth that governs Phase 1

Per canon, **Finn *is* the shipping PNGs.** The approved art is **7 sprites, all right-facing ¾ view**, drawn by `drawFinnSprite` (grounded) and `drawHeroFinn` (hero). There is **no front, back, side, or ¾-rear view in canon.** Producing turnarounds therefore means **new art**, and new Finn art is the project's #1 historical regression source (builds 226→250). So this package **stops at the boundary of invention**: it delivers everything derivable from canon, and hands you exact commission specs for what isn't.

---

## 2. Canonical asset catalog (what EXISTS)

| # | Asset (`finn/`, mirrored in `website/finn/` + `website/assets/finn-*`) | Canonical view | State / use | Renderer |
|---|---|---|---|---|
| 1 | `hero.png` | ¾ front-right | Hero / menu / victory | `drawHeroFinn` * |
| 2 | `run.png` | ¾ side-right | Grounded walk/idle (static legs + body-rock) **and** airborne wick-fling dash | `drawFinnSprite` |
| 3 | `jump.png` | ¾ side-right | Rising jump · apex · fall | `drawFinnSprite` |
| 4 | `vboost.png` | ¾ side-right | Jetpack boost (`flameT>0.25`) | `drawFinnSprite` |
| 5 | `land.png` | ¾ side-right | Landing squash (`landT>0`) | `drawFinnSprite` |
| 6 | `shell-fall-roll.png` | ball | Spin / tuck | `drawFinnSprite` |
| 7 | `dazed-after-fall.png` | ¾ side-right | Big-fall dazed (grounded) | `drawFinnSprite` |

**Source sheets (offline provenance, not runtime):** `content-assets/finn-canon-poses-A.png`, `-B.png`, `finn-canon-vboost-raw.png` — the composited crops came from these. **These are the correct base for any new on-model art.**

\* **Open discrepancy (see §6 / Gameplay Guide):** `drawHeroFinn` currently renders `run.png`, not `hero.png`.

---

## 3. Phase-1 deliverable coverage matrix

| Requested reference | Status | Source of truth |
|---|---|---|
| Proportion grid | ✅ **Delivered** | Artifact + Doc 1 §1.1–1.2 |
| Pivot map | ✅ **Delivered** | Artifact + Doc 3 |
| Exploded body-part reference | ✅ **Delivered (part callouts on the live sprite)** | Artifact + Doc 2 |
| Material reference | ✅ **Delivered** | Artifact swatches + Doc 1 §1.5 |
| Scale reference | ✅ **Delivered** | Artifact + Doc 1 §1.1 |
| Lighting reference | ⚠️ **Documented, not plated** | Doc 1 §1.7 (key upper-left, cel, 2–3 tones). A rendered light-study needs art. |
| 3/4 front turnaround | 🟡 **Approximated by `hero.png`** | Closest existing; a clean turnaround still needs art |
| Side turnaround | 🟡 **Approximated** (sprites are ¾, not true profile) | needs art |
| Front turnaround | 🔴 **MISSING — must commission** | §5 spec (not invented) |
| Back turnaround | 🔴 **MISSING — must commission** | §5 spec |
| 3/4 rear turnaround | 🔴 **MISSING — must commission** | §5 spec |

---

## 4. Construction data (traceable — restated for the reference desk)

**Frame:** authoring space 46u × 30u, feet-anchored · **hitbox 36×24px (NEVER changes)** · fit `s = hitbox.w/46 ≈ 0.783` · **VIS 1.35** · **SD ≈ 37.5u** (master unit).

**Proportions:** Head:Shell **1.25:1** · Shell:hitbox 1.04:1 · Shell w:h 1:1.01 · Height:SD 1.5:1 · Width:SD 2.0:1 · front leg:SD 0.29:1 · rear legs −12% darker · Compass:SD 0.24:1 · Jetpack 0.16w×0.30h · inter-pupil ≈15.5u.

**Key component coords (`drawTurtle` space / head-local):** Head Ø47u @ rest-center (47.4, 3.9) · eyes rx5.3×ry5.6u at head-local (−2.5,−5) & (13,−5) · shell dome x −2.3→35.0, y −11.4→26.4 · compass Ø9u @ ≈(24,22) · jetpack 6×11u, x −5→1, y 1→12 · tail ~7u @ lower-rear · plastron cream band full-width 5u tall.

**Palette:** the 18 canon tokens (Doc 1 §1.4 / Bible §6) — `turtleBody #7ED957`, `turtleShell #F0862C`, `compassGold #FFD54A`, `jetpackBody #6B7280`, flame `#FF9F43→#FFD27A→white`. Single source: the `COLOR` object in `chart-quest.html`.

---

## 5. Commission specs for MISSING turnarounds (a brief, NOT generated art)

Any new turnaround view must be produced from `content-assets/finn-canon-poses-*` by an artist or an **approved, reviewed** pipeline, and must satisfy — verbatim — the canon envelope:

- **Silhouette:** three masses jetpack→shell→head; low, **wider than tall**; readable in black at 40–90px.
- **Proportions frozen:** Head:Shell **1.25:1**; head never resizes; shell near-circular.
- **Mandatory items visible & placed:** orange hex shell, green body, **gold compass on the plastron**, **gunmetal jetpack high on the rear, nozzle down**, exactly **4 legs** (rear pair −12%, darker, behind).
- **Per view:**
  - **Front:** viewer-facing; both eyes symmetric; compass centered on plastron; jetpack reads over both shoulders; all 4 legs; **no arms invented**.
  - **Back:** shell dominant; jetpack + straps + down-nozzle centered; a sliver of head crown; rear legs + tail; compass chain visible at the nape (medallion hidden by the shell — the one allowed occlusion is the ball, so note whether the medallion peeks at the side).
  - **Side (true profile):** one eye; jetpack silhouette clean; near legs over far legs (−12%); compass on the near chest.
  - **¾ rear:** mirror-logic of the existing ¾ front; jetpack + shell hero-read.
- **Materials/light:** cel/soft-cel, 2–3 tones, single warm key upper-left (Doc 1 §1.5–1.7).
- **Gate:** every new view must pass the **Master Validation Checklist (Doc 10)** before it becomes canon.

**Undefined without a founder call (do not guess):** exact rear geometry of the jetpack straps and whether the compass medallion is visible from behind — canon only specifies the front/¾. Flagged for §7 decision.

---

## 6. Phase-1 validation

| Check | Result |
|---|---|
| Every cataloged asset traceable to canon | ✅ 7/7 |
| Construction data matches Bible §2–4 | ✅ |
| Reference anchored to the live official sprite (`finn/run.png` · build 254); no turtle redrawn | ✅ |
| Missing views specced, not generated | ✅ |
| Open items surfaced (hero.png wiring; rear geometry) | ✅ escalated to §7 |

---

## 7. Decisions required before Phase 1 can close (per the CRITICAL RULE — not guessed)
1. **Missing-art sourcing** — commission front/back/side/¾-rear from the source sheets, OR operate the whole program from the existing 7 ¾-right sprites only? *(This determines the Expression & Pose libraries.)*
2. **`hero.png`** — wire it into `drawHeroFinn`, or update canon to drop it and bless `run.png` as the hero render?
3. **Rear geometry** — confirm jetpack-strap layout + whether the compass reads from behind.
