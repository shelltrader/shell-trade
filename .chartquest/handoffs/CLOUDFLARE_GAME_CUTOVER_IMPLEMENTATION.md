# Build 369 Cloudflare-only Game Client Cutover

## Status

**LOCAL IMPLEMENTATION AND REGRESSION VERIFICATION PASS — DO NOT DEPLOY — LIVE CLOUDFLARE CONFIGURATION, HISTORICAL IMPORT, AND SERVED-SITE SMOKE REMAIN SEPARATE RELEASE-MANAGER GATES.**

No production database row, player account, remote ref, deployment, or served website was changed
during the code implementation. Separately, the Release Manager reported observing Cloudflare
database/binding/secret-name/Access resource shells in the signed-in dashboard on 2026-08-23; this
external state was not independently reproduced by repository tests. No historical import ran and
this work issued no Supabase deletion.

## Exact local identity

- Build: **369**
- Exact runtime/tooling payload commit:
  `df0053c05506d6691b6545d96be6202dc685f1b6`
- `chart-quest.html`, `index.html`, `website/game.html`:
  `201682c415cb673e2ef24e524319dc5e5c194b94f039861200cf686e8ef0c702`
- Cloudflare browser adapter, `website/assets/cq-cloud-data.js`:
  `233d11547bad0a5548d71bc5168ec6589c8fdb5e0d94fd75e782e5a0f0dff904`
- Canonical tracker, `website/assets/cq-track.js`:
  `4ecca5af23ebaf0c78d8a3d0ea5913ce814113214504e122cf3864fa22d8bb80`
- Earliest-crash source, `website/assets/cq-boot-crash.js`:
  `2888116a550c6f14e8c65819e0af6329077fc4d32a466247f4b2d31b7ffa7465`
- APP_DB schema:
  `3e874ca978dab0ad9ef411673a8838936048f3af9195ea414f0a151391b79b74`

Any later byte change requires proportional reruns and new fingerprints.

## Implemented client boundary

- Replaced the production Supabase SDK and direct browser database/market-provider calls with the
  same-origin `CQCloudData` adapter.
- Account creation, sign-in, session check, exact-receipt sign-out, and imported-account restoration
  now use secure same-site cookies, CSRF protection, and a single-use claim code. The claim code is
  kept in memory and removed from the address bar immediately.
- A new account performs the server's distinct pristine-only `profile.bootstrap` operation. Normal
  profile and streak writes use account-scoped expected versions and cannot silently regress state.
- Journal reads consume every page at one pinned version. Writes are versioned changes: upserts plus
  explicit trade/note delete IDs. Omission never means deletion. The client retains each pulled
  wrapper's remote ID while exposing the unchanged legacy object to gameplay, so synthesized import
  IDs are not re-keyed or tombstoned on the next save.
- Profile, Journal, note, streak, mastery, bug, visit, content-event, quote, and candle requests all
  use the same-origin Cloudflare surface. Failed reads leave device state untouched. Writes are
  durable before send and never produce success UI without the exact receipt.
- The established `cq_pid`, `cq_player_v1`, `shellTradeJournal_v1`, `shellTradeNotes_v1`,
  `shellTradeDaily_v1`, `cq_mastery_v1`, `cq_content_queue_v1`, and `cq_bt_pending` keys retain their
  names and meanings. The adapter adds only its own queue/version metadata keys.
- Beta tracking and earliest-crash delivery now use `/api/beta-ingest` only. No fallback provider,
  browser database key, or silent pending-row truncation remains in that production path.
- Browser CSP no longer allows the previous database SDK/API or direct market hosts. Service-worker
  cache v16 bypasses all API/founder responses and versions the Cloudflare adapter, tracker, and
  earliest-crash source.
- Privacy and Terms now describe Cloudflare storage, hashed passwords, secure sessions, one-time
  restoration, server-side market lookup, and the temporary read-only historical migration archive.

## Canonical/generated files

- Canonical game: `chart-quest.html`
- Generated game mirrors: `index.html`, `website/game.html`
- Canonical integration sources: `ops/cq-ops.js`, `website/assets/cq-track.js`,
  `website/assets/cq-cloud-data.js`, `website/assets/cq-boot-crash.js`
- Sync tools: `scripts/sync_cloud_data.py`, `scripts/sync_boot_crash.py` plus the existing
  `scripts/sync_ops.py`, `scripts/sync_track.py`, and `scripts/cq.sh`
- Served entry/version surfaces: `website/index.html`, `website/play.html`, `website/survey.html`,
  `website/bosses.html`, `website/courses.html`, `website/sw.js`
- Security/legal/QA: `_headers`, `website/_headers`, `netlify.toml`, `website/privacy.html`,
  `website/terms.html`, `scripts/beta360_qa_server.py`, `scripts/serve_mobile_preview.py`,
  `scripts/cloudflare_client.test.js`, `scripts/cloudflare_game_content.test.js`,
  `scripts/cloudflare_game_cutover.test.js`, `scripts/cloudflare_save_key_gate.js`,
  `scripts/cloudflare_save_key_gate.test.js`, `scripts/verify.js`

The APP_DB handlers/schema/adapter tests and founder dashboard were implemented by their parallel
owners and are recorded here only as the verified contract integrated by the game client. Offline
Supabase export/import/reconciliation tools were not modified by this client task.

## Automated evidence

| Check | Result |
|---|---|
| APP_DB application-plane contracts | **PASS — 31/31** |
| Cloud-data adapter contracts | **PASS — 22/22** |
| Beta ingest/D1/Access/export contracts | **PASS — 23/23** |
| Same-origin analytics/queue/SW contracts | **PASS — 7/7** |
| Legacy content handoff/no-loss contracts | **PASS — 3/3** |
| Game cutover/mirror/CSP contracts | **PASS — 7/7** |
| Narrow additive save-key gate contracts | **PASS — 4/4** |
| Founder beta dashboard contracts | **PASS — 5/5** |
| Founder all-data dashboard contracts | **PASS — 7/7** |
| QA-server and mobile-preview self-tests | **PASS** |
| Canonical adapter/ops/tracker/boot sync checks | **PASS** |
| Game syntax and three-artifact byte parity | **PASS** |
| Full verifier | **PASS — 26 pass, 0 fail, 0 warn, 1 Puppeteer skip** |

Gate 10 contains a narrow Build 369 exception for exactly the two adapter-owned durable
queue/version metadata keys. Its focused tests prove that a third addition, a missing build/adapter
marker, or removal/rename of any established key fails; no broad protected-system override is
needed. Puppeteer is not installed, so the optional generic headless-boot check was skipped;
syntax, deterministic QA self-tests, and all focused runtime-contract suites passed.

## Remaining external/release gates

1. Release-Manager dashboard observation reports Cloudflare database resources, Pages bindings,
   required secret names, and the deny-by-default Founder Access application. Independently reverify
   them, apply and verify the exact final APP schema above in fresh preview and production databases,
   verify the beta schema, and run live route/Access smoke tests. The observed empty preview APP
   database contains a superseded schema and must not be treated as proof.
2. Obtain a complete authenticated Supabase export, run the offline importer/reconciliation proof,
   and issue one-time account claims. Historical source data must remain untouched until that proof
   passes.
3. Prepare a uniquely identified release candidate through the repository release-control process.
4. After an explicitly authorized deployment, verify the served Build 369 fingerprint and run live
   account create/sign-in/restore, offline retry, profile/Journal/streak/mastery, survey, dashboard,
   denied Access, market fallback, returning-service-worker, and rollback smoke tests.

Until those external gates pass, this is a verified local implementation, not evidence that the
Cloudflare-only application plane is configured or serving in production.
