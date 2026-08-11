# Release Authority

## Policy

The **Release Manager** is the only authorized role for production deployment.

Other roles may build, test, inspect, review, prepare artifacts, and recommend a release. They may not deploy production, overwrite production, trigger production deployment, or invalidate another active release.

Repository-local enforcement now exists, and GitHub `main` is additionally covered by an active no-bypass production-freeze ruleset. The release-control script creates an atomic Git-common-directory lock, verifies the candidate, and the shared pre-push guard blocks ordinary local pushes targeting `main`. Cloudflare remains configured to auto-deploy `main`, but that branch cannot currently be updated without first changing the account-level freeze.

## Required release controls

Before any production-affecting action, the Release Manager must:

1. Prepare the manifest from `.chartquest/releases/RELEASE_TEMPLATE.md`, including full candidate hashes and `cq-build` fields.
2. Run `node scripts/release_control.js acquire --manifest <manifest>`; an existing lock fails closed.
3. Run `node scripts/release_control.js gate --manifest <manifest>`; it verifies branch, lock ownership, commit, build, production URL, source/mirror/site equality, SHA-256 identities, metadata, website tree, and the existing regression gate without deploying.
4. Verify `DEPLOYMENT = INTENDED DEPLOYMENT` after deployment.
5. Verify the served production fingerprint, production URL, and fresh-browser behavior.
6. Record founder verification and explicit release decision before releasing the lock.

## Actual production-affecting paths discovered

| Path | Authority implication | Current control / evidence |
|---|---|---|
| Push to remote `main` | Cloudflare Pages auto-deploys production from `main`. | Step 6B local guard/gate is present; the active no-bypass GitHub production freeze independently blocks all `main` updates until a deliberate account-level release action. |
| `npx wrangler pages deploy <output-dir> --project-name chartquest` | Direct Cloudflare Pages deployment requires external credentials. | Not run. Command networking is disabled for routine Codex work; credentialed provider actions remain protected Founder/Release-Manager actions. |
| Cloudflare Pages dashboard deployment/rollback | External console action requires signed-in human account access. | Settings were inspected read-only for Step 6B; no deployment/rollback occurred and no account/user API tokens were observed. |
| `netlify-direct-deploy.command` | Direct upload to the legacy fallback site when a local token exists. | Script now gates before reading a token/archive/network action. Netlify is unlinked, build hooks removed, and MCP OAuth revoked. |

## Non-deployment tools

- `scripts/cq.sh ship` builds/synchronizes/verifies local artifacts but does not deploy.
- `scripts/cq.sh smoke` and `scripts/smoke_deploy.js` inspect production after deployment but do not deploy. With `--manifest`, they compare served `/game` SHA-256 and `cq-build` metadata against the approved release candidate and require the inspected origin to match its production URL.
- `build.js` is an existing optional obfuscation tool and does not itself deploy.

## Technical enforcement now present

- `scripts/release_control.js` is the only repository release-gate command. It never deploys or pushes.
- `.githooks/pre-push`, enabled in the shared local Git configuration, permits an ordinary push to `refs/heads/main` only from exact local `refs/heads/main` at its current SHA, then invokes the gate. Alternate refspecs, stale SHAs, and deletion fail closed.
- `netlify-direct-deploy.command` now invokes the same gate before it reads a token, rewrites `deploy.zip`, or calls the legacy deployment API.
- The gate accepts only a clean `main` candidate (apart from its sidecar manifest), one matching active lock, complete identity evidence, and a passing existing verification gate.

### Fresh-clone and moved-checkout activation

Git does not version `core.hooksPath`. After a fresh clone or after moving the primary checkout, run `scripts/setup_command_center.sh` once from that trusted checkout. The network-free script validates the committed hook and release-control syntax, then sets this repository's local `core.hooksPath` to the checkout's absolute `.githooks` directory and verifies the saved value. Linked worktrees share that project-local Git configuration. Re-run the script if the primary checkout moves.

This bootstrap does not grant release authority and does not weaken the independent GitHub production freeze. A missing or unhealthy local hook is a command-center health failure that must be corrected before release preparation; it is not permission to push or deploy by another path.

## Limitation and escalation

The active GitHub ruleset now blocks `main` updates, including ordinary credentials, `--no-verify`, alternate clones, deletions, force pushes, and GitHub-side merges. Netlify is unlinked from GitHub, its build hook was deleted, and Netlify MCP access was revoked. Direct actions in a signed-in human provider account remain possible and therefore stay protected Founder/Release-Manager actions. Before a future production release, deliberately change the GitHub freeze under explicit authorization, resolve the unread legacy local token, establish a clean synchronized candidate, and complete the manifest/gate/post-deploy verification workflow.
