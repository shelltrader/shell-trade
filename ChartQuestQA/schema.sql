-- ============================================================
-- ChartQuest QA & Design Review Assistant — SQLite schema
-- This file documents the schema. The app creates it at runtime
-- via Database.migrate(); keep the two in sync.
-- ============================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- --- Playtest sessions -------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    started_at      REAL NOT NULL,
    ended_at        REAL,
    report_markdown TEXT
);

-- --- Reviews (one per captured screenshot) -----------------
CREATE TABLE IF NOT EXISTS reviews (
    id              TEXT PRIMARY KEY,          -- "CQ-0001"
    seq             INTEGER NOT NULL,          -- 1, 2, 3 … (drives CQ-XXXX)
    title           TEXT NOT NULL DEFAULT '',
    category        TEXT NOT NULL DEFAULT 'other',
    status          TEXT NOT NULL DEFAULT 'open',     -- open | in_progress | resolved
    priority        TEXT NOT NULL DEFAULT 'medium',   -- critical | high | medium | low
    severity        TEXT,                              -- critical | high | medium | low | info
    user_notes      TEXT NOT NULL DEFAULT '',
    developer_notes TEXT NOT NULL DEFAULT '',
    transcript      TEXT NOT NULL DEFAULT '',
    original_path   TEXT NOT NULL,
    annotated_path  TEXT,
    resolved_path   TEXT,
    session_id      TEXT,
    created_at      REAL NOT NULL,
    updated_at      REAL NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

-- --- Structured annotations --------------------------------
CREATE TABLE IF NOT EXISTS annotations (
    id          TEXT PRIMARY KEY,
    review_id   TEXT NOT NULL,
    tool        TEXT NOT NULL,     -- circle|rectangle|arrow|pencil|highlighter|text|xMarker
    x           REAL NOT NULL DEFAULT 0,
    y           REAL NOT NULL DEFAULT 0,
    width       REAL NOT NULL DEFAULT 0,
    height      REAL NOT NULL DEFAULT 0,
    points      TEXT,              -- JSON [[x,y],…] for freehand / arrow
    color       TEXT NOT NULL DEFAULT '#FF3B30',
    line_width  REAL NOT NULL DEFAULT 4,
    text        TEXT,
    created_at  REAL NOT NULL,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);

-- --- Voice notes -------------------------------------------
CREATE TABLE IF NOT EXISTS voice_notes (
    id          TEXT PRIMARY KEY,
    review_id   TEXT NOT NULL,
    audio_path  TEXT NOT NULL,
    transcript  TEXT NOT NULL DEFAULT '',
    duration    REAL NOT NULL DEFAULT 0,
    created_at  REAL NOT NULL,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);

-- --- AI analysis (one row per Analyze run) -----------------
CREATE TABLE IF NOT EXISTS ai_analyses (
    id            TEXT PRIMARY KEY,
    review_id     TEXT NOT NULL,
    model         TEXT NOT NULL DEFAULT '',
    summary       TEXT NOT NULL DEFAULT '',
    raw_response  TEXT NOT NULL DEFAULT '',
    created_at    REAL NOT NULL,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);

-- --- Individual AI issues ----------------------------------
CREATE TABLE IF NOT EXISTS ai_issues (
    id              TEXT PRIMARY KEY,
    analysis_id     TEXT NOT NULL,
    review_id       TEXT NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    title           TEXT NOT NULL DEFAULT '',
    severity        TEXT NOT NULL DEFAULT 'medium',
    category        TEXT,
    description     TEXT NOT NULL DEFAULT '',
    why_it_matters  TEXT NOT NULL DEFAULT '',
    recommended_fix TEXT NOT NULL DEFAULT '',
    dev_notes       TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (analysis_id) REFERENCES ai_analyses(id) ON DELETE CASCADE,
    FOREIGN KEY (review_id)   REFERENCES reviews(id)      ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reviews_session   ON reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status    ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_category  ON reviews(category);
CREATE INDEX IF NOT EXISTS idx_reviews_created   ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_annotations_review ON annotations(review_id);
CREATE INDEX IF NOT EXISTS idx_voice_review       ON voice_notes(review_id);
CREATE INDEX IF NOT EXISTS idx_issues_review      ON ai_issues(review_id);

-- Full-text search over the searchable review fields.
CREATE VIRTUAL TABLE IF NOT EXISTS reviews_fts USING fts5(
    review_id UNINDEXED, title, user_notes, developer_notes, transcript, ai_text,
    tokenize = 'porter'
);
