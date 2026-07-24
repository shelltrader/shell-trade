# ChartQuest Phase 3A — Educational Candle Library: Build 268 Report

**Date:** 2026-07-16 · **Build:** 267 → **268** · **Gate:** 11 pass / 0 fail (no protected bypass needed)
**Companion doc:** `CHARTQUEST_EDUCATIONAL_CANDLE_LIBRARY_2026-07-16.md` (the canonical vocabulary — Deliverable 1)
**Authority:** `CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md` (RATIFIED — no geometry invented, every change cites it)

---

## What shipped

Every **authored** educational candle in the game was rewritten to canonical archetypes:

| Surface | Sites | Status |
|---|---|---|
| LessonChart.SCENES (all LEARN beats, boss-round intros, journal term cards, intermission lessons) | **33 scenes** | ✅ rewritten |
| CONCEPT_PRACTICE (tap-the-candle reps) | **10 charts** | ✅ rewritten |
| LessonChart renderer | neutral-doji conformance (data-gated `doji:true`) | ✅ 3-line patch |
| drawQuizCandle | gold doji branch (dead, latent) → neutral | ✅ |
| IM fallback diagrams (dead on happy path) | IM_UP/IM_DN, doji, wait_close, SR, trendline + label colours | ✅ light-touch |
| Boss exams, website, live-trade setup chart | — | 🔍 audit-only (below) |

**Not changed, verified byte-identical by the gate:** Finn, CFG/movement, save keys, `LESSONS`
set/order, `conceptTier`, boss engine & content, trade logic/outcomes, monetization, UI flow.

## The audit (Step 1 — 8 agents, ~1M tokens, findings summary)

Ground truth confirmed the playtest instinct with numbers. A directional candle needs a body
≥ ~0.15 of the scene's range to clear the Type-A 24px floor; the doji band is ≤ 0.03.

**Worst first-hour offenders (bodyFrac of scene range, before):**
- `candle` (THE first lesson): labelled RED examples at **0.09** vs an unlabelled green at 0.53 — the picture read "big green rocket", not "green vs red".
- `doji`: the tie-candle rendered **RED** (c<o) 30 seconds after "red = sellers won", tagged in reserved gold.
- `momentum` / `pullback`: heroes at **0.81 / 0.80** (over the 55% frame cap) above drift candles at 0.05–0.06 (accidental dojis).
- `fake` 5/6 flat · `liquidity` 5/8 · `downtrend` 5/8 · `uptrend` 4/8 · `wait_close` 3/5 · `long` two 0.03 slivers.
- Practice: `momentum` five of six candles ≤ 0.06; `resistance` **both answers** near-dojis; `pullback` had a second candle that also satisfied the prompt (ambiguous tap); `brokencandle` (P0) floater had only 6u of air and a neighbour rising into its band; `choch` answer broke the level by 1 unit with a bigger distractor breaking it by 11.
- Level-line integrity: `support` floor pierced by a bounce candle, `trendline` lows 3–4u below the drawn line, SR fallback ceiling leaked — pictures contradicting their own captions.

## The fix pattern (why each change improves learning)

1. **No directional candle below the readable floor** — every body now ≥ 0.14–0.16 of range
   (24px+ on screen). *An accidental sliver reads as a doji/glitch and silently teaches "candles
   are noise."* Full-file scan: **0 flat directionals** across all 43 charts (was 37 violations).
2. **No candle swallows the frame** (≤ 55% of visible height, momentum/breakout at the cap
   exactly). *A frame-filling candle erases the context that gives it meaning.*
3. **Focal & relational laws** — the annotated candle is the visually dominant one (momentum
   2.8× drift; confirmation & CP answers the biggest thing on screen; H&S head 2.4× shoulders;
   flags' poles 2.25× flag candles). *The label must point at the candle a child would point at.*
4. **Level lines touch their candles EXACTLY** — support 31×3 touches never pierced, resistance
   70×3 wick cluster, trendline lows on-line (33/41/49), neckline valleys ON 36, ChoCh level
   kissed twice then broken by 10 units, equal-highs exactly 71, OB zone re-anchored to the
   actual OB candle (31–40, was floating at 42–52). *A leaking floor teaches "floors break."*
5. **A doji is a tie, visually** — o==c cross with 16–18u wicks, rendered **neutral** `#b8c0cc`
   via the new data-gated `doji:true` branch (Constitution Readability Law 5; code-is-wrong
   clause). Gold DOJI tags retired (gold = boss/portal reserved).
6. **The first lesson is twin mirrored giants** — one big green move, then the SAME span flipped
   red. The only difference is colour, which *is* the lesson. "The green one is obviously
   stronger" now survives a 5-second glance.
7. **Unambiguous tap targets** — exactly one candle (or the authored set) satisfies each practice
   prompt; `brokencandle`'s liar now hovers with 26+ units of clear air; `choch`'s first-break is
   the biggest red with the confirming candle smaller.
8. **Honest geometry everywhere** — every scene chain-connects (open = previous close, the very
   rule `brokencandle` teaches); trade scenes carry honest 1:2 risk:reward distances; `rr` zones
   re-anchored inside the candle range (were on-canvas only by padding luck).
9. **Story beats added where the picture under-taught** — `sl` now shows price *continuing to
   fall after the exit* ("it kept falling — you were SAFE"); `leverage` bodies grow 9→13 so the
   picture itself amplifies (was 4 identical candles).

## Before/after — first-hour P0 scenes (bodyFrac per candle)

| Scene | Before | After |
|---|---|---|
| candle | .16 .09 .34 .09 **.53** (unlabelled giant) | **.43 .43** .19 .22 .31 (labelled twin giants) |
| doji | .17 .22 .22 .02-**red** | .16 .22 .16 **0.00-neutral cross** |
| momentum | .07 .06 .13 .06 **.81** | .16 .19 .16 .22 **.48** |
| pullback | .05 **.80** .15 .10 | .22 **.54** .18 .18 |
| confirmation | .04 .54 .11 .07 .50 | .20 .34 .17 .17 **.55** (closes 10u above the high) |
| wait_close | .09 .04 .17 .07 .28 (wick 1.4×) | .16 .18 .16 (spike wick **2.2×** body) |
| CP momentum | .04 .02 .06 .75 .04 .02 | .17 .18 .17 **.55** |
| CP brokencandle | float air 6u, overlapped | float air **26u+**, clear sky |

(Complete 43-chart before/after metrics: run the scan in this report's verification section —
both tabulations were captured in the session log.)

## Verification (Deliverable 6)

- **Mechanical:** full-file scan of all 33 scenes + 10 practices — 0 flat directionals, 0 bodies
  over the 55% cap, 0 unintended chain-disconnects, trendline/level touches exact. Validator
  (constitutional floors, focal/relational ratios, wallpaper, doji band, ann indices) — all pass.
- **Syntax + gate:** `scripts/cq.sh ship` → **11 pass / 0 fail** incl. **[10] Protected systems
  unchanged** (Finn/CFG/saves/lesson set/boss engine byte-identical to HEAD) and [11] TES
  (min duration, curriculum order, authored outcomes intact). Mirror + website embed synced.
- **Browser (build 268 live):** all 33 scenes screenshotted fully-annotated (frozen-clock grid);
  doji confirmed rendering as a neutral grey cross; practices screenshotted (greenred, momentum,
  pullback, confirmation, sr, resistance, trend, bos, choch, brokencandle); a correct tap on the
  `choch` answer confirmed the success path end-to-end. Lesson order, prompts, hints, rewards
  untouched.

## Audit-only findings — founder decisions needed (NOT changed in 268)

1. **`setupFlowCandle` / `setupChartSVG` (the live guided-trade setup chart).** The completeness
   critic flagged this as *the most consequential educational chart in the first 15 minutes* —
   it authors momentum→pullback→confirmation on the live trade ticket with `wick:0` candles and
   proportions that don't quote the library. It is **protected system #9 (trade setup
   generation)**, so it was audited, not touched. Recommend: a follow-up pass aligning its
   authored proportions to M1/P1/C1 archetypes — visual only, outcome pipeline untouched — with
   your explicit approval.
2. **Boss exam renderer (`ChartView.candlesN`, MG registry).** Live Type-C exams have a 1.5px
   body floor (Constitution: 14px/12px) and hue-only direction (no non-colour cue), and
   intermediate/advanced exams frame 22–46 candles vs the 6–14 law. Boss system is frozen —
   flagged for the Phase-2 `window.CQ` engine migration. (Good news: the Gambler's live
   first-hour rounds test only taught concepts — the legacy "boss tests untaught doji" object
   is confirmed dead code.)
3. **Marketing site TradingView embed** (`chartquest-landing.html`) renders default teal/red
   candles that don't match the in-game palette (P2, cosmetic).
4. **Dead parallel candle systems** (Candle Academy cards 1–5, IM fallback family): recommend
   retirement in a dedicated cleanup task per the Consistency Law; IM data was
   conformance-patched in the interim.
5. **Gold ENTRY motif** — trade scenes draw ENTRY lines in gold, consistent with the live trade
   UI. Reserved-colour law covers candle *bodies*, so this is lawful; if you want gold to be
   boss-exclusive everywhere, that's a one-pass ADR decision.

## Rollback

Single-commit change to `chart-quest.html` (+ mirrors). `git revert` restores build 267 exactly;
any individual scene can be reverted independently (isolated object literals).
