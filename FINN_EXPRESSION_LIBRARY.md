# FINN — EXPRESSION LIBRARY (Phase 2 · hybrid)
**Status:** PRODUCTION GUIDE · ranks under `FINN_CANONICAL_CHARACTER_SYSTEM.md` (Doc 5 motion language, Doc 6 emotions).
**Method (per founder decision):** build every emotion from the **7 current sprites + motion + overlays first**; never fake a face that isn't in the art. Where a distinct face/pose is genuinely required, it is **not invented here** — it is filed in `FINN_FUTURE_ASSET_QUEUE.md`.

**The honest constraint:** the face is **baked into each PNG**. `run.png` = a calm smile; `dazed` = woozy; `hero.png` = a bright happy smile. So most emotion is carried by **body posture (which sprite) + the Doc 5 motion language + the blink-lid overlay** — not by swapping facial expressions. That's on-brand: Finn is an understated, calm mentor.

**Building blocks available now:** sprites `run · jump · vboost · land · shell · dazed · hero`; `shellEmotion` (happy/worried/neutral — affects the procedural fallback only); the blink-lid overlay; the live flame; whole-sprite transforms.

---

## The 15 ChartQuest emotions

Legend: ✅ achievable now · 🟡 partial (body/motion proxy; a truer read is queued) · 🔴 needs new art → queued.

| Emotion | Base sprite | Face read | Motion (Doc 5) | Jetpack/flame | Status |
|---|---|---|---|---|---|
| **Neutral** | run (grounded) | calm smile (baked) | Idle-Breathe + blink | pilot flicker | ✅ |
| **Waiting for setup** | run | calm | eyes-narrow beat, dead-level, breathing slows, stillness | pilot | ✅ |
| **Curious** | run | calm | eyes dart → head tilt → hold → blink → return | pilot | 🟡 (true neck-peek queued) |
| **Thinking** | run | calm | slow eye-scan L→R → tiny nod → blink → micro-smile | pilot | ✅ |
| **Reading chart** | run | calm | deliberate L→R tracking, subtle head follow | pilot | 🟡 (pupil-track overlay queued) |
| **Focused / locked-in** | run | calm | lids lower slightly, steadies level, compass stills | pilot | 🟡 (lid-lower overlay = queued eye layer) |
| **Determined** | jump *or* run | calm | brow-line lowers, head pulls toward shell, gather | cuts to pilot | 🟡 (brow via queued eye layer; body ✅) |
| **Teaching** | hero *or* run | friendly smile (baked) | welcoming, front-leg gesture (not an arm), to the player | pilot | ✅ (fixed-kind face fits) |
| **Encouragement (player mistake)** | run | friendly smile | empathetic head tilt, soft "hmm", **never angry** | pilot | ✅ |
| **Celebrating** | hero | happy smile | front-legs hop (still quad), happy bob | celebratory puff | ✅ |
| **Winning / Victory** | hero | happy smile | cheer-hop, glasses push-up (`adjustT`), sparkle | warm burst | ✅ (now via `drawHeroFinn`→hero.png, build 255) |
| **Recovering** | dazed → run | woozy → calm | recoil −8°, beat of stillness, slow breath, head lifts, resolute nod | sputter → idle | 🟡 (worried face queued; body ✅) |
| **Losing (a trade)** | dazed *or* run | woozy / calm | brief down-look, −8° recoil, then resolve — not crushed | idle | 🟡 (worried/sad face queued) |
| **Boss introduction** | run / hero (grounded) | calm-brave | feet plant, slight shell-check, squares up, faces the threat | pilot ready | ✅ |
| **Surprised** | jump (startle) | — | startle pop | pilot | 🔴 **no wide-eye/open-mouth art** → queued |

**Tone guard (permanent):** kind mentor — never smug, never punishing. On player error, empathetic + encouraging. This protects educational trust.

**Queued to complete this library (see Future Asset Queue):** a **pupil/eye overlay layer** (unlocks subtle eye-track, lid-lower for focus/determined/reading), a **worried/sad face** (loss/recovering), a **surprised face** (pop-eye/open-mouth). Alive-making items (eye layer) are P0.
