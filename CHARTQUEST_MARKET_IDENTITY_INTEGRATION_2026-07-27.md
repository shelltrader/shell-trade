# Market Identity System — production integration report

**Build:** 305 · **Branch:** `feature/home-market-ceremony` (off `c0e819a` = build 298)
**Date:** 2026-07-27 · **Status:** implemented + adversarially verified, gate green (14 pass / 0 fail), **not merged, not deployed**
**Test:** `http://192.168.1.34:8178/chart-quest.html?hmc` — `?hmc` opens the ceremony directly

---

## 1. Summary of implementation

The player's Home Market is now a real identity priced at today's market. Pick Bitcoin and the chart
reads $64,7xx; pick Gold, $4,0xx; pick Solana, $75.xx — live, refreshed while playing, cached for the
next visit, and falling back to a labelled anchor when offline.

**The chart itself did not change.** Prices are a display layer, and that is now structural rather
than a promise: the price module contains no reference to `MARKET_DATA`, `prePopulateHTF` or any
candle generator, and `verify.js` check #14 fails the build if one is ever added.

The audit that gated this work returned the key verdict:

> Swapping `priceBase` to a live value is SAFE for gameplay. The dollar price is a pure passenger —
> every gameplay quantity (terrain, collision, entry/SL/TP, win/loss, P&L, shells, boss, lesson
> gating, pattern detection) is computed in HEIGHT UNITS. Dollars are derived FROM height, never the
> reverse.

**Three real bugs were found and fixed on the way — all pre-existing, none introduced by this work
except where noted:**

| # | Bug | Impact |
|---|---|---|
| 1 | The five non-crypto markets had **no price anchor** — `lastKnownPrice` fell through to `\|\| 100` | Apple/Tesla/NVIDIA/Gold/S&P rendered a **permanent $100 chart**. Introduced by the ceremony branch when cosmetic markets were added; would have hit the next playtest. |
| 2 | `MARKET_DATA` was seeded **per ticker** (own seed + volatility) and was also **overwritten by live Binance candles** | Level 4+ terrain differed by market — a Solana player got **1.55× a Bitcoin player's volatility**, a different game taught as the same one. Directly violated the spec's identical-gameplay rule *and* "no live candles". |
| 3 | The price ladder floored its range at `Math.max(1, …)` | Assumed Bitcoin-sized numbers. Any market whose visible span is under $1 — i.e. **under ~$230** — thinned out or vanished. Measured: **Solana 2 labels, Dogecoin 0 labels (blank axis)**. |

Plus: the HUD badge drew **no glyph at all** for the five new markets (the `if/else` chain simply
ended); journal trades now record which market they were taken on; and the price cache is
timestamped so a weeks-old number is never presented as live.

---

## 2. Files modified

| File | Change |
|---|---|
| `chart-quest.html` | Price anchors for all 8 markets; one shared `TRAINING_REPLAY`; new `MarketPrice` module; `applyHomeMarketSkin` now owns the dollar basis; price-ladder range + step-aware formatting; `drawCoinGlyph` branches for the 5 new markets + a default; journal market stamp; timestamped price cache |
| `scripts/verify.js` | **New check #14 — Market Identity gate** |
| `supabase/functions/market-price/index.ts` | **New.** Equity/index price proxy — written and committed, **not deployed** (see §8) |
| `index.html`, `website/game.html` | Mirrored from source (`cq.sh mirror` + `site`) |
| `sw.js` | Cache bumped `v298 → v301` |

Untouched: every lesson, pattern, boss, trade, replay, notebook, achievement, progression and
telemetry system. Protected-systems check (#10) passes — Finn / CFG / save keys / lesson set / boss
engine byte-identical to HEAD.

---

## 3. Data providers selected, and why

Chosen against what **actually works from a browser**, measured during authoring rather than assumed:

| Provider | CORS | Key | Verdict |
|---|---|---|---|
| **Coinbase** | `*` | none | **PRIMARY** for BTC/ETH/SOL, and GOLD via **PAXG** |
| **Binance** | `*` | none | **Fallback only** — geo-blocked in the US, so it must not be primary |
| Yahoo Finance | **none** | none | **Unusable from a browser.** Also rate-limited us mid-session on 3 of 5 symbols |
| Stooq | **none** | none | Unusable — no CORS header |
| Finnhub / Twelve Data / Polygon | n/a | **required** | A key in a single static HTML file is public — server-side only |

Two consequences worth stating plainly:

- **Gold is live and keyless** via `PAXG-USD`. PAXG is LBMA-redeemable and tracks spot XAU within a
  fraction of a percent, so gold behaves like crypto instead of needing the proxy. Verified live at
  **$4,059.99**.
- **Equities and the index cannot be fetched from the browser at all.** They are served by the edge
  proxy in `supabase/functions/market-price/` — written, committed, **not deployed** (§8). Until it
  is, Apple/Tesla/NVIDIA/S&P display an **honest anchor**, reported by the code as
  `kind: 'anchor'` rather than being dressed up as live.

The proxy deliberately uses `Access-Control-Allow-Origin: *` and an IP rate limit instead of this
project's usual `ALLOWED_ORIGINS` allowlist. It serves nothing but already-public prices — no user
data, no auth, no secrets — so an origin check would protect nothing, and that same allowlist has
**already caused one silent production outage** here (the Netlify → Cloudflare move 403'd every
telemetry and cloud-save call because the list still named the old domain). It must be deployed
`--no-verify-jwt`; both existing functions require a JWT, which guests do not have.

---

## 4. Price refresh strategy

- **On selection** and **on returning-player boot** — one call, through the single owner
  (`applyHomeMarketSkin`), so both doors behave identically.
- **Every 5 minutes** thereafter, **paused entirely while the tab is hidden**, plus one refresh on
  becoming visible again. A training anchor does not need tick-by-tick data.
- **Deduped per market** with an in-flight promise, so the three calls that can occur in one
  first-play session collapse into one request.
- **2.5s AbortController timeout.** Nothing in the game awaits it; the synchronous anchor is always
  assigned first, so a slow or dead provider is indistinguishable from being offline.
- **Never mid-decision.** A quote arriving while `trade || pending` is cached for the next level
  init but does **not** move the visible axis — the ladder never shifts under a live decision.
- **Validated before use:** finite, positive, and within a sane band of the market's anchor. A
  malformed body, a negative number, or a wrong-symbol reply is rejected rather than rendered.

---

## 5. Walkthrough report

Driven at 375×812, music off, frame-pumped.

| Stage | Result |
|---|---|
| Website → FREE PLAY | n/a on this branch (marketing site unchanged) |
| **Market Selection** | ✅ 8 cards, fresh player, no prior faction |
| **Game Start** | ✅ Selected Apple → persisted `cq_faction=AAPL`, ceremony torn down, 0 DOM leaks |
| **Tutorial** | ✅ `introFlow.phase='run'`, level 1, lesson card open |
| **Movement** | ✅ Drove 2,600 frames; candles 47 → 105, shells 5 → 7, no throws |
| **First Lesson** | ✅ "GREEN = UP / RED = DOWN" rendered |
| **First Trade** | ⚠️ **Not reached in-harness** — the intro gates the first setup behind progression I could not drive within the tool timeout |
| **Replay / Notebook / Guardian 1** | ⚠️ **Not executed** (blocked by the above) |

Throughout: price ladder correct (**Apple $333.8–$334.6**), HUD badge correct, terrain
`TRAINING REPLAY` (390 rows), 105/105 candles carrying a finite price, 99 distinct values drifting
coherently 333.00 → 333.72 while heights varied independently 130 → 445 — dollars riding along,
never driving.

**Honest limitation:** the trade → replay → notebook → Guardian 1 segment was **not executed**. The
audit established those systems are height-unit based and store no live dollar value except the
newly-stamped `entryPrice`/`market` pair, so they are structurally unaffected — but that is
reasoning, not a run. **A human playtest through Guardian 1 is still required before beta.**

---

## 6. Compatibility audit

8-way read-only audit (~950k tokens) against every system named in the brief:

| System | Finding |
|---|---|
| Tutorial / Movement / Lessons | Price-agnostic. `LESSONS` contains exactly one `$` — "Risk $1 to make $2", an abstract ratio, correct under any market |
| Trades | Entry/SL/TP/resolution all height units. `entryPrice` was stored but never read back |
| Replay / Notebook / Journal | Read stored heights only; re-derive nothing from live state |
| Guardian / Boss | No dollar reads. Two legacy hardcoded-dollar quiz strings survive in **dead code** (`BOSSES[6].rounds`) — unreachable, left alone |
| Progression / Achievements | No market coupling of any kind |
| Save system | 28 `cq_*` keys; new fields added to existing objects, no new key, no migration needed |
| Telemetry | `faction` is free-text `str(…,16)` server-side, no enum/CHECK — `NVDA`/`GOLD`/`SPX` pass unchanged |
| Educational Candle Library / Pattern System / `window.CQ` | Zero dollar references. `CQ` is pure geometry |
| Architecture | No changes. No ADR required |

**Risks found and solved:** the $100 anchor gap, the per-market terrain divergence, the live-candle
path into `MARKET_DATA`, the untimestamped cache, the missing HUD glyphs, the unstamped journal
records, and the sub-$230 ladder collapse — all fixed above.

**Risk found and deliberately left:** the legacy faction picker (`apChangeFaction` → `_confirmFaction`)
is still reachable from the account panel. It now routes through the same display-only path, so it is
safe, but it remains a second door onto market selection.

---

## 7. Regression report

| Dimension | Result |
|---|---|
| **Terrain identical across all 8 markets** | ✅ **1 distinct signature** across all 8 (was 8 different) |
| **All 8 anchored** | ✅ no market returns $100 |
| **Live fetch** | ✅ BTC $64,731 · ETH $1,916 · SOL $75.52 · GOLD $4,059.99 — all `coinbase` |
| **Equities** | ✅ report `kind:'anchor'`, never a false "live" |
| **Offline (all providers dead)** | ✅ 8/8 markets sane, **nothing threw** |
| **Hostile provider** (HTML body, `"abc"`, negative, 10⁹, `{}`) | ✅ **5/5 rejected**, price never moved |
| **Price cache** | ✅ fresh used · >24h ignored · legacy bare number tolerated · corrupt rejected · malformed JSON safe · absent safe |
| **Price ladder** | ✅ SOL **2 → 7** labels · DOGE **0 → 3** · BTC/ETH/GOLD/AAPL/NVDA/SPX unchanged |
| **Step-aware precision** | ✅ `$64,600 / $64,650` at step 50; `$75.35 / $75.40` at step 0.05 |
| **HUD glyphs** | ✅ all 8 render (verified Apple, Gold, Solana in gameplay) |
| **Fresh save** | ✅ ceremony → selection → game |
| **Returning save** | ✅ boots straight in, live price restored |
| **Mobile 375×812 portrait** | ✅ primary target |
| **Landscape / desktop** | ✅ letterboxed portrait — **pre-existing intentional design** (`@media (min-aspect-ratio: 58/100)`), present at HEAD, unchanged |
| **Console errors** | ✅ none |
| **Regression gate** | ✅ **14 pass · 0 fail** |

---

## 7b. Adversarial verification (8 independent agents, each trying to BREAK one safety claim)

Five claims **HELD** under attack — including the two that matter most:

- *"Terrain is market-independent"* — HOLDS. Exactly two `MARKET_DATA` assignments, both
  `TRAINING_REPLAY`; the old Binance write is gone; no in-place mutation anywhere.
- *"The price layer cannot reach gameplay"* — HOLDS. Every write traced to its transitive readers;
  no generator, collision test, resolver, setup detector, lesson or boss consumes a dollar.
- *"`_reanchor` cannot produce NaN/Infinity/drift"* — HOLDS (numerically simulated).
- *"Async prices cannot corrupt a trade"* — HOLDS, and for a stronger reason than the guard: dollars
  are downstream of heights, so even reanchoring every frame of a live trade changes no outcome.
- *"The cache is backward compatible"* — HOLDS after the migration fix below.

**Three claims were BROKEN, and the defects were real.** All are now fixed:

| Severity | Defect | Fix |
|---|---|---|
| **Blocker** | **Production CSP blocked `api.coinbase.com`** — the primary provider. On the deployed site every market would have silently fallen back to an anchor **while the HUD claimed "live"**. Invisible locally: the dev server sends no CSP. | Added to `netlify.toml` + the Cloudflare doc |
| **Major** | **The price ladder was only half fixed.** Gridlines and gutter labels are two blocks that must agree; build 301 fixed only the labels. Measured on Solana — the market the build tag advertises — **2 gridlines vs 7 labels**; Dogecoin, **0 gridlines** | One shared `priceLadderStep()` used by both |
| **Major** | `coinIconSVG` still returned `''` for the five new markets → the account panel's Change-Chart picker drew **five empty circles** | Same initial-letter default as the HUD |
| **Major** | A **wrong-symbol provider reply** was accepted on magnitude alone and cached 24h | Validate `data.base` / `symbol`; band tightened 25× → 6× |
| **Major** | `MarketPrice.status()` was **dead code** — the "labelled anchor" promise had no label on screen, and the spec's *live price display* was missing | Wired under the HUD badge: pulsing dot = live/cached, hollow ring = anchor |
| Minor | Legacy bare-number cache entries were **discarded, not migrated** — a returning offline player jumped to a build-time constant (**a regression I introduced**) | Adopted + stamped on read |
| Minor | Staleness was one-sided (a fast device clock stayed "fresh" forever); a rejected quote **poisoned `inflight` permanently**; `reanchor` used coercing `isFinite`, guarded `market.price` asymmetrically, and committed the base before scaling candles; `applyHomeMarketSkin` **bypassed the mid-trade guard**; a busy skip stamped the TTL and suppressed retries for 5 min; `fmtPriceStep` dropped thousands separators; the HTF axis printed duplicate rungs | All fixed |

A final spec-compliance pass found three more, now fixed:

| Severity | Defect | Fix |
|---|---|---|
| **Major** | The still-reachable **"Change Chart" picker advertised LOCKED "premium" markets** (BNB/DOGE/XRP at "Level 5 · 5,000 shells") **and per-market VOLATILITY / DIFFICULTY ratings** — violating *"all markets unlocked, no premium markets"*, and now simply **false**, since all terrain is identical | Change Chart opens the ceremony (the canonical 8-market roster); legacy picker kept only as a fallback |
| **Major** | The **Cloudflare CSP was never versioned in the repo** — only `netlify.toml` was fixed, but the game deploys on Cloudflare Pages, which ignores it | Added a real `_headers` file, with a note that any new outbound host must land in both, same commit |
| Minor | `status()` hit `localStorage` **every frame** for any market without an in-session quote (permanently true for the equities); a migrated legacy price could be presented as fresh for a full day | Memoised (**120 calls → 1 read**); migrated stamps are back-dated to a few minutes' life |

**The gate that protects all of this was itself weak** and is now hardened: check #14's regex matched
only a bare identifier, so `MARKET_DATA = (x ? y : z)` and every in-place mutation
(`MARKET_DATA.push(…)`) passed unseen — on a shared array object, a mutation would corrupt the
canonical replay for *every* market. Both bypasses were injected and confirmed to FAIL the gate, then
reverted.

Re-verified after fixing: SOL 7 gridlines / 7 labels agreeing, DOGE 3/3, all 8 picker logos present,
`_reanchor` declines during a live trade and applies after it, Change Chart shows 8 unlocked markets
with no locked cards.

---

## 8. Remaining risks

1. **Four of eight markets are not truly live.** Apple, Tesla, NVIDIA and S&P 500 show a labelled
   anchor until `market-price` is deployed. **I did not deploy it** — it publishes to your production
   Supabase project, which is an outward-facing action I should not take unilaterally. One command:
   `supabase functions deploy market-price --no-verify-jwt`, then flip `PROXY_LIVE = true`. Yahoo
   (keyless) works server-side but rate-limited us repeatedly during testing, so for production
   reliability set a `FINNHUB_KEY` secret — free tier covers this comfortably.
2. **TSLA and SPX anchors are approximations.** Every other anchor was fetched live while authoring;
   these two could not be verified (provider throttled) so they are deliberately round numbers.
   They self-correct the moment the proxy is live.
3. **The trade → Guardian 1 segment was not executed.** See §5. Needs a human playtest.
4. **This branch is off build 298; main is at 300 with uncommitted work.** Rebase before merging, and
   expect a `BUILD_TAG` conflict (I used 301).
5. **The Blockchain Journey is on a separate branch.** The full funnel (movement tutorial → ceremony)
   still needs both branches merged and the one-line handoff wired.
6. **Displayed volatility is not the real market's.** The chart shows real Apple *prices* on authored
   terrain, so the *shape* is training data, not Apple's actual movement. This is inherent to
   "authored levels + live prices" and is the correct trade — but the chart carries no provenance
   label saying so. Worth a product decision.

---

## 9. Recommendation

### READY FOR BETA — with one scope statement

*(Recommendation unchanged after adversarial verification: the blocker and all majors it found are
fixed and re-verified. It did not find any defect in the two core safety properties.)*

Objectively:

- The build is **strictly better than the current state in every measured dimension.** Before this
  work, five of eight markets rendered a $100 chart and terrain silently differed per market. Both
  are now fixed and gated against regression.
- Every safety property the brief demanded is **enforced structurally**, not by convention, and
  proven by a green 14-check gate plus offline and hostile-input testing.
- No architecture, gameplay, lesson, trade, boss, progression, save or telemetry system was changed.

The scope statement: **"live market context" is fully delivered for 4 of 8 markets** (Bitcoin,
Ethereum, Solana, Gold) and delivered as an *honest labelled anchor* for the other 4 pending a
one-command deploy. If you consider live equity pricing a launch requirement, this is **NOT READY**
until `market-price` is deployed — that is a deliberate call I left to you rather than publishing to
your production project on my own initiative.

**Blocking before beta regardless of that call:** one human playtest through the first trade,
replay, notebook and Guardian 1 (§5).
