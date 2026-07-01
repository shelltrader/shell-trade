# Chart Quest — Curriculum Pacing Audit & Refactor (Hours 1–5)
### Validation pass only. No code, data, or assets changed. We confirm the pacing before touching the game.

The progression **architecture** is correct — every Guardian tests only what its world
teaches (verified: Eel→candle/predict, Crab→trend/levels, Serpent→BOS/ChoCh, Golem→OB/sweep,
Hydra→risk). The **pacing** is wrong: several systems *show* the player concepts long before
the curriculum teaches them. This document fixes the pacing, not the architecture.

---

## The leaks (confirmed in the shipped build)

These are why the first two minutes feel overloaded. Each is a thing the player **sees** before any lesson exists for it.

| Leak | Where | Concept | Taught in | Shows from |
|---|---|---|---|---|
| **VWAP line + "VWAP" label** | `drawVWAP()` — called every frame, ungated | VWAP | **Hour 6** | **Hour 1** |
| **Higher-timeframe panel (5m / 15m / 1h)** | `drawHTFPanel()` — called every frame, ungated | Higher timeframe | **Hour 8** | **Hour 1** |
| **Trade opportunities fire structure/VWAP setups** | the 3 setup branches gate only on `setupCountdown`/warm-up — no concept gate | BOS, VWAP-bounce, trend-break | **H3 / H6 / H3** | **Hour 1** |
| **Setup quality grade (A/B/C)** | `quality = (vwapOk && trendOk) ? 'A' …` | VWAP + trend alignment | **H6 / H2** | **Hour 1** |
| **Trade panel: Stop / Target / Risk:Reward sliders** | trade panel always exposes SL/TP/R:R | risk management | **Hour 5** | **Hour 1** |
| **Post-trade grade card (confluence factors)** | lists Structure / Trend / VWAP / Trade-Mgmt | confluence | **Hour 10** | **Hour 1** |
| **Forward-references in early lessons/quizzes** | e.g. the Hour-2 S/R and Hour-5 SL quizzes use *"the VWAP line"* as a distractor | VWAP | **Hour 6** | **H2 / H5** |

> Note: the chart **highlights** (BOS glow, OB purple zone, setup box) are already concept-gated
> from earlier work. The leaks above are the systems that were **not** gated: the VWAP line, the
> HTF panel, *which setups fire*, the grade math, the risk panel, and the grade card.

---

## The pacing spine (the rule, made concrete)

Every concept passes through **four gates, in this fixed order**. A concept may not reach a
later gate before the earlier ones. Today, most concepts skip straight to gate 3–4.

1. **Taught** — its lesson appears (one concept per lesson).
2. **Tested** — the in-hour trade gate + that world's Guardian.
3. **Shown** — its line/zone/label is allowed to render on the chart.
4. **In a setup** — a trade opportunity is allowed to be *built on* it.

**Unlock hour per concept (Hours 1–6):** candle-read / long-short / wait-for-close = **H1**;
trend = **H2**; support/resistance = **H2**; BOS = **H3**; ChoCh = **H3**; order block = **H4**;
liquidity sweep = **H4**; stop-loss / risk / R:R = **H5**; VWAP = **H6**. (HTF = H8, leverage = H7,
patterns = H9, confluence = H10.)

---

# Concept maps

For each hour: **Introduced** (new, taught one lesson at a time, in order) · **Reinforced**
(seen again from earlier hours) · **Tested** (in-hour gate + Guardian) · **Allowed in trade
opportunities** · **Forbidden from appearing anywhere**.

---

## HOUR 1 — YOUR FIRST TRADES
**One idea: read a candle and act on it.**

- **Introduced** (sequential, one lesson each): ① candle anatomy (green = up, red = down; body
  vs wick) → ② long vs short (bet up / bet down) → ③ wait for the close (don't chase an
  unfinished candle).
- **Reinforced:** none — this is the first hour.
- **Tested:** in-hour — take directional trades and survive the gate. Guardian — **The
  False-Breakout Eel** (read the candle / spot the fake / call the next move). The Eel's whole
  identity is the payoff of "wait for the close."
- **Allowed inside trade opportunities:** **candle-close momentum only.** An Hour-1 opportunity
  is "a candle just closed decisively — ride it / wait for confirmation." Direction is the only
  decision. Explainable with Hour-1 knowledge alone.
- **Forbidden from appearing:** VWAP line, HTF panel, support/resistance lines, trend lines,
  BOS/structure highlights, order-block zones, liquidity markers, A/B/C quality grades, the
  grade/confluence card, and the SL/TP/Risk:Reward sliders. **The Hour-1 chart is candles + the
  turtle. Nothing else.**

## HOUR 2 — TREND & LEVELS
**One idea per lesson: which way, and where price reacts.**

- **Introduced** (sequential): ① trend (higher highs + higher lows = up; opposite = down) → ②
  support & resistance (the levels price bounces from / stalls at).
- **Reinforced:** candle reading, wait-for-close (H1).
- **Tested:** in-hour gate; Guardian — **The Trend Crab** (trend / support / resistance).
- **Allowed in trade opportunities:** H1 **+ trend direction + S/R levels.** An Hour-2
  opportunity is "uptrend + pullback to support → trade *with* the trend off the level."
  Explainable with H1–H2 only.
- **Forbidden:** VWAP line, HTF panel, BOS/structure highlights, OB zones, sweep markers,
  quality grades, grade card, SL/TP/R:R sliders.

## HOUR 3 — MARKET STRUCTURE
**One idea: structure breaks (BOS first, then ChoCh).**

- **Introduced** (sequential): ① BOS — a break **with** the trend = continuation → ② ChoCh — a
  break **against** the trend = possible reversal. Never combined in one card.
- **Reinforced:** trend & S/R (H2), candle reading (H1).
- **Tested:** in-hour gate; Guardian — **The Structure Serpent** (bos / choch / structure /
  predict).
- **Allowed in trade opportunities:** H1–H2 **+ BOS / ChoCh.** The structure-break (BOS-retest)
  setup becomes legitimate here for the first time: "broke structure with the trend, pulled
  back → enter the retest."
- **Forbidden:** VWAP line, HTF panel, OB zones, sweep markers, quality grades, grade card,
  SL/TP/R:R sliders. *(BOS glow on the chart is correct to appear now — and is already gated.)*

## HOUR 4 — THE BIG-PLAYER ZONES
**One idea: where institutions act (order block, then the sweep that feeds it).**

- **Introduced** (sequential): ① order block (the last candle before a big move — the zone
  giants left) → ② liquidity sweep (the stop-hunt that often precedes the OB tap).
- **Reinforced:** BOS (H3), trend (H2), candle reading (H1).
- **Tested:** in-hour gate; Guardian — **The Order-Block Golem** (ob / bos / ob / liquidity /
  exec).
- **Allowed in trade opportunities:** H1–H3 **+ order block + sweep.** An Hour-4 opportunity is
  "price swept liquidity, then tapped the order block → enter."
- **Forbidden:** VWAP line, HTF panel, quality grades, grade card, leverage, and still the
  SL/TP/R:R sliders. *(OB purple zone is correct now — already gated; before H4 it shows as a
  neutral bounce pad.)*

## HOUR 5 — MANAGE YOUR RISK
**One idea: survive (stop loss, then risk:reward & sizing).**

- **Introduced** (sequential): ① stop loss — your safety exit → ② risk:reward & position sizing
  — never risk it all; aim to win more than you risk.
- **Reinforced:** everything so far (candle, trend, S/R, BOS/ChoCh, OB/sweep).
- **Tested:** in-hour gate; Guardian — **The Risk Hydra** (sl / support / sl).
- **Allowed in trade opportunities:** H1–H4, **and now the trade panel fully unlocks SL / TP /
  Risk:Reward / sizing** — the player finally understands the controls they're using. This is
  the hour the risk UI is revealed.
- **Forbidden:** VWAP line (still H6), HTF panel (H8), leverage (H7), patterns (H9), the
  confluence grade card (H10).

---

# Recommended implementation changes
*(Proposed only — nothing here is built yet. Listed in priority order.)*

1. **Gate *which setups fire* by concept hour — the single biggest fix.** Before a setup
   banner shows, check the type against its unlock hour: BOS/ChoCh from H3, OB/sweep from H4,
   VWAP-bounce from H6. A setup type may not fire before its concept is taught.

2. **Add two beginner opportunity types so trading still happens in H1–H2** without referencing
   un-taught ideas: an **Hour-1 "momentum / close" opportunity** (ride a decisive candle close)
   and an **Hour-2 "level pullback" opportunity** (with-trend bounce off S/R). This keeps the
   core loop alive while honoring "Hour-1 trades are explainable with Hour-1 knowledge."

3. **Gate the VWAP line + label** (`drawVWAP`) behind the VWAP unlock (H6). No orange line, no
   "VWAP" text, before Hour 6.

4. **Gate the HTF panel** (`drawHTFPanel`) behind the higher-timeframe unlock (H8).

5. **Stop grading setups with un-taught inputs.** Don't compute A/B/C from VWAP + trend in early
   hours. Either hide the quality grade until the player has the vocabulary for it, or compute it
   only from concepts already unlocked.

6. **Simplify the trade panel before Hour 5.** Auto/fixed risk and hidden SL/TP/R:R sliders in
   H1–H4; reveal the full risk panel at Hour 5 when those concepts are taught.

7. **Gate the post-trade grade/confluence card.** Before Hour 5, replace it with a plain
   "win / loss + one-line why." Only surface confluence factors the player has actually learned.

8. **Enforce one lesson at a time within an hour.** Don't spawn the second concept's lesson
   portal until the first concept's lesson is completed — so H2 never shows S/R before trend is
   done, etc.

9. **Scrub forward-references from H1–H5 lessons & quizzes.** Remove distractor options and
   examples that name concepts from later hours (e.g. "the VWAP line" appearing as an answer
   choice in the Hour-2 support/resistance and Hour-5 stop-loss quizzes).

10. **Add a validation pass.** After gating, walk Hours 1–5 and assert: at each hour, no
    rendered line/zone/label, no setup type, and no trade-panel field references a concept above
    that hour. This is the acceptance test for "never see before learn."

---

### Acceptance criteria (how we'll know the pacing is fixed)
- A brand-new player in **Hour 1** sees **only candles and the turtle** — no VWAP, no HTF panel,
  no grades, no risk sliders — and every opportunity is a pure directional read.
- Each new system (levels → structure → zones → risk → VWAP) appears **exactly one hour at a
  time**, in step with its lesson.
- Any opportunity the player is offered can be fully explained using only the concepts taught
  up to and including the current hour.

*Audit only. No code, data, or assets were modified. Awaiting your go-ahead before implementing.*
