# Active Sprint

**Control-plane rule:** this file does not revive historical tasks as active work.

## Sprint objective

**PASS:** close the final two Founder-confirmed send blockers from the physical Build 364 retest:
(1) a breakable box may not survive in/beyond a trade-portal corridor, and (2) replay/recap must
visibly show Finn cross the correct take-profit or stop-loss line. Include the bounded Founder
polish requests for a warmer first-trade score and premium centered feedback, then advance exact
Build 365 through review, exact-byte Browser QA, and PM/CTO adjudication. Production remains frozen.

## Current release/build

- Isolated candidate branch: `codex/beta-360-readiness`.
- Exact candidate payload commit: `7b3679c6497d8d4e9bfd8cdac3754489aaa9c4f7`.
- Build: **365**.
- Source, root mirror, and website game artifact are byte-identical at SHA-256
  `f80cecb3a4ed343ae21fa491b71cda46e2485176b56019a8484b11b490352879`.
- Browser bridge SHA-256:
  `114d91e611a125d6e6ebadb80029deae04357db1f960abed05b27103b4614937`.
- Production was last observed presenting build 359; exact served-response SHA-256 remains unverified.
- Candidate is not authorized for push, merge, deployment, or production testing.

## Active tasks

| Task | Owner | State | Next action |
|---|---|---|---|
| Founder final physical Build-365 retest | Founder | **READY** | Judge the reward-free trade-portal corridor, visible TP/SL replay crossing, warmer first-trade score, and premium centered feedback on the intended phone. |

## Blocked tasks

| Item | Status | Evidence |
|---|---|---|
| Production release | **DO NOT SHIP / production frozen** | The active GitHub ruleset blocks `main` updates. Push, merge, deployment, freeze changes, and provider actions are outside this readiness sprint. |
| Served artifact identity | Blocked until release workflow | Production presents build 359, while exact served-response SHA-256 and fresh-cache verification belong to a separately authorized release operation. |
| Online survey submission and physical-device behavior | Founder/release follow-up | The local harness intentionally denied external connections. Physical Safari notch/address-bar behavior, touch feel, audio/haptics, sustained performance/heat, and successful online telemetry remain device/production checks. |

## Completed tasks

| Task | Result | Evidence |
|---|---|---|
| Build-365 final-send investigation | **PASS — four root causes confirmed** | `handoffs/BETA365_INVESTIGATION.md` |
| Build-365 implementation and PM/CTO review | **APPROVED** | Candidate commit `7b3679c`; `handoffs/BETA365_IMPLEMENTATION.md`; `handoffs/BETA365_REVIEW.md` |
| Build-365 exact-byte QA and Browser matrix | **PASS FOR FOUNDER FINAL MOBILE RETEST** | `handoffs/BETA365_QA.md`; focused 24/24; release 15/15; parity 5/5; verifier 24/0/0/1; Browser 31/31 |
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
the exact accepted Build 365 candidate. A later production release still requires explicit
Founder/Release-Manager acceptance and a deliberate account-level action on the GitHub freeze; that
is not part of this sprint.

## Release status

**BUILD 365 READY FOR FOUNDER FINAL MOBILE RETEST — DO NOT SHIP — PRODUCTION FROZEN**

Automated QA does not authorize production. The next technical workflow after Founder acceptance is
a separate Release Manager candidate/manifest/lock/gate/fingerprint process.
