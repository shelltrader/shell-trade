# ChartQuest — RC Stabilization: RESULTS & RELEASE MANIFEST
**Date:** 2026-08-10 · **Current production build: 359** · **Commit:** `bdf7dd4` · **Status:** **DEPLOYED**
**Release decision: 🔴 DO NOT SHIP** — deployments verified, but P0-1 FAILED live and the Level 1 playthrough is incomplete.

## Build history this sprint
| Build | Commit | SHA256 (16) | What |
|---|---|---|---|
| 358 | `7213f15` | `a7bdb18100f56949` | The five P0 blockers |
| **359** | **`bdf7dd4`** | **`415b070ad89d7acb`** | Dead ✕ on the trade replay (CSS only) |

**Build 359 — verified live:** four-way byte-identical (source · index · website/game · `curl /game`); served `BUILD_TAG` = `build 359`; stamp `7213f152d4` @ `2026-08-10T14:27:54Z` (base commit = 358's, documented semantics); `#chartFull .uxX { z-index: 83; }` confirmed present in the served artifact; 7/7 stability samples after a ~105s deploy.

**Propagation transient recurs on every deploy:** the first sample after both 358 and 359 still returned the previous build before stabilising. A tester loading inside that ~1–2 min window gets the old build. Not a defect, but worth knowing before timing a tester announcement.

Companion to [CHARTQUEST_RC_BASELINE_2026-08-10.md](CHARTQUEST_RC_BASELINE_2026-08-10.md) (§1–§3 evidence).

---

## BUILD IDENTITY

| Field | Value |
|---|---|
| Local build | **358** |
| Local commit | `7213f15` (on `c2c9a96`) |
| Local artifact SHA256 | `a7bdb18100f56949f9b183d910a15eac9a08a2c61f1ffc9822ab19d0cd7433aa` (all three files) |
| Mirror | `chart-quest.html` == `index.html` == `website/game.html` (gate #8 sha256) |
| Ops stamp | `c2c9a9672f` @ `2026-08-10T11:49:01Z` |
| **Production build** | **358** — `a7bdb18100f56949f9b183d910a15eac9a08a2c61f1ffc9822ab19d0cd7433aa` |
| Production URL | `https://playchartquest.com/game` |
| **Production == local == both mirrors** | four-way byte-identical, verified by `curl` + `shasum` |
| Deployed | Cloudflare Pages, live ~45s after push; 12/12 consecutive samples on 358; build 357 (`e7e160d3…`) gone |
| Propagation transient | for ~45–90s the edge served a **mix** of 357 and 358 before stabilising — a tester loading in that window got the old build |
| In-page stamp | `c2c9a9672f` @ `2026-08-10T11:49:01Z` — HEAD **at ship time** (base commit), documented semantics, **not** a mismatch |

Gate: **22 pass · 0 fail · 0 warn · 1 skip** (skip = headless boot, puppeteer not installed).
Gate **#10 Protected systems unchanged: PASS** — the trading edits are display-only.

---

## P0 RESULTS

| ID | Issue | Root cause | Fix | Verification |
|---|---|---|---|---|
| **P0b** | Manual close reported as STOP LOSS | `tradeChartSVGFull:11359` collapses three-state `t.result` to `isWin`; the stop-loss string sits in the **else**. `delta` never read. A prior P0a pass fixed 3 sibling badges and missed the prose 300 lines below | Three-state headline; setup-quality verdict skipped for manual (the market never answered); colour from `resultCol`; R:R keys off `delta` | **PASS** — browser, all 4 exit paths. Manual+profit → "You closed it yourself and kept the profit", green `#16c784`, matches badge. Stop-loss/target paths byte-unchanged |
| **P0c** | Journal page + box appeared mid-trade | Nothing spawns during a trade — objects are placed ~15 candles **ahead** beforehand and **encountered** during it, while the trade actively carries Finn across that lookahead. All guards were at *placement* time; none at *experience* time | `tradeInProgress()` + 2 guards that **defer, never delete** | **PASS** — browser. Box: not broken during / broken after. Page: not collected during / collected after. Clue: does not reveal during / reveals after |
| **P0d** | Trades bypass replay/summary | (i) `replay` null when a mid-air entry left `setupSnap` unset → poller bailed silently; (ii) 12s **wall-clock** give-up vs a card sequence with hard 3s floors; (iii) replay stopped on its last frame, never reaching the summary | `candleSnap` fallback; 12s of **idle** waiting + 120s ceiling; auto-opened replay advances into its details view | **PASS** — browser. 16s busy screen → replay opened **88ms** after release (old code returned at 12000ms and never opened) |
| **P0e** | Instructional text obscured | No canonical owner. Card measured `cardW`/`cardH` as **function locals**, so `206` was a hand-derived magic number; its own `Math.min(…, H*0.44)` **capped the floor**; and the floater solver was seeded only with floaters, pushing text *into* the card, which then painted over it | Card publishes its measured rect; `qrRects` reads it, floor applied **last** + on-screen clamp; floater solver reserves the band | **PASS** — 16/16 matrix: {1-line wide, 2-line, 3-line, none} × H {844, 667, 468, 340}, uniform 8px clearance, always on screen. Old code failed H=340 (prompt 52px *inside* card) and 3-line (13px overlap) |
| **P0f** | Hidden Lost Wisdom chapter destroyed | Page undo hardcoded `placed.easy = false` while the spawner loops `['easy','hidden']` — one veto destroyed the level's hidden chapter *and* re-allowed a duplicate easy page | `wrapSpawner` passes the vetoed object; undo reverses the key actually placed | **PASS** — gate #18 green; code path is two literals only |
| **P0h** | Event chaining (page → boost → portal) | `wrapPortal` reserved at **Finn's frontier** while `spawnPortal` places half a screen ahead — 8–13 candle systematic error | Reserve the portal's **true** candle; portals are never vetoed (every caller is a one-shot `introFlow` beat with no retry, so a veto meant permanent loss). Optional content reschedules around them, per the documented priority order | **PASS** — under forced conflict all 4 L1 portals spawn **exactly once, in intended order**, no duplicates, no reordering, monotonic one-per-call growth |
| **P0g** | Fake Candle lesson missing | The Gambler's `confirm` round had no id→scene entry, so `sk` fell through to `'confirm'`, `SCENES` has no such key, and the round degraded to a bare one-liner — **the player was graded on reading a fake-out having never been shown one** | One map entry → the authored `SCENES.wait_close` | **PASS** — live L1 proof: `BOSS_CAST[1]` = THE GAMBLER, rounds `['candle','whowon','confirm','predict','error']`; `SCENES['confirm']` was `false`, `SCENES['wait_close']` exists: *"Only the CLOSE tells you who won — not the spike."* |

---

## REGRESSION MATRIX

**PASS = verified this session. NOT TESTED = not exercised; no claim made.**

### TEXT
| Item | Result |
|---|---|
| Short instructional text | **PASS** (1-line wide card, 4 viewports) |
| Long instructional text | **PASS** (3-line card, 4 viewports) |
| Multi-line text | **PASS** (2- and 3-line) |
| Lesson panel interaction | **PASS** (measured rect drives both consumers) |
| Different viewport dimensions | **PASS** (H = 844 / 667 / 468 / 340) |
| Floater-vs-card in a live frame | **NOT TESTED** — needs live gameplay |

### TRADING
| Item | Result |
|---|---|
| Manual profitable close | **PASS** |
| Manual losing close | **PASS** |
| Stop loss | **PASS** (unchanged, re-verified) |
| Target reached | **PASS** (unchanged, re-verified) |
| Replay exists on every exit path | **PASS** (fallback added; single `trade = null` site) |
| Replay survives a long card sequence | **PASS** (16s busy → opened) |
| Summary / What Did We Learn | **PASS** by construction (replay → details); **NOT TESTED** end-to-end in play |
| First trade / winning / losing trade in play | **NOT TESTED** |

### EVENTS
| Item | Result |
|---|---|
| Mystery Journal deferred during trade | **PASS** |
| Breakable Box deferred during trade | **PASS** |
| No major events during trade (full audit) | **PASS** — portals + boss gates already purged; lessons held by `eventClear`; mega candle guarded |
| Lesson portal integrity (exactly once, in order) | **PASS** |
| Event spacing after wick boost | **NOT TESTED** — needs live traversal |
| Full L1 spacing validation report | **NOT PRODUCED** — requires a live run with the `?beat` overlay |

### FLOW
| Item | Result |
|---|---|
| Fake Candle lesson present | **PASS** |
| Tutorial / movement tutorial / Level 1 / Boss / cinematic / Journal / Survey | **NOT TESTED** |
| Analytics · Founder Dashboard | **NOT TESTED** (untouched; gate #20 CQTrack in sync PASS) |

---

## PRODUCTION TEST

**PARTIAL — playthrough still outstanding.** Deployment and fingerprint are fully verified (above). Verified live on production build 358:

| Check | Result |
|---|---|
| Four-way artifact equality | **PASS** |
| Served `BUILD_TAG` = 358, 357 gone | **PASS** |
| Security headers (CSP/HSTS/XFO/XCTO/Referrer/Permissions) | **PASS** |
| **P0-1 text safe area** | **PASS** — live card rect `{x:4,y:100,w:123,h:58}`, prompt floor 166, **8px clearance**, on screen |
| Movement tutorial lockstep (build 357) | **PASS (observed)** — BOOST and DOUBLE BOOST each unlocked with their shells already on screen |
| Analytics end-to-end | **PASS** — `session_start`, `tutorial_started`, `tutorial_step_reached`, `session_end` landed in `beta_events` tagged `build:"358"` |
| P0-2 / P0-3 / P0-4 / P0-5 / Fake Candle / portals / Journal / Survey | **NOT YET REACHED** — no trade executed in production |

### Analytics hygiene
Live verification creates synthetic testers that the build-355 dev-session tag does **not** catch (`dev` = NULL). Two were created and **deleted**: `p-jydrvxwts2`, `p-7zqdtyrpmc` — 10 rows, verified 160 → 150 events, single real survey untouched, 34 distinct players intact. Any further run must have its `cq_pid` deleted the same way.

**Known gap:** the dev-session heuristic misses resized-desktop and mobile-emulated sessions. Worth hardening (post-beta backlog).

---

## REMAINING ISSUES

1. **Production still on 357** — awaiting push authorization.
2. **No live playthrough yet** — every "NOT TESTED" row above.
3. **§7 L1 spacing validation report** not produced (needs a live run).
4. **§2 fingerprint gaps (latent, documented, not fixed — out of the approved five):**
   - `website/game.html`, the file production actually serves, is byte-compared **nowhere** (`verify.js` mentions it only in a comment at :504; `cq.sh site` compares only the `build NNN` string).
   - `smoke_deploy.js` never reads the `cq-build` stamp off production (0 hits) — the loop-closure documented in `sync_ops.py:73-75` does not exist in code.
   - Two dirty worktrees on the same HEAD get an identical stamp by construction.
   - *Today the founder can verify a build with:* `curl -s https://playchartquest.com/game | grep -o "build [0-9]*" | head -1` and `curl -s … | grep -o '<meta name="cq-build"[^>]*>'`, or `window.CQOPS.build` / `?ops` in console.
5. **Deferred by decision:** S2 (starvation counter never fires for boxes/pages), S4 (boss radius claimed at `openBoss`, not gate appearance).
6. **POST-BETA BACKLOG** — see baseline §16. Not implemented, per instruction.

---

## RELEASE DECISION

# 🔴 DO NOT SHIP — *yet*

Not because a defect is known to remain, but because the Definition of Done is not met:

- ✗ Production URL has **not** been played start to finish
- ✗ Fresh-browser production test **not** run
- ✗ Production fingerprint for 358 **cannot** be verified — 358 is not deployed
- ✗ L1 event-spacing validation report **not** produced

All seven code defects are fixed and verified locally, and the gate is fully green. **The remaining work is deployment and live verification, not more fixing.**
