# ChartQuest — Production Deployment Verification

**Date:** 2026-08-04 · **Target:** https://playchartquest.com · **Local HEAD:** `fb0a435` · **BUILD_TAG:** build 335
**Scope:** verification only. **No gameplay was modified. No feature was implemented. No file in the game was touched.**

---

## VERDICT

**The build is NOT stale. The deploy is INCOMPLETE.**

Production serves byte-for-byte the same `chart-quest.html` you have locally — same md5, same 1,915,509 bytes,
same build 335. That part is clean, and it rules out the "testers got an old build" theory.

What your testers actually got is a **complete build with 13 media files missing**, including both cinematics
in your beta flow. One non-recursive `cp` in `scripts/cq.sh:40` is the entire cause.

**NOT LAUNCH-READY** until the asset copy is fixed. Everything else checked out.

---

## 1 · BUILD — **PASS**

| Check | Local | Production | Result |
|---|---|---|---|
| md5 of game document | `a4380ec7e3c19a8e437277413922e4dd` | `a4380ec7e3c19a8e437277413922e4dd` | **PASS — byte-identical** |
| Size | 1,915,509 b | 1,915,509 b | **PASS** |
| BUILD_TAG | `build 335` | `build 335` | **PASS** |
| HEAD commit | `fb0a435` (2026-08-04 22:24 +07) | n/a | working tree clean |
| 3 canonical copies | `chart-quest.html` == `index.html` == `website/game.html` | — | **PASS — all 3 identical** |
| Inlined CQTrack vs canonical | `sync_track.py --check` | — | **PASS — in sync** |
| Deployment timestamp | — | `date: Tue, 04 Aug 2026 16:24:52 GMT`, `cf-ray a25eea2bba89a9f9-BKK` | served live |

Production is serving the current repository. **No stale build.**

---

## 2 · WEBSITE — **PASS**

Every deployed page is byte-identical to its local source:

| Path | Production md5 | Local file | Result |
|---|---|---|---|
| `/` | `dcb1dbfdf7501aedec3de8ca6f3a790e` | `website/index.html` | **PASS** |
| `/play` | `3e6b62e0e277e679f978b037a430a3aa` | `website/play.html` | **PASS** |
| `/survey` | `744d67935da84710791226b1d26b90ae` | `website/survey.html` | **PASS** |

- Landing page renders correctly (hero, nav, both Play CTAs). **PASS**
- **Play Free launches correctly** — `/play` → `game.html` iframe. **PASS**
- **Correct build loads:** in-frame `BUILD_TAG` = build 335; `window.CQ` and `window.CQBeta` both initialise,
  proving the MAIN script block executed to completion on production. **PASS**

---

## 3 · BETA FLOW — **PASS through Level 1 · NOT PLAYED beyond**

I drove the real production build in a browser. I must be straight with you about method: **the browser pane
reported `visibilityState: hidden`, so `requestAnimationFrame` never fired and the world was frozen.** That is
my harness, not your game. I worked around it with the project's documented frame-pump technique (and the
purpose-built `HomeMarketCeremony._tick(dt)` hook), driving a patched virtual clock through `frame()`.

| Step | Result | Evidence |
|---|---|---|
| Landing | **PASS** | renders; CTA navigates to `/play` |
| Intro cinematic | **PASS** | `introCine.active=true`, advanced to phase `marketmaker`; ENTER triggered the descend and handed off |
| Movement tutorial | **PASS** | `bcJourney.active=true` (Blockchain Journey), ran to completion, Finn moving (x 254→302) |
| Home Market Ceremony | **PASS** | 8 markets render; full timeline `chosen → welcome → celebrate → dive`; `cq_faction=BTC`; DOM torn down cleanly |
| Level 1 | **PASS** | world live (140 candles generating), `body.preFirstTrade preNotebook` gating correct |
| First trade | **NOT PLAYED** | Finn wall-blocked on candle terrain; needs jump input the harness could not sustain |
| Boss 1 | **NOT PLAYED** | — |
| Boss defeat / Journal unlock | **FAIL (cinematics)** — see §4 | tested directly, not by play |
| Journal Discovery | **NOT PLAYED** | — |
| Survey / Thank-you | **NOT PLAYED** | page serves correctly (§2); write path proven by existing rows (§6) |

**"Every step appears exactly once" — NOT VERIFIED.** That requires the uninterrupted playthrough I could not
complete. Note the Gate-B runs already in `beta_events` exercised the full chain on build 334/335 without
duplicate milestones.

Correct behaviour worth recording: the Home Market Ceremony copy reads *"This changes the look of your charts
only. Every market teaches the exact same trading skills."* — Home Market Philosophy intact.

---

## 4 · CINEMATICS — **1 PASS · 3 FAIL**

| Cinematic | Asset | Production response | Result |
|---|---|---|---|
| **Intro (Market Maker)** | `Market-maker-cinematic.mp4` | `200 · video/mp4 · 12,243,957 b` | **PASS** — loads clean: `readyState 4`, `duration 32.1s`, no error |
| **Boss introduction** | `bosses/intros/boss-1.mp4` | `200 · text/html · 148,215 b` | **FAIL** |
| **Boss defeat** | `bosses/outros/boss-1-defeat.mp4` | `200 · text/html · 148,215 b` | **FAIL** |
| **Trading Journal unlock** | `bosses/outros/finn-journal.mp4` | `200 · text/html · 148,215 b` | **FAIL** |
| Journal Discovery | DOM quest, no video | — | not played |
| Beta completion screen | DOM ceremony, no video | — | not played |

### Live proof on the deployed build

I invoked `playBossOutroCinematic(1, cb)` on production and watched the `<video>` elements:

```
before   v1 src=-                err=-  net=0 rs=0
t0       v1 src=finn-journal.mp4 err=4  net=3 rs=0     ← MEDIA_ERR_SRC_NOT_SUPPORTED
outroDone: true                                        ← callback fired immediately
```

`boss-1-defeat.mp4` failed so fast it had already advanced to the second clip inside the first 700 ms sample.
Both clips error, the sequence completes instantly, and the player is handed to the ceremony **having seen no
video at all**. `vid.onerror = playNext` (`chart-quest.html:13620`) is doing exactly its job — it guarantees a
missing clip can never block a reward, which is precisely why this has been silent.

**Your Boss Defeat Cinematic and Trading Journal Unlock Cinematic — two named steps of the beta flow — do not
play for any external tester.** The files are fine locally (`boss-1-defeat.mp4` 3.27 MB, `finn-journal.mp4`
3.59 MB); they were never deployed.

---

## 5 · ASSETS — **13 FAIL**

Every asset path referenced by the game, probed against production. **No silent fallbacks accepted: a `200`
carrying `text/html` is counted as a failure.**

### FAIL — 13 media files return the landing page (`200 · text/html · 148,215 b`)

```
bosses/flinches/boss-1-flinch-1.mp4     bosses/intros/boss-1.mp4
bosses/flinches/boss-1-flinch-2.mp4     bosses/intros/boss-2.mp4
bosses/flinches/boss-1-flinch-3.mp4     bosses/intros/boss-3.mp4
bosses/flinches/boss-1-flinch-4.mp4     bosses/intros/boss-11.mp4
bosses/outros/boss-1-defeat.mp4         bosses/sfx/boss-roar-1.m4a
bosses/outros/finn-journal.mp4          bosses/sfx/boss-roar-2.m4a
                                        bosses/sfx/boss-roar-3.m4a
```

**All Guardian-1 media is in that list** — the only boss a closed-beta tester reaches.

### FAIL — 1 broken reference

- `manifest.json` → `200 · text/html`. `website/game.html:18` links absolute `/manifest.json`, which does not
  exist under `website/` (the site pages correctly link `manifest.webmanifest`, which **does** serve:
  `200 · application/manifest+json`). PWA install is broken from the game frame.

### PASS — everything else

| Group | Result |
|---|---|
| `finn/*.png` (7: run, jump, land, hero, vboost, dazed-after-fall, shell-fall-roll) | **PASS** — all `image/png` |
| `bosses/boss-1..11.webp` (11 portraits) | **PASS** — all `image/webp` |
| `Market-maker-cinematic.mp4` | **PASS** — `video/mp4`, 12.2 MB |
| `icon-192.png`, `icon-512.png`, `logo-512.jpg/webp`, `journal-book.webp`, `mm-poster.jpg` | **PASS** |
| `sw.js`, `manifest.webmanifest`, `robots.txt`, `sitemap.xml` | **PASS** |

*False positive excluded:* `bosses/trend-crab.webp` appears only inside a comment (`chart-quest.html:12846`) —
not a runtime reference, not a defect.

### ROOT CAUSE — one missing `-r`

```sh
scripts/cq.sh:40      cp -f bosses/*.webp website/bosses/     # non-recursive, .webp only
```

`bosses/` has four subfolders — `flinches/ intros/ outros/ sfx/`. `website/bosses/` has **12 files and zero
subdirectories**. The portraits copy because they are `.webp` at the top level; nothing else ever does.

**Why it stayed invisible for ~20 builds — three compounding causes:**
1. **No `404.html`.** Cloudflare answers every missing path with the 148 KB landing page at HTTP **200**, so
   the asset looks present to any check that only reads a status code.
2. **The video path is defensive by design** (`onerror → playNext`), so a missing clip is skipped in silence.
3. **You cannot reproduce it locally.** `cq.sh serve` and the LAN QR serve the **repo root**, where every file
   exists. It breaks only on the deployed site — which is exactly why a founder playtest would never catch it.

---

## 6 · ANALYTICS — **PASS**

I tagged my run `player_id = VERIFY-335-DEPLOY` so every row is identifiable and removable. Rows landed live:

| ts (UTC) | player_id | event | page | build |
|---|---|---|---|---|
| 16:26:52 | `VERIFY-335-DEPLOY` | `session_end` | index | `""` |
| 16:26:52 | `VERIFY-335-DEPLOY` | `session_start` | play | `null` |
| 16:26:53 | `VERIFY-335-DEPLOY` | `tutorial_started` | — | **335** |

- **Events fire correctly on production.** **PASS**
- **Build attribution works** — `tutorial_started` carries `build: 335`. **PASS**
- **Observation (minor):** the `build` prop is populated only on rows emitted from the *game* document.
  Wrapper-page rows (`index`, `play`) send `null` / `""`. Not a regression — the build-333 fix is game-side —
  but a report grouping by build will silently drop wrapper rows.

**Survey submissions:** the survey page serves byte-identical to source and posts to `beta-ingest`. The write
path is already proven in production — `beta_surveys` holds **2 rows**, and every funnel event the certification
listed as "zero rows ever" (`boss_started`, `boss_defeated`, `journal_unlocked`, `journal_discovery_started`,
`journal_discovery_completed`, `tutorial_completed`, `first_trade_lost`) has now fired. **Gate B is satisfied.**
I did **not** submit a test survey — injecting fake qualitative answers into your research dataset costs more
than the marginal verification is worth.

**Founder Dashboard:** `scripts/founder_report.py` reads these tables directly and they are populated. Not
executed in this pass.

---

## 7 · CLOUDFLARE DEPLOYMENT — **directory identified · 2 issues**

**Cloudflare serves `website/`, not the repo root.** Confirmed two independent ways:
1. The live `<title>` is `ChartQuest — The World's First Trading RPG`, which matches `website/index.html:6`.
   Root `index.html` has `<title>ChartQuest</title>`.
2. `/sw.js` serves **4,309 bytes** — exactly `website/sw.js`. Root `sw.js` is 2,132 bytes.

This contradicts `docs/operations/CloudflareDeployment.md:24`, which documents the output directory as `/`.
**That document is wrong and should be corrected.**

Two consequences, both real:

- **No security headers.** `website/_headers` **does not exist**. Both files carrying the policy — repo-root
  `_headers` and `netlify.toml` — sit outside the served directory, and `cq.sh` never copies either. Verified
  live: the only relevant response header is `access-control-allow-origin: *`. No CSP, no HSTS, no
  X-Frame-Options. `ReleaseChecklist.md:30` lists this as a post-deploy gate, so that gate **cannot currently
  pass**. (The prior hardening report is right that copying the root file as-is would blank the game iframe —
  `frame-ancestors 'none'`. Do not do that. It needs `'self'`.)
- **No 404 handler.** Every missing path returns the landing page at 200. This is the mask that hid §5.

**Stale assets:** none found. All three canonical copies are identical and the deployed game matches local
byte-for-byte. Note `cq.sh site` only ever copies and never prunes, so `website/` can only accumulate — it
cannot serve an older game build.

---

## 8 · CACHES — **PASS**

| Path | cache-control | cf-cache-status |
|---|---|---|
| `/` | `public, max-age=0, must-revalidate` | DYNAMIC |
| `/game` | `public, max-age=0, must-revalidate` | DYNAMIC |
| `/play` | `public, max-age=0, must-revalidate` | DYNAMIC |
| `/survey` | `public, max-age=0, must-revalidate` | DYNAMIC |
| `/assets/cq-track.js` | `public, max-age=14400, must-revalidate` | REVALIDATED |

- **No cache is serving an older build.** All HTML revalidates on every request; the served game md5 equals
  local right now. **PASS**
- `website/sw.js` (`chartquest-site-v12`) **deliberately does not intercept navigations**, so it cannot pin an
  old HTML build. **PASS**
- `cq-track.js` has a 4-hour TTL but `must-revalidate` and shows `REVALIDATED`. Acceptable; remember to bump
  the SW cache in the same commit as any tracker change.
- **Note, not a failure:** repo-root `sw.js` still reads `chart-quest-v325` against build 335. It is **not the
  deployed service worker** (the site serves `website/sw.js`), so it has no production effect today — but it is
  a standing canon violation (`ReleaseChecklist.md:15`) and will matter if the root is ever served.

---

## 9 · SUMMARY TABLE

| System | Verdict |
|---|---|
| Build number / BUILD_TAG / HEAD / byte identity | **PASS** |
| Landing page current | **PASS** |
| Play Free launches · correct build loads | **PASS** |
| Movement tutorial exists | **PASS** |
| Level 1 exists | **PASS** |
| Home Market Ceremony | **PASS** |
| Intro cinematic | **PASS** |
| **Boss intro cinematic** | **FAIL** |
| **Boss defeat cinematic** | **FAIL** |
| **Trading Journal unlock cinematic** | **FAIL** |
| **Boss flinch clips (4) · roar SFX (3)** | **FAIL** |
| **`manifest.json` from the game frame** | **FAIL** |
| Images (finn, boss portraits, icons, logos) | **PASS** |
| Analytics events firing | **PASS** |
| Survey page + write path | **PASS** |
| Cloudflare directory identified | **PASS** (`website/`) |
| Security headers in production | **FAIL** (absent) |
| Caches serving current build | **PASS** |
| First trade · Boss 1 · Journal Discovery · Survey (played) | **NOT VERIFIED** |
| "Every step appears exactly once" | **NOT VERIFIED** |

---

## 10 · THE FIX (not implemented — verification-only task)

One line, `scripts/cq.sh:40`:

```sh
# current — non-recursive, .webp only
cp -f bosses/*.webp website/bosses/ 2>/dev/null || true

# needed — mirror the whole tree
rsync -a --delete bosses/ website/bosses/     # or: cp -R bosses/. website/bosses/
```

Then re-run `cq.sh site`, redeploy, and re-probe the 13 URLs for a real `video/mp4` / `audio/mp4` content-type.

**Strongly recommended alongside it:** a gate that asserts every `bosses/**` path referenced in
`chart-quest.html` exists under `website/`. Without one, the next asset folder repeats this exactly — and the
200-OK fallback will hide it again. Neither change is implemented; both are yours to authorise.

---

## 11 · CLEANUP — 4 rows, your call

This verification and the earlier orientation pass wrote **4 test rows** to live `beta_events`:

```sql
-- I have NOT run this.
delete from beta_events where player_id = 'VERIFY-335-DEPLOY'
                           or session_id = 's-msev13f5-85dzj2kr';
```

I did not delete them myself — it is your dataset and deletion is irreversible.

---

## 12 · HONEST LIMITS

- **I did not complete the full playthrough.** The browser pane was not displayed, so the page was `hidden`,
  `rAF` never fired, screenshots timed out mid-run, and CSS transitions/video playback were frozen by the
  compositor. I got through the ceremony into Level 1 by pumping frames manually; Finn then wall-blocked on
  candle terrain and needed sustained jump input I could not reliably drive. Trade, boss, journal quest,
  survey and thank-you were **not played**.
- **Because of that, "every step appears exactly once" is unverified.** It is the one item on your list I
  cannot sign off, and it needs a human on a real device.
- **The cinematic verdicts do not depend on any of that.** They rest on HTTP content-type from production plus
  a direct in-browser invocation that produced `MEDIA_ERR_SRC_NOT_SUPPORTED` on the live build — stronger
  evidence than watching a screen.
- **I could not confirm visual playback of the intro cinematic**, only that the asset loads clean
  (`readyState 4`, 32.1 s, no error) and the reveal code path fires. Its `opacity:0` during my run was the
  frozen compositor, not a defect — do not chase it.
- **Not checked:** `founder_report.py` was not executed; mobile/responsive rendering was not verified; the
  three boss-2/3/11 intro clips fail identically but are outside the beta's reach.
