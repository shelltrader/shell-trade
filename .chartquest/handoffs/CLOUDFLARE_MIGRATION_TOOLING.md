# Supabase → Cloudflare auditable offline migration tooling

Status: **IMPLEMENTED AND LOCALLY TESTED; NO PROVIDER OR LIVE DATA ACCESSED**

The scripts convert a Supabase JSON export into two auditable, retry-safe D1
imports only after its source-generated completeness evidence verifies:

- `BETA_DB`: beta events and surveys;
- `APP_DB`: identities, player state, journal data, mastery, bugs, visits, content data, and migration audit records.

They do not connect to Supabase, Cloudflare, GitHub, or the live game. They never request or store a password, provider key, login token, session, MFA secret, legacy password hash, or raw account-claim token.

## Required export shape

Export **every row and every column** from the tables below. Do not aggregate, paginate, trim JSON, rewrite IDs, or convert timestamps. Supabase UUIDs must remain exact.

Preferred UTF-8 single-file shape:

```json
{
  "_meta": {
    "format": "chartquest-supabase-export-v1",
    "source_provider": "supabase",
    "project_ref": "ymxppzhczvmiuoncuqqu",
    "export_evidence": {
      "format": "chartquest-supabase-export-proof-v1",
      "generated_by": "chartquest-approved-supabase-exporter-v1",
      "source_provider": "supabase",
      "project_ref": "ymxppzhczvmiuoncuqqu",
      "export_id": "source-generated-export-id",
      "generated_at": "2026-08-23T00:00:00Z",
      "snapshot_id": "source-snapshot-id",
      "snapshot_consistent": true,
      "tables": {
        "auth.users": {
          "source_row_count": 0,
          "source_rows_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          "key_columns": ["id"],
          "pagination": {
            "mode": "keyset",
            "complete": true,
            "page_count": 1,
            "pages": [{
              "page_index": 0,
              "row_count": 0,
              "rows_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
              "cursor_in": null,
              "cursor_out": null,
              "has_more": false
            }]
          }
        }
      }
    }
  },
  "auth": {
    "users": [],
    "identities": []
  },
  "public": {
    "beta_events": [],
    "beta_surveys": [],
    "profiles": [],
    "journal_trades": [],
    "journal_notes": [],
    "daily_streak": [],
    "player_mastery": [],
    "bug_reports": [],
    "site_visits": [],
    "site_visits_daily": [],
    "content_events": [],
    "content_replays": [],
    "content_briefs": [],
    "content_assets": [],
    "content_generated": [],
    "content_exports": [],
    "published_posts": [],
    "performance_snapshots": [],
    "admins": []
  }
}
```

The shortened example shows the required proof for an empty `auth.users`
table. `export_evidence.tables` must contain the same structure for every table
in the `auth` and `public` sections. The checked-in fixture contains a complete
21-table example.

The project reference is mandatory provenance proof. The importer accepts it in
top-level `_meta`, `metadata`, or `manifest`, or in a separate
`manifest.json`, `export-manifest.json`, `supabase-manifest.json`, or
`supabase_export_manifest.json`. The field may be named `project_ref`,
`source_project_ref`, or `supabase_project_ref`, but its value must be exactly
`ymxppzhczvmiuoncuqqu`. A missing or different value fails closed.

Every table shown above is also mandatory as a declared dataset, even when it
has zero rows. Omitting `auth.users`, `auth.identities`, either beta table, or
any application/content table creates a blocking `required_source_table_missing`
record. This prevents a partial or wrong-project export from ever becoming
ready to apply.

Table names and project ref are not enough. Exactly one authoritative
`export_evidence` block is required, embedded as above or placed in the same
metadata object in one recognized manifest file. It must be created during the
source export—not reconstructed later from the downloaded arrays—and must
provide:

- the exact exporter format/generator, project ref, export ID, generation time,
  consistent snapshot ID, and `snapshot_consistent=true`;
- an independently obtained source row count and raw-row SHA-256 for every
  required table;
- the exact source key columns and a contiguous zero-based keyset page chain;
- each page's count, SHA-256, input/output cursor, and `has_more` flag;
- `complete=true` and a final page with `has_more=false` (including one empty
  terminal page for a zero-row table).

The importer compares those declarations against raw parsed rows before
credential stripping, then stores only counts, digests, and safe provenance.
It also requires strictly ordered unique source keys, so a duplicated or
overlapping page fails even if someone recomputes its aggregate count/digest.
A truncated array, wrong count/digest, missing page, broken cursor, duplicate
page, or non-terminal final page is blocking.

Digest algorithm: canonical UTF-8 JSON with object keys sorted and no optional
whitespace; sort the canonical row strings lexicographically, join them with
`\n`, append a final `\n` for a non-empty set, then SHA-256 the bytes. Page
digests use the same algorithm over that page's rows.

This is an internal-consistency and source-process attestation, not a digital
signature. Only accept a proof emitted and archived by the approved source
exporter. The importer deliberately has no credentials or signing key and will
not manufacture proof for an untrusted/truncated file.

Equivalent data layouts are accepted only when the same source-generated proof
accompanies them:

- a directory with `auth/users.json`, `auth/identities.json`, and `public/<table>.json`;
- one file per table named `auth.users.json` or `public.beta_events.json`;
- `{"schema":"public","table":"beta_events","rows":[...]}`;
- a table file wrapped as `{"data":[...]}` or `{"rows":[...]}`;
- `.jsonl` / `.ndjson` when the filename identifies the table;
- legacy beta snapshot keys `events`, `surveys`, `prev_events`, and `prev_surveys`.

Each row must be a JSON object. Minimum identifying data:

| Source dataset | Required identifying fields |
|---|---|
| `beta_events` | `event_id`, `player_id`, `session_id`, `name`, `ts`, `created_at` |
| `beta_surveys` | `response_id`, player/session IDs, all survey answers, `seconds_taken`, `created_at` |
| `auth.users` | exact UUID `id`, email, timestamps and non-secret metadata |
| `auth.identities` | `id`, `user_id`, provider metadata and timestamps |
| `profiles` | auth UUID in `id`/`user_id`, counters and timestamps |
| journal tables | `user_id`, `trade_data` / `note_data`, stable source `id`, timestamps |
| `daily_streak` | auth UUID in `id`/`user_id`, streak fields and timestamps |
| `player_mastery` | `player_id`, exact `category`, `score`, timestamps |
| `bug_reports` | stable source `id`, full message/context/status/timestamps |
| visits | raw source `id` and `created_at`; daily `day` and `visits` |
| content tables | stable source IDs, relationship IDs, all JSON/array fields, all timestamps |
| `admins` | `user_id`, role/email metadata and timestamp |

Only these current mastery categories import into `app_mastery`: `Trend`, `Structure`, `Liquidity`, `OrderBlocks`, `RiskMgmt`, `TradeMgmt`, and `MultiTF`. Anything else is retained in both the reverse archive and `app_mastery_quarantine`, with a blocking reconciliation reason instead of a guessed conversion.

Unknown tables and unknown `content_*` tables are also archived and quarantined. Nothing is silently dropped.

Password hashes and Supabase session/token/MFA tables are not useful for Cloudflare authentication. If a broad export includes them, credential-bearing values are stripped before any artifact is written, while safe row metadata remains in the archive. Imported users become `app_identities.status='pending_claim'`. Claims are issued later through the Cloudflare Access-protected founder action, which returns the raw one-time token once and stores only its SHA-256 hash. The offline importer intentionally creates no `app_account_claims` rows.

Every imported profile carries its original `source_updated_at`. The APP_DB
initial-sync fields remain unset; the source timestamp plus imported non-pristine
progress prevents the later one-time local bootstrap from overwriting migrated
shells, level, or XP. An identity with no source profile may bootstrap after it
is claimed, by design.

Supabase `admins` rows never grant Cloudflare authorization. They are ledgered as retired metadata; Cloudflare Access is the sole founder authorization source.

## Build and verify a dry-run bundle

```sh
python3 scripts/cloudflare_import.py /absolute/path/to/supabase-export \
  --out /private/tmp/chartquest-cloudflare-import

python3 scripts/cloudflare_reconcile.py \
  /private/tmp/chartquest-cloudflare-import
```

Importer exit codes:

- `0`: source-attested, internally complete, correctly identified export with no blocking quarantine/FK issue;
- `1`: artifacts were produced, but blocking quarantine exists; do not apply yet;
- `2`: unreadable/invalid input or output failure.

A reconciliation run without `--target-export` checks bundle integrity only.
It reports `external_verification.status="pending"` and
`ready_to_mark_reconciled=false`; it never creates proof or changes a run to
`reconciled`. Requesting `--mark-reconciled-sql` without successful external
proof exits `1` and writes no SQL.

Bundle files:

- `cloudflare-import-beta.sql` — apply only to `BETA_DB`, after `0001_beta.sql`;
- `cloudflare-import-app.sql` — apply only to `APP_DB`, after `0002_app.sql`;
- `cloudflare-import.json` — canonical `app_*`/beta rows, database split, audit plan, sanitized source archive;
- `cloudflare-reconciliation.json` — verified source-export proof summary plus deterministic source and destination counts, row/key SHA-256 hashes, timestamp bounds, FK evidence, and visit overlap;
- `cloudflare-quarantine.json` — complete sanitized conflict/unknown rows and reasons;
- `cloudflare-reverse-export.json` — source-shaped reverse export with IDs, timestamps, JSON and provenance;
- `cloudflare-rollback-beta.sql` and `cloudflare-rollback-app.sql` — remove only unchanged rows proven absent before the batch; drift/live rows remain.

The generated imports are intentionally separate because D1 cannot execute one transaction across `BETA_DB` and `APP_DB`.

## Apply commands (only after review and backups)

Use the actual D1 database names configured for the two bindings:

```sh
npx wrangler d1 execute <BETA_DATABASE_NAME> --remote \
  --file=/private/tmp/chartquest-cloudflare-import/cloudflare-import-beta.sql

npx wrangler d1 execute <APP_DATABASE_NAME> --remote \
  --file=/private/tmp/chartquest-cloudflare-import/cloudflare-import-app.sql
```

Both files are retry-safe. Existing Cloudflare rows are preserved. An existing live beta survey always beats Supabase history. An existing visit daily rollup prevents raw historical visits for that same day/path from incrementing it. Existing account/journal state blocks the baseline rather than being overwritten. Every such conflict is ledgered/quarantined for review.

Applying these files leaves every `app_migration_runs.status` at `imported` and
leaves `app_migration_reconciliation` empty. In dashboard terms, migration
evidence remains pending until an independently exported post-apply D1 snapshot
passes the comparison below.

## Destination reconciliation

Export each affected D1 table as JSON into one directory, using the exact table name as the filename (for example `beta_surveys.json`, `app_profiles.json`). Wrangler JSON wrappers such as `[{"results":[...]}]` are accepted.

The export must contain every canonical business table named in
`cloudflare-import.json`, plus these audit tables:

- `APP_DB`: `app_migration_runs`, `app_migration_ledger`,
  `app_migration_quarantine`, `app_migration_source_archive`,
  `app_migration_import_state`, and `app_migration_reconciliation`;
- `BETA_DB`: `beta_migration_runs`, `beta_migration_import_state`, and
  `beta_migration_conflicts`.

The pre-proof `app_migration_reconciliation` export must be present and empty.
Then run:

```sh
python3 scripts/cloudflare_reconcile.py \
  /private/tmp/chartquest-cloudflare-import \
  --target-export /absolute/path/to/d1-table-exports \
  --out /private/tmp/chartquest-cloudflare-verification.json \
  --mark-reconciled-sql /private/tmp/chartquest-mark-reconciled-app.sql
```

The comparison checks landed canonical values, per-table counts and SHA-256
evidence, source archive, ledger, quarantine, import-state rows, both migration
run records, and the absence of premature reconciliation claims. Missing or
tampered values fail verification. Extra live Cloudflare rows are informational.
A changed `ingest_source='cloudflare'` beta survey is reported as
`live_target_wins`, not data loss.

Only a zero-failure comparison writes
`chartquest-mark-reconciled-app.sql`. Review it, then apply it to `APP_DB` only:

```sh
npx wrangler d1 execute <APP_DATABASE_NAME> --remote \
  --file=/private/tmp/chartquest-mark-reconciled-app.sql
```

That guarded transaction inserts one matched proof row per source dataset and
changes only still-`imported` runs whose source counts/digests and landed proof
match. This is the sole step that makes dashboard-facing migration status
`reconciled`. Export the audit tables once more afterward to retain the final
provider-side proof artifact.

## Rollback commands

Only use the corresponding rollback after reviewing the reconciliation and taking a fresh backup:

```sh
npx wrangler d1 execute <BETA_DATABASE_NAME> --remote \
  --file=/private/tmp/chartquest-cloudflare-import/cloudflare-rollback-beta.sql

npx wrangler d1 execute <APP_DATABASE_NAME> --remote \
  --file=/private/tmp/chartquest-cloudflare-import/cloudflare-rollback-app.sql
```

Rollback leaves migration archive/ledger evidence and marks runs `rolled_back`. It will not remove a row that existed before import, changed afterward, gained live dependencies, or no longer exactly matches the expected imported value.

## Deterministic fixture evidence

Fixture: `scripts/cloudflare_import_fixtures/complete_export.json`

- 27 sanitized source rows archived and ledgered;
- 25 canonical business target rows across 22 `beta_*` / `app_*` tables;
- 9 quarantine records: 7 warnings and 2 intentionally blocking fixture cases;
- blocking cases: one ambiguous mastery category and one unknown future content table;
- 3 effective visits, never the double-counted raw-plus-rollup total of 5;
- source-export proof SHA-256: `85964595c294f3beac76793e1b6b01b9282bf8f4f228a18aa5660312512d0fe8`;
- batch: `supa-171211b698a49d21b1c141ba`;
- source archive SHA-256: `02abc888ced2f8516a18308327e5f16ce4e6f621209b9090ef9ab03969b3fc94`;
- reconciliation SHA-256: `cb826f8afd63497b884e04f52bb499bfcba12ba8497bc04c4768521c4613aa70`.

The exact counts/hashes are pinned in `scripts/cloudflare_import_fixtures/expected_evidence.json`.

## Test command and coverage

```sh
python3 scripts/cloudflare_import_test.py
```

The 27 tests cover deterministic output, credential/claim exclusion, exact
canonical `app_*` alignment, split D1 imports, repeat applies, survey
live-row-wins, duplicate trades, note versions, live journal preservation,
raw/daily visit overlap, existing visit-rollup preservation, mastery quarantine,
retired admin authorization, complete migration ledger/source archive, reverse
hashes, drift-safe rollback, required-table completeness, missing/wrong project
proof, mandatory source attestation, truncated arrays, wrong independent source
counts/digests, incomplete terminal pagination, self-consistent duplicate pages,
pre-proof pending state, tampered landed values, and missing landed quarantine
evidence. They pass with resource warnings promoted to errors.

## Remaining blocker

The tooling is ready. The data blocker is an approved source-generated export
and its completeness/pagination evidence for project
`ymxppzhczvmiuoncuqqu`. An arbitrary JSON download, even with all expected table
names, is intentionally not considered complete. No live import, provider
mutation, Supabase deletion, Cloudflare cutover, or account claim was performed
by this work.
