# CHARTQUEST — T-002 IMPLEMENTATION REPORT

**Date:** 2026-07-24
**Build:** 296 (source `chart-quest.html` + deployed mirror `index.html`, byte-identical)
**Gate:** `node scripts/verify.js` → 12 pass / 0 fail (with `CQ_ALLOW_PROTECTED=1` for the pre-existing build-274/293 Movement-CFG drift; see §5).
**Companion:** [CHARTQUEST_T-002_L1_CURRICULUM_AUDIT_2026-07-24.md](CHARTQUEST_T-002_L1_CURRICULUM_AUDIT_2026-07-24.md) (the audit that scoped this).

---

## 1. WHY THE PREVIOUS IMPLEMENTATION FAILED

**The headline finding: the shipped source didn't run.** Build 295 contained a half-finished rename `TRADE_MIN_BODY` → `TMB`. `TMB` was referenced **10 times** and declared **zero times**, so `commitTrade()` threw `ReferenceError: TMB is not defined` at [chart-quest.html:12229](chart-quest.html) — *before* it set the authored outcome, the widened band, `trade.path`, or the first-trade walkthrough — and `tradeDrivenCandle()` threw on its first call. A `try` inside `frame()` swallowed both, so instead of a crash the **chart silently froze for the whole trade**.

Two consequences explain the confusing founder reports:

1. **Two different games wore the same build number.** The deployed `index.html` was a *different* "build 295" (still on `TRADE_MIN_BODY`, different `_rd0`, no `_bodyFloor`) that actually worked. The QR/LAN test URL (`scripts/cq.sh`) serves the *broken source*. So founder feedback and the file under test could describe different builds.
2. **The 295 verification never loaded the shipped file.** Its changelog claims "4,800 sims, 0 wrong-line, p10 21-32 candles" — impossible against a file whose drive throws on call 1. The Node harness supplied its own `TMB`. *A verification harness that doesn't load the actual shipped file is not verification.* That is the process defect behind the whole 288→295 run.

Beneath the crash, one genuine **Law 1 hole** survived every prior attempt: the resolver frontier and the renderer both key off `maxSeenCandleId + 2`, but at entry the free-roam generator has already printed 1–2 candles just ahead of Finn — drawn, but skipped by the per-trade cursor. A long taken off a momentum candle could **visibly spike into the target while the trade carried on**. That is the "price appeared to violate TP/SL" the founder saw on trade #2.

The founder's separate "trade #1 stopped out in ~3 candles (0/10)" could **not** be reproduced by either the fixed drive or the mirror (both never instant-lose in simulation), so it belonged to an earlier build; the fixes below make it structurally impossible going forward.

---

## 2. EVERY SYSTEM CHANGED

All changes are in the T-002-legal surface (trade lifecycle, resolver, intro sequencer). **No T-001 system was touched** (§4).

| # | Change | Location | What it does |
|---|--------|----------|--------------|
| A | **Unbreak `TMB`** | `chart-quest.html:3538` | Declared the const the rename forgot (`const TMB = 22`). `commitTrade` + `tradeDrivenCandle` run again. |
| B | **Law 1 — drive owns every visible post-entry candle** | `commitTrade`, ~`:12275` | At a Level 1–3 trade open, drop the free-roam overhang ahead of the live edge (`id > maxSeenCandleId`), re-seed `market.level = entryH`, set the resolver cursor to the entry. From entry forward, *every drawn candle is a driven candle the resolver ends the trade on.* Nothing already **seen** is dropped; loose shells past the truncated edge are pruned so nothing floats. |
| C | **Law 2 — anti-hard-lock backstop** | `update()` wall-block, ~`:13652` | A live trade advances as Finn walks, and the winning "run" prints rising candle walls. If Finn is genuinely wall-blocked on the ground for **2.5 s** during a Level 1–3 trade, one auto-hop frees it. Dormant in active play (the player jumps first), so the felt tempo is unchanged; it exists purely so a set-down phone can't hang a trade. Traversal only — never reads/writes price, outcome, SL/TP, or the resolver. |
| D | **Curriculum order** | `beginIntroFirstTrade` `:17677`; `armExplore`/`onCandleEntered` breather; `teachThenNextTrade` concept map `:13360/:13379` | Restored the founder's intended Level 1 order (§3). Trade 1 now comes straight after reading candles; momentum is taught **after** trade 1, pullback after trade 2. |
| E | **Re-mirror** | `index.html` | `cp chart-quest.html index.html` → byte-identical. The deployed game is now the same build 296 as the source. |

**Trade-resolution ownership is now single-source** (the T-002 engineering requirement). Price resolution flows through exactly one path: the visible-candle frontier loop in `update()` → `tradeTouchCheck()` → `CQ.priceTouched()` on the *same candle object the renderer draws*. `lastPrice` (HUD), `trade.path` (replay film), and the touch test all live in that one loop, so HUD, replay, P&L, and resolution cannot disagree. Change B removed the last upstream authority that could contradict it (a free-roam candle mutating the visible chart behind the resolver's back).

---

## 3. THE EMOTIONAL DESIGN OF THE FIRST TRADE

**The intended player experience, beat by beat:**

The player has just learned to *read* a candle — green is buyers winning, red is sellers. They predicted a colour and were right. That confidence is the on-ramp. Now, straight away (no lecture in between), the game says **"This is the moment — your first REAL trade."** A hard-stop card. They tap **I'M READY**.

A setup forms. They take it. The chart freezes and an **ENTRY → STOP → TARGET** walkthrough points at the three lines that will decide everything, so a beginner *knows they are in a trade*.

Then it plays out as a story, not a coin flip:

- **Entry → confidence.** Price sits at their entry. They committed real shells; the world hushes.
- **Doubt → fear.** Price *dips* toward the stop — the scare, felt on every win. "Oh no…" It gets within ~72% of the stop but the authored path never lets it *touch* the stop on a win.
- **Hope.** It **holds** — the stop protected them. "Phew."
- **Resolution.** It recovers above entry and **runs to the target.** The target is *genuinely touched* on the visible chart, and that is the exact instant the trade resolves as a win. They earned it; the chart proved it.

The lesson **is** the trade: *wait for the dip, trust your stop, let the winner run.* Losing (the authored First Loss at Level 2) teaches the same trust from the other side — "you read it right and it still lost; look how small the stop kept it."

**Why the founder's order matters here:** learning momentum *before* the first trade front-loaded theory onto a player who hadn't yet felt what a trade *is*. Now the sequence is **do, then understand**: take your first trade on instinct (green = up, which you were just taught), *then* learn momentum as the name for what you just felt, and apply it on trade 2. Reading → doing → naming → applying.

---

## 4. T-001 SYSTEMS THAT REMAINED UNTOUCHED

Verified by `git diff HEAD` inspection and by verify.js gates #10/#12/#13. **Zero edits** inside any of:

- `scriptedCandle` (`:3270-3457`) — the educational market generator
- `MKT`, `MKT_TUNE` (`:3192-3269`) — regime tables
- `decorateCandleWicks` (`:3889-3952`) — the WICK LAW
- The LessonChart `SCENES` table
- `CONCEPT_PRACTICE`
- The opening chart history (`initCandles`, `:3974-3993`)
- `window.CQ` — the Phase 2A frozen market-engine owner (gate #13: owner published, COLOR still derives from CQ, spine matches Constitution A.6)
- Candle body sizing, wick frequency/sizing, terrain rhythm, shell density

Gate #12 confirms **no new candle-language divergence** (313 ≤ baseline 314). Gate #13 confirms `window.CQ` integrity. The founder-approved feel of Level 1's *chart* is byte-unchanged.

*(One founder-facing curriculum item is deliberately deferred because it would cross this boundary: splitting the combined green/red lesson into two lessons edits the T-001-locked SCENES table. Left as a founder call — see §7.)*

---

## 5. REGRESSION TESTING

**All run in-browser against the served file (not a detached harness).**

### T-001 remains locked
- `node scripts/verify.js`: #11 "curriculum order intact · outcomes AUTHORED · L1-3 fast-loss GUARDED", #12 candle-language ratchet holds, #13 window.CQ owner intact.
- The one `#10` warning is **pre-existing** Movement-CFG drift (`minBody 15→18`, `collideInset: 8`) introduced by builds **274/293**, confirmed by `git diff HEAD` on the CFG block — **not** this ticket. My edits touch no CFG value.

### Trade truth now works (Law 1)
- Integrated live trade with a **real 15-candle overhang** present: resolved as a genuine win at the target, **0 unresolved line-crossings across 1898 frames**.
- 1,200 isolated sims through the **real** `tradeDrivenCandle` + **real** `CQ.priceTouched` (long/short × win/loss × 6 entry heights × 50 reps): **0 wrong-line resolutions.** Every authored win resolves at TP, every authored loss at SL → HUD, replay, and P&L agree with the chart.

### First trade is educational (Law 3 — no instant loss)
- Same 1,200 sims: **global minimum duration = 18 candles** (never 3). Win median 30–55, loss median 28–37. Sub-22px bodies only in one extreme cramped cell (short at the price floor, ~3%).

### No hard-lock (Law 2)
- 6/6 fully-passive runs (zero player input) resolved; the anti-hard-lock backstop frees a stalled trade. In active play (player jumping) the backstop never fires and durations are the healthy ~50-candle arcs above.

### Curriculum order
- Direct trace: bet → `beginIntroFirstTrade` → lesson-free breather → I'M READY → **trade 1**; trade 1 resolve → **teach momentum**; trade 2 resolve → **teach pullback**; trade 3 resolve → **the Gambler**. Confirmed programmatically.

**Not verified here (founder's job):** the *felt* quality on a real device (the hidden test tab can't repaint pumped frames for a screenshot), and the traversal-decoupling decision (§7).

---

## 6. FOUNDER REVIEW

**Why did the first trade fail?**
Because on the source you'd have loaded from the QR, it didn't run at all — a `TMB` ReferenceError froze the chart the instant you opened a trade. On the deployed mirror it *did* run, but a free-roam candle printed at entry could visibly cross a line the resolver ignored, so the chart could contradict the result. And the curriculum taught momentum before you'd ever felt a trade.

**Why is the new first trade better?**
It runs. It cannot instant-lose (min 18 candles, measured across 1,200 sims). The chart cannot disagree with the outcome — the drive owns every candle you can see from entry forward, so what you watch *is* what resolves the trade (0 wrong-line, 0 unresolved crossings). It tells the intended story (confidence → dip/fear → hold/hope → run/resolution). And it lands right after you learn to read candles, exactly where you asked for it.

**How does it teach?**
The trade *is* the lesson: wait for the dip, trust your stop, let the winner run. Then momentum is named for what you just felt, and you apply it on trade 2 (do → understand → apply). Losing (the Level-2 First Loss) teaches the same trust from the other side.

**Would I honestly expect you to rate it ≥ 9/10?**
On **truth and fairness** — yes, and it's measured, not asserted: the chart never lies now and a trade never instant-loses. On **curriculum order** — yes, it's your exact sequence. On **felt quality** — I can't certify a 9 for you, because feel needs your hands on a device and because I deliberately did **not** ship the one change that would make a *passive* watch perfectly smooth (decoupling the trade's live edge from your footsteps). That's your call (§7). So: I expect a strong jump on the things I could verify, and I'm not going to claim the 9 on feel until you've played it.

---

## 7. WHAT'S DEFERRED — YOUR DECISIONS

1. **Full traversal decoupling (recommended next).** Today a live trade advances as Finn walks; the 2.5 s backstop stops a hard freeze, but a player who just *watches* still sees the arc lurch rather than flow. The real fix is to advance the trade's live edge on a gentle clock with the camera following it, so the story unfolds smoothly whether you climb or watch. It changes trade *feel*, so it's yours to greenlight. (Carried over from build 295's own flagged note.)
2. **Split green/red into two lessons.** Your intended list names "Green Candle Lesson" and "Red Candle Lesson" separately; today they're one combined lesson that teaches both. Splitting edits the **T-001-locked** SCENES table, so I left it — your call whether to unlock T-001 for it.
3. **Commit the backlog.** HEAD is build 271; builds 272–296 are all uncommitted, which blinds the regression gates that diff against HEAD. Committing would restore their signal.

---

IMPLEMENTATION COMPLETE

Awaiting Founder Verification

NOT PASS
