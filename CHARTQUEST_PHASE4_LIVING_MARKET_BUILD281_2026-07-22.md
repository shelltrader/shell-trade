# ChartQuest — Phase 4: The Living Market · Build 281
## Change Report

**Date:** 2026-07-22 · **Build:** 280 → **281** · **Source of truth:** `chart-quest.html` (mirrored to `index.html`, sha256 identical) · **Gate:** `verify.js` 10 pass · 0 fail · 1 warn (pre-existing CFG, approved) · 1 skip (puppeteer)

**A candid framing up front.** This was the highest-risk sprint so far, because the candles are three things at once: the **collision terrain** Finn stands on (the *frozen* physics seam `{candleTop, c.x, c.w, gap}`), a surface governed by the **RATIFIED Visual Market Constitution** (the Candle Bible — changes there need an ADR), and something I **cannot see** in this harness (canvas screenshots as black). Animating the hero surface *wrong* could break platforming *and* violate frozen canon *and* I'd never know. So I did the disciplined thing: I shipped the one genuinely-safe, high-leverage "aliveness" change — verified to the bone — and I **refused to animate the whole candle field blind against a ratified constitution.** The larger vision is scoped, not skipped (§8).

**What shipped:** candles now **commit into being** instead of popping, and the forming edge **breathes with a personality read straight off conviction.** Both are render-only, palette-safe, and provably do not touch the collision surface.

---

## 1. Behavioral improvements

- **Candles COMMIT into being.** A newly-printed candle no longer *pops* into existence fully-formed. Over a brief ~0.16s it **materialises with weight** — a fade-in plus a small grow to full height, anchored at its true top. Price *arrives* rather than *appears*. That single change turns the live edge from a ticker into an event: something is *happening* there.
- **The market breathes with personality.** The live-edge pulse — previously a fixed shimmer — now reads the candle's **conviction** (its body size) and breathes accordingly: a **decisive, big-body** candle glows a touch **brighter, steadier, and faster** (confidence); a **hesitant, small-body** candle is **dimmer and slower** (indecision). The market's mood is now legible in how the forming candle *breathes*, before any number is read.

## 2. Animation improvements

- **Birth animation** (`drawCandle`): fade `0.45 → 1.0` + top-anchored grow `94% → 100%`, on an ease-out cubic, over `0.16s`. Anchored at the true top so the upper wick stays attached and the render top is *exactly* the collision top.
- **Conviction-graded live-edge breath:** base brightness `0.10 + 0.05·conviction`, breath rate `2.4 + 0.9·conviction`, amplitude `0.035 + 0.025·conviction`. Verified curve (big body → conviction 1.0; small → 0.19; doji → 0.05).
- A fully-**settled** candle renders **pixel-identical to build 280** — zero regression to the clean, readable chart the Candle Bible mandates.

## 3. Timing improvements

- The birth is timed by a **wall clock** (`performance.now()`), *not* the game update clock. This is deliberate: an update-driven timer freezes whenever the game pauses (a lesson card, a trade ticket), which could strand a just-printed candle mid-birth (half-faded). The wall clock **always advances**, so a birth **completes even across a pause** — no stuck candle, ever. *(This bug was caught and fixed during verification — my first pass used a game clock.)*
- `0.16s` is tuned to be felt-not-seen: long enough to read as "forming," short enough that by the time Finn walks to a candle it's long settled (so platforming never meets a birthing candle).

## 4. Educational improvements

- **The read shifts from geometry to intention.** The whole Phase-4 objective is that a beginner stops saying *"that candle went up"* and starts saying *"the buyers took control."* Conviction-as-brightness is the first nudge: a big confident candle now *looks* confident (it glows and steadies), a hesitant one *looks* hesitant (it dims and wavers) — so the player begins **sensing** buyer/seller pressure before consciously analysing it. It reinforces the Candle Bible's keystone lesson ("the fat middle is the fight") by making the *size of the fight* legible as *life*, not just height.
- It stays **within the Candle Bible** — no invented colours, no geometry changes, the body-floor and width laws untouched — so the educational readability the earlier phases fought for is preserved.

## 5. Psychological improvements

- **The forming edge draws the eye as a decision, not scenery.** A committing candle with weight makes the live edge feel like *the present moment* — where the story is being written — which is exactly where a trader's attention belongs.
- **Personality without cartooning.** The conviction breath is *below conscious notice* (per the brief's own rule) — the player feels the market's mood without seeing an "effect." Believable, not dramatic.

## 6. How each change makes the market feel more alive

- **Popping → committing** is the difference between a slideshow and a performance. A candle that *forms with weight* is an actor taking the stage, not a graphic being blitted.
- **A fixed shimmer → a conviction breath** is the difference between a status LED and a pulse. The live edge now has a heartbeat whose character *means something*.
- Together they make the **live edge feel authored by pressure** — buyers and sellers deciding, right now — which is the first step from "reading candles" to "reading intentions."

## 7. Campaign Bible memories strengthened

- **Memory 3 — "the candles were ALIVE… the fat middle is the fight."** This is the literal delivery: conviction (the size of the fight) is now *felt as life*. The candle-literacy keystone gets a body.
- **Memory 1 — "the candles were alive… friendly creatures of light that let me stand on their backs."** Candles that *commit into being* with weight are more clearly *alive creatures* than static rectangles — while (verified) still perfectly safe to stand on.
- The **Governing Image** (the market as a character with intention) is advanced: the forming edge now expresses conviction, the first brushstroke of "the market is the main character."

## 8. What still prevents the market from feeling like a living world *(the honest list)*

This pass delivered the *live edge* coming alive. The full brief — *every* candle has personality; hesitation before reversal; pressure building before breakout; exhaustion before trend failure — is **deferred, deliberately, not for lack of ideas but for lack of a safe, verifiable path:**

1. **Per-candle personality across the whole field.** Making *every* candle (not just the live edge) express confidence/fear/exhaustion means animating the entire settled chart — the exact surface the Candle Bible freezes and the current design keeps "clean so it reads instantly." That is a **Candle-Bible-governed change** that likely needs an **ADR**, and it must be done on the roadmapped **`window.CQ` candle engine** (the single-owner render path), not bolted onto `drawCandle`.
2. **Behavioral "intentions" over time** — hesitation *before* a reversal, pressure *building* before a breakout, exhaustion *before* a trend fails. These require animating candle *formation as a sequence* tied to a candle's role (bos / sweep / reversal), which touches generation + render together and, crucially, **cannot be verified blind** (this harness can neither screenshot the canvas nor reach the active candle-printing state — the cinematic won't hand off without real rAF).
3. **The "no numbers" test.** The brief's litmus — remove all labels, can you still *feel* confidence/fear/momentum/exhaustion? — is not yet passed field-wide. Conviction-brightness passes it for the *live edge* only.
4. **On-device visual tuning (required).** Every magnitude here (0.16s, 94%→100%, the breath constants) is verified *correct in logic* but **unseen**. The birth's weight and the breath's subtlety must be tuned by eye on device before they're "worthy" — and if the birth reads as busy, it's a one-constant dial-back or revert.

**My recommendation for the fuller vision:** treat "every candle is an actor" as a first-class **Candle Bible ADR + a `window.CQ`-engine work item**, with on-device verification in the loop — not a blind edit to the frozen render path. I can draft that ADR and the engine-side design next if you want it.

---

## Verification

| Check | Result |
|---|---|
| Syntax (all 4 script blocks) | ✅ parse clean |
| Boot (build 281, live `?fresh=1`) | ✅ **zero console errors** |
| **Collision surface untouched** | ✅ `candleTop(c) === groundY − max(open,h)` after animating frames — birth never touches `open/h/x/w` |
| `candleTop` stable across birth frames | ✅ render provably cannot move collision |
| Birth curve | ✅ fade 0.45→1.0 + grow 94%→100% ease-out (verified numerically) |
| Personality grading | ✅ conviction 1.0 (big) / 0.19 (small) / 0.05 (doji) |
| Wall-clock robustness | ✅ births complete + old candles settled (pause-immune) |
| Settled-candle parity | ✅ identical render to build 280 (bTop=top, bH=bodyH, bAlpha=1) |
| `verify.js` gate | ✅ 10 pass · 0 fail · 1 warn (pre-existing CFG) · 1 skip |
| TES (#11) / mirror (#8) | ✅ intact / sha256 identical |

**Honest limitation:** the logic is verified to an unusually high degree for this project (collision-safety and the birth curve are *provable* in isolation), but the **look is unseen** — the harness can't screenshot the canvas, and it can't even reach the active candle-printing state (the cinematic won't hand off without real timers). Scan the QR (Desktop, build 281) and watch the live edge: candles should *arrive* with a hair of weight, and the forming candle should breathe a little brighter when it's a big decisive push. If it reads busy, it's one constant to soften — or a clean revert, since every settled candle is untouched.

*This build makes the **forming edge** feel alive. Making the **whole market** an actor is the next, bigger, canon-governed step — and it deserves to be done seen, not blind.*
