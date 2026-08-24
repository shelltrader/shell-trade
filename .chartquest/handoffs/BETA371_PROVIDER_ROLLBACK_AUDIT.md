# Build 371 — Provider, Attribution, and Rollback Audit

**Date:** 2026-08-24
**Status:** **SCOPED PROVIDER/ROLLBACK PASS — PRODUCTION MIGRATION AND RELEASE GATES HELD**

This is a read-only provider audit except for the deliberately generated, pseudonymous Preview QA
telemetry described below. No provider setting, Access policy, Git ref, production database row,
deployment, release lock, manifest, tester cohort, or production route was changed.

## Pages environment bindings and variables

Cloudflare Pages project `chartquest` was inspected in both environment scopes.

| Scope | Binding / variable | Verified value or state |
|---|---|---|
| Preview | `APP_DB` | `chartquest-app-preview-b369` (`038efb97-a6b5-457b-8681-7d71e31f826c`) |
| Preview | `BETA_DB` | `chartquest-preview` (`d2f3e508-7f2c-400e-9522-d89c38545e9e`) |
| Production | `APP_DB` | `chartquest-app-production` (`3aaff255-24e1-4db4-9eb0-b9f5842c6f2a`) |
| Production | `BETA_DB` | `chartquest-production` (`32beddd4-94b6-433d-9c20-4f3391554488`) |
| Both | Required secrets | `APP_AUTH_PEPPER`, `APP_RATE_SALT`, and `BETA_RATE_SALT` exist as encrypted values; values were not revealed |
| Both | Access issuer | `https://bold-fire-efec.cloudflareaccess.com` |
| Both | Access audience | `f473dab032e3be82d99d41d590105fce3827dacb0cce2a17c2e5867a0920b2d0` |

`APP_FINNHUB_KEY` is optional in the current server contract and was not present in the inspected
Pages variable list. The exact Build-371 Preview survey receipt and attributed event writes also
functionally confirm the Preview `BETA_DB` and `BETA_RATE_SALT` path.

## Access control

- Application: `ChartQuest Founder Dashboard`, application id
  `742416b6-ab62-4e94-853b-9770b54a2f9c`.
- Protected destination: `playchartquest.com/founder/*`.
- Audience tag exactly matches the Pages `CF_ACCESS_AUD` value above.
- The Zero Trust team name `bold-fire-efec` matches the configured issuer host.
- Exactly one attached policy was visible: `ChartQuest Founder Account Only`, id
  `c12a9aca-e314-43f4-b6fa-4072f013d755`, action `Allow`, one rule selecting
  `Cloudflare Account Member`. No Everyone or Bypass policy was attached.
- Unauthenticated Preview Founder API access separately returned HTTP 403.

This proves coherent fail-closed configuration, not an authenticated Founder session. The allow
rule is account-member scoped rather than an individually named identity. Founder allow,
dashboard/cohort/research rendering, and export remain required live checks with a valid JWT.

## Controlled Preview invite attribution

A single internal-only attribution pair was reserved and exercised; no tester received a link:

- cohort: `b371-beta100`
- invite: `i-M2B7D9K2Z9W6T7K8`
- exact host: the byte-verified Build-371 branch alias

The browser removed only the two attribution parameters from the address bar. A normal visible
`Play Free` action and an exact `/game` load were then allowed to flush. A read-only query filtered
only to that pair returned four Preview `beta_events` rows for one pseudonymous player/session:
`play_clicked` plus three `session_end` rows. The exact `/game` row carries `build = 371`; every row
carries the exact cohort and invite. No crash row was returned.

The browser profile already had earlier QA history and its player id was not `QA-` prefixed. These
rows are retained, not deleted. This is a scoped pass for served client capture, URL stripping,
Functions validation, and D1 persistence. It is not evidence of fresh-player entry-cohort freezing
or the Access-private Founder cohort/dashboard view; those remain in the release matrix.

## Production schema boundary

Read-only schema inspection found:

- Production `BETA_DB.beta_surveys` has the original 13 columns through `ingest_source`. It does
  **not** yet have `experience_level` or `purchase_intent_19`.
- Therefore `cloudflare/migrations/0003_beta_survey_research.sql` must be applied exactly once to
  the verified Production `BETA_DB`, after an authorized recovery bookmark/count/schema record and
  before deploying Build-371 Functions to production. It was not applied during this audit.
- Production `APP_DB` reports 33 non-`sqlite_%` tables, 20 indexes, and 8 triggers. One table is the
  Cloudflare internal `_cf_KV`; the remaining 32 application table names match
  `cloudflare/migrations/0002_app.sql`.

The APP inventory is structural evidence only. It does not prove every constraint/SQL byte, current
row reconciliation, account restoration, or the incomplete Supabase history migration.

## Exact rollback target

- Known-good tag and commit: `v2026.08.14-build367` /
  `8c858aabd27aa0c4032fef9599d958735d959283`.
- Current Production Pages deployment:
  `38d166bd-2aa2-4fd3-8aa9-8d1423f39220`, successful on 2026-08-14.
- Direct retained deployment host: `38d166bd.chartquest.pages.dev`.
- Served direct `/game` SHA-256:
  `1d97b90627bac3af5b5f430f5505d4ba2d98f22335717b83ce666fb90a7af2e9`,
  exactly matching tagged Build 367.
- Served direct `sw.js`: `chartquest-site-v14`.
- The Cloudflare account exposes `Rollback to this deployment` for historical Production
  deployments. Build 367 is still the current Production deployment, so its own menu correctly
  shows retry/delete rather than rollback. After a later authorized promotion, verify that this
  exact deployment appears as a historical rollback target before links are sent.

### Emergency procedure after an authorized Build-371 deployment

1. Trigger: served fingerprint mismatch, critical live smoke failure, or Founder release abort.
2. Owner: Release Manager only.
3. In Pages project `chartquest`, select deployment
   `38d166bd-2aa2-4fd3-8aa9-8d1423f39220` and choose `Rollback to this deployment`.
4. Verify Production `/game` twice at the hash above and confirm `chartquest-site-v14` plus the
   Build-367 metadata/runtime asset set.
5. Leave additive Q6/Q7 columns and all D1 rows in place. Do not use D1 Time Travel or drop columns
   after new survey writes.
6. If a release also enables new Cloudflare-only account/data writes, a static host rollback alone
   is insufficient. Use a forward fix or an explicitly reconciled account/data plan; do not strand
   new accounts or claim Supabase history is complete.

## Decision

Provider names, environment scopes, required secret presence, Access issuer/audience coherence,
the scoped invite write path, and the exact static rollback target are verified. Release controls
remain intentionally unrun. Production migration `0003`, authenticated Founder views/export,
fresh-entry cohort display, the remaining physical/opposite-terminal/returning-worker matrix, exact
account-data reconciliation, manifest/lock, final authorization, `main`, production, and two served
fingerprints remain hard gates.
