# Known Issues

Only repository-documented issues are listed below. The severity/status reflects the cited document where available; it does not assert that the issue is currently live.

## P0 — Release blocker

| Issue | Status | Evidence |
|---|---|---|
| The dated RC release record says **DO NOT SHIP** until a production playthrough, fresh-browser production test, production fingerprint verification, and Level 1 event-spacing validation report are complete. The record also contains conflicting claims about the deployed build. | [UNKNOWN — REQUIRES VERIFICATION] | `CHARTQUEST_RC_RELEASE_2026-08-10.md` |
| Routine `scripts/verify.js` did not byte-compare `website/game.html` with the source and root mirror. | Resolved and QA-passed in feature commit `31ffd6f`; controlled integration into `main` remains pending | `handoffs/STEP7_INVESTIGATION.md`; `handoffs/STEP7_REVIEW.md`; `handoffs/STEP7_QA.md` |
| Step 6B controls and the durable `.chartquest` command center were absent from the base commit and not reproducible in a fresh clone. | Resolved and QA-passed on local integration HEAD `04227af`; promotion to `main` is intentionally blocked by the production freeze | `handoffs/STEP8_INTEGRATION_REVIEW.md`; `handoffs/STEP8_INTEGRATION_QA.md`; `handoffs/STEP8_COMPLETE.md` |
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
