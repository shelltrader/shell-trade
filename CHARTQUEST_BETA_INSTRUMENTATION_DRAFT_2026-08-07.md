# Beta Instrumentation Draft — `?dev` exclusion + `tutorial_step_reached` breadcrumb

**Date:** 2026-08-07 · **Status:** DRAFT for review — **no shipping file modified yet.**
**Why:** Founder Report 2026-08-07, recommendations #1 (dev sessions contaminate the funnel) and #4 (we can see *that* players stall in the tutorial, not *where*).

> **Feature-freeze compliance.** Both changes are **analytics-only**. No gameplay, lesson, boss, trade, movement, art, or UI behavior changes. The breadcrumb is emitted by the **existing telemetry poller** (`watchMovementTutorial`), touching **no game call site** — the same merge-safe "poll, never hook" pattern the file already uses. Justified by a beta finding, as the freeze allows.

## Pre-flight

| | |
|---|---|
| **Files** | `website/assets/cq-track.js` (canonical client), `supabase/functions/beta-ingest/index.ts` (edge fn), `scripts/founder_report.py` (report tool). Then generated: `chart-quest.html` + mirrors via `sync_track.py`. |
| **Non-scope** | No change to gameplay, `BlockchainJourney`, the tutorial itself, survey, or DB schema (`props` is pass-through jsonb). |
| **Protected systems** | None touched. (Analytics is not a protected system; save-key `cq_bt_*` convention preserved.) |
| **Gates** | #20 (CQTrack inlined == canonical) forces `sync_track.py` after editing the client; #8 (mirror) forces `cq.sh mirror`. Both are part of the runbook below. |
| **Regression risk** | **Low.** `event()` is try/caught and non-throwing; a new name unknown to the edge fn is dropped silently (hence the deploy-order rule). Rollback = revert the three source edits + redeploy. |
| **Sequencing** | Steps that write `chart-quest.html` must run **after build-351 is committed**, so this analytics change does not entangle with the founder's in-flight gameplay edit. |

---

## Change A — `?dev` exclusion

**Problem.** The 6 founder/dev sessions in this week's data use ordinary `p-…` ids and never `devFinish`, so they slip past both existing filters (`EXCLUDE_PREFIXES`, `dev_finishers`). Fix = **tag, don't suppress**: mark every event from a dev session with `props.dev = 1` (visible for debugging, filtered from the report). Consistent with the existing `crash` `origin:'local'` tag.

### A1 · Client tag — `website/assets/cq-track.js`

Add one resolved-once flag, immediately **after** `IS_LOCAL_PAGE` (currently ~line 335):

```js
  /* Is this a developer/self-test session rather than a real tester? TAGGED, not suppressed —
     dev activity stays visible for debugging the pipe while founder_report.py filters it out.
     Any of: the game's own dev gate (?dev / cq_dev / _CQ_DEV), or a dev host. Anchored host
     test only (localhost.evil.com must not read as dev). This is the real flag the Founder
     Report asked for, replacing the 699x808-viewport heuristic. */
  var IS_DEV = safe(function () {
    return IS_LOCAL_PAGE
      || /[?&]dev(=[^&]*)?(&|$)/i.test(location.search || '')
      || get('cq_dev') === '1'
      || window._CQ_DEV === true;
  }, false);
```

Then stamp it on every emission path. **`event()`** (after the build stamp, ~line 220):

```js
      var _p = props || {};
      if (BUILD && _p.build == null) _p.build = BUILD;
      if (IS_DEV) _p.dev = 1;                       // ← add: mark dev/self-test sessions
```

And the three hand-built pushes — add `dev: IS_DEV ? 1 : undefined` to each `props` object (`undefined` is dropped by `JSON.stringify`, so real testers' rows stay clean):

- `return_visit` push (~line 256): `props: { visit: visits, first_seen: …, page: page(), build: BUILD, dev: IS_DEV ? 1 : undefined }`
- `session_end` push (~line 284): add `dev: IS_DEV ? 1 : undefined` to the props object.
- `crash` push (~line 362): add `dev: IS_DEV ? 1 : undefined` to the props object.

> Tagging `session_start` (via `event()`) alone is enough for the report to drop the whole player; the other three are belt-and-suspenders so *every* dev row self-identifies.

### A2 · Report filter — `scripts/founder_report.py`

New helper (beside `dev_finishers`, ~line 135):

```python
def dev_flagged(events):
    """Players who emitted ANY event tagged props.dev — the client-side ?dev / localhost / cq_dev
    marker from cq-track.js. Catches dev/self-test sessions that use an ordinary 'p-' id and so
    slip past EXCLUDE_PREFIXES and dev_finishers (the founder playtesting the DEPLOYED build in a
    browser pane produced exactly this in the 2026-08-07 window)."""
    out = set()
    truthy = {1, '1', True, 'true'}
    for e in events:
        p = e.get('props') or {}
        if p.get('dev') in truthy and e.get('player_id'):
            out.add(e['player_id'])
    return out
```

Extend the drop set (~line 249):

```python
    dev_ids = dev_finishers(events)
    dev_tag_ids = dev_flagged(events)                                   # ← add
    drop = lambda pid_: is_test_player(pid_) or pid_ in dev_ids or pid_ in dev_tag_ids   # ← extend
```

This adds **no new prefix**, so the 3-way `check_test_prefixes.py` sync is not triggered. It is a no-op until events carry `props.dev`, so it is safe to land immediately.

### A3 · Interim, for THIS week's already-collected rows (read-only)

The 6 existing dev rows predate the tag. Do **not** mutate the beta tables. For clean re-queries now, filter by the documented heuristic:

```sql
-- exclude likely dev/self-test (the in-app browser pane): desktop macOS at the 699x808 / 0x0
-- pane viewport. Heuristic only — the props.dev tag is the durable fix going forward.
where not (device = 'desktop' and os = 'macOS' and viewport in ('699x808','0x0'))
```

---

## Change B — `tutorial_step_reached` breadcrumb

**Problem.** The exit point reads `tutorial_started` with no visibility into whether the player did **zero reps** or got to **step 2 and gave up**. The movement tutorial (`window.BlockchainJourney`) already exposes `_S.tStage` (0→3 across three jumps / boosts / smashes), and `watchMovementTutorial()` already polls it. Emit a breadcrumb on each *new* step reached.

### B1 · Edge function — `supabase/functions/beta-ingest/index.ts` (DEPLOY FIRST)

Add to `EVENT_NAMES` (the closed set, ~line 73), beside `tutorial_started`:

```js
  'tutorial_started', 'tutorial_completed', 'tutorial_step_reached',
```

**This must be deployed before the client that emits it ships** — the file's own comment (lines 66–71) warns an unknown name is dropped silently and, worse, reads as a healthy stage measuring nothing.

### B2 · Client — `website/assets/cq-track.js`

Add the name to `NAMES` (~line 47). Do **not** add it to `ONCE` (it fires per step, deduped by furthest step below):

```js
  var NAMES = ['session_start','session_end','return_visit','play_clicked','movement_tutorial_completed',
    'tutorial_started','tutorial_completed','tutorial_step_reached',
    'first_trade_started', … ];
```

Extend `watchMovementTutorial()` — one additive block inside the existing poll loop; the completion logic is untouched:

```js
  function watchMovementTutorial() {
    if (get('cq_bt_movement_tutorial_completed')) return;
    var n = 0, provedVerbs = false;
    var maxStep = parseInt(get('cq_bt_tstep') || '0', 10);   // furthest tutorial step already reported
    var iv = setInterval(function () {
      if (++n > 1200) { clearInterval(iv); return; }
      var s = safe(function () {
        var J = window.BlockchainJourney;
        return (J && J._S) ? J._S : null;
      }, null);
      if (!s) return;

      /* BREADCRUMB — report each NEW tutorial step reached (1,2,3), once per player, so the
         report shows WHERE inside the tutorial players stall instead of only THAT they do.
         Deduped by the furthest step stored, so a re-visit or a fast poll never double-counts. */
      var st = safe(function () { return (typeof s.tStage === 'number') ? s.tStage : 0; }, 0);
      if (st > maxStep) {
        maxStep = st; set('cq_bt_tstep', String(maxStep));
        event('tutorial_step_reached', { step: st, phase: s.phase || '', count: s.tCount || 0 });
      }

      if (!provedVerbs && (s.tStage === 1 || s.tStage === 2) && !s.tCelebDone) provedVerbs = true;
      if (provedVerbs && s.tCelebDone === true && s.phase === 'grow') {
        clearInterval(iv);
        event('movement_tutorial_completed', { shells: s.shellCount || 0, gems: s.gemCount || 0 });
        return;
      }
      if (s._ended) clearInterval(iv);
    }, 500);
  }
```

Also add `localStorage.removeItem('cq_bt_tstep');` to `CQTrack.reset()` (~line 599) so a QA reset clears the breadcrumb dedup too.

**Volume:** ≤3 events per player (steps 1,2,3), deduped once-per-player. Step 0 ("entered, zero reps") is already covered by `tutorial_started`.

---

## Deploy runbook (ordered — edge function first)

Run **after build-351 is committed**, as one deliberate operation:

```bash
# 1 · Edge function FIRST (unknown names are dropped silently until this lands)
#     edit supabase/functions/beta-ingest/index.ts  → add 'tutorial_step_reached' to EVENT_NAMES
#     deploy it (Supabase MCP deploy_edge_function, or: supabase functions deploy beta-ingest)

# 2 · Client: edit website/assets/cq-track.js  (IS_DEV + dev tags + NAMES + breadcrumb)

# 3 · Report tool: edit scripts/founder_report.py  (dev_flagged + drop)

# 4 · Inline the client into the game, mirror, verify
python3 scripts/sync_track.py            # gate #20: inlined copy must equal the canonical file
scripts/cq.sh mirror                     # gate #8: chart-quest.html == index.html == website/game.html
#     bump BUILD_TAG (so the report can tell pre/post-instrumentation rows apart)
scripts/cq.sh ship                       # runs verify.js: #20, #8, syntax, etc.

# 5 · Deploy the site (website/ → Cloudflare git build)
```

**Rollback:** revert the three source edits, `sync_track.py`, `cq.sh mirror`, redeploy; the edge function keeps the extra allowed name harmlessly (a name no client emits costs nothing).

## What next week's report gains

- **Dev sessions vanish from the funnel automatically** — the dashboard becomes trustworthy (rec #1).
- **The tutorial cliff gets an X-ray:** of the players who stall at `tutorial_started`, the report can finally split "bounced with zero reps" (`tutorial_step_reached` never fires) from "did step 1–2 then gave up" (fires, then stops) — turning rec #2's *why* from a hunch into a measured step-drop. No gameplay changed; we just learn where the wall is.
