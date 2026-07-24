# FINN ANIMATION SYSTEM
### The Character Brain, the Weight Model, and the Living Idle · Phases 4–6, 8–9

**Status:** 🔴 **PROPOSAL — AWAITING APPROVAL. No code was written or changed.**
**Companion to:** `FINN_RENDERER_V3_ARCHITECTURE.md` · **Governed by:** `FINN_BEHAVIOR_BIBLE.md` (intent) and `FINN_CANONICAL_CHARACTER_SYSTEM.md` (geometry, limits).

> **The law of this system:** *No animation is ever authored. Animations are what a **state** looks like when it drives the **layers**.* Nothing moves without a reason.

---

# §1 · PHASE 4 — THE CHARACTER BRAIN

## 1.1 States (canon-aligned; no new emotions invented)

The Behavior Bible already ratified the state set. V3 **implements** it rather than competing with it. The brief's vocabulary maps on cleanly:

| Brief's word | Canonical state | Home? |
|---|---|---|
| Idle / Relaxed | **Calm** | ✅ home state |
| Observing / Waiting | **Waiting** | |
| Curious | **Curious** | |
| Thinking | **Thinking** | |
| Focused | **Focused** | |
| Careful | **Concerned** | |
| Confident | **Proud** *(for the player — never cocky)* | |
| Celebrating | **Celebrating** | |
| Teaching | **Teaching** | |
| — | **Encouraging** · **Recovering** | |

**Forbidden, permanently:** Angry · Arrogant · Cocky · Panicked · Greedy · Mocking · Despairing. No trigger may route to them. (Bible §5.)

## 1.2 States do not play animations — they emit **intents**

A state publishes a small intent vector. The layers read it. This is why nothing is ever "canned."

```
Intent = {
  gazeBias      : −1…+1   // where attention wants to sit
  gazeLatency   : ms      // how fast eyes commit
  postureBias   : −1…+1   // lean back (guarded) ↔ lean in (engaged)
  tempo         : 0.6…1.3 // global time-scale of every layer
  blinkRate     : ×       // multiplier on the blink Poisson rate
  breathDepth   : ×       // amplitude + period of the breath
  guard         : 0…1     // shell-check likelihood
  settleBias    : 0…1     // pull back toward Calm
}
```

| State | gazeBias | posture | tempo | blinkRate | breath | guard |
|---|---|---|---|---|---|---|
| Calm (home) | drift | 0 | 1.0 | 1.0× | 1.0× | 0.05 |
| Waiting | steady, low | −0.1 | 0.85 | 0.8× | 1.15× deep/slow | 0.1 |
| Curious | to salience | +0.5 | 1.1 | **1.6× + double** | 1.0× | 0.15 |
| Thinking | slow scan | +0.2 | 0.9 | 1.3× | 1.05× | 0.05 |
| Focused | locked | +0.3 | 1.0 | **0.55×** (stares) | 0.85× shallow | 0.05 |
| Concerned | to threat | **−0.4** | 1.15 | 1.2× | 1.2× | **0.75** |
| Teaching | to player | +0.35 | 0.95 | 1.0× | 1.0× | 0.0 |
| Celebrating | up/player | +0.6 | 1.25 | 1.4× | 1.3× | 0.0 |
| Proud | to player | +0.2 | 1.0 | 1.0× | 1.1× | 0.0 |
| Encouraging | to player | +0.25 | 0.9 | 1.1× | 1.05× | 0.0 |
| Recovering | down→level | −0.3→0 | 0.8 | 1.5× | **1.4×** (a real exhale) | 0.3 |

**Consequences:** blinking is no longer random — Finn *stares* when Focused and *flutters* when Curious. Looking is no longer random — the eyes go where attention is. **Random motion is deleted from the system.**

## 1.3 Transitions

- **Eyes lead → head → body.** Every transition is staged, never simultaneous.
- **Gravity to Calm.** Absent input, every state decays home within 2–5 s (`settleBias`).
- **No hard cuts.** All transitions cross-fade through a Calm-ward settle beat.
- **Intensity cap.** Even Celebrating stays contained. Restraint is characterisation.
- **Anticipation.** Any state change ≥ 0.4 intent-distance inserts a 60–120 ms opposite-direction anticipation beat.

---

# §2 · PHASE 8 — ATTENTION (why he looks at anything)

Gaze is never scripted. The world publishes **salience**; the brain arbitrates.

```
Finn.notice({ type, x, y, weight, ttl })
```

| Source | Weight | Decay |
|---|---|---|
| Player / cursor / input | 1.00 | slow |
| Danger / trap / near-stop | 0.95 | fast |
| Boss entrance | 0.90 | slow |
| Big candle (|Δ| > 2σ) | 0.65 | fast |
| Trade open / close | 0.60 | medium |
| Treasure / unlock | 0.55 | medium |
| UI / menu opened | 0.35 | slow |
| Ambient (motes, candles) | 0.10 | fast |

**Arbitration:** highest `weight × decay(t)` wins, with **hysteresis** (a new target must beat the current by 25% to steal focus) and a **refractory period** (no re-target within 350 ms). Ties resolve by the Bible's priority order — *player → chart → trap → boss → world → UI.*

**Saccade model:** pupils commit in **80–140 ms** → head yaw follows after **90 ms** (≤ 25°) → body lean follows after **180 ms** (only if `|gaze| > 0.5`). Overshoot ~8%, then settle. This is why it will never look robotic: the three stages are springs, not keyframes.

*(Monolithic mode: pupils and head are collapsed onto the root, so a saccade renders as the whole-body lean we have today. Rigged mode: the same code produces real eye-darts and a head turn. **No behaviour rewrite.**)*

---

# §3 · PHASE 5 — THE LIVING IDLE (never synchronised)

Eleven **independent** systems, each with its own clock, phase seed, and amplitude:

| # | System | Driver | Mode |
|---|---|---|---|
| 1 | Breathing | slow oscillator | monolithic + rigged |
| 2 | Weight shift | slow oscillator | both |
| 3 | Micro balance correction | noise + spring | both |
| 4 | Blink | Poisson event | both (**already live**) |
| 5 | Eye tracking / darts | attention + saccade | rigged (pupils) |
| 6 | Micro head rotation | attention + noise | rigged (head) |
| 7 | Neck stretch (Peek) | scheduled behaviour | rigged (neck) |
| 8 | Shell adjustment | spring off root accel | rigged (shell/body split) |
| 9 | Jetpack stabilisation | spring + rare puff | both (flame), rigged (pack shrug) |
| 10 | Flame turbulence | curl-noise field | both |
| 11 | Shadow response | derived from height/squash | both |

## 3.1 The desynchronisation guarantee (this is the whole trick)

Humans detect a repeating loop within seconds. So the system **must be mathematically incapable of repeating.**

1. **Irrational frequency ratios.** Continuous oscillators use base periods scaled by **φ (1.618…), √2, √3, π/2** — their least-common-multiple is infinite, so they can never re-align.
2. **Poisson event scheduling.** Discrete beats (blink, glance, shell-check, puff) fire from an exponential distribution with a **refractory floor**, not a fixed interval.
3. **Per-instance seed.** Every Finn (game, website hero, trailer) seeds from instance identity — two Finns on one screen never sync.
4. **Amplitude jitter.** Every beat's amplitude varies ±15%.
5. **Never two overlays at once** (min 2 s gap), and every one eases in/out and returns to Calm.

**Acceptance test:** record 60 s at 60 fps; autocorrelation of the root transform must show **no peak > 0.3 at any lag > 1 s.**

---

# §4 · PHASE 6 — WEIGHT (making a rigid body have mass)

This is what fixes *"a picture moving up and down"* — and **all of it survives into the rigged era.**

| Principle | Model | Monolithic? |
|---|---|---|
| **Arc motion** | Root traces a gait arc (contact → low → passing → high), forward-biased. **Never a pure sine translate.** | ✅ |
| **Squash & stretch** | Driven by **vertical acceleration**, not phase: `squash = clamp(−k·a_y)`. Compress on contact/deceleration, extend on lift. Volume-preserving (`sx = 1/√sy`). Feet-anchored. | ✅ |
| **Weight transfer** | Pivot **oscillates between the front-foot and rear-foot contact points** in step with the gait, instead of a fixed feet-centre. This is what makes a quadruped rock instead of bob. | ✅ |
| **Compression / recovery** | Landing squash extends into a **damped recovery** (2 bounces, ratio 0.35), not an instant reset. | ✅ |
| **Shear / lag** | Upper body trails the lower via a critically-damped spring → the body **flexes** instead of translating rigidly. | ✅ |
| **Momentum** | Root acceleration feeds every secondary spring. Nothing is keyframed. | ✅ |
| **Overshoot** | Springs use ζ ≈ 0.6 (under-damped) for head/compass/tail; ζ ≈ 1.0 for the body. | rigged for parts |
| **Follow-through** | Head, compass, tail, jetpack settle **after** the body stops (1–3 frame lag). | rigged |
| **Anticipation** | 60–120 ms counter-move before jump, boost, hop, shell-check. | ✅ |
| **Easing** | All beats use `easeOutBack` / `easeInOutCubic`. No linear, no raw sine at extremes. | ✅ |
| **Ground contact** | **Shadow scales with height + squash** (`r ∝ 1/(1+h)`, opacity ∝ contact). Today it is a constant ellipse — this alone breaks the weight illusion. | ✅ |

**Overlapping action is the single biggest missing cue,** and it is the one thing that *requires* the rig (§Architecture 3.2). Monolithic mode gets 80% of the felt improvement; the last 20% needs 7 pieces of art.

---

# §5 · PHASE 9 — INTERACTION (he acknowledges the world)

One event bus, shared by **game, website, trailers, marketing**.

| Event | State | Attention | Body |
|---|---|---|---|
| **Landing** | Calm | down→level | squash + damped recovery + dust |
| **Jumping** | Focused | up, ahead | anticipation crouch → stretch |
| **Hovering / boost** | Focused | where he's flying | jetpack stabilisation, micro-thrust corrections |
| **Big candle** | Curious | glance to candle | lean in, then **pointedly does not chase** |
| **Boss entrance** | Concerned→Focused | lock to boss | feet plant, shell-check, squares up |
| **Victory** | Celebrating→Proud | player | contained cheer-hop, glasses push-up, puff |
| **Defeat / loss** | Recovering | chart→player | recoil −8°, still beat, **slow exhale**, head lifts |
| **Trade open** | Focused | chart | settle, breath slows |
| **Trade close** | Proud / Recovering | outcome | nod / settle |
| **Menu / UI opened** | Waiting | glance to panel | patient plant; never nags |
| **Waiting / no input** | Waiting→Calm | slow drift | the living idle |
| **Loading** | Calm | camera (rare) | idle + a rare Section-8 surprise |
| **Scrolling (web)** | Curious | toward scroll direction | slight parallax lean |
| **Website hero** | Teaching | to viewer, then CTA | welcoming, warm |
| **Cursor proximity** | Curious | to cursor | lean a beat, then shy away |

**Rule:** every reaction is a *state change + a salience event*. Never a bespoke animation. That is why this scales to five years of features without new animation code.

---

# §6 · BLEND & PRIORITY

1. **Physics pose wins** (jump/boost/land/shell frames are non-negotiable — gameplay reads).
2. **State posture** modulates it.
3. **Attention** modulates the head/eyes.
4. **Idle layers** ride on top at the smallest amplitude.
5. **FX** (flame, shadow, dust) derive from the final transform, never the other way round.

---

# §7 · THE SUCCESS METRIC

Not "more animation." The test is:

> **Watch Finn stand still for 10 seconds. Do you believe he is alive?**

Formally: (a) autocorrelation shows no loop, (b) at least two systems are visibly out of phase at any instant, (c) every motion can be traced to a state and an attention target, (d) an animator asked *"why did he just do that?"* always has an answer.

*Proposal only. No code, art, gameplay, or canon was modified.*
