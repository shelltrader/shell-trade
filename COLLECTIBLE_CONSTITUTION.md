# CHARTQUEST — THE COLLECTIBLE CONSTITUTION

**Status:** RATIFIED · build 301 · 2026-07-27
**Scope:** every collectible, in every level, every boss, every market, every chart, every lesson, every replay, every generated section and every handcrafted section.
**Owner in code:** `window.CQREACH` (chart-quest.html)
**Enforced by:** `scripts/collectible_law_gate.js` → `scripts/verify.js` check **#14**

---

## COLLECTIBLE LAW 001

> **Every collectible placed into the world MUST be reachable by a player using legal gameplay.
> If a collectible cannot be reached using normal movement mechanics, it must never be spawned.**

This rule is absolute. There are no exceptions, no per-level opt-outs, and no "just this once" placements.

### Why it is constitutional and not a bug fix

A shell below the chart tells the player one of two stories, and both are corrosive:

- *"Maybe I can reach it"* → they spend attention and fuel on something impossible, then blame themselves.
- *"The game cheated me"* → they stop trusting the world, which is the one thing an educational game cannot afford. ChartQuest is asking a beginner to trust that the chart is honest. A dishonest reward makes an honest candle less believable.

ChartQuest must **never** intentionally tease the player with unreachable rewards.

---

## THE SECOND LAW — WHY THIS BUG EXISTED

Law 001 alone would not have prevented the founder's P0, because every spawn formula in the codebase was *correct at the instant it ran*. The bug was a **coordinate-space mismatch**, so it deserves its own rule:

> **COLLECTIBLE LAW 002 — Anything that rests on the terrain must be stored in the same coordinate space as the terrain.**

Candles store `h` / `open` as heights **above the ground baseline** (terrain space). `candleTop(c) = groundY − max(open, h)`. `groundY = round(H × 0.7)`, and `H` is the raw viewport height, recomputed on **both** `resize` and `orientationchange`.

Collectibles stored an **absolute world `y`**, frozen at spawn.

So when the viewport changed, every candle top moved and every collectible stayed behind. Measured on the real spawn path:

| Viewport change | groundY shift | Effect on a shell 14px above its candle |
|---|---|---|
| Mobile URL-bar reflow (812 → 730) | −57px | ends up **43px INSIDE the candle** |
| Rotation-scale change | −217px | every shell buried **200–260px** below terrain |

And below the surface is not merely difficult — it is **impossible**. The off-chart failsafe teleports Finn back onto the last candle the instant he falls past `groundY + 20`, so the dead space beneath the chart can never be entered.

**This is why candles never had this bug and collectibles did.** Law 002 removes the asymmetry: collectibles now carry `gy` (height above the baseline, exactly like a candle) and `y` is re-projected whenever `groundY` moves. Drift becomes impossible *by construction* rather than by patching.

---

## THE PLAYABLE REGION

The engine must always be able to answer these, and **future systems must query `CQREACH` instead of inventing their own logic**:

| Question | Authority |
|---|---|
| Top gameplay boundary | `CQREACH.region().ceiling` — `groundY − CFG.levelMax` (700) |
| Bottom gameplay boundary | `CQREACH.region().floor` — `groundY` (below is dead space) |
| Current chart surface at x | `CQREACH.surfaceAt(x)` |
| Maximum jump height | `CQREACH.envelope.hop` — **132px**, free, costs no fuel |
| One-boost height | `CQREACH.envelope.boost1` — **477px** true apex |
| Full-tank height | `CQREACH.envelope.boost2` — **678px** true apex |
| Legal movement envelope | `CQREACH.envelope` — all of the above, derived from `CFG` |
| Safe shell zone | **10 … 335px above the launch surface** |
| Unsafe shell zone | everything else |
| Maximum dive depth | **zero below the surface** — three independent guards forbid it |

### On the numbers

The envelope is **derived from `CFG` at runtime**, never hand-typed, so retuning the jump cannot silently invalidate the reachability rule.

The naive `v²/2g` model is wrong for the jetpack: gravity is scaled to `jetpackGravityScale` (0.45) for the whole `jetpackHang` window (0.23s), and at boost velocities that window is spent entirely rising. Boost 1 is **477px**, not the 335px a naive model gives — a 42% error.

**The safe band deliberately uses the conservative 335px figure anyway.** The 30% gap is margin, and it is margin in the only direction that is safe: everything approved is *comfortably* reachable, including by a beginner who mistimes the boost or is low on fuel. It must never be raised to the true apex — *"theoretically reachable by a perfect player"* is not the standard this Law sets.

`CFG.obBounceVy` is **not** budgeted: order blocks were made passive educational zones and the landing path zeroes `vy` unconditionally, so that constant is dead. A module that budgeted a bounce-pad launch would over-estimate the safe band.

---

## SAFE SPAWN RULES

Permanent engine rules. Each maps to a validator in the pipeline:

| Rule | Predicate |
|---|---|
| Shells never spawn below the playable chart | `BELOW_FLOOR` |
| Shells never spawn inside candles | `INSIDE_TERRAIN` |
| Shells never spawn inside terrain / collision | `INSIDE_TERRAIN` |
| Shells never spawn with nothing to stand on | `NO_TERRAIN` |
| Shells never spawn above the playable ceiling | `ABOVE_CEILING` |
| Shells never require impossible jumps | `UNREACHABLE` |
| Shells never spawn before the world exists | `GROUND_NOT_READY` |
| Shells never spawn at a nonsense position | `NOT_FINITE` |
| Shells never require boost exploits or bugs | safe band capped at **one** boost |
| Shells reinforce intended traversal | see Design Principles |

### On UI overlap

A world-space pickup maps to a different screen position every frame as the camera moves, so "overlapping the HUD" is a *transient* condition, not a spawn-time property — momentarily passing under a HUD element is normal and unavoidable in a side-scroller. The rule is therefore enforced structurally rather than by a spawn-time test:

- The **bottom** HUD (control hints) lives below `groundY`, and `BELOW_FLOOR` already forbids that entire band.
- The **top** HUD is bounded by `ABOVE_CEILING` (`CFG.levelMax`).

No pickup can be *parked* permanently beneath a fixed overlay.

---

## DESIGN PRINCIPLES

Shell placement is not random decoration. Every shell must have a purpose:

- **The every-10 spin pole** teaches the liquidity grab wordlessly — a shell always sits atop a long wick, so climbing wicks becomes a habit.
- **The mega liquidity pole** rewards the climb: the prize sits on top of the giant candle.
- **The body-top ambient shell** floats at the *higher* of its candle and the previous one, so it lands in the natural walking path and rewards forward motion rather than precision.
- **The high-route cache** rewards choosing the tall route — a reason to boost.
- **The Lost Page** rewards noticing, then investigating, then discovering.

When adding a shell, ask: does this encourage jumping, reward exploration, reward timing, or reinforce chart reading? If none, it should not exist.

---

## ENFORCEMENT

1. **At spawn** — `CQREACH.place()` validates and **rejects**. It never repairs. A caller that receives `null` must drop the candidate, not nudge it into legality: silently moving a bad candidate is how "shells in odd places" became normal, because the placement stops meaning anything.
2. **At world change** — `resize()` re-projects every collectible from terrain space.
3. **Continuously** — a ~2×/sec audit heals terrain that changed shape under an already-approved pickup. This is *not* an exception to "reject, never repair": the item was legal when placed and the world moved underneath it. Restoring its intended relationship is correct; rescuing an illegal candidate is not, and `validate()` still refuses that.
4. **At render** — the renderer refuses to draw any shell below the baseline. Last line of defence, display-only, mirroring the portal renderer's FINAL-safety pattern.
5. **At build** — `verify.js` check **#14** fails the build if the owner is deleted, a spawn bypasses the gate, `resize()` stops re-anchoring, wick growth escapes its owner, or the debug overlay stops being dev-only.

---

## AMENDING THIS DOCUMENT

Changes require an ADR under `docs/architecture-ratified/`. Never edit the safe-band numbers to make a placement fit — move the placement.
