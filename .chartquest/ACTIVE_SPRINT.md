# Active Sprint

**Control-plane rule:** this file does not revive historical tasks as active work.

## Sprint objective

**PASS:** close the three Founder-confirmed cosmetic issues from the physical Build 365 retest:
current Gambler portraits in Journal/victory, a compact premium Journal mastery finale, and Finn's
signature necklace in the existing Gambler-defeat clip. Advance exact Build 366 through independent
review, exact-byte Browser QA, and PM/CTO adjudication. Production remains frozen.

## Current release/build

- Isolated candidate branch: `codex/beta-360-readiness`.
- Exact candidate payload commit: `19c443414bc4ebc74dfbc5b3ce7bafdd1c381765`.
- Build: **366**.
- Source, root mirror, and website game artifact are byte-identical at SHA-256
  `fdbf69803bd491b739c1ffc1ff8300b45871b38c265477b36eb89170bb67e7b0`.
- Browser bridge SHA-256:
  `477cd8b059c033e9bb46ee9066b13cb8f9d0d26215c869ce70dd386e3ee14cef`.
- Production was last observed presenting build 359; exact served-response SHA-256 remains unverified.
- Candidate is not authorized for push, merge, deployment, or production testing.

## Active tasks

| Task | Owner | State | Next action |
|---|---|---|---|
| Founder final cosmetic Build-366 retest | Founder | **READY** | Judge the current Gambler portraits, compact Journal mastery card, and necklace repair on the intended phone. |

## Blocked tasks

| Item | Status | Evidence |
|---|---|---|
| Production release | **DO NOT SHIP / production frozen** | The active GitHub ruleset blocks `main` updates. Push, merge, deployment, freeze changes, and provider actions are outside this readiness sprint. |
| Served artifact identity | Blocked until release workflow | Production presents build 359, while exact served-response SHA-256 and fresh-cache verification belong to a separately authorized release operation. |
| Online survey submission and physical-device behavior | Founder/release follow-up | The local harness intentionally denied external connections. Physical Safari notch/address-bar behavior, touch feel, audio/haptics, sustained performance/heat, and successful online telemetry remain device/production checks. |

## Completed tasks

| Task | Result | Evidence |
|---|---|---|
| Build-366 cosmetic investigation | **PASS — three presentation root causes confirmed** | `handoffs/BETA366_INVESTIGATION.md` |
| Build-366 implementation and independent review | **APPROVED** | Candidate commit `19c4434`; `handoffs/BETA366_IMPLEMENTATION.md`; `handoffs/BETA366_REVIEW.md` |
| Build-366 exact-byte QA and Browser matrix | **PASS FOR FOUNDER FINAL COSMETIC RETEST** | `handoffs/BETA366_QA.md`; focused 25/25; release 15/15; parity 5/5; verifier 24/0/0/1; Browser 34/34 |
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
the exact accepted Build 366 candidate. A later production release still requires explicit
Founder/Release-Manager acceptance and a deliberate account-level action on the GitHub freeze; that
is not part of this sprint.

## Release status

**BUILD 366 READY FOR FOUNDER FINAL COSMETIC RETEST — DO NOT SHIP — PRODUCTION FROZEN**

Automated QA does not authorize production. The next technical workflow after Founder acceptance is
a separate Release Manager candidate/manifest/lock/gate/fingerprint process.
