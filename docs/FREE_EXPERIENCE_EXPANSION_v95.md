# ChartQuest — Free-Experience Expansion & Paywall Rebuild

**Sprint goal:** stretch the free run from ~5–7 min to **15–25 min**, so the player reaches the paywall *transformed* — not rushed. Chosen approach (your call): **phased delivery** + **mastery gates** (Guardians unlock after demonstrated skill, not a timer).

**This document = the 8 requested deliverables.** Phase 1 (paywall + roadmap + leak report + lesson-panel lock) is **built and live on v95**. Phase 2 (pacing expansion + portal redesign + journal integration) is **designed below, implementation pending your review**.

---

## 1 · Guardian 1 pacing audit (Game Start → The Gambler)

**Current flow:** intro cinematic → land on chart → Flash Quiz (green/red) → Prediction Bet → first trades (tradeGate: 3 trades / 2 wins) → **Guardian 1 (The Gambler)**.

**What's good:** the curriculum is clean and the boss is fair (predict / who-won / build — all taught). Trade outcomes are now confidence-biased (~78% win at L1).

**Too short / thin:**

- Only **one** Flash Quiz and **one** Bet before live trades — recognition isn't yet recall.
- The trade gate (3 trades / 2 wins) is the *only* mastery requirement; a fast player blitzes it in ~2 min.
- Movement is taught once (persistent panel) but never *practiced* as its own beat.
- Green/red is drilled ~3× — solid, but momentum ("strong close") gets far less repetition before it's tested.

**Phase 2 additions (mastery-gated):** a second recognition drill, a short "call 3 in a row" momentum streak, one extra guided trade with a review, and a first **journal review** beat — the Gambler's door opens only after: **5 correct predictions + 3 trades (2 wins) + 1 journal review.** Target: **~8–12 min** to Guardian 1.

## 2 · Guardian 2 pacing audit (Guardian 1 → The False-Breakout Eel)

**Current flow:** L1 cleared → L2 lessons (trend, support/resistance) → tradeGate → **Guardian 2 (Eel)** → capstone → **paywall**.

**Too aggressive:** L2 introduces *trend* AND *support/resistance* AND *confirmation/fakeouts* back-to-back, then tests them — before the player has repped any of them. Confidence hasn't formed when the Eel arrives.

**Phase 2 additions (mastery-gated):** more momentum/continuation practice, 2–3 "real break vs fake break" confirmation drills (interactive, not reading), extra trade-review moments that name the concept, and a second journal review. The Eel's door opens only after demonstrated confirmation reads + trades + journal use. Target: **~8–12 min** between Guardians.

## 3 · New estimated time-to-paywall

| | Guardian 1 | Guardian 2 | Total to paywall |
|---|---|---|---|
| **Now** | ~3–4 min | ~2–3 min | **~5–7 min** |
| **After Phase 2** | ~8–12 min | ~8–12 min | **~16–24 min** ✅ |

Hits the 15–25 min target via mastery gates, not filler — every added minute is a practiced skill.

## 4 · Guardian roadmap design — ✅ BUILT (v95)

The paywall now renders the **entire 11-Guardian arc** as a scrollable roadmap, generated live from game state:

- **Mastered** (beaten): full-color, green "✓ MASTERED".
- **Up Next** (frontier): gold, glowing, "▶ UP NEXT".
- **Locked** (×8): dimmed 🔒 with a one-line *skill teaser* (the benefit, never the lesson mechanics).
- **The Market Maker**: purple "◆ FINAL".

The 11 rows in order: The Gambler · The False-Breakout Eel · The Trend Crab · The Structure Serpent · The Order-Block Golem · The Risk Hydra · The VWAP Oracle · The Margin King · The Timeframe Titan · The Confluence Kraken · **The Market Maker**. Scrolling past eight locked Guardians is deliberate — it makes "I've seen a sliver of this" *visceral*.

## 5 · Updated paywall screen — ✅ BUILT (v95)

Rebuilt around **transformation**, not spend:

1. **"You started knowing nothing. Look how far you've come."**
2. **Skills earned** as green chips: Read a candle · Spot momentum · Wait for confirmation · Go long or short · Journal your trades.
3. **"You've cleared 2 of 11 Guardians"** → the full roadmap.
4. Outcome-anchored price: *"Nine more skills. Nine more Guardians. One Market Maker."* — **$24.99 · one-time · yours forever**.
5. Two honest choices: **UNLOCK** / *Not now — keep exploring*.

Shell counts and "9 Guardians remain" are gone from the headline; the focus is growth + the visible adventure ahead. (The checkout hook `cqStartCheckout` / `window.CQ_CHECKOUT_URL` is unchanged — wire your real checkout there.)

## 6 · Term-leak report — ✅ CLEAN (free experience, L1–L2)

Audited every advanced term against its intended unlock level. The gating systems are comprehensive:

- **`conceptTier(key)`** returns 0 (hidden) for any concept whose level hasn't been reached — labels/banners render plain words or nothing until then.
- **`teach(key)`** is curriculum-gated: a lesson fires only if it's in the *current* level's focus list.
- **`setupLevelUnlocked(type)`** gates trade setups (momentum L1, pullback L2, **bos/choch L3**, **ob L4**, vwap L6) — no structure setup can fire early.
- In-game **OB / BOS candle labels** are tier-gated (hidden at L1; verified at render).
- The **HTF structure view** (which draws BOS/OB labels) is locked behind `conceptTier('htf') >= 1` = **L8** — by then BOS (L3) and OB (L4) are long taught.

**Result: no untaught term (BOS, Break of Structure, Order Block, Liquidity, Leverage, ChoCh, VWAP, Confluence) leaks into the L1–L2 free experience.** The two historical leaks — the BOS card in the "READ THE CHART" fullscreen and the "exhaustion wick" wording in the predict round — were fixed in v92. *(Advanced terms do appear on the post-Guardian-2 paywall roadmap — that's intentional future-teasing, after the free content, not a leak.)*

## 7 · Journal integration report — DESIGNED (Phase 2)

**Current state:** the Trader's Notebook exists, is introduced at the first trade, and stores every trade — but it's **passive**; nothing requires the player to *open and use* it, so most won't.

**Phase 2 plan — make it a graded step in the mastery gate:**

- A **guided first review**: after the first trade, the game walks the player into the Notebook once ("here's your trade — here's what you did right"), as an interactive beat, not a popup.
- **"Why traders journal"** delivered as a 1-question interaction, not a paragraph.
- A **journal-review requirement** baked into each Guardian's unlock gate (you can't reach the boss until you've reviewed at least one trade), so revisiting is a habit, not an option.
- Surface **"revisit a lesson"** from inside the Notebook so it's also the place lessons live.

## 8 · Predicted conversion improvement

Rough, honest estimate (no live analytics yet):

- **Longer, mastery-paced free run** → players arrive at the paywall having *felt* the transformation, which is the single biggest driver of willingness to pay. Expect the largest lift here.
- **Roadmap visibility** → "I've seen 2 of 11" reframes the ask from "pay to continue" to "pay to finish an adventure I'm already in."
- **Transformation-first copy** → anchors $24.99 to skills gained, not content gated.

**Directional estimate: a meaningful multiple on baseline conversion** (most of it from pacing + roadmap). I'd want a simple funnel event at the paywall (shown / unlocked / "not now") to measure it for real — easy to add when you wire checkout.

---

### Status
**Phase 1 — LIVE on v95:** roadmap, paywall rebuild, term-leak audit (clean), lesson-panel lock (confirmed static, one line per level). **Phase 2 — awaiting your go:** mastery-gated pacing for Guardians 1 & 2, empty-portal redesigns (every portal gets a decision/prediction/drag/identify task), and journal integration. Say the word and I'll start Phase 2.
