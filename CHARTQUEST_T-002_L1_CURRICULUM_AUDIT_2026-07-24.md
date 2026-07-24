# CHARTQUEST — T-002 PRE-WORK: LEVEL 1 CURRICULUM AUDIT

**Date:** 2026-07-24
**Scope:** Founder correction to T-002 — audit the Level 1 educational sequence before tuning trade quality.
**Status:** AUDIT COMPLETE — NO CODE CHANGED. T-001 UNTOUCHED.
**Verdict:** The curriculum is **closer to correct than the founder thinks** (3 trades exist, not 2).
But the audit found a **P0 that outranks the curriculum question**: the source file is currently broken,
and the source and the deployed mirror have silently diverged while both claiming "build 295".

---

## 0. STOP-THE-LINE FINDING (read this first)

### 0.1 `chart-quest.html` throws on every trade — the game is currently unshippable

`TMB` is referenced **10 times** and defined **zero times**.

| Where | Line | Code |
|---|---|---|
| `commitTrade` | `chart-quest.html:12229` | `const _Rwant = TMB * 6;` |
| `commitTrade` | `chart-quest.html:12271` | `trade._bodyFloor = Math.max(6, Math.min(TMB, _R0 * 0.18));` |
| `tradeDrivenCandle` | `chart-quest.html:3615, 3628, 3633, 3651, 3655, 3701, 3704, 3705` | 8 further uses |

`TRADE_MIN_BODY = 22` is defined at `chart-quest.html:3538` and is **never referenced**. This is a
half-finished rename: `TRADE_MIN_BODY` → `TMB`, with the `const TMB` declaration never written.

**Verified at runtime** (served from `scripts/serve_nocache.py`, loaded in a real browser):

```
TMB            -> ReferenceError: TMB is not defined
TRADE_MIN_BODY -> 22
tradeDrivenCandle({_l1Outcome:'win'}) -> ReferenceError: TMB is not defined
```

**Reproduced consequence** — a real `commitTrade()` call with a normal intro ticket
(`slDist: 14`, `tpDist: 28`, `session.level = 1`, `introFlow.awaitingTrade = true`):

```json
{ "commitThrew": true,
  "commitError": "ReferenceError: TMB is not defined",
  "tradeAfter": { "entryH": 533, "slH": 519, "tpH": 561,
                  "stopDist": 14, "targetDist": 28,
                  "_l1Outcome": "UNSET", "path": "UNSET", "_bodyFloor": "UNSET",
                  "setupType": "UNSET", "grade": "UNSET" },
  "firstTradeGuide": "NOT SET (walkthrough skipped)",
  "pendingStillOpen": true }
```

The throw lands at `:12229`, which is **before** every line that makes an L1 trade an L1 trade. Everything
below it is skipped:

- `trade._l1Outcome = 'win'` (`:12235`) — the authored outcome
- the widened 2:1 band (`:12236-12237`) — so the trade keeps the **raw ticket stop of 14 height units**
  while one candle body is 22px. **A single candle is 157% of the entire stop distance.**
- the reachability clamps (`:12264-12265`)
- `trade._bodyFloor` (`:12271`)
- Finn's repositioning onto the entry line (`:12277`)
- `trade.setupType` / `confluence` / `grade` / `quality` (`:12279-12285`)
- `trade.path = []` (`:12286`) — **the replay film is never recorded**
- `closePanel()` (`:12287`) — the ticket panel never closes
- `clearBeginnerSetup()` (`:12290`)
- **`firstTradeGuide = {step:0,t:0}; paused = true;` (`:12295-12296`)** — the entire
  ENTRY→STOP→TARGET first-trade walkthrough never runs

Then `nextCandle()` (`:3770`) calls `tradeDrivenCandle()`, which throws again. Measured behaviour with a
live trade, pumping 600 real frames:

```json
{ "tradeOpen": true, "finnMoved": 13, "candlesAppended": 0,
  "verdict": "CHART FROZEN while trade is live" }
```

The exception is swallowed by a `try` inside `frame()`, so there is no console explosion and no crash —
**the chart just silently stops producing candles for the duration of the trade.**

### 0.2 The source and the deployed mirror are different games with the same build number

| | `chart-quest.html` (source of truth) | `index.html` (deployed mirror) |
|---|---|---|
| BUILD_TAG | `build 295 — T-002 CORRECTION…` | `build 295 — T-002 CORRECTION…` (identical text) |
| Lines | 22,132 | 22,114 |
| `TMB` occurrences | 10 (all undefined) | 0 |
| Drive body floor | `TMB` (broken) | `TRADE_MIN_BODY` (works) |
| `_rd0` formula | `max(24, min(TMB*6, _RmaxRoom))` `:12228-12230` | `max(TRADE_MIN_BODY*2.6, min(max(55,\|entry−sl\|), roomTP/2, roomSL/1.2))` `:12218` |
| `trade._bodyFloor` | present (never assigned — throws first) | **absent entirely** |
| `_lastTestedId` per-trade cursor | present | present |
| Opens a trade | **throws, chart freezes** | works |

`git show HEAD:chart-quest.html | grep -c TMB` → **0**. Neither `TMB` nor `TRADE_MIN_BODY` exists in
HEAD (build 271). Builds 272–295 are entirely uncommitted working-tree changes, so there is no
per-build history to bisect.

**Which file does the founder actually play?** `scripts/cq.sh:63`:

```
P="${2:-8795}"; URL="http://$IP:$P/chart-quest.html?fresh=1&mute=1"
```

The QR/LAN test URL serves **`chart-quest.html`** — the broken file. The mirror is what gets deployed to
the web. So there are two divergent games in play and the QR points at the broken one.

**Implication for the founder's playtest report:** the described behaviour (trade #1 stopped out in ~3
candles; trade #2 played out at 7.5–8/10) is **not producible by the current source**, which freezes the
chart instead. The founder played a build from *before* the `TMB` rename — behaviourally the mirror.
All trade-quality feedback in the T-002 ticket therefore describes the **mirror's** trade code, not the
source's.

### 0.3 The build-295 verification claims in `BUILD_TAG` did not test the shipped file

`BUILD_TAG` (`chart-quest.html:2744`) claims: *"resolver 12/12 … drive 4,800 sims across R and direction
with 0 wrong-line resolutions, 0 hangs, min body 22px … duration p10 21-32 candles."*

Those numbers cannot have come from `chart-quest.html`, where `tradeDrivenCandle` throws on its first
call. They came from a Node harness that supplied its own `TMB`, or from the pre-rename code. **A
verification harness that does not load the actual shipped file is not verification.** This is the
process defect behind the whole build-288→295 sequence: each build asserted a fix it never observed in
the running game.

I re-ran the equivalent characterisation **against the running mirror**, using the real
`tradeDrivenCandle` and the real `CQ.priceTouched` resolver, 40 reps × 5 entry heights × both outcomes:

| outcome | entry | 1R (px) | min | p10 | median | max | wrong-line |
|---|---|---|---|---|---|---|---|
| win | 100 | 12 | 31 | 38 | 47 | 62 | 0 |
| win | 120 | 32 | 26 | 33 | 43 | 58 | 0 |
| win | 160 | 69 | 21 | 30 | 42 | 59 | 0 |
| win | 260 | 69 | 26 | 28 | 38 | 68 | 0 |
| win | 450 | 69 | 23 | 24 | 36 | 64 | 0 |
| loss | 100 | 12 | 22 | 30 | 34 | 63 | 0 |
| loss | 120 | 32 | 26 | 30 | 34 | 67 | 0 |
| loss | 160 | 57 | 18 | 21 | 30 | 60 | 0 |
| loss | 260 | 57 | 21 | 23 | 32 | 91 | 0 |
| loss | 450 | 57 | 18 | 24 | 28 | 52 | 0 |

**The mirror's drive is healthy in isolation**: 18–91 candles, zero wrong-line resolutions. So the
three-candle stop-out is **not** produced by the drive maths on its own. It requires one of the paths in
§7 below.

---

## 1. THE ACTUAL LEVEL 1 SEQUENCE TODAY

Traced from a cold start (`localStorage` empty / `?fresh=1`). Line numbers are `chart-quest.html`;
the mirror is behaviourally identical for the whole intro chain (`INTRO_TRADES_NEEDED = 3` in both:
source `:13412`, mirror `:13394`).

| # | Beat | Trigger | Line |
|---|---|---|---|
| 1 | Opening cinematic (Market Maker) | `introCine.active` | `:19871` |
| 2 | "⚔ ESCAPE THE MARKET" skip card (3 goals → CONTINUE) | `#introSkipCard` / `#iscGo` | DOM |
| 3 | Greeting card (auto-advance 3s) | `candleAcademy.active` | `:4441` |
| 4 | Free play + contextual control coach (jump → boost → tuck) | `coach` | `:4503` |
| 5 | At intro candle **40**: `GREEN vs RED` discovery portal | `:12860` | `:12860` |
| 6 | **GREEN + RED lesson** (animated `'candle'` scene) | `beginGreenRedLearn` → `openIntroLesson('candle')` | `:17580-17589` |
| 7 | **Green/red practice** (Trader View) | `openConceptPractice('greenred')` | `:17590` |
| 8 | **Prediction BET ×2** ("will it end GREEN or RED?") — *not a trade* | `triggerPredictionBet`, `introFlow.bet.cards` | `:4482-4492` |
| 9 | Explore gap (30 candles) → `🔎 MOMENTUM LESSON` portal | `beginIntroFirstTrade` → `armExplore('momentum', 30)` | `:17627-17628` |
| 10 | **Momentum lesson + practice** | `beginConceptLesson` | `:17615-17624` |
| 11 | Hard gate: "I'M READY →" card | `armFirstGuidedTrade` → `showFirstTradeReady` | `:17630-17646` |
| 12 | **[TRADE 1]** + full ENTRY→STOP→TARGET walkthrough | `firstTradeGuide` set in `commitTrade` | `:12294-12296` |
| 13 | Explore gap → **pullback lesson + practice** | `teachThenNextTrade('pullback')` | `:13334, :13341` |
| 14 | **[TRADE 2]** | `waitThenNextTrade` → `setupCountdown = 2; genSetupIn = 2` | `:13376-13380` |
| 15 | Explore gap → **confirmation lesson + practice** | `teachThenNextTrade('confirmation')` | `:13334` |
| 16 | **[TRADE 3]** | same as 14 | `:13376-13380` |
| 17 | `firstTradeDone = true` → `waitThenIntroBoss` | `:13319-13324` | `:13319` |
| 18 | `beginIntroProve` — reading gate **dissolved** (`INTRO_PROVE_NEEDED = 0`), pure-gameplay final stretch (46 candles) | `:13411, :13414, :12878-12880` | |
| 19 | Gambler boss portal → **The Gambler** | `spawnBossPortal` → `triggerIntroBoss` → `openBoss(0)` | `:12885, :17651` |

---

## 2. HOW MANY TRADES ACTUALLY EXIST

**Three.** `INTRO_TRADES_NEEDED = 3` (`:13412`), enforced in `resolveTrade`:

```js
if (introFlow.active && introFlow.awaitingTrade && !introFlow.firstTradeDone) {
  introFlow.tradesDone = (introFlow.tradesDone || 0) + 1;
  if (introFlow.tradesDone >= INTRO_TRADES_NEEDED) { introFlow.firstTradeDone = true; … waitThenIntroBoss(); }
  else { … teachThenNextTrade(introFlow.tradesDone === 1 ? 'pullback' : 'confirmation', _left); }
}
```
`chart-quest.html:13317-13338`

The anti-stall paths were checked and **none of them skips a trade**:

- `tradeWaitCandles > 80` (`:12841`) **re-surfaces** the setup; it does not advance the counter.
- The wall-clock anti-freeze watchdog (`:19954-19972`) explicitly re-arms a fresh setup — its comment
  reads *"HARD RULE — never skip to the boss"* and the code matches.
- `teachThenNextTrade` / `waitThenNextTrade` / `waitThenIntroBoss` 18-second `capped` fallbacks
  (`:13345, :13369, :13394`) only stop *waiting for a clear screen*; they do not touch `tradesDone`.

### Why did the founder count two?

**Ranked, and I could not settle this statically — it needs one runtime observation.**

1. **Most likely — the founder was not on a fresh profile.** If `localStorage.cq_played` is set,
   `introFlow.active = false` (`:4451`) and the *entire* guided chain (beats 5–17) is bypassed.
   There is no green/red lesson, no prediction bet, no "I'M READY" gate, and no guided-trade counter —
   trades arrive from the ordinary beginner-setup framework at whatever cadence the level produces, and
   the boss fires off the normal hour flow. Two trades before a boss is an entirely plausible count in
   that mode. This also explains why the founder's trade #1 had no ENTRY→STOP→TARGET walkthrough.
2. **The prediction bet is being counted as a trade by the code's design intent but not by the founder**
   — or vice versa. It is not a trade (`introFlow.bet`, `:4482`), but it is the beat where the player
   first "calls" the market, and the code comments describe it as *"the engineered first WIN"*
   (`:17626`). If the founder counted it, they would perceive an extra beat, not a missing one — so this
   works against hypothesis 1 and is listed for completeness.
3. **A trade resolved while `awaitingTrade` was false and therefore was not counted.** `armExplore` sets
   `awaitingTrade = false` (`:17606`), and `waitThenNextTrade` re-asserts it (`:13376`). A trade taken
   *during* an explore gap resolves without incrementing `tradesDone` — the player experiences a trade
   the counter ignores. This makes the perceived count **higher** than 3, not lower, so it does not
   explain "two", but it is a real defect and is listed in §7.

**The observation that settles it.** Mid-playthrough, in the console:

```js
JSON.stringify({played: localStorage.getItem('cq_played'), active: introFlow.active,
                phase: introFlow.phase, tradesDone: introFlow.tradesDone,
                gate: tradeGate.completed, level: session.level})
```

If `played` is `"1"` / `active` is `false`, hypothesis 1 is confirmed and **the curriculum is not
broken — the founder's session simply never entered it.**

---

## 3. WHERE EACH TRADE BEGINS

| Trade | Armed by | Line | Mechanism |
|---|---|---|---|
| 1 | `armFirstGuidedTrade()` | `:17631-17646` | hard-pauses the world, shows "I'M READY →", then `setupCountdown = 2; genSetupIn = 2; market.eventIn = 4; showTradeIncoming()` |
| 2 | `waitThenNextTrade(left)` after the pullback lesson | `:13363-13385` | re-asserts `awaitingTrade = true`, same `setupCountdown/genSetupIn = 2` |
| 3 | `waitThenNextTrade(left)` after the confirmation lesson | same | same |

All three are armed identically. **Trade 1 is the only one that is different in kind**: it alone gets
`firstTradeGuide` (`:12294`, gated on `!introFlow.tradesDone`).

---

## 4. AUTHORED VS PROCEDURAL

| Aspect | Trades 1–3 (guided intro) | Post-intro L1 trades |
|---|---|---|
| **Setup** (the chart pattern) | **Procedural**, from the beginner-setup framework (`setupSeq` → `setupFlowCandle`, `:3776`), merely *hastened* to 2 candles | Procedural, same framework |
| **Outcome** | **Authored — always WIN.** `trade._l1Outcome = 'win'` hard-coded at `:12235` | **Authored** via `authoredTutorialOutcome()` (`:12133`) — L1 always `'win'`; the single designed First Loss is L2 trade 2 |
| **Price path** | **Authored.** `tradeDrivenCandle()` drives dip(0.72R) → hold → recover(+0.20R) → run→TP (`:3583-3595`) | Same drive — `nextCandle` routes **every** live L1–3 trade through it (`:3768-3771`) |
| **Band** | `_rd0`-derived, TP `2R`, SL `1.2R` (`:12236`) | TP `2R`, SL `1.0R` (`:12252`) |
| **Duration** | Emergent from the phase arc; `MIN_TRADE_CANDLES = 30` (`:3534`) is the design intent | same |

**Nothing in the Level 1 intro is procedurally-outcomed.** Every L1 trade is an authored win on an
authored path over a procedural setup. Law 4 ("the chart should create the duration") is *architecturally*
satisfied in the mirror — the old hidden standoff timer was genuinely removed (`:3658-3661`) and the
measured durations in §0.3 come from the arc, not a timer.

**One authored-path escape hatch remains**: `if (_introTrade && sIdx >= 0)` at `:12231`. If Finn is
airborne or between candles at commit, `sIdx < 0` and the trade falls to the `else if (session.level <= 3)`
branch — still authored, but with a **1.0R stop instead of 1.2R** and via `authoredTutorialOutcome()`.
At L1 that still returns `'win'`, so the outcome is safe; the band is 20% tighter than designed.

---

## 5. WHICH TRADE THE FOUNDER ACTUALLY EXPERIENCED FIRST

**Undetermined, and I will not guess.** What I can state:

- The founder's trade #1 had **no ENTRY→STOP→TARGET walkthrough** described. That walkthrough is
  unconditional on guided trade 1 (`:12294`). Its absence means either (a) it was not a guided intro
  trade (`introFlow.active === false` — hypothesis 1 in §2), or (b) `commitTrade` threw before reaching
  `:12295` (the `TMB` bug — but that build also freezes the chart, which the founder did not report).
- Their trade #2 rating of 7.5–8/10 with "enough movement to create some emotion" is consistent with the
  mirror's measured 26–47 candle win arc (§0.3).

Both facts point the same way: **the founder was playing the mirror's trade code, and most likely
outside the guided intro.** §2's console check settles it in one line.

---

## 6. INTENDED VS ACTUAL — THE DELTA TABLE

| # | Founder's intended beat | What the code does today | Verdict |
|---|---|---|---|
| 1 | Introduction | Cinematic → skip card → greeting → coached free play | **MATCH** |
| 2 | Green Candle Lesson | `openIntroLesson('candle')` — **one combined lesson teaching green AND red**, then one `'greenred'` practice | **MERGED** — 2 intended beats are 1 |
| 3 | Red Candle Lesson | (same beat as above) | **MERGED** |
| — | *(not in the intended list)* | **Prediction BET ×2** — "will it end green or red?" | **EXTRA** |
| 4 | **FIRST TRADE** | Comes *after* the momentum lesson, not before | **OUT OF ORDER** |
| 5 | Momentum Lesson | Taught **before** trade 1 (`beginIntroFirstTrade` → `armExplore('momentum')`, `:17627`) | **OUT OF ORDER** — founder wants it *after* trade 1 |
| 6 | SECOND TRADE | Trade 2, after the **pullback** lesson | **MATCH** (position), different concept |
| 7 | Additional lesson(s) | **confirmation** lesson + practice | **MATCH** |
| 8 | THIRD TRADE | Trade 3 | **MATCH** |
| 9 | Boss | `beginIntroProve` (reading gate dissolved) → final stretch → The Gambler | **MATCH** |

**The trade count is NOT wrong. Three trades exist and always have.** Two real ordering deltas:

- **D1 — green and red are one lesson, not two.** Splitting them is a content change to
  `openIntroLesson` scenes, which lives inside the **T-001-locked LessonChart SCENES table**. This needs
  an explicit founder decision (see §9).
- **D2 — momentum is taught before trade 1; the founder wants trade 1 first.** This is the substantive
  curriculum fix, and it is **cheap and T-001-safe**: `beginIntroFirstTrade` (`:17627`) currently reads
  `armExplore('momentum', '🔎 MOMENTUM LESSON', 30, armFirstGuidedTrade)`. Moving momentum to the
  trade-1→trade-2 slot means calling `armFirstGuidedTrade` directly and shifting the concept sequence in
  `teachThenNextTrade` (`:13334`) from `pullback, confirmation` to `momentum, pullback`.

  **Design-constitution check (LEARN→PRACTICE→APPLY→TEST, "never test the untaught"):** trade 1 would
  then be applied with only green/red taught. That is defensible — the guided trade is an authored win
  with a full walkthrough — but it *is* a deliberate relaxation of the never-test-the-untaught rule and
  therefore **the founder's call, not mine.**

---

## 7. TRADE-TRUTH DEFECTS FOUND (T-002 core)

Ranked by likelihood of being what the founder saw.

1. **`TMB` ReferenceError — P0, blocks everything.** §0.1. Not the founder's reported bug (it freezes
   the chart rather than fast-losing), but it makes the current source unplayable and must be fixed
   before any T-002 observation is meaningful.

2. **The pre-entry candle overhang is drawn but never resolvable.** `maintainCandles` generates candles
   out to `cameraX + W + 200` (`:4033`), so at commit time the array already holds several candles ahead
   of Finn that were produced by the **free-roam generator with no knowledge of the stop or target**.
   The per-trade cursor (`:13870`) initialises to `candles[candles.length-1].id` — the newest *generated*
   candle — while the resolver frontier is `maxSeenCandleId + 2` (`:13871`). Every candle between the
   frontier and the array end is therefore **permanently skipped by the resolver**, yet each becomes
   visible as Finn walks into it. For the first several candles of every trade, price can visibly cross
   the stop or the target and nothing happens. **This is the strongest candidate for "price appeared to
   violate TP or SL"** and it is a live LAW 1 violation.

3. **Post-decoration wick mutation.** `maybeSpawnWisdomPage` raises `c.wick` at `:9522` and `:9546`
   *after* `decorateCandleWicks` has applied its live-trade clamp (`:3941-3950`), and after the resolver's
   cursor may already have passed that candle. `maybeMegaCandle` (`:9451`) correctly guards on a live
   trade; the wisdom-page path does not carry the same guard. A grown wick can therefore render across a
   line that was never tested.

4. **Uncounted trades during explore gaps.** `armExplore` sets `awaitingTrade = false` (`:17606`). A
   trade opened and resolved in that window does not increment `tradesDone` (`:13317` requires
   `awaitingTrade`). The player trades; the curriculum does not notice.

5. **`sIdx < 0` drops trade 1 out of its designed band.** §4. Outcome stays safe at L1; the stop lands
   20% tighter than authored.

6. **Known-and-unfixed, self-declared in `BUILD_TAG`:** the resolver frontier advances only as Finn
   walks, so a player who stands still during a trade halts the chart and the trade waits indefinitely.
   Self-consistent (a fogged candle is not visible, so it must not resolve) but it is traversal coupling
   and remains a founder decision.

### Duplicate authority — current state

The build-288→295 work did **genuinely** collapse this. There is now one resolver:

```js
function tradeTouchCheck(c) {
  const bar = { open: c.open, h: c.h, wick: c.wick, wick2: c.wick2 };
  if (CQ.priceTouched(bar, trade.slH, trade.dir, 'sl')) { resolveTrade('loss'); return true; }
  if (CQ.priceTouched(bar, trade.tpH, trade.dir, 'tp')) { resolveTrade('win');  return true; }
  return false;
}
```
`chart-quest.html:3552-3558` — reading through `window.CQ`, the Phase 2A owner, on the *same candle
object the renderer draws*. `lastPrice` (the HUD), `trade.path` (the replay film) and the touch test are
all written inside the one frontier loop (`:13872-13879`), so HUD, replay and resolution cannot disagree.
The old `_finnTP` / `_finnSL` foot-position deciders and the `trade._held >= 90` backstop are gone.

**Remaining duplicate authority is not in the resolver — it is upstream, in who may mutate a candle
after the resolver has passed it** (defects 2 and 3 above).

---

## 8. THE T-001 LOCK BOUNDARY

Verified by an adversarial line-by-line read (this was the one workflow lens that completed before the
session limit; both of its claims survived refutation with independent verification).

**T-001 generator core — contiguous, `chart-quest.html:3130-3457`:**

| Symbol | Lines |
|---|---|
| `LVL_SCRIPTS` | 3130-3134 |
| T-001 header comment | 3135-3191 |
| `MKT` | 3192-3260 |
| `MKT_TUNE` | 3265-3269 (doc comment 3261-3264) |
| `scriptedCandle` | 3270-3457 |

Confirmed: no column-0 token anywhere in 3271-3456, so 3457 is genuinely `scriptedCandle`'s closing
brace and nothing foreign is spliced into the range. Exactly **one** definition of each symbol
file-wide — no redeclaration, no shadowing, all inside the single `<script>` block 1609-20266.

**T-001 also owns, outside that range:**

| System | Lines |
|---|---|
| `decorateCandleWicks` (the WICK LAW) | 3889-3952 (governing comment 3878-3888; T-001 law block 3911-3938) |
| Opening chart history (44 candles) | inside `initCandles`, 3974-3993 — calls `scriptedCandle` directly, bypassing setup/trade routing |
| LessonChart `SCENES` | (referenced by `openIntroLesson`) |
| `CONCEPT_PRACTICE` | (referenced by `openConceptPractice`) |
| `window.CQ` | Phase 2A frozen owner, `:2617-2637+` |

**Scope caveat found during verification:** `maybeMegaCandle` / `maybeSpawnWisdomPage` raise `c.wick` at
`:9451, :9486, :9522, :9546` *after* `decorateCandleWicks` runs, so the WICK LAW's "a wick ONLY when it
earned one" is **not enforced end-to-end**. This is pre-existing and outside T-002's remit — flagging it,
not touching it.

**Proof command:**

```bash
node scripts/verify.js
```

Gate #10 (protected systems unchanged vs HEAD), #11 (L1-3 fast-loss guard), #12
(`candle_language_gate.js`), #13 (`cq_owner_gate.js`). Note that #7 and #10 diff **against HEAD**, which
is build 271 — with 272–295 uncommitted, these gates are currently comparing ~24 builds of drift at once
and their signal is correspondingly weak.

**The surface T-002 may legally modify:** `commitTrade`, `resolveTrade`, `tradeDrivenCandle`,
`tradeTouchCheck`, the frontier loop in `update()`, the `introFlow` sequencer functions
(`armFirstGuidedTrade`, `teachThenNextTrade`, `waitThenNextTrade`, `beginIntroFirstTrade`,
`armExplore`), and the HUD/replay renderers. **Nothing in §8's tables.**

---

## 9. UPDATED T-002 IMPLEMENTATION PLAN

Ordered. Each step is independently verifiable in the running game — no step is "done" on a Node
harness alone.

**Step 0 — UNBREAK AND RECONCILE (P0, blocks everything).**
Decide which `_rd0` formula is canonical (source's `TMB*6` intent vs mirror's shipped `*2.6` version),
declare `TMB` (or revert the rename), and re-mirror. Then `node scripts/verify.js` + open a real trade in
a real browser and confirm candles advance. **Until this is done, no trade observation from the QR URL
means anything.**

**Step 0b — commit the 24-build backlog.** With HEAD at build 271 and 295 in the working tree, every
regression gate that diffs against HEAD is blind. Nothing can be bisected.

**Step 1 — CONFIRM THE FOUNDER'S SESSION MODE.** Run the §2 console check during a playtest. If
`introFlow.active === false`, the perceived "2 trades" is a **fresh-state problem, not a curriculum
problem**, and the curriculum work below shrinks to D2 only.

**Step 2 — CURRICULUM ORDER (D2).** Move momentum from before trade 1 to between trades 1 and 2:
`beginIntroFirstTrade` (`:17627`) calls `armFirstGuidedTrade` directly; `teachThenNextTrade`'s concept
sequence (`:13334`) becomes `momentum` then `pullback`. **Requires founder sign-off** on relaxing
never-test-the-untaught for trade 1 (§6).

**Step 3 — D1 (green/red split) — FOUNDER DECISION REQUIRED, NOT ACTIONED.** Splitting one lesson into
two edits the T-001-locked SCENES table. I will not touch it without an explicit instruction naming
T-001.

**Step 4 — LAW 1: kill the pre-entry overhang (defect 2).** The set of candles that can end a trade must
equal the set the player can see — including the ones generated before entry that become visible during
it. Either regenerate the overhang through the drive at commit, or extend the cursor rule so any
*visible* candle is testable regardless of when it was generated.

**Step 5 — LAW 1: guard the wisdom-page wick mutation (defect 3)** with the same live-trade guard
`maybeMegaCandle` already carries.

**Step 6 — count every trade the player takes (defect 4).**

**Step 7 — only then tune trade FEEL** against Laws 2 and 3, measured in the running game.

---

## 10. WHAT I DID NOT DO

- **No code was changed.** Not one line, in any file.
- **T-001 was not touched, read-only.** No edit to `scriptedCandle`, `MKT`, `MKT_TUNE`,
  `decorateCandleWicks`, `LVL_SCRIPTS`, the opening history, LessonChart `SCENES`, `CONCEPT_PRACTICE`,
  or `window.CQ`.
- **The chart generator was not modified.**
- **I did not complete a full cold-start playthrough to the boss.** The multi-agent audit was killed
  ~45% through by a session usage limit (12 of 15 agents failed; only the T-001-boundary lens finished),
  and the browser playthrough was cut short by the same limit. §2's trade-count question and §5's
  "which trade was first" are therefore answered as **ranked hypotheses with a one-line runtime test**,
  not as settled fact. I am flagging that rather than presenting inference as observation.

---

**AUDIT COMPLETE**

**Awaiting Founder Verification**

**NOT PASS**
