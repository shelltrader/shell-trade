# Step 6B Independent Review

## Review scope

Independent review of the repository-local Step 6B controls, their negative tests, and the current candidate state. The reviewer made no tooling, deployment, Git-configuration, credential, or provider changes. The reviewer could not create this file because its project write permission was unavailable; the PM/CTO recorded the reviewer’s returned evidence here without changing its conclusion.

## VERIFIED

- `scripts/release_control.js` validates an exact `main` candidate, a matching common-directory release lock and manifest, commit/build/production-URL identity, identical source/mirror/game artifacts, SHA-256 identity, tracked website-tree identity, `cq-build` metadata, and the existing regression gate.
- The shared pre-push hook rejects feature-to-`main`, non-current SHA, and deletion attempts before the gate. A standard feature push remains permitted.
- The release-control fixture suite passed during review (14 checks at the reviewer’s snapshot); PM/CTO re-verification after the strengthened hook checks passed all 15 checks.
- The legacy Netlify script gates before token, archive, or network behavior.
- The current primary candidate fails closed because `chart-quest.html` is build 360 while `index.html` and `website/game.html` are build 359. The existing regression check reports 21 passes, 1 skip, and this one inherited failure.

## Findings

### External findings — closed for Step 7

1. GitHub now has an active exact-`main` ruleset with an empty bypass list, restricted updates/deletions, and blocked force pushes.
2. Cloudflare's inspected production project deploys from the now-frozen `main`; it displayed one human Super Admin and no account/user API tokens.
3. The legacy Netlify fallback is unlinked from GitHub, its build hook was deleted, Netlify MCP access was revoked, displayed personal tokens were expired, and it has no custom production domain.

### Beta-defer / optional

- Add a smoke-manifest fixture test and a direct hook/no-lock integration fixture for extra coverage. These are coverage improvements, not evidence that the present local guard is ineffective.

## Recommendation

**PASS WITH ACTION.** The original review correctly failed the pre-external-control state. The PM/CTO then established the external evidence in `STEP6B_EXTERNAL_CONTROLS.md`, and the independent reviewer re-adjudicated the combined state: the production-overwrite checkpoint passes and Step 7 may start. Before any future release, resolve the legacy local token, create a clean synchronized candidate, and run manifest-backed post-deploy smoke verification.
