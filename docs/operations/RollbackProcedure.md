# Rollback & Recovery Procedure

**Status:** How to restore a known-good version of ChartQuest. **No existing backup is ever deleted** as part of any procedure here.

> **Golden rule:** you can always get back to a working version. The mechanisms below are ordered fastest → most thorough.

---

## 0. What "a version" means here
A ChartQuest release is: `chart-quest.html` (+ its `index.html` mirror) **plus every runtime asset** (`finn/`, `bosses/`, top-level media, `sw.js`, `manifest.json`, icons). A rollback must restore the **whole set**, not just the HTML — restoring HTML without `finn/` reproduces the old-turtle fallback.

## 1. Rollback options, fastest first

### A. Host-level "restore previous deployment" (fastest, zero local work)
- **Netlify (current host):** app.netlify.app → site `chart-quest-game` → **Deploys** → pick the last-known-good deploy → **Publish deploy**. Instant, atomic, includes all assets that were in that deploy.
- **Cloudflare Pages (future host):** Pages project → **Deployments** → previous deployment → **Rollback to this deployment**. Same idea, git-linked.
- This is the **preferred** rollback once you're on a host that keeps deploy history. It requires nothing from the repo.

### B. Redeploy a local backup snapshot (current safety net)
The `_old_*.zip` files in the working directory are full working-directory snapshots and are **the current rollback backups** — keep them.
1. Unzip the chosen `_old_*.zip` to a scratch folder.
2. Verify it contains `finn/`, `bosses/`, `index.html`, `chart-quest.html`.
3. Re-deploy that folder (Netlify direct-deploy, or `wrangler pages deploy <folder>` on Cloudflare).

### C. Git checkout of a tagged release (target state)
Once releases are tagged (see [GitWorkflow.md](GitWorkflow.md)):
```
git checkout v2026.07.09-build254      # the tag you want to restore
scripts/cq.sh ship                     # re-mirror + verify + refresh site assets
# then deploy the working tree (host git-integration redeploys automatically)
```
Until tags exist, use the commit hash from `git log` for the build you want.

## 2. Scenario playbooks

### Scenario 1 — "The new build is broken in production"
Fastest: **Option A** (host restore previous deploy). Then investigate on a branch. Do **not** hot-patch production directly.

### Scenario 2 — "I need to restore a specific older version"
Use **Option C** (checkout the tag/commit) if it's in git, or **Option B** (the matching `_old_*.zip`) if it predates the change. Always run `scripts/cq.sh ship` after a git checkout so `index.html` mirrors and the gate passes.

### Scenario 3 — "The deploy failed / uploaded partially (missing assets)"
Symptom: game loads but **Finn is the old blocky turtle**, or bosses/media 404. Cause: an incomplete asset manifest (the classic `finn/` omission).
1. Immediately **Option A** (restore the previous good deploy) to stop the bleeding.
2. Fix the manifest so the output includes `finn/`, `bosses/`, top-level media (see [CloudflareDeployment.md](CloudflareDeployment.md)).
3. Re-run [ReleaseChecklist.md](ReleaseChecklist.md), redeploy, and confirm Finn renders on the **live** URL.

### Scenario 4 — "A service worker is serving a stale build to users"
`sw.js` caches aggressively. If users see an old build after a good deploy, bump the SW cache version and redeploy; document the SW version in the release note. (This is a *forward* fix, not a rollback.)

## 3. Backend rollback (Supabase)
The database and Edge Functions are versioned separately from the static site.
- **Migrations are forward-only.** To undo a schema change, write a **compensating migration** (e.g., `00NN_revert_xxx.sql`) — never hand-edit production tables. Migrations live in `automation/migrations/`.
- **Edge Functions** (`ingest`, `update-progress`) can be re-deployed to a prior version from source.
- **Deploy order matters** for the ingest/dashboard lockdown — follow the sequence in [`../PRODUCTION_READINESS.md`](../PRODUCTION_READINESS.md) (deploy static files *before* applying `0009`).

## 4. Do-not-delete list (backups)
Never remove as part of cleanup: `_old_*.zip`, `deploy/` snapshot, `archive/`, and any host-side deploy history. If disk space is the concern, **move** them to `_archive/` — never delete.
