# ChartQuest — First Trade Polish Sprint: status, findings, queue

**Date:** 2026-08-06 · **Shipped so far:** build **349** (`b86b183`) · **Rest: queued behind the beta run**

---

## 1. Where the sprint stands

| Item | State |
|---|---|
| **P0a** Trade summary truthfulness | ✅ **Shipped, build 349** |
| **P0b** Mandatory replay + summary pipeline | ⏸ Queued — **larger than briefed**, see §4 |
| **P1a** First trade victory ceremony | ⏸ Queued |
| **P1b** "What did we learn?" | ⏸ Queued — needs an edge-function deploy **first**, see §4 |
| **P2** Wick boost consistency | ⏸ Queued |
| **P3** Restore the Fake Candle lesson | ❌ **Deferred** — it was never built, see §4 |
| **P4** Candle drawing lesson layout | ⏸ Queued |

Three decisions taken before any code was written:

1. **Beta runs first.** Nothing further deploys until the run closes.
2. **P0a was audited rather than patched where reported** — the reported location was already correct.
3. **P3 deferred** — "restore" is really "author new", which the brief itself rules out.

---

## 2. P0a — what was actually wrong (shipped)

The brief reported the **post-trade summary card**. That card is already correct: it branches on
`result === 'manual'` and says *"you closed it yourself and protected your profits."*

The contradiction was in **the Journal and its replay** — the screen a player opens specifically to
understand a trade. Five render sites asked a two-state question of three-state data, in **two
different wrong ways**, which is why it survived:

| Site | Wrong inference | What a profitable manual close rendered |
|---|---|---|
| `tradeChartSVGFull:11343` | `result === 'win'` | `✗ LOSS  +42 shells` |
| `tradeReplaySVG:11743` | `result === 'win'` | `✗ STOPPED OUT  +42 shells` |
| `imStartReplay:9732` | `delta > 0` | `✓ TAKE-PROFIT` — a target never reached |
| `imShowDetails:9740` | `delta > 0` | `✓ TAKE-PROFIT` — same |
| colour on all of the above | two-state | green `+42` printed in **red** |

**No new design was required.** The correct three-state idiom already existed 190 lines away —
`exitIsWin / exitIsLoss / 'CLOSED EARLY'` on the chart's exit tag (`11587`). These sites predate it
and now match it.

**Verified by driving the shipped renderers, with controls:**

```
manual +42  →  ● CLOSED EARLY  +42 shells   [green]
manual −15  →  ● CLOSED EARLY               [red]
real loss   →  ✗ STOPPED OUT  −20 shells    unchanged
real win    →  ✓ TAKE PROFIT HIT  +84       unchanged
```

Gate **22 pass · 0 fail**, and **#10 (protected systems) passed with no override** — `resolveTrade`
is untouched; this was text and colour only.

---

## 3. FINDING — `tutorial_completed` does not measure tutorial completion

**Do not act on the "tutorial cliff" in the current funnel. It is an artifact.**

`tutorial_completed` is wired to `wrap('introComplete', …)`. But `introComplete()` is called from
exactly two places, both guarded by `if (bfState.level === 1)` — and `bfState` is the **boss-fight**
state. One is the boss-win path; the other is the "passed for now, train up and face it again" path.

**The event fires when Boss 1 resolves, not when the tutorial ends.** The data agrees:

| player | `boss_defeated` | `tutorial_completed` | |
|---|---|---|---|
| `p-fco306cqen` | 05:23:35 | **05:24:03** | fired **28s after** the boss |
| `p-gdoocj7x3f` | 07:26:59 | **never** | beat the boss, event lost |

### Three separate defects

1. **Mislabelled.** It is effectively a second, less reliable `boss_defeated` — a stage sitting at
   position 5 of the funnel that actually occurs at position 9.
2. **Unreliable even at that.** `introComplete` carries **two runtime wrappers** (CQTrack's and
   CQJournalTutorial's), and the code's own comment describes the ordering dance between them
   (*"our introComplete wrapper finishes on the next tick"*). One of two boss-defeating players lost
   the event outright. Order-dependent runtime wrapping is the cause.
3. **`tutorial_started` does not pair with it.** `p-fco306cqen` fired `tutorial_completed` with **no**
   `tutorial_started`. That one polls `introFlow.active` every 500 ms and gives up after ~2 minutes,
   so a slow start, a reload mid-intro, or a returning player is simply missed.

### The fix, for the sprint

- Bind `tutorial_completed` to the **actual end of the intro**, not to `introComplete`.
- Replace the 2-minute poll behind `tutorial_started` with a state-based signal.
- Prefer a **direct call from the game** over runtime-wrapping a function that another module also
  wraps. Two wrappers on one function is the root cause of defect 2.

Deliberately **not fixed during the beta run** — changing what is measured mid-run makes the two
halves incomparable, and the rows are now known-bad and can simply be disregarded.

---

## 4. Scope realities found during investigation

**P0b is larger than briefed.** There is no post-trade replay to make mandatory. The only replay is
`imOpenReplay`/`imStartReplay` — reviewing a *saved* trade from the Journal. `buildReplay()` is
market generation, unrelated. So "every trade must replay" is **new engine work inside the frozen
trading pipeline**, not the wiring job the brief implies. It is the largest item here.

**P3 was never built.** `git log -S"Fake Candle" -- chart-quest.html` returns nothing, ever. It
exists only as a proposal in `CHARTQUEST_GOLDEN_PATH_REVIEW_2026-07-15.md`. So it is new educational
content — which the brief itself rules out — and it cannot be a "regression", because nothing
regressed.

**P1b needs a deploy in a specific order.** A reflection answer is a new analytics event, so it must
be added to `EVENT_NAMES` in `supabase/functions/beta-ingest` **and deployed** *before* the client
that emits it. An unknown name is dropped silently, and a missing stage does not read 0% — the
monotonic pass credits every stage below a player's furthest, so it reads the next stage's count at
100% kept and 0 drop. A healthy-looking row measuring nothing. This exact trap was hit twice in the
previous 24 hours.

**A sibling of P0a, deliberately left alone.** The "WHAT HAPPENED?" analysis block (`11690`–`11727`)
has the same two-state flaw: a profitable **manual** close currently receives loss-flavoured
educational copy. It was excluded from the 349 hotfix because changing which lesson text appears is
an educational-content decision, not a truthfulness fix. It belongs in the sprint.

---

## 5. Beta funnel as it stands — read with §3 in mind

12 players, spanning builds 344 → 349.

```
12  session_start
 8  reached the intro          (tutorial_started)
 2  first_trade_started        ← the real wall
 2  first_trade_won
 2  boss_defeated
 1  beta_completed
 1  survey_submitted
```

**Six of eight players who reached the intro never placed a trade.** That is the finding — and it is
a completely different problem from "they cannot finish the tutorial". It points squarely at the
stretch between the intro and the first trade, which is what P0b/P1a/P1b target.

Two caveats: `play_clicked` reads 1 because it is emitted from the marketing pages and most testers
appear to arrive directly at `/play` — the instrumentation's own comment predicted this. And two
boss-completing players is a thin sample: the *code* findings above are conclusive, but the
*magnitude* of the intro→trade drop needs more testers before anyone acts on it.

---

## 6. Regression status for what shipped

| Requirement | Status |
|---|---|
| Trading unchanged | ✅ `resolveTrade` untouched; gate #10 passes with no override |
| Boss flow unchanged | ✅ not touched |
| Journal unchanged | ✅ labels corrected; structure and data untouched |
| Replay system stable | ✅ badge text/colour only |
| Analytics still firing | ✅ 12 players recording live during the change |
| Survey unaffected | ✅ 1 submitted |
| No educational regressions | ✅ no lesson text, order or gating touched |
