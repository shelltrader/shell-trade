# Regression Prevention Checklist

**Status:** PERMANENT. Run this **before every commit.** If any box would be checked "changed" and it wasn't explicitly requested, **stop and revert that part.**

> **Closes the loop on the PRE-FLIGHT.** Any system you scored **0/10** in the [PRE-FLIGHT CHECK](CLAUDE_RULES.md#pre-flight-check) must still verify **unchanged** below. If the diff changed something you predicted it wouldn't, that is scope creep — revert it. If reality diverged from the pre-flight risk scores, say so before committing.

> **The automated gate does most of this for you.** `scripts/cq.sh verify` (run automatically by `ship`) mechanically enforces the five guarantees plus syntax, mirror, `BUILD_TAG`, large-file, and protected-diff checks — and FAILs the commit if any break. **The boxes below are the human backstop** for what a script can't judge: intent, UI/visual correctness, difficulty, and whether a protected change was actually approved (`CQ_ALLOW_PROTECTED=1`). See [dev_workflow.md](dev_workflow.md#the-regression-gate-scriptsverifyjs).

---

## The five guarantees (unchanged unless explicitly requested)

- [ ] **Character assets unchanged** — no new/removed/swapped `finn/*` or `bosses/*`; `drawFinnSprite` still renders `run.png`; the rig (`body.png`/`leg.png`) and `walk-sheet.png` are NOT re-enabled.
- [ ] **Bosses unchanged** — roster count/order/HP/gating untouched; the legacy boss object (9206) was not read or revived.
- [ ] **UI unchanged** — screen flow, portal colors (purple/blue/gold), HUD layout, and the canvas-vs-DOM tap boundary intact.
- [ ] **Lessons unchanged** — `LESSONS`, `LESSON_MASTERY`, and `conceptTier` gates untouched; nothing tests an untaught concept.
- [ ] **Progression unchanged** — level count, gating thresholds, and `cq_*` save-key semantics intact; any new state uses a versioned `cq_*_v` key.

## Scope & hygiene
- [ ] The diff touches **only** the file(s) named in the task's scope statement (almost always just `chart-quest.html`).
- [ ] **No protected system** ([protected_systems.md](protected_systems.md)) changed without explicit approval.
- [ ] **No deprecated system** ([system_inventory.md](system_inventory.md)) re-enabled or extended.
- [ ] Finn did **not** get easier as a side effect (responsiveness ≠ difficulty).

## Mechanics of committing
- [ ] **`scripts/cq.sh ship` passes** (mirror + `scripts/verify.js` gate + tag). The gate enforces: syntax (boot proxy), `index.html` mirrors source, `BUILD_TAG` bumped, Finn canon (run.png active / grounded rig+walk-sheet inactive), lessons/bosses/save load, no >5 MB non-ignored files, and protected-diff. For an **approved** protected change: `CQ_ALLOW_PROTECTED=1 scripts/cq.sh ship`.
- [ ] If observable (art/UI/movement): **verified in the browser** (`?fresh=1`), on-device via QR when it's feel/touch/art. *(The gate does not judge visuals — that's on you.)*
- [ ] Staged **by explicit path** (`git add chart-quest.html index.html …`) — never `git add -A`.
- [ ] Commit does **not** include `deploy.zip`, `_old_*.zip`, `.netlify-token`, `ChartQuestQA/`, `website/`, or unrelated `sw.js` changes.

## Fast self-audit commands (read-only)
```
scripts/cq.sh verify               # the automated gate — PASS/FAIL (run this first)
git status --short                 # what am I about to stage?
git diff --stat HEAD -- chart-quest.html
```

## If a box is unexpectedly "changed"
It means a drive-by edit or a deprecated path crept in. **Revert just that hunk** and re-run the checklist. Do not rationalize an unrequested change into the commit.
