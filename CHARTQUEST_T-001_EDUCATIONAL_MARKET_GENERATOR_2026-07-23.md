# T-001 — Educational Market Generator

**Date:** 2026-07-23
**Build:** 289 → **290**
**Priority:** P0
**Verdict:** **PASS** on every objectively verifiable criterion. One criterion ("the founder no longer says the charts feel fake") is closable only by the founder's playtest.
**Scope discipline:** one function replaced. No other system touched.

---

## 1. What changed

**One function: `scriptedCandle()`** — the generator that produces every free-roam candle in Levels 1–3 (the filler terrain between authored setups). Plus its two new config tables and the build tag.

### Before

`scriptedCandle()` took the authored `LVL_SCRIPTS` target height, jittered it ±30px, then ran it through **six negative guards**:

1. never 3 same-direction candles in a row (hard run cap of 3)
2. never two similar consecutive body sizes
3. never a close returning near the 2-candles-ago close
4. never a body under 46px
5. never a 3rd equal platform top
6. a final "clear body" guarantee

Each guard was added to fix a real, reported bug. Each was correct in isolation.

### After

A **positive regime model**. The market is always in one of six states, and transitions between them the way price actually behaves:

| regime | length | what it produces | ticket criterion served |
|---|---|---|---|
| `impulse` | 4–9 candles | decisive leg with the trend, 88% with-trend | trend structure is obvious |
| `pullback` | 2–5 | retraces 25–52% of the leg, then **resumes** — never erases | pullbacks recover naturally |
| `range` | 6–16 | quiet oscillation inside a band | consolidation, breathing room |
| `breakout` | 1–3 | first candle 2.05–2.9× current volatility | breakouts have energy |
| `fakeout` | 2–3 | leaves the range, then snaps back **harder** than the bait | the trap |
| `drift` | 5–12 | gentle low-conviction trend | emotional rhythm between beats |

Two carried state variables do the heavy lifting:

- **Volatility** — a mean-reverting scalar that *spikes* entering impulse/breakout and *decays* through a range. This is what produces genuine volatility clustering (big candles cluster with big candles).
- **Trend bias** — persists across regimes; flips only on a Change of Character (trend exhaustion after ~54 candles, or a fakeout that won, or the world's ceiling/floor).

All knobs live in two data tables (`MKT` for market shape + terrain invariants, `MKT_TUNE` for per-level personality), so future tuning is data, not code surgery.

### The authored levels were promoted, not deleted

`LVL_SCRIPTS` could not remain a literal height list. **Measured on the shipped code before any change:**

| level | emitted close within ±35px of the authored target | mean error | direction matches the author |
|---|---|---|---|
| L1 | 58.9% | 59px | 71.4% |
| L2 | 58.0% | 62px | 66.6% |
| L3 | 52.6% | 62px | 70.0% |

So **41–47% of the founder's authored targets, and ~30% of the authored directions, were already being overridden by the guards.** The array was not driving the level; the guards were.

It is now the level's **story spine**: the local slope of the authored array (over the last 5 beats) steers the regime machine's bias and its volatility target. L1's giant hills, L2's strong-vs-weak contrast and L3's staircases survive — expressed in market grammar instead of as a jittered polyline.

---

## 2. Root cause (evidence, not assertion)

I rendered **real BTC/USDT 1m** (999 candles, fetched live from Binance during this ticket) through the game's own price→pixel mapping (`CFG.pxPerPct = 1600`, which maps a typical BTC 1m move to ~80px — the game's own scale), then measured all three series with byte-identical code.

**20,000 candles per level.**

| metric | real BTC 1m | OLD L1 / L2 / L3 | NEW L1 / L2 / L3 |
|---|---|---|---|
| trend persistence | 0.52 | 0.32 · 0.36 · 0.35 | **0.56 · 0.54 · 0.54** |
| longest 1-way run | 9 candles | 8 · 7 · 8 | 18 · 15 · 15 |
| runs of 4+ (per 1k) | 67 | 15 · 19 · 23 | **74 · 68 · 68** |
| volatility clustering | +0.20 | −0.00 · **−0.17** · **−0.15** | **+0.21 · +0.19 · +0.16** |
| efficiency ratio (20c) | 0.19 | 0.06 · 0.05 · 0.10 | **0.18 · 0.16 · 0.15** |
| best trend leg (p95) | 0.39 | 0.17 · 0.14 · 0.20 | **0.45 · 0.44 · 0.40** |
| consolidation windows | 39% | 76% · 71% · 59% | **34% · 42% · 44%** |
| body p10/p50/p90 | 5/35/107px | 52/100/242 · 57/118/219 · 54/102/235 | 21/34/110 · 20/27/145 · 20/31/169 |
| body dynamic range | 22.0× | 4.6× · 3.8× · 4.4× | 5.3× · 7.3× · 8.2× |
| **min body ever seen** | 0px | **0px · 31px · 0px** | **18px · 18px · 18px** |

### Reading the OLD column — this *is* the founder's complaint, quantified

- **persistence 0.32** → the chart changed colour **68% of the time**. That is literally "repetitive alternating candles". The run cap of 3 mathematically enforced it.
- **efficiency ratio 0.06** → over any 20 candles, price walked a long path and arrived nowhere. That is "no trend structure".
- **best trend leg 0.17** → a convincing trend leg was not *rare*, it was **impossible**. Not once in 20,000 candles. Forbidden by construction.
- **volatility clustering NEGATIVE** → a big candle was *reliably* followed by a small one. The exact inverse of how a real market breathes. Caused directly by the anti-equal-body guard.
- **consolidation 59–76%** → by this metric the old chart was in permanent chop; it never went anywhere.
- **min body 0px** → the guards did not even achieve their own stated goal. The old generator still printed truly flat candles at L1 and L3.

### The conclusion

**The flat-platform bug fix was, measurably, the direct cause of the fake-market feel.**

Each guard was a *prohibition*. There was no positive model of what the market *should* do. The union of six prohibitions forbade trends, consolidation and volatility clustering simultaneously — the three properties that make a chart read as a market.

### Why the previous two attempts missed it

Build **288** ("charts feel fake" → natural wicks) and build **289** (candles commit + breathe) both targeted this exact complaint. Both changed **texture**. Neither touched the **price path**. That is why it kept coming back.

---

## 3. Terrain safety — proven, not sampled

Finn walks on `candleTop = max(open, close)`, so the generator is also the level geometry. **200,000 candles per level:**

| invariant | result | note |
|---|---|---|
| minimum body | **exactly 18.00px** | was 0px. Above `CFG.minBody` (15, the renderer's visual floor) so no candle is ever a flat line |
| maximum single rise | **exactly 240.00px** | one boost clears ~335px; old guards capped 210; `CFG.bosMax` is 200 |
| longest flat platform | **4 candles** | old 3–4 |
| out-of-world closes | **0** | |

For calibration: **real BTC 1m, walked as terrain, would be unplayable** — 32.9% of candles under 18px (flat/unwalkable), a 10-candle flat platform, and 4 unclimbable rises in 999 candles. The realism ceiling here is set by the platformer, not by the generator. That tension is real and permanent.

The six prohibitions collapsed to **three**, and all three are genuinely about the walkable road:

1. every body ≥ `MKT.minBody` (18px) — a flat candle stays impossible
2. an up-move never exceeds `MKT.maxRise` (240px) — always climbable
3. a platform top may repeat at most three times; a 4th is broken out

World bounds are handled by **steering the bias away** from the ceiling/floor before the move is chosen, and by **reflecting off with a real body** — never by clamping a move flat against the wall, which is what printed the plateaus at the top and bottom of the world.

### Two bugs the harness caught during this ticket (worth recording)

Both were in *my* rewrite, both were caught by measurement rather than by reading:

1. **Floor-collapsing range.** My first `range` regime let bodies decay onto the 18px floor, so every candle in a consolidation came out the same size, the platform tops pinned, and the flat-plateau bug returned — the harness measured **10-candle flats**. Fix: quiet bodies come from an absolute range with a wide spread multiplier, never from a fraction of a decaying volatility.
2. **Plateau rule tested the wrong thing, twice.** First cut compared the new top only to the *previous* top — a neighbour test, which a slow drift walks straight through. Second cut used a running reset-on-exit window, which anchors differently than the plateau it is trying to bound: a 5-candle flat straddled the reset. Only comparing against **the last three tops** is equivalent to the property being bounded.

**Process note:** the second bug is exactly the class of error that produced the original six guards. It is invisible to reading and obvious to measurement.

---

## 4. Traversal check

I could not complete a clean automated L1→Guardian-1 playthrough (see Concerns §6.7). What I *could* do is run an identical frame-pumped traversal harness against both builds:

| identical 90s harness | BEFORE (289) | AFTER (290) |
|---|---|---|
| distance travelled | 51px | **756px** |
| candles entered | 3 | **30** |
| longest stall | 89.1s | **77.8s** |
| JS errors | 0 | 0 |

The large stall figure is a harness artifact (it jumps constantly and does not perform the intro's required interactions), **not** attributable to the generator — it is present and *worse* on the unmodified build. The AFTER build is strictly better on every traversal measure. This is evidence of no regression, **not** evidence of a good playthrough.

---

## 5. Files modified

| file | change |
|---|---|
| `chart-quest.html` | `scriptedCandle()` replaced; `MKT` + `MKT_TUNE` tables added; `BUILD_TAG` → build 290. Lines 2744 and 3135–3189 → 3135–3420. **Nothing else in the file touched.** |
| `index.html` | byte-identical mirror (deployed file). verify gate #8 confirms sha256 match. |
| `sw.js` | cache `chart-quest-v283` → `chart-quest-v290` so the playtest cannot load a stale build |

**Not touched, verified:** trade outcomes · odds · R:R · `calcLevels` · entry/SL/TP semantics · `setupFlowCandle` · `tradeDrivenCandle` · `MIN_TRADE_CANDLES` · boss roster/order/difficulty · lesson order · save keys · movement `CFG` · the frozen physics seam `{candleTop, c.x, c.w, gap}` · `window.CQ`.

`setupFlowCandle` (the guided setup) and `tradeDrivenCandle` (the live trade) **never reach this code path**, which is why no trade outcome can be affected.

### Verification gates

`node scripts/verify.js` → **12 pass · 1 fail · 1 skip**

The single FAIL is gate **#10 "Protected systems changed: Movement CFG"**. **This is not from T-001.** I isolated it: `CFG` is byte-identical between the pre-ticket working tree and the post-ticket file. The flagged change is `collideInset: 8` — the build-274 wedge fix — sitting **uncommitted in the working tree before this ticket started**. Gates #11 (TES), #12 (candle language, 314 ≤ 314 baseline) and #13 (`window.CQ` owner integrity) all pass.

---

## 6. Concerns

### 6.1 The founder criterion is unclosed — by definition
Seven of eight success criteria are measured and met. The eighth ("the founder no longer says the charts feel fake") is a judgement only the playtest can deliver. I have deliberately not claimed it.

### 6.2 Trend runs now exceed real BTC
Longest one-way run is **15–18 candles** vs real BTC's 9. This is a deliberate skew toward readability — "trend structure is obvious" is a ticket requirement, and persistence was targeted at 0.55 vs BTC's 0.52. But it is a skew, and if L1 reads as *too* clean it is a one-number dial (`MKT.wt`, currently 0.746).

### 6.3 Dynamic range is capped by the walkability floor
Real BTC's body dynamic range is 22×; the new generator reaches 5.3–8.2×. The gap is the 18px minimum body, which exists because Finn walks on these candles. I tested whether the floor caps the *efficiency ratio* too — **it does not** (real BTC holds ER 0.19 even with the game's floor and rise cap applied), so that gap was mine to close and I closed it. But dynamic range genuinely cannot reach real-market levels while the terrain is walkable.

### 6.4 Flat platforms went from 3 to 4 candles
Slightly more plateau than the old build (still far below real BTC's 7). This is intentional — a short plateau *is* a consolidation, and it doubles as a rest ledge. `MKT.topGap` (20) is the dial if it reads badly.

### 6.5 Structure flags are still off
The generator returns `bos: false, sweep: false, choch: false, ob: false` — byte-compatible with the old contract. That means the new breakouts **do not** light up the existing order-block bounce pads or sweep trap-wick systems, even though a breakout candle genuinely *is* a break of structure. I kept them off deliberately: flipping them changes gameplay, and this ticket owns one system. **This is the single highest-value follow-up** — see §7.

### 6.6 The optimizer has no term for "variety"
Hill-climbing against distributional targets collapsed the breakout range to `[2.482, 2.491]` — a degenerate point, meaning every breakout would be the same size. Metrics cannot see this; the founder would. I widened `brk`, `brk2` and `spread` back by hand around the means it found. **Any future auto-tuning needs the same human check.**

### 6.7 The automated play test is an approximation
Two environment obstacles: synthetic `KeyboardEvent`s are gated by `window.cineActive`, and `requestAnimationFrame` is throttled when the browser pane is not foregrounded (the world silently freezes — `session.candles` stayed at 1 for 40 real seconds). I worked around both by pumping `frame(t)` manually, but I did **not** complete a real L1→Guardian-1 run. **The founder playthrough remains the only real gate.** This is the build-284 lesson restated: render-only verification misses felt bugs.

### 6.8 The BTC reference is one window
999 candles from a single Binance fetch. The stylized facts I targeted (persistence ~0.5, positive volatility clustering, ER 0.2–0.45) are well-established and stable across windows, so I am confident in the direction — but the exact target values come from one sample of market conditions.

### 6.9 Body-floor ownership is now duplicated
Phase 2A built `window.CQ` as the single behavioural owner, including `CQ.floorBodyPx` / `floorBodyPrice`. My generator floors bodies with its own `MKT.minBody` in world units instead. Gate #13 passes (the owner is intact and COLOR still derives from it), but architecturally this is a second floor. Not a bug today; it is exactly the kind of divergence that the Phase 2A wire exists to prevent.

### 6.10 The same pathology exists in three other generators
I did not touch them (out of scope), but the guard-soup anti-pattern is present in:
- `tradeDrivenCandle()` — has its own "never two same-size steps in a row" anti-staircase guard. **During a live L1-3 trade the chart is still driven by the old approach.** The founder spends 30+ candles per trade watching this.
- `nextCandle()` L4+ free-roam — has the `minStep = 22 + 36*(1-cx)` floor and counter-trend dampening. Same class of prohibition.
- `cartoonCandle()` — legacy fallback, superseded but still present.

---

## 7. Recommendations / next-ticket candidates

Listed in my order of expected founder-visible impact. **None of these were started** — they are proposals, not work in progress.

### T-002 (proposed) — Make breakouts *mean* something
Emit `bos: true` on the breakout candle and let `maintainCandles` tag the preceding opposing candle as the order block. The regime model already knows exactly when a real break of structure happens; today that knowledge is thrown away. This lights up systems that already exist (purple OB bounce pads, BOS gameplay) with information that is now *pedagogically true* rather than random. **Caveat: this changes gameplay** (new bounce pads in L1-3), so it needs its own ticket and its own playtest.

### T-003 (proposed) — The live trade still feels mechanical
`tradeDrivenCandle()` drives 30+ candles per trade — the single longest continuous stretch of chart the founder watches, and the emotional core of the game. It still uses "vary the step size / never two the same" guards. The authored win/loss outcome and the emotional arc (dip → hold → recover → run) are canon and must not change, but the *texture between the beats* could use the same regime grammar. Outcome-neutral by construction if scoped to body shaping only.

### T-004 (proposed) — L4+ free-roam has the same disease
`nextCandle()`'s MARKET_DATA path. Lower priority: the founder's complaint is about L1-3, and L4+ is not in the closed-beta golden path. But the same complaint will arrive the moment anyone plays past Guardian 3.

### T-005 (proposed) — Make market realism a regression gate
This ticket's harness turns "does it feel fake?" into six numbers. **I strongly recommend promoting it to `scripts/market_realism.js` as verify gate #14**, failing the build if persistence drops below ~0.45, volatility clustering goes negative, or best-trend-leg falls under ~0.30. This is the specific mechanism that would have caught the original regression, and it is the only thing that stops guard-soup from creeping back in one well-intentioned bug fix at a time. The harness source is in Appendix A so it is not lost with the session scratchpad.

### Housekeeping
- **Resolve the `collideInset` gate-#10 flag** (pre-existing, needs your OK or a commit).
- The cinematic still reads **"LIOSIANT"** — already logged at build 283, still unfixed.

---

## 8. Dials — single numbers you can ask me to change

If something reads wrong in the playtest, these are one-line changes in `chart-quest.html` (`MKT` / `MKT_TUNE` tables, ~line 3190):

| symptom | dial | current | direction |
|---|---|---|---|
| "trends are too clean / unrealistic" | `MKT.wt` | 0.746 | lower |
| "not trendy enough" | `MKT.wt` | 0.746 | raise |
| "candles too big / too small" (per level) | `MKT_TUNE[n].vol` | L1 `[58,96]` | scale |
| "impulses not dramatic enough" | `MKT_TUNE[n].impulse` | L1 1.30 | raise |
| "too much sideways chop" | `MKT_TUNE[n].rangeW` | L1 0.85 | lower |
| "too many fakeouts for a beginner" | `MKT_TUNE[n].fake` | L1 0.35 | lower |
| "still see flat bits" | `MKT.topGap` | 20 | raise |
| "candles too small to stand on" | `MKT.minBody` | 18 | raise (terrain-safe up to ~30) |
| "breakouts not punchy" | `MKT.brk` | `[2.05, 2.90]` | raise |

L1/L2/L3 are tuned separately, so "L2 feels wrong but L1 is fine" is a valid and easy request.

---

## 9. FOUNDER REVIEW — played it, recorded what still feels fake

Forget §2. What follows is what I saw with my eyes, playing L1 on build 290. No defence, no metrics.

### 9.1 The market is frozen. It only moves when you walk.

**This is the real answer to "why does it still feel fake", and my ticket could not have fixed it.**

I stood completely still for 30 seconds of game time:

```
new candles: 0        price moved: $0
```

Candles are generated by **camera position**, not by time (`maintainCandles` extrudes them from `cameraX`). If the player stops walking, price stops existing. The dashed line labelled **"LIVE EDGE"** is not a live edge — it is the end of a corridor that unrolls as you approach it.

No amount of generator realism fixes this. I spent this whole ticket making the *shape* of the terrain believable. The terrain isn't moving. A market that waits for you is not a market.

### 9.2 I replaced the picket fence with a staircase

Look at the world screenshot: three green candles climbing in near-equal steps, then six red candles descending in near-equal steps. A clean chevron. A hill.

Before, the chart was green/red/green/red — a picket fence. Now it is ramp-up / ramp-down — a staircase. **Both read as generated.** I fixed the statistic and reintroduced the artifact.

The bitter part: the old code's `_scLastMag` guard existed *specifically* to stop "two equal bodies in a row (the staircase tell)". I deleted it because it inverted volatility clustering, and I was right that it did — but I did not replace what it was protecting. My metrics measure correlation **across the series**; they are blind to **sameness within a single leg**, which is exactly what the eye picks up.

Diagnosis (not fixed, not started): `MKT.imp` is `[0.85, 1.55]` × a volatility that barely moves inside a leg (`revert` is 0.06/candle by design, for clustering). So consecutive impulse candles come out nearly identical. A real leg has a fat middle — it accelerates, peaks, and decays, with the odd one-candle pause. The leg needs an internal shape, not a constant multiplier.

### 9.3 Wicks are props, not price

There is a pale-blue spike off one green candle, roughly twice the body height, in a **different colour from the candle**, and nothing happens at it. Price does not react. It is the every-10th-candle "spin pole".

Build 288 deliberately made wicks cosmetic and hard-capped so they can never be walked or twirled. That was the right call for platforming and it is the wrong call for believability. A trader reads a long wick as violent rejection. Here it is scenery.

### 9.4 Every candle is the same width and they all touch

`gapMin = gapMax = 0`. Uniform widths, zero separation. It reads as a wall of blocks — terrain — not as a chart. This is probably the single cheapest visual change available and I did not touch it.

### 9.5 The first thing the player ever sees is an empty chart

Frame one of the game: Finn floating in a void, a dashed LIVE EDGE line, and price labels down the right. **No candles at all.** The market has no history. Before the player has done anything, the game has already said "there is nothing here".

### 9.6 The first lesson's picture contradicts its own words

Lesson card, CANDLES: *"The fat middle is **the fight**. The thin **wick** is how far price tried to go — before it got **pushed back**."*

The illustration is a candle with **almost no body** and an enormous wick — a doji. The canonical example of "green = buyers won, it closed UP" is a candle that closed essentially flat. This is the most important teaching moment in the game.

### 9.7 The prediction card's forming candle is a lollipop

A thin white vertical line with a white dot on top, sitting in its own column with a visible gap before it. It reads as a UI slider handle, not as price forming.

It also sat **well above the OPEN line before I called it**. I picked GREEN on that basis and was right. n=1, so I am not claiming it is a spoiler — but it *read* as one, and that is worth checking.

### 9.8 The prediction's resolved candle doesn't belong to its own chart

When it resolved, the green candle that printed was roughly **3× the size of every other candle** on the same chart, after a blank column. Same screen, two different markets.

### 9.9 Pacing — I never got near a trade

~15 minutes of game time, 100 shells collected, and the "Reach GUARDIAN 1" bar was still essentially empty. I did not reach a single live trade.

### What I could NOT verify — do not treat these as cleared

- **`tradeDrivenCandle` is still unobserved.** The 30+ candle live trade is the emotional core of the game and the thing I explicitly flagged as untouched in §6.10. I never reached one. It remains the most likely remaining source of "feels fake", and it is running the old guard approach.
- **Two things that looked like bugs were my harness, not the game** — flagging so nobody chases them: (a) the practice card "not responding" was my own frozen `requestAnimationFrame`; (b) my pixel click coordinates were in the wrong space. The practice round works correctly.

### Honest summary

The generator is measurably better and the chart has real structure now. But if the founder plays this tomorrow, my honest expectation is that **they still say it feels fake** — because of 9.1 (the market doesn't move on its own) and 9.2 (I swapped one regular pattern for another). 9.1 is the one that matters. It is not a generator problem and no T-001-shaped ticket could have solved it.

**Proposed next ticket, ahead of everything in §7: make the market run on a clock instead of on the camera.** Candles should print on time whether or not the player moves. That single change is the difference between a chart and a corridor.

---

## Appendix A — measurement harness (so it is not lost)

Run with Node from the project root. Extracts the **live** `scriptedCandle` out of the HTML so it always measures shipped code, never a copy.

```js
// market_realism.js — three-way: shipped generator vs candidate vs real BTC 1m
const fs = require('fs');
const CFG = { levelMin: 80, levelMax: 700, pxPerPct: 1600 };
function rand(min, max) { return min + Math.random() * (max - min); }

function loadGen(htmlPath) {
  const src = fs.readFileSync(htmlPath, 'utf8');
  const slice = (re, end) => { const m = src.match(re); if (!m) return '';
    const i = m.index; return src.slice(i, src.indexOf(end, i) + end.length); };
  const fnSrc = (n) => { const i = src.indexOf('function ' + n + '(');
    return src.slice(i, src.indexOf('\n}\n', i) + 3); };
  const body = slice(/const MKT = \{/, '\n};') + '\n' + slice(/const MKT_TUNE = \{/, '\n};') + '\n'
             + slice(/const LVL_SCRIPTS = \{/, '};') + '\n' + fnSrc('scriptedCandle')
             + '\nreturn { scriptedCandle };';
  return (market, session) =>
    new Function('CFG','rand','market','session', body)(CFG, rand, market, session);
}
function runGen(htmlPath, level, n) {
  const market = { level: 100, price: 30000, trendDir: 1 };
  const api = loadGen(htmlPath)(market, { level });
  const out = [];
  for (let i = 0; i < n; i++) { const open = market.level; const c = api.scriptedCandle(level);
    out.push({ open, close: c.h, body: c.h - open, top: Math.max(open, c.h) }); }
  return out;
}
function metrics(cs) {
  const d = cs.map(c => Math.sign(c.body) || 1), mag = cs.map(c => Math.abs(c.body));
  let same = 0; for (let i = 1; i < d.length; i++) if (d[i] === d[i-1]) same++;
  const mu = mag.reduce((a,b)=>a+b,0)/mag.length;
  let num = 0, den = 0;
  for (let i = 1; i < mag.length; i++) num += (mag[i]-mu)*(mag[i-1]-mu);
  for (let i = 0; i < mag.length; i++) den += (mag[i]-mu)*(mag[i]-mu);
  const ers = [];                                   // 20-candle efficiency ratio
  for (let i = 0; i + 20 <= cs.length; i += 20) { const w = cs.slice(i, i+20);
    const net = Math.abs(w[19].close - w[0].open);
    const pl = w.reduce((a,c)=>a+Math.abs(c.body),0); ers.push(pl ? net/pl : 0); }
  ers.sort((a,b)=>a-b);
  let consol = 0, wins = 0;                         // 10 candles travelling < their biggest candle
  for (let i = 0; i + 10 <= cs.length; i++) { const w = cs.slice(i, i+10);
    const net = Math.abs(w[9].close - w[0].open);
    const big = Math.max(...w.map(c => Math.abs(c.body)));
    wins++; if (net < big * 0.8) consol++; }
  let maxFlat = 1;                                  // tops all within 16px of EACH OTHER
  for (let i = 0; i < cs.length; i++) { let lo = cs[i].top, hi = cs[i].top, j = i;
    while (j + 1 < cs.length) { const t = cs[j+1].top;
      const nlo = Math.min(lo,t), nhi = Math.max(hi,t);
      if (nhi - nlo >= 16) break; lo = nlo; hi = nhi; j++; }
    maxFlat = Math.max(maxFlat, j - i + 1); }
  const s = [...mag].sort((a,b)=>a-b), p = q => s[Math.floor(s.length*q)];
  return { persistence: same/(d.length-1), volClustering: num/den,
           er: ers.reduce((a,b)=>a+b,0)/ers.length, er95: ers[Math.floor(ers.length*0.95)],
           consolPct: 100*consol/wins, dynRange: p(0.90)/Math.max(1,p(0.10)),
           maxFlat, minBody: Math.min(...mag), maxRise: Math.max(...cs.map(c=>c.body)) };
}
// Real-BTC reference: close-to-close % move -> game px, exactly as the game does it.
// rows = Binance /api/v3/klines?symbol=BTCUSDT&interval=1m&limit=1000
function btcRef(rows) {
  const closes = rows.map(r => +r[4]); const cs = []; let lvl = 100;
  for (let i = 1; i < closes.length; i++) {
    const pct = (closes[i]-closes[i-1])/closes[i-1]*100;
    const open = lvl; lvl += pct * CFG.pxPerPct;
    cs.push({ open, close: lvl, body: lvl-open, top: Math.max(open,lvl) }); }
  return cs;
}
```

**Targets to gate on (from real BTC 1m):** persistence 0.48–0.60 · volClustering > +0.10 · er > 0.12 · er95 > 0.30 · consolPct 30–50 · minBody ≥ 18 · maxRise ≤ 240 · maxFlat ≤ 4.

---

## Appendix B — how to reproduce the screenshots

In the browser console on `chart-quest.html?fresh=1&mute=1`, after starting the game:

```js
requestAnimationFrame = () => 0;          // the game's loop would overwrite the capture
maxSeenCandleId = 1e9;                     // defeat fog-of-war in drawCandle
candles.forEach(c => c._bornAt = -1e6);    // skip the build-289 birth animation
camY = Math.round(Math.min(...candles.map(candleTop)) - H*0.16);   // the vertical camera
// then: fill bg, ctx.translate(0,-camY), and drawCandle(c, camX) for each candle in range
```

Three gotchas that cost time and will cost it again:
1. `drawCandle` early-returns on `c.id > maxSeenCandleId + 2` (fog of war) — candles render as nothing.
2. `render()` translates by `-camY`; a static capture that skips it draws the chart off-screen.
3. `requestAnimationFrame` is throttled when the pane is not foregrounded — the world **silently freezes**. Pump `frame(t)` manually with a fixed dt.
