# Release Lock Template

## Purpose

This template defines the required contents of a future active production-release lock. It is **not an active release lock**. The canonical way to acquire a real lock is `node scripts/release_control.js acquire --manifest <manifest>`; the command creates the directory atomically and records the manifest/candidate identity.

## Canonical active-lock location

For a release operation, the Release Manager creates one active lock in the Git common directory shared by all linked worktrees:

```text
$(git rev-parse --git-common-dir)/chartquest-release-lock/RELEASE_LOCK.md
```

The parent `chartquest-release-lock/` directory is the lock. Because the Git common directory is shared by linked worktrees, this avoids treating a per-worktree repository file as a concurrency mutex.

## Acquisition protocol

1. The Release Manager creates a complete release manifest with the exact candidate identity.
2. Run the acquire command above. If the directory exists, it fails closed with **ACTIVE RELEASE LOCK DETECTED**.
3. Run `node scripts/release_control.js gate --manifest <manifest>` before any production-affecting action.
4. Keep the lock until the release has an explicit final decision and handoff.
5. Only the owning Release Manager may remove the lock after recording the final decision. It must never be removed automatically.

The local gate now verifies this lock before an ordinary push to `main` or the guarded legacy Netlify script can proceed. Local `--no-verify` can bypass a hook, but the active no-bypass GitHub production freeze separately blocks `main`; direct signed-in Cloudflare/dashboard/API actions remain protected external paths. See `.chartquest/RELEASE_AUTHORITY.md`.

---

# ACTIVE RELEASE LOCK

| Field | Value |
|---|---|
| Release ID | [REQUIRED] |
| Build | [REQUIRED] |
| Commit | [REQUIRED — full SHA] |
| Owner | [REQUIRED — Release Manager identity/role] |
| Started At | [REQUIRED — ISO 8601 UTC] |
| Status | `PREPARING` / `DEPLOYING` / `VERIFYING` / `HELD` / `COMPLETE` |
| Purpose | [REQUIRED] |
| Manifest | [REQUIRED — absolute path to the active release manifest] |

## Intended production identity

| Field | Value |
|---|---|
| Intended branch | [REQUIRED] |
| Intended build | [REQUIRED] |
| Intended commit | [REQUIRED — full SHA] |
| Intended production URL | [REQUIRED] |
| Intended Website Game SHA256 | [REQUIRED] |

## Stop conditions

- Current commit differs from intended commit.
- Current build differs from intended build.
- Deployment identity differs from intended deployment.
- Another active release lock exists.
- Required evidence is missing, contradictory, or stale.
