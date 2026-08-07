# ChartQuest — Post-Beta Modularization Blueprint

**Date:** 2026-08-06 · **Baseline:** build 351 (in-flight, uncommitted) · **Author:** Architecture Planning Sprint
**Status:** ANALYSIS & DESIGN ONLY — **zero production files modified.** This document is the only artifact created.

> **Prime directive honored throughout.** This sprint changed **no player-facing byte**. `chart-quest.html`, its two mirrors, gameplay, timing, save data, analytics, and the deploy path are untouched. Everything below is a *blueprint for after the Closed Beta* — the detailed execution design for the item the [2026-07-09 Phase 1 audit](ARCHITECTURE_PHASE1_AUDIT_2026-07-09.md) deferred as "Phase Two #1: modularize the monolith, document-only."

---

## 0. Executive summary

ChartQuest's game is **one self-contained 30,058-line / ~2 MB HTML document** (`chart-quest.html`) whose entire runtime lives in a **single 22,907-line `<script>` block (Block 3, lines 2386–25293)**. It is a shipping, heavily-guarded, well-documented product — but from an engineering-velocity standpoint it has exactly **one real internal module boundary**: the append-only trailing `window.CQ*` IIFEs that monkey-patch the core at runtime.

The single most important finding of this sprint is that **the project already contains not one but TWO working, shipping prototypes of the correct modularization strategy**: `ops/cq-ops.js` (spliced by `scripts/sync_ops.py`, gate #19) **and** `website/assets/cq-track.js` (spliced by `scripts/sync_track.py`, gate #20). In both, a standalone source file is **spliced** into `chart-quest.html` with a `--check` drift gate that fails the build on any divergence. The mechanism produces a **byte-identical single-file artifact** — which is exactly why it is safe: the player's file never changes. The blueprint generalizes these two proven scripts into one `sync_module.py` / `cq.sh build` covering *N* modules.

**The blueprint is therefore a generalization, not an invention:** turn `sync_ops.py` into a general `cq.sh build` that splices *N* marked module files into the one HTML, each guarded by a per-module drift gate. This unlocks two tiers of work:

- **Tier 1 — Splice extraction (near-zero risk).** Move a contiguous region's *source text* into `src/<name>.js`; the build reassembles a byte-identical file. No semantics change. This **eliminates merge conflicts** on the top-3 churn files immediately (they become build output, not hand-edited source) and shrinks the AI/human edit context from 30 k lines to a ~500-line module.
- **Tier 2 — Semantic decoupling (higher risk, per-module, gated).** Introduce namespace seams (`window.CQFINN`, `window.CQMOVE`, …) so a module stops referencing game internals by bare name — enabling isolated testing (like `ops/cq-ops.test.js`) and true independence. Done last, one module at a time, each behind a gate and a browser playtest.

**Recommended sequencing:** build the splice tool → Tier-1 the already-clean seams (audio, ContentLog, the trailing IIFEs, render primitives, LessonChart) → Tier-1 the gated frozen owners (`CQ`, `CQREACH`) → Tier-1 the large contiguous subsystems (curriculum, boss, cinematics, trade) → Tier-2 decouple the entangled spines (CFG split, `update()` physics/logic split, render-state injection, Finn seam) **only after beta**.

---

## 1. Current architecture

### 1.1 The shape of the thing

ChartQuest is a **single-file browser game** by an explicit, load-bearing **design law**: the document must run from `file://` with no `<script src>` to a sibling. So all modularity must be **authoring-time** (separate source files) reassembled by a **build-time splice** into the one shipped HTML.

| Fact | Value |
|---|---|
| Game file | `chart-quest.html` — 30,058 lines, 2,028,200 bytes (~2 MB) |
| Named functions | ~904 |
| Real `<script>` blocks | 10 (Block 3 alone is 22,907 lines = 76% of the file) |
| Byte-identical mirrors | `index.html` **and** `website/game.html` (all three identical; `website/game.html` is what production serves) |
| Existing module seams | 8 `window.CQ*` globals (see §5) — the only encapsulation today |
| Enforcement gates | 21 numbered gates / 43 assertions in `scripts/verify.js` |
| Frozen protected systems | 9 (see `docs/canon/protected_systems.md`) |
| In-flight state | Working tree at **build 351**, uncommitted (founder mid-change — do not touch) |

### 1.2 The 10 script blocks

| Block | Lines | Contents | Nature |
|---|---|---|---|
| 1 | 28–65 | `<head>` boot-crash capture | tiny, stable |
| 2 | 68–822 | **`window.CQOPS`** operational foundation | **already modular** (spliced from `ops/cq-ops.js`) |
| — | 2385 | external Supabase CDN `<script src>` | vendor |
| **3** | **2386–25293** | **THE ENTIRE GAME** — market, movement, render, Finn, lessons, trade, boss, cinematics, audio, boot/auth | **the monolith (76% of the file)** |
| 4 | 25327–26792 | `MG` mini-game engine + `LessonChart` renderer + LEARN/PRACTICE overlays | one IIFE, `window`-bridged |
| 5 | 26794–27016 | QA/testing bridge | small |
| 6 | 27017–27436 | `window.ContentLog` telemetry + `ContentDirector` + `SocialAgents` | near-clean seam |
| 7 | 27438–28525 | `window.CQJournalTutorial` + first-trade tutorial | self-contained IIFE |
| 8 | 28526–29138 | `window.CQTrack` analytics (monkey-patches commit/resolve/openBoss/introComplete) | self-contained IIFE |
| 9 | 29139–29584 | `window.CQBeta` closed-beta gate + survey | self-contained IIFE |
| 10 | 29585–30056 | `window.CQBEAT` event-spacing (`wrapMoment` patches boss/cinematic/ceremony moments) | self-contained IIFE |

**Blocks 4–10 share global lexical bindings by bare name** (a top-level `const`/`let`/`function` in Block 3 is visible to later blocks). This is the **cross-script-block scope trap**: a textually-valid merge can still crash silently via a duplicate top-level declaration. It is also why the trailing blocks are append-only — a new feature bolts on at the end and monkey-patches, touching no existing line.

### 1.3 Control flow

```
                       frame(now)  — single rAF loop (24860)
                       EMA-smoothed dt → update(dt) → render(cameraX)
                                 │                        │
              ┌──────────────────▼───────┐     ┌──────────▼───────────────┐
              │ update(dt)  (16727)      │     │ render(cameraX) (19054)  │
              │ physics + input + camera │     │ candles→Finn→HUD→overlays │
              │ + candle-entry + TRADE   │     │ (COLOR = projection of CQ)│
              │   RESOLUTION + emotion   │     └───────────────────────────┘
              └──────────────────────────┘
   update() is a KITCHEN SINK: pure physics is interleaved with trade resolution,
   candle-entry, boss approach, and shell emotion — the central entanglement.
```

Everything funnels through `frame()`. A throw in `update()` or `render()` freezes the whole game (no error boundary — highest blast radius).

---

## 2. Largest files

| Rank | File | Size | Notes |
|---|---|---|---|
| 1 | `chart-quest.html` | 30,058 lines / ~2 MB | **the target**; Block 3 = 22,907 lines |
| 1= | `index.html` | identical | byte-identical mirror (gate #8) |
| 1= | `website/game.html` | identical | byte-identical mirror (production-served) |
| 2 | `beta-qa.html` | 2,961 lines | separate QA dashboard app |
| 3 | `dashboard.html` | 2,074 lines | Founder Dashboard (separate app) |
| 4 | `ops/cq-ops.js` | 753 lines | **the reference module** |
| — | `scripts/verify.js` | ~720 lines | the 21-gate regression harness |
| — | `supabase/functions/*` | 148/144/188 lines | 3 edge functions (ingest, market-price, beta-ingest) |

Non-code weight (out of scope, flagged by Phase 1): ~250 MB of committed video (`bosses/intros/*.mp4`, `_video-originals/`), ~3 GB of local `_old_*.zip` restore points. Not loaded by the game; a separate git-hygiene task.

**Internal "largest units" inside Block 3** (the real modularization targets, by span):

| Region | Approx lines | LOC | Subsystem |
|---|---|---|---|
| Render / HUD / candle draw | 17309–20349 (+scattered) | ~2,050 | Rendering |
| Market / candle / CFG / CQREACH | 3382–6400 (+scattered) | ~1,650 | Market engine |
| Curriculum & lessons (+ LessonChart in Block 4) | 7325–9699, 25859–26635 | ~1,600 | Lessons |
| Movement / physics / input / camera / frame | 3382, 6616–7802, 16676–17302, 24779–25292 | ~1,550 | Movement |
| Boot / auth / faction / funnel + ContentLog | 2389–3372, 27017–27436 | ~1,400 | Boot/Auth |
| Boss + cinematics | 13872–14830, 14412, 21137 | ~1,200 | Boss |
| Finn character (5 scattered renderers) | 8087, 17604–18522, 20358, 22342 | ~950 | Finn |
| Trade (commit/resolve/clock/setups) | 5542–5845, 6367, 15136–16481 | ~900 | Trade |
| Audio (GameMusic + CineAudio) | 22872–22911, 24217–24776 | ~490 | Audio |

---

## 3. Highest-risk files / regions

Ranked by blast radius × extraction difficulty × protected-system overlap.

| Rank | Region | Why highest risk | Extraction difficulty (1–5) |
|---|---|---|---|
| 1 | `update(dt)` (16727–17302) + `frame()` (24860) | **Kitchen sink**: pure physics interleaved line-by-line with **trade resolution** (protected #9), candle-entry, boss approach, emotion. A throw freezes the game. Reordering can silently change *where a trade resolves* — the exact "chart lies / lost in 2 candles" bug class. | 4 |
| 2 | Render / `render()` / `drawHUD()` / `drawCandle()` | Reads **40+ module globals by bare name**; dense load-bearing magic numbers; **no pixel gate** (only human playtest catches layout breaks); `COLOR` must stay a projection of `window.CQ` (gates #12/#13). | 5 |
| 3 | Finn character (5 scattered renderers, no seam) | **Protected #1**, gate-frozen (#1/#2/#10), historically **most-churned** region; **text-scan gates break on move** unless re-pointed first; reads 25+ props of the movement-owned `turtle`. | 4 |
| 4 | Market `nextCandle` / candle generator (6088–6400) | Junction of **market × trade × curriculum**: reads `session`, `trade`, `setupSeq`, `LVL_SCRIPTS`; delegates to `tradeDrivenCandle`/`setupFlowCandle`/`scriptedCandle`. | 5 |
| 5 | Boot/auth orchestrator (`initSupabase` 2503–3372) | Runs at parse time yet **closes over ~20 globals declared later** (TDZ trap); IS the protected first-run funnel (#7); the `?fresh` block wipes all `cq_*` keys. | 4 |
| 3= | Trade (`commitTrade` 15136 / `resolveTrade` 16131 / Trade Clock 6367) | **Protected #9**; the lifecycle is **physically interleaved across four other subsystems' functions** — the Trade Clock lives inside `maintainCandles`, the drive hook inside `nextCandle`, setup-detection inside `onCandleEntered`, and resolution inside `update()`. `resolveTrade` is a ~335-line god-function; every authored-outcome clamp is scar tissue for a named shipped bug. `CQ.priceTouched` is the sole SL/TP truth. | **5** |
| 7 | `CFG` (3382) | **147–185 bare-name reads** spanning movement (protected #4) AND market; frozen wholesale by gate #10. Splitting it touches two protected systems. | 4 |

The **safe** regions (low risk, extract first): `CQOPS` (done), audio, `ContentLog`, the trailing IIFEs, render primitives (`rr`/`drawShell`/`fmt`), `LessonChart`, and the two already-gated frozen owners `window.CQ`/`window.CQREACH`.

---

## 4. Most-coupled systems (measured)

Fan-in / shared-state counts from a whole-file grep of `chart-quest.html`:

| Symbol / state | References | Role | Implication |
|---|---|---|---|
| `turtle.` | **1,018** | shared player body (movement-owned) | The dominant shared-mutable object; read by render, trade, boss, collectibles, tutorial. Must be **injected**, never re-closed-over. |
| `trade` | **971** | live-trade state object | Trade state permeates movement (`update` resolves it), render (SL/TP lines), audio (duck), lessons (`levelFlowBeat`). |
| `COLOR.` | **239** | palette (projection of `window.CQ`) | Every candle/HUD/portal renderer. Must keep deriving from `CQ.color` (gates #12/#13). |
| `session.` | **209** | run/progress state | Level clock read by curriculum, render goal-bar, market generator, boss gating. |
| `CFG.` | **185** | tunable config | Shared spine between **movement (#4)** and **market**; frozen by gate #10. |
| `player.` | **132** | shells/xp/rank | Trade payouts, HUD wallet, cloud sync. |
| `GameMusic.` | **110** | audio verbs | Broad but shallow — stable verb surface, try/caught. |
| `candles[` / `candleTop()` | 72 / 39 | terrain array + collision surface | Read by movement collision, render, collectibles, portals. |
| `conceptTier()` | ~40 | teach-order gate (#3) | High fan-in spine; read by render overlays, HUD, trade ticket, inspector, boss gating. |
| `rr()` | 89 | rounded-rect primitive | Highest fan-in *helper*; file-wide draw dependency. |
| `MONO`/`SANS` | 71+ | font constants | File-wide draw dependency. |
| `ContentLog.` | 28 | telemetry emit | Cross-cutting; ~9 emit sites across boss/trade/lesson/mini-game. |
| `CQREACH.` | 28 | collectible law owner (#14) | Clean seam. |

**Save-schema coupling (protected #6):** ~44 distinct `cq_*` localStorage keys + 3 legacy `shellTrade*_v1` keys. New state must use versioned `cq_*_v` keys; names are byte-frozen (veteran progression).

**Cross-block bare-name coupling (the extraction tax):** the trailing IIFE blocks reach into Block 3's globals *by bare lexical name* — `candles` (131 references from the trailing blocks), `level` (118), `player` (98), `bfState` (17), `turtle` (12). A true `<script src>` file cannot see those bindings, so any block that reads them (notably `MG` and `CQJournalTutorial`) needs a handful of Block-3 globals **promoted to `window` first** — which is why those two extract last among the otherwise-trivial trailing modules.

**The two coupling classes:**
- **Clean/structural** — `window.CQ`, `window.CQOPS`, `window.CQREACH`, `window.CQTrack`, `window.ContentLog`: deep-frozen IIFEs on `window`, consumed by name, each gate-locked. *These are the template.*
- **Diffuse/spine** — `CFG`, `turtle`, `trade`, `session`, `COLOR`, `conceptTier`, `nextCandle`: bare-name globals woven through every subsystem. *These are what make a naive file-split dangerous, and why Tier 2 is sequenced last.*

---

## 5. Subsystem ownership map

The 8 existing `window.CQ*` seams, plus every subsystem's de-facto owner symbol and its guarding gate.

| # | Subsystem | Owner today | Key symbols (line) | Gate(s) | Protected |
|---|---|---|---|---|---|
| A | Operational foundation | **`window.CQOPS`** ✅ modular | `ops/cq-ops.js` → spliced Block 2 | #19, #20, `cq-ops.test.js` | #6 (own keys) |
| B | Market / candle engine | **`window.CQ`** (frozen) | `CQ` (3554), `CFG` (3382), `COLOR` (3735), `nextCandle` (6088), `candleTop` (3875) | #12, #13, #16 | #4, #9 (via priceTouched) |
| C | Collectibles | **`window.CQREACH`** (frozen) | `CQREACH` (3928), `coins`/`boxes`/`wisdomPages` | #14 | — |
| D | Movement / physics / input / camera | *(no seam)* | `turtle` (6617), `update` (16727), `frame` (24860), `CFG` (3382), `resize` (3781) | #10 (CFG freeze) | **#4** |
| E | Rendering / HUD | *(no seam)* | `render` (19054), `drawHUD` (19984), `drawCandle` (17309), `rr` (17503) | #8, #12, #13 | #1/#3/#7 (visual) |
| F | Finn character | *(no seam)* | `drawTurtle` (18059), `drawFinnSprite` (17898), `FinnLife` (17734), `drawHeroFinn` (8087) | **#1, #2, #10** | **#1** |
| G | Curriculum & lessons | partial (`window.LessonChart`) | `conceptTier` (8631), `teach` (8692), `LESSONS` (8180), `LEVEL_FLOW` (8731), `LessonChart` (25887) | #4, #15 | **#3** |
| H | Mini-game engine | `MG` IIFE (Block 4, 25338) | `MG.REG`, `MG.run` | — | — |
| I | Trade | *(no seam)* | `commitTrade` (15136), `resolveTrade` (16131), `TRADE_CANDLE_MS` (6367), `tradeR` (15529) | #11 | **#9** |
| J | Boss | *(no seam)* | `openBoss` (14559), `bossRound` (13872), `launchRound` (13887), `bfState` | — | **#2** |
| K | Cinematics | `IntroCinematic`, `HomeMarketCeremony`, `BlockchainJourney` | `IntroCinematic` (2807/21768), `triggerIntroBoss` (21137), `drawTurtleFalling` (22342) | — | #7 |
| L | Audio | *(no seam — bare `GameMusic`/`CineAudio`)* | `GameMusic` (24217), `CineAudio` (22872) | *(none — recommend adding)* | #9 (TX-01), #2 |
| M | Boot / auth / faction / funnel | *(no seam — bare `initSupabase`)* | `initSupabase` (2503), `resolveAuth`, `_confirmFaction`, cloud sync | *(none — gap)* | **#7**, #6 |
| N | Telemetry | **`window.ContentLog`** | `ContentLog` (27028), `ContentDirector` | *(none for ContentLog — gap)* | — |
| O | Analytics | **`window.CQTrack`** | wraps commit/resolve/openBoss/introComplete | #20 | — |
| P | Closed-beta gate | **`window.CQBeta`** | wraps journal-unlock + introComplete | *(part of beta infra)* | — |
| Q | Event spacing | **`window.CQBEAT`** + in-Block-3 ledger | `CQBEAT.wrapMoment`, `eventClear`/`markEvent` (7938/7973) | **#18** | — |
| R | Journal tutorial | **`window.CQJournalTutorial`** | `claimPostBoss` | *(part of onboarding)* | — |

Legend: ✅ = already a standalone source module. **Bold** protected = frozen system (needs explicit approval to touch).

---

## 6. Dependency graph

Arrows point **from consumer → dependency** (i.e., "reads/calls"). Grouped by coupling tier.

```
                          ┌─────────────────────────────────────────┐
   PLATFORM (leaf,        │  window.CQOPS   (env/build/log/err/…)    │  ← nothing game-side depends on it yet
   already modular)       └─────────────────────────────────────────┘

   SHARED SPINES  ┌───────────┐   ┌───────────┐   ┌───────────────┐   ┌─────────────┐
   (read by many) │   CFG     │   │  COLOR    │   │  turtle       │   │ conceptTier │
                  │ (185 rds) │   │ (=CQ.color)│  │ (1018 rds)    │   │  (~40 rds)  │
                  └─────┬─────┘   └─────┬─────┘   └──────┬────────┘   └──────┬──────┘
        ┌───────────────┼───────────────┼────────────────┼──────────────────┼─────────────┐
        ▼               ▼               ▼                ▼                  ▼             ▼
   ┌─────────┐   ┌─────────────┐  ┌──────────┐   ┌──────────────┐   ┌────────────┐  ┌─────────┐
   │ MARKET  │◄──│  MOVEMENT   │  │  RENDER  │──►│    FINN      │   │  LESSONS   │  │  TRADE  │
   │ window. │   │ (turtle,    │  │ (render, │   │ (drawTurtle, │   │ (curriculum│  │ (commit/│
   │ CQ +    │   │ update,     │  │ drawHUD, │   │  FinnLife)   │   │  +LessonCh)│  │ resolve)│
   │ CQREACH │   │ frame,      │  │ drawCand)│   └──────┬───────┘   └─────┬──────┘  └────┬────┘
   └────┬────┘   │ camera,input│  └────┬─────┘          │                 │              │
        │        └──────┬──────┘       │                │                 │              │
        │  CQ.priceTouched│            │  COLOR/rr/MONO │  reads turtle   │ teach()/     │ CQ.priceTouched
        │  nextCandle     │            └────────────────┘  (injected)     │ levelFlowBeat│ nextCandle→tradeDriven
        │  ◄──────────────┘                                               │ ◄────────────┘ markEvent (CQBEAT)
        │
        ▼
   ┌──────────┐    ┌──────────┐    ┌───────────┐    ┌─────────┐    ┌──────────────┐
   │  BOSS    │───►│ MINI-GAME│    │ CINEMATICS│    │  AUDIO  │◄───│ (everyone:   │
   │ (openBoss│    │ (MG.REG/ │    │ (Intro/   │    │GameMusic│    │  boss,trade, │
   │ bfState) │    │  MG.run) │    │ Ceremony) │    │CineAudio│    │  movement,   │
   └────┬─────┘    └────┬─────┘    └─────┬─────┘    └─────────┘    │  lessons)    │
        │ MG.REG        │ LessonChart    │                          └──────────────┘
        │ GameMusic     │ (Block 4)      │ CineAudio
        ▼               ▼                ▼
   ┌──────────────────────────────────────────────────────────────────────────────┐
   │  BOOT / AUTH / FUNNEL (initSupabase) — orchestrates: page_load → IntroCinematic │
   │  → BlockchainJourney → HomeMarketCeremony → game; cloud sync; ContentLog        │
   └──────────────────────────────────────────────────────────────────────────────┘

   RUNTIME-PATCH SEAM (append-only, trailing Blocks 6–10; the ONLY real module boundary today):
   ┌──────────────┐  ┌───────────┐  ┌───────────┐  ┌────────────────────┐
   │ ContentLog   │  │ CQTrack   │  │  CQBeta   │  │  CQBEAT            │
   │ (telemetry)  │  │ wraps ►   │  │ wraps ►   │  │  wrapMoment ►      │
   └──────────────┘  │ commitTrade│ │ journal   │  │ openBoss, Intro,   │
                     │ resolveTr. │ │ Unlock +  │  │ Ceremony, MG.run   │
                     │ openBoss   │ │ introComp.│  └────────────────────┘
                     │ introComp. │ └───────────┘
                     └───────────┘   (each guarded by fn.__cqTrack/__cqBeta/__cqBeat;
                                      each block is independently deletable)
```

**Reading the graph:**
- The **spines** (`CFG`, `COLOR`, `turtle`, `conceptTier`) are read by nearly everything — they are what any file-split must handle first (either keep global, or inject).
- **Market ↔ Trade ↔ Movement ↔ Curriculum** form a tight cluster around `nextCandle`, `CQ.priceTouched`, and `update()` — the hardest knot (Tier 2).
- The **trailing-patch seam** is a clean, additive DAG — those come out first and easiest.

---

## 7. Recommended module structure

Authoring-time source tree under `src/` (new); the build splices each file into its marked region in `chart-quest.html`, then mirrors to `index.html` + `website/game.html`.

```
ops/
  cq-ops.js                    ✅ EXISTS — the template (window.CQOPS)
src/
  core/
    bootstrap.js               <head> boot-crash capture (Block 1)
    cfg.js                     CFG — shared config (Tier 2: later split cfg.movement / cfg.market)
    primitives.js              rr, drawShell, drawBar, drawCoinGlyph, fillTextShell, fmt/fmtPrice, MONO, SANS
  config/
    supabase-config.js         SUPA_URL/SUPA_ANON (dedupe the 2 verbatim copies at 2504 & 27029)
  market/
    cq-engine.js               window.CQ — frozen owner (gate #13)          [Tier 1]
    color.js                   COLOR projection of CQ (gates #12/#13)
    replay.js                  buildReplay, TRAINING_REPLAY, MARKET_DATA, NY_OPEN (gate #16)
    candle-generator.js        nextCandle, decorateCandleWicks, scripted/setupFlow/tradeDriven Candle
    market-identity.js         FACTION_CONFIG, HOME_MARKETS, applyHomeMarketSkin (gate #16)
    market-price.js            MarketPrice (live/cache/anchor)
  world/
    cq-reach.js                window.CQREACH — frozen owner (gate #14)     [Tier 1]
    collectibles.js            coins/boxes/wisdomPages spawn+update
    event-ledger.js            eventClear/eventClearAt/markEvent, market.eventIn (CQBEAT owner-side; gate #18)
  motion/
    cq-motion.js               window.CQMOVE — turtle, update() physics, verbs, camera, input   [Tier 2]
  character/
    finn.js                    window.CQFINN — drawTurtle/drawFinnSprite/FinnLife/drawHeroFinn (gates #1/#2/#10) [Tier 2]
  render/
    world-hud.js               render(), drawHUD(), drawCandle(), overlays (RenderState-injected) [Tier 2]
  lessons/
    curriculum.js              window.CQLESSON — conceptTier, teach, LESSONS, CURRICULUM, LEVEL_FLOW (gate #4)
    lesson-chart.js            window.CQCHART — LessonChart renderer (gate #15)  [Tier 1 — lift out of MG IIFE]
    mini-games.js              MG engine + MG.REG registry (Block 4)
  trade/
    trade.js                   window.CQTRADE — commitTrade, resolveTrade, tradeR, TRADE_CANDLE_MS (gate #11; protected #9)
    setups.js                  SETUP_LABEL/TERM/UNLOCK/WARMUP, pickSetupDir
  boss/
    boss.js                    window.CQBOSS — openBoss, bossRound, launchRound, bossWin, bossFinish, bfState
    boss-cinematics.js         playBossIntroCinematic, triggerIntroBoss, BossArena
  cinematics/
    intro-cinematic.js         IntroCinematic, drawTurtleFalling
    home-market-ceremony.js    HomeMarketCeremony
    blockchain-journey.js      BlockchainJourney (EXPERIMENTAL tutorial — has its own duplicate physics)
  audio/
    cq-audio.js                window.GameMusic + window.CineAudio (+ NEW audio-owner gate)   [Tier 1]
  boot/
    auth-entry.js              initSupabase, auth overlay, faction, first-run funnel, cloud sync  [Tier 2]
  telemetry/
    content-log.js             window.ContentLog, ContentDirector, SocialAgents               [Tier 1]
  features/                    (the trailing monkey-patch IIFEs — already modular in spirit)
    cq-track.js                window.CQTrack (UNIFY with website/assets/cq-track.js; gate #20)  [Tier 1]
    cq-beta.js                 window.CQBeta closed-beta gate + survey                          [Tier 1]
    cq-beat.js                 window.CQBEAT event-spacing wrapMoment (gate #18)                [Tier 1]
    journal-tutorial.js        window.CQJournalTutorial                                         [Tier 1]

scripts/
  cq-build.js  (or cq.sh build) generalize sync_ops.py: splice all src/ marked regions → chart-quest.html,
                                then mirror → index.html + website/game.html, then verify.
  module_sync_gate.js          generalize sync_ops.py --check: FAIL if any inlined region drifts from src/.
```

**Splice mechanics (unchanged from the proven `sync_ops.py`):** each region is delimited by `<!-- MODULE:name BEGIN … DO NOT EDIT HERE --> … <!-- MODULE:name END -->`; the build writes the inlined copy from `src/`; `--check` compares body-only (ignoring the deploy stamp) and fails on drift; a literal `</script>` in any source is hard-rejected (would truncate the game); the deploy stamp is written **before** the mirror is taken.

---

## 8. Recommended public APIs

The stable contract is the **`window.CQ*` namespace convention** already proven by `CQOPS`/`CQ`/`CQREACH`. Extend it to the un-seamed subsystems. Each owner is a deep-frozen IIFE, one `window.*` write, zero new top-level names, guarded against double-install — exactly the `CQOPS` recipe.

**Existing (keep verbatim — frozen):**
- `window.CQOPS` — `.env / .build / .log / .err / .flags / .health / .report() / .summary()`
- `window.CQ` — `.color .priceTouched .ohlc .floorBodyPrice .normalizeReplay .width .gap .wickWidth .minBodyPx .selfTest`
- `window.CQREACH` — `.place .validate .anchor .reanchor .audit .setWick .cullPast .surfaceAt .candleAt .launchSurfaceNear .envelope .region .own`
- `window.ContentLog` — `.emit .attachReplay .query .flushNow .stats .health .setEnabled`
- `window.CQTrack`, `window.CQBeta`, `window.CQBEAT`, `window.CQJournalTutorial` — the trailing patch owners.

**Proposed new seams (Tier 2, one per un-seamed subsystem):**

```js
// character/finn.js
window.CQFINN = {
  init({ ctx, turtle, COLOR, CFG, W, H, rr }),   // dependency injection at boot (the real work)
  draw(cameraX),                                  // == drawTurtle (sprite-first, procedural fallback)
  drawHero(f),                                    // == drawHeroFinn
  sprites,                                         // == FINN_SPRITES (shared owner for cinematics/academy)
  setEmotion(e), setDazed(t),                     // formalize shellEmotion + finnDazedT channels
  life: { lookToward(dir, hold), step(nowMs) },
};

// motion/cq-motion.js
window.CQMOVE = {
  spawn(candles, opts), update(dt, world) -> events,   // pure physics; emits {landed,enteredCandle,spinReleased}
  jump(), fireJetpack(), shellTuck(), startSpin(c), updateSpin(dt),
  faceRight(), turtle,                                  // single-owner body (read-mostly elsewhere)
  camera: { follow(dt, world) -> {camX,camY,camZoom}, enforceChartContinuity(baseCamX,dt) },
  viewport: { resize() -> {W,H,groundY,stageX,stageY} },
  input: { install(canvas, { overlayRouter }) },       // overlayRouter claims a gesture before movement
  config: CFG.movement,                                 // injected read-only slice
};

// lessons/curriculum.js + lessons/lesson-chart.js
window.CQLESSON = {
  conceptTier(key), conceptLabel(key), getCurriculum(level),
  teach(key), teachForced(key), pumpLessons(dt), levelFlowBeat(trades), dismissLesson(), bumpMaxHour(h),
  data: { CURRICULUM, CONCEPTS, LESSONS, QUIZ_QUESTIONS, LESSON_MASTERY, LEVEL_FLOW },
};
window.CQCHART = { mount(canvas, sceneKey), has(key), SCENES };   // the animated LessonChart (gate #15)

// trade/trade.js
window.CQTRADE = {
  commit(), resolve(result), r(),                       // == commitTrade/resolveTrade/tradeR (semantics FROZEN #9)
  CANDLE_MS,                                             // TRADE_CANDLE_MS clock (NEVER re-couple to traversal)
  setups: { LABEL, TERM, UNLOCK, pickDir() },
};

// boss/boss.js
window.CQBOSS = { open(level), round(), launch(), win(), finish(), state /* bfState */ };

// audio/cq-audio.js
window.GameMusic = { unlock, setMuted, play, boss(level, theme), stop, sting, roar, duckTo, isOn,
                     move: { jump, boost, dive, spin, spinRelease, recharge, land } };
window.CineAudio = { unlock, setMuted, glitch, whoosh, rise, chime, impact, coin, warp, appear, blip, stopAll };
```

**API design rules (from what already works):**
1. One `window.*` write per module; deep-freeze the owner object.
2. Zero new top-level `const`/`let`/`function` names (avoids the cross-block scope trap).
3. Load platform/leaf modules first (`CQOPS`-style) so later blocks can call them with no ordering dance.
4. Inject shared mutable state (`turtle`, `ctx`, `COLOR`, `CFG`) — never re-close-over it.
5. Every new seam gets an **owner-integrity gate** (the `#13`/`#19` pattern) locking owner + properties + no-second-copy.

---

## 9. Migration order

Dependency-aware, safest-first. Every step ends with `cq.sh ship` green + a browser playtest when observable. **All of this is post-beta.**

| Step | Work | Tier | Risk | Depends on |
|---|---|---|---|---|
| **0** | Build `cq.sh build` + `module_sync_gate.js` (generalize `sync_ops.py` to N regions). Wire `--check` into the ship gate. **Moves no game code.** | infra | **Very Low** | — |
| **1** | Extract already-clean seams verbatim (splice): `audio/cq-audio.js`, `telemetry/content-log.js`, `render/primitives.js`, `lessons/lesson-chart.js` (lift out of MG IIFE), `config/supabase-config.js` (dedupe). | 1 | **Low** | 0 |
| **2** | Extract the trailing patch IIFEs: `features/cq-track.js` (unify with `website/assets/cq-track.js`), `cq-beta.js`, `cq-beat.js`, `journal-tutorial.js`. | 1 | **Low** | 0 |
| **3** | Extract the gated frozen owners: `market/cq-engine.js` (`window.CQ`, re-point gate #13), `world/cq-reach.js` (gate #14). | 1 | **Low–Med** | 0, 1 |
| **4** | Extract large contiguous subsystems (splice, byte-identical): `boss/*`, `cinematics/*`, `market/replay.js`+`market-identity.js`+`market-price.js`, `world/collectibles.js`+`event-ledger.js`, `lessons/curriculum.js`, `trade/*`. | 1 | **Medium** | 3 |
| **5** | Extract `core/cfg.js` as a shared read-only config (still one global). Re-point gate #10 to hash the module. | 1→2 | **Medium** | 4 |
| **6** | **Tier-2 decouple** `character/finn.js` (`window.CQFINN`, inject `turtle`/`ctx`; re-point gates #1/#2/#10 **before** moving the marker strings). | 2 | **High** | 1, 5 |
| **7** | **Tier-2 decouple** `render/world-hud.js` (RenderState injection; hoist the two impurities — `session.startBal` seed and `firstTradeGuide.t` clock — into `update()`). | 2 | **High** | 1, 6 |
| **8** | **Tier-2 decouple** `motion/cq-motion.js`: wrap in `window.CQMOVE` with bare-name shims, then split `update()` into pure `physicsStep` (emits events) vs `gameStep` (trade resolution, candle-entry, boss approach — stays with trade/curriculum). Make `BlockchainJourney` import the shared verbs instead of its 470-line duplicate. | 2 | **Highest** | 5, 6, 7 |
| **9** | **Tier-2 decouple** `trade/trade.js` behind `window.CQTRADE` (protected #9; the `gameStep` split from step 8 lands the resolution frontier here cleanly). | 2 | **High** | 8 |
| **10** | **Tier-2 decouple** `boot/auth-entry.js`: convert the parse-time IIFE's ~20 late-bound closures to injected deps; keep funnel order. Add a funnel-handoff gate. | 2 | **High** | 4 |
| **11** | Split `core/cfg.js` into `cfg.movement` / `cfg.market` (coordinate both owners; relax gate #10 to hash each slice). | 2 | **Medium** | 5, 8 |

**Rule:** never more than one Tier-2 module in flight; each gets its own branch, its own gate, its own on-device playtest. Steps 0–4 (all Tier-1) can proceed briskly; steps 6–11 are deliberate and individually founder-approved (they touch protected systems).

---

## 10. Estimated productivity gains

The gains are concrete and measurable against today's friction.

| Dimension | Today | After Tier-1 (steps 0–4) | After Tier-2 (steps 6–11) |
|---|---|---|---|
| **AI edit context** | Must load/scan a 30,058-line file to touch anything | ~500–2,000-line module per edit | Same, plus a testable seam |
| **Merge conflicts** (top-3 churn files) | Every edit hand-touches the 22,907-line Block 3 across 3 mirrors | Module-local; mirrors become **build output** (see §11) | Near-eliminated |
| **Concurrent AI sessions** | Collide on Block 3 (documented clobbers/retractions) | Different modules never textually conflict | Safe by construction |
| **Testability** | Only `cq-ops.test.js` exists (1 subsystem) | Each seam VM-testable like CQOPS | Pure `physicsStep`, `priceTouched`, `conceptTier` unit-tested |
| **Onboarding a 2nd engineer** | Orient from canon in ~1 hr; edit in fear | Edit a named module with a gate | Edit with tests + a seam contract |
| **Blast radius** | A throw in `update`/`render` freezes the game | Same (until step 8) | Error-boundary-per-module becomes feasible |

**Estimated AI productivity improvement per module** (subjective, relative to editing it inside the monolith today):

| Module | Tier | AI productivity gain | Rationale |
|---|---|---|---|
| audio, ContentLog, trailing IIFEs, primitives | 1 | **+High** (2–3×) | Small, self-contained; context collapses from 30k→<1k lines; zero merge risk |
| LessonChart, `CQ`, `CQREACH` | 1 | **+Med–High** | Already-clean seams; gate re-point is mechanical |
| boss, cinematics, curriculum, trade, market sub-modules | 1 | **+Medium** | Big but contiguous; splice is byte-identical |
| Finn, render, movement, boot | 2 | **+Med (delayed)** | High upfront cost (injection/splitting `update`), high payoff once done — these are the most-churned regions |

**Aggregate:** the churn data shows **beta (35) + trade (19) + market (15) + finn (14)** dominate commit volume. Tier-1 immediately de-risks the *market* and *trade-adjacent telemetry* churn; Tier-2 eventually de-risks *finn* and *movement* — the historically most-regression-prone regions. A conservative estimate: **~50–70% reduction in "time lost to context + merge + regression"** on the game file after Tier-1, rising further after Tier-2.

---

## 11. Merge-conflict reduction analysis

**Why the monolith maximizes conflicts (measured):** 190 commits total; the three highest-churn files in the entire repo are the **mirror triad** — `index.html` (108), `chart-quest.html` (107), `website/game.html` (57) — each further shadowed by a `sw.js` cache bump (40). git's merge unit is the hunk; with every subsystem packed into one 22,907-line `<script>`, edits from different sessions land near each other and collide where the same edits split across real files would not. The **mirror mandate triples the blast radius** (one logical change = a 3-file simultaneous rewrite, gate #8), and the **cross-block scope trap** means a textually-clean merge can still crash silently.

**Documented scars (from git history):** "merge audit — three concurrent sessions, one outstanding conflict" (`be1b938`); a self-caused clobber repaired (`cf82995`); two explicit retractions (`b652034`, `4278627`); a stale analytics client shipped to returning testers (`9582ca7`); and gate #20 itself was **born to catch cross-session divergence** because `CQTrack` exists twice (inlined + `website/assets/cq-track.js`) and the copies drift.

**Today's workaround is avoidance, not resolution:** new features append a self-contained trailing IIFE that monkey-patches at runtime, so no existing line is touched. That works for *bolt-ons* but not for changing *actual game logic* in Block 3.

**How the blueprint reduces conflicts:**

1. **Mirrors become build output.** After step 0, `index.html` and `website/game.html` are regenerated by `cq.sh build` from `chart-quest.html`. They stop being hand-edited/hand-merged — removing the two single largest sources of churn-collision (the two mirrors = 165 of the top-3's commits). *This alone is a large win and is Tier-1-trivial.*
2. **Module-local edits.** A feature that touches audio edits `src/audio/cq-audio.js`; a feature that touches lessons edits `src/lessons/curriculum.js`. Two concurrent sessions on different subsystems now edit **different files** — git-mergeable by construction, zero hunk overlap.
3. **The scope trap closes per-module.** Each extracted owner has zero new top-level names (the `CQOPS` rule), so a duplicate-declaration crash can't be introduced by a cross-session merge of two different modules.
4. **Per-module drift gates** replace the manual "did I mirror correctly" vigilance.

**Estimated reduction:** for same-file hunk collisions on the game logic, **~80–90%** after Tier-1 (module-local source + generated mirrors), because the only remaining shared-file edits are the spines (`cfg.js`, `primitives.js`) — small, rarely-churned, and gate-locked. The remaining conflicts move to *semantic* review (does the merged behavior make sense) rather than *textual* firefighting.

---

## 12. Recommended post-beta refactor schedule

Phased over the next development year. Each phase is a coherent, independently-shippable unit that leaves the game byte-identical to the player (Tier 1) or behind a single approved seam (Tier 2).

| Phase | Theme | Steps (§9) | Tier | Risk | AI gain | Timing |
|---|---|---|---|---|---|---|
| **P0** | **Enable the splice build** | 0 | infra | Very Low | Foundation | Immediately post-beta |
| **P1** | **Harvest the clean seams** | 1, 2 | 1 | Low | High | Sprint 1 |
| **P2** | **Extract the gated owners** | 3 | 1 | Low–Med | Med–High | Sprint 1–2 |
| **P3** | **Mirrors → build output** | (from 0/1) | 1 | Low | **Big merge win** | Sprint 1 (fold into P1) |
| **P4** | **Split the big contiguous subsystems** | 4, 5 | 1 | Medium | Medium | Sprint 2–3 |
| **P5** | **Finn seam** (`CQFINN`) | 6 | 2 | High | Med (delayed) | Quarter 2, dedicated |
| **P6** | **Render-state injection** | 7 | 2 | High | Medium | Quarter 2, dedicated |
| **P7** | **Motion seam + `update()` split** | 8 | 2 | Highest | High | Quarter 3, dedicated |
| **P8** | **Trade + boot seams** | 9, 10 | 2 | High | High | Quarter 3–4 |
| **P9** | **CFG split + error boundaries** | 11 (+ frame/update try-catch) | 2 | Medium | Med | Quarter 4 |

**Companion cleanups (from Phase 1's deferred list, low-risk, fold in anywhere):** retire the stale `chart-quest.min.html`; `git rm --cached` the ~250 MB committed video from history (coordinate a force-push window); split `ChartQuestQA/` (Swift) and `website/` into their own repos so the game tree is game-only; reconcile `docs/finn-canon/` with `finn_canon.md`.

---

## Risk analysis (per extraction)

For each proposed module: **Why · Benefits · Risks · Dependencies · Rollback · Regression risk · AI productivity improvement.** Ordered by migration step.

### Step 0 — `cq.sh build` + drift gate (the splice tool)
- **Why:** Nothing can be modularized under the single-file design law without a splice/reassemble step. `sync_ops.py` already proves it for one module.
- **Benefits:** Unlocks every subsequent step; makes mirrors build output; per-module drift detection.
- **Risks:** A bug in the splice could corrupt `chart-quest.html`. Mitigated: `sync_ops.py`'s guards (reject literal `</script>`, body-only `--check`, stamp-before-mirror) are already written and proven.
- **Dependencies:** none.
- **Rollback:** delete the tool; nothing has moved yet.
- **Regression risk:** **None** (no game code changes; the tool is validated by re-emitting the current file and asserting byte-identity).
- **AI productivity:** Foundation — enables all gains below.

### Step 1 — audio / ContentLog / primitives / LessonChart / supabase-config
- **Why:** These are the least-coupled, most-contiguous regions (audio difficulty 2, ContentLog 2, primitives 1–2). Ideal pilots.
- **Benefits:** Immediate context collapse; proves the splice pipeline on real subsystems; unifies the duplicated `SUPA_URL`/`SUPA_ANON`.
- **Risks:** Audio is consumed by **bare name** across Blocks 3–10 (~64 `GameMusic` + ~33 `CineAudio` sites) — publishing on `window` would suddenly fire three currently-**dead** guards (`29304/29314/29463`); decide that explicitly. LessonChart is a closure-local inside the MG IIFE reachable only via the `window` assignment at 26799 — lift it without breaking every animated lesson (gate #15).
- **Dependencies:** Step 0.
- **Rollback:** re-inline the region (delete the `src/` file, paste back); byte-identical.
- **Regression risk:** **Low.** Splice is byte-identical; the only behavioral decisions (dead audio guards, mute unification) are opt-in, not automatic.
- **AI productivity:** **+High.**

### Step 2 — trailing IIFEs (CQTrack / CQBeta / CQBEAT / journal-tutorial)
- **Why:** Already self-contained and additive; `CQTrack` already has a canonical twin (`website/assets/cq-track.js`) that drift-gate #20 exists to reconcile.
- **Benefits:** Removes the twin-drift class entirely (one source); the trailing seam becomes real files.
- **Risks:** These monkey-patch `commitTrade`/`resolveTrade`/`openBoss`/`introComplete` at runtime — the wrap guards (`__cqTrack`/`__cqBeta`/`__cqBeat`) and load order must be preserved.
- **Dependencies:** Step 0.
- **Rollback:** re-inline; byte-identical.
- **Regression risk:** **Low** (gate #20 already guards CQTrack parity).
- **AI productivity:** **+High.**

### Step 3 — `window.CQ` / `window.CQREACH` (gated frozen owners)
- **Why:** Already deep-frozen IIFEs on `window`, each locked by a gate (#13/#14). Near-trivial to lift.
- **Benefits:** The market/collectible owners become editable in isolation; the gates travel with the modules.
- **Risks:** `CQREACH.reanchor()` is called from `resize()` **before** the `CQREACH` const initializes, via a `if (window.CQREACH)` TDZ guard (3808) — preserve ordering. `COLOR` must keep deriving from `CQ.color` (gates #12/#13). `MARKET_DATA` identity-lock (all markets, one terrain) must hold (gate #16).
- **Dependencies:** Steps 0, 1.
- **Rollback:** re-inline; gates catch any drift.
- **Regression risk:** **Low–Medium.**
- **AI productivity:** **+Med–High.**

### Step 4 — boss / cinematics / market sub-modules / collectibles / event-ledger / curriculum / trade (contiguous splice)
- **Why:** Large but contiguous regions; a byte-identical splice moves *source location* only.
- **Benefits:** The bulk of Block 3 becomes navigable modules; boss/trade/curriculum churn localizes.
- **Risks:** Curriculum's `conceptTier` (~40 reads, protected #3) and trade's `resolveTrade` (protected #9) are semantically frozen — the splice must not alter a line. The trade generator (`nextCandle`→`tradeDrivenCandle`) straddles market×trade×curriculum — split the *files* but leave the *interface* intact until Tier 2.
- **Boss is itself two-tier** (difficulty 4 overall). **Tier-1, do here:** `BossArena` (a closed IIFE depending only on `#bfArena`+`COLOR`) and the video cinematic trio (`playBossIntroCinematic`/`Outro`/`Flinch` + registries, each with self-contained black-screen fallbacks — builds 316–354 are scar tissue for near-misses). **Defer to Tier-2:** the exam engine + `bfState` + `BOSS_CAST`/`rebuildBossesFromCast`, because `openBoss`/`bossWin`/`playBossIntroCinematic`/`playBossOutroCinematic` are **function-declaration globals that CQTrack (window-property) and CQBEAT (bare-name) monkey-patch** — converting them to `const`/exports silently breaks gates #18/#20 with no error. Also: run `rebuildBossesFromCast()` at init before any consumer read; and the **dead legacy round path** (`renderBossRound`/`bfAnswer`/`bfTrendTap` + `BOSSES[].rounds`) is pinned by gates #5/#10 — don't drop it without updating `verify.js` in the same change.
- **Dependencies:** Step 3.
- **Rollback:** re-inline per module; byte-identical.
- **Regression risk:** **Medium** (protected-system-adjacent; requires `CQ_ALLOW_PROTECTED=1` + playtest even though bytes are identical, because the gates diff against HEAD).
- **AI productivity:** **+Medium.**

### Step 5 — `core/cfg.js` (shared config, still global)
- **Why:** `CFG` is the 185-read spine shared by movement (#4) and market. Isolating the file (before splitting it) is a prerequisite for the Tier-2 movement work.
- **Benefits:** One obvious home for tuning; gate #10 re-points to hash the module.
- **Risks:** A botched move silently breaks movement feel (the most-scrutinized subsystem). `CFG` is frozen wholesale by gate #10 — needs `CQ_ALLOW_PROTECTED=1`.
- **Dependencies:** Step 4.
- **Rollback:** re-inline.
- **Regression risk:** **Medium.**
- **AI productivity:** **+Medium** (enables Tier 2).

### Step 6 — `character/finn.js` (`window.CQFINN`, Tier 2)
- **Why:** Finn is the last big subsystem with **no seam** and the **most-churned** region historically.
- **Benefits:** A namespaced owner; formalized `shellEmotion`/`finnDazedT` channels; injected `turtle` (no more render/physics fighting over one object).
- **Risks:** **Gates #1/#2/#10 text-scan `chart-quest.html` for literal markers** (`run: 'finn/run.png'`, `STATIC-LEG WALK`, zero `_rigOn`/`drawFinnRigLeg` counts). Moving those strings FAILS the gates unless re-pointed **first**. Sprite/procedural parity must hold; `FinnLife.step` must run exactly once/frame. Protected #1.
- **Dependencies:** Steps 1, 5.
- **Rollback:** re-inline + re-point gates back.
- **Regression risk:** **High** (visual; only human playtest fully catches it).
- **AI productivity:** **+Med (delayed)** — high once done.

### Step 7 — `render/world-hud.js` (RenderState injection, Tier 2)
- **Why:** Render reads 40+ globals by bare name (difficulty 5). Injection is required for a true seam.
- **Benefits:** A single `RenderState` contract; testable pure-output layer.
- **Risks:** Dense load-bearing magic numbers with **no pixel gate**; two hidden impurities (`session.startBal` seed at 19614, `firstTradeGuide.t` clock at 19806) must be hoisted into `update()` first or they break. `COLOR` from `CQ` (gates #12/#13). Price↔screen math is duplicated in 3 places — keep in lockstep.
- **Dependencies:** Steps 1, 6.
- **Rollback:** re-inline.
- **Regression risk:** **High.**
- **AI productivity:** **+Medium.**

### Step 8 — `motion/cq-motion.js` + `update()` split (Tier 2, highest risk)
- **Why:** `update()` fuses physics with trade resolution/candle-entry/boss/emotion — the central knot. Nothing downstream fully decouples until this is split.
- **Benefits:** A pure `physicsStep` (unit-testable, emits events) vs a `gameStep` (trade/curriculum). Kills the `BlockchainJourney` 470-line duplicate.
- **Risks:** Reordering changes **when `maxSeenCandleId` advances → where a trade resolves** (the "chart lies / lost in 2 candles" bug class). Protected #4 **and** #9. Bare-name shims for `turtle`/`faceRight`/`spawnTurtle` needed for Blocks 4–10. Camera is *derived* and re-derived inline in coordinate math — converge or pixels drift.
- **Dependencies:** Steps 5, 6, 7.
- **Rollback:** re-inline (large; keep the branch small and reversible).
- **Regression risk:** **Highest.**
- **AI productivity:** **+High** (unblocks trade + testability).

### Step 9 — `trade/trade.js` (`window.CQTRADE`, Tier 2) — **difficulty 5, the hardest module**
- **Why:** With the `gameStep` split (step 8), the resolution frontier lands here cleanly. This is the highest-stakes frozen doctrine in the game (protected #9) and, tied with render, the single hardest extraction.
- **Benefits:** Isolated, testable trade lifecycle; `CQ.priceTouched` remains the single SL/TP truth.
- **Approach (order matters):** (a) **write a machine-checked invariant gate FIRST** — win never touches `slH`, loss never touches `tpH`, resolution only via `CQ.priceTouched` — so the frozen semantics are locked before any code moves (extends gate #11). (b) Carve the **pure trade-math core** (`authoredTutorialOutcome`, band recentre, `tradeDrivenCandle` phase machine, `tradeTouchCheck`, `calcLevels`) behind `window.CQTRADE`, leaving VFX/journal/telemetry/lesson side effects as **injected callbacks**. (c) Lift the Trade Clock out of `maintainCandles` and the drive hook out of `nextCandle` into `CQTRADE.tickClock`/`driveCandle`, preserving the `_busy`/`_liveTrade` guards exactly. (d) Keep `commitTrade`/`resolveTrade` as **global aliases** so the CQTrack Block-8 wrap (gate #20) and DOM bindings survive.
- **Risks:** Protected #9 (outcome/setup/entry-stop-target semantics frozen); every authored-outcome clamp carries a scar-tissue comment for a named shipped bug (build-282 fast-loss, build-320 giant-spear early-resolve, T-002 chart-lies) — reordering can silently resurrect one. Resolution is keyed to Finn's live position + `maxSeenCandleId`; moving it out of `update()` risks re-coupling felt duration to traversal (the exact build-298 regression the Trade Clock exists to prevent). TX-01 audio parity depends on the per-frame duck mapping staying in `frame()`.
- **Dependencies:** Step 8.
- **Rollback:** re-inline.
- **Regression risk:** **Very High** (difficulty 5; protected #9; interleaved across three shared functions).
- **AI productivity:** **+High.**

### Step 10 — `boot/auth-entry.js` (Tier 2)
- **Why:** The parse-time `initSupabase` IIFE closes over ~20 later-declared globals (TDZ trap) and IS the protected funnel (#7).
- **Benefits:** Explicit dependency injection; a funnel-handoff gate (none exists today — a real gap).
- **Risks:** Evaluation-order changes + the cross-block scope trap; the `?fresh` key-wipe ordering; duplicated SUPA config; no gate guards the funnel today, so a silent break would ship.
- **Dependencies:** Step 4.
- **Rollback:** re-inline.
- **Regression risk:** **High.**
- **AI productivity:** **+High.**

### Step 11 — split `CFG` into movement/market slices (Tier 2)
- **Why:** Final decoupling of the last shared spine.
- **Benefits:** Movement and market tune independently; gate #10 hashes each slice.
- **Risks:** Coordinated change across two owners; protected #4.
- **Dependencies:** Steps 5, 8.
- **Rollback:** merge the slices back.
- **Regression risk:** **Medium.**
- **AI productivity:** **+Medium.**

---

## Non-negotiable constraints (any executor must honor)

1. **Single self-contained document.** The shipped file must run from `file://` with no external `<script src>` (beyond the existing Supabase CDN). All modularity is authoring-time + build-time splice.
2. **Byte-identical mirror.** `chart-quest.html` == `index.html` == `website/game.html` (gate #8). After step 0, the mirrors are **generated**, never hand-edited.
3. **Cross-script-block scope trap.** No new top-level `const`/`let`/`function` names when extracting; use the one-`window.*`-write IIFE pattern.
4. **9 protected systems frozen.** Finn art, boss roster, lesson order, movement model, monetization, save schema, UI flow, the mirror, trading semantics — each Tier-2 step touching one needs explicit founder approval + `CQ_ALLOW_PROTECTED=1` + playtest.
5. **21 gates must stay green.** Extractions that move gate-scanned markers (esp. Finn #1/#2/#10, CQ #13, CQREACH #14, CQOPS #19, CQTrack #20) must **re-point the gate before moving the code**.
6. **Save keys are byte-frozen.** ~44 `cq_*` keys + 3 legacy `shellTrade*`; new state uses versioned `cq_*_v` keys.
7. **The Trade Clock stays a clock.** `TRADE_CANDLE_MS` pacing must never re-couple to traversal/footsteps.

---

## Appendix A — Method & provenance

- **Read-only.** No production file was modified. The only file created is this document.
- **Evidence base:** a 15-agent read-only analysis workflow (12 subsystem deep-dives + coupling/churn/infra probes). First pass: 9 agents completed and the other 6 (trading, boss, loop, trailing, coupling, infra) hit a subagent session-limit and were filled by direct grep/read. The workflow was then **re-run to completion — 15/15 agents, 0 errors** — and the full-fidelity output was reconciled against the hand-filled sections. The reconciliation *confirmed* every hand-filled section and refined four points now reflected above: trade extraction is difficulty **5** (interleaved across four functions), there are **two** shipping splice prototypes (`sync_ops.py`+`sync_track.py`) not one, cross-block bare-name coupling is quantified (candles 131 / level 118 / player 98 refs from trailing blocks), and boss splits into a clean Tier-1 half (arena+cinematics) and a monkey-patch-pinned Tier-2 core. All line numbers verified against the current build-351 working tree.
- **Grounding docs:** `docs/canon/` (architecture_map, system_inventory, protected_systems, regression_checklist, dev_workflow); `ARCHITECTURE_PHASE1_AUDIT_2026-07-09.md`; `scripts/verify.js`, `scripts/sync_ops.py`, `ops/cq-ops.js`.
- **Churn data:** 190 commits; top-3 files = the mirror triad (108/107/57). Subsystem churn rank: beta 35 > trade 19 > market 15 > gate 14 ≈ finn 14 > deploy 12 > boss 10.

## Appendix B — Verification note

This is a documentation-only sprint. There is **no build change to verify** and **no QR/preview** to produce — the game is byte-for-byte unchanged (still build 351, the founder's in-flight tree). The success criterion "no player can tell this work occurred" is satisfied by construction: nothing was executed against `chart-quest.html`.
