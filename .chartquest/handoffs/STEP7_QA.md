# Step 7 QA — Three-Artifact Parity Gate

## TASK

Independently QA the exact staged candidate on `codex/step7-artifact-parity`.

## OBJECTIVE

Verify that ordinary regression gate #8 requires byte identity across:

- `chart-quest.html`
- `index.html`
- `website/game.html`

## CURRENT STATE

- Worktree: `/Users/owl/Claude/Projects/Shell Trade/.codex/worktrees/step7-artifact-parity`.
- HEAD before controlled feature-branch integration: `bdf7dd413a2cbcadcc26e8382decc40e93f8ae78`.
- Staged files: exactly three approved tooling files.
- Unstaged changes: none.
- Candidate was uncommitted during QA.
- QA outcome: **PASS**.

## WORK COMPLETED

QA independently inspected the staged patch and reran the syntax, fixture, standalone, full-regression, dirty-primary, diff-integrity, and scope checks.

## FILES TOUCHED

None. Temporary fixture directories were created under the OS temporary directory and automatically removed.

## TESTS

| Test | Result |
|---|---|
| Syntax: `scripts/artifact_parity.js` | PASS |
| Syntax: `scripts/artifact_parity.test.js` | PASS |
| Syntax: `scripts/verify.js` | PASS |
| Artifact-parity fixtures | PASS, 5/5 |
| Standalone checker in isolated candidate | PASS |
| Full candidate regression verifier | PASS: 20 pass, 0 fail, 0 warn, 3 skip |
| Checker against dirty primary | Expected FAIL, exit 1 |
| Cached diff check | PASS |
| Unstaged diff check | PASS |
| Staged-file scope | PASS |
| Game-artifact scope | PASS |

Candidate SHA-256 for all three artifacts:

`415b070ad89d7acb4ee113bd7da91157848abfe39a780f5dae3ca1b5a5303b2c`

Dirty-primary evidence:

- `chart-quest.html`: build 360, SHA-256 `5793e416f4e011f5be2f94f293e65cb58323104c0c880aac8cd2259fe6bb4145`.
- `index.html`: build 359, SHA-256 `415b070ad89d7acb4ee113bd7da91157848abfe39a780f5dae3ca1b5a5303b2c`.
- `website/game.html`: build 359, same SHA-256 as `index.html`.

The checker exited 1 and reported both drift paths.

## EXPECTED VS ACTUAL

| # | Expected | Actual | Status |
|---|---|---|---|
| 1 | Three identical artifacts pass | Fixture and isolated candidate passed | PASS |
| 2 | Changed `index.html` fails and names the path | Nonzero; named `index.html` | PASS |
| 3 | Changed `website/game.html` fails despite unchanged metadata | Nonzero; named `website/game.html` | PASS |
| 4 | Missing mirror or site artifact fails path-specifically | Both missing-file fixtures failed and named the missing path | PASS |
| 5 | Every mismatch exits nonzero | All four negative fixtures asserted nonzero | PASS |
| 6 | Existing regression checks remain behaviorally unchanged | Full isolated verifier passed with no failures or warnings | PASS |
| 7 | Dirty-primary drift remains untouched and reported honestly | Exit 1; both drift paths reported; no artifact changes | PASS |
| 8 | Reviewer and QA independently rerun evidence | QA independently reran the complete matrix | PASS |

## INVARIANT RESULTS

- **INV-001 — PASS:** `chart-quest.html` remains the source of truth; no game artifact was modified.
- **INV-007 — PASS for local candidate identity:** routine verification now checks all three local artifacts byte-for-byte.
- Served `/game` identity remains separate and untested; no production identity claim is made.
- No gameplay, save, curriculum, boss, movement, security, provider, credential, or deployment invariant changed.

## RISKS / SKIPS

- At QA time the candidate was staged but uncommitted and was not yet durable in a fresh clone.
- Optional Puppeteer headless boot was unavailable.
- Build-tag increment and protected-system comparison were not applicable because the game source was unchanged.
- Permission-denied behavior lacks a dedicated fixture, although non-ENOENT read errors fail closed.
- Production smoke, served fingerprint, gameplay, and provider verification were not tested and remain outside this ticket.

## OUTCOME

**PASS.** All eight acceptance criteria passed independently. The exact candidate may advance to controlled feature-branch integration. This QA result does not authorize merge, release, or deployment.

## NEXT ACTION

Persist the approved candidate on its isolated feature branch, update lifecycle records, and adjudicate Step 7 completion while production remains frozen.

## DO NOT TOUCH

- The three game artifacts
- Dirty primary work
- Production/provider configuration
- Credentials
- `main`
- Release-freeze settings

## PM/CTO CLOSEOUT ADDENDUM

After QA returned PASS, the exact reviewed and tested three-file candidate was committed on the isolated feature branch as `31ffd6f3003a439c051c0dd4c2358e40a3b5f1af` (`fix(gate): verify all three game artifacts`). Post-commit syntax, 5/5 fixtures, and the full gate were rerun successfully with the same 20 pass, 0 fail, 0 warn, 3 skip result. The worktree is clean. No push, merge, `main` change, or deployment occurred.
