# FINN CLEANUP — PRE-FLIGHT

**Status:** Plan only — NO code written, NO files modified, NO assets deleted. **Date:** 2026-07-06. **Against:** build 251.
**Authority:** [`FINN_SINGLE_SOURCE_OF_TRUTH.md`](FINN_SINGLE_SOURCE_OF_TRUTH.md) · [`FINN_CANON_AUDIT.md`](FINN_CANON_AUDIT.md) · [`docs/canon/finn_canon.md`](docs/canon/finn_canon.md).
**Classification:** **LARGE** change to **protected system #1 (Finn)** → requires explicit founder approval + `CQ_ALLOW_PROTECTED=1 scripts/cq.sh ship`, per `CLAUDE_RULES.md`. This document is the plan to approve; nothing here executes.

---

## PRE-FLIGHT block (CLAUDE_RULES format)

```
Task:
Bring the implementation into compliance with FINN_SINGLE_SOURCE_OF_TRUTH.md by removing
the legacy Finn systems F1, F2, F3, F4, F8 — in the safest possible order.

Files Changing:
- chart-quest.html          (source: code deletions)
- index.html               (mirror, regenerated via cq.sh — never hand-edited)
- finn/walk-sheet.png       (delete, tracked → git rm)
- finn/body.png             (delete, untracked → back up then rm)
- finn/leg.png              (delete, untracked → back up then rm)
- scripts/verify.js         (gate: update the walk-sheet assertions after removal)
- docs/canon/system_inventory.md, duplicate_report.md, finn_canon.md (record the removal)

Files Protected (NOT touched):
- The 6 official sprites (run/jump/vboost/shell-fall-roll/land/dazed-after-fall) + hero.png
- drawFinnSprite render logic (except the walk-sheet branch), drawTurtle fallback,
  drawHeroFinn, drawTurtleFalling, finnLiveFlame, FINN_NOZZLE, COLOR, CFG, hitbox, physics
- Movement, bosses, lessons, economy, save keys, portal colors

Protected Systems Affected:
YES — #1 Finn character art & sprites.

Risk Score:
Character 6/10 (the target system) · Movement 1 · UI 1 · Progression 0 · Lessons 0 · Save 0
→ Overall MEDIUM (well-contained: one code region + 3 asset files, phased & reversible)

Rollback Plan:
Per-phase, uncommitted, on branch security-scaling-hardening. See §4.
```

**Await explicit approval before any code is written.**

---

## 1. Exact files affected

| File | Change | Git state |
|---|---|---|
| `chart-quest.html` | Delete legacy code (rig fns, walk slicing, walk-sheet render branch, loader keys, `FINN_H.body`, `walk`/`walkC` fields) | tracked (M) |
| `index.html` | Regenerated mirror via `cq.sh ship` | tracked (M) |
| `finn/walk-sheet.png` | Delete (868 KB) | **tracked** → `git rm` (git restores on rollback) |
| `finn/body.png` | Delete (60 KB) | **untracked `??`** → back up first (git can't restore) |
| `finn/leg.png` | Delete (6 KB) | **untracked `??`** → back up first |
| `scripts/verify.js` | Update gate check [2] walk-sheet assertions | tracked |
| `docs/canon/system_inventory.md` · `duplicate_report.md` · `finn_canon.md` | Record removal | tracked |

---

## 2. Exact line ranges affected (`chart-quest.html`, build 251)

| Finding | Lines | What | Action |
|---|---|---|---|
| **F8** | `12938` | `FINN_H = { …, body: 31 }` | remove the `, body: 31` entry |
| **F3** | `12970–12998` | rig comment + `drawFinnRigLeg` (12973–12982) + tail comment (12983) + `drawFinnRigTail` (12984–12998) | delete the whole span (keep `finnDazedT` decl at 12968) |
| **F1 render** | `13106–13115` | `if (key==='run' && FINN_SPRITES.walk.length===12) { …paddle walk-sheet… } else { drawImage(src) }` | collapse to the `else` body only → `ctx.drawImage(src, -dw/2, -dh/2, dw, dh);` |
| **F1 loader key** | `12888` | `walk: 'finn/walk-sheet.png',` in the `files` map | remove the `walk` entry |
| **F1/F4 slicing** | `12895–12913` | `if (k === 'walk') { …slice into walk/walkC… } else { …mip… }` | remove the `walk` branch; make the mip block unconditional |
| **F1/F4 fields** | `12881` | `FINN_SPRITES = { …, walk: [], walkC: [] }` | remove the `walk` and `walkC` fields |
| **F2 loader keys** | `12889` | `body: 'finn/body.png', leg: 'finn/leg.png'` in the `files` map | remove the `body` and `leg` entries |

Untouched anchors that must keep working: `FINN_SPRITES.ready = true` gate (`++got === keys.length`, 12930), `drawFinnSprite` (13000), `drawTurtle` dispatch (13159), the pose-selection switch (13072–13090).

---

## 3. Deletion order — the safest possible sequence

**Governing rule (never violate):**
> **(a)** Remove a loader `files` key **before** deleting its asset — never delete a file still in the map (`onerror` is a no-op → `got` never reaches `keys.length` → `ready` never true → **permanent procedural turtle**).
> **(b)** Remove every **reader** of `FINN_SPRITES.walk` **before** removing the `walk`/`walkC` fields — otherwise `undefined.length` throws inside `frame()` → the whole game freezes.

Ordered so that **the visible change happens last**, each phase leaves Finn 100% functional, and you can stop after any phase.

### PHASE 0 — Baseline (no changes)
Boot `?fresh=1`, wait for load, confirm `FINN_SPRITES.ready === true`, screenshot Finn (the detailed `run.png`, not the procedural turtle). This is the comparison point.

### PHASE 1 — Pure dead code · F3 + F8 · *zero behavior change*
1. Delete `FINN_H.body` (12938).
2. Delete `drawFinnRigLeg` + `drawFinnRigTail` (12970–12998).
- Nothing here is ever called or read → **no visible or functional change.** Loader, `ready`, all six states untouched.
- Verify (§5), then this phase is safely committable on its own.

### PHASE 2 — Rig assets · F2 · *invisible (body/leg never render)*
3. Remove `body` + `leg` from the `files` map (12889).
4. **Verify `FINN_SPRITES.ready === true`** on a fresh load (now 7 keys: run/jump/vboost/shell/land/dazed/walk). ← gate before any file delete.
5. Back up, then delete `finn/body.png` + `finn/leg.png`.
6. Verify `ready === true` again + Finn renders. No visible change (these pixels never drew).

### PHASE 3 — Walk-sheet · F1 + F4 · *the ONE visible change (last)*
7. Remove the walk-sheet **render branch** (13106–13115 → collapse to the `drawImage(src)` line). ← reader removed first (rule b). The wick-fling dash now draws `run.png`. **Verify the dash on-device.**
8. Remove the `walk` key (12888) + the `if (k==='walk')` **slicing branch** (12895–12913, de-`else` the mip block) + the `walk`/`walkC` **fields** (12881).
9. **Verify `FINN_SPRITES.ready === true`** on a fresh load (now 6 keys) + no console error.
10. Back up, then `git rm finn/walk-sheet.png`.
11. Verify `ready === true`, the dash renders `run.png`, and the gate passes.

### PHASE 4 — Docs + gate + ship
12. Update `scripts/verify.js` check [2] (drop/adjust the walk-sheet-slicing assertions; add an assertion that the airborne walk-sheet branch is gone).
13. Update `system_inventory.md` + `duplicate_report.md`; annotate `finn_canon.md §3` as "removed build 252".
14. Bump `BUILD_TAG` → build 252; run `CQ_ALLOW_PROTECTED=1 scripts/cq.sh ship` (mirror + gate + tag).

---

## 4. Rollback strategy

- **Not committed until each phase passes.** Work on branch `security-scaling-hardening`, stage by explicit path.
- **Per-phase code revert:** `git checkout -- chart-quest.html index.html scripts/verify.js docs/canon/*` restores all code/doc changes.
- **Tracked asset:** `git checkout -- finn/walk-sheet.png` restores it.
- **Untracked assets (the trap):** `finn/body.png` and `finn/leg.png` are **untracked — git cannot restore them.** Before Phase 2 deletes them, copy both to a backup (e.g. `archive/finn-legacy/` or the scratchpad). Rollback = copy them back.
- **Fast recovery if `ready` ever sticks false** (procedural turtle appears permanently): re-add the just-removed loader key OR restore the just-deleted asset — whichever step preceded the symptom — and reload.
- **Each phase is an independent, revertible commit**; stopping after any phase is a valid end state.

---

## 5. Verification steps (per phase + final)

**After every phase (console + boot):**
- `FINN_SPRITES.ready === true` and `Object.keys(FINN_SPRITES.img)` = only the expected keys (Phase 1: 9 → Phase 2: 7 → Phase 3: 6).
- Boot `?fresh=1` → Finn renders as the **detailed `run.png` sprite within ~1s** (NOT the flat procedural turtle) → proves `ready` flipped.
- Zero console errors; `node scripts/verify.js` (or `cq.sh verify`) passes.

**Loader-key gate (Phases 2 & 3):** confirm `ready === true` on a fresh load **before** deleting any asset file.

**Reader gate (Phase 3):** confirm the render branch is removed **before** the `walk`/`walkC` fields — then confirm no `undefined.length` error in console.

**Final full pass:** the on-device regression list in §D below.

---

## 6. Regression risks

| # | Risk | Cause | Mitigation |
|---|---|---|---|
| R1 | **Permanent procedural turtle** (`ready` stuck false) | Asset deleted while still in `files` map → `onerror` no-op | Rule (a): remove key → verify `ready` → then delete file |
| R2 | **Whole game freezes** (`frame()` throws) | `FINN_SPRITES.walk` field removed while the render branch still reads `.length` | Rule (b): remove the render branch (13106–13115) before the fields (12881) |
| R3 | Wick-fling dash looks wrong | F1 switches the dash from walk-sheet paddle to `run.png` | On-device dash test (§D); this is the intended canon fix, cosmetic only |
| R4 | Gate fails | `verify.js` walk-sheet assertions reference now-removed slicing | Phase 4 updates the gate |
| R5 | Mirror drift | `index.html` not regenerated | `cq.sh ship` (never hand-edit) |
| R6 | Irreversible asset loss | `body.png`/`leg.png` untracked | Back up before delete (§4) |
| R7 | Cross-`<script>`-block scope break | n/a — all edits in one block, deletions only | Low; syntax gate + boot catch it |

None of F1–F8 touch `jump`/`vboost`/`land`/`shell`/`dazed` selection or draw — those `key` branches (13074–13089) and the grounded `run` draw (13150) are **not modified**.

---

## 7. Expected final Finn footprint (post-cleanup)

Matches `FINN_SINGLE_SOURCE_OF_TRUTH.md §8`:

- **`finn/` — 7 files:** `run · jump · vboost · shell-fall-roll · land · dazed-after-fall · hero`. *(Deleted: `walk-sheet`, `body`, `leg`.)*
- **Loader `files` map — 6 keys:** `{ run, jump, vboost, shell, land, dazed }`.
- **`FINN_SPRITES`** = `{ ready, img:{6}, mip:{≤6} }` — no `walk[]`/`walkC[]`.
- **`FINN_H`** — 6 keys (no `body`).
- **Functions:** `drawFinnSprite`, `drawTurtle` (fallback), `drawHeroFinn`, `finnLiveFlame`, `drawTurtleFalling`. *(Deleted: `drawFinnRigLeg`, `drawFinnRigTail`.)*
- **States:** 6 `key` values — `run · jump · vboost · shell · land · dazed`; wick-fling dash → `run.png`.

---

## Answers

### A) Smallest possible cleanup we can safely execute first
**Phase 1 = F3 + F8** — delete `drawFinnRigLeg` + `drawFinnRigTail` (12970–12998) and the `FINN_H.body` entry (12938). These are **pure dead code**: the functions have zero call sites and `body` is never selected as a render `key`. It touches **no** asset, **no** loader key, **no** `ready` math, and **no** render path — so it cannot possibly break `ready`, trigger the fallback, or affect jump/boost/land/shell/dazed. Roughly ~30 lines, no file deletions.

### B) Percentage of legacy Finn systems remaining after that cleanup
- **By discrete legacy item:** ~3 of ~10 removed → **~70% remains** (the 3 assets, 3 loader keys, walk slicing, the live render branch all remain).
- **By footprint/impact:** **~100% remains** — all ~934 KB of deprecated assets and the *live walk-sheet canon violation (F1)* are untouched.
- Phase 1 is a **zero-risk warm-up**, not the substantive cleanup. The value is in Phases 2–3.

### C) If we stop after Phase 1, will Finn still be fully functional?
**Yes — 100% functional.** Phase 1 removes only never-called functions and an unread table entry. `FINN_SPRITES.ready`, the loader, the fallback, and all six render states are byte-for-byte unchanged. The only thing still "wrong" is that the deprecated walk-sheet keeps rendering in the wick-fling dash (F1) — a canon issue, not a functional break.

### D) Exact on-device regression tests after cleanup (`?fresh=1`, beginner mode)
1. **Boot / no fallback:** within ~1s Finn is the detailed **`run.png`** sprite (not the flat procedural turtle) → `FINN_SPRITES.ready` flipped true.
2. **Grounded walk/idle:** static-leg `run.png` with body-rock; idle march-in-place, blink, ~11s curious-peek; no leg-swing, no vibrate.
3. **Jump:** SPACE → `jump.png` nose-up on rise, ease nose-down at apex/fall.
4. **Boost:** boost → `vboost.png` while the jetpack flame is lit.
5. **Land:** after a drop → `land.png` squash frame.
6. **Shell mode:** dive (swipe-down / S) and wick-spin → `shell-fall-roll.png` ball, rotating.
7. **Dazed:** big fall → `dazed-after-fall.png`, grounded woozy wobble.
8. **Wick-fling dash (F1 target):** grab a tall wick pole and fling → Finn renders **`run.png`** (jetpack lean), **not** the walk-sheet paddle.
9. **Direction:** move left → sprite mirrors cleanly.
10. **Console:** no errors; `FINN_SPRITES.ready === true`; `Object.keys(FINN_SPRITES.img)` = exactly `run,jump,vboost,shell,land,dazed`.
11. **Gate:** `CQ_ALLOW_PROTECTED=1 scripts/cq.sh ship` → PASS; `index.html` mirrors source.
12. **Feel unchanged:** movement/jump/boost distances identical (deletions only — physics/CFG untouched).

---

*Plan only. No game code, assets, or canon were modified. Executing this is an approval-gated change to protected system #1. Recommended order prioritizes safety (visible change last); if you prefer to fix the F1 canon violation first, Phases 2 and 3 can swap — but Phase 1 stays first regardless.*
