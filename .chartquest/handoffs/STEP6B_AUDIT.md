# Step 6B Audit — Technical Release Enforcement

**Scope:** repository-local release enforcement only. No production deployment, push to `main`, merge, GitHub/Cloudflare/Supabase account change, credential read, credential rotation, or gameplay/security architecture change was performed.

## Final checkpoint addendum — 2026-08-11

The UNKNOWN and bypass sections below preserve the state observed during the original repository-local audit. They were subsequently resolved for Step 7 by the Founder-approved external-control verification in `STEP6B_EXTERNAL_CONTROLS.md`: GitHub `main` is now under an active exact-target, empty-bypass production freeze; Cloudflare deploys that frozen branch and displayed no account/user API tokens; Netlify was unlinked and its build-hook/MCP paths were removed. **Final adjudication: PASS WITH ACTION; Step 7 may start; production release remains frozen.**

## VERIFIED

### Locally observable production paths

| Path | Evidence | Step 6B result |
|---|---|---|
| Push to `origin/main` | `docs/operations/CloudflareDeployment.md` documents Cloudflare Pages auto-deploying `main`; local `origin` is `git@github.com:shelltrader/shell-trade.git`. Cloudflare's current account state was not queried. | A shared local pre-push guard permits a `main` target only from exact local `refs/heads/main` at its current SHA, then invokes the release gate. Feature/ref-expression pushes, stale SHAs, and deletion are rejected before the gate. |
| Cloudflare direct upload | Repository documentation names `npx wrangler pages deploy …`; no Wrangler package/config, Cloudflare environment variable, or local Wrangler configuration directory was found. | No repository script invokes it. A raw external command remains a bypass path. |
| Cloudflare dashboard/rollback | Documented external path only. | UNKNOWN: account permission/deployment history were not queried. |
| Legacy Netlify direct upload | `netlify-direct-deploy.command` calls a deployment API; a local `.netlify-token` file exists, but its value was not read and the route's current public authority is UNKNOWN. | The script now fails closed through the same release gate before it reads its token, creates an archive, or makes a network call. |
| `scripts/cq.sh ship` / smoke | Code inspection confirms they build/verify or read production; neither deploys. | Kept usable for normal build/QA work. Smoke now supports manifest-backed served-identity verification after an authorized deployment. |
| Codex local command execution | This repository is trusted by the local Codex client. | Project-scoped `.codex/config.toml` permits routine in-repository work with auto-review, while keeping shell network access disabled by default. See `../AUTONOMY_POLICY.md`. |

### Repository-local controls implemented

1. `scripts/release_control.js` is the single release-gate command. It does **not** deploy or push.
2. The gate accepts only a `main` candidate with one matching active Git-common-directory lock, a complete sidecar manifest, `CURRENT COMMIT = INTENDED COMMIT`, `CURRENT BUILD = INTENDED BUILD`, byte-identical source/mirror/`website/game.html`, matching SHA-256 identities, matching `cq-build` metadata, matching tracked `website/` tree hash, and a passing existing `scripts/verify.js` gate.
3. `.githooks/pre-push` is enabled through the shared local `core.hooksPath` in the existing primary and both linked worktrees. It blocks an ordinary push that targets `main` unless its local ref is exact `refs/heads/main`, its pushed SHA equals the current local `main` SHA, and the release gate passes; ordinary feature pushes are not blocked.
4. The gate lock is created atomically by `release_control.js acquire`, is stored in the Git common directory, and must name the same release ID, branch, build, commit, production URL, and manifest as the gate request.
5. A manifest-capable smoke check can compare the served `/game` response SHA-256 and `cq-build` stamp to the approved `website/game.html` candidate after an authorized deployment, and rejects a smoke target that differs from the manifest's production URL. It was implemented but not run against production.

### Worktree / collision facts

- The primary worktree is `main` at `bdf7dd413a2cbcadcc26e8382decc40e93f8ae78`.
- Linked worktrees exist on `feature/blockchain-journey` and a detached checkout. Both inherit the shared local hook configuration.
- A feature worktree cannot pass the release gate because the gate requires `main`; a normal `git push origin feature-branch` does not target production.
- An ordinary `git push origin feature-branch:main`, `HEAD:main`, stale-SHA push, or `:main` deletion is rejected before a release context can be reused. A valid local main-target push must bind the exact `refs/heads/main` ref and SHA to the gated candidate.
- The current primary checkout has pre-existing source/mirror/site drift: source identifies build 360 while its mirror/site artifacts identify build 359. It is not a valid release candidate; Step 6B did not alter it.

### GitHub / credentials locally observable

- No `.github/` workflow or repository rule configuration is present locally.
- `gh auth status` reports no authenticated GitHub host. GitHub branch protection/rulesets are therefore **UNKNOWN**, not assumed absent or present.
- No Cloudflare token/key/account environment variable or local Wrangler configuration directory was found. This proves only that those indicators were absent from this local process/filesystem location; dashboard access, browser sessions, other shells, CI secrets, and remote tokens are **UNKNOWN**.
- A legacy `.netlify-token` file exists. Its value was not read. Whether it can currently change a user-facing deployment is **UNKNOWN**.

## UNKNOWN

- Current Cloudflare Pages production-branch setting, deployment ID/history, dashboard roles, API tokens, direct-upload authorization, and served production fingerprint.
- Actual GitHub `main` protection/rulesets and which identities can update it. Local GitHub authentication was unavailable, so no remote claim is made.
- Whether any Claude/Codex/human session can use an SSH key, PAT, Cloudflare dashboard/API token, CI secret, or legacy Netlify token outside this checkout.
- Whether the documented legacy Netlify site still serves a production/custom domain.
- Whether the current served site equals any local artifact; no production request was made in this step.

## HISTORICAL BYPASS PATHS — PRE-EXTERNAL-CONTROL SNAPSHOT

1. `git push --no-verify …:main` bypasses the local pre-push hook if the actor's remote credential is accepted.
2. An actor can change/unset local Git hook configuration or invoke Git/SSH outside the guarded checkout.
3. Raw Cloudflare Wrangler/API/dashboard use is outside repository-script control.
4. Raw Netlify API use with the legacy token is outside the guarded script.
5. GitHub-side merges/pushes and Cloudflare dashboard rollbacks do not execute a local hook.

These were realistic overwrite paths while GitHub and provider-account controls were unverified. The active no-bypass GitHub production freeze now closes the Git-based paths for ordinary agents; provider dashboard/global-key activity remains a protected human-account action.

## TECHNICAL ENFORCEMENT IMPLEMENTED

| Control | Evidence | Limit |
|---|---|---|
| Main push gate | Shared `core.hooksPath` points to `.githooks`; simulated `main` refspec failed closed with no active lock. | Bypassable locally with `--no-verify`/configuration change. |
| Feature safety | Disposable feature-worktree gate test failed; disposable normal feature-push hook test passed. | Does not constrain a raw external deployment. |
| Release lock | Atomic common-dir lock, manifest binding, foreign/missing-lock failure tests. | Lock is local state, not accepted by GitHub/Cloudflare. |
| Candidate identity | Full commit/build, source/mirror/game SHA-256, tracked website tree SHA-256, and `cq-build` cross-checks. | A `cq-build` stamp records build provenance and may predate the containing commit; the full commit plus SHA-256 identities provide candidate proof. |
| Served identity | Smoke command can hash served `/game` against the manifest candidate. | Not yet run post-deploy; it cannot prove Cloudflare account authorization/deployment history. |
| Legacy script | Guard runs before token/archive/network behavior. | Does not stop raw API use or copies of the old script in other checkouts. |
| Codex workspace boundary | Trusted-project config uses `workspace-write`, `on-request`, and `auto_review`, with command network access explicitly disabled. | A stricter managed workspace policy may still override project configuration; it is not a substitute for provider-side access control. |

## EXTERNAL ENFORCEMENT CHECKPOINT — RESOLVED FOR STEP 7

The original requirements are retained below as the audit trail. Their Step 7 blocking status was superseded by `STEP6B_EXTERNAL_CONTROLS.md`. The current GitHub control freezes all `main` updates instead of creating a standing bypass identity; that is stronger for development safety, while a future release requires a deliberate Founder/Release-Manager ruleset change.

### REQUIRED BEFORE STEP 7

1. **GitHub `main` ruleset:** create a separate, human-controlled Release Manager identity/team; restrict all updates to `main` (including force updates) to that identity only; block force-pushes and deletion; do not permit ordinary developer/agent identities to bypass the ruleset. Keep the Release Manager credential out of Claude/Codex worktrees.
2. **Preserve exact-candidate workflow:** until a server-side candidate-attestation workflow exists, use the restricted Release Manager identity to push only a locally gated, clean `main` candidate. Do not add a generic PR-merge requirement that changes the candidate SHA while claiming this local pre-push gate validated the resulting commit.
3. **Cloudflare production authority:** verify the Pages project really uses the intended Git integration/production branch, then limit project deploy/rollback/dashboard/API authority to the same Release Manager boundary. Remove production Pages credentials from agent environments; do not rely on the absence of tokens in this one shell.
4. **Legacy Netlify authority:** establish whether its token/site can affect any user-facing domain. If yes, remove agent access or retire that route under Founder-approved provider controls; the local script guard alone is insufficient.
5. **Controlled bootstrap:** the Step 6/6B files are not committed and the current repository has inherited build drift. Do not push them as an ad hoc release. The Release Manager must first establish a clean, reviewed candidate and use the external branch rule to integrate it. This requires a separate explicit release operation, not Step 6B.

### RECOMMENDED BEFORE FIRST PUBLIC BETA

- Add a server-side, runner-compatible attestation/check that validates a committed release manifest and candidate tree before `main` changes. Do not fake the local common-directory lock in CI.
- Require fresh-browser smoke verification using `scripts/cq.sh smoke --manifest …`, recording the served SHA-256/stamp, deployment ID, and production URL in the final manifest.
- Review provider audit logs and maintain a named emergency rollback procedure with the same identity restrictions.

### OPTIONAL LATER HARDENING

- Replace static provider credentials with short-lived/scoped deployment credentials.
- Move the final deployment action into a dedicated release pipeline after a signed/immutable candidate artifact is available.
- Add an external immutable release-evidence store and automated alerting on production deployment changes.

## NEGATIVE TEST RESULTS

`node scripts/release_control.test.js` created only disposable temporary Git worktrees and passed all 15 checks:

| Test | Result |
|---|---|
| Clean `main` candidate passes gate | PASS |
| Exact `main` ref/SHA can target `main` | PASS |
| Feature ref cannot target `main` | PASS (fails closed) |
| Different SHA cannot target `main` | PASS (fails closed) |
| Main deletion cannot reuse release context | PASS (fails closed) |
| Different manifest/lock production URL | PASS (fails closed) |
| Feature worktree cannot pass gate | PASS (fails closed) |
| Wrong commit | PASS (fails closed) |
| Wrong build | PASS (fails closed) |
| Missing manifest | PASS (fails closed) |
| Missing lock | PASS (fails closed) |
| Foreign lock | PASS (fails closed) |
| Artifact mutation after preparation | PASS (fails source/site hash equality) |
| Stale release identity | PASS (fails current/intended commit comparison) |
| Normal feature push path | PASS (unblocked) |

Additional local checks passed: Node syntax checks for the new/changed JavaScript; shell syntax checks for `cq.sh` and the legacy deploy script; simulated local exact-main, feature-to-main, stale-SHA, deletion, and feature push refspecs; and the legacy deploy script's gate failed before it could read a token or contact a provider.

**PM/CTO independent re-verification (2026-08-11):** re-ran the 15-test disposable suite and all Node/shell syntax checks; each passed. Independently simulated a normal `main` push with no active lock (blocked), a feature-to-`main` push (blocked), and a normal feature push (permitted). Re-ran the legacy script with no release context; it stopped at the gate before token/archive/network behavior. `codex --version` loaded successfully from the trusted repository after the project-local configuration was added. No production request, push, credential read, or provider account action occurred.

The existing `scripts/verify.js` was run unchanged. It reported 21 passes, 1 skip, and 1 **pre-existing failure**: gate 8 detects that `index.html` does not mirror the already-modified `chart-quest.html`. Step 6B did not modify those game artifacts. Live smoke/served-hash verification was intentionally not run because no deployment is authorized and no valid candidate exists.

## SECURITY/HARDENING COMPATIBILITY

**COMPATIBLE WITH PRESERVED SYSTEMS — VERIFIED BY SCOPE.** Step 6B did not modify `chart-quest.html`, gameplay behavior, Finn/boss/curriculum/progression, save schema, monetization, Supabase, Cloudflare configuration, DNS, production content, security headers, obfuscation, or Claude instruction files. The only changed existing runtime-adjacent files are release/deployment tooling: the legacy Netlify script now stops before credential/archive/network behavior, `cq.sh` forwards optional smoke arguments, and smoke verification gains an optional read-only identity comparison.

Existing hardening remains subject to its own regression gate; the inherited mirror drift means the complete repository regression gate is currently not green, so no release-safety conclusion is inferred from it.

## CLAUDE/CODEX COLLISION ANALYSIS

The shared hook now prevents the common accidental failure: a Codex or Claude worktree using an ordinary Git push cannot update `main` unless it presents the exact local `main` ref/SHA and locally gated release context. A feature worktree cannot construct a passing context because the gate requires `main`; a foreign/stale lock, a changed source/site artifact, an alternate refspec, or a stale SHA fails closed.

This does **not** make Claude/Codex identities safe by policy alone. If either system has the same GitHub write identity as the Release Manager, can use `--no-verify`, alters local Git configuration, uses a direct provider credential/dashboard, or runs an old/duplicated deployment path, it can still bypass the local control. The required external identity and provider-permission separation above is the boundary that eliminates the Build-357/358 overwrite class rather than merely documenting it.
