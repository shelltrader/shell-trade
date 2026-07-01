# ChartQuest Turtle — Canonical Mismatch Report & Migration Plan

**Canonical source of truth:** `content-assets/turtle master character sheet.png`
**Rule:** conform every turtle to the sheet. Do **not** redesign.

---

## 1 · Canonical spec (extracted from the sheet)

**Style:** stylized 3D / high-quality game art — friendly, approachable, rounded shapes, clear readability, consistent details.

**Palette (sampled directly from the sheet's COLOR PALETTE swatches):**

| Group | Canonical colors |
|---|---|
| Skin | olive / avocado green — light `#6e8a3a`, base `#5a7030`, shadow `#2a3520` |
| Shell | teal-green dome `#20413a`–`#264233` with **bronze scute plates** `#5a4520` |
| Plastron (belly) | warm **tan / gold** `#be9b4e`–`#c4a050` (NOT green) |
| Jetpack | bronze `#583b20` + dark gunmetal `#3a3a3a`, **orange flame** |
| Accents | cyan `#48a0c0` (glasses) + gold `#deb653` (badges) |

**Face:** big, round, expressive eyes with dark pupils + a white catchlight. Soft smile.

**Upgrade progression (drives accessories):**

- **Stage 0 Rookie — NO glasses** (bare eyes).
- **Stage 1 (after Guardian 1): Trader's Glasses** — cyan goggles.
- Later stages add notebook, jetpack upgrade, scanner, badge.

---

## 2 · Asset audit — every turtle representation

| # | Asset | Type | Where |
|---|---|---|---|
| 1 | **Gameplay turtle** | procedural canvas | `drawTurtle()` |
| 2 | Chart marker turtle | inline SVG | `turtleMarkerSVG()` |
| 3 | Wallet / intermission turtle | procedural canvas | wallet panel render |
| 4 | Falling/cinematic turtle | procedural canvas | `drawTurtleFalling()` (now largely replaced by the video intro) |
| 5 | Logo turtle | raster image | `logo.png` (+ `website/assets/chartquest-logo.png`) |
| 6 | Poster / social | raster image | `website/assets/chartquest-poster.jpg`, social avatar |
| 7 | Cinematic turtle | AI video | `Market-maker-cinematic.mp4` |

Assets 1–4 all draw from the central `COLOR.turtle*` palette, so a single palette change conforms their colors everywhere at once.

---

## 3 · Mismatch report (current in-game turtle vs canon)

| Category | Current | Canonical | Verdict |
|---|---|---|---|
| **Art style** | flat 2D, bright cartoon | rounded, soft-shaded "stylized 3D" | Partial — conform via palette + softer shading (2D medium can't fully match a render) |
| **Shape** | side-profile dome + stub limbs | rounded, chunky, friendly | OK in silhouette; soften |
| **Face** | **always wears dark sunglasses** | rookie has **bare big eyes**; cyan glasses earned after Guardian 1 | ❌ Major mismatch |
| **Shell** | green `#2bb455`, single hex + spokes | teal-green + **bronze scute plates** | ❌ Wrong hue, no bronze |
| **Skin** | bright spring-green `#3ddc6a` | olive/avocado `#5a7030` | ❌ Wrong hue |
| **Belly** | mint green `#8fe8a8` | **tan/gold** `#c2a050` | ❌ Wrong color entirely |
| **Jetpack** | blue-grey `#7e8ca0` | bronze + dark gunmetal | ❌ Wrong hue (flame already correct) |
| **Scale** | single in-world size, scales with `turtle.w` | small/medium/large reference sizes | OK — within canon; no change needed |

---

## 4 · Migration plan (gameplay prioritized)

**Phase 1 — Gameplay turtle (DONE this pass, highest priority):**

1. Conform the central `COLOR.turtle*` palette → olive skin, teal+bronze shell, tan plastron, bronze/gunmetal jetpack. (Propagates to assets 1–4.)
2. Replace the always-on sunglasses with **canonical big round eyes**; show the **cyan Trader's Glasses only after Guardian 1** (matches the sheet's progression — and the new G1 reward).
3. Recolor the shell pattern to **bronze scutes** over the teal dome; tan belly band.

**Phase 2 — Secondary canvas/SVG renders (fast follow-up):** apply the same eyes-vs-glasses logic to `turtleMarkerSVG`, the wallet turtle, and `drawTurtleFalling` (palette already conformed; only the eye/goggle shapes remain).

**Phase 3 — Raster assets (needs image regeneration, not code):** `logo.png`, `website/assets/chartquest-logo.png`, `chartquest-poster.jpg`, and the social avatar should be re-exported from the canonical sheet render. Flagged for an art pass — I can't redraw a 3D render in code.

**Phase 4 — Cinematics:** future cinematics should use the canonical turtle; the existing Market Maker clip is AI-generated and close enough to keep.

*Phase 1 implemented in v114.*
