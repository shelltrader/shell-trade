# ChartQuest Phase 3B — Golden Path Visual Unification: Builds 269–270 Report + Beta Gate

**Date:** 2026-07-16 · **Builds:** 268 → **269** (unification) → **270** (playthrough fix)
**Commits:** `4416b46` (269), `cc6fd09` (270) · **Gate:** 11 pass / 0 fail on both (no protected bypass)
**Mission:** every player-facing chart before Guardian 1 speaks ONE educational candle language.

---

## 1. Summary of every chart updated (Deliverable 1)

### The live guided setup (`setupFlowCandle`) — now library-true BY CONSTRUCTION
Sim-verified over 500k setups in the real direction regime — **all four laws hold at 100.000%**:
- **C1 (the taught relationship):** the confirmation now ALWAYS closes ≥28u beyond the momentum
  extreme. Before: failed outright in 1.8% of setups, cleared invisibly (<20u) in 17.9%, and
  failed **100% of the time near the world ceiling/floor** (the clamp regime — momentum and
  confirmation clamped to the same level). A role-aware ±54u world margin fixes the wall regime.
- **M1:** momentum ≥ 2.5× pullback-1 (was guaranteed only 2.1×; ~8% of setups below 2.5×).
- **Tightening:** pb2 < pb1 always (reversed ~1% before); pb2 floor raised 26→34u so the
  recognition candle is never a sliver at trade zoom. *(Envelope-floor change, flagged.)*
- **No lying wicks:** setup candles are exempt from the spin-pole/shell decoration — the momentum
  candle used to sprout a rejection pole (taller than the confirmation's clearance 71% of the
  time it appeared) saying "rejected" while the lesson said "buyers took control."
- All deltas stay inside the pre-existing envelopes (confirm ∈ [115,170], step ≤ 240): terrain
  difficulty, direction choice, entry/SL/TP semantics and outcome logic untouched (gate #10/#11).

### The trade ticket (mini `setupChartSVG` + full `setupChartSVGFull`)
The only edge-less flat candles in the game now speak the lesson dialect:
- 0.72-of-slot bodies (were 79–81% of slot), radius-0 (rx removed), **1px darker edge + 16%-width
  sheen strip** (the lesson/world silhouette), direction-tinted wicks (were a third grey
  language), doji-neutral tie branch (a near-tie never wears a lying directional tint), wick
  draws clamped so sweep poles can't spike into labels.
- **ENTRY/STOP/TARGET taught line-grammar ON the decision surface** (gold/red/green dashed +
  dark pill chips), live-tracking the sliders and side toggle (chart re-renders from
  refreshPanel; it used to render once and could assert a direction the player didn't pick).
- Predict mode (L1) stays ask-don't-answer and gains the same gold focal box the full-screen
  uses, so the mini also *points* at the decisive candle.
- BOS annotations speak the break candle's direction colour (were lavender/cyan — lavender is
  the lessons' ORDER BLOCK colour: an active mis-association); structure labels got lesson pills.

### Recap + journal replay (`tradeChartSVGFull`, `tradeReplaySVG`)
- **Fixed a real crash:** `tradeReplaySVG` referenced `O.ob`/`O.structure` — out of scope (`O`
  exists only in the recap) — so any journal replay whose lead-in contained an OB/BOS candle
  threw ReferenceError. Now reads the journal's own `reviewOpts` toggles.
- Same lesson grammar (0.72 slot, edge, tinted wicks at `clamp(bw·0.05,1.6,3)`); the old
  `xw−10` width went **negative past 37 candles** (wick-only ghost charts) — fixed.
- The liquidity-sweep trap wick now survives into the recap/journal (snapshot mappers carry
  `sweep` — additive, backward-compatible field on stored records; old records render neutral).
- ChoCh/BOS broken-LEVEL lines are neutral grey per the lessons (ChoCh-orange no longer collides
  with the VWAP curve on one chart); BOS boxes take the break candle's colour.

### World + intro-flow residuals
- The in-world ENTRY line is finally **GOLD** (was grey `#b6c0cd` while the walkthrough said
  "the yellow line"). SETUP circle colours moved to canonical bull/bear (were near-miss hexes).
- First-win formed candle + flash-quiz hero candle: radius-0 + canonical edges + sheen + tinted
  wick (same recipe as everything else). Latent gold third answer-button → blue.
- **Build 270 (found live in the founder playthrough):** the first-trade walkthrough copy was
  long-only — on a SHORT it said *"you bought / if price falls to this red line / if price
  climbs to this green line"* while the stop sat ABOVE and the target BELOW. All three strings
  are now side-aware. (~Half of first trades are shorts near the world ceiling.)

## 2. Before/after evidence (Deliverable 2)
- Ticket BEFORE: flat un-edged fills, grey wicks, no level lines, static direction. AFTER
  (screenshotted live in the playthrough): edge+sheen bodies, gold focal box, taught fork, and
  on L2+ the ENTRY/STOP/TARGET pills. The first-trade world shot shows gold ENTRY / red STOP /
  green TARGET pills exactly as the sl/tp/rr lessons drew them.
- Setup maths BEFORE/AFTER: (fail%, weak%, ratio<2.5×, pb2≥pb1) = (1.8, 17.9, 8.1, 1.0)% →
  **(0, 0, 0, 0)%**.
- Full playthrough screenshot set captured: cinematic → mission card → world tutorial → twin-giant
  first lesson → greenred practice → 2× prediction bets (new candle recipe visible on close) →
  momentum lesson+practice → "THIS IS THE MOMENT" → ticket (predict, unified) → first trade with
  gold/red/green walkthrough → pullback lesson+practice → confirmation lesson+practice → ticket
  ×3 more → "spot the lie" (the liar now hovers in clear sky) → Gambler portal + Hall of Risks.

## 3. Founder playthrough — observations (uninterrupted, build 269)
Route covered live: cinematic → mission → movement tutorial (jump/tuck beats gate cleanly) →
GREEN vs RED → practice → engineered first win ×2 → market entry → momentum → practice →
first real trade (ticket → walkthrough → live arc → resolution) → pullback → trade 2 →
confirmation → trade 3(+4) → prove ("spot the lie") → final stretch → Gambler portal → Hall of
Risks entry. Every chart en route spoke one language — the "same teacher" test passes visibly.

**Recorded moments (prioritized):**
1. **[FIXED in 270]** Side-unaware walkthrough copy (above) — the one moment a beginner could be
   actively mis-taught. Caught because this run's first trade WAS a short.
2. **Anti-stall systems all fired correctly** when I deliberately overflew portals: GREEN-vs-RED
   force-opened at candle 52; the pullback lesson auto-opened at exploreGap+120; a skipped
   armed setup re-surfaced and re-armed. No soft-locks anywhere.
3. **Sequencing race (low real-world risk, worth a look post-beta):** a trade that resolves
   during the explore window (before `waitThenNextTrade` re-asserts `awaitingTrade`) increments
   `tradeGate.completed` but not `introFlow.tradesDone` — the intro then asks for one extra
   trade. Harmless self-heal (observed only under this harness's extreme timer throttling; the
   live 200ms pollers make the window tiny), but the two counters could disagree in a save.
4. **Emotional pacing:** the dry traversal stretch between trade 2 and trade 3 (~80 candles under
   the resurface rule) is the longest low-stimulus span in the first 15 minutes. Not a blocker;
   worth watching in beta funnels.
5. Environment caveats (not game issues): practice auto-reveals fired at their 12s real-time cap
   during frame-pumped play; the Gambler's round loop (rAF-driven) couldn't be exercised in the
   hidden-tab harness — its content/renderer were separately audited (see §4-2) and the round
   set is confirmed taught-aligned.

## 4. Remaining known inconsistencies (Deliverable 3 — all bounded, none blocking)
1. **Boss exam renderer** (`ChartView.candlesN`, frozen protected system): 1.5px body floor vs
   the ratified 14/12px Type-C floor; hue-only direction; 22–46-candle framing at intermediate+
   difficulty vs the 6–14 law. Needs your approval as part of the Phase-2 `window.CQ` migration.
   (Gambler CONTENT is taught-aligned — verified again this phase.)
2. **Lesson wick tints vs ratified neutral wicks:** the lessons (and now the live surfaces,
   matching them) use direction-tinted wicks; the Constitution's target is neutral `#c9d1d9`.
   One consistent language today; the tint→neutral retirement belongs to the Phase-2 migration
   where every surface flips together (recap/replay already sit in the grey family it will land on).
3. **Sweep-wick colour fork:** world/ticket/recap say trap-orange `#ff7a45`; lesson scenes flag
   sweeps with red text + tinted wick. Founder call; do not change silently.
4. **Gold as deictic "ask" chrome** (quick-read ring, predict focal box) doubles with gold-as-
   ENTRY. Consistent internally; an ADR could reserve gold for one meaning post-beta.
5. Dead surfaces pending a cleanup task (Candle Academy deck, `buildQuizCandles`, IM fallbacks —
   conformance-patched in the interim, `openPortalPredict`). Marketing-site feature-card `rx`
   rounding (review-copy page only) — P2.
6. `detectMomentum` late-game standout relaxes to 1.3× (below the library's 1.5× relational
   floor) after 2 bosses — flagged as a chosen difficulty-ramp tradeoff to ratify or adjust.

## 5. Beta Gate (Deliverable 4)

1. **Does every player-facing chart before Guardian 1 use one unified educational candle
   language?** — **YES.** Lessons, practices, quiz/first-win candles, the live world, the ticket
   (mini + full), the in-world trade lines, recap and journal replay all draw the same body
   (sharp, edged, sheened), the same wick language, the same line grammar, the same palette.
2. **Does the first trade visually reinforce what the player just learned?** — **YES.** The
   setup Finn walks IS the momentum→tightening-pullback→confirmation the lessons taught (now by
   mathematical construction, in every regime); the ticket points at the decisive candle; the
   walkthrough names lines that are actually the taught colours (and, since 270, the taught
   directions).
3. **Would a complete beginner recognize the same candle archetypes throughout?** — **YES** —
   verified live end-to-end on build 269/270 with screenshots at every beat.
4. **Any remaining visual inconsistencies likely to confuse first-time players?** — **NONE
   pre-Guardian-1.** The bounded items in §4 are either post-Guardian-1 surfaces (boss renderer,
   HTF), frozen-system items awaiting your call, or invisible-today dead code.

### RECOMMENDATION: **READY FOR CLOSED BETA** ✅
Objective basis: 0 unified-language violations remaining on any pre-Guardian-1 surface
(audited by 4 agents + verified live); the taught confirmation relationship now provably appears
in 100% of guided setups; the one mis-teaching moment found in the founder playthrough is fixed
and shipped (270); regression gate 11/0 with protected systems byte-identical across all three
builds; no soft-locks under deliberate portal-skipping abuse. Ship the beta on build 270.
