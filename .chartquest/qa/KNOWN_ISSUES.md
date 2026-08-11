# Known Issues

Only repository-documented issues are listed below. The severity/status reflects the cited document where available; it does not assert that the issue is currently live.

## Build-362 Founder-test readiness

No known P0 remains for local Founder testing on exact candidate payload commit `3ef4bf6`
(game artifact `d36bb51f...`, Browser bridge `52fa4b7b...`). Independent Review approved,
independent QA passed, and the in-app Browser matrix passed 23/23. Production verification remains
separate and blocked.

## P0 — Release blocker

| Issue | Status | Evidence |
|---|---|---|
| The dated RC release record says **DO NOT SHIP** until production playthrough/cache/fingerprint evidence is complete. The record also contains conflicting claims about the deployed build. | Production-release blocker only; local Founder-test gate is closed on build 362 | `CHARTQUEST_RC_RELEASE_2026-08-10.md`; `handoffs/BETA360_BROWSER_QA.md` |
| Routine `scripts/verify.js` did not byte-compare `website/game.html` with the source and root mirror. | Resolved in the current build-362 candidate; gate #8 and parity fixtures passed | `handoffs/STEP7_QA.md`; `handoffs/BETA360_BROWSER_QA.md` |
| Step 6B controls and the durable `.chartquest` command center were absent from the base commit and not reproducible in a fresh clone. | Resolved and present in the build-362 candidate lineage; production promotion remains blocked by the freeze | `handoffs/STEP8_INTEGRATION_QA.md`; `handoffs/BETA360_COMPLETE.md` |
| Deployment smoke does not yet prove that the served `/game` response is the exact approved local artifact. | Unresolved release-verification gap; outside Step 7 local-check scope | `CHARTQUEST_RC_RELEASE_2026-08-10.md`; `handoffs/STEP7_QA.md` |

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

- Physical Safari safe areas/address-bar behavior, DPR 2/3, touch feel, audio/haptics,
  performance/heat, and subjective readability require representative-device Founder testing.
- Successful online survey telemetry was not exercised because the local harness blocks external
  connections by design.
- Served production fingerprint, fresh-cache behavior, release manifest/lock/gate, and account-level
  freeze changes remain future Release Manager work.
