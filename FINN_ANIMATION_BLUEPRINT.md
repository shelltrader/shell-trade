# FINN — ANIMATION BLUEPRINT (Phase 4)
**Status:** PRODUCTION GUIDE · ranks under `FINN_CANONICAL_CHARACTER_SYSTEM.md` (Docs 4–8) and the Animation Bible.
**Purpose:** the key-pose / timing / easing production plan for every reusable Finn clip. **No clip is animated here** — this is the blueprint the Website (Phase 5) and Gameplay (Phase 6) guides implement.

**Reading the blueprints:** each defines **Key Poses A–D**, timing, ease, follow-through, secondary motion, hold frames, loop rule, and randomization. All obey the immutable order **eyes → head → body** (Doc 8) and **legs stay static in-game** (Doc 3). Angles: +nose-up.

---

## Clip library index
Idle-Breathe · Blink · Curious-Peek · Weight-Shift · Eye-Dart · Jetpack-Puff · Chart-Glance · Run-Cycle · Jump→Fall Arc · Vertical-Boost · Landing-Squash · Victory-Hop. Each maps to a canon state (Anim Bible) or idle (Doc 7).

---

### IDLE-BREATHE — the always-on baseline
- **A** rest (0°) → **B** inhale (body +1.5–3px up, micro scaleY +1.2%) → **C** apex hold → **D** exhale (settle).
- **Timing:** 4.5–9s full cycle, sinusoidal. **Ease:** in-out both directions, no linear.
- **Follow-through:** compass +tail lag ~1 beat behind the body rise.
- **Secondary:** flame pilot flicker (independent), lid idle.
- **Hold:** brief at apex only. **Loop:** seamless (A=D). **Random:** ±20% period jitter; never syncs across instances (seed `animT+seed`).

### BLINK — overlay onto any pose
- **A** open → **B** lids down (`ry→15%`, pupils hidden) → **C** closed (1 frame) → **D** open.
- **Timing:** closure ~0.12s; interval **2.4–4s non-metronomic**. Double-blink variant during Curious-Peek.
- **Secondary:** glasses lens height follows the lid (when unlocked). Everything else continues unchanged.
- **Loop:** re-armed by random timer. **Random:** interval + single/double weighted.

### CURIOUS-PEEK — the personality signature
- **A** rest → **B** neck extends (0→~6u), head leads out → **C** look L→R→up, small smile, **double-blink** → **D** retract & settle.
- **Timing:** ~1.6s active; fires ~every **11s (±3s)**. **Ease:** eased extend, softer retract (follow-through overshoot then settle).
- **Secondary:** compass sways ≤3° on the retract; body counter-shifts slightly.
- **Hold:** ~0.3s at the "up" look. **Loop:** one-shot overlay → returns to Idle-Breathe.

### WEIGHT-SHIFT — "standing around"
- **A** centered → **B** lean to one side (±1.4°, subtle rock) → **C** hold → **D** return / opposite.
- **Timing:** 6–9s. **Ease:** slow in-out. **Secondary:** shell settles, tail counter-bounce. **Random:** side + dwell time.

### EYE-DART — micro attention *(requires a pupil layer — see Website Guide)*
- **A** eyes forward → **B** pupils flick to a target (lead/overshoot) → **C** brief hold → **D** ease back.
- **Timing:** 0.15s flick, 0.4–1s hold. **Rule:** **eyes move alone**, head still. **Random:** target + cadence.

### JETPACK-PUFF — living equipment
- **A** pilot flame (4–6u) → **B** brief flare (8–12u) + pack shrug ≤3° + tiny body bob → **C** decay → **D** pilot.
- **Timing:** 0.5–0.8s; fires ~every 8–14s (rare). **Secondary:** compass dips on the bob. **Random:** interval.

### CHART-GLANCE — the delight beat (idle E)
- **A** rest → **B** head yaw ≤25° toward a passing candle/the player → **C** small approving nod → **D** return.
- **Timing:** ~1.2s; rare (15–25s). Eyes lead the yaw. **Loop:** overlay → Idle-Breathe.

### RUN-CYCLE — grounded locomotion
- **A/B** 2-frame body-rock (`sin(animT·9)`): bob 1.4px, in-phase micro-squash, tiny forward lean.
- **Legs:** **static (baked in `run.png`)** in-game; rigged productions only may add the diagonal gait (front ±step / rear counter-phase, feet ±2.2u) **after proving it beats static.**
- **Secondary:** compass ≤3° bounce, tail subtle. **Loop:** seamless 2-frame. **Flame:** pilot only.

### JUMP→FALL ARC — one continuous arc, no frame snap
- **A** gather (anticipation, legs load) → **B** launch (+6–10° nose-up, jetpack puff `flameT 0.18`, 8–12u burst) → **C** apex (ease to level, legs tuck slightly) → **D** fall (−6 to −14° nose-down, scaling with vy; legs splay; speed-lines intensify).
- **Ease:** ease-out on rise, ease-in on fall; **smooth nose-up→nose-down, never a pop.** **Secondary:** compass down-then-settle at launch, lifts on the fall.

### VERTICAL-BOOST — the main event, **stays quadrupedal**
- **A** trigger → **B** thrust (**+8–12° nose-up MAX — never upright**), legs draw in/back → **C** climb hang (reduced gravity) → **D** into Fall.
- **Flame:** **20–25u** column, orange→yellow→white; double-boost largest. Thrust reads via **flame + speed lines**, not a stand.
- **Secondary:** compass pushed down by up-accel then settles; tail streams back.

### LANDING-SQUASH — render-only, feet-anchored
- **A** contact → **B** squash (0→1 over ~0.11s, feet planted, neck/head dip `landC·3.4`) → **C** recover (1→0 over ~0.11s) → **D** rest.
- **Total:** 0.22s. **Never touches physics.** **Secondary:** dust puff at feet, compass dip-settle, small tail bounce.

### VICTORY-HOP — celebration, **still 4 legs**
- **A** anticipation dip → **B** hop (front pair lifts in a cheer — **never a biped stand**), big smile, eyes bright, glasses push-up (`adjustT`) → **C** airtime (celebratory jetpack puff + sparkle) → **D** land & settle happy bob.
- **Ease:** snappy up, soft land. **Loop:** one-shot; may repeat with jitter. **Secondary:** compass bounce, tail perky.

---

## Cross-clip production laws (from Doc 8)
Never perfectly still · eyes→head→body · anticipation before action · ease in/out (no hard stops) · secondary + follow-through always · weight before speed · readable silhouette every frame · proportions frozen (head never resizes) · no new shapes (no arms/hands/eyebrows/5th limb/upright) · blink is life not a metronome.
