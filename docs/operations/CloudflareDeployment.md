# Cloudflare Pages Deployment

> **✅ LIVE as of 2026-07-09 (Phase 2).** Production is served by Cloudflare Pages.
> - **Project:** `chartquest` (`chartquest.pages.dev`) · connected to `shelltrader/shell-trade`, production branch **`main`** → **auto-deploys on every push** (CD live).
> - **Production URL:** https://playchartquest.com (Universal SSL, HTTPS enforced) · tagged **`v0.1.0-beta`** (commit `1eb1218`).
> - **Redirect:** `chartquestgame.com` + `www` → **301** → `https://playchartquest.com` (proxied A `@`/`www` → 192.0.2.1 + Redirect Rule).
> - **Rollback:** Cloudflare Pages → Deployments → previous → *Rollback*; or redeploy tag `v0.1.0-beta`.
> - **Retired:** the manual `netlify-direct-deploy.command`. Keep Netlify up until confident, then decommission.
> - **Open follow-up:** add a `_headers` file for CSP/HSTS parity (Cloudflare ignores `netlify.toml`); see §5.

**Status:** Reference for the Cloudflare Pages setup (now executed). Documents framework, build, output, env, headers, and DNS.

---

## 1. What ChartQuest actually is (for the deploy config)
- **Framework:** **None.** It is a static site: one self-contained HTML/JS/CSS game (`chart-quest.html` → served as `index.html`) plus static asset folders. No React/Vite/Next, no server runtime.
- **Backend:** Supabase (auth + Postgres + Edge Functions) — hosted at Supabase, **not** on Cloudflare. The client talks to it over HTTPS/WSS.

## 2. Build settings (Cloudflare Pages → project settings)
| Setting | Value | Notes |
|---|---|---|
| **Framework preset** | `None` | Static. |
| **Build command** | *(empty)* | No build step today. `build.js` (obfuscation) is **disabled**; if re-enabled it becomes `npm ci && node build.js`. |
| **Build output directory** | `/` (repo root) | Matches current behavior. See §3 caveat. |
| **Root directory** | `/` | — |
| **Node version** | n/a | Only needed if the build step is re-enabled. |

### 3. Output directory — the one thing to get right
The game loads assets by **relative path**, and **falls back to the old procedural turtle if `finn/` is missing** (`FINN_SPRITES.ready` gate). Whatever Cloudflare serves as the output **must include**:

```
index.html  chart-quest.html  sw.js  manifest.json
icon-192.png  icon-512.png  logo.png
finn/        ← REQUIRED. Its omission ships the old-turtle regression.
bosses/      (webp art + intro mp4s the game references)
+ any top-level media referenced in chart-quest.html (e.g. Market-maker-cinematic.mp4)
```

- Serving the whole repo root (`/`) is the simplest and matches current Netlify config, but it also exposes `dashboard.html`, dev harnesses, and audit docs. Two safe options:
  1. **Short term:** serve root, but gate non-product paths with `_redirects` (below) and put `dashboard.html` behind auth (already a tracked launch task).
  2. **Target:** add a tiny assembly step that copies only the runtime set into `dist/`, and set output dir to `dist/`. Documented as Phase-Two; not required for beta.

## 4. Environment variables
**None are required for the static client.** The Supabase URL and **anon key are hardcoded and intentionally public** (`SUPA_URL` / `SUPA_ANON` in `chart-quest.html`; every table is RLS-gated). Consequently:
- Cloudflare Pages env vars: **none** for the current static deploy.
- The checkout hook is client-side (`window.CQ_CHECKOUT_URL`), **not** a Cloudflare env var.
- All backend secrets (service-role key, SMTP creds, Auth redirect URLs) live in the **Supabase dashboard**, never in Cloudflare and never in the repo.

## 5. Security headers → Cloudflare `_headers`
Cloudflare Pages **ignores `netlify.toml`**; it reads a `_headers` file in the output root. Below is the exact translation of the current `netlify.toml` policy. **Create this only at cutover** (Netlify also reads `_headers`, so adding it now could change current behavior):

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.binance.com; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

## 6. Redirects → Cloudflare `_redirects`
```
# keep dev/preview artifacts off the public site
/preview-*   /404.html   404
# (HTTP→HTTPS is automatic on Cloudflare — no explicit rule needed)
```
Add a real `404.html` to the output (there isn't one today; the redirect target must exist).

## 7. Deploy method — pick ONE (recommend A)
- **A. Git integration (recommended).** Connect the GitHub repo to a Cloudflare Pages project. Production branch = `main` (or `beta` for a separate beta URL). Every push builds a deployment; **rollback = one click** in the Deployments tab. This finally ties "what's live" to a git commit — the #1 gap today.
- **B. Direct upload via Wrangler.** `npx wrangler pages deploy <output-dir> --project-name chartquest`. Mirrors the current manual model but at least reproducible; still not git-linked.

## 8. DNS / custom domain
1. Pages project → **Custom domains** → add the production domain.
2. If the domain is already on Cloudflare, add a `CNAME` (or the auto-suggested record) → verify.
3. Keep the existing Netlify site up until the Cloudflare deployment is verified, then switch DNS. Do **not** tear down Netlify until Cloudflare is confirmed serving the correct build (Finn renders, auth works, save works).

## 9. Service worker & caching
`sw.js` caches aggressively. On each production deploy, **bump the SW cache version** so returning users don't get a stale build. Verify on the live URL in a fresh/incognito session and again after a reload (SW second-load path).

## 10. Pre-cutover checklist (do all before switching DNS)
- [ ] Cloudflare Pages preview URL loads the game; **Finn renders (not the fallback turtle)**.
- [ ] `finn/`, `bosses/`, top-level media all 200 (check Network tab — no 404s).
- [ ] `_headers` present → CSP/HSTS/X-Frame-Options verified on a response.
- [ ] Supabase auth works from the Cloudflare domain (add the domain to Supabase **Auth → URL Configuration**).
- [ ] `connect-src` CSP allows `*.supabase.co` + `api.binance.com` (already in the policy above).
- [ ] Save/load works; a signed-in session persists.
- [ ] Run [ReleaseChecklist.md](ReleaseChecklist.md) against the preview URL.
- [ ] Keep Netlify live as the rollback until the above is green.
