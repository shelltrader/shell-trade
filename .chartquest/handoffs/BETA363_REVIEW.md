# Build 363 Independent Reviewer Handoff

## Verdict

**APPROVE — READY FOR FOUNDER MOBILE RETEST.**

No must-fix findings remain. This approval is fingerprint-bound and does not authorize production
release, push, merge, deployment, provider access, credential changes, or modification of `main`.

## Exact candidate

- Branch: `codex/beta-360-readiness`
- Parent: `8732cd44f9272a917428e772df4c7107d221bc40`
- Build: **363**
- Game source and both mirrors: `26601a812ca693d33672db5abc1e8b1bfe338e43b0df85290c3d6f02cc3aa842`
- Browser bridge: `bfcd273188ce8505450456c039e0b376bf73d313236e895ce4502ad8df7bba27`
- Browser harness: `701fbac50d68bf9bdcb740ad02f947d41d681a2ae02f61258b96793e453225ab`
- Focused suite: `8a802f5fc336b3bb619925b797ea7755fa3c0c2ffceed8e60e8dfabe8b2e2391`
- Verifier: `11958d618e2b39f72625f5620d260b97a85be40e8b3225522eba5dab2b283b53`
- QA server: `41e27528e6ec5178d37b263928f0492f980d7e523906053bfdca98298f0dda05`

All three game artifacts are byte-identical.

## Independent results

| Check | Result |
|---|---|
| Full diff and bounded scope | **PASS** |
| Fingerprint identity | **PASS** |
| Diff hygiene | **PASS** |
| Inline game syntax | **10/10 PASS** |
| Focused viewport/CQSAFE suite | **18/18 PASS** |
| Release-control suite | **15/15 PASS** |
| Artifact-parity suite | **5/5 PASS** |
| QA server self-test | **PASS** |
| Full verifier | **24 pass, 0 fail, 0 warn, 1 allowed skip** |
| Browser harness | **25/25 PASS, 0 fail, 0 pending** |
| Protected systems | **Unchanged** |
| Git index | **Empty** |
| Repository writes by Reviewer | **None** |

The verifier skip is the pre-existing optional Puppeteer check; the exact candidate was exercised
independently in a real browser.

## Reviewer adjudication

- Safe-inset parsing fails closed for malformed, negative, missing, non-finite, and throwing values.
- DOM Skip owns the hit point above the Enter portal and clears top/right insets.
- Enter clears the bottom inset.
- Canvas cinematic and movement Skip controls share their rendered and interactive rectangles.
- Main-canvas DPR is capped at 2 without changing logical dimensions or pointer coordinates.
- Grounded, airborne, spinning, delayed-size-recovery, and reversible-resize contracts preserve
  terrain-relative state.
- Camera ownership remains independent.
- Active movement-tutorial ownership prevents the main-world resize delta from splitting Finn from
  tutorial terrain.
- No artificial collection, portal, floater, daze, or off-chart transition occurred during
  Browser resize coverage.

Browser M1 confirmed top/right/bottom insets `47/21/34`, `mmSkip` hit ownership, Enter clearance,
and movement Skip geometry. M2 confirmed main-world and tutorial ownership through collapse,
landscape-sized height, and restoration. No runtime errors were captured.

The fresh non-QA path also reached Home Market through the actual DOM cinematic Skip, premise
Continue, and canvas movement Skip. Exact phone-size runs at 375×667 and 390×844 are recorded in
the evidence package.

## Explicit deferrals

- Global HUD/modal safe-area migration and historical small controls.
- Physical Safari notch, address-bar, touch feel, audio, haptics, sustained performance, heat,
  and battery.
- Secondary-canvas DPR behavior.
- `/play`, PWA manifest, service-worker/cache topology, and online survey submission.
- Production-served fingerprint and release workflow.

These are appropriate Founder/device-test boundaries and do not block this candidate.

## Final decision

The exact Build 363 candidate may be labeled:

**BUILD READY FOR FOUNDER MOBILE RETEST — DO NOT SHIP — PRODUCTION FROZEN**

Any change to an evidence-bound artifact invalidates this approval and requires new fingerprints
plus proportional reruns.
