# Step 8 Implementation — Command-Center Durability Integration

## TASK

Construct the exact non-`main` integration candidate defined in `STEP8_INTEGRATION_INVESTIGATION.md` without changing the dirty primary checkout, its index, or production.

## OBJECTIVE

Make the Step 6B release controls, project-scoped Codex autonomy policy, durable `.chartquest` control plane, and QA-passed Step 7 tooling reproducible from one clean feature-branch history.

## CURRENT STATE

- Branch: `codex/command-center-integration`.
- Step 7 parent: `31ffd6f3003a439c051c0dd4c2358e40a3b5f1af`.
- Integration commit: `31225ac6c9e5f087a4b2d068aae389ee07e885f1`.
- Worktree: `/Users/owl/Claude/Projects/Shell Trade/.codex/worktrees/command-center-integration`.
- Worktree status after implementation/tests: clean.
- Push/merge/deploy/provider/credential action: none.

## WORK COMPLETED

- Built the candidate with an isolated temporary Git index rooted on the exact Step 7 commit, so the primary checkout's branch and index were never changed.
- Added only the 47 reviewed command-center, evidence, policy, release-control, smoke, bootstrap, and ignore-list files.
- Preserved all three game artifacts and every excluded gameplay/art/report path from the Step 7 parent.
- Added the cited RC release evidence so control-plane references are not broken.
- Ignored `/.codex/worktrees/` to prevent accidental nested-worktree gitlinks.
- Added a network-free fresh-clone hook bootstrap that refuses to repoint shared configuration when run from a linked worktree.
- Made the release-control fixture branch deterministic with `git init -b main`.
- Reconciled current release-policy/role language with the verified Step 6B controls while preserving historical audits as point-in-time evidence.

## FILES CHANGED

The integration commit contains 47 paths:

- 36 `.chartquest` Markdown records, including the Step 8 investigation.
- `.codex/config.toml`, `.githooks/pre-push`, `.gitignore`, and `AGENTS.md`.
- `CHARTQUEST_RC_RELEASE_2026-08-10.md`.
- `scripts/release_control.js`, `scripts/release_control.test.js`, and `scripts/setup_command_center.sh`.
- Step 6B changes to `scripts/cq.sh`, `scripts/smoke_deploy.js`, and `netlify-direct-deploy.command`.

Step 7's `scripts/verify.js`, `scripts/artifact_parity.js`, and `scripts/artifact_parity.test.js` are inherited unchanged from parent `31ffd6f`.

## EXCLUSIONS VERIFIED

No candidate diff exists for:

- `chart-quest.html`, `index.html`, `website/game.html`, or `website/bosses/**`;
- the Founder report or production-playthrough report;
- `.codex/worktrees/**`, `.chartquest/.DS_Store`, `.netlify-token`, `deploy.zip`, backups, or archives;
- provider configuration, credentials, Git locks, or unrelated worktree state.

A staged-tree credential-shape scan found no private-key marker or common GitHub/OpenAI/AWS/JWT token shape in the included files. The ignored Netlify token file was not read.

## TESTS

- Exact manifest, stat, full diff, whitespace, binary, exclusion, and executable-mode checks — **PASS**.
- Node syntax: release control, its tests, smoke, artifact checker/tests, and verifier — **PASS**.
- Shell syntax: pre-push hook, bootstrap, `cq.sh`, and legacy Netlify script — **PASS**.
- `node scripts/release_control.test.js` — **PASS, 15/15**.
- `node scripts/artifact_parity.test.js` — **PASS, 5/5**.
- `node scripts/release_control.js identity` — **PASS**; all three local artifacts identify build 359 and SHA-256 `415b070a…`.
- `node scripts/verify.js` — **PASS: 20 pass, 0 fail, 0 warn, 3 allowed skips**; 24 tracked standalone JavaScript files parsed.
- Exact-main/no-lock hook simulation — **EXPECTED FAIL**, before push.
- Feature-to-main hook simulation — **EXPECTED FAIL**, before gate reuse.
- Ordinary feature-push simulation — **PASS**.
- Legacy Netlify command without active release context — **EXPECTED FAIL** at the gate; no token/archive/network behavior and no `deploy.zip`.
- Bootstrap from linked worktree — **EXPECTED FAIL**, preventing shared config from pointing at a removable worktree.
- Disposable standalone clone bootstrap — **PASS**; it saved its own absolute local `.githooks` path, preserved executable mode, and left the clone clean.
- `codex --version` from the candidate — **PASS**; project configuration parsed. The sandbox could not create optional PATH aliases, which is unrelated to repository configuration.
- Final candidate status — **clean**, with no active release lock or deploy archive.

## KNOWN RISKS / LIMITS

- The candidate is local and unpushed; it is not integrated into `main`.
- Project trust is path-specific Codex application state; a fresh/moved checkout may still need the normal one-time trust confirmation.
- No live smoke, served-production fingerprint, provider action, gameplay test, or production release was in scope.
- The primary checkout's inherited build-360/game-art state remains untouched and invalid as a release candidate.
- A future release still requires explicit Founder/Release-Manager authority to change the GitHub production freeze and complete manifest-backed production verification.

## OUTCOME

**IMPLEMENTED / REVIEW READY.** The candidate is clean, reproducible in a disposable clone, and limited to the approved command-center/release-control boundary.

## NEXT ACTION

Independent Reviewer must inspect the complete candidate through lifecycle HEAD `04227af` from parent `31ffd6f` and rerun the critical evidence before QA.

## DO NOT TOUCH

Production, providers, credentials, `main`, the primary index, game artifacts, boss assets, unrelated reports/worktrees, or release-freeze settings.
