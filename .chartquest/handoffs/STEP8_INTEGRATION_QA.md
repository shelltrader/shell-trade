# Step 8 Integration QA — Command-Center Durability

## TASK

Independently QA the exact reviewed integration candidate at `04227af12f2596cbfde1ee0189821a9f1c259ec4`.

## OBJECTIVE

Prove that the Step 6B controls, project autonomy configuration, control plane, and QA-passed Step 7 tooling are safely reproducible without gameplay, credential, provider, production, or unrelated changes.

## CURRENT STATE

- Branch: `codex/command-center-integration`.
- Reviewed HEAD: `04227af12f2596cbfde1ee0189821a9f1c259ec4`.
- Step 7 parent: `31ffd6f3003a439c051c0dd4c2358e40a3b5f1af`.
- Range: three linear commits, 48 unique paths, 3,127 insertions, 10 deletions.
- Worktree: clean.
- QA outcome: **PASS**.

## WORK COMPLETED

QA independently verified ancestry, complete range, allowlist, modes, exclusions, credential shapes, binaries, gitlinks, syntax, test suites, candidate identity, regression behavior, hook simulations, legacy deployment blocking, linked-worktree refusal, standalone-clone bootstrap, and final cleanup.

## FILES TOUCHED

None in any ChartQuest worktree. A standalone local clone was created under an exact temporary QA directory and removed after testing; no QA fixture remains.

## TESTS

| Check | Result |
|---|---|
| Exact reviewed ancestry and non-`main` branch | PASS |
| Full 48-path range and diff check | PASS |
| Approved allowlist | PASS |
| Required file modes | PASS; exactly six executable paths |
| Hard exclusions | PASS |
| Binary, gitlink, nested-repository, and credential-shape scans | PASS |
| Node syntax | PASS, 6/6 |
| Shell/hook syntax | PASS, 4/4 |
| Release-control suite | PASS, 15/15 |
| Artifact-parity suite | PASS, 5/5 |
| Candidate identity | PASS |
| Full regression verifier | PASS: 20 pass, 0 fail, 0 warn, 3 skip |
| Exact-main/no-lock simulation | Expected FAIL, exit 1 |
| Feature-to-main simulation | Expected FAIL, exit 1 |
| Ordinary feature-push simulation | PASS, exit 0 |
| Legacy Netlify path | Expected FAIL before token/archive/network section |
| Linked-worktree bootstrap | Expected FAIL; shared configuration unchanged |
| Standalone-clone bootstrap | PASS |
| Final state and cleanup | PASS |

Candidate identity:

- Build: 359.
- Source/root/site SHA-256: `415b070ad89d7acb4ee113bd7da91157848abfe39a780f5dae3ca1b5a5303b2c`.
- Website-tree SHA-256: `bbca0613d27c9f98c329804cddccbe9fa888f1d436aa40c2d0aba51bc737d9fd`.
- CQ-BUILD: `7213f152d4`.
- Built at: `2026-08-10T14:27:54Z`.

## EXPECTED VS ACTUAL

| # | Expected | Actual | Status |
|---|---|---|---|
| 1 | Exact Step 7 parent; branch is not `main` | First range commit has exact parent `31ffd6f`; branch/HEAD match | PASS |
| 2 | Only approved paths and modes | All 48 paths match the allowlist; modes match | PASS |
| 3 | No gameplay, art, binary, secret, archive, lock, nested worktree, or unrelated report | All exclusion and scan checks passed | PASS |
| 4 | All scoped syntax checks pass | Node 6/6 and shell/hook 4/4 passed | PASS |
| 5 | Release and parity suites pass | 15/15 and 5/5 passed | PASS |
| 6 | Full regression has no failure or warning | 20 pass, 0 fail, 0 warn, 3 allowed skips | PASS |
| 7 | Identity succeeds; unsafe main paths fail; feature path remains usable | Identity passed; unsafe paths failed closed; normal feature simulation passed | PASS |
| 8 | Legacy Netlify command stops before sensitive behavior | Missing release lock stopped execution; no token/archive state appeared | PASS |
| 9 | Standalone clone activates its own hook path and remains clean | Absolute clone hook path saved; modes/ignore valid; clone clean | PASS |
| 10 | Tests leave no state | Candidate clean; no lock, archive, token, clone, or configuration drift | PASS |

## INVARIANT RESULTS

- **INV-001 — PASS:** no canonical game artifact changed.
- **INV-006 — PASS:** operational/CQTrack synchronization gates passed.
- **INV-007 — PASS for local identity:** three-artifact parity and candidate fingerprint checks passed.
- **INV-008 — PASS:** the durable command-center/release-control package is clean-clone reproducible and its local hook bootstrap fails safely.
- **INV-002 through INV-005 — NOT TESTED behaviorally:** no gameplay change; static regression passed.
- Served `/game` equality remains **UNKNOWN** and out of scope.

## RISKS / SKIPS

- Puppeteer was unavailable; optional headless boot was skipped.
- Build-increment and protected-system checks were not applicable because `chart-quest.html` is unchanged.
- No live smoke, served fingerprint, provider action, credential test, gameplay session, push, merge, or deployment occurred.
- Local hooks remain bypassable by a malicious local actor; the active GitHub production freeze remains the hard external boundary.
- Candidate remains local and unpushed.

## OUTCOME

**PASS.** All ten integration acceptance criteria passed independently. This result authorizes PM/CTO lifecycle closeout only; it does not authorize push, merge, `main`, production, provider, credential, or deployment action.

## NEXT ACTION

Persist the QA/regression evidence, mark the durability integration complete, and use the command center for the next bounded non-production task.

## DO NOT TOUCH

Production/provider settings, credentials/tokens, `main` or its freeze, game/boss artifacts, dirty-primary build-360 work, release locks, or unrelated worktrees/reports.
