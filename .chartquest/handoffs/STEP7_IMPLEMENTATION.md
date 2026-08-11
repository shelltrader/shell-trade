# Step 7 Implementation — Three-Artifact Parity Gate

## TASK

Close the ordinary-regression fingerprint gap identified in `STEP7_INVESTIGATION.md`.

## OBJECTIVE

Require byte identity across `chart-quest.html`, `index.html`, and `website/game.html` in regression gate #8, with disposable positive and negative evidence.

## CURRENT STATE

- Branch: `codex/step7-artifact-parity`.
- Worktree: `/Users/owl/Claude/Projects/Shell Trade/.codex/worktrees/step7-artifact-parity`.
- Base commit: `bdf7dd413a2cbcadcc26e8382decc40e93f8ae78`.
- The three scoped tooling files are staged for review; no commit, push, merge, or deployment occurred.
- Main's dirty build-360 artifacts were not modified.

## WORK COMPLETED

- Added a reusable fail-closed checker for the three exact canonical artifact paths.
- Replaced gate #8's two-file comparison with the three-file checker.
- Added five disposable fixture cases for equality, two mismatch paths, and two missing-file paths.
- The delegated Implementer supplied the exact patch after its editing tool was blocked by the initial temporary worktree location. The PM/CTO moved the clean worktree inside the project boundary and applied that exact scoped patch with `apply_patch`; no scope or implementation change was introduced during transcription.

## FILES CHANGED

- `scripts/verify.js`
- `scripts/artifact_parity.js` (new)
- `scripts/artifact_parity.test.js` (new)

## IMPLEMENTATION

- `artifact_parity.js` hashes all three files with SHA-256.
- Missing and unreadable artifacts fail closed and name their exact paths.
- Any root-mirror or site hash that differs from the source fails and names the mismatched path.
- The checker exposes a CommonJS function for gate #8 and a small CLI whose process status is nonzero on failure.
- Fixture tests write only under an OS-created temporary directory and remove that exact directory after each case.

## TESTS

- `node --check scripts/artifact_parity.js` — PASS.
- `node --check scripts/artifact_parity.test.js` — PASS.
- `node --check scripts/verify.js` — PASS.
- `node scripts/artifact_parity.test.js` — PASS, 5/5.
- `node scripts/verify.js` in the isolated, staged worktree — PASS: 20 pass, 0 fail, 0 warn, 3 skip. Gate #3c parsed 22 tracked/staged JavaScript files; gate #8 passed three-artifact equality.
- Checker against dirty main — expected FAIL/nonzero and named both `index.html` and `website/game.html` as differing from `chart-quest.html`.
- `git diff --check` — PASS.
- `git diff --quiet -- chart-quest.html index.html website/game.html` — PASS; no game-artifact diff.

## REGRESSION RESULTS

The isolated base remains behaviorally unchanged and the full regression gate passes. The main checkout's inherited build-360 drift is now reported more completely, without synchronizing or rewriting it.

## KNOWN RISKS

- The work remains staged but uncommitted on its feature branch; it is not yet reproducible from a fresh clone.
- Optional headless boot was skipped because Puppeteer is absent; the ticket changes Node tooling only and JavaScript syntax/full static regression passed.
- Production release remains frozen and was not part of this implementation.

## NEXT ACTION

Independent Reviewer inspects the staged diff and reruns the fixture/full-regression evidence. If approved, QA runs the acceptance matrix and records the invariant result.

## DO NOT TOUCH

- `chart-quest.html`
- `index.html`
- `website/game.html`
- Production/provider configuration, secrets, `main`, or unrelated worktrees
