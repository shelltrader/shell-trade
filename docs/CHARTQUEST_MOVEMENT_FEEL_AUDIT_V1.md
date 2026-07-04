# ChartQuest — Movement Feel Audit (V1)

**Senior Gameplay Designer review. Verdict-first, not nice. Movement only.**
_Scope: Finn's movement systems (internally `turtle`; sprite renderer `drawHeroFinn` / frame-select at chart-quest.html:13760). Monetization, bosses, lessons, progression intentionally ignored. Source of truth: `chart-quest.html`._

---

## Executive verdict

Finn's movement is **mechanically complete and robust, but it is not *felt*.** The physics constants are actually good — base-jump gravity is snappy, the wick-spin is genuinely novel, the tuck-dive is crisp. But three layers that separate a hobby platformer from a professional one are **missing or broken**:

1. **The primary input (jump) is the least responsive input on the primary platform (touch).**
2. **There is zero audio and zero haptic feedback on any movement action.**
3. **The responsiveness safety-net every pro platformer ships — coyote time, jump buffering, landing weight — is entirely absent** (`coyote` / `jumpBuffer` / `vibrate` = 0 matches; `landT` is dead code).

Builds 226→243 chased movement feel in the **animation** layer (sprite frames, gait, camera). Per the memory trail, the real problems kept turning out to be **physics and input** (build 242 anti-stuck, build 234 frame pacing). This audit says the same at the next level: **the remaining feel gap is INPUT RESPONSIVENESS and JUICE, not more animation.**

---

## 1. System-by-system audit

### Running — chart-quest.html:13032
`turtle.x += (CFG.walkSpeed + turtle.vxBoost) * dt * turtle.dir`
- **Constant velocity, zero acceleration/deceleration.** No ramp-up, no momentum, no top-speed curve. Finn is an auto-runner horizontally.
- **Instant direction flip** (A/D / swipe just sets `turtle.dir`). No pivot, no skid.
- `walkSpeed: 58` px/s is **very slow** (chart-quest.html:2255). Deliberate ("calmer traversal") but with **no acceleration**, slow + constant reads as *robotic*, not *calm*.
- **Verdict:** functional, lifeless. Skill expression in the X axis ≈ nil.

### Jumping — jump() chart-quest.html:3881
- Fixed impulse `-780`. **No variable jump height** (no hold-to-rise). Fine for a discrete 3-tier design, but zero analog expression.
- **The arc is tall and narrow:** apex **132px up**, airtime **0.68s**, but only **~39px forward per jump** (computed from the constants). Candles are 24–56px wide, so **a tap-jump barely clears one candle horizontally.** Finn *hops in place* instead of *bounding forward*. Biggest single reason platforming feels stiff.
- Gates hard on `turtle.onGround`. **No coyote, no buffer** (see §4).

### Vertical Boost (jetpack) — fireJetpack() chart-quest.html:3898
- Two discrete tiers (`-1242`, `-1518`) + a `0.23s` reduced-gravity hang (chart-quest.html:13064). The hang is good juice.
- But boost apex ≈ **477px** while horizontal speed stays 58 → you rocket **straight up and drift back down over the same spot.** This is where the "floaty" perception lives — **not the base jump (snappy), the boosts.**

### Falling — chart-quest.html:13060
- Gravity `2300` is high → falls are snappy and weighty. **Correct and good. Don't touch it.**
- Uses the shared `jump` sprite easing nose-down (chart-quest.html:13776). Acceptable.

### Dive (Shell Tuck) — shellTuck() chart-quest.html:3919
- Instant downward kick `tuckMinVy: 420`, gravity ×2.6, forward roll on landing. **Crisp and responsive.** Best-feeling verb in the kit. Only sin: silent.

### Shell Spin (wick pole) — startSpin chart-quest.html:12933 / updateSpin chart-quest.html:12950
- **Auto-triggers on contact** with any wick ≥26px (chart-quest.html:13125) and **seizes control for 0.4s** — `jump()`, `fireJetpack()`, `shellTuck()` all early-return while `spinning` (3882, 3899, 3920).
- The forward fling reward (`spinBoost: 300`) is satisfying, **but the entry is involuntary and uninterruptible.** A pro player brushing a wick loses agency for 0.4s. Reads as a hitch, not a flourish.

### Landing — chart-quest.html:13166
- **There is no landing animation.** `landT` is set to 0 in jump/boost and only ever *decremented* — **nothing sets it positive** (build 237 removed the squash). The `land` sprite branch at chart-quest.html:13777 is **dead code.**
- Landing feedback = a 0.12s flame puff. **No squash, no dust, no weight, no sound.** Finn snaps from air-pose to run instantly. Weightless.

### State transitions
- Clean and immediate on keyboard. `spinning`/`tucked`/`dazed` mutually gated correctly.
- **Dazed** (chart-quest.html:13172): an untucked fall ≥230px triggers a ≤1s lie-down that **halts X movement** (chart-quest.html:13032). Any input cancels it instantly — good — **but a single jetpack (apex ~477px) landing in a trough exceeds 230px**, so routine boosting → "why did Finn fall over?" A cancelable stun on *normal traversal*.

### Air Control — chart-quest.html:13032
- Full instant direction flip in air, constant speed. **No air momentum, no drift.** Responsive but arcade-stiff.

### Input Buffering — **absent**
- Jump pressed while airborne is **silently dropped** (`jump()` returns if `!onGround`). On the bumpy touching-candle road, players *will* pre-press before landing and get nothing → "missed jump."

### Animation Responsiveness — chart-quest.html:13760
- Boost pose (`vboost`) is gated on a **decaying timer** (`flameT > 0.25`), not actual velocity, so it flips to the `jump` frame while Finn is still rising fast. Pose desyncs from motion.
- No landing frame (above). Otherwise baked run/jump/shell frames are clean.

### Visual Feedback
- Strong *idle* personality (breath, blink, "studying the chart," march-in-place). Finn is **alive when still.**
- Weak *action* feedback: no landing dust, boost flame doesn't scale to tier meaningfully, spin has trails but no impact accent.

### Audio Feedback — **absent**
- Every movement function checked. **No SFX on jump, boost, land, spin, or tuck.** The only `whoosh` is in a cinematic (chart-quest.html:17197). The loudest silence in the build.

---

## 2. Playtest simulation (400 sessions)

| Cohort | Dominant complaint | Root cause |
|---|---|---|
| **100 first-time players** | "Sometimes I tap and he flies up instead of hopping." "He fell over and I couldn't move." | Tap held >150ms → jetpack misfire (chart-quest.html:4014); auto-daze (chart-quest.html:13172) |
| **100 experienced platformer players** | "No coyote time." "Buffered jumps eat inputs." "Landings have no weight." "Why did the wick grab me?" | §4 responsiveness gaps; involuntary spin |
| **100 mobile gamers** | "Jump feels laggy/mushy." "It doesn't do what my thumb says." | Jump fires on **release**, not press (chart-quest.html:4100); 150ms hold-ambiguity |
| **100 traders / non-gamers** | "It feels cheap." "Nothing reacts when I do stuff." | No audio, no haptics, no landing feedback |

**Movement exploit found:** because horizontal speed is constant and the wall-block + anti-stuck lift (chart-quest.html:13187) will re-ground you, a player can mash into a tall candle and get *teleported up* every ~1s instead of learning to jump — a progression cheat born of the safety net.

---

## 3. Responsiveness / latency analysis

| Action | Keyboard | Mouse / Touch |
|---|---|---|
| **Jump** | **0 ms** (keydown, chart-quest.html:3956) | **Release-gated** + misfires to jetpack if held ≥150 ms (chart-quest.html:4014, 4100) |
| **Boost** | 0 ms (W) | **150 ms** (hold path) or swipe-gesture latency |
| **Dive** | 0 ms (S) | swipe-down 45px gesture |
| **Dir flip** | 0 ms | swipe 40px |

**The finding:** keyboard is genuinely excellent. **Touch — the primary platform — makes the most-used action (jump) the least responsive input in the game.** Jump only fires if the player *proves they're not holding and not swiping*. Human "taps" routinely run 80–200ms; a large fraction cross the 150ms line and **convert an intended jump into a fuel-burning jetpack.** The primary verb is the disambiguation *loser*.

---

## 4. The three missing pro affordances (why "responsive" fails)

1. **Coyote time = 0.** Crest a tall candle, start descending → `onGround` false → jump dies. Perceived as unfair. (Mitigated slightly because candles touch, but valley-drops and tall-candle crests still bite.)
2. **Jump buffer = 0.** Press ~100ms before landing on the bumpy road → dropped.
3. **Landing weight = 0.** `landT` never fires → no squash/recovery. Every touchdown is weightless.

These three are *the* difference between Celeste/Hollow Knight and everything below them. Currently none ship.

---

## 5. Fun analysis

| Feels… | Reality |
|---|---|
| Satisfying? | NO — no audio, no landing impact, no haptics. Actions have no *thump*. |
| Addictive? | PARTIAL — the wick-spin fling loop is the one addictive beat; everything else is neutral. |
| Rewarding? | PARTIAL — spin/tuck reward momentum; jump/run reward nothing. |
| Skill-based? | NO — auto-run + no accel + instant flip = almost no X-axis skill; timing is the only expression. |
| Responsive? | YES keyboard / NO touch. |
| Floaty? | Only on **boosts** (hang + slow X). Base jump is *snappy*. |
| Robotic? | YES — zero acceleration is the culprit. |

**Why:** the constants are fine; the *feedback loop* is empty. Movement in a pro platformer is a **conversation** — input → animation → sound → haptic → screen response, every 16ms. Finn's conversation is input → (silent) motion. The player's nervous system gets nothing back.

---

## 6. Animation audit

| Cycle | Helps / Hurts | Note |
|---|---|---|
| Run | Neutral | Baked frames clean; gait eased by motion EMA (chart-quest.html:13719) — good |
| Jump | Helps | Nose-up→nose-down ease is correct |
| Boost | **Hurts responsiveness** | Timer-gated pose desyncs from velocity (chart-quest.html:13773) |
| Dive/Tuck | Helps | Ball roll is crisp |
| Shell Spin | **Mixed** | Looks great, but the 0.4s lockout hurts control |
| **Landing** | **Hurts (by absence)** | Dead code (chart-quest.html:13777) — no weight |
| Dazed | **Hurts** | Reads as punishment on normal falls |

---

## 7. Platformer comparison

| vs. | ChartQuest wins | ChartQuest loses |
|---|---|---|
| **Mario Wonder** | Discrete teachable tiers map to lessons | Variable jump, coyote, buffer, momentum |
| **Celeste** | — | *Everything* game-feel: coyote, buffer, instant input, juice |
| **Rayman Legends** | Auto-run pacing is comparable | Acceleration, world-class audio, landing anim |
| **Hollow Knight** | Wick-spin is a unique traversal verb | Coyote, buffer, weighty landings, SFX |
| **Jetpack Joyride** | More verbs (jump/boost/tuck/spin) | JJ's thrust fires on touch-down, instantly; boost needs a 150ms hold — loses the crispness of the one input that defines the genre |

**Where you genuinely win:** the **wick-spin fling** (nobody has it), the **chart-as-platform** concept, **snappy base-jump gravity**, and **bulletproof anti-softlock** (chart-quest.html:13097, 13187). Build on these.

---

## 8. TOP 10 MOVEMENT PROBLEMS

| # | Severity | Problem | Ref |
|---|---|---|---|
| 1 | **CRITICAL** | Touch jump is release-gated + misfires to jetpack (150ms hold) — least responsive input on primary platform | chart-quest.html:4014, 4100 |
| 2 | **CRITICAL** | Zero audio + zero haptics on all movement actions | all move fns |
| 3 | **HIGH** | No jump buffering — pre-landing inputs silently dropped | chart-quest.html:3885 |
| 4 | **HIGH** | No coyote time — jump lost the instant you leave a surface | chart-quest.html:3885 |
| 5 | **HIGH** | No landing feedback (`landT` dead) — weightless touchdowns | chart-quest.html:13777 |
| 6 | **HIGH** | Tall-narrow arc (~132px up / ~39px fwd) — jumps hop in place | chart-quest.html:2255 |
| 7 | **MEDIUM** | Wick-spin seizes control 0.4s, auto-triggered, uninterruptible | chart-quest.html:13125 |
| 8 | **MEDIUM** | Auto-daze stun ≤1s on ≥230px falls (routine boosts trigger it) | chart-quest.html:13172 |
| 9 | **MEDIUM** | Zero horizontal accel + instant flip = robotic locomotion | chart-quest.html:13032 |
| 10 | **LOW** | Boost pose gated on decaying timer, not velocity → desync | chart-quest.html:13773 |

---

## 9. Action plan (no new mechanics, no fuel, no hover)

### Quick wins — ~1 hour each
- **Fire jump on `pointerdown`, not `pointerup`.** Commit the hop immediately; only *upgrade* to jetpack if the finger travels up past threshold within the window. Worst case a held tap becomes a hop instead of a boost — vastly better than a late/wrong input. (Rework chart-quest.html:4012-4018 + 4100.) **Fixes #1.**
- **Add coyote time (~90ms):** store `lastGroundT`; let `jump()` pass if `onGround || now-lastGroundT < 0.09`. ~4 lines. **Fixes #4.**
- **Add jump buffer (~120ms):** if `jump()` called airborne, set `bufferT`; fire it in the landing block (chart-quest.html:13090). ~6 lines. **Fixes #3.**
- **Add movement SFX** via the existing WebAudio: short jump *pip*, boost *whoosh*, land *tap*, spin *whirl*, tuck *whoomph* — one-shot oscillators in each verb + the landing block. **Fixes #2 (half).**
- **Add haptics:** `navigator.vibrate(8)` on jump, `(14)` on boost/land (mobile only). **Fixes #2 (half).**

### Medium — ~1 day
- **Restore a velocity-scaled landing squash:** set `landT` on touchdown proportional to impact `vy` (tiny for hops, real for boosts) — the frame + branch already exist. **Fixes #5.**
- **Rebalance the arc:** raise `walkSpeed` 58→~80 *or* add light X acceleration so a jump carries ~2 candle-widths. Keep the calm read; make jumps *bound*. **Fixes #6/#9.**
- **De-fang the spin lockout:** shorten `spinDur` 0.4→0.28 and allow tuck/jump to cancel after 50%. **Fixes #7.**
- **Soften auto-daze:** raise threshold 230→~330 and make it cosmetic (never halt X). **Fixes #8.**

### Major — ~1 week
- **Full touch-input overhaul:** split jump/boost into unambiguous inputs (tap-down = jump; the HUD already hints a dedicated BOOST/DIVE zone — reuse it), retiring the 150ms disambiguation entirely; make coyote + buffer first-class. On-device playtest with all 4 cohorts.
- **Juice pass:** landing dust, boost-flame scaled to tier, spin impact accent, micro screen-shake on boost-2 / high landings, a coherent mixed SFX set.
- **Locomotion feel model:** accel/decel + subtle top speed so momentum carries through jumps and off wick-spin flings; retune the boost hang so it isn't floaty-over-the-same-spot. Re-derive apexes against candle heights.

---

## Bottom line

Don't rebuild anything. The mechanics and constants are ~80% right. Ship the quick wins first — **jump-on-press + coyote + buffer + one round of SFX/haptics will do more for "feels like a pro platformer" than the last 15 animation builds combined**, because they finally close the input→feedback loop that has been open this whole time.

---

## Reference constants (as audited)

| Constant | Value | Line |
|---|---|---|
| `walkSpeed` | 58 px/s | chart-quest.html:2255 |
| `gravity` | 2300 px/s² | chart-quest.html:2257 |
| `jumpVelocity` | -780 | chart-quest.html:2260 |
| `jetpack1Velocity` | -1242 | chart-quest.html:2301 |
| `jetpack2Velocity` | -1518 | chart-quest.html:2302 |
| `jetpackHang` | 0.23 s | chart-quest.html:2306 |
| `jetpackGravityScale` | 0.45 | chart-quest.html:2307 |
| `spinDur` | 0.4 s | chart-quest.html:2314 |
| `spinReleaseVy` | -520 | chart-quest.html:2317 |
| `spinBoost` | 300 px/s | chart-quest.html:2318 |
| `tuckMinVy` | 420 | chart-quest.html:2324 |
| `tuckGravityScale` | 2.6 | chart-quest.html:2323 |
| Touch hold→jetpack threshold | 150 ms | chart-quest.html:4014 |
| Daze fall threshold | 230 px | chart-quest.html:13172 |

_Computed: base tap → 132px apex, 0.68s airtime, ~39px forward. Jetpack-1 → ~477px apex (exceeds the 230px daze threshold on landing into a trough)._
