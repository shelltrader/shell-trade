# Chart Quest — Mini-Game Validation & Audit

> **✅ RESOLUTION LOG (fixes applied & re-verified).** Everything below the line was the original audit. The flagged issues have now been fixed in `preview-minigame-library.html` and **re-proven with the same 400-seed probes**:
>
> **P0 — exploits & coin flips (done):**
> - **All 6 fixed-answer exploits killed.** Answer positions now vary by seed — ChoCh 15 distinct (was 1), Liquidity 152, VWAP 349, Candle 151; Position-Size midpoint-is-answer dropped from **100% → 18%**.
> - **Fakeout & Trade Management are now readable, not coin flips.** Fakeout's decision candle now *closes* above resistance (real) vs wicks-and-closes-back-below (fake) — tell matches **100%**. Manage now shows a **resistance level overhead**; proximity drives the outcome **100%** (into-resistance → exit/trim; room → hold).
> - **Predict reversals are signposted** with an exhaustion wick (follows the shown trend 83%, not a blind coin flip).
> - **Trading definitions corrected:** real fractal **swing pivots** (BOS/ChoCh), Order Block now requires an **impulse + imbalance**, Support/Resistance is a **multi-touch level** (not the chart extreme), Liquidity uses **near-equal** highs, VWAP scores **genuine touch-and-reject** candles, RR now targets a **real resistance level**.
> - **Trendline** is scored by **line quality** (touches respected, doesn't cut price) — any valid line wins, no fixed anchors. **Candle Builder** now has **O/H/L/C handles** and 5 archetypes (bull/bear/doji/hammer/shooting-star). **Position Size** shows account + stop, hides the live %, and asks you to compute the size.
>
> **P1 — fairness (done):**
> - **Results now reveal the correct answer** (green) next to yours (gold) with a "SEE SCORE →" tap on all annotate games.
> - Wider partial-credit tolerance on marker games. #20 replay slowed to a watchable pace with a hold + working exit.
>
> **Deferred (P2 — larger, not blocking):** full difficulty-distractor redesign (required confluence / hidden helper overlays per tier), in-game glossary onboarding wiring, answer-reveal for predict/classify, and a larger hand-curated pattern bank. Verified: **80/80 generators valid, no crashes/NaN, 20 games.**
>
> ---

### Lead QA · Trading Educator · Fairness/Logic/Educational Auditor

**Scope:** all 20 mini games in `preview-minigame-library.html` (19 prior + the new #20 Trade Execution Challenge).
**Method:** this is not a vibe check. Every generator and validator was executed headlessly — **400 seeds per game at each of the 4 difficulties (80 game×difficulty combinations, all pass with no crash/NaN)** — and probed for fixed answers, label/visual mismatch, coin-flip outcomes, multiple-correct answers, and scoring exploits. Numbers below are measured, not assumed. Where my own assumptions were wrong, I say so.

---

## Part 1 — Mini game #20: Trade Execution Challenge (delivered)

A six-step capstone on a new **`sequence`** framework: **(1)** read the trend → **(2)** mark the structure break → **(3)** pick the entry (retest) → **(4)** place the stop → **(5)** place the target → **(6)** execute, then the chart **replays forward** and the trade wins or loses.

The outcome model is deliberately **fair and deterministic, not a coin flip** (this is the design every other "outcome" game should copy): the future path is generated so a **structurally-sound trade always wins** — stop beyond structure, target within ~2R — while a **stop placed inside the pullback gets stopped out** and a **greedy target never fills**. Verified across all four tiers: sound→WIN, tight-stop→STOPPED, greedy→TIMEOUT, wrong-side→INVALID. Difficulty scales via chart complexity, tolerances, and shrinking target headroom (Expert leaves ~2.2R of room vs 3.0R at Beginner).

**Your feedback is fixed:** the replay was revealing ~30 candles/sec and jumping straight to the score. It now plays at **230 ms per candle (~2s, watchable)**, **holds on a WIN/STOPPED/TIMEOUT badge**, and waits for a **"SEE YOUR SCORE →"** tap — and the **‹ Library exit stays live** the whole time (the loop aborts if you leave). Noted your bigger ask: **make more games multi-pronged like this** — strong agreement, see the roadmap.

---

## Headline verdict (be ruthless)

The library is a strong **framework** with **weak game content**. The engine, scoring harness, and #20 are good. But **6 of 20 games are memorizable** (the correct answer is in a fixed position every time), **2 are pure 50/50 coin flips dressed up as skill**, and **several teach subtly wrong trading definitions** that an experienced trader will spot immediately and lose trust over. As shipped, an intermediate player would "beat" half the library by rote in one sitting, and a real trader would learn little — and occasionally learn things that are **wrong**. None of this is fatal; all of it is fixable. But it must be fixed before players see it, because the failure mode is **lost credibility**, which is unrecoverable for an education product.

---

## TOP PROBLEMS (ranked)

Severity: 🟥 Critical (breaks learning / trust / exploitable) · 🟧 High · 🟨 Medium · 🟦 Low.

### 🟥 Critical

| # | Game(s) | Issue | Impact | Root cause | Fix |
|---|---|---|---|---|---|
|1|ChoCh|**Answer is ALWAYS the 2nd-to-last candle** (index n-2). Measured: 1 distinct answer across 400 seeds.|Memorize "tap second-from-right" → 100 forever. Zero learning, zero replay.|`gen` bumps a local high at a fixed index then forces the break at `n-2`.|Generate a real prior structure (HH/HL up-leg), then a *seed-varied* counter-break location; answer index must vary.|
|2|Liquidity ID|**Answer is ALWAYS indices [9,15]** (fixed fractions 0.42/0.72). 1 distinct value / 400 seeds.|Tap the same two spots every time → trivial.|Equal-high indices hard-coded as `floor(n*0.42/0.72)`.|Randomize cluster count, position, and which side (buy/sell-side); accept any of the equal-high candles.|
|3|VWAP Reaction|**Answer is ALWAYS index 13** (`floor(n*0.62)`). And the "reaction" candle is *forced* onto VWAP rather than emerging.|Memorizable; also the player never actually reads the VWAP line — they tap a fixed spot.|Fixed bounce index; VWAP not session-anchored.|Let multiple genuine VWAP touches occur; score any real touch-and-reject; vary position.|
|4|Trendline|**Anchors ALWAYS [4,16]** (fixed fractions). 1 distinct value / 400 seeds.|Tap the same two x-positions every time.|`a1=round(n*0.16), a2=round(n*0.72)` fixed.|Score the *line* (touches respected + not cutting bodies), not proximity to two fixed anchors. Then any valid 2–3-touch line wins.|
|5|Position Size|**Correct answer is ALWAYS the slider midpoint** — scores ~perfect on **100%** of seeds. The live risk-% readout also removes the need to compute anything.|Drag to the middle → win. Teaches "drag till it says 1%," not the sizing formula.|`size = correct*2*(v/100)` ⇒ v=50 ⇒ exact. Live readout shows the answer.|Reframe as the design doc recommended: hide the live %, *ask* for the size, randomize where "correct" falls; or fold into a timed "Risk Lab."|
|6|Candle Builder|**Only 2 possible targets** (32/74 or 72/28). And it builds only Open/Close — **no wicks/high-low**, so it can't teach dojis, pin bars, or rejection.|Memorize two positions; half-taught candle anatomy.|Fixed `target` per bull/bear; only O/C handles.|Randomize O/C/H/L targets from real candle "stories"; add wick handles; include doji/hammer prompts.|
|7|Fakeout Detection|**Pure 50/50 coin flip.** Real-rate 50.5%, and the break candle is generated **identically** for real vs fake — there is no pre-decision tell.|Player guesses, "fails" half the time for no reason, and concludes fakeouts are unreadable — the **opposite** of the lesson. Violates Chart Quest's "reward process, not gambling" pillar.|`real = r()>0.5` decided independently of the chart; outcome candles drawn *after*.|Build real tells: fake breaks get a long rejection wick / low "volume" / close back inside; real breaks close strong + retest-hold. Make it *readable*, then it teaches.|
|8|Trade Management|**Pure 50/50 coin flip.** Continue-rate 50.5%, future independent of the shown chart. HOLD/TRIM/EXIT scored against an unknowable outcome.|Punishes correct process at random; teaches nothing; erodes trust.|`future = r()>0.5` with no chart linkage.|Make the post-decision path *follow from* visible context (momentum, into-resistance, exhaustion wick), so reading the chart actually pays. Reward TRIM as the low-variance "correct-ish" answer.|

### 🟧 High

| # | Game(s) | Issue | Impact | Root cause | Fix |
|---|---|---|---|---|---|
|9|BOS|**~11 candles after the marked one also close above the swing** (measured avg 10.8). Only the *first* scores 100; a reasonable later break scores 0–40, with no explanation.|Feels arbitrary/unfair; the "correct" candle isn't visually distinguished from later ones.|Uptrend keeps breaking; single-index answer with tight tolerance.|Highlight the *specific* swing being broken; accept the first break only but **show it on the result**; widen partial-credit band.|
|10|BOS, ChoCh|**"Swing high/low" is just the max/min of an arbitrary first-window** — not a real swing pivot (a high with lower highs on both sides). Mis-teaches the single most important structure skill.|Players learn a wrong definition of structure.|`Math.max(...cs.slice(0,sh))`.|Detect true fractal pivots (local extreme with N lower highs/lows each side) and label *those*.|
|11|ChoCh|The ChoCh is **manufactured** (bumped candle + forced break), not a genuine "trend made HH/HL, then broke the last higher-low." Real ChoCh requires that prior-structure context, which isn't modeled.|Player recognizes a fake artifact, not real ChoCh.|Construction shortcut.|Generate a real up-leg then a real lower-low break (or vice-versa); the break location emerges, not forced.|
|12|Order Block|OB defined as "last candle where close<open before the break." A **true OB** is the last down *candle/body* before an *impulsive* move that leaves an imbalance (FVG). No impulse/imbalance check.|Teaches an oversimplified, sometimes-wrong OB.|`while(c>=o) ob--` only.|Require the OB to precede an impulsive break with a gap/imbalance; mark the imbalance.|
|13|Predict|Answer follows the **shown trend only 77.3%** of the time — i.e. **~23% of rounds reverse with no warning**. Better than a coin flip, but the 23% are unsignposted "gotchas."|Players who correctly "trade with the trend" still lose ~1 in 4 for no learnable reason.|Last-6-candle net is partly noise.|Either make reversals *signposted* (into resistance / exhaustion) or reframe as "bias + confidence" with partial credit, not binary.|
|14|All marker games|**Touch-precision scoring**: exact candle = 100, ±1 = 12–70. On a 46-candle Expert chart this is pixel-hunting on a phone, not trading skill.|Frustration mislabeled as difficulty.|Index tolerance scales the wrong axis.|Snap to nearest candle generously; score the *concept* (right zone) with a tolerance band, not the exact bar.|
|15|Fairness (global)|**The result overlay never shows the correct answer.** On a miss, the chart is hidden and the player can't see what they should have done.|Players can't learn from failure — the core of practice.|`finish()` shows only score + text.|On the result, redraw the chart with the correct marker/zone/line highlighted next to the player's attempt.|

### 🟨 Medium

| # | Game(s) | Issue | Impact | Root cause | Fix |
|---|---|---|---|---|---|
|16|Support, Resistance|Zone is anchored to the **absolute chart extreme + one artificially forced touch**, not a level tested ≥2×. Teaches "box the lowest low," which is wrong.|Weak/!incorrect S/R concept.|`level = min(lows)` + one forced touch.|Generate a level that price reacts from ≥2–3 times; score IoU to *that*.|
|17|Liquidity|Equal highs are forced **pixel-identical** (`hi=lvl`); real liquidity sits at *relatively* equal highs/lows, and the *sweep* (the point) is never shown.|Unrealistic cue; misses the "stops get swept" lesson.|Identical highs; no sweep.|Use near-equal highs; optionally play the sweep-and-reverse after the answer.|
|18|RR Builder|Target can be placed **anywhere** with no requirement it sits at a real resistance/structure level. (Note: *not* trivially score-exploitable — measured only 1% — because wide stops lower R, a nice tension.) But it rewards an arbitrary 2R.|Teaches "set TP at 2R in space," not "TP at the next liquidity/level."|No level on the chart to target.|Place a real resistance/liquidity level; reward TP just *below* it.|
|19|Position Size|Account ($10k) and stop distance are **never shown numerically**, so the player can't actually compute `size = 1%×acct ÷ stop` — they dial the readout.|No arithmetic skill transfer.|Inputs hidden; live readout.|Show account + stop distance; hide the live %; ask for the number.|
|20|Spot the Error|Corruption is "close above high." At thumbnail/phone size the body-outside-wick cue is **subtle**, and beginners may flag big-wick (but valid) candles.|Confusing for beginners; ambiguous.|Single subtle corruption type.|Add clearer error types (impossible gap, negative spread) and zoom the suspect region.|
|21|Pattern Recognition|At Advanced/Expert, heavy wick noise (`vol×0.7`) over fixed-shape paths can **obscure or distort** the pattern; a noisy Double Top can read as Head & Shoulders.|Correct call looks wrong / wrong call defensible.|Noise added to fixed paths.|Curate a larger hand-built pattern bank; cap noise; allow "near-miss" partial credit.|
|22|Market Structure|"Range" is a clean sine; "up/down" rely on trend beating noise. Gross direction always matches the label (measured 0% end-opposite — good), but a high-vol weak trend can reasonably read as a range.|Trend-vs-range edge cases feel ambiguous.|Two different generators.|Add a clear "weak/choppy" buffer or a 4th "transition" label; or require a minimum trend slope.|
|23|Difficulty (global)|Difficulty only adds **candles + volatility + time + tighter tolerance**. The brief's intended levers — **distractors, multiple confirmations, less-obvious setups** — are absent.|Expert = "same game, noisier & faster" = frustration, not depth.|`DIFF_*` only scale four scalars.|Add decoy markers/levels, require confluence (2 confirmations) at higher tiers, hide the helper overlays (swing line) as difficulty rises.|
|24|Time pressure (global)|25s/18s limits apply **uniformly**; 18s to drag a precise zone on a 46-candle chart is brutal, while 18s to tap a label is trivial.|Unfair across game types; timeout = instant 0.|One global `DIFF_TIME`.|Per-framework time budgets; on timeout, *score the current attempt*, don't zero it.|
|25|Onboarding (beginner)|Prompts use **BOS, ChoCh, OB, VWAP, liquidity** with no in-game definition, example, or glossary link.|Complete beginners are lost on game 1.|No teach step wired.|Add a 1-card "what is X" intro + a "?" glossary link per game (the game already has `TERMS`).|
|26|Interaction teaching|Drawing/zone/ray inputs aren't taught (a beginner won't know a trendline needs *two* taps).|Confusion, wasted attempts.|No interaction tutorial.|First-play coachmark per interaction type.|

### 🟦 Low

| # | Game(s) | Issue | Impact | Fix |
|---|---|---|---|---|
|27|#20 Exec|Default SL/TP are pre-placed at *sound* values, so a player can step through accepting defaults and win with low effort.|Reduces challenge.|Randomize default offsets; require a minimum drag distance to "commit."|
|28|#20 Exec|Outcome always tests the stop first (pullback then rally); a real trade could hit TP first.|Minor realism gap.|Occasionally generate "runs straight to TP" or "straight to SL" paths.|
|29|#20 Exec|Trend step is binary and the swing line is shown → trivially easy step.|Low value step.|Hide the swing line at higher tiers; add a "no-trade / chop" option.|
|30|Classify (struct, pattern)|Only 2–3 options ⇒ **random tap scores 33–50%**.|Guess floor too high.|Add more plausible options; penalize fast random taps; require a rationale tap.|
|31|Best-score integrity|A `best` score persists from a **lucky coin-flip win** (fake/manage), inflating "mastery."|Misleading progress.|Once outcomes are skill-based, this resolves; until then, don't show best for coin-flip games.|
|32|Scoring text|"Keep practising" / generic why-lines repeat; not specific to the actual mistake on marker games.|Shallow feedback.|Tie feedback to the measured error (e.g., "you tapped 3 candles early").|

> Items 1–32 are the substantive, evidence-backed findings. They expand into the **Top-50** when split per game×difficulty (e.g., the fixed-answer exploits #1–6 each recur identically across all four tiers, and the coin-flip issues #7–8 each manifest as *separate* fairness, educational, and exploit failures). Rather than pad the list with the same root cause counted five times, the table above is the de-duplicated, root-cause view — which is the actionable one.

---

## Audit by lens (summary)

**Logic validation.** Can a correct answer be marked wrong? **Yes** — BOS (later valid breaks, #9), trendline (any valid 2-touch line that isn't the fixed anchors, #4), zones (a reasonable offset zone, #16). Can a wrong answer be marked right? **Yes** — fixed-position games reward a memorized tap with zero understanding (#1–6); position-size midpoint (#5). Rules consistent? Mostly, but tolerance is inconsistent across games (BOS ±1=70 vs liquidity ±1=65 vs ChoCh ±1=70). Win/lose conditions correct? For #20 yes; for fake/manage the "win" is a coin flip (#7–8).

**Trading accuracy (as a professional).** Flagged: swing-pivot definition (#10), ChoCh construction & missing prior-structure context (#11), Order Block without imbalance (#12), S/R as single-extreme box (#16), pixel-equal liquidity & no sweep (#17), VWAP not session-anchored & forced reaction (#3), RR target not at a level (#18), Position-size without arithmetic (#19), Candle anatomy without wicks (#6). **These are the credibility killers** — a real trader spots them in minutes.

**Fairness.** Does the player understand why they failed? **Often no** — coin-flip games (#7–8) and the missing "show the correct answer" (#15). Is randomness fair? Fixed answers aren't random at all (#1–6); coin flips are *too* random (#7–8); 77/23 predict reversals are unsignposted (#13). Difficulty jumps reasonable? They mostly add frustration, not depth (#23–24).

**Player experience.**
- *Complete beginner:* lost on jargon (#25), untaught interactions (#26), demoralized by coin flips (#7–8). **Verdict: high confusion.**
- *Intermediate:* discovers fixed-answer exploits within minutes → boredom; can't calibrate near-misses (#15). **Verdict: short-lived engagement.**
- *Experienced trader:* engaged by #20, BOS, OB, pattern — but loses trust at the inaccurate definitions (#10–12, 16–19). **Verdict: credibility risk.**

**Replayability.** High & healthy: #20 Exec, Spot-the-Error, Order Block (varies), BOS (varies). Dead on arrival once memorized: ChoCh, VWAP, Liquidity, Trendline, Candle Builder, Position Size (#1–6). Fake variety (infinite but skill-less): Fakeout, Manage (#7–8). Classify games need a bigger curated bank (#21).

**Randomness audit.** Impossible scenarios? **None found** (80/80 gens valid). Misleading scenarios? Pattern noise at Expert (#21), trend-vs-range edge cases (#22). Multiple correct answers? **Yes** — BOS, trendline, zones, liquidity (#4, 9, 16, 17).

**Educational audit (what real skill, really?).** Genuinely teaches a transferable skill: **#20 Exec** (end-to-end trade plan), **BOS** (find the break — once pivots are fixed), **Order Block** (entry zones — once imbalance is added), **Pattern/Structure classify** (recognition), **Spot-the-Error** (data literacy). **Teaches how to beat the minigame, not trade:** fixed-answer games (#1–6). **Teaches the wrong lesson / gambling:** Fakeout, Manage, and to a lesser degree Predict (#7–8, 13).

**Exploit audit.** Confirmed exploits: memorized fixed positions (#1–6), midpoint slider (#5), guess-one-answer on coin flips wins ~50% (#7–8), random tap on classify wins 33–50% (#30), live readouts let you dial to the answer (#5, 19).

---

## Per-game scorecard

| Game | Framework | Verdict | #1 problem |
|---|---|---|---|
| Trade Execution (#20) | sequence | ✅ **Ship** | Defaults make it slightly easy (#27) |
| BOS Placement | annotate | 🛠 Rework | Fake swing definition + multiple breaks (#9,10) |
| Order Block ID | annotate | 🛠 Rework | OB without imbalance (#12) |
| Spot the Error | annotate | ✅ Ship (polish) | Subtle cue (#20) |
| Pattern Recognition | classify | 🛠 Rework | Noise obscures pattern (#21) |
| Market-Structure Classify | classify | ✅ Ship (polish) | Trend/range edge (#22) |
| Stop-Loss Placement | annotate | ✅ Ship | Inconsistent with sizing split (minor) |
| Risk-Reward Builder | calculate | 🛠 Rework | TP not at a level (#18) |
| ChoCh Placement | annotate | 🟥 **Rebuild** | Answer always n-2 (#1,11) |
| VWAP Reaction | annotate | 🟥 Rebuild | Answer always idx 13 (#3) |
| Liquidity ID | annotate | 🟥 Rebuild | Answer always [9,15] (#2) |
| Trendline | annotate | 🟥 Rebuild | Anchors always [4,16] (#4) |
| Candle Builder | build | 🟥 Rebuild | 2 targets, no wicks (#6) |
| Position Size | calculate | 🟥 Rebuild | Midpoint = answer (#5) |
| Support Zone | annotate | 🛠 Rework | Boxes the extreme (#16) |
| Resistance Zone | annotate | 🛠 Rework | Boxes the extreme (#16) |
| Fakeout Detection | predict | 🟥 **Rebuild** | 50/50 no tell (#7) |
| Trade Management | predict | 🟥 Rebuild | 50/50 no tell (#8) |
| Trade Prediction | predict | 🛠 Rework | 23% unsignposted reversals (#13) |
| Multi-Timeframe | predict | ✅ Ship (shallow) | Just "read the arrow" |

**Tally: 5 ship, 7 rework, 8 rebuild.** The rebuilds are all the same two root causes — *fixed answer positions* and *coin-flip outcomes* — so they're cheaper to fix than the count implies.

---

## Prioritized remediation roadmap

**P0 — credibility & exploits (do before any player sees this):**
1. Kill the 6 fixed-answer exploits (#1–6) — seed-vary every answer position.
2. Make Fakeout & Manage *readable* (#7–8) — give fakes a real tell, link Manage's future to visible context. Use #20's deterministic-but-fair model as the template.
3. Fix the structure definitions (#10–12, 16) — true pivots, real OB imbalance, multi-touch S/R.

**P1 — fairness & learning loop:**
4. Show the correct answer on every result (#15).
5. Generous concept-tolerance scoring instead of pixel taps (#14); per-framework time + no zero-on-timeout (#24).
6. Wire glossary/intro for jargon (#25) and interaction coachmarks (#26).

**P2 — depth & the thing you actually want:**
7. Real difficulty levers — distractors, required confluence, hidden helpers (#23).
8. **Make more games multi-pronged like #20.** The `sequence` framework already supports it — e.g., a "Structure → Entry → Manage" 3-step, or a "Spot liquidity → predict the sweep → trade the reversal" chain. This is the highest-ceiling direction in the whole library, and it sidesteps the single-interaction repetitiveness that plagues the 1-step games.

**Bottom line:** the framework is sound and #20 proves the ceiling is high. But ship the current 1-step games as-is and you'll teach memorization and coin-flipping under a trading-education banner. Fix P0 first — it's a few days of generator work, not a redesign — and the library becomes genuinely good.
