# ChartQuest — Quad Sprint: Learning · Retention · Reflection · Progression (v86)

**Goal:** a player should leave Guardian 1 & 2 feeling smarter, more confident, more capable.
**Scope:** Levels 1–2. **Live on v86.**

---

## CHANGES IMPLEMENTED

**SPRINT 1 — Trader's Notebook.**
- Renamed **Journal → Trader's Notebook** everywhere player-facing (panel header "📓 TRADER'S NOTEBOOK", bottom-bar button "📓 NOTEBOOK", trade-panel "CHECK YOUR NOTEBOOK FIRST", knowledge-discovery "Saved to your Notebook", review hint).
- **First Notebook Moment:** the Notebook bar is **hidden until the player's first trade**, then appears *with* a reflection card: **"📓 NEW NOTEBOOK ENTRY — Your first trade is saved. Great traders review their trades — your 📓 Notebook now tracks every one."** It is never introduced before there's anything to record.
- **Progression view:** the Notebook's KNOWLEDGE tab already shows learned concepts plus **locked "???" slots** for what's ahead — future progression without explanation (curiosity, not confusion). *(Decision note: I kept the existing unnamed "???" locks rather than printing future names like "BOS 🔒", because naming future concepts in the UI is exactly the kind of term-leak the prior sprints removed. The progression/curiosity goal is met without re-leaking names. If you want named teasers, that's a one-line follow-up.)*

**SPRINT 2 — Persistent lesson (retention).**
- The always-on, low-weight top-of-chart reminder now **cycles one concept at a time** (~6.5s each) through the current level's *already-learned* concepts, with the spec wording: `GREEN = BUYERS`, `RED = SELLERS`, `STRONG GREEN CLOSE = MOMENTUM`, `LONG = PREDICT UP · SHORT = PREDICT DOWN` (L1); `SUPPORT = BUYERS DEFEND`, `RESISTANCE = SELLERS DEFEND`, `Trade WITH the trend` (L2). Never a future concept; the set swaps as levels advance.

**SPRINT 3 — Guardian 1 variety (still curriculum-locked).**
- The Gambler's three rounds are now **Predict → Build → Predict** (was 3× identical predict). The Build round reuses the existing Candle Lab **restricted to bull/bear at beginner**, so it only ever asks the player to build a strong GREEN or RED candle — i.e. candle direction + strong close (momentum). No doji/hammer/star, no impossible candle, no structure. Two exercise types instead of one; zero new concepts, zero leaks.

**SPRINT 4 — Reflection moments.**
- The first trade now resolves into a **📋 TRADE REVIEW** card: *You predicted: ↑ UP* → the one-line reason (which names **MOMENTUM**) → the Notebook entry. (This also removed the premature word "confluence" that the launch audit flagged.)
- The Guardian 1 victory's **WHAT YOU LEARNED** checklist now ends with **"📓 SAVED TO YOUR NOTEBOOK."**
- Knowledge-discovery celebrations read **"Saved to your Notebook."**

*All changes parse-checked clean (0 errors) and live on v86.*

---

## PLAYER KNOWLEDGE STATE AUDIT (everything before Guardian 2)

| State | Player knows | First taught | Reinforced | Assessed | Leak? |
|---|---|---|---|---|---|
| 0 | nothing | — | — | — | — |
| 1 | red & green candles | Flash Quiz (pre-G1) | persistent line + bet ("what COLOR?") | Gambler predict/build | ✅ none |
| 2 | strong closes | momentum setup banner ("STRONG GREEN CLOSE") | persistent line | Gambler build (build a strong candle) | ✅ none |
| 3 | momentum (the word) | first-trade TRADE REVIEW ("This is called MOMENTUM") | persistent line + G1 checkpoint | implicit in predict | ✅ none |
| 4 | long & short | long_vs_short + UP/DOWN buttons | persistent line | first trade, Gambler predict | ✅ none |
| 5 | support & resistance | L2 lesson | L2 persistent line | L2 setups | ✅ gated to L2 |

**Per-surface check (before Guardian 2):**
- **Every lesson:** L1 = candles/long-short/close; L2 = trend/S-R. ✅ in-state.
- **Every trade:** momentum/pullback (L1), trend/level (L2). ✅ in-state.
- **Every portal:** fly-in to lessons/expand — gated by `conceptTier`. ✅
- **Every popup:** bet now asks "what COLOR" (State 1); first-trade card names momentum (State 3); no "confluence" word. ✅
- **Every boss challenge:** Gambler = predict + build(bull/bear) only (States 1–3). ✅ **no untaught skill.**

**Violations found:** none remaining in L1–L2. (The two prior leaks — Gambler hammer/star + "impossible candle", and the premature "confluence" word — are both removed.)

---

## EDUCATIONAL RETENTION AUDIT (player quits after Guardian 1)

**Remembered tomorrow (high confidence):**
- 🟩 Green = up / 🟥 Red = down — taught, drilled 4+ times, persistently reinforced, and listed back in the victory checkpoint.
- "I can read a candle and predict the next one" — the whole loop.
- The word **MOMENTUM** — now named at the trade review *and* the checkpoint (2–3 exposures).

**Remembered next week (medium confidence):**
- Green/Red (the stickiest — most repetition).
- Momentum, *if* the word landed (named, but only L1-deep).
- The feeling of "I beat the first boss by understanding, not guessing."

**Most likely forgotten:**
- **Long vs Short as terms** — taught, but the UI uses UP/DOWN, so the *words* long/short are the weakest retention point (deliberately, for beginner clarity).
- Fine detail of *why* a strong close continues (the mechanism, vs the label).

**Recommendations:**
1. Add one **active-recall** beat at the start of Guardian 2's run ("Quick — green means…?") to convert recognition → recall.
2. Keep momentum on the persistent cycle into L2 for a few candles so it doesn't drop the instant the level swaps.
3. Consider surfacing "LONG = UP / SHORT = DOWN" once more at the first L2 trade to firm up the *terms*.

---

## FRIEND-TEST READINESS (5 brand-new players)

| # | Question | Estimate | Why |
|---|---|---|---|
| 1 | Understand the game? | **~9/10** | "A turtle on a real price chart that teaches trading" is clear within a minute; the persistent line + mission make the goal obvious. |
| 2 | Understand candles? | **~9/10** | Drilled, persistently reinforced, and *told back to them* at the victory checkpoint. The single strongest outcome. |
| 3 | Understand momentum? | **~7.5/10** | Now explicitly named (trade review + checkpoint + persistent cycle). Up from ~4/10 when it was only "felt." |
| 4 | Understand long vs short? | **~6.5/10** | They get UP/DOWN solidly; the *words* long/short are lighter by design. |
| 5 | Open the Notebook? | **~6.5/10** | Big jump — it's now introduced *with context* right after the first trade, named like an identity ("Trader's Notebook"), and the button appears at that exact moment. Some still won't tap it, but they're invited at the right beat. |
| 6 | Continue to Guardian 2? | **~7.5/10** | Guardian 1 is now fair, varied (predict/build/predict), and ends on "CANDLE READER UNLOCKED" — a confidence spike that pulls them forward. |
| 7 | Recommend the game? | **~6.5/10** | A clear, confidence-building learning game. Recommendation hinges on the *feeling of getting smarter*, which this sprint directly strengthened. |

**Completion estimate:** ~**85–90%** beat Guardian 1 (curriculum-locked + fair + 3 lives).
**Retention estimate:** materially up — persistence (always-on) + reflection (trade review / checkpoint) + the Notebook give three separate reinforcement channels.
**Confidence estimate:** high — the player is *told* what they mastered ("WHAT YOU LEARNED · SAVED TO YOUR NOTEBOOK") rather than left to infer it.

---

## SUCCESS-CRITERIA CHECK

> Player learns → remembers → improves → feels smarter → wants to continue.

- **Learns:** candles, momentum, predict — taught and practiced. ✅
- **Remembers:** persistent reinforcement + reflection + a Notebook that *stores* the learning. ✅
- **Improves:** Guardian 1 tests the practiced skill in two forms (predict + build). ✅
- **Feels smarter:** "CANDLE READER UNLOCKED" + "WHAT YOU LEARNED" + "your first trade is saved." ✅
- **Wants to continue:** fair, winnable, confidence-ending Guardian 1 → curiosity for Guardian 2. ✅

**A player who reaches Guardian 2 should now feel measurably smarter than when they started** — they can read a candle, they know the word *momentum*, they beat a boss by understanding, and they have a Notebook proving it. Sprint goal met for L1–L2.

---

## REMAINING (small, honest)

- **Device eyeball** still pending: persistent-cycle legibility at ~24% opacity, and the Candle Lab build ergonomics at Guardian 1 (drag handles on a small phone — the touch-scroll bug is fixed, but handle size is unverified).
- **Notebook progression names:** currently "???" locks (no leak); switch to named teasers only if you decide the roadmap should reveal upcoming concept names.
- **Long/Short terms** remain the weakest retention point by design.
- My in-browser version check was blocked again by the transient Chrome-extension disconnect; the deploy is confirmed by the live site auto-opening — spot-check `chart-quest-v86` in DevTools.
