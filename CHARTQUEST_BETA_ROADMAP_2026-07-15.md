# ChartQuest — Beta Production Roadmap (Golden Path)

**Production backlog · 2026-07-15 · beta in 4 days.** Executable engineering plan, not a design doc. Every item names its real code touch-point, uses a ratified system, and has testable acceptance criteria (verify on-device with `?fresh=1`, per canon). Depth/analysis lives in `CHARTQUEST_GOLDEN_PATH_REVIEW_2026-07-15.md`; this is the do-list.

**The final question:** *what work most increases the chance 10 people finish Boss 1, understand trading, have fun, tell a friend, and pay?*
**The answer, in one line:** the funnel leaks **before the trade, not at the boss** (Boss 1 is unloseable), and the game's best moments are **computed then discarded** — so the highest-leverage work is *pointing the juice and pacing you already have at the moments that deserve them.* Estimated finish: **~5–7/10 today → 8–9/10 after the P0s.**

---

## ✅ Already shipped this session

- **P0-1 — First-win screen punch.** `celebrate()` never set `shakeT`; a loss shook the screen at `0.5`, so the biggest win of the hour landed softer than the funeral. Added an opt-in `opts.shake` to `celebrate()` (chart-quest.html ~4407) and passed `shake: 0.6` + `n: 34` at the once-ever first-win call (~11992). **Verified live:** `celebrate` loads clean, the path is present, and the win now sets `shakeT=0.6` (> the loss's 0.5). Synced to all 3 mirrors (`chart-quest.html` / `index.html` / `website/game.html`). Additive VFX only — no gameplay/difficulty change.

---

## P0 — Must land before beta

Each: **Why · Player · Edu · Business · Complexity · Risk · Deps · Acceptance · Touch-point.**

### P0-2 — Traversal forward-pull (the #1 pre-trade leak)
- **Why:** non-gamers boost straight up over 20–28 near-empty candles with no forward compass and stall out *before ever reaching the trade* — the single biggest dropout (confirmed across all 6 lenses + the beta audits).
- **Player:** "where do I go?" → a clear rightward pull with a reward every few seconds. **Edu:** keeps them moving to the lesson. **Business:** nothing downstream monetizes if they never reach the trade.
- **Complexity:** M · **Risk:** MED (near movement — do **not** touch physics; verify on-device). · **Deps:** none.
- **Acceptance:** a non-gamer moves right without being told; no >2s empty stall in the pre-trade corridor; the first jump visibly lands on a reward (shell/portal). Same jump reach/gravity as before (movement CFG untouched).
- **Touch-point:** the explore/run phase scripting (`armExplore` ~16111), setup/reward-portal placement, pre-trade candle density — level design only.

### P0-3 — Cold-open safety net
- **Why:** the intro is hard-gated on a 32s / ~10MB video (`#mmTeaser`); on a slow or blocked connection it can degrade to a black screen at the exact moment 10 evangelists form their first impression.
- **Player:** always sees *something* (a still villain) fast. **Business:** protects the top of the funnel. **Retention:** turns "30s of black" into "a villain + a clear quest."
- **Complexity:** S–M · **Risk:** LOW–MED · **Deps:** none.
- **Acceptance:** if the video hasn't painted a frame by ~2.5s, auto-advance to a static villain poster + the goal card; never stranded on black; SKIP always visible. Test on throttled network.
- **Touch-point:** `#mmTeaser` video handling + `showSkipCard`; preload the poster in `play.html`.

### P0-4 — Make the first trade *felt* (the WTP fulcrum)
- **Why:** the authored dip→recover arc (`tradeDrivenCandle` ~2946) is delivered as text; `beat()` is a no-op (~2959) and there's no live P&L; `shellEmotion='worried'` is computed every frame (~12824) then **discarded**, so Finn smiles calmly while the player's money nearly stops out. The founder's own verdict ("you just click buttons, no meaning") is still true — and it's staging, not mechanics.
- **Player:** nervousness → hope → relief. **Edu:** the trade's *why* becomes visceral. **Business + Retention:** trade-feel is the confirmed fulcrum for willingness-to-pay and "one more."
- **Complexity:** M · **Risk:** MED (**do NOT change trade outcome/causality — trading_canon owns that**; founder pre-flight). · **Deps:** none.
- **Acceptance:** on the dip — music thins, P&L pulses red, Finn's face shows the already-computed worry; on target — a sting + a screen punch (reuse P0-1's `opts.shake`). Outcome logic byte-unchanged.
- **Touch-point:** hang VFX on the existing `beat()` hooks; wire `shellEmotion` → Finn's Shell-Check overlay; add a live P&L number to the trade HUD.

### P0-5 — Verify the boss doesn't test the untaught (correctness insurance)
- **Why:** `BOSSES[0]` (the Gambler, chart-quest.html:9324) rounds are: green→buyers, red→sellers, **doji**, **upper-wick rejection**. The intro teaches green/red (`openIntroLesson('candle')` ~16097) and has a wick "spot-the-lie" warm-up — but **there is no explicit *doji* teach beat before the boss.** Testing the untaught breaks the "never test the untaught" law at the graduation moment.
- **Edu:** protects the core promise ("I understood, I wasn't just told"). **Complexity:** S · **Risk:** LOW (content) · **Deps:** none.
- **Acceptance:** every boss-0 round's concept has a prior teach beat in the golden path — **or** confirm the `candle` scene explicitly names "doji"; if neither, either add a 1-card doji beat before the boss OR trim round 3 (doji). Founder decision.
- **Touch-point:** `BOSSES[0].rounds` (9324) vs the intro sequence (16097).

### P0-6 — Funnel telemetry (beta insurance)
- **Why:** the build ships **no funnel telemetry** at the pre-trade quit points, so a 10-friend beta could "succeed" and teach the founder nothing about *where* people leaked.
- **Business:** turns the beta from vibes into data. **Complexity:** S · **Risk:** LOW · **Deps:** the edge-fn origin allowlist (re-verify `ALLOWED_ORIGINS` post-deploy — see the known Cloudflare-migration 403 issue).
- **Acceptance:** a fired-and-*received* event at: cold-open-done, first-jump, first-chart, first-trade-open, first-win, boss-start, boss-win — visible in the dashboard within a test session.
- **Touch-point:** the Block-4 content-event engine + the edge function.

### P0-7 — Stage the authored first loss (anti-churn) *(if a loss can occur in the guided run)*
- **Why:** a fair-but-silent loss reads as "unfair, I quit" in the ~1s before the coaching card rescues it.
- **Player:** sting → rescue → pride ("you didn't do anything wrong"). **Edu:** a loss must *teach*, never punish.
- **Complexity:** M · **Risk:** MED (loss *logic* untouched — staging only). · **Deps:** none.
- **Acceptance:** the first loss plays a 3-beat arc + a resilience-tally + a "here's what it taught" card; confidence measurably rises after (playtest read).
- **Touch-point:** the loss branch (~12000) + Finn expression + the verdict card.

---

## P1 — Strong multipliers (near-free; land if the P0s are in early)

| # | Change | Player/Edu/Biz | Cx | Risk | Acceptance |
|---|--------|----------------|:--:|:--:|-----------|
| P1-1 | **Retrieval tap on reflection** — "Why did this win? [I waited ✓] [I got lucky]" before the trophy | makes "I know why I won" *self-produced* | S | LOW | tap gates the trophy; answer logged |
| P1-2 | **Goal card on the happy path** — surface `#introSkipCard` (~16886) at cinematic end, not only on SKIP | the game's promise reaches *everyone*, not just quitters | S | LOW | every player sees the quest spine |
| P1-3 | **Make the offer visible + share card** — "Play the first 3 Guardians free" on site + at Continue; a save/share card at First Win & "THE GAMBLER FALLS" (Finn + villain + player stat) | WTP + the only zero-cost acquisition channel | S/M | LOW | offer legible; a shareable image mints at both peaks |
| P1-4 | **Let the pride card breathe** — hold `vicG1` ~1.5–2s before the Journal cinematic overlays it (~10289) | protects the strongest emotional second | S | LOW | pride beat not buried by a tutorial |
| P1-5 | **Market Maker presence** — one taunt after the Gambler + his face on the "X remain" node | sustains want-to-defeat through the free bosses | S | LOW | MM reappears between bosses |
| P1-6 | **Annotate the replay** — Finn callouts on the JOURNEY tags (DIP→HELD→confirm→target); show after the *first* trade | a free second teaching rep + shareable | M | LOW | replay narrates the why |
| P1-7 | **Auto-write the notebook's first entry** — an earned rule card, not a blank textarea | an earned shelf the paywall can light up | M | LOW | first entry appears filled |
| P1-8 | **Reframe candle lesson shown→deduced** + "the buyers WON" copy | active encoding on the best moment | S | LOW | player predicts before the reveal |
| P1-9 | **Trim Guardian 1 to 3 rounds for beta** (or ship 5 + watch drop-off) | removes the last pacing wall before payoff | S | LOW | boss ≤ ~90s |

## P2 — Post-beta

| # | Change | Note |
|---|--------|------|
| P2-1 | **Win-juice on level-up / rank-up** too (pass `opts.shake` at ~12379/12383) | extends P0-1's opt-in hook to the other milestones |
| P2-2 | **Level-up banner + level names** ("LEVEL 3 — you can now read STRUCTURE") | every progress beat feels proportional |
| P2-3 | **Market density + single shell referent + Forex chip** | completes the "chart is the world" + transfer claim |
| P2-4 | **Finn-first cinematic beat** + name the reactive Shell-Check early | companion (safety) precedes villain (threat) |

---

## Final executive prediction — 6 players this weekend

| Player | Smiles at | Confuses / quits at | Gets excited at | Recommends? | Pays? | The one fix that flips them |
|---|---|---|---|---|---|---|
| **Complete beginner** | the candle "aha" (green = buyers won) | the empty traversal corridor | first win — **if** it's juiced | if they finish | if the offer is visible | **P0-2** (reach the trade) |
| **Hardcore gamer** | movement/boost | the floaty, low-stakes boost over empty space | a felt trade + a real boss | if game-feel lands | rarely (wants depth) | **P0-4** (stakes) + tighter traversal |
| **Crypto trader** | "an actual honest chart" | if the trade feels fake/coin-flip | authored setups that read true | if it's not dumbed-down | maybe (curiosity) | **P0-4** + P0-5 (rigor) |
| **Never-invested** | "I understood a candle!" | jargon before it's taught | "I feel smarter than 15 min ago" | strongly, if they finish | if the free→paid bridge is clear | **P0-5** + P1-2 (taught, promised) |
| **YouTube creator** | the villain + a share card | no screenshot moment | a mintable "THE GAMBLER FALLS" card | it's their content | for the format | **P1-3** (share card) |
| **Brutally-honest friend** | the first felt win | "you just click buttons" (still true today) | when the dip makes them nervous | only if it *feels* like something | if the loop hooks | **P0-4** (the feel fulcrum) |

**Convergence:** every persona is unlocked by one of **P0-2 (reach the trade)** and **P0-4 (feel the trade)**. Those two, plus the already-shipped **P0-1 (juice the win)**, are the beta.

---

## The 4-day sprint

- **Day 1:** ✅ P0-1 (done) → **P0-2** traversal forward-pull (biggest single lever) → **P0-5** boss-untaught verify (cheap correctness).
- **Day 2:** **P0-4** felt trade (staging + live P&L + wire `shellEmotion`) — the fulcrum; founder pre-flight on any trade-adjacent change.
- **Day 3:** **P0-3** cold-open safety net → **P0-6** funnel telemetry → **P0-7** first-loss staging.
- **Day 4:** the cheap P1 multipliers (retrieval tap, goal card on happy path, offer + share card, pride-card breathe), then **buffer + on-device playtest** across the phone matrix with `?fresh=1`.

**The single most important non-code action all 4 days:** sit beside each of the 10 friends and *watch their face* on the dip and the first loss — that ×10 observation is the decisive evidence no telemetry can replace.

*No architecture was touched. Every item uses a ratified system (Visual Market Constitution, Curriculum Engine, Pattern OS, Finn animation/expression, replay/notebook). P0-1 is live in all three mirrors.*
