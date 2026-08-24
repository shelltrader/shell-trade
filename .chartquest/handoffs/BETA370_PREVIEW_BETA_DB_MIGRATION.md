# Build 370 — Preview BETA_DB Survey-Research Migration

**Date:** 2026-08-24

**Status:** **PASS — PREVIEW BETA_DB ONLY; PREVIEW CODE DEPLOYMENT AND QA PENDING**

## Candidate identity

- Control-plane starting HEAD: `9fa07961c5176b27b8338c4acdb1200499261b10`
- Runtime payload: `08d3b3c930f86ca4894ff9c26c813f78b43fb040`
- Migration: `cloudflare/migrations/0003_beta_survey_research.sql`
- Migration SHA-256: `3283707ade48d84447cf003377613b897bb004d836b89a5175df082930032a4d`

## Target verification

**VERIFIED — Preview Pages environment only:** the `chartquest` Pages project's Preview settings
bind `BETA_DB` to D1 database `chartquest-preview`
(`d2f3e508-7f2c-400e-9522-d89c38545e9e`). Its separate Production settings bind `BETA_DB` to
`chartquest-production`. No production database query, write, deployment, or configuration change
was made.

The Pages Preview deployment visible before this change was source commit `54666ab`; it is not the
Build-370 candidate. This migration does not deploy Functions or static assets.

## Recovery point and pre-migration evidence

**VERIFIED:** D1 Console recovery bookmark created before any schema change:

`00000009-00000000-000050d1-92c640d2d09871683383baa8c81ed7be`

**VERIFIED:** `PRAGMA table_info(beta_surveys)` listed 13 existing columns through
`ingest_source`; `experience_level` and `purchase_intent_19` were absent.

**VERIFIED:** the privacy-preserving pre-migration aggregate was:

| Metric | Value |
|---|---:|
| survey rows / distinct response IDs | 6 / 6 |
| Q1 total | 48 |
| Q2 / Q3 / Q4 / Q5 character totals | 238 / 362 / 42 / 203 |
| seconds total | 635 |

No survey answer text, player identifier, session identifier, or response identifier was retrieved.

## Execution and post-migration evidence

The dashboard Console flattens a pasted multi-line comment-prefixed SQL file into one comment. The
first full-file paste returned **“Requests without any query are not supported”**; the immediately
following schema inspection still showed both columns absent, so it made no database change.

The two approved `ALTER TABLE ... ADD COLUMN ... CHECK (...)` statements were then submitted once
each, in the file's authored order. Cloudflare returned **“This query successfully executed”** for
each. This is semantically the exact additive `0003` migration; only the dashboard's one-statement
console constraint required the two statement submissions.

**VERIFIED after execution:**

- `PRAGMA table_info(beta_surveys)` now lists nullable `experience_level` (cid 13) and nullable
  `purchase_intent_19` (cid 14), both with `notnull = 0` and no default.
- `sqlite_master` preserves the two approved vocabularies as `CHECK` constraints.
- The original aggregate is unchanged: `6 / 6`, `48`, `238 / 362 / 42 / 203`, and `635`.
- All six historical rows have `experience_level IS NULL` and `purchase_intent_19 IS NULL`.

## Rollback boundary

Do not restore the pre-migration bookmark after Build-370 survey writes begin: restoring it could
erase Q6/Q7 responses. A code rollback may retain these additive nullable columns. The bookmark is
evidence and a pre-write recovery point only.

## Remaining gates

1. Deploy the exact Build-370 Functions/static candidate to Preview, retaining Preview's verified
   `APP_DB`/`BETA_DB` bindings and secrets.
2. Run the complete Preview and physical-phone matrix: player-paced long/short win/loss, pause /
   background / backtrack, manual close and replay truth, world-event suppression, Q1–Q7 stored-value
   receipt, invite attribution, Founder Access/dashboard/export, v16/v17 service-worker return, and
   rollback.
3. Prepare production manifest/lock/gate only after the Preview and Founder gates pass. Production
   Build 367 remains live; no tester links may be sent.
