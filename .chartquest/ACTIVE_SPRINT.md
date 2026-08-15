# Active Sprint

**Control-plane rule:** this file does not revive historical tasks as active work.

## Sprint objective

Move new beta funnel events and surveys to a fresh Cloudflare D1 dataset, retain Supabase safely for
accounts/cloud saves/history/fallback, and give the Founder one private dashboard for all new
Cloudflare beta data. Preserve the serving Build 367 game until the provider configuration and live
cutover evidence pass.

## Current release/build

- Isolated candidate branch: `codex/cloudflare-only-beta`.
- Exact runtime payload commit: `b8f671adf4982bb2997a4bf2f5d02207b19cfe68`.
- Build: **368**.
- Source, root mirror, and website game artifact are byte-identical at SHA-256
  `4e11d01d9b5b5bc662ce153e880ce1466de529f77cef40152bbd525fb4e2b5ca`.
- Browser bridge SHA-256:
  `cf9c0cadc8b3cd7c45d4a411c475ba789893d5a8e0712e177fc39b352addd7c0`.
- Production Build 367 remains live and unaffected. Build 368 has not been pushed or deployed.

## Active tasks

| Task | Owner | State | Next action |
|---|---|---|---|
| Cloudflare D1 + Pages binding | Release Manager | **PENDING EXTERNAL SETUP** | Create/migrate fresh D1 and bind `BETA_DB`. |
| Founder Access policy | Release Manager | **PENDING EXTERNAL SETUP** | Set issuer/audience and exact deny-by-default `/founder` policy. |
| Live Build-368 cutover smoke | Release Manager + Founder | **BLOCKED ON SETUP** | Prove empty baseline, write/read/export, upgrade privacy, returning player, and rollback. |

## Blocked tasks

| Item | Status | Evidence |
|---|---|---|
| Build 368 deployment | **DO NOT DEPLOY** | D1, binding, secrets, Access application/policy, empty-cutover proof, live smoke, and release manifest/lock/gate are not complete. |
| Historical beta visibility | Pending later Supabase import | The new dashboard reads Cloudflare D1 only. Existing Supabase rows remain untouched and are not yet displayed. |
| Full Supabase retirement | Out of scope | Accounts/cloud saves and history still require Supabase; removing them needs a separate identity/data migration. |

## Completed tasks

| Task | Result | Evidence |
|---|---|---|
| Build-368 analytics/dashboard investigation | **PASS — safe additive boundary defined** | `handoffs/BETA368_INVESTIGATION.md` |
| Build-368 implementation and independent review | **APPROVED LOCALLY** | Runtime commit `b8f671a`; `handoffs/BETA368_IMPLEMENTATION.md`; `handoffs/BETA368_REVIEW.md` |
| Build-368 exact-byte QA and Browser matrix | **PASS FOR LOCAL ENGINEERING CANDIDATE** | `handoffs/BETA368_QA.md`; contracts 23/23 + 7/7 + 5/5; verifier 26/0/0/1; Browser 37/37 and repeat 74/74 |
| Build-368 PM/CTO adjudication | **LOCAL CANDIDATE APPROVED; RELEASE HELD** | `handoffs/BETA368_COMPLETE.md` |
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

No product-design decision is required. The next Founder action is a single Cloudflare sign-in when
provider setup is ready, followed by dashboard access and the live cutover smoke. The Founder is not
required to recover Supabase access for the new post-cutover dashboard.

## Release status

**BUILD 368 LOCAL ENGINEERING CANDIDATE APPROVED — DO NOT DEPLOY — CLOUDFLARE D1/ACCESS CONFIGURATION AND LIVE SMOKE PENDING — BUILD 367 REMAINS LIVE**

Automated QA does not authorize production. Configure and verify Cloudflare first, then use the
normal Release Manager manifest/lock/gate/fingerprint process for a separately authorized deploy.
