# ChartQuest — High-Impact Polish Report

Quality pass, no redesign. Progression, bosses, curriculum, shell economy, level structure and
the trading systems are untouched — this only makes the existing experience feel premium. Scripts
parse 4/4; `index.html` synced; service worker **v39**.

---

## 1. Trade importance — findings & changes

**Finding:** trades *worked* but didn't *land*. Discovery, win, and loss all used the same quiet
treatment (a small right-aligned floater, a soft flash), so the core fantasy didn't feel like the
main event. The fix raises **emotional significance**, not complexity — no new indicators.

- **Discovery now announces itself.** The setup banner **pops in** (a spring scale-up) on top of
  its existing glow-pulse, and the **turtle locks in** (`shellEmotion = 'focused'`) the instant a
  setup appears. The world already freezes at a setup; now it *reads* as "stop — this matters."
- **The outcome is the peak.** Win/loss now shows a **large, centred P&L** with a soft colour halo
  (vs the old small corner text), a **stronger screen flash** (green on win, red on loss), a
  **win/loss sting**, and — on a win — a short **burst of canonical shells** that arc up and fade.
  The shell burst ties the feeling directly to the fantasy: *a good trade grows your capital.*
- **A loss lands without punishing.** Bigger red flash + a firmer screen shake, while the existing
  "good setup — variance, not your fault" reassurance on A/B losses stays. Consequence is felt; the
  player isn't shamed.

Net: when a trade appears and when it resolves, the moment now carries weight — trading feels like
the headline act of the level.

## 2. Intro improvements

- **Removed the candle-landing dead space.** The old flow warped, then sat in a landing/impact beat
  before the Market Maker. That pause is gone: the warp now flows **straight into the Market Maker
  reveal** on a single white flash → dark teaser. No pause, intentional transition, tighter hook.

## 3. Market Maker improvements

- **Rewrote the dialogue from villain to mentor.** Out went "they become my liquidity" and "I will
  be waiting" (threats). The new lines frame him as patience, discipline, and mastery — the
  *destination* of the journey, not an enemy:
  > "Most arrive chasing quick riches. The market has other plans."
  > "I am patience. I am discipline. I am every lesson the charts will teach you."
  > "Grow. Learn from each Guardian. Master yourself before you master the market."
  > "Walk the whole journey… and our paths will meet." — **THE MARKET MAKER**

  The player leaves minute one understanding: *I am beginning a long journey to eventually face this
  entity* — through wisdom and growth, not a boss-rush grudge.

## 4. Turtle improvements (subtle — same silhouette)

All additive; the outline, proportions, and small-size readability are unchanged.

- **Idle breathing** — a calm rise/fall when standing still (including while reading a setup).
- **Blinking** — the goggle lenses briefly compress every ~3.2 s, so they read as real eyes.
- **Subtle lens glow** — a soft cyan sheen that gently pulses on the lenses (premium glass).
- **Smoother shell** — a soft top-left sheen on the dome (clipped to the shell, no new shape) for a
  cleaner, more premium read.
- **Better jetpack flame** — a soft glow while boosting and a **white-hot core**, so the boost feels
  energetic and crisp.

Deliberately *not* done: no redesign, no added complexity, no new parts. Simplicity preserved.

## 5. 140-candle pacing observations

Pacing-test value set to **140 candles/level** (down from 160), keeping **~12 visible candles** and
the calmer 58 px/s walk.

- **Base traversal:** 140 candles × ~33 px ≈ 4,620 px ÷ 58 px/s ≈ **80 s** of pure movement.
- **With interaction** (the turtle halts at each setup; trades resolve over several candles; lesson
  portals pause): a typical engaged run lands **~4–7 minutes** — comfortably inside the onboarding
  zone without overstaying.
- **Onboarding speed:** Level 1 still hits its first momentum trade quickly (warm-up unchanged), so
  140 doesn't slow the *start* — it lengthens the *exploration middle*, which is where it should.
- **Trade frequency:** the setup cooldown is candle-based, so 140 candles yields roughly **6–9 setup
  opportunities** per level — enough to clear the trade gate and take a few extra without grinding.
- **Completion satisfaction:** unchanged-rich intermission (badge, confetti, performance, knowledge
  progress, account breakdown, upcoming Guardian) lands after a fuller — but not bloated — level.

**Recommendation:** 140 feels like the right pacing-test floor. Confirm with a real playthrough; if
the middle still feels short for engaged players, 150 is the next step up — but do **not** jump to
160 without observing 140 first, as instructed.

## 6. Screenshots

Honest note: faithful screenshots aren't possible from here. The turtle polish (breathing, blink,
lens glow, flame core) and the intro are **animated and first-play only**, and the in-house preview
tools are flat/SVG and forbid the glow the art relies on — a mockup would misrepresent it. The only
true-to-game capture is the live build. I can **deploy v39** and grab real screenshots of the
running game (as done previously), or you can preview locally on a fresh first-play. Say the word.

---

### Files modified
`chart-quest.html` (banner pop-in + turtle-locks-in; big centred win/loss floater + shell-burst
particles + stings; intro warp→Market-Maker direct; Market Maker dialogue; turtle breathing/blink/
lens-glow/shell-sheen/flame-core; perHour 160→140) · `index.html` (synced) · `sw.js` (v39).

*Polish only. No new systems, no redesign.*
