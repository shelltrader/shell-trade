# Repository Health

**Status:** Point-in-time (2026-07-09, Phase 1.5). Review of Git state, organization, and deployment readiness.
**Constraint honored:** *no major directories moved, no repo split performed this phase.* Split recommendations are documented in [FutureRepositoryStrategy.md](FutureRepositoryStrategy.md).

---

## 1. Repository at a glance
- **Remote:** `https://github.com/shelltrader/shell-trade.git` (GitHub, private).
- **Tracked files:** ~385. **Working tree on disk:** ~4.6 GB (most of it *not* tracked — see below).
- **Shape:** one repository holding several distinct products:
  - the game (`chart-quest.html` + assets) — the primary deliverable;
  - `ChartQuestQA/` — a native macOS Swift QA/capture app;
  - `website/` — the separate marketing site;
  - `automation/`, `agents/`, `marketing/`, `content-assets/` — supporting tooling/assets;
  - `supabase/` + `automation/migrations/` — backend (Edge Function + 10 SQL migrations).

## 2. Branch structure (as found)
| Branch | Last commit | State |
|---|---|---|
| `main` | 2026-06-17 "Add PWA support…" | **Stale.** Does *not* reflect the current game (builds 227→254 are not on it). |
| `security-scaling-hardening` | 2026-07-05 (+ uncommitted build-254 work) | **Active dev branch.** Ahead of `origin`; dirty working tree. |
| `sprint-1-trade-overhaul` | 2026-06-29 | Stale feature branch. |
| `origin/main` | 2026-06-17 | Matches local `main`. |

**Finding H-1 (High): `main` is not production truth.** Active work lives on `security-scaling-hardening`, and `main` is ~3 weeks behind. Anyone treating `main` as "what's live" is wrong. Fix: adopt the branch model in [GitWorkflow.md](GitWorkflow.md) and bring `main` up to the shipped build once verified.

## 3. Deployment readiness — the biggest risks
**Finding H-2 (Critical): deploys are manual and unversioned.** `netlify-direct-deploy.command` zips a **hardcoded file list** from the working directory and POSTs it to the Netlify Files API (`SITE_ID 5130714b-…`). Nothing ties a deploy to a git commit. There are **0 git tags**. Consequences:
- You cannot reliably answer "exactly what is live right now?"
- Rollback depends on keeping local `_old_*.zip` snapshots (which is *why* they exist — do not delete them).
- Two people (or two machines) can deploy divergent working directories.

**Finding H-3 (High): the deploy manifest omits `finn/`.** The game loads sprites by relative path (`finn/run.png`, …) and **falls back to the old procedural turtle if those files are missing** (`FINN_SPRITES.ready` gate). The direct-deploy zip lists `bosses/` but **not `finn/`**. Any deploy via that script alone risks shipping the exact old-turtle regression the team fought for builds 248→254. The release checklist must verify Finn renders post-deploy.

**Finding H-4 (Medium): `netlify.toml` says `publish = "."`** (whole repo root) while the *actual* live deploys use the curated direct-upload zip. The two deploy paths disagree about what ships. Pick one story (see [CloudflareDeployment.md](CloudflareDeployment.md)).

**Finding H-5 (Medium): `dashboard.html` is in the deployed set with no auth.** Tracked as a launch blocker in [`docs/PRODUCTION_READINESS.md`](../PRODUCTION_READINESS.md) (fix built, pending deploy + migration `0009`).

## 4. Repository weight (informational, not this phase)
~250 MB of video is committed to history (`_video-originals/` ~108 MB, `bosses/` intros ~150 MB), plus ~50 MB of junk blobs in `archive/misc/`. Additionally ~3 GB of gitignored `_old_*.zip` sits in the working directory (local only, **these are your current rollback backups**). History-shrink is a Phase-Two, coordinated operation — see [FutureRepositoryStrategy.md](FutureRepositoryStrategy.md). **Do not delete backups.**

## 5. Workflow opportunities (all documented, none forced)
1. **Tag every release** so rollback has an anchor (0 tags today) → [GitWorkflow.md](GitWorkflow.md).
2. **Tie deploys to git** via Cloudflare Pages Git integration → [CloudflareDeployment.md](CloudflareDeployment.md).
3. **One release checklist** that verifies Finn + all assets ship → [ReleaseChecklist.md](ReleaseChecklist.md).
4. **Recommend (do not enable) branch protection** on `main` → [GitWorkflow.md](GitWorkflow.md).
5. **Post-beta:** carve sub-projects out and shrink history → [FutureRepositoryStrategy.md](FutureRepositoryStrategy.md).

## 6. Verdict
The *code and backend* are in good shape; the **workflow around them is the risk.** Manual, untagged, working-directory deploys with an incomplete asset manifest are the single biggest threat to a clean beta. Everything in this folder is aimed at closing that gap — with zero change to the game.
