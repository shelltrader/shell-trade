# Known Issues

Only repository-documented issues are listed below. The severity/status reflects the cited document where available; it does not assert that the issue is currently live.

## Build-366 Founder final cosmetic-retest readiness

No known P0 remains for local Founder cosmetic retesting on exact candidate payload commit `19c4434`
(game artifact `fdbf6980...`, Browser bridge `477cd8b0...`). Independent review approved,
exact-byte QA passed, and the expanded in-app Browser matrix passed 34/34. The inherited upright
Finn pose in the defeat cinematic remains explicit beta-deferred art debt; only the necklace repair
is claimed. Production verification remains separate and blocked.

## Historical Build-365 Founder final mobile-retest readiness

No known P0 remains for local Founder mobile retesting on exact candidate payload commit `7b3679c`
(game artifact `f80cecb3...`, Browser bridge `114d91e6...`). PM/CTO review approved, exact-byte QA
passed, and the expanded in-app Browser matrix passed 31/31. Production verification remains separate
and blocked.

## P0 — Release blocker

| Issue | Status | Evidence |
|---|---|---|
| The dated RC release record says **DO NOT SHIP** until production playthrough/cache/fingerprint evidence is complete. The record also contains conflicting claims about the deployed build. | Production-release blocker only; local Founder mobile-retest gate is closed on build 365 | `CHARTQUEST_RC_RELEASE_2026-08-10.md`; `handoffs/BETA365_QA.md` |
| Routine `scripts/verify.js` did not byte-compare `website/game.html` with the source and root mirror. | Resolved in the current build-365 candidate; gate #8 and parity fixtures passed | `handoffs/STEP7_QA.md`; `handoffs/BETA365_QA.md` |
| Step 6B controls and the durable `.chartquest` command center were absent from the base commit and not reproducible in a fresh clone. | Resolved and present in the build-365 candidate lineage; production promotion remains blocked by the freeze | `handoffs/STEP8_INTEGRATION_QA.md`; `handoffs/BETA365_COMPLETE.md` |
| Deployment smoke does not yet prove that the served `/game` response is the exact approved local artifact. | Unresolved release-verification gap; outside Step 7 local-check scope | `CHARTQUEST_RC_RELEASE_2026-08-10.md`; `handoffs/STEP7_QA.md` |

## Resolved in build 363

| Issue | Status | Evidence |
|---|---|---|
| First-session Skip/Enter controls did not own physical safe-area geometry; viewport-height changes could move terrain without Finn and derived terrain anchors. | Resolved for the bounded local Founder mobile-retest seam on exact build 363 | `handoffs/BETA363_INVESTIGATION.md`; `handoffs/BETA363_REVIEW.md`; `handoffs/BETA363_QA.md` |

## Resolved in build 364

| Issue | Status | Evidence |
|---|---|---|
| Setup formation incorrectly disabled box smash and Lost Wisdom collection; fast body overlap could miss. | Resolved on exact build 364 with real-trade-only focus plus swept/body interaction | `handoffs/BETA364_INVESTIGATION.md`; `handoffs/BETA364_QA.md` |
| FIRST WIN used a generic system trophy and loose text stack below the Founder quality bar. | Resolved on exact build 364 with one authored vector milestone | `handoffs/BETA364_IMPLEMENTATION.md`; `handoffs/BETA364_QA.md` |
| The Founder first-trade preview was forced muted and the authored path was emotionally flat. | Resolved on exact build 364 with a music-on preview, dedicated score route, and four-act path | `handoffs/BETA364_INVESTIGATION.md`; `handoffs/BETA364_QA.md` |

## Resolved in build 365

| Issue | Status | Evidence |
|---|---|---|
| A box placed ahead could survive beyond a later trade portal and become unreachable during the trade. | Resolved on exact build 365 with atomic portal-corridor deferral and quota restoration | `handoffs/BETA365_INVESTIGATION.md`; `handoffs/BETA365_QA.md` |
| Replay/recap Finn could stop visually short of the planned TP/SL exit line. | Resolved on exact build 365 with four-direction exact crossing geometry and a readable terminal hold | `handoffs/BETA365_IMPLEMENTATION.md`; `handoffs/BETA365_QA.md` |

## P1 — Major issue

| Issue | Status | Evidence |
|---|---|---|
| Level 1 is not owned by `LEVEL_FLOW`; its order is hard-coded across several sites. | Post-beta backlog, not confirmed active | `CHARTQUEST_RC_BASELINE_2026-08-10.md`, §16 |
| Boss 1 `confirm` and `whowon` rounds are documented as degrading to bare one-line objectives without a LessonChart scene. | Post-beta backlog, not confirmed active | `CHARTQUEST_RC_BASELINE_2026-08-10.md`, §16 |

## P2 — Polish

| Issue | Status | Evidence |
|---|---|---|
| Independent `BUILD_TAG` regex parsers remain rather than a single `CQOPS.build` owner. | Post-beta backlog, not confirmed active | `CHARTQUEST_RC_BASELINE_2026-08-10.md`, §16 |
| `_anyBlockingUI()` does not check `trade`; the document reports several hand-rolled trade-in-progress predicates. | Post-beta backlog, not confirmed active | `CHARTQUEST_RC_BASELINE_2026-08-10.md`, §16 |
| CQBEAT header documentation is stale relative to documented `MODE='enforce'`. | Post-beta backlog, not confirmed active | `CHARTQUEST_RC_BASELINE_2026-08-10.md`, §16 |

## P3 — Post-beta

| Issue | Status | Evidence |
|---|---|---|
| `result:'manual'` is documented as conflating player manual close with forced hour-close. | Post-beta backlog, not confirmed active | `CHARTQUEST_RC_BASELINE_2026-08-10.md`, §16 |
| The Level-5+ long RISK/TARGET trade chip did not receive the definitive rendered four-height Browser matrix used for the Level-1 closed beta. | Post-beta geometry follow-up; not a Level-1 Founder-test blocker | `handoffs/BETA360_BROWSER_QA.md` |

## Founder/release validation boundaries

- Physical Safari notch/Dynamic Island and collapsing-address-bar behavior, real touch feel,
  audio/haptics, sustained DPR/GPU performance, heat/battery, and subjective readability require
  representative-device Founder testing.
- Global HUD/modal safe-area migration, historical small controls, secondary canvases, and the
  `/play` wrapper/PWA manifest/service-worker/cache topology remain post-beta/release follow-ups.
- Successful online survey telemetry was not exercised because the local harness blocks external
  connections by design.
- Served production fingerprint, fresh-cache behavior, release manifest/lock/gate, and account-level
  freeze changes remain future Release Manager work.
