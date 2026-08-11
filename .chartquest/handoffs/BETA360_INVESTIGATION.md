# Beta 360 Readiness Investigation

**Decision:** **NOT READY FOR FOUNDER TEST — CHANGES REQUIRED**

## Candidate verified

- Candidate: `b8b3457e727576722912686f104f721bd4d84b3e`
- Base: `2b4876c08c3d062dcbb31a8a568da93deaf686eb`
- Initial scope: `chart-quest.html`, `index.html`, and `website/game.html` only.
- Exact-candidate artifacts were byte-identical at SHA-256 `9ac59a402b4379cda5569d94b2d263b8f4dd51c3e1c8c27fa53a81282af5e395`.
- Exact-candidate static baseline: release-control fixtures 15/15; artifact-parity fixtures 5/5; verifier 20 pass, 0 fail, 0 warn, 3 skips; syntax and diff checks passed.

The working candidate became dirty later from authorized PM/CTO and Implementer activity. This investigation was adjudicated against the exact committed object above; transient source/mirror drift during implementation is not release evidence.

## Confirmed blockers

### B360-01 — sticky review-legend reservation is not torn down

`cfTopInset()` reserves `cfLegend` as sticky, so it never expires through the normal frame sweep. Actual chart/replay hide paths remove the DOM `.on` class without clearing the registry zone, and the journal close route can close the full-screen review without hiding/clearing the sibling legend. Invisible full-width geometry can therefore displace later HUD elements and violates build 360's own rule that hidden UI must not reserve space.

Minimum fix: one canonical teardown that removes `.on`, clears `CQSAFE.cfLegend`, stops replay state where applicable, and is used by every chart/review close transition. Automated lifecycle coverage must prove the zone is absent after every route.

### B360-02 — break-even manual close becomes red `−0` in persisted review

`resolveTrade()` treats `|delta| <= 0.5` as neutral `BREAK EVEN`, but replay, full summary, and related persisted surfaces use the binary rule `delta > 0 ? '+' : '−'` with red otherwise. An immediate manual close can consequently be reported as neutral first and later render as red `CLOSED EARLY −0 shells`.

Minimum fix: one positive/negative/break-even outcome classifier used consistently by the affected summary/replay/history surfaces. Add deterministic positive, negative, and zero manual-close coverage. The separate forced-hour-close semantic question remains post-beta.

## Required readiness evidence

1. **CQSAFE geometry:** open-trade chip versus price/wallet; `THIS WAY` versus the price axis; review/replay headline and badge below wrapped legend controls; lesson card/floater cases; supported narrow/short phone sizes; resize/state transitions; no `cfLegend` reservation after every close route.
2. **Replay/X:** the close-button center hit-tests to `.uxX`; pointer activation closes; replay timer stops; legend reservation clears; resolved trades reach replay then details.
3. **Manual truthfulness:** profitable, losing, and break-even manual closes agree across badge, explanation, replay, journal, color, and sign; no manual close is described as stop-loss or take-profit.
4. **Trade-time deferral:** boxes and journal pages cannot trigger, reward, delete, reveal, or collect during a trade; the same objects remain usable immediately afterward without duplication or ledger corruption.
5. **Fresh Level 1:** onboarding, faction, movement tutorial, lessons/portals, three guided trades, Fake Candle teaching, Guardian 1, Journal unlock/discovery, survey handoff, CQBEAT audit, and console-error check. Deterministic QA shortcuts may cover edge cases but do not replace one unforced fresh run.

## Deferrable for the Level-1 closed beta

- L5+ wide trade-banner behavior.
- Player-close versus forced-hour-close semantics at L4+.
- Level-1 flow architectural ownership and unrelated post-beta refactors.
- Production fingerprint, main integration, freeze removal, and deployment; those belong to a later authorized release operation.

## Readiness rule

Issue **BUILD READY FOR FOUNDER TEST** only after both defects are fixed, durable tests pass, an independent Reviewer approves the exact final diff, independent browser QA completes the matrix and fresh Level-1 run, and one clean exact candidate passes parity, identity, regression, and status checks.

## Files touched by Investigator

None. PM/CTO transcribed this handoff because the Investigator's sandbox was read-only for the candidate.
