# ChartQuest — Founder Playtest Fixes 2–5 (build 303)

**Date:** 2026-07-30
**Build:** 302 → **303** · all three served copies byte-identical
**Gate:** 15 pass · 0 fail · 1 skip
**Status:** IMPLEMENTED · verified in a real browser · **awaiting founder playtest**

Fixes 1 and 6–10 from the playtest list are untouched and still queued.

---

## Fix 2 — Every box must be smashed

**What was wrong.** The first box sits at the foot of a run of red candles, so you simply *fell*
onto it and it opened. That made the shell-roll smash — taught in the movement tutorial — never
needed anywhere in the game.

**What changed.** `updateBoxes` now opens a box only when `turtle.tucked` is true (jump, then
swipe down / press S). Any other contact calls a new `boxRefuse()`: a spray of sparks, a tick, a
light haptic, and a hint floater shown at most twice ever — so the box visibly **refuses** rather
than reading as broken. Throttled to one refusal per 900ms so brushing past during a scramble
can't turn into a stutter of noise.

**Deliberately not done:** no physics is applied to Finn. I considered bouncing him off, but that
would touch movement feel, which is protected and which you said to leave alone.

**This reverses a prior decision** — build 279 made this a contact smash on purpose, commented
*"a reward, never a precision challenge."* Your call overrides it, and I agree with the reasoning.
Flagging it so it isn't silently re-reverted later.

> Verified: not tucked → box intact, 0 shells, 6 refusal sparks, hint shown. Tucked → box breaks,
> +1 shell.

---

## Fix 3 — The first-win congratulation no longer plays to an empty room

**What was wrong.** The milestone fired either when the post-trade lesson was dismissed, **or on a
blind 7-second timer**. That timer was the bug: it could fire while you were still on the
full-screen chart studying the trade you'd just closed. You'd never see the one moment the whole
first level is built to deliver.

**What changed.** Both trigger paths now funnel through a single gate. It waits until:

- the screen is **clear** — no panel, no lesson, no live trade, no full-screen chart, and
- you've **walked three candles** back into the world.

Then it fires. Exactly the sequence you described: close the trade, close the chart, move three
candles, *then* the congratulation.

A 90-second backstop still fires it regardless, so the once-ever moment can never be lost outright.

> Verified: the gate's screen-clear check returns **false** while the full-screen chart is open
> (your exact bug) and while any panel is open, and the three-candle counter behaves.

---

## Fix 4 — Rewards no longer stack on top of each other

**What was wrong.** A breakable box and a Lost Wisdom page landed within a couple of candles of
each other. Root cause: they're placed by two independent spawners that knew nothing about each
other, so nothing ever stopped them landing side by side.

**What changed.** Both now share **one ledger**. Whichever places last stamps the candle, and
neither may place within `REWARD_GAP = 10` candles of it.

Deferring is lossless: a box just waits for the next eligible candle, and a page keeps
`placed[kind]` false so its chapter only moves slightly further along — it's never dropped.

> Verified: with a reward stamped at candle 100, placement is blocked at +1 through +9 and clears
> at +10 and beyond.

**Left alone:** the underlying box cadence (~22–34 candles, half of eligible candles skipped) is a
deliberate "placed, not metronomic" feel choice from an earlier build. The 10-candle separation
solves the clustering you actually hit. Say the word if you want the cadence itself evened out too.

---

## Fix 5 — The Lie is earned, not served

**What was wrong.** The broken-candle rep popped up on its own the instant the prove phase began.
Every other lesson in the game is earned by flying into a portal, so this one broke the rule the
player had already been taught.

**What changed.** It's now a portal like the rest — **THE LIE · ⬆ FLY INTO THE PORTAL** — so the
player sees it coming and chooses to take it. Same practice, same follow-up floater, just gated
behind the same gesture as everything else.

Safe by construction: lesson portals auto-enter after ~9 seconds (the existing anti-softlock in
the portal update), so the rep can never be stranded or skipped before the Gambler tests it.

> Verified: `beginIntroProve()` now spawns the portal instead of opening the practice, and
> entering the portal delivers the lesson.

---

## Verification

| Check | Result |
|---|---|
| Box requires the tuck | **PASS** |
| Box refuses visibly when not tucked | **PASS** (sparks + hint, no shells) |
| First-win gate blocks while chart is open | **PASS** |
| First-win gate blocks while a panel is open | **PASS** |
| Three-candle counter | **PASS** |
| Reward ledger blocks +1…+9, clears at +10 | **PASS** |
| LIE spawns as a portal, not a popup | **PASS** |
| Entering the portal delivers the lesson | **PASS** |
| Cold boot, 400 frames pumped | **no errors** |
| Console errors | **none** |
| Regression gate | **15 pass · 0 fail · 1 skip** |
| Mirrors | all three copies byte-identical |

---

## Concerns

1. **Fix 2 is an accessibility narrowing.** A player who never masters the tuck now gets no box
   rewards at all. The twice-only hint mitigates it, and `coachAdvance(2)` teaches the tuck during
   the movement tutorial, but it is a real change to who can earn shells. Watch for it in testing.
2. **Fix 2's hint budget is per page-load**, not per level — two hints, then silence. If that
   proves too quiet for a 10-year-old, it's a one-number change.
3. **Fix 3's 90-second backstop** is long by design. If a player parks in a menu for 90s the
   celebration will fire on re-entry rather than being lost. I judged "late but seen" better than
   "never happened", but it's a taste call.
4. **Fix 5 removed the only thing that happened at the start of the prove phase.** The phase now
   opens with a portal instead of a quiz, so the first few seconds are quieter. Worth a look in
   the playtest.
5. Still uncommitted, and the tree still holds the earlier build-301 collectible work that isn't
   mine to commit.
