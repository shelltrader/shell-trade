# T-005b — `window.CQBEAT`, the canonical Event Spacing System (Phase 1)

**Date:** 2026-08-05 · **Build:** 337 · **Commit:** `04e8a16` · **Status:** **PASS — shipped, live, verified**
**Deployed:** production serving build 337 · smoke test **46 pass / 0 fail** · gate **18 pass / 0 fail / 0 warn**

Ships in **observe mode**: it records and reports, but vetoes nothing. That is deliberate — see §4.

---

## 1 · WHAT SHIPPED

`window.CQBEAT` — one owner of gameplay pacing, holding an exclusion-zone map in **candle-id
space**, deciding at **placement time**.

| Piece | Status |
|---|---|
| Rule table (11 categories, one configurable literal) | ✅ |
| Priority resolution (lower number never yields) | ✅ |
| `?beat` debug overlay — zones, actual vs required, violations in red | ✅ |
| `audit()` validation pass — every violation with both events, distance, requirement | ✅ |
| `may()` / `setMode()` / `RULES` / `reset()` API | ✅ |
| verify.js **gate #18** | ✅ negative-tested |
| Audit of Level 1 | ✅ measured, §3 |
| **Enforcement active in the shipped build** | ⛔ observe mode — §4 |

### The rule table (your values)

```
boss 40 · cinematic 25 · bossIntro 25-30 · lesson 15-20 · portal 20
journalUnlock 20 · ceremony 20-25 · page 15 · minigame 15 · trade 15-20 · box 10-15
```

Gaps are rolled per event inside their band, so pacing reads as breathing rather than a metronome —
the same reasoning build 324 applied to `EVENT_MIN_GAP..EVENT_MAX_GAP`. Two events conflict when
their separation is under the **larger** of the two radii, so a box near a lesson is judged by the
lesson's 15–20, not the box's 10.

---

## 2 · WHY A NEW OWNER, NOT MORE CALL SITES

This is the part that matters architecturally.

`markEvent()` stamps `eventLedger.at = maxSeenCandleId` — **Finn's frontier**, the moment the
player *experiences* an event. `eventClearAt(c.id)` judges the **spawn candle**, which
`maintainCandles` generates ~15 candles **ahead**.

> **Two events already placed in the world but not yet reached are invisible to each other by
> construction.**

No number of additional gates fixes that; the question was being asked in the wrong coordinate
space. That is why build 324 — which was a serious, correct-looking implementation of exactly this
rule — could still let a page and a box land one candle apart.

`eventLedger` is **kept**, not replaced. It is genuinely good at a different question — *"is a modal
on screen / has the player just had a moment"* — which is the **interruption** guard. CQBEAT owns
**placement**. Two jobs, two mechanisms, no overlap.

---

## 3 · THE AUDIT — LEVEL 1, MEASURED

Frame-pumped a real Level-1 session (rAF is dead in a hidden pane) and read `CQBEAT.audit()`:

```
level 1 · observe · 15 reservations · 3 violations

  box@142  → trade@138    distance  4, required 16
  page@231 → trade@234    distance  3, required 16
  box@265  → trade@280    distance 15, required 19
```

**A box 4 candles from a trade.** This is your complaint, now a number rather than an impression.

**All three are trade-vs-object**, and priority resolves every one of them in the trade's favour —
correctly, per your rule that critical educational content is never moved by optional content.

**The honest limit this exposes:** a trade's position is chosen by the **player**, not by a spawner.
It cannot be reserved ahead of time the way a box or a page can. So the real remedy is not "veto the
trade" — it is that boxes and pages must avoid the **pre-trade zone**. The game already has the
ingredients (`setupFlow`, `pending`, `tradeIncomingActive` all exist and are already consulted for
trade-focus). That is the next slice and it is **not started**.

---

## 4 · WHY IT SHIPS IN OBSERVE MODE

Your brief says *"Audit every existing level… Correct all violations."* — audit first. Level 1 is
rated ~10/10 and external testers are imminent, so the system that decides where content goes ships
**measuring before moving**. Flipping it is one call:

```js
window.CQBEAT.setMode('enforce')
```

I ran enforce end-to-end and it behaves correctly (§5), but on the measured data it changes nothing
useful yet: all three violations are trade-vs-object, where priority correctly lets the trade stand.
Enforcement only starts paying once the pre-trade-zone work in §3 lands. Turning it on now would add
risk to a 10/10 level and buy nothing — so it is wired, tested, and off.

---

## 5 · A BUG THIS FOUND IN ITSELF

The first enforce implementation asked *"may I?"* **before** letting the spawner run. That is wrong:
`maybeSpawnBox` and `maybeSpawnWisdomPage` are **per-candle polls** that usually decline for their
own reasons (no valley, budget spent, trade live, RNG). So it vetoed and logged calls that would
never have placed anything.

**Measured, first implementation, one L1 run: 80 vetoes against 12 grants**, with violations logged
for runs of consecutive candles (127, 128, 129, 130…) against *both* page and box — a polling
artefact, not pacing data.

Fixed: placement is judged **only after the target array grows** — accurate by construction, since
the array grew ⟺ something was really placed. On a conflict in enforce mode the freshly-pushed
object is rolled back **and the spawner's own budget is handed back**, so a refusal costs the level
nothing. That is your *"Move it / Reschedule it / Skip it"* with no relocation logic and no risk of
an event being lost.

After the fix, same run shape: **15 grants, 0 spurious vetoes, 3 genuine violations.**

---

## 6 · MERGE SAFETY

Built to the `CQBeta` / `CQJournalTutorial` precedent, because other sessions edit this file:

- **One trailing IIFE** at EOF. Nothing above it was modified.
- **Zero top-level declarations.** A duplicate top-level binding across inline `<script>` blocks is
  a parse-time `SyntaxError` that silently kills the *entire* block — the single most dangerous
  invariant in this codebase.
- **Runtime patching**, not call-site edits: `maybeSpawnBox`, `maybeSpawnWisdomPage`, `spawnPortal`
  and `markEvent` are column-0 function declarations, so they are global-object properties and can
  be wrapped from here. A concurrent edit to any spawner still merges cleanly.
- **Deleting the block restores build 336 exactly.**
- Every hook `try`/`caught` — a pacing system must never be able to brick a playtest.

The one piece of coupling: the veto path reaches into `market._boxMade` / `_wisSpawn.placed` to
return the budget. That is the price of enforcing from a wrapper, and it is the reason the
long-term shape is to route the spawners through CQBEAT **natively** (reserve-then-place, guaranteed
by construction) rather than by wrapping.

---

## 7 · GATE #18 — negative-tested

Locks the owner, the rule table, all four observed spawners, the API, the post-hoc placement rule
and the overlay — the same shape as #13 (`window.CQ`) and #14 (`CQREACH`).

```
✓ [18] owner published · self-contained IIFE (0 top-level names) · 9 categories ·
       4/4 spawners observed · audit+setMode+RULES exposed · placement judged post-hoc · ?beat overlay
```

Proved it can fail — removed the post-hoc guard and re-ran:

```
✗ [18] placement is not judged post-hoc — a per-candle poll must not be pre-vetoed
```

An exception inside it is a **FAIL**, not the `WARN` used by gates #12–#16: a gate whose job is to
catch silent absence must not itself pass silently.

---

## 8 · VERIFICATION

| Check | Result |
|---|---|
| Regression gate | **18 pass · 0 fail · 0 warn · 1 skip** |
| Boot (live) | `CQ`, `CQREACH`, `CQBEAT`, `CQBeta`, `CQTrack`, `CQJournalTutorial`, `frame` all present |
| Overlay off by default | ✅ (only on `?beat`) |
| Wrappers installed | 4/4 |
| Deployed | production serving **build 337** |
| Post-deploy smoke | **46 pass · 0 fail** |

The smoke test from T-004 earned its keep here: it caught production still serving 336 while
Cloudflare was mid-build and failed correctly — *"production is serving build 336, this checkout is
build 337 — the deploy is stale or still building"* — then passed once the deploy landed.

---

## 9 · WHAT IS NOT DONE

Being explicit, because this is Phase 1 of the ticket you wrote, not all of it.

- **Enforcement is off.** Wired, tested, one call away — see §4.
- **Only Level 1 was audited.** L2–L11 are unaudited; the tooling now exists to do it, but the
  measurement has not been run.
- **Only four spawners are observed.** Boxes, pages, portals (lesson/trade/boss) and
  `markEvent` (lesson/trade). **Not yet registered:** boss introductions, journal unlock, Home
  Market ceremony, mini-game entrances, major cinematics. They are in the rule table but nothing
  reports them yet, so they occupy no space.
- **"Future systems should automatically register here"** is not true yet. Today a new spawner must
  be added to the wrap list. Gate #18 checks the four that exist; it cannot know about a fifth.
- **The pre-trade zone** (§3) — the actual remaining cause of every measured violation.
- **`?beat` was exercised but not visually confirmed**, because the browser pane could not composite
  (`visibilityState: hidden`, screenshots time out). The overlay code runs and the canvas is created
  on `?beat`; I have not *seen* it draw. Worth 30 seconds on your machine before you rely on it.
- **No level content was moved.** Nothing about how Level 1 currently plays has changed in this
  build.

---

## 10 · FOUNDER REVIEW — what still bothers me

Pretending to be you and looking at build 337: **nothing you can see is different.** The pacing
complaint you raised is fixed only to the extent T-005a fixed it (box↔page on Level 1, build 336).
What 337 adds is the ability to *know* — and I want to be honest that a system which measures is not
the same as a system which fixes, even though this ticket was written asking for the second one.

The thing I would flag hardest: **the measured data says the remaining problem is not the one the
ticket describes.** Your brief is about *placed* content colliding — boxes, pages, lessons, portals.
Every violation I actually measured involves a **trade**, whose position the player chooses. A pure
placement-reservation system, however elegant, structurally cannot solve those. If I had built all
of T-005b as specified and flipped enforcement on, the audit would still have shown 3 violations and
you would reasonably have asked why the new system did not fix the thing it was built for.

Second: I stopped at four registered spawners. Boss introductions and cinematics — the two
categories with the largest exclusion radii in your own table, 25+ — are the ones I have **not**
wired. Their gaps are configured and enforced against nothing. That reads as more complete than it
is, which is exactly the kind of thing that produced a "breathing room" system in build 324 that had
never run on Level 1.

Third, an honest process note: I could not visually confirm the overlay, and I did not play the
game — I frame-pumped it. Every number here is real and instrumented, but no human eye has seen a
single exclusion zone drawn on a chart.

---

# ADDENDUM — Phase 2 (build 338): all categories reported, enforcement ON

**Commit:** `e6f33ec` · production serving **build 338** · smoke **46/46** · gate **18 pass / 0 fail**

## What changed

The five categories that were configured in `RULES` but reported by nothing are now wired, and
`MODE` is `'enforce'`.

| Wired | Category | Radius |
|---|---|---|
| `openBoss` | boss | 40 |
| `playBossIntroCinematic` | bossIntro | 25–30 |
| `playBossOutroCinematic`, `IntroCinematic.start` | cinematic | 25 |
| `HomeMarketCeremony.start` | ceremony | 20–25 |
| `CQJournalTutorial.claimPostBoss` | journalUnlock | 20 |
| `MG.run` (outside a boss fight) | minigame | 15 |

`MG.run` is skipped inside a Guardian fight — a boss round hands each question to it, so those would
register once per round at effectively the same candle, and the boss already owns that space with a
40-candle radius. Only a mini-game entered from the **world** counts.

## Two safety laws, both gated

1. **A moment is a fact, not a decision.** A boss, cinematic, ceremony or journal unlock *records*
   and claims its zone but is **never vetoed**. Only a placeable thing — box, page, non-boss portal
   — can be deferred. You cannot reschedule a cinematic the game has already committed to.
2. **Starvation guard.** Any category refused `MAX_DEFER` (40) times running is let through and
   logged. The worst case of a mis-tuned rule table is then a pacing violation, never a player with
   no way forward. **Progression outranks pacing, always.**

## Verified in enforce, real L1 run

```
mode enforce · 7 moment wrappers + 4 spawner wrappers
2 boxes (= BOXES_PER_LEVEL) · 1 page · 4 trades
0 vetoes · 0 starvation releases · progression intact
CQ · CQREACH · CQBEAT · CQBeta · CQTrack · CQJournalTutorial all live
```

Gate #18 extended to fail when a `RULES` category is configured but reported by nothing, and
negative-tested — unwiring `playBossIntroCinematic` fails it **by name**:

```
✗ [18] RULES categories configured but reported by nothing: bossIntro
```

## A false alarm worth recording

A long harness run reported **0 boxes in both modes**, which looked like enforcement suppressing
content. Rather than trust it, I A/B'd against the committed build 337 — which reproduced it
exactly. **It was the harness**: aggressive teleporting skips the valley detector's 3-candle climb
window (`BOX_CLIMB_WAIT`). Not a regression, and worth remembering before anyone reads a long
frame-pumped run as gameplay truth.

## The residue — unchanged, and now confirmed twice

All remaining violations are **trade-vs-object**, and priority correctly lets the trade stand. The
ordering is the proof:

```
box@139 placed  →  trade recorded @136  (behind it)
```

The box was placed 3 candles ahead of where the player then traded. **A trade's position is chosen
by the player, after the box already exists** — so a placement-reservation system structurally
cannot fix these, no matter how complete it is. Boxes and pages must avoid the **pre-trade zone**;
`setupFlow`, `pending` and `tradeIncomingActive` already exist for exactly that read.

**Not started.** It is the next slice, and it is the one that will actually change what the founder
feels.

## Still not done

- Only **Level 1** has been audited. L2–L11 remain unmeasured; the tooling exists.
- **"Future systems automatically register here"** is still not true — a new spawner must be added
  to the wrap list. Gate #18 now catches a category configured-but-unreported, but it cannot know
  about a twelfth category nobody wrote down.
- **`?beat` still has not been seen with human eyes.** The code runs and creates its canvas; the
  browser pane cannot composite. 30 seconds on a real machine would confirm it.
- **No level content moved.** With 0 vetoes on the measured run, build 338 changes nothing a player
  can see — it makes the rules real and reports honestly when they are broken.
