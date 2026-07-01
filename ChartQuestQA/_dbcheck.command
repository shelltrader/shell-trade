#!/usr/bin/env bash
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "$(dirname "$0")"
DB="$HOME/Documents/ChartQuest QA/chartquest_qa.sqlite"
{
  echo "DB path: $DB"
  echo "--- files ---"
  ls -la "$HOME/Documents/ChartQuest QA/" 2>&1 | grep -i sqlite
  echo "--- counts (reads WAL too) ---"
  echo "reviews    = $(sqlite3 "$DB" 'SELECT COUNT(*) FROM reviews;' 2>&1)"
  echo "annotations= $(sqlite3 "$DB" 'SELECT COUNT(*) FROM annotations;' 2>&1)"
  echo "analyses   = $(sqlite3 "$DB" 'SELECT COUNT(*) FROM ai_analyses;' 2>&1)"
  echo "--- review rows ---"
  sqlite3 "$DB" 'SELECT id, status, title FROM reviews;' 2>&1
  echo "--- checkpoint WAL into main db ---"
  sqlite3 "$DB" 'PRAGMA wal_checkpoint(TRUNCATE); PRAGMA journal_mode=WAL;' 2>&1
  echo "--- after checkpoint, files ---"
  ls -la "$HOME/Documents/ChartQuest QA/" 2>&1 | grep -i sqlite
} > dbcheck.log 2>&1
echo "done — wrote dbcheck.log"
sleep 1
