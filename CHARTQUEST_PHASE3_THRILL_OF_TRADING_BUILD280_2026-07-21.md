# ChartQuest — Phase 3: The Thrill of Trading · Build 280
## Change Report

**Date:** 2026-07-21 · **Build:** 279 → **280** · **Source of truth:** `chart-quest.html` (mirrored to `index.html`, sha256 identical) · **Gate:** `verify.js` 10 pass · 0 fail · 1 warn (pre-existing CFG, approved) · 1 skip (puppeteer)

**The through-line: restraint.** Phase 3 is about making a trade *felt* — quiet, focused, tense, personal; "the silence before an important decision." Win = **relief**, not fireworks. Loss = **dignity**, never shame. So this pass **adds a quiet layer** to the already-rich build-273–276 trade feel rather than piling on spectacle — and it deliberately leaves the existing win punch untouched (see §7 and the TX-01 note).

**The keystone: the world goes quiet when you commit.** The single highest-leverage, most restrained move — the one the brief names first ("silence is a design tool," "reduction in music intensity") — is **music ducking**. It also solves the brief's psychology ask (trading should feel *fundamentally different from platforming*) on the one channel that was doing the opposite: today the trade bed plays *louder* than the explore bed, so committing capital added musical intensity exactly where the brief wants a hush.

---

## 1. Emotional improvements

- **Entry = "this matters," heard as a hush.** The instant capital is committed, the music **steps back** (to 55% of the bed). A room going quiet focuses attention harder than any added sound — the player leans in without knowing why.
- **The Hold = tension in near-silence.** As the trade presses toward the stop (the scare), the bed drops toward **near-silence (34%)**, so the existing heartbeat vignette and the ticking P&L become the loudest things in the room. Quiet tension reads as *personal*, not loud.
- **The Win = relief, not celebration.** When you were *right* and price runs to target, the music **breathes back warm** (85%, on a slow ramp) — a rising exhale of relief, located at the tension→release turn, *layered under* the existing payoff rather than replacing it. Release → satisfaction → confidence, on the audio channel that previously had none.
- **The Loss = dignity.** A losing trade **never gets the warm breathe-back** — it stays hushed through the stop-out and returns to the calm bed gently. Quiet respect, not a cheerful snap-back. "I was responsible," not "I was stupid."

## 2. Audio improvements (the core of this sprint)

- **New `GameMusic.duckTo(level, ramp)`** — ramps only the **music bed**. Critically, stings and move-SFX route through a **separate bus straight to the audio destination** (verified at the sting/`fx` bus vs. the music `master`), so ducking the bed **can never quiet the win/loss confirm**. Idempotent (no per-frame ramp-spam) and mute-safe.
- **A declarative duck arc** driven by `trade._drivePhase` (reads state only — never the outcome/odds/dwell): open → **0.55**, the held-breath verdict (the win-dip *and* the loss-stop-out, equally) → **0.34**, the winning run → **0.85** (warm, slow), resolve → **1.0** (full bed). One expression delivers the entire entry→hold→release arc and can never desync from the authored path.
- **No casino sounds added.** The whole audio move is *subtraction* — pulling the bed down and letting it return. Nothing new is played except the confirms that already existed.

## 3. Visual improvements

- **Deferred, on purpose.** A subtle sustained *visual* hush (a barely-perceptible dim so a held trade looks quieter than free-roam) was designed and is ready, but I did **not** ship it this pass: the harness cannot screenshot the canvas, and the brief's own rule — *"if a player consciously notices an effect, it is probably too strong"* — makes an unverifiable visual dim the riskiest thing to ship blind. The **music duck already delivers the platforming-vs-trading differentiation**; the visual layer is a flagged on-device follow-up (§8).

## 4. Camera improvements

- **Deferred, on purpose (with a real reason).** A literal "camera breath during the hold" is unsafe here: the SL/TP/ENTRY tags render in **screen space** while candles ride the **world transform**, so any positional/zoom breath desyncs the decision surface from the chart. The restrained substitute (a light-based breath) is the same class of unverifiable visual as §3 and is flagged for on-device (§8). No camera math was touched.

## 5. Timing improvements

- The duck **ramps** are the timing design: a **0.5s** hush on entry and at the verdict (quick enough to feel like focus, slow enough to be unnoticed), and a deliberately **slower 0.9s** warm return on the win (relief *rises*, it doesn't snap). The held-breath haptic is gated to fire **once** per trade at the deepest press.

## 6. Psychological improvements

- **Trading now sounds different from platforming.** Movement lives in the full, alive bed; a decision lives in a hush. The ear learns the difference before the mind does — exactly the brief's "movement vs decision-making" split.
- **Held-breath haptic.** One soft body-pulse at the deepest point of the scare — a *felt* gulp the eyes-only heartbeat couldn't deliver. It fires on **any** pressure phase (the win-dip and the loss drop/false-hope alike), so it can never telegraph the outcome. Below conscious notice: felt, not seen.

## 7. Why each change deepens investment *without* manipulating

Every change here builds **trust**, not compulsion:
- **It works by subtraction.** Ducking the music removes stimulation; it doesn't add a dopamine hit. That's the opposite of slot-machine design — the tension comes from *uncertainty* (protected: no drive constant, dip depth, or outcome was touched), and the relief comes from the *release* of real tension, not from noise.
- **The win breathes; it doesn't explode.** The relief is a warm return, not a jackpot fanfare — the player *smiles*, they don't *laugh*.
- **The loss is respected, never punished.** No harsh cut, no punishing sound; a quiet, dignified settle.
- **Nothing is loud enough to notice.** Consciously-imperceptible effects can't manipulate — they can only frame the honest emotion the trade already contains.

**The TX-01 line I held:** the Trade Constitution's Parity Law requires a win register **≥** a loss on every channel — the build-276 fix for "the party was quieter than the funeral." Phase 3's "relief not fireworks" could tempt a dial-back of the build-276 camera-punch / `bigwin` sting — but softening it would re-open that exact wound. So I **did not touch a single win channel.** The quiet/relief layer sits *beneath* the existing punch (a warm exhale after the impact), and parity holds by construction: the win's loudest live moment (the 0.85 run) exceeds every loss phase, and the confirm stings are on a bus the duck can't reach.

## 8. Remaining moments not yet worthy of the Campaign Bible

*Honest list — these are the next moves, most needing your on-device ear/eye since the harness can neither hear audio nor screenshot the canvas.*

1. **On-device audio tuning (required).** The duck depths (0.55 / 0.34 / 0.85) and ramps are best-guesses. On a phone speaker the verdict hush may need to be gentler or deeper. This is the one thing that *must* be tuned by ear before it's "worthy."
2. **Is the build-276 win still too "fireworks"?** Now that a quiet relief layer frames it, the camera-punch + `bigwin` sting may read as too celebratory for Phase-3's "relief not fireworks." **Your call** (it's TX-01-protected canon): once you hear the release layer under it, decide whether to trim the punch amplitude or defer the `bigwin` — I flagged it rather than gutting it.
3. **The visual hush (differentiation, part 2).** A barely-perceptible sustained dim + a light-based "breath" during the hold — designed, deferred for lack of visual verification. Ship once you can eyeball it.
4. **Loss stop-out dignity beat.** A brief slow-mo *on the stop-out* (equal to the win's, never above — TX-01) so the player pauses *with* the loss for a quarter-second. Designed, deferred as another unverifiable magnitude.
5. **The heartbeat's faint tell.** The shipped `scareHeart` heartbeat fires on the **win-dip only** — a veteran could read its presence as "this one recovers." Out of scope here (it's shipped, and L1–3 outcomes are authored anyway), but worth closing for the felt-uncertainty purist.
6. **Ambient low-bed during the hush.** True "low ambience" (a near-subliminal room tone under the ducked music) would deepen the silence-as-texture — a future audio-design pass.

---

## Verification

| Check | Result |
|---|---|
| Syntax (all 4 script blocks) | ✅ parse clean |
| Boot (build 280, live `?fresh=1`) | ✅ **zero console errors** |
| `GameMusic.duckTo` present + callable (all arc levels, idempotent) | ✅ no error |
| Arc + held-breath haptic run every frame (40-frame pump) | ✅ no throw |
| TX-01 safety (sting/SFX bus separate from music master) | ✅ verified in code (18689/18730 vs 18579) |
| `verify.js` gate | ✅ 10 pass · 0 fail · 1 warn (pre-existing CFG) · 1 skip |
| TES (#11) | ✅ untouched |
| `index.html` mirror | ✅ sha256 identical |

**Honest limitation:** the harness can neither hear audio nor screenshot the canvas (backgrounded tab), so the *logic* is verified (duck helper, arc branches, latch, zero-error frame execution) but the **feel — the actual hush, the warmth of the breathe-back — must be heard on device.** Scan the QR (Desktop, build 280), take a guided trade with sound on, and listen: the world should quiet as you commit, nearly vanish as price presses the stop, and breathe warmly back as it runs to target.

*When this is tuned, a player won't say "it teaches trading." They'll say "I felt what a trade feels like" — because the room went quiet when their money was on the line.*
