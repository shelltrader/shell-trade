# Step 7 Review — Three-Artifact Parity Gate

## TASK

Independently review the staged Step 7 implementation on `codex/step7-artifact-parity`.

## OBJECTIVE

Determine whether ordinary regression gate #8 now fails closed unless `chart-quest.html`, `index.html`, and `website/game.html` are byte-identical, with path-specific failures and disposable positive/negative evidence.

## CURRENT STATE

- Branch: `codex/step7-artifact-parity`.
- Worktree: `/Users/owl/Claude/Projects/Shell Trade/.codex/worktrees/step7-artifact-parity`.
- Base/HEAD: `bdf7dd413a2cbcadcc26e8382decc40e93f8ae78`.
- Exactly three tooling files are staged and there are no unstaged changes.
- No game artifact, production service, credential, `main`, or release-freeze setting was changed.

## FILES REVIEWED

- `scripts/artifact_parity.js`
- `scripts/artifact_parity.test.js`
- `scripts/verify.js`

The Reviewer changed no files.

## REQUIREMENT REVIEW

1. Identical three-file fixture passes — **VERIFIED**.
2. Changed `index.html` fails nonzero and names `index.html` — **VERIFIED**.
3. Changed `website/game.html`, with unchanged build/stamp text, fails nonzero and names that path — **VERIFIED**.
4. Missing root mirror and missing site artifact fail cleanly and name the exact path — **VERIFIED**.
5. CLI exits nonzero for every tested mismatch and missing-file case — **VERIFIED**.
6. Existing regression checks remain green in the isolated worktree — **VERIFIED**.
7. Inherited dirty-main drift remains untouched and is reported correctly — **VERIFIED**.
8. Reviewer independently reran the required evidence — **VERIFIED**. QA is the next lifecycle stage.

## ROOT-CAUSE REVIEW

**APPROPRIATE AND MINIMAL.** The previous gate owned a two-file SHA comparison inside `verify.js`. The staged change removes only that duplicate hash implementation, adds one reusable checker over the three canonical paths, and calls it from gate #8. `chart-quest.html` remains the comparison source. No mirroring, rebuilding, or unrelated refactor was introduced.

## INVARIANT REVIEW

- INV-001 is preserved: `chart-quest.html` remains the game source of truth.
- INV-007 is materially advanced for local candidate identity: routine verification now checks all three local artifacts byte-for-byte.
- Served `/game` identity remains a separate post-deployment concern and is not claimed by this ticket.
- No protected gameplay, save, curriculum, boss, movement, security, deployment, provider, or credential system changed.

## TEST REVIEW

- JavaScript syntax checks for all three scoped files — **PASS**.
- `node scripts/artifact_parity.test.js` — **PASS, 5/5**.
- Standalone checker in the isolated candidate — **PASS**; all three hashes are equal.
- Full `scripts/verify.js` — **PASS: 20 pass, 0 fail, 0 warn, 3 skip**.
- Staged checker against dirty main — **EXPECTED FAIL**, exit 1; names both `index.html` and `website/game.html` as differing from `chart-quest.html`.
- Cached and unstaged diff checks — **PASS**.
- Scope checks — **PASS**; only the three named tooling files are staged and all three real game artifacts are untouched.

The three full-gate skips are acceptable for this tooling-only ticket: optional Puppeteer headless boot is unavailable, and build-tag/protected-system checks are not applicable because the game source is unchanged.

## RISKS

- The candidate is staged but uncommitted, so it is not yet durable in a fresh clone.
- There is no dedicated permission-denied fixture. The checker does fail closed and reports non-ENOENT read errors as unreadable; this was not an acceptance requirement.
- This closes local three-artifact verification only. It does not prove served-production identity or authorize release.

## OUTCOME

**APPROVED.** The staged implementation satisfies all Step 7 acceptance criteria, is minimal, fails closed, and is limited to tooling. No correction is required before QA.

## NEXT ACTION

Independent QA must rerun the acceptance matrix, record expected versus actual outcomes, and adjudicate the invariant. Do not merge or release on Reviewer approval alone.

## DO NOT TOUCH

- `chart-quest.html`
- `index.html`
- `website/game.html`
- Production/provider configuration or credentials
- `main`, unrelated worktrees, or release-freeze settings
