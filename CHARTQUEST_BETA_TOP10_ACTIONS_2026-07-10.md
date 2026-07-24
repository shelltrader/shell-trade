# ChartQuest — Top 10 Actions Before Beta (ranked by needle-move)
**Date:** 2026-07-10 · **Build:** 261 · **Report 3 of 3.** Pairs with the Onboarding audit + Retention audit.
**Beta:** 10 friends next week · **Success metric:** reach Boss 3 → feel it was fun/rewarding → want to pay $25 → tell a friend.
**Focus lenses:** ① emotional hooks ② trade feel ③ addictiveness ④ $25 WTP ⑤ virality.

> **If you do only THREE this week, do #1, #2, #3.** They protect the two numbers that decide the beta — *complete-first-trade* and *would-pay* — plus the first 15 seconds everyone sees. Everything else compounds them.

**Legend — Impact:** 🔴 decisive · 🟠 high · 🟡 useful. **Effort:** S/M/L. **Prot:** touches a protected system (needs your pre-flight + OK).

---

## The ranked list

### 1 · Make the trade *feel* rewarded, not just fair 🔴  ② ③ ④
**Effort L · Prot #9 (trading)**
The lever the whole beta turns on. TES made outcomes *fair* (authored, coached First Loss). It did **not** prove they *feel* thrilling — your own note was *"click buttons, no meaning."* The machinery already exists (live P&L, the `tradeDrivenCandle` dip→hold→recover→run arc, ~30-candle duration) — **it's under-dramatised, not missing.**
**Do:** make the **live P&L the loud star** (big, colour-pulsing, green↔red as it swings); stretch the **felt dip** so they *sweat* it; land a **payoff moment** at the close (number slams up, sound swell, shells burst). A scoped "felt-stakes" pass — no need for the full Option-B rebuild to make trade 1.1 *land*.
**Saves:** everyone; converts "fair but flat" → "I have to do that again." **Moves WTP from ~1–2 → ~3–4 of 10.**

### 2 · Break the traversal wall before the first trade 🔴  (onboarding funnel)
**Effort M · Prot #4 (movement — level-design/prompt parts may not be)**
The hidden leak: floaty boost + sparse world means non-gamers hover and stall *before* they ever feel a trade (I did, repeatedly). Your girlfriend + a low-gamer are at real risk here.
**Do (pick the cheapest that works):** shorten the run to setup #1; tame boost height / add a touch more "forward pull"; add a gentle breadcrumb/arrow (*"this way →"*) toward the setup; or auto-assist the *first* traversal so nobody can get stuck. Verify on touch, beginner mode.
**Saves:** NOVICE, TRADER-LOWGAME. **Moves complete-first-trade from ~6–7 → ~9.**

### 3 · Cold-open safety net 🟠  ① (first impression)
**Effort S**
The literal first 15s is a **video that can black-screen.** One stalled load = an instant bounce, before anything.
**Do:** show a **static hero image immediately** (the key art) behind/instead of the video; make **SKIP appear instantly**; fall back to the static frame if the video hasn't painted in ~1.5s.
**Saves:** all 10 from a first-impression face-plant.

### 4 · Turn the first win into a *moment* 🟠  ① ⑤ (emotional peak + shareability)
**Effort S–M**
The first win currently rewards you with *information* (trophy, journal). It should reward you with *feeling*.
**Do:** screen-shake, a rising sound sting, **shells raining**, Finn's biggest cheer-hop, a bright "FIRST WIN!" flourish. This is the dopamine hit that makes them keep going and *screenshot it*.
**Saves:** NOVICE + NEW-TRADE especially; seeds virality (#5).

### 5 · Build one shareable artifact 🟠  ⑤ (virality)
**Effort M**
Your 5 TRADER-GAMERs are the amplifiers, but there's **nothing to share.** The concept is viral ("a turtle trading inside a live BTC chart"); give them the picture.
**Do:** a one-tap **share/screenshot card** at the milestones people brag about — *"I beat The Gambler,"* *"First win: +2.3R,"* a **rank badge**, or Finn holding the trophy. Finn is the meme vector — put him on the card.
**Saves:** referral from the 3–4 friends most likely to post.

### 6 · Make the $25 feel like "continue the adventure" 🟠  ④ (WTP)
**Effort M · Prot #5 (monetization — building the value screen, not the charge)**
They only see the price after Boss 3 (good). But WTP dies if it's a bare *"Buy $25."*
**Do:** at the gate, **light up the locked map** — the 7 remaining Guardians, the **Market Maker finale**, the deep market, the Journal they've been filling. Frame: *"You've escaped the shallows. The deep market — and 7 Guardians — await."* Show, don't ask. (And confirm the checkout stub is real + polished before any friend reaches it.)
**Saves:** conversion of the TRADER-GAMER + NEW-TRADE buyers.

### 7 · Fill the world — "market breathing" 🟡  ① (premium feel)
**Effort M**
2–3 candles on a huge empty screen reads *low-budget* and makes navigation feel aimless — the opposite of "the chart is the world."
**Do:** author gentle candle **density/consolidation between setups** (visual only, inside the driven-candle engine) so the market feels alive and the path reads. Already on your own P2 backlog (first-hour doc #2).
**Saves:** the "premium feeling" for all; supports #2 (a fuller path pulls them forward).

### 8 · Hide the dev build tag on the play screen 🟡  (trust/polish)
**Effort S (trivial)**
*"build 261 — REVERT V3 weight-model…"* is rendered across the top of gameplay. Your friends will read an internal engineering string and think *unfinished.*
**Do:** show it only under `?qa=1`. Five-minute change; do it today.
**Saves:** the "is this a real product?" gut-check for all 10.

### 9 · Add a beginner-safe compulsion loop 🟡  ③ (addiction / week-2 retention)
**Effort M · (post-beta candidate)**
It's a linear campaign — satisfying, not compulsive. You *correctly* removed unfair losses, which also removed the uncertainty that drives "one more." Re-add the pull on **safe** surfaces:
**Do:** a **rank ladder** that always dangles ("2 trades to Shrimp"), **varying shell payouts** (variable reward without unfair loss), **collectible Guardian trophies**, and (post-Boss-3) an **endless/challenge** mode. *Never* re-introduce random stop-outs.
**Saves:** the TRADER-GAMERs' long-term retention — the ones who'd otherwise finish and drift.

### 10 · Instrument the 10-friend funnel 🟡  (turns the beta into data)
**Effort S**
Ten humans is a *research goldmine* only if you capture where each one drops.
**Do:** log a quit-point per friend — `first_movement · first_setup · completed_first_trade · beat_guardian_1 · reached_L2 · hit_first_loss · reached_boss_3 · saw_paywall · would_pay`. You already have duration + confidence telemetry (build 256) — extend it. Then the beta *tells you* whether #1 or #2 was the real leak, instead of guessing.
**Saves:** every future decision — this is how you learn from the beta.

---

## Sequencing for next week

| Ship BEFORE launch (P0) | Ship if time (P1) | AFTER beta, data-informed (P2) |
|---|---|---|
| **#1** felt-stakes trade pass *(scoped)* | **#5** shareable card | **#9** compulsion loop |
| **#2** traversal wall | **#6** $25 value bridge | (deeper trade rebuild — Option B) |
| **#3** cold-open safety | **#7** world density | |
| **#4** first-win celebration | | |
| **#8** hide build tag *(today)* | | |
| **#10** funnel telemetry | | |

## Effort / impact / persona-saved matrix

| # | Action | Lens | Impact | Effort | Prot | Saves most |
|---|---|---|---|---|---|---|
| 1 | Felt-stakes trade | ②③④ | 🔴 | L | #9 | ALL |
| 2 | Traversal wall | funnel | 🔴 | M | #4 | NOVICE, TRADER-LOWGAME |
| 3 | Cold-open safety | ① | 🟠 | S | — | ALL |
| 4 | First-win celebration | ①⑤ | 🟠 | S–M | — | NOVICE, NEW-TRADE |
| 5 | Shareable card | ⑤ | 🟠 | M | — | TRADER-GAMER |
| 6 | $25 value bridge | ④ | 🟠 | M | #5 | TRADER-GAMER, NEW-TRADE |
| 7 | World density | ① | 🟡 | M | — | ALL |
| 8 | Hide build tag | polish | 🟡 | S | — | ALL |
| 9 | Compulsion loop | ③ | 🟡 | M | — | TRADER-GAMER |
| 10 | Funnel telemetry | data | 🟡 | S | — | (you) |

---

## The single most important thing
> **Sit next to each friend and watch their face on the first trade's dip.**
> If they lean in and react — you've won; ship it. If they just click and watch — **#1 is your whole roadmap**, and no amount of polish elsewhere compensates. That five-minute observation, ×10, is worth more than this entire audit.

*Recommendations only. No code, gameplay, or canon was changed. Trade/movement/monetization items are protected systems and need your explicit pre-flight before implementation.*
