# ChartQuest — Beta Retention Audit (5 focus areas + persona scorecard)
**Date:** 2026-07-10 · **Build:** 261 · **Report 2 of 3** (Retention). Pairs with the Onboarding audit and the Top-10 actions.
**The 5 lenses you asked for:** ① Emotional hooks ② Trade feel (rewarding/fun/good) ③ Addictiveness ④ $25 willingness-to-pay ⑤ Virality (tells friends).
**Personas:** NOVICE (gf, ×1) · NEW-TRADE (×2) · TRADER-LOWGAME (×2) · TRADER-GAMER (×5). See Report 1 §0.

> **The one sentence that matters:** everything downstream of the first trade — addiction, paying $25, telling friends — is a **function of whether the trade itself feels rewarding.** If the trade feels like *"clicking buttons"* (your own words, build 252), none of the rest fires. If it feels like *"oh no… the dip… YES,"* all of it fires. **This is the make-or-break variable of the entire beta.**

---

## 1 · Trade feel — the crux (honest assessment)

### What the record says
- **Your device verdict (build 252, Note 2c, verbatim):** *"you just click buttons and you're in the trade — there's no meaning, no payoff, no repercussions."*
- **What TES then fixed (256/257):** outcomes are now **authored, not a coin-flip** → wins are *earned by a read*, the **First Loss** is designed + coached ("your stop did its job") + recovered, and the **confidence curve** can't randomly collapse. Build 253 added the **min-duration gate** so trades stop ending in 3–4 candles.
- **What the machinery already contains** (and this is the good news): live P&L on the close button, a `tradeDrivenCandle` **dip → hold → recover → run** arc, and the ~30-candle felt duration. The parts of a *thrilling* trade exist in code.

### The honest gap
TES fixed **fairness**. It is not proven that it fixed **feeling**. Those are different axes:
- **Fair** = "I won because I read it right, and the one loss was my stop protecting me." ✅ done.
- **Rewarding** = a visceral arc: *tension while P&L bleeds red → the scare → relief/euphoria on the green run → a dopamine payoff at the close.* ⚠️ **unconfirmed** — and the founder's original complaint was exactly this axis.

**The beta's #1 job is to answer:** when your friend takes trade 1.1, do they *lean in and feel it*, or do they *click and watch*? Watch their face on the dip. If they don't visibly react, fairness wasn't enough and the trade needs **felt-stakes** work (bigger live-P&L drama, sound, screen tension, a real payoff moment) — see Top-10 #1.

### Per persona
| Persona | Predicted trade feel | Why |
|---|---|---|
| TRADER-GAMER | 🟡 "competent, a bit flat" | They know real trading dopamine; a scripted win can feel *on-rails* unless the P&L drama + payoff is loud. Risk: they see the authoring. |
| NEW-TRADE | 🟢 "ooh, I did a trade!" | Novelty carries them; the dip-scare + win reads as genuinely exciting if it lands. |
| TRADER-LOWGAME | 🟡 depends on depth | They'll judge it *as trading*. Authored wins can feel patronising unless framed as a tutorial. |
| NOVICE | 🟢/⚪ *if she reaches it* | The First-Win trophy + Finn's warmth can genuinely delight — but only past the traversal wall (Report 1). |

---

## 2 · Emotional hooks

**Strengths (real):**
- **Finn.** He's now visibly *alive* (blink, idle, reactions, looks at the Guardian). A warm, competent companion is a genuine attachment hook — and the strongest one you have. This is why the animation work mattered.
- **The quest myth** — "escape the market, beat the Guardians, beat the Market Maker." Named bosses = anticipation.
- **The First Loss beat** — "your stop just did its job" is a *masterstroke* of emotional design. It converts the worst moment (a loss) into trust. If it lands, it's the thing they'll describe to a friend.
- **Graduation** — Guardian 1 is unloseable → pride, not punishment. Rank-up (Plankton →) gives identity.

**Gaps:**
- **No peak celebration.** The first win needs to be a *moment* — screen-shake, sound swell, shells raining, Finn's biggest cheer. Right now the reward is informational (trophy/journal), not visceral. (Top-10 #6.)
- **The world is emotionally flat between beats** — sparse candles, lots of void (Report 1 O3). The "living world" the marketing promises isn't felt in-game yet.

| Persona | Hook strength |
|---|---|
| NOVICE | 🟢🟢 Finn + First-Win warmth is her *whole* reason to stay |
| NEW-TRADE | 🟢🟢 quest + Finn + "I'm learning something real" |
| TRADER-LOWGAME | 🟢 quest + the First-Loss lesson (respects their intelligence) |
| TRADER-GAMER | 🟢 Finn + boss myth; they want the *systems* under it |

---

## 3 · Addictiveness (the "one more" pull)

**This is the weakest dimension today, and it's structural.** ChartQuest is currently a **linear campaign** — you progress, you learn, you beat a boss, you move on. That is *satisfying* but not *compulsive*. The classic compulsion loops are largely **absent**:

| Compulsion mechanic | Present? |
|---|---|
| Authored win → progress | ✅ (the campaign) |
| Ranks / identity progression | ✅ (Plankton →) |
| **Variable/uncertain reward** | ⚠️ deliberately removed (outcomes authored) — good for *fairness*, but it also removes the slot-machine pull |
| **Streaks / "don't break the chain"** | ❌ |
| **Daily reason to return** | ❌ |
| **Leaderboard / social compare** | ❌ |
| **Collection / completion** (Guardians as a set) | 🟡 implicit, not surfaced |
| **"Next rank in 2 trades" progress bar** | 🟡 there's a goal bar, not a rank-tease |

**The tension:** you *correctly* removed random loss to protect beginners. But "addiction" partly *comes* from uncertainty. The resolution is **not** to re-add unfair losses — it's to move the variable reward to **safe** surfaces: shell payouts that vary, a rank ladder that always dangles "so close," collectible Guardian trophies, a post-Boss-3 endless/challenge mode. (Top-10 #9.)

| Persona | "One more" pull |
|---|---|
| TRADER-GAMER | 🟡 they crave a loop; give them a ladder/streak/leaderboard and they binge |
| NEW-TRADE | 🟡 campaign momentum only; fine for a first hour, thin for week 2 |
| TRADER-LOWGAME | 🟠 low — they'll play to learn, then stop |
| NOVICE | 🟠 low — she plays because it's *yours* and it's cute, not because she's hooked |

---

## 4 · $25 willingness-to-pay (after Boss 3)

WTP is downstream of **trade feel × "do I want more?"** The model monetises *after* Boss 3 — so by the time they see the price, they've had the full free arc. Good structure. Risks:

- **The value bridge is unproven.** At the paywall, does the game make them *feel* what's behind it (7 more Guardians, the Market Maker finale, the deep market, the Journal)? If it's a bare "Buy for $25," conversion tanks. Frame it as *"continue the adventure,"* show the locked map lighting up. (Top-10 #8.)
- Prior audits flagged **paywall below the fold + a checkout stub** — that must be real and polished before any friend hits it.

| Persona | Would pay $25? | Condition |
|---|---|---|
| TRADER-GAMER ×5 | **2–3 of 5 likely** | *iff* the trade respected them + they want the deeper game. Your core buyers. |
| NEW-TRADE ×2 | **1 of 2 maybe** | *iff* they feel they're gaining a real, marketable skill (position it as *learning*, not just a game). |
| TRADER-LOWGAME ×2 | **0–1** | they'd rather use a real broker sim; must feel uniquely *fun*, not just educational. |
| NOVICE ×1 | **0** (but she's not the buyer — she's the *canary* and a *referrer*) | — |

**Predicted paid conversion of the 10: ~3–4** *if trade feel lands*; **~1–2** if it stays "fair but flat." That delta is the entire ROI of Top-10 #1.

---

## 5 · Virality — will they tell friends?

Referral needs a **shareable, screenshot-able, "you have to try this" moment.** Today there isn't one built in.

- **The concept is inherently viral** — *"a game where you're a turtle jumping inside a live Bitcoin chart and it teaches you to trade"* is a great one-liner. TRADER-GAMERs will *describe* it.
- **But there's no artifact to share** — no "I beat The Gambler" card, no "my first win: +2.3R" shot, no rank badge, no clip. (Top-10 #7.)
- **Finn is the meme vector** — a cute, alive mascot is what people screenshot. Lean into it.

| Persona | Referral likelihood |
|---|---|
| TRADER-GAMER ×5 | 🟢 **your amplifiers** — 2–3 will post/tell people *if* there's a moment worth sharing |
| NEW-TRADE ×2 | 🟢 "this taught me trading and it was fun" is a strong personal endorsement |
| TRADER-LOWGAME ×2 | 🟡 only if genuinely surprised |
| NOVICE ×1 | 🟢 *social* referral — "my bf made this and even *I* got it" is the most powerful testimonial you can get **if she succeeds** |

---

## 6 · The scorecard (1–5, per persona × lens)

| | Emotional hooks | Trade feel | Addictiveness | $25 WTP | Virality | **Avg** |
|---|---|---|---|---|---|---|
| **TRADER-GAMER** ×5 | 4 | 3 | 2.5 | 3.5 | 4 | **3.4** |
| **NEW-TRADE** ×2 | 4.5 | 3.5 | 2.5 | 2.5 | 3.5 | **3.3** |
| **TRADER-LOWGAME** ×2 | 3.5 | 3 | 2 | 1.5 | 2.5 | **2.5** |
| **NOVICE** ×1 | 4.5 | 3* | 2 | 1 | 3.5 | **2.8** |
| **Overall** | **4.1** | **3.2** | **2.3** | **2.6** | **3.6** | **3.2** |

\*NOVICE trade-feel is conditional on *reaching* the trade (Report 1). *Scores assume the trade "feels fair but not yet thrilling" — the beta will move the Trade-feel column up or down, and everything moves with it.*

**Reading the scorecard:**
- **Emotional hooks (4.1)** and **Virality (3.6)** are your strengths — Finn + the quest + the concept.
- **Trade feel (3.2)** is the *fulcrum* — it's mid, and it multiplies everything.
- **Addictiveness (2.3)** is the structural weakness — a linear campaign with the uncertainty deliberately removed.
- **$25 WTP (2.6)** is entirely gated by trade-feel and the value bridge.

---

## 7 · Predicted beta outcome (the 10 friends, today)

| Milestone | Predicted (of 10) | Gated by |
|---|---|---|
| Reach the first trade | **8** (NOVICE + 1 TRADER-LOWGAME at risk) | traversal wall (Report 1) |
| Complete first trade & feel it | **6–7** | trade feel |
| Beat Guardian 1 | **7–8** (unloseable) | reaching it |
| Reach Boss 3 | **5–6** | mid-game pacing + "one more" pull |
| **Would pay $25** | **3–4** *(1–2 if trade stays flat)* | trade feel × value bridge |
| **Would actively tell a friend** | **3–4** | a shareable moment |

**The two numbers that decide the beta:** *complete-first-trade* (gated by the traversal wall) and *would-pay* (gated by trade feel). Both are addressable before next week — see Report 3.

*Audit only. No code, gameplay, or canon was changed.*
