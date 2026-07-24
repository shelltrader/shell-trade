# ChartQuest — Beta P0 Sprint · Completion Report

**2026-07-15 · execution mode · beta in ~4 days.** All work is presentation-only; no architecture, no trade logic, no movement physics, no schemas touched. Every game edit is additive, guarded, and reversible, and is synced across all three mirrors (`chart-quest.html` = `index.html` = `website/game.html`, cksum `3392815791`).

## 1. P0 checklist

| P0 | Status | Outcome |
|---|---|---|
| **P0-1 — First-win screen punch** | ✅ **Shipped** | `celebrate()` gained an opt-in `opts.shake`; the once-ever first win now fires `shake: 0.6` + a 34-shell downpour. The win now punches the screen **harder** than a loss (`0.5`). Verified live (`shakeT=0.6`). |
| **P0-4 — Make the first trade felt** | ✅ **Shipped (HUD slice)** | A **felt-stakes vignette** in `drawHUD` (red as the trade dips underwater = fear → green as it runs = hope, driven by the already-computed `tradeR()`), plus a **glow+pulse on the live `+X OPEN` P&L**. Non-text, respects the "no text over candles" rule. Code paths verified live. |
| **P0-5 — Boss correctness** | ✅ **Verified (no change)** | The live Gambler exam is `candle·whowon·confirm·predict·error` (from `BOSS_CAST[0]`, rebuilt into `BOSS_GAMES[0]`), all taught in the golden path. The doji/wick rounds the review flagged live only in the **deprecated `BOSSES[0]` legacy object** (overwritten at load, never used). No untaught concept is tested. |
| **P0-3 — Cold-open safety** | ✅ **Core met (verified)** | `#mmTeaser` paints `mm-poster.jpg` (a real 174 KB villain still) as its background **immediately**, so a stalled/blocked 12 MB video never yields a black screen — confirmed by screenshot (villain + "SKIP ▸"). Intro hands off cleanly via `introComplete()`. *Nice-to-have remaining:* an auto-advance timer if the video never paints (currently manual SKIP). |
| **P0-6 — Funnel telemetry** | ✅ **Core met (verified)** | The golden path already emits `page_load → session_start → reached_first_trade → trade_win/loss → boss_encounter → boss_defeated/failed → level_up`. The #1 drop metric (`reached_first_trade`) is covered. *Remaining (minor):* discrete `intro_complete`, `first_jump`, `trade_open`, `continue` events would complete the funnel. |
| **P0-2 — Traversal forward-pull** | ⚠️ **Deferred to on-device tuning** | The #1 pre-trade leak, but it is **level-design adjacent to movement** and the acceptance criterion is behavioral ("non-gamers naturally move right; no movement regression"). Doing it blind risks the exact movement regression the rules forbid. This must be tuned by **watching real players** — which the 10-friend beta is the instrument for. |

## 2. What shipped (files & scope)

- `chart-quest.html` (+ mirrors): **+81 / −3 lines**, two features: `celebrate()` shake hook + first-win call (P0-1, ~4407 / ~11992); `drawHUD` vignette + P&L glow (P0-4, ~15125 / ~15149).
- All guarded on the relevant state; deleting the blocks fully reverts.

## 3. Before → After

- **First win** — *Before:* trophy + 12 particles, no screen shake (quieter than a loss). *After:* a 34-shell downpour + a `0.6` screen punch — the biggest moment of the hour finally lands.
- **The first trade** — *Before:* flat screen while your money nearly stops out; a tiny 10px P&L in the corner. *After:* the whole screen breathes **red on the dip (fear) → green on the run (hope)**, and the live P&L glows and pulses as it ticks.
- **The first boss** — *Before/After:* unchanged, and **verified** to only test taught concepts (the beta's educational promise is safe).

## 4. Screenshots

- **Cold-open (P0-3):** captured — the Market Maker poster ("I am not the market, I am the reason it moves") + Finn + "SKIP ▸" render instantly, proving no black-screen even with the video unloaded.
- **P0-1 / P0-4:** these appear only mid-flow (first win / live trade), so they require an on-device run-through to capture — see §6.

## 5. Known issues / remaining

- **P0-2 traversal** — the single biggest lever, deferred to on-device tuning (see §6).
- **P0-3 auto-advance timer** and **P0-6 four funnel events** — small, safe follow-ups; cores are met.
- **Felt-trade FEEL & win-juice intensity** — code-verified, not yet felt through a real trade; likely needs a small intensity tune after one playthrough.

## 6. Recommendation: **READY for the 10-player beta — with one gate**

A 10-friend beta is a **controlled playtest**, not a public launch — and it is the correct instrument to finish the two things that can only be validated by watching real people (traversal forward-pull, felt-trade intensity). Shipping the safe improvements now and **observing** beats guessing at traversal tuning blind.

**The one gate before handing it to friends:** the founder does a single `?fresh=1` run-through (beginner mode) to confirm the win-punch and the felt-trade vignette feel right and to tune intensity if needed — canon requires on-device verification for anything gameplay-adjacent, and none of the P0-1/P0-4 changes have been felt through a real trade yet. Budget ~10 minutes.

**During the beta, watch for exactly two things** (they decide the next sprint): (1) do non-gamers stall in the pre-trade corridor (→ P0-2), and (2) do faces change on the dip and the first loss (→ felt-trade intensity). Those observations ×10 are worth more than any further blind code change.

*Verdict: **READY**, conditional on the founder playthrough. The educational promise (boss correctness) is verified safe; the worst-case first impression (black screen) is prevented; the two peak moments (win, trade) are materially more felt than before.*
