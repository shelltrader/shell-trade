# FINN — FUTURE ASSET QUEUE
**Status:** LIVING BACKLOG · ranks under `FINN_CANONICAL_CHARACTER_SYSTEM.md`.
**Why this exists:** the hybrid rule — build from the 7 current sprites, and whenever a pose/expression can't be produced faithfully, **file a brief here instead of inventing it.** Every item is a production brief traceable to canon; **acceptance = passes the Master Validation Checklist (Doc 10).**
**Source art for any new asset:** `content-assets/finn-canon-poses-A/B.png` (+ `finn-canon-vboost-raw.png`). Never AI-generate a free-standing turtle; author on-model from the source sheets, then gate on Doc 10.

**Prioritization (founder directive):** ship only what makes Finn feel **alive** (gameplay + website) before closed beta. Defer turnarounds, front/back views, and large pose expansions until after beta.

---

## P0 — Alive-making (before closed beta)
The minimum art to complete the idle/expression systems already specified.

| # | Asset | Why | Canon ref | Notes / already-built |
|---|---|---|---|---|
| A1 | **Pupil / eye overlay layer** (per-sprite `--p*` rects, like the blink lid) | Unlocks **subtle eye movement / eye-dart**, lid-lower for Focused/Determined/Reading | Doc 2 (eyes), Doc 5, Website Guide | Blink lid already ships; this extends the same overlay technique |
| A2 | **Neck-extension frame(s)** (curious-peek) | Unlocks **Neck Stretch** pose + true Curious emotion | Doc 2 (neck ±12°, 0→6u), Pose Library | Website currently proxies with a head `rotateY` glance |
| A3 | **Breathing** | keep alive baseline | Doc 7 Idle-A | ✅ **already built** (website `finnAlive`, gameplay idle) — no art needed |
| A4 | **Blink** | eye life | Doc 7 Blink | ✅ **already built** (lid overlay) — no art needed |
| A5 | **Hover stabilization** (marketing) | ambient life for ads/site | Doc 4 §4.5 | ✅ **achievable from `vboost` + motion** — no new art; spec in Website/Animation guides |
| A6 | **Jetpack correction** (micro-puff) | living equipment | Doc 4 §4.6, Website Guide | ✅ **achievable from the flame overlay + transform** — no new art |

> **Net new art for P0 = just A1 (eye overlay) and A2 (neck extension).** Everything else labelled "alive" is already built or achievable from current art + motion.

## P1 — Expression completeness (as beta feedback warrants)
| # | Asset | Why | Canon ref |
|---|---|---|---|
| B1 | **Worried / sad face** | truer Loss & Recovering reads | Doc 6 |
| B2 | **Surprised face** (pop-eye / small open mouth) | Surprised / Spotting-a-breakout | Doc 6 |
| B3 | **Pointing pose** (front leg, not an arm) | Tutorial pointing | Doc 2 (front legs gesture), Pose Library |
| B4 | **Head-look up / down / left** frames | true directional looks | Doc 2 (head yaw ≤25°) |
| B5 | **"Studying the chart" pose** | dedicated Reading pose | Doc 5 |

## P2 — Deferred until after closed beta
| # | Asset | Why deferred |
|---|---|---|
| C1 | **Turnarounds** — true front, back, side, ¾-rear | Large art effort; canon only defines ¾-right. Brief in `FINN_REFERENCE_PACKAGE.md §5` |
| C2 | **Large pose expansions** (wall-slide, extra idles, emotes) | Not needed for the core loop; revisit with beta data |
| C3 | **Glasses-unlocked variants** of any new frames | Only after B-series faces exist (progression cosmetic) |

---

## Standing rules for every queued asset
1. Author from the **source sheets** on-model — do **not** AI-generate a fresh turtle (the #1 historical regression).
2. Match the **current build-254 look** (`finn/run.png` / `finn/hero.png`) exactly — proportions, palette, silhouette.
3. Overlay layers (eye/neck) follow the **existing technique** (measured per-sprite CSS-var rects) so they ride the sprite transform.
4. **Gate on Doc 10** before anything becomes canon; add it to `finn_canon.md`'s approved list and the loader (separately, never gating gameplay `ready`).
5. Keep the **regression gate** (`scripts/verify.js`) green.
