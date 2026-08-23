#!/usr/bin/env python3
"""Deterministic reconciliation for ChartQuest Supabase -> Cloudflare bundles.

This module deliberately has no network or credential handling.  It verifies an
offline bundle made by ``cloudflare_import.py`` and can compare that bundle with
a JSON export from D1 after an apply.  Target exports may be either a directory
of ``<table>.json`` files or one JSON object whose keys are table names.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, Optional, Sequence, Tuple


FORMAT = "chartquest-cloudflare-reconciliation-v1"
NORMALIZED_FILE = "cloudflare-import.json"
REPORT_FILE = "cloudflare-reconciliation.json"
REVERSE_FILE = "cloudflare-reverse-export.json"
QUARANTINE_FILE = "cloudflare-quarantine.json"

AUDIT_KEYS: Dict[str, Tuple[str, ...]] = {
    "app_migration_runs": ("run_id",),
    "app_migration_ledger": ("source_table", "source_pk"),
    "app_migration_quarantine": ("run_id", "source_table", "source_pk", "reason_code"),
    "app_migration_source_archive": ("run_id", "source_table", "source_pk"),
    "app_migration_import_state": ("run_id", "target_table", "target_pk"),
    "app_migration_reconciliation": ("run_id", "dataset"),
    "beta_migration_runs": ("run_id",),
    "beta_migration_import_state": ("run_id", "target_table", "target_pk"),
    "beta_migration_conflicts": ("run_id", "target_table", "target_pk", "reason"),
}

TIMESTAMP_FIELDS = (
    "created_at", "updated_at", "ts", "day", "exported_at", "published_at",
    "captured_at", "last_sign_in_at", "confirmed_at", "added_at",
    "source_created_at", "source_updated_at", "last_seen_at", "first_seen_at",
)

# Only these projected fields are compared after a D1 import.  Migration audit
# columns are included for the tables created by the offline importer, while the
# two pre-existing beta tables keep their Build 368 runtime shape.
TABLE_KEYS: Dict[str, Tuple[str, ...]] = {
    "beta_events": ("event_id",),
    "beta_surveys": ("response_id",),
    "app_identities": ("id",),
    "app_profiles": ("user_id",),
    "app_journal_heads": ("user_id",),
    "app_journal_versions": ("user_id", "version"),
    "app_journal_trades": ("user_id", "trade_id"),
    "app_journal_notes": ("user_id", "note_id"),
    "app_journal_changes": ("user_id", "journal_version", "item_kind", "item_id"),
    "app_daily_streak": ("user_id",),
    "app_mastery": ("owner_key", "category_raw"),
    "app_mastery_quarantine": ("quarantine_key",),
    "app_bug_reports": ("request_id",),
    "app_site_visits": ("visit_id",),
    "app_site_visits_daily": ("visit_date", "path"),
    "app_content_events": ("event_id",),
    "app_content_replays": ("replay_id",),
    "app_content_briefs": ("brief_key",),
    "app_content_assets": ("asset_key",),
    "app_content_generated": ("generated_key",),
    "app_content_exports": ("export_key",),
    "app_published_posts": ("post_key",),
    "app_performance_snapshots": ("snapshot_key",),
}


def canonical_json(value: Any) -> str:
    """Stable, lossless JSON representation used for every hash."""
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def stable_hash(value: Any) -> str:
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def rows_hash(rows: Iterable[Mapping[str, Any]]) -> str:
    encoded = sorted(canonical_json(dict(row)) for row in rows)
    return hashlib.sha256(("\n".join(encoded) + ("\n" if encoded else "")).encode("utf-8")).hexdigest()


def _parse_time(value: Any) -> Optional[datetime]:
    if value is None or value == "":
        return None
    text = str(value).strip()
    if not text:
        return None
    if len(text) == 10 and text[4:5] == "-" and text[7:8] == "-":
        text += "T00:00:00+00:00"
    elif text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def time_bounds(rows: Sequence[Mapping[str, Any]]) -> Dict[str, Any]:
    values: List[Tuple[datetime, str, str]] = []
    unreadable = 0
    for row in rows:
        found = False
        for field in TIMESTAMP_FIELDS:
            value = row.get(field)
            if value in (None, ""):
                continue
            found = True
            parsed = _parse_time(value)
            if parsed is None:
                unreadable += 1
            else:
                values.append((parsed, str(value), field))
            break
        if not found:
            continue
    values.sort(key=lambda item: (item[0], item[1], item[2]))
    return {
        "min": values[0][1] if values else None,
        "max": values[-1][1] if values else None,
        "unparseable": unreadable,
    }


def _key(row: Mapping[str, Any], fields: Sequence[str]) -> str:
    return "\u241f".join("" if row.get(field) is None else str(row.get(field)) for field in fields)


def _fk_report(
    normalized: Mapping[str, Sequence[Mapping[str, Any]]]
) -> List[Dict[str, Any]]:
    relations = [
        ("app_profiles", ("user_id",), "app_identities", ("id",), False),
        ("app_journal_heads", ("user_id",), "app_identities", ("id",), False),
        ("app_journal_versions", ("user_id",), "app_identities", ("id",), False),
        ("app_journal_trades", ("user_id",), "app_identities", ("id",), False),
        ("app_journal_notes", ("user_id",), "app_identities", ("id",), False),
        ("app_journal_changes", ("user_id", "journal_version"), "app_journal_versions", ("user_id", "version"), False),
        ("app_daily_streak", ("user_id",), "app_identities", ("id",), False),
        ("app_mastery", ("user_id",), "app_identities", ("id",), True),
        ("app_mastery_quarantine", ("user_id",), "app_identities", ("id",), True),
        ("app_bug_reports", ("user_id",), "app_identities", ("id",), True),
        ("app_content_replays", ("event_id",), "app_content_events", ("event_id",), True),
        ("app_content_briefs", ("event_id",), "app_content_events", ("event_id",), True),
        ("app_content_assets", ("brief_key",), "app_content_briefs", ("brief_key",), True),
        ("app_content_generated", ("brief_key",), "app_content_briefs", ("brief_key",), True),
        ("app_published_posts", ("asset_key",), "app_content_assets", ("asset_key",), True),
        ("app_performance_snapshots", ("post_key",), "app_published_posts", ("post_key",), True),
    ]
    output: List[Dict[str, Any]] = []
    for child_table, child_fields, parent_table, parent_fields, nullable in relations:
        parents = {
            _key(row, parent_fields)
            for row in normalized.get(parent_table, [])
            if all(row.get(field) not in (None, "") for field in parent_fields)
        }
        checked = 0
        missing: List[str] = []
        for row in normalized.get(child_table, []):
            vals = [row.get(field) for field in child_fields]
            if any(value in (None, "") for value in vals):
                if nullable:
                    continue
                missing.append(_key(row, TABLE_KEYS.get(child_table, child_fields)))
                continue
            checked += 1
            value = _key(row, child_fields)
            if value not in parents:
                missing.append(value)
        output.append({
            "child": child_table,
            "fields": list(child_fields),
            "parent": parent_table,
            "parent_fields": list(parent_fields),
            "checked": checked,
            "missing_count": len(missing),
            "missing_keys_hash": stable_hash(sorted(missing)),
            "missing_keys": sorted(missing)[:50],
            "truncated": len(missing) > 50,
        })
    return output


def _visit_report(normalized: Mapping[str, Sequence[Mapping[str, Any]]]) -> Dict[str, Any]:
    raw_by_day: Counter[str] = Counter()
    unreadable_raw = 0
    raw_rows = normalized.get("app_site_visits", normalized.get("site_visits", []))
    daily_rows = normalized.get("app_site_visits_daily", normalized.get("site_visits_daily", []))
    for row in raw_rows:
        parsed = _parse_time(row.get("created_at") or row.get("ts"))
        if parsed is None:
            unreadable_raw += 1
            continue
        raw_by_day[parsed.date().isoformat()] += 1

    daily_by_day: Dict[str, int] = {}
    invalid_daily = 0
    for row in daily_rows:
        day = str(row.get("visit_date") or row.get("day") or "")
        try:
            visits = int(row.get("visit_count") if row.get("visit_count") is not None else row.get("visits"))
        except (TypeError, ValueError):
            invalid_daily += 1
            continue
        if not day:
            invalid_daily += 1
            continue
        daily_by_day[day] = visits

    overlap_days = sorted(set(raw_by_day) & set(daily_by_day))
    details = [
        {
            "day": day,
            "raw_rows": raw_by_day[day],
            "daily_rollup": daily_by_day[day],
            "delta": raw_by_day[day] - daily_by_day[day],
        }
        for day in overlap_days
    ]
    # rollup_site_visits writes a complete daily total before pruning old raw
    # rows.  Raw and daily therefore overlap by design.  The effective total
    # uses the rollup when present and raw only for days with no rollup.
    effective = sum(daily_by_day.values()) + sum(
        count for day, count in raw_by_day.items() if day not in daily_by_day
    )
    return {
        "rule": "daily-rollup-wins-for-overlap; never add raw and daily for the same UTC day",
        "raw_rows": sum(raw_by_day.values()),
        "daily_rollup_total": sum(daily_by_day.values()),
        "effective_total_without_double_count": effective,
        "overlap_day_count": len(overlap_days),
        "overlap": details,
        "unparseable_raw": unreadable_raw,
        "invalid_daily": invalid_daily,
    }


def build_report(
    normalized: Mapping[str, Sequence[Mapping[str, Any]]],
    archive: Sequence[Mapping[str, Any]],
    quarantine: Sequence[Mapping[str, Any]],
    batch_id: str,
    source_manifest_hash: str,
    redactions: Optional[Mapping[str, Any]] = None,
) -> Dict[str, Any]:
    tables: Dict[str, Any] = {}
    for table in sorted(normalized):
        rows = [dict(row) for row in normalized[table]]
        keys = TABLE_KEYS.get(table, ("source_row_hash",))
        key_values = [_key(row, keys) for row in rows]
        tables[table] = {
            "rows": len(rows),
            "rows_sha256": rows_hash(rows),
            "keys_sha256": stable_hash(sorted(key_values)),
            "duplicate_key_count": len(key_values) - len(set(key_values)),
            "timestamps": time_bounds(rows),
        }

    source_groups: Dict[str, List[Mapping[str, Any]]] = defaultdict(list)
    for item in archive:
        name = f"{item.get('source_schema') or 'public'}.{item.get('source_table') or '__unknown__'}"
        source_groups[name].append(item)
    source_tables = {
        name: {
            "rows": len(rows),
            "rows_sha256": rows_hash([{"row": row.get("source_row"), "hash": row.get("source_row_hash")} for row in rows]),
            "dispositions": dict(sorted(Counter(str(row.get("disposition")) for row in rows).items())),
            "timestamps": time_bounds([
                row.get("source_row") if isinstance(row.get("source_row"), dict) else {}
                for row in rows
            ]),
        }
        for name, rows in sorted(source_groups.items())
    }
    reasons = Counter(str(item.get("reason") or "unknown") for item in quarantine)
    severities = Counter(str(item.get("severity") or "error") for item in quarantine)
    fk = _fk_report(normalized)
    blocking = sum(1 for item in quarantine if item.get("severity", "error") == "error")
    fk_missing = sum(item["missing_count"] for item in fk)
    dispositions = Counter(str(item.get("disposition") or "unknown") for item in archive)
    report = {
        "format": FORMAT,
        "batch_id": batch_id,
        "source_manifest_sha256": source_manifest_hash,
        "ready_for_apply": blocking == 0 and fk_missing == 0,
        "source": {
            "rows": len(archive),
            "rows_sha256": rows_hash(archive),
            "tables": source_tables,
            "dispositions": dict(sorted(dispositions.items())),
        },
        "target": {
            "rows": sum(len(rows) for rows in normalized.values()),
            "tables": tables,
        },
        "quarantine": {
            "rows": len(quarantine),
            "rows_sha256": rows_hash(quarantine),
            "blocking": blocking,
            "by_reason": dict(sorted(reasons.items())),
            "by_severity": dict(sorted(severities.items())),
        },
        "foreign_keys": fk,
        "foreign_key_missing_total": fk_missing,
        "visits": _visit_report(normalized),
        "redactions": dict(redactions or {}),
    }
    report["report_sha256"] = stable_hash(report)
    return report


def _read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _unwrap_rows(value: Any) -> Optional[List[Dict[str, Any]]]:
    if isinstance(value, list):
        # Wrangler --json commonly returns [{"results": [...], ...}].
        if len(value) == 1 and isinstance(value[0], dict) and isinstance(value[0].get("results"), list):
            value = value[0]["results"]
        if all(isinstance(row, dict) for row in value):
            return [dict(row) for row in value]
    if isinstance(value, dict):
        for key in ("rows", "results", "data"):
            rows = value.get(key)
            if isinstance(rows, list) and all(isinstance(row, dict) for row in rows):
                return [dict(row) for row in rows]
    return None


def load_target_export(path: Path) -> Dict[str, List[Dict[str, Any]]]:
    output: Dict[str, List[Dict[str, Any]]] = {}
    if path.is_dir():
        for child in sorted(path.rglob("*.json")):
            rows = _unwrap_rows(_read_json(child))
            if rows is not None:
                output[child.stem] = rows
        return output
    doc = _read_json(path)
    if isinstance(doc, dict) and isinstance(doc.get("tables"), dict):
        doc = doc["tables"]
    if isinstance(doc, dict):
        for table, value in doc.items():
            rows = _unwrap_rows(value)
            if rows is not None:
                output[str(table)] = rows
    return output


def compare_target(
    expected: Mapping[str, Sequence[Mapping[str, Any]]],
    actual: Mapping[str, Sequence[Mapping[str, Any]]],
) -> Dict[str, Any]:
    output: Dict[str, Any] = {}
    failures = 0
    for table in sorted(expected):
        keys = TABLE_KEYS.get(table, ("source_row_hash",))
        exp_map = {_key(row, keys): dict(row) for row in expected[table]}
        got_map = {_key(row, keys): dict(row) for row in actual.get(table, [])}
        missing: List[str] = []
        differing: List[str] = []
        live_wins: List[str] = []
        matched = 0
        for key, exp in exp_map.items():
            got = got_map.get(key)
            if got is None:
                missing.append(key)
                continue
            fields = [field for field in exp if field not in ("migration_batch",)]
            same = all(got.get(field) == exp.get(field) for field in fields)
            if same:
                matched += 1
            elif str(got.get("ingest_source") or "") == "cloudflare":
                # A live post-cutover row deliberately beats Supabase history.
                live_wins.append(key)
            else:
                differing.append(key)
        failures += len(missing) + len(differing)
        output[table] = {
            "expected": len(exp_map),
            "expected_rows_sha256": rows_hash(exp_map.values()),
            "actual_rows": len(got_map),
            "actual_rows_sha256": rows_hash(got_map.values()),
            "actual_expected_keys_projection_sha256": rows_hash([
                {field: got_map[key].get(field) for field in exp_map[key] if field != "migration_batch"}
                for key in sorted(set(exp_map) & set(got_map))
            ]),
            "matched": matched,
            "live_target_wins": len(live_wins),
            "missing": len(missing),
            "differing": len(differing),
            "extra_target_rows": len(set(got_map) - set(exp_map)),
            "missing_keys": missing[:50],
            "differing_keys": differing[:50],
            "live_target_win_keys": live_wins[:50],
        }
    return {"ok": failures == 0, "failure_count": failures, "tables": output}


def _projected_equal(expected: Mapping[str, Any], actual: Mapping[str, Any], ignored: Sequence[str] = ()) -> bool:
    ignored_set = set(ignored)
    return all(actual.get(field) == value for field, value in expected.items() if field not in ignored_set)


def compare_migration_audit(
    normalized_doc: Mapping[str, Any], actual: Mapping[str, Sequence[Mapping[str, Any]]]
) -> Dict[str, Any]:
    """Fail-closed proof for source archive, ledger, quarantine and pending flags."""
    audit = normalized_doc.get("audit_plan") if isinstance(normalized_doc.get("audit_plan"), dict) else {}
    batch_id = str(normalized_doc.get("batch_id") or "")
    manifest_hash = str(normalized_doc.get("source_manifest_sha256") or "")
    failures: List[Dict[str, Any]] = []
    required = set(AUDIT_KEYS)
    missing_tables = sorted(table for table in required if table not in actual)
    for table in missing_tables:
        failures.append({"reason": "audit_table_missing", "table": table})

    def indexed(table: str) -> Dict[str, Dict[str, Any]]:
        fields = AUDIT_KEYS[table]
        return {_key(row, fields): dict(row) for row in actual.get(table, [])}

    actual_quarantine = indexed("app_migration_quarantine")
    quarantine_by_source: Dict[Tuple[str, str], List[Mapping[str, Any]]] = defaultdict(list)
    for row in actual.get("app_migration_quarantine", []):
        quarantine_by_source[(str(row.get("source_table") or ""), str(row.get("source_pk") or ""))].append(row)

    archive_actual = indexed("app_migration_source_archive")
    for row in audit.get("source_archive", []):
        key = _key(row, AUDIT_KEYS["app_migration_source_archive"])
        got = archive_actual.get(key)
        if got is None:
            failures.append({"reason": "source_archive_row_missing", "key": key})
        elif not _projected_equal(row, got):
            failures.append({"reason": "source_archive_row_tampered", "key": key})

    ledger_actual = indexed("app_migration_ledger")
    for row in audit.get("ledger", []):
        key = _key(row, AUDIT_KEYS["app_migration_ledger"])
        got = ledger_actual.get(key)
        if got is None:
            failures.append({"reason": "ledger_row_missing", "key": key})
            continue
        static_fields = {field: value for field, value in row.items() if field != "status"}
        if not _projected_equal(static_fields, got):
            failures.append({"reason": "ledger_row_tampered", "key": key})
            continue
        if got.get("status") != row.get("status"):
            conflict_rows = quarantine_by_source.get((str(row.get("source_table")), str(row.get("source_pk"))), [])
            conflict_proved = any(item.get("reason_code") in {"existing_target_preserved", "target_insert_blocked"} for item in conflict_rows)
            if got.get("status") not in {"duplicate", "quarantined"} or not conflict_proved:
                failures.append({"reason": "ledger_status_unproved", "key": key, "status": got.get("status")})

    for row in audit.get("quarantine", []):
        key = _key(row, AUDIT_KEYS["app_migration_quarantine"])
        got = actual_quarantine.get(key)
        if got is None:
            failures.append({"reason": "quarantine_row_missing", "key": key})
        elif not _projected_equal(row, got, ("id",)):
            failures.append({"reason": "quarantine_row_tampered", "key": key})

    run_actual = indexed("app_migration_runs")
    ledger_rows = list(actual.get("app_migration_ledger", []))
    quarantine_rows = list(actual.get("app_migration_quarantine", []))
    for row in audit.get("runs", []):
        key = _key(row, AUDIT_KEYS["app_migration_runs"])
        got = run_actual.get(key)
        if got is None:
            failures.append({"reason": "migration_run_missing", "key": key})
            continue
        expected_static = {
            field: value for field, value in row.items()
            if field not in {"imported_count", "quarantine_count"}
        }
        if not _projected_equal(expected_static, got):
            failures.append({"reason": "migration_run_tampered_or_prematurely_reconciled", "key": key, "status": got.get("status")})
        expected_imported = sum(1 for item in ledger_rows if item.get("run_id") == row.get("run_id") and item.get("status") == "imported")
        expected_quarantine = sum(1 for item in quarantine_rows if item.get("run_id") == row.get("run_id"))
        if got.get("imported_count") != expected_imported or got.get("quarantine_count") != expected_quarantine:
            failures.append({"reason": "migration_run_counts_mismatch", "key": key})

    # Import itself must never claim external reconciliation.
    if actual.get("app_migration_reconciliation"):
        failures.append({"reason": "premature_reconciliation_rows_present", "rows": len(actual["app_migration_reconciliation"])})

    expected_app_state: Dict[str, Dict[str, Any]] = {}
    for table, rows in normalized_doc.get("databases", {}).get("APP_DB", {}).get("tables", {}).items():
        for row in rows:
            target_key = _key(row, TABLE_KEYS[table])
            key = _key({"run_id": batch_id, "target_table": table, "target_pk": target_key}, AUDIT_KEYS["app_migration_import_state"])
            expected_app_state[key] = {"run_id": batch_id, "target_table": table, "target_pk": target_key, "expected_json": canonical_json(row)}
    app_state = indexed("app_migration_import_state")
    for key, expected in expected_app_state.items():
        got = app_state.get(key)
        if got is None:
            failures.append({"reason": "app_import_state_missing", "key": key})
        elif not _projected_equal(expected, got):
            failures.append({"reason": "app_import_state_tampered", "key": key})

    beta_runs = indexed("beta_migration_runs")
    beta_rows = normalized_doc.get("databases", {}).get("BETA_DB", {}).get("tables", {})
    beta_count = sum(len(rows) for rows in beta_rows.values())
    beta_run = beta_runs.get(batch_id)
    if beta_run is None:
        failures.append({"reason": "beta_migration_run_missing", "key": batch_id})
    elif any((
        beta_run.get("source_manifest_sha256") != manifest_hash,
        beta_run.get("source_count") != beta_count,
        beta_run.get("status") != "imported",
    )):
        failures.append({"reason": "beta_migration_run_tampered", "key": batch_id})

    beta_state = indexed("beta_migration_import_state")
    for table, rows in beta_rows.items():
        for row in rows:
            target_key = _key(row, TABLE_KEYS[table])
            key = _key({"run_id": batch_id, "target_table": table, "target_pk": target_key}, AUDIT_KEYS["beta_migration_import_state"])
            got = beta_state.get(key)
            if got is None:
                failures.append({"reason": "beta_import_state_missing", "key": key})
            elif got.get("expected_json") != canonical_json(row):
                failures.append({"reason": "beta_import_state_tampered", "key": key})

    evidence = {
        "status": "verified" if not failures else "failed",
        "required_tables": sorted(required),
        "missing_tables": missing_tables,
        "source_archive": {
            "expected": len(audit.get("source_archive", [])),
            "actual": len(actual.get("app_migration_source_archive", [])),
            "expected_sha256": rows_hash(audit.get("source_archive", [])),
            "actual_sha256": rows_hash(actual.get("app_migration_source_archive", [])),
        },
        "ledger": {
            "expected": len(audit.get("ledger", [])),
            "actual": len(actual.get("app_migration_ledger", [])),
            "expected_sha256": rows_hash(audit.get("ledger", [])),
            "actual_sha256": rows_hash(actual.get("app_migration_ledger", [])),
        },
        "quarantine": {
            "expected_minimum": len(audit.get("quarantine", [])),
            "actual": len(actual.get("app_migration_quarantine", [])),
            "expected_sha256": rows_hash(audit.get("quarantine", [])),
            "actual_sha256": rows_hash(actual.get("app_migration_quarantine", [])),
        },
        "failures": failures[:200],
        "failure_count": len(failures),
    }
    evidence["evidence_sha256"] = stable_hash(evidence)
    return evidence


def _sql(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def build_reconciliation_proof(
    normalized_doc: Mapping[str, Any], actual: Mapping[str, Sequence[Mapping[str, Any]]],
    business_comparison: Mapping[str, Any], audit_comparison: Mapping[str, Any],
) -> Dict[str, Any]:
    """Build the APP_DB proof rows/SQL only after a verified landed export."""
    tables = normalized_doc.get("tables", {})
    expected_maps = {
        table: {_key(row, TABLE_KEYS[table]): dict(row) for row in rows}
        for table, rows in tables.items()
    }
    actual_maps = {
        table: {_key(row, TABLE_KEYS[table]): dict(row) for row in actual.get(table, [])}
        for table in tables
    }
    quarantine_counts = Counter(str(row.get("run_id") or "") for row in actual.get("app_migration_quarantine", []))
    rows: List[Dict[str, Any]] = []
    for planned in normalized_doc.get("audit_plan", {}).get("reconciliation", []):
        details = json.loads(str(planned.get("details") or "{}"))
        pairs = [tuple(pair) for pair in details.get("target_pairs", [])]
        landed: List[Dict[str, Any]] = []
        for table, target_key in pairs:
            expected = expected_maps.get(table, {}).get(target_key, {})
            got = actual_maps.get(table, {}).get(target_key, {})
            landed.append({
                "table": table,
                "target_key": target_key,
                "row": {field: got.get(field) for field in expected},
            })
        target_digest = rows_hash(landed)
        proof_details = {
            "format": "chartquest-landed-d1-proof-v1",
            "target_pairs": [list(pair) for pair in pairs],
            "landed_rows_sha256": target_digest,
            "business_comparison_sha256": stable_hash(business_comparison),
            "migration_audit_sha256": audit_comparison.get("evidence_sha256"),
        }
        rows.append({
            "run_id": planned.get("run_id"), "dataset": planned.get("dataset"),
            "source_count": planned.get("source_count"), "target_count": len(landed),
            "quarantine_count": quarantine_counts[str(planned.get("run_id") or "")],
            "source_digest": planned.get("source_digest"), "target_digest": target_digest,
            "matched": 1, "checked_at": planned.get("checked_at"),
            "details": canonical_json(proof_details),
        })
    rows.sort(key=lambda row: (str(row.get("dataset")), str(row.get("run_id"))))
    lines = [
        "-- Generated only after an exact external D1 export comparison passed.",
        "PRAGMA foreign_keys = ON;",
        "BEGIN TRANSACTION;",
    ]
    columns = (
        "run_id", "dataset", "source_count", "target_count", "quarantine_count",
        "source_digest", "target_digest", "matched", "checked_at", "details",
    )
    for row in rows:
        values = ",".join(_sql(row.get(column)) for column in columns)
        run_id = _sql(row.get("run_id"))
        lines.append(
            f"INSERT OR IGNORE INTO app_migration_reconciliation ({','.join(columns)}) "
            f"SELECT {values} WHERE EXISTS(SELECT 1 FROM app_migration_runs WHERE run_id={run_id} "
            f"AND status='imported' AND source_count={_sql(row.get('source_count'))} AND source_digest={_sql(row.get('source_digest'))}) "
            f"AND (SELECT count(*) FROM app_migration_ledger WHERE run_id={run_id})={_sql(row.get('source_count'))} "
            f"AND (SELECT count(*) FROM app_migration_quarantine WHERE run_id={run_id})={_sql(row.get('quarantine_count'))};"
        )
        lines.append(
            f"UPDATE app_migration_runs SET status='reconciled',finished_at={_sql(row.get('checked_at'))} "
            f"WHERE run_id={run_id} AND status='imported' AND EXISTS(SELECT 1 FROM app_migration_reconciliation "
            f"WHERE run_id={run_id} AND dataset={_sql(row.get('dataset'))} AND matched=1 AND target_digest={_sql(row.get('target_digest'))});"
        )
    lines.extend(["COMMIT;", ""])
    sql = "\n".join(lines)
    return {"rows": rows, "rows_sha256": rows_hash(rows), "app_sql_sha256": hashlib.sha256(sql.encode("utf-8")).hexdigest(), "sql": sql}


def verify_bundle(bundle: Path, target_export: Optional[Path] = None) -> Dict[str, Any]:
    normalized_doc = _read_json(bundle / NORMALIZED_FILE)
    report = _read_json(bundle / REPORT_FILE)
    reverse = _read_json(bundle / REVERSE_FILE)
    quarantine_doc = _read_json(bundle / QUARANTINE_FILE)

    normalized = normalized_doc.get("tables", {})
    archive = normalized_doc.get("source_archive", [])
    quarantine = quarantine_doc.get("rows", [])
    rebuilt = build_report(
        normalized,
        archive,
        quarantine,
        normalized_doc.get("batch_id", ""),
        normalized_doc.get("source_manifest_sha256", ""),
        normalized_doc.get("redactions", {}),
    )
    if isinstance(normalized_doc.get("source_visit_report"), dict):
        rebuilt["visits"] = normalized_doc["source_visit_report"]
    if isinstance(normalized_doc.get("source_contract"), dict):
        rebuilt["source_contract"] = normalized_doc["source_contract"]
        source_proof = normalized_doc["source_contract"].get("source_export_proof")
        source_proof_verified = isinstance(source_proof, dict) and source_proof.get("verified") is True
        rebuilt["ready_for_apply"] = bool(
            rebuilt["ready_for_apply"]
            and normalized_doc["source_contract"].get("complete") is True
            and source_proof_verified
        )
    else:
        source_proof_verified = False
    rebuilt.pop("report_sha256", None)
    rebuilt["report_sha256"] = stable_hash(rebuilt)
    checks = {
        "batch_ids_match": len({
            normalized_doc.get("batch_id"), report.get("batch_id"), reverse.get("batch_id"),
            quarantine_doc.get("batch_id"),
        }) == 1,
        "report_hash_matches": report.get("report_sha256") == rebuilt.get("report_sha256"),
        "source_archive_count_matches": reverse.get("row_count") == len(archive),
        "source_archive_hash_matches": reverse.get("rows_sha256") == rows_hash(archive),
        "reverse_table_count_matches": reverse.get("row_count") == sum(
            len(rows) for rows in reverse.get("tables", {}).values() if isinstance(rows, list)
        ),
        "reverse_tables_hash_matches": reverse.get("tables_sha256") == stable_hash(reverse.get("tables", {})),
        "quarantine_hash_matches": report.get("quarantine", {}).get("rows_sha256") == rows_hash(quarantine),
    }
    result: Dict[str, Any] = {
        "format": "chartquest-cloudflare-bundle-verification-v1",
        "ok": all(checks.values()),
        "bundle_integrity_ok": all(checks.values()),
        "source_ready_for_apply": report.get("ready_for_apply") is True and rebuilt.get("ready_for_apply") is True,
        "source_export_proof_verified": source_proof_verified,
        "checks": checks,
        "batch_id": normalized_doc.get("batch_id"),
        "external_verification": {
            "status": "pending",
            "reason": "no post-apply D1 JSON export was supplied",
        },
        "ready_to_mark_reconciled": False,
    }
    if target_export is not None:
        actual = load_target_export(target_export)
        comparison = compare_target(normalized, actual)
        audit_comparison = compare_migration_audit(normalized_doc, actual)
        result["target_comparison"] = comparison
        result["migration_audit_comparison"] = audit_comparison
        verified = bool(
            result["bundle_integrity_ok"] and result["source_ready_for_apply"]
            and result["source_export_proof_verified"]
            and comparison["ok"] and audit_comparison["status"] == "verified"
        )
        result["external_verification"] = {
            "status": "verified" if verified else "failed",
            "business_tables_sha256": stable_hash(comparison),
            "migration_audit_sha256": audit_comparison["evidence_sha256"],
        }
        result["ready_to_mark_reconciled"] = verified
        result["ok"] = verified
        if verified:
            proof = build_reconciliation_proof(normalized_doc, actual, comparison, audit_comparison)
            result["reconciliation_proof"] = {
                "rows": proof["rows"],
                "rows_sha256": proof["rows_sha256"],
                "app_sql_sha256": proof["app_sql_sha256"],
            }
            result["app_mark_reconciled_sql"] = proof["sql"]
    result["verification_sha256"] = stable_hash(result)
    return result


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Verify a credential-free ChartQuest Cloudflare import bundle and optionally compare a D1 JSON export."
    )
    parser.add_argument("bundle", help="directory produced by cloudflare_import.py")
    parser.add_argument("--target-export", help="optional D1 JSON export file or directory")
    parser.add_argument("--out", help="write verification JSON here instead of stdout")
    parser.add_argument(
        "--mark-reconciled-sql",
        help="write APP_DB status/reconciliation SQL only when the external D1 export verifies exactly",
    )
    args = parser.parse_args(argv)
    result = verify_bundle(
        Path(args.bundle).resolve(),
        Path(args.target_export).resolve() if args.target_export else None,
    )
    rendered = json.dumps(result, ensure_ascii=False, sort_keys=True, indent=2) + "\n"
    if args.out:
        Path(args.out).write_text(rendered, encoding="utf-8")
    else:
        sys.stdout.write(rendered)
    if args.mark_reconciled_sql:
        if not result.get("ready_to_mark_reconciled") or not result.get("app_mark_reconciled_sql"):
            sys.stderr.write("cloudflare_reconcile: refusing to write reconciliation SQL because external proof is absent or failed\n")
            return 1
        Path(args.mark_reconciled_sql).write_text(str(result["app_mark_reconciled_sql"]), encoding="utf-8")
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
