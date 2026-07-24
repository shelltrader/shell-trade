# ChartQuest — CRITICAL FIX: The L1–3 Fast-Loss Bug
## Diagnosis & Fix · Build 282

**Date:** 2026-07-22 · **Build:** 281 → **282** · **Severity:** P0 — the single most damaging bug on the golden path · **Gate:** `verify.js` 10 pass · 0 fail · 1 warn (pre-existing CFG) · 1 skip

**The report:** a brand-new player's **first trade lost in ~2 candles** (with the loss sting), and the **second lost in ~3**. Two instant losses before the player understands anything. This is exactly the experience the whole authored system exists to make *impossible* — and it kept happening.

**The verdict:** it was a real, reproducible code bug — three separate holes that lined up. All three are now closed, plus a **build-gate guard so it can never silently come back.**

---

## 1. Why this should have been impossible (the intended design)

Levels 1–3 are supposed to be **authored and driven**:
- The outcome of every L1–3 trade is decided at entry (`authoredTutorialOutcome()` / the forced intro wins) — **L1 is all wins**; the *only* authored loss is L2's 2nd trade (the designed "First Loss"), and even that must **breathe for 30+ candles** first.
- The chart is then **driven** (`tradeDrivenCandle`) to march price to the decided line — a win dips scarily toward the stop but is **clamped ≥0.10R above it** and never touches it.
- `MIN_TRADE_CANDLES = 30` is supposed to guarantee every trade lasts ~30+ candles so the player *feels* the arc.

If all of that held, a first trade could not lose, and could not end in 2 candles. So something was breaking the chain.

## 2. Root cause — three compounding holes

**Hole ① — the outcome wasn't always authored (`commitTrade`).**
The code only set the authored outcome + the clean 2R stop/target band **when `sIdx >= 0`** — i.e., when Finn was standing squarely on a candle at the instant of entry. If he was **airborne, between candles, or the setup index was stale (`sIdx < 0`)**, *neither* authored branch ran → the trade had **no `_l1Outcome`** and kept whatever raw stop/target the panel computed.

**Hole ② — the chart only got driven if the outcome was already set (`nextCandle`).**
The drive gate was `if (_lvl <= 3 && trade && trade._l1Outcome) return tradeDrivenCandle()`. With `_l1Outcome` unset (Hole ①), this was **false** → the live trade **fell through to honest / scripted candles** that drift wherever price goes. Price was no longer being protected from the stop.

**Hole ③ — the stop-out had no floor and no outcome check (`resolveTrade` gate).**
The universal rule was:
```js
if (hitSL) { resolveTrade('loss'); }        // ← fires the INSTANT price touches the stop
```
**No `MIN_TRADE_CANDLES` gate. No `_l1Outcome` check.** The 30-candle floor was applied *only* to the win path and the Finn-reaches-the-line loss path — **not** to this raw stop-touch.

**The chain:** off-candle entry (①) → no drive, honest candles (②) → an honest candle drifts onto the stop → the unguarded rule (③) ends it **instantly as a loss**, with the loss sting, in 2–3 candles. Every protection bypassed.

## 3. Why it kept happening ("we've been trying to fix this forever")

Two reasons it was so slippery:

1. **The win's safety depended on *two* fragile preconditions both being perfect** — the outcome being set at commit *and* the drive keeping every candle off the stop. Past fixes kept patching the *drive* (clamps, no-wick, standoffs) to keep price off the stop — but never removed the **unguarded escape hatch** underneath it. Any single imperfection (an off-candle entry, a stale index) reopened the wound.
2. **A stale comment actively hid it.** The resolve block claimed L1–3 was a *"~58% win / ~42% loss"* system. It isn't — it's all authored wins plus one designed loss. But that comment made a fast loss look like *"the expected 42%, working as intended,"* so the bug read as a feature. **That comment is now corrected.**

## 4. The fix — defense in depth (all three holes closed)

| Fix | Where | What it does |
|-----|-------|--------------|
| **A — always drive** | `nextCandle` | A live L1–3 trade **always** drives now (the `&& trade._l1Outcome` requirement is gone); if the outcome is somehow unset it **defaults to a win** *before* generating the candle. Price is never left to drift onto the stop. |
| **B — always author** | `commitTrade` | The authored-outcome + clean-band branch **no longer requires `sIdx >= 0`** — every L1–3 trade gets its authored outcome and clean 2R band, on-candle or not. |
| **C — guard the stop-out** | `resolveTrade` gate | The universal stop-out can **no longer fire during an authored L1–3 trade**: a **WIN can never stop out**, and the authored First Loss must **breathe `MIN_TRADE_CANDLES`** first (matching the drive's own stop-out standoff). **L4+ honest trades are unchanged** — they still stop out the instant price touches the stop. |

Together they make a fast/unearned L1–3 loss **structurally impossible**: the outcome is authored at commit (B), the chart is always driven safely (A), and even if the drive ever slipped, the resolver refuses to end it early (C). **Every L1–3 trade now lasts 30+ candles and resolves as authored.**

## 5. The system that prevents it from ever returning

Per your ask for "a system that prevents this" — I added a **regression guard to the ship gate** (`verify.js` #11). It **FAILS the build** if either vulnerable pattern is ever reintroduced:
- the unguarded `if (hitSL) { resolveTrade('loss') }`, or
- the drive-only-when-outcome-set gate.

The gate now reports **"L1-3 fast-loss GUARDED."** No future edit can silently bring the bug back — the ship will refuse.

## 6. Verification

| Check | Result |
|---|---|
| Both vulnerable patterns removed from source | ✅ confirmed absent (grep) |
| **Decision logic — the exact bug scenario** | ✅ `L1 win, stop touched @2 candles → does NOT resolve loss` |
| Authored First Loss still fires | ✅ `L2 loss @30 candles → resolves` (and NOT at @10) |
| L4+ honest trades unchanged | ✅ `L5, stop @2 → resolves loss immediately` |
| FIX A drive gate | ✅ an unauthored L1 trade now drives (was the bug) |
| Boot (build 282, `?fresh=1`) | ✅ zero console errors; 50-frame pump clean |
| `verify.js` gate incl. new guard | ✅ 10 pass · 0 fail · "L1-3 fast-loss GUARDED" · MIN_TRADE_CANDLES=30 · authored outcomes intact |
| Mirror | ✅ sha256 identical |

**Honest limitation:** the decision logic is *proven* (a unit test of the guard passes every case, and both bad patterns are provably gone), but I can't drive a *full live trade to completion* in this harness (it can't reach active gameplay past the cinematic, and can't screenshot the canvas). **Please confirm on device** (QR, build 282): take the first two trades and verify they now play out over ~30 candles and win — the dip should feel scary but the stop should never actually hit.

## 7. What to watch / improve next

- **On-device confirmation** of the first two trades (above) — the one thing the harness can't do for me.
- **The First-Loss-at-`sIdx<0` edge:** if the L2 First-Loss trade is ever committed off-candle, FIX A/B now author it correctly *as a win-or-loss per the schedule* — but if you want the First Loss guaranteed even in that rare case, it's already handled by FIX B (the authored branch runs regardless of `sIdx`). No action needed; noted for completeness.
- **The `DEV_ALWAYS_FRESH` / deploy-cache items** from the Operation First Impression audit still stand (they don't affect this bug, but they affect whether players receive this fix — bump the SW cache when you deploy).

*This was the bug that could sink the whole funnel: a beginner who loses their first two trades never comes back. It's closed at three layers, and the gate now guarantees it stays closed.*
