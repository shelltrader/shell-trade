# ChartQuest — Security Headers: shipping the CSP that never shipped

**Date:** 2026-08-05 · **Commits:** `bd46156` → `041d57a` → `0a3e021` · **Build:** 340
**Verdict:** ✅ **FIXED and ENFORCING in production**, verified live on every surface.

---

## 1. The finding

`playchartquest.com` sent **no Content-Security-Policy, no HSTS and no X-Frame-Options** for the
entire closed beta.

```
curl -sI https://playchartquest.com/game     →  x-content-type-options: nosniff   (and nothing else)
```

Not because nobody wrote a policy. `_headers` was git-tracked at the **repo root**, complete with a
CSP and a comment block explaining why it mattered. Cloudflare Pages reads `_headers` from its
**build output directory** — and that directory is `website/`, not the repo root. So Cloudflare
never read the file.

`docs/operations/CloudflareDeployment.md` §2 said the output directory was `/ (repo root)`. That
one stale line is what kept this invisible: everyone who checked believed the policy was live.

### Proof that production serves `website/`

| Evidence | Result |
|---|---|
| `curl https://playchartquest.com/sw.js` | `chartquest-site-v12` → that is `website/sw.js`. The root `sw.js` says `chart-quest-v325` and **is never served** — despite its own "bump per release" comment |
| `curl https://playchartquest.com/` | the marketing landing page (`website/index.html`), not the game |
| the game | `/game` = `website/game.html` |
| `verify.js` gate #17 | already encodes "production serves website/" |

**This is the third instance of one bug class in this project**: a correct file that never reaches
production because of *where it sits* relative to what is actually served. The other two were the
untracked `website/` assets and the boss cinematics that 404'd for ~20 builds. Every local gate was
green each time — a dev server sends no CSP at all, so this class is structurally invisible locally.

## 2. Four things wrong with the policy, none findable by reading the repo

An unapplied policy can never be falsified. Applying it revealed four problems.

### Found by reading the served files (before deploying)

**1. `X-Frame-Options: DENY` + `frame-ancestors 'none'` would have blanked the Play button.**
`play.html` embeds the game in a **same-origin** iframe (`#cqGame`, `src = game.html`). `DENY`
blocks framing even from the same origin. → `SAMEORIGIN` / `frame-ancestors 'self'`.

**2. `font-src 'self'` would have blocked every webfont.**
`game.html` loads `fonts.googleapis.com`, and *that stylesheet* then fetches the font files from
`fonts.gstatic.com` — a host that appears **nowhere in the HTML**, so grepping the source cannot
find it.

### Found only by the Report-Only round on the live site

**3. `static.cloudflareinsights.com/beacon.min.js`** — Cloudflare Web Analytics, **injected at the
edge**. It exists in no source file. No amount of grepping this repository could have found it.
Enforcing would have blocked Cloudflare's own analytics on every page.

**4. `'unsafe-eval'`** — 7 reports of *"Evaluating a string as JavaScript"*, traced to **10
`(0, eval)('market._boxMade = …')` calls in the CQBEAT block** — its documented runtime-patching
design for reaching the spawners' internal counters. Enforcing without it would have **silently
disabled CQBEAT's spawn enforcement in production** while every local gate stayed green. That is
precisely the failure mode this work exists to prevent.

## 3. Method: observe, then enforce

The same discipline CQBEAT itself used. A wrong CSP breaks the game silently and in production
only — the root file's own comments record the precedent: omit `api.coinbase.com` and every market
falls back to its build-time anchor *while the HUD still says "live"*.

| Round | Commit | What shipped | Result |
|---|---|---|---|
| 1 | `bd46156` | 5 headers enforcing + CSP **Report-Only** | 2 violations reported (beacon, `unsafe-eval`) |
| 2 | `041d57a` | allowlist corrected, still Report-Only | **zero** violations across landing → play → survey |
| 3 | `0a3e021` | renamed to `Content-Security-Policy` | enforcing, everything works |

## 4. What production sends now

```
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'
  https://cdn.jsdelivr.net https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'
  https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self'
  https://*.supabase.co wss://*.supabase.co https://api.coinbase.com https://api.binance.com
  https://cloudflareinsights.com https://*.cloudflareinsights.com; img-src 'self' data:;
  media-src 'self'; worker-src 'self'; frame-src 'self'; frame-ancestors 'self'; base-uri 'self';
  form-action 'self'; object-src 'none'
strict-transport-security: max-age=31536000
x-frame-options: SAMEORIGIN
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=(), payment=()
x-content-type-options: nosniff
```

Verified on `/game`, `/` and `/play`.

## 5. Verified live under enforcement

- Game runs **inside** `play.html`'s iframe → `CQOPS 1.0.0 · build 340 · production · health OK`
- `CQOPS.health` — all seven counters **zero**: no missing assets, no failed API requests
- `CQBEAT` — `mode: enforce`, 7 wired, **0 violations** (so the `(0, eval)` calls still work)
- Supabase SDK loaded from jsdelivr · `document.fonts.check('1em Inter')` → `true` · CQTrack session live
- **Zero console errors**
- `scripts/cq.sh smoke` — **46/46 pass**

## 6. Deliberate deviations

**HSTS ships without `includeSubDomains`.** The root file declared it; the `max-age` is kept but
that directive is a one-way door — browsers cache it for a year across every subdomain, including
ones that do not exist yet. The apex, which serves the game, is protected either way. Adding it
later is a one-line change in `website/_headers`.

**`'unsafe-eval'` is a real weakening of the policy.** It is required solely by CQBEAT's 10
`(0, eval)` calls. If those are ever replaced with direct references, the directive can be dropped.

**`'unsafe-inline'` is unavoidable.** `game.html` is one self-contained document with 18 inline
`<script>` blocks, and Cloudflare Pages cannot inject a per-response nonce into a static file.

## 7. Concurrency

Three other Claude sessions were editing this tree throughout. This change touches **no game
file** — no `chart-quest.html`, no `scripts/` — and `cq.sh ship` was deliberately **not** run,
because it rewrites `chart-quest.html`/`index.html`/`website/game.html` and would have swept in
other sessions' in-flight work. Only `node scripts/verify.js` (read-only) was used: 18 pass, 0 fail.

## 8. Still open

**A `verify.js` merge conflict, downstream of gate #19.** The CQTrack-drift branch
(`claude/exciting-swanson-0f93e7`, `e62bbe1`, gate #20) was cut from `fd7108e` — before gates #19
and #3c existed — so both sides appended at the same place in `run()`. That session is finished and
its worktree is clean; the resolution is mechanically "keep both gates".

**A gate for this bug class.** Nothing asserts that `website/_headers` exists or that its CSP names
every external origin the served HTML references. Gate #17 is the model. Without it, this can
regress exactly as silently as it arrived.

**The root `sw.js` is a trap.** It says "bump per release" and is pinned at `v325` while builds are
at 340 — because it is never served. The deployed service worker is `website/sw.js` (`v12`), whose
precache list is marketing-only and which does not intercept online navigations, so it plays no
part in game freshness.
