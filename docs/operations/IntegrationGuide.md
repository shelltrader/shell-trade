# ChartQuest — Ops Integration Guide

**How future work adopts `window.CQOPS`, one small step at a time.**
Architecture and API reference → [OperationalArchitecture.md](OperationalArchitecture.md).

---

## The adoption rule

> **Adopt at the call site you are already editing. Never open a file just to migrate it.**

Phase 1 deliberately migrated **nothing**. There is no migration ticket, no sweep, no "adopt CQOPS
everywhere" sprint. Every large refactor in this project's history has cost a regression, and the
beta is live. Adoption is a side effect of work you were doing anyway.

Three consequences:

1. If you are fixing a bug in `resolveTrade`, you may wrap that one handler. You may not also
   migrate the six neighbouring functions.
2. An adopted call site must be **strictly smaller or equal** in behaviour. `CQOPS.err.guard`
   returns a fallback where a `try/catch` returned a fallback. It does not change what the player
   sees.
3. Adoption is reversible. Deleting the CQOPS block restores the previous behaviour of every
   adopted site, because every primitive degrades to "do what the code did before".

## Rule zero: it is always safe to call

`window.CQOPS` is defined in `<head>`, before every other script, so it always exists by the time
any game code runs. Belt-and-braces for code that also ships on the marketing site (where it does
not exist):

```js
if (window.CQOPS) CQOPS.log.info('boss', 'intro started');
```

Inside `chart-quest.html` the guard is unnecessary. On `website/` pages, use it.

---

## Recipe 1 — a failure that must not break the frame

**Before**

```js
function drawBadge() {
  const el = document.getElementById('badge');
  el.textContent = shells;            // throws if #badge is gone
}
```

**After**

```js
const drawBadge = CQOPS.err.wrap('ui:badge', function () {
  const el = document.getElementById('badge');
  el.textContent = shells;
});
```

The throw is logged once with a scope, counted in `runtime_error`, and the frame keeps rendering.

## Recipe 2 — a cinematic that should skip rather than stall

**Before**

```js
try { playBossIntroCinematic(); } catch (e) {}     // silent — the reason is gone forever
```

**After**

```js
CQOPS.err.guard('cinematic:bossIntro', playBossIntroCinematic);
```

Same player experience — the cinematic is skipped and play continues — but the reason is now in
`CQOPS.report()` instead of nowhere. Pair it with the asset check when the clip is a file:

```js
video.onerror = function () {
  CQOPS.health.asset(video.currentSrc || video.src, false);
  playNext();
};
```

> This is the exact failure that hid the 404'd boss cinematics for ~20 builds. The passive
> capture-phase listener now catches `<video>`/`<img>` load failures **without** this change; the
> explicit call adds the game's own context to the record.

## Recipe 3 — a network call that must not lose data

**Before**

```js
fetch(url, opts).then(r => { if (r.ok) rows.length = 0; });
```

**After**

```js
const q = CQOPS.err.queue('survey', { limit: 50 });
q.push(answers);                                  // durable the moment it is captured

CQOPS.err.retry('survey', () => post(q.peek(50)), { tries: 3, baseMs: 600 })
  .then(() => q.drain(() => Promise.resolve(true)))
  .catch(() => CQOPS.err.notify('survey'));       // "Your answers are safe…"
```

Two invariants come free: items leave the queue only on a **confirmed** success, and they survive
the tab closing.

## Recipe 4 — reading configuration

**Before**

```js
const ENDPOINT = 'https://ymxppzhczvmiuoncuqqu.supabase.co/functions/v1/beta-ingest';
```

**After**

```js
const ENDPOINT = CQOPS.env.get('analyticsEndpoint');
```

Adding staging then becomes a two-line change in `ENV_CONFIG` and nowhere else. Today all three
environments resolve to the same value, so this substitution is behaviour-preserving **right now** —
which is exactly why it is safe to do opportunistically.

## Recipe 5 — wiring a feature flag (the one that needs care)

The five product flags are **declared but unwired**. Wiring one is two lines, and the second line
is not optional:

```js
CQOPS.flags.markWired('enableBossCinematics');           // ← without this the report lies

if (CQOPS.flags.on('enableBossCinematics')) {
  playBossIntroCinematic();
}
```

Checklist before you wire a flag:

- [ ] The default in `FLAG_DEFAULTS` equals **today's shipped behaviour**. (Gate #19 enforces this
      for the four `true` product flags.)
- [ ] `markWired()` is called at the same site.
- [ ] The `false` branch is a **complete, tested path**, not an untested skip. A flag whose off-state
      has never been played is a landmine, not a control.
- [ ] Turning it off does not skip a **taught** concept. The design constitution
      (LEARN→PRACTICE→APPLY→TEST) outranks a flag: never test the untaught.
- [ ] If the flag gates player-facing content, say so in the `BUILD_TAG`.

## Recipe 6 — guarding a state machine

```js
const BOSS_STATES = { idle: ['intro'], intro: ['round'], round: ['round', 'win', 'lose'],
                      win: ['idle'], lose: ['idle'] };

if (!CQOPS.health.transition('boss', prev, next, BOSS_STATES)) {
  CQOPS.log.warn('boss', 'refusing illegal transition ' + prev + ' → ' + next);
  return;                                 // or continue — the call only REPORTS
}
```

`transition()` returns the verdict and records illegal moves; it never changes control flow on its
own. Start by only reporting, exactly as CQBEAT shipped in observe mode before it enforced.

## Recipe 7 — a new logging destination (no gameplay change at all)

```js
CQOPS.log.addSink(function (rec) {
  if (rec.lvl >= CQOPS.log.levels.error) dashboardFeed.push(rec);
});
```

This is how the Founder Dashboard and remote logging arrive. No call site changes; a sink that
throws is swallowed and can never reach the game.

---

## Suggested order (not a commitment)

Sequenced so each step is provable on its own and nothing depends on the step after it.

| # | Step | Why first | Risk |
|---|---|---|---|
| 1 | Point CQTrack at `CQOPS.env.get('analyticsEndpoint')` and `CQOPS.build` | Behaviour-identical today; kills the duplicated endpoint literal and the second `BUILD_TAG` parser | very low |
| 2 | Route CQTrack's failed POSTs through `health.analytics()` | The 403 class of incident becomes visible on the client | very low |
| 3 | Move the survey's submit path onto `err.queue()` + `err.retry()` | The highest-value data in the beta is the one with no durability today | low |
| 4 | Add `health.asset()` to the boss/journal cinematic `onerror` paths | Adds the game's own context to what the passive listener already catches | low |
| 5 | Feed `CQOPS.log.addSink` into the Founder Dashboard | Turns the ring buffer into something the founder can read | low |
| 6 | Wire `enableBetaSurvey`, then `enableAnalytics` | The two flags whose off-state is genuinely simple | medium — needs Recipe 5's checklist |
| 7 | Wire `enableBossCinematics`, `enableJournalDiscovery` | Both gate taught content; needs a design decision, not just a code change | medium/high |

Steps 1–5 are behaviour-preserving. Steps 6–7 are product decisions and should be their own tickets.

## What NOT to do

- **Do not** open files purely to migrate them.
- **Do not** wrap `update()`, `frame()`, or any per-frame hot path in `err.guard`. A `try/catch`
  per frame is a real cost and a swallowed per-frame throw is a hang, not a graceful failure.
  Guard the *handlers* those loops call, not the loops.
- **Do not** add a second config literal "just for now". `ENV_CONFIG` is the only place.
- **Do not** log inside a render loop. Use `CQOPS.log.once()` if you must.
- **Do not** wire a flag without `markWired()`. The report would claim coverage that does not exist,
  which is worse than no flag at all.
- **Do not** hand-edit the inlined copy in `chart-quest.html`. Gate #19 fails on drift.

## Checklist for any change that touches this layer

1. Edit `ops/cq-ops.js` (never the inlined copy).
2. `node ops/cq-ops.test.js` — 70 behavioural assertions. Gate #19 cannot catch a behaviour change.
3. `scripts/cq.sh ops` — splice + stamp.
4. `scripts/cq.sh ship` — mirror, site, full gate. It STOPS on FAIL.
5. Bump `BUILD_TAG`. **No apostrophes** — it is a single-quoted JS literal, and gate #3a is what
   catches you.
6. Verify in the browser: `?ops&mute=1`, check `CQOPS.report()` and a clean console.
7. Stage by explicit path. Never `git add -A`.
