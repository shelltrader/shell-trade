# FINN CLEANUP — PHASE 1 COMPLETION REPORT

**Status:** ✅ COMPLETE & VERIFIED. **Stopped after Phase 1 as instructed — Phases 2 & 3 NOT started.** **Date:** 2026-07-06. **Build:** 251 → **252**.
**Scope executed:** F3 (`drawFinnRigLeg` / `drawFinnRigTail`) + F8 (`FINN_H.body`) — the pure dead-code items only, per [`FINN_CLEANUP_PREFLIGHT.md`](FINN_CLEANUP_PREFLIGHT.md) Phase 1.
**Change class:** LARGE / protected system #1 (Finn) — executed under the approval given, shipped with `CQ_ALLOW_PROTECTED=1`.

---

## 1. Files changed

| File | Change | Notes |
|---|---|---|
| `chart-quest.html` | −30 lines (rig helpers) + 2 lines edited (`FINN_H`, `BUILD_TAG`) | source of truth |
| `index.html` | regenerated mirror | via `cq.sh ship`, sha256-identical |

**Not touched by Phase 1** (these show in `git status` but are from prior tasks, not this phase): `docs/canon/*` and `scripts/verify.js` (the guardian-removal task) and the untracked `finn/body.png` / `finn/leg.png` (Phase 2 targets — **not deleted**, they remain on disk and in the loader).

---

## 2. Lines removed

| Item | Location (pre-edit) | Action | Lines |
|---|---|---|---|
| F3 · `drawFinnRigLeg` + comment | 12970–12982 | deleted | 13 |
| F3 · `drawFinnRigTail` + comment | 12983–12998 | deleted | 16 |
| (trailing blank collapsed) | 12999 | deleted | 1 |
| F8 · `FINN_H.body` entry | 12938 | edited in place (removed `, body: 31`) | 0 net |
| `BUILD_TAG` | 2392 | edited in place (251 → 252) | 0 net |

**Net: 30 lines removed** from `chart-quest.html`; 0 assets deleted; loader, `FINN_SPRITES.ready`, and all render paths untouched.

---

## 3. Verification results

**Build gate — `CQ_ALLOW_PROTECTED=1 scripts/cq.sh ship`:** **PASS** (9 pass · 0 fail · 1 warn · 1 skip)
- ✓ [1] run.png active (static legs) · ✓ [2] deprecated Finn inactive ("**rig legs uncalled**") · ✓ [3a] 4 script blocks parse · ✓ [7] BUILD_TAG 250→252 · ✓ [8] index.html mirrors source
- ⚠ [10] protected changed: "Save keys" — **carryover from the guardian-removal task** (`cq_trials`), not Phase 1; Finn render signature was **not** flagged (confirms the render path is byte-unchanged)
- – [3b] headless boot skipped (puppeteer not installed)

**Live boot check (preview, `?fresh=1`, build 252) —** JS console eval:
| Check | Result |
|---|---|
| `FINN_SPRITES.ready` | **`true`** (unchanged) |
| `Object.keys(FINN_SPRITES.img)` | `run, jump, vboost, shell, land, dazed, walk, body, leg` (9 — loader untouched, as intended) |
| `run.png` complete | `true` |
| `FINN_H` | `{ run, jump, vboost, shell, land, dazed }` — **no `body`** |
| `typeof drawFinnRigLeg` | **`undefined`** (removed) |
| `typeof drawFinnRigTail` | **`undefined`** (removed) |
| `typeof drawFinnSprite` | `function` (intact) |
| `typeof drawTurtle` (fallback/dispatcher) | `function` (intact) |
| Console errors | **none** |

**Grep-clean:** `drawFinnRigLeg` = 0 · `drawFinnRigTail` = 0 · `FINN_H.body` = 0 · `body: 31` = 0 (in `chart-quest.html`).

**Visual:** the `?fresh=1` screenshot showed the opening-cinematic **video** (black in a headless browser) — the documented gotcha in `finn_canon.md §4.4`, not a Finn issue. Because Phase 1 did not touch the render path (gate [10] did not flag Finn render; `drawFinnSprite` unchanged), the Level-1 "Finn-on-chart renders as `run.png`" screenshot captured earlier this session remains valid.

---

## 4. Regression results (against the required invariants)

| Invariant | Result | Evidence |
|---|---|---|
| Never break `FINN_SPRITES.ready` | ✅ unchanged (`true`) | live eval; loader not touched |
| Never trigger fallback turtle | ✅ | `ready===true` → sprite path; `run.png` complete |
| `run` (grounded walk/idle) | ✅ renders | sprite `ready`; `drawFinnSprite` intact |
| `jump` | ✅ ready | `img.jump` complete + naturalWidth>0 |
| `vboost` (boost) | ✅ ready | `img.vboost` complete |
| `land` | ✅ ready | `img.land` complete |
| `shell` (spin/tuck) | ✅ ready | `img.shell` complete |
| `dazed` | ✅ ready | `img.dazed` complete |
| No console errors | ✅ none | error-level console clean |
| Movement/physics/feel | ✅ unchanged | deletions only; no `CFG`/hitbox/`update` edits |

All six gameplay-state sprites reported `ready` (complete + non-zero dimensions), and the state-selection switch (`13072–13090`) and grounded draw were not modified.

---

## 5. Remaining legacy systems (still present — for Phases 2 & 3)

| Finding | Item | Where | Status |
|---|---|---|---|
| **F1** | Walk-sheet render branch | `chart-quest.html` ~13106 (`FINN_SPRITES.walk.length === 12`) | ⏳ present (still renders in wick-fling dash) |
| **F1** | `walk` loader key + slicing → `FINN_SPRITES.walk` | 12888, 12895–12913 | ⏳ present |
| **F1** | `finn/walk-sheet.png` (868 KB) | disk (tracked) | ⏳ present |
| **F4** | `walkC` array (closed-eye frames) | 12881, 12912 | ⏳ present |
| **F2** | `body` / `leg` loader keys | 12889 | ⏳ present |
| **F2** | `finn/body.png` (60 KB) + `finn/leg.png` (6 KB) | disk (untracked) | ⏳ present |

**Cleared this phase:** F3 (rig helpers) ✅ · F8 (`FINN_H.body`) ✅.
**Legacy remaining:** ~70% by item count; **~100% by footprint** — all 3 deprecated assets (~934 KB) and the live walk-sheet violation (F1) are untouched, exactly as planned for a Phase-1 warm-up.

---

## Status & next step

Finn is **fully functional** and the deprecated dead code is gone. **Halting here per instruction — Phases 2 (body/leg) and 3 (walk-sheet) are NOT started and require separate approval.** Changes are on branch `security-scaling-hardening`, **not committed**.

Rollback if needed: `git checkout -- chart-quest.html index.html` (both tracked; Phase 1 deleted no assets, so nothing is unrecoverable).

---

*Phase 1 executed under explicit approval. No further phases will proceed without approval. Line references reflect pre-edit build 251 positions; the shipped build is 252.*
