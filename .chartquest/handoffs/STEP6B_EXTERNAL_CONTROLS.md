# Step 6B External-Control Verification

**Verification date:** 2026-08-11

**Authority:** Founder-approved account changes performed and adjudicated by the persistent PM/CTO Command Center.

**Safety result:** No push, merge, production deployment, rollback, credential read, credential rotation, or production-content change occurred.

## VERIFIED — GitHub production branch

- Repository: `shelltrader/shell-trade`.
- Active ruleset: **ChartQuest production freeze**.
- Exact target: `main` only.
- Bypass list: empty.
- Enforced rules: restrict updates, restrict deletions, and block force pushes.

**Effect:** an ordinary developer/agent credential, another clone, raw Git, `--no-verify`, a force push, or a GitHub-side merge cannot change `main`. The control is intentionally a complete production freeze, not a release pipeline. A future production release requires a separate Founder-approved account action to change this ruleset; it cannot happen through an ordinary repository workflow.

## VERIFIED — Cloudflare production authority

- Pages project: `chartquest`.
- Connected repository: `shelltrader/shell-trade`.
- Production branch: `main`.
- Automatic deployments: enabled.
- Output directory: `website`.
- The inspected production deployment identified commit `bdf7dd4`.
- The account displayed one active member with Super Admin authority.
- No account API tokens and no user API tokens were present.
- A standard Cloudflare global API key exists but was not viewed, copied, changed, or exposed.

**Effect:** Cloudflare will still deploy a change to `main`, but the active GitHub freeze prevents `main` from changing through an ordinary agent workflow. Direct dashboard/global-key authority remains a human account boundary and is not available to repository shell commands; project-scoped Codex command networking remains disabled.

## VERIFIED — legacy Netlify route

- Project `chart-quest-game` had only its Netlify subdomain and no custom production domain.
- The project was unlinked from `shelltrader/shell-trade`.
- Netlify confirmed that unlinking deleted its deploy keys and build hooks; the previously active build hook is no longer present.
- The Netlify MCP OAuth authorization was revoked.
- All displayed personal access tokens were expired; no active personal access token was displayed.
- The existing fallback deployment remains online and was not deleted or changed.

**Effect:** Git pushes, the former build hook, and Netlify MCP can no longer deploy this fallback. Manual actions in the signed-in human Netlify account remain possible, but the fallback does not own the ChartQuest production domain.

## Independent adjudication

**STEP 6B: PASS WITH ACTION. STEP 7 MAY START.**

The local release gate and the external production freeze now prevent an ordinary Claude/Codex workflow from overwriting production. The inherited build-360/source-mirror drift also fails closed, so the current checkout is not a release candidate.

### Required before any future production release

1. Establish a clean, reviewed, synchronized candidate and commit the currently untracked Step 6B controls so another clone can reproduce them.
2. Deliberately change the GitHub production-freeze ruleset only under Founder/Release-Manager authorization for the exact release operation.
3. Resolve or remove the unread legacy `.netlify-token` file before relying on Netlify for any future release role.
4. Pass the release lock/manifest/gate and record manifest-backed served-artifact smoke evidence after deployment.

These are release-time actions. They do not block isolated feature work or the Step 7 single-issue engineering proof.
