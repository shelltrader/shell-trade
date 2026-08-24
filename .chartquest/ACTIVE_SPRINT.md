# Active Sprint

**Control-plane rule:** this file does not revive historical tasks as active work.

## Sprint objective

Prepare the next closed-beta experiment from the recovered evidence: restore player-paced guided
trades without changing their price/outcome doctrine, improve the smallest confirmed teaching
surfaces, add two bounded research questions, and attribute the next cohort with private opaque
invites. Close the Founder-reported silent-startup defect without changing the soundtrack or game
rules. Preserve Build 367 in production until the Build-370/371/372 migration, preview, device,
release, and served-fingerprint gates all pass.

## Current release/build

- Isolated startup-audio repair branch: `codex/build372-music-startup`.
- Exact Build-372 runtime payload commit: `e3382414624ea571a28e2c887bbe8593545734cc`.
- Build: **372 local engineering candidate; production remains Build 367**.
- Build-372 source, root mirror, and website game artifact are byte-identical at SHA-256
  `64c157e311f5d2bffde5682a7acfc48ab1907daf95842ff6e3af8827ac0d7b90`.
- **Founder direction (2026-08-24):** music must be enabled on every normal startup. The local repair
  resets stale/default `cq_music` state to `on` on every ordinary document load, keeps explicit
  `?mute=1` as a per-document QA exception, and keeps manual mute effective only for the current
  document. Browser policy still requires a player tap/key before audible playback can begin.
- **Build-372 local evidence:** startup audio 10/10; pre-commit parent-diff verifier 28/0/0/1;
  post-commit exact-tree verifier 26/0/0/3 (Puppeteer plus build/protected diffs correctly N/A);
  inline syntax 11/11; release controls 15/15; CQSAFE 27/27; game cutover 7/7; trade pacing 13/13;
  teaching UI 5/5; survey 4/4; Boss1 media 5/5; `git diff --check` clean. Local in-app browser state
  checks passed ordinary load, manual off, reload-on, explicit-muted launch, later ordinary-on,
  first-gesture intro advance, and zero console errors. Independent read-only review found no P0–P2
  issue. This is not audible phone evidence.
- `website/sw.js` remains byte-unchanged at `chartquest-site-v17`; HTML navigation is not
  service-worker cached, so no worker bump is required for this game-document-only repair.
- Prior pacing candidate branch: `codex/beta370-player-paced-trades`.
- Exact prior Build-371 pacing-repair payload commit: `3019058b32c6acddc8fc5530569f24d95c76a98f`
  (the Build-370 experiment payload remains `08d3b3c930f86ca4894ff9c26c813f78b43fb040`).
- Prior Build-371 source, root mirror, and website game artifact are byte-identical at SHA-256
  `3224c603255ee5d1210295b31151f7de04ca6c3b2a211b158f14627b76a0ab09`.
- Additive survey migration SHA-256:
  `3283707ade48d84447cf003377613b897bb004d836b89a5175df082930032a4d`.
- **Preview-only migration pass (2026-08-24):** `0003` is applied to Preview `BETA_DB`
  `chartquest-preview` (`d2f3e508-7f2c-400e-9522-d89c38545e9e`) after a D1 recovery bookmark and
  pre-change survey aggregate. Both nullable checked columns now exist; the six historical rows and
  their aggregate are unchanged. See `handoffs/BETA370_PREVIEW_BETA_DB_MIGRATION.md`.
- **Historical failed Build-370 Preview (2026-08-24):** source `7bb0ed7` deployed as Pages
  deployment `c8c138b1-3e77-45a5-bc5a-094c8f6a83f2`; its served `/game` matched `b615adb1...` and
  exposed the no-input P&L blocker. It is superseded for current Preview testing, not production.
- **Build-371 repair (2026-08-24):** the served idle-advance root cause is fixed by an
  explicit one-action/one-boundary gate. Touching candles, abnormal movement spikes, guide close,
  background/resume, backtracking, anti-hop, no-overhang entry, manual Close, free roam, and Level 4+
  are covered by 13/13 pacing contracts. Independent re-review APPROVED; full verifier is 27/0/0/1.
  See `handoffs/BETA371_LOCAL_REPAIR_CANDIDATE.md`.
- **Build-371 Preview deployment (2026-08-24):** control source `f311dfa` deployed successfully as
  Pages deployment `1c56b4ee-a726-4116-8e4c-cc6450b6f7cd`. Deployment route and branch alias both
  serve the exact approved `/game` SHA-256 `3224c603...` (`2212400` bytes). At 390×844 the original
  Escape/no-input failure did not reproduce: `+0` held for 5.6 seconds, one action changed state once
  to `+1`, and another 5.6 seconds held at `+1`. Backtrack, manual Close/replay, free-roam return,
  automatic long TP, automatic short TP, Q1–Q7 receipt, guide ×/Escape, and Founder deny also passed.
  See `handoffs/BETA371_PREVIEW_QA.md`.
- **Build-371 provider/rollback audit (2026-08-24):** Preview and Production binding names/UUIDs,
  required encrypted-secret presence, Access issuer/audience coherence, controlled Preview invite
  persistence, and the exact Build-367 static rollback artifact passed. Production `BETA_DB` still
  lacks Q6/Q7, so authorized Production `0003` migration-before-Functions is a hard release gate.
  See `handoffs/BETA371_PROVIDER_ROLLBACK_AUDIT.md`.
- Production Build 367 remains live and unaffected. Build 371 has not been pushed to `main` or
  deployed to production.

## Active tasks

| Task | Owner | State | Next action |
|---|---|---|---|
| Build-372 startup music repair | Engineering + Founder | **VERIFIED LOCALLY — AUDIBLE PHONE/PREVIEW GATES OPEN** | On the exact candidate, perform a physical-phone audible listen from an ordinary load, reload after manual mute, explicit `?mute=1`, first pointer/key, intro handoff, Guardian audio, and true background/resume. Then repeat the inherited Build-371 Preview/release matrix; local UI state is not proof that a speaker produced sound. |
| Build-370 BETA_DB migration | Release Manager | **PASS — PREVIEW ONLY** | `0003` was applied once to the verified Preview `BETA_DB`; recovery bookmark, absent-before/present-after schema, constraints, and six-row aggregate are recorded in `handoffs/BETA370_PREVIEW_BETA_DB_MIGRATION.md`. Do not reapply it to Preview. Apply it exactly once to the verified Production `BETA_DB` only after release authorization plus a Production recovery bookmark/count/schema record, and before any production Functions that select or write Q6/Q7. |
| Build-372 Preview and phone QA | Release Manager + Founder | **LOCAL AUDIO REPAIR PASS; PRIOR BUILD-371 SERVED PACING P0 PASS; RELEASE MATRIX INCOMPLETE** | Prior Build-371 engineering Preview and controlled invite/D1 checks passed on deployment `1c56b4ee...`, but its game-document evidence does not prove Build 372. Byte-verify and test exact payload `e338241` on authorized Preview, including a physical-phone audible/true-background pass, then complete automatic SL/loss, Founder allow/dashboard/export plus fresh-entry cohort, returning v16→v17 worker, Production `0003`, and account/data rollback proof. |
| Next ten-person beta cohort | PM/CTO | **BLOCKED BY PREVIEW/DEVICE GATES** | Do not generate or share a cohort until the repaired candidate passes Preview and physical-device acceptance. After approval, generate one release-authorized cohort and ten unique consonant-digit invite codes. |
| Historical application-data migration | Release Manager | **SEPARATE PENDING WORK** | Preserve the existing audited Build-369 account/data migration gates; this Build-370 experiment does not weaken or bypass them. |

## Blocked tasks

| Item | Status | Evidence |
|---|---|---|
| Build 372 production deployment | **DO NOT DEPLOY** | Startup behavior is local-only and has no audible physical-phone or exact Preview proof. Production `BETA_DB` also lacks Q6/Q7 and the inherited physical-device/background, automatic-loss, Founder allow/export/fresh-entry cohort, returning-worker, account/data rollback, and release-control gates remain incomplete. No production manifest/lock/served fingerprint exists. |
| Next tester links | **DO NOT SEND YET** | The current public site still serves Build 367. Q1–Q7 is confirmed-write-receipt verified; controlled invite capture/persistence is separately token-filtered D1-query verified. A release-authorized cohort, fresh-entry Founder view, and physical acceptance have not occurred. |
| Full Cloudflare application migration | **SEPARATE RELEASE GATE** | Build 370 inherits the Build-369 local candidate but does not itself prove production APP_DB migration, account restoration, or historical application-data reconciliation. |

## Completed tasks

| Task | Result | Evidence |
|---|---|---|
| Build-372 music-on-every-start repair | **VERIFIED LOCALLY; RELEASE HELD** | Payload `e338241`; game artifacts `64c157e3...`; startup audio 10/10; parent-diff verifier 28/0/0/1 and post-commit exact-tree verifier 26/0/0/3; independent review found no P0–P2 issue; local browser state/reload/explicit-mute checks passed with zero console errors; audible phone, exact Preview, and inherited Build-371 release gates remain open |
| Build-371 exact Preview deployment and scoped browser QA | **SERVED PACING P0 PASS; RELEASE HELD** | Deployment `1c56b4ee-a726-4116-8e4c-cc6450b6f7cd`; `/game` `3224c603...`; Escape/idle/action/backtrack/manual/replay/free-roam, long TP, short TP, guide ×/Escape, Q1–Q7 receipt, and Founder deny passed; device/credential/opposite-terminal gates remain |
| Build-371 provider, attribution, and rollback audit | **SCOPED PASS; RELEASE HELD** | Preview/Production bindings and required secrets re-audited; Access issuer/audience coherent; controlled invite persisted in Preview D1; retained Build-367 deployment `/game` exactly matches `1d97b906...` and `sw.js` v14; Production `0003` and account/data rollback remain pending |
| Build-371 idle-gate repair and adversarial review | **APPROVED LOCALLY; RELEASE HELD** | Exact payload `3019058`; game artifacts `3224c603...`; verifier 27/0/0/1; trade 13/13; UI 5/5; independent final review APPROVE; exact Preview follow-up passed the scoped pacing P0 matrix |
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

No product-design decision is required before Preview. The Founder explicitly directed music on
every normal startup and previously selected player-controlled traversal instead of a trade clock,
with adjacent trade rules intact. The next Founder actions are a physical-phone audible startup/
background pass, physical-device trade-feel acceptance, and an authenticated Founder dashboard/
export pass on the exact Preview. Production migration and final release authorization remain later,
separate decisions.

## Release status

**BUILD 372 STARTUP MUSIC VERIFIED LOCALLY — DO NOT DEPLOY OR SEND LINKS — AUDIBLE PHONE/PREVIEW, PHYSICAL DEVICE, TRUE BACKGROUND/RETURNING WORKER, AUTOMATIC LOSS, AUTHENTICATED FOUNDER/EXPORT/FRESH-ENTRY COHORT, PRODUCTION `0003`, POST-PROMOTION ROLLBACK ACTION, ACCOUNT/DATA ROLLBACK, AND RELEASE CONTROLS REMAIN — BUILD 367 REMAINS LIVE**

Automated and scoped Preview QA do not authorize production, and prior Build-371 Preview evidence
does not prove the changed Build-372 game document. Migration `0003` is already present in Preview
and must not be reapplied there. Finish the exact-candidate phone/credential matrix, then apply
`0003` once to Production under the recorded recovery/authorization gate before Functions and use
the normal Release Manager manifest/lock/gate/fingerprint process. Historical/account migration
remains a separate no-loss gate.
