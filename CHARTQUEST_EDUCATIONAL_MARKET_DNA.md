# ChartQuest — The Educational Market DNA

## The permanent specification for how educational *markets* behave — multi-candle structure, its translation to terrain, and its choreography for learning.

*Version 1.0.1 · 2026-07-23 · Creative Director + lead curriculum design. (v1.0.1 = hardened by an adversarial red-team — six hostile reviewers, each finding independently verified against the doc. Fixes below.)*

> **Red-team hardening (v1.0.1).** A six-lens adversarial review (prop trader · quant · learning scientist · platformer designer · accessibility · product) attacked this spec assuming it teaches 100,000 beginners; every finding was independently verified. **Zero blockers.** Corrected: the pullback **invalidation** now reads structurally (close below the origin higher-low ≈ 100% of the leg, *never* "62–66%"); the **breakout retest** depth is now coupled to break height (a fixed drop couldn't reach a tall break's deadzone) with power-breaks routed to break-and-go; the **impulse** net-rise math is fixed (3 driving boost-steps ≈ 485–540px; no unreachable 300px floor; a 4th candle taper); the **vertical camera** model is now specified (bounded lazy follow, recentred by pullbacks) and a **min standable-top-width** rule added (both new §4 Group A rows); the **rest-beat** rule now keys off the *end of a boost run* so it stops rejecting legal impulses; the **fuel** model resolved to reset-on-land; the "**down is easier**" terrain mislabel reframed to "with-trend is easier"; the **breath count** softened to 1–3; and the "**break of structure**" umbrella split into continuation (130–200px) vs coil-launch (200–335px). Refuted overreaches (kept as-is): the one-dip First Loss (serves the Governing Image), "compression precedes expansion" (correctly an antecedent), the ~130px stop baseline (stop is placed *beyond* structure, correctly). Residual founder calls sharpened in §7.*

> **Where this sits.** Above the engine, below the soul. The [Visual Market Constitution](CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md) governs how *one candle* is drawn; the [Trading Experience System](CHARTQUEST_TRADING_EXPERIENCE_SYSTEM_v1.1.md) governs the *felt single trade*; the [Pattern Library](docs/pattern-library/) *names* recurring shapes; the [Campaign Bible](CHARTQUEST_CAMPAIGN_BIBLE.md) owns the *emotion*. **This document owns the layer none of them do: how many candles behave *together* — a trend, a pullback, an impulse, a reversal, a breakout, a fakeout — how that behaviour becomes ground Finn walks, and how it is choreographed so a beginner learns to read.** It is the behavioural spec the future `window.CQ` market generator ([Phase 2A](CHARTQUEST_PHASE2A_MARKET_ENGINE_BUILD287_2026-07-23.md)) consumes. It cites the Constitution's numbers; it never re-legislates them.

---

## §0 · Why this document exists, and the Governing Image

For roughly twenty playtests the same class of bug kept coming back — candles that read wrong, a chart that flattened into boring ground, a trade that resolved dishonestly — because **market *behaviour* had no single owner.** Single-candle pixels were governed. The felt trade was governed. But the space between one candle and one trade — the shape a *sequence* makes, and what that shape is allowed to teach — was authored by improvisation, sixty times over. This document is that missing owner.

It exists to make one thing true: **that the market a beginner falls into is honest at the level of order flow, legible at the level of a ten-year-old, and choreographed at the level of the heart** — all at once, and never in conflict. When those three pull apart, this document says which wins, and it always answers up.

**The Governing Image — the Dive That Is the Climb.** The Campaign Bible holds one picture: *a child falls into the Blockchain Ocean not knowing how to swim, and the market keeps one hand flat under their back the whole way down.* The chart is not a picture on the wall. **It is the floor.** Every structure in Part I is, first, a thing Finn stands on: the trend is a staircase, the impulse a wall you boost over, the pullback a dip you dive through, the reversal a peak that turns, the breakout a launch off a coil, the fakeout a trap ledge that speaks the language of a reward. We do not bolt drama onto a chart. **We author the market's own rhythm and delete the stretches that would bore or betray a beginner** — because the shape of the market and the shape of the emotional curve are, when this is done right, the *same shape*.

**Who this is for.** The in-game text is worded for a ten-year-old, and it never once says the word "teach." *This document is not that text.* It is written for the adults who build the engine — full-depth, in a trader's own vocabulary, order flow and all. The child never sees a break-of-structure named; the author must know exactly what one is, why it prints, and how tall it may be as terrain. This is the author's copy.

---

## §1 · The Prime Directives

Nine laws. Every envelope in this document is downstream of one of them; where a section's detail and a directive seem to disagree, the directive governs.

**1 · The chart is the floor.** Every structure is terrain before it is anything else. If it cannot be walked, jumped, dived, or flung, it is not authored — it is drawn. A market truth that has no traversal verb has no place in Levels 1–3.

**2 · Realism is the substrate; pedagogy chooses the emphasis.** The order-flow story under every shape is honest — we never distort *what the market is doing* to make a point. What we choose is *which* honest truth the frame spotlights, and in what order. Framing is a teaching act; falsification never is.

**3 · Reachability is the hard law.** No required rise between two standable tops exceeds **501px** (the two-boost apex); a rise above 501px is *physically impossible for Finn* and is **never authored — full stop.** Ordinary steps stay **≤200px** (one boost clears any with margin); horizontal gaps stay **≤367px**; the walkable road runs at **gap 0** (candles touch). Authoring an unclearable wall is the cardinal sin — the build-284 impossible-jump — and this law exists to make it a build failure, not a playtest surprise.

**4 · The variety law — no moment is a metronome.** Step-delta **CV ≥ 0.35 per 12**, **≤ 2** same-magnitude steps in a row, **≥ 1 peak ≥ 185px per 12**. This is not a taste rule. A staircase of identical +130px steps is not merely boring to a child who autopilots it in two seconds — *it is a falsehood about markets, which never move in equal beats.* Variety and market-honesty are the same law.

**5 · Never render, never teach, the untaught.** A structure may be *felt* in terrain long before it is *named*: the boost-wall **is** the break-of-structure the player will one day learn to call BOS; the pullback dip **is** the retrace before the child can spell it. But a read is **tested** only once its concept and every prerequisite are mastered — **≥ 3 practice reps apiece.** We seed with the body; we never examine with the mind's un-owned tools.

**6 · The authored First Loss lands on a perfect read.** The single dip in the whole first-hour curve is a *clean* trend + pullback + confirming close that then reverses to a stop placed one floor below entry. It is small because the stop caught it; it teaches no shame because the read was right. *A good read can still lose* is the one truth no win can buy — and it is bought exactly once, on purpose, gently, so a stranger in a real market never has to sell it to the player for more.

**7 · The market may only fool the trained-for — never cheat.** A fakeout springs a trap the player was **equipped to read** (body-vs-wick, taught first), signposted with a reserved non-colour hazard cue, and always survivable — the chase-fall stays under the big-fall daze threshold and every climb-out is ≤ 501px. We spring the traps whose counter we taught. We never spring one we didn't, and we never bury the tell.

**8 · Author the whole before the parts.** Compose a leg's *total* displacement from its order-flow story first, then distribute it into ≤ 200px steps that honour the variety law — so the conviction candle genuinely dominates and the leg is front- or back-loaded like a real one. Never *sum* equal steps into a fake "measured move." Structure is authored; candles are derived.

**9 · In doubt, defer up to the Campaign Bible.** This DNA serves the Ten Memories and the law that *we never drown a swimmer we are teaching.* When correctness and feeling appear to conflict, the feeling wins — because the feeling is what earns the one sentence the whole product is measured by: *"I can actually read a chart."*

---

# §2 · Part I — Market Anatomy

*The six behaviours, in the order the curriculum meets them. Each is presented the same way: the trader's read, the order-flow story that makes the shape, the candle grammar, what it teaches and where it sits, the terrain translation, and a numeric envelope. Trend is authored first because every other structure is defined by pointing at it and saying "relative to this."*

## §2.1 · Trend — The Directional Staircase

> *The trend is not a candle. It is the shape the candles make when the same side keeps winning at a better price. Every other structure in this document — pullback, break of structure, order block, sweep — is defined against a trend. Author the trend first; everything else hangs off its spine.*

### The trader's read

A trend is a sequence of swing points that steps in one direction: **higher highs and higher lows** for an uptrend, **lower highs and lower lows** for a downtrend. The swing structure *is* the definition — not the colour of the candles, not a moving average, but the geometry of where price turned and how far. As long as each pullback bottoms **above** the prior higher low and each push **body-closes above** the prior swing high, the uptrend is intact. The moment a pullback closes below the prior higher low, the staircase is in question — a change of character, not yet a confirmed reversal (§2.4), but the first honest doubt. This is the single most important frame a beginner can install, because it converts a wall of noise into one question with a yes/no answer: *are the steps still climbing?*

### The order-flow story

An uptrend is a **repeated failure to sell lower.** Each impulse leg (§2.3) is aggressive buyers lifting offers and eating through resting sell-side liquidity until near-term demand exhausts. Then the pullback (§2.2): early longs bank profit, passive buyers step back, and price retraces *into* the prior leg — but it is met by fresh limit buyers, often near where the last breakout originated. Because those buyers absorb the supply before price can reach the prior trough, the market prints a **higher low**: sellers were handed the ball and could not carry it down. The next leg body-closes through the prior high — a with-trend break of structure — confirming demand is winning the auction at progressively higher prices. Repeat. A downtrend is the exact mirror: sellers hitting bids, every bounce capped below the last high, buyers unable to reclaim. The trend *is* one side's structural advantage, made visible one swing at a time.

### Structural grammar

A trend is built from a repeating two-part unit — **one stair**: an **impulse leg** (3–6 candles, bodies predominantly with-trend, the conviction candle the largest in the leg, short rejection wicks against the move) followed by a **pullback** (2–3 candles, smaller counter-trend bodies, retracing ~38–62% of the impulse and holding above the prior higher low). One stair spans **5–9 candles** and posts exactly **one new HH and one new HL**. A ~12-candle screen shows **~1.3–2 stairs** — enough to read the pattern once fully with a second forming, not so much it blurs. The upper wick at each swing high is diegetic order-flow: *price tried higher, got tapped back, but still landed above the last peak.* Per the Visual Market Constitution (single-candle geometry is **its** authority), bodies floor at ≥ 18px desktop / 16px phone, the on-screen median stays ≥ 60px so the conviction candle reads as genuinely bigger, and width jitter of ±4–8% keeps the staircase from looking machined.

### What it teaches, and where it sits

Trend is taught **immediately after single-candle anatomy and momentum, and before pullback and BOS** — because pullback ("the dip that holds the higher low") and BOS ("the push that takes the last high") are *literally* defined against this spine. In ten-year-old language: *"The market is climbing a staircase. Each step lands higher than the last. While the steps keep climbing, the climb is on."* Confidence is **measurable**: the player demonstrates trend-reading first by *traversing* the staircase without falling (embodied competence), then by answering "is this still stairs up?" at a swing point (declarative competence). The trend lesson **names** only the shape and the with-trend bias; BOS, order block and sweep are **felt but never named or tested** here — the boost-wall *is* the with-trend break the player will later learn to call BOS. This backbone is the substrate for **Guardian 1, The Gambler**, whose lesson is *trade with the staircase, don't bet against it.* Never test the untaught: no BOS/OB/sweep *read* is demanded until the trend and its pullback have been walked ≥ 3 times.

### The terrain translation

**The uptrend is a climbable staircase ascending left-to-right, and the reachability budget is the law of its proportions.** Each impulse candle's body-top is a **riser**; the top of the leg is a **landing**; the pullback is a **descent into the higher low**, gravity (2300 px/s²) catching Finn before the next riser. Because bodies touch (gap 0), adjacent tops are only ~24–56px apart horizontally, so a stair step is a **vertically-constrained climb, not a horizontal leap** — the 367px horizontal-reach budget is pure slack here and can never strand him.

The reachability ladder, corrected against the physics:

- **Connective undulation (~20–90px between jump beats):** absorbed by the run or a reflexive micro-hop. These living non-flat candles satisfy the "no flat run > 3 candles / 220px" law without demanding a committed jump.
- **Ordinary stair step (~130px, the Constitution's step-delta floor):** a **tap-jump landing near apex** (standing apex ≈ 132px), kept fair by the ratified Game-Feel Invariants (coyote ≥ 90ms, jump-buffer ≥ 120ms, landing squash) — never left to a frame-perfect apex touch.
- **Boost-wall (any step decisively above tap range, peaking at the conviction/BOS candle 185–200px):** exceeds a tap, so it **requires a jetpack boost** (apex ≈ 335px, generous margin). The biggest momentum bar in the leg is literally the one that forces the boost — feel follows structure. A typical leg reads *walk → tap → build → commit-a-boost at the conviction candle → drop into the pullback → repeat.*
- **Swing-high spin-pole:** the ≥ 26px upper wick that prints ~every 10th candle at a leg top becomes a pole with a shell on its tip — a reward *and* a twirl-fling onto the next landing. The wick that teaches "price tried higher and got pushed back" is the same wick that aids the ascent.
- **Pullback descent:** a **shell-tuck** (fast dive + forward roll) that carries speed into the next riser — but the drop stays **below Finn's big-fall daze threshold**, terraced across the 2–3 pullback candles, so a normal higher-low retrace never reads as a crash.

**The downtrend mirrors it as a descending staircase** — mostly gravity-assisted shell-tucks, each counter-trend bounce a small riser (a lower high) Finn hops before the next drop. **The ease that must be felt is *with-trend*, not *downhill*** — a subtle but load-bearing correction: gravity alone would teach "down is easy, up is hard," which is a falsehood about markets and a mis-lesson (shorting is not easier than buying). So the *with-trend* direction must be the flow in **both** regimes — running up a live uptrend should feel as much like momentum as tucking down a live downtrend, and it is the **counter-trend** move (climbing back up a downtrend's bounce, or the pullback dip inside an uptrend) that is authored as the effortful beat. Where raw gravity would otherwise make a downtrend a passive free-fall, the lower-high hops and the *diegetic* framing (Finn is *surfing the trend*, boost = riding momentum) carry the ease as "you are moving with the market," never "down is easier than up."

**The decomposition rule that keeps it real *and* jumpable:** a real impulse leg is one continuous move, but as terrain it is a run of candle-top steps, **each individually ≤ 200px**, so even a 450px leg is three ~150px risers — climbable, never a cliff. Author the leg's *total* displacement from the order-flow story first (Directive 8), then distribute it honouring the variety law, so the conviction candle genuinely dominates. **Per-step reachability (≤ 200px ordinary, ≤ 501px absolute) is the hard law; cumulative climb is carried by a *bounded, lazy* vertical camera-follow** — NOT an unbounded "held at centre on both axes" lock (that would let a persistent uptrend either drift the summit out of the [80,700] stage or pin Finn to the ceiling). The vertical model (specified in §4 Group A): a dead-zone follow that lets Finn rise within a band, drifts up only when he leaves it, and is **recentred by every pullback/consolidation** — which is precisely why the trend needs periodic pullbacks (§2.2) to *walk up the stage* rather than shoot off it. The horizontal 0.52 anchor keeps the next developing step ahead of him where he can read it before he must jump it. (The independent "summit + stop ≤ 620px on one screen" trade-visibility law, §3.4, holds under either camera model.)

### Numeric envelopes

| Quantity | Envelope | Anchor |
|---|---|---|
| Connective undulation (non-jump candle) | **~20–90px** delta | prevents flat runs; walked/micro-hopped |
| Ordinary stair step (tap-jump) | **~130px** (near 132px standing apex) | Constitution step-delta floor; fair via Game-Feel Invariants |
| Boost-wall / conviction (BOS) candle | **decisively > tap range, peak 185–200px**, ≥ 1 per 12 | forces one boost (335px); rhythm peak law |
| Riser per with-trend jump beat | **130–200px** | BOS impulse window; ≤ 200 keeps every step jumpable |
| Impulse leg length | **3–6 candles** | one HH per leg |
| Pullback length | **2–3 candles** | one HL per leg |
| Pullback depth | **~38–62% retrace of the impulse**, holds prior HL | healthy-trend band; drop = that fraction of the *leg's net rise* |
| One stair | **5–9 candles**; ~1.3–2 per screen | legible, not blurred |
| Net climb | **≥ 130px / 10 candles**; span **≥ 300px / 20** (minima) | verticality cadence; cumulative carried by camera |
| Absolute rise between standable tops | **≤ 501px** — never author higher; ordinary ≤ 200 | two-boost apex; boost budget reserved for peaks |
| Jump cadence | every **4–6 candles** | matches impulse cadence |
| Spin-pole (swing-high wick) | ≥ 26px up-wick, ~every **10th candle** at leg tops | reward + ascent aid |
| Step-size variety | **CV ≥ 0.35 / 12**, ≤ 2 same-magnitude in a row | anti-metronome |
| Horizontal reach | **367px = slack** in a gap-0 trend | never binding; author no gaps in the pure staircase |

## §2.2 · Pullback — The Rest Inside the Trend

### The trader's read — the order-flow story

An impulse leg is one side winning a fight and running — momentum made visible. A **pullback is momentum resting between rounds**: not the other side winning, just the winners booking part of the move while price drifts back on thinning participation. In an uptrend the aggressive bid steps off, early longs scale out into the offer, a few counter-trend shorts lean in — but there is *no aggression behind the drift*. Bodies shrink, ranges overlap, lower wicks print as dip-buyers quietly defend. Then the trend side reloads — at a demand shelf, an order block, or the lower-half *discount* of the leg — and resumes. The whole signature is **absence of conviction on the counter-move**. That separates a rest from a reversal, and every envelope below exists to keep it a rest. Precision: only the **50–62%** zone is a true *discount* (below equilibrium); 23–50% is a shallow, still-premium continuation.

### Structural grammar

Bounded on three axes; break any one and it is a structural break, handed to §2.4 — not authored here.

1. **Depth (price-correction).** Retrace **23–62%** of the leg. 23–38% = strong-trend shallow (premium); 38–50% = textbook; 50–62% = the deep *discount* that *feels* like a reversal but isn't. **Invalidation is structural, never a retrace %:** price must hold **above the higher-low that launched the impulse**. That low sits at the impulse *origin*, so a *close* below it is **≈ a 100% retrace of the impulse leg** — a bearish break of structure / change-of-character, a reversal authored in §2.4; do not mislabel it a continuation BOS. **62% is only the deep-*discount* boundary ("watch closely"), never the death line** — a 55% retrace that holds the origin low is a healthy continuation, and §2.4 confirms 50–70% holds are buys. Conflating 62% with invalidation would cap pullbacks at ~66% and forbid the valid deep-hold continuation the curriculum must be able to author.
2. **Duration (short).** We author the **sharp** pullback: **2–5 candles, `M ≤ N`** (never outlasting the leg it retraces). Real markets also correct in *time* — bull flags consolidate more bars than the pole — but that variant is a design-deferral, not a trading law: a long flat would breach A.6 `maxFlatRun` (no flat run > 3 candles / 220px) and is beginner-ambiguous. Time-corrections become a later Type-A lesson.
3. **Conviction (quiet).** Counter bodies sit at/near the **body floor (~18–40px)** — a visible *fraction* of the impulse's bodies (~100–180px in a live leg, well above the ~60px *global* median). They **shrink and overlap** (each opens inside the prior body); lower wicks lean trend-ward. **One large opposite body with expanding range is distribution — forbidden.**

### What it teaches, and where it sits

Order: **candle anatomy → momentum → PULLBACK → BOS → OB → sweep → confirmation entry.** Pullback is the hinge. **Teach-gate:** only candle anatomy + momentum exist yet, so PRACTICE/TEST may grade only **depth, higher-low-holds, and quiet conviction** — never OB, sweep, or a formal confirmation pattern. It teaches proto-confirmation — *"don't commit in the drift; wait for the turn"* — not the graded confirmation mechanic that comes last. It also carries the heaviest beat: the **courage of holding through the dip**, and the authored **First Loss** (§3.3) — a pullback that *fails* (breaks the higher-low). That loss is **authored and narrated, not a graded exam of the untaught**; it is the honest on-ramp into BOS. Banked truth: *a pullback is a discount, not a threat — if it holds the higher-low.*

### The terrain translation

An uptrend is a staircase (up-steps 130–200px every 4–6 candles). A pullback is **one dip Finn drops into and climbs back out of** — terrain proof a rest is recoverable.

- **The dive.** A counter-trend drop of **130–200px**. Finn **shell-tucks** into it, turning drop into carry-speed — buying the discount: go *down* to get *forward*. The 130px floor keeps it a jumpable notch and clears the forbidden **(18,130)px dead-band**.
- **The joint law (generation-critical).** `dive ≈ retrace% × impulseRise`, clamped to **[130,200]px**. So the leg must be tall enough: **impulseRise ≥ ~210px** for a 130px dive to stay ≤ 62%; shallower retraces need proportionally taller legs (a 23% retrace ⇒ a ~565px multi-step leg). Pick height and retrace *jointly*; to *show* a shallow retrace without building a huge leg, use a **Type-A framed chart**, not the walkable road.
- **The rest-ledge (optional).** 1–3 candles **at the body floor (~18–24px, never below — sub-floor breaks A.6)**, ≤ 220px flat-run. Never > 3 (that's a range). The dip is also what *satisfies* the variety law (step-delta CV ≥ 0.35) — it breaks the metronome by design.
- **The climb-out (staged).** A resumption step of **130–200px** back to the prior-high ledge, *then* the normal next up-step — **never a single dip-bottom → new-high leap**, which could exceed one boost. Max dip (200px) < one-boost apex (335px): tap-jump at the low end, one boost at the high end. **Never two boosts; a drop needing > 335px isn't a pullback, and > 501px is impossible.**
- **The higher-low floor, as terrain.** The dip bottom stays above the impulse-origin platform. Because depth is capped at 62%, the bottom sits **≥ 0.38 × impulseRise above the origin** (≥ ~80px for the smallest legal leg; far more for shallow dips) — *not* a fixed 30–60px. Sink to/under the origin and Finn has fallen *off* the staircase: render a **cliff (reversal), not a dip**.
- **Reward for patience.** Put the shell — and, when the ~every-10th-candle spin-pole is due (up-wick ≥ 26px) — on the **resumption** candle, never the dip floor. It pays confirmation, and the twirl-fling *doubles as the climb-out aid* at the tall end. Camera anchor 0.52 lets the dip develop ahead of Finn so he *sees* it form and *chooses* to commit — agency over position, per the TES.

### Numeric envelopes

| Axis | Envelope | Terrain | Invalidation |
|---|---|---|---|
| Depth | 23–62% (discount = 50–62%; 62% = watch-line, **not** death-line) | dive = retrace% × impulseRise, clamped **130–200px** | close below origin higher-low (**≈ 100% of the leg**) |
| Impulse precondition | **impulseRise ≥ ~210px** | tall enough for a ≥ 130px legal notch | too-short leg → no walkable pullback |
| Duration | 2–5 candles, M ≤ N | 1 dive + ≤ 3 floor candles / ≤ 220px flat-run | outlasts leg (flags deferred to Type-A) |
| Conviction | counter bodies ~18–40px, shrinking, overlapping | quiet ledge, no large counter-candle | one big opposite body / expanding range |
| Recoverability | staged climb ≤ 335px (one boost); dip ≤ 200px | resumption step 130–200px, then continue | needs 2 boosts / > 501px impossible |
| Higher-low daylight | dip bottom ≥ 0.38 × impulseRise above origin (≥ ~80px) | ledge stays above origin-candle top | ≤ origin = BOS cliff |
| Reward | on the resumption candle | shell + spin-pole at climb-out | reward on dip floor = knife-catching |

## §2.3 · Impulse — The Decisive Expansion Leg

### The trader's read — the move that pays

An impulse is the market's **decision made visible** — the leg where one side stops negotiating and starts *taking*. It is a run of large-bodied, same-direction candles that close at or near their extreme with little opposing wick. The accumulation range and the pullback are only the setup and the entry; **the impulse is the payday.** A trader positioned before it and holding through it captures the bulk of the move; everything else is context.

### The order-flow story

A big body is not "a big candle." It is the residue of an auction that stopped balancing. In a balanced candle price rotates: buyers lift the offer, sellers refill, wicks form both sides, the body stays modest. In an impulse, resting liquidity is **overwhelmed faster than it refills** — aggressive market orders sweep every offer up a ladder with no size to absorb them until far higher. The signature:

- **Body dominance** — body/range ≥ 0.70, close-side wick ≤ 0.3 × body. Per the anatomy law (*body = the fight, wick = where price tried and got shoved back*), an impulse is a fight with almost no shove-back.
- **Range expansion** — true range ≥ ~1.5× the **trailing median range** (the on-chart ATR-pop; measured against range, not body). This co-occurs with body ≥ 1.5× the trailing median body because the ratio stays ≥ 0.70. It is the single most reliable "this is real" tell for a pro.
- **Close near the extreme, sequential same-colour closes, typically accelerating then tapering** — impulses are *ignited* (a stop cascade, a level break, an order-block activation), never spontaneous.

That ignition is why an impulse is never context-free: it is the **expression** of a break-of-structure, breakout, or liquidity sweep (§2.5, §2.6), not an event unto itself. **Impulse is the engine; BOS/breakout/sweep are the events that engine executes.**

### Impulse vs. a mere trend step — three measurable splits

A trend step is one stair inside a calm 4–6-candle cadence, near-flat treads between, clearable by a light hop. An impulse is that stair's opposite: (1) **size** — impulse bodies run ≥ 1.5× the level median vs. a step sitting near it; (2) **continuity** — the between-step breather is stripped, 3–4 boosts stacked with no rest; (3) **conviction** — wicks minimal (body/range ≥ 0.70) vs. ordinary two-sided wicks. One stair vs. a committed climb.

### What it teaches, and where it sits

Impulse teaches **momentum**, concept 2 after candle anatomy and the prerequisite for pullback (concept 3, *defined against* the impulse it retraces). It appears in **Level 1** after the child can read a single body, and it is exactly the evidence Guardian 1 (The Gambler) rewards: the disciplined reader waits for the big-body proof of control; the gambler jumps at noise. Ten-year-old takeaway: *"that side won, and it won hard — big fat bodies, tiny wicks."*

**Curriculum-honesty guardrail (Directive 5).** The *adult* order-flow story names BOS/sweep/OB as ignition. The *child-facing* L1 teaching may lean on **none** of them — at introduction an impulse is taught purely as body-dominance; its ignition causes are back-referenced only once BOS/sweep are taught in later levels. Likewise the post-impulse pause is L1-taught as an un-named "the market takes a breath"; it becomes the named, tradable **pullback** only at concept 3. Two authored guardrails carry the concept:

- **The exhaustion lesson.** An impulse must resolve into a pause within 3–4 candles. Capping the run and following it with a breather teaches "don't chase into exhaustion" and *seeds* (does not yet test) the pullback lesson.
- **The false-impulse contrast** — the first measurable confidence check. A candle whose **close-side wick ≥ ~1× body and body/range < 0.5** is a **rejection**, not conviction (price reached the extreme and got shoved back before the close). The child can point to the leg and correctly predict the pause.

### The terrain translation — the wall that demands a boost

**Candles are terrain; the impulse is the one place a tap-jump is provably not enough.** Its verb is the **jetpack boost.** The trend staircase is walked and lightly hopped; the impulse's body-tops sit *above* tap range, forcing a boost commitment (one-boost apex ≈ 335px). The boost becomes diegetic conviction: the market took off, and so did you.

The load-bearing terrain fact: under gameplay **gap 0** (candles touch, `bw=c.w+1`), a clean gapless continuation makes each **candle's body ≈ its walkable step**. So impulse driving bodies **and** their steps both live at **150–200px** — never the 200–420px "spike" a naive author reaches for, which would either violate the 200px `jumpStepDeltaPx` ceiling or require a low open that destroys the conviction read. The 420px `maxBodyHeight` cap is for a rare Type-A/boss climax candle whose excess is range/wick, not a driving step.

Generation grammar for a bull impulse:

- **A full-strength LOUD release is exactly 3 driving boost-steps** — same direction, treads removed. The arithmetic forces this: 3 driving steps at 150–200px (with ≥ 1 signature ≥ 185px) net **~485–540px**, which fits the stage with ≥ 80px headroom. A **4th** candle cannot be another *driving* step (4 × 150 = 600px > the 540 cap), and decelerating it below 150 would push it into the forbidden (18,130) dead-band unless it lands at **130–150px** — so any 4th+ candle is a **tapering tap-range step (130–150px), no longer "driving"**: it *is* the deceleration into exhaustion, not a fourth boost-wall. The run *is* the "peak per screen" the rhythm law wants and locally *intensifies* the 4–6 cadence — it never violates it.
- **Driving steps 150–200px**, so a boost is genuinely required and *felt*, with **≥ 1 signature step ≥ 185px** (satisfies `peakStepMinPx`).
- **Exactly ONE boost per step** (335 one-boost apex clears ≤ 200px with margin). **Every body-top is a real landing that resets the 2-boost budget** — which is precisely why 3 consecutive boosted hops are reachable with the ≤ 2-per-air-time fuel model (§7 Q2 resolved: reset-on-land, tank ≥ one step). The second boost / 501px apex is an absolute backstop, never required by a legal impulse.
- **Net contiguous rise ~485–540px for the 3-step LOUD release** (the old "300px floor" was unreachable — the minimum 3-step run is 3 × 150 = 450px). ≤ 540 leaves ≥ 80px headroom in the 620px stage (`levelMin/Max` 80–700), so Finn is never pinned at the ceiling; 5 full 150–200px steps (750–1000px) is stage-illegal, which is *why* the driving run caps at 3.
- **Variety holds inside the run.** CV ≥ 0.35, ≤ 2 in the same magnitude bucket — the impulse is a run of *differing* big steps (accelerate → taper), never four 180px clones.
- **Ignition = a launch** (optional horizontal launch gap ≤ 367px, `maxHorizontalGapPx`). **Crest = the exhaustion candle**: crown it with a spin-pole (up-wick ≥ 26px, shell on tip). That up-wick *is* the rejection where price tried higher and got pushed back — the terrain reward and the exhaustion lesson coincide, and that wicked crest is by definition the first non-impulse candle.
- **The pause must be legal terrain** — either ≤ 18px stalls (≤ 3 candles) or a genuine ≥ 130px pullback drop, never a (18,130) dead-band drift.
- **The bear impulse is the same conviction under opposite gravity** — a cliff Finn dives with a **shell-tuck**, gaining speed instead of spending boost.

Camera anchor 0.52 leading to 0.62 with velocity lets the wall **loom into view ahead of Finn** so he commits the boost *before* arriving — the platforming beat mirrors the trader's: read the expansion, then act.

### Numeric envelopes

| Property | Envelope | Ground / cite |
|---|---|---|
| Driving body (= step, gapless) | **150–200px** (≈ 2.5–3.3× the 60px median); 90px = bare impulse-vs-step floor | `medianVisibleBodyMinPx 60`; body ≈ step under gap 0 |
| Body/range (conviction) | **≥ 0.70**; close-side wick ≤ 0.3 × body | anatomy law: body = the fight |
| Range expansion | true range **≥ 1.5×** trailing median **range** (ATR-pop) | measured vs range, not body |
| Rejection (false-impulse) | body/range < 0.5 **and** close-side wick ≥ ~1× body | the L2 confidence check |
| Run length | **3 driving** boost-steps (a 4th+ candle is a 130–150px tapering tap-step, not driving); ≥ 6 total = exhaustion | breathes into a pause |
| Driving step per candle | **150–200px**; ≥ 1 signature step **≥ 185px** | `jumpStepDeltaPx [130,200]`; `peakStepMinPx 185` |
| Net contiguous rise (3-step LOUD) | **~485–540px** (min 3×150=450; ≥ 80px stage headroom; no 300px floor) | world 80–700 (`levelMin/Max`) |
| Boosts required | **exactly one per step**; every body-top landing resets the 2-boost budget | 335 one-boost apex; reset on land |
| Absolute per-hop backstop | **≤ 501px** unbroken (never approached — the 200px step cap binds first) | two-boost apex |
| Ignition launch gap (optional) | **≤ 367px** horizontal | `maxHorizontalGapPx 367` |
| Variety (holds in the run) | CV ≥ 0.35; ≤ 2 same magnitude bucket; accelerate → taper | anti-metronome law |

## §2.4 · Reversal — The Turning Staircase (the Peak / Valley Pivot)

> *The capstone of structure. A reversal is not a big red candle — it is a change of structural control confirmed by a broken swing. It composes everything before it, so it is taught last.*

### The trader's read

An uptrend is, precisely, a sequence of higher highs and higher lows (HH/HL); a downtrend is lower highs and lower lows (LH/LL). A reversal is the moment that grammar inverts. The decisive event is the first break of structure *against* the prevailing trend — the **change of character (CHoCH)**: in an uptrend, price breaks and *closes below* the last **protected higher low** it was obliged to defend (the external swing, not every minor wiggle). That close is the first hard evidence control has changed hands. A with-trend continuation break (**BOS**, §2.5) does **not** qualify; only the counter-trend break can turn the trend. In-game the child-simple copy says "break of structure," but the spec keeps the distinction: **CHoCH turns the trend, BOS extends it.** A lone CHoCH is necessary but not sufficient — it can fail and become a deeper pullback, which is why the turn is confirmed by structure, not called on the break alone.

### The order-flow story

In an uptrend buyers own every dip — each pullback is bought, printing a higher low. The turn begins when buy-side fuel runs out. The final push up either **fails to exceed the prior high** (a quiet fade), or spikes *above* it in a climactic blow-off to grab resting stop-liquidity and immediately fails — a **sweep** (§2.6) that traps the last breakout buyers long at the top. Those trapped longs are now fuel for the move down. Price then breaks the last higher low (**CHoCH**); the buyers who defended that low capitulate and sellers stack offers. The bounce that follows is the tell: it is a retest into the **supply that produced the break** — the bearish **order block** at the origin of the CHoCH impulse (the last up-move before price broke down), while the broken higher-low itself flips polarity from demand to resistance (the *breaker*, in advanced terms). Late sellers who missed get their entry, trapped longs exit at a better price, and the rally dies **below the old high**, printing a **lower high**. When that lower high holds and price drives a lower low, the new downtrend is confirmed. Conviction is legible the whole way: into the pivot the fight weakens — either bodies contract and wicks lengthen (the *fade* archetype), or one climactic expansion body over-extends and is swept (the *blow-off* archetype) — the break is one decisive opposite-colour body, and the retest is limp: small bodies failing to reclaim.

### The key confusion — reversal vs. deep pullback

This is the single most important thing §2.4 teaches, because a beginner's eye reads every drop as "scary." Frame it as a **three-outcome decision** taken *after* the counter-move, against the last protected higher low (HL) and prior high (H):

- **A — Deep pullback (buy the dip).** Price dips into a discount zone (often 50–70% of the prior leg) but **holds above HL**, finds demand, and resumes to a **new higher high > H**. Structure intact.
- **B — Sweep-and-continue (the false alarm).** Price briefly trades **below HL** to grab stops, then reclaims, closes back above, and still makes a **new higher high > H**. A liquidity grab, *not* a turn — the trap the beginner must not sell.
- **C — Reversal.** Price **closes below HL** (CHoCH) and then rallies only to a **lower high < H**. The failed reclaim confirms the turn.

> **The one discriminating question:** *after the counter-move, did price make a NEW HIGH or a LOWER HIGH?* New high (A or B) is still bullish; a lower high after a confirmed break is the reversal. **The lower high is the confirmation — never call the turn on the break alone.**

### Structural grammar (bull → bear canonical case; mirror for valley pivots)

1. **Approach staircase** — 3–5 rising bull bodies, each top **130–200px** above the last (the jump-step window), median body ≥ 60px, **risers deliberately varied (step-delta CV ≥ 0.35)** so it climbs like a mountain, not a metronome. Establishes the HH/HL climb.
2. **Exhaustion / pivot high** — 1–2 candles of weakening: either bodies contracting to **≤ 0.6× the trend median** (still ≥ floor) with a longer upper wick, *or* one climactic over-extension. Preferred: a **sweep** candle whose upper wick pokes *above* the prior swing high (wick maps true high, ≥ 28px drawn in Type B, hazard-sweep cue) and closes back inside — the trap.
3. **The break candle (CHoCH)** — one decisive bear body, ≥ trend median (focal ≥ 1.3× its neighbour in Type A per the Visual Constitution), closing **below the last protected higher low**. This is the structural break.
4. **The retest / lower high** — 1–2 bodies rally into the bearish order block but top out **visibly below** the pivot high; the LH < prior-high relationship reads at ≥ 1.5× separation (~1 body). This is the confirmation cluster.
5. **New leg** — 2–3 bear bodies stepping to a lower low: the inverted staircase.

*The pivot cluster (steps 2–4) stays ≤ 3 candles / < 220px horizontal so it never trips the "no flat run > 3 candles" law — the sweep's up-wick supplies the vertical break that keeps it from reading flat.*

### What it teaches, and where it sits

Reversal is **late** — the capstone. Its prerequisite DAG is candle anatomy → momentum → pullback → **BOS** → **order block** → **sweep/liquidity** → confirmation entry, because a reversal *composes* all of them: "a counter-trend break, born of a sweep, confirmed at an order-block retest." It must never be tested before **pullback and BOS are each independently mastered** (≥ 3 trades apiece; Directive 5). It lands at the **Serpent** tier (structure → reading intention), well past the authored First Loss, and its natural exam *is* the three-outcome discrimination: *given this chart, is it a dip to buy, a sweep to ignore, or a top to respect?* This re-teaches the Gambler's core virtue — wait for confirmation before you commit — now applied to structure rather than a single bet.

### The terrain translation — the staircase turns

On the approach Finn climbs a rising staircase, jump cadence every 4–6 candles. Because a step is **130–200px**, the **single jetpack boost (335px apex) is the workhorse riser** — its huge headroom lands him cleanly on top; the tap-jump is reserved for the shallow ~130px risers. Mixing the two delivers the mandated step-delta variety (CV ≥ 0.35): the climb *feels* like effort, not a drumbeat. Horizontal cadence stays traversable — 6 candles × 56px = 336px, inside the 367px reach. At the pivot the exhaustion candles form a hesitation plateau; the sweep is a tall **spin-pole up-wick (≥ 26px, drawn ≥ 28px)** at the very peak, a shell on its tip that twirl-flings Finn up-and-forward — a reward sitting *right where the trap is*. Then the break candle is a **cliff-edge down-step**: Finn drops off the peak. A fall is free under gravity (2300 px/s²), so this is the **shell-tuck dive** beat — converting the structural break into speed. The lower-high retest is a **short rise Finn must not expect to climb** — it tops out below the old peak, teaching the eye that the high is *lost*; then a descending staircase carries the new leg down. The lesson is enforced **in the terrain itself**: in a pullback the ground dips and returns to (or above) the *same* peak — Finn climbs back to where he stood; in a reversal, **post-pivot maximum ground height strictly decreases** — Finn can never reach the old peak again. The camera's **0.52 anchor** lets him *see* the lower high fail to reach the prior peak before he commits to the drop.

### Numeric envelopes

- Approach: 3–5 steps, ΔY **130–200px** each, **step-delta CV ≥ 0.35**; all within reach (367px horizontal / 501px max vertical); cadence spacing 4–6 candles ≤ 336px.
- Riser rule: tap-jump clears **≤ ~130px** risers only; **one boost (335px apex)** is the workhorse for **130–200px** risers; two boosts (501px) never needed on the approach.
- Pivot exhaustion body **≤ 0.6× trend median**, ≥ floor (18px desktop / 16 phone; 24px Type A focus); pivot cluster ≤ 3 candles / < 220px horizontal.
- Break candle body **≥ trend median**; structural terrain drop **one BOS impulse, 130–200px**.
- Lower-high top **clearly < pivot high** (separation ≥ 1.5× / ≥ ~1 body).
- Any retest up-leg **≤ 335px** unaided, **≤ 501px** absolute; a rise **> 501px is forbidden** (unreachable).
- Vertical span across the pivot **≥ 300px per 20 candles**; net elevation flips sign — **≥ +130px/10 (approach) → ≤ −130px/10 (new leg)**.
- **Post-pivot max ground height ≤ pivot height, monotonically** (the terrain-side proof it is a reversal, not a pullback).

## §2.5 · Breakout / Break-of-Structure — The Launch Off the Coil

### The trader's read

A breakout is the market **ending an argument it has been having with itself.** For a stretch of candles price is fair on both sides of a level — buyers defend a floor, sellers cap a ceiling — and the swing between them narrows as each side runs out of things to disagree about. Then one side's resting orders are exhausted, a full-bodied candle **closes beyond the level**, and price *expands* away from the box. That decisive close is the **Break of Structure (BOS)**: the level that held is now broken, and the prior ceiling flips to a floor.

The load-bearing word for a beginner is **close**, not *touch*. Price pokes through levels constantly; a break is only real when a **body — the fight, not the wick — finishes on the other side.** That single distinction is the whole lesson, and it is the exact tool the False-Breakout Eel (Guardian 2) hands back "for real."

### The order-flow story

The coil is not decoration — it is **liquidity building at the edges.** Resting sell limits defend the ceiling; resting buy limits defend the floor; and critically, **stop orders stack just beyond the ceiling** — the protective stops of trapped shorts, plus breakout buy-stops from traders who want in *only if* it goes. Volatility contracts because the auction is narrowing: each rejection is smaller, agreement is tightening, the spring compresses. A pro reads this as **falling range/volume into the apex** — the calm that precedes participation.

The break fires when the ceiling's offers are absorbed or a catalyst hits. Price trades up through the level, the stacked stops trigger (stops that *buy*), breakout buyers pile in, and the move turns **reflexive** — buying begets buying. That cascade is the wide **expansion candle.** Because the chart is terrain and there are no volume bars, **body size is the player's only reading of participation** — the fat break body *is* the surge in volume.

Some breaks then **retest** — price drifts back toward the broken level and *holds*, because the shorts who just covered and the longs who missed now defend it as demand. **Old resistance becomes support** — polarity flips. But an honest pro states the caveat plainly: **the retest is a courtesy, not a rule.** Many of the strongest breaks never look back; immediate expansion is often the *higher-conviction* signal. We author the retest so beginners get a lower-risk entry, not because a real break owes them one.

When there is *no* real participation behind the poke — just a stop-run above equal highs and an instant reclaim — you get the **false breakout / liquidity sweep** (§2.6): an upper wick, a body that closes back *inside* the box, and trapped chasers. That failure is not a flaw in the model; it is the Eel, authored on purpose.

### Structural grammar — three movements

1. **The coil (build-up).** 5–8 candles inside a contracting band, each swing amplitude **shrinking 15–20%** — a visible tightening. The canonical form is a **rising-floor coil (ascending triangle): a flat ceiling of equal highs over higher lows.** The ceiling is defined by **equal highs** (candle tops within ≤ 18px) that are *non-adjacent* — separated by dips into the range interior. The rising floor gives the coil a mild net-positive drift so it reads as *pressure building against resistance*, not a dead box.
2. **The break (expansion).** One decisive candle — a full body, **≥ 60px and ≥ 1.5× the coil's median body, and larger than any single coil candle** — that **closes above the ceiling.** It is the focal read: unambiguously directional, never a doji, expansion visibly larger than anything in the coil.
3. **The retest (confirmation, optional).** A pullback that **holds within the vertical deadzone (≤ 40px)** of the old ceiling, followed by continuation. Authored on most teaching breaks; **deliberately omitted on a minority (break-and-go)** so the player also learns the runaway break. A retest whose body closes back *inside* the box is the fake — same geometry, opposite verdict.

### Real vs. fake — the confirmation crux

The pedagogy lives in one comparison the player must be able to make: **body-closes-beyond-and-holds** (real) vs. **wick-pokes-and-reclaims** (fake). Three separators, taught explicitly: (a) a **close** past the level, not just a wick; (b) **expansion** — the break body dwarfs the coil (a doji-break is suspect *because* body = the only visible volume); (c) the **retest, when it comes, holds.** This is the *seed* of confirmation entry — "the close is the signal" — not the full concept taught later after sweep. It is the direct answer to a beginner's deadliest instinct: chasing.

### What it teaches, and where it sits

Concept: **`bos`** (mastery category *Structure*). Prerequisite: **`range-sr`** — you cannot teach the break of a level before the floor/ceiling is legible (`breakout-bos.dependencies = ["range-sr"]`, difficultyTier 3); if S/R legibility is not already established by the pullback material, author an explicit `range-sr` micro-lesson first. Curriculum order: candle anatomy → momentum → pullback → **BOS** → order block → sweep → confirmation entry. Because *never test the untaught* is law, the **honest break must be taught with ≥ 3 practice launches** before the Eel is allowed to slip a fake among the reals. Sequencing guard: the Eel (G2) also lands **after** the authored First Loss (Level 2), so the fake corrects the *chase reflex* rather than being the player's first taste of losing.

### The terrain translation

Reachability is bounded on the vertical axis only: **candles touch (gap 0), so max horizontal jump reach (367px) is never binding** — every difficulty in a breakout is a *height* the player must choose to pay for.

- **The coil is a tightening chop with a rising floor, never dead-flat ground.** A literal flat range reads fake to a trader *and* trips the rhythm law. Authored as equal-high peaks over higher lows: in-coil single-candle up-steps stay **≤ 150px (tap-to-light-hop)**, most well under, so **no jump inside the coil demands a committed boost.** The amplitude *contracts* into the apex (≈ 150px swings → ≈ 60–80px), which naturally **de-densifies the jumps toward the break** — the coil literally quiets down before the launch. Keep the whole coil inside the ~12-candles-on-screen window so the player can *read the box before trading it.*
- **The break is the launch — the first rise that clears the box.** The rise from the ceiling to the break candle's top is **200–335px** — deliberately past the ~132px tap ceiling, **past the empty 150–200px separation zone**, and into the **one-boost apex (335px)** regime, so the player must *commit the jetpack to clear it.* Committing the boost **is** committing to the trade — and because 150–200px is left intentionally unused, the break is the unambiguous "big beat," never confused with an in-coil hop. Height is grounded in structure: the launch runs **≈ 1.3–2× the box height** (a measured-move flavour). A power-break may reach **≤ 470px** (near two boosts) but **never exceeds 501px** — a rise above that is physically impossible and must never be authored. Drama comes from **expansion ratio and the boost-commit, not unreachable height.** The break also *pays the verticality debt* the coil withheld: it posts the peak step (**≥ 185px per 12**) and the required net climb.
- **The retest is a ledge that holds — not a trap.** After the launch, Finn shell-tucks back down onto the old ceiling, now **solid ground within the 40px deadzone** of the broken level. **The drop is bound to the break height, not fixed:** to land within 40px of the ceiling from a break whose top is `R` px above it, the retest drop must be `≈ R − (0…40px)` — a *fixed* 130–260px drop cannot reach the deadzone of a 335px break (it lands ~75px short, a floating shelf that never touches the level and kills the polarity-flip read). **A retest is therefore authored only for standard breaks (rise ≤ ~300px), where the coupled drop ≈ 160–300px stays a safe shell-tuck below the big-fall daze threshold; power breaks (300–470px) are always break-and-go** (no ledge — Finn keeps climbing, equally legal terrain). It holds; the drop is always safe (gravity 2300px/s²); continuation resumes at a legal **130–200px** step.
- **The fake is the Eel's trap ledge — colliding on purpose with the reward it mimics.** The false break renders as a **≥ 26px upper wick above the ceiling with no body under it** (as tall and tempting as a **spin-pole**, `#7fd6ff`, shell-on-tip — the reward the player has been trained to chase). The trap is drawn as the **hazard sweep wick (`#ff7a45` + a non-colour cue: no shell, unstable shimmer)** — because *both are long up-wicks*, the disambiguation must be hard, or a betrayed player quits. The tell is the trading lesson itself: **does the body follow the wick?** A chaser who jumps at the wick tip lands on nothing and drops **safely** back into the box (no death, no shame — L1–3 stays forgiving); **the standable ground only appears when the candle closes.** With the Living Market, the live-edge candle is still *forming* — its final body-top (the ground height) is not set until close. "Wait for the close" is literally "wait for the ground to solidify," rendered as terrain.

### Numeric envelopes

| Element | Envelope | Grounding |
|---|---|---|
| Coil length | 5–8 candles, amplitude −15–20% each swing | short enough to respect net ≥ 130px/10; visible contraction |
| Coil form | flat equal-high ceiling over **higher lows** (rising floor) | reads as pressure vs resistance; mild net-positive drift satisfies rhythm law |
| In-coil up-step | ≤ 150px (tap-to-light-hop); **150–200px left empty** | no in-coil jump needs a committed boost; separation zone makes the break unmistakable |
| Ceiling equal-highs | tops ≤ 18px apart, **non-adjacent** | equal highs without tripping the ≤ 3 near-equal / 220px flat-run cap |
| Break rise (standard) | 200–335px above ceiling; ≈ 1.3–2× box height | first rise above the box; past tap-apex → forces one-boost commit |
| Break rise (power) | ≤ 470px (hard cap < 501px) | nears two-boost apex; > 501px is impossible — never author |
| Break body | ≥ 60px, ≥ 1.5× coil median, **larger than any coil body**; never doji | body = the only visible "volume"; expansion certifies participation |
| Retest drop | **≈ break rise − (0–40px)** so it lands ≤ 40px of the ceiling (NOT a fixed range); authored **only when break rise ≤ ~300px**; power breaks = break-and-go | polarity flip; a fixed drop can't reach a tall break's deadzone |
| Continuation | 130–200px step | BOS resumes at legal cadence 4–6 |
| Fake poke | ≥ 26px upper wick above ceiling, body closes inside; hazard `#ff7a45` (+ non-colour), never spin-pole `#7fd6ff` | the Eel; standable ground appears only on the close |

## §2.6 · Fakeout / Liquidity Sweep — The Trap the Whole Curriculum Is Built to Defeat

> *The market pokes a hand past the obvious line, takes everyone leaning on it, and snaps back. The wick lies; the close tells the truth.*

This is the villain of ChartQuest. Every other structure teaches the player to *read*; the sweep teaches them that a chart is built to fool a reader who reads too fast. It is the emotional core of "the untrained eye gets taken," and the wild-water partner to the honest break of §2.5.

### The trader's read

A liquidity sweep (stop hunt, false break, Wyckoff spring/upthrust) pushes **past an obvious level, fails to hold, and reverses back through it.** One fact separates it from a real breakout: **does price *close and hold* beyond the level, or merely *wick* past and get reclaimed?** The close is the arbiter — which is exactly why the antidote is **confirmation entry**: you don't act on the poke, you wait for the body. A second, independent tell keeps this a *read* and not a superstition: a genuine break tends to **retest the level and hold** (broken level flips role); a sweep never gives that clean flip — it just runs the other way. Note honestly that confirmation is **not free**: waiting for the close costs a worse entry and occasionally the whole move. The felt price of patience is owned by the TES; here we only teach that the trade-off exists.

### The order-flow story

Resting orders cluster at obvious places — a clean swing high/low, equal highs/lows, a round number, a range edge. Below an obvious low sit longs' protective sell-stops and breakout traders' sell-stops; above an obvious high sit shorts' buy-stops and breakout buy-stops. **Those resting orders are liquidity** — the pool anyone needing size must consume to fill without pushing price against themselves.

To fill a large long you need sellers, and the densest supply on offer is precisely the stops below the low (longs forced to market-sell) plus fresh breakout shorts chasing the "breakdown." Price trades *down through the low*: the move trips the stops and lures the sellers, and that supply is **absorbed at a discount.** Once the pool is spent, supply is gone and price **snaps back** above the level. The trapped shorts are now offside; *their* buy-stops become the fuel for the continuation up. **This does not require a conspiracy.** Whether a single desk engineered the raid or it emerged from ordinary supply exhaustion at an obvious level is irrelevant to the read — the mechanics, and the tell, are identical. The snap-back doesn't *become* the macro break of structure by itself; it first **breaks the near-term structure the sweep created** (the minor swing printed during the poke), and BOS proper confirms on the next leg. That is why the sweep is taught **only after BOS** — the reclaim is a structure-break the student must already own.

### Structural grammar (the candle sentence)

1. **The obvious level** — a **pair** of near-equal tops/bottoms within the **≤ 18px** band ("equal highs"). Keep it to *two* candles bracketed by stepped candles: three-plus at one height would trip the *no-flat-run-over-3-candles/220px* law and read as dead ground. Obviousness is the bait.
2. **The approach** — price drifts in, but every walkable step still lands **≤ 18px or ≥ 130px** — never inside the forbidden `(18,130)px` dead band — so the road never goes soft.
3. **The raid / poke** — one candle pushes past with a rejection **wick ≥ 28px** beyond the level (gameplay wick law: `0 or ≥ 28`). Fast, emotional.
4. **The failure to hold** — the body cannot close beyond; within **≤ 1–2 candles** it closes *back inside*. Long wick past, body reclaimed — the signature.
5. **The reclaim** — a decisive **130–200px** body drives back through the level (≥ 130 clears the dead band): the *real* structure-break, the other way.
6. **Continuation** — price leaves in the reclaim direction, trapped stops feeding it.

### What it teaches, and where it sits

Concept order runs `… BOS → order block → sweep/liquidity → confirmation entry`. The sweep is a **late spiral**. The *felt* version arrives early as **Guardian Two, the False-Breakout Eel** (end of World 1), preceded by the mandatory **≥ 3 patience/confirmation practice reps**. Critically, the Eel exam tests **only body-vs-wick — candle anatomy, the first thing taught** — framed as "stand on the body, not the wick." It must **not** invoke pools, BOS, order blocks, or confirmation-as-technique; those are the later mechanistic spiral. And per the platforming-wall ban, the Eel is a *knowledge/patience* exam, never a movement gauntlet. This is the Pattern Library's `marketStructure: sweep`, `patternFamily: liquidity`, `primaryConcept: sweep`, `supportingConcepts: [confirmation-entry]`.

### The terrain translation — the trap that speaks the language of reward

Here is the design's cruelty and its fairness at once, and it runs in **both directions**:

- **Sweep of highs → the trap ledge.** A tall up-wick is normally a **spin-pole** (reward + traversal aid, `#7fd6ff`, shell on the tip). The sweep **hijacks that grammar**: a bright new-high ledge rises with a long wick above it — same silhouette as a treat — and the untrained player climbs for it. Then the reclaim candle drops the body back below the level and the ledge collapses.
- **Sweep of lows → the false floor.** A tempting drop opens below the road; chasing it "down through the breakdown" strands you as the reclaim rises back up and leaves you in the pit.

Fairness lives entirely in the reachability envelope:

- **The lure is real, landable, and optional.** The trap surface sits with its crest **180–300px** above the road — squarely inside single-boost range (one-boost apex ≈ 335px) so a boosted jump actually *deposits* Finn on it and the trap can spring — and within the **367px** measured horizontal reach. Placed at the 335px ceiling it would only ever read as an unreachable wall, and the trap would never trigger.
- **The safe line is always legible and traversable.** The trained read takes the low road; the reclaim delivers continuation terrain with **no demanded rise > 501px**, **no gap > 367px**, every step **130–200px** (or ≤ 18px). On the false-floor variant the reclaim rise from the pit floor is clamped **≤ 501px** so even a player who chased down can always climb out.
- **The punishment is bounded.** Chasing costs a short fall (crest → road, kept under the big-fall daze threshold) and lost tempo — a recoverable stumble, never death — mirroring the campaign's "the stop kept it small," no-shame law.

### Making it fair, not cheap

1. **Signposted.** The sweep wick renders in reserved hazard treatment — **`#ff7a45`, 3px, plus the mandatory non-colour cue** — visibly distinct from the blue spin-pole reward (`#7fd6ff`, 2.5px), colour-blind-safe.
2. **Obvious on purpose.** The level is a marked, re-touched line; the bait is meant to be seen.
3. **Taught before tested.** The DAG places the mechanism after BOS/OB; the Eel front-loads only the body-vs-wick feel.
4. **Honest probabilities.** The pattern encodes only *where* the decisive candle sits and *how clearly* it reads — **never the outcome** (delegated to the Trading canon / TES). Genuine breakouts (body closes *and holds*, level flips and is retested) are authored alongside sweeps so the player learns a *read*, not the false law "every poke reverses." Authored variants (single-candle rejection vs multi-candle poke-and-stall; highs vs lows) keep the player reading the *principle*, not memorising the pixels.

### Numeric envelopes

| Element | Envelope | Grounding |
|---|---|---|
| Obvious-level touches | a **pair** of tops within ≤ 18px, bracketed by ≥ 130px steps | equal-highs read without tripping the flat-run law |
| Forbidden step dead-band | every walkable step **≤ 18px OR ≥ 130px** — never (18,130) | Constitution reachability law; road never goes soft |
| Raid wick beyond level | **≥ 28px** | gameplay wick law (0 or ≥ 28); a visible raid, not a hairline |
| Reclaim / decisive body step | **130–200px** (BOS window) | jumpable, decisive, clears the dead band |
| Body-reclaim window | closes back inside within **≤ 1–2 candles** | the signature: wick past, body reclaimed; the close is the arbiter |
| Trap-ledge lure crest | **180–300px** above road, **≤ 367px** horizontal | inside one-boost so the trap can spring; laterally catchable |
| Safe-line / climb-out ceiling | **≤ 367px** gap / **≤ 501px** rise (both directions) | always traversable; a chaser can always climb out |
| Sweep hazard wick | **`#ff7a45`, 3px + non-colour cue** | CVD-safe distinction from the `#7fd6ff` spin-pole |

---

# §3 · Part II — Cross-Cutting Systems

*Four systems that run *across* every anatomy above. The first two are the physics of feel — how the market breathes and how effort is metered. The last two are choreography — how structure is timed to the heart, and where a trade's two decisive lines sit. Where Part I says what a shape **is**, Part II says how any shape **paces, costs, lands, and risks.***

## §3.1 · Volatility Rhythm & Candle Personality — The Breathing of the Market

**What this system owns.** The Visual Market Constitution owns how *one candle is drawn* and legislates the **per-window** rhythm floor (A.6 — no 12-candle window may be flat, a peak every screen). This system owns the layer between the single candle and the whole level: the **macro-envelope of volatility across a level**, and the **behavioural personality of a single candle** — the order-flow *why* under the geometry, the reusable vocabulary lessons cite. It references the Constitution's numbers; it never re-legislates them.

### The volatility breath (the macro-envelope)

Volatility is not noise laid over price; it is the market *respiring*. Real markets cluster volatility (quiet begets quiet, violence begets violence) and cycle between **contraction** (balance — two-sided auction, thin range, resting liquidity piling up at the edges) and **expansion** (imbalance — one side overwhelms, a void fills fast, stops run). The single most important rhythm a discretionary trader internalises is *compression precedes expansion*: the tightest coils precede the biggest breaks. Quiet → violent → quiet. A level that ignores this is lying about how markets move.

On top of A.6's micro-rhythm floor sits a slower **breath** the DNA authors deliberately. One breath = **COIL → RELEASE → DRIFT**, running **8–14 candles**, so a level inhales and exhales **1–3 times, typically** (a *soft* authoring contract, not a hard validator — a short L3 at 18 candles ÷ a 14-candle breath ≈ barely one full breath, so "2–4" would over-constrain it; see §7 Q3). A.6 guarantees the *floor* of activity in every window; the Breath authors the *shape above it* — where the market coils toward the floor and where it detonates toward the ceiling. The **checkable artefact** is the amplitude ladder below, not a breath count.

### The amplitude ladder

The envelope is expressed as three legible registers, each a body-size band (Constitution floors/cap), a walkable step band (A.6 `jumpStepDeltaPx [130,200]`), and a terrain verb:

| Register | Body (px) | Road step Δ | Terrain | Feel |
|---|---|---|---|---|
| **QUIET / Coil** | 18–60 | 130–150 | tight single-tap staircase (apex ~132 clears it) | groove, held breath |
| **NORMAL / Trend** | 60–120 | 150–185 | running staircase | flow |
| **LOUD / Release** | 120–cap `min(0.55·H,420)` | 185–200 walkable + **impulse walls** | boost-gated wall / launch | the detonation |

**Terrain translation — the coil and the wall.** In a coil the ground goes tight and quiet: small, tap-jumpable steps that still micro-vary (A.6 forbids > 3 near-equal, so even a coil breathes). The player relaxes into a groove — and *learns to read the quiet as a wind-up*. Then RELEASE: an **impulse expansion candle** whose rise decisively exceeds the tap envelope becomes a **wall that demands a jetpack boost** — up to **335px on one boost**, reserving the **two-boost 501px** climax for a level peak or the pre-guardian crescendo. **A rise > 501px is impossible and is never authored.** The breakout *is* the launch. A conviction *down* expansion is the mirror: a cliff to shell-tuck into, turning a sell-side liquidity void into gained speed.

**Where the breath meets pedagogy.** Expansion peaks are placed *on the lesson beat*: a momentum lesson lands on a RELEASE (the freight train you feel in your legs); a doji/indecision lesson lands at a COIL apex where the auction is genuinely balanced. Guardians live at **expansion climaxes** — the pre-boss approach is authored as a deliberate CONTRACTION (the room going quiet before it opens), and the Guardian is the exhale. The authored First Loss reads cleanly as an expansion that *failed to continue* — a stretched RELEASE that snaps back — honest order flow, stop-protected, never a coin flip.

### Candle personality — the fight inside one candle

A candle is a completed auction. The **body is the net result of the fight** (open→close displacement) = **conviction**; the **wick is the rejected excursion** — where price reached and got pushed back, where the loser tried. That is the Campaign Bible's founding perception ("the fat middle is the fight, the thin wick is where price tried and lost") stated in order-flow terms.

**The Personality Lexicon (reusable — lessons cite these names):**

| Personality | Order-flow meaning | Archetype | Terrain verb | Register |
|---|---|---|---|---|
| **Conviction** (the Decider) | one side ran it open→close, no pushback (marubozu) | G1 / R1 | tall wall or cliff — demands a decision | LOUD |
| **Drive** (the Freight Train) | aggression takes control after drift | M1 | the boost-wall launch | LOUD |
| **Step** (the Climber) | orderly continuation, one confident stair | T1 | the everyday road step | NORMAL |
| **Rest / Hesitation** (the Breather) | balanced two-way trade, no commitment | P1 / Dr | gentle walk / single tap (≤ 3 in a row) | QUIET |
| **Indecision** (the Standoff) | open ≈ close, probed both extremes, a tie | D1 | thin knife-edge ledge; long up-wick = spin-pole | QUIET apex |
| **Exhaustion** (the Fading Push) | trend-direction body *shrinking* vs the impulse, wick against it | X1 | a descending staircase of shrinking steps | falling energy |
| **Rejection** (the Slap-back) | price swept a level and was thrown back | W1 / W2 / H1 | the wick becomes a spin-pole or a defended floor | punctuation |

**The wick-as-spin-pole unification.** The movement layer defines a spin-pole as an up-wick **≥ 26px, ~every 10th candle, with a shell on the tip** (a reward *and* a twirl-fling). Diegetically, that up-wick **is the rejected excursion** — the failed push made climbable. So Rejection and Indecision candles are the natural home of spin-poles: reading "price tried and got slapped back" is rewarded by grabbing the very pole that failure left behind and flinging up-and-forward. This is the ChartQuest signature — the loser's tried-and-lost becomes the player's traversal gift.

### The variety law, behaviourally

A.6 already forbids the metronome by number (`stepDeltaCVmin 0.35` per 12, `maxConsecutiveSameMagnitudeBucket 2`, `peakStepMinPx 185` per 12). This system supplies the *why*: **variety is fidelity, not decoration.** A metronomic staircase of identical +130px steps is not merely boring to a ten-year-old who autopilots it — it is a *falsehood* about markets, which never move in equal beats. **The cast of a screen:** a healthy 12-candle window reads like a scene with a cast, not a chorus of clones — a spine of **Step** candles, **≥ 1 Conviction/Drive peak** (the ≥ 185px moment worth reacting to), **≤ 3** consecutive **Rest/Hesitation** before a decisive move, and **specials — Indecision, Exhaustion, Rejection — placed for meaning, never as noise** (Drift context must never masquerade as a doji). Personality deployed with variety is what makes the market feel alive under Finn's feet — and what makes the reading skill transfer to a real chart.

## §3.2 · The Platforming Economy — Effort Is the Tape

### The trader's-eye premise

A real market does not move at a constant rate. It coils, then it *spends* — an impulse leg burns through resting orders, exhausts, and hands back a fraction on the pullback before the next expenditure. That energy budget is legible in the tape: long quiet bases, sharp releases, shallow retraces that hold. **The Platforming Economy renders that budget as the player's own stamina.** Where a trader spends attention and a market spends liquidity, Finn spends altitude and boost fuel. Calm terrain is a market at rest *and* a player catching breath; a boosted impulse is a breakout *and* a demand on the hands in the same instant. The tuning goal: the effort of crossing the chart tracks the effort the market itself is spending — so a player who learns the rhythm in their thumbs is, unknowingly, learning the rhythm of order flow.

This system owns the **composition** of A.6's atomic rhythm rules into swing-scale narrative, and the **assignment** of each traversal verb (hop, boost, roll, spin-fling) to a market event. It adds the one rule A.6 lacks: A.6 legislates a *ceiling* on calm (NO CHART MAY BE BORING); the Economy adds a *floor* on calm (NO SCREEN MAY EXHAUST) — a mandated rest beat after every demand.

### The hop/boost fulcrum — 132 vs 335

Everything turns on one measured fact: a plain tap-jump apexes at **~132px** (standing), one jetpack boost at **335px**. A.6 forbids any step in the (18,130) dead-band, so terrain is only ever *flat* (≤ 18px, walked across) or a *real step* (≥ 130px, jumped). That splits the 130–200 step band:

- **Plain-hop zone — 130–150px.** The trend staircase and the pullback re-entry. Even the smallest legal step is a genuine jump, never a walked-up kerb. ~2/3 of all jumps.
- **Boost-demand zone — 150–200px.** The impulse, the wall, the Break of Structure. Above ~150px a *moving* jump's apex (horizontal travel spends part of the 132) can no longer clear it — the hands **must** fire the jetpack. The peak-per-12 (≥ 185px) lives here. ~1/3 of all jumps.
- **Double-boost (501px) — never terrain.** Reserved for spectacle: the breakout ramp, the guardian-portal launch. Ordinary steps cap at 200 (one boost clears any with margin), so two boosts are always a *gift*, never a *tax*. A required rise > 501px is never authored — full stop.

*(The exact px where tap becomes boost-mandatory — the raw 132 standing apex vs the ~150 effective apex under horizontal velocity + game-feel assist — is an open founder/movement-owner call; see §7. The spine adopts ~150px as the authored fulcrum with 132px as the physics floor.)*

### Swing size — the leg-and-pullback unit

A **swing** is a directional leg, in market and terrain identically.

- **Impulse leg: 3–5 candles, net +250 to +400px, one boost at the break.** Built of ~2 jumpable steps (130–200) over a calm base. It must not monotonically eat the ~620px stage — which is precisely why the market retraces.
- **Pullback: 2–3 candles, giving back 38–50% of the leg (~130–180px, never < 130px).** The dive is clamped to the [130,200] joint law (§2.2) so it always clears the forbidden (18,130) dead-band; a *shown* retrace shallower than 130px is routed to a Type-A framed chart, not the walkable road. The give-back is structurally load-bearing: it **resets Finn's altitude** so the next leg has vertical room. The market's retracement and the platformer's altitude reset are the same event.
- **Swing cycle ≈ 6–8 candles ≈ ~1.5 cycles per on-screen 12.** Vertical span holds ≥ 300px/20 (A.6) by *using* the leg-and-give-back, never by drifting.

The pullback is not filler between impulses — without it Finn runs off the top of the stage. This is the cleanest convergence in the design: **the reason a real trend must pull back is the reason the terrain must, too.**

### Platform height — two quantities, kept distinct

- **Step (surface-to-surface rise): 130–200px, mean ~165px** — the thing Finn climbs; the BOS band.
- **Body (the pillar he stands on): median ≥ 60px** (A.6), typically 60–140px — the *thickness* of the platform, not its elevation. Keeping these separate kills the recurring error of tuning body height to hit a traversal target and flattening the read.

### Boost frequency — once per screen, recharged by the pullback

- **≥ 1 boost-demanding step per 12 candles (once per screen)** — pinned to A.6's peak-per-12. Typically **1 boost per swing (~6–8 candles)**, fired at the impulse/break.
- The **2–3 calm pullback candles are the recharge window.** Couple the boost meter to the calm beat and the economy self-balances: the market rests → the meter refills → the next impulse is affordable. The player never consciously *manages* fuel; the market's own rhythm meters it for them. *(Whether the meter is candle-clock-coupled or wall-clock, and whether boost is shell-fuelled or a free meter, is an open reconciliation — see §7.)*

### Shell-roll & spin-pole — the assisted-traversal line

- **Spin-pole: ~every 10 candles** — an up-wick ≥ 28px (drawn) with a shell on the tip (A.6 `drawnLen_B: 0 or ≥ 28`; the 10-candle net-elevation window). A reward *and* an up-and-forward fling: the market's exhaustion-wick becomes a launch. Post-build-278 shell scarcity concentrates the meaningful shells *here* and on boost apexes, not scattered loose.
- **Shell-roll / tuck: on each down-leg, ~every 6–8 candles** — the fast dive-and-forward-roll that carries Finn *into* the pullback and out the far side with speed. Descents and retraces are its home; it turns "giving back altitude" from a loss into a thrill.

### Breathing room — the rest beat A.6 doesn't mandate

- **After any boost *run* or ≥ 185px peak: ≥ 2 plain-hop (≤ 150px) or flat candles of recovery within the next 3 candles** — the rest comes **after the run, not between the boosts inside it.** A single impulse is a *deliberately* stacked 3-boost run (§2.3) — the emotional climax — so the rest-beat validator must key off the *end of the run*, never demand calm between consecutive impulse steps (which would reject every legal impulse). Bounded above by A.6's flat-run ceiling (≤ 3 candles / 220px) so calm never rots into a trance.
- Net terrain mix per screen ≈ **65% calm : 35% demand** — a jump every 4–6 candles (A.6 cadence), ~1/3 boosts, the rest walkable road.
- Pedagogically this *is* the Campaign Bible's "you do not drown someone you are teaching to swim": every demand is followed by a breath, and the authored First Loss (L2) lands **inside** a guaranteed calm re-entry, never a cold hard jump. Tension → release → tension is impulse → pullback → impulse is demand → breathe → demand. One cadence, three readings.

## §3.3 · Emotional Pacing — Choreographing Structure for the Held Breath

*This system owns how the multi-candle behaviour of Part I is choreographed in **time** to produce a felt arc — the pacing of structure across a level and across the first hour. Single-candle juice defers to the Constitution's Game-Feel Invariants; the felt single trade to the TES.*

### 1 · Markets already breathe — we author the breath, we don't invent it

A real market has an emotional rhythm before it has a chart: **accumulation → coil → expansion → continuation → exhaustion.** Range compresses while size is quietly absorbed; nobody has tipped their hand; the last candle before a break is genuinely a *held breath* because the decision is being made and not yet shown. Then imbalance fires, stops run, and price expands. Tension is compression; release is the break. Our job is not to bolt drama onto a chart — it is to author the market's own rhythm and delete the stretches that would bore or betray a beginner.

### 2 · The breath cycle is the pacing unit — and the boredom law enforces it

One breath = **coil → break → runway → coil.** Each maps to a number already in the ratified spine, which means the anti-boredom scan is secretly an emotional-pacing engine:

- **Coil (the held breath)** = the maximum quiet the rhythm law allows: **≤ 3 near-equal candles / ≤ 220px** (body-top ΔY ≤ 18px). Quiet is *bounded* — dead air is impossible — so every pause is a promise that resolves.
- **Break (the release)** = the mandatory **≥ 130px step** the law forces after a flat run. Tension is legislated and release is compulsory.
- **Runway (the exhale/glide)** = a few median-60px steps of comfortable terrain.

The **jump cadence of 4–6 candles is the breath rate.** Per 12-candle screen the player takes 2–3 breaths, with **exactly one accent** — the ≥ 185px peak step the variety law requires. Nothing sits still; nothing repeats into a trance (CV ≥ 0.35, no metronome).

### 3 · Tension and release, in pixels and jets

Release magnitude *is* terrain grammar, read against the movement constants:

- A **130px** step ≈ tap-jump apex **132px** — an ordinary breath, cleared with a hop, low tension.
- A **150–200px** step sits above the tap ceiling and demands **one jetpack boost** (apex 335px) — the impulse "wall you boost over," the felt big move.
- The **≥ 185px accent** clears under one boost with ~135px of headroom — it reads as *mastery, not panic.*
- Ceiling logic: **200px (max step) < 335px (one boost) < 501px (two-boost) < IMPOSSIBLE.** Every authored break resolves in a single jetpack tap; the game never asks for desperation. A **pullback** is the downside breath — a dip you shell-tuck into and gain speed.

### 4 · The setup that develops ahead of the player

Camera anchor **0.52** with ~12 candles on screen seats Finn at roughly candle 6, leaving **~5–6 candles (~1–1.5 breaths) of forward terrain always visible** — that is where the coil forms before he arrives, so the player *reads it developing.* As Finn reaches full run the anchor drifts **0.52 → 0.62**: the forward window shrinks, so **tension rises with speed by construction.** Author every decisive candle (the break, the decision candle) to enter the forward window about **one breath** before Finn steps on it, so the read always precedes the commitment.

### 5 · The held breath before a trade

The lone **unfinished live-edge candle** (Phase-4 living market) at the forward edge is the market deciding. Terrain-side, the held breath lives on a **flat perch or a spin-pole tip** (up-wick ≥ 26px, ~every 10th candle) where Finn can pause while the forward candle is still unformed and the heartbeat pulse begins. This is the one place the flat-run allowance is spent *deliberately* — the exhale before commitment, not filler.

### 6 · The authored first loss — the single dip in the whole curve

Structure is shaped for a **textbook read** (trend + pullback + confirming close) that then reverses to the stop. Because the read was clean, the loss cannot teach shame; because the stop is a **floor placed just below entry**, the drop is small and bounded — a shallow shell-tuck dive, never a fall toward the 501px void. The ground resumes climbing on the very next candle (the recovery win). Macro-scale, this is the **only** dip in the first-hour curve: everything before it banks confidence, everything after proves resilience. *A straight line that only climbs makes a player who feels clever; a line that dips once, honestly, and is caught, makes a player who trusts you.*

### 7 · Where breathing room lives

- **Micro:** the ≤ 3 near-equal / ≤ 220px allowance — the exhale, capped at ~0.6× jump reach.
- **Meso:** the median-60 runway between accents — the glide.
- **Macro:** authored perches, held-breath live-edge candles, and the calm resolve after a Guardian falls.
- **Amplitude:** the gap between median 60px and the 185px accent *is* the breath's depth; CV ≥ 0.35 guarantees the breathing is irregular and alive — a metronomic staircase reads as *no* breathing at all.

## §3.4 · Stop & Target Placement Philosophy — The Two Lines of Every Trade

Every trade answers two questions *before* it is taken: **"Where am I wrong?"** (the stop) and **"Where am I aiming?"** (the target). This system owns **where those two levels sit** and how each becomes terrain Finn physically traverses. It does **not** own whether price has reached them — that is the single wick-inclusive touch-truth, `CQ.priceTouched` (long-SL `low ≤ level`, long-TP `high ≥ level`, short mirrored). Placement decides the *geometry*; `priceTouched` decides the *hit*. The two never overlap.

Because candles are terrain, both levels are also physical: **the stop is a recovery ledge below Finn; the target is a reward summit ahead-and-above; their ratio is a slope the player can see.** The game cannot lie about reward-to-risk, because the reward-to-risk *is* the terrain.

### 1 · Stop placement — "the line where your idea was wrong"

**Trader's-eye / order flow.** A stop belongs **beyond the structure whose break invalidates the trade** — the origin swing low, the demand order block, the low that, if lost, kills the long. Resting *under* every obvious swing low is a pool of stop orders; the market reaches down, **sweeps** that liquidity, then reverses. So the professional stop goes **past the sweep**, with **breathing room** beyond the wick so ordinary noise cannot clip it — but never so far that the reward-to-risk collapses.

**Touch-truth binding.** Since `CQ.priceTouched` fires SL on `low ≤ level`, the stop is tagged by the **deepest wick, not the close.** Placement is therefore measured to the *wick extreme* of the invalidation candle (and of any authored sweep), never to its body.

**Pedagogy.** You decide where you're wrong *before* you enter. You hide your line *past the trap* so a fake dip can't shake you out. You give it room to breathe. And you **never move it** — *"a stop you move isn't a stop, it's a bigger loss waiting."*

**Terrain.** The stop is the safety ledge Finn placed **one drop below entry** — the seatbelt built three beats before the crash (Campaign Bible). A **sweep is a trap ledge / spike-pit** just under the swing low: a stop placed *at* the swing low gets knocked off by the spike; a stop placed *past* the sweep lets the spike pass under Finn's feet while he stands on solid ground beyond it. A loss is thus a **short, survivable drop of ~one step-delta (≈ 130px)** — never a bottomless pit. Moving the stop = dragging your own ledge deeper into the pit; the L2 stop lesson **locks it** so the promise holds.

### 2 · Target placement — "where you're aiming, worth more than the risk"

**Trader's-eye / order flow.** Targets sit at the **next opposing liquidity or structure** — the prior swing high, an opposing order block, the range boundary — where resting orders make price *react*. Place the target **into** the level, not through it: because TP fires on `high ≥ level`, a single **wick touch banks the win** *before* price can turn off the liquidity. Aiming through the level gives the reversal a chance to steal the trade back.

**Honest R:R.** Reward ÷ risk ≥ **1** (introduced L2, right after the First Loss taught the stop) and ≥ **2** as the taught ideal. Never fake the ratio by squeezing the stop *inside* structure or stretching the target *past* support. If the structural target won't clear the minimum, it is a **no-trade** — refusing it is itself a lesson in discipline (Guardian 1's whole curriculum).

**Terrain.** The target is the reward summit ahead-and-above where the shells rest; Finn climbs the trend staircase and a wick-tag **breaks the shells loose to fly home** (Trade Emotion Pass, build 276). R:R renders as a **visible slope**: a 2:1 trade is a climb literally *twice as tall* as the drop to the stop. A ten-year-old reads reward-to-risk with their eyes.

### 3 · Reachability & generation law

- **Risk baseline:** entry → stop ≈ **one step-delta (~130px)** — the shallowest drop that still reads as a real fall yet stays "tiny." Breathing room below the invalidation low ≥ the local wick / sweep depth (~one body, **18–60px**).
- **Target legibility scales off risk:** 1:1 = **+130px**, 2:1 = **+260px** (inside one-boost apex 335px), 3:1 = **+390px** (inside two-boost 501px).
- **Hard ceiling:** the entry → target climb is composed of **A.6-legal steps ≤ 200px at cadence 4–6**, summit within the **620px stage**; any impulse "wall" to the target may need a boost but **never exceeds the one/two-boost apex (335 / 501px)**. If R × risk would exceed the reachable envelope, **cap R at the reachable target or scale the whole trade down — never inflate the ratio past the terrain** (the build-284 impossible-jump sin).
- **Direction:** a long is an **ascending** staircase (target above, stop a ledge below); a short — taught later — is the **mirror**: a descending staircase reached by shell-tuck dive, target below, stop a ceiling above.

**Lane discipline.** The Constitution owns the wick/sweep *pixels* and A.6 rhythm; the TES owns the *felt* stop-out and First Loss; the Pattern Library *names* sweep/OB/BOS; `CQ.priceTouched` owns the touch. This system owns only **where the two levels go, and how they become ground Finn walks.**

---

# §4 · The DNA Quick-Reference Spine

*The generatable backbone: every load-bearing number in this document, deduped across sections and grouped by concern. Where two sections gave different numbers for the same quantity, the reconciliation is footnoted. Reachability and rhythm numbers marked (A.6) / (movement) are **cited, not owned** — they live in the Constitution and the movement layer; this DNA owns only the structure, pacing, and stop/target rows.*

### Group A — Reachability & terrain *(movement constants + A.6; cited)*

| Quantity | Value | Note |
|---|---|---|
| Base tap-jump apex (standing) | **~132px** | clears ≤ ~150px authored steps with game-feel assist ¹ |
| One-boost apex | **335px** | clears any ≤ 200px step with margin |
| Two-boost apex | **501px** | absolute ceiling; a required rise > 501px is **impossible — never authored** |
| Hop/boost fulcrum (authored) | **~150px** ¹ | 130–150 plain-hop (~⅔ of jumps); 150–200 boost-demand (~⅓) |
| Horizontal reach (max gap) | **≤ 367px** | slack in a gap-0 road; binds only on authored gaps / launches |
| Inter-candle gap (Type B road) | **0** (`bw=c.w+1`) | candles touch; adjacent tops ~24–56px apart |
| Forbidden step dead-band | **(18,130)px** | every walkable step ≤ 18px (flat) or ≥ 130px (jumped) |
| Stage / vertical world | **[80,700] = 620px usable** | summit + stop must both fit one screen |
| Camera anchor (horizontal) | **0.52 → 0.62** at full run | forward preview ~5–6 candles / ~1–1.5 breaths |
| **Camera model (vertical)** | **bounded, lazy dead-zone follow** — Finn rises within a ~40px vertical dead-zone; the camera drifts up only when he leaves it, and **every pullback / consolidation recentres it** | NOT a both-axes centre-lock (that drifts the summit out of [80,700] or pins Finn to the ceiling). This is *why* a persistent trend must pull back. Reconciles §2.1 vs §2.3/§3.2 |
| **Min standable-top width** | a landing candle's body width **≥ Finn's effective collide span (~24px, incl. the build-274 `collideInset`), phone included** | the unowned reachability axis: a tall *isolated* boost-wall / sweep-crest / pivot-high must be wide enough to stand on. Bites only at isolated candles (gap-0 runs are contiguous ground). Rides the shipped collision-inset fix |
| Gravity | **2300 px/s²** | catches every dive; falls are free |

### Group B — Rhythm & variety *(A.6 spine; cited, enforced)*

| Quantity | Value | Spine key |
|---|---|---|
| Jump cadence | every **4–6 candles** | `jumpCadenceCandles [4,6]` |
| Jump step Δ (body-top) | **130–200px** (mean ~165) | `jumpStepDeltaPx [130,200]` |
| Step-delta variety | **CV ≥ 0.35 per 12** | `stepDeltaCVminPer12 0.35` |
| Same-magnitude bucket | **≤ 2 consecutive** | `maxConsecutiveSameMagnitudeBucket 2` |
| Peak step (accent) | **≥ 185px per 12** | `peakStepMinPxPer12 185` |
| Max flat run | **≤ 3 candles / ≤ 220px** | `maxFlatRunCandles 3`, `maxFlatRunPx 220` |
| Near-equal band | **≤ 18px** Δ, ≤ 3 consecutive | `nearEqualBodyTopDeltaPx 18` |
| Net elevation (signed) | **≥ 130px per 10**; span **≥ 300px/20, ≥ 200px/12** | verticality cadence |
| Width jitter | **±4–8%** | `widthJitterRequiredPct [4,8]` |
| Spin-pole up-wick | **≥ 26px behavioural / ≥ 28px drawn**, ~every 10th | `drawnLen_B "0 or ≥28"` ² |
| Volatility Breath | **COIL→RELEASE→DRIFT, 8–14 candles**, 2–4 / level | authoring contract (soft) |

### Group C — Structure proportions *(this DNA owns)*

| Quantity | Value | Note |
|---|---|---|
| Full impulse (LOUD release) | **3 driving boost-steps, net ~485–540px** (a 4th+ candle is a 130–150px tapering tap-step, not driving) | min 3×150=450; ≤ 540 leaves ≥ 80px stage headroom; no 300px floor ³ |
| Typical directional swing | **3–5 candles, net +250–400px** | ~2 real jumps over a calm base ³ |
| Driving body = step (gap 0) | **150–200px**; ≥ 1 signature ≥ 185px | body ≈ step under gap 0 |
| Body/range conviction | **≥ 0.70**; close-side wick ≤ 0.3× body | the "this is real" tell |
| Range expansion (ATR-pop) | true range **≥ 1.5× trailing median range** | vs range, not body |
| Rejection (false-impulse) | body/range **< 0.5** AND close-side wick **≥ ~1× body** | the confidence-check contrast |
| Pullback depth | **23–62%** of leg (discount 50–62%; typical 38–50%; 62% = watch-line) | invalidation = close below origin HL (**≈ 100% of the leg**, never 62–66%) |
| Impulse precondition (joint law) | **impulseRise ≥ ~210px**; dive ≈ retrace% × impulseRise, clamped [130,200] | ties % to px |
| Pullback length | **2–5 candles** (typical 2–3), M ≤ N | Pullback section owns the envelope ⁴ |
| Counter-body conviction | **~18–40px** (fraction of ~100–180px impulse bodies), shrinking/overlapping | rest ≠ reversal |
| Higher-low daylight | dip bottom **≥ 0.38 × impulseRise** above origin (≥ ~80px) | a consequence of the ≤ 62% cap |
| Coil (breakout) | **5–8 candles, −15–20%/swing**, flat equal-high ceiling (≤ 18px, non-adjacent) over higher lows | ascending triangle |
| In-coil up-step | **≤ 150px**; 150–200px left empty | makes the break unambiguous |
| Break rise | **200–335px** above ceiling (≈ 1.3–2× box); power **≤ 470px** (< 501) | one-boost commit |
| Break body | **≥ 60px, ≥ 1.5× coil median**, larger than any coil candle, never doji | body = the only "volume" |
| Retest drop | **≈ break rise − (0–40px)** (lands in the ≤ 40px deadzone); authored **only if break rise ≤ ~300px**; power breaks = break-and-go | a fixed 130–260 can't reach a tall break's deadzone |
| Reversal approach | **3–5 steps, ΔY 130–200px, CV ≥ 0.35** | HH/HL climb |
| Pivot exhaustion body | **≤ 0.6× trend median** (≥ floor) | fading conviction |
| Sweep wick | **≥ 28px drawn**, pokes past extreme, closes back inside | the liquidity grab |
| CHoCH break body | **≥ trend median** (focal ≥ 1.3× neighbour Type A), closes below protected HL | turns the trend (≠ BOS) |
| Lower-high confirmation | LH **clearly < pivot high**, separation ≥ 1.5× / ~1 body | THE discriminator |
| Post-pivot max ground height | **monotonically ≤ pivot height** | terrain proof of reversal |
| Sweep obvious level | a **pair** of tops within ≤ 18px, bracketed by ≥ 130px steps | equal-highs bait |
| Sweep reclaim body | **130–200px**; body reclaim within ≤ 1–2 candles | the real break, the other way |
| Sweep trap-ledge crest | **180–300px** above road, ≤ 367px horizontal | inside one-boost so the trap springs |
| Hazard cue | sweep **`#ff7a45` 3px + non-colour**; spin-pole **`#7fd6ff` 2.5px** | CVD-safe |

### Group D — Pacing & economy *(this DNA owns)*

| Quantity | Value | Note |
|---|---|---|
| Amplitude ladder — body | QUIET **18–60** / NORMAL **60–120** / LOUD **120–cap** `min(0.55·H,420)` | over the 18/16px floor |
| Amplitude ladder — road step | QUIET **130–150** / NORMAL **150–185** / LOUD **185–200** + walls | maps onto `jumpStepDeltaPx` |
| Median visible body | **≥ 60px** (typ. 60–140) | the pillar, not the climb |
| Calm : demand mix | **~65 : 35** per screen | jump every 4–6, ~⅓ boosts |
| Breathing-room floor | **≥ 2 plain-hop/flat candles** after any boost or ≥ 185px peak | the rest beat A.6 lacks |
| Boost-demand frequency | **≥ 1 per 12** (once/screen); typ. 1 per 6–8-candle swing | pinned to peak-per-12 |
| Shell-roll / tuck | on each down-leg, **~every 6–8 candles** | descents/pullbacks |
| Macro dips in the first hour | **exactly 1** (the First Loss) | everything else climbs |
| Breath rate | **4–6 candles / cycle** (2–3 per screen) | = jump cadence |

### Group E — Stops & targets *(this DNA owns)*

| Quantity | Value | Note |
|---|---|---|
| Risk baseline (entry → stop) | **≈ 130px** (one step-delta) | small but a real fall |
| Stop breathing room below invalidation low | **18–60px** (~1 body), ≥ local wick/sweep depth | clears the sweep, keeps R:R |
| Taught R:R | **≥ 1:1** (min, introduced L2), **≥ 2:1** ideal | never fake the ratio |
| Target rise | 1:1 **+130px** / 2:1 **+260px** (≤ 335) / 3:1 **+390px** (≤ 501) | summit reachable |
| Absolute target-climb ceiling | **≤ 501px** single move (prefer ≤ 335); steps ≤ 200, cadence 4–6 | fits the 620px stage |
| Touch-truth | **`CQ.priceTouched`** — wick-inclusive; long-SL `low ≤ lvl`, long-TP `high ≥ lvl`, short mirrored | place levels to the *wick extreme* |

**Footnotes / reconciliations.**

¹ **Hop/boost fulcrum.** The raw *standing* tap-jump apex is **132px** (movement constant), so §2.1, §2.4 and §3.3 frame "≤ ~130px = tap, above = boost." §3.2 resolves the practical *authored* divide to **~150px**, because the ratified Game-Feel Invariants (coyote ≥ 90ms, jump-buffer ≥ 120ms, landing squash) and landing on a *rising* platform lift the effective clearance above the standing apex, while horizontal travel on a moving jump spends part of it. **Adopted here:** ~150px is the authored fulcrum; 132px is the physics floor. The exact px is an open movement-owner call (§7; A.6 flags `reMeasureOnMovementConstantChange`), and nothing breaks either way because both sit inside the 130–200 band a boost always clears.

² **Spin-pole wick.** Sections quote both **≥ 26px** and **≥ 28px**. Reconciled: **≥ 26px is the behavioural eligibility threshold** (movement layer's spin-pole rule); **≥ 28px is the minimum *drawn* length** any non-zero Type-B wick must reach (A.6 `drawnLen_B: "0 or ≥28"`). A spin-pole up-wick is authored ≥ 26px and *rendered* ≥ 28px — the two describe different stages, not a conflict.

³ **Impulse net rise / run length.** §2.3 gives the **full-strength LOUD release: exactly 3 driving boost-steps, ~485–540px** (min 3×150=450; a 4th+ candle is a 130–150px *tapering* tap-step, no longer driving — a 4th driving step would overshoot the 540 stage cap, and decelerating it below 150 would hit the forbidden (18,130) dead-band, so the driving run *arithmetically* caps at 3); §3.2 gives the **typical directional swing: 3–5 candles, +250–400px** built from ~2 real jumps over a calmer base (not all-driving). Different scope, not a contradiction; both fit the 620px stage (≤ 540 leaves ≥ 80px headroom). The old "+300–540" floor was unreachable and is removed.

⁴ **Pullback length.** §2.1 and §3.2 quote the typical **2–3 candles**; the owning §2.2 states the full envelope **2–5 candles (M ≤ N)**. The envelope governs; 2–3 is the common case.

---

# §5 · The Generation Contract

*How a future `window.CQ` market generator consumes this DNA to author a level. Conceptual, not code — the behavioural hooks named below (`CQ.priceTouched`, `CQ.floorBodyPrice`, `CQ.width`) live in the [Phase 2A engine](CHARTQUEST_PHASE2A_MARKET_ENGINE_BUILD287_2026-07-23.md) and are called, never redefined, here.*

A level is generated **top-down — structure first, candles derived** (Directive 8), then validated bottom-up against the machine spine. The pipeline:

1. **Pick the regime from lesson intent.** The concept being taught selects the anatomy: momentum → an impulse (§2.3); "the dip that holds" → a trend + pullback (§2.1–2.2); confirmation → a breakout with an authored fake (§2.5–2.6); intention-reading → a reversal (§2.4). **Teach-gate first:** never select a regime whose *read* is not yet taught with ≥ 3 reps (Directive 5). The regime also sets the Volatility Breath register (§3.1) — a momentum lesson lands on a RELEASE, a doji lesson at a COIL apex.

2. **Lay the trend spine.** Author the leg's *total* displacement from the order-flow story (§2.1), signed for direction, honouring net-elevation ≥ 130px/10. This is the skeleton every other structure hangs off.

3. **Hang the sub-structures.** Distribute the spine into impulse legs and pullbacks (§2.2–2.3) — each impulse decomposed into ≤ 200px steps that satisfy CV ≥ 0.35 and place the ≥ 185px accent; each pullback obeying the joint law `dive ≈ retrace% × impulseRise` clamped to [130,200] with `impulseRise ≥ ~210px`. Place one Volatility Breath (COIL→RELEASE→DRIFT) per 8–14 candles; add coils/breakouts where a break is taught.

4. **Place the authored setup and its two lines.** Seat the trade's entry, stop, and target per §3.4 — stop ≈ 130px below entry measured to the *wick extreme*, target into (not through) the opposing level at ≥ 1:1 (≥ 2:1 ideal), the whole climb reachable. If this is the L2 First Loss, author it as a clean trend + pullback + confirming close that reverses to the floored stop — a stretched RELEASE that snaps back (§3.3.6), the single dip in the curve.

5. **Translate to terrain honouring reachability.** Realise every leg as candle-top steps at gap 0, no (18,130) dead-band, spin-poles (≥ 28px drawn) at leg tops, shell-tucks on descents, a breathing-room beat (≥ 2 calm candles) after every boost or ≥ 185px peak. Widths come from **`CQ.width(slot, type, isPhone)`** (with the caller-applied ±4–8% jitter); body floors from **`CQ.floorBodyPrice`** so no body drops below 18/16px or a doji leaves its 2–4 band.

6. **Validate against A.6 + this spine's envelopes.** Run the machine spine (flat-run, dead-band, CV, peak, verticality, vertical-span) and the §4 envelopes (structure proportions, pacing floors, R:R reachability). The trade's touch-truth — did price hit the stop or target — is decided by **`CQ.priceTouched`** (wick-inclusive), never by placement logic; a resolved trade's replay is filmed by `CQ.normalizeReplay`. Any required rise > 501px, any step in (18,130), any metronome run, any un-taught read → **fail**.

7. **Regenerate off-screen on fail.** A window that fails is replaced **before it is entered** (`runtime.regenOffScreenOnly`); a window already under Finn is never re-geometried, or is match-cut eased. The player never sees terrain mutate beneath them.

The contract's north star: a level is not "correct" when it passes the numeric floors — it is correct when it passes them *and* reads, one screen at a time, like a market breathing, choreographed so the beginner meets each truth exactly when they are ready to be surprised by it.

---

# §6 · Relationship to the Canon

This DNA is one pillar of a governed stack. Each layer owns exactly one thing and defers up when in doubt.

| Layer | Owns | Document |
|---|---|---|
| **Campaign Bible** | the **EMOTION** — the Governing Image, the emotional curve, the Ten Memories | `CHARTQUEST_CAMPAIGN_BIBLE.md` |
| **This DNA** | multi-candle **MARKET BEHAVIOUR** + terrain translation + pedagogy-of-structure | *(this document)* |
| **Visual Market Constitution** | single-candle **VISUALS** (bodies, wick ratios, doji band) + the A.6 rhythm spine | `CHARTQUEST_VISUAL_MARKET_CONSTITUTION.md` |
| **Trading Experience System** | the **FELT single trade** (anticipation, scare, agency, the First-Loss feel) | `CHARTQUEST_TRADING_EXPERIENCE_SYSTEM_v1.1.md` |
| **Pattern Library** | **NAMED** multi-candle patterns (engulfing, fakeout, order block, breakout-bos) | `docs/pattern-library/` |
| **`window.CQ` engine** | the **CODE owner** — `priceTouched`, `floorBodyPrice`, `width`, the palette | `CHARTQUEST_PHASE2A_MARKET_ENGINE_BUILD287_2026-07-23.md` |

**The seams that matter most:**

- **"Break of structure" is a child-simple umbrella over two distinct terrain heights** (like §2.4's CHoCH-vs-BOS distinction the in-game word hides): a routine **with-trend continuation / sweep-reclaim BOS is 130–200px** (a hop-to-one-boost step, §2.2/§2.6), while a **breakout *launch* out of a coil is a taller 200–335px boost-commit** (§2.5) — bigger because leaving a range is a bigger event than extending a trend. Both are "a break," neither is wrong; the height follows the structure. The **Constitution** says how the single break candle is *drawn*; the **Pattern Library** names the shapes (`breakout-bos`, `sweep`); the **TES** owns how *taking* it feels. Four owners, no overlap.
- This DNA owns *where* a stop and target sit and *how tall the climb is*; **`CQ.priceTouched`** owns *whether price got there*. Placement is geometry; touch is truth.
- This DNA specifies the First Loss's *envelope shape* (a failed expansion that snaps back to a floored stop); the **Pattern Library** owns the *named* pattern if one is used; the **TES** owns the *felt* stop-out. (The exact seam is an open call — §7.)

**In doubt, defer up to the Campaign Bible.** Every number here exists to serve one of the Ten Memories. If an envelope ever wins a validator but risks a Memory, the envelope is wrong.

---

# §7 · Open Questions & Founder Calls

*The genuine unresolved decisions surfaced across the drafting, deduped to the sharp ones. Each is a real fork, not a nicety; most want a founder or a lane-owner (movement / TES / Pattern Library) to choose.*

> **Resolved by the v1.0.1 red-team (no longer open):** **Q2 fuel** → reset-on-land, tank ≥ one impulse step (the model §2.3 already implied); **Q6 rest-beat** → "≥ 2 calm within 3 candles *after a boost run*" (now in §3.2), so it stops rejecting legal impulses; **Q3 breath count** → softened to 1–3 typical (soft), amplitude ladder is the checkable artefact. **Sharpened (still founder calls):** **Q11** → *commit* to a post-first-hour ramp in loss frequency toward realistic base rates once R:R is owned (so the one-dip onboarding never seeds a false ~95% hit-rate belief); **Q13/Q16** → the ~130px risk is the *render baseline for the small-loss feel*, not a universal stop distance — vary risk distance with structure once R:R is taught; **Q15** → author an explicit *stand-aside / no-trade* beat (Gambler discipline: a setup coached to SKIP) plus a Type-A "range that fails to break" lesson, so "sometimes the answer is nothing" is banked without adding dead walkable terrain. **New (now specified, not open):** the vertical-camera model and the min standable-top-width (both §4 Group A).*

**Physics & fuel**

1. **The hop/boost threshold (movement owner).** Where exactly does terrain stop being tap-clearable and become boost-mandatory — the raw 132px standing apex, or the ~150px effective apex once horizontal velocity and the coyote/buffer/landing-squash assists are counted? Needs a *measured apex-under-horizontal-velocity table* before ~150px is frozen as a validator input (A.6 already flags `reMeasureOnMovementConstantChange`). Consider widening the tap-apex-to-floor margin for the beginner trend levels so ordinary steps clear with visible headroom.

2. **The boost fuel model (engine + founder).** Two coupled questions that pull opposite ways: (a) is the boost meter **candle-clock-coupled** (refills over the 2–3 calm pullback candles, so the market's own rhythm meters the fuel) or a **wall-clock timer**? (b) Is boost **shell-fuelled** (spend collected shells — wiring the build-278 scarcity economy directly to traversal) or a **free regenerating meter** (impulse un-taxed)? These must be reconciled before the shell line is authored; the candle-coupled + free-meter pairing is the elegant proposal but needs a pause-safe implementation.

**Envelope authority**

3. **Volatility Breath — validator or guideline?** A hard "2–4 breaths per level" rule over-constrains short L3 levels (18 candles ≈ barely two 8–14 breaths). Recommendation: keep it a *soft authoring contract* with the amplitude ladder as the checkable artefact — but confirm.

4. **The two-boost (501px) budget.** Does the 501px climax belong *only* at Guardian approaches, or may a mid-level RELEASE use it? Proposal: a per-level budget of *at most one 336–501px wall, at the climax.* And a linked ownership call — is the 501px launch **bespoke per Guardian** or exposed as a reusable **"breakout ramp" primitive** any lesson can drop in (which decides whether this DNA or the Pattern Library owns the launch object)?

5. **Special-candle frequency cap.** Should doji / exhaustion / rejection candles be numerically capped (e.g. ≤ 2 non-Step specials per 12) to stop a screen reading as noise, or left to lesson intent? A soft cap may be worth ratifying.

6. **The post-demand rest beat as a hard rule.** Should "≥ 2 sub-150px or flat steps within 3 candles after any ≥ 185px peak" become a machine validator (closing the "exhausting screen" gap by measurement, consistent with A.6's philosophy) or stay an authoring guideline? It adds a new check to own.

**Choreography & seams**

7. **The forward-preview floor.** Does the preview window need an explicit minimum (e.g. ≥ 4 forward candles) so the held-breath / decision candle is guaranteed visible ≥ 1 breath before Finn arrives, *even at full run* when the anchor has drifted to 0.62?

8. **The held-breath perch.** Should a perch be a **required** structural element at every trade decision? If so, how does it reconcile with the ~every-10th-candle spin-pole cadence — co-locate them, or allow a flat perch to substitute?

9. **The heartbeat-pulse (EP-4) trigger.** At what loss-proximity (px above the stop) does the pulse begin — and does *this DNA* own that as a structural distance, or does it belong to the **TES** as felt-trade juice?

10. **The First-Loss seam.** Authoring the loss as a "failed expansion that snaps back" edges into fakeout/sweep territory owned by the Pattern Library. Explicit seam wanted: does this DNA specify the *envelope shape* (expand-then-revert) while the Pattern Library owns the *named pattern*, and who owns the stop-placement geometry?

11. **Pacing dip vs. difficulty dip.** The "exactly one authored First Loss in the first hour" rule vs. legitimate challenge at Guardians 2/3 — can a Guardian introduce genuine difficulty without violating the one-dip law, and how is that distinguished at generation time?

**Stops, targets & mobile**

12. **Sweep-aware stop tiering.** Sweep/liquidity is a late concept (after BOS/OB) but the stop is taught at L2. Confirm the two-stage rule: early stop = "below the swing/OB + breathing room"; the "past the sweep" refinement only activates once liquidity is taught — so L1–3 generation never places a stop that assumes an un-taught sweep.

13. **Cap R:R, or scale the trade?** Should the reachability envelope formally *cap* the maximum authored R:R (≈ 3.8:1 on a 130px stop before the climb exceeds 501px), or should risk scale *up* so bigger-R:R climbs stay reachable? This decides whether high-R:R setups shrink the stop or enlarge the whole trade.

14. **Short / descending-target payoff.** When the target is *below* (a shell-tuck dive to a lower liquidity ledge), do the shells still fly "home" upward to the wallet, or does the down-target need its own payoff staging? The TES / Trade Emotion Pass only choreograph the long/up win today.

15. **"No-trade" as an authored beat.** Should a setup that fails the R:R minimum become an *authored* teachable moment (Guardian-1 discipline — a setup the player is coached to SKIP), and how does it render as terrain — a gap Finn is guided *not* to jump into, versus simply never generating the setup?

16. **Mobile scaling.** Do the pacing allowances scale on phone (16px body floor, less vertical room) — is breathing room measured in px or candle-count, and does the 300px/20-candle span budget compress it on phone? Is the 130px risk baseline a fixed pixel value (keeps the felt loss constant) or scaled to median body / stage height (keeps the R:R slope proportional)? Pick one as canon.

---

*End of specification. Version 1.0 · 2026-07-23. This document is permanent; changes are made by ADR against the ratified architecture, never by editing canon in place.*
