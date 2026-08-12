# Build 363 Mobile Blocker Investigation

## Decision

**BUILD 362 REQUIRED A BOUNDED MOBILE BLOCKER STRIKE BEFORE FOUNDER RETEST.**

This investigation is scoped to the exact local build-362 Founder-test candidate on branch
`codex/beta-360-readiness`, parent `8732cd44f9272a917428e772df4c7107d221bc40`. Production remained
frozen. No push, merge, deployment, provider, credential, or `main` action occurred.

## Confirmed blockers

### B363-01 — first-session escape controls did not own physical safe-area geometry

The game opts into `viewport-fit=cover` and a translucent iOS status bar, but the opening DOM
`#mmSkip`, retained canvas cinematic Skip, and movement-tutorial Skip were all placed against raw
screen edges. The movement Skip also exposed a 30px-high target. The existing 23-case Browser matrix
used zero safe insets and did not exercise either first-session Skip, so it could not detect the
notch/home-indicator contract gap.

Minimum safe correction: one fail-closed numeric inset owner backed by CSS `env()` probes; use it
only for the first-session Skip/Enter seam; make each Skip's drawn rectangle and hit rectangle the
same object; retain old zero-inset edge offsets while raising the critical Skip targets to 44px.

### B363-02 — mobile viewport-height changes moved terrain without Finn

`resize()` recomputed `groundY` and re-anchored `CQREACH` collectibles, but did not translate Finn or
his terrain-relative sweep, fall, portal, trail, spin, and ring anchors. A mobile URL-bar collapse or
orientation change could therefore bury or float Finn relative to the same candle and create a false
fall, collision sweep, or portal-reach transition. The active first-session movement tutorial is a
separate coordinate owner; blindly applying the main-world delta there would instead split Finn
from tutorial terrain.

Minimum safe correction: translate the bounded main-world terrain state transactionally by the
literal `groundY` delta, keep camera framing independent, support delayed zero-height recovery, and
suppress main-world translation while the tutorial owns Finn. Cap only the main canvas backing
store at DPR 2 to reduce mobile memory/fill pressure without changing logical CSS dimensions,
physics, or pointer coordinates.

## Acceptance boundary

Required before Founder mobile retest:

1. Deterministic inset parsing and exact shared draw/hit geometry, including malformed input.
2. DOM and canvas first-session Skip/Enter controls clear synthetic top/right/bottom insets.
3. Main canvas backing density is `min(raw DPR, 2)` while CSS dimensions remain unchanged.
4. Grounded, airborne, spinning, delayed `0 -> valid`, reversible height, and active-tutorial
   ownership contracts pass without changing movement state or camera framing.
5. Existing release, parity, protected-system, CQSAFE, replay, trade, and 16-cell collision gates
   remain green.
6. The exact Browser candidate passes expanded F1-F7 + M1-M2 + C1-C4 at all four heights, plus a
   fresh non-QA phone-size path using the real cinematic and movement Skip controls.

## Explicitly deferred

- A global stage safe-content rectangle and migration of every HUD/modal control.
- Enlarging all historical 28-30px controls, including every generic X.
- `/play` wrapper/service-worker/PWA topology and the deployed `manifest.json` mismatch.
- Secondary-canvas DPR changes, physical DPR3 performance/heat, audio/haptics, and visualViewport
  listener refactors.
- Physical Safari notch/address-bar/touch feel and subjective readability; these are the Founder
  mobile-retest boundary.
- Production fingerprint, cache, release manifest/lock/gate, freeze changes, and deployment.

## Files touched by Investigator

None. The PM/CTO transcribed this durable finding after independent read-only investigation.
