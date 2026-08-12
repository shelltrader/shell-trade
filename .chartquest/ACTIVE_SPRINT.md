# Active Sprint

**Control-plane rule:** this file does not revive historical tasks as active work.

## Sprint objective

**IN PROGRESS:** close the three Founder-confirmed beta blockers found during the physical Build 363
mobile retest: (1) boxes and Lost Wisdom pages are visibly reachable but do not respond, (2) the
once-ever FIRST WIN presentation is below the product bar, and (3) the first real trade needs an
audible, higher-energy score plus a clearly legible roller-coaster price arc. Advance one exact
Build 364 candidate through implementation, regression review, rendered Browser QA, and PM/CTO
adjudication to **BUILD READY FOR FOUNDER MOBILE RETEST**. Production remains frozen and no deployment
is in scope.

## Current release/build

- Isolated candidate branch: `codex/beta-360-readiness`.
- Exact candidate payload commit: `0d6201bb64a913525fdf4d6d624d88cfbbb4dbc0`.
- Build: **363**.
- Source, root mirror, and website game artifact are byte-identical at SHA-256
  `26601a812ca693d33672db5abc1e8b1bfe338e43b0df85290c3d6f02cc3aa842`.
- Browser bridge SHA-256:
  `bfcd273188ce8505450456c039e0b376bf73d313236e895ce4502ad8df7bba27`.
- Production was last observed presenting build 359; exact served-response SHA-256 remains unverified.
- Candidate is not authorized for push, merge, deployment, or production testing.

## Active tasks

| Task | Owner | State | Next action |
|---|---|---|---|
| Build-364 blocker investigation | PM/CTO | **IN PROGRESS** | Reproduce the exact collectible, first-win, and first-trade seams from the Build 363 physical evidence and freeze bounded acceptance criteria. |
| Build-364 implementation | Engineering | **PENDING INVESTIGATION CLOSE** | Implement only the confirmed collectible interaction, first-win presentation, first-trade score/path, and proportional QA/tooling changes. |
| Build-364 review and QA | PM/CTO / QA | **PENDING IMPLEMENTATION** | Run focused/static/release/parity gates plus exact rendered Browser and fresh mobile-flow evidence before Founder handoff. |

## Blocked tasks

| Item | Status | Evidence |
|---|---|---|
| Production release | **DO NOT SHIP / production frozen** | The active GitHub ruleset blocks `main` updates. Push, merge, deployment, freeze changes, and provider actions are outside this readiness sprint. |
| Served artifact identity | Blocked until release workflow | Production presents build 359, while exact served-response SHA-256 and fresh-cache verification belong to a separately authorized release operation. |
| Online survey submission and physical-device behavior | Founder/release follow-up | The local harness intentionally denied external connections. Physical Safari notch/address-bar behavior, touch feel, audio/haptics, sustained performance/heat, and successful online telemetry remain device/production checks. |

## Completed tasks

| Task | Result | Evidence |
|---|---|---|
| Build-363 mobile investigation | **PASS — two bounded blockers identified** | `handoffs/BETA363_INVESTIGATION.md` |
| Build-363 mobile implementation | **PASS** | Candidate commit `0d6201b`; `handoffs/BETA363_IMPLEMENTATION.md` |
| Build-363 independent review | **APPROVED** | `handoffs/BETA363_REVIEW.md` |
| Build-363 independent QA and Browser matrix | **PASS FOR FOUNDER MOBILE TEST** | `handoffs/BETA363_QA.md`; focused 18/18; release 15/15; parity 5/5; verifier 24/0/0/1; Browser 25/25; fresh mobile path at 375x667 and 390x844 |
| Build-363 PM/CTO adjudication | **BUILD READY FOR FOUNDER MOBILE RETEST** | `handoffs/BETA363_COMPLETE.md` |
| Beta-360 investigation | **PASS — blockers identified** | `handoffs/BETA360_INVESTIGATION.md` |
| Beta automation investigation | **PASS — durable matrix defined** | `handoffs/BETA360_AUTOMATION_INVESTIGATION.md` |
| Build-362 implementation | **PASS** | Candidate commit `3ef4bf6`; `handoffs/BETA360_IMPLEMENTATION.md`; `handoffs/BETA360_AUTOMATION_IMPLEMENTATION.md` |
| Independent review | **APPROVED** | `handoffs/BETA360_REVIEW.md` |
| Independent QA and Browser matrix | **PASS — fresh Level-1 gate closed** | `handoffs/BETA360_BROWSER_QA.md`; focused 16/16; release 15/15; parity 5/5; verifier 24/0/0/1; Browser 23/23 |
| PM/CTO adjudication | **BUILD READY FOR FOUNDER TEST** | `handoffs/BETA360_COMPLETE.md` |
| Step 6B technical release enforcement | **PASS WITH ACTION** | `handoffs/STEP6B_AUDIT.md`, `handoffs/STEP6B_COMPLETE.md`, `handoffs/STEP6B_REVIEW.md`, `handoffs/STEP6B_EXTERNAL_CONTROLS.md` |
| Step 7 three-artifact parity gate | **PASS** | Feature commit `31ffd6f`; Step 7 lifecycle handoffs |
| Step 8 command-center durability integration | **PASS** | Reviewed/QA-tested local HEAD `04227af`; Step 8 lifecycle handoffs |

## Founder decisions required

No Founder input is required while Build 364 is being investigated, implemented, reviewed, and QA
tested. The Founder is not required to manage branches, files, prompts, reports, or routine QA. The
next Founder action will be the subjective physical-device retest only after the command center has
adjudicated an exact candidate ready. A later production release still requires explicit
Founder/Release-Manager acceptance and a deliberate account-level action on the GitHub freeze; that
is not part of this sprint.

## Release status

**BUILD 364 BLOCKER STRIKE IN PROGRESS — DO NOT SHIP — PRODUCTION FROZEN**

Automated QA does not authorize production. The next technical workflow after Founder acceptance is
a separate Release Manager candidate/manifest/lock/gate/fingerprint process.
