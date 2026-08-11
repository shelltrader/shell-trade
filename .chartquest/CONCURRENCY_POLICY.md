# Concurrent Agent Protection Policy

## Active task ownership

- Every active task must have one declared owner, scope, branch/worktree, and next action recorded in `.chartquest/ACTIVE_SPRINT.md` or a handoff.
- Ownership is not permission to change adjacent systems or another task’s files.
- A task that discovers overlap must stop before modifying disputed files and record the conflict.

## Worktree ownership

- An implementation worktree belongs to its declared task owner for the duration of that task.
- Agents must not edit, reset, clean, rebase destructively, or force-push another agent’s worktree/branch.
- A shared working tree is not acceptable branch isolation for concurrent implementation.
- Before editing, an agent records `git status`, branch, commit, and worktree path. Before handoff, it records the same identity and exact files touched.

## Release ownership

- One Release Manager owns one release operation at a time.
- A release is identified by release ID, intended branch, intended commit, intended build, and intended production URL.
- An active release requires the shared Git-common-directory lock defined in `.chartquest/releases/RELEASE_LOCK_TEMPLATE.md`.
- If an active lock exists: **STOP — ACTIVE RELEASE LOCK DETECTED.** Do not overwrite, remove, or invalidate it.

## Deployment lock

The lock is stored in the Git common directory so linked worktrees see the same lock path. `scripts/release_control.js acquire` creates it atomically; the release gate checks that it belongs to the same release, branch, build, commit, production URL, and manifest. The shared pre-push hook accepts a `main` target only from exact local `refs/heads/main` at its current SHA before it calls that gate.

The local lock is not itself a GitHub/Cloudflare credential boundary. The externally verified **ChartQuest production freeze** ruleset now blocks all `main` updates with no bypass, including raw Git and `--no-verify`; this permits isolated Step 7 development. Dashboard/global-key access remains a protected human-account path and is not authorized for implementation agents.

## Build and commit identity

Before release, the Release Manager must prove:

```text
CURRENT COMMIT     = INTENDED COMMIT
BUILD              = INTENDED BUILD
DEPLOYMENT         = INTENDED DEPLOYMENT
```

The verification must include the relevant source/mirror/site artifacts and the served production fingerprint. A branch name, local build label, or prior release report is insufficient by itself.

## Conflict detection and stop conditions

Stop and escalate when any of the following occurs:

- Current commit differs from intended commit.
- Build differs from intended build.
- The release source changes after release preparation.
- A different worktree has changed or generated the intended release artifact.
- An active release lock exists.
- Artifact identity, production fingerprint, or deployment ID is missing or contradictory.
- Another task owns a required file or protected system.

Do not guess which version should win. Do not automatically merge, reset, overwrite, resolve, promote, or deploy either version.

## Anti-regression and anti-spin rules

- Before modifying a system, read its known invariants.
- After modifying a system, run relevant invariant checks.
- Record unrelated findings in `.chartquest/qa/KNOWN_ISSUES.md` as P0, P1, P2, or P3. Do not automatically fix them unless they block the assigned task.
