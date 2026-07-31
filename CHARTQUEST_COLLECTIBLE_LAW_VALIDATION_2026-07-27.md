# CHARTQUEST — COLLECTIBLE LAW 001
## Gameplay Validation Report · Code Locations · Founder Playtest Report

**Build:** 301 (from 300) · **Date:** 2026-07-27 · **Phase:** P0.1
**Verdict:** ✅ **PASS** — unreachable shells are now structurally impossible.
**Regression gate:** 14 pass · 0 fail · 0 warn · 1 skip (puppeteer not installed)

---

# PART 1 — ROOT CAUSE

The founder found shells spawning **beneath the playable chart**. This was not a bad spawn formula: every formula in the codebase was correct at the instant it ran.

**The cause was a coordinate-space mismatch.**

```
candles      store h / open  = height ABOVE the ground baseline   (terrain space)
collectibles stored y        = an ABSOLUTE world position         (frozen at spawn)
```

`candleTop(c) = groundY − max(open, h)`, and `groundY = Math.round(H × 0.7)` where `H` is the raw viewport height — recomputed on **both** `resize` and `orientationchange`, unconditionally.

So when the viewport changed, **every candle top moved and every collectible stayed behind.**

A shell below the surface is not merely hard to reach — it is **impossible**. The off-chart failsafe teleports Finn back onto the last candle the moment he falls past `groundY + 20`, so the dead space beneath the chart can never be entered. Three independent guards (wall block, anti-tunnel snap, off-chart failsafe) forbid him from ever going below a candle body top.

### Reproduced, not theorised

Measured live on the real spawn path, before any fix, at 375×812 → 375×730 (a routine mobile URL-bar reflow):

| shell | clearance before | clearance after | result |
|---|---|---|---|
| 1 | +58px | +1px | on the edge |
| 2 | +57px | 0px | flush with terrain |
| 3 | **+14px** | **−43px** | **BURIED INSIDE THE CANDLE** |
| 4 | +71px | +14px | degraded |

Every clearance dropped by exactly **57px = 0.7 × 82px**. Screenshots confirmed it visually: a shell that sat at the tip of a spin pole was, after the reflow, sunk into the candle body with the pole standing empty above it.

At rotation scale (groundY −217px) **every shell on screen** was buried 200–260px below the terrain.

---

# PART 2 — GAMEPLAY VALIDATION REPORT

All tests run against the real spawn path (`frame()`-pumped gameplay, real input, real generators), muted + fresh per house rules. No synthetic harness — the audit specifically noted that synthetic harnesses passed three times while the founder kept failing.

## 2.1 Drift immunity — THE headline test

Same shells, same world, viewport swept across a **3.9× range** and back:

| H | groundY | clearances | identical to baseline | below ground | violations |
|---|---|---|---|---|---|
| 300 | 210 | 142,62,30,69,66,219,66,235 | ✅ | 0 | 0 |
| 420 | 294 | *identical* | ✅ | 0 | 0 |
| 568 | 398 | *identical* | ✅ | 0 | 0 |
| 640 | 448 | *identical* | ✅ | 0 | 0 |
| 730 | 511 | *identical* | ✅ | 0 | 0 |
| 812 | 568 | *identical* | ✅ | 0 | 0 |
| 900 | 630 | *identical* | ✅ | 0 | 0 |
| 1024 | 717 | *identical* | ✅ | 0 | 0 |
| 1180 | 826 | *identical* | ✅ | 0 | 0 |
| 812 (return) | 568 | *identical* | ✅ | 0 | 0 |

**Before:** an 82px change buried a shell 43px inside terrain.
**After:** an 880px swing changes nothing. Every `y` moves to track the terrain; every clearance is byte-identical.

## 2.2 Rejection pipeline — every predicate proven to fire

| candidate | spawned | reason |
|---|---|---|
| below the chart baseline | ❌ | `BELOW_FLOOR` |
| inside the candle body | ❌ | `INSIDE_TERRAIN` |
| flush with the surface | ❌ | `INSIDE_TERRAIN` |
| above the world ceiling | ❌ | `ABOVE_CEILING` |
| no terrain beneath it | ❌ | `NO_TERRAIN` |
| NaN position | ❌ | `NOT_FINITE` |
| beyond one boost | ❌ | `UNREACHABLE` |
| **legal (control)** | ✅ | `OK` |

**Boundary is exact:** clearance 330 → `OK`, clearance 340 → `UNREACHABLE` (maxRise 335).

## 2.3 Movement envelope — derived, and corrected

| | naive `v²/2g` | true (with jetpack hang) | used for the safe band |
|---|---|---|---|
| hop | 132px | 132px | — |
| boost 1 | 335px | **477px** | **335px** (conservative) |
| boost 2 | 501px | **678px** | not budgeted |

The audit caught that the naive model **understates a boost by 42%**, because gravity is scaled to 0.45 for the whole 0.23s hang window and at boost velocities that window is spent entirely rising. The envelope now computes the true apex — and the safe band deliberately keeps the conservative 335px figure as margin for a beginner low on fuel.

`CFG.obBounceVy` was found to be **dead code** (defined, never read; the landing path zeroes `vy` unconditionally). It is explicitly not budgeted — a module that assumed a bounce-pad launch would over-estimate the safe band.

## 2.4 Live play

Guardian 1 / Level 1, real generators: 136 candles, 12 collectibles approved, **0 rejected** (legitimate placements are unaffected — the gate is not fighting the level design), **2 shells collected in play** (wallet 5 → 7), zero console errors, no crash across ~14,000 pumped frames.

## 2.5 Self-test against the required surfaces

| Surface | Result |
|---|---|
| **Guardian 1 / L1 intro** | ✅ verified live; 12 approvals, 0 rejections, 2 collected |
| **Procedural generation** | ✅ all 3 ambient generators gated |
| **Handcrafted / authored sections** | ✅ same gate — `place()` has no bypass for authored content |
| **Trades** | ✅ trade-entry truncation now culls *all three* families; `Infinity` fallback bug fixed |
| **Lessons / practice / replay / notebook** | ✅ these surfaces do not spawn collectibles; the audit confirmed the whole spawn surface is 9 sites |
| **Boss scenes** | ✅ no boss-specific spawn path exists; any future one must use `place()` or fail gate #14 |
| **Future charts** | ✅ `CQREACH.own()` + gate #14 make bypass a build failure |

## 2.6 Enumeration is closed

The audit proved by exhaustive `.push(` counting that the spawn surface is **exactly 9 sites** (7 shell + 1 box + 1 Lost Page), with no alternate insertion path — no `coins[i] =`, no reassignment, no `concat`, no `push.apply`. All 9 are gated.

## 2.7 Gate is negative-tested

A gate that cannot fail proves nothing:

| injected regression | gate |
|---|---|
| reintroduce a raw `coins.push` | ❌ FAIL — *"1 un-validated coins.push("* |
| remove the `resize()` re-anchor | ❌ FAIL — *"collectibles will strand on viewport change"* |
| restored | ✅ PASS |

---

# PART 3 — EVERY CODE LOCATION MODIFIED

### New files

| File | Purpose |
|---|---|
| `scripts/collectible_law_gate.js` | Build gate — 8 structural invariants |
| `COLLECTIBLE_CONSTITUTION.md` | The law |
| `SHELL_SPAWN_SPECIFICATION.md` | Implementation contract |
| `CHARTQUEST_COLLECTIBLE_LAW_VALIDATION_2026-07-27.md` | This report |

### `chart-quest.html` (mirrored byte-identically to `index.html` + `website/game.html`)

| Line | Change |
|---|---|
| 1630 | **NEW** `_REACH_DEBUG` — captured beside `_CQ_MUTE`, *before* `?fresh` strips the query string |
| 2750 | `BUILD_TAG` → build 301 |
| **2838–3152** | **NEW `window.CQREACH`** — the Playable Region + Collectible Law owner (envelope, registry, validation pipeline, `place`, `anchor`/`reanchor`, `audit`, `clearAll`, `cullPast`, `setWick`, `own`, ledger) |
| 2831 | `resize()` now calls `window.CQREACH.reanchor()` after moving `groundY` (window handle — bare ref is a TDZ crash) |
| 3153 | `_reachAuditT` throttle |
| 4329 | `initCandles()` → `CQREACH.clearAll()` (was orphaning pickups over a rebuilt chart) |
| 4479 | spin-pole shell → `place()`, tagged `pole`/`_wf`/`_wpad` |
| 4510 | ambient body-top shell → `place()` |
| 4514 | high-route cache shell → `place()` |
| 4686 | breakable data box → `place()` |
| 9866 | mega-pole wick growth → `setWick()` |
| 9876 | mega-pole tip shell → `place()`, plus one-pole-one-prize dedupe guard |
| 9897–9901 | Lost-Wisdom clamp capped at `envelope.maxRise`; re-anchors `y`+`tipY` |
| 9910 | backward wick clamp → `setWick()` |
| 9946 | Lost-Wisdom pole promotion → `setWick()` |
| 9949–9951 | three wisdom-pole shells → `place()` with shaft fractions |
| 9970 | tip re-grow → `setWick()` |
| 9975 | Lost Page → `place()` with `fields:['y','tipY']`; refusal defers the chapter instead of losing it |
| 12797–12801 | trade truncation: `Infinity` → `-Infinity` fallback (cull was silently disabled); now culls **all** families via `cullPast()` |
| 14512–14520 | continuous audit, ~2×/sec |
| 16432–16497 | **NEW** `drawReachOverlay()` — dev-only `?reach` |
| 16505 | render FINAL-safety: never draw a shell below the baseline |
| 16513 | overlay draw hook |

### Other

| File | Change |
|---|---|
| `scripts/verify.js` | **NEW** check #14 wired |
| `sw.js` | `CACHE` → `chart-quest-v301` |

---

# PART 4 — FOUNDER PLAYTEST REPORT

## The report

> *"During founder playtesting we discovered shells spawning beneath the playable chart."*

## Status: **ELIMINATED — structurally, not patched**

### What you can do now that used to break it

Rotate the phone. Let the URL bar collapse and reappear. Open the keyboard on the save prompt. Drag a desktop window between monitors. Any of these previously slid the entire chart out from under every shell on screen.

They are now **non-events**. Collectibles live in the same coordinate space as the terrain, so they move *with* the chart the way the candles always did. This is the same reason candles never had this bug.

### Against your success criteria

| You said you should never again find | Status |
|---|---|
| shells below the chart | ✅ `BELOW_FLOOR` rejects at spawn · terrain-space anchoring prevents drift · renderer refuses to draw one · gate #14 fails the build |
| shells inside candles | ✅ `INSIDE_TERRAIN` (10px minimum clearance) |
| shells inside UI | ✅ structurally — the fixed HUD bands lie outside the legal spawn region |
| shells inside collision | ✅ `INSIDE_TERRAIN` — the walkable surface *is* the collision surface |
| unreachable shells of any kind | ✅ `UNREACHABLE` at one conservative boost · `NO_TERRAIN` · `ABOVE_CEILING` |

### What you will actually notice

**Nothing.** That is the intent. Legitimate placements were unaffected — 12 approvals, 0 rejections in live play. The gate is not fighting the level design; it is fencing off a region the design never wanted to use.

Two small things did improve:
- A spin-pole shell whose pole later grew into a mega pole used to strand mid-shaft. It now rides to the tip.
- A pole can no longer end up with two shells 2px apart. One pole, one prize.

## How to see it working yourself

```bash
node scripts/verify.js
```

Add `&reach=1` to any test URL for the developer overlay — green safe band, dashed one-boost reach line, red dead zone, per-shell clearance, and a live accept/reject ledger. Players can never see it.

## Honest limitations

1. **`?reach` is a diagnostic, not a proof.** It shows the current world. The build gate is what makes the invariant permanent.
2. **The 335px safe band is a policy, not a physics limit.** True one-boost reach is 477px. The gap is deliberate margin for a beginner low on fuel. If a future design genuinely needs a higher placement, that is an ADR decision, not a constant to quietly raise.
3. **Reachability is validated locally**, as clearance above the candle beneath the pickup. This is sound because terrain is traversable by construction (structure impulses are capped at `CFG.bosMax` = 200px, well inside one boost). If that cap is ever raised, this assumption needs revisiting — noted here so it is not rediscovered the hard way.
4. **Not yet run on physical hardware.** All verification was on desktop Chrome at mobile viewports. The mechanism is viewport-driven and device-independent, but a real rotation on your phone is the last mile and worth doing.
5. **`scripts/verify.js` check 3b is skipped** — puppeteer is not installed. Syntax parse (3a) is the proxy, and I booted the served build manually with zero console errors.

## Open founder calls

| # | Question |
|---|---|
| F1 | The Lost-Wisdom clamp is now capped at one boost. Previously it could lift a page arbitrarily high to clear the walking path. Capping means a page may sit slightly closer to the path than before. Acceptable, or should the page instead *move to the next candle* when the cap binds? |
| F2 | `audit(heal)` restores a drifted pickup rather than deleting it. For shells this is clearly right. Confirm you agree for Lost Pages — the alternative is a chapter silently vanishing. |
| F3 | The two worktrees (`home-market-ceremony` at build 311, `blockchain-journey`) are **not** covered — they are separate branches off older builds. Want CQREACH ported to them now, or at merge time? Note the HMC worktree was the build you may have been playtesting. |

---

## Files to read first

1. `COLLECTIBLE_CONSTITUTION.md` — the law and why it is constitutional
2. `SHELL_SPAWN_SPECIFICATION.md` — the pipeline, API, and traps for the next engineer
3. This report — evidence
