# ChartQuest — Deployment Plan (website-only, beta)

**Date:** 2026-07-10 · **Target:** `https://playchartquest.com` (Cloudflare Pages project `chartquest`)
**Nothing here has been committed.** Run it deliberately.

---

## ⚠️ Read this first: a second session is editing the game *right now*

`chart-quest.html` was last written at **19:12:53**, after my edits, and four new
`FINN_*` design docs appeared between 18:48 and 19:18. Its `BUILD_TAG` reads:

> `build 260 — FINN RENDERER V3 (P0) behind FINN_V3 flag, DEFAULT OFF (?v3=1 to A/B) … Render-only; FINN_V3=false restores 259 exactly`

**The game source of truth is mid-refactor.** It must not be deployed, and it must not be
mirrored, until that session lands. Everything below is designed so that can't happen by accident.

### The three-state problem

| File | State | Deploy? |
|---|---|---|
| `chart-quest.html` | source of truth · 498 changed lines = old WIP + my cinematic fix + **live FINN_V3 work** | ❌ never, right now |
| `index.html` (repo root) | older mirror · 245 changed lines | ❌ not served anyway (output dir is `website/`) |
| `website/game.html` | older mirror · 245 changed lines · **lives inside the deploy folder** | ❌ **this is the trap** |

`index.html` and `website/game.html` are still byte-identical to each other; `chart-quest.html`
has diverged by 13,146 bytes.

### The landmine

The 245-line WIP in those mirrors references **`hero.png` four times**, and both `hero.png` and
`website/hero.png` (2.97 MB each) are **untracked**. Committing `website/game.html` without them
ships a game that 404s on `hero.png`. Per `finn-official-sprites`, a missing sprite silently
falls back to the old procedural turtle — the exact regression the founder just had removed.

`scripts/verify.js` guards `finn/run.png` and the deprecated PNGs. **It does not guard
`hero.png`.** The gate would pass and production would still break.

---

## What ships

Exactly these paths. Nothing else.

```
website/index.html
website/play.html
website/sw.js
website/manifest.webmanifest
website/offline.html
website/robots.txt
website/sitemap.xml
website/bosses.html
website/courses.html
website/assets/site.js
website/assets/og-cover.jpg
website/assets/pwa/            (23 files, 123 KB)
scripts/make_pwa_assets.py     (not served; regenerates the above)
```

**Explicitly NOT shipped:** `website/game.html`, `chart-quest.html`, root `index.html`,
`dashboard.html`, `scripts/verify.js`, `ChartQuestQA/**`, `.claude/launch.json`, `hero.png`,
`website/hero.png`, and the ~30 untracked `.md` design docs.

Production keeps serving the **committed** `website/game.html` — the same build it serves today.
The game is untouched by this release.

---

## Procedure

### 1 · Branch from the deployed tip

```bash
git fetch origin
git switch -c site/beta-hardening origin/main     # origin/main == 42afc77
```

### 2 · Stage explicit paths only — never `git add website/`

`git add website/` would sweep in `website/game.html`. Use the list:

```bash
git add \
  website/index.html website/play.html website/sw.js website/manifest.webmanifest \
  website/offline.html website/robots.txt website/sitemap.xml \
  website/bosses.html website/courses.html \
  website/assets/site.js website/assets/og-cover.jpg website/assets/pwa \
  scripts/make_pwa_assets.py
```

### 3 · Verify the staged set before committing

```bash
git diff --cached --name-only          # must match the list above, exactly
git diff --cached --name-only | grep -E 'game\.html|chart-quest|dashboard|verify\.js' && echo "STOP"
```

If that grep prints anything, **stop** — a game file is staged.

### 4 · Commit

```bash
git commit -m "feat(site): beta hardening — mobile menu, PWA install, fullscreen, SEO"
```

### 5 · Preview first, always

```bash
git push -u origin site/beta-hardening
# -> https://site-beta-hardening.chartquest.pages.dev   (~60s)
```

Run `REAL_DEVICE_TEST_MATRIX.md` against that URL. Do not skip.

### 6 · Promote

```bash
git push origin site/beta-hardening:main      # fast-forward; ~60s to production
```

No checkout needed — the working tree (full of the other session's game work) is never touched.

### 7 · Post-deploy smoke (60 seconds)

```bash
curl -s https://playchartquest.com/ | grep -c 'og:image" content="https://'   # 1
curl -sI https://playchartquest.com/robots.txt | grep -i content-type          # text/plain
curl -s https://playchartquest.com/sw.js | grep -o 'chartquest-site-v[0-9]*'   # v6
curl -s -o /dev/null -w '%{http_code}\n' -L https://playchartquest.com/play    # 200
curl -s -o /dev/null -w '%{http_code}\n' https://playchartquest.com/assets/pwa/icon-512.png  # 200
```

---

## Rollback

1. **Fastest:** Cloudflare → `chartquest` → Deployments → Rollback (atomic, all assets).
2. **Git:** `git push origin 42afc77:main --force-with-lease`

Last-good production commit: **`42afc77`**.

**Service-worker caveat on rollback:** this release bumps the cache to `chartquest-site-v6`.
Rolling back to `v5` re-activates the old SW, which deletes every cache whose key ≠ `v5`. That
is safe (assets are re-fetched), but the *first* load after a rollback will be uncached.
Navigations are never intercepted while online, so no page can get stuck.

---

## Follow-up: how to land the game changes later

The cinematic subtitle fix is in `chart-quest.html` and therefore **not in this release**. To ship it:

1. Wait for the FINN_V3 session to land or park its work.
2. Track `hero.png` + `website/hero.png` (or revert the `drawHeroFinn` WIP).
3. Add a `hero.png` existence check to `scripts/verify.js` (it currently has none).
4. Apply `patches/dpr-cap-main-canvas.patch`.
5. `scripts/cq.sh ship` → mirror → verify → site → tag.
6. Preview, run the device matrix, then promote.

That is a **separate, gated game release**. Do not bundle it with the website deploy.
