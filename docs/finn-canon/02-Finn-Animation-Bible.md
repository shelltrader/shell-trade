# FINN — ANIMATION BIBLE (CANONICAL)

Production specs for the 13 gameplay animations. Each maps to a real state in `chart-quest.html` (`turtle.*` flags + `CFG` physics). **Angles are in degrees, positive = nose-up.** Every open pose keeps **4 legs, the compass, the jetpack, and a right-facing stance**. Nothing here changes physics — these are the visual contracts the renderer must satisfy.

**Shared drivers (already in `drawTurtle`):**
`turtle.animT` (clock) · `moving = onGround && !halt` · `turtle.flameT` (flame intensity) · `turtle.tucked` / `turtle.spinning` (ball states) · `turtle.rot` / `spinPhase` (rotation) · `turtle.landT` (landing squash) · `shellEmotion` (face).

---

## 1. IDLE
- **State:** `onGround && !moving && !tucked && !spinning`.
- **Body angle:** 0°, with a slow ±1.4° weight-shift lean and a 1–3 px breathing bob.
- **Head angle:** 0°; periodic **curious peek** (neck cranes out, look L→R→up, small smile) on a ~11 s cycle.
- **Legs:** all 4 planted; front pair squared, rear pair settled behind. No step offset.
- **Tail:** visible, resting lower-rear.
- **Necklace:** rests flat on the plastron; no swing.
- **Jetpack:** idle; **pilot flame** ~4–6 u flickering.
- **Flame:** low warm flicker (orange→yellow), sinusoidal.

## 2. RUN
- **State:** `moving` (2-frame cycle, `sin(animT·9)`).
- **Body angle:** 0° with a 1.4 px vertical bob; tiny forward micro-lean.
- **Head angle:** small bob (±~2°) in phase with the gait; slight neck extension forward.
- **Legs:** **diagonal gait** — front pair `+step / −step`, rear pair in **counter-phase**, so all four cycle. Feet stretch ±2.2 u.
- **Tail:** visible, subtle bounce.
- **Necklace:** small bounce with the bob (≤3°).
- **Jetpack:** idle (running is leg-driven, not thrust).
- **Flame:** pilot flicker only.

## 3. JUMP
- **State:** `jump()` from ground → `vy = CFG.jumpVelocity`, `onGround=false`, `flameT=0.18`.
- **Body angle:** +6–10° nose-up on the rise.
- **Head angle:** neutral-to-slightly-up, eyes forward/up.
- **Legs:** all 4 gather then extend downward at the push; tuck slightly at apex (never disappear).
- **Tail:** visible.
- **Necklace:** swings down-then-settle on the launch impulse.
- **Jetpack:** brief **puff** (Finn always uses the pack to leave the ground) — `flameT 0.18`.
- **Flame:** short 8–12 u burst, decays over the arc.

## 4. VERTICAL BOOST
- **State:** air-boost — `boostsUsed++`, `vy = jetpack1/2Velocity`, `flameT = 0.45` (single) / `0.6` (double), reduced-gravity hang `CFG.jetpackHang`.
- **Body angle:** slight nose-up (**+8–12° max**). **Stays quadrupedal — never rotates to upright** (resolves sheet inconsistency #12). Thrust reads through flame + speed lines, not a stand.
- **Head angle:** up, eager; eyes toward the climb.
- **Legs:** all 4 draw inward/back against the thrust; still 4, still visible.
- **Tail:** visible, streaming slightly back.
- **Necklace:** pushed downward by upward acceleration (a few degrees), then settles.
- **Jetpack:** MAIN EVENT — **straight-down nozzle, vertical thrust** (not diagonal, Task 5). Bigger flame on the double-boost.
- **Flame:** long **20–25 u** column, orange→yellow→white-hot core, warm amber glow. Second boost = largest.

## 5. FALL
- **State:** airborne, `vy > 0`, not tucked/spinning. One unified fall (sheet's Fall/Fast merged — #11).
- **Body angle:** −6 to −14° nose-down, scaling with downward speed.
- **Head angle:** slightly down, alert (not scared unless `shellEmotion` says so); eyes wide.
- **Legs:** all 4 splayed for balance; wider as speed rises.
- **Tail:** visible, trailing up.
- **Necklace:** lifts slightly (relative up-draft), trails toward the head.
- **Jetpack:** off/idle pilot flame; ready to boost.
- **Flame:** pilot only; **speed lines** intensify with velocity.

## 6. DIVE PREPARATION
- **State:** the instant `dive()` is pressed in the air, pre-tuck (`tucked` about to set).
- **Body angle:** hunch forward, −10°; head pulls toward the shell.
- **Head angle:** down and in, brow set (focused/determined).
- **Legs:** all 4 draw in toward the plastron (gathering — not gone).
- **Tail:** tucking in.
- **Necklace:** pressed to the chest as Finn compacts.
- **Jetpack:** cuts (`jetT = 0`) — no thrust into a dive.
- **Flame:** extinguished to pilot/none.

## 7. DIVE TUCK
- **State:** `turtle.tucked === true`; `vy = max(vy, CFG.tuckMinVy)` downward kick.
- **Body angle:** n/a — Finn is a **compact orange ball** (circle r 14 u).
- **Head angle:** fully retracted inside the shell.
- **Legs:** retracted inside (the only pose where the 4 legs are not drawn — geometrically inside the ball, not removed).
- **Tail:** inside the ball.
- **Necklace:** inside the ball (the sole allowed occlusion — Bible §4.5).
- **Jetpack:** pulled in; no flame.
- **Flame:** none.

## 8. SHELL SPIN
- **State:** `turtle.spinning` (pole-twirl / rolling) — `rot` advances, `spinPhase` drives depth-squash.
- **Body angle:** rolling; orange ball with hex pattern + 3 spokes so rotation reads.
- **Head/Legs/Tail/Necklace:** inside the ball throughout.
- **Jetpack:** stowed; no flame.
- **Flame:** none. Motion communicated by rotation + optional speed lines/dust.

## 9. SHELL IMPACT
- **State:** the frame the spinning/tucked ball strikes a surface (landing out of a dive/roll).
- **Body angle:** ball flattens ~10% on contact, then pops back to the standing pose.
- **Head angle:** emerges up/forward as Finn unpacks from the ball.
- **Legs:** all 4 snap back out and plant (4 legs restored immediately on unpack).
- **Tail:** re-emerges.
- **Necklace:** whips out and settles with the unpack.
- **Jetpack:** re-seats on the back.
- **Flame:** off; **impact dust/spark** burst at contact.

## 10. LANDING
- **State:** touchdown to ground; `turtle.landT > 0` squash window (0→1→0 over 0.22 s).
- **Body angle:** brief squash (−, then recover); neck compresses (head dips `landC·3.4`).
- **Head angle:** dips then rises back to neutral.
- **Legs:** all 4 splay to absorb, then square up.
- **Tail:** small settle bounce.
- **Necklace:** dips on impact, then settles.
- **Jetpack:** idle.
- **Flame:** pilot; small **dust puff** at the feet.

## 11. HURT
- **State:** damage taken; `shellEmotion` → worried.
- **Body angle:** recoil back ~ −8°, brief shake.
- **Head angle:** back/up, **worried mouth arc**, eyes squeezed; optional star/spark accents above.
- **Legs:** all 4 brace/splay from the hit.
- **Tail:** visible, stiff.
- **Necklace:** jolts on the recoil, then swings to rest.
- **Jetpack:** idle (may sputter one beat).
- **Flame:** sputter/none.

## 12. VICTORY
- **State:** `drawHeroFinn` / win pose; `shellEmotion` → happy, `animT` gives a gentle happy life; `adjustT` pushes glasses up.
- **Body angle:** upright-*leaning* cheer but **still on 4 legs** (front pair lifts in a small cheer hop — never a full biped stand).
- **Head angle:** up, big smile, eyes bright; glasses-push on unlock.
- **Legs:** rear pair planted, front pair raised in celebration; **still four**.
- **Tail:** visible, perky.
- **Necklace:** bounces with the cheer.
- **Jetpack:** celebratory **puff**; small sparkle accents.
- **Flame:** short warm burst on the hop.

## 13. BLINK
- **Type:** overlay, composes onto **any** pose (not a standalone state).
- **Driver:** random, non-metronomic (`animT + seed`, ~2.4–4 s), 0→1→0 over ~0.12 s; a double-blink variant during the idle peek.
- **Effect:** eyelids close (`eyeRY → ~15%`), pupils hidden mid-blink; glasses lens height follows the lid.
- **Everything else:** unchanged for the underlying pose (legs, tail, necklace, jetpack, flame all continue).

---

### Cross-cutting contracts
- **4 legs** in every open pose; retracted **only** inside the Tuck/Spin ball.
- **Compass** on-screen in every open pose; occluded **only** inside the ball.
- **Jetpack** always mounted; **flame is always orange→yellow→white** and vertical.
- **Faces right** unless `turtle.dir < 0` mirrors the whole sprite.
- **No hover / no free-flight / no fuel meter** — boost is the discrete two-tap system; these specs never imply otherwise.
