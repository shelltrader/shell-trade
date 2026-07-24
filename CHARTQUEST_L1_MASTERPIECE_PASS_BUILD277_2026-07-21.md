# ChartQuest — Level 1 Masterpiece Pass · Build 277
## Change Report

**Date:** 2026-07-21 · **Build:** 276 → **277** · **Source of truth:** `chart-quest.html` (mirrored to `index.html`, sha256 identical) · **Gate:** `verify.js` 10 pass · 0 fail · 1 warn (pre-existing CFG, approved) · 1 skip (puppeteer)

**Scope discipline.** Every change is **additive** — VFX, copy wording, timing, camera, transition, sound, typography. **Nothing** touched trade outcomes, odds, lesson order, the boss roster, save keys, `MIN_TRADE_CANDLES`, `SETUP_UNLOCK` order, or CFG constants. The Audit and the Campaign Bible both establish that L1's *structure and outcomes are already right*; this pass is the **polish layer on top of them**, aimed squarely at the seven Level-1 memories.

**Method.** Six beat-mapping readers cross-referenced the four canon docs (Operation First Impression Audit, Campaign Bible, Visual Market Constitution/Candle Bible, Trade Experience Constitution) against the live L1 code and proposed precise, anchored edits. I curated the highest-leverage safe set, applied 21 edits across the L1 signature beats, and verified them against the project's own regression gate.

---

## 1. Every Change Made — with the Why and the Memory It Serves

### BEAT 0 — The Descent *(Emotion: Wonder · Memory 1)*

**1 · Ocean-gradient cold-open fallback** — `#mmTeaser` background (CSS).
The cold-open's guaranteed base frame was `#000` black behind the poster. Now a deep-ocean radial gradient (`#0b3358 → #020c18`) paints behind the poster/video, so a slow load shows *glowing ocean-blue*, never a dead black screen.
*Why:* the audit flags ~30s of possible near-black at the exact moment an evangelist forms their first opinion. *Serves:* **Memory 1** ("the blue kept getting bluer") + Bible Law 1 (Wonder before difficulty).

**2 · Forward "THIS WAY" compass** — `drawIntroRunOverlay` (additive canvas).
While movement is still being taught (`coach.active`), a soft cyan chevron pack pulses toward the Guardian at the right edge with a "THIS WAY" micro-label; it vanishes the instant the coach completes.
*Why:* the audit's **#1 funnel leak** is that non-gamers stall on the pre-trade traversal with no forward cue. Getting them moving protects *every* downstream memory (2–7) that requires reaching the first trade. *Serves:* the whole L1 funnel.

**3 · "✨ It holds your weight!" landing beat** — jetpack-landing block (additive one-shot).
The first air→ground touch of the intro (the cinematic drop onto candle #1) now fires a one-shot cyan floater + haptic. The market *catching your weight* is finally punctuated.
*Why:* Memory 1's second half — "and I got to stand on one" — previously passed with a generic squash. *Serves:* **Memory 1**.

**4 · Coach-box entrance ease** — first hint (transition).
The game's very first instruction now rises + fades into place over 0.32s (using the already-tracked `coach.t`) instead of popping at full alpha.
*Why:* the first frame of UI a new player reads should feel authored, not glitched-in. *Serves:* the Wonder tone / first-impression craft.

### BEAT 1 — First Sight *(Emotion: Curiosity → "I can do this" · Memory 3)*

**5 · The keystone candle caption rewrite** — `SCENES.candle.caption` (copy).
Was: *"Each candle is one chunk of time… wicks — how far price reached."*
Now: *"Every candle is **alive** — a tiny fight. **Green** = buyers won… **Red** = sellers won… The fat middle is **the fight**. The thin **wick** is how far price tried to go — before it got **pushed back**."*
*Why:* Memory 3 — "the tall part was the fight, the little wick was where it tried and lost" — was the one thing "you can never unsee," and it was simply *absent* from the text. The word ALIVE, the body-as-fight, and the wick-as-tried-and-pushed-back are now explicit, in 10-year-old words, teach-order preserved. (Bonus: the Gambler's Candle-Lab round reuses this caption.) *Serves:* **Memory 3**.

**6 · "wick · tried & lost" callout on the chart** — `SCENES.candle.anns` (additive annotation).
A neutral-grey tag now points at the green candle's *lower* wick — literally "sellers tried to push down and lost." The metaphor now has something to point at, sequenced to land *after* the colour tags.
*Why:* the prose said "tried & lost" but the chart never showed which part. *Serves:* **Memory 3**.

**7 · Practice win-line echo** — `CONCEPT_PRACTICE` greenred `ok` (copy).
Was: "Green means buyers won." Now: "Green = buyers won **the fight**."
*Why:* welds the just-taught "fight" frame to the dopamine of the +5-shell reward. *Serves:* **Memory 3** (reinforcement).

### BEAT 2 — The Bet *(Emotion: "I called it" · Memory 2)*

**8 · The half-second HELD BREATH** — first-bet render (timing).
The Bible's signature Beat-2 trick was *missing*: the reveal fired on the same frame the candle closed. Now the candle closes as a **neutral silver bar**, holds for ~0.5s of "nothing happens," then snaps to its true colour as the verdict lands (the coin + reward now fire *on the reveal*).
*Why:* that held beat is what makes "I called it" feel earned and unscripted rather than pre-decided. The next-round button and award are still correctly gated, so nothing can skip the beat. *Serves:* **Memory 2**.

**9 · Colour withheld during forming** — forming price-line (additive).
The forming line was pre-coloured green/red the whole time, spoiling the outcome. It's now neutral silver, so the player reads **direction** (up→green / down→red — the taught signal) and the *reveal is the first colour they see*. Required for #8 to read coherently.
*Why:* a pre-spoiled colour makes the call feel scripted. *Serves:* **Memory 2**.

**10 · "YOU CALLED IT" scale-punch** — verdict draw (typography).
The payoff — the single most important line of onboarding — cross-faded in flat. It now **slams in** at 1.5× and settles to 1.0 with a tiny wobble and a verdict-coloured glow.
*Why:* the emotional peak of Beat 2 must land as a hit, not a fade. *Serves:* **Memory 2**.

### BEATS 3–4 — The First Trade + The Hold *(Emotion: small victory → courage · Memories 4 & 5)*

**11 · EP-1 exposure swell on the FIRST trade** — walkthrough resume (timing).
The "okay, this matters" entry beat (slow-mo + swell + blue focus bloom + haptic) fired on *every* trade **except the first** — the walkthrough pause had flipped `_zoomWasTrade` true early. Re-arming it on resume means the most important trade opening is finally an *event*.
*Why:* the first trade must open as an event, not a click. *Serves:* **Memory 4**.

**12 · First-win hit-stop + camera-punch** — first-win branch (camera).
The once-ever first win was mechanically *softer* than every routine win: the hit-stop + camera-punch lived only in the repeat-win branch. The first win now also punches on the tagging candle. (The `bigwin` sting + 🏆 fanfare stay deferred to the post-trade card, preserving learn-before-dopamine and a single audio milestone.)
*Why:* the first win is a defining memory; the target-tag must land physically. *Serves:* **Memory 4**.

**13 · HOLD YOUR PLAN made dominant** — `#holdPlanBtn` (CSS).
During the scare the red CLOSE button visually dominated the smaller gold HOLD pill — pulling a panicking beginner toward the exact action the beat teaches *against*. The HOLD pill is now larger (14px / 13–26px padding) so the taught instinct reads louder than the escape.
*Why:* the hold is "doing nothing and letting the stop protect you." *Serves:* **Memory 5**.

**14 · Brighter "it held" relief snap** — dip→recover turn (additive).
The relief flash/haptic at the moment the scare resolves was faint relative to the heartbeat tension it pays off (flash 0.28→0.42, haptic 14→18).
*Why:* the payoff must match the build-up. *Serves:* **Memory 5**.

### BEAT 6 — The Gambler *(Emotion: pride made permanent · Memory 7)*

**15 · Coronation sting** — `bossWin` (sound).
The first-hour peak was scored with the *thinnest* win sting while ordinary trades used a fuller one. The Gambler (level 0 only) now gets the fullest `fanfare` triumph.
*Why:* the peak of the first hour must *sound* like the peak. *Serves:* **Memory 7**.

**16 · Knighting gold-sweep** — `.vg1Rank` (CSS).
A single gold light now sweeps across the CANDLE READER title ~0.8s after the badge appears — the diegetic "knighting flash." Reduced-motion guarded; adds no Glasses (that reward stays mapped where it is).
*Why:* Memory 7's centrepiece is "the Glasses settled and *flashed*, like the game knighted me." *Serves:* **Memory 7**.

**17 · SAVE prompt reframed** — `authTitle` (copy).
Was a transactional "save your progress?" login title. Now: **"⚔ You beat The Gambler."** / *"Your first read, your called bet, your rank and your Journal — make them yours forever. This Finn is worth keeping."*
*Why:* Beat 6's climax is *"this is a self worth keeping"* — the save should gather up what the player just earned, not read like a menu action. *Serves:* **Memory 7**.

**18 · Softened decline copy** — guest button (copy).
"Maybe later — keep playing" → "Not yet — keep this Finn on this device." Keeps the escape hatch fully intact but stops framing *leaving* as the neutral/obvious path.
*Why:* the decline shouldn't out-frame keeping. *Serves:* Beat 6.

### CROSS-CUTTING — the surfaces every L1 beat passes through

**19 · Lesson TITLE hierarchy** — `#lesson b.ttl` (typography).
Every lesson header (`WHAT IS A CANDLE?`, etc.) rendered at 11px — an *eyebrow*, whispered above a 13px body. Now 15.5px / 800-weight — an authoritative title.
*Why:* the card *is* "the someone showing you"; its title should carry authority. *Serves:* **Memories 2 & 3**.

**20 · LEARN card entrance ease + scale** — `#lesson` (transition).
The most-seen surface in L1 now blooms in with a soft cubic-bezier settle + a whisper of scale, instead of a flat linear slide.
*Why:* every teach beat should feel authored, not "a div appeared." *Serves:* Wonder / craft.

**21 · LEARN + PRACTICE modal bloom-in** — `openIntroLesson` + `openConceptPractice` (transition).
The full-screen takeovers hard-cut in immediately after the smoothly-animating card. Both now bloom in (opacity + scale, WAAPI, try/catch-guarded) — consistent craft right where "the candles are alive" is being manufactured.
*Why:* the wonder reveal should bloom, not snap. *Serves:* **Memory 2**.

*(Plus the BUILD_TAG bump to 277 with the full change note.)*

---

## 2. Verification

| Check | Result |
|---|---|
| Syntax (all 4 inline script blocks) | ✅ parse clean |
| Boot (build 277, live, `?fresh=1`) | ✅ **zero console errors** |
| Frame loop with edits (48+ pumped frames) | ✅ compass / landing / intro-overlay paths execute with **no thrown errors** |
| CSS edits live (computed styles) | ✅ lesson title 15.5px/800/#7fd6ff · HOLD pill 14px/13–26 · cold-open gradient present |
| `verify.js` regression gate | ✅ **10 pass · 0 fail** · 1 warn (pre-existing CFG, approved) · 1 skip (puppeteer) |
| TES guardrail (#11) | ✅ MIN_TRADE_CANDLES=30 · SETUP_UNLOCK order intact · outcomes AUTHORED |
| `index.html` mirror (#8) | ✅ sha256 identical |

**Honest limitation — no pixel screenshot in this harness.** The browser pane runs the tab *backgrounded*, so this game's rAF render loop is paused and canvas pixels screenshot as black (confirmed by a direct canvas test-fill that still captured black). Verification here is therefore code-level + gate-level, which is strong (syntax, zero-error boot, clean frame execution, live CSS/data, full regression pass) but **not a substitute for one human visual pass on a foregrounded device.** Per the project's standard `?fresh=1` beginner-mode workflow, the founder should eyeball the seven beats on device before this is called *BEGINNER MODE VERIFIED*.

---

## 3. Deliberately Deferred (ready-to-apply, but not this pass)

- **Trader-Mode camera-dive ease** (the Governing-Image "fall into the chart" beat). A safe rate-curve refinement (endpoints unchanged) — but camera *feel* can't be A/B'd via screenshots in this harness, and getting the signature move *worse* is a real risk. Ready to apply pending a live feel-test.
- **"Breathing" candle giants** on the LEARN chart (so "alive" is felt, not just claimed). It touches the *shared* LessonChart draw loop; flag-gated but deferred until it can be verified not to bleed into other scenes.

---

## 4. Remaining Weaknesses — the gap to a true 10/10 Level 1

*Ordered by leverage. Most are beyond a safe copy/CSS/VFX pass — they need founder decisions or protected changes.*

1. **Visual pass on device.** Everything above is code-verified but not eyeballed. The single highest-priority next step is a foregrounded `?fresh=1` playthrough of the seven beats. *(Confirm especially: the bet's held-breath timing feels like suspense not lag; the "It holds your weight!" beat fires on the real drop-in; the compass reads as invitation not clutter; the YOU CALLED IT punch isn't too big on a small phone.)*
2. **Cold-open guaranteed hero frame + fast auto-skip** (audit P0). The gradient fallback removes *black*, but a truly premium cold-open paints an instant hero frame and auto-skips to the goal card if the video never decodes — beyond a CSS layer.
3. **The quest-spine card on the happy path** (audit P0). The clearest statement of the game's promise is still shown only on SKIP; happy-path players should see it too.
4. **A can't-fail retrieval tap** after the first win ("Why did this win? [I waited] / [I got lucky]") — converts recognition into understanding. New interaction, not a polish edit.
5. **Audio integrity.** Confirm the `fanfare` sting is distinct and full, and that the AudioContext unlock is bound to the first gesture so the ~30s cold-open isn't silent (audit).
6. **Accessibility / photosensitivity.** The new knighting sweep is reduced-motion guarded; the heartbeat + camera-punch + shake stack for a 10-year-old audience still needs a verified `prefers-reduced-motion` path and a photosensitivity review (audit).
7. **The Gambler's reward = the Trader's Glasses** (Bible Guardian 1). Canon currently confers the Glasses at Guardian 2 and the Journal at the Gambler. The knighting flash is a safe stand-in; conferring the *Glasses* at the Gambler (as the Bible wants) is a protected reward-mapping change needing founder sign-off (audit D4-adjacent).
8. **"Identical journey" pre-conditions** (audit G2/G3, out of L1-polish scope): the faction pick + live market data still branch the experience, and `DEV_ALWAYS_FRESH`/once-ever flags still block a clean returning-player L1. These are the Operation First Impression sprint items, not a polish pass.

---

## 5. Campaign-Bible Memory Coverage (Level 1)

| Memory | Beat | Covered by this pass |
|---|---|---|
| **M1** — the living city that held my weight | 0 | #1 ocean fallback, #3 landing beat, #2 compass (reaching it) |
| **M2** — the first thing I did, I got right | 2 | #8 held breath, #9 unscripted reveal, #10 punch (+ #19/#20/#21 card craft) |
| **M3** — the candles were alive (body=fight, wick=tried & lost) | 1 | #5 caption, #6 callout, #7 practice echo |
| **M4** — shells flew home, I felt rich | 3 | #11 exposure swell, #12 first-win punch |
| **M5** — the heartbeat, Finn's worry, and me not moving | 4 | #13 HOLD dominance, #14 relief snap |
| **M7** — the Glasses flashed and it asked me to save | 6 | #15 fanfare, #16 knighting sweep, #17 save reframe, #18 decline |

*(M6 — the Eel's fake-out — lives at the end of Level 1 / start of the open game and is a candidate for the next pass.)*

---

*Every change here serves a memory. Nothing was added because it was technically impressive. The engine still serves the feeling; the feeling still serves the sentence — "I can actually read a chart."*
