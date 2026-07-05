# Regression Prevention Checklist

**Status:** PERMANENT. Run this **before every commit.** If any box would be checked "changed" and it wasn't explicitly requested, **stop and revert that part.**

> **Closes the loop on the PRE-FLIGHT.** Any system you scored **0/10** in the [PRE-FLIGHT CHECK](CLAUDE_RULES.md#pre-flight-check) must still verify **unchanged** below. If the diff changed something you predicted it wouldn't, that is scope creep — revert it. If reality diverged from the pre-flight risk scores, say so before committing.

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
- [ ] Inline `<script>` blocks **syntax-check clean** (`node --check` on the extracted script).
- [ ] `BUILD_TAG` bumped.
- [ ] `index.html` re-mirrored from source (`cp chart-quest.html index.html`) — never hand-edited.
- [ ] If observable (art/UI/movement): **verified in the browser** (`?fresh=1`), on-device via QR when it's feel/touch/art.
- [ ] Staged **by explicit path** (`git add chart-quest.html index.html …`) — never `git add -A`.
- [ ] Commit does **not** include `deploy.zip`, `_old_*.zip`, `.netlify-token`, `ChartQuestQA/`, `website/`, or unrelated `sw.js` changes.

## Fast self-audit commands (read-only)
```
git status --short                 # what am I about to stage?
git diff --stat HEAD -- chart-quest.html
grep -n "BUILD_TAG =" chart-quest.html   # did I bump it?
diff chart-quest.html index.html && echo "MIRROR OK"   # mirror in sync?
```

## If a box is unexpectedly "changed"
It means a drive-by edit or a deprecated path crept in. **Revert just that hunk** and re-run the checklist. Do not rationalize an unrequested change into the commit.
