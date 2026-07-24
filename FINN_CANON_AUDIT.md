# FINN CANON AUDIT

**Status:** Audit only — NO code changed, NO assets deleted. **Date:** 2026-07-06. **Against:** build 251 (`chart-quest.html`).
**Authority:** [`docs/canon/finn_canon.md`](docs/canon/finn_canon.md) (the PERMANENT Finn lockdown). Finn is **protected system #1** — every deletion below, even "safe" ones, is an approval-gated change per `CLAUDE_RULES.md`.
**Scope:** locate every reference to old Finn/turtle assets, deprecated walk-sheets, rig systems, sprite systems, legacy animation, and fallback character systems.

---

## ⚠️ Two headline findings (read first)

1. **The deprecated walk-sheet is STILL rendered live.** During the **wick-fling dash** (airborne, `turtle.vxBoost > 140`), `drawFinnSprite` sets `key='run'` (13085) and then the branch at **13106–13112** overrides `run.png` with the old **`walk-sheet.png`** frames. This directly contradicts `finn_canon.md` §3/§4 ("It is NEVER correct to fall back to `walk-sheet.png`"). The regression gate misses it because it only checks the *grounded* path. **This is the highest-priority finding.**

2. **`body.png` / `leg.png` are load-bearing dead pixels.** They are never drawn, but the loader (12888–12889) still fetches them and `FINN_SPRITES.ready` only flips true once **all 9** files load (`onerror` is a no-op, 12932). **Deleting these files from disk alone would make `ready` stay false forever → the permanent procedural-turtle fallback** (the same placeholder you saw during the load race, but permanent). They must be removed from the loader map *first*.

---

## Findings

Each finding: **File · Line · System · Active/Inactive · Risk · Safe to delete now? · Dependencies.**

### F1 — Walk-sheet rendered in the wick-fling dash
- **File:** `chart-quest.html`
- **Line:** 13106–13112 (render) · fed by loader 12888, 12895–12913 (`FINN_SPRITES.walk`)
- **System:** deprecated walk-sheet (build-232 baked 12-frame cycle), reached by the `key==='run' && FINN_SPRITES.walk.length===12` fallback branch
- **Active/Inactive:** **ACTIVE** — reachable whenever `vxBoost > 140` (wick-fling dash, 13085)
- **Risk:** **HIGH** — deprecated old art shown in a live gameplay state; canon violation (§3/§4); also gates the 868 KB asset
- **Safe to delete now?** **NO** — requires a code change first: delete the 13106–13112 branch so the dash renders `run.png` (the `img=I.run` already set at 13085), verify the dash on-device, then remove `walk`/`walkC` from the loader and the asset
- **Dependencies:** `FINN_SPRITES.walk` (12912), the loader `walk` key (12888), the `ready` counter (12930), `drawFinnSprite` airborne branch (13102–13112)

### F2 — `finn/body.png` + `finn/leg.png` (build-244 rig assets)
- **File:** `finn/body.png`, `finn/leg.png` (on disk; **git-untracked `??`**) · loaded at `chart-quest.html` 12889
- **Line:** loader 12889 (`body`/`leg` keys) · `FINN_H.body` 12938
- **System:** build-244 procedural leg rig assets
- **Active/Inactive:** **INACTIVE** (pixels never drawn — `.img.body`/`.img.leg` are never read) but **loaded**
- **Risk:** **MEDIUM** — load-bearing for `FINN_SPRITES.ready`; naive disk-delete → permanent procedural fallback
- **Safe to delete now?** **NO — delete after verification** (remove `body`/`leg` from loader map 12889 + `FINN_H.body` 12938 + the dead rig fns F3, confirm `ready` still flips true, then delete the two files)
- **Dependencies:** loader files map (12889), `ready` counter (12930), `drawFinnRigLeg`/`drawFinnRigTail` (F3), `FINN_H.body` (12938)

### F3 — `drawFinnRigLeg` / `drawFinnRigTail` (rig helpers)
- **File:** `chart-quest.html`
- **Line:** 12973 (`drawFinnRigLeg`), 12984 (`drawFinnRigTail`)
- **System:** build-244 procedural leg/tail rig helpers
- **Active/Inactive:** **INACTIVE** — defined but **never called** (grep confirms zero call sites; the grounded render at 13145–13151 draws the whole `run.png` frame instead)
- **Risk:** **LOW** — pure dead code; removal has no runtime effect
- **Safe to delete now?** **YES** (no callers) — still a protected-system edit needing approval
- **Dependencies:** none (would-be callers were removed in build 250). Conceptually consume `finn/leg.png` only if called.

### F4 — `walkC[]` closed-eye walk frames
- **File:** `chart-quest.html`
- **Line:** 12881 (decl), 12912 (populated)
- **System:** the closed-eye half of the walk-sheet (12 frames)
- **Active/Inactive:** **INACTIVE** — pushed but **never read** anywhere
- **Risk:** **LOW**
- **Safe to delete now?** **Delete with F1** (same loader block / same asset)
- **Dependencies:** loader `walk` slicing (12895–12913), `walk-sheet.png`

### F5 — `finn/hero.png` (orphaned-in-code, canon-designated)
- **File:** `finn/hero.png` (on disk, 312 KB, tracked)
- **Line:** not referenced by any code path; canon `finn_canon.md` §1 line 23 designates it "Hero/menu/victory via `drawHeroFinn` (Non-gameplay)"
- **System:** official hero/menu sprite per canon
- **Active/Inactive:** **INACTIVE in code** — not in the loader `files` map; `drawHeroFinn` (4318) reuses `drawTurtle`→`run.png`, never `hero.png`
- **Risk:** **LOW–MEDIUM** — code-vs-canon discrepancy: canon lists it as official, code doesn't wire it
- **Safe to delete now?** **NO — DO NOT DELETE** (canon-designated; likely intended for hero/menu/victory). Resolve the discrepancy with the founder, don't delete
- **Dependencies:** `finn_canon.md` §1; `drawHeroFinn` (4318) is the intended-but-unwired consumer

### F6 — Procedural `drawTurtle()` fallback
- **File:** `chart-quest.html`
- **Line:** 13156 (def) · dispatch 13159 (`if (FINN_SPRITES.ready) drawFinnSprite()`); called 14444, 4342
- **System:** shape-drawn procedural turtle — the graceful load-failure fallback
- **Active/Inactive:** **ACTIVE** — both the sanctioned fallback *and* the entry point that dispatches to `drawFinnSprite`
- **Risk:** **N/A** (required)
- **Safe to delete now?** **NO — DO NOT DELETE** — canon §3 keeps it as "Fallback ONLY"; deleting it breaks Finn entirely (it's the dispatcher)
- **Dependencies:** `drawFinnSprite`, `FINN_SPRITES.ready`; callers at 14444 (game loop) and 4342 (`drawHeroFinn`)

### F7 — `drawTurtleFalling()` (cinematic procedural turtle)
- **File:** `chart-quest.html`
- **Line:** 16963 (def, nested in the cinematic scene `S`) · called 17091, 17129
- **System:** procedural falling-turtle used in the opening/market-maker cinematic (separate from gameplay Finn)
- **Active/Inactive:** **ACTIVE** (cinematic)
- **Risk:** **MEDIUM if touched** — the opening cinematic is a fragile, protected UI flow
- **Safe to delete now?** **NO — DO NOT DELETE** — it's a live cinematic element. (Flag: it's procedural turtle art, not the PNG Finn — if canon wants the cinematic on PNG art, that's a separate founder decision, not a deletion)
- **Dependencies:** cinematic scene state `S` (S.tx/ty/trot), callers 17091/17129

### F8 — `FINN_H.body` vestigial dimension
- **File:** `chart-quest.html`
- **Line:** 12938 (`const FINN_H = { …, body: 31 }`)
- **System:** sprite-height table entry for the never-drawn `body` sprite
- **Active/Inactive:** **INACTIVE** (body is never selected as `key`)
- **Risk:** **LOW**
- **Safe to delete now?** **Delete with F2** (part of the rig cleanup)
- **Dependencies:** none

### F9 — `content-assets/finn-canon-poses-A/B.png` (source art)
- **File:** referenced in comment only, `chart-quest.html` 12876 (+ mirror `index.html`)
- **System:** the offline canonical pose sheets the runtime crops were composed from
- **Active/Inactive:** **INACTIVE** at runtime (comment/provenance only)
- **Risk:** none
- **Safe to delete now?** **NO — DO NOT DELETE** — source art / provenance for the shipping sprites
- **Dependencies:** none (documentation reference)

### F10 — Canon & tooling references to the deprecated systems
- **Files/Lines:**
  - `docs/canon/finn_canon.md` §3 (the deprecation record — correct)
  - `docs/canon/character_canon.md`, `animation_canon.md`, `architecture_map.md`, `protected_systems.md`, `CLAUDE_RULES.md`, `regression_checklist.md`, `dev_workflow.md`, `development_health_report.md` — each names `walk-sheet`/rig as guardrails
  - `docs/canon/system_inventory.md`, `docs/canon/duplicate_report.md` — list `walk-sheet.png`/`body.png`/`leg.png` as inventory items
  - `scripts/verify.js` — 5 `walk-sheet` references (the gate that asserts the deprecated art stays inactive)
- **System:** documentation & the regression guardrail
- **Active/Inactive:** **ACTIVE guardrails** (not code paths)
- **Risk:** **LOW**
- **Safe to delete now?** **NO** — keep the guardrails. **Update** the `system_inventory.md` / `duplicate_report.md` inventory entries *after* the assets are actually removed (F1/F2). Keep the `verify.js` gate and extend it to also catch the *airborne* walk-sheet branch (F1)
- **Dependencies:** none

---

## Asset inventory (`finn/`)

| Asset | Size | Loaded | Rendered | Canon status |
|---|---|---|---|---|
| `run.png` | 85 K | ✅ | ✅ grounded + jump-dash base | **OFFICIAL** |
| `jump.png` | 60 K | ✅ | ✅ rising jump | **OFFICIAL** |
| `vboost.png` | 62 K | ✅ | ✅ jetpack boost | **OFFICIAL** |
| `shell-fall-roll.png` | 45 K | ✅ | ✅ spin/tuck ball | **OFFICIAL** |
| `land.png` | 66 K | ✅ | ✅ landing squash | **OFFICIAL** |
| `dazed-after-fall.png` | 52 K | ✅ | ✅ big-fall dazed | **OFFICIAL** |
| `walk-sheet.png` | **868 K** | ✅ | ⚠️ **only in wick-fling dash (F1)** | **DEPRECATED** (canon §3) |
| `body.png` | 60 K | ✅ | ❌ never | **DEPRECATED** rig — untracked `??` |
| `leg.png` | 6 K | ✅ | ❌ never | **DEPRECATED** rig — untracked `??` |
| `hero.png` | 312 K | ❌ | ❌ (canon designates it hero art) | canon-official, **unwired in code (F5)** |

---

## Deletion plan

> Everything here is a **protected-system (#1) change** — do not execute without explicit founder approval, and verify on-device in beginner mode (`?fresh=1`) after each step. This audit does not perform any of it.

### ✅ SAFE TO DELETE NOW (dead code, zero runtime effect, no callers)
- **`drawFinnRigLeg` (12973) + `drawFinnRigTail` (12984)** — defined, never called (F3).
- **`FINN_H.body` entry (12938)** — vestigial dimension for the never-drawn body (F8).
- *(These are code deletions only; they touch no assets and cannot change rendering.)*

### 🟡 DELETE AFTER VERIFICATION (load-bearing or needs a preceding code change)
Do in this order — reversed, it breaks Finn:
1. **Walk-sheet (F1/F4) — the priority.** Remove the airborne walk-sheet branch (13106–13112) so the wick-fling dash renders `run.png`; verify the dash on-device; remove `walk` from the loader `files` map (12888) + the walk/walkC slicing (12895–12913); confirm `FINN_SPRITES.ready` still flips true; **then** delete `finn/walk-sheet.png` (868 K).
2. **Rig assets (F2).** After F3 is deleted, remove `body`/`leg` from the loader `files` map (12889); confirm `ready` still flips true; **then** delete `finn/body.png` + `finn/leg.png` (both untracked).
3. **Docs (F10).** Update `system_inventory.md` + `duplicate_report.md` to drop the removed items; extend `scripts/verify.js` to also assert the *airborne* walk-sheet branch is gone.

### 🛑 DO NOT DELETE
- The **6 official sprites** (`run`, `jump`, `vboost`, `shell-fall-roll`, `land`, `dazed-after-fall`).
- **`drawTurtle()` (13156)** — the canon-sanctioned fallback *and* the dispatcher to `drawFinnSprite`.
- **`drawTurtleFalling()` (16963)** — active opening-cinematic element (protected UI flow).
- **`hero.png` (F5)** — canon-designated hero/menu art; resolve the code-vs-canon gap, don't delete.
- **`content-assets/finn-canon-poses-A/B.png` (F9)** — offline source art / provenance.
- The **canon guardrail docs + `verify.js` gate (F10)** — they enforce the lockdown.

---

## Recommended next action
The single highest-value follow-up is **F1**: the deprecated `walk-sheet.png` is the only deprecated system still *rendering* (in the wick-fling dash), and it's an 868 KB asset. Fixing it removes a live canon violation and unblocks deleting the biggest deprecated file. Everything else is dead code or load-bearing-but-invisible. Want me to draft the F1 fix as a scoped, approval-gated PRE-FLIGHT (still no code) so it's ready to green-light?

---

*Audit only. No game code, assets, or canon were modified. Line references are to build 251. Executing any deletion is an approval-gated change to protected system #1 per `CLAUDE_RULES.md`.*
