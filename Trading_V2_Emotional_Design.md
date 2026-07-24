# ChartQuest Trading V2 — Emotional Design

**Status:** Design / experience proposal — NOT implemented. **Date:** 2026-07-06.
**Companion to:** [`Trading_Architecture_V2_Blueprint.md`](Trading_Architecture_V2_Blueprint.md). The blueprint is *how it works*; this doc is *what it feels like*. This is emotional design, not architecture.

---

## The core feeling we are selling

The one sentence every mechanic must serve:

> **"I am a patient hunter who reads the water. When I win, I know I earned it. When I lose, it was small and I know exactly why. And I can feel myself getting sharper."**

Finn is a turtle — slow, armored, deliberate, unbothered. *A turtle does not chase. A turtle waits.* That is not flavor; it is the emotional spine. Every 9/10 moment in ChartQuest trading is a variation on **earned certainty**: the click of recognition, the discipline of the pass, the sweat of the drawdown, the vindication of a read that paid, the dignity of a good loss. The thing V2's architecture unlocks — *quality equals odds* — is what finally makes all of these feelings **true instead of theatrical**. Today the game performs these emotions over a coin flip. V2 lets the player actually earn them. **The honesty is the feature.**

---

## Part I — The Emotional Journey of a Trade

### Stage 1 — Setup appears

- **Currently feels:** A banner fires ("TRADE INCOMING") and a portal floats ahead. It reads as a *notification* — a thing to go click — not a discovery. Every setup announces itself identically, so nothing feels special or selective.
- **Why it feels bad:** The player didn't *find* anything; the game handed it to them. The best dopamine hit in chart-reading — "wait… I *see* it" — never fires, because there's nothing to see, only a prompt to obey.
- **Should feel:** The quiet click of recognition. A hunter's alertness. "That shape… that's the one I learned." Anticipation building as the pattern completes.
- **Mechanics:** The pattern assembles *visibly on the chart ahead of Finn* (impulse → pause → resume), so the player watches it form and recognizes it before the portal appears. The portal is a *decision gate* that only materializes once the confirmation candle prints.
- **UI:** The setup candles breathe/highlight as they complete; a soft recognition pulse on the confirmation candle; the CURRENT LESSON chip lights to connect "this is the thing you just learned." The portal renders *attached to the candle*, never floating in empty space (blue = trade, unchanged).
- **Feedback:** A crisp recognition chime; a light haptic; a "setup forming…" whisper in the HUD — audio and HUD carry it, not text over the candles.
- **Lesson taught:** Patterns repeat, and you can train your eye to catch them. Trend + pause + resume = opportunity. *Recognition is a skill.*

### Stage 2 — Player evaluates setup

- **Currently feels:** The ticket opens and asks "WHAT JUST HAPPENED? → WHAT HAPPENS NEXT?" with UP/DOWN. It's a guess prompt. There is nothing true to weigh, because quality is cosmetic and hidden until Level 10.
- **Why it feels bad:** The player is asked to *guess*, not *judge*. No skill is exercised *before* the outcome — the decision is a dressed-up coin call. There's no "I'm smart for noticing this."
- **Should feel:** The weighing of evidence. "How strong is this one? Do the reasons stack? Is it worth my shells?" A small, satisfying moment of being the smart one in the room.
- **Mechanics:** A true, age-appropriate **strength signal** that reflects the *real authored quality*. On a stacked setup, more plain-word reasons visibly light up; on a thin one, the meter stays dim. The player can literally see weak is weak.
- **UI:** A simple "how strong is this?" meter (e.g., 1–3 filled confidence markers) — never jargon. Reasons in 10-year-old words ("riding the uptrend," "bouncing off the floor"). Entry/stop/target previewed as three lines so risk is visible *before* commitment.
- **Feedback:** The meter ticks up satisfyingly per real reason; a strong setup feels *bright and loud*, a weak one *dim and quiet*. The felt contrast **is** the teaching.
- **Lesson taught:** More reasons = a better trade (confluence, *felt* long before it's named at L10). And: you look at reward-vs-risk before you decide, not after.

### Stage 3 — Player decides: enter or pass

- **Currently feels:** You can skip (the banner ✕), but skipping is invisible and unrewarded, while entering is the only "real" action. So everything feels takeable → you take everything. Passing feels like *missing out*.
- **Why it feels bad:** The game silently trains overtrading — the #1 beginner killer. Restraint is punished by boredom and FOMO instead of rewarded.
- **Should feel:** The discipline of choice. "I don't take everything. I wait for mine." A *correct pass on junk should feel as good as a good win* — the calm pride of the patient hunter. Entering should feel like a small, brave leap.
- **Mechanics:** PASS is a first-class, rewarded action (Patience economy). On a genuinely weak setup, skipping earns a Patience tick and an approving nod. Entering requires the deliberate act of flying into the portal — commitment, not a reflex tap.
- **UI:** A "let it go" affordance as prominent as ENTER; a visible Patience streak; post-skip confirmation ("Smart — that one was thin"). A correct pass is *never* punished.
- **Feedback:** Good skip → calm approving chime + "+Patience," then a glimpse that it would've lost. Bad skip (passing a great one) → gentle, honest "that was a strong one" — informative, never scolding. Enter → a decisive lock-in beat.
- **Lesson taught:** Selective entry. *A turtle does not chase.* Doing nothing is often the best trade, and discipline is something you can score and grow.

### Stage 4 — Player enters the trade

- **Currently feels:** One-tap commits instantly; shells are risked as an invisible number change. Entry is frictionless to the point of weightless. "You bought here" barely registers.
- **Why it feels bad:** No commitment ceremony → no stakes → no investment. A number ticking down is not a feeling. Frictionless entry makes the whole trade feel free, so its outcome can't matter.
- **Should feel:** The flutter of exposure. "My shells are on the line now. No take-backs. Here we go." Vulnerability married to resolve.
- **Mechanics:** Shells are visibly pulled from Finn's pouch and **set down on the chart, on the entry line** — you can see what you're risking, exposed. Entry lands on the confirmation candle's close (a real market moment), so "you bought here" points at a real candle forever.
- **UI:** Three lines snap on with plain labels — "YOU BOUGHT HERE," "SAFETY NET" (stop), "TREASURE" (target); the risk band shades red, the reward band green, so worst-case and best-case read as two sized zones. A brief freeze/zoom lets the moment land.
- **Feedback:** A tactile "clink" of shells placed; a decisive commit sound; the risk band appearing *first* so risk is felt before reward.
- **Lesson taught:** **Define your risk before you hope.** You always know your worst case before you're in. Entry is a planned, deliberate act — the professional sequence, drilled by feel.

### Stage 5 — Trade is active

- **Currently feels:** The dip → recover → run arc creates some tension, but it's puppeteered — and any suspicion that it's rigged deflates the suspense. With only HOLD to do, some players feel passive.
- **Why it feels bad:** Fake tension collapses the instant the player senses the outcome was pre-decided. Uncertainty that isn't real isn't suspense — it's waiting.
- **Should feel:** Earned, white-knuckle tension. Hope and fear; the drawdown scare; the urge to bail and the discipline to sit on your hands; the flood of relief when it recovers. *Real* uncertainty — but tilted toward the disciplined player.
- **Mechanics:** The authored path genuinely *breathes* — a real dip toward the stop, a hold, then resolution. Because the future is honest, the fear is honest. HOLD is the whole job early; later tiers grant one real action (move the stop to breakeven — the risk-free runner). The stop exists *so you don't have to panic* — that's the felt lesson.
- **UI:** The risk band stays lit so you see how close the dip came; a "HOLD YOUR PLAN" reminder surfaces at the exact moment of temptation; near the stop the whirlpool churns, near the target the ledge glows.
- **Feedback:** A heartbeat that quickens toward the stop and brightens toward the target; each surviving candle a micro-payoff; the recovery lands as audible relief. No text over the candles (hard rule).
- **Lesson taught:** Trades wobble; drawdown is normal, not a verdict. Your stop lets you stay calm. Discipline = letting a good plan finish.

### Stage 6 — Trade wins

- **Currently feels:** A genuinely nice ceremony (shells erupt, "you waited for confirmation ✓"). But since the outcome was a coin flip, the praise is often a *lie* — you can win a junk trade and be told you were disciplined.
- **Why it feels bad:** The celebration can't tell a *skilled* win from a *lucky* one, so it teaches the wrong lesson and, worse, the player half-senses the flattery is hollow.
- **Should feel:** Vindication. "I read it right, and it paid." The specific joy of a correct call — *not* the generic joy of a number going up.
- **Mechanics:** Because quality now equals odds, a win on a strong setup is really earned and framed "textbook"; a win on a thin setup is honestly framed "that one was luck — don't trust it."
- **UI:** The eruption scales with *process*, not just P&L — a strong-setup win gets the full triumph; a lucky win gets a smaller, honest note. The reasons that were genuinely true light up.
- **Feedback:** Triumphant sting; shells shown *growing* (counting up), not just totaled; Finn's existing victory beat; "+Discipline" for a well-taken win.
- **Lesson taught:** You won because you read it right (when true). Outcome and decision-quality are different — and a *repeatable* win is one you can explain.

### Stage 7 — Trade loses

- **Currently feels:** Shells swept into the whirlpool, then a reframe ("your loss was small because you set your stop — a good trade that lost"). Strong writing — but unverifiable, because a coin-flip loss has no real "grade" behind the reassurance.
- **Why it feels bad:** Without real quality, "a good trade that lost" can feel like gaslighting, and losses risk feeling arbitrary or punishing — the exact moment beginners churn.
- **Should feel:** A clean, honest sting that turns into a lesson. Disappointment, then clarity: *"that was variance — I did it right"* or *"yeah, that was thin — my fault for taking it."* Never confusion. Never feeling cheated.
- **Mechanics:** The loss cause is **named on the replay** (the candle where the read failed is highlighted). An A-grade loss is framed as variance ("keep taking these"); an F-grade loss as "not enough reasons." The stop capping the loss is *celebrated*.
- **UI:** Dimmed and somber but brief; the stop line glows — "this saved you"; the replay points at the failure candle; process and outcome shown as two separate things.
- **Feedback:** A soft, non-cruel loss tone; "+Discipline" *still awarded* for a well-taken loss — the good-loss reframe is the single most important dopamine converter in the game.
- **Lesson taught:** Losing well is a skill. Small losses are the cost of doing business. Following the plan is the real win condition; the market's answer is a separate thing from your decision.

### Stage 8 — Trade review

- **Currently feels:** A decent card (read / plan / what price did / verdict / one lesson), but the verdict is cosmetic and it risks becoming a stats dump (P&L decimals, XP math, jargon).
- **Why it feels bad:** If the review is a spreadsheet, the lesson drowns. If the verdict isn't true, it teaches nothing. If it's identical every time, players stop reading it.
- **Should feel:** The "ohhh, I see it now" click — the satisfying closure of understanding *exactly* what happened and why, in one breath. The player never leaves a trade confused.
- **Mechanics:** One card, five honest beats: your read → your plan → what price did (animated replay) → process-vs-outcome split → the one lesson. Only taught concepts appear.
- **UI:** Signal only. The read in plain words; the three labeled lines on the replay; the process/outcome split visually separated; a single 10-year-old-worded lesson. Noise (P&L to the decimal, streak counters, un-taught jargon) cut or deferred.
- **Feedback:** The replay's "aha"; one earned lesson; a journal entry that compounds — you can flip back and *see* your growth.
- **Lesson taught:** Outcome ≠ decision quality. Every trade, win or lose, is evidence. The journal is where mastery compounds.

### Stage 9 — Long-term progression

- **Currently feels:** XP, mastery, levels, boss gates exist — but if the trades feel arbitrary, the through-line ("I'm getting better at *reading*") never forms. Progress is measured in gates cleared, not skill felt.
- **Why it feels bad:** Without a felt skill curve, the player is grinding to the next door, not becoming someone. No identity forms.
- **Should feel:** The felt arc of mastery. "Three levels ago this pattern was invisible; now I catch it on sight. I'm becoming a trader." Competence, identity, and the pull of *what's the next lens?*
- **Mechanics:** The same loop with escalating agency — L1 hold-only → L2 place your own levels → L3 manage under pressure → … → "confluence" *named* at L10 → the Market Maker finale. Each new setup type is a new lens unlocked as its concept is taught. A Discipline/Patience stat that visibly grows and gates the bosses.
- **UI:** A Trader Report / mastery profile where skills (Trend, Structure, Risk…) visibly climb; the journal as a growing record; the notebook of discovered patterns.
- **Feedback:** Mastery tier-ups ("Trend — Expert!"); the boss testing *exactly* what you practiced (reinforcement, not a new game); the L10 moment when "confluence" gets its name and the player realizes they've *felt* it since L2.
- **Lesson taught:** Trading is a learnable skill that compounds. You're not lucky — you're getting good. Expectancy: your process across many trades is what wins.

---

## Part II — The 10 Commandments of Great ChartQuest Trading

Every future trading feature must obey all ten. Each has a *so-that* and a *forbids* — use them as a feature filter.

1. **The player must always know WHY.** Every outcome is explainable from evidence visible *before* entry. — *So that* no result feels random. *Forbids* mystery wins/losses, superstition.

2. **Reading better must win more.** Readable quality and win odds are the same number. — *So that* skill is the actual edge. *Forbids* cosmetic grades, quality-weighted coin flips, luck dressed as skill.

3. **Show something true before the decision.** Judgment happens *before* the outcome, not only after. — *So that* the player exercises skill, not just receives a verdict. *Forbids* pure guess prompts, hidden quality, blind entries.

4. **Passing is playing.** Restraint is rewarded as richly as a good entry. — *So that* discipline is trained, not overtrading. *Forbids* punishing a correct pass, making every setup feel takeable.

5. **Risk is visible and defined before hope.** You always see your worst case first. — *So that* "define risk first" becomes a reflex. *Forbids* invisible stakes, hidden stops, hope-before-plan entries.

6. **Let the trade breathe.** No instant resolutions; tension is earned across time. — *So that* the trade forms a memory. *Forbids* one-candle resolves, teleport-to-line, frictionless clicks.

7. **The drawdown is sacred.** Every win is sweated for; the scare is the feeling. — *So that* the recovery is a real relief and the stop's job is felt. *Forbids* straight-line-to-target wins, tension-free trades.

8. **Praise the process, be honest about the outcome.** A-grade loss ≠ failure; F-grade win ≠ skill; both are named. — *So that* the player chases process, not results. *Forbids* flattering lucky wins, gaslighting good losses.

9. **One trade, one lesson.** Never drown the takeaway in stats; always 10-year-old words. — *So that* learning survives the noise. *Forbids* stats dumps, un-taught jargon, decimal-P&L clutter, testing the untaught.

10. **The player must feel themselves getting better.** Mastery is *felt*, not just tracked. — *So that* an identity forms ("I'm a trader who…"). *Forbids* progression that's only gate-clearing, skill curves the player can't feel.

*These are the experience laws; they sit beside — not on top of — the 24 architectural rules in [`docs/canon/trading_canon.md`](docs/canon/trading_canon.md). A feature can obey the canon and still feel like a 4/10 if it breaks a commandment. Both must pass.*

---

## Part III — The Ideal Beginner Experience: First 10 Trades

A brand-new player. Zero trading knowledge. The turtle just learned that green means up and red means down. The arc is deliberately shaped: **confidence → recognition → the first sweat → the first real judgment → the first rewarded pass → the first honest loss → the honest lucky win → the chosen strong one → nerve under pressure → identity.**

> Design intent: the first three are gently guided wins (the on-ramp). The first loss is engineered to arrive *after* the player has banked enough confidence and skill to survive it — and it's framed so well it *pulls them forward* instead of pushing them out.

### Trade 1 — The Gift
- **Sees:** A big green candle forms right in front of Finn; the game gently circles it: "🟩 BIG GREEN — buyers won. What happens next? ↑ UP / ↓ DOWN." They tap UP. Price climbs to the glowing treasure ledge.
- **Learns:** The shape of the whole loop — *see → decide → wait → win.*
- **Feels:** "I did it! I'm actually doing this." Instant competence.
- **Why they continue:** They just succeeded at something that looked intimidating 30 seconds ago. Curiosity: *can I do that again?*

### Trade 2 — It's a Real Thing
- **Sees:** The same pattern forms again elsewhere. This time they spot it a beat before the game points. They place the trade with a little more of their own hand; it wins.
- **Learns:** The pattern *repeats* — it wasn't a one-off. Recognition is real.
- **Feels:** "I saw it coming. This is a thing I can *read*." The first flicker of an eye for it.
- **Why they continue:** The pattern-recognition hook has set. They want to catch the next one earlier.

### Trade 3 — The First Sweat
- **Sees:** They enter a good-looking setup — and price *dips toward the stop.* The whirlpool churns. "HOLD YOUR PLAN." Their stomach drops… then it holds, recovers, and runs to the treasure.
- **Learns:** Trades wobble; drawdown is normal; the stop is a shield, not a threat; *hold.*
- **Feels:** Fear → white-knuckle → flooding relief → pride. Their first real emotional trade.
- **Why they continue:** That fear-then-relief arc is the drug. They *felt* something. They want it again.

### Trade 4 — My Call
- **Sees:** No more hand-holding. A setup forms with a **strength meter** that reads *strong* (three markers lit: "riding the uptrend," "strong close," "bounced off the floor"). They choose to enter. It wins cleanly.
- **Learns:** Some setups are stronger than others — and stronger ones tend to work. "More reasons."
- **Feels:** "I *judged* that, and I was right." The first taste of agency, not obedience.
- **Why they continue:** They just proved the win wasn't luck or the game being nice — it was *them*.

### Trade 5 — The First Good Pass
- **Sees:** A setup appears but the strength meter is **dim** (one weak marker, fighting the trend). A "let it go" option glows as brightly as ENTER. They pass. "Smart — that one was thin. +Patience." Then they watch it fizzle and would've lost.
- **Learns:** Not everything is a trade. Doing nothing, correctly, is a *skill*.
- **Feels:** The calm, unexpected pride of restraint. "I'm not a gambler — I'm picky."
- **Why they continue:** A brand-new *kind* of reward opened up (winning by not playing). It reframes the whole game as hunting, not clicking.

### Trade 6 — The First Honest Loss
- **Sees:** A genuinely **strong** setup (they did everything right). It dips, tries to recover… and the stop catches it. Small loss. The replay highlights the candle where the trend quietly failed: "Great read — this one was just variance. Your stop kept it small. Keep taking these. +Discipline."
- **Learns:** A-grade setups still lose sometimes; *that's not a mistake.* Losing small and losing well is the job. Process ≠ outcome.
- **Feels:** Sting → understanding → *relief that it wasn't their fault.* "I did it right. The market just did its thing."
- **Why they continue:** The make-or-break moment, engineered to *hold* them: the loss didn't feel like failure, and it didn't feel rigged. The game told them the truth and still had their back.

### Trade 7 — The Honest Lucky Win
- **Sees:** They get impatient and take a **thin** setup (meter dim). It happens to win — but the review is honest: "This won, but it leaned on luck — too few reasons lined up. Stronger traders wait for more." Small, muted celebration.
- **Learns:** A win can be a *bad trade.* Don't trust lucky wins; don't repeat that.
- **Feels:** A complicated "I won but… hm." Slight itch. Respect for a game that won't just flatter them.
- **Why they continue:** *Trust.* The game was honest when it could have blown smoke. That honesty is what makes the praise mean something the other 9 times.

### Trade 8 — The Chosen Strong One
- **Sees:** Two weak setups drift by; they pass both (Patience ticking). Then a **9/10** forms — every marker lit. They wait for the confirmation close and commit with intent. Clean win: "Textbook."
- **Learns:** Selectivity + stacking reasons = the edge (confluence, still unnamed, now deeply *felt*).
- **Feels:** Mastery. "I *chose* this one on purpose, and it worked exactly like I thought." The competence flywheel spins.
- **Why they continue:** They can now feel the difference between playing and *hunting well*. They want to test the ceiling of their eye.

### Trade 9 — Nerve Under Pressure
- **Sees:** A tougher tier: maybe the short side ("sell the bounce"), or a deep-drawdown "conviction" trade that dips *scarily* far before recovering. They hold their nerve; later, they get to slide the stop to breakeven — their first real in-trade decision.
- **Learns:** Both directions; holding through a real scare; a first taste of managing a live trade.
- **Feels:** "I held when it got genuinely scary — and I had a lever to protect myself." Grown-up trading.
- **Why they continue:** The challenge grew to match their skill — never boring, never overwhelming. Flow.

### Trade 10 — I'm a Trader Now
- **Sees:** Approaching the first Guardian gate, the **Trader Report** opens: Patience, Discipline, and Trend mastery have all visibly climbed. A pattern that was invisible at Trade 1 now reads instantly. The boss ahead will test *exactly* what these ten trades taught.
- **Learns:** Skill compounds. The ten trades weren't ten coin flips — they were a curriculum they can feel in their hands.
- **Feels:** Pride and identity. "Ten trades ago I knew nothing. Now I can *read this.* I'm becoming a trader."
- **Why they continue:** The three strongest pulls in games fire at once — **competence** (I'm good and getting better), **curiosity** (what's the next pattern/lens?), and a **clear next goal** (beat the Guardian). The loop has become an identity.

---

**The through-line:** trades 1–3 give competence for free, trade 4 hands over agency, trade 5 reveals restraint as a reward, trade 6 proves losing can be safe and honest, trade 7 earns the player's trust, trade 8 delivers earned mastery, trade 9 raises the ceiling, and trade 10 turns all of it into an identity. No stage relies on lying to the player — which is *only possible* because V2's architecture makes quality equal odds. **The honesty is the feature.** That is what takes ChartQuest trading from a 4/10 that performs emotions to a 9/10 that earns them.

---

*Design proposal only. No game code was modified, and nothing here is approved for implementation.*
