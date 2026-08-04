# ChartQuest — Founder Beta Certification Report

**Date:** 2026-08-04 · **Build:** 331 · **Target:** https://playchartquest.com · **Cohort:** 10–20 testers

**Method:** 8 subsystem validators → every P0/P1 independently re-verified by a second agent
instructed to refute it → dedupe and certify. **61 agents · 106 findings raised · 89 confirmed ·
17 refuted.** Refuted findings are excluded. Plus live production testing by the lead (below),
which agents could not perform.

---

## LEAD'S LIVE PRODUCTION TESTS (executed against playchartquest.com, not inferred)

| Test | Result |
|---|---|
| Journal → ceremony → Continue → survey | **PASS** — ran it live; `claimPostBoss` confirmed patched; landed on `/survey` |
| Survey required-field enforcement | **PASS** — defence-in-depth: per-step gate *and* an independent submit-time gate |
| Survey optional Q5 | **PASS** — genuinely optional |
| Survey submission + player linkage | **PASS** — row landed with correct `player_id`, all 5 answers, `seconds_taken` |
| Survey duplicate submission | **FAIL** — refresh after success allows a second submit; one player produced **two contradictory rows** (rating 7 then 2) |
| Survey draft restore after mid-survey refresh | **PARTIAL** — text restored, but the rating shows **nothing selected** while Next is enabled, so an unseen rating submits silently |
| `session_start` per journey | **FAIL** — 4 separate sessions per tester (index / play / game / survey), confirmed in production data |
| Session-length distortion | **CONFIRMED** — landing views (median 5.5s) pooled with game sessions (median 44s) |
| Desktop lag fix (build 331) | **PASS** — renderer responds instantly; previously timed out at 45s |

All lead test data was deleted from `beta_events` / `beta_surveys` after testing.

---

# FOUNDER BETA CERTIFICATION REPORT — ChartQuest Closed Beta, build 331

## 1. CERTIFICATION VERDICT

**CERTIFIED WITH CONDITIONS.**

The game is safe to put in front of 20 testers — no wall, no soft-lock, no lost progress — but the measurement layer will report two headline numbers wrong from tester #1 and half the funnel has never fired once in production, so send the invites only after ~3 hours of fixes and two verification gates below.

## 2. SUBSYSTEM SCORECARD

| Subsystem | Verdict | Why |
|---|---|---|
| Website | PASS WITH ISSUES | Links, beta honesty, responsive work and build integrity (three files byte-identical) all clean; play wrapper's 9s loader and framed home link are rough edges |
| Gameplay Flow | PASS WITH ISSUES | `finish()` idempotent, no double-ceremony, no soft-lock; the edges (Journal ✕, boss PASS, reload-before-Continue) mislabel or strand |
| Analytics | FAIL | A failed POST deletes milestones forever; 3–4 tracker instances per playthrough; no build tag on any event |
| Player Dataset | FAIL | 11 of 18 required fields trustworthy, 3 populated-but-wrong, 2 unfillable |
| Survey | PASS WITH ISSUES | Form, validation and draft handling are genuinely good; it is reachable **only** by finishers, and has never written a row in production |
| Reporting | FAIL | Funnel is six independent sets (non-monotonic), drop-off ranked by % off n=1, no way to exclude your own traffic |
| Failure Resilience | PASS WITH ISSUES | Happy path well defended; unhappy paths (offline, reload, app-kill) lose data silently |
| Regression | PASS WITH ISSUES | Builds 326–331 broke nothing in gameplay/trading/boss/journal/economy/saves; `sync_track.py --check` passes |

## 3. P0 LAUNCH BLOCKERS

**No code-level P0.** No tester hits a wall on the intended journey; the funnel percentages themselves are computed as sets of distinct `player_id` and are correct. Every "P0" raised by a validator was downgraded on independent verification, either because the damage is confined to derived report rows that are recomputable from data already stored, or because the trigger requires a URL no shipped link produces.

**Two process gates must pass before invites, though:**

- **GATE A — the invite URL must not carry `?fresh=1`.** `chart-quest.html:1647` wipes every key matching `/^(cq_|shellTrade)/`, which includes `cq_pid`. The production table already contains the signature: session `s-msdm2tm4-gtcd26qy` has its `session_start` under `p-e3lbh37cau` and its `session_end` under `p-c226qtgl1u`, 3.8s apart. Bare link = 0 of 20 affected. `?fresh` link = 20 of 20 unreadable. Your own permanent rule says every test URL uses `?fresh=1`. Check the link. (0 min)
- **GATE B — one full instrumented playthrough before invites.** `boss_started`, `boss_defeated`, `journal_unlocked`, `journal_discovery_started`, `journal_discovery_completed`, `tutorial_completed` and `first_trade_lost` have **zero rows ever** in `beta_events`, and `beta_surveys` has **zero rows ever**. Half the funnel and the entire qualitative channel are untested end-to-end. Play to the ceremony, submit the survey, assert 8 event names land plus 1 survey row. (30 min)

Reassurance on two scares that were investigated and cleared: the `beta_surveys_response_id_key` UNIQUE constraint **does exist** in production, so the survey upsert will not 500; and the build tag *is* already reaching `content_events` via the legacy ContentLog path under the same `cq_pid`, so historic build attribution is recoverable by join.

## 4. FINDINGS

### P1 — critical

| # | Finding | Player impact | Fix | Effort |
|---|---|---|---|---|
| 1 | **3–4 tracker instances per playthrough.** `cq-track.js:158-174` bumps a shared-localStorage visit counter once per *document*; loaded at `index.html:1535`, `play.html:104`, `survey.html:240` and inlined at `chart-quest.html:27358`. No frame guard exists. | 20 of 20. Report prints **New testers: 0 / Returning: 20 / Sessions: ~80**. Funnel unaffected. | Guard `startSession()` on `window.top === window`; **and** fix the report side (`props.page` is already on every row, so this is retroactively recoverable) | S |
| 2 | **A failed POST destroys the milestone forever.** `cq-track.js:119-124` splices rows out of the buffer and discards `post()`'s promise; `:135-140` writes the once-per-player key *before* the row is sent. No retry, no queue, no `online` listener — unlike ContentLog at `chart-quest.html:26011-26057`, which has all three. | Any tester with one bad mobile moment silently and permanently loses a funnel stage. Indistinguishable from a real drop-off, so it *manufactures* false findings. | Persist unconfirmed rows to localStorage keyed by `event_id`, drain on boot, add `online` listener. Cap retries (a permanent 403 must not loop). | M |
| 3 | **No build on any event.** `cq-track.js:140-145` and `beta-ingest/index.ts:74-90` have no build field; `BUILD_TAG` sits unused at `chart-quest.html:2947`. | 20 of 20, worsening daily. A Tuesday crash cannot be tied to a Tuesday build. | Put `build` **inside `props`** — `props()` passes jsonb through unchanged, so no migration and no edge-function redeploy. Patch all four row builders (`event`, `return_visit`, `session_end`, `crash`), then `sync_track.py`. | S |
| 4 | **The survey is reachable only by finishing the whole beta.** Only caller is `chart-quest.html:27892-27893`; `index.html` and `site.js` contain zero occurrences of "survey" or "feedback". | 14–17 of 20 — everyone who quits, i.e. everyone you most need to hear from — has no way to tell you anything. Maximum survivorship bias in your primary research instrument. | Footer link on `index.html` + a link in the `play.html` bar → `survey.html?early=1`. `CQBeta.openSurvey` is already exported at `chart-quest.html:28087`. | M |
| 5 | **Journal ✕ "Skip tutorial" is logged as completion.** `chart-quest.html:26724-26727` → `API.abort()` (`:27311`) → same teardown as a real finish → `:28005-28013` emits `journal_discovery_completed` **and** fires the ceremony. Button reveals after 6s of stalling on any objective. | 1–3 of 20. The one metric that answers "is the Journal quest worth finishing?" is inflated by exactly the players who rejected it. | Set `S.aborted = true` in `abort()` and branch in the CQBeta callback (do **not** test `step >= total-1` — the 180s watchdog shrinks `total`). | S |
| 6 | **Reload between the boss win and tapping Continue strands the tester.** `cq_beta_done` is written at `chart-quest.html:27979` and read nowhere; `boot()` (`:28062`) never checks `isDone()`. By then `cq_played`, `cq_bosses_v2` and `player.jtut` are all set, so neither `introComplete` nor `claimPostBoss` fires again. | 1–3 of 20. Recovery exists but costs a full Level-1 replay and another Gambler fight. Survey lost. | In `boot()`, if `isDone()`, show a small "You finished the beta — 5 quick questions →" banner calling `openSurvey()`. Exempt `devFinish`. | S |
| 7 | **Boot failures are structurally invisible.** Error listeners install inside `boot()` (`cq-track.js:283-291`), deferred to DOMContentLoaded (`:346-349`), and in the game that block is line 27,358 of 28,098. A parse-time throw — the white-screen case — is unrecordable. Zero `crash` rows in 113 events. | Unknown by construction, which is the problem. | ~6-line `<head>` snippet pushing to `window.__cqTrackQueue` (already drained at `cq-track.js:301-305`). Must live **outside** the `CQTRACK:BEGIN/END` markers or `sync_track.py --check` fails. | S |
| 8 | **Founder report funnel is six independent player-sets** (`founder_report.py:198`), never intersected, so "Kept from previous" can exceed 100%; and `:239` sorts drop-offs by **rate** with no minimum-n, then `:366` asserts *"Nothing else in this report costs more players"* — contradicting `SKILL.md:41`. | On today's data the headline priority is a 1-of-1 loss at the boss. You'd spend week one on the wrong thing. | Furthest-stage-reached per player; sort drops by absolute players lost; suppress transitions with n<5 from the headline. | M |
| 9 | **Four more report metrics print wrong numbers.** Returning vs new (`:184-185`, see #1); session length pools 4 documents with no `props.page` filter (`:188-192`) — pooled mean 17 min vs game-only 30.4 min; completion time is wall-clock repeated per session_end (`:194-196`) and **would print "0 min" today**; no test-traffic exclusion (`:94-106, :182`) while 2 of 13 live players are harness runs. | Every number in the Overview table is off, in both directions. | All four are report-side only — no client change, retroactively correct. | M |

### P2 — major

- **"PASS FOR NOW" tells a tester they beat the Guardian they gave up on.** `chart-quest.html:13355/13375` → `introComplete()` without `bossWin()`; ceremony copy at `:27847` claims "the first Guardian". Also yields `beta_completed` with no `boss_defeated`. 1–2 of 20 — the struggling ones. **S**
- **A manually- or hour-closed trade emits no outcome.** `cq-track.js:254-258` handles only `'win'`/`'loss'`; `resolveTrade('manual')` at `chart-quest.html:8358` and `:14399`. Panic-close is the single most diagnostic behaviour for trade feel and is the one outcome you can't see. Cheapest: add `props:{result:res}` — no edge redeploy. **S**
- **Survey can write duplicate rows / re-submit blank.** `survey.html:357` mints a fresh `response_id` per attempt; `:375` clears the draft but sets no done flag, so a reload shows a pristine re-submittable form. `founder_report.py:253/266/279` count rows, not players. **S**
- **Exit Point and Completion Status are not stored.** `session_end` props record the *page*, not the furthest stage (`cq-track.js:180-190`). ~6 lines to add `exit_stage` + `completed`; props is jsonb. **S**
- **Survey row carries the survey page's session_id, not the gameplay session** (`cq-track.js:322-324`) — a response can't be joined to the run it describes. **S**
- **`beta_surveys` has no device/browser/os/build** (`beta-ingest/index.ts:92-106`) — "what did mobile testers say?" needs a fragile join. Free to fix at 0 rows. **S**
- **`play.html` hides the loader at 9s unconditionally** (`:114`) and the "open in new tab" escape lives inside it; no iframe error path. **S**
- **`play.html:57` home link has no `target="_top"`** — when framed by the landing CTA it loads the whole marketing site into a ~345×460 box. One-line fix; do *not* also repoint `data-game`. **S**
- **Save-progress prompt is invisible.** `#authOverlay` is z-index 200 (`chart-quest.html:1045`); the ceremony is 9000. `promptSaveProgress` fires 800ms *after* the ceremony is up, for 100% of completers — the one designed account-conversion moment, silently behind a curtain. **M**
- **Ceremony z-index 9000 sits under the game's entire 99990–99999 overlay tier** (`chart-quest.html:27819`). Latent, not live — but this is a daily-build product. Raise to 100001. **S**
- **`survey_started` fires twice and is reported nowhere.** Add a "Survey opened" funnel stage; do **not** add it to `ONCE` — that would erase the handoff-vs-page-load distinction. **S**
- **`_headers` landmine.** The repo file is at the root, not `website/`, so production serves no CSP today. Copying it as-is into `website/` would ship `X-Frame-Options: DENY` + `frame-ancestors 'none'` and blank the game iframe for all 20 testers same-day. Do not touch before launch; when you do, use `frame-ancestors 'self'`. **S**
- **Landing weight:** 834 KB hero JPEG with no `srcset` (`index.html:1190`) + render-blocking Google Fonts (`:62-64`); and the first-play intro pulls an 11.7 MB video on a "~30s fall" assumption the same function no longer honours (`game.html:20918-20956`). 10–15 of 20 see a still poster instead. **M**
- **Shared device merges two testers into one player** — and the second person emits zero funnel events because the `cq_bt_*` flags are already set. Tell testers to use their own device. **S**
- Report keyword themes collide with trading vocabulary ("lost", "short", "red") — `founder_report.py:61-67`, bare substring match. **S**

### P3 — polish

Survey a11y (no labels on the three textareas, `←` Back button unnamed, error not a live region); `seconds_taken` resets on draft restore; no send timeout (a hung POST shows "Sending…" forever); `user-scalable=no` on `play.html:5` only; `/manifest.json` 404s and Cloudflare answers with the 145 KB landing page (`game.html:18`); ceremony music duck passes 600 ms into a seconds API (`:27985`) so the soundtrack never ducks; ceremony unreachable top in landscape (`justify-content:center` + `overflow-y:auto`); bfcache `ended` latch; `MAX_BATCH` remainder scheduled on a dying document; `cq-track.js` is runtime-cached cache-first and **not** in `sw.js` ASSETS — bump `CACHE` to v10 in the same commit as any tracker fix; `SKILL.md:17-31` hardcodes a 7-day SQL window while `--days` is free.

## 5. THE DATA QUESTION

Will 20 testers produce the learning you need? **Mostly yes on the funnel, no on retention, pacing and attribution.** Field by field:

| Required field | Status | Why |
|---|---|---|
| Unique Player ID | ✅ | `cq_pid`, shared across all four documents — *unless* the invite carries `?fresh` (Gate A) |
| First Visit Timestamp | ✅ | `min(ts)` per player |
| Device / Browser / OS / Screen | ✅ | Resolved once, `mode()` per player |
| Trade Outcome | ⚠️ | Resolvable by `min(ts)` between won/lost — but **null** for any manual or hour-boundary close |
| Boss Completion | ⚠️ | `boss_defeated` exists but has **never fired in production**; a PASS-FOR-NOW skipper is silently absent |
| Journal Discovery | ⚠️ | Never fired in production; a ✕-skipper is counted as a completer |
| Completion Status | ✅ | `beta_completed` |
| Survey Completion / Responses | ⚠️ | Sound, but only finishers can answer, and the write path is unproven |
| **Session Length** | ❌ **WRONG** | 4 documents pooled; ~30% of sessions never emit `session_end`. Prints ~17 min against a real 30.4 |
| **Return Visits** | ❌ **WRONG** | Fires on the second *page* of a first visit. 20 of 20 testers logged as returning on day one |
| **Tutorial Completion** | ❌ **WRONG** | Wired to `introComplete()` (`cq-track.js:260`), which only runs *after* the Gambler. The row means boss completion |
| Exit Point | ⚠️ | Not stored; reconstructable only at milestone+page granularity |
| Time to Finish | ❌ | Wall-clock since first-ever visit, repeated per session_end; medians to **0 min** on today's data |
| **Build Number** | ❌ **MISSING** | No column, no prop. Recoverable only by joining the legacy `content_events` path |
| **Runtime Errors** | ❌ **MISSING** | Capped at 3, no stack, and boot failures are unobservable. 0 rows in 113 events |

The dangerous class is the three **WRONG** ones: they carry confident labels and plausible values, so nothing signals to you that they are fiction. Fix items 1–3 and 9 and you get **16 of 18 clean**, with Exit Point and Runtime Errors improved but coarse. None of it needs a schema migration.

## 6. RECOMMENDED PRE-LAUNCH FIX LIST

**Must fix before invites — ~3h 15m total**

| # | Item | Effort |
|---|---|---|
| 1 | Gate A: confirm the invite URL has no `?fresh` | 0 |
| 2 | Report-side batch: game-page filter for session length, per-player dedupe of completion time, test-player exclusion with an auditable "Excluded: N" line, relabel "Tutorial completion", monotonic funnel, drop-off sorted by players lost with n≥5 floor | 60m |
| 3 | `cq-track.js`: frame guard on `startSession`, `build` into props, head-level crash snippet — one commit, then `sync_track.py`, then **bump `sw.js` CACHE to v10** | 45m |
| 4 | `flush()` durable retry + `online` listener (mirror ContentLog) | 45m |
| 5 | Journal ✕ abort flag; `isDone()` check in `CQBeta.boot()` | 20m |
| 6 | Survey: persist `response_id`, set `cq_survey_done`, short-circuit on re-entry | 15m |
| 7 | **Gate B**: full playthrough → ceremony → survey; assert 8 event names + 1 survey row | 30m |

**Fix during the beta:** feedback link for non-finishers (do this in week 1 — it is the highest-learning item on the page), PASS-FOR-NOW copy + `boss_skipped` event, `first_trade_closed` for manual/hour closes, `exit_stage` prop, ceremony z-index, save-progress prompt ordering, `play.html` loader + `target="_top"`, hero image and intro video weight, survey a11y.

**Do not touch before launch:** `_headers` (moving it as written blanks the game for everyone).

## 7. OVERALL BETA HEALTH SCORE — **60 / 100**

| Component | Score | Note |
|---|---:|---|
| Player-facing quality | 26 / 30 | No walls, no soft-locks, no lost progress; three mislabelled edges |
| Data integrity | 12 / 25 | Funnel correct; sessions/retention/build wrong, silent loss on failed POST |
| Reporting fidelity | 8 / 20 | Non-monotonic funnel, headline priority rankable off n=1, no traffic filter |
| Qualitative capture | 6 / 15 | Good form, unreachable audience, unproven write path |
| Resilience & regression | 8 / 10 | Build integrity byte-identical, game untouched by 326–331 |

## 8. LAUNCH RECOMMENDATION

**GO AFTER FIXES.** Roughly three and a quarter hours of work, of which the largest single piece touches only `founder_report.py` and cannot affect a tester. The build itself is ready — the gameplay, the gate, the ceremony and the survey form all hold up under scrutiny, and the funnel percentages are structurally correct. What is not ready is the instrument: two headline retention numbers will be wrong from the first tester, a mobile connection blip silently deletes a milestone forever, and half the funnel has never been exercised in production even once. Those numbers cannot be repaired after 20 sessions have gone through — but every one of them is a short, low-risk fix today. Do the seven items, run the two gates, then send the invites the same day.