# Chart Quest — First-Hour Experience Audit
### A new player's first 60 minutes. Experience only — no code, no architecture, no progression integrity.

I traced the actual opening flow through the game and reconstructed what a brand-new
player sees, does, waits for, and feels — minute by minute. Findings are grouped into
boredom / confusion / friction / excitement / retention killers, then improvements ranked
by impact.

---

## The first 60 minutes, as a new player actually experiences it

| When | What happens | Player agency |
|---|---|---|
| 0:00–0:50 | **Opening cinematic.** Glitch screen → a long fall through abstract "blockchain space" collecting optional shells → pick a chain at glowing **BTC / ETH / SOL** portals → warp → a red "Validator" delivers three ominous lines (*"Learn. Trade. Survive."*) → title card. | Mostly passive. Only required input: steer + pick a portal (auto-picks BTC if you stall). |
| ~0:50 | **Auth wall.** "Sign In / Sign Up / Play as Guest (progress won't save)." | Must choose before playing. |
| ~1:00 | **Greeting tutorial is skipped.** On the cinematic path the controls/goal cards are turned off. | None — and the player isn't told this. |
| 1:00–3:00 | **Intro run.** The turtle auto-walks; the player taps to jump through candles. No instructions. At ~candle 48 a **FLASH QUIZ** portal ("⬆ BOOST TO ENTER") → candle-colour quiz ×3. At ~candle 60 a **PREDICTION BET** portal → bet where the candle closes ×2. At ~candle 70 a **BOSS PORTAL**. | Tap to jump, jet into portals — having never been shown how. |
| 3:00–5:00 | **Intro Boss — The Gambler.** Cinematic reveal (letterbox, rising rim-lit villain, taunt, "FIGHT"), then 3 quiz rounds (candle / predict / error). Forgiving: a wrong answer costs a heart, losing just re-reads. | Tap answers. |
| ~5:00 | **Controls are finally taught.** Only now do the "TAP → Jump / SWIPE UP → Jetpack" and "grow SHELLS to the goal" cards appear. | Read. |
| 5:00–12:00 | **Hour 1 proper.** Real chart setups can fire (after an 18-candle warm-up). Lessons arrive as portals (max 2 per hour). A **trade gate** requires 3 trades / 2 wins before the boss. Then **Boss 1 — the False-Breakout Eel.** This is the **first real trade on the live chart.** | Full gameplay. |
| 12:00–60:00 | **Hours 2–4-ish.** Trend Crab → Structure Serpent → Order-Block Golem, ~5–8 min each. A new player likely reaches ~Hour 3–4 in the hour; fewer if they read carefully or hit a losing streak. | Full gameplay. |

**The single most important number:** the core fantasy — *a turtle taking real trades on a
live BTC chart* — is withheld until **roughly minute 5–7**, because trade setups are fully
suppressed for the entire intro and controls aren't explained until after the first boss.
That's past the window where most mobile players decide whether to stay, and it contradicts
the stated design goal of a first real trade in the first 90 seconds.

---

## 1. Boredom points

1. **The cinematic fall (~13s) is passive and goal-less.** Abstract space, optional shells,
   no stated objective. A new player can spend 10–15 seconds unsure what they're meant to do.
2. **~35–50 seconds of jumping with no instruction or goal** before the first interactive
   checkpoint (the flash quiz at candle 48). The turtle auto-walks; the player just taps.
3. **Three quiz-shaped beats in a row.** Flash quiz (what colour?) → prediction bet (which
   way?) → boss rounds (candle / predict / error) all hit the same note *before any real
   trading*. It reads as three pop quizzes, not escalating gameplay.
4. **The intermission can become a reading wall.** Only 2 lesson pop-ups are allowed per
   hour; everything else is deferred to the between-hours recap, which stacks text between
   the action.

## 2. Confusion points

1. **Controls are taught *after* the whole intro** (after beating The Gambler). For ~5
   minutes the player must tap-to-jump and jet-into-portals having never been told how. This
   is the headline confusion.
2. **The up-front tutorial is silently skipped** on the cinematic path, so the "TAP → Jump /
   SWIPE UP → Jetpack / the chart *is* the level" explainer never appears when it's needed.
3. **"⬆ BOOST TO ENTER" assumes knowledge the player doesn't have yet** — that boosting
   exists and how to do it.
4. **The faction choice (BTC/ETH/SOL) has no explanation.** It looks consequential but the
   player is given zero context on what a "faction" is or whether the choice matters.
5. **The lore is abstract.** "Chain collapse," the red Validator, "Exit Block" — atmospheric,
   but disconnected from the plain promise of *learning to trade*. New players may not grasp
   the premise.
6. **The hour HUD ("MIN x/60") ticks during the intro,** which runs past candle 70 — the
   counter implies a length the intro doesn't honour.
7. **Quiz vs bet vs trade vs boss-round feel mechanically similar but are named differently,**
   so their relationship is unclear.

## 3. Friction points

1. **Auth wall before gameplay.** A sign-in/sign-up gate is a classic first-session
   drop-off, even with the guest option (and "progress won't save" adds a small guilt nudge).
2. **The cinematic is long (~40–60s) with no obvious skip** for a first-timer who just wants
   to play.
3. **Portal-entry requirement.** To reach a quiz, lesson, or boss you must physically jet
   into a floating portal; mistime it and you wait ~10 candles for the auto-fallback.
4. **The trade gate (3 trades / 2 wins) can trap a cold-streak player** repeating an hour.
5. **Lesson-as-portal interrupts the platforming flow,** and some players will simply fly
   past the lesson they needed.

## 4. Excitement points (what's already working — protect these)

1. **The cinematic boss reveal** (letterbox, spotlight, rising rim-lit villain, taunt,
   "FIGHT") is a genuine high with real production value.
2. **Choosing your chain through glowing portals** feels momentous and personal.
3. **Collecting shells during the fall**, with coin SFX, is immediate tactile reward.
4. **The 3-tier jetpack platforming over live candles** is novel and satisfying — the hook.
5. **Villain personality** (*"double or nothing… the cards never lie"*) gives the world charm.
6. **Forgiving failure** (boss loss = re-read; hour fail = balance restored) lowers anxiety
   and invites another try.

## 5. Retention killers (ranked by how much they cost you)

1. **Time-to-first-REAL-trade (~5–7 min).** Setups are suppressed for the whole intro, so
   the thing the game is *about* arrives after most players have already decided. Biggest leak.
2. **Controls taught after the intro** → early flailing → "I don't get it" churn.
3. **Auth wall up front** → measurable top-of-funnel drop.
4. **Front-loaded passive cinematic + abstract lore** before the player has any agency.
5. **Three quiz beats before real trading** → "this is school," not "I'm trading," for the
   exact audience that came to trade.

---

## Recommended improvements — ranked by impact

> Impact = retention lift relative to effort. The top three are where almost all the upside is.

**1. Teach controls in the first 5 seconds, not after the first boss. (Huge impact, tiny effort.)**
Move the controls coach to the *start* of the intro run — either restore the greeting card on
the cinematic path or drop a 2-tap inline hint ("TAP to jump", "SWIPE UP to boost") the first
time each is needed. Right now the player is asked to use controls for ~5 minutes before being
shown them; closing that gap removes the single most avoidable source of early churn.

**2. Let the player take a real (micro) trade inside the intro — ideally by ~90 seconds. (Huge impact.)**
Reframe the Prediction Bet as an *actual* trade that pays SHELLS ("You went LONG → +12 🐚"),
or unlock one genuine setup before the intro boss. This collapses time-to-first-trade from
~6 minutes to ~90 seconds and finally delivers the core promise inside the decision window.

**3. Defer the auth wall. (High impact, low effort.)**
Lead with "Play" (guest by default) and prompt sign-up *after* the first boss win
("Save your shells?"). The moment of pride is a far better conversion point than a cold gate,
and it removes the biggest top-of-funnel drop.

**4. Tighten and make the cinematic skippable. (Medium-high impact.)**
Add a visible SKIP, shorten the ~13s fall, and give the fall a one-line objective
("Steer to grab shells"). Keep the boss reveal — that part earns its length.

**5. Differentiate the three intro beats. (Medium impact.)**
Don't run candle-colour quiz → direction bet → candle/predict/error boss back-to-back. Make
each feel distinct: quiz = *read*, bet = *predict*, boss = *your first real trade*. Same
teaching, far less "pop-quiz fatigue."

**6. Explain or defer the faction choice. (Medium impact.)**
One line on what BTC/ETH/SOL actually changes, or move the choice to after Hour 1 once the
player has a reason to care. A consequential-looking choice with no context creates anxiety,
not investment.

**7. Fix the portal-miss penalty and lesson interruption. (Lower impact.)**
Re-spawn missed quiz/lesson portals sooner (shrink the ~10-candle fallback), or convert a
missed portal into a tappable banner so the player never just stalls or flies past content.

**8. Hide the "MIN x/60" hour HUD until Hour 1 actually begins. (Low impact, trivial.)**
So the counter doesn't promise a length the intro ignores.

---

### One-line summary
The production values are strong and the hook (jetpacking a turtle over live candles) is
real — but the first 5–7 minutes spend the player's patience on a passive cinematic, an auth
gate, and three quizzes *before* teaching controls or letting them take a real trade. Move
controls and the first real trade to the front, and defer the signup, and the opening will
finally lead with what makes the game special.

*Experience-only audit. No code, data, or assets were changed.*
