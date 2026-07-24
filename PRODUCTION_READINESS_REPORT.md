# ChartQuest — Production Readiness Report

**Date:** 2026-07-10 · **Scope:** first public beta of `https://playchartquest.com`
**Verdict:** **The website is ready to ship to a preview URL today.** The *game* is not, and
that is the single most important finding in this document.

---

## The one-line summary

> The website changes are safe, isolated, and deployable.
> **The game files are mid-refactor by another session and carry an untracked-asset landmine.**
> Deploy the website. Do not touch the game.

---

## 1 · The finding that changes the plan

`chart-quest.html` was last written at **19:12:53** — after my own edits — and four new
`FINN_*` architecture docs appeared between 18:48 and 19:18. Its build tag reads:

> `build 260 — FINN RENDERER V3 (P0) behind FINN_V3 flag, DEFAULT OFF (?v3=1 to A/B) … Render-only; FINN_V3=false restores 259 exactly`

A second session is actively refactoring the Finn renderer, touching `drawFinnSprite`,
`commitTrade` and `resolveTrade`. Two mitigating facts: the new renderer is **flag-gated and
default OFF**, and the author states `FINN_V3=false` restores build 259 exactly.

**But there is a second, worse problem.** The older 245-line WIP that sits in *both* deployed
mirrors (`index.html`, `website/game.html`) references **`hero.png` four times**, and:

- `hero.png` and `website/hero.png` (2.97 MB each) are **untracked**
- `scripts/verify.js` guards `finn/run.png` and the deprecated PNGs — **it does not guard `hero.png`**

So a game deploy would **pass the gate and still 404 in production**, and per the Finn canon a
missing sprite silently falls back to the **old procedural turtle** — the exact regression the
founder just had removed. This is a P0 for any game release and a non-issue for the website
release, provided `website/game.html` is never staged.

---

## 2 · What is safe to deploy

Twelve website paths plus a build script. `website/game.html` lives *inside* the deploy folder
and must be excluded by name — `git add website/` is the trap. Full procedure in
`DEPLOYMENT_PLAN.md`.

Production continues to serve the **committed** `website/game.html`, i.e. the same game it
serves right now. The game is untouched.

---

## 3 · What changed since the mobile audit

| Area | Change | Why it reduces launch risk |
|---|---|---|
| **`og:image` was a relative path** | absolute URL + a purpose-built 1200×630 card (`assets/og-cover.jpg`) | Facebook, Discord, X and iMessage **reject relative `og:image`**. Every link shared from TikTok/IG/Discord — this launch's entire traffic source — would have rendered with **no preview image**. Highest-leverage conversion fix in this pass. |
| **`/robots.txt` returned HTML** | real `robots.txt` + `sitemap.xml` | Cloudflare's not-found handler returns `index.html` with a **200** for any missing path. Crawlers were being served the landing page as robots.txt. |
| **No canonical / og:url** | added, absolute | Prevents `*.pages.dev` preview URLs from being indexed as duplicates. |
| **First-launch welcome** | one-time card | Priority 5. Fires on `appinstalled` (Chromium) **or** first standalone cold start — because **iOS fires no install event at all**, so that cold start is the only hook we get on iPhone. |
| **Welcome vs sticky CTA collision** | `body.cq-welcome-on` stands the CTA down | Both were `position:fixed; left:12; right:12; bottom:12` — an identical box. Caught by measurement, not by eye. |

---

## 4 · Regression review — every modified file

### Shipping

| File | Risk | Notes |
|---|---|---|
| `website/index.html` | **Low** | Largest diff. Menu, install, welcome, tap targets, landscape, SEO meta. Desktop nav guarded by `min-width:641px`. JS syntax-checked; no console errors. |
| `website/play.html` | **Medium** | Fullscreen branches per platform. The iOS path (open install sheet) and the standalone path (hide button) **cannot be verified in emulation**. Worst case is the status quo: the button does nothing. |
| `website/sw.js` | **Medium** | Cache v5→v6. Offline fallback intercepts navigations **only when `!navigator.onLine`**, so the clean-URL 308 redirect path — which once broke Play with `ERR_FAILED` — is untouched while online. |
| `website/manifest.webmanifest` | **Low, one caveat** | Adding `"id": "/"` and changing `start_url` from `./index.html` to `./` changes the app identity. A user who had already installed the old manifest could get a **duplicate install**. Acceptable pre-beta (installs ≈ 0); noted so it isn't a surprise. |
| `website/assets/site.js` | **Low** | Turtle sprite/helper/mounts deleted. **Verified live:** `bosses.html` and `courses.html` still inject nav + footer, brand shows "ChartQuest" + logomark, 0 turtle nodes, no `#cq-turtle`, Finn art present, console clean. |
| `website/bosses.html`, `courses.html` | **Low** | Turtle mounts → `finn-hero.png`. Still carry stale "Chart Quest" copy (P2). |
| `website/offline.html`, `robots.txt`, `sitemap.xml` | **None** | New files. |
| `website/assets/pwa/**` (23), `og-cover.jpg` | **None** | New assets; all 15 manifest paths and all 16 `<head>` refs verified to resolve. |
| `scripts/make_pwa_assets.py` | **None** | Not served. |

### Not shipping (and why)

| File | Reason |
|---|---|
| `chart-quest.html` | Live FINN_V3 refactor + my cinematic fix. Source of truth; do not mirror. |
| `index.html` (root), `website/game.html` | 245-line WIP referencing untracked `hero.png`. **`website/game.html` is the accidental-deploy trap.** |
| `dashboard.html` | Admin-only, deliberately never deployed. |
| `scripts/verify.js` | Adds TES guardrails; belongs to the game release. |
| `ChartQuestQA/**`, `.claude/launch.json`, ~30 `.md` docs | Unrelated. |

### Systems checked and clear

- **Gameplay:** no game file ships. Zero gameplay surface.
- **Login/auth:** the landing page has **no auth code at all** (the one `auth` hit is a code comment). Supabase auth lives inside the game, untouched.
- **Analytics:** see the gap below.
- **SEO:** improved (canonical, og, robots, sitemap). `robots.txt` now `Disallow: /game` — that page was never indexable anyway.
- **Deployment:** Cloudflare output dir is `website/` (verified empirically, *not* what `PHASE_2_CLOUDFLARE_DEPLOYMENT_2026-07-09.md` claims). Push to `main` → prod in ~60s.

---

## 5 · The gap nobody asked about: you cannot measure this launch

`record_site_visit` (Supabase RPC) is called from **`game.html` only**. The landing page has
**zero analytics** — I grepped; the two `analytics` hits are a `.gtag` CSS class.

So on beta day you will be able to see *"someone opened the game"* but **not**:
how many landed, what fraction scrolled to Play, what fraction installed, or which ad creative
converted. For a paid-social launch that is flying blind, and it matches the existing
`growth-audit` note: *don't send 10k paid until the in-game funnel is verified*.

**This is not a reliability risk, so I did not implement it.** But it is a launch risk.
Cheapest safe fix (~20 lines, no new dependency): a `navigator.sendBeacon` to the existing
Supabase RPC on landing, plus one on Play-click. Needs your call on the RPC contract.

**Recommendation: do this before spending money on ads. It can ship after the beta URL is live.**

---

## 6 · Ranked: what stands between you and "yes, I'd be proud"

> *Imagine 100 completely new users visit tomorrow.*

**Today the honest answer is: yes for the website, no for the whole product** — and exactly two
things cause the "no".

| Rank | Blocker | Impact on 100 new users | Smallest safe fix | When |
|---|---|---|---|---|
| **1** | **Zero real-device testing.** Everything is wired; nothing is confirmed on hardware. The iOS install + launch-screen path is the least verifiable and the most visible. | If iOS install is broken, the "premium mobile game" promise dies at the first tap | Run `REAL_DEVICE_TEST_MATRIX.md` §1 on one iPhone. **~30 minutes.** | **Before beta** |
| **2** | **Game intro fix is not shipped.** The oversized cinematic text is still live in production. | First 30 seconds of the game still look unfinished | Land the game release (see below) | **Before beta** |
| **3** | Uncapped canvas DPR on 3× phones | 2.25× fill cost → possible frame drops and heat on iPhone, the flagship device | `patches/dpr-cap-main-canvas.patch` — one line, no-op on dpr ≤ 2 | With the game release |
| **4** | No landing-page analytics | You will not know whether the beta worked | `sendBeacon` to the existing RPC | Before paid ads |
| 5 | `hero-key-art.jpg` is 834 KB with `fetchpriority="high"` | Slow LCP on 4G | AVIF/WebP `<picture>` | **Postpone** |
| 6 | 5 `backdrop-filter` layers | Possible jank on low-end Android | Drop blur on `.sticky-cta` + `.mk-bar` | **Postpone**, gate on device profiling |
| 7 | `bosses.html` / `courses.html` legacy pages, stale "Chart Quest" copy, dead `#worlds`/`#how` anchors | Only reachable by direct URL; not linked | Delete or repoint | **Postpone** |
| 8 | In-game `turtleMarkerSVG()` — a 15px procedural turtle chart marker | Tiny, functional UI | Needs an art decision | **Postpone** |
| 9 | `user-scalable=no` on `/play` (WCAG 1.4.4) | Accepted exception for canvas input; iOS ignores it anyway | — | **Accept** |

### To unblock #2 and #3 (the game release)

That release is gated on things outside this pass:

1. The FINN_V3 session lands or parks its work.
2. `hero.png` + `website/hero.png` get tracked (or the `drawHeroFinn` WIP is reverted).
3. `scripts/verify.js` gains a `hero.png` existence check — **it has none today, so the gate would pass a broken build.**
4. Apply `patches/dpr-cap-main-canvas.patch`.
5. `cq.sh ship` → preview → device matrix → promote.

---

## 7 · Recommendation

1. **Ship the website to a preview URL now.** It is isolated, verified, and reversible.
2. **Spend 30 minutes on an iPhone** with §1 of the device matrix. This is the highest-value
   half hour available before beta.
3. **Then promote the website to production.** It is a strict improvement over what is live.
4. **Treat the game as a separate release**, blocked on the FINN_V3 session and the `hero.png`
   tracking issue. Bundle the cinematic fix and the DPR patch into it.
5. **Add landing analytics before spending on ads**, not before beta.

Postpone items 5–9. None of them will be noticed by 100 new users. Items 1–3 will.
