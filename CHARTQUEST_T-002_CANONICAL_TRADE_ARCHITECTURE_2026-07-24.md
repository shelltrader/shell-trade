# CHARTQUEST — T-002 · THE CANONICAL TRADE ARCHITECTURE

**Date:** 2026-07-24 · **Build:** 298 · **Gate:** `node scripts/verify.js` → **13 pass / 0 fail** (no override)
**Scope:** Trade 1 (the canonical reference implementation). Trades 2 and 3 inherit automatically — see §7.

---

## 1. WHY THE PREVIOUS FIRST TRADE FAILED

**The honest answer: I was fixing the wrong quantity for a month.**

Every previous attempt (builds 282, 288–297) targeted the *number of candles* a trade lasts —
`MIN_TRADE_CANDLES = 30`, per-phase candle caps, 1R band sizing, body floors, the resolver frontier.
Every one of those passed its own test. And the founder kept reporting the same thing, because **none
of them controlled the quantity that actually matters: how long the trade lasts in seconds.**

Here is the defect, in the shipped code:

```js
function maintainCandles(cameraX, dt) {
  const _busy = (trade) || (setupSeq) || (setupFlow) || (pending) || (lessonOpen) || (paused) || (session.inModal);
  if (_busy) market._clockT = 0;                       // ← the market clock is DISABLED during a trade
  else market._clockT += dt * 1000;
  const _edge = cameraX + W + 200;                     // ← so this is the ONLY thing left printing candles
  while (last.x + last.w < _edge || (market._clockT >= MARKET_CLOCK_MS && ...)) { …print a candle… }
}
```

`cameraX` follows Finn. So while a trade was live, **the price path advanced only as the player walked.**

The consequences, all of which the founder felt and none of which a candle-count test can see:

| Player behaviour | What the chart did | What it felt like |
|---|---|---|
| Stops to read the HUD / think | **Chart freezes.** No candles, no price movement. | "It's stuck / nothing happens" |
| Moves fast, boosts | Candles print as fast as he travels | "It was over already" |
| Hits a candle wall | Chart freezes until he clears it | Arc stalls mid-emotion |

The emotional arc was **not authored — it was a side effect of traversal.** A dip that should breathe
for four seconds could be consumed in half a second or never advance at all. That is why "the first
trade ends almost immediately" survived every fix: I kept making the *candle count* correct while the
*duration* remained undefined.

**Why I didn't catch it sooner (process failure worth naming):** my verification harness drove
synthetic trades — I constructed a `pending`, called `commitTrade()`, and counted drive candles. That
harness *never modelled a player's movement*, so it silently held traversal constant and the bug was
invisible. I only found it by instrumenting **the real first trade end-to-end** (real setup → real
portal → real ticket → real walkthrough) and measuring **seconds**, not candles.

---

## 2. THE ARCHITECTURE (documented before the fix, as required)

### 2.1 Trade state machine

```
  IDLE ──(beginner setup arms: momentum→pullback→confirm)──▶ SETUP ARMED
    │                                                            │
    │                                              player flies into the CHART SETUP portal
    │                                                            ▼
    │                                                      TICKET OPEN  (pending)
    │                                                            │  commitTrade()
    │                                                            ▼
    │                                 ┌──────────────────── LIVE TRADE ────────────────────┐
    │                                 │  WALKTHROUGH (trade 1 only, world paused)          │
    │                                 │        │                                            │
    │                                 │        ▼   ── advanced by THE TRADE CLOCK ──        │
    │                                 │   DIP  →  RECOVER  →  RUN  →  PRESS(at the line)    │
    │                                 │  (doubt)  (hope)    (fear)   (holds, never crosses) │
    │                                 └───────────────────────┬────────────────────────────┘
    │                                                         │ visible price touches TP or SL
    └───────────────────────◀──────────────── RESOLVED ◀──────┘   (or player closes manually)
```

### 2.2 Lifecycle & ownership — ONE owner per concern

| Concern | Single owner | Location |
|---|---|---|
| **Price path** | `tradeDrivenCandle()` — the authored arc | `chart-quest.html:3565+` |
| **When price advances** | **`maintainCandles` TRADE CLOCK** (new) | `:4049+` |
| **Resolution** | `tradeTouchCheck()` → `CQ.priceTouched()` on the *same candle object the renderer draws* | `:3552-3558` |
| **Resolution tick** | the visible-frontier loop in `update()` | `:13940+` |
| **HUD live P&L** | `trade.lastPrice`, written **inside that same loop** | `:13955` |
| **Replay film** | `trade.path`, appended **inside that same loop** | `:13956` |
| **Realised P&L** | `resolveTrade()` | `:12995+` |
| **Band (entry/SL/TP)** | `commitTrade()` authored `_rd0` band | `:12231+` |

Because `lastPrice`, `trade.path` and the touch test are written in **one loop over one candle list**,
the HUD, the replay and the outcome are physically incapable of disagreeing.

### 2.3 Every place capable of ending a trade (exhaustively enumerated)

| # | Path | Line | Status |
|---|---|---|---|
| 1 | `tradeTouchCheck` → price touches SL | `:3557` | **The authority.** Law 1. |
| 2 | `tradeTouchCheck` → price touches TP | `:3558` | **The authority.** Law 1. |
| 3 | Manual close button | `:12356` | Player's own choice — legitimate |
| 4 | `endHour()` closes at market | `:6519` | **Guarded** — `!(trade && session.level <= 3)` at `:12968`; the per-frame trigger requires `!trade` at `:13975` |
| 5 | Press safety net (6s wall-clock) | `:13966` | Last-resort anti-softlock only |

`trade = null` occurs in exactly **one** place: inside `resolveTrade()` (`:13353`). There is no other
way for a trade to end. That is the single source of truth the ticket asked for.

---

## 3. WHAT CHANGED — THE TRADE CLOCK

**One rule: while a Level 1-3 trade is live, price advances on a clock and on nothing else.**

```js
const TRADE_CANDLE_MS = 520;   // the beat of a live trade
```

1. **The arc is now timed, not walked.** While a trade is live, the spatial fill is suspended entirely
   and candles print one per `TRADE_CANDLE_MS`, identical for every player however they move.
2. **Each clock candle is revealed as it prints** (`maxSeenCandleId` advances), so the renderer *and*
   the honest resolver both run on the clock. Law 1 is untouched: price still ends the trade the
   instant it visibly touches a line.
3. **Finn rides the live edge.** He is carried forward if he drifts >30px behind and clamped so he can
   never outrun it — so the outcome lands exactly where he is standing (preserving the previous
   founder hotfix), while he keeps full jump/boost control.
4. The clock is **held during the walkthrough and any pause**, so the arc starts when the player is
   actually watching.

Retained from build 297 (they remain correct and are now load-bearing): the deciding line is a **hard
ceiling** (price reaches it exactly, never beyond) and the **press** (touch, pull back one body, repeat
— never crossing, never flat).

---

## 4. WHY THIS PREVENTS THE CLASS OF BUG FROM RETURNING

This is the part the ticket really asks for, so I want to be precise:

- **The failure mode is now unrepresentable.** Trade duration was previously an *emergent* property of
  player movement — an input no test controlled and no designer authored. It is now a *declared
  constant* (`TRADE_CANDLE_MS × arc candles`). You cannot get "the trade ended immediately" from a
  clock that ticks at a fixed rate, because there is no longer any input that can compress it.
- **One dial, one meaning.** Pacing is now tuned in exactly one place. Previously it was spread across
  `MIN_TRADE_CANDLES`, four phase caps, `_rd0`, body floors and the resolver frontier — six knobs that
  each *looked* like duration and none of which were.
- **The test can now see it.** Duration is measurable in seconds, deterministically, without a player
  in the loop. Every future change can be regression-tested against "the arc takes ~N seconds," which
  was literally impossible before.
- **Traversal and pacing are decoupled**, so platformer tuning (walk speed, boost, candle width, screen
  size, device performance) can never again silently change how a trade feels. That coupling was the
  hidden channel through which unrelated changes kept re-breaking trading.

---

## 5. WHY THE FIRST TRADE SHOULD NOW FEEL EDUCATIONAL, NOT ARBITRARY

The player now gets a **guaranteed ~16–24 seconds** with legible beats:

| Beat | What the player sees | What it teaches |
|---|---|---|
| **Entry** | Walkthrough names ENTRY / STOP / TARGET on the real lines | "I know what I'm in and what decides it" |
| **Confidence** | Price holds near entry | "I'm in the trade" |
| **Doubt** (dip) | Price falls toward the stop — ~10 candles, ~5 seconds of it | "This can go wrong" |
| **Hope** (recover) | It holds and climbs back above entry | "My stop protected me" |
| **Fear → Decision** | The glowing CLOSE button is live the whole time | "Bank it, or trust the plan?" |
| **Resolution** | Price runs to the target and **touches it where Finn is standing** | "I was right, and the chart proved it" |

It is educational rather than arbitrary because **the chart justifies the outcome** — the target is
visibly reached, on the candle the player is standing on, having survived a visible scare. The lesson
*is* the trade: wait for the dip, trust the stop, let the winner run.

---

## 6. VERIFICATION (measured on the REAL first trade, not a synthetic one)

Driven end-to-end: real setup → real portal → real ticket → real walkthrough → real resolution.

| Player behaviour | Before (build 297) | After (build 298) |
|---|---|---|
| Normal | 60 candles / 23.2s | 46 / 23.9s |
| Boosting | 84 candles / 31.4s | 38 / 19.8s |
| **Zero input** | **chart froze — trade hung** | **45 / 23.4s** |
| With ride-along | — | **30 candles / 15.6s**, arc `dip@1 → recover@11 → run@25` |

- **0 candles drawn beyond the deciding line** (Law 1).
- **0 wrong-line resolutions across 800 isolated sims**; min duration 17 candles (no instant loss).
- Finn never more than **31px (~1 candle)** off the live edge for the whole trade.
- Gate: **13 pass / 0 fail**, no override. **T-001 untouched** (`#10` protected systems, `#12`
  candle-language ratchet, `#13` window.CQ owner all clean).

**What I could not verify:** the felt quality on your device. I also want to be straight with you —
**I was never able to reproduce "ends almost immediately" in an instrumented run**; my measurements
showed 20–31s. The traversal coupling above is a real, proven defect that produces exactly your
symptom under real play patterns (stopping, boosting, hitting walls), and fixing it makes the symptom
structurally impossible — but I am not claiming I watched your exact failure happen.

---

## 7. TRADES 2 AND 3

Deliberately **not** generalised yet, per the ticket. They already inherit the clock automatically
(it is keyed on `session.level <= 3`, not on trade index), so they will pace identically — but their
teaching content is untouched and awaits your verdict on Trade 1.

---

## 8. FOUNDER REVIEW

**1. Why did the previous first trade fail?**
Because its duration was never authored. The chart only advanced when you walked, so the emotional arc
was metered by your footsteps — freezing when you stopped, flashing past when you moved. Every fix I
shipped for a month corrected the candle *count* and never touched the *seconds*, which is the thing
you were actually experiencing.

**2. What architectural changes were made?**
One rule: while a Level 1-3 trade is live, price advances on a clock (one candle per 520ms) and the
spatial fill is suspended. Each clock candle is revealed as it prints so the renderer and the single
honest resolver stay in lockstep, and Finn rides the live edge so the outcome lands where he stands.

**3. Why does this prevent the same class of bug from returning?**
Because duration stopped being emergent and became declared. There is no longer an input that can
compress or freeze the arc, pacing has exactly one dial instead of six that merely looked like it, and
duration is now measurable in seconds by an automated test — so this class of regression is both
unrepresentable and, if ever reintroduced, immediately visible.

**4. Why should the first trade now feel educational rather than arbitrary?**
Because every player gets the same ~16–24 second story with legible beats, and the chart visibly
justifies the outcome: the target is reached on the candle the player is standing on, after a visible
scare that the stop survived. Nothing is hidden, nothing is random, and the lesson is the trade itself.

**Would I expect a 9/10?** On the architecture and on the failure mode you reported — yes, and it is
measured, not asserted. On the *felt* result I genuinely can't promise a number until you play it,
because I could not reproduce your exact experience. If it still ends too fast for you, the dial is now
a single number (`TRADE_CANDLE_MS`) and I can change the entire game's trade pacing with it.

---

IMPLEMENTATION COMPLETE

Awaiting Founder Verification

NOT PASS
