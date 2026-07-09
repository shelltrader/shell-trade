# ChartQuest — GitHub Repository Health Audit & Production-Readiness Review

**Date:** 2026-07-09 · **Phase 1.75** · **Type:** AUDIT (read-only)
**Author:** Lead Software Architect / Release Manager
**Constraint honored:** No history rewrite, no force-push, no squash/rebase, no branch/tag deletes or renames, no repo split, no folder moves, no asset deletes, no gameplay/deploy changes. **Nothing was modified except this report.**
**Repo:** `github.com/shelltrader/shell-trade` · default branch `main`

---

## Executive Summary
ChartQuest's repository is **functionally sound but operationally immature.** The code, backend, and documentation are in good shape; the **Git plumbing and release workflow are not yet production-grade.** The three issues that actually matter for connecting to Cloudflare Pages are all about *where the current build lives and how deploys are anchored* — not about the game. **No secrets are leaked.** The repository is **recoverable** (multiple backups exist), but it is **not yet the trustworthy single source of truth** because the shipping build isn't fully on GitHub and `main` is three weeks stale.

**Verdict: NOT approved for production today — but only ~4 small, safe steps stand between here and "yes."** None of them are forbidden Git operations.

---

## Scores (0–10, honest)
| Dimension | Score | One-line justification |
|---|---:|---|
| **Repository Health** | **4.5** | 630 MB *unpacked* `.git`, never `gc`'d, 48 garbage temp objects; ~300 MB permanent history bloat (video + once-committed `node_modules`/`min.html`/zips). But intact, reachable, no secrets. |
| **Git Workflow** | **4.0** | 0 tags, `main` 33 commits behind, 19 unpushed local commits, no CI/branch protection, 4 author identities for ~1 person. Good message conventions emerging. |
| **Repository Organization** | **5.0** | Multiple products in one tree, but each in a clear top-level dir; excellent `docs/canon`; ~90 audit docs unindexed. |
| **Release Readiness** | **4.0** | No release anchors/tags; mirror currently out of sync; but a real regression gate (`verify.js`/`cq.sh ship`) exists. |
| **Deployment Readiness** | **4.5** | Deploys are manual + unversioned; asset-manifest gap (`finn/`). Cloudflare git-integration would fix most of this. Static site is trivially hostable. |
| **Commercial Readiness** | **5.0** | Strong backend security (RLS, edge-function write-lock, rate limits). Blocked on ops: SMTP, Supabase Pro, dashboard auth (tracked in `docs/PRODUCTION_READINESS.md`). |

---

## STEP 1 — Repository Health
- **`.git` size:** **630 MB, entirely loose objects** (`in-pack: 0`, `packs: 0`). The repo has **never been packed/`gc`'d**. Plus **48 garbage `tmp_obj_*` files (2.1 MB)** from an interrupted Git operation.
- **Working tree on disk:** ~4.6 GB (most **not** tracked — gitignored `_old_*.zip` backups + `node_modules`).
- **Tracked files:** ~385. **Commits:** 68. **Timeline:** 2026-06-15 → 2026-07-05 (~3 weeks).
- **Large blobs in history (permanent unless rewritten):**
  - `archive/misc/zixWYTP8`, `zieVGeSX` — 24 MB each (**zip archives with obfuscated names**, tracked).
  - `bosses/intros/*.mp4` (~150 MB) + `_video-originals/*.mp4` (~108 MB) + root `Market-maker-cinematic.mp4` (12 MB) — legitimate but heavy.
  - `node_modules/javascript-obfuscator/…index.browser.js.map` (4.9 MB) — **`node_modules` was committed then removed** (commit `6443e1f`); it's permanently in history.
  - `chart-quest.min.html` (obfuscated build) committed at least once (`052cd85`).
- **Strengths:** everything is reachable/intact; `.gitignore` now covers the right things; heavy, valuable in-code + canon documentation.
- **Weaknesses/risks:** never-packed 630 MB `.git`; ~300 MB permanent bloat; interrupted-op garbage objects; a first commit of "Add files via upload" (bootstrapped by drag-drop, not a clean init).

## STEP 2 — Branch Audit
| Branch | Purpose | Last activity | vs `main` | Merged? | Classification |
|---|---|---|---|---|---|
| `main` *(default, remote HEAD)* | Production pointer | 2026-06-17 | — | — | **Stale.** Does NOT contain the current game (build ~254). Safe but misleading. |
| `security-scaling-hardening` *(current)* | Active dev: canon, builds 202→254, security | 2026-07-05 (+ uncommitted build-254) | **+33 ahead, 0 behind** | No | **Active source of truth.** Also **19 commits ahead of its own `origin`** (unpushed). |
| `sprint-1-trade-overhaul` | Old trade-flow sprint | 2026-06-29 | +10 ahead, 0 behind | No | **Appears abandoned** (superseded by later work). Keep, don't delete. |
| `origin/main` | — | 2026-06-17 | 0/0 | — | In sync with local `main`. |
| `origin/security-scaling-hardening` | — | 2026-07-01 | +14 ahead | No | Behind local by 19 commits. |

**Recommended roles (do not implement yet):** Production → `main` (*after* it receives the verified current build); Beta → a new `beta` cut from the verified tip; Development → `security-scaling-hardening` (or fold into `feature/*`); Future work → `feature/*` off `beta`. See `docs/operations/GitWorkflow.md`.

## STEP 3 — Commit History
- **Clarity/consistency:** **Above average for a solo project.** Clear `Build NNN:` convention, root-cause detail (e.g., *"replace irr with rr in drawHUD — irr is inspector-scoped, crashes render loop"*), and emerging conventional prefixes (`feat:`, `fix:`, `docs(canon):`, `chore(dev):`).
- **Problems (documented, not fixed):**
  - **Duplicate commit subjects** — e.g., *"Fix: shelltrader.github.io allowlist + irr→rr HUD fix"* ×3; *"Fix visit-counter RPC call…"* ×3; *"Build 227…"* ×2. Suggests re-commit/cherry-pick churn.
  - **History is not a per-build record** — single commits bundle many builds (*"Builds 203–224…"*; a jump from Build 232 → 247). Real iteration happens in the working directory; commits are periodic snapshots.
  - **Inconsistent author identity** — `Dream Home Spotlight`, `chartquest`, `shelltrader` (all `habitsimulator@gmail.com`) + `Al Do <owl@Als-MacBook-Pro.local>` (unconfigured git on another machine). Timezone drift (+0700 / +0000).
- **Secrets / artifacts scan (full history, pickaxe):**
  - `service_role` → **false positive** (Postgres role name in `GRANT … TO service_role` migrations).
  - `AKIA` → **false positive** (in removed `node_modules` + obfuscated `min.html` string arrays; no real AWS key in tree).
  - `BEGIN PRIVATE KEY`, `sk_live_` → **none**. `.netlify-token` → **never committed** (verified).
  - **Conclusion: no leaked secrets.** The Supabase anon key in the HTML is intentionally public + RLS-gated. *(Recommend a formal `gitleaks`/`trufflehog` full-history pass as confirmation — low-risk tooling.)*
  - **Generated/binary in history:** `node_modules` (removed), `chart-quest.min.html`, multiple `*.zip`, ~250 MB video.

## STEP 4 — Repository Structure (ownership)
| Domain | Top-level folders |
|---|---|
| **Game** | `chart-quest.html`, `index.html`, `finn/`, `bosses/`, `sw.js`, `manifest.json`, icons, `dashboard.html`, `lesson-chart-preview.html` |
| **Website** | `website/`, `marketing/` |
| **QA** | `ChartQuestQA/` (Swift), `load-test/` |
| **Automation/Backend** | `automation/`, `supabase/` |
| **Content pipeline** | `content-assets/`, `content-events/`, `_video-originals/` |
| **AI agents** | `agents/` |
| **Documentation** | `docs/` (+ `docs/canon`, `docs/operations`), root `*.md` |
| **Dev tools** | `scripts/`, `build.js`, `*.command` |
| **Archive/backup** | `archive/`, `deploy/`, `_old_*.zip` (gitignored) |
**Should it eventually split? Yes (post-beta).** Full plan in `docs/operations/FutureRepositoryStrategy.md`. **Not now.**

## STEP 5 — Git Workflow (recommendations only)
- **Branching:** `main`→prod, `beta`→testing, `feature/*`, `hotfix/*` (see `GitWorkflow.md`).
- **Release:** cut from `beta`→`main`, always run `cq.sh ship`, then tag.
- **Tagging:** annotated `vYYYY.MM.DD-build<NNN>` on every prod deploy (currently **0 tags** — the biggest rollback gap).
- **Deployment:** move to **Cloudflare Pages git-integration** so a deploy == a commit (see `CloudflareDeployment.md`).
- **Rollback:** host "restore previous deployment" + tags + `_old_*.zip` (see `RollbackProcedure.md`).
- **Branch protection:** recommended for `main` **once CI exists**; do **not** enable now (would block solo dev).

## STEP 6 — Repository Safety
| Question | Finding |
|---|---|
| Backups sufficient? | **Partially.** ~22 `_old_*.zip` full snapshots exist locally (good), but **19 commits + the build-254 working tree are only on this laptop** — not on GitHub. Single-machine risk. |
| Rollback safe? | **Yes**, via host deploy history / `_old_*.zip` / commits (documented in `RollbackProcedure.md`). |
| Recovery documented? | **Yes** (Phase 1.5 `docs/operations/`). |
| Critical assets protected? | **At risk:** deploy manifest omits `finn/` → silent old-turtle regression (Phase 1.5 finding). In a git-integrated deploy from repo root this is *fixed* (repo contains `finn/`). |
| Large files handled? | **No** — ~300 MB in history; `.gitignore` prevents *future* bloat but past bloat remains (rewrite = out of scope). |
| `.gitignore` sufficient? | **Mostly yes** (covers `node_modules`, `_old_*.zip`, `deploy.zip`, `.netlify-token`, `min.html`). Minor additions suggested below. |

---

## STEP 7 — Recommended LOW-RISK improvements (await approval; not executed)
> All are non-destructive: no history rewrite, no force-push, no deletions of branches/tags/assets.
1. **`git push` the current branch** (19 unpushed commits) to origin — **#1 safety win.** Off-machine backup of the shipping work. *(Not a force-push; just uploads new commits.)*
2. **`git gc` + clean the 48 `tmp_obj_*` garbage files** — repacks 630 MB of loose objects (faster ops, smaller `.git`); does **not** touch history/commits.
3. **Standardize git identity** — set one `user.name`/`user.email` going forward (fixes the 4-identity spread). *Past commits untouched.*
4. **Add `package.json` + lockfile** pinning `javascript-obfuscator` (reproducible `build.js`; runtime unaffected — build is disabled).
5. **Minor `.gitignore` additions** — Xcode build artifacts (`ChartQuestQA/build/`, `*.pcm`, `*.o`), recursive `**/.DS_Store`.
6. **Top-level `README.md`** orienting a new engineer + linking `docs/canon` and `docs/operations`.
7. **Repo description / topics** on GitHub (discoverability).
8. **`gitleaks`/`trufflehog` full-history scan** as documented confirmation of "no secrets."

## Recommended MEDIUM-RISK changes (document only — do NOT execute this phase)
- **Bring `main` up to the verified current build** (merge `security-scaling-hardening` → `main` after `cq.sh ship`). Required before pointing Cloudflare at `main`. *(A merge, not a rewrite — but it changes production truth, so: approval first.)*
- **`git rm --cached` the tracked junk zips** (`archive/misc/zixWYTP8`, `zieVGeSX`, `website.zip`) + move to `_archive/`. Stops future tracking; history unchanged.
- **De-track `_video-originals/` masters** (~108 MB) if not runtime-served.

## Recommended HIGH-RISK changes (document only — do NOT execute, likely post-beta)
- **History rewrite** (`git filter-repo`/BFG) to purge ~300 MB of committed `node_modules`/video/zips. Rewrites all hashes, invalidates clones, needs a coordinated force-push window — explicitly forbidden this phase.
- **Repository split** into game/website/QA/infra/content (see `FutureRepositoryStrategy.md`).

## STEP 8 — Future Repository Strategy
Documented in full in **`docs/operations/FutureRepositoryStrategy.md`**: recommended repos (`chartquest-game`, `-website`, `-qa`, `-infra`, `-content`), migration order (infra → qa → website → game history-shrink), effort (S/S/S–M/M–L), risks, and timing (**after** beta stabilizes, **before** public launch — never under launch pressure).

---

## STEP 9 — Professional Engineering Assessment

### Strengths
- No leaked secrets; sound `.gitignore`; strong backend security posture.
- Exceptional documentation/canon discipline; a real automated regression gate.
- Simple, git-hostable static architecture — Cloudflare Pages is a natural fit.
- Clear, root-cause commit messages with a consistent build-number convention.

### Weaknesses
- Production truth (`main`) is stale and the shipping build isn't fully pushed to GitHub.
- No tags, no CI, manual/unversioned deploys, asset-manifest gap.
- 630 MB never-packed `.git` with ~300 MB permanent bloat; interrupted-op garbage.
- Fragmented author identity; multi-product tree.

### Immediate risks
1. **Single-machine exposure** — 19 commits + uncommitted build-254 exist only locally.
2. **Deploying `main` would ship a 3-week-old build.**
3. **`finn/` manifest gap** under the *old* deploy path (mitigated by git-integrated deploy from repo root).

---

## FINAL VERDICT — "Would you approve this repository for production deployment today?"

### **No — not today.** But the gap is small, and every fix is safe.
I would not connect Cloudflare Pages to this repo *as it stands* for one core reason: **the repository is not yet the source of truth.** The current, verified game (build 254) is partly unpushed and `main` — the branch Cloudflare would deploy — is 33 commits behind. Connecting today would either deploy a stale build or deploy from a laptop-only state that can't be reproduced.

### Minimum must-do before I'd confidently connect Cloudflare (all LOW/である-safe, none forbidden):
1. **Push the current branch to GitHub** — get the 19 commits + build-254 work off the single machine and onto origin.
2. **Finish and commit the in-flight build** — run `scripts/cq.sh ship` so `index.html` mirrors `chart-quest.html` (currently 252 vs 254) and the regression gate passes; commit by explicit path.
3. **Put the verified build on the branch Cloudflare will deploy** — either fast-forward/merge it into `main`, or point Cloudflare at the branch that actually holds it. (Merge = medium action → your approval.)
4. **Tag that build** (`vYYYY.MM.DD-build254`) as the first rollback anchor, and confirm the deployed set includes `finn/`, `bosses/`, top-level media (verify via the Cloudflare preview — Finn renders, not the turtle).

That's it. **Not** required before beta: `git gc`, history-shrink, node_modules-in-history, author cleanup, branch pruning, repo split — all real, all post-beta, none blocking.

> **Bottom line:** this is a *good project with an under-managed repository.* Four small, reversible steps turn it into a repository I'd sign off on for a beta. Do those; leave the deep cleanup for after launch.
