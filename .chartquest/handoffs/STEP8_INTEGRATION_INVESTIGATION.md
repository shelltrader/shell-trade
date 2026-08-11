# Step 8 Investigation — Command-Center Durability Integration

## TASK

Prepare a clean, non-`main` integration candidate that makes the audited Step 6B controls, project-scoped autonomy settings, and durable command-center records reproducible without disturbing the dirty primary checkout.

## OBJECTIVE

Root the candidate on QA-passed Step 7 commit `31ffd6f`, add only command-center/release-control material, prove that a fresh checkout can activate the local hook safely, and exclude all gameplay, art, secret, provider, archive, and unrelated report changes.

## VERIFIED STARTING STATE

- Primary checkout: `main` at `bdf7dd4`, with pre-existing build-360 gameplay and boss-art work that is not part of this task.
- Step 7 branch: clean commit `31ffd6f3003a439c051c0dd4c2358e40a3b5f1af`.
- Step 6B release-control suite: 15/15 passed in the primary checkout.
- Step 7 parity suite: 5/5 passed; full gate 20 pass, 0 fail, 0 warn, 3 allowed skips.
- Production: frozen; no push, merge, deploy, provider, or credential action is authorized.

## ROOT CAUSE / DURABILITY GAP

The command center and Step 6B controls exist in the primary working tree, but are not tracked by the base commit. A fresh checkout would therefore lack the control plane, release scripts, guarded legacy path, and Codex project policy. In addition, Git does not version `core.hooksPath`, so merely committing `.githooks/pre-push` would not activate it in a fresh or moved clone.

## EXACT INCLUDE SCOPE

- Step 7 parent commit `31ffd6f` (already contains its three approved tooling files).
- `.chartquest/**/*.md`, excluding `.chartquest/.DS_Store`.
- `.codex/config.toml`, excluding `.codex/worktrees/**`.
- `.githooks/pre-push`.
- `AGENTS.md`.
- `.gitignore` addition for `/.codex/worktrees/`.
- `CHARTQUEST_RC_RELEASE_2026-08-10.md`, because current invariant/decision/roadmap/known-issue records cite it as evidence.
- `scripts/release_control.js`.
- `scripts/release_control.test.js`.
- `scripts/setup_command_center.sh`.
- Step 6B changes in `scripts/cq.sh`, `scripts/smoke_deploy.js`, and `netlify-direct-deploy.command`.

## HARD EXCLUSIONS

- `chart-quest.html`, `index.html`, and `website/game.html`.
- The deletion of `website/bosses/boss-0.webp` and every untracked boss image/README.
- `.chartquest/.DS_Store` and `.codex/worktrees/**`.
- `.netlify-token`, `deploy.zip`, archives, backups, `node_modules`, and Git metadata/locks.
- `.claude` state and unrelated worktrees.
- `CHARTQUEST_FOUNDER_REPORT_2026-08-07.md` and `CHARTQUEST_PRODUCTION_PLAYTHROUGH_2026-08-06.md`.
- Any provider configuration, credential, gameplay, merge, push, or deployment action.

## INVESTIGATION CORRECTIONS APPLIED

1. Added the cited RC release record to the include scope instead of creating broken control-plane references.
2. Added `/.codex/worktrees/` to `.gitignore` to prevent accidental nested-repository/gitlink staging.
3. Added `scripts/setup_command_center.sh`, a network-free bootstrap that validates the committed hook/release-control syntax, sets only this repository's local absolute hook path, and verifies it.
4. Updated current release-policy wording to distinguish a locally bypassable hook from the active no-bypass GitHub production freeze. Historical audit sections remain preserved as point-in-time evidence.

## ACCEPTANCE CRITERIA

1. Candidate parent is exactly `31ffd6f` and the branch is not `main`.
2. The diff contains only the explicit include scope and exact intended executable modes.
3. No gameplay, art, binary, secret, token, archive, nested worktree, lock, or unrelated report enters the candidate.
4. Syntax checks pass for all release, smoke, parity, verification, hook, bootstrap, and shell tooling.
5. Release-control negative suite passes 15/15; artifact-parity suite passes 5/5.
6. Full regression verification passes with no failure or warning.
7. Candidate identity succeeds; no-lock/exact-main and feature-to-main simulations fail closed; ordinary feature push simulation remains allowed.
8. The legacy Netlify command fails at the release gate before token, archive, or network behavior.
9. A disposable local clone can run `scripts/setup_command_center.sh`, records its own project-local absolute `.githooks` path, and remains clean.
10. Tests leave the integration worktree clean with no lock, fixture, archive, or unstaged state.

## REQUIRED MODES

- `100755`: `.githooks/pre-push`, `scripts/release_control.js`, `scripts/release_control.test.js`, `scripts/setup_command_center.sh`, `scripts/cq.sh`, `netlify-direct-deploy.command`.
- `100644`: `scripts/smoke_deploy.js`, `.codex/config.toml`, `AGENTS.md`, `.gitignore`, the cited RC record, and all control-plane Markdown.

## NEXT ACTION

Construct the exact tree using an isolated temporary Git index, review its complete manifest and diff, then create a non-`main` integration commit and worktree for independent review and QA.

## DO NOT TOUCH

The primary checkout's index, branch, game/art files, secrets, providers, production, `main`, or release-freeze settings.
