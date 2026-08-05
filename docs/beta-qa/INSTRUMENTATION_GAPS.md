# The two blind funnel stages — CLOSED in build 343

**Status: APPLIED.** `play_clicked` and `movement_tutorial_completed` ship in build 343. This
document is now the record of what was done and, more usefully, of what the first version of it
got wrong.

---

## ⚠ Two things the first version of this document asserted, both false

**1. "There is no movement tutorial system to hook."** Wrong. It was concluded from
`grep "movementTutorial\|movement_tutorial"` — camelCase and underscore only. The phrase
**"movement tutorial"** with a space appears ten times in `chart-quest.html` and names a real,
merged, first-play-mandatory system.

**2. "The repo copy of `beta-ingest` is stale; patch from the deployed source."** Wrong, and
wrong in the dangerous direction — it would have sent someone hand-editing a live function to
create the very drift it warned about. `diff` of the repo file against `get_edge_function` is
empty. **Patch the repo file and deploy it.**

A third error was caught before it shipped: the proposed movement watcher keyed on
`introFlow.phase` leaving `'run'`. `armExplore()` resets `phase = 'run'` between *every* lesson,
so it is the general free-play state — the watcher would have fired seconds in and meant nothing.

---

## What `movement_tutorial_completed` actually watches

`window.BlockchainJourney` — "Journey Through the Blockchain" — which every first-play tester
runs between the cinematic and chart selection. `chart-quest.html:2804` says so outright:

```js
// THE FUNNEL: cinematic → MOVEMENT TUTORIAL → chart selection → gameplay.
IntroCinematic.start(function (key) { _runMovementTutorial(key); });
```

Its curriculum is three jumps, three boosts, three smashes (`TEACH_STAGES`), on `_S.tStage`.

**`_S.tCelebDone` alone is a lie.** `teachSkipToPortal()` sets it with **zero reps performed**
when a player merely walks to the end of the world, so a walker is indistinguishable from
someone who mastered every verb. Two guards, both required:

1. **`tStage` seen at 1 or 2 while `tCelebDone` is false.** `teachCredit()` advances one stage at
   a time; the skip jumps straight to 3 and can never leave it at 1 or 2. Not `=== 2` exactly —
   that samples a single transient state and would silently miss a player who cleared boost
   between two 500 ms polls.
2. **`tCelebDone` true while `phase === 'grow'`.** The phase machine is forward-only
   (wake → grow → reveal → done) and the retirement fires at `reveal`.

The Skip button and the 160 s watchdog both reach `done` without touching `tCelebDone`, so
neither qualifies. Verified against all four paths plus a fast player: **10/10 checks**.

## What `play_clicked` can and cannot see

Delegated, **capture phase**, over `a[href*="play.html"], [data-game]` — plus `auxclick`,
because middle-click does not fire `click`.

`[data-game]` matters: the headline control at `index.html:1403` is a `<button>`, not an anchor,
and the site's own internal links point at it. An anchor-only selector would have missed the one
route the landing page actually funnels people through.

**Blind by construction** to `bosses.html` and `courses.html` (neither loads `cq-track.js`), to
the installed-PWA "Play now" shortcut, and to anyone opening `/play` directly. Those testers
appear from a later stage. The number is a floor.

---

## Why both stages are NON-GATING

This is the part that is easy to get wrong and produces a confident, useless number.

The monotonic pass credits every stage **below** a player's furthest. So a *gating* `play_click`
would be credited to everyone who reached the tutorial — reading as an exact clone of the
tutorial count, at 100% kept and 0 drop, **concealing the landing→play gap it was added to
measure**. And it would not look broken: the dashboard's "check instrumentation" affordance only
fires at `players === 0`, which would never be true.

`movement` is non-gating for a second, independent reason: the Journey is **skippable**, so
monotonic credit would hand completions to players who skipped it.

Non-gating stages therefore report the **raw** count of testers who fired the event, show a share
of landing, and claim **no** transition (`kept_from_prev_pct`, `drop_players`, `drop_pct` are all
null). The gating chain closes over them, so `landing → tutorial` is still measured end to end.

---

## Deploy order — the gateway must go first

`beta-ingest` drops unknown names **silently**. Deploy it before the client, or every emitted row
is discarded while the stage reads as a healthy clone of its neighbour.

| # | Change | Where |
|---|---|---|
| 1 | `EVENT_NAMES` += both names, **deploy** | `supabase/functions/beta-ingest/index.ts` → v5 ✅ |
| 2 | `NAMES`, `ONCE`, `STAGES` += both | `website/assets/cq-track.js` ✅ |
| 3 | play listener + `watchMovementTutorial()` | `website/assets/cq-track.js` ✅ |
| 4 | `sync_track.py` → `cq.sh mirror` → **`cq.sh site`** | build 343 ✅ |
| 5 | FUNNEL: `instrumented: true, gating: false` | `beta-qa/beta-model.js` ✅ |
| 6 | non-gating rendering | `beta-qa.html` ✅ |
| 7 | gating-aware invariants + fixture coverage | `beta-qa/parity.js` ✅ |

Step 4's `cq.sh site` is easy to forget — `website/game.html` was left a build behind at 342,
so the deployed game silently lacked that build's work until this pass caught it.

## Known lag — the SQL engine

`beta_funnel_stages` still marks both stages `instrumented = false`, so **live mode continues to
render them as "not instrumented"**. That is deliberate: teaching the SQL engine non-gating needs
six coordinated changes to `beta_model()`'s funnel CTEs, and half-applying it (the flag without
the logic) would produce exactly the clone bug in live mode. Snapshot mode — the only mode usable
until an admin account exists — is fully correct.

Verified after the change: the gateway accepts both names and still rejects an unknown one
(`{"error":"No valid rows"}`).
