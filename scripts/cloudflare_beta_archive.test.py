#!/usr/bin/env python3

import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

import cloudflare_beta_archive as archive


def event(row_id, event_id, created_at, ts="2026-08-01T00:00:00Z", props=None):
    return {
        "id": row_id, "event_id": event_id, "player_id": "p-player",
        "session_id": "s-session", "name": "session_start", "ts": ts,
        "props": props or {"build": "build 367"}, "device": "desktop",
        "browser": "Chrome", "os": "macOS", "screen": "1440x900",
        "viewport": "1280x720", "created_at": created_at,
    }


def survey(row_id, response_id, created_at, rating=8, improvement="More practice"):
    return {
        "id": row_id, "response_id": response_id, "player_id": "p-player",
        "session_id": "s-session", "q1_rating": rating,
        "q2_hook": "Learning by playing", "q3_improvement": improvement,
        "q4_continue": "immediately", "q5_anything": "Good start",
        "seconds_taken": 45, "created_at": created_at,
    }


def snapshot(path, pulled_at, events, surveys, truncated=False):
    path.write_text(json.dumps({
        "pulled_at": pulled_at, "days": 0, "window_from": None,
        "pulled_by": "supabase-mcp", "truncated": truncated, "warnings": [],
        "events": events, "surveys": surveys,
        "prev_events": [], "prev_surveys": [],
    }), encoding="utf-8")


class BetaArchiveTests(unittest.TestCase):
    def test_merges_reset_epochs_and_semantic_reinsert(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            old = root / "old.json"
            new = root / "new.json"
            snapshot(old, "2026-08-05T12:00:00Z", [
                event(7, "e-a", "2026-08-04T00:00:00Z"),
                event(189, "e-reinsert", "2026-08-04T01:00:00Z", "2026-08-04T00:59:00Z"),
            ], [survey(5, "r-a", "2026-08-04T02:00:00Z")])
            snapshot(new, "2026-08-23T14:00:00Z", [
                event(1, "e-b", "2026-08-06T00:00:00Z"),
                event(616, "e-reinsert", "2026-08-10 01:00:00+00", "2026-08-04 00:59:00+00"),
            ], [survey(7, "r-b", "2026-08-06T02:00:00Z")])
            manifest, tables = archive.build([old, new], archive.PROJECT_REF)
            self.assertEqual(len(tables["beta_events"]), 3)
            self.assertEqual(len(tables["beta_surveys"]), 2)
            self.assertEqual(manifest["duplicate_event_ids"], 1)
            chosen = next(row for row in tables["beta_events"] if row["event_id"] == "e-reinsert")
            self.assertEqual(chosen["created_at"], "2026-08-04T01:00:00Z")

    def test_rejects_conflicting_event_reuse(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            one = root / "one.json"
            two = root / "two.json"
            snapshot(one, "2026-08-05T12:00:00Z", [event(1, "e-same", "2026-08-04T00:00:00Z")], [])
            changed = event(2, "e-same", "2026-08-10T00:00:00Z")
            changed["name"] = "play_clicked"
            snapshot(two, "2026-08-23T14:00:00Z", [changed], [])
            with self.assertRaisesRegex(archive.ArchiveError, "conflicting semantic payloads"):
                archive.build([one, two], archive.PROJECT_REF)

    def test_latest_survey_version_wins(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            one = root / "one.json"
            two = root / "two.json"
            snapshot(one, "2026-08-05T12:00:00Z", [], [survey(1, "r-same", "2026-08-04T00:00:00Z", 6)])
            later = survey(9, "r-same", "2026-08-04T00:00:00Z", 9, "More bosses")
            later["updated_at"] = "2026-08-22T00:00:00Z"
            snapshot(two, "2026-08-23T14:00:00Z", [], [later])
            manifest, tables = archive.build([one, two], archive.PROJECT_REF)
            self.assertEqual(tables["beta_surveys"][0]["q1_rating"], 9)
            self.assertEqual(manifest["versioned_response_ids"], 1)

    def test_rejects_reused_or_ambiguous_survey_identity(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            one = root / "one.json"
            two = root / "two.json"
            original = survey(1, "r-same", "2026-08-04T00:00:00Z", 6)
            changed_identity = survey(2, "r-same", "2026-08-04T00:00:00Z", 9)
            changed_identity["session_id"] = "s-other"
            snapshot(one, "2026-08-05T12:00:00Z", [], [original])
            snapshot(two, "2026-08-23T14:00:00Z", [], [changed_identity])
            with self.assertRaisesRegex(archive.ArchiveError, "different survey identity"):
                archive.build([one, two], archive.PROJECT_REF)

            tied = survey(2, "r-same", "2026-08-04T00:00:00Z", 9)
            tied["updated_at"] = original["created_at"]
            snapshot(two, "2026-08-23T14:00:00Z", [], [tied])
            with self.assertRaisesRegex(archive.ArchiveError, "conflicting latest survey payloads"):
                archive.build([one, two], archive.PROJECT_REF)

    def test_rejects_truncated_wrong_project_and_duplicate_source_ids(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            bad = root / "bad.json"
            snapshot(bad, "2026-08-05T12:00:00Z", [event(1, "e-a", "2026-08-04T00:00:00Z")], [], True)
            with self.assertRaisesRegex(archive.ArchiveError, "truncated=false"):
                archive.build([bad], archive.PROJECT_REF)
            good = root / "good.json"
            snapshot(good, "2026-08-05T12:00:00Z", [
                event(1, "e-a", "2026-08-04T00:00:00Z"),
                event(1, "e-b", "2026-08-04T01:00:00Z"),
            ], [])
            with self.assertRaisesRegex(archive.ArchiveError, "repeats source"):
                archive.build([good], archive.PROJECT_REF)
            one = root / "one.json"
            snapshot(one, "2026-08-05T12:00:00Z", [], [])
            with self.assertRaisesRegex(archive.ArchiveError, "wrong project ref"):
                archive.build([one], "wrong")

    def test_generated_sql_applies_idempotently_and_rolls_back_only_inserted_rows(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "source.json"
            out = root / "bundle"
            multiline = survey(1, "r-a", "2026-08-04T01:00:00Z")
            multiline["q2_hook"] = "Line one\nBEGIN TRANSACTION;\nCOMMIT;\nLine two"
            snapshot(source, "2026-08-05T12:00:00Z", [event(1, "e-a", "2026-08-04T00:00:00Z")], [
                multiline,
            ])
            manifest, tables = archive.build([source], archive.PROJECT_REF)
            archive.write_bundle(out, manifest, tables)
            db = sqlite3.connect(":memory:")
            migration = (Path(__file__).resolve().parents[1] / "cloudflare" / "migrations" / "0001_beta.sql").read_text(encoding="utf-8")
            db.executescript(migration)
            sql = (out / "cloudflare-import-beta.sql").read_text(encoding="utf-8")
            db.executescript(sql)
            db.executescript(sql)
            self.assertEqual(db.execute("select count(*) from beta_events").fetchone()[0], 1)
            self.assertEqual(db.execute("select count(*) from beta_surveys").fetchone()[0], 1)
            self.assertEqual(db.execute("select count(*) from beta_migration_import_state").fetchone()[0], 2)
            rollback = (out / "cloudflare-rollback-beta.sql").read_text(encoding="utf-8")
            db.executescript(rollback)
            self.assertEqual(db.execute("select count(*) from beta_events").fetchone()[0], 0)
            self.assertEqual(db.execute("select count(*) from beta_surveys").fetchone()[0], 0)
            for item in out.iterdir():
                self.assertEqual(item.stat().st_mode & 0o777, 0o600)
            self.assertEqual(out.stat().st_mode & 0o777, 0o700)
            wrangler_import = (out / "cloudflare-import-beta-wrangler.sql").read_text(encoding="utf-8")
            wrangler_rollback = (out / "cloudflare-rollback-beta-wrangler.sql").read_text(encoding="utf-8")
            self.assertIn(multiline["q2_hook"], wrangler_import)
            self.assertFalse(wrangler_import.startswith(archive.BETA_AUDIT_SCHEMA_SQL + "\nBEGIN TRANSACTION;\n"))
            self.assertFalse(wrangler_import.endswith("\nCOMMIT;\n"))
            self.assertFalse(wrangler_rollback.startswith(archive.BETA_AUDIT_SCHEMA_SQL + "\nBEGIN TRANSACTION;\n"))
            self.assertFalse(wrangler_rollback.endswith("\nCOMMIT;\n"))
            db.executescript(wrangler_import)
            self.assertEqual(db.execute("select count(*) from beta_events").fetchone()[0], 1)
            self.assertEqual(db.execute("select count(*) from beta_surveys").fetchone()[0], 1)
            self.assertEqual(db.execute("select q2_hook from beta_surveys").fetchone()[0], multiline["q2_hook"])


if __name__ == "__main__":
    unittest.main()
