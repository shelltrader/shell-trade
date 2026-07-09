# ChartQuest — Operations & Release Engineering

**Status:** Operational documentation. Created in **Phase 1.5 — Production Safety & Deployment Foundation** (2026-07-09).
**Purpose:** Make the workflow safe to deploy and safe to recover **without changing any player-facing behavior.**

This folder answers four questions:

> **Protect the project · Protect the repository · Protect the ability to deploy · Protect the ability to recover.**

## The documents

| Doc | Use it when… |
|---|---|
| [RepositoryHealth.md](RepositoryHealth.md) | You want the honest state of the repo, branches, and deploy risks. |
| [GitWorkflow.md](GitWorkflow.md) | You start new work, cut a release, or fix an urgent bug. Branch + tag rules. |
| [ReleaseChecklist.md](ReleaseChecklist.md) | **Before every deployment.** The pre-flight + 9-point smoke test. |
| [RollbackProcedure.md](RollbackProcedure.md) | A deploy went bad, or you need to restore a known-good version. |
| [CloudflareDeployment.md](CloudflareDeployment.md) | You're moving the game to Cloudflare Pages. Framework, build, headers, env. |
| [BetaTestingChecklist.md](BetaTestingChecklist.md) | Before inviting external beta testers. Readiness gate + tester script. |
| [FutureRepositoryStrategy.md](FutureRepositoryStrategy.md) | Planning the post-beta repo split. **Documentation only — do not execute yet.** |

## How this relates to existing canon
This folder is **release engineering**. The gameplay/change rules live in [`docs/canon/`](../canon/) and **override nothing here**:
- Per-**commit** "did I break a protected system" check → [`docs/canon/regression_checklist.md`](../canon/regression_checklist.md).
- Per-**deploy** release check → [ReleaseChecklist.md](ReleaseChecklist.md) (this folder).
- What you may not touch → [`docs/canon/protected_systems.md`](../canon/protected_systems.md).
- Launch blockers (SMTP, Supabase Pro, dashboard auth) → [`docs/PRODUCTION_READINESS.md`](../PRODUCTION_READINESS.md).

## The three rules that prevent most incidents
1. **`chart-quest.html` is source; `index.html` is its mirror.** Never hand-edit `index.html`. Run `scripts/cq.sh ship` to mirror + gate.
2. **Stage by explicit path — never `git add -A`.** The tree contains a Swift app, a website, and large media that must not be swept into game commits.
3. **A deploy must include every runtime asset** (`finn/`, `bosses/`, top-level media, `sw.js`, `manifest.json`, icons). A missing `finn/` silently ships the old fallback turtle. See [ReleaseChecklist.md](ReleaseChecklist.md).
