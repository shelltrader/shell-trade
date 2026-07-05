# Phase 2 — Duplicate Detection Report

Every place where two+ implementations of the same job exist, ranked by how likely they are to cause a regression. **This pass does not remove anything** — it names the canonical one so future work stops picking the wrong version.

---

## 🔴 CRITICAL

### C1 — Finn character has 3 competing "walk" implementations + a canon doc that names the wrong one
- **`drawFinnSprite` → `run.png` static legs** (13936, build 250) = **CANONICAL**.
- `drawFinnRigLeg`/`drawFinnRigTail` procedural 4-leg rig (`body.png`+`leg.png`) = **deprecated** (still defined, unused).
- Baked walk-sheet 12-frame cycle (`walk-sheet.png`) = **deprecated** (old art).
- **The kicker:** `docs/finn-canon/01-Finn-Character-Bible.md` says the "renderer of record" is the **procedural `drawTurtle()`** — a *fourth* thing, and not what ships.
- **Why critical:** this exact ambiguity already caused builds 248→250 (a wrong revert to old art, an upset founder, three corrective builds). It will recur unless one is declared canon in code and doc. → [finn_canon.md](finn_canon.md).

### C2 — `run.png` vs `body.png`+`leg.png` vs `walk-sheet.png` — 3 walking-Finn ASSETS
- **CANON:** `finn/run.png`.
- **DEPRECATED:** `finn/body.png`, `finn/leg.png` (build-244 rig), `finn/walk-sheet.png` (old baked art).
- **Why critical:** deprecated assets are still on disk and still loaded by `FINN_SPRITES`, so any renderer that checks "are body/leg loaded?" will silently reactivate the deprecated path. Loading ≠ approved.

---

## 🟠 HIGH

### H1 — Deprecated boss data still in the file
- Legacy `rounds`/`bossHP`/`playerHP` object (9206, self-labeled `⚠ LEGACY OBJECT — DO NOT treat as a Guardian source`), plus a "previous, deprecated roster" (9525). The live system is `GuardianTrial` (9948).
- **Why high:** a future boss task could read the deprecated object and resurrect an old roster/HP model.

### H2 — `index.html` / `chart-quest.html` / `chart-quest.min.html` — 3 copies of the game
- `chart-quest.html` = source. `index.html` = plain mirror (must stay identical). `chart-quest.min.html` = obfuscated build, currently **stale**.
- **Why high:** editing `index.html` directly (instead of mirroring from source) silently diverges the deployed build. A stale `min.html` can ship old code if the deploy path changes. One source, one mirror step — see [regression_checklist.md](regression_checklist.md).

### H3 — Two `drawShell()` functions with the same name
- `drawShell(ctx, cx, cy, r, pulse)` at 3822 (Finn's shell) and a different `drawShell(ctx,x,y,r,glow)` at 19808 (a cyan collectible shell in an IIFE).
- **Why high:** same name, different meaning, different scope — a maintainer editing "the shell" can hit the wrong one. Not a bug today (separate scopes), but a naming trap.

---

## 🟡 MEDIUM

### M1 — Two `AudioContext`s (`CineAudio` 18286 + `GameMusic` 18334)
- Both instantiate their own Web Audio context. Mobile browsers limit concurrent contexts; both must be unlocked on gesture. Works today, but it's duplicated infra and a latent unlock/again-suspended risk.

### M2 — Finn is drawn by 5 functions
- `drawFinnSprite`, `drawTurtle` (fallback), `drawHeroFinn`, `drawTurtleFalling`, `finnIconHTML`. Each has its own idea of Finn's look/palette. A palette or proportion change must be replicated across all five or they drift. (The `COLOR` object centralizes palette for the procedural ones, but the PNG sprites are baked art.)

### M3 — Lesson rendering has an active engine + a dormant legacy canvas
- Active: `LessonChart`/`LESSONS`/`conceptTier`. Dormant: legacy quiz/recap canvas (5704, `im.phase = 'redesign'` keeps it off). Dead-but-present.

---

## 🟢 LOW

### L1 — Legacy/unused leftovers (safe, cosmetic)
- Hidden legacy canvas (1501), legacy `emBtn` (11842), unused color tokens (2373), legacy randomised candles (2982), "Flow Reads" prototype (12117).
- **Why low:** inert; only clutter. Cleanup candidates for a later dedicated pass (not now).

### L2 — Duplicate icon/manifest assets across apps
- `icon-192/512.png`, `manifest.json`/`.webmanifest`, `sw.js` exist at repo root AND in `website/`. Separate apps, expected — just don't cross-wire them.

---

## Summary
| Rank | Count | Theme |
|---|---|---|
| Critical | 2 | Finn walk renderer + Finn walk assets (the recurring regression) |
| High | 3 | Deprecated boss data, game-file mirroring, duplicate `drawShell` |
| Medium | 3 | Dual AudioContext, 5 Finn draw paths, dormant lesson canvas |
| Low | 2 | Inert legacy leftovers, per-app asset copies |

**The single highest-value stabilization:** lock Finn (C1+C2). It is the most duplicated, most regression-prone area and the one that has already burned real cycles.
