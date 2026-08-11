# Step 6B Status — Technical Release Enforcement

## Status

**STEP 6B PASS WITH ACTION; STEP 7 AUTHORIZED.** Repository-local protections are implemented and tested, and the externally verified GitHub production freeze prevents ordinary credentials, raw Git, `--no-verify`, force pushes, deletions, and GitHub-side merges from changing `main`. Netlify's Git/build-hook/MCP routes are removed. Cloudflare remains connected to `main`, but `main` is frozen.

**Checkpoint recommendation: PASS WITH ACTION — DEVELOPMENT MAY CONTINUE; PRODUCTION RELEASE REMAINS FROZEN.**

## Exact files changed

- `.githooks/pre-push`
- `scripts/release_control.js`
- `scripts/release_control.test.js`
- `scripts/smoke_deploy.js`
- `scripts/cq.sh`
- `netlify-direct-deploy.command`
- `.codex/config.toml`
- `AGENTS.md`
- `.chartquest/AUTONOMY_POLICY.md`
- `.chartquest/RELEASE_POLICY.md`
- `.chartquest/WORKTREE_POLICY.md`
- `.chartquest/RELEASE_AUTHORITY.md`
- `.chartquest/CONCURRENCY_POLICY.md`
- `.chartquest/releases/README.md`
- `.chartquest/releases/RELEASE_LOCK_TEMPLATE.md`
- `.chartquest/releases/RELEASE_TEMPLATE.md`
- `.chartquest/handoffs/STEP6B_AUDIT.md`
- `.chartquest/handoffs/STEP6B_COMPLETE.md`

The shared local Git configuration also now points `core.hooksPath` to the primary checkout's `.githooks` directory; both existing linked worktrees inherit it. That configuration is deliberately local state, not a claim of remote GitHub enforcement.

## Controls now technically enforced

- An ordinary local push whose remote target is `main` must use exact local `refs/heads/main` at the current local `main` SHA and pass the release gate; feature/ref-expression pushes, stale SHAs, and deletion fail closed.
- The gate requires `main`, a clean candidate except for its sidecar manifest, one matching common-directory lock, full intended commit/build/production-URL equality, source/mirror/site SHA equality, recorded `cq-build` metadata, tracked `website/` tree identity, and a passing existing regression gate.
- Feature worktrees cannot pass the gate; ordinary feature pushes remain available for normal implementation work.
- The repository's legacy Netlify script cannot progress to credential/archive/network operations without the same gate.
- Post-deploy smoke tooling can verify the served `/game` SHA-256 and `cq-build` stamp against an approved release manifest and refuses a target URL that differs from that manifest.
- The trusted-project Codex policy now allows normal repository-local work with eligible approval requests auto-reviewed, while keeping shell command network access disabled by default.

## External controls independently verified

- GitHub `main` is covered by the active **ChartQuest production freeze** ruleset: exact `main` target, empty bypass list, restricted updates/deletions, and blocked force pushes.
- Cloudflare project `chartquest` remains connected to `main`, with one human Super Admin and no account/user API tokens observed. Its automatic deployment cannot be triggered by an ordinary repository workflow while `main` is frozen.
- Netlify `chart-quest-game` is unlinked from GitHub; unlinking removed deploy keys/build hooks; Netlify MCP OAuth access is revoked; all displayed personal access tokens were expired; the fallback has no custom production domain.
- The local `.netlify-token` file remains unread and must be resolved before any future Netlify release use.
- A post-deploy served-identity check is implemented but has **not** been run because Step 6B made no deployment.

Full evidence: `STEP6B_EXTERNAL_CONTROLS.md`.

## Tests run and results

- `node scripts/release_control.test.js` — **PASS**: 15 disposable, network-free positive/negative tests, including exact-main ref/SHA acceptance; feature-to-main, stale-SHA, and deletion rejection; and manifest/lock production-URL binding.
- Syntax checks for `release_control.js`, its test, and `smoke_deploy.js` — **PASS**.
- Shell syntax checks for `scripts/cq.sh` and `netlify-direct-deploy.command` — **PASS**.
- Simulated feature push through the hook — **PASS** (permitted).
- Simulated `main` push through the hook with no active release context — **PASS** (blocked).
- Legacy Netlify script with no release context — **PASS** (blocked before provider/token behavior).
- Existing `scripts/verify.js` — **FAIL, inherited state**: 21 passes, 1 skip, and gate 8 reports pre-existing source/mirror drift (source build 360 vs mirror/site build 359). Step 6B did not alter these artifacts.
- Production smoke/deployment verification — **NOT RUN** by design.

## PM/CTO independent adjudication — 2026-08-11

**Decision: PASS WITH ACTION.** The repository-local release boundary is implemented and independently re-verified: 15 disposable release-control tests, syntax checks, normal-main/no-lock rejection, feature-to-main rejection, normal feature-push allowance, and legacy-script pre-credential blocking all passed. The external GitHub/Cloudflare/Netlify controls were then inspected and changed under Founder approval as recorded in `STEP6B_EXTERNAL_CONTROLS.md`.

**Step 7 decision: START.** Production is intentionally frozen, so bounded feature-branch work may proceed through Investigator → Implementer → Reviewer → QA. This is not permission to release.

## Can production still be overwritten by an ordinary agent workflow?

**Ordinary agent workflow: NO.** The local gate blocks ordinary guarded pushes, and the active GitHub ruleset blocks `main` updates even when a local hook is bypassed. Cloudflare auto-deploys only from that frozen branch. Repository shell networking is disabled and no provider API tokens were observed. A signed-in human account can still deliberately change provider/ruleset state; that remains a protected Founder/Release-Manager action.

## Is Step 7 safe to begin?

**YES.** Begin one bounded issue on an isolated feature worktree and keep production release frozen. No production deployment, main push, merge, or release-candidate cleanup occurred in Step 6B.
