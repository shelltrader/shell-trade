# Active Sprint

**Control-plane rule:** this file does not revive historical tasks as active work.

## Sprint objective

**ACHIEVED:** advance the build-360 candidate through autonomous investigation, implementation,
independent review, Browser QA, and PM/CTO adjudication to an exact build-362 candidate that is
**BUILD READY FOR FOUNDER TEST**. Production remains frozen and no deployment is in scope.

## Current release/build

- Isolated candidate branch: `codex/beta-360-readiness`.
- Exact candidate payload commit: `3ef4bf6e30d8a75ba21abf2df8ebede74e9d02a1`.
- Build: **362**.
- Source, root mirror, and website game artifact are byte-identical at SHA-256
  `d36bb51ffaf30bdbc597c496868e54b41697473612a68448627380cd8fcce04b`.
- Browser bridge SHA-256:
  `52fa4b7bac5ca38877ef14dde689fa259529b8154c132d680a7f844b762482cf`.
- Production was last observed presenting build 359; exact served-response SHA-256 remains unverified.
- Candidate is not authorized for push, merge, deployment, or production testing.

## Active tasks

| Task | Owner | State | Next action |
|---|---|---|---|
| Founder subjective/device test | Founder | **READY** | Play the exact local build-362 candidate and report only gameplay feel/readability or acceptance. The command center owns all technical coordination. |

## Blocked tasks

| Item | Status | Evidence |
|---|---|---|
| Production release | **DO NOT SHIP / production frozen** | The active GitHub ruleset blocks `main` updates. Push, merge, deployment, freeze changes, and provider actions are outside this readiness sprint. |
| Served artifact identity | Blocked until release workflow | Production presents build 359, while exact served-response SHA-256 and fresh-cache verification belong to a separately authorized release operation. |
| Online survey submission and physical-device behavior | Founder/release follow-up | The local harness intentionally denied external connections. Physical Safari safe areas, touch/DPR/audio/performance, and successful online telemetry remain device/production checks. |

## Completed tasks

| Task | Result | Evidence |
|---|---|---|
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

Founder input is now required only for subjective gameplay/device acceptance of the local build-362
candidate. The Founder is not required to manage branches, files, agents, prompts, reports, or
routine QA. A later production release still requires explicit Founder/Release-Manager acceptance
and a deliberate account-level action on the GitHub freeze; that is not part of this sprint.

## Release status

**BUILD READY FOR FOUNDER TEST — DO NOT SHIP — PRODUCTION FROZEN**

Automated QA does not authorize production. The next technical workflow after Founder acceptance is
a separate Release Manager candidate/manifest/lock/gate/fingerprint process.
