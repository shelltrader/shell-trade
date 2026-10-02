# Cloudflare Pages Deployment

> **✅ LIVE as of 2026-07-09 (Phase 2).** Production is served by Cloudflare Pages.
> - **Project:** `chartquest` (`chartquest.pages.dev`) · connected to `shelltrader/shell-trade`, production branch **`main`** → **auto-deploys on every push** (CD live).
> - **Production URL:** https://playchartquest.com (Universal SSL, HTTPS enforced) · tagged **`v0.1.0-beta`** (commit `1eb1218`).
> - **Redirect:** `chartquestgame.com` → **301** → `https://playchartquest.com`.
> - **`www` DOES NOT EXIST** (corrected 2026-08-05). This line previously also claimed a `www`
>   301. There is no `www.playchartquest.com` DNS record — no A, no CNAME — so nothing can
>   reach it and no redirect rule can fire:
> ```
> dig +short www.playchartquest.com A       → (empty)
> dig +short www.playchartquest.com CNAME   → (empty)
> ```
>   A visitor typing `www.` gets a DNS failure, not the site. Either add the record or stop
>   documenting the redirect — but do not assume it works because it is written down here.
>   The `www` entries in the edge-function allowlists and in `ops/cq-ops.js` are deliberately
>   KEPT: they cost nothing and mean adding the record later cannot 403 telemetry.
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
| **Build output directory** | **`website/`** | **CORRECTED 2026-08-05.** This doc previously said `/ (repo root)`, and that error hid a live security gap for the whole closed beta — see §5. |
| **Root directory** | `/` | — |
| **Node version** | n/a | Only needed if the build step is re-enabled. |

### 3. Output directory and game route
Cloudflare serves the tracked `website/` tree. `/` is its marketing landing page;
`/game` resolves to `website/game.html`, and `/play` wraps that game in a same-origin iframe.
The root `chart-quest.html` and `index.html` are development copies and must be byte-identical
to `website/game.html` before release. The root game page is not the production landing page.

Every runtime asset referenced by the game must exist and be tracked under `website/`,
including `finn/`, the eleven Guardian portraits, four flinch clips per Guardian, eleven
defeat clips, the Gambler Journal, and the four enabled Guardian intros. Creative source
files and review harnesses under `content-assets/` are not deployment assets. Run
`node scripts/verify.js`; gate 17 checks tracked deployment assets and gate 8 checks the
root source mirror. The release-control gate checks all three game copies.

Do not change the output directory to the repository root: it would serve a different
entry page and expose development material. This correction changes documentation only;
it does not alter provider configuration.

## 4. Environment variables
**None are required for the static client.** The Supabase URL and **anon key are hardcoded and intentionally public** (`SUPA_URL` / `SUPA_ANON` in `chart-quest.html`; every table is RLS-gated). Consequently:
- Cloudflare Pages env vars: **none** for the current static deploy.
- The checkout hook is client-side (`window.CQ_CHECKOUT_URL`), **not** a Cloudflare env var.
- All backend secrets (service-role key, SMTP creds, Auth redirect URLs) live in the **Supabase dashboard**, never in Cloudflare and never in the repo.

## 5. Security headers → Cloudflare `_headers`

> **⚠ CORRECTED 2026-08-05 — the live policy is [`website/_headers`](../../website/_headers).**
>
> Cloudflare Pages **ignores `netlify.toml`** and reads `_headers` **from the build output
> directory**. Because this doc said the output directory was the repo root, `_headers` was
> created there — and Cloudflare never read it. From the start of the closed beta until
> 2026-08-05 the live site sent **no CSP, no HSTS and no X-Frame-Options**:
>
> ```
> curl -sI https://playchartquest.com/game   → only `x-content-type-options: nosniff`
> ```
>
> Production serves `website/` — `/sw.js` returns `chartquest-site-v12` (website/sw.js), `/` is
> the marketing landing page, the game is `/game`. The repo-root `_headers` and `netlify.toml`
> are kept in step with `website/_headers` but neither is served.
>
> Two bugs in the block below were only found when the policy was finally applied, because an
> unapplied policy can never be falsified: `X-Frame-Options: DENY` would have broken the Play
> button (play.html iframes game.html same-origin), and `font-src 'self'` would have blocked
> every webfont (the Google Fonts stylesheet loads its files from `fonts.gstatic.com`). The
> corrected policy lives in `website/_headers`; treat the snippet below as historical.

Below is the ORIGINAL translation of the `netlify.toml` policy, kept for the record:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.coinbase.com https://api.binance.com; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
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
- [ ] `connect-src` CSP allows `*.supabase.co` + `api.coinbase.com` + `api.binance.com` (already in the
      policy above). **Coinbase is the primary live-price source** — omit it and every market silently
      falls back to its build-time anchor while the HUD still reports the price as live.
- [ ] Save/load works; a signed-in session persists.
- [ ] Run [ReleaseChecklist.md](ReleaseChecklist.md) against the preview URL.
- [ ] Keep Netlify live as the rollback until the above is green.
