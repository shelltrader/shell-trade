# Build 369 Cloudflare-only local candidate

## Status

**LOCAL ENGINEERING CANDIDATE APPROVED — DO NOT DEPLOY — BUILD 367 REMAINS LIVE.**

Build 369 implements the complete Cloudflare runtime, auditable historical migration, private
Founder dashboard, and deterministic improvement-insight engine requested by the Founder. It is not
evidence that historical Supabase rows have been recovered or that Build 369 is serving.

## Founder decision

The Founder requested that ChartQuest move all hosting/data operations to Cloudflare, preserve
existing beta player and survey data, provide one private dashboard, and retire Supabase after the
migration. The Founder also authorized Cloudflare setup. This decision does not authorize deleting
the historical provider before export/reconciliation and does not waive release controls.

## Exact local candidate

- Branch: `codex/cloudflare-only-beta`
- Payload commit: `df0053c05506d6691b6545d96be6202dc685f1b6`
- Build: 369
- Game source/root/site SHA-256:
  `201682c415cb673e2ef24e524319dc5e5c194b94f039861200cf686e8ef0c702`
- CQOPS parent stamp: `47cb1b866f` at `2026-08-23T10:35:13Z`
- APP_DB schema SHA-256:
  `3e874ca978dab0ad9ef411673a8838936048f3af9195ea414f0a151391b79b74`
- Browser adapter SHA-256:
  `233d11547bad0a5548d71bc5168ec6589c8fdb5e0d94fd75e782e5a0f0dff904`
- Tracker SHA-256:
  `4ecca5af23ebaf0c78d8a3d0ea5913ce814113214504e122cf3864fa22d8bb80`
- Earliest-crash capture SHA-256:
  `2888116a550c6f14e8c65819e0af6329077fc4d32a466247f4b2d31b7ffa7465`
- Founder API SHA-256:
  `0ff2a1370f6269fa99119a0759299a7af4789e4e3eb4cf4a8f14422439c9f46b`
- Founder app model SHA-256:
  `85b9c09a43a69bfd893788a75c7ee7c02ab9b41029dbe0cdabb2f58d65967991`

## Implemented

- All production browser data paths use same-origin Cloudflare services: telemetry/surveys,
  account/session/claim, profile, Journal, notes, streak, mastery, bugs, visits, content, and market
  lookup. No Supabase SDK, URL, key, fallback write, or direct browser market host remains in the
  published runtime.
- Player-device saves remain authoritative and keep their established keys. New data writes are
  account-scoped, durable-before-send, versioned where conflicts matter, and acknowledged only by an
  exact operation/id/count receipt.
- APP_DB provides password/session protection, one-time imported-account claims, monotonic profile
  and streak updates, pinned paged Journal reads, explicit deletions, mastery normalization and
  quarantine, idempotent public writes, and content logical-key conflict detection.
- The offline importer refuses partial/wrong-project exports, preserves source UUIDs/timestamps,
  quarantines ambiguity, generates retry-safe split D1 imports and drift-safe rollback, and refuses
  to mark a migration reconciled until independently exported D1 rows and audit evidence match.
- `/founder/beta` is the intended private Founder dashboard. It covers all beta/application
  datasets, masks email/journal details by default, provides protected JSON/CSV exports, and renders
  an evidence-based Insights & Next Steps report. APP_DB uses one coherent bounded snapshot; beta
  events/surveys use separately validated keyset pages and are not atomic with APP_DB. Access/feed/
  snapshot failures are visible instead of rendering false zeroes. A formal cohort report must use
  protected BETA_DB and APP_DB exports captured at one recorded cutoff.
- Cloudflare Pages Functions routing explicitly invokes `/api/beta-ingest`, `/api/app/*`, `/founder`,
  and `/founder/*`.

## Local evidence

| Gate | Result |
|---|---|
| Cloudflare application plane | 31/31 PASS |
| Browser cloud-data adapter | 22/22 PASS |
| Historical importer/reconciler | 27/27 PASS |
| Beta service/Access/D1 contracts | 23/23 PASS |
| Beta browser client | 7/7 PASS |
| Content queue handoff | 3/3 PASS |
| Game cutover and mirrors | 7/7 PASS |
| Additive save-key gate | 4/4 PASS |
| Founder all-data dashboard | 7/7 PASS |
| Founder beta dashboard | 5/5 PASS |
| Full verifier | 26 pass / 0 fail / 0 warn / 1 optional Puppeteer skip |

Independent review approved the exact payload after the final `/api/app/*` route defect was fixed.
The staged secret audit found no private key, service credential, or high-confidence token.

## External state

- **Independently verified from the public site on 2026-08-23:** `https://playchartquest.com/game`
  serves Build 367 with served `cq-build=5416a60174`.
- **Release-Manager-observed in the signed-in Cloudflare dashboard on 2026-08-23; not independently
  reproduced by repository tests:** Pages project `chartquest` connected to GitHub `main`, output
  `website/`; BETA databases `chartquest-production` and `chartquest-preview`; APP databases
  `chartquest-app-production` and `chartquest-app-preview`; production/preview bindings; encrypted
  rate/auth secret names; Founder Access app/policy and issuer/audience settings for
  `playchartquest.com/founder/*`.
- The final APP schema has not been applied/verified remotely. The observed empty preview APP
  database was created with a superseded schema and must be replaced or explicitly migrated before
  preview QA.
- Independently verified from Git: no Build-369 branch has been pushed. This task ran no provider
  import or source deletion; live row counts require provider/export verification.

## Historical-data blocker

The historical Supabase project is `ymxppzhczvmiuoncuqqu`. Build 367 is instrumented to send beta
events/surveys there. Local source credentials are unavailable and public credentials cannot read the
protected tables. **Release-Manager-observed external state on 2026-08-23:** the support flow showed
identity verification and a reply was sent in case `SU-452541` requesting restored read-only project
access or a complete secure export, with urgent priority on `public.beta_events` and
`public.beta_surveys` and an instruction not to modify, prune, pause, reset, or delete data. Provider
receipt/processing beyond the visible sent-message state is unverified.

Current source row presence/count is unverified. No recent tester event, survey answer, account, or
save row has been retrieved by this task. Therefore no
real-cohort product conclusion or claim of successful migration is permitted. The dashboard's report
engine is ready, but its real report must wait for reconciled data.

## Next actions

1. Receive the source-generated complete Supabase export and completeness proof.
2. Build and review the offline import bundle; resolve every blocking quarantine item.
3. Replace the empty superseded preview APP database, apply exact schemas, and push only the feature
   branch for a Cloudflare preview.
4. Run full preview account/save/survey/dashboard/Access/export/old-service-worker/rollback smoke.
5. Apply the historical imports, independently export both D1 databases, reconcile exact business
   and audit evidence, then issue and test one-time account claims.
6. Capture protected BETA_DB and APP_DB exports at one recorded analysis cutoff, generate the
   Founder product-improvement report, and manually review every conclusion against those fixed
   counts and survey responses.
7. Prepare the normal release manifest, lock, gate, rollback record, and served-fingerprint proof;
   deploy Build 369 only after all gates pass.
8. Retire/delete Supabase only under a later explicit destructive closeout after encrypted export,
   Cloudflare parity, player restoration, rollback evidence, and Founder approval are durable.
