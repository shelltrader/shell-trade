# P0.1 — FOUNDER RE-REPORT INVESTIGATION
## "Unreachable shell beneath the chart, build 311"

**Date:** 2026-07-27 · **Verdict:** the founder was right, the bug was real, and the Constitution was not wrong — it had simply never been applied to the branch under test.

> **Note:** the referenced screenshot did not arrive with the report. Everything below is established from source and live runtime on build 311 itself, and the bug was reproduced independently, so the conclusion does not depend on the image. If the shell in your screenshot was inside the **movement tutorial** rather than the main chart, see §Q4 — that is the one area I audited and cleared, and the image would settle it.

---

## THE HEADLINE: THE BUILD NUMBERING FORKED

| | main | `feature/home-market-ceremony` |
|---|---|---|
| fork point | `c0e819a` **build 298** | same commit |
| commits since | uncommitted work | **15** |
| current build | **301** (contains the fix) | **311 → now 312** |

Both branches diverged at build 298 and **incremented their build numbers independently**. So `311` *looks* newer than `301` while being a parallel lineage that never received a single line of the CQREACH work.

You tested the higher number and reasonably assumed it was newer. That is a build-integrity failure, not a reporting error — it directly violates the "ONE canonical build" rule, and it is the reason P0.1 appeared to fail.

---

## THE FOUR QUESTIONS

### Q1 — Is build 311 actually running the CQREACH system from build 301?
**No. Categorically.**

- **Static:** `grep -c CQREACH chart-quest.html` → **0 occurrences** in the entire 311 source.
- **Runtime:** loaded 311 in the browser → `window.CQREACH === undefined`, `hasCQREACH: false`.

Not partially applied. Not stale. **Absent.**

### Q2 — Is this shell spawned through a path that bypasses CQREACH?
**Every path bypassed it, because there was no CQREACH to bypass.** All 10 spawn sites in 311 were raw, unvalidated pushes storing an absolute world `y`:

```
5214, 5245, 5249, 10688, 10756, 10757, 10758   coins.push(...)
5479, 5496                                      boxes.push(...)
10778                                           wisdomPages.push(...)
```

Note `5479` — a **governed valley box** that does not exist on main. This branch added a new collectible path while the fix was landing elsewhere.

### Q3 — Is this a coordinate-space regression?
**It is the original coordinate-space bug, not a regression.** The fix was never in this lineage, so there was nothing to regress.

**Reproduced on build 311, live, on the real spawn path** — 10 shells, shrinking the viewport (URL bar appearing):

| viewport | groundY | shells buried below the walkable surface | worst |
|---|---|---|---|
| 730 (baseline) | 511 | 0 | +14 |
| 710 | 497 | 0 | 0 |
| **690** | 483 | **2 of 10** | **−14px** |
| **640** | 448 | **6 of 10** | **−49px** |
| **568** | 398 | **9 of 10** | **−99px** |

A **40px** viewport change is enough. That is smaller than a mobile URL bar.

### Q4 — Is this a new class of bug not covered by the Constitution?
**Not for this shell — but the investigation exposed a real gap, and I have closed it.**

The movement tutorial (`BlockchainJourney._S`) is a **self-contained collectible world**: its own **28 shells**, its own boxes, its own candles, its own baseline (`S.base = round(H × 0.66)`), its own camera **and its own zoom**. None of it lives in `coins` / `boxes` / `wisdomPages`, so CQREACH's registry never saw it.

I audited it rather than assuming:

```js
function candH(c) { return c.h * clamp01(easeOutBack(clamp01(c.grow))); }
function candTop(c){ return S.base - candH(c); }
function shellY(sh){ return candTop(sh.cx) - sh.y0 - 14 + Math.sin(sh.bob)*3; }
```

Shell Y is **derived at render time** from the live baseline and the live candle, and `candH` is clamped to `[0, c.h]`. So `shellY ≤ S.base − 48` always: it **cannot** place below its own baseline. **Structurally sound — ruled out as the cause.**

But it is a collectible world *outside the Constitution*, and it got there by being a scene module. Gate check **6b** now asserts its render-time derivation, so if anyone ever converts it to a stored absolute `y`, the build goes red.

**Important:** these scene pickups must **not** be routed through `CQREACH.place()` — they live in a different coordinate system, and validating scene coordinates against the main chart's terrain would produce confident wrong answers. The gate's global-array regex was tightened (`(?<![.\w])`) to exclude `S.boxes.push(` for exactly this reason.

---

## WHAT I DID

Ported COLLECTIBLE LAW 001 to `feature/home-market-ceremony` in full — **23 anchored edits**, each asserted so a partial apply fails loudly:

- `window.CQREACH` owner + Playable Region + CFG-derived envelope + reject-never-repair pipeline
- Terrain-space anchoring, re-projected by `resize()`
- **All 10** spawn sites gated — including this branch's own governed valley box
- `setWick()` owning wick growth; `initCandles()` clearing collectibles
- Trade-truncation `Infinity` hole fixed and extended to every family
- Continuous heal audit, render dead-space guard, dev-only `?reach` overlay
- `sw.js` cache → `v312` *(the stale service worker served me 311 even after the file changed — worth remembering)*

**Build 311 → 312.**

## VERIFICATION ON BUILD 312

Same world, same shells, the identical test that buried 9 of 10:

| viewport | 690 | 640 | 568 | 420 | 812 | 730 |
|---|---|---|---|---|---|---|
| shells buried | **0** | **0** | **0** | **0** | **0** | **0** |
| clearances identical to baseline | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| audit violations | 0 | 0 | 0 | 0 | 0 | 0 |

Gate: **PASS** — *owner published · 10 validated spawn sites · 4 wick growths owned · scene world render-derived · resize re-anchors · single groundY writer · overlay dev-only · rebuild clears*

main (build 301) re-checked: **14 pass · 0 fail** — no regression.

---

## P0.1 STATUS

**Not closed.** You said not to declare it complete until founder playtesting can no longer reproduce it, and that is your call to make, not mine. Both branches now carry the law and both pass. The QR points at **build 312**.

## The real lesson

The Constitution was sound; the **distribution** was not. A law that exists on one branch is not an engine rule, it is a local convention. Two follow-ups worth deciding:

1. **The forked build numbers must be reconciled.** Right now a higher number can mean an older lineage, which is actively misleading during playtests. Suggest main takes the max (312+) on merge, or branches use a suffix (`301-hmc`).
2. **The gate should run on every branch, not just main.** It lives in `scripts/` and is branch-local, so a branch can drift exactly the way this one did.

## Open question for you

The tutorial's wick-shell tower places shells at `y0` of **210, 300, 400, 510, 630px** above its candle. In main-game terms 630px exceeds one boost (335 conservative, 477 true) and needs most of a full tank. It is a separate scene with its own tuning so it is not a Law 001 violation — but if you want the tutorial to teach reach that the main game then honours, those top two shells are worth a look.
