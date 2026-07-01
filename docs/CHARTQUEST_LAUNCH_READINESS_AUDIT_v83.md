# ChartQuest — Launch Readiness Audit (Levels 1–2, build v83)

**Lens:** a complete beginner — no trading, no charts, no crypto — on a phone, through Guardian 1 and Guardian 2.
**Tone:** brutal. This is a consultant report optimizing for retention, learning, and eventual paid conversion. Nothing here is to protect feelings.

> **One-line verdict:** The *teaching* is now genuinely good. The *first boss* is not — it tests skills the game never taught, and that single mismatch is the difference between a friend-test-ready build and the one you have. **Not friend-ready yet. One focused fix changes that.**

---

## PRIMARY QUESTION — 10 beginners install today

| # | Outcome | Estimate | Justification |
|---|---|---|---|
| 1 | **Reach Guardian 1** | **8 / 10** | Intro is well-paced: cinematic (skippable) → "play first" → can't-lose first win → one-tap first trade. Persistent lesson means nobody is lost on "what's green/red." Lose ~2: the impatient (bounce in first 30s / "not for me") and the occasional auth/confusion drop. Play-as-Guest removes a wall. |
| 2 | **Beat Guardian 1** | **5 / 10** (≈60–65% of reachers) | **This is the weak point.** The Gambler's 3 rounds reuse generic library drills. "Candle Lab" can demand building a **hammer/star** (40% of its archetypes — never taught at L1). "Spot the error" asks for an abstract "impossible candle." 3 lives + retry-on-fail saves many, but a chunk rage-quit or grind frustrated. Without that mismatch this would be ~8/10. |
| 3 | **Reach Guardian 2** | **4 / 10** (≈80% of G1-beaters) | Those who beat G1 mostly continue into L2; a few drop in the longer L2 grind (more candles to traverse, two new concepts). |
| 4 | **Understand what they're learning** | **6 / 10** | The persistent lesson + clean popups make green/red/predict stick (≈8/10 on those). Drops on the deeper ideas — "strong close = momentum," support/resistance — which are stated but lightly assessed. "I'm learning to read candles and predict" is real for most; "I understand *why*" for fewer. |
| 5 | **Voluntarily continue past 15 min** | **4 / 10** | Honest. Curiosity + the Guardian ladder pull some forward, but with coins/combos removed the moment-to-moment dopamine is now thinner, and a frustrating Gambler poisons the well for others. The ones who *beat G1 cleanly* are highly likely to continue (~80%); the ones who grind it are not. |

**Funnel headline:** Install → **8 reach G1** → **5 beat G1** → **4 reach G2** → **~4 still engaged.** The single biggest leak is **Beat G1**, and it's fixable.

---

## PART 1 — FIRST 30 SECONDS — **7 / 10**

- **Intro/cinematic (Market Maker):** Atmospheric, sets a "final boss" stakes hook, and is **skippable**. Risk: a brand-new player doesn't yet know *what the game is* while watching a mystical hooded figure — it sells mystery before it sells the game. Fine because SKIP exists, but it's mystery-first, not clarity-first.
- **Auth / wallet screen:** "Play as Guest (progress won't save)" is the right default and removes friction. Good. Minor: it shows LVL/XP/HP chrome that means nothing to a first-timer.
- **Falling-to-chart:** Smooth hand-off into live play; the turtle dropping onto candles reads as "I am this character."
- **First movement:** Tap-to-jump is intuitive; the new **persistent control legend** means the control is never lost.
- **Confused?** Slightly, during the cinematic ("what am I about to do?"). **Too fast?** No — pacing is now good. **Unnecessary?** The LVL/XP/HP on the auth card is noise for a first-timer.

**Could a beginner say what the game is after 30s?** *Mostly* — "a turtle on a real price chart that teaches trading." The cinematic delays that clarity by a few seconds.

---

## PART 2 — FIRST 5 MINUTES (screen-by-screen)

| Beat | Supposed to learn | Clear? | Retained? | Overload? |
|---|---|---|---|---|
| Persistent lesson (always on) | green=up / red=down | ✅ | ✅ (it never leaves) | No |
| "📡 live market" (1 line) | the chart is real | ✅ | n/a | No |
| Flash Quiz (1 card) | green = up | ✅ | ✅ | No |
| Prediction Bet (first win, +5) | predict the close | ✅ | ✅ | No |
| First real trade (simple panel) | a trade is a committed prediction | ✅ | ✅ | No |
| Merged "why + 1 clue" card | causal why + confluence seed | ✅ | partial — "confluence" is a big word seeded early | Borderline |
| 🏆 first win | reward | ✅ | n/a | No |
| → The Gambler | apply it | ⚠️ | — | **Yes — see PART 8** |

**Flag:** the only "too much too early" in the first 5 minutes is the word **"confluence"** in the merged card, and then **the Gambler itself**, which jumps from "read green/red" to "construct a hammer / spot an impossible candle." The teaching ramp is gentle; the *boss* ramp is a cliff.

---

## PART 3 — KNOWLEDGE GATE AUDIT

| Concept | First appearance | First lesson | First assessment | Leak? |
|---|---|---|---|---|
| Green candle | L1 instantly (persistent line) | candles_intro (L1) | Flash Quiz (L1) | ✅ none |
| Red candle | L1 instantly | candles_intro (L1) | Flash Quiz (L1) | ✅ none |
| Strong close | L1 setups/banner | momentum setup (L1) | first trade (L1) | ✅ none |
| Momentum | L1 (plain "strong close") | implicit L1 | first trade | ⚠️ *named lightly* — taught as "strong close keeps going," not labeled "momentum" until later. Acceptable. |
| Long / Short | L1 trade panel (as UP/DOWN) | long_vs_short (L1) | first trade | ✅ none (jargon hidden behind UP/DOWN) |
| Support | L2 | support_resist (L2) | L2 setups + Boss 3 | ✅ gated to L2 |
| Resistance | L2 | support_resist (L2) | L2 setups | ✅ gated to L2 |
| Break of Structure | L3 only | bos (L3) | Boss 3 | ✅ gated |
| Order Block | L4 only (no longer launches/teal-pads at L1) | ob (L4) | Boss 4 | ✅ gated + mechanic removed |
| Confluence | **L1 merged card (word seeded)** + L10 lesson | confluence (L10) | L10 | ⚠️ **the WORD appears at L1** in "that was 1 clue (confluence)." Concept-light, but the term precedes its lesson by 9 levels. |
| VWAP | L6 | vwap (L6) | Boss 6 | ✅ gated |
| Risk/Reward | L5 (HUD chip leak fixed) | what_is_sl/risk_reward (L5) | Boss 5 | ✅ gated (HUD no longer leaks RISK/TARGET at L1–L4) |

**Violations to flag:**
1. **"Confluence" term at L1** (cosmetic, but it's a future term shown early). Either drop the word and say "clue," or accept it as a teaser.
2. **Boss 1 "Candle Lab" → hammer/star** (see PART 8) — a *de facto* knowledge gate violation: the boss assesses candle archetypes never taught in L1. **This is the real one.**

---

## PART 4 — ATTENTION AUDIT (be ruthless)

| Element | Verdict | Note |
|---|---|---|
| Candles | **Necessary** | the subject |
| Turtle | **Necessary** | the avatar/anchor |
| Shells (top-right) | **Necessary** | the score; now meaningful (small economy) |
| Mission HUD (objective) | **Necessary** | "what's next" |
| Persistent lesson line | **Necessary** | the whole point of the persistence sprint |
| L1 control legend | **Necessary (L1 only)** | fades after L1 — correct |
| Portals | **Optional** | useful for "fly in to learn/expand," but another moving target; keep for now |
| Trade prompt banner | **Necessary** | the core action |
| Journal / Wallet / Sign-In bar | **Optional** | irrelevant to a first-timer's first 5 min; already hidden during setup/trade — consider hiding entirely until after Boss 1 |
| Coins | **Removed** ✅ | good |
| Combo callouts | **Removed** ✅ | good |
| Faction badge (₿ BTC) | **Optional** | low harm, low value early |
| Guardian/LVL/XP/fuel cluster | **Necessary-ish** | fuel + Guardian matter; LVL/XP is the least useful number early |

**Ruthless cut list:** hide **Journal/Wallet/Sign-In** until Guardian 1 is beaten (nothing to journal yet); demote **LVL/XP**; the **faction badge** can go for first-timers.

---

## PART 5 — EDUCATIONAL AUDIT — Top 10 weaknesses

1. **Boss 1 assesses untaught skills** (hammer/star construction, "impossible candle"). #1 educational failure: assessment ≠ curriculum.
2. **"Momentum" is felt but never named** in L1 — players learn "strong close keeps going" without the word, so they can't *say* what they learned.
3. **"Confluence" introduced as a word 9 levels before its lesson.**
4. **Support/Resistance is stated, lightly assessed** in L2 — low retention without a drill.
5. **No active recall in L1** beyond the flash quiz — most learning is recognition, not recall.
6. **"Why green closed up = buyers won" is asserted, not shown** — no micro-visual of buyers vs sellers.
7. **Doji taught, then rarely reinforced** before it can appear in a boss.
8. **The merged "why + clue" card does two jobs** — causal why AND confluence seed — splitting attention at the learning moment.
9. **No "you've learned X" checkpoint** — players don't get told what they now know (a confidence/retention booster).
10. **Pattern vocabulary (hammer/star) leaks via the drill engine**, not the curriculum — the library drills aren't level-aware.

**Retained:** green/red, predict, long=up/short=down. **Forgotten/weak:** momentum (unnamed), support/resistance (under-drilled), confluence (premature). **Too fast:** anything pattern-shaped at Boss 1.

---

## PART 6 — RETENTION AUDIT — Top 10 quit moments (ranked)

| # | Moment | Why they quit | Severity | Fix |
|---|---|---|---|---|
| 1 | **Gambler "Candle Lab" asks for a hammer/star** | "I was never taught this" → unfair | 🔴 Critical | Restrict Boss 1 Candle Lab to bull/bear/doji; or swap the round |
| 2 | **Gambler "impossible candle" round** | abstract, no lead-up | 🔴 High | Add a 1-line primer, or make it the optional 3rd hit only |
| 3 | **Repeated boss retries** burning lives on the same hard round | frustration loop | 🔴 High | Vary the round on retry; show a hint after a miss |
| 4 | **Build-a-candle drag on a small phone** | fiddly O/H/L/C handles | 🟠 Med | Bigger touch targets / snap-to-grid |
| 5 | **Cinematic before understanding the game** | impatience | 🟠 Med | Tighten to <12s or show a one-line "what this is" first |
| 6 | **15-min mark, thinner dopamine** (coins gone) | "what's the point of moving" | 🟠 Med | Replace coin-chasing with a learning streak / "reads nailed" counter |
| 7 | **Persistent lesson too faint to notice** (22%) | misses the reinforcement | 🟡 Low-Med | Device-tune opacity to ~30% |
| 8 | **Second staked bet can LOSE shells** right after the free win | "the game took my reward" | 🟡 Low-Med | Soften or signpost the stake clearly |
| 9 | **L2 traversal feels long** | boredom between trades | 🟡 Low | Shorten L2 candle count or add setups sooner |
| 10 | **"Confluence" word with no payoff** | mild confusion | 🟡 Low | Say "clue," save the word |

---

## PART 7 — MOBILE AUDIT

| Check | Status |
|---|---|
| Hidden labels | ✅ fixed (HUD stats moved off the faction badge/source line) |
| Clipped text | ✅ no known clip after the y82 sub-HUD move (verify on smallest phones) |
| Overlapping UI | ✅ fixed (setup CTA + close-position no longer overlap the nav bar; stats overlap fixed) |
| Unreadable charts | ✅ candles legible; ⚠️ persistent lesson at 22% — verify it doesn't fight tall candles |
| Accidental tap conflicts | ✅ build-a-candle no longer scrolls the page; setup tap vs jump separated |
| Misleading annotations | ✅ L1 fullscreen leak closed; spotlight ring aligned; OB teal "springboard" removed |

**Flag (needs a device):** persistent-layer opacity legibility; smallest-phone safe-area around the new y82 line; build-a-candle handle size.

---

## PART 8 — TRADE AUDIT (every opportunity before Guardian 2)

- **L1 momentum/pullback setups:** chart logic sound (strong-close / dip-in-trend), trade logic = one-tap prediction, **stop/target auto-handled and hidden** (correct for beginners), reward small (~+8). Educational value: high, clean. ✅
- **Prediction Bet:** round 0 can't-lose (+5), round 1 staked (risk 5 / win 10). Clear. Minor: the *loss* on round 1 can sting right after a win (retention #8).
- **L2 trend/level setups:** introduce "trade with the trend / off a level." Reasonable. Verify only trend/level setups surface (no early structure).
- **Boss 1 "trades" (the rounds):** ⚠️ **this is where it breaks.** The Candle Lab round isn't a *trade* — it's a candle-construction drill that can require **untaught archetypes**. The "error" round is data-integrity trivia, not a trade read. **Flag: Boss 1's rounds don't match the trading skill the first 5 minutes built.**

**Charts that could confuse a beginner:** the Boss 1 Candle Lab (hammer/star prompt) and the "impossible candle" — both before Guardian 2.

---

## PART 9 — FUN AUDIT (ignore education)

| Axis | Score | Note |
|---|---|---|
| Curiosity | 7 | Guardian ladder + Market Maker mystery pull |
| Satisfaction | 6 | first win + trade payoff feel good; thinner without coins |
| Clarity | 7 | you always know what to do now |
| Progression | 6 | levels + bosses read as progress; economy small but meaningful |
| Excitement | 5 | calm-but-flat between trades; boss is the spike |
| Achievement | 6 | beating a Guardian feels earned — *if* you beat it |
| **Overall fun** | **6 / 10** | A competent, calm learning game. Not yet a "one more level" hook. |

---

## PART 10 — FRIEND-TEST READINESS

1. **Is it ready?** **No — not for 5 cold friends tomorrow.**
2. **Why not?** A meaningful fraction will hit the Gambler and be asked to do something the game never taught (hammer/star, impossible candle), then blame the game, not themselves. First impressions from a friend test are unforgiving; the boss mismatch will dominate the feedback.
3. **Remaining blockers:** (a) Boss 1 round/curriculum mismatch; (b) retry loop on hard rounds; (c) build-a-candle touch ergonomics; (d) unverified device polish (persistent-layer opacity, smallest-phone layout).
4. **Top 5 fixes by impact:** below.

---

## FINAL OUTPUT

- **Overall score:** **68 / 100** — strong teaching foundation, held back by a launch-blocking boss mismatch and unverified device polish.
- **First-boss completion estimate:** **~60% of reachers** (≈5/10 of all installs) — and most of the *failure* is unfair, not skill.
- **First-boss enjoyment estimate:** **~5.5/10** — satisfying when won cleanly, frustrating when ground out.
- **Educational effectiveness:** **~7/10** for the *taught* L1 core (green/red/predict, persistently reinforced); **~5/10** once you count momentum-unnamed, under-drilled S/R, and premature "confluence."
- **Friend-test verdict:** **HOLD.** One sprint (fix the Gambler's rounds) flips this to "send it."

---

## TOP 10 ACTIONS TO TAKE NEXT (highest → lowest impact)

1. **Make Boss 1's rounds curriculum-true.** Restrict the Candle Lab archetypes to **bull/bear/doji** at Guardian 1, and gate "hammer/star/impossible candle" to later bosses. Single highest-leverage retention + fairness fix. *(I found the exact spot: the `error`/`candle` drill generators and the Gambler's `rounds` array.)*
2. **Vary the round + show a hint on a boss retry**, so a stuck beginner learns instead of grinding the same wall.
3. **Name "momentum"** explicitly in L1 (one persistent-lesson swap or one card) so players can *say* what they learned.
4. **Hide Journal/Wallet/Sign-In until after Guardian 1** — pure attention budget; nothing to journal yet.
5. **Device-tune the persistent layer** (opacity ~30%, smallest-phone safe-area, build-a-candle handle size). Quick, removes the last mobile unknowns.
6. **Add a "you now understand candles ✓" checkpoint** after the first trade — a confidence/retention beat that also tells players what they learned.
7. **Replace coin-chasing with a learning streak** ("3 reads nailed 🔥") so the 15-min dopamine gap (post-coin-removal) is filled with *educational* reward, not arcade farming.
8. **Soften or signpost the staked second bet** so the first "loss" doesn't read as the game clawing back the reward.
9. **Drop or de-emphasize the word "confluence" at L1** (say "clue") until its real lesson.
10. **Tighten the opening cinematic** (<12s, or a one-line "what this is" before the mystery) to protect the impatient first-timer.

**Bottom line, no sugar:** you fixed the teaching and the clutter; that work is real and it shows. But you're assessing beginners on material you didn't teach, at the exact moment that matters most — the first boss. Fix the Gambler's rounds (Action 1) and you go from "promising but not ready" to "send it to friends." Almost everything else is polish.
