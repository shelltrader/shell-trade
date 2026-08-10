# ChartQuest — Release Candidate Stabilization: BASELINE & ROOT CAUSE
**Date:** 2026-08-10 · **Status:** §1–§3 COMPLETE · §4–§13 AWAITING APPROVAL
**No gameplay code has been modified.** This document is evidence, not a change.

---

## §1 · STOP THE LINE — BUILD IDENTITY (RESOLVED)

### What production serves

| Field | Value |
|---|---|
| Production URL | `https://playchartquest.com/game` |
| SHA256 (served) | `e7e160d3a0998b77d9bfb64563da043ed723639d5984548bd079072a55d0e5a9` |
| Bytes | 2,038,702 |
| BUILD_TAG | `build 357` |
| `<meta name="cq-build">` | `f3fc77e03f` @ `2026-08-10T08:41:59Z` |
| Git HEAD | `c2c9a96` — *fix(tutorial): build 357 — movement-tutorial pacing lockstep + name the box* |
| Host | Cloudflare Pages, publishing `website/` |
| Headers verified live | CSP ✓ · HSTS ✓ · X-Frame-Options ✓ · X-Content-Type-Options ✓ · Referrer-Policy ✓ · Permissions-Policy ✓ |

### Artifact equality — VERIFIED BYTE-IDENTICAL

```
e7e160d3…e5a9  chart-quest.html      (source of truth)
e7e160d3…e5a9  index.html            (mirror)
e7e160d3…e5a9  website/game.html     (the file production actually serves)
e7e160d3…e5a9  curl https://playchartquest.com/game
```

`scripts/verify.js` → **20 pass · 0 fail · 0 warn · 3 skip · PASS**

### Entry-point audit — no duplicate game files

| URL | Result |
|---|---|
| `/` | 200, 148,215 B — marketing page |
| `/play` | 200, 17,020 B — play/beta gate |
| `/game` | 200, 2,038,702 B — **the game** |
| `/game.html` | 308 → `/game` |
| `/index.html` | 308 → `/` |

Cache posture is correct: `cache-control: public, max-age=0, must-revalidate`, `cf-cache-status: DYNAMIC`. `website/sw.js` (`chartquest-site-v14`) deliberately does **not** intercept navigations, so the game is never served stale from a service worker. **A new player opening the production URL receives build 357 normally — no hard refresh required.**

### What was actually wrong at session start (and how it resolved)

At session start the tree was in the exact failure state this sprint was called to find:

- `chart-quest.html` was `M` (uncommitted), 2,038,702 B, `build 356`
- `index.html` / `website/game.html` / production were `3780346b…`, 2,037,029 B, **also `build 356`**, **also stamped `4ef0d5ff2f`**

**Two different documents, three identical fingerprints.** `verify.js` correctly flagged it (`✗[7] BUILD_TAG incremented — current=356 head=356`, `✗[8] index.html differs`) — the gate worked; it simply had not been run.

Mid-session, a **concurrent worktree** bumped the tag to 357, ran `cq.sh ship`, committed `c2c9a96` and pushed; Cloudflare deployed it. The divergence is gone. This is corroborating evidence for a known project hazard: **this repo is edited by concurrent sessions, and the fingerprint is only made true as a side effect of one optional shell command.**

### §2 · Residual fingerprint gaps — LATENT, verified, narrow

| # | Gap | Evidence |
|---|---|---|
| F1 | **`website/game.html` — the file production actually serves — is byte-compared nowhere.** Gate #8 hashes `index.html` only. `cq.sh site` compares only the extracted `build [0-9]+` **string**. | `grep -n 'website/game.html' scripts/verify.js` → **1 hit, line 504, inside a comment** |
| F2 | **`smoke_deploy.js` never reads the deploy stamp off production.** It compares only the BUILD_TAG integer, so two builds sharing a tag are indistinguishable to it. `sync_ops.py:73-75` documents a "loop closure" that does not exist in code. | `grep -n 'cq-build' scripts/smoke_deploy.js` → **0 hits** |
| F3 | **Two dirty worktrees on the same HEAD receive an identical stamp by construction** (`sync_ops.py:77` = `git rev-parse --short=10 HEAD`). This is precisely what happened today. | observed |
| — | *Not a defect:* the stamp records HEAD **at ship time** (the base commit), so build 357's artifact carries `f3fc77e` (build 356's commit). This is documented and deliberate (`sync_ops.py:64-72`, `ops/cq-ops.js:178-181`) — a build cannot contain its own commit hash. | by design |

Gate #7 **does** enforce "the label must change when the bytes change" — `srcChanged()` (`verify.js:39`) returns true for *any* uncommitted edit, which forces the gate to run and demand a bump. It is skipped only on a clean tree, which is correct.

---

## §3 · BASELINE OF THE FIVE BLOCKERS

Every root cause below was produced by an independent investigator and then **adversarially verified** by a second agent instructed to refute it. Refuted claims are marked and excluded.

### P0-1 · Player-facing text is obscured — CONFIRMED

**Canonical owner: NONE.** Three non-communicating placement regimes exist. Two are real measured 2-D solvers — `LessonChart.solve` (`:26290`) and the Journal's `svgSolve` (`:11309`) — but both are scoped to their own private chart canvases and neither knows the game HUD exists. The live HUD uses a hand-tuned column of literals with ~4px of designed clearance.

Two independent mechanisms produce the bug:

1. **Z-order.** The floater text layer is drawn inside `drawHUD` (`:20251`), the last statement of `render()` (`:19800`). `drawPersistentTeach()` — the CURRENT LESSON card — is called *after* `render()` (`:25301/:25304/:25306`), so the near-opaque card (`rgba(9,13,20,0.96)`, `:20029`) paints **over** any floater in its band.
2. **Vertical drift.** The only anti-overlap logic is a 1-D 42px band solver (`:20256-20261`) seeded **only with other floaters in that frame**. It is blind to the card and actively pushes text *down* into it — literally the founder's "text moves vertically and becomes partially hidden."

The card's box is computed function-local (`cardW`, `cardH` at `:20025-20026`) and **never published**, so `206` is a magic number, not a measurement.

> **Verifier correction (material):** the investigator's flagship example was geometrically wrong, and the *real* worst case is the opposite of what it assumed. **Width and height trade off inversely.** The 1-line card is the dangerous one: L1's `momentum` line renders 1 line (`cardH` 41, y[100,141]) but **x[4, 289.9]** — wide enough to swallow the `+$N` payoff floater (x[158.9, 231.1]) whole. Confirmed occlusions overlapping in *both* axes at W=390: `:16056` (y155), `:16082` (y104), `:6907` (y128), `:16237` (y116).

> **Also confirmed:** `qrRects` (`:15908`) is `Math.min(Math.max(H*0.215, 206), H*0.44)`. The outer `Math.min` **caps the 206 floor**: whenever `H < 468` (landscape, or the `play.html` iframe on a short window), `by` drops to ~149 and the prompt box top lands at 105 — inside the card band. **Build 356's fix is silently defeated by its own clamp on short viewports.**

### P0-2 · Major events during an active trade — CONFIRMED, root cause is *not* spawning

**Nothing is spawned during a trade.** Both spawners already refuse while `trade` is truthy. The defect is that boxes and Lost Wisdom pages are placed **~15 candles ahead of Finn at the generation edge** (`maintainCandles`, `:6379`) *before* the trade starts — and are then **encountered** during it.

**Every trade-focus guard in the file lives at PLACEMENT time. There is no guard at EXPERIENCE time.** Worse, a live L1-3 trade *actively drags Finn forward through that exact lookahead*: he keeps walking (`:16849`) and is carried to ride the live edge (`:16856-16860`) for ~25–35 candles. The objects are not merely reachable mid-trade — **they are guaranteed to be crossed mid-trade.**

`update()` is gated on `!paused && !lessonOpen && !htfZoomState && !quickRead.active` (`:25052`) — **`trade` is deliberately absent** — so `updateBoxes` (`:17277`) and `updateWisdomPages` (`:17280`) run every frame of the position with zero trade check.

The intended pattern already exists for the other two event classes and proves the fix shape:
- Portals: purged every frame while a trade is open — `:25138 if (trade && portals.length) portals.length = 0;`
- Lesson queue: holds because `eventClear()` returns false while `trade` (`:7954`, gated `:8855`)

**Boxes and pages are the only Major Event classes without an experience-time guard.**

### P0-3 · Event spacing — CONFIRMED, but the ticket's premise was inverted

**CQBEAT is NOT observe-only.** `var MODE = 'enforce'` (`:29779`), flipped at build 338. The module's own header (`:29738-29741`) still says "PHASE 1 IS OBSERVE-ONLY … vetoes NOTHING" — **the comment is stale by 19 builds.** Gate #18 confirms `mode=enforce`.

> **Verifier correction — REJECTED CLAIM:** the investigator asserted CQBEAT "has been actively deleting placed content in production for ~19 builds." **This is fabricated severity with contrary evidence on record** (`CHARTQUEST_T-005b_…md:262-270` documents a real enforce-mode L1 run). It must not go to the founder as written.

> **Verifier correction — REJECTED CLAIM:** the "device-dependence" argument (a 15-candle gap buys a phone 6.2s and a desktop 14.5s) is **arithmetically wrong**. `W` is not `innerWidth`; the play area is a letterboxed portrait column capped at 58% of viewport height (`:3780`, `:3786`), and `candleW` is proportional to `W` (`:6342`), so **N candles is a constant fraction of screen width on every device by construction.** The proposed pixel-invariance rework is therefore largely unnecessary.

**What survives as genuinely broken (real, and worth fixing):**

| ID | Defect | Evidence |
|---|---|---|
| S1 | **Content loss.** The page undo hardcodes `_wisSpawn.placed.easy = false` while the spawner loops `['easy','hidden']`. A vetoed **hidden** page permanently deletes that level's hidden Lost Wisdom chapter *and* can duplicate the easy one. | `:30133` vs `:12318` |
| S2 | **The starvation guard cannot fire for boxes or pages** — `wrapSpawner` never touches `S.starved`. With `BOXES_PER_LEVEL=2`, this is the mechanism by which L1 can ship with fewer than 2 boxes. | `:29790`, `:29972`, `:6685` |
| S3 | **Portals reserve at the wrong place.** `wrapPortal` reserves at `currentCandleId()` (Finn's frontier) while `spawnPortal` places at `turtle.x + W*0.50`. **A systematic 8–13 candle error on every portal** — the single largest source of residual violations. | `:30005` vs `:7019` |
| S4 | `markEvent('boss')` claims its 40-candle radius when `openBoss` fires, not when the gate appears. | `:30027`, `:16064` |

CQBEAT also models events as **dimensionless points** — no trigger-zone size, no interaction footprint, no animation duration, no stopping distance. That part of the brief's requirement is genuinely unmet.

### P0-4 · Trade exit reason is not true — CONFIRMED (root cause is exact)

A real three-state exit field already exists: `tradeRecord.result` ∈ `'win' | 'loss' | 'manual'` (`:16380`). **One renderer still reduces it to two states.**

`tradeChartSVGFull` line `11359`: `const isWin = t.result === 'win'`. The "WHAT HAPPENED?" prose at `11711-11716` branches on that boolean alone, so a manual close falls into the **else** arm and prints:

> `✗ Price went DOWN and hit your Stop Loss.`

…**regardless of P&L.** `delta` is never read. It is not a win/loss inference and not an `isLong` bug — it is a two-state read of a three-state field with the stop-loss string sitting in the else.

**The same SVG contradicts itself on screen:** the badge at `:11430` reads `● CLOSED EARLY  +42 shells` in green (already fixed by the prior "EXIT TRUTHFULNESS (P0a)" pass, `:11404-11411`), while the body 250px lower reads `✗ Price went DOWN and hit your Stop Loss.` in red, followed by `Your stop kept the loss small, just like it should.` **P0a fixed three sibling sites (`:11410-11430` badge, `:11794-11796` replay header, `:9748/:9756` intermission badge) and missed the prose 300 lines down in the same function.**

> **Verifier correction:** the fix must also guard the `!isWin && goodSetup` arm (`:11728-11731`). A *losing* manual close on an A/B setup would otherwise print "Even strong setups lose sometimes — the market just didn't follow through," which is the same misattribution in the other direction: the market never got the chance.

### P0-5 · Not every trade gets replay + summary — CONFIRMED

Build 356's claim is **half-true**. Every exit path *does* reach `autoOpenTradeReplay` — `trade = null` exists in exactly one place (`:16526`), so SL, TP, manual close, the 6s press safety-net and the hour-close all funnel through it. **The call site is not the bug.**

`autoOpenTradeReplay` is a **fire-and-forget 12-second poller that treats the summary card as an obstacle to outwait rather than a stage to sequence with** — and the game forces the player to spend longer than that on the card. It gives up **silently** at `:12031` (`if (_elapsed > 12000) return;`) while holding `clear = false` for as long as a lesson card is open or queued (`:12034-12035`). Every card has a hard 3-second floor before OK is enabled (`:8906-8910`) plus a 0.6s `lessonGap` (`:8784`).

> **Verifier correction:** the 3-card / 10.45s stack is a **once-ever** event, not a general property — `teach()` carries guards at `:8706-8707` the investigator missed. **The deterministic, 100%-reproducible Level 1 defect is different and needs no race at all:** `introFlow.tradesDone` is incremented at `:16552`, *later in the same function* than the test at `:16407`. So on intro trades **2 and 3** the `!introFlow.tradesDone` test is false, control falls to `:16442`, and **no lesson card is pushed at all.**

Also confirmed: `endHour()` (`:9254-9257`) sets `session.inModal = true` **before** calling `resolveTrade('manual')`, so the guard at `:12040` blocks the replay from the very first tick — **guaranteeing a miss on every hour-close trade.**

### Fake Candle lesson — ABSENT FROM THE LIVE L1 PATH (present but orphaned)

Level 1 is driven entirely by `introFlow` (`:7090`), **not** by the `LEVEL_FLOW` sequencer — `LEVEL_FLOW` has only keys 2 and 3 (`:8744-8750`). **There is no data-driven L1 lesson list at all;** L1's order is hard-coded across three functions. That is precisely how a concept can fall out of the sequence with nothing detecting it.

L1 currently teaches exactly: `candle` (green/red) → `momentum` → `pullback`, plus one anatomy rep (`brokencandle` / "THE LIE").

Every fake-candle asset is authored and intact but has **zero callers on the L1 path**: scene `fake` (`:26065`) is mounted only for boss rounds belonging to Guardians 2, 3, 8, 10, 11 — **never Guardian 1**; scene `confirmation` (`:26187`) and practice `confirmation` (`:26541`) have **no caller anywhere in the file**; the `candle_close` text card (`:8332`) sits in `CURRICULUM[0].focus` but has **no `teach()` trigger** and is suppressed for the whole intro by `:8706`.

**Net effect for a fresh player:** the first and only time "a wick through that closes back is a fake-out" is taught in Level 1 is the intermission recap **after** the Gambler has already graded them on it (`IM_LESSONS.candle_close`, `:9440`).

> **Verifier correction:** the investigator's proposed one-line fix (mapping `confirm:'confirmation'` at `:26704`) **must not be applied** — it teaches the wrong concept; the `confirm` mini-game is "Read the Close," a different lesson. Also, Boss 1 has **two** bare-objective rounds, not one (`whowon`, `:25698`, has no scene either).

---

## §16 · POST-BETA BACKLOG (found during investigation, NOT to be fixed now)

| Sev | Issue | Evidence |
|---|---|---|
| P1 | `LEVEL_FLOW` does not own Level 1; L1 order is hard-coded across 3 sites with a 4th non-executing declaration (`CURRICULUM[0].focus`). Structural cause of the missing lesson. | `:8744`, `:7090`, `:21125`, `:16569`, `:16649` |
| P1 | Boss 1 rounds `confirm` and `whowon` degrade to a bare one-line objective — no LessonChart scene. | `:25698`, `:25717`, `:26706` |
| P2 | Four independent `BUILD_TAG` regex parsers instead of `CQOPS.build` (the stated consolidation never happened). | `:2771`, `:25329`, `:27385`, `:28750` |
| P2 | `_anyBlockingUI()` never checks `trade`; ~6 hand-rolled variants of the "is a trade in progress" predicate. | `:10333`, `:6745`, `:12258`, `:7952`, `:15888`, `:6369` |
| P2 | Stale doc-block: CQBEAT header claims observe-only while `MODE='enforce'`. | `:29738-29741` vs `:29779` |
| P3 | `result:'manual'` conflates player close with forced hour-close; `CQ.priceTouched` already computes `sl`/`tp` at `:5841-5842` and discards it. | — |

---

## STATUS

§1 build identity — **PROVEN, ALIGNED, PASSING.**
§3 baseline — **COMPLETE, ADVERSARIALLY VERIFIED.**
§4–§13 — **NOT STARTED. Awaiting founder approval (LARGE change, per `docs/canon/CLAUDE_RULES.md`).**

**Release decision: 🔴 DO NOT SHIP** — five P0 defects are confirmed present in production build 357.
