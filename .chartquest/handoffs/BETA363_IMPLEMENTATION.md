# Build 363 Mobile Blocker Implementation

## Task

Close the two bounded mobile-readiness blockers found after build 362, preserve all accepted beta
gameplay/replay behavior, and produce one exact candidate for independent Review and QA.

## Exact uncommitted candidate

- Branch: `codex/beta-360-readiness`
- Parent: `8732cd44f9272a917428e772df4c7107d221bc40`
- Build: **363**
- `chart-quest.html`, `index.html`, `website/game.html` SHA-256:
  `26601a812ca693d33672db5abc1e8b1bfe338e43b0df85290c3d6f02cc3aa842`
- Browser bridge SHA-256:
  `bfcd273188ce8505450456c039e0b376bf73d313236e895ce4502ad8df7bba27`
- Browser harness SHA-256:
  `701fbac50d68bf9bdcb740ad02f947d41d681a2ae02f61258b96793e453225ab`
- Focused suite SHA-256:
  `8a802f5fc336b3bb619925b797ea7755fa3c0c2ffceed8e60e8dfabe8b2e2391`
- Verifier SHA-256:
  `11958d618e2b39f72625f5620d260b97a85be40e8b3225522eba5dab2b283b53`
- Local QA server SHA-256:
  `41e27528e6ec5178d37b263928f0492f980d7e523906053bfdca98298f0dda05`

The candidate is intentionally unstaged and uncommitted at this handoff boundary. Production is
frozen and this implementation is not release authorization.

## Work completed

- Published four CSS safe-area probes and one frozen `window.CQVIEW` numeric owner. Missing,
  negative, non-finite, malformed, and throwing inputs become zero without throwing.
- Placed the opening DOM Skip at `14px + safe top/right`, raised it above the full-screen portal,
  and gave it a 72x44 minimum target. Kept Enter above the safe bottom inset.
- Applied the same inset owner to the retained canvas cinematic Skip and the movement tutorial
  Skip. Each path uses one rectangle for drawing and hit-testing; movement Skip is now 84x44.
- Capped only the main `#game` backing store at effective DPR 2. Logical canvas CSS dimensions,
  stage dimensions, physics, and CSS-pixel pointer mapping are unchanged.
- Made `resize()` compute the literal `groundY` delta, including delayed `0 -> valid` recovery,
  and translate Finn plus finite sweep, trail, active-spin, ring, portal-ground, and fall-top
  terrain anchors transactionally.
- Left `camY`, x, velocity, grounded/spin flags, direction, timers, and gameplay state unchanged;
  the camera continues to refit to the new viewport.
- Suppressed the main-world translation while `BlockchainJourney` owns the shared Finn. The
  tutorial retains sole ownership of its independent terrain/camera state through rotation, and
  main-world translation resumes after handoff.
- Advanced the served build identity and verifier labels to build 363 and regenerated both mirrors
  from the canonical source.
- Extended the focused suite from 16 to 18 cases and the visible Browser harness from 23 to 25
  cases by adding M1 safe-inset geometry and M2 main/tutorial resize ownership.

## Exact scope

- `chart-quest.html`
- `index.html`
- `website/game.html`
- `scripts/cqsafe.test.js`
- `scripts/verify.js`
- `.chartquest/qa/beta360-bridge.js`
- `.chartquest/qa/BETA360_BROWSER_HARNESS.html`
- `.chartquest/handoffs/BETA363_INVESTIGATION.md`
- `.chartquest/handoffs/BETA363_IMPLEMENTATION.md`

No trade economics, curriculum, save keys, Finn movement model, boss engine, provider, credential,
release-control, deployment, art, binary, or production path changed.

## Implementation evidence

- Focused build-363 suite: **18/18 PASS**.
- Game source syntax: **10/10 inline scripts PASS**.
- Browser bridge and harness syntax: **PASS**.
- Loopback-only QA server self-test: **PASS** against the exact game fingerprint.
- Release-control fixtures: **15/15 PASS**.
- Artifact-parity fixtures: **5/5 PASS**.
- Full verifier: **24 pass, 0 fail, 0 warn, 1 allowed Puppeteer skip**.
- Gate #7: build **362 -> 363 PASS**.
- Gate #8: all three game artifacts byte-identical.
- Gate #10: protected systems unchanged.
- Gate #22: **18/18** viewport/CQSAFE/readiness contracts.
- Gate #23: bridge/harness syntax and local-server contracts PASS.
- `git diff --check`: **PASS**.
- In-app Browser on the exact hashes above: **25/25 PASS, 0 FAIL, 0 PENDING** across F1-F7,
  M1-M2, and C1-C4 at 390x844, 667, 468, and 340; no captured runtime failure.
- Fresh non-QA direct game at **375x667** and **390x844**: real DOM cinematic Skip click,
  premise Continue, real canvas movement-Skip coordinate tap, and Home Market dialog: **PASS**.

## Residual boundaries

- The automated fixture proves the bounded safe-inset seam; it does not claim a global HUD/modal
  safe-area migration.
- The 44px enlargement applies to first-session Skip controls, not every historical close/control.
- Representative physical Safari notch, browser chrome, touch feel, audio/haptics, and performance
  remain Founder/device checks.
- The `/play` wrapper, PWA manifest path, service-worker cache, online survey, and production served
  identity remain separate release/post-beta work.
- Any byte change invalidates the exact Browser evidence and requires a new fingerprint and rerun.

## Next action

Independent Reviewer and QA must rerun the frozen candidate and adjudicate it. Only an all-green
decision may be committed and labeled **BUILD 363 READY FOR FOUNDER MOBILE RETEST**. Do not push,
merge, deploy, modify `main`, change the production freeze, access providers, or touch credentials.
