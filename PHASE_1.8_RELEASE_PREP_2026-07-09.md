# ChartQuest — Phase 1.8: Production Source of Truth & Release Prep

**Date:** 2026-07-09 · **Role:** Lead Architect / Release + DevOps Engineer
**Rule compliance:** No history rewrite, force-push, rebase, squash, branch/tag delete, repo split, folder move, asset delete, gameplay/UI/visual change, or Cloudflare connect. Irreversible steps (branch merge, tag, deploy) are **recommended, not executed** — they await your approval.

---

## Executive Summary
Build 254 is now **verified, committed, and pushed** — GitHub holds the current game; nothing critical is laptop-only. The release candidate passed the regression gate and a live browser boot (official Finn renders, all assets 200, console clean). The deployment manifest, tag strategy, Cloudflare plan, and an updated Founders Dashboard (new **Release Control Center**) are in place. **Three approval-gated steps remain** before Cloudflare: pick the deploy branch (→ `main`), create the first tag (`v0.1.0-beta`), then connect Cloudflare. None are done automatically.

---

## STEP 1 — Current build finished ✅
- `chart-quest.html` (build 254) mirrored to `index.html` — **sha256-identical** (gate check #8 PASS).
- Regression gate (`scripts/verify.js`): **7 pass**, checks 7/10 SKIP (unchanged vs HEAD after commit), #9 flags only an out-of-scope untracked `website/Market-maker-cinematic.mp4` (marketing asset, not in the game commit).
- The only "protected" delta was removal of `cq_trials` — a **flag-gated dev toggle** for the deprecated GUARDIAN TRIAL FRAMEWORK (not player data). Safe, and consistent with build 254's mandate. Verified before commit.
- No new gameplay introduced. Two clean commits, staged by explicit path:
  - `954bb85` Build 254: delete the old turtle model — official Finn everywhere
  - `6a97216` chore(dev): regression gate + canon reflect the build-254 Finn removal

## STEP 2 — Repository safety ✅
- Pushed `security-scaling-hardening` to origin (`fd6bf7c..6a97216`, **non-force fast-forward**). Branch is now **in sync with origin** — was 21 commits ahead (19 pre-existing + my 2).
- **No verified work exists only on this computer.**

## STEP 3 — Production branch recommendation (approval required — NOT merged)
**Recommend: `main` becomes the deployment branch, after receiving build 254.**
- **Pros:** conventional; `main` = production truth; Cloudflare's default production branch; clean mental model.
- **Cons:** requires a merge (`security-scaling-hardening` → `main`); `main` is currently 3 weeks stale.
- **Risk:** Low — it's a fast-forward-style merge, no rewrite. The verified build is already gate-green.
- **Workflow after:** `feature/*` → `beta` → `main` (tag + deploy). See `docs/operations/GitWorkflow.md`.
- **Alternative:** point Cloudflare at `security-scaling-hardening` directly (faster, but leaves `main` misleading). Not recommended long-term.
> **Awaiting your OK to merge.** I did not merge.

## STEP 4 — Release candidate verification ✅
| Check | Result |
|---|---|
| Game launches | ✅ boots to cinematic → onboarding, no black-screen |
| Finn loads correctly | ✅ `FINN_SPRITES.ready = true`; all 6 sprites decoded (run.png 282px) — **official Finn, not the fallback turtle** |
| Bosses load | ✅ `openBoss`/`bossRound` engine + `boss-0..10` art present (gate #5) |
| Assets load | ✅ finn/, bosses/, cinematic, icons, manifest, sw.js all **HTTP 200** |
| Movement | ✅ character/world initialized (`turtle.x` set), rAF loop live *(full input drive validated on-device across builds 247–254; synthetic events don't drive the canvas reliably)* |
| Lessons | ✅ 31 lesson keys + `conceptTier` + `LESSON_MASTERY` (gate #4) |
| Save system | ✅ 26 `cq_*` keys incl. core (gate #6) |
| Authentication | ✅ Supabase SDK loads; offline stub present |
| Service worker | ✅ present; cache bumped v232→v243 |
| Console | ✅ **no errors** through cinematic + onboarding |
| Network | ✅ no 404s on runtime assets |
No verified bugs found → no fixes made (per "fix only verified bugs").

## STEP 5 — Deployment manifest ✅
Created **`docs/operations/DeploymentManifest.md`** — the official production include/exclude checklist. Includes the game, `finn/`, `bosses/`, media, icons, manifest, SW, legal pages; excludes archives, QA, automation, marketing, docs, dev tools. `dashboard.html` categorized as internal (already admin-gated).

## STEP 6 — Release tag recommendation (approval required — NOT created)
**Recommend `v0.1.0-beta`** on the verified build-254 commit (`6a97216`).
- SemVer-flavored + `-beta` reads clearly as the first external beta and leaves room for `v0.1.1`, `v0.2.0`.
- Going forward, tag every production deploy: `v0.1.0-beta`, then `vMAJOR.MINOR.PATCH` (optionally note the build: annotate with "build 254").
- This is the **first rollback anchor** (there are currently **0 tags**).
> Command (for your approval, not run): `git tag -a v0.1.0-beta 6a97216 -m "First external beta — build 254" && git push origin v0.1.0-beta`

## STEP 7 — Cloudflare readiness ✅ (report; not connected)
| Item | Value |
|---|---|
| Framework | None (static HTML/JS/CSS) |
| Build command | *(empty)* — no build step (obfuscation disabled) |
| Output directory | `/` (repo root) — contains `finn/`, `bosses/`, media ⇒ **fixes the old manual-deploy `finn/` omission** |
| Environment variables | **None** — Supabase URL + anon key are hardcoded/public + RLS-gated |
| DNS | Add custom domain in Pages; keep Netlify live until verified, then switch |
| Headers/redirects | `netlify.toml` → paste-ready `_headers`/`_redirects` in `docs/operations/CloudflareDeployment.md` (create at cutover) |
| Expected behavior | Git-integrated deploy = one commit per deployment + one-click rollback |

## STEP 8 — Founders Dashboard updated ✅
Added a **Release Control Center** tab to the existing `dashboard.html` (no second dashboard). Shows current branch, build, GitHub sync, RC status, latest verification, deploy-branch decision, Cloudflare readiness, manifest status, rollback status, repo health, pending approvals, and the recommended next action. Verified rendering in-browser (matches theme, existing tabs intact). *(Static snapshot dated 2026-07-09; a future task can wire it to live git/GitHub data. The dashboard is admin-gated + server-side admin-checked.)*

---

## STEP 9 — Status & risk

**Completed:** build 254 verified + mirrored + committed + pushed; RC smoke-tested in-browser; deployment manifest; tag + branch + Cloudflare recommendations; dashboard control center.

**Current status:** Branch `security-scaling-hardening` @ `6a97216` (in sync with origin) · Build **254** · Mirror synced · Gate **PASS (game)** · GitHub **is** the source of truth for the game.

**Remaining approvals (all yours to grant):**
1. Merge build 254 → `main` (or choose the deploy branch).
2. Create tag `v0.1.0-beta`.
3. Connect Cloudflare Pages.

**Recommended next action:** Approve #1 + #2; then Cloudflare can connect immediately.

**Risk assessment:** **Low.** The game is verified and reversible at every step (non-force commits, host rollback, `_old_*.zip`). The residual items are operational, not code: 0 tags until you approve one, `main` stale until merged, and `git gc` (630 MB unpacked `.git`) is recommended cleanup — none block a safe beta.

---

## FINAL QUESTION — "Would you personally be comfortable connecting this repository to Cloudflare Pages tomorrow?"

### **Yes — with two 5-minute approvals first.**
I'm confident because: the game is **verified end-to-end** (gate + live boot, official Finn, assets 200, console clean); the current build is **on GitHub** (not laptop-only); the deploy is **static with no build/secrets** so there's little to misconfigure; git-integrated Cloudflare from repo root **structurally fixes** the old `finn/`-omission risk; and rollback exists (host history + `_old_*.zip`, plus a tag once created).

**The only things standing between "today" and "connect":**
1. **Merge build 254 onto the branch Cloudflare will deploy** (recommend `main`) — else it ships a 3-week-old build.
2. **Create `v0.1.0-beta`** as the first rollback anchor.

Do those two (I've prepared both; they need your go), and I'd connect Cloudflare tomorrow without hesitation. Not blockers for *connecting*, but do before *inviting testers*: production SMTP + Supabase Pro (ops items in `docs/PRODUCTION_READINESS.md`).
