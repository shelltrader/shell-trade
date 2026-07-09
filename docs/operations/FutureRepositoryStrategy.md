# Future Repository Strategy

**Status:** PLANNING ONLY. **Do not split the repository or move major directories during Phase 1.5.** This documents the recommended post-beta path so it can be executed deliberately later.

---

## 1. Why consider a split
Today one repo holds several unrelated products, which causes the `git add -A` hazard, ~250 MB of committed media, and confusing ownership:
- the **game** (`chart-quest.html` + `finn/`, `bosses/`, `sw.js`, …) — the shipping product;
- **`ChartQuestQA/`** — a native macOS Swift app (its own build system, ~72 tracked files);
- **`website/`** — the separate marketing site (deploys independently);
- **`automation/` + `supabase/`** — backend migrations, Edge Functions, tooling;
- **`agents/`, `marketing/`, `content-assets/`, `_video-originals/`** — content/asset production.

## 2. Recommended target structure
Two viable shapes — pick based on team size:

**Option A — multiple focused repos (recommended for clean ownership):**
| Repo | Contents | Deploys to |
|---|---|---|
| `chartquest-game` | the game + runtime assets + `docs/canon` + `docs/operations` | Cloudflare Pages |
| `chartquest-website` | `website/` | its own Pages/site |
| `chartquest-qa` | `ChartQuestQA/` (Swift) | n/a (dev tool) |
| `chartquest-infra` | `supabase/`, `automation/migrations`, `load-test/` | Supabase |
| `chartquest-content` (optional) | `content-assets/`, `_video-originals/`, `marketing/` (or Git LFS / external store) | asset store |

**Option B — one repo, workspace-organized:** keep a single repo but move each product under a clear top-level dir with its own README and `.gitignore`, and move large media to Git LFS or an external bucket. Lower effort, keeps history in one place, but the `git add -A` and weight problems only partially improve.

## 3. Migration order (when executed, post-beta)
1. **Freeze & tag** the current state (`git tag pre-split-<date>`), and keep a full `_old_*.zip` snapshot.
2. **Extract `chartquest-infra`** first (backend is self-contained, lowest coupling).
3. **Extract `chartquest-qa`** (Swift app; no runtime coupling to the game).
4. **Extract `chartquest-website`** (already deploys separately).
5. **History-shrink the game repo** last (`git filter-repo`/BFG) to drop the ~250 MB of video + junk blobs from history — this rewrites history and needs a coordinated force-push window.
6. Re-point Cloudflare Pages / Supabase / any CI at the new repos.

## 4. Risks
- **History rewrite** (step 5) invalidates existing clones and any hardcoded commit refs — do it once, announce it, force-push in a quiet window.
- **Asset path breakage** if the game's `finn/`/`bosses/` folders don't move with it — verify every relative asset path after extraction (the same class of bug as the deploy `finn/` omission).
- **Cross-references** in `docs/` (canon links) may break if docs move between repos.
- **Lost provenance** if media is dropped from history without an archived copy — keep the `_old_*.zip`/`_archive/` snapshots.

## 5. Effort & timing
| Step | Effort | Timing |
|---|---|---|
| infra extract | S | Any time post-beta |
| qa extract | S | Any time post-beta |
| website extract | S–M | After beta |
| game history-shrink | M–L (coordinated) | Between beta and public launch, quiet window |

**Recommended timing:** **after** the first beta stabilizes and **before** wider public launch — never during active launch pressure. Until then, the single repo with the [GitWorkflow.md](GitWorkflow.md) discipline (explicit-path staging, `.gitignore`, tags) is sufficient and far less risky.

## 6. Cheaper interim wins (safe now, if approved separately — not part of Phase 1.5)
- Add a `package.json`/lockfile for the obfuscator toolchain (reproducible build).
- `.gitignore` Xcode/build artifacts already untracked.
- Move junk blobs (`archive/misc/zieVGeSX`, `zixWYTP8`, `website.zip`) to `_archive/`.
These are documented in the Phase-1 audit (`ARCHITECTURE_PHASE1_AUDIT_2026-07-09.md`) and don't require a repo split.
