# Production Deployment Manifest

**Status:** The official production deployment checklist for ChartQuest (the game). Derived from what the game actually loads at runtime (verified against `index.html` build 254 + HTTP 200 asset checks on 2026-07-09).
**Rule:** deploy the **INCLUDE** set; never deploy the **EXCLUDE** set. When in doubt about a *game* asset, include the whole folder (`finn/`, `bosses/`) — a missing path-loaded sprite silently ships the fallback turtle.

---

## ✅ INCLUDE — required for the public game

### Entry + PWA
| Path | Why |
|---|---|
| `index.html` | **The deployed game** (Netlify/Cloudflare serves this as `/`). |
| `chart-quest.html` | Source; byte-identical to `index.html`. Optional to serve; harmless. |
| `manifest.json` | PWA manifest (installable app). |
| `sw.js` | Service worker (offline cache). **Bump its cache version every deploy.** |
| `icon-192.png`, `icon-512.png` | PWA/home-screen icons. |
| `logo.png` | Login/menu branding. |

### Finn (character sprites — path-loaded; all required)
| Path | Why |
|---|---|
| `finn/` **(whole folder)** | `run.png`, `jump.png`, `vboost.png`, `land.png`, `dazed-after-fall.png`, `shell-fall-roll.png`. **If any is missing → old-turtle fallback.** |

### Bosses (art + intro cinematics)
| Path | Why |
|---|---|
| `bosses/` **(whole folder)** | Guardian art (`boss-0..10.*`, `trend-crab.webp`, faction art) **and** `bosses/intros/*.mp4` (boss intro cinematics, ~150 MB). All runtime-referenced. |

### Media
| Path | Why |
|---|---|
| `Market-maker-cinematic.mp4` | Opening cinematic (video-gated intro). |

### Legal (compliance — linked from the signup consent flow)
| Path | Why |
|---|---|
| `privacy.html` | Privacy Policy (required consent checkbox on signup). |
| `terms.html` | Terms + "not financial advice" disclaimer. |

### Fonts
System font stack + inline styles — **no font files to deploy** (CSP `font-src 'self'`).

### Internal — deploy ONLY if access-controlled
| Path | Why / caveat |
|---|---|
| `dashboard.html` | Founder analytics dashboard. **⚠ Currently public + no auth** — do **not** deploy publicly until it is auth-gated (see `docs/PRODUCTION_READINESS.md` §3b + migration `0009`). Recommended: exclude from the public game deploy, or gate at the edge, until locked down. |

---

## ⛔ EXCLUDE — never deploy to the public game

| Path / pattern | Category |
|---|---|
| `_old_*.zip`, `deploy.zip`, `archive/`, `_archive/`, `deploy/` | Archives / old backups |
| `ChartQuestQA/`, `load-test/` | QA tools |
| `automation/`, `supabase/` | Backend (deploys to Supabase, not the static host) |
| `agents/` | AI agents / tooling |
| `marketing/`, `website/` | Marketing site (separate deploy) |
| `content-assets/`, `content-events/`, `_video-originals/` | Content pipeline / masters |
| `*.md` (root audits, `docs/`, canon, operations) | Documentation / audit reports |
| `scripts/`, `build.js`, `*.command`, `serve_nocache.py` | Developer utilities |
| `chart-quest.min.html` | Stale obfuscated build (not shipped) |
| `lesson-chart-preview.html` | Dev harness |
| `node_modules/`, `.git/`, `.claude/`, `.DS_Store`, `*.tmp` | Tooling / VCS / temp |
| `.netlify-token`, `netlify.toml` | Secrets / Netlify-specific config (Cloudflare uses `_headers`/`_redirects`) |
| `hero.png` (root, untracked) | Unclear provenance — verify before including anything not listed above |

---

## Verification (run before calling a deploy "done")
1. On the deploy preview URL, load the game → **Finn renders (not the fallback turtle)**; `FINN_SPRITES.ready === true`.
2. Network tab: `finn/*`, `bosses/*`, `Market-maker-cinematic.mp4`, icons, `manifest.json`, `sw.js` all **200** (no 404).
3. Console clean of real errors (offline network/audio warnings are expected).
4. `privacy.html` + `terms.html` load (signup consent links work).
5. If `dashboard.html` was deployed, confirm it is **not** anonymously readable.

> Deploy-method note: Cloudflare Pages git-integration serving the repo root **automatically satisfies the INCLUDE set** (the repo contains `finn/`, `bosses/`, media). The historical risk was the *manual* `netlify-direct-deploy.command`, whose hardcoded file list **omits `finn/`** — do not use that path for production. See `CloudflareDeployment.md`.
