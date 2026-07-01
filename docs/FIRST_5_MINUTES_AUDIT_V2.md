# ChartQuest — First 5 Minutes Audit V2

**Build:** live v72 · **Save:** genuinely cleared (`cq_played` removed; intro + onboarding triggers confirmed firing for a brand-new player; real save backed up and restored after).

**Method note (read this):** I cleared the save and verified live that a true new-player session triggers correctly — the opening cinematic, the contextual control coach, the guided intro flow, the "Guardian 1 / 11" goal HUD, and Level 1 all activate from a cold start. The cinematic, skip card, and the candle-platforming are drawn on a `<canvas>` (not inspectable as text), and the desktop was being shared by a second process running the iOS QA build, so a clean frame-by-frame screen capture wasn't possible. Every claim below is therefore grounded in what the **shipped build actually presents** — exact on-screen text, trigger thresholds, and timing read from the live deployed source and live game state — not assumptions about the design.

---

## What a stranger actually experiences (cold open → first trade)

| Time | What happens | What the player sees |
|---|---|---|
| 0:00 | Title / auth | Turtle mascot, "CHARTQUEST", tagline **"Trade Smart. Level Up. Defeat Bosses."**, SIGN IN / SIGN UP / **Play as Guest (progress won't save)** |
| ~0:03 | Opening cinematic begins | Glitch screen: `> reconstructing wallet_` over a dark, broken chart |
| ~0:06–0:14 | Market Maker reveal | A cosmic hooded villain; 4 lines build to **"◆ THE MARKET MAKER ◆ · THE FINAL GUARDIAN · 11 OF 11"** |
| ~0:15 | Portal + button | Black-and-gold portal with **"⚜ ENTER THE MARKET ▸"** — player must click to proceed |
| ~0:17 | Fall + land | Turtle falls through shells (1 each) and lands on the live chart |
| 0:18 → | Level 1 gameplay | HUD: **⚔ GUARDIAN 1 / 11** + **"⚔ Reach GUARDIAN 1 · N candles to go"** + progress bar |
| 0:18 → | Control coach | One hint at a time: **👆 TAP to JUMP** → **⬆️ SWIPE UP to BOOST** → **⬇️ SWIPE DOWN to TUCK** |
| ~1:00–2:00 | Flash Quiz portal | At ~candle 48 a **FLASH QUIZ** portal appears ("⬆ BOOST TO ENTER"); auto-starts by candle 58 |
| (quiz) | 3 can't-fail cards | "QUICK! What color is this candle?" green→"🟢 Buyers won", red→"🔴 Sellers won", doji→"⚖️ DOJI! Pure indecision" |
| **first trade** | Prediction Bet | **"Watch the candle form… bet where it CLOSES!"** → call green/red → **🏆 FIRST WIN! "You read the chart — and it paid off"** + shells/XP, logged to journal |
| after | First real setup → The Gambler | A free trade window, then the first Guardian boss |

So: **first spectacle ≈ 6 seconds** (the villain reveal). **First trade ≈ 1.5–2.5 minutes** (the Prediction Bet), which the build deliberately targets inside the first 1–2 minutes of gameplay.

---

## The 10 questions — answered

1. **Does it immediately communicate its purpose?** *Partial (6/10).* The title tagline says it plainly, but it's small and on the auth screen. The cinematic that follows is atmospheric and cryptic — a glitch and a cosmic villain — and never says the words "learn to trade." A stranger could watch the whole intro and still not be sure if this is a trading tutor or a generic mobile platformer.
2. **Does the player understand the objective?** *Yes (9/10).* "GUARDIAN 1 / 11" + "Reach Guardian 1 · N candles to go" + a progress bar is explicit, persistent, and the single strongest clarity element in the build.
3. **Do they understand why they're on the chart?** *Partial (6/10).* They're told *how* to move (jump/boost/tuck) but not *why the world is a price chart*. The link "this chart is the market you're here to master" is implied, not stated.
4. **How long until the first exciting moment?** *Fast — ~6s* (the Market Maker reveal), *if they watch the cinematic.* First **gameplay** excitement (the Flash Quiz) is ~1–1.5 min.
5. **How long until the first trade?** *~1.5–2.5 min* (the Prediction Bet at candle ~48–58).
6. **Does the first trade feel important?** *Yes (8/10).* It's gated, the screen darkens to spotlight it, the win is celebrated big ("🏆 FIRST WIN!"), and it's written into the journal as a milestone.
7. **Do they understand what they're predicting?** *Yes (9/10).* "Bet where the candle CLOSES" — a binary green/red call on a candle forming in front of them. Crystal clear, and engineered so the first one wins.
8. **Is there confusion?** *Some.* The cinematic's purpose; the platformer-vs-trading connection; and on **desktop**, the controls (hints say "TAP/SWIPE", but desktop needs Space/arrows, which are never surfaced).
9. **Is there friction?** *Some.* The cinematic length + the required ENTER click; ~1–2 minutes of jumping before the first trade; desktop control discovery.
10. **Would a complete stranger keep playing?** *Depends entirely on who they are* — see the verdict. Trading-curious: probably yes. Random gamer with no trading interest: genuinely at risk.

---

## Trade audit — the Prediction Bet (the most important moment)

- **Timing:** good. ~1.5–2.5 min from launch — early enough to hook, late enough that controls are learned first.
- **Presentation:** strong. The world darkens, the forming candle is spotlit, and the call is reduced to two buttons. This is the most focused, well-staged screen in the first 5 minutes.
- **Clarity:** excellent. "Where will it CLOSE — up (green) or down (red)?" is the simplest possible first trade. No SL/TP/leverage/jargon. A child could answer it.
- **Excitement:** strong. The candle animates as it forms, then resolves; a correct call fires a full "🏆 FIRST WIN!" celebration with shells + XP.
- **Outcome:** engineered to win, then logged to the journal ("you called the close before it printed"). A memorable, repeatable dopamine beat — and it doubles as the first entry in the new Knowledge/Trades journal.

**Verdict on the trade:** this is the build's best moment. The problem isn't the trade — it's everything a stranger has to sit through *before* they trust that this moment is coming.

---

## Onboarding audit

- **Information overload:** Low. Controls are taught one hint at a time; no tutorial wall; concepts are gated. This is handled well.
- **Missing information:** The *premise.* Nobody ever says, in plain words on screen during play, "you are learning to trade by reading these candles." And on desktop, the keyboard controls are missing from the hints entirely.
- **Confusing UI:** Minor. The biggest is mobile-phrased control hints on desktop.
- **Unclear goals:** Not really — the Guardian goal HUD is excellent. The unclear part is the *fantasy logic*: why does a turtle jumping on candles defeat a "Market Maker"?
- **Poor pacing:** The cinematic → land → ~48 candles of platforming → first trade is a touch back-loaded for an impatient stranger. The reveal is front-loaded (good), but the *interactive* payoff (trading) is ~1–2 min out.

---

## Top 10 Issues

1. **The premise is never stated in-play.** A stranger can reach the first trade without the game ever saying "this is a trading game." Purpose is implied, not declared.
2. **Desktop control hints are wrong-platform.** "TAP / SWIPE UP / SWIPE DOWN" with no mention of Space / W / S / arrows. A desktop player can stall figuring out boost/tuck.
3. **~1–2 minutes of platforming before the first trade.** For a player who came for the trading hook (or who's impatient), that's a long runway of "why am I jumping?"
4. **Platformer-vs-trading conceptual gap.** The link between "hop on candles" and "learn to trade" is never explicitly drawn; some players won't connect them.
5. **The cinematic asks for patience before earning trust.** ~15–17s of villain lore lands before the player has any idea why they should care about a "Market Maker."
6. **The ENTER-portal gate can read as a dead-end.** A passive viewer expecting the cinematic to auto-continue may sit waiting at the portal, unsure they must click.
7. **"Play as Guest (progress won't save)" undersells itself.** The warning is louder than the invitation; it can scare off the exact low-commitment player it's meant to welcome.
8. **First spectacle (the villain) and first agency (controls) compete.** The most cinematic moment happens while the player has nothing to do, then control arrives once the spectacle is over.
9. **No one-line "what is this" for someone who's never heard of candles.** The flash quiz teaches candle colour well — but only *after* ~1 min; a cold stranger has no candle literacy for the first minute.
10. **Audience mismatch risk is unaddressed.** The build assumes interest in trading. There's no 5-second "you'll learn real crypto trading, as a game" promise to convert the merely-curious.

## Top 10 Wins

1. **Deferred auth / Play as Guest.** No sign-up wall. A stranger can be *in* the game in one tap. Huge retention win.
2. **The goal HUD is excellent.** "GUARDIAN 1 / 11 · Reach Guardian 1 · N to go" + progress bar — always-on, dead clear, motivating.
3. **The Market Maker cinematic is genuinely premium.** Smooth, atmospheric, "final boss" framing — if it lands, it's a real hook and sets long-term stakes.
4. **Controls-first contextual coaching.** One hint at a time, dismiss-on-action, no wall of text. Textbook good onboarding.
5. **The engineered first win is a strong beat.** Gated, spotlit, celebrated, and journaled — a clean early dopamine hit you can't fail.
6. **The first trade is the simplest possible.** Binary green/red close call — zero jargon, maximum confidence-building.
7. **The flash quiz builds candle literacy gently.** Green/red/doji, can't-fail, with plain-language explanations ("Buyers won").
8. **Concept gating means no jargon overload.** Thanks to the Journal/discovery work, a beginner never sees BOS/VWAP/etc. before learning them — the first 5 minutes stay clean.
9. **Clear escalating fantasy.** 11 Guardians, a named final villain — there's an obvious "ladder" that promises depth.
10. **The turtle + candle-world is charming and distinctive.** It doesn't look like every other trading app; the mascot gives it personality and shareability.

## Biggest Confusion Points
- "Is this a trading game or a platformer?" (unresolved for ~1 min)
- Desktop controls (touch-phrased hints, no keyboard prompt)
- "Why does jumping on candles fight a Market Maker?" (fantasy logic)
- At the portal: "do I click, or does it continue itself?"

## Biggest Excitement Points
- The Market Maker reveal (~6s) — the visual peak of the first 5 minutes
- The "🏆 FIRST WIN!" celebration on the first correct close call
- Landing on the live chart out of the portal (good continuity)
- The Guardian ladder promise ("1 / 11")

## Biggest Retention Risks
1. **The first 60–90 seconds for a non-trader.** Cinematic + platforming with no declared purpose = the window where a stranger bounces.
2. **Desktop players who can't figure out boost/tuck** and conclude the controls are broken.
3. **Impatience to the first trade** — anyone who opened it "to try trading" is made to platform first.
4. **The premise gap** converting curiosity into a clear reason to stay.

## Biggest Opportunities
1. **A 5-second purpose promise** before/over the cinematic: e.g. "Learn real crypto trading — as a game." Converts the curious instantly.
2. **One plain-language line on landing:** "This is a live BTC chart. Learn to read it, and beat the market." Closes the platformer-vs-trading gap in one sentence.
3. **Platform-aware control hints** (show Space/arrows on desktop). Cheap fix, removes a whole class of friction.
4. **Pull a micro-trade earlier** (even a 1-tap "will the next candle be green or red?" in the first ~20–30s) to prove the trading hook before the platforming stretch.

---

## If you could only fix 3 things before launch

1. **Declare the premise in the first 5 seconds.** Put one unmissable line — "Learn real crypto trading. Beat 11 Guardians." — on the title and/or as the cinematic's opening beat. Right now the single biggest risk is a stranger not knowing what game they're in. This is the highest-leverage, lowest-effort fix in the build.
2. **Make controls platform-aware.** Detect desktop and show "SPACE to JUMP · ↑ BOOST · ↓ TUCK" instead of TAP/SWIPE. A desktop player who can't move stops playing in seconds, and the fix is a few lines.
3. **Prove the trading hook before the platforming stretch.** Bring a tiny, instant "green or red?" call into the first ~20–30 seconds (before, or layered into, the early platforming), so the player feels "oh — I'm *trading*" while the cinematic afterglow is still warm. Keep the full engineered first-win where it is; just plant the seed sooner.

---

## Verdict — would a complete stranger keep playing?

**Two different answers, and you should design for the harder one.**

- **A trading-curious / crypto-curious stranger:** *Probably yes.* The cinematic impresses, the goal is clear, auth is out of the way, and the first win is satisfying. The onboarding craft here is genuinely good.
- **A random mobile gamer with no trading interest:** *Coin-flip, leaning risky.* The platforming is competent but not best-in-class, and the thing that makes ChartQuest special — the trading — is gated behind ~1–2 minutes and never announced. They may quit before the hook fires.

**The honest bottom line:** the *onboarding mechanics* (deferred auth, contextual controls, engineered win, goal clarity, jargon gating) are strong and clearly the product of real iteration. The remaining risk isn't mechanical — it's **communication**. The game is shy about saying what it is. Tell the stranger, in the first five seconds, that they're about to learn to trade and beat 11 Guardians — and the same five minutes that's currently a coin-flip becomes a confident yes.
