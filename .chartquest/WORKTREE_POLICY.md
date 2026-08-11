# Worktree Policy

## Purpose

Prevent concurrent ChartQuest work from silently changing another task’s source, branch, release candidate, or production deployment.

## Main / production branch

- `main` is the documented production branch.
- The current directory is not proof that a checkout represents production, nor is a branch name proof of what is served.
- No agent may deploy from `main` without the Release Manager role, an active release lock, an approved release manifest, and founder authorization where required.

## Development branches

- Implementation occurs on a task-specific development branch, not directly in `main`.
- A branch covers one approved concern. It does not authorize unrelated changes or merges.
- Every future release identifies the exact commit and build to be deployed; “latest” is not an acceptable release identity.

## Feature worktrees

- An agent performing implementation uses an isolated Git worktree for its assigned branch when concurrent checkout isolation is required.
- Each worktree has one declared owner/task at a time, recorded in the active sprint or handoff.
- Agents must not edit another agent’s worktree.
- Agents must not reset, rebase destructively, force-push, or discard another agent’s branch/worktree changes.
- Agents must not merge unrelated work or use a feature branch as a deployment source.

## Required checks before editing

1. Record current branch, commit, worktree path, and `git status`.
2. Confirm task ownership and affected systems.
3. Read relevant invariants, known issues, and decisions.
4. Identify files that must not be touched and any overlapping active work.
5. In a fresh or moved clone, run `scripts/setup_command_center.sh` once and verify the project-local hook path before release-related work.

## Release boundary

- Only a verified commit from the intended release branch may enter a release process.
- The repository-local gate permits release preparation only from `main`; a feature branch or detached worktree cannot pass it.
- The shared local pre-push guard blocks an ordinary push whose remote target is `main` unless the gate passes. Ordinary feature-branch pushes remain unaffected.
- Feature branches and arbitrary working directories must never directly trigger production deployment.
- Before release, the Release Manager verifies that current commit equals intended commit and that candidate build equals intended build.
- If release source changes after release preparation, stop. Do not choose a winner by assumption; re-establish the intended candidate and release evidence.

## Known limitation

Git worktrees isolate checkouts, not remote credentials or Cloudflare authority. The local pre-push guard can be bypassed with `--no-verify` or by changing local Git configuration, but the active no-bypass GitHub production-freeze ruleset independently blocks `main` updates. A worktree still cannot constrain a direct signed-in provider dashboard/global-key action; those remain protected Founder/Release-Manager actions.
