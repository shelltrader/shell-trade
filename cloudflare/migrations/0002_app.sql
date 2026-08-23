-- ChartQuest Cloudflare D1 application-data plane (additive; no Supabase operation).
-- Binding: APP_DB. Required secrets: APP_AUTH_PEPPER and APP_RATE_SALT (32+ chars each).
-- Stable Supabase UUIDs are retained as app_identities.id during a later, verified import.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_identities (
  id                    TEXT PRIMARY KEY CHECK (length(id) BETWEEN 32 AND 64),
  email_normalized      TEXT NOT NULL UNIQUE COLLATE NOCASE CHECK (length(email_normalized) <= 254),
  email_original        TEXT NOT NULL CHECK (length(email_original) <= 254),
  source_provider       TEXT NOT NULL DEFAULT 'cloudflare'
    CHECK (source_provider IN ('cloudflare', 'supabase')),
  source_subject        TEXT CHECK (source_subject IS NULL OR length(source_subject) <= 128),
  status                TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending_claim', 'active', 'disabled', 'deleted')),
  password_scheme       TEXT CHECK (password_scheme IS NULL OR password_scheme = 'pbkdf2-sha256-v1'),
  password_salt         TEXT CHECK (password_salt IS NULL OR length(password_salt) BETWEEN 20 AND 128),
  password_hash         TEXT CHECK (password_hash IS NULL OR length(password_hash) BETWEEN 32 AND 256),
  password_iterations   INTEGER CHECK (password_iterations IS NULL OR password_iterations BETWEEN 100000 AND 2000000),
  consent_at            TEXT,
  claimed_at            TEXT,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (
    (status = 'pending_claim' AND password_hash IS NULL) OR
    status IN ('active', 'disabled', 'deleted')
  )
);
CREATE INDEX IF NOT EXISTS app_identities_source_idx
  ON app_identities (source_provider, source_subject);

CREATE TABLE IF NOT EXISTS app_account_claims (
  claim_id          TEXT PRIMARY KEY CHECK (length(claim_id) BETWEEN 8 AND 100),
  user_id           TEXT NOT NULL REFERENCES app_identities(id) ON DELETE CASCADE,
  claim_token_hash  TEXT NOT NULL UNIQUE CHECK (length(claim_token_hash) = 64),
  expires_at        TEXT NOT NULL,
  attempts          INTEGER NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 20),
  issued_by_access_sub TEXT NOT NULL CHECK (length(issued_by_access_sub) BETWEEN 1 AND 256),
  claimed_at        TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS app_account_claims_user_idx
  ON app_account_claims (user_id, expires_at DESC);

CREATE TRIGGER IF NOT EXISTS app_account_claims_pending_guard
BEFORE INSERT ON app_account_claims
WHEN COALESCE((SELECT status FROM app_identities WHERE id = NEW.user_id), '') != 'pending_claim'
BEGIN
  SELECT RAISE(ABORT, 'account_claim_identity_not_pending');
END;

-- A separate unique redemption row turns claim consumption into an atomic compare-and-set even
-- when two Workers race after both read the same still-valid claim.
CREATE TABLE IF NOT EXISTS app_account_claim_redemptions (
  claim_id    TEXT PRIMARY KEY REFERENCES app_account_claims(claim_id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES app_identities(id) ON DELETE CASCADE,
  request_id  TEXT NOT NULL UNIQUE CHECK (length(request_id) BETWEEN 8 AND 100),
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_sessions (
  session_hash      TEXT PRIMARY KEY CHECK (length(session_hash) = 64),
  user_id           TEXT NOT NULL REFERENCES app_identities(id) ON DELETE CASCADE,
  csrf_hash         TEXT NOT NULL CHECK (length(csrf_hash) = 64),
  source            TEXT NOT NULL DEFAULT 'cloudflare'
    CHECK (source IN ('cloudflare', 'migration')),
  created_at        TEXT NOT NULL,
  expires_at        TEXT NOT NULL,
  last_seen_at      TEXT NOT NULL,
  revoked_at        TEXT,
  user_agent_hash   TEXT CHECK (user_agent_hash IS NULL OR length(user_agent_hash) = 64)
);
CREATE INDEX IF NOT EXISTS app_sessions_user_active_idx
  ON app_sessions (user_id, expires_at DESC) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS app_profiles (
  user_id           TEXT PRIMARY KEY REFERENCES app_identities(id) ON DELETE CASCADE,
  shells            INTEGER NOT NULL DEFAULT 0 CHECK (shells BETWEEN 0 AND 10000000),
  player_level      INTEGER NOT NULL DEFAULT 1 CHECK (player_level BETWEEN 1 AND 10),
  xp                INTEGER NOT NULL DEFAULT 0 CHECK (xp BETWEEN 0 AND 999999),
  version           INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0),
  source_updated_at TEXT,
  initial_sync_completed_at TEXT,
  initial_sync_receipt_id TEXT CHECK (initial_sync_receipt_id IS NULL OR length(initial_sync_receipt_id) BETWEEN 8 AND 100),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK ((initial_sync_completed_at IS NULL) = (initial_sync_receipt_id IS NULL))
);

CREATE TRIGGER IF NOT EXISTS app_profiles_version_guard
BEFORE UPDATE ON app_profiles
WHEN NEW.version != OLD.version + 1
BEGIN
  SELECT RAISE(ABORT, 'profile_version_conflict');
END;

-- A large first sync is allowed only for a pristine, never-imported profile. Any ordinary
-- version-1 write also makes a later bootstrap impossible through the version guard.
CREATE TRIGGER IF NOT EXISTS app_profiles_initial_sync_guard
BEFORE UPDATE ON app_profiles
WHEN NEW.initial_sync_receipt_id IS NOT OLD.initial_sync_receipt_id
BEGIN
  SELECT CASE WHEN OLD.initial_sync_receipt_id IS NOT NULL OR OLD.version != 0 OR
    OLD.shells != 0 OR OLD.player_level != 1 OR OLD.xp != 0 OR OLD.source_updated_at IS NOT NULL
  THEN RAISE(ABORT, 'profile_bootstrap_conflict') END;
END;

-- One guarded version covers a complete journal snapshot (trades + notes).
CREATE TABLE IF NOT EXISTS app_journal_heads (
  user_id          TEXT PRIMARY KEY REFERENCES app_identities(id) ON DELETE CASCADE,
  current_version  INTEGER NOT NULL DEFAULT 0 CHECK (current_version >= 0),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS app_journal_versions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         TEXT NOT NULL REFERENCES app_identities(id) ON DELETE CASCADE,
  version         INTEGER NOT NULL CHECK (version > 0),
  base_version    INTEGER NOT NULL CHECK (base_version >= 0),
  request_id      TEXT NOT NULL CHECK (length(request_id) BETWEEN 8 AND 100),
  payload_hash    TEXT NOT NULL CHECK (length(payload_hash) = 64),
  created_at      TEXT NOT NULL,
  UNIQUE (user_id, version),
  UNIQUE (user_id, request_id)
);

CREATE TRIGGER IF NOT EXISTS app_journal_version_guard
BEFORE INSERT ON app_journal_versions
BEGIN
  SELECT CASE WHEN NEW.base_version != COALESCE(
    (SELECT current_version FROM app_journal_heads WHERE user_id = NEW.user_id), 0
  ) OR NEW.version != NEW.base_version + 1
  THEN RAISE(ABORT, 'journal_version_conflict') END;
END;

CREATE TRIGGER IF NOT EXISTS app_journal_version_advance
AFTER INSERT ON app_journal_versions
BEGIN
  INSERT INTO app_journal_heads (user_id, current_version, updated_at)
  VALUES (NEW.user_id, NEW.version, NEW.created_at)
  ON CONFLICT(user_id) DO UPDATE SET
    current_version = excluded.current_version,
    updated_at = excluded.updated_at;
END;

CREATE TABLE IF NOT EXISTS app_journal_trades (
  user_id           TEXT NOT NULL REFERENCES app_identities(id) ON DELETE CASCADE,
  trade_id          TEXT NOT NULL CHECK (length(trade_id) BETWEEN 1 AND 100),
  trade_data        TEXT NOT NULL CHECK (json_valid(trade_data) AND json_type(trade_data) = 'object' AND length(trade_data) <= 51200),
  row_version       INTEGER NOT NULL CHECK (row_version > 0),
  source_row_id     TEXT,
  source_created_at TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  deleted_at        TEXT,
  PRIMARY KEY (user_id, trade_id)
);
CREATE INDEX IF NOT EXISTS app_journal_trades_active_idx
  ON app_journal_trades (user_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS app_journal_notes (
  user_id           TEXT NOT NULL REFERENCES app_identities(id) ON DELETE CASCADE,
  note_id           TEXT NOT NULL CHECK (length(note_id) BETWEEN 1 AND 100),
  note_data         TEXT NOT NULL CHECK (json_valid(note_data) AND json_type(note_data) = 'object' AND length(note_data) <= 20480),
  row_version       INTEGER NOT NULL CHECK (row_version > 0),
  source_row_id     TEXT,
  source_created_at TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  deleted_at        TEXT,
  PRIMARY KEY (user_id, note_id)
);
CREATE INDEX IF NOT EXISTS app_journal_notes_active_idx
  ON app_journal_notes (user_id, created_at DESC) WHERE deleted_at IS NULL;

-- Immutable audit trail. Deletes are tombstones rather than destructive row removal.
CREATE TABLE IF NOT EXISTS app_journal_changes (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          TEXT NOT NULL REFERENCES app_identities(id) ON DELETE CASCADE,
  journal_version  INTEGER NOT NULL,
  item_kind        TEXT NOT NULL CHECK (item_kind IN ('trade', 'note')),
  item_id          TEXT NOT NULL CHECK (length(item_id) BETWEEN 1 AND 100),
  operation        TEXT NOT NULL CHECK (operation IN ('upsert', 'delete')),
  item_data        TEXT CHECK (item_data IS NULL OR (json_valid(item_data) AND json_type(item_data) = 'object')),
  created_at       TEXT NOT NULL,
  FOREIGN KEY (user_id, journal_version)
    REFERENCES app_journal_versions(user_id, version) ON DELETE CASCADE,
  UNIQUE (user_id, journal_version, item_kind, item_id)
);
CREATE INDEX IF NOT EXISTS app_journal_changes_user_version_idx
  ON app_journal_changes (user_id, journal_version DESC, id DESC);

CREATE TABLE IF NOT EXISTS app_daily_streak (
  user_id          TEXT PRIMARY KEY REFERENCES app_identities(id) ON DELETE CASCADE,
  streak           INTEGER NOT NULL DEFAULT 0 CHECK (streak BETWEEN 0 AND 3660),
  best_streak      INTEGER NOT NULL DEFAULT 0 CHECK (best_streak BETWEEN 0 AND 3660 AND best_streak >= streak),
  last_drill_date  TEXT CHECK (last_drill_date IS NULL OR length(last_drill_date) = 10),
  version          INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0),
  source_updated_at TEXT,
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TRIGGER IF NOT EXISTS app_daily_streak_version_guard
BEFORE UPDATE ON app_daily_streak
WHEN NEW.version != OLD.version + 1
BEGIN
  SELECT RAISE(ABORT, 'streak_version_conflict');
END;

CREATE TABLE IF NOT EXISTS app_mastery (
  owner_key          TEXT NOT NULL CHECK (length(owner_key) BETWEEN 1 AND 64),
  owner_kind         TEXT NOT NULL CHECK (owner_kind IN ('account', 'guest')),
  user_id            TEXT REFERENCES app_identities(id) ON DELETE CASCADE,
  category_raw       TEXT NOT NULL CHECK (length(category_raw) BETWEEN 1 AND 80),
  category_normalized TEXT NOT NULL CHECK (category_normalized IN (
    'trend', 'structure', 'liquidity', 'order_blocks', 'risk_management',
    'trade_management', 'multi_timeframe'
  )),
  score              INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  source_updated_at  TEXT,
  updated_at         TEXT NOT NULL,
  PRIMARY KEY (owner_key, category_raw),
  UNIQUE (owner_key, category_normalized),
  CHECK ((owner_kind = 'account' AND user_id = owner_key) OR owner_kind = 'guest')
);
CREATE INDEX IF NOT EXISTS app_mastery_user_idx ON app_mastery (user_id, updated_at DESC);
-- The explicit index also upgrades an APP_DB where an earlier additive draft of this
-- migration created app_mastery before normalized-category uniqueness was added.
CREATE UNIQUE INDEX IF NOT EXISTS app_mastery_owner_normalized_uq
  ON app_mastery (owner_key, category_normalized);

CREATE TABLE IF NOT EXISTS app_mastery_quarantine (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  quarantine_key   TEXT NOT NULL UNIQUE CHECK (length(quarantine_key) BETWEEN 8 AND 140),
  owner_key        TEXT CHECK (owner_key IS NULL OR length(owner_key) <= 64),
  user_id          TEXT REFERENCES app_identities(id) ON DELETE SET NULL,
  category_raw     TEXT,
  raw_row          TEXT NOT NULL CHECK (json_valid(raw_row) AND json_type(raw_row) = 'object'),
  reason_code      TEXT NOT NULL CHECK (length(reason_code) BETWEEN 1 AND 80),
  source_provider  TEXT NOT NULL DEFAULT 'cloudflare' CHECK (source_provider IN ('cloudflare', 'supabase')),
  created_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_bug_reports (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id      TEXT NOT NULL UNIQUE CHECK (length(request_id) BETWEEN 8 AND 100),
  user_id         TEXT REFERENCES app_identities(id) ON DELETE SET NULL,
  player_id       TEXT CHECK (player_id IS NULL OR length(player_id) <= 64),
  message         TEXT NOT NULL CHECK (length(trim(message)) BETWEEN 1 AND 4000),
  context         TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(context) AND json_type(context) = 'object' AND length(context) <= 8192),
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'triaged', 'resolved', 'closed')),
  ingest_source   TEXT NOT NULL DEFAULT 'cloudflare' CHECK (ingest_source IN ('cloudflare', 'supabase_history')),
  source_row_id   TEXT,
  source_created_at TEXT,
  created_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS app_bug_reports_status_created_idx
  ON app_bug_reports (status, created_at DESC);

CREATE TABLE IF NOT EXISTS app_site_visits (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id        TEXT NOT NULL UNIQUE CHECK (length(visit_id) BETWEEN 8 AND 100),
  player_id       TEXT CHECK (player_id IS NULL OR length(player_id) <= 64),
  path            TEXT NOT NULL DEFAULT '/' CHECK (length(path) <= 256),
  referrer_host   TEXT CHECK (referrer_host IS NULL OR length(referrer_host) <= 253),
  build           TEXT CHECK (build IS NULL OR length(build) <= 40),
  device          TEXT CHECK (device IS NULL OR length(device) <= 24),
  country         TEXT CHECK (country IS NULL OR length(country) = 2),
  ingest_source   TEXT NOT NULL DEFAULT 'cloudflare' CHECK (ingest_source IN ('cloudflare', 'supabase_history')),
  source_row_id   TEXT,
  source_created_at TEXT,
  created_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS app_site_visits_created_idx ON app_site_visits (created_at DESC);

CREATE TABLE IF NOT EXISTS app_site_visits_daily (
  visit_date      TEXT NOT NULL CHECK (length(visit_date) = 10),
  path            TEXT NOT NULL,
  visit_count     INTEGER NOT NULL DEFAULT 0 CHECK (visit_count >= 0),
  first_seen_at   TEXT NOT NULL,
  last_seen_at    TEXT NOT NULL,
  PRIMARY KEY (visit_date, path)
);

CREATE TRIGGER IF NOT EXISTS app_site_visits_rollup
AFTER INSERT ON app_site_visits
BEGIN
  INSERT INTO app_site_visits_daily (visit_date, path, visit_count, first_seen_at, last_seen_at)
  VALUES (substr(NEW.created_at, 1, 10), NEW.path, 1, NEW.created_at, NEW.created_at)
  ON CONFLICT(visit_date, path) DO UPDATE SET
    visit_count = app_site_visits_daily.visit_count + 1,
    first_seen_at = min(app_site_visits_daily.first_seen_at, excluded.first_seen_at),
    last_seen_at = max(app_site_visits_daily.last_seen_at, excluded.last_seen_at);
END;

CREATE TABLE IF NOT EXISTS app_content_events (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id              TEXT NOT NULL UNIQUE CHECK (length(event_id) BETWEEN 1 AND 80),
  event_type            TEXT NOT NULL CHECK (length(event_type) BETWEEN 1 AND 80),
  ts                    TEXT NOT NULL,
  player_id             TEXT CHECK (player_id IS NULL OR length(player_id) <= 64),
  session_id            TEXT CHECK (session_id IS NULL OR length(session_id) <= 64),
  faction               TEXT CHECK (faction IS NULL OR length(faction) <= 16),
  player_level          INTEGER CHECK (player_level IS NULL OR player_level BETWEEN 0 AND 100),
  player_rank           TEXT CHECK (player_rank IS NULL OR length(player_rank) <= 40),
  payload               TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(payload) AND json_type(payload) = 'object' AND length(payload) <= 8192),
  educational_metadata  TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(educational_metadata) AND json_type(educational_metadata) = 'object' AND length(educational_metadata) <= 4096),
  content_flags         TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(content_flags) AND json_type(content_flags) = 'object' AND length(content_flags) <= 4096),
  significance_score    INTEGER NOT NULL DEFAULT 0 CHECK (significance_score BETWEEN 0 AND 100),
  processed_status      TEXT NOT NULL DEFAULT 'new' CHECK (processed_status IN ('new','triaged','rejected','in_production','published')),
  ingest_source         TEXT NOT NULL DEFAULT 'cloudflare' CHECK (ingest_source IN ('cloudflare','supabase_history')),
  created_at            TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS app_content_events_ts_idx ON app_content_events (ts DESC);
CREATE INDEX IF NOT EXISTS app_content_events_type_idx ON app_content_events (event_type, ts DESC);
CREATE INDEX IF NOT EXISTS app_content_events_score_idx ON app_content_events (significance_score DESC);

CREATE TABLE IF NOT EXISTS app_content_replays (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  replay_id     TEXT NOT NULL UNIQUE CHECK (length(replay_id) BETWEEN 1 AND 80),
  event_id      TEXT REFERENCES app_content_events(event_id) ON DELETE SET NULL,
  kind          TEXT CHECK (kind IS NULL OR length(kind) <= 32),
  meta          TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(meta) AND json_type(meta) = 'object' AND length(meta) <= 8192),
  data          TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(data) AND json_type(data) = 'object' AND length(data) <= 65536),
  ingest_source TEXT NOT NULL DEFAULT 'cloudflare' CHECK (ingest_source IN ('cloudflare','supabase_history')),
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS app_content_replays_event_idx ON app_content_replays (event_id);

CREATE TABLE IF NOT EXISTS app_content_briefs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  brief_key   TEXT NOT NULL UNIQUE CHECK (length(brief_key) BETWEEN 8 AND 140),
  event_id    TEXT REFERENCES app_content_events(event_id) ON DELETE CASCADE,
  pillar      TEXT,
  platforms   TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(platforms) AND json_type(platforms) = 'array'),
  urgency     TEXT,
  angle       TEXT,
  format      TEXT,
  priority    INTEGER NOT NULL DEFAULT 0 CHECK (priority BETWEEN 0 AND 1000),
  status      TEXT NOT NULL DEFAULT 'proposed',
  ingest_source TEXT NOT NULL DEFAULT 'cloudflare' CHECK (ingest_source IN ('cloudflare','supabase_history')),
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS app_content_briefs_event_idx ON app_content_briefs (event_id);

CREATE TABLE IF NOT EXISTS app_content_assets (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_key        TEXT NOT NULL UNIQUE,
  brief_key        TEXT REFERENCES app_content_briefs(brief_key) ON DELETE SET NULL,
  event_id         TEXT,
  asset_type       TEXT,
  storage_path     TEXT,
  platform_variant TEXT,
  meta             TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(meta) AND json_type(meta) = 'object'),
  ingest_source    TEXT NOT NULL DEFAULT 'cloudflare' CHECK (ingest_source IN ('cloudflare','supabase_history')),
  created_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_content_generated (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  generated_key TEXT NOT NULL UNIQUE,
  brief_key     TEXT REFERENCES app_content_briefs(brief_key) ON DELETE SET NULL,
  platform      TEXT,
  body          TEXT CHECK (body IS NULL OR length(body) <= 20000),
  meta          TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(meta) AND json_type(meta) = 'object'),
  status        TEXT NOT NULL DEFAULT 'draft',
  ingest_source TEXT NOT NULL DEFAULT 'cloudflare' CHECK (ingest_source IN ('cloudflare','supabase_history')),
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_content_exports (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  export_key    TEXT NOT NULL UNIQUE,
  platform      TEXT,
  event_count   INTEGER NOT NULL DEFAULT 0 CHECK (event_count BETWEEN 0 AND 1000000),
  filter_json   TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(filter_json) AND json_type(filter_json) = 'object'),
  ingest_source TEXT NOT NULL DEFAULT 'cloudflare' CHECK (ingest_source IN ('cloudflare','supabase_history')),
  exported_at   TEXT NOT NULL
);

-- Content rows are immutable by logical key. This registry makes equivalent retries under
-- a new batch ID safe while turning a changed payload for an existing key into an atomic
-- conflict. It also closes the race between the read preflight and the table insert.
CREATE TABLE IF NOT EXISTS app_content_logical_keys (
  table_name    TEXT NOT NULL CHECK (table_name IN (
    'content_events','content_replays','content_briefs','content_exports','content_generated'
  )),
  logical_key  TEXT NOT NULL CHECK (length(logical_key) BETWEEN 1 AND 140),
  payload_hash TEXT NOT NULL CHECK (length(payload_hash) = 64),
  first_batch_id TEXT NOT NULL CHECK (length(first_batch_id) BETWEEN 8 AND 100),
  created_at   TEXT NOT NULL,
  PRIMARY KEY (table_name, logical_key)
);

CREATE TRIGGER IF NOT EXISTS app_content_logical_keys_immutable
BEFORE UPDATE OF payload_hash ON app_content_logical_keys
WHEN NEW.payload_hash != OLD.payload_hash
BEGIN
  SELECT RAISE(ABORT, 'content_key_conflict');
END;

CREATE TABLE IF NOT EXISTS app_published_posts (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  post_key       TEXT NOT NULL UNIQUE,
  asset_key      TEXT REFERENCES app_content_assets(asset_key) ON DELETE SET NULL,
  platform       TEXT,
  post_url       TEXT,
  ingest_source  TEXT NOT NULL DEFAULT 'cloudflare' CHECK (ingest_source IN ('cloudflare','supabase_history')),
  published_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_performance_snapshots (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_key   TEXT NOT NULL UNIQUE,
  post_key       TEXT REFERENCES app_published_posts(post_key) ON DELETE CASCADE,
  captured_at    TEXT NOT NULL,
  metrics        TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metrics) AND json_type(metrics) = 'object'),
  ingest_source  TEXT NOT NULL DEFAULT 'cloudflare' CHECK (ingest_source IN ('cloudflare','supabase_history'))
);

-- Strict idempotency receipts. A key is permanently bound to one user, operation and payload hash.
CREATE TABLE IF NOT EXISTS app_mutation_receipts (
  receipt_id     TEXT PRIMARY KEY CHECK (length(receipt_id) BETWEEN 8 AND 100),
  user_scope     TEXT NOT NULL CHECK (length(user_scope) BETWEEN 1 AND 100),
  operation      TEXT NOT NULL CHECK (length(operation) BETWEEN 1 AND 80),
  payload_hash   TEXT NOT NULL CHECK (length(payload_hash) = 64),
  accepted       INTEGER NOT NULL CHECK (accepted >= 0),
  result_json    TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(result_json) AND json_type(result_json) = 'object'),
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS app_mutation_receipts_scope_idx
  ON app_mutation_receipts (user_scope, created_at DESC);

CREATE TABLE IF NOT EXISTS app_rate_limits (
  bucket_hash    TEXT NOT NULL CHECK (length(bucket_hash) = 64),
  scope          TEXT NOT NULL CHECK (length(scope) BETWEEN 1 AND 40),
  window_start   INTEGER NOT NULL,
  request_count  INTEGER NOT NULL DEFAULT 1 CHECK (request_count >= 1),
  PRIMARY KEY (bucket_hash, scope, window_start)
);
CREATE INDEX IF NOT EXISTS app_rate_limits_window_idx ON app_rate_limits (window_start);

CREATE TABLE IF NOT EXISTS app_outbox (
  outbox_id       TEXT PRIMARY KEY CHECK (length(outbox_id) BETWEEN 8 AND 100),
  aggregate_type  TEXT NOT NULL,
  aggregate_id    TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  payload         TEXT NOT NULL CHECK (json_valid(payload) AND json_type(payload) = 'object'),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','delivered','dead_letter')),
  attempts        INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at    TEXT NOT NULL,
  delivered_at    TEXT,
  created_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS app_outbox_pending_idx
  ON app_outbox (status, available_at, created_at);

CREATE TABLE IF NOT EXISTS app_migration_runs (
  run_id             TEXT PRIMARY KEY CHECK (length(run_id) BETWEEN 8 AND 100),
  source_provider    TEXT NOT NULL CHECK (source_provider = 'supabase'),
  source_project_ref TEXT NOT NULL,
  dataset            TEXT NOT NULL,
  external_batch_id  TEXT NOT NULL,
  source_count       INTEGER NOT NULL CHECK (source_count >= 0),
  source_digest      TEXT NOT NULL CHECK (length(source_digest) = 64),
  imported_count     INTEGER NOT NULL DEFAULT 0 CHECK (imported_count >= 0),
  quarantine_count   INTEGER NOT NULL DEFAULT 0 CHECK (quarantine_count >= 0),
  status             TEXT NOT NULL CHECK (status IN ('prepared','running','imported','reconciled','failed','rolled_back')),
  notes              TEXT,
  started_at         TEXT NOT NULL,
  finished_at        TEXT,
  UNIQUE (source_provider, source_project_ref, dataset, external_batch_id)
);

CREATE TABLE IF NOT EXISTS app_migration_ledger (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id          TEXT NOT NULL REFERENCES app_migration_runs(run_id) ON DELETE RESTRICT,
  source_table    TEXT NOT NULL,
  source_pk       TEXT NOT NULL,
  source_digest   TEXT NOT NULL CHECK (length(source_digest) = 64),
  target_table    TEXT,
  target_pk       TEXT,
  status          TEXT NOT NULL CHECK (status IN ('imported','duplicate','quarantined','failed')),
  imported_at     TEXT NOT NULL,
  UNIQUE (source_table, source_pk)
);
CREATE INDEX IF NOT EXISTS app_migration_ledger_run_idx ON app_migration_ledger (run_id, status);

CREATE TABLE IF NOT EXISTS app_migration_quarantine (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id         TEXT NOT NULL REFERENCES app_migration_runs(run_id) ON DELETE RESTRICT,
  source_table   TEXT NOT NULL,
  source_pk      TEXT,
  reason_code    TEXT NOT NULL,
  reason_detail  TEXT,
  raw_row        TEXT NOT NULL CHECK (json_valid(raw_row) AND json_type(raw_row) = 'object'),
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS app_migration_quarantine_run_idx ON app_migration_quarantine (run_id, source_table);

CREATE TABLE IF NOT EXISTS app_migration_reconciliation (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id           TEXT NOT NULL REFERENCES app_migration_runs(run_id) ON DELETE RESTRICT,
  dataset          TEXT NOT NULL,
  source_count     INTEGER NOT NULL CHECK (source_count >= 0),
  target_count     INTEGER NOT NULL CHECK (target_count >= 0),
  quarantine_count INTEGER NOT NULL CHECK (quarantine_count >= 0),
  source_digest    TEXT NOT NULL CHECK (length(source_digest) = 64),
  target_digest    TEXT NOT NULL CHECK (length(target_digest) = 64),
  matched          INTEGER NOT NULL CHECK (matched IN (0, 1)),
  checked_at       TEXT NOT NULL,
  details          TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(details) AND json_type(details) = 'object'),
  UNIQUE (run_id, dataset)
);
