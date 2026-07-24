# ChartQuest — Phase 2: Breakable Digital Boxes · Build 279
## Implementation Report

**Date:** 2026-07-21 · **Build:** 278 → **279** · **Source of truth:** `chart-quest.html` (mirrored to `index.html`, sha256 identical) · **Gate:** `verify.js` 10 pass · 0 fail · 1 warn (pre-existing CFG, approved) · 1 skip (puppeteer)

This completes the Phase-2 economy sprint by adding the breakable-box mechanic — after you directed me to **inspect the `feature/blockchain-journey` branch first and reuse production-quality parts, or implement natively in main.**

---

## 1. The reuse-vs-native decision

I inspected the branch's **"Blockchain Cube"** (`feature/blockchain-journey`, build 272-EXP) in full. Assessment:

| Aspect | Branch quality | Decision |
|---|---|---|
| **Burst VFX** (double shockwave + ~26 shards/data-bits, gravity tumble, ~2s fade) | **Production-quality** — polished, exactly the brief's spec | **Reuse** (ported faithfully) |
| **Cube art** (dark cell, targeting frame, corner brackets, spinning double-diamond core, orbiting data-dots, 3D top-edge) | **Production-quality** | **Reuse** (ported) |
| **The mechanic** (scripted dive/shell-roll smash inside the *isolated BlockchainJourney scene*; boxes were decorative, no shell economy) | **Doesn't fit main** — it's a scripted movement-primer prop in a suspended-movement scene, not a free-roam environmental interaction, and gave no shells | **Implement natively in main** |

So this is the **hybrid** you specified: I lifted the branch's *spectacular* burst and cube visuals, and built the **mechanic native to main's free-roam world** — a box you smash by traversing, wired into the real shell economy.

---

## 2. The mechanic (to spec)

A self-contained, modular module — **two arrays (`boxes`, `boxFx`) + five functions** — hooked into the existing coin spawn/update/draw/reset calls. No new currency, journal, lore, collectible, or progression.

| Spec requirement | Implementation |
|---|---|
| Optional environmental interaction, **not** a progression system | A rare bonus in free-roam; nothing gates on it, nothing tracks it beyond the shells it pays |
| **Standard box = 1 shell** | `reward = 1` ✓ (verified: gain 1) |
| **Premium (~1 in 5) = 5 shells**, subtle glow + jiggle | `BOX_PREMIUM_CHANCE = 0.2`; premium draws a brighter gold-rim glow + a gentle always-on jiggle; `reward = 5` ✓ (verified: gain 5) |
| **Max reward 5, no extra RNG** | Only the 1-in-5 premium roll; reward is fixed 1 or 5 ✓ |
| **Spectacular digital particle burst** | Double shockwave (2 rings) + 26 shards/data-bits, angled spray, gravity tumble ✓ (verified: 28 particles/smash) |
| **Particles dissipate ~2s** | Long debris `maxLife: 2.0`, short sparks `0.8` ✓ |
| **Satisfying hit-feel + strong audio** | Contact-smash + shake + brief flash + digital-crunch SFX (`GameMusic.move.land`) + haptic; premium adds an extra chime + bigger shake/flash |
| **Consistent with the existing visual style** | Cyan data-cube = the game's digital/shell palette; premium's subtle gold = universal "valuable" (kept subtle so it never reads as the reserved gold boss-gate) |
| **Trading remains primary; boxes a small bonus** | Boxes spaced **~22–34 calm candles apart**, never during the authored intro / a live trade / a forming setup / on a structure or giant candle; 1–5 shells is tiny vs a winning trade's payout |

**Interaction:** contact-smash (Finn touches the box while traversing) — consistent with main's coin philosophy that "*pickups are a reward, never a precision challenge*." The box quivers, brightens, and spins faster as Finn approaches (anticipation), then bursts on contact.

**Placement:** floats ~34px above a calm candle's crown, in Finn's travel path. Gated off during `introFlow.active` so the Campaign-Bible golden path (the authored first hour) stays clean; boxes appear in open free-roam.

---

## 3. What was ported vs written fresh

- **Ported from the branch** (adapted to main's globals): the `smashBox` burst recipe (ring×2 + 26 shards with the exact life/size/gravity/colour distribution) and the `drawBox` cube visual (cell body, edge, top-highlight, corner brackets, double-diamond core, orbiting dots), plus the shard renderer (rotated `fillRect`, no `shadowBlur` — the branch's documented perf lesson).
- **Written fresh for main:** the spawn scheduler (`maybeSpawnBox`, spacing + gating + premium roll), the collision + cull update (`updateBoxes`), the reward wiring into `player.shells` / `session.collected` / the `+N` floater, the SFX/haptic mapping to main's `GameMusic`/`hapticMove`, and premium's subtle gold-glow + jiggle.

---

## 4. Verification

Because the box functions and arrays are true globals, I could **functionally test the mechanic directly** (not just boot-clean) — a stronger verification than the wallet/L1 canvas work:

| Test | Result |
|---|---|
| `smashBox(premium)` | ✅ gain **5**, broken, **28** burst particles |
| `smashBox(standard)` | ✅ gain **1**, 28 particles |
| `updateBoxes` collision (Finn on box) | ✅ standard smash → **+1**; premium → **+5**; no error |
| `updateBoxes` far (Finn away) | ✅ no smash, box survives, no error |
| `updateBoxes` cull (box far behind Finn) | ✅ removed |
| Burst lifetime | ✅ `maxLife` 2.0s (dissipates ~2s) |
| 40-frame loop pump | ✅ zero errors |
| `verify.js` gate | ✅ 10 pass · 0 fail · 1 warn (pre-existing CFG) · 1 skip |
| TES (#11) | ✅ untouched |

**A real bug caught and fixed during verification:** `updateBoxes` initially culled using `cameraX`, which I'd assumed was a global — it is actually a **local** parameter of `maintainCandles`/the render function. `updateBoxes` is called from `update()`, where `cameraX` is out of scope, so it would have thrown `ReferenceError` the moment a box spawned in free-roam (the intro's box-gating masked it in a boot test). Fixed to cull by the global `turtle.x`. This is exactly why direct functional testing mattered.

**Honest limitation:** as with the prior sprints, this harness can't screenshot the canvas, so the *look* of the cube and burst (the "spectacular" bar) needs your on-device `?fresh` eyeball — traverse in free-roam (post-intro) and smash a few; confirm the premium ones glow gold + jiggle and the burst feels satisfying. The *logic* (spawn/collision/reward/burst/cull/spacing) is verified above.

---

## 5. How boxes support the Campaign Bible

- **Restraint honored.** No new system — a box is a satisfying *moment*, not a mechanic to master or a tree to fill. It adds a small delight to traversal without competing with the trade.
- **Trading stays the loudest reward.** 1–5 shells, ~every 22–34 candles, gated off the trade/setup/intro — so a winning trade remains unmistakably the best way to grow the account (Phase-2's core goal, reinforced by the scarcity + wallet work in build 278).
- **The golden path stays clean.** Boxes never intrude on the authored first hour (`introFlow` gated), so Memories 1–7 land without clutter.

*Phase 2 is complete: scarcity (build 278) makes trading the primary source of wealth, the wallet fantasy (278) makes capital feel real, and the breakable box (279) adds a restrained, satisfying optional bonus — reusing the branch's best VFX, native to main.*
