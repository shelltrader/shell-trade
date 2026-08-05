# CQTrack drift gate — closing the last unwired drift check

**Date:** 2026-08-05
**Ticket:** wire `scripts/sync_track.py --check` into the regression gate
**Change:** `scripts/verify.js` — new gate **#20**. Tooling only; no game logic touched.
**Result:** PASS — 17 pass · 0 fail · 0 warn · 3 skip

---

## The gap

`scripts/sync_track.py` has documented itself since it was written as:

```
python3 scripts/sync_track.py --check   # exit 1 if they have drifted (for the ship gate)
```

There was no ship gate. `grep -rn "sync_track" scripts/cq.sh scripts/verify.js` returned nothing.
The drift detector existed, worked, and had never been called by anything.

**A drift detector that no gate runs is a comment, not a guarantee.**

This is the same failure class gate #19 (build 339) closes for `window.CQOPS` via `ops/cq-ops.js`.
Gate #19's own comment names CQTrack as the one still open:

> "(CQTrack has the same shape and its --check has never been wired into anything…)"

## Why CQTrack has two copies at all

`window.CQTrack` is the closed-beta analytics client. It must exist twice, because the game is
one self-contained document and cannot `<script src>` a sibling file:

| Copy | Who loads it |
|---|---|
| `website/assets/cq-track.js` — **canonical** | `website/index.html`, `play.html`, `survey.html` (real `<script src>`); precached by `sw.js` |
| inlined in `chart-quest.html` between `CQTRACK:BEGIN` / `CQTRACK:END` | the game itself (and its `index.html` / `website/game.html` mirrors) |

## Why drift here is worse than a normal bug

It **corrupts the evidence** rather than breaking the product. Both copies would keep emitting
the same event names, so the site and the game would be reporting from two different
instrumentations — and the Founder Report funnel would read that as a change in *player
behaviour*. Nothing on screen looks wrong. There is no symptom to chase.

That is precisely why it needs a build invariant and not a habit.

## What gate #20 asserts

Mirrors gate #19: slice the inlined block out from between its marker comments, compare
byte-for-byte against the canonical file. Three failure shapes are reported **separately**,
because they have different fixes:

| Failure | Detail message names |
|---|---|
| Copies disagree | `run: python3 scripts/sync_track.py` |
| No block in the game | `run: python3 scripts/sync_track.py` |
| `CQTRACK:BEGIN` marker text altered | *restore the marker verbatim first* — **not** the fix command |
| Two `CQTRACK:BEGIN` markers | *delete the extras, do NOT re-run the splice* |
| Literal `</script>` in the canonical source | it would end the block early and truncate the game |

The two marker cases are called out on purpose. `sync_track.py` locates the block by its **exact**
begin marker, so a hand-edited marker makes the script believe there is no block and **insert a
second copy**. Two CQTrack clients in one document is a worse state than drift, and "just run the
fix command" is the wrong advice there — so the gate refuses to give it.

Like gates #17 and #19, an internal exception here is a **FAIL, not a WARN**. A gate whose whole
job is catching "the thing silently wasn't there" must not itself pass silently when it breaks.

## Verification

Current repo state was **already in sync**, so this gate lands green — it is prevention, not repair.

Every branch was exercised:

| Case | How | Result |
|---|---|---|
| in sync | real repo files | ✓ PASS |
| real drift | appended a byte to `website/assets/cq-track.js`, ran the gate, restored | ✗ FAIL — named `sync_track.py`, reported `21641B vs 21657B` |
| literal `</script>` | appended one to the canonical source, restored | ✗ FAIL |
| block missing | synthetic document | ✗ FAIL |
| marker altered | synthetic document | ✗ FAIL with the *restore-first* advice |
| block duplicated | synthetic document | ✗ FAIL with the *delete-extras* advice |

The two live tests transiently modified `website/assets/cq-track.js` under a shell trap and
restored it byte-identically (sha256 confirmed before/after; working tree left showing only
`M scripts/verify.js`). The four synthetic cases ran the **real** gate-20 block, sliced out of
`scripts/verify.js` and evaluated against doctored documents, so `chart-quest.html` was never
touched — other sessions are editing it concurrently.

## Merge note — gate numbering

This branch (`claude/exciting-swanson-0f93e7`, at `fd7108e`) has gates 1–18. **Gate #19 does not
exist here yet** — it is uncommitted work in the main checkout, alongside untracked `ops/` and
`scripts/sync_ops.py`. #20 was chosen anyway so the numbers reconcile once the branches meet:
**19 = CQOPS, 20 = CQTrack**.

Both gates append after #18, so a textual merge conflict at that insertion point is expected. It
is a pure both-added conflict — keep both blocks in numeric order; no logic overlaps.

## Not done (deliberately)

- **`scripts/cq.sh` untouched.** `cq.sh ship` already runs `node scripts/verify.js`, so the gate is
  reached. A second invocation of `sync_track.py --check` from the shell script would be a second
  place to keep in sync — the failure this ticket exists to stop.
- **`sync_track.py` untouched.** Gate #20 asserts the same invariant independently; it does not
  shell out to the script, matching how #19 checks CQOPS without invoking `sync_ops.py`.
- **No `BUILD_TAG` bump.** `chart-quest.html` is unchanged, so gate #7 correctly SKIPs. There is no
  new build to identify in a playtest.
