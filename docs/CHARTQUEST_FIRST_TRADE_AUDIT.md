# ChartQuest — First-Trade Experience Audit (break-it pass)

**Build:** live **v78** · **Principle shipped:** SEE → GUESS → RESULT → LEARN (was READ → READ → READ → GUESS). This audit's job is to *break* the new onboarding, not bless it.

## What shipped (verified live)

- **C1 — text cut >50%.** The Level-1 trade panel is now three micro-blocks: **WHAT HAPPENED** (🟥 STRONG RED CLOSE) · **WHAT USUALLY HAPPENS** (⬇ Often keeps going DOWN) · **↓ YOUR CALL**. Measured: **111 characters** vs the old ~250+ paragraph. (Level 2+ keeps the "more reasons" meter — verified no regression.)
- **C4 — teach after the commit.** The causal "why" now fires *after* the trade resolves: *"✅ Correct! Strong red closes often keep falling — sellers stayed in control."* (verified output live).
- **C3 — exaggerated early candles.** Bodies are amplified at low complexity (×1.3 at Level 1, tapering to ×1.0 by Level 9), clamped to the price band.
- **C2 — leaner fullscreen.** Level-1 momentum/pullback collapses the two verbose cards into one strip; **YOU ARE HERE** is now a bright pill.
- **C6 — loop intact.** No loop/economy changes; only less reading.

---

## Where it still breaks (the honest part)

### 🔴 1. The "guess" is hollow — the hint hands over the answer
**WHAT USUALLY HAPPENS: ⬇ Often keeps going DOWN** literally tells the player to pick SHORT. A player who reads the hint **cannot be wrong**, so SEE → GUESS is really SEE → OBEY. The first "prediction" tests reading-an-instruction, not reading-a-chart. This is the single biggest gap between the build and the stated principle.
**Fix options:** (a) move "what usually happens" into the *after* card (the LEARN), so the player predicts from the candle alone; or (b) keep the hint as training wheels for the **first 1–2 trades only**, then drop it so a real guess (and a real wrong-guess) can happen. Right now the loop can't teach prediction because it never lets the player be wrong.

### 🔴 2. Two taps to commit, and the "YOUR CALL" cue points at the wrong control
The panel says **"↓ YOUR CALL — tap SHORT or LONG,"** but LONG/SHORT are a *toggle* — the trade doesn't fire until the separate **ENTER TRADE** button. Worse, the correct direction is pre-selected, so tapping SHORT (already active) does *nothing visible*, and a beginner can sit there thinking they've acted. That's a dead-end tap on the most important screen.
**Fix:** for Level 1, make LONG/SHORT **commit directly** (one tap = the call, no confirm). That's the "one decision, high confidence" the mockup promises — and it removes the confusing toggle-then-confirm.

### 🟡 3. "The chart teaches" mostly lives in a screen players don't open
The default path is *tap banner → trade panel* (a **mini** chart). The big chart wins — the bright YOU ARE HERE, the minimal cards — are in the **fullscreen**, reachable only by flying into the optional "FLY IN TO EXPLORE" portal. Most players never see it. The default mini chart was **not** enlarged, so on the path everyone takes, the chart is *not yet* doing the teaching.
**Fix:** enlarge the trade panel's mini chart (or route Level-1 setups through the fullscreen by default). This is the gap between the mockup's intent and what the median player experiences.

### 🟡 4. The LEARN beat can be buried under the celebration
On the first win, three things fire near-simultaneously: the **+P&L** floater, the **🏆 FIRST WIN** celebration (+420 ms), and the **LEARN** card ("✅ Correct! …"). The LEARN is the *L* in the loop — if it queues behind the confetti, players skim past the one sentence that teaches. **Needs a playtest** to confirm the explanation lands clearly and isn't swallowed by the party.
**Fix:** sequence them deliberately — P&L pop → celebration → *then* the LEARN card as its own held beat.

### 🟡 5. Candle exaggeration is visually unverified — real side-effect risk
The ×1.3 body boost is a *data* change. I could not see the canvas (animated-canvas screenshots time out), so two risks are unconfirmed: (a) bigger candle-to-candle moves could make the **turtle's jumps** steeper/harder; (b) faster band traversal could cause **more edge reversals** — i.e. choppier, the opposite of "textbook clean." **Must be eyeballed on a real device.** If it reads busy or the platforming feels off, drop the 0.3 factor to ~0.15.

### 🟢 6. "SHORT/LONG" is the one piece of jargon an 8-year-old trips on
The 8-year-old test mostly passes — match the arrow to the button. But **SHORT = bet down** is counterintuitive vocabulary; a true beginner thinks up/down, not long/short. The ▲/▼ arrows and "↓ SHORT" help, but for Level 1 consider literally labeling the buttons **BET UP / BET DOWN** and introducing SHORT/LONG later.

### 🟢 7. Reading still surrounds the (now-lean) trade
The trade itself is lean now — but the runway *to* it (cinematic → "THIS IS THE MARKET" card → control coach → Flash Quiz) is still a reading stretch before the first guess. The sprint leaned the trade; the onboarding *around* it still has course-like passages. The "accidentally learning" feel breaks before the player ever reaches the candle.

### 🟢 8. Pullback hint name-drops "uptrend" before it's taught
If a pullback setup surfaces in Level 1, the strip reads "DIP IN AN UPTREND / Trend often resumes UP" — but *trend* isn't taught until Level 2. The words are plain enough to survive, but it's a small concept-leak. Gate pullbacks out of Level 1, or reword to "a dip after a rise."

---

## Scorecard

| Question (from the brief) | Verdict |
|---|---|
| Is the setup visually obvious? | **Mostly** — the candle + arrow are clear; strongest in the fullscreen, weaker in the default mini chart (#3). |
| Can a beginner identify the important candle? | **Yes** — it's boxed/tagged and now bigger (#C3, pending visual check). |
| Does the chart communicate without reading? | **Partly** — true in the fullscreen, not yet on the default path (#3). |
| Is there unnecessary text? | **Cut hard** at the trade (111 chars), but the surrounding intro still reads like a course (#7). |
| Would an 8-year-old know what to do? | **Almost** — blocked only by SHORT/LONG jargon (#6) and the toggle-then-confirm (#2). |

**Honest bottom line:** the trade *panel* now nails "minimal, commit-first, explain-after" — the core ask is delivered and measured. But two things keep it from being a real game loop: the hint makes the **guess un-loseable** (#1), and the **commit is two ambiguous taps** (#2). Those are the next two fixes, and they're small. The bigger structural gap is that "the chart teaches" still lives mostly in the **optional fullscreen** (#3). Fix #1, #2, and #3 and the first trade becomes a genuine *see-it, call-it, find-out, learn-why* game beat instead of a guided exercise. And the ×1.3 candle change **must be eyeballed on a device** before this is called done (#5).
