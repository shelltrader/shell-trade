# The two blind funnel stages — and the exact patch to close them

The Beta Test QA dashboard renders 13 funnel stages. Eleven have data. **Two have never been
instrumented**, and the dashboard shows them greyed with a "not instrumented" badge rather than a
0%, because a 0% that is really a reporting failure is how a week gets spent on the wrong problem.

This document is the patch, ready to apply when no other session is editing the files.

---

## Gap 1 — "Play clicked" (`play_click`)

### Why it reads nothing today

It is not a missing `track()` call. It is structural:

`cq-track.js` mints **one session per visit, not one per document**, deliberately —

```js
var s = sessionStorage.getItem('cq_bt_sid');
if (s) return { id: s, isNew: false };
```

A tester's journey loads the script four times (`index.html` → `play.html` → the game iframe →
`survey.html`), all same-origin, all sharing that one `sessionStorage` id. Only the document that
*mints* it fires `session_start`. So clicking Play navigates to a document that stays deliberately
silent — **no event is emitted at all**.

This was the right fix for a worse bug: minting per document produced four "sessions" per visit and
bumped the shared visit counter four times, so every first-time tester was reported as RETURNING
and "new testers" read zero. Do not undo it.

Consequence for reading the data: `session_start` with `props.page = 'play'` means the tester
**arrived directly** at `play.html` (a shared link), *not* that they clicked through from the
landing page. The dashboard says exactly this in the stage tooltip.

### Complication worth knowing before you patch

`website/index.html` also embeds the game inline (`<section class="section gamestart" id="play">`).
A tester can play **without ever clicking a Play link**. So `play_click` will always undercount
"reached the game" — it measures the link, not the intent. If what you actually want is "started
playing", that is better derived from `tutorial_started`, which already exists.

Recommend instrumenting it anyway, because the *gap* between landing and play-click is the single
most valuable unknown in the funnel right now — but label it "Play link clicked", not "reached the
game".

### The patch

**1 · `website/assets/cq-track.js`** — add the name to both lists:

```js
var NAMES = ['session_start','session_end','return_visit','play_clicked','movement_tutorial_completed',
  'tutorial_started', /* …unchanged… */ ];

var ONCE = ['play_clicked','movement_tutorial_completed','tutorial_started', /* …unchanged… */ ];
```

**2 · `website/assets/cq-track.js`** — inside `boot()`, after the existing listeners. Delegated, so
it survives any markup change and covers all six Play links at once:

```js
/* PLAY LINK — the one funnel stage the per-visit session model cannot infer. Clicking Play
   navigates to a document that deliberately stays silent (it shares the session id), so
   without this listener the landing → play transition is invisible. Delegated on document
   because index.html has six separate Play links and gains more with every landing revision. */
safe(function () {
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href*="play.html"]');
    if (!a) return;
    event('play_clicked', { from: page(), target: a.getAttribute('href') || '' });
    flush(true);            // they are navigating away this instant — do not buffer it
  }, true);                 // capture: a stopPropagation() in a CTA handler must not eat it
});
```

**3 · the DEPLOYED `beta-ingest` edge function** — add both names to `EVENT_NAMES`. Anything not on
that list is dropped silently by design.

> ⚠ `supabase/functions/beta-ingest/index.ts` **in this repo is stale**. The deployed v4 already
> has `journal_discovery_skipped` and exact-match origin checking; the repo copy has neither and
> still uses the `startsWith()` prefix match that was fixed for a real vulnerability. Patch from
> the deployed source (`get_edge_function`), never from the repo file, or you will silently
> re-ship the prefix-match hole.

**4 · re-sync the inlined copy** — the game carries its own inlined `cq-track.js`:

```bash
python3 scripts/sync_track.py
```

**5 · verify** — `python3 scripts/sync_track.py --check` must pass, then confirm a real row lands:

```bash
python3 scripts/beta_pull.py --days 1 && grep -c play_clicked beta-qa/beta-data.json
```

---

## Gap 2 — "Movement tutorial" (`movement`)

### Why it reads nothing today

There is no movement tutorial *system* to hook. `grep -n "movementTutorial\|movement_tutorial"
chart-quest.html` returns nothing. What the founder's spec calls the movement tutorial is the
opening phase of the intro state machine at [chart-quest.html:6259](chart-quest.html:6259):

```js
const introFlow = {
  active: !localStorage.getItem('cq_played'),
  phase: 'run',        // 'run' | 'quiz' | 'bet' | 'done'
```

`phase: 'run'` **is** the movement segment — Finn traverses, the player learns to move. It ends
when the phase advances to `'quiz'`. So the stage is "finished the traversal segment and reached
the first quiz card".

### The patch

Same philosophy as the existing `watchTutorialStart()`: **poll for the state, never edit the game's
call sites**, so this merges cleanly against other sessions editing `chart-quest.html`. Add to
`website/assets/cq-track.js` next to `watchTutorialStart`:

```js
/* The "movement tutorial" is not a function, it is introFlow.phase === 'run' — the traversal
   segment before the first quiz card. Watch for it ADVANCING rather than for the quiz starting,
   so a player who is sent straight to 'bet' by a future flow change still counts. Polling (not a
   hook) keeps this merge-safe: no call site in the 1.9 MB game file is touched. */
function watchMovementTutorial() {
  if (get('cq_bt_movement_tutorial_completed')) return;
  var n = 0, sawRun = false;
  var iv = setInterval(function () {
    if (++n > 480) { clearInterval(iv); return; }        // ~4 min, then give up quietly
    var ph = safe(function () {
      return (typeof introFlow !== 'undefined' && introFlow && introFlow.active) ? introFlow.phase : null;
    }, null);
    if (ph === 'run') { sawRun = true; return; }
    /* Only counts if we actually WATCHED them do it. Firing on a late attach — a veteran whose
       phase is already 'quiz' — would credit a stage they never played. */
    if (sawRun && ph && ph !== 'run') { clearInterval(iv); event('movement_tutorial_completed', {}); }
  }, 500);
}
```

Call it from `boot()` alongside `watchTutorialStart()`. Steps 1, 3, 4 and 5 above apply unchanged
(the name is already added to `NAMES`/`ONCE` in step 1).

---

## After applying

The dashboard needs no change. `beta-qa/beta-model.js` and the SQL `beta_model()` both key the
funnel off `BetaModel.FUNNEL`, where these two stages are already present with
`instrumented: false`. Flip that flag to `true` in **both** engines and the stages light up with
real data; the parity harness will confirm the two engines still agree.

Until then the dashboard is telling the truth: it does not know.
