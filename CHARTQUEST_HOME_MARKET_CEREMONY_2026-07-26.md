# Home Market Ceremony — the final step of the tutorial

**Date:** 2026-07-26 · **Branch:** `feature/home-market-ceremony` · **Commit:** `3588503` (off `c0e819a`, build 298)
**Status:** BUILT + logic-verified. **NOT merged, NOT deployed.** `index.html` untouched.
**Test:** `http://192.168.1.34:8178/chart-quest.html?hmc&cb=1` — `?hmc` jumps straight to the ceremony.

---

## The funnel

```
website → FREE PLAY → movement tutorial (Journey) → CHART SELECTION → gameplay
```

## What it does

| beat | what happens |
|---|---|
| **choose** | eight premium cards — float, glow, light-sweep, chart-style preview behind each, its own character line |
| **chosen** | card lifts, ring of light expands, particles burst in the market's colour, the other five recede |
| **welcome** | "Welcome to Tesla." held ~1.1s — does not linger |
| **celebrate** | ~1.9s of radiating light + swirling particles in the chosen colour |
| **dive** | candles rush past; the player falls **through** the market into the level |

Control is handed over **mid-dive** (measured: tick 274 of ~330), so the real game boots and runs
underneath while the final frames dissolve. There is never a loading seam and it never fades to
black — the first seconds of play are a continuation of the cinematic.

## 100% cosmetic — enforced structurally, not by convention

A Home Market changes colour, logo, name and accent. It does **not** touch chart logic, RNG,
progression, difficulty, lessons, bosses, achievements, the economy, or any educational system.

Two structural guarantees, because "we just won't call it" is not a guarantee:

1. `_enterGameWithMarket()` is a copy of `_confirmFaction()` with `fetchMarketData` **deliberately
   omitted**. Levels are hand-authored for teaching, so the choice can never alter price action.
2. `fetchMarketData()` now returns early for any cosmetic market — otherwise a returning Apple
   player's boot would fire `?symbol=null` at Binance on every load.

**Candle bodies stay canon green-up / red-down everywhere** — card previews and the dive included.
A skin may tint the grid, glow and backdrop; it may never recolour a candle, because candle
language is a taught concept, not decoration.

## Adding future markets is one data entry

`HOME_MARKETS` drives the entire ceremony. Apple, Tesla and S&P 500 shipped in the first pass as
the first cosmetic-only markets (`symbol:null, cosmetic:true`).

**This was then cashed in for real:** adding **NVIDIA** and **Gold** on founder request needed a
`FACTION_CONFIG` entry, one `HOME_MARKETS` line, one `FACTION_META` line and a vector mark each —
no UI code, no ceremony logic, no flow changes. XRP / EUR-USD / anything else is the same shape.

`motif` was a dead field in the first pass (its comment pointed at a `drawMotif` that never
existed). It is now real: it maps to a `.hmc-m-*` class that varies idle timing, so calm markets
breathe slowly, the index drifts upward, and Tesla's halo flickers. Transform/opacity only.

## Journal — wired, not redesigned

The choice sets `playerFaction`, which the existing journal Home Market field, account panel, chart
badge, accent colour, telemetry and cloud save already read. Verified live: the field renders
`⬡ S&P 500 (SPX) Chart`. No journal code was touched.

## Integration with "Journey Through the Blockchain"

The Journey (branch `feature/blockchain-journey`, build 274-EXP) currently ends by calling
`_confirmFaction(key)`. On merge that becomes exactly one line:

```js
BlockchainJourney.start('BTC', function () { window._afterMovementTutorial(); });
```

Nothing else about the Journey changes. `_afterMovementTutorial` is idempotent (`_marketBound`) and
tears down any lingering cinematic before taking the screen.

---

## Three bugs found and fixed while building

1. **Every crypto logo silently fell back to an emoji** — Ethereum's `Ξ` rendered as what reads like
   a hamburger-menu icon, Solana as plain circles. `coinIconSVG` lives inside the auth IIFE and was
   out of scope. Now exposed, so the ceremony and the account panel share one source of truth.
2. **The ceremony could start twice.** The cinematic kept running underneath and re-fired the
   handoff, restarting the ceremony mid-fade (caught as `t: 0.14` on a supposedly settled screen).
   Guarded with `_marketBound`; `?hmc` now suppresses the cinematic outright.
3. **The entrance depended on rAF and CSS transitions** — both freeze while a tab is backgrounded,
   so the overlay could sit invisible at opacity 0 over the old screen. The root is now opaque
   immediately; the entrance is carried by the staggered content animations.

## Verification

Frame-pump at mobile 375×812, zero console errors throughout.

- All 6 markets select → bind → hand off with the correct key.
- **0 DOM/CSS leaks** after six full cycles (`#hmcRoot`, `#hmcStyle`, `#hmcWelcome` all removed).
- Picking an equity leaves `dataSource` at `SIM REPLAY` and fires **no** network request.
- Fresh-player boot correctly waits for the cinematic and binds nothing.
- Driving the real `IntroCinematic.onDone` hands the screen to the ceremony and tears the cinematic
  down (video stopped, `cineOwn` removed).

Screenshots captured for the choose, chosen, welcome and dive beats.

---

## Open items for the founder

1. **The opening cinematic still has its BTC/ETH/SOL portal pick.** It's structural — it triggers
   the warp/plunge that ends the cinematic — so I made the ceremony *authoritative* rather than
   surgically rewriting a protected system. The cinematic's key is now only a fallback. **But the
   player is still asked to pick twice**, which dilutes the ceremony. Re-authoring that beat as a
   non-choice (single portal / auto-dive) is a small, separate ticket on the cinematic.
2. **The chart badge still reads e.g. "BTC/USDT 1m · BINANCE"** for crypto, because the *boot* fetch
   is untouched pre-existing behaviour. Now that levels are pre-authored, that live fetch drives
   nothing and the label arguably misrepresents the chart. Ripping it out changes what existing
   players see, so I did not do it unilaterally — say the word and it's a small, contained change.
3. **Eight cards on a small phone** now means ~1.5 screens of scrolling (2 columns × 4 rows). It
   reads fine and the grid is `auto-fit`, so desktop packs them wider automatically — but if you
   want everything visible at once on a 375px screen, say so and I'll shrink the cards and cut the
   character line to a single clause.

## Next steps

1. Founder plays the ceremony on device → feedback on feel, copy and card personalities.
2. Merge order: Journey first, then this branch, then swap the Journey's completion to
   `_afterMovementTutorial()` (one line, documented above).
3. Both branches are off older bases (Journey off 271, this off 298) while main is at 300 with
   uncommitted work — rebase both onto a cleaned-up main before merging.
