# T-004 — Post-deploy smoke test

**Date:** 2026-08-05 · **Commit:** `0ccf640` (pushed to `main`) · **Status:** **PASS — shipped and verified in both directions**
**Files:** `scripts/smoke_deploy.js` (new, 231 lines) · `scripts/cq.sh` (new `smoke` command)
**Game document: untouched.** No BUILD_TAG bump, no mirror change, no gameplay change.

---

## 1 · WHAT IT IS

```bash
scripts/cq.sh smoke                  # after `git push` has deployed
scripts/cq.sh smoke https://staging  # or any origin
```

The first check in this repository that looks at **production** instead of your disk.

`verify.js`, the regression checklist, `cq.sh serve` and the LAN QR all describe the machine you
are sitting at. For ~20 builds production disagreed with every one of them — each Guardian-1 clip
returned the 148 KB landing page instead of video — while the build itself was byte-perfect, so
*"is production serving the latest build?"* answered **yes** the entire time. Nothing in the
toolchain could see the gap.

### What it asserts, against the live site

| # | Assertion |
|---|---|
| 1 | 6 pages resolve as `text/html` — `/`, `/play`, `/game`, `/survey`, `/privacy`, `/terms` |
| 2 | **The served `BUILD_TAG` matches this checkout** — catches a stale or still-building deploy (the same guard `cq.sh qr` applies to the LAN preview) |
| 3 | **Every asset the game references** answers with a real media content-type **and the exact byte length of the local file** |
| 4 | `sw.js`, `manifest.webmanifest`, `robots.txt` resolve |

Exit 0 / exit 1, so it can gate a release or run in CI.

### The rule it encodes

> **A 200 is not proof. The content-type is.**

There is no `404.html`, so Cloudflare answers every missing path with the landing page at HTTP
**200**. A status-code check passes while the browser receives `text/html` where a video should be.
That is exactly how the missing cinematics stayed invisible, and it is why every asset assertion
here is a three-part test — status **and** content-type **and** byte length.

### The asset list is derived, never written down

Literal paths from the source, plus the intro clips whose path is built at runtime
(`bossIntroVideoSrc` concatenates `'bosses/intros/boss-' + level + '.mp4'`, expanded from
`BOSS_INTRO_VIDEOS`), plus the portraits and top-level media. Same principle as verify.js gate #17
and `cq.sh site`. A hand-maintained list would rot and quietly stop covering the thing that broke.
Refs that resolve to nothing locally are comment prose (`bosses/trend-crab.webp`,
`bosses/sfx/boss-roar-1..3.m4a`) — reported for visibility, never failed.

**Deliberately not wired into `ship` or `verify`.** Those are offline and pre-commit; this needs the
network and a *completed* deploy. Conflating them would either make `ship` fail without internet or
make the smoke test run before the thing it is testing exists.

---

## 2 · EVIDENCE — VERIFIED IN BOTH DIRECTIONS

**A green test that has never been shown to go red is not a test.** All three failure modes were
exercised against purpose-built servers before this shipped.

### Positive — live production
```
  ✓ all 46 checks passed
      6 pages · served build 335 · 36 assets · 3 infra
  46 pass · 0 fail                                             PASS
```

### Negative 1 — a server mimicking Cloudflare's extensionless-200 fallback
```
  ✗ served BUILD_TAG        no BUILD_TAG in the served document
  ✗ Market-maker-cinematic.mp4
        MISSING — served the landing page (200 text/html, 148040 b). There is no
        404.html, so a missing asset answers 200. Is it committed?
  … all 36 assets FAIL                                         EXIT=1
```
This is the July outage, reproduced synthetically. The tool names the cause in the message.

### Negative 2 — a stale deploy serving an old build and truncated assets
```
  ✗ served BUILD_TAG
        production is serving build 300, this checkout is build 335 — the deploy is
        stale or still building
  ✗ Market-maker-cinematic.mp4
        size mismatch — production 999 b, local 12243957 b (stale or truncated)
                                                               EXIT=1
```

### The negative test paid for itself immediately

It caught a **real bug in the first draft**: the BUILD_TAG fetch hardcoded `https.get`, so pointing
the tool at any `http` origin — a staging server, or the local test harness — threw
`ERR_INVALID_PROTOCOL` and crashed instead of reporting. `probe()` had handled this correctly; the
body-fetch path had not. Now factored into one `fetchBody()` that picks the client by the URL's own
protocol and follows redirects.

Had I only run it against production, it would have shipped green and broken the first time anyone
used it on staging.

### No collateral damage
Regression gate still **15 pass · 0 fail · 0 warn**. `git status` shows only the pre-existing
`D website/bosses/boss-0.webp`, untouched.

---

## 3 · THE RELEASE PATH NOW

```bash
scripts/cq.sh ship        # mirror → site → verify   (local, offline, pre-commit)
git add <explicit paths> && git commit && git push
scripts/cq.sh smoke       # ← NEW: assert production actually received it
```

That last line is the one that has never existed. It is the difference between "I shipped it" and
"a tester can load it".

---

## 4 · LIMITS — what this still does not prove

- **It does not play the game.** It proves a byte is reachable with the right type and length, not
  that a cinematic renders, a trade resolves, or a boss can be beaten. Those still need a human on
  a real device.
- **It only covers `bosses/`, `finn/`, top-level media and 3 infra files.** Not `website/assets/*`
  (site CSS/JS), not the survey's POST path, not the edge functions.
- **It cannot detect a *correct-looking but wrong* asset** — right type, right size, wrong content.
  A content hash would close that; `content-length` is the cheap 95%.
- **It does not check security headers.** Production still serves no CSP/HSTS/X-Frame-Options
  (`website/_headers` does not exist). Adding that assertion now would fail on day one by design,
  so it belongs with the fix, not before it.
- **It will not catch the next class of silent failure**, only this one. The 200-OK fallback that
  made this possible is still there — **a `404.html` remains the actual root fix**, and it is not
  done.

---

## 5 · FOUNDER REVIEW — what still bothers me

The tool is honest and it works, but I want to be clear about what it is: **a detector bolted on
downstream of a defect nobody has fixed.** The reason a missing file looks like a success is that
`404.html` does not exist. Until it does, every check in this project has to carry the phrase "a
200 is not proof" as folklore — I have now written that sentence into three separate files. One
static `404.html` would make it stop being true.

Second, the honest limit on all of this: I have still never played the beta end-to-end on
production. Across this session I verified the build byte-for-byte, probed every asset, proved the
cinematic failure with a live media error, fixed it, and confirmed the fix live — and none of that
tells you whether the first trade *feels* right or whether every step appears exactly once. The
one thing on the original verification list I could not sign off is still unsigned.

Third: this now runs only when someone remembers to type it. That is better than nothing and worse
than a deploy hook. Wiring it to run automatically after a Cloudflare deploy is the obvious next
step and is **not started**.
