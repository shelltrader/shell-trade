# Active Sprint

**Control-plane rule:** this file does not revive historical tasks as active work.

## Sprint objective

Prepare the next closed-beta experiment from the recovered evidence: restore player-paced guided
trades without changing their price/outcome doctrine, improve the smallest confirmed teaching
surfaces, add two bounded research questions, and attribute the next cohort with private opaque
invites. Preserve Build 367 in production until the Build-370 migration, preview, device, release,
and served-fingerprint gates all pass.

## Current release/build

- Isolated candidate branch: `codex/beta370-player-paced-trades`.
- Exact Build-370 payload commit: `08d3b3c930f86ca4894ff9c26c813f78b43fb040`.
- Build: **370**.
- Source, root mirror, and website game artifact are byte-identical at SHA-256
  `b615adb1c06558b5409111384c406053dfb9dee802eda86d7000db8b2e63103d`.
- Additive survey migration SHA-256:
  `3283707ade48d84447cf003377613b897bb004d836b89a5175df082930032a4d`.
- **Preview-only migration pass (2026-08-24):** `0003` is applied to Preview `BETA_DB`
  `chartquest-preview` (`d2f3e508-7f2c-400e-9522-d89c38545e9e`) after a D1 recovery bookmark and
  pre-change survey aggregate. Both nullable checked columns now exist; the six historical rows and
  their aggregate are unchanged. See `handoffs/BETA370_PREVIEW_BETA_DB_MIGRATION.md`.
- Production Build 367 remains live and unaffected. Build 370 has not been pushed or deployed.

## Active tasks

| Task | Owner | State | Next action |
|---|---|---|---|
| Build-370 BETA_DB migration | Release Manager | **PASS — PREVIEW ONLY** | `0003` was applied once to the verified Preview `BETA_DB`; recovery bookmark, absent-before/present-after schema, constraints, and six-row aggregate are recorded in `handoffs/BETA370_PREVIEW_BETA_DB_MIGRATION.md`. Do not apply it again or to production. |
| Build-370 preview and phone QA | Release Manager + Founder | **LOCAL AUTOMATION/390PX VISUAL PASS; PREVIEW DEPLOYMENT PENDING** | Deploy the exact payload to Preview now that `0003` is verified; test player-paced long/short win/loss, pause/background/backtrack, survey v2 receipt, cohort dashboard, and returning service worker. Founder judges physical trade feel. |
| Next ten-person beta cohort | PM/CTO | **PENDING RELEASE APPROVAL** | After preview/device approval, generate one `b370-beta2` cohort and ten unique consonant-digit invite codes; share plain canonical links only after Build 370 is verified live. |
| Historical application-data migration | Release Manager | **SEPARATE PENDING WORK** | Preserve the existing audited Build-369 account/data migration gates; this Build-370 experiment does not weaken or bypass them. |

## Blocked tasks

| Item | Status | Evidence |
|---|---|---|
| Build 370 production deployment | **DO NOT DEPLOY** | `0003` is applied to Preview only; Preview code deployment and physical-device QA are incomplete, and no release manifest/lock/served fingerprint exists. |
| Next tester links | **DO NOT SEND YET** | The current public site still serves Build 367; invite attribution and Q6/Q7 exist only in the local candidate. |
| Full Cloudflare application migration | **SEPARATE RELEASE GATE** | Build 370 inherits the Build-369 local candidate but does not itself prove production APP_DB migration, account restoration, or historical application-data reconciliation. |

## Completed tasks

| Task | Result | Evidence |
|---|---|---|
| Build-370 player-paced trade and next-beta learning payload | **APPROVED LOCALLY; RELEASE HELD** | Exact payload `08d3b3c`; game artifacts `b615adb1...`; verifier 27/0/0/1; trade 11/11; UI 5/5; survey 4/4; beta service 26/26; client 15/15; Founder beta 8/8; independent final review APPROVE |
| Build-369 full Cloudflare application/data client | **APPROVED LOCALLY** | Payload `df0053c`; `handoffs/CLOUDFLARE_GAME_CUTOVER_IMPLEMENTATION.md`; app 31/31, adapter 22/22, cutover 7/7 |
| Build-369 auditable historical importer/reconciler | **APPROVED LOCALLY; REAL EXPORT PENDING** | `handoffs/CLOUDFLARE_MIGRATION_TOOLING.md`; importer 27/27 |
| Build-369 private all-data dashboard and insight engine | **APPROVED LOCALLY; REAL DATA PENDING** | Founder APP snapshot/analysis 7/7; separately validated beta feeds; private fields masked by default |
| Build-369 independent review and regression gate | **APPROVED** | Exact payload `df0053c`: verifier 26/0/0/1; unchanged importer: 27/27; current preview HEAD `4298217`: app 31/31 and verifier 24/0/0/3 (game-diff checks N/A plus optional Puppeteer skip) |
| Fresh Build-369 preview databases | **EMPTY SCHEMA PASS; PREVIEW ONLY** | Release-Manager verification on 2026-08-23: APP_DB 32 tables/8 triggers/20 indexes; BETA_DB 3 tables/2 triggers/9 indexes; both 0 FK violations/0 rows; preview bindings correct; production untouched |
| Build-369 core preview account smoke | **PASS; DISPOSABLE ROWS REMOVED** | Feature HEAD `4298217`; deployment `297c2141`; account HTTP 201 with expected identity/profile/session/receipt/outbox state; post-clean APP counts `0/0/0/0/0/0` and 0 FK violations |
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

No product-design decision is required before Preview. The Founder explicitly selected
player-controlled traversal instead of a trade clock and required every adjacent trade rule to stay
intact. The next Founder decision is subjective acceptance of physical-device trade feel after the
Release Manager has applied the migration and produced a safe Preview.

## Release status

**BUILD 370 LOCAL CANDIDATE APPROVED — DO NOT DEPLOY OR SEND LINKS — BETA_DB MIGRATION, PREVIEW/PHONE QA, RELEASE CONTROLS, AND LIVE FINGERPRINT PENDING — BUILD 367 REMAINS LIVE**

Automated QA does not authorize production. Apply `0003` before Functions, verify Cloudflare in
Preview and on a real phone, then use the normal Release Manager manifest/lock/gate/fingerprint
process. Historical/account migration remains a separate no-loss gate.
