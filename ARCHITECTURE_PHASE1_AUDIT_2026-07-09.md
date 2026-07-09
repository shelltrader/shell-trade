# ChartQuest — Architecture Phase 1: Audit & Change Plan (Pass 1, Analysis Only)

**Date:** 2026-07-09
**Author:** Lead Software Architect (Phase One engagement)
**Status:** PASS 1 — ANALYSIS ONLY. **Zero files modified** except the creation of this report.
**Scope:** Prepare the repository for first external beta by improving engineering quality and reducing technical debt **without changing the player's experience.**

> **Prime directive honored throughout:** if preserving gameplay conflicts with engineering elegance, gameplay wins. Nothing in the proposed plan touches player-visible behavior. The highest-value code target (the monolith) is explicitly recommended **out of scope** for this pass.

---

## 0. One-paragraph verdict

ChartQuest is a **shippable game with unusually strong documentation discipline living inside a cluttered, mixed-purpose repository.** The game itself (`chart-quest.html`) is a heavily-protected 20k-line monolith that a prior "Architecture & Stabilization" pass already fenced with an excellent `docs/canon/` guardrail layer — that work should be respected, not redone. The real, safe, high-leverage wins for a pre-beta pass are **not in the game code at all**; they are in **repository hygiene**: ~4.6 GB of local clutter, ~250 MB of video committed to git, a stale `deploy/` snapshot, no dependency manifest, and ~90 point-in-time audit docs with no navigation. All of that can be cleaned with **Low runtime risk** because none of it is loaded by the running game. The engineering-quality improvements *inside* the monolith that the health report identifies are all **Medium/High risk** and belong to deliberate, individually-approved, post-beta tasks — especially because the founder is **currently mid-change inside that file** (build 254).

---

## 1. Critical context discovered (read this first)

1. **The repo is mid-flight.** Current branch is `security-scaling-hardening` with a large dirty working tree. `chart-quest.html` is at **build 254** (which *already* removed the deprecated Finn walk-sheet/body/leg assets + code paths — see `git status`: `D finn/walk-sheet.png`, `M finn/run.png`). `index.html` is still at **build 252**. **The source is two builds ahead of the deployed mirror, intentionally, mid-change.**
   - **Implication:** Phase One must not touch `chart-quest.html` / `index.html`, and must branch in a way that preserves this in-flight work. The "delete deprecated Finn code" item from the old health report is **already being done by the founder** — do not duplicate or interfere.

2. **A canon/guardrail system already exists and is authoritative.** `docs/canon/` (18 files) already contains a system inventory, duplicate report, architecture map, protected-systems list, a mandatory change-workflow, a regression checklist, and a maintainability score (5.0/10). **This audit builds on it; it does not replace it.** Creating parallel "professional docs" that duplicate canon would *cause* the exact doc↔code drift the canon warns about — so the plan below points to canon rather than cloning it.

3. **Nine protected systems are frozen by default** (`docs/canon/protected_systems.md`): Finn art, boss roster, lesson order, movement model, monetization, save schema, UI flow, the canonical file mirror, and the trading system. Phase One touches **none** of them.

4. **The backend is already hardened.** 10 SQL migrations (RLS, write-lockdown via Edge Functions, retention, ingest throttle, admin gating), security score self-assessed at 95/100. Launch blockers are **operational, not code**: production SMTP, Supabase Pro plan, dashboard auth, load test. These are tracked in `docs/PRODUCTION_READINESS.md` and are **out of Phase One's engineering scope** (they're config/ops), but they gate commercial readiness.

---

## 2. Architecture Audit

### 2.1 Strengths
- **Exceptional documentation & guardrail culture.** The `docs/canon/` layer, per-build rationale comments, versioned save keys, and a real regression gate (`scripts/verify.js` + `scripts/cq.sh ship`) are rare and genuinely valuable. A new engineer can orient from canon in an hour.
- **A working, shipping game** with anti-softlock watchdogs, EMA frame-pacing, offline auth stub, and a service worker.
- **Backend security is mature** for the product stage: RLS scoped to `auth.uid()`, client-forgery closed via Edge Functions, per-IP rate limiting, privacy/terms pages with consent.
- **A single-source-of-truth build discipline** already exists (`chart-quest.html` → `index.html` mirror, enforced by a gate).

### 2.2 Weaknesses
- **The monolith.** One ~20k-line HTML file, 810 functions, 4 inline `<script>` blocks, no modules. Cross-block scope collisions crash silently. Velocity decreases as it grows. (Root cause of most regressions; documented in the health report.)
- **Repository is a mixed-purpose dumping ground.** The game, a native macOS Swift QA app (`ChartQuestQA/`), a separate marketing site (`website/`), automation, agents, marketing assets, video masters, and ~90 audit docs all share one tree. `git add -A` is a documented hazard.
- **No dependency manifest.** `node_modules/` (119 packages, for `javascript-obfuscator`) exists with **no `package.json` / lockfile** — the build toolchain is non-reproducible.
- **Documentation navigation is poor** despite volume: ~24 loose `.md` audits in the repo root and ~70 in `docs/` with no index, no top-level `README.md`.
- **Live deploy publishes the entire repo root** (`netlify.toml`: `publish = "."`), so audit docs, `dashboard.html`, `lesson-chart-preview.html`, and ~250 MB of video are served publicly.

### 2.3 Technical debt (ranked)
| # | Debt | Where | Severity |
|---|---|---|---|
| 1 | 20k-line single-file monolith, no modules | `chart-quest.html` | High (structural) |
| 2 | 3 copies of the game (source / mirror / stale `min.html`) | root | Medium |
| 3 | Live deprecated code paths still parse/load | monolith (partly being removed at build 254) | Medium |
| 4 | No `package.json`/lockfile for the obfuscator toolchain | root | Medium |
| 5 | ~250 MB video + 50 MB junk committed to git | `_video-originals/`, `bosses/`, `archive/misc/` | Medium (repo weight) |
| 6 | ~90 undifferentiated audit docs, no index | root + `docs/` | Low |
| 7 | Stale `deploy/` snapshot (June 17) tracked in tree | `deploy/` | Low |
| 8 | `chart-quest.min.html` stale (older than source) | root | Low |
| 9 | Two `AudioContext`s, two `drawShell()`s, legacy boss object | monolith | Low (naming/dup traps) |

### 2.4 Maintainability risks
- **Blast radius:** a throw in `frame()`/`update()` freezes the whole game (no error boundary).
- **Mirror drift:** hand-editing `index.html` (or forgetting to mirror) silently forks the deployed build — currently the mirror *is* 2 builds behind (in-flight, expected).
- **Deprecated-asset reactivation:** renderers that gate on "is asset loaded" resurrect old Finn art (the 248→250 saga). Build 254 is removing these; until merged, both traps coexist.

### 2.5 Commercial risks
- **`dashboard.html` is public with no login** (anon key calls analytics RPCs) — flagged in `PRODUCTION_READINESS.md`, fix built but pending deploy + migration `0009`.
- **Deploy publishes non-product files** (business audits, founder dashboard, dev harness) to the public site.
- **Email/SMTP not production-grade** and Supabase on Free plan → concurrent signups silently fail. Hard launch blocker.
- **Secret hygiene:** `.netlify-token` is on disk (gitignored, never committed — verified). Good, but it lives in the working tree.

### 2.6 Scaling risks
- Free-tier Supabase (pauses on inactivity, shared compute, strict email limits); load test unrun (needs Pro + branching).
- `api.binance.com` returns 451 in the US → silent fallback to simulated data for US users.
- First-load payload ~1.2 MB (378 KB gzip), SW-cached — fine at 100 users, revisit for mobile at scale.

---

## 3. Proposed Change Plan (risk-rated)

**Legend — Runtime Impact:** *None* = not loaded/served by the running game; a beta tester cannot observe it. **Risk:** Low/Medium/High per the founder's risk policy.

### GROUP A — Local & tracked clutter → `_archive/` (Runtime Impact: None)
| ID | Change | Risk | Files | Revert |
|---|---|---|---|---|
| A1 | Create `_archive/` with a `MANIFEST.md` explaining every archived item. | **Low** | new `_archive/` | delete folder |
| A2 | Move the 22 gitignored `_old_*.zip` (~3 GB local) + local `deploy.zip` into `_archive/local-backups/`. They are restore points; **preserved, not deleted.** | **Low** | local-only (gitignored) | move back |
| A3 | De-track obvious junk in `archive/misc/`: `._delete_test.txt`, `website.zip`, `zieVGeSX`, `zixWYTP8` (mystery 24 MB blobs) via `git rm --cached` + move to `_archive/`. | **Low** | `archive/misc/*` | `git checkout` / move back |
| A4 | Fold the existing `archive/old-scripts/*.command` (7 superseded deploy scripts) into `_archive/old-scripts/` for a single archive location. | **Low** | `archive/` | move back |

### GROUP B — Documentation (Runtime Impact: None)
| ID | Change | Risk | Files | Revert |
|---|---|---|---|---|
| B1 | Add a top-level **`README.md`** that orients a new engineer and **links to existing canon** (does not duplicate it). | **Low** | new `README.md` | delete |
| B2 | Add **`FolderStructure.md`**, **`Deployment.md`**, **`ContentPipeline.md`**, **`CodingStandards.md`** as *thin* docs; map `Architecture.md`→`docs/canon/architecture_map.md`, `GameSystems.md`→`system_inventory.md`, `KnownTechnicalDebt.md`→`development_health_report.md`+`duplicate_report.md`, `FutureArchitectureIdeas.md`→§5 here. Point, don't clone. | **Low** | new docs | delete |
| B3 | *(Founder decision)* Add `docs/audits/` + `docs/reports/` and index the ~90 audits, **keeping the root "drop new audits here" convention** intact. Move older audits only; fix any intra-doc relative links touched. | **Low** (workflow-sensitive) | `docs/*`, root `*.md` | move back |

### GROUP C — Tracking / reproducibility hygiene (Runtime Impact: None)
| ID | Change | Risk | Files | Revert |
|---|---|---|---|---|
| C1 | Add **`package.json` + lockfile** pinning `javascript-obfuscator` so `build.js` is reproducible. Does not change runtime (build is disabled in `netlify.toml`). | **Low** | new `package.json` | delete |
| C2 | Extend `.gitignore` for Xcode/macOS build cruft (`ChartQuestQA/build/`, `*.pcm`, `*.o`, `.DS_Store` recursive). Already-untracked; formalizes it. | **Low** | `.gitignore` | revert line |
| C3 | *(Founder decision)* De-track `_video-originals/` (~108 MB masters, not served at runtime) via `git rm --cached` + `.gitignore` + move to `_archive/video-masters/`. **Keep** `bosses/intros/*.mp4` and root `Market-maker-cinematic.mp4` (runtime-referenced — verify first). | **Medium** | `_video-originals/` | `git checkout` |

### GROUP D — Deploy / publish hygiene (Runtime Impact: **could affect live site** — treat carefully)
| ID | Change | Risk | Files | Revert |
|---|---|---|---|---|
| D1 | Recommend restricting what Netlify publishes so audit docs / `dashboard.html` / dev harness / video masters aren't public (curated publish dir **or** edge redirects). | **Medium–High** | `netlify.toml` | revert config |
| D2 | Add a real `404.html` (netlify.toml already redirects `preview-*.html` → `/404.html`, which doesn't exist). | **Low** | new `404.html` | delete |

> D1 touches the live deployment path. Per the prime directive I recommend **staging + verifying** it, or deferring to a dedicated ops task. It overlaps the already-planned dashboard lockdown in `PRODUCTION_READINESS.md`.

### GROUP E — Monolith code quality (Runtime Impact: **player-observable** — RECOMMEND DEFER)
| ID | Change | Risk | Rationale |
|---|---|---|---|
| E1 | Wrap `frame()`/`update()` in a try/catch error boundary. | **High** | Changes behavior on a throw → observable. Also the founder is mid-change in this file. Defer to a dedicated, approved task. |
| E2 | Remove remaining deprecated code (legacy boss object, dormant quiz canvas, prototype flow-reads, 2nd `AudioContext`). | **High** | Touches the protected monolith + must mirror + must pass the gate. The Finn-asset removal is **already in progress** at build 254; the rest is a separate approved cleanup, post-beta. |
| E3 | Rename `drawShell`/split long functions/magic numbers. | **High** | Any diff to `chart-quest.html` risks gameplay + the 248→250 class of regressions. Not worth it pre-beta. |

**Phase One recommendation: make _zero_ edits to `chart-quest.html` / `index.html`.** Every in-file "quality" win is Medium/High risk and the file is actively being changed by the founder. This is the honest senior-engineer call: do not refactor the monolith under launch pressure.

### GROUP F — Sub-projects (Runtime Impact: None; out of scope by guardrails)
`ChartQuestQA/` (Swift), `website/`, `agents/`, `automation/`, `marketing/`, `content-assets/` — the canon workflow forbids touching these unless the task is theirs. Phase One only proposes a one-line `README` stub per top-level sub-project explaining what it is (**Low**), no restructuring.

---

## 4. Change management summary

| Group | # changes | Max risk | Player-observable? | Recommended for Phase One |
|---|---|---|---|---|
| A — clutter → archive | 4 | Low | No | ✅ Yes |
| B — documentation | 3 | Low | No | ✅ Yes (B3 needs a nod) |
| C — tracking/repro | 3 | Medium (C3) | No | ✅ A/C1/C2 yes; C3 needs a nod |
| D — deploy hygiene | 2 | Medium–High | Possibly (D1) | ⚠️ D2 yes; D1 stage/defer |
| E — monolith quality | 3 | High | **Yes** | ❌ Defer to post-beta approved tasks |
| F — sub-projects | 1 | Low | No | ✅ README stubs only |

**Net Phase-One footprint if approved as recommended (A + B + C1/C2 + D2 + F):** additive files (README, docs, package.json, 404.html, `_archive/`) + moves of non-runtime clutter + `.gitignore` edits. **No edits to any file the running game loads. Zero player-observable change. Fully reversible.**

---

## 5. Recommended Phase Two tasks (document only — do NOT do now)
1. **Modularize the monolith** incrementally: extract inline `<script>` blocks to `src/*.js` behind a tiny build step; one module at a time, each behind the regression gate. (+1.5 maintainability, Large effort.)
2. **Error boundary** around `frame()`/`update()` so a throw logs instead of freezing. (Dedicated, verified task.)
3. **Finish deprecated-code removal** the build-254 pass started (legacy boss object, dormant quiz canvas, flow-reads prototype, dup `AudioContext`).
4. **Retire `chart-quest.min.html`** or make it strictly build-output; make `index.html` build-only (never hand-edited).
5. **History-shrink** (BFG/`git filter-repo`) to remove the ~250 MB of committed video/binaries from history — high-risk, coordinate a force-push window.
6. **Split the repo:** move `ChartQuestQA/` and `website/` to their own repos (or a monorepo with workspaces) so the game tree is game-only.
7. **Reconcile `docs/finn-canon/` with `finn_canon.md`** (the Character Bible still names a renderer that no longer ships).

---

## 6. Potential risks of the Phase One plan itself
- **Doc-link breakage** if audits are moved (B3) — mitigate by grepping for cross-references before moving.
- **Runtime-asset misclassification** (C3/A) — mitigate by grepping the game source for every filename before archiving; **keep anything referenced.**
- **Branch collision with in-flight work** — Phase One must branch off the *current* tip so build-254 changes are preserved; do all hygiene as new, path-explicit commits (never `git add -A`).
- **Deploy config (D1)** — the one place a mistake is player-visible; stage it.

---

## 7. Commercial readiness assessment (repo/engineering lens only)
**Not launch-ready yet — but the blockers are operational, not code.** Security *architecture* is strong (RLS, edge-function write-lock, rate limits). Before public beta: production SMTP, Supabase Pro, dashboard auth + migration `0009` deploy, and a load test. The engineering-hygiene work in this plan does not unblock launch by itself, but it makes the repo safe to hand to a second engineer and removes the `git add -A`/mirror-drift footguns that could *cause* a bad launch.

---

## 8. Scores (current baseline → projected after Phase One hygiene)

| Dimension | Now | After Phase One (A+B+C+D2+F) | Ceiling after Phase Two |
|---|---|---|---|
| **Maintainability** | 5.0 / 10 | **6.0 / 10** | 7.5–8 / 10 |
| **Scalability (infra)** | 6.0 / 10 | 6.0 / 10 (unchanged — ops-gated) | 8 / 10 |
| **Professional Engineering** | 5.0 / 10 | **6.5 / 10** | 8 / 10 |

Phase One deliberately buys the *cheap* maintainability/professionalism gains (navigation, reproducibility, a clean tree, a real README) with near-zero runtime risk. The remaining points require touching the monolith — deliberately, post-beta, one guarded step at a time.

---

## 9. Decisions needed before Pass 2 (execution)
1. **Branch base:** create `architecture-phase-1` off the **current tip** (preserves build-254 in-flight work) — confirm?
2. **Scope to execute:** approve **A + B1/B2 + C1 + C2 + D2 + F** (all Low risk, zero runtime)?
3. **B3** (reorganize/​index the ~90 audit docs) — yes, or leave the flat root convention?
4. **C3** (de-track `_video-originals/` masters ~108 MB) — yes, or keep tracked?
5. **D1** (restrict Netlify publish set) — do now with staging, or defer to the ops/dashboard-lockdown task?
6. **Group E confirmed deferred** (no monolith edits this pass) — agree?

*Nothing will be changed until you approve. This document is the only file created in Pass 1.*
