# Active Sprint

**Control-plane rule:** this file does not revive historical tasks as active work.

## Sprint objective

Recover the complete historical ChartQuest dataset from Supabase, import and reconcile it into
Cloudflare without deleting source or player-device data, cut every production game-data path over
to Cloudflare, and give the Founder one private dashboard with complete player/survey views and an
evidence-based improvement report. Preserve serving Build 367 until preview, import, and release
evidence prove Build 369 safe.

## Current release/build

- Isolated candidate branch: `codex/cloudflare-only-beta`.
- Exact runtime, migration-tooling, and dashboard payload commit:
  `df0053c05506d6691b6545d96be6202dc685f1b6`.
- D1 Studio compatibility follow-up:
  `1b8f4e53e42b3a91c9243f8ba7ee38a6dd120baa`.
- Cloudflare runtime compatibility and privacy-safe diagnostic follow-ups:
  `c0f0b5ab1714a69fd72cf9e631d1cadd7f3da3ab` and
  `42982171ecf8942a223ec83702ef92448ef00902`.
- Build: **369**.
- Source, root mirror, and website game artifact are byte-identical at SHA-256
  `201682c415cb673e2ef24e524319dc5e5c194b94f039861200cf686e8ef0c702`.
- Final APP_DB schema SHA-256:
  `8d2be65b0ccc207aed5a6bf04f7f982bfd2210ce7480283b8055459a2c121a07`.
- Production Build 367 remains live and unaffected. The Build-369 feature branch is pushed and its
  preview deployment `297c2141` succeeded; no Build-369 production deployment occurred.

## Active tasks

| Task | Owner | State | Next action |
|---|---|---|---|
| Complete Supabase source export | Supabase Support + Release Manager | **BLOCKED EXTERNALLY** | Release Manager observed the identity-verification flow and sent a complete read-only export request in case `SU-452541`; provider processing is unverified. Import nothing until approved source proof is present. |
| Final Cloudflare schema verification | Release Manager | **PREVIEW STRUCTURAL + CORE ACCOUNT PASS; PRODUCTION HELD** | Exact `0002_app.sql` was applied to fresh preview APP_DB `chartquest-app-preview-b369`; it has 32 app tables, 8 guards/triggers, 20 named indexes, zero FK violations, and zero rows after smoke cleanup. Preview BETA_DB has 3 tables, 2 guards/triggers, 9 named indexes, zero FK violations, and zero rows. Account creation, exact receipt, and session-row creation passed; the remaining routes/triggers and production proof stay gated. |
| Build-369 preview deployment and smoke | Release Manager | **CORE ACCOUNT-CREATION SMOKE PASS; FULL MATRIX PENDING** | Feature HEAD `4298217` is deployed in Preview. Continue Access allow/deny, sign-in/restore, profile bootstrap/Journal/streak/mastery, survey, dashboard/exports, old service worker, market, and rollback checks without changing production. |
| Historical import and reconciliation | Release Manager | **BLOCKED ON EXPORT** | Run offline attestation, apply idempotent split imports, export both D1 targets, compare counts/digests/quarantine, then mark reconciled. |
| Real-data product report | PM/CTO | **BLOCKED ON RECONCILED DATA** | Capture protected BETA_DB and APP_DB exports at one recorded analysis cutoff; use the dashboard insights plus a human report based only on that fixed landed evidence. |

## Blocked tasks

| Item | Status | Evidence |
|---|---|---|
| Build 369 production deployment | **DO NOT DEPLOY** | Source export/import reconciliation, production schema proof, preview/live smoke, release manifest/lock/gate, and rollback evidence are incomplete. |
| Historical tester and survey visibility | **BLOCKED ON SUPABASE EXPORT** | Build 367 is instrumented to send results to the historical project; current row presence/count is unverified. This work performed no source deletion, and no recent row is yet imported into Cloudflare. |
| Supabase retirement | **DESIGNED, NOT EXECUTED** | Build 369 has no production-runtime Supabase dependency, but the historical project must remain untouched until complete export, D1 reconciliation, account claims, and rollback evidence pass. |

## Completed tasks

| Task | Result | Evidence |
|---|---|---|
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

No product-design decision is required. The Founder has approved a complete Cloudflare migration
and one-login dashboard. The next external action belongs to Supabase Support: restore read-only
project access or deliver the complete export. If Support sends a secure download or recovery link,
the Release Manager must capture it without altering source rows and resume the audited import.

## Release status

**BUILD 369 PREVIEW CORE ACCOUNT SMOKE PASSED — DO NOT DEPLOY — SUPABASE SOURCE EXPORT, IMPORT RECONCILIATION, FULL PREVIEW/LIVE SMOKE, AND RELEASE CONTROLS PENDING — BUILD 367 REMAINS LIVE**

Automated QA does not authorize production. Preserve both providers until every historical row and
account is reconciled, verify Cloudflare in preview, then use the normal Release Manager
manifest/lock/gate/fingerprint process for the authorized production cutover.
