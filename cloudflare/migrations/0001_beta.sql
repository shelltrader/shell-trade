-- ChartQuest Cloudflare D1 closed-beta data plane (additive initial schema).
-- Binding: BETA_DB. Required secret: BETA_RATE_SALT (at least 32 high-entropy characters).
-- This migration intentionally contains no Supabase operation or import.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS beta_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id    TEXT NOT NULL UNIQUE CHECK (length(event_id) BETWEEN 1 AND 80),
  player_id   TEXT NOT NULL CHECK (length(trim(player_id)) BETWEEN 1 AND 64),
  session_id  TEXT NOT NULL CHECK (length(trim(session_id)) BETWEEN 1 AND 64),
  name        TEXT NOT NULL CHECK (name IN (
    'session_start', 'session_end', 'return_visit',
    'play_clicked', 'movement_tutorial_completed',
    'tutorial_started', 'tutorial_completed', 'tutorial_step_reached',
    'first_trade_started', 'first_trade_won', 'first_trade_lost',
    'boss_started', 'boss_defeated',
    'journal_unlocked', 'journal_discovery_started',
    'journal_discovery_completed', 'journal_discovery_skipped',
    'beta_completed', 'survey_started', 'survey_submitted', 'crash'
  )),
  ts          TEXT NOT NULL CHECK (length(ts) <= 40),
  props       TEXT NOT NULL DEFAULT '{}' CHECK (
    json_valid(props) AND json_type(props) = 'object' AND length(props) <= 4096
  ),
  device      TEXT CHECK (device IS NULL OR length(device) <= 16),
  browser     TEXT CHECK (browser IS NULL OR length(browser) <= 32),
  os          TEXT CHECK (os IS NULL OR length(os) <= 32),
  screen      TEXT CHECK (screen IS NULL OR length(screen) <= 24),
  viewport    TEXT CHECK (viewport IS NULL OR length(viewport) <= 24),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS beta_events_player_name_ts_idx
  ON beta_events (player_id, name, ts);
CREATE INDEX IF NOT EXISTS beta_events_ts_idx
  ON beta_events (ts DESC);
CREATE INDEX IF NOT EXISTS beta_events_created_at_player_idx
  ON beta_events (created_at DESC, player_id);
CREATE INDEX IF NOT EXISTS beta_events_name_created_at_idx
  ON beta_events (name, created_at DESC);
CREATE INDEX IF NOT EXISTS beta_events_build_idx
  ON beta_events (json_extract(props, '$.build'))
  WHERE json_extract(props, '$.build') IS NOT NULL;

CREATE TABLE IF NOT EXISTS beta_surveys (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  response_id      TEXT NOT NULL UNIQUE CHECK (length(response_id) BETWEEN 1 AND 80),
  player_id        TEXT NOT NULL CHECK (length(trim(player_id)) BETWEEN 1 AND 64),
  session_id       TEXT NOT NULL CHECK (length(trim(session_id)) BETWEEN 1 AND 64),
  q1_rating        INTEGER NOT NULL CHECK (q1_rating BETWEEN 1 AND 10),
  q2_hook          TEXT NOT NULL CHECK (length(trim(q2_hook)) BETWEEN 1 AND 2000),
  q3_improvement   TEXT NOT NULL CHECK (length(trim(q3_improvement)) BETWEEN 1 AND 2000),
  q4_continue      TEXT NOT NULL CHECK (
    q4_continue IN ('immediately', 'later', 'not_interested')
  ),
  q5_anything      TEXT CHECK (q5_anything IS NULL OR length(q5_anything) <= 2000),
  seconds_taken    INTEGER NOT NULL CHECK (seconds_taken BETWEEN 0 AND 86400),
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ingest_source    TEXT NOT NULL DEFAULT 'cloudflare'
    CHECK (ingest_source IN ('cloudflare', 'supabase_history'))
);

CREATE INDEX IF NOT EXISTS beta_surveys_created_at_idx ON beta_surveys (created_at DESC);
CREATE INDEX IF NOT EXISTS beta_surveys_player_id_idx  ON beta_surveys (player_id);
CREATE INDEX IF NOT EXISTS beta_surveys_updated_at_idx ON beta_surveys (updated_at DESC);

-- Historical import seam: a later Supabase backfill may INSERT missing responses with
-- ingest_source='supabase_history', but it cannot overwrite an answer submitted/updated after
-- the Cloudflare cutover. If history landed first, a later live Cloudflare re-answer may replace it.
CREATE TRIGGER IF NOT EXISTS beta_surveys_history_cannot_overwrite_cloudflare
BEFORE UPDATE ON beta_surveys
WHEN OLD.ingest_source = 'cloudflare' AND NEW.ingest_source = 'supabase_history'
BEGIN
  SELECT RAISE(IGNORE);
END;

-- Independent timestamp guard for deterministic imports. Importers must carry the historical
-- source timestamp in updated_at; an older row is ignored even when both rows share a source.
CREATE TRIGGER IF NOT EXISTS beta_surveys_older_update_is_ignored
BEFORE UPDATE ON beta_surveys
WHEN NEW.updated_at < OLD.updated_at
BEGIN
  SELECT RAISE(IGNORE);
END;

-- Ephemeral abuse-control state. The ingest function HMACs (minute || CF-Connecting-IP) with the
-- required BETA_RATE_SALT secret and deletes buckets older than ten minutes opportunistically;
-- no raw IP, cross-window stable identifier, or dictionary-reversible unsalted digest is stored.
CREATE TABLE IF NOT EXISTS beta_ingest_throttle (
  ip_hash       TEXT NOT NULL,
  window_start  INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count >= 1),
  PRIMARY KEY (ip_hash, window_start)
);
CREATE INDEX IF NOT EXISTS beta_ingest_throttle_window_idx
  ON beta_ingest_throttle (window_start);
