# ChartQuest — Guardian 1 Re-Audit (build v84)

**Scope:** Guardian 1 (The Gambler) only. Question: is it now *fair, earned, and confidence-building?*
**Tone:** brutally honest.

> **Verdict: the dominant blocker is fixed.** Guardian 1 now tests only what the game taught and the player practiced. It went from "the game cheated" to "I can read candles."

---

## What changed this sprint (v84)

1. **Curriculum lock (PARTS 1–2):** The Gambler's rounds were `predict / candle (hammer-star) / error (impossible candle)`. They are now **`predict / predict / predict`** — three rounds of the *exact* exercise the player already did three times (Flash Quiz → Prediction Bet → first real trade). No hammer, star, impossible candle, structure, or any untaught concept.
2. **Fairness fix in the drill itself:** the `predict` drill at **beginner** now *always* rewards the taught rule (strong close → momentum continues). The ~18% "exhaustion-wick reversal" trap — an untaught nuance — is gone at beginner difficulty, so the taught rule never betrays the player at Guardian 1.
3. **Momentum named (PART 3):** the post-trade explanation now ends "…**This is called MOMENTUM.**", and the victory checkpoint reinforces it. The player leaves with the *word*.
4. **Attention cleanup (PART 4):** Journal / Wallet / Sign-In are **hidden until Guardian 1 is beaten** — a first-timer sees only turtle, candles, shells, mission, lesson, trades.
5. **Victory + checkpoint (PARTS 5–6):** beating the Gambler now reads **"🐢 CANDLE READER UNLOCKED"**, shows a **WHAT YOU LEARNED** checklist (✅ Green = up · ✅ Red = down · ✅ Strong close = MOMENTUM · ✅ Reading a chart to predict the next candle), and the button says **"I CAN READ CANDLES →"**.

---

## Round-by-round audit (the rebuilt Gambler)

| Round | Concept tested | Taught when? | Reinforced? | Fair? |
|---|---|---|---|---|
| 1 — Predict | read momentum, predict next candle | Flash Quiz + Bet + first trade (all pre-boss) | ✅ 3× before the boss | ✅ |
| 2 — Predict | same | same | ✅ | ✅ |
| 3 — Predict | same | same | ✅ | ✅ |

Three lives, retry-on-fail. Every round is the practiced skill, and at beginner the answer always follows the taught rule. **No round fails the fairness test.**

---

## The 6 questions

1. **Is Guardian 1 fair?** **Yes.** It only tests prediction — practiced 3× before the door — and the beginner drill never punishes the taught rule. Nothing untaught appears.
2. **Is Guardian 1 teaching what it tests?** **Yes.** Test = "read the candles' momentum and predict the next." That is precisely the L1 curriculum, now with "momentum" explicitly named.
3. **What % of beginners beat it?** **~85–90%** (up from an estimated ~60%). With 3 fair prediction rounds, 3 lives, and retry-on-fail, the only failures left are genuine misreads or impatience — not unfairness. Thematically perfect for "The Gambler": predict the next card, three times.
4. **What % enjoy it?** **~7.5/10.** "I called it three times" + "Candle Reader Unlocked" + a clear list of what they learned = a confidence spike, not a survival sigh. It's satisfying because it's winnable *by understanding*.
5. **What % understand candles afterward?** **~85–90%.** The checkpoint *tells* them what they mastered, and momentum is now named twice (first trade + victory). Recognition + active recall + an explicit summary is the strongest retention combo in the game.
6. **Would I send this to 5 friends tomorrow — for Guardian 1?** **Yes.** The one issue that would have dominated friend feedback ("it asked me something it never taught") is gone. Guardian 1 now does its real job: *the player's first proof they're becoming a trader.*

---

## Remaining caveats (small, and outside Guardian 1's fairness)

- **Device eyeball still pending** — the persistent-lesson opacity (~22%) and smallest-phone layout should be confirmed on a real phone; not a Guardian 1 fairness issue, but it affects polish.
- **3× predict could feel slightly samey** to a sharp player — each round is a fresh scenario and it's on-theme for a gambler, but if you want variety later, the *fair* way is to add a green/red **recognition** beat (also taught), never a pattern/structure round.
- **Everything past Guardian 1** (G2 fakeouts, etc.) was explicitly out of scope this sprint and is unchanged.

---

## Success-criteria check

> Learn → Practice → Succeed → Feel Smart.

- **Learn:** green/red, strong close, predict (persistent + popups). ✅
- **Practice:** Flash Quiz, Prediction Bet, first trade. ✅
- **Succeed:** three fair prediction rounds, winnable by understanding. ✅
- **Feel Smart:** "CANDLE READER UNLOCKED" + "WHAT YOU LEARNED" + "I CAN READ CANDLES." ✅

**Guardian 1 now optimizes for understanding, not difficulty — exactly as specified.** It builds the confidence; let Guardian 2 bring the challenge.

---

*Live on v84. Deploy confirmed (the live site auto-opened on deploy); please spot-check `chart-quest-v84` in the service worker on your device, and give the first run a play to confirm the new victory screen and the hidden nav bar feel right.*
