# Release Policy

## Status

This document describes the release-control policy and its repository-local enforcement. It does not alter Cloudflare, GitHub account settings, or credentials, and it grants no deployment authority.

## Development

Develop against an identified task and scope. Record the starting branch, commit, working-tree condition, affected systems, and applicable invariants. A branch name alone is not isolation in a shared checkout; use an isolated worktree when concurrent checkout isolation is required.

## Investigation

Establish what is verified before changing code. Separate repository evidence from external production evidence and mark unknowns explicitly. Investigation does not deploy.

## Implementation

Make only the approved scoped change. Preserve source/mirror rules and protected systems. Record files touched, intentional deviations, and exact build identity. Do not include unrelated working-tree changes in a release candidate.

## Review

Review scope, diff, protected-system effects, and artifact propagation. Confirm that no unreviewed concurrent-worktree change has been incorporated.

## QA

Run applicable static, behavioral, and flow checks. Record expected behavior, actual behavior, build, evidence, and untested areas in `qa/`. A release must not describe an untested path as passed.

## Build

Create a reproducible candidate from a known commit. Establish source/mirror/served-artifact identity, build label, metadata stamp, cache/version status where applicable, and test results. A local source build number alone is not a release fingerprint.

## Deployment

Deploy only an approved candidate through the documented deployment path. The documented Cloudflare Pages path auto-deploys pushes to `main`; therefore, a push to that branch is a production-affecting action and requires release authorization.

Before any such action, the Release Manager must use `scripts/release_control.js` to acquire the Git-common-directory lock and pass the release gate. The gate fails closed unless the current context is `main`, the lock names the same release, manifest, and production URL, current commit/build equal the intended values, source/mirror/`website/game.html` are byte-identical, manifest hashes and `cq-build` metadata match, the tracked `website/` tree matches, and `scripts/verify.js` passes. The shared `.githooks/pre-push` guard accepts a `main` target only from exact local `refs/heads/main` at its current SHA before invoking that gate.

This gate is repository-local enforcement only. The externally verified no-bypass GitHub production freeze currently blocks `main` changes made through raw Git, `--no-verify`, alternate clones, or GitHub-side merges; Netlify's Git/build-hook/MCP paths are removed. Direct signed-in Cloudflare/API/dashboard actions remain external Founder/Release-Manager controls and are not authorized for ordinary agents.

## Production verification

Verify the served URL after propagation, including the production build fingerprint and the relevant player-flow checks. Verify a fresh-browser/service-worker path when applicable. Record time, URL, result, and evidence in a release manifest.

## Founder verification

The founder reviews the verified production candidate against the requested outcome and documented blockers. Any missing founder decision remains `[UNKNOWN — REQUIRES VERIFICATION]`; no role or agent may infer approval.

## Release approval

A release is approved only when its manifest records:

- an identified build and commit;
- applicable review and QA evidence;
- deployment and served production fingerprint;
- production verification result;
- founder verification; and
- an explicit release decision.

If any required item is absent or contradictory, the candidate is held pending verification. Step 6B implements the repository-local lock, manifest gate, shared pre-push guard, guarded legacy Netlify path, and manifest-backed smoke evidence described here; the active no-bypass GitHub production freeze is the independent remote enforcement recorded in `handoffs/STEP6B_EXTERNAL_CONTROLS.md`.
