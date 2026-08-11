# Step 6 Audit — Engineering Isolation and Production Control

**Scope:** read-only audit completed before Step 6 control-plane edits. No production, game, security, deployment, Cloudflare, Supabase, or Claude-workflow change was made during the audit.

## VERIFIED

### Git state

| Item | Observed state |
|---|---|
| Current branch | `main` |
| Current `HEAD` | `bdf7dd413a2cbcadcc26e8382decc40e93f8ae78` |
| Current primary worktree | `/Users/owl/Claude/Projects/Shell Trade` |
| Existing modified tracked files before Step 6 | `chart-quest.html`; `website/bosses/boss-0.webp` deleted |
| Existing untracked material before Step 6 | `.chartquest/`, `AGENTS.md`, release/founder reports, and boss assets listed by `git status` |
| Local branches | `main`, `feature/blockchain-journey`, `claude/exciting-swanson-0f93e7`, `feature/closed-beta`, `feature/home-market-ceremony`, `security-scaling-hardening`, `site/beta-hardening`, `site/level-0-onboarding`, `site/rc1`, `sprint-1-trade-overhaul` |
| Linked worktrees | Primary `main`; `.claude/worktrees/blockchain-journey` on `feature/blockchain-journey`; `.claude/worktrees/exciting-swanson-0f93e7` detached at `e62bbe1…` |
| Existing active release lock | None found. `.chartquest/releases/` had only its README before this step. |

### Deployment and production entry points

| Entry point | Observed behavior / risk |
|---|---|
| `git push origin main` | Existing Cloudflare documentation says the `chartquest` Pages project auto-deploys every push to `main`. Any actor with push authority to `main` can therefore cause production deployment. |
| Cloudflare Pages direct upload | `docs/operations/CloudflareDeployment.md` documents `npx wrangler pages deploy <output-dir> --project-name chartquest`. Credential availability was not inspected. |
| Cloudflare Pages dashboard | Existing documentation describes dashboard rollback/previous-deployment actions. External dashboard access was not queried. |
| `netlify-direct-deploy.command` | Direct Netlify API deploy script requiring a local `.netlify-token`; documentation labels this path retired/not current production. It was not run or modified. |
| `scripts/cq.sh` | Build/verification helper only: `ops`, `mirror`, `site`, `verify`, `ship`, and post-deploy `smoke`. It does not itself execute `git push`, Wrangler, or a Cloudflare deployment API call. |
| `scripts/smoke_deploy.js` | Read-only post-deploy production probe; no deployment action. |

### Build, release, and fingerprint mechanism

- `chart-quest.html` is the documented source; `index.html` is its generated mirror; `website/game.html` is the documented Cloudflare game artifact.
- At audit time the local source contained `build 360`, while `index.html` and `website/game.html` contained `build 359`; the source was already modified in the working tree.
- All three artifacts contained the `cq-build` meta stamp `7213f152d4` at `2026-08-10T14:27:54Z`.
- `scripts/cq.sh ship` runs `ops`, `mirror`, `site`, `verify`, reports the build tag, and refreshes a desktop QR. It modifies artifacts but does not deploy.
- `scripts/sync_ops.py --stamp` writes the `cq-build` commit/timestamp metadata; `CQOPS.build` reads build identity at runtime.
- Existing reports document a fingerprint gap: the static gate compares source with `index.html`, not complete `website/game.html` bytes; the smoke check compares served build label rather than the full `cq-build` stamp.

### Security, hardening, and protected architecture

- `docs/canon/protected_systems.md` freezes Finn assets, boss order/progression, lesson order/curriculum, core movement model, monetization, save schema/keys, UI flow/portal colors, source/mirror rule, and trading semantics absent explicit founder approval.
- `docs/canon/development_guardrails.md` requires canon review, protected-system review, change-budget classification, pre-flight, scoped edits, regression gate, manual regression checklist, and explicit-path staging.
- `docs/SECURITY_AUDIT.md` documents server-side progress validation through `update-progress`, client/Edge Function domain restrictions, code-protection/obfuscation tooling, and security hardening. The audit document also states that obfuscation is not a substitute for server-side protection.
- `docs/PRODUCTION_READINESS.md` and migration artifacts document RLS, service-role-only paths, rate/throttle protections, and Edge Function handling.
- Repository Edge Function source for `ingest` and `beta-ingest` uses service-role secrets and origin controls. No secret values were inspected.
- `website/_headers` is the documented Cloudflare production header authority; existing checks cover CSP, HSTS, X-Frame-Options/SAMEORIGIN, and related deployment-header requirements.
- `scripts/verify.js` includes documented deploy-asset, operations-sync, telemetry-sync, and deployment-header gates. `build.js` is an existing obfuscation tool; current Cloudflare documentation says the normal Pages build command is empty and that tool is disabled.
- `.gitignore` excludes `.netlify-token`.

### Instructions and automation

- Existing Claude-oriented instruction document: `docs/canon/CLAUDE_RULES.md`.
- Existing Codex instruction document: root `AGENTS.md` (created in Step 4).
- No root `CLAUDE.md` was present at audit time.
- Existing automation/tooling includes `scripts/`, `ops/`, `automation/`, `beta-qa/`, and Supabase/migration artifacts. No GitHub Actions workflow or local Git hook was identified in the preceding repository reconnaissance.

## UNKNOWN

- Current Cloudflare credentials, dashboard permissions, deployment history, and the actually served production fingerprint were not queried.
- Whether any individual agent/process currently possesses credentials for direct Wrangler, Cloudflare dashboard, Netlify, or Supabase deployment is unknown.
- Current external Supabase schema/function deployment parity is unknown; the repository has source/migration artifacts but not a live-state export.
- Existing GitHub branch-protection/ruleset enforcement is unknown from this local audit. Repository documentation says protection is recommended but not enabled.
- The release report dated 2026-08-10 contains conflicting production/build assertions; it cannot establish current production state without fresh verification.

## RISKS

1. **Production push authority is shared by default.** Cloudflare auto-deploy from `main` means any actor with remote push authority can cause a deployment.
2. **Worktree isolation is not deployment isolation.** Separate checkouts protect files/branches locally but do not inherently separate remote credentials or deployment authority.
3. **Current source/artifact drift exists.** Local `chart-quest.html` identifies build 360 while root and website artifacts identify build 359.
4. **Artifact-fingerprint verification is incomplete.** Existing tooling does not fully prove the served `website/game.html` stamp/bytes match the intended candidate.
5. **Legacy deploy paths remain discoverable.** The Netlify direct-deploy script is documented as retired, but remains present and credential-dependent.
6. **No technical release lock was present.** Policy alone cannot prevent a credentialed actor from pushing `main` or deploying directly.

## CONFLICTS

No conflict was found between adding documentation-only worktree/release policy and the protected security architecture.

The existing `docs/canon/CLAUDE_RULES.md` and Claude worktrees remain protected from modification by this Step 6 scope. No requirement was found to alter them.

## RECOMMENDATIONS

1. Use the policies and release-lock protocol added in Step 6 before any release preparation.
2. Treat the Git common-directory release lock as a required human control until an authorized future step adds technical enforcement.
3. Before a future production release, independently verify `HEAD`, intended commit, source/mirror/website artifact, served build label, served `cq-build` stamp, and fresh-browser behavior.
4. Seek founder authorization before any future work that changes deployment scripts, credentials, Cloudflare settings, GitHub branch protection, or Supabase configuration.
5. Consider a later, explicitly authorized technical-enforcement step for branch protection and deployment credentials/lock integration; this Step 6 intentionally does not implement it.
