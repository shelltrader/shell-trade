# ChartQuest — First 30 Seconds Rebuild (v105)

**Goal:** the intro must *sell the journey* — purpose before mystery, in plain language a child could follow. By the time the turtle lands on the first chart, the player knows who they are, what they're doing, why it matters, what success looks like, and who the final boss is. **Built & staged in v105.**

---

## 1 · New complete intro script (every line speaks TO the player)

**OPEN (atmospheric, ~3s)** — the turtle washes into the market. No lore dump.

**LEARNING PROMISE (premise, two beats, ~6s)**
- YOU ARRIVED WITH → **NOTHING**
- GAMBLERS GUESS → **TRADERS LEARN**

**THE MARKET MAKER — six mentorship screens (~16s, then ENTER)**
1. "You arrived with nothing. No experience. No plan."
2. "Most people guess here. Most people lose."
3. "Traders do something different. They learn."
4. "My eleven Guardians will teach you. Beat them. Learn from them."
5. "Beat all eleven, then come find me." → **◆ THE MARKET MAKER ◆ · THE FINAL CHALLENGE** (name lands big + audio impact)
6. "Your wallet is empty. Your future is not."
**CTA:** ⚜ **ENTER THE MARKET** ▸

**THE FALL (~8s)** — the player dives toward the first chart; fragments of the world ahead drift past (see §below).

No jargon anywhere. The Market Maker is a mentor/challenge, not a villain.

## 2 · Cinematic storyboard
| Beat | On screen | Feeling |
|---|---|---|
| Open | turtle drifting into a dark market, faint candle pillars | "where am I?" (brief) |
| Promise 1 | "YOU ARRIVED WITH **NOTHING**" | honest, grounded |
| Promise 2 | "GAMBLERS GUESS · **TRADERS LEARN**" (green) | hope — *this is learnable* |
| MM 1–3 | Market Maker's face holds; lines fade in/out one at a time | being spoken to directly |
| MM 4 | "My eleven Guardians will teach you…" | a path appears |
| MM 5 | the **NAME** explodes in, glowing gold-purple + impact | the mountain-top goal |
| MM 6 | "Your wallet is empty. Your future is not." | personal stakes + hope |
| CTA | gold portal + **ENTER THE MARKET** rises | agency — *I choose to start* |
| Fall | turtle dives; GREEN/RED/MOMENTUM/STRUCTURE… stream upward, shells swirl | "there's a whole world ahead" |
| Land | drops onto candle #1, real gameplay gravity | "I get it. Let's go." |

## 3 · Timing map (≈26s of auto-content; the MM is player-paced so most go faster)
- Open / glitch: **3.0s** (was 6.0)
- Premise (learning promise, 2 beats): **6.6s** (was 10.8, 3 beats)
- Market Maker: 6 beats at 1.0 / 3.6 / 6.2 / 8.8 / 11.4 / 14.0s; portal at **16.4s**; player clicks ENTER (no auto-rush, long fallback)
- Fall: **~8s**
Every screen holds ≥2.6s at full opacity — nothing disappears before a first-time mobile reader can finish it.

## 4 · Mobile flow
Portrait canvas. MM lines are two short stacked lines (`<br>`), centered, large, high-contrast over the dimmed Market Maker clip. The ENTER button is a big gold tap target at the bottom; a tap anywhere also descends once the portal is up. The fall is drag-to-steer. No element is wider than the screen.

## 5 · Desktop flow
Identical content in the same centered portrait stage (the game letterboxes to a phone-shaped column). ENTER is clickable; the lines render larger but wrap the same way. Fall steers with drag too.

## 6 · Retention rationale (why each screen earns the next)
- **Open (short):** establishes place without confusing — we *don't* dwell on "system failure" mystery anymore.
- **Learning promise:** the single most important reframe — *this is not gambling, it's a skill you can learn.* It's why a non-trader keeps going.
- **MM 1–2:** names the player's real situation and the trap (guessing) — builds trust by being honest.
- **MM 3:** the turn — "traders learn" — gives hope and a method.
- **MM 4:** introduces the structure (11 Guardians as teachers) so progress feels designed, not random.
- **MM 5:** the name reveal is the aspirational summit — a villain-shaped goal worth climbing toward (and worth paying to reach).
- **MM 6:** personal stakes + hope in one breath — the emotional hook.
- **CTA "ENTER THE MARKET":** the player chooses to begin (agency = commitment).
- **Fall teasers:** plant curiosity about the depth ahead (the same instinct the paywall later converts).

## What shipped in code
- Rewrote the Market Maker from 3 cryptic lines to the **6 plain-language mentorship screens** above, retimed for comfortable reading, with the name reveal + impact on beat 5.
- Replaced the cryptic premise (WALLET NOT FOUND / 0 SHELLS) with the **learning promise** (NOTHING → TRADERS LEARN).
- Shortened the opening glitch (6s→3s) so purpose arrives fast.
- Added **drifting concept teasers** to the fall (GREEN, RED, MOMENTUM, SUPPORT, RESISTANCE, DISCIPLINE, PATIENCE, STRUCTURE) — glowing, never explained.
- CTA already read **ENTER THE MARKET** — kept.

## Honest note
The copy, timing, and concept-teaser code are done and parse-checked, but the *visual feel* of the fall teasers (density, opacity, speed) and the exact line pacing need your eyes on a real phone — all are one-line numbers. Guardian **silhouettes** in the fall I left out for now: drawing convincing dark boss shapes blind is risky, so I shipped the concept-word stream (the explicit list you gave) and flagged silhouettes as a focused visual follow-up.

*Staged in v105.*
