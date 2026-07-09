# Git Workflow

**Status:** Recommended workflow for ChartQuest. Adopt incrementally — nothing here is enforced automatically, and **no branch protection is enabled without founder approval** (it could block current solo development).

---

## 1. Branch model

| Branch | Role | Deploys to | Who merges in |
|---|---|---|---|
| `main` | **Production.** Always deployable, always tagged. | Production (chart-quest-game domain) | `beta` (after beta sign-off) or `hotfix/*` |
| `beta` | **Beta testing.** What external testers play. | Beta/staging URL | `feature/*` when ready to test |
| `feature/<name>` | **New work.** One concern per branch. | — (local/preview) | branched from `beta` |
| `hotfix/<name>` | **Urgent production fix.** | Production after fast verify | branched from `main`, merged to `main` **and** `beta` |

**Flow:** `feature/*` → `beta` → (beta testing) → `main` → tag → deploy.
**Urgent:** `hotfix/*` off `main` → verify → `main` (+ back-merge to `beta`).

### ChartQuest-specific rules that override generic git advice
- **`chart-quest.html` is the only source of truth.** `index.html` is a generated mirror — never hand-edit it. Every branch runs `scripts/cq.sh ship` (mirror + `verify.js` gate) before merge.
- **Protected systems are frozen** ([`../canon/protected_systems.md`](../canon/protected_systems.md)). A feature branch that touches Finn art, bosses, lessons, movement, save keys, UI flow, monetization, the mirror, or the trading system needs explicit approval first.
- **One system per feature branch.** Don't co-mingle a movement tweak and a lesson change.

## 2. Tagging & releases (fills today's 0-tags gap)
Every production deploy gets an **annotated tag** — this is the rollback anchor.

```
# after `scripts/cq.sh ship` passes and you're about to deploy:
git tag -a v2026.07.09-build254 -m "Beta build 254 — Finn cleanup + security hardening"
git push origin v2026.07.09-build254
```

Convention: `vYYYY.MM.DD-build<NNN>` (build number = `BUILD_TAG` in `chart-quest.html`). Beta milestones may also use `beta-1`, `beta-2`. **Never deploy an untagged production build** — see [RollbackProcedure.md](RollbackProcedure.md).

## 3. Commit hygiene (the tree has a Swift app, a website, and 250 MB of media)
- **Stage by explicit path**, never `git add -A`:
  `git add chart-quest.html index.html docs/... ` — only what the task touched.
- **Never commit:** `deploy.zip`, `_old_*.zip`, `.netlify-token`, `chart-quest.min.html` (unless a build task), `ChartQuestQA/` or `website/` (unless the task is theirs). These are already in `.gitignore` or must be staged deliberately.
- **Conventional-ish messages** already in use: `Build NNN: …`, `docs(canon): …`, `chore(dev): …`. Keep that.

## 4. Getting from today's state to this model (advisory, do when ready)
The current reality: `main` is stale; active work + uncommitted build-254 changes live on `security-scaling-hardening`.
Suggested one-time reconciliation (founder-run, not automated here):
1. On `security-scaling-hardening`, finish + `scripts/cq.sh ship` the build-254 work, commit by explicit path.
2. Create `beta` from that verified tip: `git branch beta`.
3. When beta is signed off, fast-forward `main` to it and tag the release.
4. From then on, `main` == production truth.

## 5. Branch protection — RECOMMENDED, NOT ENABLED
When the team grows past solo dev, on GitHub → Settings → Branches/Rulesets for `main`:
- Require a pull request before merging.
- Require the **regression gate to pass** as a status check (wire `scripts/verify.js` into GitHub Actions first).
- Restrict force-pushes and deletions.

**Do not enable these yet** — with a single developer and a manual deploy, requiring PRs would block normal work. Revisit when a second engineer joins or when CI exists.
