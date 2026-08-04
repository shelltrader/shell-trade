# ChartQuest — Session Handoff: Architecture Orientation & Live Verification

**Date:** 2026-08-04 · **Build:** 335 · **HEAD:** `fb0a435` · **Working tree:** clean · **Gate:** `verify.js` 14 pass · 0 fail · 3 skip

**What this is.** The incoming-engineer orientation you asked for, plus — because three of the
findings were flagged BLOCKER/HIGH but unproven — **live verification against production and a real
browser**. Nothing in the game was modified. No code was written.

**Method.** 13 read-only agents mapped ten subsystems and audited the merge surface and staleness
(1.77 M tokens, 596 tool calls, 26 findings). I then independently re-verified the top findings
myself; every claim below marked **[verified]** I reproduced first-hand, and I separate those from
static reasoning throughout.

---

## 0 · THE THREE THINGS THAT MATTER TODAY

Everything else in this document is context. These three are live, they are confirmed, and two of
them are invisible from your machine.

### ⛔ P0-A — The Boss Defeat and Journal Unlock cinematics DO NOT EXIST in production **[verified]**

Two named steps of your own beta flow play nothing for every external tester.

```
$ curl -sI https://playchartquest.com/bosses/outros/boss-1-defeat.mp4
   200 · 148,215 bytes · text/html      ← the landing page, not a video
$ curl -sI https://playchartquest.com/bosses/outros/finn-journal.mp4
   200 · 148,215 bytes · text/html      ← "Trading Journal Unlock Cinematic"
$ curl -sI https://playchartquest.com/bosses/flinches/boss-1-flinch-1.mp4   → 200 text/html
$ curl -sI https://playchartquest.com/bosses/intros/boss-1.mp4              → 200 text/html
$ curl -sI https://playchartquest.com/bosses/sfx/boss-roar-1.m4a            → 200 text/html
$ curl -sI https://playchartquest.com/bosses/boss-1.webp
   200 · 193,424 bytes · image/webp     ← the portrait works, because it is a .webp
```

**Root cause — one missing `-r`.** `scripts/cq.sh:40` is `cp -f bosses/*.webp website/bosses/`.
Non-recursive, `.webp` only. `bosses/` has four subfolders (`flinches/ intros/ outros/ sfx/`);
`website/bosses/` has 12 files and **zero subdirectories**. Production serves `website/`
(confirmed: the live `<title>` matches `website/index.html:6`, not root `index.html`).

**Why nobody caught it.** Three failures compound:
1. There is no `404.html`, so Cloudflare answers every missing path with the 148 KB landing page at
   HTTP **200** — the asset appears to exist.
2. The video path is defensive by design: `vid.onerror = playNext` (`chart-quest.html:13620`), so a
   missing clip is skipped in silence. That safety net is exactly what hides the outage.
3. **You cannot see it locally.** `cq.sh serve` and the LAN QR both serve the repo root, where all
   the files are present. It only breaks on the deployed site.

**Blast radius:** all level-1 media — the only boss a closed-beta tester reaches. Local files are
real and fine (`boss-1-defeat.mp4` 3.27 MB, `finn-journal.mp4` 3.59 MB). Builds 316–324 shipped
this art; externally it has never played.

### ⛔ P0-B — `?dev` / `?guest` on a first-play profile is a hard white-screen **[verified]**

Reproduced in a browser at build 335, then confirmed against the exact error your own build-334
crash capture recorded in `beta_events`:

```
Uncaught ReferenceError: Cannot access 'candleAcademy' before initialization
where: chart-quest.html:2045
```

| Run (same fresh profile, same build) | `window.CQ` | Screen |
|---|---|---|
| `?fresh=1&mute=1` (control) | `object` | intro cinematic plays ✅ |
| `?fresh=1&dev=1&mute=1` | **`undefined`** | **dead black screen** ❌ |

**Mechanism.** `chart-quest.html:2555` calls `resolveAuth()` synchronously from inside the
`initSupabase` IIFE (which closes at `:2614`). On a profile with no `cq_played`, `resolveAuth`
reaches `candleAcademy.active = false` at `:2045` — but `candleAcademy` is `const` at `:6250`,
~4,200 lines later, still in the temporal dead zone. Neither line is in a try/catch, so the throw
escapes and aborts the entire MAIN script block. `window.CQ = CQ` (`:2967`) never runs, which is the
fingerprint above. The trailing blocks (CQBeta, CQTrack, CQJournalTutorial) still load, so the page
looks alive while the game is gone. `typeof` guards do **not** protect against this —
`typeof turtle !== 'undefined'` at `:2055` throws too.

**Scope: developer-facing, not tester-facing.** No shipped link carries `?dev` or `?guest`. It
costs *you* a confusing black screen whenever you use the shortcut on a clean profile.

**Silver lining, proven:** build 334's boot-crash capture **works end-to-end** — it caught a
parse-time throw in the head, queued it, and CQTrack posted it to `beta_events`. That was the whole
point of 334 and it is now demonstrated, not assumed.

### ⚠️ P0-C — `?fresh=1` mints a brand-new analytics player on every launch **[verified]**

Your permanent testing rule ("every test URL uses `?fresh=1`") is in direct conflict with the
funnel. The wipe regex `/^(cq_|shellTrade)/` (`:1715`) clears `cq_pid` along with everything else.

My three verification loads produced **three different `player_id`s inside one session** — visible
in your live table right now:

| ts (UTC) | player_id | name |
|---|---|---|
| 16:16:01 | `p-egg2gizyko` | session_start, tutorial_started |
| 16:16:07 | `p-hapebxk3t0` | crash |
| 16:16:52 | `p-6d44dos9yv` | tutorial_started |

Three "new testers" from one person at one desk in 51 seconds. Every `?fresh` launch also re-fires
every once-per-player milestone. **Gate A in the certification only covered the invite link — this
is your own testing habit doing the same damage to the same table.**

Related, and also confirmed: `?fresh=1` deletes `qa` from the URL at `:1725` *before* the QA bridge
reads it at `:25715`, so **`?fresh=1&qa=1` silently yields no QA bridge and no build-tag HUD.**
(`?dev`, `?hmc`, `?bcj` are preserved — only `fresh` and `qa` are stripped.)

---

## 0.1 · MY TEST DATA IS IN YOUR PRODUCTION TABLE — 4 rows, awaiting your call

Verifying P0-B wrote **4 rows** to live `beta_events`, all in session `s-msev13f5-85dzj2kr`:

```sql
-- I have NOT run this. Say the word and I will.
delete from beta_events where session_id = 's-msev13f5-85dzj2kr';
```

I did not delete them myself — that is destructive and it is your dataset. Flagging it because the
certification notes you clear lead-test traffic after testing, and these would otherwise read as
three real testers who crashed.

---

## 0.2 · GOOD NEWS, CONFIRMED

- **Gate B passed.** Every funnel event the certification listed as "zero rows ever" has now fired:
  `boss_started`, `boss_defeated`, `journal_unlocked`, `journal_discovery_started`,
  `journal_discovery_completed`, `tutorial_completed`, `first_trade_lost`. `beta_surveys` has 2 rows.
  A `GATE-B-003` player id is in the table. The instrument is proven end-to-end.
- **Build integrity is perfect.** `chart-quest.html`, `index.html`, `website/game.html` are
  byte-identical (md5 `a4380ec7e3c19a8e437277413922e4dd` ×3), and the deployed `/game` serves
  **build 335** — source and production agree.
- **`sync_track.py --check` passes.** Inlined CQTrack matches `website/assets/cq-track.js`.
- **Git is clean.** No uncommitted or untracked files. `.netlify-token` correctly untracked.
- **The regression gate passes**: 14 pass · 0 fail · 3 skip.
- **The four hardening fixes all genuinely landed** (anon EXECUTE revoked, exact-match origins,
  `sw.js` repaired, `?qa=1` gated on `_CQ_DEV`) — independently re-verified.
- **The old-turtle regression is not live.** `cq.sh:39` copies `finn/*.png` and `:45` hard-fails the
  build if `website/finn/run.png` is missing. All 7 sprites present.

---

## 0.3 · WHAT I DID NOT DO

Per the standing operating model I **assigned myself no work and changed no code**. The
implementation plan you asked for is §8 — written as costed, unstarted ticket proposals for you to
pick from, not a plan I have begun executing.

---

## 1–7 · ARCHITECTURE ORIENTATION BRIEF

*Produced by the read-only mapping sweep. Sections renumbered inline below.*


---

## 1. THE ONE-PARAGRAPH TRUTH

ChartQuest is **one 28,323-line HTML file** — `chart-quest.html` (1,915,509 bytes) — containing 8 inline `<script>` blocks, ~690 top-level globals, and every system in the product: boot, auth, market engine, physics, curriculum, trading, bosses, journal, minigames, analytics and the closed-beta gate. There is **no build step, no bundler, no module system, no package.json**. `index.html` and `website/game.html` are byte-identical copies produced by `scripts/cq.sh mirror` / `site` (verified: all three sha256 `31985f98…`). The "architecture" is therefore not module boundaries — it is **script-block ordering plus one shared global lexical scope**, policed after the fact by a 17-check static regression gate (`scripts/verify.js`) that reads the HTML as *text*, never executes it, and whose most important property is that **WARN does not fail the ship** (`scripts/verify.js:363`). The codebase's real organizing principle is archaeological: an original monolith (MAIN, `1628-24203`, 22,576 lines, 75 distinct blame commits) that everyone edits, and six later **self-contained trailing IIFE blocks** (MG, QA, ContentLog, CQJournalTutorial, CQTrack, CQBeta) that were added by *runtime-patching* MAIN's exported `function` declarations rather than editing it — a merge-safety discipline invented under concurrent-agent pressure and now the single most valuable convention in the repo.

---

## 2. SUBSYSTEM MAP

**Boot & flow state machine.** There is no `boot()`. Boot *is* top-level script order: head crash-capture IIFE (`chart-quest.html:28-65`, build 334) → Supabase CDN tag (`:1627`) → MAIN's URL-flag capture (`:1639-1691`) → the `?fresh` localStorage wipe (`:1698-1730`) → `initSupabase` IIFE which closes at `:2614` → ~19,000 lines of top-level state → the literal go-line `initCandles(); prePopulateHTF(); spawnTurtle(); requestAnimationFrame(frame)` at `:24157-24161` → `serviceWorker.register('/sw.js')` at `:24172`. The "state machine" is four independent `active` booleans evaluated in fixed precedence inside `frame()` — `bcJourney` (`:23790`) → `introCine` (`:23795`) → `candleAcademy` (`:23798`) → gameplay — plus `introFlow.phase`. `resolveAuth()` (`:1994-2063`) is the routing hub with five branches into gameplay.

**Save system.** ~32 `cq_*` keys plus three legacy `shellTrade*` keys, written by ~99 scattered ad-hoc `localStorage` calls. There is **no central save function**; only `cq_player_v1` has a save/load pair (`saveLocalProgress`/`loadLocalProgress`, `:5763-5789`, driven by `pagehide`/`visibilitychange`, not by mutation). `session.level` is never persisted (`session` at `:8146`), so every reload restarts at level 1; only `cq_maxHour_v1` survives. `cq_played` is the sole first-timer/returning discriminator and is read at *parse time* into three separate const initializers (`:6251`, `:6260`, `:6313`).

**Market / candle engine — `window.CQ`.** A deep-frozen IIFE (`:2761-2968`, published at `:2967`) owning the ratified "A.6 spine": palette `COL` (`:2765-2772`), geometry `SPINE` (`:2773-2793`), width/gap/wick/body-floor formulas, an OHLC schema adapter, and the wick-inclusive touch truth. **The migration is half-done.** Verified by grep: exactly 13 `CQ.` references exist in the file — nine COLOR derivations (`:2978-2986`), two `CQ.priceTouched` calls in `tradeTouchCheck` (`:5071-5072`), two comments. `CQ.width`, `CQ.gap`, `CQ.minBodyPx`, `CQ.floorBodyPrice`, `CQ.normalizeReplay`, `CQ.ohlc`, `CQ.levelHit`, `CQ.selfTest` have **zero call sites**. The world renderer `drawCandle` (`:16397`) still uses `candleW()` (`:5571`, which multiplies by `rand(0.92,1.1)` and is therefore non-deterministic) and `CFG.minBody` (`:2644`). At least five other candle renderers were never migrated, and `:24801` defines a complete parallel 10-key palette.

**Trading.** L1–3 trades are **authored and driven**. `commitTrade()` (`:14267`) builds the trade, **overwrites** the player's slider SL/TP with a clean 1R band (`:14367-14370`), hard-codes `trade._l1Outcome = 'win'` for every guided intro trade (`:14367`), and deletes every candle ahead of Finn (`:14406-14424`, LAW 1). While live, `nextCandle()` (`:5313`) unconditionally routes to `tradeDrivenCandle()` (`:5075`), which walks a phase arc inside a **safe corridor** (`:5207-5214`) that makes a win physically unable to touch the stop. Price advances on the **Trade Clock** — `TRADE_CANDLE_MS = 520` (`:5597`), verified — inside `maintainCandles` (`:5624-5675`), never on Finn's footsteps. Resolution is one honest wick-inclusive test (`tradeTouchCheck`, `:5068-5074`) run only on candles Finn has physically walked past: `_frontier = Math.min(maxSeenCandleId, _finnId)` (`:16198`). Five `resolveTrade` call sites total (`:5071`, `:5072`, `:8426`, `:14467`, `:16213`).

**Curriculum.** Four layers: `LESSONS` (31 HTML cards, `:7362-7601`) drained by the single `pumpLessons` (`:8013-8105`); `CURRICULUM` (10 hours, `:7698-7770`) whose `focus[]` gates `teach()` (`:7852-7901`); `LessonChart` (33 animated scenes + a measured soft-scrim label solver, `:24797-25334`, inside the **MG** block, bridged to MAIN at `:25699`); and LEARN→PRACTICE realised three different ways — the L1 `introFlow` chain, `LEVEL_FLOW`/`levelFlowBeat` for L2–3 (`:7913-7949`), and bare `teachForced()` for L4+ (`:9400-9405`). TEST is the mastery gate `tradeGateRequired`/`tradeGatePassed` (`:7861-7871`), never a timer. Verified: **exactly one concept is taught before the first trade** — reading a candle (`:20145-20147`), an explicit founder correction documented at `:20184-20189`.

**Bosses.** A boss is a knowledge exam. `openBoss(level)` (`:13692`) builds `bfState` from `BOSS_GAMES[level]`, an ordered `[miniGameId, difficulty]` playlist; `launchRound()` (`:13054`) hands each round to `MG.run`. The whole roster lives in one literal, `BOSS_CAST` (`:12657`), from which `rebuildBossesFromCast()` (`:12760`) overwrites the legacy `BOSSES` object (`:12311`). Guardian 1 (The Gambler) is **deliberately unloseable**: `onRoundDone` forces `passed = true` at `:13083`. `bossForLevel(lvl) = lvl + 1` (`:12817`) is the single home of the build-300 renumber offset — and three cosmetic tables (`arenaSrc`/`REALMS`/`bossCrestSVG`/`BOSS_TAKEAWAY`) never got renumbered with it.

**Journal + `CQJournalTutorial`.** Six-tab DOM panel (`:1398-1416`) over three independent localStorage arrays; one router `renderJournalSection()` (`:11887`). Gated as a Boss-1 reward via `body.preNotebook` (`:344`). On top sits a 1,088-line self-contained onboarding quest (`:26348-27435`) with 12 objectives (`:26552-26606`) that teaches by forwarding taps to the *real* controls via `node.click()` (`:27063`). It integrates through **exactly one line in MAIN**: `:20259`.

**Analytics — `CQTrack`.** `:27436-27895`, **generated** from `website/assets/cq-track.js` by `scripts/sync_track.py` (markers verified at `:27437`/`:27894`). Closed 18-name vocabulary, 13 of them once-per-player latched by `cq_bt_<name>`. All five game events are acquired by **runtime-wrapping** `openBoss`/`bossWin`/`commitTrade`/`resolveTrade`/`introComplete` (`:27775-27793`) — zero call sites in MAIN. Writes to the `beta-ingest` edge function → `beta_events`/`beta_surveys` (RLS on, admin-read-only, service-role writes).

**Closed beta — `CQBeta`.** `:27896-28321`. Converts the game to Level-1-only by patching `window.introComplete` and `CQJournalTutorial.claimPostBoss` at runtime. Three exits: journal-discovery complete (`:28231`), no-journal fallback (`:28257`), and a 1500ms poll on `session.level >= 2` (`:28268-28276`). `ContentLog` (`:25927-26346`) is a *second, independent* telemetry pipeline that is ON by default (`:25960`) and double-writes six of the same milestones to a different table via a different edge function.

**Build/release.** `scripts/cq.sh ship` = `mirror && node scripts/verify.js && site && tag && desktop-qr` (`scripts/cq.sh:51`, verified). `verify.js` runs 17 static checks; four delegate to standalone gates (`candle_language_gate` #12, `cq_owner_gate` #13, `collectible_law_gate` #14, `lesson_label_gate` #15). Check 3b — the only one that would really boot the game — is permanently SKIPped (no puppeteer, no package.json).

---

## 3. THE INVARIANTS

Ranked by how silently they fail.

| # | Invariant | Breaks how | Gate |
|---|---|---|---|
| I1 | **A new trailing `<script>` block must declare ZERO top-level names.** Separate inline blocks share one global lexical scope; a duplicate top-level `let`/`const`/`class` is a parse-time `SyntaxError` that kills the *entire* block. | Silently — the block just never runs. Measured today: MAIN declares ~690, MG exactly 1 (`const MG`, `:24238`), ContentLog 1, and QA/JTut/CQTrack/CQBeta **0**. Zero cross-block collisions currently. | **None.** #3a runs `node --check` per block *independently* (`verify.js:98`), so cross-block collisions are invisible by construction; 3b never runs. |
| I2 | **`window.X = v` on a MAIN global is a silent no-op.** Top-level `let`/`const` are lexical, not window properties. Every cross-block read must be `typeof`-guarded; every write must be a bare assignment. | Silently — the assignment compiles and does nothing. 49 shared bare-name bindings cross block boundaries. Documented as design law L6 at `:26387-26392`; accessor bank at `:26453-26478`. | None |
| I3 | **Trade pacing must never be re-coupled to traversal.** `TRADE_CANDLE_MS = 520` (`:5597`) is a wall-clock beat; `maintainCandles` bypasses the spatial rule while `_liveTrade` is truthy (`:5642-5644`). | Build 298's "first trade ends immediately" returns. Forbidden-change note at `:5613-5628`. | Indirect: verify #11 (`verify.js:206-218`) |
| I4 | **A win must never touch the stop.** The safe corridor (`:5207-5214`) is now the *only* thing keeping the authored outcome and the honest resolver in agreement — STANDOFF and the `_held >= 90` backstop were both deleted. | Build 282 fast-loss returns. | verify #11, but it matches **one exact code shape each** (`verify.js:212-213`) — `if (hitSL === true)` is not caught |
| I5 | **Resolution must read `min(maxSeenCandleId, _finnId)`, not `maxSeenCandleId`.** That global has three writers, one of which is the trade clock racing ahead of Finn. | Build 314's "TARGET HIT ahead of the turtle" returns. Documented at `:16167-16190`. | None |
| I6 | **Never hand-edit `27436-27895`.** Generated from `website/assets/cq-track.js`; `sync_track.py` replaces the whole span and anchors on the literal banner text at `:27898`. | Work is destroyed on the next sync. | `sync_track.py --check` exists — but **is wired into nothing**; `grep sync_track scripts/cq.sh scripts/verify.js` returns nothing |
| I7 | **No new `roundRect(` and no candle-palette hex literal anywhere — comments included.** `rounded_candle` is at 4 with baseline 4: **zero headroom**. 9 of 11 signals are at zero headroom. | Ship fails. Escape hatch is the literal marker `CQ-LABEL-CHROME`. This is why `:26446` writes GREEN as `rgba(22,199,132,1)`. | `candle_language_gate` #12 (a *ratchet on counts*, not semantics) |
| I8 | **No new `cq_*` localStorage key.** `verify.js:51` derives a protected signature from `/cq_[a-z_]+/g` over the **whole file including comments and BUILD_TAG prose**. | False FAIL on "Save keys". This is why the journal tutorial hid its flag as `player.jtut` inside `cq_player_v1` (`:26399-26402`). | verify #10 — but self-SKIPs once committed (`srcChanged()`, `verify.js:39`) |
| I9 | **The `window.CQ` IIFE is text-locked.** `cq_owner_gate.js` extracts it by literal string search: the banner comment (`:41`), the exact token `(function () {` (`:43`), the line `window.CQ = CQ;` (`:44`). It then evals it with a bare `{}` window stub. | Reformatting, renaming the banner, or referencing `document`/`navigator` at module scope → "engine IIFE not found", a failure that reads like deletion. | #13 |
| I10 | **`LessonChart`'s render must stay two-pass and its solver text must stay minified-exact.** `lesson_label_gate.js:59-63` counts occurrences of the literal loop header. | Running a formatter produces a false FAIL — or worse, reports "single-pass" on code that is genuinely two-pass. | #15 |
| I11 | **Three copies must stay byte-identical.** Verified today (sha256 `31985f98…` ×3). | verify #8 fails — but it compares **only `index.html`** (`verify.js:30`, `:149-150`); `website/game.html` is checked only by a BUILD_TAG *substring* comparison (`cq.sh:46-48`). | #8, partial |
| I12 | **`CQ.floorBodyPrice` must never be applied to a trade-resolving candle** — it *moves the close* and would contradict the authored outcome. Constraint exists only as a comment (`:2867-2871`). Zero call sites today, so the first person to wire it is the most likely to miss it. | Silently contradicts SL/TP. | None |
| I13 | **Read early, act late for URL flags.** Every flag must be captured at `:1639-1691` because `:1698-1730` rewrites `location.search`. | `?qa=1` read at `:25715` after `?fresh` deleted it — see risks. | None |

---

## 4. THE MERGE-SAFE PATTERN

`CQBeta` is the canonical template. Five properties, all verifiable in-file:

1. **One trailing `<script>` block; nothing above it modified.** Verified: `awk 'NR<27896 && /CQBeta/'` returns five hits, **all comments** (`:27385`, `:27662`, `:27749`, `:27838`, `:27870`) — zero executable references. The commit that added it (`44251e4`) produced exactly **two** diff hunks in a 22,000-line file: the BUILD_TAG line and one pure insertion. CQTrack (`7a78795`) and the boot-crash block (`37cf641`) did the same.
2. **Anonymous IIFE, zero top-level declarations.** `(function () {` `:27940`, `'use strict'` `:27941`, namespace held in a local `var NS` `:27943`, published once as `window[NS]` at `:28307-28319`.
3. **Takeover by runtime patching, never by editing a call site.** `patchIntroComplete` `:28244-28263`, `patchJournal` `:28211-28241`, each idempotent via a private marker (`wrapped.__cqBeta` `:28259`; CQTrack's generic `wrap()` at `:27753-27770` with `__cqTrack`). MAIN exports **379 column-0 `function` declarations** in `1628-24203` — that is the full set of patchable hook points costing zero lines in MAIN.
4. **Self-contained DOM and CSS.** Inline styles (`:28049`, `:28181`) or a runtime-injected stylesheet (`:26761`). Never touch the `<style>` blocks (`72-1164`, `1165-1204`, `1464-1547`) or the body markup.
5. **Every hook try/caught** so the module can never brick the game (`:27917-27918`); even the `DOMContentLoaded` registration is wrapped (`:28301-28304`).

**The one permitted deviation:** if the feature genuinely needs a moment no existing function represents, budget **exactly one** hook line in MAIN — the `CQJournalTutorial` precedent at `:20259`, with an explanatory comment block at `:20245-20254`.

**The anti-pattern, same file:** `ContentLog` records the same class of telemetry as `CQTrack` but is called explicitly from **14 hand-placed sites** inside MAIN (`:2011`, `:8247`, `:9716`, `:13237`, `:13410`, `:13711`, `:15511`, `:15515`, `:15518`, `:15753`, `:25690-25691`, `:26201`) — nearly all in the hottest line regions. `CQTrack` does the same job with zero. 14× the merge cost for the same outcome.

**Seam map (insertion anchors).** Concurrent sessions should claim *different* ones:
- **S7 — `28321`/`28322` (EOF, before `</body>`)**: canonical. Both JTut and CQBeta landed here.
- **S4 — blank line `26347`**: clean.
- **S2 — blank line `25703`**: clean.
- **Avoid S5 (`27435/27436`) and S6 (`27895/27896`)** — `sync_track.py` walks back from the BEGIN marker and anchors on the banner at `:27898`.
- Blocks at S2/S4 run before CQTrack, so they must buffer analytics through `window.__cqTrackQueue` (`:27975-27981`, drained at `:27838-27843`) rather than calling `window.CQTrack` at parse time.

**Hot regions to stay out of** (distinct blame commits per 1000-line bin): `3015` (BUILD_TAG — 29 of last 30 commits), then `2001-3000` (23), `16001-17000` (23), `1001-2000` (22), `5001-6000` (20), `6001-7000` (20). Cold: `21001-23000` (3), `27001-28321` (4-5). Densest global-declaration zone is `7001-8000` — 46 column-0 declarations; adding a global there maximises both textual-conflict and Block-2-trap odds.

**Mirror discipline:** there is **no `.gitattributes`** in the repo, so one conflicted hunk in `chart-quest.html` reproduces as three identical conflicts if all mirrors were committed. Commit `chart-quest.html` alone during concurrent work; regenerate with `cq.sh mirror && cq.sh site` after the merge lands.

---

## 5. THE RELEASE PATH

```
# 1. Edit chart-quest.html ONLY.  (Never index.html, never website/game.html,
#    never chart-quest.html:27436-27895.)

# 2. If the analytics client changed, edit the canonical file and re-splice:
vim website/assets/cq-track.js
python3 scripts/sync_track.py            # rewrites chart-quest.html:27436-27895
python3 scripts/sync_track.py --check    # exit 0 = in sync   (NOT run by ship)

# 3. Bump BUILD_TAG at chart-quest.html:3015 (verify #7 FAILS without it).
#    Keep the trailing `//` comment after the closing quote — candle_language_gate.js:52
#    depends on it to strip the changelog from its census.

# 4. Ship.
scripts/cq.sh ship
#   = cq.sh mirror                 -> cp chart-quest.html index.html
#  && node scripts/verify.js       -> 17 checks; exits 1 only on FAIL
#  && cq.sh site                   -> cp to website/game.html + finn/*.png + bosses/*.webp
#  && cq.sh tag                    -> prints the build tag
#  && cq.sh desktop-qr             -> non-fatal (`|| true`, cq.sh:56)

# 5. Sanity-check the served build before playtesting:
scripts/cq.sh qr        # refuses to print a QR if BUILD_TAG on the wire != on disk

# 6. Commit, then push. main auto-deploys to Cloudflare Pages.
git tag vYYYY.MM.DD-buildNNN   # ReleaseChecklist.md:11 — the rollback anchor
```

**What that sequence does NOT do, verified:**
- It never runs `sync_track.py --check` — `grep -n 'sync_track\|cq-track' scripts/cq.sh scripts/verify.js` returns nothing. Tracker drift is silent.
- It never bumps `sw.js`. `sw.js:2` is `chart-quest-v325` against build 335 — **10 builds stale**, despite the file's own inline instruction and `ReleaseChecklist.md:15`.
- It runs `verify` **before** `site`, so the gate never observes the post-`site` state, and `website/game.html` is never hash-checked.
- **Nothing enforces it.** `.git/hooks/` contains only `.sample` files (verified). A commit that skipped `ship` reaches `main`, and `main` auto-deploys.

---

## 6. RISKS ON THE TABLE RIGHT NOW

> **Note:** R1, R4 and R5 below were written as *static, unverified* reasoning. I have since
> confirmed all three first-hand — see §0, which supersedes their severity: R1 and R5 are P0, and
> R4 is demonstrated with live rows. R6's open question ("which directory does production serve")
> is now answered: **`website/`**.

**R1 — BLOCKER (latent crash): the `?guest` / `?dev` path is a temporal-dead-zone throw.**
`chart-quest.html:2555` calls `resolveAuth()` **synchronously** while the `initSupabase` IIFE is still executing (it closes at `:2614`). `resolveAuth` reaches `candleAcademy.active = false` at `:2045` — but `candleAcademy` is `const` at `:6250`, ~4,200 lines later, still in TDZ. Line `:2055` uses `typeof turtle !== 'undefined'`, and `typeof` **does not** protect a TDZ binding (`turtle` is `const` at `:5820`); same for `portals` (`:5863`) and `IntroCinematic` (`:20846`) at `:2049`. Neither `:2045` nor `:2555` is in a try/catch, so the throw escapes the IIFE and aborts the whole MAIN block — white screen. Every other caller of the same code is protected (`_handleSession` at `:2592`/`:2596`, `?hmc` at `:2577`). **Static-order fact, runtime-UNVERIFIED.** Confirm in a browser with `?dev=1` on a profile with no `cq_played` before acting.

**R2 — BLOCKER (process): `BUILD_TAG` at `:3015` is a guaranteed conflict on every concurrent release.** One physical line, 1,100 characters, holding both the version and the entire prose changelog. Changed in 29 of the last 30 commits touching the file. verify #7 *requires* the bump, so no session can decline to touch it; it can never auto-merge. Two aggravators: (a) `verify.js:51` scans `/cq_[a-z_]+/g` over the whole file **including this string**, so a changelog sentence naming a storage key produces a false FAIL — line `:3015` already contains `cq_dev` in prose; (b) `candle_language_gate.js:52` strips it with a lazy regex that **requires** a `//` comment immediately after the closing quote — remove it and the match runs to the next `';` + `//` anywhere later, deleting a large span of real code from the census and silently *lowering* every count: a false PASS.

**R3 — HIGH: WARN is not FAIL — the single largest false-pass vector.** Checks #12–#16 are each wrapped in try/catch that records `WARN: gate not runnable` (verified at `verify.js:232, 247, 263, 279, 321`), and the exit is `process.exit(fails.length ? 1 : 0)` (`verify.js:363`). **Deleting, renaming, or breaking any of the four sub-gate scripts turns it into a warning and `cq.sh ship` still succeeds.** Checks #7 and #10 additionally self-SKIP once committed (`srcChanged()`, `verify.js:39`). Combined with the absence of git hooks, the entire gate is advisory.

**R4 — HIGH: `?fresh=1` and `?qa=1` are mutually destructive, and `?fresh=1` corrupts the funnel.** Verified at `:1725`: the fresh handler does `_p.delete('fresh'); _p.delete('qa')` and `history.replaceState`s, synchronously in MAIN — long before the QA bridge reads `location.search` at `:25715` (`QA_ON = !!(window._CQ_DEV) && /[?&]qa=1(?:&|$)/`, verified). So `?fresh=1&qa=1` silently yields `QA_ON === false` and no build-tag HUD. This collides directly with the standing project rule that every test URL carries `?fresh=1`. Worse: the wipe regex `/^(cq_|shellTrade)/` (`:1715`) clears `cq_pid`, so **every beginner-mode test launch mints a new analytics player and re-fires every once-per-player milestone** — the beta funnel inflates by one "new player" per fresh test.

**R5 — HIGH: the production deploy is missing every Guardian-1 cinematic.** `scripts/cq.sh:40` is `cp -f bosses/*.webp website/bosses/` — no `-r` (verified). `website/bosses/` contains 12 `.webp` and **zero subdirectories**; root `bosses/` has `flinches/ intros/ outros/ sfx/` (verified). The game references `bosses/flinches/boss-1-flinch-{1..4}.mp4` (`:13463-13466`), `bosses/outros/boss-1-defeat.mp4` + `finn-journal.mp4` (`:13596`), `bosses/sfx/boss-roar-{1,2,3}.m4a` (`:23442`), `bosses/intros/boss-<level>.mp4` (`:13540`). **All of it is level 1** — the only boss a closed-beta tester reaches. It degrades silently (`vid.onerror = playNext`, `:13620`), so builds 316–324 are effectively un-shipped for external testers, and the founder would never see it because local/LAN QR playtests serve the repo root.

**R6 — HIGH: the deploy output directory is documented two different ways.** `docs/operations/CloudflareDeployment.md:24` says `/` (repo root); the website audit says `website/`. Live evidence (served page title matching `website/index.html:6`, not root `index.html:27`) says `website/`. Verified consequences of that being true: **`website/_headers` does not exist** (verified: no such file) — so production serves no CSP, no HSTS, no `X-Frame-Options`, and `ReleaseChecklist.md:30` cannot pass; and **`website/manifest.json` does not exist** (verified) while `chart-quest.html:18` links the absolute `/manifest.json` — a 404 on every load, PWA install broken. If the docs were right and the root *were* served, root `_headers:19-24` (`frame-ancestors 'none'` + `X-Frame-Options: DENY`) would blank the game iframe in `website/play.html`. Either way, one of the two documents is actively misleading.

**R7 — HIGH: repo copies of the edge functions are stale, and one still contains the origin-spoof bug.** Live: `beta-ingest` v4, `ingest` v3, `update-progress` v5. Repo `supabase/functions/beta-ingest/index.ts:17` self-documents "DEPLOYED: version 2" and `:110` still uses `origin.startsWith(o)` against a prefix allowlist — the `playchartquest.com.evil.com` hole the deployed v4 fixed with exact `Set.has`. `ingest/index.ts:107-109` still echoes the matched *prefix* as `Access-Control-Allow-Origin` (the CORS false-pass trap; curl gives a false PASS). `update-progress` has **no repo copy at all**. Redeploying from the repo would be a three-way regression: reopen the spoof hole, start dropping `journal_discovery_skipped`, and revert surveys to `ignoreDuplicates:true`.

**R8 — MEDIUM: `journal_discovery_skipped` is collected but nowhere consumed, and may be dropped at ingest.** The client emits it (`:28228`) and it is in `NAMES` (`:27486`), but it is absent from the repo edge function's `EVENT_NAMES` (`supabase/functions/beta-ingest/index.ts:46-56`), absent from `scripts/founder_report.py`'s FUNNEL (`:44-51`), and absent from the exit-stage ladder (`:27704-27705`). A player who taps ✕ on Journal Discovery is reported as a **boss-stage drop-off**. Because the once-per-player latch is written *before* the row is sent (`cq-track.js:212-216`), a server-side rejection burns it permanently.

**R9 — MEDIUM: migration 0009's admin guard is unapplied.** `get_dashboard_stats` and `get_recent_bug_reports` are `SECURITY DEFINER`, contain no `is_admin()` check, and still grant EXECUTE to `authenticated`. The anon half *is* closed (migration `20260804151817` applied and verified). Beta testers can create accounts, so `authenticated` is not empty for the duration of this beta.

**R10 — MEDIUM: two independent telemetry pipelines double-write.** `ContentLog` is ON by default (`:25960`) and emits `session_start` and `boss_defeated` alongside `CQTrack`, plus four shadow events, to a *different* endpoint and table. Its master switch is inverted-default (`!== '0'`), so any stale `cq_content_enabled='0'` silently kills it with no in-game symptom.

**R11 — MEDIUM: `trade._bodyFloor` is computed and never read.** Assigned at `:14403`, referenced nowhere (grep: 3 occurrences — two comments and the assignment). `tradeDrivenCandle` uses the module const `TMB` (22) for every floor. The documented invariant "a drive body is never more than ~18% of 1R" is **not enforced**: in the narrowest legal band a 22px floor body is 33% of 1R, and counter/nudge paths reach ~86%. Only the safe corridor stops that from jumping a line.

**R12 — MEDIUM: three cosmetic boss tables were never renumbered with build 300.** `arenaSrc` is 0-based against a 1..11 `BOSS_THEME` (`:12763`); `BossArena.REALMS` is keyed 0..10 while `applyBossTheme` passes the raw level (`:12554`); `bossCrestSVG` (`:12867`) cases 1..10 carry the old roster's names; `BOSS_TAKEAWAY` (`:13212`) is keyed 0..10 and looked up by `bfState.level`. Every Guardian gets the *next* one's realm particles and takeaway line; boss 11 falls through to the Gambler's. Currently invisible only because `.bossHero.hasImg .bossHeroCrest { opacity: 0 }` (`:641`) hides the crest once the webp loads.

**R13 — MEDIUM: `MG.run(id)` with no difficulty throws.** `:25695` does `DIFF = diff || 'beginner'` but then renders the pill from the **raw** parameter. All four call sites pass one explicitly, but the boss path (`:13071`) is not try/caught. Latent.

**R14 — MEDIUM: dead code that looks live.** The entire legacy boss quiz renderer — `renderBossRound` (`:13136`), `bfAnswer`, `bfTrendTap`, `bfNext` — has no reachable caller and no matching click handler (`#bfBody` recognises only `bfFight`/`bfClaim`/`bfRetry`/`bfSkip`, `:13984-13998`); ~1,000 lines of authored quiz content in `BOSSES[*].rounds` is unread. `FW.build` (`:25603`) has no registry entry. `triggerFlashQuiz` (`:20089`) has no caller, yet `introFlow.phase === 'quiz'` is still dispatched. `openScanner` (`:12152`) has zero callers. `teach('goal')`, `teach('setup')`, `teach('spin')` are permanent no-ops because those keys appear in no `focus[]` and no `BYPASS_GATE`.

**R15 — MEDIUM: the save-progress prompt opens *behind* the beta ceremony.** `promptSaveProgress` reveals `#authOverlay` at CSS `z-index: 200` (`:1084`) at +800ms (`:20257`), while `CQBeta`'s ceremony sits at `z-index: 9000` (`:28004`) and fires immediately after `onDone` (`:28230`). The "make this Finn yours forever" signup card is invisible at exactly the moment `:20248-20252` says it must not be ambushed. Also: the resume banner never checks `cq_bt_survey_submitted` and its ✕ persists nothing (`:28187`), so a tester who finished *and* submitted still sees it on every load, forever.

**R16 — LOW/PROCESS: 46 of 50 hardening findings are open and the JSON has no status field.** `hardening-findings-50.json` carries no `status`/`fixed` key; the only record of what landed is the strikethroughs at `CHARTQUEST_PRODUCTION_HARDENING_2026-08-04.md:146-153` (items 1–4, all four independently confirmed done). Severity mix across the 50: 3 Critical, 3 High, 28 Medium, 16 Low. Still open for an imminent external beta: no "not financial advice" disclaimer anywhere in 1.87 MB; Terms of Use names no owning entity; no `404.html` (every missing path returns 200); `?flow=1` ships an explicitly unvalidated prototype (`:14734`); `CQTrack.event()`/`.survey()` let anyone write arbitrary rows into the live dataset. Also: `git tag` newest is `v2026.07.16-build271` — **64 builds behind HEAD**, so the documented rollback anchor does not exist for anything recent. And `deploy/` is tracked in git, dated 2026-06-17, containing zero `BUILD_TAG` — publicly reachable if the root is ever served, despite `DeploymentManifest.md:55` listing it as EXCLUDE.

---

## 7. WHAT I COULD NOT VERIFY

- **Nothing was executed.** No browser, no server, no `cq.sh`, no `verify.js`. The only things run were the four standalone static gates (all PASS) and read-only shell (`shasum`, `grep`, `sed`, `git`, `ls`). Every behavioural claim about *runtime* — R1's TDZ crash, the CQTrack/CQBeta double-wrap ordering, the 1500ms level-guard latency, the buried `#authOverlay`, whether every journal objective is satisfiable on a real device — is static reasoning, not observation. **R1 in particular must be confirmed in a browser before anyone acts on it.**
- **Which document production actually serves** (root `index.html` vs `website/game.html`) is inferred from a page-title match in an audit file, not from a live fetch by me. It determines whether R5, R6 and the relative `surveyUrl: 'survey.html'` resolution are real. `survey.html` exists **only** at `website/survey.html` — there is none at the repo root.
- **Whether the deployed edge functions match what I read.** I read repo copies plus a live function list. The v4 `beta-ingest` source I have secondhand appears in no committed revision, so production and repo have provably diverged with no audit trail.
- **`pullCloudData()` and the cloud `profiles` load** were not traced; I cannot state which local keys cloud sync overwrites on sign-in beyond the comment at `:5758-5760`.
- **`IntroCinematic` (`:20846-21943`) and `BlockchainJourney` (through `:23161`) internals** — only their `active` flags and start/callback contracts were read.
- **Level 4+ trade behaviour.** The drive and the Trade Clock are both gated on `session.level <= 3`; the resolver loop at `:16176` is not level-gated. I did not audit how the L4+ generator interacts with SL/TP, and `tradeTouchCheck` tests the **stop before the target** (`:5071-5072`) — a real tie-break rule at L4+ where no safe corridor exists.
- **Whether the boss key-shift (R12) is an accepted re-skin or an unnoticed regression** is a founder call; the code states nothing.
- **The `~690 top-level declarations` figure for MAIN is an over-count** from a brace-depth tokenizer (it leaked `Consolas`, `BlinkMacSystemFont`, `CQTrack` from CSS/template strings). The counts that matter *are* exact: MG 1, ContentLog 1, QA/JTut/CQTrack/CQBeta 0, cross-block collisions 0.
- **Churn tiers are proportional, not exact** — the hunk survey uses each commit's own line numbering. The per-block blame commit counts are exact for the current file.
- **Whether any other session is live right now** and which regions it holds. "Contested" throughout means "historically edited by many independent commits."
- **`scripts/desktop_qr.py` and `scripts/serve_nocache.py`** were not read, and I did not verify what `cq.sh tag` does beyond reading `cq.sh:51`.
- **In-code line citations inside comments are systematically stale** (e.g. `:2888-2890` cites `pushCandle :2760` when it is at `:3085`; `boss_canon.md:22` cites `~9206` for an object at `:12311`; the A.6 JSON cites `COLOR@chart-quest.html:2412` when COLOR is at `:2977`). Nothing validates them. Treat every line number written inside a comment as unreliable and re-grep.---

## 8 · PROPOSED TICKETS — **none started**, pick what you want

Ranked by "what is visibly better in tomorrow's playtest". Each is one problem, one scope, one
success condition. Effort is my estimate; risk is against the protected-systems list.

| # | Ticket | Why it matters | Files | Budget | Protected? |
|---|---|---|---|---|---|
| **T-A** | **Ship the level-1 cinematics.** Make `cq.sh site` copy `bosses/` recursively; verify all five media URLs return `video/mp4` and `audio/mp4` on production. | Your Boss Defeat and Journal Unlock cinematics currently play nothing for every tester. Highest visible-quality-per-minute item on this list by a wide margin. | `scripts/cq.sh` (1 line) | SMALL | NO |
| **T-B** | **Add a gate for it.** Extend `verify.js` (or `cq.sh site`) to assert every `bosses/**` path referenced in `chart-quest.html` exists under `website/`. | Without this the same class of bug returns the next time an asset folder is added. It is the reason 316–324 shipped un-shipped. | `scripts/verify.js` | SMALL | NO |
| **T-C** | **Fix the `?dev`/`?guest` white screen.** Defer the `resolveAuth()` call at `:2555` past the `const` declarations (or guard the three TDZ reads). | Costs you a black screen every time you use the dev shortcut on a clean profile. Developer-facing only — no tester sees it. | `chart-quest.html` | SMALL | NO |
| **T-D** | **Stop `?fresh=1` corrupting the funnel.** Preserve `cq_pid` across the wipe (or emit test traffic under a `test_` prefix the report already excludes). | Every beginner-mode launch you do adds a fake new tester. Your testing rule and your dataset are currently at war. | `chart-quest.html` | SMALL | Save keys — **ASK FIRST** |
| **T-E** | **Give non-finishers a way to talk to you.** Footer link on `index.html` + `play.html` → `survey.html?early=1`. `CQBeta.openSurvey` is already exported (`:28312`). | The last open **P1** from the certification. 14–17 of 20 testers — everyone who quits, i.e. exactly who you need to hear from — currently has no channel. Maximum survivorship bias in your only qualitative instrument. | `website/index.html`, `website/play.html` | SMALL | NO |
| **T-F** | **Bump `sw.js` CACHE.** It reads `chart-quest-v325` against build 335 — 10 releases stale, against its own inline instruction and `ReleaseChecklist.md:15`. | Low impact (HTML is network-first so it self-heals) but it is a standing canon violation and free to fix. | `sw.js` | SMALL | NO |
| **T-G** | **Copy the deployed edge functions back into the repo.** Repo `beta-ingest` self-labels "DEPLOYED: version 2"; production runs v4. `update-progress` v5 has **no repo copy at all**. | Redeploying from the repo today is a three-way regression: it reopens the `playchartquest.com.evil.com` origin-spoof hole, starts dropping `journal_discovery_skipped`, and reverts survey upserts. This has already bitten you once. | `supabase/functions/**` | MEDIUM | NO |

**My recommendation if you want one call:** **T-A + T-B together as a single ticket.** It is the
only item on the list that changes what a tester actually *sees*, it is a one-line fix plus a guard
so it stays fixed, and it restores two named steps of the beta flow you have already paid the art
budget for. T-E is the one I would do second — it is the last open P1 and the highest-learning item
on the page.

**Deliberately not proposed:** the `_headers` / CSP work (the hardening report is right that moving
the root file as-is would blank the game iframe for all 20 testers same-day), and anything touching
the monolith's structure. Do not refactor under launch pressure.

---

## 9 · HONEST NOTES

- **The 26-finding sweep is static analysis.** I re-verified the top items myself and marked them
  **[verified]**; the rest are one careful agent's reading and should be spot-checked before you act
  on any single one.
- **`hardening-findings-50.json` has no `status` field**, so nothing in the repo records which of
  the 50 findings are fixed. The only record is the four strikethroughs at
  `CHARTQUEST_PRODUCTION_HARDENING_2026-08-04.md:146-153`. 46 remain unmarked. If you want that
  tracked, it needs to become a field, not a strikethrough.
- **`git tag` newest is `v2026.07.16-build271` — 64 builds behind HEAD.** The rollback anchor
  `ReleaseChecklist.md:11` depends on does not exist for anything recent.
- **The gate is advisory, not enforcing.** Checks #12–#16 record `WARN: gate not runnable` inside
  try/catch and the exit is `process.exit(fails.length ? 1 : 0)` (`verify.js:363`) — deleting a
  sub-gate script turns it into a warning and `ship` still succeeds. `.git/hooks/` contains only
  `.sample` files, so a commit that skipped `ship` reaches `main`, and `main` auto-deploys.
- **Line numbers written inside code comments are systematically stale** across this codebase
  (e.g. `boss_canon.md:22` cites `~9206` for an object now at `:12311`). Re-grep, never trust them.
- **I did not play 20 minutes.** This was an orientation pass, not a ticket, so the mandatory
  founder-review playthrough does not apply — but it also means everything I say about *feel* is
  worth nothing. The only felt thing I observed is that the intro cinematic still reads
  **"LIOSIANT"** in the ring text, which has been open since the build-283 certification.
