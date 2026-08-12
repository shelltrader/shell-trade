# Active Sprint

**Control-plane rule:** this file does not revive historical tasks as active work.

## Sprint objective

**PASS:** close the three Founder-confirmed beta blockers found during the physical Build 363
mobile retest: (1) boxes and Lost Wisdom pages are visibly reachable but do not respond, (2) the
once-ever FIRST WIN presentation is below the product bar, and (3) the first real trade needs an
audible, higher-energy score plus a clearly legible roller-coaster price arc. Advance one exact
Build 364 candidate through implementation, regression review, rendered Browser QA, and PM/CTO
adjudication to **BUILD READY FOR FOUNDER MOBILE RETEST**. Production remains frozen and no deployment
is in scope.

## Current release/build

- Isolated candidate branch: `codex/beta-360-readiness`.
- Exact candidate payload commit: `45803665bce75df319b9b8a6dae5e8262f5d8f06`.
- Build: **364**.
- Source, root mirror, and website game artifact are byte-identical at SHA-256
  `ea4c7fdc958b8f502e2588377068813881e37d9e9450c6c45ce7edbddf109a52`.
- Browser bridge SHA-256:
  `228f70b79f1d8f062bbfaa59a3166ed3680856539fc455135a1109ce02cda940`.
- Production was last observed presenting build 359; exact served-response SHA-256 remains unverified.
- Candidate is not authorized for push, merge, deployment, or production testing.

## Active tasks

| Task | Owner | State | Next action |
|---|---|---|---|
| Founder physical Build-364 retest | Founder | **READY** | Judge the fixed box/page interaction, FIRST WIN presentation, dedicated first-trade music, and four-act price journey on the intended phone. |

## Blocked tasks

| Item | Status | Evidence |
|---|---|---|
| Production release | **DO NOT SHIP / production frozen** | The active GitHub ruleset blocks `main` updates. Push, merge, deployment, freeze changes, and provider actions are outside this readiness sprint. |
| Served artifact identity | Blocked until release workflow | Production presents build 359, while exact served-response SHA-256 and fresh-cache verification belong to a separately authorized release operation. |
| Online survey submission and physical-device behavior | Founder/release follow-up | The local harness intentionally denied external connections. Physical Safari notch/address-bar behavior, touch feel, audio/haptics, sustained performance/heat, and successful online telemetry remain device/production checks. |

## Completed tasks

| Task | Result | Evidence |
|---|---|---|
| Build-364 blocker investigation | **PASS — three root causes confirmed** | `handoffs/BETA364_INVESTIGATION.md` |
| Build-364 implementation | **PASS** | Candidate commit `4580366`; `handoffs/BETA364_IMPLEMENTATION.md` |
| Build-364 PM/CTO review | **APPROVED** | `handoffs/BETA364_REVIEW.md` |
| Build-364 exact-byte QA and Browser matrix | **PASS FOR FOUNDER MOBILE RETEST** | `handoffs/BETA364_QA.md`; focused 21/21; release 15/15; parity 5/5; verifier 24/0/0/1; Browser 28/28 |
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

No Founder engineering input is required. The Founder is not required to manage branches, files,
prompts, reports, or routine QA. The next Founder action is the subjective physical-device retest of
the exact accepted Build 364 candidate. A later production release still requires explicit
Founder/Release-Manager acceptance and a deliberate account-level action on the GitHub freeze; that
is not part of this sprint.

## Release status

**BUILD 364 READY FOR FOUNDER MOBILE RETEST — DO NOT SHIP — PRODUCTION FROZEN**

Automated QA does not authorize production. The next technical workflow after Founder acceptance is
a separate Release Manager candidate/manifest/lock/gate/fingerprint process.
