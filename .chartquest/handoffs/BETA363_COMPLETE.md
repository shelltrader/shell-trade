# Build 363 Mobile Readiness Complete

## PM/CTO decision

**PASS — BUILD 363 READY FOR FOUNDER MOBILE RETEST**

The persistent command center accepts the exact reviewed and QA-passed local candidate for
subjective physical-device testing. Production remains frozen. This decision is not a
production-release approval.

## Exact accepted identity

- Branch: `codex/beta-360-readiness`
- Parent before candidate: `8732cd44f9272a917428e772df4c7107d221bc40`
- Exact candidate payload commit: `0d6201bb64a913525fdf4d6d624d88cfbbb4dbc0`
- Game source and both mirrors SHA-256:
  `26601a812ca693d33672db5abc1e8b1bfe338e43b0df85290c3d6f02cc3aa842`
- Browser bridge SHA-256:
  `bfcd273188ce8505450456c039e0b376bf73d313236e895ce4502ad8df7bba27`
- Browser harness SHA-256:
  `701fbac50d68bf9bdcb740ad02f947d41d681a2ae02f61258b96793e453225ab`

## Lifecycle result

- Investigator confirmed two bounded mobile blockers: first-session controls did not own physical
  safe-area geometry, and mobile viewport-height changes moved terrain without Finn.
- Implementer added one fail-closed inset/terrain owner, shared 44px first-session Skip geometry,
  main-canvas DPR-2 backing cap, transactional main-world re-anchoring, and an active-tutorial
  ownership boundary without changing protected gameplay systems.
- Independent Reviewer: **APPROVED**, no must-fix remaining.
- Independent QA: **PASS FOR FOUNDER MOBILE TEST**.
- Static/regression evidence: focused 18/18, release 15/15, parity 5/5, verifier 24 pass / 0 fail /
  0 warn / 1 allowed skip.
- In-app Browser: **25/25 PASS, 0 FAIL**; M1/M2 plus retained F1-F7 and 16 collision cells.
- Fresh non-QA real-control paths at 375x667 and 390x844: **PASS** through cinematic Skip,
  premise Continue, movement Skip, and Home Market.

## Founder mobile-retest checklist

1. Confirm opening Skip, Enter, and movement Skip are visible and tappable around the real notch,
   status bar, and home indicator.
2. Collapse/expand browser chrome and rotate once; Finn must remain attached to terrain without an
   off-chart jump or false pickup.
3. Play through the first real trade and a manual profitable close; confirm replay/details X works
   and the wording says Finn closed it himself and kept the profit.
4. Judge readability, touch feel, audio, haptics, and performance/heat.

## Release boundary

**BUILD 363 READY FOR FOUNDER MOBILE RETEST — DO NOT SHIP — PRODUCTION FROZEN**

Do not push, merge, deploy, modify `main`, change the GitHub production freeze, access providers,
or touch credentials. A future production release requires Founder acceptance plus a separate
Release Manager manifest/lock/gate/served-fingerprint workflow. Any evidence-bound byte change
requires new fingerprints and proportional reruns.
