#!/usr/bin/env python3
"""Canonical APP_DB/BETA_DB projection and deterministic SQL emitters.

This module is intentionally offline.  It receives already-sanitized logical
rows from ``cloudflare_import.py`` and never opens a network connection or
handles credentials.
"""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from datetime import datetime
from typing import Any, Dict, List, Mapping, MutableMapping, Optional, Sequence, Tuple
from urllib.parse import urlparse

from cloudflare_reconcile import TABLE_KEYS, canonical_json, rows_hash, stable_hash


EPOCH = "1970-01-01T00:00:00Z"
SOURCE_PROJECT_REF = "ymxppzhczvmiuoncuqqu"

MASTERY_TARGETS = {
    "Trend": "trend",
    "Structure": "structure",
    "Liquidity": "liquidity",
    "OrderBlocks": "order_blocks",
    "RiskMgmt": "risk_management",
    "TradeMgmt": "trade_management",
    "MultiTF": "multi_timeframe",
}

APP_TABLE_ORDER = (
    "app_identities", "app_profiles", "app_journal_heads",
    "app_journal_versions", "app_journal_trades", "app_journal_notes",
    "app_journal_changes", "app_daily_streak", "app_mastery",
    "app_mastery_quarantine", "app_bug_reports", "app_site_visits",
    "app_site_visits_daily", "app_content_events", "app_content_replays",
    "app_content_briefs", "app_content_assets", "app_content_generated",
    "app_content_exports", "app_published_posts", "app_performance_snapshots",
)

APP_COLUMNS: Dict[str, Tuple[str, ...]] = {
    "app_identities": (
        "id", "email_normalized", "email_original", "source_provider",
        "source_subject", "status", "password_scheme", "password_salt",
        "password_hash", "password_iterations", "consent_at", "claimed_at",
        "created_at", "updated_at",
    ),
    "app_profiles": (
        "user_id", "shells", "player_level", "xp", "version",
        "source_updated_at", "created_at", "updated_at",
    ),
    "app_journal_heads": ("user_id", "current_version", "updated_at"),
    "app_journal_versions": (
        "user_id", "version", "base_version", "request_id", "payload_hash", "created_at",
    ),
    "app_journal_trades": (
        "user_id", "trade_id", "trade_data", "row_version", "source_row_id",
        "source_created_at", "created_at", "updated_at", "deleted_at",
    ),
    "app_journal_notes": (
        "user_id", "note_id", "note_data", "row_version", "source_row_id",
        "source_created_at", "created_at", "updated_at", "deleted_at",
    ),
    "app_journal_changes": (
        "user_id", "journal_version", "item_kind", "item_id", "operation",
        "item_data", "created_at",
    ),
    "app_daily_streak": (
        "user_id", "streak", "best_streak", "last_drill_date", "version",
        "source_updated_at", "updated_at",
    ),
    "app_mastery": (
        "owner_key", "owner_kind", "user_id", "category_raw",
        "category_normalized", "score", "source_updated_at", "updated_at",
    ),
    "app_mastery_quarantine": (
        "quarantine_key", "owner_key", "user_id", "category_raw", "raw_row",
        "reason_code", "source_provider", "created_at",
    ),
    "app_bug_reports": (
        "request_id", "user_id", "player_id", "message", "context", "status",
        "ingest_source", "source_row_id", "source_created_at", "created_at",
    ),
    "app_site_visits": (
        "visit_id", "player_id", "path", "referrer_host", "build", "device",
        "country", "ingest_source", "source_row_id", "source_created_at", "created_at",
    ),
    "app_site_visits_daily": (
        "visit_date", "path", "visit_count", "first_seen_at", "last_seen_at",
    ),
    "app_content_events": (
        "event_id", "event_type", "ts", "player_id", "session_id", "faction",
        "player_level", "player_rank", "payload", "educational_metadata",
        "content_flags", "significance_score", "processed_status", "ingest_source",
        "created_at",
    ),
    "app_content_replays": (
        "replay_id", "event_id", "kind", "meta", "data", "ingest_source", "created_at",
    ),
    "app_content_briefs": (
        "brief_key", "event_id", "pillar", "platforms", "urgency", "angle",
        "format", "priority", "status", "ingest_source", "created_at",
    ),
    "app_content_assets": (
        "asset_key", "brief_key", "event_id", "asset_type", "storage_path",
        "platform_variant", "meta", "ingest_source", "created_at",
    ),
    "app_content_generated": (
        "generated_key", "brief_key", "platform", "body", "meta", "status",
        "ingest_source", "created_at",
    ),
    "app_content_exports": (
        "export_key", "platform", "event_count", "filter_json", "ingest_source", "exported_at",
    ),
    "app_published_posts": (
        "post_key", "asset_key", "platform", "post_url", "ingest_source", "published_at",
    ),
    "app_performance_snapshots": (
        "snapshot_key", "post_key", "captured_at", "metrics", "ingest_source",
    ),
}

BETA_COLUMNS = {
    "beta_events": (
        "event_id", "player_id", "session_id", "name", "ts", "props", "device",
        "browser", "os", "screen", "viewport", "created_at",
    ),
    "beta_surveys": (
        "response_id", "player_id", "session_id", "q1_rating", "q2_hook",
        "q3_improvement", "q4_continue", "q5_anything", "seconds_taken",
        "created_at", "updated_at", "ingest_source",
    ),
}


def _sql(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def _time(row: Mapping[str, Any], *fields: str) -> str:
    names = fields or (
        "source_updated_at", "updated_at", "source_created_at", "created_at",
        "ts", "exported_at", "published_at", "captured_at",
    )
    for field in names:
        value = row.get(field)
        if value not in (None, ""):
            return str(value)
    return EPOCH


def _key(table: str, row: Mapping[str, Any]) -> str:
    return "\u241f".join("" if row.get(field) is None else str(row.get(field)) for field in TABLE_KEYS[table])


def _source_record(archive_by_hash: Mapping[str, Mapping[str, Any]], row_hash: Optional[str]) -> Mapping[str, Any]:
    return archive_by_hash.get(str(row_hash or ""), {})


def _issue(
    source: Mapping[str, Any], reason: str, detail: str, severity: str,
    target_table: Optional[str] = None, target_key: Optional[str] = None,
) -> Dict[str, Any]:
    item = {
        "reason": reason,
        "detail": detail,
        "severity": severity,
        "source_schema": source.get("source_schema"),
        "source_table": source.get("source_table"),
        "source_path": source.get("source_path"),
        "source_index": source.get("source_index", -1),
        "source_pk": source.get("source_pk"),
        "source_row_hash": source.get("source_row_hash"),
        "source_row": source.get("source_row") if isinstance(source.get("source_row"), dict) else {},
    }
    if target_table:
        item["target_table"] = target_table
    if target_key:
        item["target_key"] = target_key
    return item


def _target_id(prefix: str, source_id: Any, row_hash: str) -> str:
    suffix = str(source_id) if source_id not in (None, "") else row_hash[:32]
    value = f"supabase:{prefix}:{suffix}"
    if len(value) <= 100:
        return value
    return f"supabase:{prefix}:{stable_hash(value)[:48]}"


def _record_lineage(
    lineage: MutableMapping[str, List[Tuple[str, str]]], row: Mapping[str, Any],
    table: str, target: Mapping[str, Any],
) -> None:
    row_hash = str(row.get("source_row_hash") or "")
    if row_hash:
        lineage[row_hash].append((table, _key(table, target)))


def _append(
    output: MutableMapping[str, List[Dict[str, Any]]],
    lineage: MutableMapping[str, List[Tuple[str, str]]],
    table: str, target: Dict[str, Any], source_row: Optional[Mapping[str, Any]] = None,
) -> None:
    output[table].append(target)
    if source_row is not None:
        _record_lineage(lineage, source_row, table, target)


def _referrer_host(value: Any) -> Optional[str]:
    if value in (None, ""):
        return None
    parsed = urlparse(str(value) if "://" in str(value) else "//" + str(value))
    return parsed.hostname


def _visit_build(source_json: Any) -> Optional[str]:
    if isinstance(source_json, str):
        try:
            import json
            source_json = json.loads(source_json)
        except Exception:
            return None
    if isinstance(source_json, dict):
        value = source_json.get("build")
        if value is None and isinstance(source_json.get("props"), dict):
            value = source_json["props"].get("build")
        return None if value is None else str(value)
    return None


def project_to_canonical(
    logical: Mapping[str, Sequence[Mapping[str, Any]]],
    archive: Sequence[Mapping[str, Any]],
    quarantine: Sequence[Mapping[str, Any]],
    batch_id: str,
) -> Tuple[Dict[str, List[Dict[str, Any]]], List[Dict[str, Any]], Dict[str, Any]]:
    """Project logical Supabase rows into the exact 0001/0002 D1 schemas."""
    output: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    lineage: Dict[str, List[Tuple[str, str]]] = defaultdict(list)
    issues = [dict(item) for item in quarantine]
    archive_by_hash = {str(row.get("source_row_hash") or ""): row for row in archive}

    # The beta plane already uses its final table names and shape.
    for table in ("beta_events", "beta_surveys"):
        for row in logical.get(table, []):
            target = {column: row.get(column) for column in BETA_COLUMNS[table]}
            _append(output, lineage, table, target, row)

    identities: set[str] = set()
    identity_email_owner: Dict[str, str] = {}
    for row in logical.get("auth_users", []):
        source = _source_record(archive_by_hash, row.get("source_row_hash"))
        user_id = str(row.get("id") or "")
        email_original = str(row.get("email") or "").strip()
        if not 32 <= len(user_id) <= 64:
            issues.append(_issue(source, "invalid_identity_id", "auth user id must be the original 32-64 character Supabase UUID", "error", "app_identities", user_id))
            continue
        if not email_original or len(email_original) > 254 or "@" not in email_original:
            issues.append(_issue(source, "invalid_identity_email", "a valid source email is required for a pending Cloudflare claim", "error", "app_identities", user_id))
            continue
        email_normalized = email_original.casefold()
        if email_normalized in identity_email_owner and identity_email_owner[email_normalized] != user_id:
            issues.append(_issue(
                source, "duplicate_identity_email",
                f"email is already mapped to source user {identity_email_owner[email_normalized]}; the later identity is quarantined",
                "error", "app_identities", user_id,
            ))
            continue
        created = _time(row, "created_at", "updated_at")
        target = {
            "id": user_id,
            "email_normalized": email_normalized,
            "email_original": email_original,
            "source_provider": "supabase",
            "source_subject": user_id,
            "status": "deleted" if row.get("deleted_at") else "pending_claim",
            "password_scheme": None,
            "password_salt": None,
            "password_hash": None,
            "password_iterations": None,
            "consent_at": None,
            "claimed_at": None,
            "created_at": created,
            "updated_at": _time(row, "updated_at", "created_at"),
        }
        identities.add(user_id)
        identity_email_owner[email_normalized] = user_id
        _append(output, lineage, "app_identities", target, row)

    # Provider identity rows are provenance, never Cloudflare credentials.
    for row in logical.get("auth_identities", []):
        source = _source_record(archive_by_hash, row.get("source_row_hash"))
        issues.append(_issue(
            source, "supabase_identity_metadata_archived",
            "provider identity metadata is retained in the source archive; no Supabase login secret or session is transferable",
            "warning",
        ))

    def require_identity(row: Mapping[str, Any], raw_id: Any, target: str) -> Optional[str]:
        user_id = str(raw_id or "")
        if user_id in identities:
            return user_id
        source = _source_record(archive_by_hash, row.get("source_row_hash"))
        issues.append(_issue(source, "orphan_user_reference", f"{target} references a user absent from the valid auth.users export: {user_id}", "error", target, user_id))
        return None

    for row in logical.get("profiles", []):
        user_id = require_identity(row, row.get("id"), "app_profiles")
        if user_id is None:
            continue
        level = int(row.get("player_level") or 1)
        shells = int(row.get("shells") or 0)
        xp = int(row.get("xp") or 0)
        source = _source_record(archive_by_hash, row.get("source_row_hash"))
        if not (0 <= shells <= 10_000_000 and 1 <= level <= 10 and 0 <= xp <= 999_999):
            issues.append(_issue(source, "profile_constraint_violation", "profile counters are outside the APP_DB contract", "error", "app_profiles", user_id))
            continue
        created = _time(row, "created_at", "updated_at")
        target = {
            "user_id": user_id, "shells": shells, "player_level": level, "xp": xp,
            "version": 0, "source_updated_at": row.get("updated_at") or row.get("source_updated_at"),
            "created_at": created, "updated_at": _time(row, "updated_at", "created_at"),
        }
        _append(output, lineage, "app_profiles", target, row)

    # One baseline journal version per user; only the deterministic current row
    # for each logical item is materialized. Older source versions stay archived.
    journal_by_user: Dict[str, List[Tuple[str, Mapping[str, Any]]]] = defaultdict(list)
    for logical_table, kind in (("journal_trades", "trade"), ("journal_notes", "note")):
        for row in logical.get(logical_table, []):
            user_id = require_identity(row, row.get("user_id"), f"app_journal_{kind}s")
            if user_id is None:
                continue
            if int(row.get("is_current") or 0) != 1:
                source = _source_record(archive_by_hash, row.get("source_row_hash"))
                issues.append(_issue(source, "historical_journal_version_archived", "an older journal row is retained in the reverse archive; the current snapshot is imported", "warning"))
                continue
            journal_by_user[user_id].append((kind, row))

    for user_id in sorted(journal_by_user):
        items = sorted(journal_by_user[user_id], key=lambda item: (
            item[0], str(item[1].get("trade_id") or item[1].get("note_id") or ""),
            str(item[1].get("source_id") or ""), str(item[1].get("source_row_hash") or ""),
        ))
        payload_items: List[Dict[str, Any]] = []
        materialized: List[Tuple[str, Mapping[str, Any], Dict[str, Any]]] = []
        latest = EPOCH
        for kind, row in items:
            data_field = "trade_data" if kind == "trade" else "note_data"
            item_field = "trade_id" if kind == "trade" else "note_id"
            item_id = row.get(item_field)
            if item_id in (None, ""):
                item_id = _target_id(kind, row.get("source_id"), str(row.get("source_row_hash") or ""))
            item_id = str(item_id)
            if len(item_id) > 100:
                item_id = _target_id(kind, item_id, str(row.get("source_row_hash") or ""))
            created = _time(row, "created_at", "source_updated_at")
            updated = _time(row, "updated_at", "created_at", "source_updated_at")
            latest = max(latest, updated)
            target = {
                "user_id": user_id, item_field: item_id, data_field: row.get(data_field) or "{}",
                "row_version": 1, "source_row_id": None if row.get("source_id") is None else str(row.get("source_id")),
                "source_created_at": row.get("created_at"), "created_at": created,
                "updated_at": updated, "deleted_at": None,
            }
            payload_items.append({"kind": kind, "item_id": item_id, "data": target[data_field], "source_row_id": target["source_row_id"]})
            materialized.append((kind, row, target))
        payload_hash = stable_hash({"user_id": user_id, "version": 1, "items": payload_items})
        request_id = "supa-journal-" + stable_hash({"batch": batch_id, "user": user_id, "payload": payload_hash})[:40]
        version = {
            "user_id": user_id, "version": 1, "base_version": 0,
            "request_id": request_id, "payload_hash": payload_hash, "created_at": latest,
        }
        head = {"user_id": user_id, "current_version": 1, "updated_at": latest}
        # Aggregate rows point to each contributing source in the audit lineage.
        output["app_journal_versions"].append(version)
        output["app_journal_heads"].append(head)
        for kind, row, target in materialized:
            table = f"app_journal_{kind}s"
            _append(output, lineage, table, target, row)
            change = {
                "user_id": user_id, "journal_version": 1, "item_kind": kind,
                "item_id": target[f"{kind}_id"], "operation": "upsert",
                "item_data": target[f"{kind}_data"], "created_at": latest,
            }
            output["app_journal_changes"].append(change)
            _record_lineage(lineage, row, "app_journal_changes", change)
            _record_lineage(lineage, row, "app_journal_versions", version)
            _record_lineage(lineage, row, "app_journal_heads", head)

    for row in logical.get("daily_streak", []):
        user_id = require_identity(row, row.get("id"), "app_daily_streak")
        if user_id is None:
            continue
        streak, best = int(row.get("streak") or 0), int(row.get("best_streak") or 0)
        source = _source_record(archive_by_hash, row.get("source_row_hash"))
        if streak > 3660 or best > 3660 or best < streak:
            issues.append(_issue(source, "streak_constraint_violation", "best_streak must be at least streak and both must fit APP_DB", "error", "app_daily_streak", user_id))
            continue
        target = {
            "user_id": user_id, "streak": streak, "best_streak": best,
            "last_drill_date": row.get("last_drill_date"), "version": 0,
            "source_updated_at": row.get("updated_at") or row.get("source_updated_at"),
            "updated_at": _time(row, "updated_at", "source_updated_at"),
        }
        _append(output, lineage, "app_daily_streak", target, row)

    for row in logical.get("player_mastery", []):
        raw = str(row.get("source_category") or row.get("category") or "")
        normalized = MASTERY_TARGETS.get(str(row.get("category") or ""))
        source = _source_record(archive_by_hash, row.get("source_row_hash"))
        if normalized is None:
            issues.append(_issue(source, "unknown_mastery_category", f"no exact APP_DB mastery mapping for {raw}", "error"))
            continue
        owner = str(row.get("player_id") or "")
        if not 1 <= len(owner) <= 64:
            issues.append(_issue(source, "invalid_mastery_owner", "mastery owner key must contain 1-64 characters", "error"))
            continue
        account = owner in identities
        target = {
            "owner_key": owner, "owner_kind": "account" if account else "guest",
            "user_id": owner if account else None, "category_raw": raw,
            "category_normalized": normalized, "score": int(row.get("score") or 0),
            "source_updated_at": row.get("updated_at") or row.get("source_updated_at"),
            "updated_at": _time(row, "updated_at", "source_updated_at"),
        }
        _append(output, lineage, "app_mastery", target, row)

    # Invalid/ambiguous legacy mastery is both quarantined in migration audit and
    # materialized in the runtime's dedicated mastery quarantine table.
    mastery_reasons = {"ambiguous_mastery_category", "unknown_mastery_category"}
    for item in issues:
        if item.get("reason") not in mastery_reasons or item.get("source_table") != "player_mastery":
            continue
        raw_row = item.get("source_row") if isinstance(item.get("source_row"), dict) else {}
        owner = str(raw_row.get("player_id") or "")
        row_hash = str(item.get("source_row_hash") or stable_hash(raw_row))
        target = {
            "quarantine_key": "supa-mastery-" + row_hash[:48],
            "owner_key": owner or None,
            "user_id": owner if owner in identities else None,
            "category_raw": None if raw_row.get("category") is None else str(raw_row.get("category")),
            "raw_row": canonical_json(raw_row), "reason_code": str(item.get("reason")),
            "source_provider": "supabase", "created_at": _time(raw_row),
        }
        output["app_mastery_quarantine"].append(target)
        if row_hash:
            lineage[row_hash].append(("app_mastery_quarantine", _key("app_mastery_quarantine", target)))

    for row in logical.get("bug_reports", []):
        message = str(row.get("message") or "").strip()
        source = _source_record(archive_by_hash, row.get("source_row_hash"))
        if not message or len(message) > 4000:
            issues.append(_issue(source, "invalid_bug_message", "bug message must contain 1-4000 characters", "error"))
            continue
        source_id = row.get("source_id") or row.get("report_id")
        source_json = source.get("source_row") if isinstance(source.get("source_row"), dict) else {}
        player_id = source_json.get("player_id")
        requested_user = row.get("user_id")
        target = {
            "request_id": _target_id("bug", source_id, str(row.get("source_row_hash") or "")),
            "user_id": str(requested_user) if requested_user is not None and str(requested_user) in identities else None,
            "player_id": None if player_id is None else str(player_id), "message": message,
            "context": row.get("context") or "{}", "status": row.get("status") or "open",
            "ingest_source": "supabase_history", "source_row_id": None if source_id is None else str(source_id),
            "source_created_at": row.get("created_at"), "created_at": _time(row, "created_at", "updated_at"),
        }
        if target["status"] not in {"open", "triaged", "resolved", "closed"}:
            issues.append(_issue(source, "invalid_bug_status", f"unsupported bug status: {target['status']}", "error"))
            continue
        if target["player_id"] is not None and len(str(target["player_id"])) > 64:
            issues.append(_issue(source, "invalid_bug_player_id", "bug player_id exceeds the APP_DB 64-character limit", "error"))
            continue
        if len(str(target["context"])) > 8192:
            issues.append(_issue(source, "bug_context_too_large", "bug context exceeds the APP_DB 8192-character limit", "error"))
            continue
        _append(output, lineage, "app_bug_reports", target, row)

    raw_visit_keys: set[Tuple[str, str]] = set()
    for row in logical.get("site_visits", []):
        created = _time(row, "created_at", "source_updated_at")
        path = str(row.get("path") or "/")
        raw_visit_keys.add((created[:10], path))
        source = _source_record(archive_by_hash, row.get("source_row_hash"))
        raw = source.get("source_row") if isinstance(source.get("source_row"), dict) else {}
        country = raw.get("country")
        country = str(country).upper() if country not in (None, "") else None
        if country is not None and len(country) != 2:
            issues.append(_issue(source, "invalid_visit_country_archived", "visit country was retained in source provenance but omitted from APP_DB because it is not a two-letter code", "warning"))
            country = None
        target = {
            "visit_id": _target_id("visit", row.get("source_id") or row.get("visit_id"), str(row.get("source_row_hash") or "")),
            "player_id": None if raw.get("player_id") is None else str(raw.get("player_id")),
            "path": path, "referrer_host": _referrer_host(row.get("referrer") or raw.get("referrer_host")),
            "build": _visit_build(raw), "device": raw.get("device"), "country": country,
            "ingest_source": "supabase_history", "source_row_id": None if row.get("source_id") is None else str(row.get("source_id")),
            "source_created_at": row.get("created_at"), "created_at": created,
        }
        limits = (("player_id", 64), ("path", 256), ("referrer_host", 253), ("build", 40), ("device", 24))
        invalid = next((field for field, limit in limits if target.get(field) is not None and len(str(target[field])) > limit), None)
        if invalid:
            issues.append(_issue(source, "visit_constraint_violation", f"visit {invalid} exceeds the APP_DB limit", "error"))
            continue
        _append(output, lineage, "app_site_visits", target, row)

    for row in logical.get("site_visits_daily", []):
        day, path = str(row.get("day") or ""), "/"
        source = _source_record(archive_by_hash, row.get("source_row_hash"))
        if (day, path) in raw_visit_keys:
            issues.append(_issue(source, "visit_daily_overlap_archived", "raw visits exist for this UTC day; the source daily total is evidence only and is not imported twice", "warning"))
            continue
        stamp = _time(row, "updated_at", "source_updated_at")
        if stamp == EPOCH:
            stamp = day + "T00:00:00Z"
        target = {
            "visit_date": day, "path": path, "visit_count": int(row.get("visits") or 0),
            "first_seen_at": stamp, "last_seen_at": stamp,
        }
        _append(output, lineage, "app_site_visits_daily", target, row)

    brief_keys = {str(row.get("source_id") or row.get("record_id")): _target_id("brief", row.get("source_id") or row.get("record_id"), str(row.get("source_row_hash") or "")) for row in logical.get("content_briefs", [])}
    asset_keys = {str(row.get("source_id") or row.get("record_id")): _target_id("asset", row.get("source_id") or row.get("record_id"), str(row.get("source_row_hash") or "")) for row in logical.get("content_assets", [])}
    post_keys = {str(row.get("source_id") or row.get("record_id")): _target_id("post", row.get("source_id") or row.get("record_id"), str(row.get("source_row_hash") or "")) for row in logical.get("published_posts", [])}

    content_mapping = {
        "content_events": "app_content_events", "content_replays": "app_content_replays",
        "content_briefs": "app_content_briefs", "content_assets": "app_content_assets",
        "content_generated": "app_content_generated", "content_exports": "app_content_exports",
        "published_posts": "app_published_posts", "performance_snapshots": "app_performance_snapshots",
    }
    for source_table, target_table in content_mapping.items():
        for row in logical.get(source_table, []):
            created = _time(row, "created_at", "ts", "exported_at", "published_at", "captured_at", "source_updated_at")
            if source_table == "content_events":
                target = {column: row.get(column) for column in APP_COLUMNS[target_table]}
                target.update({"ts": row.get("ts") or created, "created_at": created, "ingest_source": "supabase_history"})
            elif source_table == "content_replays":
                target = {"replay_id": row.get("replay_id"), "event_id": row.get("event_id"), "kind": row.get("kind"), "meta": row.get("meta") or "{}", "data": row.get("data") or "{}", "ingest_source": "supabase_history", "created_at": created}
            elif source_table == "content_briefs":
                target = {"brief_key": brief_keys[str(row.get("source_id") or row.get("record_id"))], "event_id": row.get("event_id"), "pillar": row.get("pillar"), "platforms": row.get("platforms") or "[]", "urgency": row.get("urgency"), "angle": row.get("angle"), "format": row.get("format"), "priority": int(row.get("priority") or 0), "status": row.get("status") or "proposed", "ingest_source": "supabase_history", "created_at": created}
            elif source_table == "content_assets":
                target = {"asset_key": asset_keys[str(row.get("source_id") or row.get("record_id"))], "brief_key": brief_keys.get(str(row.get("brief_id"))), "event_id": row.get("event_id"), "asset_type": row.get("asset_type"), "storage_path": row.get("storage_path"), "platform_variant": row.get("platform_variant"), "meta": row.get("meta") or "{}", "ingest_source": "supabase_history", "created_at": created}
            elif source_table == "content_generated":
                target = {"generated_key": _target_id("generated", row.get("source_id") or row.get("record_id"), str(row.get("source_row_hash") or "")), "brief_key": brief_keys.get(str(row.get("brief_id"))), "platform": row.get("platform"), "body": row.get("body"), "meta": row.get("meta") or "{}", "status": row.get("status") or "draft", "ingest_source": "supabase_history", "created_at": created}
            elif source_table == "content_exports":
                target = {"export_key": _target_id("export", row.get("source_id") or row.get("record_id"), str(row.get("source_row_hash") or "")), "platform": row.get("platform"), "event_count": int(row.get("event_count") or 0), "filter_json": row.get("filter_json") or "{}", "ingest_source": "supabase_history", "exported_at": _time(row, "exported_at", "source_updated_at")}
            elif source_table == "published_posts":
                target = {"post_key": post_keys[str(row.get("source_id") or row.get("record_id"))], "asset_key": asset_keys.get(str(row.get("asset_id"))), "platform": row.get("platform"), "post_url": row.get("post_url"), "ingest_source": "supabase_history", "published_at": _time(row, "published_at", "source_updated_at")}
            else:
                target = {"snapshot_key": _target_id("snapshot", row.get("source_id") or row.get("record_id"), str(row.get("source_row_hash") or "")), "post_key": post_keys.get(str(row.get("post_id"))), "captured_at": _time(row, "captured_at", "source_updated_at"), "metrics": row.get("metrics") or "{}", "ingest_source": "supabase_history"}
            _append(output, lineage, target_table, target, row)

    for row in logical.get("content_records", []):
        source = _source_record(archive_by_hash, row.get("source_row_hash"))
        issues.append(_issue(source, "unknown_content_table", f"no canonical app_* mapping exists for {row.get('source_table')}", "error"))

    for row in logical.get("admins", []):
        source = _source_record(archive_by_hash, row.get("source_row_hash"))
        issues.append(_issue(source, "retired_supabase_admin_authorization", "Supabase admin rows are retained as retired metadata; Cloudflare Access is the only founder authorization source", "warning"))

    # Stable target ordering and duplicate-key defense after cross-table projection.
    canonical: Dict[str, List[Dict[str, Any]]] = {}
    for table, rows in sorted(output.items()):
        keys = TABLE_KEYS[table]
        seen: Dict[str, Dict[str, Any]] = {}
        for row in sorted(rows, key=lambda value: tuple(str(value.get(field) or "") for field in keys)):
            target_key = _key(table, row)
            if target_key not in seen:
                seen[target_key] = row
            elif canonical_json(seen[target_key]) != canonical_json(row):
                # This is a projection-level conflict. Both originals remain in archive.
                issues.append({
                    "reason": "canonical_target_collision", "detail": f"multiple source rows projected to {table}:{target_key}",
                    "severity": "error", "source_schema": "projection", "source_table": table,
                    "source_path": "<projection>", "source_index": -1,
                    "source_pk": target_key, "source_row_hash": stable_hash(row), "source_row": row,
                    "target_table": table, "target_key": target_key,
                })
        canonical[table] = list(seen.values())

    # Point the sanitized archive and ledger at canonical targets. A source can
    # contribute to several journal audit rows; its primary materialized item is
    # selected deterministically while the full list remains in audit_plan.
    archive_out = [dict(item) for item in archive]
    for item in archive_out:
        row_hash = str(item.get("source_row_hash") or "")
        targets = sorted(set(lineage.get(row_hash, [])))
        if targets:
            preferred = next((target for target in targets if target[0] in {
                "beta_events", "beta_surveys", "app_identities", "app_profiles",
                "app_journal_trades", "app_journal_notes", "app_daily_streak",
                "app_mastery", "app_mastery_quarantine", "app_bug_reports",
                "app_site_visits", "app_site_visits_daily", "app_content_events",
                "app_content_replays", "app_content_briefs", "app_content_assets",
                "app_content_generated", "app_content_exports", "app_published_posts",
                "app_performance_snapshots",
            }), targets[0])
            item["target_table"], item["target_key"] = preferred
            item["disposition"] = f"normalized:{preferred[0]}"
        elif str(item.get("disposition") or "").startswith("normalized:"):
            item["disposition"] = "archived_only"

    issues.sort(key=lambda item: (
        str(item.get("severity")), str(item.get("reason")), str(item.get("source_schema")),
        str(item.get("source_table")), str(item.get("source_path")), int(item.get("source_index", -1)),
        str(item.get("source_row_hash")),
    ))
    audit = build_audit_plan(archive_out, issues, lineage, canonical, batch_id)
    return canonical, issues, {"archive": archive_out, "lineage": dict(lineage), "audit_plan": audit}


def build_audit_plan(
    archive: Sequence[Mapping[str, Any]], quarantine: Sequence[Mapping[str, Any]],
    lineage: Mapping[str, Sequence[Tuple[str, str]]], canonical: Mapping[str, Sequence[Mapping[str, Any]]],
    batch_id: str,
) -> Dict[str, Any]:
    error_hashes = {
        str(item.get("source_row_hash") or "")
        for item in quarantine if item.get("severity", "error") == "error"
    }
    groups: Dict[str, List[Mapping[str, Any]]] = defaultdict(list)
    for item in archive:
        groups[f"{item.get('source_schema')}.{item.get('source_table')}"] .append(item)
    issue_counts = Counter(f"{item.get('source_schema')}.{item.get('source_table')}" for item in quarantine)
    runs: List[Dict[str, Any]] = []
    run_by_dataset: Dict[str, str] = {}
    for dataset, rows in sorted(groups.items()):
        run_id = "supa-run-" + stable_hash({"batch": batch_id, "dataset": dataset})[:32]
        run_by_dataset[dataset] = run_id
        times = sorted(_time(item.get("source_row") if isinstance(item.get("source_row"), dict) else {}) for item in rows)
        imported = sum(
            1 for item in rows
            if lineage.get(str(item.get("source_row_hash") or ""))
            and str(item.get("source_row_hash") or "") not in error_hashes
        )
        runs.append({
            "run_id": run_id, "source_provider": "supabase", "source_project_ref": SOURCE_PROJECT_REF,
            "dataset": dataset, "external_batch_id": batch_id, "source_count": len(rows),
            "source_digest": rows_hash([{"digest": item.get("source_row_hash"), "row": item.get("source_row")} for item in rows]),
            "imported_count": imported, "quarantine_count": issue_counts.get(dataset, 0),
            "status": "imported", "notes": "imported; external D1 export reconciliation pending",
            "started_at": times[0] if times else EPOCH, "finished_at": times[-1] if times else EPOCH,
        })

    pk_counts = Counter((f"{item.get('source_schema')}.{item.get('source_table')}", str(item.get("source_pk"))) for item in archive if item.get("source_pk") not in (None, ""))
    ledger: List[Dict[str, Any]] = []
    source_archive: List[Dict[str, Any]] = []
    source_locator: Dict[str, Tuple[str, str]] = {}
    for item in archive:
        dataset = f"{item.get('source_schema')}.{item.get('source_table')}"
        raw_pk = item.get("source_pk")
        if raw_pk in (None, ""):
            source_pk = f"row:{item.get('source_index')}:{str(item.get('source_row_hash'))[:16]}"
        elif pk_counts[(dataset, str(raw_pk))] > 1:
            source_pk = f"{raw_pk}#{str(item.get('source_row_hash'))[:16]}"
        else:
            source_pk = str(raw_pk)
        row_hash = str(item.get("source_row_hash") or "")
        source_locator[row_hash] = (dataset, source_pk)
        targets = sorted(set(lineage.get(row_hash, [])))
        disposition = str(item.get("disposition") or "")
        if row_hash in error_hashes:
            status = "quarantined"
        elif targets:
            status = "imported"
        else:
            status = "duplicate" if disposition in {"duplicate_archived", "archived_only"} else "quarantined"
        ledger.append({
            "run_id": run_by_dataset[dataset], "source_table": dataset, "source_pk": source_pk,
            "source_digest": row_hash, "target_table": targets[0][0] if targets else None,
            "target_pk": targets[0][1] if targets else None, "status": status,
            "imported_at": _time(item.get("source_row") if isinstance(item.get("source_row"), dict) else {}),
        })
        source_archive.append({
            "run_id": run_by_dataset[dataset], "source_table": dataset, "source_pk": source_pk,
            "source_path": item.get("source_path"), "source_index": item.get("source_index"),
            "source_digest": row_hash, "raw_row": canonical_json(item.get("source_row") if isinstance(item.get("source_row"), dict) else {}),
            "redacted_fields": canonical_json(item.get("redacted_fields") or []),
            "disposition": disposition, "target_table": item.get("target_table"), "target_pk": item.get("target_key"),
        })

    quarantine_rows: List[Dict[str, Any]] = []
    for index, item in enumerate(quarantine):
        row_hash = str(item.get("source_row_hash") or "")
        locator = source_locator.get(row_hash)
        dataset = locator[0] if locator else f"{item.get('source_schema')}.{item.get('source_table')}"
        run_id = run_by_dataset.get(dataset)
        if run_id is None:
            # Parser-level synthetic issues still receive a deterministic run.
            run_id = "supa-run-" + stable_hash({"batch": batch_id, "dataset": dataset})[:32]
        quarantine_rows.append({
            "run_id": run_id, "source_table": dataset,
            "source_pk": locator[1] if locator else str(item.get("source_pk") or f"issue:{index}:{row_hash[:16]}"),
            "reason_code": str(item.get("reason") or "unknown"), "reason_detail": str(item.get("detail") or ""),
            "raw_row": canonical_json(item.get("source_row") if isinstance(item.get("source_row"), dict) else {}),
            "created_at": _time(item.get("source_row") if isinstance(item.get("source_row"), dict) else {}),
        })

    reconciliations: List[Dict[str, Any]] = []
    for run in runs:
        dataset = run["dataset"]
        dataset_rows = groups[dataset]
        target_pairs: List[Tuple[str, str]] = []
        for item in dataset_rows:
            target_pairs.extend(lineage.get(str(item.get("source_row_hash") or ""), []))
        target_pairs = sorted(set(target_pairs))
        reconciliations.append({
            "run_id": run["run_id"], "dataset": dataset, "source_count": run["source_count"],
            "target_count": len(target_pairs), "quarantine_count": run["quarantine_count"],
            "source_digest": run["source_digest"], "target_digest": stable_hash(target_pairs),
            "matched": 0, "checked_at": run["finished_at"],
            "details": canonical_json({"verification": "pending_external_d1_export", "rule": "every source row is archived and ledgered; target pairs are canonical projections", "target_pairs": target_pairs}),
        })
    return {
        "runs": runs, "ledger": ledger, "quarantine": quarantine_rows,
        "source_archive": source_archive, "reconciliation": reconciliations,
        "external_verification": "pending",
        "target_sources": {f"{table}\u241e{target}": sorted({row_hash for row_hash, targets in lineage.items() if (table, target) in targets}) for table, rows in canonical.items() for target in [_key(table, row) for row in rows]},
    }


APP_AUDIT_SCHEMA_SQL = r"""
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS app_migration_source_archive (
  run_id TEXT NOT NULL REFERENCES app_migration_runs(run_id) ON DELETE RESTRICT,
  source_table TEXT NOT NULL, source_pk TEXT NOT NULL, source_path TEXT,
  source_index INTEGER, source_digest TEXT NOT NULL CHECK(length(source_digest)=64),
  raw_row TEXT NOT NULL CHECK(json_valid(raw_row) AND json_type(raw_row)='object'),
  redacted_fields TEXT NOT NULL CHECK(json_valid(redacted_fields) AND json_type(redacted_fields)='array'),
  disposition TEXT NOT NULL, target_table TEXT, target_pk TEXT,
  PRIMARY KEY(run_id,source_table,source_pk)
);
CREATE TABLE IF NOT EXISTS app_migration_import_state (
  run_id TEXT NOT NULL, target_table TEXT NOT NULL, target_pk TEXT NOT NULL,
  source_digest TEXT NOT NULL CHECK(length(source_digest)=64), existed_before INTEGER NOT NULL CHECK(existed_before IN(0,1)),
  expected_json TEXT NOT NULL CHECK(json_valid(expected_json) AND json_type(expected_json)='object'),
  PRIMARY KEY(run_id,target_table,target_pk)
);
CREATE TABLE IF NOT EXISTS app_migration_visit_day_state (
  run_id TEXT NOT NULL, visit_date TEXT NOT NULL, path TEXT NOT NULL,
  existed_before INTEGER NOT NULL CHECK(existed_before IN(0,1)), expected_insert_count INTEGER NOT NULL,
  PRIMARY KEY(run_id,visit_date,path)
);
CREATE UNIQUE INDEX IF NOT EXISTS app_migration_quarantine_dedupe
  ON app_migration_quarantine(run_id,source_table,ifnull(source_pk,''),reason_code);
""".strip()

BETA_AUDIT_SCHEMA_SQL = r"""
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS beta_migration_runs (
  run_id TEXT PRIMARY KEY, source_manifest_sha256 TEXT NOT NULL, source_count INTEGER NOT NULL,
  status TEXT NOT NULL, applied_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS beta_migration_import_state (
  run_id TEXT NOT NULL, target_table TEXT NOT NULL, target_pk TEXT NOT NULL,
  source_digest TEXT NOT NULL, existed_before INTEGER NOT NULL CHECK(existed_before IN(0,1)),
  expected_json TEXT NOT NULL CHECK(json_valid(expected_json) AND json_type(expected_json)='object'),
  PRIMARY KEY(run_id,target_table,target_pk)
);
CREATE TABLE IF NOT EXISTS beta_migration_conflicts (
  run_id TEXT NOT NULL, target_table TEXT NOT NULL, target_pk TEXT NOT NULL,
  reason TEXT NOT NULL, source_digest TEXT NOT NULL,
  PRIMARY KEY(run_id,target_table,target_pk,reason)
);
""".strip()


def _insert(table: str, row: Mapping[str, Any], columns: Sequence[str], select_where: Optional[str] = None) -> str:
    values = ",".join(_sql(row.get(column)) for column in columns)
    if select_where:
        return f"INSERT OR IGNORE INTO {table} ({','.join(columns)}) SELECT {values} WHERE {select_where};"
    return f"INSERT OR IGNORE INTO {table} ({','.join(columns)}) VALUES ({values});"


def _where(table: str, row: Mapping[str, Any]) -> str:
    return " AND ".join(f"{field} IS {_sql(row.get(field))}" for field in TABLE_KEYS[table])


def _equal(table: str, row: Mapping[str, Any], columns: Sequence[str]) -> str:
    return " AND ".join(f"{table}.{column} IS {_sql(row.get(column))}" for column in columns)


def emit_beta_import_sql(
    tables: Mapping[str, Sequence[Mapping[str, Any]]], batch_id: str, manifest_hash: str,
) -> str:
    beta = {table: list(tables.get(table, [])) for table in BETA_COLUMNS}
    count = sum(len(rows) for rows in beta.values())
    applied = min((_time(row) for rows in beta.values() for row in rows), default=EPOCH)
    lines = [BETA_AUDIT_SCHEMA_SQL, "BEGIN TRANSACTION;", _insert(
        "beta_migration_runs",
        {"run_id": batch_id, "source_manifest_sha256": manifest_hash, "source_count": count, "status": "imported", "applied_at": applied},
        ("run_id", "source_manifest_sha256", "source_count", "status", "applied_at"),
    )]
    for table in ("beta_events", "beta_surveys"):
        for row in beta[table]:
            target_key = _key(table, row)
            digest = stable_hash(row)
            exists = f"EXISTS(SELECT 1 FROM {table} WHERE {_where(table, row)})"
            expected = canonical_json(row)
            lines.append(
                "INSERT OR IGNORE INTO beta_migration_import_state(run_id,target_table,target_pk,source_digest,existed_before,expected_json) "
                f"VALUES({_sql(batch_id)},{_sql(table)},{_sql(target_key)},{_sql(digest)},CASE WHEN {exists} THEN 1 ELSE 0 END,{_sql(expected)});"
            )
            lines.append(
                "INSERT OR IGNORE INTO beta_migration_conflicts(run_id,target_table,target_pk,reason,source_digest) "
                f"SELECT {_sql(batch_id)},{_sql(table)},{_sql(target_key)},'existing_target_preserved',{_sql(digest)} "
                f"WHERE (SELECT existed_before FROM beta_migration_import_state WHERE run_id={_sql(batch_id)} AND target_table={_sql(table)} AND target_pk={_sql(target_key)})=1;"
            )
            condition = (
                f"(SELECT existed_before FROM beta_migration_import_state WHERE run_id={_sql(batch_id)} "
                f"AND target_table={_sql(table)} AND target_pk={_sql(target_key)})=0"
            )
            lines.append(_insert(table, row, BETA_COLUMNS[table], condition))
    lines.extend(["COMMIT;", ""])
    return "\n".join(lines)


def emit_beta_rollback_sql(tables: Mapping[str, Sequence[Mapping[str, Any]]], batch_id: str) -> str:
    lines = [BETA_AUDIT_SCHEMA_SQL, "BEGIN TRANSACTION;", "-- Existing or changed live rows are never removed."]
    for table in ("beta_surveys", "beta_events"):
        for row in reversed(list(tables.get(table, []))):
            target_key = _key(table, row)
            state = f"run_id={_sql(batch_id)} AND target_table={_sql(table)} AND target_pk={_sql(target_key)}"
            lines.append(
                f"DELETE FROM {table} WHERE {_where(table, row)} AND {_equal(table, row, BETA_COLUMNS[table])} "
                f"AND (SELECT existed_before FROM beta_migration_import_state WHERE {state})=0;"
            )
    lines.append(f"UPDATE beta_migration_runs SET status='rolled_back' WHERE run_id={_sql(batch_id)};")
    lines.extend(["COMMIT;", ""])
    return "\n".join(lines)


def _state_sql(table: str, row: Mapping[str, Any], batch_id: str, source_digest: str) -> str:
    target_key = _key(table, row)
    exists = f"EXISTS(SELECT 1 FROM {table} WHERE {_where(table, row)})"
    return (
        "INSERT OR IGNORE INTO app_migration_import_state(run_id,target_table,target_pk,source_digest,existed_before,expected_json) "
        f"VALUES({_sql(batch_id)},{_sql(table)},{_sql(target_key)},{_sql(source_digest)},CASE WHEN {exists} THEN 1 ELSE 0 END,{_sql(canonical_json(row))});"
    )


def _state_zero(table: str, row: Mapping[str, Any], batch_id: str) -> str:
    return (
        f"(SELECT existed_before FROM app_migration_import_state WHERE run_id={_sql(batch_id)} "
        f"AND target_table={_sql(table)} AND target_pk={_sql(_key(table, row))})=0"
    )


def emit_app_import_sql(
    tables: Mapping[str, Sequence[Mapping[str, Any]]], archive: Sequence[Mapping[str, Any]],
    quarantine: Sequence[Mapping[str, Any]], audit: Mapping[str, Any], batch_id: str,
) -> str:
    lines = [APP_AUDIT_SCHEMA_SQL, "BEGIN TRANSACTION;"]
    for row in audit.get("runs", []):
        lines.append(_insert("app_migration_runs", row, (
            "run_id", "source_provider", "source_project_ref", "dataset", "external_batch_id",
            "source_count", "source_digest", "imported_count", "quarantine_count", "status",
            "notes", "started_at", "finished_at",
        )))
    for row in audit.get("source_archive", []):
        lines.append(_insert("app_migration_source_archive", row, (
            "run_id", "source_table", "source_pk", "source_path", "source_index", "source_digest",
            "raw_row", "redacted_fields", "disposition", "target_table", "target_pk",
        )))
    for row in audit.get("quarantine", []):
        # Parser-only synthetic issues may not have a corresponding run; those
        # remain in the offline quarantine artifact rather than breaking apply.
        run_ids = {item["run_id"] for item in audit.get("runs", [])}
        if row.get("run_id") not in run_ids:
            continue
        lines.append(_insert("app_migration_quarantine", row, (
            "run_id", "source_table", "source_pk", "reason_code", "reason_detail", "raw_row", "created_at",
        )))

    target_sources = audit.get("target_sources", {})
    source_by_hash = {str(item.get("source_row_hash") or ""): item for item in archive}

    # Capture visit-day state before any raw insert so multiple visits for one
    # day all import together and the rollup trigger cannot double-count live data.
    visits_by_day: Dict[Tuple[str, str], List[Mapping[str, Any]]] = defaultdict(list)
    for row in tables.get("app_site_visits", []):
        visits_by_day[(str(row.get("created_at"))[:10], str(row.get("path") or "/"))].append(row)
    for (day, path), rows in sorted(visits_by_day.items()):
        lines.append(
            "INSERT OR IGNORE INTO app_migration_visit_day_state(run_id,visit_date,path,existed_before,expected_insert_count) "
            f"VALUES({_sql(batch_id)},{_sql(day)},{_sql(path)},CASE WHEN EXISTS(SELECT 1 FROM app_site_visits_daily WHERE visit_date={_sql(day)} AND path={_sql(path)}) THEN 1 ELSE 0 END,{len(rows)});"
        )

    # A journal head is trigger-created by the baseline version. Snapshot it first.
    for row in tables.get("app_journal_heads", []):
        digest = stable_hash(row)
        lines.append(_state_sql("app_journal_heads", row, batch_id, digest))

    journal_versions = {
        str(row.get("user_id")): row for row in tables.get("app_journal_versions", [])
    }

    for table in APP_TABLE_ORDER:
        if table == "app_journal_heads":
            continue
        for row in tables.get(table, []):
            target_key = _key(table, row)
            source_hashes = target_sources.get(f"{table}\u241e{target_key}", [])
            digest = stable_hash({"row": row, "sources": source_hashes})
            lines.append(_state_sql(table, row, batch_id, digest))
            condition = _state_zero(table, row, batch_id)
            if table == "app_journal_versions":
                condition += (
                    f" AND (SELECT existed_before FROM app_migration_import_state WHERE run_id={_sql(batch_id)} "
                    f"AND target_table='app_journal_heads' AND target_pk={_sql(str(row.get('user_id')))})=0"
                    f" AND NOT EXISTS(SELECT 1 FROM app_journal_versions WHERE user_id={_sql(row.get('user_id'))} AND version={_sql(row.get('version'))})"
                )
            elif table in {"app_journal_trades", "app_journal_notes", "app_journal_changes"}:
                version = journal_versions[str(row.get("user_id"))]
                condition += (
                    f" AND EXISTS(SELECT 1 FROM app_journal_versions WHERE user_id={_sql(row.get('user_id'))} "
                    f"AND version=1 AND base_version=0 AND request_id={_sql(version.get('request_id'))} "
                    f"AND payload_hash={_sql(version.get('payload_hash'))})"
                )
            elif table == "app_site_visits":
                day, path = str(row.get("created_at"))[:10], str(row.get("path") or "/")
                condition += (
                    f" AND (SELECT existed_before FROM app_migration_visit_day_state WHERE run_id={_sql(batch_id)} "
                    f"AND visit_date={_sql(day)} AND path={_sql(path)})=0"
                )
            lines.append(_insert(table, row, APP_COLUMNS[table], condition))

            # A pre-existing target is kept untouched and explicitly quarantined.
            if source_hashes:
                source = source_by_hash.get(source_hashes[0], {})
                dataset = f"{source.get('source_schema')}.{source.get('source_table')}"
                source_pk = next((item.get("source_pk") for item in audit.get("ledger", []) if item.get("source_digest") == source_hashes[0]), source.get("source_pk"))
                run_id = next((item.get("run_id") for item in audit.get("ledger", []) if item.get("source_digest") == source_hashes[0]), None)
                if run_id:
                    lines.append(
                        "INSERT OR IGNORE INTO app_migration_quarantine(run_id,source_table,source_pk,reason_code,reason_detail,raw_row,created_at) "
                        f"SELECT {_sql(run_id)},{_sql(dataset)},{_sql(source_pk)},'existing_target_preserved',"
                        f"{_sql(f'Cloudflare row {table}:{target_key} existed before this batch and was not overwritten')},"
                        f"{_sql(canonical_json(source.get('source_row') if isinstance(source.get('source_row'), dict) else {}))},{_sql(_time(source.get('source_row') if isinstance(source.get('source_row'), dict) else {}))} "
                        f"WHERE NOT {_state_zero(table, row, batch_id)};"
                    )
                    lines.append(
                        "INSERT OR IGNORE INTO app_migration_quarantine(run_id,source_table,source_pk,reason_code,reason_detail,raw_row,created_at) "
                        f"SELECT {_sql(run_id)},{_sql(dataset)},{_sql(source_pk)},'target_insert_blocked',"
                        f"{_sql(f'Canonical row {table}:{target_key} was not inserted; a parent/version guard or target constraint preserved existing Cloudflare state')},"
                        f"{_sql(canonical_json(source.get('source_row') if isinstance(source.get('source_row'), dict) else {}))},{_sql(_time(source.get('source_row') if isinstance(source.get('source_row'), dict) else {}))} "
                        f"WHERE {_state_zero(table, row, batch_id)} AND NOT EXISTS(SELECT 1 FROM {table} WHERE {_where(table, row)});"
                    )

    # One immutable ledger row per source row. App target conflicts become
    # duplicate rather than falsely claiming an insert.
    target_rows = {
        (table, _key(table, target)): target
        for table, rows in tables.items() if table in APP_COLUMNS
        for target in rows
    }
    for row in audit.get("ledger", []):
        status_expr = _sql(row.get("status"))
        table, target_pk = row.get("target_table"), row.get("target_pk")
        if table in APP_COLUMNS and target_pk is not None:
            target = target_rows.get((str(table), str(target_pk)))
            landed = (
                f"EXISTS(SELECT 1 FROM {table} WHERE {_where(str(table), target)})"
                if target is not None else "0"
            )
            status_expr = (
                f"CASE WHEN (SELECT existed_before FROM app_migration_import_state WHERE run_id={_sql(batch_id)} "
                f"AND target_table={_sql(table)} AND target_pk={_sql(target_pk)})=1 THEN 'duplicate' "
                f"WHEN {landed} THEN {_sql(row.get('status'))} ELSE 'quarantined' END"
            )
        columns = ("run_id", "source_table", "source_pk", "source_digest", "target_table", "target_pk", "status", "imported_at")
        values = [_sql(row.get(column)) for column in columns]
        values[6] = status_expr
        lines.append(f"INSERT OR IGNORE INTO app_migration_ledger ({','.join(columns)}) VALUES ({','.join(values)});")

    for run in audit.get("runs", []):
        run_id = _sql(run.get("run_id"))
        lines.append(
            "UPDATE app_migration_runs SET "
            f"imported_count=(SELECT count(*) FROM app_migration_ledger WHERE run_id={run_id} AND status='imported'),"
            f"quarantine_count=(SELECT count(*) FROM app_migration_quarantine WHERE run_id={run_id}) "
            f"WHERE run_id={run_id};"
        )

    # Do not manufacture reconciliation proof during import. Runs remain
    # status='imported' and the dashboard sees zero reconciliation rows until a
    # separately exported D1 snapshot passes cloudflare_reconcile.py.
    lines.extend(["COMMIT;", ""])
    return "\n".join(lines)


def emit_app_rollback_sql(tables: Mapping[str, Sequence[Mapping[str, Any]]], batch_id: str) -> str:
    lines = [APP_AUDIT_SCHEMA_SQL, "BEGIN TRANSACTION;", "-- Deletes only unchanged rows proven absent before this batch; audit rows remain."]
    reverse = tuple(reversed(APP_TABLE_ORDER))
    for table in reverse:
        if table in {"app_identities", "app_journal_heads", "app_journal_versions", "app_site_visits_daily"}:
            continue
        for row in reversed(list(tables.get(table, []))):
            condition = f"{_where(table, row)} AND {_equal(table, row, APP_COLUMNS[table])} AND {_state_zero(table, row, batch_id)}"
            if table == "app_identities":
                user = _sql(row.get("id"))
                condition += (
                    f" AND NOT EXISTS(SELECT 1 FROM app_sessions WHERE user_id={user})"
                    f" AND NOT EXISTS(SELECT 1 FROM app_account_claims WHERE user_id={user})"
                    f" AND NOT EXISTS(SELECT 1 FROM app_profiles WHERE user_id={user})"
                    f" AND NOT EXISTS(SELECT 1 FROM app_journal_heads WHERE user_id={user})"
                    f" AND NOT EXISTS(SELECT 1 FROM app_daily_streak WHERE user_id={user})"
                    f" AND NOT EXISTS(SELECT 1 FROM app_mastery WHERE user_id={user})"
                    f" AND NOT EXISTS(SELECT 1 FROM app_bug_reports WHERE user_id={user})"
                )
            lines.append(f"DELETE FROM {table} WHERE {condition};")

    # Journal aggregate rows have ordering/guard requirements.
    for row in reversed(list(tables.get("app_journal_versions", []))):
        user = _sql(row.get("user_id"))
        condition = f"{_where('app_journal_versions', row)} AND {_equal('app_journal_versions', row, APP_COLUMNS['app_journal_versions'])} AND {_state_zero('app_journal_versions', row, batch_id)}"
        condition += f" AND NOT EXISTS(SELECT 1 FROM app_journal_changes WHERE user_id={user} AND journal_version=1)"
        condition += f" AND EXISTS(SELECT 1 FROM app_journal_heads WHERE user_id={user} AND current_version=1)"
        lines.append(f"DELETE FROM app_journal_versions WHERE {condition};")
    for row in reversed(list(tables.get("app_journal_heads", []))):
        lines.append(
            f"DELETE FROM app_journal_heads WHERE {_where('app_journal_heads', row)} AND {_equal('app_journal_heads', row, APP_COLUMNS['app_journal_heads'])} AND {_state_zero('app_journal_heads', row, batch_id)} "
            f"AND NOT EXISTS(SELECT 1 FROM app_journal_versions WHERE user_id={_sql(row.get('user_id'))});"
        )

    # Raw-visit deletes do not decrement the trigger-maintained rollup. Remove a
    # rollup only when it still exactly equals this batch's isolated contribution.
    visit_groups: Dict[Tuple[str, str], List[Mapping[str, Any]]] = defaultdict(list)
    for row in tables.get("app_site_visits", []):
        visit_groups[(str(row.get("created_at"))[:10], str(row.get("path") or "/"))].append(row)
    for (day, path), rows in sorted(visit_groups.items()):
        first = min(str(row.get("created_at")) for row in rows)
        last = max(str(row.get("created_at")) for row in rows)
        lines.append(
            f"DELETE FROM app_site_visits_daily WHERE visit_date={_sql(day)} AND path={_sql(path)} "
            f"AND visit_count={len(rows)} AND first_seen_at={_sql(first)} AND last_seen_at={_sql(last)} "
            f"AND (SELECT existed_before FROM app_migration_visit_day_state WHERE run_id={_sql(batch_id)} AND visit_date={_sql(day)} AND path={_sql(path)})=0;"
        )
    for row in reversed(list(tables.get("app_site_visits_daily", []))):
        lines.append(
            f"DELETE FROM app_site_visits_daily WHERE {_where('app_site_visits_daily', row)} AND {_equal('app_site_visits_daily', row, APP_COLUMNS['app_site_visits_daily'])} AND {_state_zero('app_site_visits_daily', row, batch_id)};"
        )

    # Identities are last because every imported account-owned row must first be
    # removed or deliberately retained as drift. The dependency checks also
    # protect any post-import claims, sessions, or gameplay data.
    for row in reversed(list(tables.get("app_identities", []))):
        user = _sql(row.get("id"))
        condition = f"{_where('app_identities', row)} AND {_equal('app_identities', row, APP_COLUMNS['app_identities'])} AND {_state_zero('app_identities', row, batch_id)}"
        condition += (
            f" AND NOT EXISTS(SELECT 1 FROM app_sessions WHERE user_id={user})"
            f" AND NOT EXISTS(SELECT 1 FROM app_account_claims WHERE user_id={user})"
            f" AND NOT EXISTS(SELECT 1 FROM app_profiles WHERE user_id={user})"
            f" AND NOT EXISTS(SELECT 1 FROM app_journal_heads WHERE user_id={user})"
            f" AND NOT EXISTS(SELECT 1 FROM app_journal_versions WHERE user_id={user})"
            f" AND NOT EXISTS(SELECT 1 FROM app_journal_trades WHERE user_id={user})"
            f" AND NOT EXISTS(SELECT 1 FROM app_journal_notes WHERE user_id={user})"
            f" AND NOT EXISTS(SELECT 1 FROM app_daily_streak WHERE user_id={user})"
            f" AND NOT EXISTS(SELECT 1 FROM app_mastery WHERE user_id={user})"
            f" AND NOT EXISTS(SELECT 1 FROM app_bug_reports WHERE user_id={user})"
        )
        lines.append(f"DELETE FROM app_identities WHERE {condition};")
    lines.append(f"UPDATE app_migration_runs SET status='rolled_back' WHERE external_batch_id={_sql(batch_id)} AND status!='rolled_back';")
    lines.extend(["COMMIT;", ""])
    return "\n".join(lines)
