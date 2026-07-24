# ChartQuest — Phase 1: The First-Hour Obsession Plan
**Date:** 2026-07-10 · **Build:** 261 · **Scope:** the six moments — First Impression, First Movement, First Trade, First Win, First Loss, First Boss.
**Mandate:** maximise the number of first-time players who become *obsessed* in the first hour. Redesign, don't preserve.
**This surpasses (and in two places overrules) the three beta audits.** Where I overrule them, I say why, with the reasoning.

> **The litmus for every decision below:** *does this make the player feel smarter?* Not "did they learn a fact" — did they **make a read and get proven right by the market.** That single feeling is the whole product. "I think like a trader now" is just that feeling, repeated until it becomes identity.

---

## 0 · Status — what's shipped, what's protected, what's contested

- **✅ Shipped now (safe, verified):** the dev BUILD_TAG is hidden from players (QA-only). *(Polish §"hide developer artifacts.")*
- **🔒 Protected + concurrently-edited:** the trade engine (#9) and the movement model (#4) are **actively being edited by the TES workstream right now**, and both are frozen-by-default in your own doctrine. I will **not** blind-rewrite them mid-flight — that's how a determining beta breaks. They need (a) your pre-flight OK and (b) a decision on *who* owns that code this week (§9).
- **⚠️ Needs human verification:** trade changes cannot be validated headlessly — I literally could not reach a trade by driving the platformer. Which is itself the headline finding, and *the whole reason the beta exists.*

---

## 1 · The thesis the audits miss: the **Ownership Paradox**

All three beta audits converge on *"make the trade FEEL more — louder P&L, bigger dip, a payoff burst."* **That is necessary but it is the second problem, and applied first it makes things worse.** Here is the deeper one:

> **TES makes outcomes *authored* (scripted wins) to guarantee *fairness*. But your #1 success metric is *"I won because I made a good decision."* Authored outcome and felt authorship are in direct contradiction.** If the trade resolves the same way regardless of the player's read, then the player did **not** cause it — and on some level, they know. Your TRADER-GAMERs *will* feel the rails. Juicing a hollow trade just makes a hollow thing louder.

The audits treat *fairness* and *ownership* as compatible. **They are in tension.** Drama without ownership is a **slot machine** — it can feel exciting for one pull and leaves nothing behind. Ownership + drama is **defeating a boss with your mind** — which is exactly what you asked the trade to feel like.

### The resolution (this is the core Phase-1 redesign)
Move the authoring **out of the outcome and into the signal.** The player makes a **real, binding READ** (which way? / enter or wait?) that **gates** the result:

1. **Teach the read** immediately before (you already do: "big green candle = momentum = up").
2. **Force a commitment** — the player must *choose* (UP/DOWN, or ENTER/WAIT). No auto-enter.
3. **The market proves them right *because* their read matched the honest signal** — the setup is *designed so the correct read is learnable and obvious*, not so the outcome is forced.
4. **A wrong read can lose** — a small, coached, recoverable loss. *You said it yourself: "Never reward guessing."* A game you win regardless of your choice teaches nothing and owns nothing.

This **keeps beginners safe** (the signal is taught, obvious, and the loss is gentle + coached) **while making the win real** (you won because you read it). Fairness is preserved — it just lives in *"the signal was honest and I taught it to you,"* not in *"you win no matter what."* This is the difference between *"I learned trading"* and *"I think like a trader."*

**Priority correction:** the audits rank **①"felt-stakes juice"** as #1. I reorder: **①a Ownership** (the read gates the outcome) → **①b Felt-stakes** (juice the owned trade). Juice amplifies ownership; it cannot substitute for it.

---

## 2 · The engine that makes players feel smarter: PREDICT → REVEAL → RIGHT

Blizzard encounter design, Duolingo, and every great puzzle game run the same loop: **the player commits a prediction, then reality confirms it.** The dopamine is not the reward — it's *being right about something you reasoned out.*

- **Today** the "you call it" beat is **trade 1.3** (third trade). **Move it to trade 1.1.** The very first trade should ask *"which way does this go?"*, let them read, and prove them right. First-trade ownership is the single highest-leverage change in the hour.
- **Make prediction the default verb, not a special round.** Before most setups resolve, a beat of *"what happens next?"* → commit → reveal. That beat, repeated, **is** the transformation.
- **Name the read back to them on the win:** not "You won +2.3R" but **"You spotted the momentum. The market agreed."** Attribute the win to *their observation.* That sentence is what they repeat to a friend.

---

## 3 · The structural critique the audits under-weight: time-to-first-verb

Nintendo's iron rule: **the core verb is in the player's hands in the first 60 seconds.** In ChartQuest the core verb is **the trade** — but it sits *minutes* away, behind a platformer traversal that I (an expert) could not clear headlessly, over a near-empty chart.

The audits say *"remove traversal friction."* I go further: **question whether the platformer belongs *between* the goal and the first trade at all, for the first-timer.**

Two designs, pick one (both beat the status quo):
- **A — Traversal as the lesson (keep the platformer, make it teach):** the first ~45s of platforming *is* candle-reading — you **step up onto green, the ground drops on red.** The terrain teaches "green = up" through your feet before any card does. Short (≤45s), dense, unmissable, ending *at* the first setup. This makes the dead air *meaningful*.
- **B — Trade first, traverse as reward (bolder):** the very first setup appears within ~30s, almost immediately. You take a guided trade, feel the hook, *then* the world opens up and you platform toward Guardian 1 as a *reward* for the competence you just earned. Verb-in-hand in the first minute.

**Recommendation: A for the beta** (smaller, keeps your structure), **B as the north star.** Either way, the fix is not "tune boost" — it's *"the player must never wonder what to do or where to go,"* and the trade must arrive *fast.*

---

## 4 · The six moments — redesigned

Each: **the problem → the redesign → the "feel smarter" check → target + protection.**

### ① FIRST IMPRESSION (0:00–0:15)
- **Problem:** a **video** that black-screens on stall. First thing = black.
- **Redesign:** static hero key-art paints **instantly**; video layers on top if/when ready; **SKIP visible from frame 1**; auto-fallback to static if unpainted in ~1.2s. Under it, one line of promise: *"Learn to read the markets — by playing inside them."*
- **Feel-smarter check:** n/a (it's the hook, not the lesson) — but it must never feel broken.
- **Target:** intro cinematic (`IntroCinematic`). **Protected #7 (UI flow) — pre-flight.**

### ② FIRST MOVEMENT (0:15–1:00)
- **Problem:** floaty; boosts into the void; sparse world; no forward pull; the player can get *lost* (I did).
- **Redesign (Design A):** short, dense candle path that **rises on green / drops on red** so movement *is* the first lesson; a soft **"→ this way"** pull and a camera that always frames the next step; the path **ends at the first setup** so nobody wanders. Tame boost's vertical overshoot so it can't strand you above the chart.
- **Feel-smarter check:** by 1:00 the player has *felt* "green goes up" in their thumbs. ✅
- **Target:** level layout + prompts (mostly non-physics) + `CFG` boost tuning (**physics = protected #4 — pre-flight**).

### ③ FIRST TRADE (1:00–2:30) — *the whole game in one beat*
- **Problem:** the founder's own verdict — *"click buttons, no meaning."* Authored outcome = no ownership (§1).
- **Redesign:**
  1. **Read** — teach the signal 5s before (big green → momentum).
  2. **Predict + commit** — *"Which way? ▲ UP / ▼ DOWN."* The player **must choose.** (Move the "call it" here from trade 1.3.)
  3. **Live P&L becomes the star** — large, centre-stage, colour-pulsing green↔red as it swings; the camera tightens.
  4. **The scary phase (the dip)** — hold it long enough to *sweat*; Finn does a shell-check; music leans in.
  5. **The turn + the kill** — price runs to target; number **slams up**; sound swell; shells burst; screen-shake.
  6. **Attribution** — *"You read the momentum. The market agreed."* — the win is credited to *their* decision.
- **Feel-smarter check:** they predicted, committed, sweated, and were **proven right by their own read.** ✅✅ This is the boss-fight feeling you asked for.
- **Target:** `commitTrade`/`resolveTrade`/`tradeDrivenCandle` + the close-button P&L. **Protected #9 — pre-flight. Human on-device verification required.**

### ④ FIRST WIN (the payoff of ③)
- **Problem:** reward is *informational* (trophy/journal), not *visceral*.
- **Redesign:** a genuine **peak** — freeze-frame, shells rain, Finn's biggest cheer, a bright "FIRST TRADE WON" flourish, a rising sting. Then the trophy/journal, as the *afterglow*, not the reward itself. **Auto-offer the share card here** (virality seeded at the emotional high).
- **Feel-smarter check:** the celebration must *name the skill* ("You spotted it"), not just the number.
- **Target:** the trade-resolve FX (`tradeFx`/`drawHeroFinn`) + `GameMusic`. Mostly **render/audio (non-protected)**, but it fires inside the trade flow → coordinate with #9.

### ⑤ FIRST LOSS (the trust-forge)
- **Problem:** already well-designed (coached "your stop did its job", recovery win) — *if it lands.*
- **Redesign (mostly amplify):** make the stop-out feel like a **near-miss you survived**, not a failure — Finn *pulls into his shell and is fine*; the coaching card is a **warm exhale**, not a scold: *"That's your stop protecting you. Real traders lose small and live to trade again."* Then the recovery win lands harder because they *earned trust.*
- **Feel-smarter check:** they must leave the loss thinking *"the stop saved me — I get it now,"* i.e. **smarter because they lost.** ✅ (This is your best emotional beat; protect it.)
- **Target:** `authoredTutorialOutcome` (First-Loss placement) + the coaching card. **Protected #9 — pre-flight. But copy/juice polish is lower-risk.**

### ⑥ FIRST BOSS — Guardian 1, The Gambler
- **Problem:** unloseable is *correct* (pride, not punishment), but two rounds test micro-rules L1 never taught (`confirm`/`error`), and a *wrong* read still advances ("the Gambler fumbles") → for missers it can read as *luck*, undercutting ownership.
- **Redesign:** narrow the playlist to **pure L1 recall** (`candle · whowon · predict`) so every round is a read they were taught; keep unloseable, but make a **clean read** land bigger than a fumble so the win is *earned*, not gifted. Frame the victory as *graduation*: *"You out-read the Gambler. You're a trader now — Rank: Plankton."*
- **Feel-smarter check:** they beat a boss using reads they can *name.* ✅
- **Target:** boss round mapping. **Protected #2 (boss roster/progression) — pre-flight.**

---

## 5 · Where I challenge the audits (and myself)

- **I overrule "juice the trade first."** Ownership before juice (§1). Juicing a scripted trade makes your smartest testers trust it *less.*
- **I overrule my own Retention audit's #9 (compulsion loops) for Phase 1.** Streaks/leaderboards/variable payouts are **week-2** retention. **First-hour obsession comes from competence + ownership + surprise, not Skinner boxes.** Adding compulsion loops now would *cheapen* the "I'm becoming a trader" feeling with slot-machine noise. **De-prioritise for the beta.**
- **I raise the structural critique the audits under-weight (§3):** the core verb (the trade) is minutes away behind a platformer. That ordering — not boost tuning — is the real traversal problem.
- **I agree with and keep:** the authored confidence curve (best decision in the project), the First-Loss beat (masterstroke), Finn as the attachment hook, and every "safe/now" polish item.

---

## 6 · Execution plan (sequenced for the beta)

| Wave | Item | Protection | Verify | Owner |
|---|---|---|---|---|
| **NOW — safe, done/ready** | Hide build tag ✅ · funnel telemetry · share-card scaffold · first-win FX (render/audio) | none / render | headless + on-device | me |
| **PRE-FLIGHT #1 (the beta-maker)** | First-trade **ownership** (predict→commit→proven-right) + felt-stakes juice | #9 trade | **human on-device** | needs your OK + coordination w/ TES |
| **PRE-FLIGHT #2** | Traversal = lesson (Design A): short dense path, forward pull, ends at setup; boost overshoot tune | #4 movement | on-device touch | needs your OK |
| **PRE-FLIGHT #3** | Cold-open static-hero fallback | #7 UI flow | on-device | needs your OK |
| **PRE-FLIGHT #4** | Guardian 1 pure-L1 playlist + "clean read wins bigger" | #2 boss | on-device | needs your OK |
| **AFTER beta (data-led)** | compulsion loop · deeper trade rebuild (Option B) · Design B (trade-first) | — | — | later |

## 7 · Telemetry (each metric answers a design question)

Instrument as safe/now. Every event answers *one* question:
`t_to_first_movement` (is the intro too long?) · `t_to_first_trade` (§3 — the big one) · `t_hovering_idle` (are they lost?) · `first_trade_choice_correct?` (does the read gate the win? §1) · `first_trade_completed` · `first_win` · `first_loss_recovered?` · `guardian1_clean_reads / fumbles` (earned vs lucky? §6) · `quit_point` · `session_len` · `journal_opened` · `saw_paywall` · `would_pay` (post-survey). **The two that decide the beta:** `t_to_first_trade` and `first_trade_choice_correct?` — the second one *measures ownership directly.*

## 8 · Self-audit (Nintendo is reviewing) — what still prevents obsession

1. **The trade may still be watched, not played,** until §1 ships. Until then it's a demo, not a game. **Highest risk.**
2. **The world is a void between beats** — even fixed, ChartQuest must *look* alive to earn "premium." Market-breathing is P1, not P2.
3. **No moment names the player's growing identity** often enough — rank-ups are rare. Sprinkle "you're thinking like a trader" micro-beats.
4. **Nothing yet is *surprising*** — obsession needs a *"whoa, I didn't expect that"* (a Guardian's entrance, a market twist). Currently the arc is safe *and* predictable. Add one genuine surprise in the first hour.
5. **Verification debt:** none of the trade work can be signed off without a human playing it. Plan a live playthrough *before* the 10 friends — you are tester zero.

## 9 · The two decisions I need from you

1. **Approve the protected pre-flights** (trade #9, movement #4, UI #7, boss #2) — or tell me which to hold. Nothing protected moves without this.
2. **Who owns `chart-quest.html` this week — me, or the TES workstream?** It's being edited concurrently in the exact code I'd touch. If it's them, I feed them this plan and stay out of the file. If it's me, I need them to pause. **We cannot both edit the trade engine the week of the beta.**

*Plan + one safe implementation (build-tag hide). No protected system was modified. The trade/movement/UI/boss redesigns are specified and ready to execute on your OK.*
