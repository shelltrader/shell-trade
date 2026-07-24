# Trading V2 — Implementation Roadmap

**Status:** Sequencing plan — NOT implementation. No code, no trading changes. **Date:** 2026-07-06. **Against:** build 250.
**Companions:** [Architecture](Trading_V2_Architecture_Final.md) · [Prototype Plan](Trading_V2_Prototype_Plan.md) · [Red Team](Trading_V2_Red_Team.md) · [Acceptance Criteria](Trading_V2_Acceptance_Criteria.md).

> Assumes the architecture survives Parts 4–5. Every phase is **gated** — you do not start a phase until the prior phase's success criteria are met. Nothing irreversible happens until Phase 3. Each phase is a separately-approved change per `CLAUDE_RULES.md` (protected system #9 ⇒ `CQ_ALLOW_PROTECTED=1`).

---

## PHASE 0 — Validate the premise (no game code)
- **Objective:** prove the wound is real (Gate 0) and the mechanism is honest (Gate 1) *before* touching `chart-quest.html`.
- **Scope:** run the [beginner comprehension playtest](Trading_V2_Beginner_Playtest_Protocol.md) on the current build; build the offline curve harness (continuation-vs-trap, gate OFF, 10k scenarios).
- **Files:** none in the game. One new dev-only harness file (or extend `lesson-chart-preview.html`).
- **Risk:** **Near-zero** to the shipping product. Only cost is time.
- **Rollback:** n/a (delete the dev file).
- **Success criteria:** Gate 0 shows felt pain (per Acceptance BC-1/FP-1/AT-1) **and** Gate 1's curve is monotone with the gate off (QW-1). **Either failing → stop; do not build V2.**

## PHASE 1 — Flagged Trade Lab (prove it feels better)
- **Objective:** prove honest resolution feels fairer/more explainable than the puppet, in the real loop, for one regime family.
- **Scope:** `?v2proto=1` lab mode; continuation-vs-trap generator wired through the existing ticket/resolution/review; coin flip + puppet removed **for lab trades only**; telemetry. Inert when the flag is off.
- **Files:** **`chart-quest.html` only** — additive, flag-gated. No `index.html` mirror. No save-schema changes.
- **Systems touched (guarded):** one `nextCandle` branch (3028); gate `_l1Outcome` behind `!v2proto` (11804); telemetry. Reuse `calcLevels`, `evaluateConfluence`, ticket, `resolveTrade`, review unchanged.
- **Risk:** **Medium** (protected #9, but isolated + reversible). Watch: staircase artifacts, wick-clamp/watchdog interactions, `frame()` throws.
- **Rollback:** flag off = original behavior; hard-remove = delete scenario block + two hooks. One-hunk revert, no migration.
- **Success criteria:** blind paired test shows a meaningful gap on FP-1 ("felt fair") and AT-1 ("knew why"); authored wins breathe (FL); live curve matches offline (QW-1). **Failing → stop; the redesign isn't worth it.**

## PHASE 2 — Full regime model + L1–3 integration (behind flag)
- **Objective:** replace the coin flip + puppet across Levels 1–3 (the worst offender) with the full five-regime model, behind the flag, and **resolve the economy floor question.**
- **Scope:** all five regimes + macro-bias layer; per-tier regime mix + clarity dials; the conflict penalty in quality; **an explicit economy decision** — with `RESERVE = 0` (3304), either re-introduce a beginner floor or prove honest losses don't bust (Red Team economy #1). Still flag-gated; live progression unchanged when off.
- **Files:** `chart-quest.html` only; a versioned `cq_*_v` save key **only if** new persisted state (e.g., macro bias) is required.
- **Systems touched:** candle generation, entry (`openTraderView` fallback removed), resolution, quality surfacing; economy constants if a floor is added. Boss gates / `conceptTier` **read but not changed**.
- **Risk:** **High** — this is the real cutover surface; softlock watchdogs, curriculum gating, and economy all interact.
- **Rollback:** flag off restores build-250 behavior; save key versioned so stale state invalidates gracefully. Revert = disable flag + drop the new key's reads.
- **Success criteria:** all Acceptance metrics hold at L1–3 in beginner mode (`?fresh=1`, verified on-device); no softlocks; economy solvent (EC); zero untaught leaks (PR). Telemetry curve stable across a full L1–3 run.

## PHASE 3 — Full roster, L4+, and graduation
- **Objective:** extend authored scenarios to all 8 setup types and L4+, delete the dead engines, and make V2 the shipping default.
- **Scope:** authoring templates for BOS/CHoCH/OB/sweep/VWAP/trend-break; replace the reactive-on-`MARKET_DATA` path (real data may still seed lead-in *ambiance*); **delete** `tradeDrivenCandle`, the `_l1Outcome` branches, the L1–3 override in `commitTrade`; flip the flag default on; mirror to `index.html` via `cq.sh ship`.
- **Files:** `chart-quest.html` (source) + `index.html` (mirror, via build only). Regression gate (`scripts/verify.js`) must pass.
- **Risk:** **Medium** by now — mostly deletion of proven-dead code, but the L4+ real-data replacement and the mirror/ship step are live-facing.
- **Rollback:** the flag remains the fast rollback through this phase; keep the dead engines until telemetry confirms the curve holds across **all** tiers, then delete in a final dedicated cleanup task.
- **Success criteria:** Acceptance metrics hold across all 10 levels + Market Maker; the full-game economy curve is bounded; learning-transfer (LE-1) shows on held-out types; regression checklist + gate green.

---

## Sequencing guardrails
- **No phase starts before the prior phase's success criteria are met** — the roadmap is a series of kill gates, not a schedule.
- **The flag is the through-line rollback** from Phase 1 to late Phase 3.
- **The irreversible steps** (deleting the puppet, flipping the default, mirroring to `index.html`) happen **only in Phase 3, only after** the curve is proven across every tier.
- **Each phase is a separate LARGE, approved change** with its own PRE-FLIGHT block; approval for one phase never implies the next.

---

*Sequencing plan only. No game code was modified. The roadmap's purpose is to make every step cheap to stop and reversible until the last one.*
