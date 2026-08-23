#!/usr/bin/env python3
"""Regression tests for the offline Supabase -> canonical Cloudflare bundle."""

from __future__ import annotations

import json
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import cloudflare_import as importer
import cloudflare_reconcile as reconcile


FIXTURE = SCRIPT_DIR / "cloudflare_import_fixtures" / "complete_export.json"
EXPECTED = SCRIPT_DIR / "cloudflare_import_fixtures" / "expected_evidence.json"
USER_ID = "11111111-1111-4111-8111-111111111111"
OPEN_CONNECTIONS: list[sqlite3.Connection] = []


def database(migration: str) -> sqlite3.Connection:
    connection = sqlite3.connect(":memory:")
    connection.executescript((ROOT / "cloudflare" / "migrations" / migration).read_text(encoding="utf-8"))
    OPEN_CONNECTIONS.append(connection)
    return connection


class ImportBundleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.bundle = importer.build_bundle(FIXTURE)

    def tearDown(self) -> None:
        while OPEN_CONNECTIONS:
            OPEN_CONNECTIONS.pop().close()

    def apply_beta(self, connection: sqlite3.Connection) -> None:
        connection.executescript(self.bundle["beta_import_sql"])

    def apply_app(self, connection: sqlite3.Connection) -> None:
        connection.executescript(self.bundle["app_import_sql"])

    def refresh_table_proof(self, doc: dict, table: str) -> None:
        schema, source_table = table.split(".", 1)
        rows = doc[schema][source_table]
        keys = importer.SOURCE_TABLE_KEYS[table]
        digest = reconcile.rows_hash(rows)
        cursor_out = [rows[-1][key] for key in keys] if rows else None
        doc["_meta"]["export_evidence"]["tables"][table] = {
            "source_row_count": len(rows),
            "source_rows_sha256": digest,
            "key_columns": list(keys),
            "pagination": {
                "mode": "keyset", "complete": True, "page_count": 1,
                "pages": [{
                    "page_index": 0, "row_count": len(rows), "rows_sha256": digest,
                    "cursor_in": None, "cursor_out": cursor_out, "has_more": False,
                }],
            },
        }

    def clean_bundle(self) -> dict:
        doc = json.loads(FIXTURE.read_text(encoding="utf-8"))
        doc["public"]["player_mastery"] = doc["public"]["player_mastery"][:1]
        self.refresh_table_proof(doc, "public.player_mastery")
        doc["public"].pop("content_future_experiment")
        with tempfile.TemporaryDirectory() as temp_dir:
            source = Path(temp_dir) / "complete.json"
            source.write_text(json.dumps(doc), encoding="utf-8")
            return importer.build_bundle(source)

    def landed_export(self, bundle: dict) -> tuple[sqlite3.Connection, sqlite3.Connection, dict]:
        beta = database("0001_beta.sql")
        app = database("0002_app.sql")
        beta.executescript(bundle["beta_import_sql"])
        app.executescript(bundle["app_import_sql"])
        tables: dict[str, list[dict]] = {}
        def exported(connection: sqlite3.Connection, table: str) -> list[dict]:
            cursor = connection.execute(f"SELECT * FROM {table}")
            columns = [item[0] for item in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
        for table in bundle["normalized"]["tables"]:
            connection = app if table.startswith("app_") else beta
            tables[table] = exported(connection, table)
        for table in (
            "app_migration_runs", "app_migration_ledger", "app_migration_quarantine",
            "app_migration_source_archive", "app_migration_import_state",
            "app_migration_reconciliation",
        ):
            tables[table] = exported(app, table)
        for table in ("beta_migration_runs", "beta_migration_import_state", "beta_migration_conflicts"):
            tables[table] = exported(beta, table)
        return app, beta, {"tables": tables}

    def test_bundle_is_deterministic_and_never_writes_credentials_or_claims(self) -> None:
        again = importer.build_bundle(FIXTURE)
        self.assertEqual(
            json.dumps(self.bundle, ensure_ascii=False, sort_keys=True),
            json.dumps(again, ensure_ascii=False, sort_keys=True),
        )
        encoded = json.dumps(self.bundle, ensure_ascii=False, sort_keys=True)
        self.assertNotIn("must-never-appear-in-output", encoded)
        self.assertNotIn("must-never-appear-either", encoded)
        self.assertNotIn("claim_token", encoded)
        self.assertNotIn("app_account_claims", self.bundle["normalized"]["tables"])
        self.assertEqual(self.bundle["normalized"]["redactions"]["credential_values_written"], 0)

    def test_fixture_count_and_hash_evidence_is_pinned(self) -> None:
        expected = json.loads(EXPECTED.read_text(encoding="utf-8"))
        report = self.bundle["report"]
        actual = {
            "batch_id": self.bundle["normalized"]["batch_id"],
            "source_manifest_sha256": self.bundle["normalized"]["source_manifest_sha256"],
            "source_rows": report["source"]["rows"],
            "source_rows_sha256": report["source"]["rows_sha256"],
            "target_rows": report["target"]["rows"],
            "quarantine_rows": report["quarantine"]["rows"],
            "quarantine_blocking": report["quarantine"]["blocking"],
            "report_sha256": report["report_sha256"],
            "table_counts": {table: evidence["rows"] for table, evidence in report["target"]["tables"].items()},
        }
        self.assertEqual(actual, expected)

    def test_all_required_domains_use_canonical_app_tables(self) -> None:
        tables = self.bundle["normalized"]["tables"]
        required = {
            "beta_events", "beta_surveys", "app_identities", "app_profiles",
            "app_journal_heads", "app_journal_versions", "app_journal_trades",
            "app_journal_notes", "app_journal_changes", "app_daily_streak",
            "app_mastery", "app_mastery_quarantine", "app_bug_reports",
            "app_site_visits", "app_content_events", "app_content_replays",
            "app_content_briefs", "app_content_assets", "app_content_generated",
            "app_content_exports", "app_published_posts", "app_performance_snapshots",
        }
        self.assertTrue(required.issubset(tables), required - set(tables))
        forbidden = {"auth_users", "profiles", "journal_trades", "admins", "content_records"}
        self.assertFalse(forbidden & set(tables))
        self.assertEqual(set(self.bundle["normalized"]["databases"]), {"BETA_DB", "APP_DB"})
        profile = tables["app_profiles"][0]
        self.assertEqual(profile["source_updated_at"], "2026-08-21T10:00:00Z")
        self.assertNotIn("initial_sync_completed_at", profile)
        self.assertNotIn("initial_sync_receipt_id", profile)

    def test_survey_live_row_wins_and_split_sql_is_idempotent(self) -> None:
        beta = database("0001_beta.sql")
        beta.execute(
            """INSERT INTO beta_surveys
            (response_id,player_id,session_id,q1_rating,q2_hook,q3_improvement,q4_continue,
             q5_anything,seconds_taken,created_at,updated_at,ingest_source)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                "survey-1", "live-player", "live-session", 10, "Live answer", "Nothing",
                "later", "Cloudflare row", 5, "2026-08-22T00:00:00Z",
                "2026-08-22T00:00:00Z", "cloudflare",
            ),
        )
        self.apply_beta(beta)
        self.apply_beta(beta)
        self.assertEqual(
            beta.execute("SELECT player_id,q1_rating,q2_hook,ingest_source FROM beta_surveys WHERE response_id='survey-1'").fetchone(),
            ("live-player", 10, "Live answer", "cloudflare"),
        )
        self.assertEqual(beta.execute("SELECT count(*) FROM beta_migration_conflicts").fetchone()[0], 1)
        self.assertEqual(beta.execute("SELECT count(*) FROM beta_events").fetchone()[0], 1)

        app = database("0002_app.sql")
        self.apply_app(app)
        self.apply_app(app)
        self.assertEqual(app.execute("SELECT count(*) FROM app_migration_ledger").fetchone()[0], 27)
        self.assertEqual(app.execute("SELECT count(*) FROM app_migration_source_archive").fetchone()[0], 27)
        self.assertEqual(app.execute("SELECT count(*) FROM app_journal_versions").fetchone()[0], 1)

    def test_duplicate_trade_ids_preserve_source_but_import_only_current(self) -> None:
        trades = self.bundle["normalized"]["tables"]["app_journal_trades"]
        self.assertEqual(len(trades), 1)
        self.assertEqual(json.loads(trades[0]["trade_data"])["result"], "win")
        archived = [row for row in self.bundle["normalized"]["source_archive"] if row["source_table"] == "journal_trades"]
        self.assertEqual(len(archived), 2)
        self.assertEqual(sum(row["target_table"] == "app_journal_trades" for row in archived), 1)
        reasons = [row["reason"] for row in self.bundle["quarantine"]["rows"]]
        self.assertIn("duplicate_trade_id_version", reasons)
        self.assertIn("historical_journal_version_archived", reasons)

    def test_note_versions_are_lossless_with_one_baseline_current_note(self) -> None:
        notes = self.bundle["normalized"]["tables"]["app_journal_notes"]
        self.assertEqual(len(notes), 1)
        self.assertEqual(json.loads(notes[0]["note_data"])["text"], "second version")
        reverse = self.bundle["reverse"]["tables"]["public.journal_notes"]
        self.assertEqual(len(reverse), 2)
        self.assertEqual({json.loads(json.dumps(item["row"]))["id"] for item in reverse}, {401, 402})
        version = self.bundle["normalized"]["tables"]["app_journal_versions"][0]
        self.assertEqual((version["base_version"], version["version"]), (0, 1))

    def test_visit_overlap_is_not_double_counted_or_double_imported(self) -> None:
        visits = self.bundle["report"]["visits"]
        self.assertEqual(visits["raw_rows"], 3)
        self.assertEqual(visits["daily_rollup_total"], 2)
        self.assertEqual(visits["overlap_day_count"], 1)
        self.assertEqual(visits["effective_total_without_double_count"], 3)
        self.assertNotIn("app_site_visits_daily", self.bundle["normalized"]["tables"])
        app = database("0002_app.sql")
        self.apply_app(app)
        self.assertEqual(app.execute("SELECT count(*) FROM app_site_visits").fetchone()[0], 3)
        self.assertEqual(app.execute("SELECT sum(visit_count) FROM app_site_visits_daily").fetchone()[0], 3)

    def test_existing_visit_rollup_prevents_raw_history_mutation(self) -> None:
        app = database("0002_app.sql")
        app.execute(
            "INSERT INTO app_site_visits_daily(visit_date,path,visit_count,first_seen_at,last_seen_at) VALUES('2026-08-20','/',9,'2026-08-20T00:00:00Z','2026-08-20T23:00:00Z')"
        )
        self.apply_app(app)
        self.assertEqual(app.execute("SELECT visit_count FROM app_site_visits_daily WHERE visit_date='2026-08-20'").fetchone()[0], 9)
        self.assertEqual(app.execute("SELECT count(*) FROM app_site_visits WHERE substr(created_at,1,10)='2026-08-20'").fetchone()[0], 0)
        self.assertEqual(app.execute("SELECT count(*) FROM app_site_visits WHERE substr(created_at,1,10)='2026-08-21'").fetchone()[0], 1)

    def test_unknown_mastery_category_has_runtime_and_audit_quarantine(self) -> None:
        mastery = self.bundle["normalized"]["tables"]["app_mastery"]
        self.assertEqual([(row["category_normalized"], row["score"]) for row in mastery], [("risk_management", 70)])
        runtime = self.bundle["normalized"]["tables"]["app_mastery_quarantine"]
        self.assertEqual(len(runtime), 1)
        self.assertEqual(runtime[0]["category_raw"], "psychology")
        rows = [row for row in self.bundle["quarantine"]["rows"] if row["reason"] == "ambiguous_mastery_category"]
        self.assertEqual(len(rows), 1)

    def test_warning_only_export_is_ready_for_apply(self) -> None:
        doc = json.loads(FIXTURE.read_text(encoding="utf-8"))
        doc["public"]["player_mastery"] = doc["public"]["player_mastery"][:1]
        self.refresh_table_proof(doc, "public.player_mastery")
        doc["public"].pop("content_future_experiment")
        with tempfile.TemporaryDirectory() as temp_dir:
            clean_path = Path(temp_dir) / "clean.json"
            clean_path.write_text(json.dumps(doc), encoding="utf-8")
            clean_bundle = importer.build_bundle(clean_path)
        self.assertEqual(clean_bundle["report"]["quarantine"]["blocking"], 0)
        self.assertEqual(clean_bundle["report"]["foreign_key_missing_total"], 0)
        self.assertTrue(clean_bundle["report"]["ready_for_apply"])

    def test_auth_session_rows_archive_only_safe_metadata(self) -> None:
        doc = {"auth": {"sessions": [{
            "id": "session-db-1", "user_id": USER_ID, "refresh_token": "refresh-secret",
            "auth_code": "authorization-secret", "created_at": "2026-08-20T00:00:00Z",
        }]}}
        with tempfile.TemporaryDirectory() as temp_dir:
            source = Path(temp_dir) / "auth-export.json"
            source.write_text(json.dumps(doc), encoding="utf-8")
            bundle = importer.build_bundle(source)
        encoded = json.dumps(bundle, sort_keys=True)
        self.assertNotIn("refresh-secret", encoded)
        self.assertNotIn("authorization-secret", encoded)
        archived = bundle["normalized"]["source_archive"][0]["source_row"]
        self.assertEqual(set(archived), {"id", "user_id", "created_at"})
        self.assertNotIn("app_sessions", bundle["normalized"]["tables"])

    def test_reverse_export_and_reconciliation_hashes_verify(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            importer.write_bundle(self.bundle, Path(temp_dir))
            result = reconcile.verify_bundle(Path(temp_dir))
        self.assertTrue(result["ok"], result)
        self.assertEqual(result["external_verification"]["status"], "pending")
        self.assertFalse(result["ready_to_mark_reconciled"])

    def test_complete_export_contract_requires_auth_public_and_beta_tables(self) -> None:
        base = json.loads(FIXTURE.read_text(encoding="utf-8"))
        for section, table in (("auth", "users"), ("public", "profiles"), ("public", "beta_surveys")):
            with self.subTest(table=f"{section}.{table}"), tempfile.TemporaryDirectory() as temp_dir:
                doc = json.loads(json.dumps(base))
                doc[section].pop(table)
                source = Path(temp_dir) / "incomplete.json"
                source.write_text(json.dumps(doc), encoding="utf-8")
                bundle = importer.build_bundle(source)
                self.assertFalse(bundle["normalized"]["source_contract"]["complete"])
                self.assertFalse(bundle["report"]["ready_for_apply"])
                missing = {row.get("source_table") for row in bundle["quarantine"]["rows"] if row["reason"] == "required_source_table_missing"}
                self.assertIn(table, missing)

    def test_truncated_required_table_fails_source_count_and_digest_proof(self) -> None:
        doc = json.loads(FIXTURE.read_text(encoding="utf-8"))
        doc["public"]["journal_trades"] = doc["public"]["journal_trades"][:1]
        with tempfile.TemporaryDirectory() as temp_dir:
            source = Path(temp_dir) / "truncated.json"
            source.write_text(json.dumps(doc), encoding="utf-8")
            bundle = importer.build_bundle(source)
        reasons = {row["reason"] for row in bundle["quarantine"]["rows"]}
        self.assertFalse(bundle["normalized"]["source_contract"]["source_export_proof"]["verified"])
        self.assertFalse(bundle["report"]["ready_for_apply"])
        self.assertIn("source_table_count_mismatch", reasons)
        self.assertIn("source_table_digest_mismatch", reasons)

    def test_source_generated_export_proof_is_mandatory(self) -> None:
        doc = json.loads(FIXTURE.read_text(encoding="utf-8"))
        doc["_meta"].pop("export_evidence")
        with tempfile.TemporaryDirectory() as temp_dir:
            source = Path(temp_dir) / "unattested.json"
            source.write_text(json.dumps(doc), encoding="utf-8")
            bundle = importer.build_bundle(source)
        self.assertFalse(bundle["normalized"]["source_contract"]["complete"])
        self.assertFalse(bundle["report"]["ready_for_apply"])
        self.assertIn("missing_source_export_proof", {row["reason"] for row in bundle["quarantine"]["rows"]})
        with tempfile.TemporaryDirectory() as temp_dir:
            importer.write_bundle(bundle, Path(temp_dir))
            verification = reconcile.verify_bundle(Path(temp_dir))
        self.assertFalse(verification["source_export_proof_verified"])
        self.assertFalse(verification["source_ready_for_apply"])
        self.assertFalse(verification["ready_to_mark_reconciled"])

    def test_wrong_source_count_or_digest_proof_fails_closed(self) -> None:
        cases = (
            ("source_row_count", 2, "source_table_count_mismatch"),
            ("source_rows_sha256", "0" * 64, "source_table_digest_mismatch"),
        )
        for field, value, reason in cases:
            with self.subTest(field=field), tempfile.TemporaryDirectory() as temp_dir:
                doc = json.loads(FIXTURE.read_text(encoding="utf-8"))
                doc["_meta"]["export_evidence"]["tables"]["public.profiles"][field] = value
                source = Path(temp_dir) / "wrong-proof.json"
                source.write_text(json.dumps(doc), encoding="utf-8")
                bundle = importer.build_bundle(source)
                self.assertFalse(bundle["report"]["ready_for_apply"])
                self.assertIn(reason, {row["reason"] for row in bundle["quarantine"]["rows"]})

    def test_incomplete_terminal_pagination_proof_fails_closed(self) -> None:
        doc = json.loads(FIXTURE.read_text(encoding="utf-8"))
        pagination = doc["_meta"]["export_evidence"]["tables"]["public.beta_surveys"]["pagination"]
        pagination["complete"] = False
        pagination["pages"][-1]["has_more"] = True
        with tempfile.TemporaryDirectory() as temp_dir:
            source = Path(temp_dir) / "incomplete-pagination.json"
            source.write_text(json.dumps(doc), encoding="utf-8")
            bundle = importer.build_bundle(source)
        self.assertFalse(bundle["report"]["ready_for_apply"])
        self.assertIn("incomplete_source_pagination_proof", {row["reason"] for row in bundle["quarantine"]["rows"]})

    def test_self_consistent_duplicate_page_still_fails_closed(self) -> None:
        doc = json.loads(FIXTURE.read_text(encoding="utf-8"))
        original = json.loads(json.dumps(doc["public"]["site_visits"]))
        doc["public"]["site_visits"].extend(json.loads(json.dumps(original)))
        evidence = doc["_meta"]["export_evidence"]["tables"]["public.site_visits"]
        digest = reconcile.rows_hash(doc["public"]["site_visits"])
        page_digest = reconcile.rows_hash(original)
        evidence["source_row_count"] = 6
        evidence["source_rows_sha256"] = digest
        evidence["pagination"] = {
            "mode": "keyset", "complete": True, "page_count": 2,
            "pages": [
                {"page_index": 0, "row_count": 3, "rows_sha256": page_digest,
                 "cursor_in": None, "cursor_out": [603], "has_more": True},
                {"page_index": 1, "row_count": 3, "rows_sha256": page_digest,
                 "cursor_in": [603], "cursor_out": [603], "has_more": False},
            ],
        }
        with tempfile.TemporaryDirectory() as temp_dir:
            source = Path(temp_dir) / "duplicate-page.json"
            source.write_text(json.dumps(doc), encoding="utf-8")
            bundle = importer.build_bundle(source)
        reasons = {row["reason"] for row in bundle["quarantine"]["rows"]}
        self.assertFalse(bundle["report"]["ready_for_apply"])
        self.assertIn("duplicate_source_pagination_key", reasons)
        self.assertIn("duplicate_source_pagination_page", reasons)

    def test_project_ref_proof_is_required_and_wrong_ref_fails_closed(self) -> None:
        base = json.loads(FIXTURE.read_text(encoding="utf-8"))
        cases = ((None, "missing_project_ref_proof"), ("wrongproject000000000", "wrong_project_ref"))
        for project_ref, reason in cases:
            with self.subTest(reason=reason), tempfile.TemporaryDirectory() as temp_dir:
                doc = json.loads(json.dumps(base))
                if project_ref is None:
                    doc.pop("_meta")
                else:
                    doc["_meta"]["project_ref"] = project_ref
                source = Path(temp_dir) / "export.json"
                source.write_text(json.dumps(doc), encoding="utf-8")
                bundle = importer.build_bundle(source)
                self.assertFalse(bundle["report"]["ready_for_apply"])
                self.assertFalse(bundle["normalized"]["source_contract"]["project_ref_verified"])
                self.assertIn(reason, {row["reason"] for row in bundle["quarantine"]["rows"]})

    def test_import_stays_pending_until_exact_external_d1_proof(self) -> None:
        bundle = self.clean_bundle()
        self.assertTrue(bundle["report"]["ready_for_apply"])
        app, _beta, target = self.landed_export(bundle)
        self.assertEqual({row[0] for row in app.execute("SELECT status FROM app_migration_runs")}, {"imported"})
        self.assertEqual(app.execute("SELECT count(*) FROM app_migration_reconciliation").fetchone()[0], 0)
        with tempfile.TemporaryDirectory() as temp_dir:
            bundle_dir = Path(temp_dir) / "bundle"
            target_file = Path(temp_dir) / "landed.json"
            importer.write_bundle(bundle, bundle_dir)
            target_file.write_text(json.dumps(target), encoding="utf-8")
            result = reconcile.verify_bundle(bundle_dir, target_file)
        self.assertTrue(result["ok"], result)
        self.assertEqual(result["external_verification"]["status"], "verified")
        self.assertTrue(result["ready_to_mark_reconciled"])
        self.assertIn("app_mark_reconciled_sql", result)
        app.executescript(result["app_mark_reconciled_sql"])
        self.assertEqual({row[0] for row in app.execute("SELECT status FROM app_migration_runs")}, {"reconciled"})
        self.assertEqual(
            app.execute("SELECT count(*) FROM app_migration_reconciliation").fetchone()[0],
            app.execute("SELECT count(*) FROM app_migration_runs").fetchone()[0],
        )

    def test_tampered_landed_value_fails_external_reconciliation(self) -> None:
        bundle = self.clean_bundle()
        _app, _beta, target = self.landed_export(bundle)
        target["tables"]["app_profiles"][0]["shells"] += 1
        with tempfile.TemporaryDirectory() as temp_dir:
            bundle_dir = Path(temp_dir) / "bundle"
            target_file = Path(temp_dir) / "tampered.json"
            importer.write_bundle(bundle, bundle_dir)
            target_file.write_text(json.dumps(target), encoding="utf-8")
            result = reconcile.verify_bundle(bundle_dir, target_file)
        self.assertFalse(result["ok"])
        self.assertEqual(result["external_verification"]["status"], "failed")
        self.assertFalse(result["ready_to_mark_reconciled"])
        self.assertNotIn("app_mark_reconciled_sql", result)
        self.assertEqual(result["target_comparison"]["tables"]["app_profiles"]["differing"], 1)

    def test_missing_landed_quarantine_evidence_fails_reconciliation(self) -> None:
        bundle = self.clean_bundle()
        _app, _beta, target = self.landed_export(bundle)
        self.assertTrue(target["tables"]["app_migration_quarantine"])
        target["tables"]["app_migration_quarantine"].pop()
        with tempfile.TemporaryDirectory() as temp_dir:
            bundle_dir = Path(temp_dir) / "bundle"
            target_file = Path(temp_dir) / "missing-quarantine.json"
            importer.write_bundle(bundle, bundle_dir)
            target_file.write_text(json.dumps(target), encoding="utf-8")
            result = reconcile.verify_bundle(bundle_dir, target_file)
        self.assertFalse(result["ok"])
        self.assertEqual(result["migration_audit_comparison"]["status"], "failed")
        self.assertGreater(result["migration_audit_comparison"]["failure_count"], 0)

    def test_destination_reconciliation_accepts_live_survey_and_detects_missing(self) -> None:
        target = json.loads(json.dumps(self.bundle["normalized"]["tables"]))
        target["beta_surveys"][0].update({
            "player_id": "cloudflare-player", "q1_rating": 10,
            "q2_hook": "Live response", "ingest_source": "cloudflare",
        })
        comparison = reconcile.compare_target(self.bundle["normalized"]["tables"], target)
        self.assertTrue(comparison["ok"], comparison)
        self.assertEqual(comparison["tables"]["beta_surveys"]["live_target_wins"], 1)
        target["beta_events"] = []
        missing = reconcile.compare_target(self.bundle["normalized"]["tables"], target)
        self.assertFalse(missing["ok"])
        self.assertEqual(missing["tables"]["beta_events"]["missing"], 1)

    def test_existing_app_row_wins_and_is_quarantined(self) -> None:
        app = database("0002_app.sql")
        app.execute(
            """INSERT INTO app_identities
            (id,email_normalized,email_original,source_provider,source_subject,status,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?)""",
            (USER_ID, "beta@example.test", "beta@example.test", "cloudflare", None, "active", "2026-08-22T00:00:00Z", "2026-08-22T00:00:00Z"),
        )
        app.execute(
            "INSERT INTO app_profiles(user_id,shells,player_level,xp,version,created_at,updated_at) VALUES(?,?,?,?,?,?,?)",
            (USER_ID, 999, 5, 9999, 0, "2026-08-22T00:00:00Z", "2026-08-22T00:00:00Z"),
        )
        self.apply_app(app)
        self.assertEqual(app.execute("SELECT shells,player_level,xp FROM app_profiles WHERE user_id=?", (USER_ID,)).fetchone(), (999, 5, 9999))
        reasons = {row[0] for row in app.execute("SELECT reason_code FROM app_migration_quarantine")}
        self.assertIn("existing_target_preserved", reasons)
        self.assertEqual(app.execute("SELECT password_hash FROM app_identities WHERE id=?", (USER_ID,)).fetchone()[0], None)

    def test_existing_live_journal_head_blocks_baseline_items(self) -> None:
        app = database("0002_app.sql")
        app.execute(
            """INSERT INTO app_identities
            (id,email_normalized,email_original,source_provider,source_subject,status,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?)""",
            (USER_ID, "beta@example.test", "beta@example.test", "cloudflare", None, "active", "2026-08-22T00:00:00Z", "2026-08-22T00:00:00Z"),
        )
        app.execute("INSERT INTO app_journal_heads(user_id,current_version,updated_at) VALUES(?,?,?)", (USER_ID, 0, "2026-08-22T00:00:00Z"))
        # This is a different live baseline than the import's payload.
        app.execute(
            "INSERT INTO app_journal_versions(user_id,version,base_version,request_id,payload_hash,created_at) VALUES(?,?,?,?,?,?)",
            (USER_ID, 1, 0, "live-request", "a" * 64, "2026-08-22T00:00:01Z"),
        )
        self.apply_app(app)
        self.assertEqual(app.execute("SELECT request_id FROM app_journal_versions WHERE user_id=?", (USER_ID,)).fetchone()[0], "live-request")
        self.assertEqual(app.execute("SELECT count(*) FROM app_journal_trades").fetchone()[0], 0)
        self.assertEqual(app.execute("SELECT count(*) FROM app_journal_notes").fetchone()[0], 0)
        self.assertIn("target_insert_blocked", {row[0] for row in app.execute("SELECT reason_code FROM app_migration_quarantine")})

    def test_admin_rows_never_become_cloudflare_authorization(self) -> None:
        tables = self.bundle["normalized"]["tables"]
        self.assertNotIn("admins", tables)
        self.assertNotIn("app_admins", tables)
        reason = [row for row in self.bundle["quarantine"]["rows"] if row["reason"] == "retired_supabase_admin_authorization"]
        self.assertEqual(len(reason), 1)
        archived = [row for row in self.bundle["normalized"]["source_archive"] if row["source_table"] == "admins"]
        self.assertEqual(archived[0]["disposition"], "archived_only")

    def test_rollbacks_keep_preexisting_live_survey_and_remove_unchanged_batch_rows(self) -> None:
        beta = database("0001_beta.sql")
        beta.execute(
            """INSERT INTO beta_surveys
            (response_id,player_id,session_id,q1_rating,q2_hook,q3_improvement,q4_continue,
             q5_anything,seconds_taken,created_at,updated_at,ingest_source)
            VALUES ('survey-1','live-player','live-session',10,'Live','None','later',NULL,5,
                    '2026-08-22T00:00:00Z','2026-08-22T00:00:00Z','cloudflare')"""
        )
        self.apply_beta(beta)
        beta.executescript(self.bundle["beta_rollback_sql"])
        self.assertEqual(beta.execute("SELECT q1_rating,ingest_source FROM beta_surveys").fetchone(), (10, "cloudflare"))
        self.assertEqual(beta.execute("SELECT count(*) FROM beta_events").fetchone()[0], 0)

        app = database("0002_app.sql")
        self.apply_app(app)
        app.executescript(self.bundle["app_rollback_sql"])
        for table in self.bundle["normalized"]["databases"]["APP_DB"]["tables"]:
            self.assertEqual(app.execute(f"SELECT count(*) FROM {table}").fetchone()[0], 0, table)
        self.assertEqual(app.execute("SELECT count(*) FROM app_migration_ledger").fetchone()[0], 27)
        self.assertTrue(all(row[0] == "rolled_back" for row in app.execute("SELECT status FROM app_migration_runs")))


if __name__ == "__main__":
    unittest.main(verbosity=2)
