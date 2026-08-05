# T-005 — Event Spacing: root cause, and the design for the canonical system

**Date:** 2026-08-05 · **Build:** 335 · **Status:** **INVESTIGATION COMPLETE — NO CODE WRITTEN, AWAITING APPROVAL**

You asked me not to tweak individual placements but to build a canonical system. Before doing that
I checked whether one already exists. **It does** — and the reason it fails is a two-line omission,
not a missing architecture. That changes the recommendation, so here is the evidence first.

---

## 1 · THE SYSTEM YOU ASKED FOR ALREADY EXISTS (build 324)

`chart-quest.html:7104-7112` quotes you directly:

> **FOUNDER (build 324) — BREATHING ROOM IS A RULE, NOT A SUGGESTION.**
> *"there should always be ten to fifteen candles between every single event, and an event means
> breaking a box, collecting a mystery journal page, doing a lesson, or fighting a boss."*

It shipped with: `EVENT_MIN_GAP = 10` / `EVENT_MAX_GAP = 15` (randomised per event so pacing is not
metronomic), `LEVEL_WARMUP_CANDLES = 14`, an `eventLedger`, `markEvent(kind)`, `eventClear()`,
`eventClearAt(candleId)`, `boxNearBossGate()`, plus a second **reward ledger** (`REWARD_GAP = 10`,
`rewardTooClose()` / `stampReward()`) from build 303 specifically to keep boxes and pages apart.

So this is **attempt #2 at the same problem**. Per the two-attempt rule I stopped and proved why
attempt #1 failed rather than building over it.

---

## 2 · ROOT CAUSE — PROVEN, THREE DEFECTS

`maybeSpawnBox()` has **two separate code paths** (`chart-quest.html:5945`). `BOX_GOVERNED_LEVELS = [1]`
(`:5887`), so **Level 1 — the only level in the closed beta, and the one you played — takes the
GOVERNED path** (`:5964-6004`). The other levels take the LEGACY path (`:6005-6019`).

### Defect 1 — the governed path never CHECKS the reward ledger

```
LEGACY path  :6012   if (rewardTooClose(c)) return;     ✅
GOVERNED path         (absent)                          ❌
```

### Defect 2 — the governed path never STAMPS the reward ledger

```
LEGACY path  :6018   if (_bx) stampReward(c);           ✅
GOVERNED path :5997  if (_b) { market._boxMade++; market._boxSpace = BOX_MIN_GAP; }   ❌ no stamp
```

Verified exhaustively — every call site in the file:

```
6012:  if (rewardTooClose(c)) return;     ← legacy box only
6018:  if (_bx) stampReward(c);          ← legacy box only
11438: if (rewardTooClose(c)) return;    ← wisdom page
11512: stampReward(c);                   ← wisdom page
```

`REWARD_GAP` is the **only** mechanism that enforces box↔page spacing, and on Level 1 the box
neither reads nor writes it. **Both directions are broken:**

- A page stamps the ledger; the governed box never reads it → **box lands right after a page.**
- A governed box never stamps; the page reads a stale value → **page lands right after a box.**

That is your exact report — *Mystery Journal Page → 1 candle → Breakable Box* — reproduced from the
source. It is a **two-line omission when the governed path was branched off**, not a design gap.

### Defect 3 — the architectural one: the ledger is stamped at CONSUME time but read at SPAWN time

`markEvent()` (`:7153`) sets `eventLedger.at = maxSeenCandleId` — **Finn's frontier**, at the moment
the player *experiences* the event. The comment at `:6023` states this deliberately: *"the moment
the player EXPERIENCES it (not when it spawned, which was a screen earlier)."*

But `eventClearAt(c.id)` (`:7138`) judges the **spawn candle**, which `maintainCandles` generates
~15 candles **ahead** of Finn.

**Consequence: two events already placed in the world but not yet reached are invisible to each
other through `eventLedger`.** A page placed at candle 100 has stamped nothing (it is not collected
yet), so a box evaluating candle 101 compares against the *last consumed* event — possibly 50
candles back — and passes. The `eventLedger` cannot enforce spawn-space separation **by
construction**; the reward ledger is the only thing that ever could, and Defect 1/2 disabled it on L1.

### Defect 4 — the governed box checks clearance at the wrong candle

The governed path evaluates `eventClearAt(c.id)` on the **current** candle, then places the box on
`fc` — the remembered **valley** candle, potentially several candles behind (`:5991`). The candle
that was cleared is not the candle that receives the box.

---

## 3 · WHY THIS MATTERS FOR WHAT YOU BUILD NEXT

A new canonical system that **also** measures spacing at consume-time would inherit Defect 3 and
fail the same way. The lesson from attempt #1 is not "we need a bigger system" — it is:

> **Spacing is a property of WORLD SPACE (candle ids), decided at PLACEMENT time.
> A ledger keyed on player progress can never enforce it.**

Any canonical system must own a single spawn-space reservation map. That is the real content of
this ticket.

---

## 4 · PROPOSED DESIGN — `window.CQBEAT`

Modelled deliberately on `window.CQREACH` (COLLECTIBLE LAW 001, build 301), which solved the
structurally identical problem for collectibles: many scattered spawn sites, no single owner,
silent violations. That precedent works, is guarded by verify #14, and the team already understands
it.

**One owner, frozen on `window`, in candle-id space.**

```js
CQBEAT.reserve(candleId, kind)   → true if granted (records the interval), false if it collides
CQBEAT.clear(candleId, kind)     → predicate only, no side effect (for "can I?" checks)
CQBEAT.release(kind)             → level teardown / rebuild
CQBEAT.audit()                   → every reservation + any violation, for the gate & overlay
CQBEAT.RULES                     → the configurable table below
```

**Category table (your values, kept configurable in one literal):**

| Kind | Gap before/after | Priority |
|---|---|---|
| boss | 40 | 1 (highest — never moves) |
| cinematic | 25 | 2 |
| bossIntro | 25 | 3 |
| lesson | 15–20 | 4 |
| portal | 20 | 5 |
| journalUnlock | 20 | 6 |
| page | 15 | 7 |
| minigame | 15 | 8 |
| box | 10–15 | 9 (lowest — moves first) |

**Placement becomes reserve-then-place, guaranteed by construction:**
1. Generate candidate → 2. `CQBEAT.reserve()` → 3. on refusal the *lower-priority* event defers to
its next candidate candle → 4. place only on success.

Higher priority never yields: a box defers around a lesson, never the reverse. Educational content
is never moved by optional content — your rule, encoded in the table rather than in call sites.

**Debug overlay** on the existing `?reach` pattern (a new `?beat`): draws each exclusion zone as a
band on the chart, labels actual vs required spacing, and paints violations red.

**Validation:** `CQBEAT.audit()` returns violations; a new **verify.js gate #18** fails the build on
any violation and asserts every spawn site goes through `CQBEAT` — the same enforcement shape as
gate #14 for CQREACH, so a future spawn site cannot quietly bypass it.

---

## 5 · WHAT I NEED FROM YOU — THIS IS A LARGE, PROTECTED CHANGE

```
PRE-FLIGHT

Task:
Canonical Event Spacing System (window.CQBEAT) owning placement for all major events,
+ ?beat debug overlay, + verify.js gate #18, + audit and correction of existing levels.

Files Changing:
  chart-quest.html   (~250-400 lines: new owner + ~12 spawn sites re-routed)
  scripts/verify.js  (gate #18)

Protected Systems Affected:
YES — four of them:
  #2 Bosses     — boss/gate spacing changes WHEN the boss portal may appear
  #3 Lessons    — a deferred lesson changes WHERE a lesson lands (order preserved,
                  but "never test the untaught" interacts with delaying a lesson)
  #4 Movement   — untouched, but traversal FEEL changes if events move materially
  #7 UI flow    — portals are on the protected list; spacing gates when they spawn

Risk Score:
  Character 0/10 · Movement 2/10 · UI 6/10 · Progression 7/10 · Lessons 8/10 · Save 0/10
  → Overall HIGH

Rollback Plan:
  Single additive block + call-site re-routing; revert the one commit. CQBEAT can also be
  made inert via a single flag so the old behaviour returns without a revert.
```

**Canon requires your explicit approval before I write any of this** (`CLAUDE_RULES.md` — Large +
Protected). The specific thing I want you to say yes to: **the spacing system is allowed to change
where a lesson or a portal appears in Level 1.** It cannot do its job otherwise, and Level 1 is
currently rated ~10/10 — this will move things in it.

---

## 6 · MY RECOMMENDATION — SPLIT IT

**T-005a — fix the proven defect now (SMALL, no protected systems, LOW risk).**
Add the two missing reward-ledger lines to the governed path, and judge clearance at the candle the
box is actually placed on (Defect 4). That is **~4 lines** and it fixes the exact symptom you
reported, on the level your testers play, today.

**T-005b — build CQBEAT (LARGE, protected, needs the approval above).**
The right architecture, and it should be done — but it is a rewrite of placement across ~12 sites
on the one level currently rated 10/10, one week before external testers arrive.

I recommend shipping **a** immediately and scheduling **b** deliberately, with the overlay and gate
built first so the audit of existing levels is measured rather than eyeballed. If you would rather
go straight to **b**, say so and I will — I just will not start it without you accepting that it
moves content inside Level 1.

---

## 7 · NOTES

- **I have not written or changed any code.** No file in the game was modified.
- The `?reach` overlay precedent (`:1674`) and `CQREACH` (`:3170`, published `:3436`) are the
  template for both the new owner and its overlay; reusing them keeps this consistent with a
  pattern the codebase already enforces.
- `LEVEL_WARMUP_CANDLES = 14` already implements "let them move before you ask them for anything"
  and should be folded into CQBEAT rather than duplicated.
- Defect 3 means **`eventLedger` should not be extended** — it answers a different question ("is a
  modal on screen / has the player just had a moment"), which is still worth keeping for the
  *interruption* guard. CQBEAT replaces it only for **placement**.
- I did not audit existing levels for violations yet; that is the first task inside T-005b and it
  needs the overlay to be honest rather than guessed.
