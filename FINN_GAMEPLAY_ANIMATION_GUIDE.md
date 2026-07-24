# FINN — GAMEPLAY ANIMATION GUIDE (Phase 6)
**Status:** PRODUCTION AUDIT · ranks under `FINN_CANONICAL_CHARACTER_SYSTEM.md`, `docs/canon/finn_canon.md`, `docs/canon/animation_canon.md`.
**Mandate:** review the shipping gameplay, compare every animation to canon, **improve only where canon requires, and do not change gameplay feel** (locked by Movement Feel Patch V1).
**Grounding:** audited against `chart-quest.html` at **build 254** (BUILD_TAG line 2392), not a stale spec.

---

## 1. Compliance audit — shipping vs. canon

| Canon requirement | Shipping state (build 254) | Verdict |
|---|---|---|
| Renderer of record = `drawFinnSprite` (PNG), procedural = fallback only | Confirmed (`drawTurtle` dispatches → sprite when `FINN_SPRITES.ready`) | ✅ |
| Loader = exactly 6 keys `run·jump·vboost·shell·land·dazed` | `files` map @ 12923 has exactly those 6 | ✅ |
| Deprecated **leg-rig** (`body/leg.png`, `drawFinnRigLeg/Tail`) removed | 0 references remain | ✅ |
| Deprecated **walk-sheet** removed | Asset deleted; residual refs are **comments/BUILD_TAG documenting the removal** | ✅ |
| Airborne **wick-fling** draws `run.png` (not a walk sheet) | Fixed in 254 — the old live-violation branch (was 13106–13112) now draws the complete new-art frame | ✅ (this was the one live canon violation — closed) |
| Regression gate blocks the old model's return | `scripts/verify.js` gate added (`6a97216`) | ✅ |
| Grounded Finn = **static legs + body-rock** (legs never animate) | Confirmed | ✅ |
| Jump nose-up→ease-down; Fall lean scales with vy | Per `drawFinnSprite` state machine | ✅ |
| Boost **stays quadrupedal, ≤+12°** (never upright), 20–25u vertical flame | Confirmed (`vboost`, `rot=0` upright boost only via flame/speed) | ✅ |
| Shell ball rotates about shell centre | `shell` state | ✅ |
| Landing squash **render-only**, feet-anchored (Feel Patch V1) | Confirmed (never touches physics) | ✅ |
| Dazed woozy wobble, grounded only | Confirmed | ✅ |
| Blink + idle personality (breath, double-blink, ~11s peek) | Present (~13000/13926) | ✅ |
| Live jetpack flame `finnLiveFlame`, scales with `flameT`, never blue | Confirmed | ✅ |
| Frame pacing EMA-smoothed `dt` (build 234) | Confirmed | ✅ |
| Hitbox **36×24px** never changes | Unchanged | ✅ |
| Facing = whole-sprite mirror on `dir<0` | Confirmed | ✅ |

**Result: gameplay animation is canon-compliant as of build 254.** The historical drift (leg rig, walk-sheet, upright boost) is resolved and gated.

---

## 2. The one open item (a decision, not a bug)

**`hero.png` is canon-designated for the hero/menu/victory pose, but `drawHeroFinn` (line 4333) renders `run.png`, not `hero.png`** (0 `hero.png` references in code; BUILD_TAG confirms cinematic + academy now render `run.png`).

- This is the "open discrepancy" from `FINN_SINGLE_SOURCE_OF_TRUTH.md §1`.
- It is a **canon-vs-code founder call**, and touching it edits **protected system #1** (character render). **Do not change unilaterally.**
- **Two clean resolutions:** (a) wire `hero.png` into `drawHeroFinn` for a distinct heroic pose, **or** (b) update canon to bless `run.png` as the hero render and retire `hero.png` from the approved list. Either is valid; pick one and record it in `finn_canon.md`.

---

## 3. What to improve (per "improve only where canon requires")
**Nothing in gameplay motion.** Feel is locked (coyote 90ms / buffer 120ms / render-only squash) and the canon contracts are met. The only outstanding action is the **`hero.png` decision** above. Do **not** re-open leg animation, boost rotation, or timing — those are settled canon and prior regressions.

---

## 4. Standing rules for any future gameplay-animation change
- Verify **in the browser at device scale** (visible preview), never by formula — repeatedly-learned lesson (builds 236–242 chased physics bugs as animation).
- Any change to Finn art/render = **protected system #1** → approval-gated.
- Keep the **regression gate green** (`scripts/verify.js`) — it exists to stop the old turtle returning.
- Whole-sprite transforms + frame selection only; **legs never animate**; the procedural body is fallback-only.

---

## 5. Validation
| Check | Result |
|---|---|
| Every gameplay state audited against canon | ✅ 16/16 compliant |
| Live canon violation (wick-fling walk-sheet) | ✅ closed in build 254 |
| Open items surfaced, not silently changed | ✅ (`hero.png` → escalated) |
| No feel/motion changes recommended | ✅ (feel is locked) |
