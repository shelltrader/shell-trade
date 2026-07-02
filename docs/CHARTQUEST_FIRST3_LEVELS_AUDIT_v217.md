# ChartQuest — First 3 Levels Audit (v217 scope · build 218 working tree)

**Date:** 2026-07-02 · **Status: AUDIT ONLY — findings and plan. No flow/lesson/trade/boss code changed. Awaiting approval (Change Control Rule).**
**Build audited:** the current working tree = build 217 **plus the approved CQ-0024 fix pass (build 218, uncommitted)**. The trade-loop softlock named in the brief was root-caused and fixed as part of CQ-0024; §A.1 documents it fully with its proof, because this audit's job includes proving the dead-end class is closed.
**References:** Design Constitution (2026-07-02) · CHARTQUEST_CONSTITUTION_AUDIT_v214 · PROGRESSION_AUDIT · TRADE_DENSITY_AUDIT (v74) · FIRST_5_MINUTES / FIRST_15_MINUTES_V5 · CHARTQUEST_PAYWALL_AUDIT (v77) · CHARTQUEST_CONVERSION_AUDIT (v76) · lesson-teach-order.md · launch plan (~2026-07-08).

## Method (stated honestly)

- **Code paths traced directly** in chart-quest.html (line references below are against the current working tree).
- **Live simulation** in a headless preview browser at **375×812**, fresh beginner state (`?fresh=1`), frame-driven. The intro flow was driven end-to-end through its real UI: skip-card → GREEN vs RED portal (spawned candle 40, entered candle 50) → LessonChart lesson → Trader View practice → Prediction Bet (both rounds played via `handleIntroBetTap`) → explore gap → MOMENTUM LESSON portal (candle 89) → I'M READY hard stop. Every modal was opened live and measured for reachability at phone size.
- **Limitation:** under manual frame-driving the physics/pacing regime is unreliable (the harness intermittently runs the world at many times real speed — candles 3→50 inside one sim-second was observed). So **flow ORDER, gating, and reachability are measured; wall-clock pacing is modeled** from verified constants (walkSpeed 58 px/s ÷ 26 px candle width at 375 w = **0.45 s/candle**; `perHour = 190`; `MIN_TRADE_CANDLES = 30`; `qrCooldown() = 11–16` candles; explore gap 30; anti-stall caps below). This is the same honest basis TRADE_DENSITY_AUDIT used.

---

# A · SOFT-LOCK / STUCK-STATE SWEEP

## A.1 — The trade-loop dead-end (the bug in the brief) — REPRODUCED, ROOT-CAUSED, **FIXED in the working tree**, verified

**Symptom (live playtest):** "TRADE INCOMING" keeps flashing, no setup ever arms, no portal appears, mastery gate (3 trades) can never be satisfied, no boss. Walk forever.

**Root cause (two coupled variants):**
1. **Intro variant.** `nextCandle()` refuses to start a beginner momentum→pullback→confirmation sequence once `session.candles >= session.perHour − 14` (the CQ-0023 "clean final stretch" rule, [chart-quest.html:3018] region). But during the intro **the hour never ends** — `endHour` is explicitly suppressed while `introFlow.active` ([12103] region: "beating The Gambler ends it") — while `session.candles` keeps counting every new candle. A normal-paced first playthrough burns >176 candles (lesson at 40–52, explore gaps of 30, three ≥30-candle driven trades, 20–28-candle cooldowns, 80-candle re-surface waits), after which the generator is dead **forever**. Meanwhile three re-armers keep promising a trade they can never deliver: `waitThenNextTrade` (genSetupIn=2 + TRADE INCOMING), the 80-candle re-surface, and the ~9 s wall-clock watchdog.
2. **Post-intro variant.** With <3 trades at candle 190, `endHour()` fires, the intermission's `imNext` demands "N more trades" — while the same final-stretch rule forbids any further setups. Requirements permanently unsatisfiable.

**Fix (shipped in build 218, this working tree):** the final-stretch cutoff is inert while `introFlow.active` **or** while `tradeGatePassed()` is false; `endHour()` (both call sites — `onCandleEntered` and the per-frame guard) additionally requires `tradeGatePassed()`, so the intermission can never demand what the world refuses to spawn.

**Proof (live, frame-driven):** (a) with `session.candles` forced past the cutoff mid-intro, a sequence **armed at candle 2221** — banner up, CHART SETUP portal present (impossible on 217); (b) post-intro, gate unmet at a full bar → hour stays open, setups keep arming; (c) gate met at a full bar → `endHour` fires and the Guardian triggers normally (CQ-0023 intact). **The invariant now holds: the game always spawns what the gate requires.** Remaining exposure: none found — every setup-blocking condition (`genSetupIn` cooldown 20–28, `SETUP_WARMUP=8`, `clear` gating on open UI, location-based expiry) is periodic, not terminal.

## A.2 — Full stuck-state enumeration (brand-new player, first 15 minutes, 375×812)

Verified live unless noted. **No P0 trap was found in the current tree.**

| # | State | Escape path | Verdict |
|---|-------|-------------|---------|
| 1 | Intro cinematic | canvas SKIP hitbox → skip-card → CONTINUE (`#iscGo`) — verified live | OK |
| 2 | LessonChart intro lesson overlay | `GOT IT →` (`#cqlGo`) | OK |
| 3 | Trader View practice overlay | correct tap; 2 misses → reveal + auto-close; universal ✕ after 3 s (closing still advances the chain via `finish()`) | OK |
| 4 | Prediction Bet (canvas UI) | two large always-visible buttons; NEXT ROUND hit-box fixed to the real button rect ([16092]) | OK — no timeout, but it's an explicit 2-button choice; not a trap |
| 5 | I'M READY hard stop | `#cqFTGo` — single button, in view | OK |
| 6 | First-trade guide (ENTRY→SL→TP cards) | any tap advances; step>2 auto-resumes ([3954]) | OK |
| 7 | Setup banner / armed setup | fly-in portal, banner ✕ (skip), location-based expiry when Finn passes the candle | OK |
| 8 | "TRADE INCOMING" notice | 14 s auto-hide + blocked-UI retry | OK |
| 9 | Quick read (freezes world) | answer, or **9 s auto-dismiss no-penalty** ([12067]) | OK |
| 10 | Full-screen chart in PREDICT mode | cannot close until answered ([11748]) — but UP/DOWN are always visible; answering is the exit | OK (note: this is the one dismissible screen with no functioning ✕ until answered — accepted deviation, document it) |
| 11 | Trade ticket | `#btnClose` ✕ + CONFIRM both in view at 375×812 (measured) | OK |
| 12 | Lesson cards | OK/✕ after 3 s; cards scroll (`max-height: min(76vh,640px)`); CQ-0024 fixed the stretched-✕ regression | OK |
| 13 | Intermission | 2 buttons, in view (measured); gate can no longer demand the unsatisfiable (A.1) | OK |
| 14 | Boss fight — loss screen | RETRY + **SKIP** both in view | OK for stuck-ness — but see **B.4**: SKIP is a free win |
| 15 | Guardian Trial preamble | flag-gated OFF by default (`TRIALS_ON` requires `?trials=1`) | OK |
| 16 | Auth "save your progress" prompt | "Maybe later — keep playing" | OK (no `.uxX` — P3 consistency) |
| 17 | Capstone | CONTINUE | OK (no `.uxX` — P3) |
| 18 | **Paywall at 375×812** | **both CTAs render below the fold at first paint** (BUY at y 894–941, "Not now" at 949–982 in an 812px viewport). The overlay does scroll (`overflow-y: auto`, scrollHeight 1008), so it is *not* a trap — but the player must discover scrolling to find *any* button, including the one that takes their money | **P2 — measured live** |
| 19 | Boss-flow anti-stalls | explore portal auto-starts lesson at gap+120 candles (**observed live** at candle 203 after an ignored candle-89 portal); boss portal auto-enters after 90 candles; teach/wait chains have 18 s caps; stuck-watchdog re-arms every ~9 s | OK |
| 20 | Level-1 wisdom/mega distractions during trades | pages/megas suppressed while `setupFlow/pending/trade` (verified in CQ-0024 pass) | OK |

**Off-screen-button sweep result:** the paywall (row 18) is the only overlay with controls outside the 375×812 viewport. Ticket, intermission, boss, lessons, practice, capstone, auth all measured clean.

---

# B · CONSTITUTION COMPLIANCE — LEVELS 1–3

## B.1 Level 1 (intro → Gambler → Hour 1 → Eel)

The required L1 sequence — *intro → green/red lesson → practice → prediction → momentum lesson → practice → T1 → pullback lesson → practice → T2 → confirmation lesson → practice → T3 → Boss* — **exists and fires in order.** Verified live this audit up to T1's arming (portal candle 40, forced start candle 52, bet, explore 30, momentum portal candle 89, I'M READY) and previously verified end-to-end in the v214 constitution audit; the 3-trade re-arm chain (`teachThenNextTrade` → explore → lesson → practice → `waitThenNextTrade`) and `INTRO_TRADES_NEEDED = 3` are intact in code.

A structural note the constitution audit v214 should be read with: after the Gambler, `introComplete()` **resets Hour 1 to candle 0 with a fresh trade gate** ([16032] region). Level 1 is therefore *two* full arcs: the guided intro (3 trades + Gambler) and an unguided 190-candle hour (3 more trades + reads) ending in the **Eel**. That's 6+ trades and 2 boss fights inside "Level 1" — compliant with ≥3-trades-per-boss for *both* bosses, but it roughly doubles L1's length (see §D).

## B.2 Levels 2–3 TEACH → PRACTICE → TRADE×3 → BOSS

- **TEACH ✓ (mechanically):** entering L2 queues *MORE REASONS*, *WHAT IS A TREND?*, *SUPPORT & RESISTANCE*; entering L3 queues *BOS*, *ChoCh* (measured live — `closeIntermission` force-teaches the level's focus, [6387] region).
- **TEACH ✗ (quality):** all four L2/L3 lessons are **text cards, not animated LessonChart lessons** (`hasChart:false` measured for each). The constitution requires the animated chart lesson system for every concept. L1 gets the full animated treatment; the free journey's teaching quality *drops* exactly where the paywall decision is forming. **P1.**
- **PRACTICE ✗ (required-ness):** trend/SR cards have a required one-tap recall; **bos/choch cards have no recall at all** — and the hands-on drill ("TRY IT") is optional on all four. Nothing forces a single practice rep of trend, S/R, BOS or ChoCh before the boss that tests them. **P1.**
- **TRADE ×3 ✓:** the mastery gate (`{n:3, w:2, p:3}` for L≤4) is enforced at `imNext`, and after the A.1 fix it is always satisfiable. **APPLY ✗ (linkage):** L2/L3 trades still come exclusively from the L1 beginner framework (momentum→pullback→confirmation; `SETUP_UNLOCK` gives `pullback:2`, `bos:3` for the L4+ detector which is inert at L≤3) — so the trades never *use* the level's new concepts. Taught-but-never-applied before the test. **P1.**
- **BOSS ✓/✗:** fires exactly at the gate; but see B.3/B.4.

## B.3 Golden Rule — every boss round vs. what was actually taught (code truth: `BOSS_CAST` rounds are served raw; `openBoss` applies **no taught-concept filter**)

| Boss (when) | Rounds | Verdict |
|---|---|---|
| **Gambler** (mid-L1, intro) | candle · whowon · confirm · predict · **error** | candle/whowon/confirm/predict all taught in the intro ✓. `error` (spot the impossible candle) is never explicitly taught — mitigated by B.4's auto-win, but conceptually first-contact. ⚠ |
| **Eel** (end L1) | fake · **liquidity** · confirm · whowon · candle | `fake` tests "wait for the close" — taught ✓. **`liquidity` ("tap where stop orders rest") is an Hour-4 concept** (`CONCEPTS.sweep: hour 4`); at end-of-L1 it is only wordlessly seeded by mega-pole wicks. **Violation.** |
| **Crab** (end L2) | trend · support · resistance · **struct** · **bos** | trend/support/resistance taught by the L2 cards ✓ (text-only, no forced practice — B.2). **`bos` is the Hour-3 concept tested one boss early; `struct` asks for an uptrend/downtrend/range classify when "range" is never taught.** **Violation.** |
| **Serpent** (end L3) | bos · choch · **ob** · struct · predict | bos/choch taught by L3 cards ✓. **`ob` is the Hour-4 concept** — this exact misalignment was flagged in PROGRESSION_AUDIT and is still live. **Violation.** |

The docs drifted too: PROGRESSION_AUDIT's table shows 3-round bosses ("candle, error, predict" etc.) and CONVERSION_AUDIT celebrates the Gambler's `predict/candle/error` skill gate — the cast now runs 5 rounds per boss and the Gambler is unloseable (B.4). Those audits no longer describe the shipping game.

## B.4 The two mastery escape hatches (both measured live)

1. **The Gambler cannot be lost.** `onRoundDone`: for level 0 every round is forced to a HIT with score ≥60 ("FIRST BOSS = NO STRUGGLE", [~10990]). Deliberate confidence-builder — but it directly contradicts the v76 conversion thesis ("skill now noticeably outperforms guessing… the win is earned"), and it makes the Gambler's own lesson ("skill beats gambling") mechanically false. Design decision to re-confirm, not a bug. **P1 (learning integrity).**
2. **SKIP on the loss screen = full victory.** Losing to ANY Guardian shows RETRY + **SKIP →**, and SKIP calls `bossFinish()` which **unconditionally** adds the boss to `bossesDone` *and* the persistent `bossesEverBeaten` (Notebook/Glasses/cinematics credit), closes the fight as a win, and advances the hour ([11262] + [11293]). Measured live: lose Eel on attempt 1 → tap SKIP → `bossesDone.has(1)=true`, `bossesEverBeaten.has(1)=true`. Two taps bypass the entire mastery system, permanently. **P1 — the single worst learning-flow defect found.**

## B.5 Decision counts & Lost Wisdom

- **Decisions per level (constitution: 5–8):** post-intro Hour 1 alone offers ~10–14 quick-read prompts (`qrCooldown` 11–16 candles across 190, minus guards) + 3 trades × 2 decisions (predict + direction) + 5 boss rounds ≈ **20+ decisions**; the intro adds ~17 more. The rule as written is exceeded ~3× — mostly by quick-read volume. Either the rule means "major decisions" (then trades+boss = 8–11, close), or read density needs a cap. Flagged for a ruling, not unilaterally changed. **P2.**
- **Lost Wisdom:** placement rules comply — 2/level, easy-first-half/hidden-back-half, spot gaps ≥65 (60/150, 40/128, 62/130), L1 hidden deferred until the first trade, pages suppressed during trades, optional, never boss-required. The build-216 "page-on-mega-wick" open item was closed in the CQ-0024 pass (placement rules unit-verified live; ordinary-bar promotion removed; wick attachment enforced). ✓

---

# C · WILL A NEW PLAYER ACTUALLY LEARN?

**Lessons — L1: strong. L2–L3: weakest pillar.** L1's chain (animated lesson → forced practice → immediate guided trade using that exact concept ×3) is genuinely good pedagogy — LEARN→PRACTICE→APPLY with tight spacing. From L2 on, teaching collapses to 2–3 stacked text cards at level entry (read → one recall tap → gone; bos/choch not even that), then ~6–8 minutes of gameplay that never references them again until the boss. Spacing is inverted: everything front-loaded, zero reinforcement. **Attention needed most here.**

**Trades — good mechanics, weak linkage after L1.** Driven trades (≥30 candles, dip→hold→run) with visible SL/TP teach patience and stop-respect well, and the mastery gate forces reps. But every L1–L3 trade is the same momentum→pullback→confirmation pattern; a player "applies" trend/SR/BOS zero times before being tested on them. The trades reinforce L1's concepts three levels running.

**Bosses — can they be passed by guessing?** Gambler: yes, by design (unloseable). Eel/Crab/Serpent: the binary rounds (whowon/predict/confirm/fake-call) are ~50% guessable, but build/annotate rounds (candle lab, zone shading, ray drawing) are effectively un-guessable; with 3 lives across 5 rounds, a pure guesser fails far more often than not — *except that the SKIP hatch makes guessing irrelevant: lose and skip.* Fix B.4.2 and the exams are sound.

**Exploring — supports learning, mild distraction risk.** Mega poles + wick shells wordlessly seed the liquidity idea (nice), Wisdom pages are mindset content gated behind bosses-for-readability, and trade-focus suppression keeps exploration out of trades. The one conflict: the Eel *tests* liquidity while exploration has only seeded it wordlessly — exploration is doing curriculum work it was never meant to carry.

---

# D · RETENTION + ENJOYMENT + $25 VALUE

**Session arc (modeled from verified constants — the harness cannot clock real pacing; see Method):**

| Beat | Modeled time | Cumulative |
|---|---|---|
| Cinematic → first control | 1–1.5 min | ~1.5 min |
| Green/red lesson + practice + bet (candles 40–52 + UI) | 2–3 min | ~4 min |
| Momentum → T1 → pullback → T2 → confirmation → T3 (3 driven trades ≥30 candles + lessons + reviews) | 5–7 min | ~10 min |
| Final approach + **Gambler** (5 rounds, unloseable) | 2–3 min | **Boss 1 ≈ 12 min** |
| Hour 1 (190 candles, 3 trades, ~10 reads, 2 contextual lessons) + **Eel** | 8–11 min | **Boss 2 ≈ 21–23 min** |
| Level 2 (card stack + 190 candles + gate) + **Crab** | 9–12 min | **Boss 3 ≈ 31–35 min** |
| Level 3 + **Serpent** → capstone → **paywall** | 10–13 min | **ask ≈ 42–48 min** |

The old density audit modeled Boss 1 at ~4 min (perHour was 140 and the intro was one arc). The current design is **~3× longer to the first boss** and the ask moved from ~20 min to ~45 min. That buys teaching depth and makes the free slice generous — but it bets the conversion on a 45-minute uninterrupted mobile session, and the two dead-stretch families are real: (a) the 0:38–1:28-style traversal runways between beats in every hour (~85 s of pure walking per level, broken only by reads), (b) the L2/L3 openings, where the level's actual new content is spent in the first 60 seconds of card reading.

**Emotional peaks that exist and land:** the engineered first win, the first guided trade's SL/TP drama, Gambler kill + Notebook unlock, Glasses at Boss 2, faction at Boss 3, capstone. **Gaps:** no mid-hour peak in L2/L3 (the wisdom hunt is the closest thing and it's optional), and the Gambler's unloseable-ness quietly deflates the first "I earned this."

**The $25 question, honestly:** after 3 Guardians the player can read a candle, wait for a close, and take a disciplined pullback entry with a stop — that's real, and the capstone/paywall copy (transformation framing, live next-Guardian tease, soft "Not now") is still the strongest conversion asset the game has. But three things undercut the ask *as built*: (1) the pride the paywall monetizes is partially unearned (unloseable first boss, skippable losses); (2) the teaching visibly downgrades from animated-lesson quality to text cards during exactly the levels that precede the ask — the product demos its worst self right before pricing itself; (3) mechanically, **conversion is still zero: `cqStartCheckout` remains a placeholder** (PRODUCTION_READINESS blocker) and the BUY button renders below the fold on a phone. The old audits' unresolved asks — risk-reversal/guarantee, value anchor beside the price, social proof — remain absent. Verdict: the *journey* is closer to $25-worthy than at v77 (more free value, deeper systems visible), but the *moment of purchase* is weaker than v77 measured it, because placement moved without re-testing the screen on phones and the mastery hatches leak the pride.

---

# E · DELIVERABLE

## E.1 Severity-ranked findings

| # | Sev | Finding | Evidence |
|---|-----|---------|----------|
| 1 | **P0 → fixed** | Trade-loop dead-end (both variants) — gate could demand unspawnable trades | §A.1; fixed + live-verified in build 218 working tree; **needs to ship** |
| 2 | **P1** | SKIP on boss loss = unconditional win incl. persistent `bossesEverBeaten` credit | §B.4.2; measured live (Eel, attempt 1) |
| 3 | **P1** | Boss rounds test untaught concepts: Eel `liquidity` (hour 4), Crab `bos`+`struct` (hour 3 / never), Serpent `ob` (hour 4) | §B.3; `BOSS_CAST` [9390–9426] vs `CONCEPTS` hours [4770]; no taught-filter in `openBoss` [11020] |
| 4 | **P1** | L2/L3 lessons are text cards, not animated LessonChart; bos/choch have no recall; practice optional; trades never apply the new concepts | §B.2; measured `hasChart:false` ×4 |
| 5 | **P1** | Gambler unloseable (design choice contradicting the conversion thesis) — needs an explicit ruling | §B.4.1; [onRoundDone] |
| 6 | **P2** | Paywall CTAs (incl. BUY) below the fold at 375×812, first paint | §A.2 row 18; measured y=894/949 in 812 viewport |
| 7 | **P2** | Quick-read volume (~10–14/level) blows the 5–8 decision budget and dilutes trades as *the* decision | §B.5 |
| 8 | **P2** | Checkout unwired (`CQ_CHECKOUT_URL` stub) — conversion mechanically 0; guarantee/anchor/social-proof still missing | §D; [11162–11167] |
| 9 | **P2** | ~85 s pure-walk runways per hour; L2/L3 have no mid-level emotional peak | §D |
| 10 | **P3** | No `.uxX` on auth prompt / capstone / paywall (universal-✕ rule); predict-chart is answer-to-exit | §A.2 rows 10/16/17/18 |
| 11 | **P3** | Stale docs: PROGRESSION/CONVERSION/PAYWALL audits describe 3-round bosses, skill-gated Gambler, paywall-after-G2 — all changed | §B.3/§D |

## E.2 Phased fix plan

**P0 hotfix build (ship now — it's already in the tree):** finding 1. Commit build 218. Effort: 0 (done, verified). Constitution: mastery-gate satisfiability.

**P1 flow build (~1–2 days):**
- **SKIP hatch** (find 2): show SKIP only after ≥3 failed attempts; SKIP grants passage (`bossesDone`) but **never** `bossesEverBeaten` credit and is labeled honestly ("PASS FOR NOW — the Guardian remembers"). Touches: Golden Rule / TEST pillar. ~2 h + verify.
- **Round alignment** (find 3): Eel `liquidity`→`predict` (or `candle`), Crab `struct`/`bos`→`whowon`/`confirm`-tier or trend-family rounds, Serpent `ob`→`struct`. One-line-per-boss edits in `BOSS_CAST`; alternatively add a taught-filter in `openBoss` with per-boss fallbacks. Touches: Golden Rule. ~2–3 h + browser-verify (block 1 only).
- **Gambler ruling** (find 5): recommend keep round 1–2 forgiving, make rounds 4–5 real (lives can't drop below 1 on L0 instead of auto-pass) so the win is felt but safe. Needs your call. ~1 h.
- **L2/L3 teaching** (find 4): reuse the L1 machinery — each focus concept gets LessonChart scene + required `openConceptPractice` (scenes for trend/sr/bos/choch exist in the MG drills already; `CONCEPT_PRACTICE` needs 4 entries) and space the two concepts apart (one at level start, one after trade 1). Touches: LEARN→PRACTICE→APPLY, lesson-delivery rule. ~1 day, block-2 edits → full browser verification per the scope-trap rule.

**P2 retention build (~1–2 days):** paywall above-the-fold layout at ≤700px heights + `.uxX` sweep (finds 6, 10, ~3 h); read-density cap (e.g. max 6/hour, pause reads while gate is already read-satisfied — find 7, ~2 h); wire checkout + guarantee line + value anchor (find 8 — the only revenue-critical item, ~half day incl. Stripe/LS setup); one authored mid-hour beat for L2/L3 (a single "trend-line moment" mega event, find 9, ~half day). Doc refresh (find 11, ~1 h).

## E.3 If you can only fix three things before launch

Ship the build-218 softlock fix and then spend everything on these three: **(1) close the SKIP hatch** — right now two taps beat any Guardian and permanently bank the credit, which converts your entire mastery system, the ≥3-trades rule, and the pride your paywall monetizes into theater; **(2) align the boss rounds to the taught curriculum** (Eel/liquidity, Crab/bos+struct, Serpent/ob — five one-line `BOSS_CAST` edits) so the Golden Rule — the one rule you called never-negotiable — is actually true for the exact three bosses every free player meets; and **(3) put the paywall's BUY button on screen and wire the checkout**, because at 375×812 the purchase button is currently below the fold on the screen that pays for everything else, and behind it there is still no checkout at all — every other improvement multiplies against a conversion rate that is mechanically zero today.

*Audit complete. Nothing beyond the already-approved CQ-0024/build-218 fixes was changed. Awaiting approval on E.2 before any implementation.*
