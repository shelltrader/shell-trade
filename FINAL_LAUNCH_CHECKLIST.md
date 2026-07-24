# ChartQuest — Beta Day Launch Checklist

One page. Top to bottom. Stop at any ❌.

---

## T-minus: before you push anything

- [ ] `git fetch origin && git log --oneline -1 origin/main` → **`42afc77`** (the rollback point)
- [ ] `git status --short` → confirm the game files are still dirty and **unstaged**
- [ ] **The other session has stopped writing `chart-quest.html`** (`stat -f '%Sm' chart-quest.html`)

---

## 1 · Stage the website only

- [ ] Branch from the deployed tip: `git switch -c site/beta-hardening origin/main`
- [ ] Stage by explicit path — **never `git add website/`**
- [ ] `git diff --cached --name-only | grep -E 'game\.html|chart-quest|dashboard|verify\.js'` → **prints nothing**
- [ ] Commit

> If `website/game.html` is staged, you are about to deploy an unverified game build that
> 404s on an untracked `hero.png` and silently falls back to the old procedural turtle. **Stop.**

---

## 2 · Preview

- [ ] `git push -u origin site/beta-hardening`
- [ ] Preview live at `https://site-beta-hardening.chartquest.pages.dev` (~60s)
- [ ] Console clean · no horizontal scroll · markets chart rotates

---

## 3 · The 30 minutes that matter (one iPhone, one Android)

**iPhone Safari**
- [ ] Tap ☰ → sheet animates, page does not scroll behind, closing restores scroll
- [ ] `/play` → tap ⛶ → **install sheet opens** (must not silently do nothing)
- [ ] Add to Home Screen → icon is the candlestick mark, **not cropped**
- [ ] Launch from home screen → **no browser chrome, no white flash**
- [ ] Welcome card appears **once**; relaunch → gone
- [ ] Rotate to landscape → Play button still above the fold

**Chrome Android**
- [ ] Install button → **native prompt** with screenshots
- [ ] Accept → welcome card once → install button gone forever
- [ ] `/play` → ⛶ → real fullscreen → back button exits → label re-syncs
- [ ] Launcher icon not clipped

Full list: `REAL_DEVICE_TEST_MATRIX.md`

---

## 4 · Social preview (this is where your traffic comes from)

- [ ] Paste the preview URL into **Discord** → large card with key art
- [ ] Paste into **iMessage** → rich preview
- [ ] Facebook Sharing Debugger → 1200×630, no warnings

---

## 5 · Promote

- [ ] `git push origin site/beta-hardening:main`
- [ ] Wait ~60s

Smoke test:
```bash
curl -s  https://playchartquest.com/ | grep -c 'og:image" content="https://'    # 1
curl -sI https://playchartquest.com/robots.txt | grep -i content-type            # text/plain
curl -s  https://playchartquest.com/sw.js | grep -o 'chartquest-site-v[0-9]*'    # v6
curl -sL -o /dev/null -w '%{http_code}\n' https://playchartquest.com/play        # 200
curl -s  -o /dev/null -w '%{http_code}\n' https://playchartquest.com/assets/pwa/icon-512.png  # 200
```

- [ ] Hard-reload production on a phone that visited before → new build (SW v6 took over)
- [ ] `/play` still loads *(the clean-URL redirect guard)*

---

## 6 · Rollback (know this before you need it)

1. Cloudflare → `chartquest` → Deployments → **Rollback** (atomic)
2. or `git push origin 42afc77:main --force-with-lease`

First load after a rollback is uncached. Navigations are never intercepted while online, so no
page can get stuck.

---

## 7 · Known-and-accepted on beta day

| Thing | Status |
|---|---|
| Game intro subtitle still oversized in prod | Fixed in `chart-quest.html`, **not shipped** — game release is blocked |
| Canvas DPR uncapped on 3× phones | Patch ready: `patches/dpr-cap-main-canvas.patch` |
| No landing-page analytics | You will not be able to measure the funnel |
| `bosses.html` / `courses.html` stale copy | Unlinked; direct-URL only |
| `user-scalable=no` on `/play` | Accepted WCAG exception for the canvas |

---

## 8 · Do NOT do on beta day

- ❌ Deploy any game file (`chart-quest.html`, `index.html`, `website/game.html`)
- ❌ Run `scripts/cq.sh ship` — it mirrors the game and would sweep the FINN_V3 refactor
- ❌ `git add website/` or `git add -A`
- ❌ Spend money on ads before landing analytics exist

---

## Go / No-go

**GO** when: sections 1–5 are green, the iPhone install path works, and the Discord card renders.

**NO-GO** if: a game file is staged · the iOS ⛶ button does nothing · the home-screen icon is
cropped or shows a turtle · `/play` fails to load after the SW update.
