#!/usr/bin/env python3
"""Build a credential-free, loss-preserving Supabase -> Cloudflare D1 bundle.

The program reads a complete JSON export (one file or a directory), but never
connects to either provider and never asks for a key.  Application rows are
normalized for D1 and every sanitized source row is retained in an audit/reverse
export.  Unknown, malformed, conflicting, or ambiguous rows go to quarantine;
they are never silently discarded.

Authentication secrets (password hashes, reset/refresh/access tokens, OTP/MFA
secrets, API keys) are intentionally removed before any output is written.  User
and identity metadata is retained, but Supabase sessions cannot be migrated and
players must authenticate again after an auth cutover.

Exit codes: 0 bundle ready; 1 bundle built with blocking quarantine; 2 fatal.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Optional, Sequence, Tuple

from cloudflare_reconcile import build_report, canonical_json, rows_hash, stable_hash, _visit_report
from cloudflare_import_canonical import (
    emit_app_import_sql, emit_app_rollback_sql,
    emit_beta_import_sql, emit_beta_rollback_sql,
    project_to_canonical,
)


TOOL_VERSION = "2.0.0"
BUNDLE_FORMAT = "chartquest-cloudflare-import-v2"
SOURCE_SYSTEM = "supabase"
SOURCE_PROJECT_REF = "ymxppzhczvmiuoncuqqu"
SOURCE_EXPORT_PROOF_FORMAT = "chartquest-supabase-export-proof-v1"
SOURCE_EXPORT_GENERATOR = "chartquest-approved-supabase-exporter-v1"

# These are the source-side primary/order keys the approved exporter must use
# for keyset pagination.  Requiring the exact keys makes repeated/overlapping
# pages detectable instead of trusting an unverified "complete" boolean.
SOURCE_TABLE_KEYS: Dict[str, Tuple[str, ...]] = {
    "auth.users": ("id",),
    "auth.identities": ("id",),
    "public.beta_events": ("id",),
    "public.beta_surveys": ("id",),
    "public.profiles": ("id",),
    "public.journal_trades": ("id",),
    "public.journal_notes": ("id",),
    "public.daily_streak": ("id",),
    "public.player_mastery": ("player_id", "category"),
    "public.bug_reports": ("id",),
    "public.site_visits": ("id",),
    "public.site_visits_daily": ("day",),
    "public.content_events": ("id",),
    "public.content_replays": ("id",),
    "public.content_briefs": ("id",),
    "public.content_assets": ("id",),
    "public.content_generated": ("id",),
    "public.content_exports": ("id",),
    "public.published_posts": ("id",),
    "public.performance_snapshots": ("id",),
    "public.admins": ("user_id",),
}
REQUIRED_SOURCE_TABLES = set(SOURCE_TABLE_KEYS)

# Internal/source-shape keys. The public reconciliation module uses the actual
# Cloudflare app_* target keys instead.
LOGICAL_TABLE_KEYS: Dict[str, Tuple[str, ...]] = {
    "beta_events": ("event_id",), "beta_surveys": ("response_id",),
    "auth_users": ("id",), "auth_identities": ("id",), "profiles": ("id",),
    "journal_trades": ("row_key",), "journal_notes": ("row_key",),
    "daily_streak": ("id",), "player_mastery": ("player_id", "category"),
    "bug_reports": ("report_id",), "site_visits": ("visit_id",),
    "site_visits_daily": ("day",), "content_events": ("event_id",),
    "content_replays": ("replay_id",), "content_briefs": ("record_id",),
    "content_assets": ("record_id",), "content_generated": ("record_id",),
    "content_exports": ("record_id",), "published_posts": ("record_id",),
    "performance_snapshots": ("record_id",),
    "content_records": ("source_table", "record_id"), "admins": ("user_id",),
}

EVENT_NAMES = {
    "session_start", "session_end", "return_visit", "play_clicked",
    "movement_tutorial_completed", "tutorial_started", "tutorial_completed",
    "tutorial_step_reached", "first_trade_started", "first_trade_won",
    "first_trade_lost", "boss_started", "boss_defeated", "journal_unlocked",
    "journal_discovery_started", "journal_discovery_completed",
    "journal_discovery_skipped", "beta_completed", "survey_started",
    "survey_submitted", "crash",
}
CONTINUE_VALUES = {"immediately", "later", "not_interested"}
MASTERY_CATEGORIES = {
    "trend": "Trend",
    "structure": "Structure",
    "liquidity": "Liquidity",
    "orderblocks": "OrderBlocks",
    "riskmgmt": "RiskMgmt",
    "trademgmt": "TradeMgmt",
    "multitf": "MultiTF",
}
AMBIGUOUS_MASTERY = {"momentum", "psychology", "entries", "confluence", "patience"}

KNOWN_CONTENT = {
    "content_events", "content_replays", "content_briefs", "content_assets",
    "content_generated", "content_exports", "published_posts",
    "performance_snapshots",
}
KNOWN_TABLES = {
    "beta_events", "beta_surveys", "auth_users", "auth_identities", "profiles",
    "journal_trades", "journal_notes", "daily_streak", "player_mastery",
    "bug_reports", "site_visits", "site_visits_daily", "admins",
} | KNOWN_CONTENT
EPHEMERAL_TABLES = {
    "ingest_throttle", "beta_ingest_throttle", "schema_migrations",
    "supabase_migrations", "_prisma_migrations",
}
SECRET_AUTH_TABLES = {
    "sessions", "refresh_tokens", "mfa_factors", "mfa_challenges",
    "one_time_tokens", "flow_state", "sso_sessions",
}

SENSITIVE_EXACT = {
    "password", "password_hash", "encrypted_password", "access_token",
    "refresh_token", "provider_token", "provider_refresh_token", "token",
    "secret", "client_secret", "api_key", "apikey", "anon_key",
    "service_role_key", "otp_secret", "factor_secret", "recovery_token",
    "confirmation_token", "reauthentication_token", "phone_change_token",
    "email_change_token_current", "email_change_token_new",
    "hashed_token", "token_hash", "refresh_token_hash", "verification_token",
    "code_verifier", "oauth_state", "private_key", "signing_key", "webauthn_secret",
}


class ImportFailure(Exception):
    pass


class RowProblem(Exception):
    def __init__(self, reason: str, detail: str, severity: str = "error") -> None:
        super().__init__(detail)
        self.reason = reason
        self.detail = detail
        self.severity = severity


@dataclass
class SourceRow:
    source_schema: str
    source_table: str
    source_path: str
    source_index: int
    row: Dict[str, Any]
    row_hash: str
    redacted_fields: List[str] = field(default_factory=list)
    disposition: str = "pending"
    target_table: Optional[str] = None
    target_key: Optional[str] = None

    @property
    def ref(self) -> str:
        return f"{self.source_path}:{self.source_schema}.{self.source_table}:{self.source_index}:{self.row_hash[:12]}"

    def archive(self) -> Dict[str, Any]:
        return {
            "source_schema": self.source_schema,
            "source_table": self.source_table,
            "source_path": self.source_path,
            "source_index": self.source_index,
            "source_pk": _source_pk(self.row),
            "source_row_hash": self.row_hash,
            "source_row": self.row,
            "redacted_fields": self.redacted_fields,
            "disposition": self.disposition,
            "target_table": self.target_table,
            "target_key": self.target_key,
        }


@dataclass
class Candidate:
    source: SourceRow
    target: str
    key: str
    row: Dict[str, Any]
    policy: str = "unique"
    logical_group: Optional[str] = None


def _is_sensitive_key(key: str) -> bool:
    name = re.sub(r"[^a-z0-9]+", "_", str(key).lower()).strip("_")
    if name in SENSITIVE_EXACT or "password" in name:
        return True
    if name.endswith(("_token", "_access_token", "_refresh_token", "_secret")):
        return True
    return False


def sanitize(value: Any, path: str = "$") -> Tuple[Any, List[str]]:
    """Return a copy with credential-bearing fields removed, plus their paths."""
    redacted: List[str] = []
    if isinstance(value, dict):
        clean: Dict[str, Any] = {}
        for key in sorted(value, key=lambda item: str(item)):
            child_path = f"{path}.{key}"
            if _is_sensitive_key(str(key)):
                redacted.append(child_path)
                continue
            child, found = sanitize(value[key], child_path)
            clean[str(key)] = child
            redacted.extend(found)
        return clean, redacted
    if isinstance(value, list):
        clean_list: List[Any] = []
        for index, item in enumerate(value):
            child, found = sanitize(item, f"{path}[{index}]")
            clean_list.append(child)
            redacted.extend(found)
        return clean_list, redacted
    return value, redacted


def _json_value(value: Any, default: Any) -> Any:
    if value is None:
        return default
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    return value


def _json_text(value: Any, default: Any) -> str:
    return canonical_json(_json_value(value, default))


def _json_object_text(value: Any, field_name: str) -> str:
    parsed = _json_value(value, {})
    if not isinstance(parsed, dict):
        raise RowProblem("invalid_json_shape", f"{field_name} must be a JSON object")
    return canonical_json(parsed)


def _json_array_text(value: Any, field_name: str) -> str:
    parsed = _json_value(value, [])
    if not isinstance(parsed, list):
        raise RowProblem("invalid_json_shape", f"{field_name} must be a JSON array")
    return canonical_json(parsed)


def _first(row: Mapping[str, Any], *names: str, default: Any = None) -> Any:
    for name in names:
        if name in row and row[name] is not None:
            return row[name]
    return default


def _required(row: Mapping[str, Any], *names: str) -> Any:
    value = _first(row, *names)
    if value is None or (isinstance(value, str) and not value.strip()):
        raise RowProblem("missing_required_field", f"required field is absent: {'/'.join(names)}")
    return value


def _integer(value: Any, field_name: str, minimum: Optional[int] = None, maximum: Optional[int] = None) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError):
        raise RowProblem("invalid_integer", f"{field_name} is not an integer")
    if minimum is not None and number < minimum:
        raise RowProblem("invalid_integer", f"{field_name} is below {minimum}")
    if maximum is not None and number > maximum:
        raise RowProblem("invalid_integer", f"{field_name} is above {maximum}")
    return number


def _source_pk(row: Mapping[str, Any]) -> Optional[str]:
    for name in ("id", "event_id", "response_id", "replay_id", "user_id", "player_id", "day"):
        value = row.get(name)
        if value not in (None, ""):
            return str(value)
    return None


def _record_id(source: SourceRow, *names: str) -> str:
    value = _first(source.row, *names)
    return str(value) if value not in (None, "") else f"derived:{source.row_hash[:32]}"


def _row_time(row: Mapping[str, Any]) -> str:
    value = _first(
        row, "updated_at", "created_at", "ts", "exported_at", "published_at",
        "captured_at", "added_at", "day", default="",
    )
    return str(value or "")


def _target_key(target: str, row: Mapping[str, Any]) -> str:
    fields = LOGICAL_TABLE_KEYS[target]
    return "\u241f".join(str(row.get(field) or "") for field in fields)


def _normalize_name(schema: str, table: str) -> Tuple[str, str]:
    schema = (schema or "public").strip().lower()
    table = table.strip().lower().replace("-", "_")
    if "." in table:
        possible_schema, table = table.rsplit(".", 1)
        if possible_schema in ("public", "auth"):
            schema = possible_schema
    if table.startswith("public_"):
        table = table[len("public_"):]
    if table.startswith("auth_") and table in ("auth_users", "auth_identities"):
        return schema, table
    if table.startswith("auth_") and table[len("auth_"):] in SECRET_AUTH_TABLES:
        return "auth", table[len("auth_"):]
    if schema == "auth" and table == "users":
        return schema, "auth_users"
    if schema == "auth" and table == "identities":
        return schema, "auth_identities"
    aliases = {
        "events": "beta_events",
        "prev_events": "beta_events",
        "surveys": "beta_surveys",
        "prev_surveys": "beta_surveys",
        "bugs": "bug_reports",
        "visits": "site_visits",
        "daily_visits": "site_visits_daily",
    }
    return schema, aliases.get(table, table)


def _contract_table_name(schema: str, table: str) -> str:
    """Return the exact source-facing schema.table name used by proof files."""
    norm_schema, norm_table = _normalize_name(schema, table)
    if norm_schema == "auth" and norm_table in {"auth_users", "auth_identities"}:
        return f"auth.{norm_table.removeprefix('auth_')}"
    return f"{norm_schema}.{norm_table}"


def _proof_issue(reason: str, detail: str, table: str = "__export_contract__") -> Dict[str, Any]:
    schema, source_table = table.split(".", 1) if "." in table else ("manifest", table)
    evidence = {"table": table, "reason": reason, "detail": detail}
    return {
        "reason": reason,
        "severity": "error",
        "source_schema": schema,
        "source_table": source_table,
        "source_path": "<source-export-proof>",
        "source_index": -1,
        "source_row_hash": stable_hash(evidence),
        "detail": detail,
        "source_row": evidence,
    }


def _cursor(row: Mapping[str, Any], key_columns: Sequence[str]) -> Optional[List[Any]]:
    values: List[Any] = []
    for column in key_columns:
        value = row.get(column)
        if value is None or isinstance(value, (dict, list)):
            return None
        values.append(value)
    return values


def _cursor_order_key(values: Sequence[Any]) -> Tuple[Tuple[str, Any], ...]:
    output: List[Tuple[str, Any]] = []
    for value in values:
        if isinstance(value, bool):
            output.append(("bool", int(value)))
        elif isinstance(value, (int, float)) and not isinstance(value, bool):
            output.append(("number", value))
        elif isinstance(value, str):
            output.append(("string", value))
        else:
            output.append((type(value).__name__, canonical_json(value)))
    return tuple(output)


def _raw_rows_hash(rows: Iterable[Any]) -> str:
    encoded = sorted(canonical_json(row) for row in rows)
    payload = "\n".join(encoded) + ("\n" if encoded else "")
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _validate_source_export_proof(
    candidates: Sequence[Tuple[str, Mapping[str, Any]]],
    raw_tables: Mapping[str, Sequence[Any]],
) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Verify source counts/digests and an unbroken keyset page attestation.

    Hashes are calculated over raw parsed rows before secret stripping, but the
    returned report contains only counts and digests.  Raw credential values
    therefore never enter a generated migration artifact.
    """
    issues: List[Dict[str, Any]] = []
    summary: Dict[str, Any] = {
        "format": SOURCE_EXPORT_PROOF_FORMAT,
        "required": True,
        "verified": False,
        "evidence_sources": sorted(path for path, _proof in candidates),
        "tables": {},
    }
    if not candidates:
        issues.append(_proof_issue(
            "missing_source_export_proof",
            "a source-generated export_evidence block with per-table count, digest, and keyset-page proof is required",
        ))
        summary["failure_count"] = len(issues)
        summary["evidence_sha256"] = None
        return summary, issues
    if len(candidates) != 1:
        issues.append(_proof_issue(
            "ambiguous_source_export_proof",
            "exactly one authoritative export_evidence block is required; embedded and separate proofs cannot be combined",
        ))
        summary["failure_count"] = len(issues)
        summary["evidence_sha256"] = stable_hash([proof for _path, proof in candidates])
        return summary, issues

    source_path, proof = candidates[0]
    summary["evidence_source"] = source_path
    summary["evidence_sha256"] = stable_hash(proof)
    summary["export_id"] = proof.get("export_id")
    summary["generated_at"] = proof.get("generated_at")
    summary["snapshot_id"] = proof.get("snapshot_id")
    header_checks = {
        "format": proof.get("format") == SOURCE_EXPORT_PROOF_FORMAT,
        "generated_by": proof.get("generated_by") == SOURCE_EXPORT_GENERATOR,
        "source_provider": str(proof.get("source_provider") or "").lower() == SOURCE_SYSTEM,
        "project_ref": str(proof.get("project_ref") or "") == SOURCE_PROJECT_REF,
        "export_id": isinstance(proof.get("export_id"), str) and bool(str(proof.get("export_id")).strip()),
        "generated_at": isinstance(proof.get("generated_at"), str) and bool(str(proof.get("generated_at")).strip()),
        "snapshot_id": isinstance(proof.get("snapshot_id"), str) and bool(str(proof.get("snapshot_id")).strip()),
        "snapshot_consistent": proof.get("snapshot_consistent") is True,
    }
    summary["header_checks"] = header_checks
    for field, valid in header_checks.items():
        if not valid:
            issues.append(_proof_issue(
                "invalid_source_export_proof_header",
                f"export_evidence.{field} is absent or invalid",
            ))

    declared_tables = proof.get("tables")
    if not isinstance(declared_tables, dict):
        issues.append(_proof_issue(
            "invalid_source_export_proof_tables",
            "export_evidence.tables must be an object keyed by exact schema.table names",
        ))
        declared_tables = {}

    normalized_evidence: Dict[str, Mapping[str, Any]] = {}
    for declared_name, value in sorted(declared_tables.items()):
        text_name = str(declared_name)
        if "." not in text_name or not isinstance(value, dict):
            issues.append(_proof_issue(
                "invalid_source_table_proof",
                f"table evidence {text_name!r} must be an object under an exact schema.table key",
                text_name,
            ))
            continue
        schema, table = text_name.split(".", 1)
        normalized_name = _contract_table_name(schema, table)
        if normalized_name in normalized_evidence:
            issues.append(_proof_issue(
                "duplicate_source_table_proof",
                f"multiple evidence entries normalize to {normalized_name}",
                normalized_name,
            ))
            continue
        normalized_evidence[normalized_name] = value

    for table in sorted(REQUIRED_SOURCE_TABLES):
        raw_rows = list(raw_tables.get(table, []))
        actual_count = len(raw_rows)
        actual_digest = _raw_rows_hash(raw_rows)
        table_summary: Dict[str, Any] = {
            "parsed_rows": actual_count,
            "parsed_rows_sha256": actual_digest,
            "verified": False,
        }
        summary["tables"][table] = table_summary
        evidence = normalized_evidence.get(table)
        if evidence is None:
            issues.append(_proof_issue(
                "required_source_table_proof_missing",
                f"export_evidence.tables must include {table}",
                table,
            ))
            continue

        expected_count = evidence.get("source_row_count")
        expected_digest = evidence.get("source_rows_sha256")
        key_columns = evidence.get("key_columns")
        pagination = evidence.get("pagination")
        table_summary.update({
            "declared_source_rows": expected_count,
            "declared_source_rows_sha256": expected_digest,
            "key_columns": key_columns,
        })
        table_failures_before = len(issues)
        if isinstance(expected_count, bool) or not isinstance(expected_count, int) or expected_count < 0:
            issues.append(_proof_issue(
                "invalid_source_table_count_proof",
                f"{table}.source_row_count must be a non-negative integer",
                table,
            ))
        elif expected_count != actual_count:
            issues.append(_proof_issue(
                "source_table_count_mismatch",
                f"{table} parsed {actual_count} rows but the source proof declares {expected_count}",
                table,
            ))
        if not isinstance(expected_digest, str) or re.fullmatch(r"[0-9a-f]{64}", expected_digest) is None:
            issues.append(_proof_issue(
                "invalid_source_table_digest_proof",
                f"{table}.source_rows_sha256 must be a lowercase SHA-256 digest",
                table,
            ))
        elif expected_digest != actual_digest:
            issues.append(_proof_issue(
                "source_table_digest_mismatch",
                f"{table} raw parsed-row digest does not match the source-generated digest",
                table,
            ))
        expected_keys = list(SOURCE_TABLE_KEYS[table])
        if key_columns != expected_keys:
            issues.append(_proof_issue(
                "wrong_source_pagination_keys",
                f"{table}.key_columns must be exactly {expected_keys}",
                table,
            ))

        cursors: List[List[Any]] = []
        source_keys_valid = key_columns == expected_keys
        if source_keys_valid:
            for row_index, raw_row in enumerate(raw_rows):
                cursor = _cursor(raw_row, expected_keys) if isinstance(raw_row, dict) else None
                if cursor is None:
                    issues.append(_proof_issue(
                        "source_pagination_key_missing",
                        f"{table} row {row_index} lacks a scalar key column required for page proof",
                        table,
                    ))
                    source_keys_valid = False
                    break
                cursors.append(cursor)
        if source_keys_valid:
            tokens = [canonical_json(cursor) for cursor in cursors]
            if len(tokens) != len(set(tokens)):
                issues.append(_proof_issue(
                    "duplicate_source_pagination_key",
                    f"{table} contains a repeated source key, consistent with an overlapping or duplicated page",
                    table,
                ))
            order = [_cursor_order_key(cursor) for cursor in cursors]
            if any(current >= following for current, following in zip(order, order[1:])):
                issues.append(_proof_issue(
                    "source_rows_not_keyset_ordered",
                    f"{table} rows are not strictly ordered by {expected_keys}",
                    table,
                ))

        if not isinstance(pagination, dict):
            issues.append(_proof_issue(
                "incomplete_source_pagination_proof",
                f"{table}.pagination must contain a complete keyset page chain",
                table,
            ))
        else:
            pages = pagination.get("pages")
            page_count = pagination.get("page_count")
            table_summary["pagination"] = {
                "mode": pagination.get("mode"),
                "complete": pagination.get("complete"),
                "page_count": page_count,
            }
            if pagination.get("mode") != "keyset" or pagination.get("complete") is not True:
                issues.append(_proof_issue(
                    "incomplete_source_pagination_proof",
                    f"{table} must declare mode=keyset and complete=true",
                    table,
                ))
            if not isinstance(pages, list) or not pages:
                issues.append(_proof_issue(
                    "incomplete_source_pagination_proof",
                    f"{table}.pagination.pages must contain at least one terminal page proof",
                    table,
                ))
            else:
                indexes = [page.get("page_index") if isinstance(page, dict) else None for page in pages]
                if len(indexes) != len(set(canonical_json(index) for index in indexes)):
                    issues.append(_proof_issue(
                        "duplicate_source_pagination_page",
                        f"{table} contains a duplicate page_index",
                        table,
                    ))
                if indexes != list(range(len(pages))) or isinstance(page_count, bool) or page_count != len(pages):
                    issues.append(_proof_issue(
                        "source_pagination_page_count_mismatch",
                        f"{table} page indexes/count are not one contiguous 0-based sequence",
                        table,
                    ))
                offset = 0
                previous_cursor: Optional[List[Any]] = None
                seen_page_outputs: set[str] = set()
                for page_index, page in enumerate(pages):
                    if not isinstance(page, dict):
                        issues.append(_proof_issue(
                            "invalid_source_pagination_page",
                            f"{table} page {page_index} is not an object",
                            table,
                        ))
                        continue
                    row_count = page.get("row_count")
                    if isinstance(row_count, bool) or not isinstance(row_count, int) or row_count < 0:
                        issues.append(_proof_issue(
                            "invalid_source_pagination_page",
                            f"{table} page {page_index} row_count is invalid",
                            table,
                        ))
                        continue
                    if row_count == 0 and not (len(pages) == 1 and actual_count == 0):
                        issues.append(_proof_issue(
                            "incomplete_source_pagination_proof",
                            f"{table} has an unexpected empty page in its keyset chain",
                            table,
                        ))
                    segment = raw_rows[offset:offset + row_count]
                    offset += row_count
                    page_digest = page.get("rows_sha256")
                    if page_digest != _raw_rows_hash(segment):
                        issues.append(_proof_issue(
                            "source_pagination_page_digest_mismatch",
                            f"{table} page {page_index} digest does not match its parsed rows",
                            table,
                        ))
                    expected_has_more = page_index < len(pages) - 1
                    if page.get("has_more") is not expected_has_more:
                        issues.append(_proof_issue(
                            "incomplete_source_pagination_proof",
                            f"{table} page {page_index} has_more does not prove a terminal page",
                            table,
                        ))
                    if page.get("cursor_in") != previous_cursor:
                        issues.append(_proof_issue(
                            "source_pagination_cursor_mismatch",
                            f"{table} page {page_index} cursor_in does not continue the prior page",
                            table,
                        ))
                    expected_out = _cursor(segment[-1], expected_keys) if segment and source_keys_valid else None
                    if page.get("cursor_out") != expected_out:
                        issues.append(_proof_issue(
                            "source_pagination_cursor_mismatch",
                            f"{table} page {page_index} cursor_out does not match the page's last source key",
                            table,
                        ))
                    if expected_out is not None:
                        cursor_token = canonical_json(expected_out)
                        if cursor_token in seen_page_outputs:
                            issues.append(_proof_issue(
                                "duplicate_source_pagination_page",
                                f"{table} repeats a page output cursor",
                                table,
                            ))
                        seen_page_outputs.add(cursor_token)
                    previous_cursor = expected_out
                if offset != actual_count or (isinstance(expected_count, int) and offset != expected_count):
                    issues.append(_proof_issue(
                        "source_pagination_row_count_mismatch",
                        f"{table} page row counts total {offset}, parsed rows total {actual_count}, source count {expected_count}",
                        table,
                    ))
        table_summary["verified"] = len(issues) == table_failures_before

    summary["failure_count"] = len(issues)
    summary["verified"] = not issues
    summary["tables_sha256"] = stable_hash(summary["tables"])
    return summary, issues


def _infer_file_table(file_path: Path, root: Path) -> Tuple[str, Optional[str]]:
    name = file_path.name
    for suffix in (".jsonl", ".ndjson", ".json"):
        if name.lower().endswith(suffix):
            name = name[:-len(suffix)]
            break
    schema = "public"
    if "." in name:
        head, tail = name.rsplit(".", 1)
        if head.lower() in ("public", "auth"):
            schema, name = head.lower(), tail
    try:
        parent = file_path.relative_to(root).parent.name.lower()
    except ValueError:
        parent = file_path.parent.name.lower()
    if parent in ("public", "auth"):
        schema = parent
    if name.lower() in ("export", "snapshot", "data", "supabase-export", "supabase_export"):
        return schema, None
    return _normalize_name(schema, name)


def load_source(path: Path) -> Tuple[List[SourceRow], List[Dict[str, Any]], str, Dict[str, Any], Dict[str, Any]]:
    if not path.exists():
        raise ImportFailure(f"input does not exist: {path}")
    files = [path] if path.is_file() else sorted(
        child for child in path.rglob("*") if child.is_file() and child.suffix.lower() in (".json", ".jsonl", ".ndjson")
    )
    if not files:
        raise ImportFailure("input contains no .json, .jsonl, or .ndjson files")
    root = path if path.is_dir() else path.parent
    rows: List[SourceRow] = []
    issues: List[Dict[str, Any]] = []
    file_manifest: List[Dict[str, Any]] = []
    redacted_counter: Counter[str] = Counter()
    present_tables: set[str] = set()
    raw_tables: Dict[str, List[Any]] = defaultdict(list)
    declared_project_refs: set[str] = set()
    declared_providers: set[str] = set()
    metadata_sources: List[str] = []
    export_proof_candidates: List[Tuple[str, Mapping[str, Any]]] = []

    def capture_metadata(doc: Any, rel: str, manifest_file: bool = False) -> bool:
        """Capture non-secret provenance proof; return true for a metadata-only file."""
        if not isinstance(doc, dict):
            return False
        candidates: List[Mapping[str, Any]] = []
        for key in ("_meta", "metadata", "manifest"):
            value = doc.get(key)
            if isinstance(value, dict):
                candidates.append(value)
        if manifest_file:
            candidates.append(doc)
        found = False
        for value in candidates:
            project_ref = _first(
                value, "project_ref", "source_project_ref", "supabase_project_ref",
                "project_id", "source_project_id",
            )
            provider = _first(value, "source_provider", "provider")
            if project_ref not in (None, ""):
                declared_project_refs.add(str(project_ref).strip())
                found = True
            if provider not in (None, ""):
                declared_providers.add(str(provider).strip().lower())
            if project_ref not in (None, "") or provider not in (None, ""):
                metadata_sources.append(rel)
            export_proof = value.get("export_evidence")
            if isinstance(export_proof, dict):
                export_proof_candidates.append((rel, dict(export_proof)))
        return manifest_file and found

    def add_row(schema: str, table: str, raw: Any, rel: str, index: int) -> None:
        norm_schema, norm_table = _normalize_name(schema, table)
        if not isinstance(raw, dict):
            # Invalid scalar rows may themselves be pasted credentials. Keep an
            # integrity fingerprint and type, never the scalar value.
            raw = {"value_sha256": stable_hash(raw), "value_type": type(raw).__name__}
            invalid_shape = True
        else:
            invalid_shape = False
        clean, redacted = sanitize(raw)
        assert isinstance(clean, dict)
        if norm_schema == "auth" and norm_table in SECRET_AUTH_TABLES:
            safe_auth_keys = {
                "id", "user_id", "created_at", "updated_at", "not_after",
                "revoked", "status", "factor_type", "friendly_name",
            }
            for key in list(clean):
                if key not in safe_auth_keys:
                    redacted.append(f"$.{key}")
                    del clean[key]
            redacted = sorted(set(redacted))
        item = SourceRow(norm_schema, norm_table, rel, index, clean, stable_hash(clean), redacted)
        rows.append(item)
        for field_name in redacted:
            redacted_counter[field_name.rsplit(".", 1)[-1]] += 1
        if invalid_shape:
            issues.append(_quarantine(item, "non_object_row", "source table row was not a JSON object"))
            item.disposition = "quarantine"
        if redacted:
            issues.append(_quarantine(
                item, "credential_fields_redacted",
                "credential-bearing fields were omitted; identity metadata remains and users must authenticate again",
                "warning", {"redacted_fields": redacted},
            ))
        # Supabase admin API exports often nest identities inside each user.
        if norm_table == "auth_users" and isinstance(clean.get("identities"), list):
            for identity_index, identity in enumerate(clean["identities"]):
                if isinstance(identity, dict):
                    embedded = dict(identity)
                    embedded.setdefault("user_id", clean.get("id"))
                    add_row("auth", "identities", embedded, rel + "#embedded-identities", index * 1_000_000 + identity_index)

    def add_table(schema: str, table: str, values: Any, rel: str) -> None:
        norm_schema, norm_table = _normalize_name(schema, table)
        contract_table = _contract_table_name(norm_schema, norm_table)
        present_tables.add(contract_table)
        if not isinstance(values, list):
            clean, _ = sanitize(values)
            if not isinstance(clean, (dict, list)):
                clean = {"value_sha256": stable_hash(clean), "value_type": type(clean).__name__}
            issues.append({
                "reason": "table_not_array", "severity": "error", "source_schema": norm_schema,
                "source_table": norm_table, "source_path": rel, "source_index": -1,
                "source_row_hash": stable_hash(clean), "detail": "table export must be a JSON array",
                "source_row": clean,
            })
            return
        raw_tables[contract_table].extend(values)
        for index, raw in enumerate(values):
            add_row(schema, table, raw, rel, index)

    def flatten(doc: Any, rel: str, schema: str, inferred: Optional[str]) -> None:
        if isinstance(doc, list):
            add_table(schema, inferred or "__unlabeled__", doc, rel)
            return
        if not isinstance(doc, dict):
            add_row(schema, inferred or "__unlabeled__", doc, rel, 0)
            return
        if isinstance(doc.get("rows"), list) and (doc.get("table") or inferred):
            row_schema = str(doc.get("schema") or schema)
            add_table(row_schema, str(doc.get("table") or inferred), doc["rows"], rel)
            return
        if inferred and isinstance(doc.get("data"), list):
            add_table(schema, inferred, doc["data"], rel)
            return
        nested = False
        for schema_name in ("public", "auth"):
            section = doc.get(schema_name)
            if isinstance(section, dict):
                nested = True
                for table_name in sorted(section):
                    add_table(schema_name, table_name, section[table_name], rel)
        table_arrays = {
            key: value for key, value in doc.items()
            if isinstance(value, list) and key not in ("warnings", "files", "tables")
        }
        if table_arrays:
            nested = True
            for table_name in sorted(table_arrays):
                add_table(schema, table_name, table_arrays[table_name], rel)
        if nested:
            return
        if inferred:
            add_row(schema, inferred, doc, rel, 0)
            return
        add_row(schema, "__unlabeled__", doc, rel, 0)

    for file_path in files:
        rel = file_path.relative_to(root).as_posix() if path.is_dir() else file_path.name
        raw_bytes = file_path.read_bytes()
        file_manifest.append({"path": rel, "sha256": hashlib.sha256(raw_bytes).hexdigest(), "bytes": len(raw_bytes)})
        schema, inferred = _infer_file_table(file_path, root)
        try:
            if file_path.suffix.lower() in (".jsonl", ".ndjson"):
                docs = []
                for line_number, line in enumerate(raw_bytes.decode("utf-8-sig").splitlines(), 1):
                    if line.strip():
                        try:
                            docs.append(json.loads(line))
                        except json.JSONDecodeError as exc:
                            raise ImportFailure(f"{rel}:{line_number}: invalid JSON: {exc}") from exc
                flatten(docs, rel, schema, inferred)
            else:
                doc = json.loads(raw_bytes.decode("utf-8-sig"))
                manifest_file = file_path.name.lower() in {
                    "manifest.json", "export-manifest.json", "supabase-manifest.json",
                    "supabase_export_manifest.json",
                }
                if not capture_metadata(doc, rel, manifest_file):
                    flatten(doc, rel, schema, inferred)
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise ImportFailure(f"{rel}: invalid JSON: {exc}") from exc

    rows.sort(key=lambda item: (item.source_schema, item.source_table, item.source_path, item.source_index, item.row_hash))
    file_manifest.sort(key=lambda item: item["path"])
    manifest_hash = stable_hash(file_manifest)
    missing_tables = sorted(REQUIRED_SOURCE_TABLES - present_tables)
    project_ref_verified = declared_project_refs == {SOURCE_PROJECT_REF}
    provider_verified = not declared_providers or declared_providers == {SOURCE_SYSTEM}
    export_proof, proof_issues = _validate_source_export_proof(export_proof_candidates, raw_tables)
    issues.extend(proof_issues)
    contract = {
        "expected_source_provider": SOURCE_SYSTEM,
        "expected_project_ref": SOURCE_PROJECT_REF,
        "declared_source_providers": sorted(declared_providers),
        "declared_project_refs": sorted(declared_project_refs),
        "metadata_sources": sorted(set(metadata_sources)),
        "provider_verified": provider_verified,
        "project_ref_verified": project_ref_verified,
        "required_tables": sorted(REQUIRED_SOURCE_TABLES),
        "present_tables": sorted(present_tables),
        "missing_tables": missing_tables,
        "source_export_proof": export_proof,
        "complete": project_ref_verified and provider_verified and not missing_tables and export_proof["verified"],
    }
    if not declared_project_refs:
        issues.append({
            "reason": "missing_project_ref_proof", "severity": "error",
            "source_schema": "manifest", "source_table": "__export_contract__",
            "source_path": "<export-manifest>", "source_index": -1,
            "source_row_hash": stable_hash(contract),
            "detail": f"export metadata must explicitly declare Supabase project_ref={SOURCE_PROJECT_REF}",
            "source_row": contract,
        })
    elif not project_ref_verified:
        issues.append({
            "reason": "wrong_project_ref", "severity": "error",
            "source_schema": "manifest", "source_table": "__export_contract__",
            "source_path": "<export-manifest>", "source_index": -1,
            "source_row_hash": stable_hash(contract),
            "detail": f"declared project ref(s) do not exactly match {SOURCE_PROJECT_REF}",
            "source_row": contract,
        })
    if not provider_verified:
        issues.append({
            "reason": "wrong_source_provider", "severity": "error",
            "source_schema": "manifest", "source_table": "__export_contract__",
            "source_path": "<export-manifest>", "source_index": -1,
            "source_row_hash": stable_hash(contract),
            "detail": "export metadata must identify Supabase as its source provider",
            "source_row": contract,
        })
    for table_name in missing_tables:
        schema_name, source_table = table_name.split(".", 1)
        issues.append({
            "reason": "required_source_table_missing", "severity": "error",
            "source_schema": schema_name, "source_table": source_table,
            "source_path": "<export-manifest>", "source_index": -1,
            "source_row_hash": stable_hash({"missing_table": table_name, "manifest": manifest_hash}),
            "detail": f"complete export must include {table_name}, even when it is an empty array",
            "source_row": {"missing_table": table_name},
        })
    redactions = {
        "credential_values_written": 0,
        "rows_with_redactions": sum(1 for row in rows if row.redacted_fields),
        "field_name_counts": dict(sorted(redacted_counter.items())),
        "policy": "credential fields are omitted; Supabase sessions and password hashes are never migrated",
    }
    return rows, issues, manifest_hash, redactions, contract


def _quarantine(
    source: SourceRow,
    reason: str,
    detail: str,
    severity: str = "error",
    extra: Optional[Mapping[str, Any]] = None,
) -> Dict[str, Any]:
    item: Dict[str, Any] = {
        "reason": reason,
        "severity": severity,
        "source_schema": source.source_schema,
        "source_table": source.source_table,
        "source_path": source.source_path,
        "source_index": source.source_index,
        "source_row_hash": source.row_hash,
        "detail": detail,
        "source_row": source.row,
    }
    if source.target_table:
        item["target_table"] = source.target_table
    if source.target_key:
        item["target_key"] = source.target_key
    if extra:
        item.update(dict(extra))
    return item


def _candidate(source: SourceRow, target: str, row: Dict[str, Any], policy: str = "unique", logical: Optional[str] = None) -> Candidate:
    key = _target_key(target, row)
    if not key or key.replace("\u241f", "") == "":
        raise RowProblem("missing_natural_key", f"{target} has no usable natural key")
    source.target_table = target
    source.target_key = key
    return Candidate(source, target, key, row, policy, logical)


def normalize_source(source: SourceRow, batch_id: str) -> List[Candidate]:
    table, row = source.source_table, source.row
    if table in EPHEMERAL_TABLES:
        raise RowProblem(
            "ephemeral_operational_state_not_migrated",
            "rate-limit/migration bookkeeping is provider-specific and was archived but not imported",
            "warning",
        )
    if source.source_schema == "auth" and table in SECRET_AUTH_TABLES:
        raise RowProblem(
            "authentication_secret_state_not_migrated",
            "Supabase sessions/MFA/token state cannot be moved; the sanitized metadata row is archived only",
            "warning",
        )
    if table == "content_special_events":
        raise RowProblem("derived_view_not_imported", "derived content view is rebuilt from content_events", "warning")
    if table not in KNOWN_TABLES and not table.startswith("content_"):
        raise RowProblem("unknown_table", f"no reviewed Cloudflare mapping exists for {source.source_schema}.{table}")

    source_json = canonical_json(row)
    common = {
        "source_row_json": source_json,
        "source_row_hash": source.row_hash,
        "source_updated_at": _row_time(row) or None,
        "ingest_source": "supabase_history",
        "migration_batch": batch_id,
    }

    if table == "beta_events":
        name = str(_required(row, "name", "event_name"))
        if name not in EVENT_NAMES:
            raise RowProblem("unknown_beta_event_name", f"event name is outside the Build 368 contract: {name}")
        props = _json_value(row.get("props"), {})
        if not isinstance(props, dict):
            raise RowProblem("invalid_json_shape", "beta_events.props must be a JSON object")
        out = {
            "event_id": str(_required(row, "event_id")),
            "player_id": str(_required(row, "player_id")),
            "session_id": str(_required(row, "session_id")),
            "name": name,
            "ts": str(_required(row, "ts")),
            "props": canonical_json(props),
            "device": _first(row, "device"), "browser": _first(row, "browser"),
            "os": _first(row, "os"), "screen": _first(row, "screen"),
            "viewport": _first(row, "viewport"),
            "created_at": str(_required(row, "created_at")),
            "source_row_hash": source.row_hash,
        }
        return [_candidate(source, table, out, "immutable")]

    if table == "beta_surveys":
        continuation = str(_required(row, "q4_continue"))
        if continuation not in CONTINUE_VALUES:
            raise RowProblem("invalid_survey_answer", f"q4_continue is not recognized: {continuation}")
        created = str(_required(row, "created_at"))
        out = {
            "response_id": str(_required(row, "response_id")),
            "player_id": str(_required(row, "player_id")),
            "session_id": str(_required(row, "session_id")),
            "q1_rating": _integer(_required(row, "q1_rating"), "q1_rating", 1, 10),
            "q2_hook": str(_required(row, "q2_hook")),
            "q3_improvement": str(_required(row, "q3_improvement")),
            "q4_continue": continuation,
            "q5_anything": _first(row, "q5_anything"),
            "seconds_taken": _integer(_required(row, "seconds_taken"), "seconds_taken", 0, 86400),
            "created_at": created,
            "updated_at": str(_first(row, "updated_at", default=created)),
            "ingest_source": "supabase_history",
            "source_row_hash": source.row_hash,
        }
        return [_candidate(source, table, out, "latest")]

    if table == "auth_users":
        user_id = str(_required(row, "id", "user_id"))
        out = {
            "id": user_id, "email": _first(row, "email"), "phone": _first(row, "phone"),
            "aud": _first(row, "aud"), "role": _first(row, "role"),
            "app_metadata": _json_text(_first(row, "raw_app_meta_data", "app_metadata"), {}),
            "user_metadata": _json_text(_first(row, "raw_user_meta_data", "user_metadata"), {}),
            "is_anonymous": 1 if bool(_first(row, "is_anonymous", default=False)) else 0,
            "created_at": _first(row, "created_at"), "updated_at": _first(row, "updated_at"),
            "last_sign_in_at": _first(row, "last_sign_in_at"),
            "confirmed_at": _first(row, "confirmed_at", "email_confirmed_at"),
            "deleted_at": _first(row, "deleted_at"), **common,
        }
        return [_candidate(source, table, out, "latest")]

    if table == "auth_identities":
        identity_id = _record_id(source, "id", "identity_id")
        provider = _first(row, "provider")
        provider_id = _first(row, "provider_id")
        identity_data = _json_value(_first(row, "identity_data", default={}), {})
        if not provider and isinstance(identity_data, dict):
            provider = identity_data.get("provider")
        if not provider_id and isinstance(identity_data, dict):
            provider_id = identity_data.get("sub")
        out = {
            "id": identity_id, "user_id": str(_required(row, "user_id")),
            "provider": provider, "provider_id": provider_id,
            "identity_data": canonical_json(identity_data),
            "created_at": _first(row, "created_at"), "updated_at": _first(row, "updated_at"),
            "last_sign_in_at": _first(row, "last_sign_in_at"), **common,
        }
        return [_candidate(source, table, out, "latest")]

    if table == "profiles":
        user_id = str(_required(row, "id", "user_id"))
        out = {
            "id": user_id,
            "shells": _integer(_first(row, "shells", default=0), "shells"),
            "player_level": _integer(_first(row, "player_level", "level", default=1), "player_level", 0),
            "xp": _integer(_first(row, "xp", default=0), "xp", 0),
            "display_name": _first(row, "display_name", "username"),
            "faction": _first(row, "faction"),
            "created_at": _first(row, "created_at"), "updated_at": _first(row, "updated_at"), **common,
        }
        return [_candidate(source, table, out, "latest")]

    if table in ("journal_trades", "journal_notes"):
        data_field = "trade_data" if table == "journal_trades" else "note_data"
        data = _json_value(_required(row, data_field), {})
        if not isinstance(data, dict):
            raise RowProblem("invalid_json_shape", f"{data_field} must be a JSON object")
        user_id = str(_required(row, "user_id"))
        logical_id = data.get("id")
        source_id = _source_pk(row)
        row_key = f"{user_id}:{source_id}" if source_id else f"{user_id}:derived:{source.row_hash[:24]}"
        id_field = "trade_id" if table == "journal_trades" else "note_id"
        out = {
            "row_key": row_key, "source_id": source_id, "user_id": user_id,
            id_field: str(logical_id) if logical_id not in (None, "") else None,
            data_field: canonical_json(data), "created_at": _first(row, "created_at"),
            "updated_at": _first(row, "updated_at", default=_first(row, "created_at")),
            "version_no": 1, "is_current": 1, **common,
        }
        logical = f"{user_id}\u241f{logical_id}" if logical_id not in (None, "") else row_key
        return [_candidate(source, table, out, "trade_version" if table == "journal_trades" else "note_version", logical)]

    if table == "daily_streak":
        user_id = str(_required(row, "id", "user_id"))
        out = {
            "id": user_id,
            "streak": _integer(_first(row, "streak", default=0), "streak", 0),
            "best_streak": _integer(_first(row, "best_streak", "best", default=0), "best_streak", 0),
            "last_drill_date": _first(row, "last_drill_date", "last_date"),
            "created_at": _first(row, "created_at"), "updated_at": _first(row, "updated_at"), **common,
        }
        return [_candidate(source, table, out, "latest")]

    if table == "player_mastery":
        raw_category = str(_required(row, "category"))
        key = re.sub(r"\s+", "_", raw_category.strip()).lower()
        if key in AMBIGUOUS_MASTERY:
            raise RowProblem(
                "ambiguous_mastery_category",
                f"legacy category '{raw_category}' has no lossless mapping to the seven current skills",
            )
        category = MASTERY_CATEGORIES.get(key)
        if category is None:
            # Exact current spelling is accepted without remapping.
            category = next((value for value in set(MASTERY_CATEGORIES.values()) if value.lower() == raw_category.lower()), None)
        if category is None:
            raise RowProblem("unknown_mastery_category", f"unrecognized mastery category: {raw_category}")
        out = {
            "player_id": str(_required(row, "player_id")), "category": category,
            "source_category": raw_category,
            "score": _integer(_required(row, "score"), "score", 0, 100),
            "updated_at": _first(row, "updated_at"), **common,
        }
        return [_candidate(source, table, out, "latest")]

    if table == "bug_reports":
        report_id = _record_id(source, "id", "report_id")
        out = {
            "report_id": report_id, "source_id": _source_pk(row), "user_id": _first(row, "user_id"),
            "message": _first(row, "message"), "context": _json_object_text(_first(row, "context"), "bug_reports.context"),
            "status": _first(row, "status", default="open"), "created_at": _first(row, "created_at"),
            "updated_at": _first(row, "updated_at"), **common,
        }
        return [_candidate(source, table, out, "immutable")]

    if table == "site_visits":
        visit_id = _record_id(source, "id", "visit_id")
        out = {
            "visit_id": visit_id, "source_id": _source_pk(row),
            "created_at": _first(row, "created_at", "ts"),
            "path": _first(row, "path", "pathname"), "referrer": _first(row, "referrer"), **common,
        }
        return [_candidate(source, table, out, "immutable")]

    if table == "site_visits_daily":
        day = str(_required(row, "day", "date"))
        out = {
            "day": day, "visits": _integer(_required(row, "visits", "count"), "visits", 0),
            "updated_at": _first(row, "updated_at"), **common,
        }
        return [_candidate(source, table, out, "latest")]

    if table == "admins":
        out = {
            "user_id": str(_required(row, "user_id", "id")), "email": _first(row, "email"),
            "role": _first(row, "role", default="founder"), "added_at": _first(row, "added_at", "created_at"), **common,
        }
        return [_candidate(source, table, out, "latest")]

    if table in KNOWN_CONTENT:
        out = _normalize_content(source, table, row, common)
        policy = "immutable" if table in ("content_events", "content_replays") else "latest"
        return [_candidate(source, table, out, policy)]

    # Future content tables stay queryable and lossless without silently
    # inventing a schema.  Their complete row lives in source_row_json.
    record_id = _record_id(source, "id", "event_id", "replay_id")
    out = {
        "source_table": table, "record_id": record_id, "source_id": _source_pk(row),
        "created_at": _first(row, "created_at", "ts"), "updated_at": _first(row, "updated_at"), **common,
    }
    return [_candidate(source, "content_records", out, "latest")]


def _normalize_content(source: SourceRow, table: str, row: Mapping[str, Any], common: Mapping[str, Any]) -> Dict[str, Any]:
    if table == "content_events":
        return {
            "event_id": str(_required(row, "event_id")), "source_id": _source_pk(row),
            "event_type": str(_required(row, "event_type")), "ts": _first(row, "ts"),
            "player_id": _first(row, "player_id"), "session_id": _first(row, "session_id"),
            "faction": _first(row, "faction"), "player_level": _first(row, "player_level"),
            "player_rank": _first(row, "player_rank"), "payload": _json_object_text(_first(row, "payload"), "content_events.payload"),
            "educational_metadata": _json_object_text(_first(row, "educational_metadata"), "content_events.educational_metadata"),
            "content_flags": _json_object_text(_first(row, "content_flags"), "content_events.content_flags"),
            "significance_score": _first(row, "significance_score", default=0),
            "processed_status": _first(row, "processed_status", default="new"),
            "created_at": _first(row, "created_at"), **common,
        }
    if table == "content_replays":
        return {
            "replay_id": str(_required(row, "replay_id")), "source_id": _source_pk(row),
            "event_id": _first(row, "event_id"), "kind": _first(row, "kind"),
            "meta": _json_object_text(_first(row, "meta"), "content_replays.meta"), "data": _json_object_text(_first(row, "data"), "content_replays.data"),
            "created_at": _first(row, "created_at"), **common,
        }
    record_id = _record_id(source, "id")
    base = {"record_id": record_id, "source_id": _source_pk(row), **common}
    if table == "content_briefs":
        base.update({
            "event_id": _first(row, "event_id"), "pillar": _first(row, "pillar"),
            "platforms": _json_array_text(_first(row, "platforms"), "content_briefs.platforms"), "urgency": _first(row, "urgency"),
            "angle": _first(row, "angle"), "format": _first(row, "format"),
            "priority": _first(row, "priority", default=0), "status": _first(row, "status", default="proposed"),
            "created_at": _first(row, "created_at"),
        })
    elif table == "content_assets":
        base.update({
            "brief_id": _first(row, "brief_id"), "event_id": _first(row, "event_id"),
            "asset_type": _first(row, "asset_type"), "storage_path": _first(row, "storage_path"),
            "platform_variant": _first(row, "platform_variant"), "meta": _json_object_text(_first(row, "meta"), "content_assets.meta"),
            "created_at": _first(row, "created_at"),
        })
    elif table == "content_generated":
        base.update({
            "brief_id": _first(row, "brief_id"), "platform": _first(row, "platform"),
            "body": _first(row, "body"), "meta": _json_object_text(_first(row, "meta"), "content_generated.meta"),
            "status": _first(row, "status", default="draft"), "created_at": _first(row, "created_at"),
        })
    elif table == "content_exports":
        base.update({
            "platform": _first(row, "platform"), "event_count": _first(row, "event_count", default=0),
            "filter_json": _json_object_text(_first(row, "filter"), "content_exports.filter"), "exported_at": _first(row, "exported_at"),
        })
    elif table == "published_posts":
        base.update({
            "asset_id": _first(row, "asset_id"), "platform": _first(row, "platform"),
            "post_url": _first(row, "post_url"), "published_at": _first(row, "published_at"),
        })
    elif table == "performance_snapshots":
        base.update({
            "post_id": _first(row, "post_id"), "captured_at": _first(row, "captured_at"),
            "metrics": _json_object_text(_first(row, "metrics"), "performance_snapshots.metrics"),
        })
    return base


def resolve_candidates(
    sources: Sequence[SourceRow], batch_id: str, initial_issues: Sequence[Mapping[str, Any]]
) -> Tuple[Dict[str, List[Dict[str, Any]]], List[Dict[str, Any]]]:
    candidates: List[Candidate] = []
    quarantine = [dict(item) for item in initial_issues]
    for source in sources:
        if source.disposition == "quarantine":
            continue
        try:
            produced = normalize_source(source, batch_id)
        except RowProblem as exc:
            source.disposition = "archived_only" if exc.severity == "warning" else "quarantine"
            quarantine.append(_quarantine(source, exc.reason, exc.detail, exc.severity))
            continue
        candidates.extend(produced)

    # First resolve true target-key collisions.  Exact repeated export rows are
    # warnings; different rows under one primary key are blocking conflicts.
    by_target_key: Dict[Tuple[str, str], List[Candidate]] = defaultdict(list)
    for candidate in candidates:
        by_target_key[(candidate.target, candidate.key)].append(candidate)
    chosen: List[Candidate] = []
    for target_key in sorted(by_target_key):
        group = by_target_key[target_key]
        if len(group) == 1:
            chosen.append(group[0])
            continue
        policy = group[0].policy
        reverse_sort = policy in ("latest", "trade_version", "note_version")
        ordered = sorted(group, key=lambda c: (_row_time(c.row), c.source.row_hash, c.source.ref), reverse=reverse_sort)
        winner = ordered[0]
        chosen.append(winner)
        winner.source.disposition = f"normalized:{winner.target}"
        distinct = {canonical_json({k: v for k, v in candidate.row.items() if k != "migration_batch"}) for candidate in group}
        reason = "duplicate_exact" if len(distinct) == 1 else "conflicting_duplicate_key"
        severity = "warning" if reason == "duplicate_exact" else "error"
        for loser in ordered[1:]:
            loser.source.disposition = "duplicate_archived"
            quarantine.append(_quarantine(
                loser.source, reason,
                f"{winner.target} key {winner.key} appeared {len(group)} times; deterministic {policy} winner retained",
                severity,
                {"target_table": winner.target, "target_key": winner.key, "winner_source_row_hash": winner.source.row_hash},
            ))

    # Notes explicitly retain versions. Trades also retain every distinct DB row
    # but flag logical duplicate trade IDs for review; only the newest is current.
    for target, policy, reason in (
        ("journal_notes", "note_version", None),
        ("journal_trades", "trade_version", "duplicate_trade_id_version"),
    ):
        groups: Dict[str, List[Candidate]] = defaultdict(list)
        for candidate in chosen:
            if candidate.target == target and candidate.policy == policy:
                groups[candidate.logical_group or candidate.key].append(candidate)
        for logical in sorted(groups):
            group = sorted(groups[logical], key=lambda c: (_row_time(c.row), c.source.row_hash, c.key))
            for version, candidate in enumerate(group, 1):
                candidate.row["version_no"] = version
                candidate.row["is_current"] = 1 if version == len(group) else 0
                candidate.source.disposition = f"normalized:{target}"
            if reason and len(group) > 1:
                for candidate in group[:-1]:
                    quarantine.append(_quarantine(
                        candidate.source, reason,
                        f"logical trade id {logical} has {len(group)} source rows; all are preserved and newest is_current=1",
                        "warning", {"target_table": target, "target_key": candidate.key},
                    ))

    normalized: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for candidate in chosen:
        candidate.source.disposition = f"normalized:{candidate.target}"
        candidate.source.target_table = candidate.target
        candidate.source.target_key = candidate.key
        normalized[candidate.target].append(candidate.row)
    for table in normalized:
        keys = LOGICAL_TABLE_KEYS[table]
        normalized[table].sort(key=lambda row: tuple(str(row.get(field) or "") for field in keys))
    quarantine.sort(key=lambda item: (
        str(item.get("severity")), str(item.get("reason")), str(item.get("source_schema")),
        str(item.get("source_table")), str(item.get("source_path")), int(item.get("source_index", -1)),
        str(item.get("source_row_hash")),
    ))
    return dict(sorted(normalized.items())), quarantine


COMMON_COLUMNS = ["source_row_json", "source_row_hash", "source_updated_at", "ingest_source", "migration_batch"]
TARGET_COLUMNS: Dict[str, List[str]] = {
    "beta_events": ["event_id", "player_id", "session_id", "name", "ts", "props", "device", "browser", "os", "screen", "viewport", "created_at"],
    "beta_surveys": ["response_id", "player_id", "session_id", "q1_rating", "q2_hook", "q3_improvement", "q4_continue", "q5_anything", "seconds_taken", "created_at", "updated_at", "ingest_source"],
    "auth_users": ["id", "email", "phone", "aud", "role", "app_metadata", "user_metadata", "is_anonymous", "created_at", "updated_at", "last_sign_in_at", "confirmed_at", "deleted_at"] + COMMON_COLUMNS,
    "auth_identities": ["id", "user_id", "provider", "provider_id", "identity_data", "created_at", "updated_at", "last_sign_in_at"] + COMMON_COLUMNS,
    "profiles": ["id", "shells", "player_level", "xp", "display_name", "faction", "created_at", "updated_at"] + COMMON_COLUMNS,
    "journal_trades": ["row_key", "source_id", "user_id", "trade_id", "trade_data", "created_at", "updated_at", "version_no", "is_current"] + COMMON_COLUMNS,
    "journal_notes": ["row_key", "source_id", "user_id", "note_id", "note_data", "created_at", "updated_at", "version_no", "is_current"] + COMMON_COLUMNS,
    "daily_streak": ["id", "streak", "best_streak", "last_drill_date", "created_at", "updated_at"] + COMMON_COLUMNS,
    "player_mastery": ["player_id", "category", "source_category", "score", "updated_at"] + COMMON_COLUMNS,
    "bug_reports": ["report_id", "source_id", "user_id", "message", "context", "status", "created_at", "updated_at"] + COMMON_COLUMNS,
    "site_visits": ["visit_id", "source_id", "created_at", "path", "referrer"] + COMMON_COLUMNS,
    "site_visits_daily": ["day", "visits", "updated_at"] + COMMON_COLUMNS,
    "content_events": ["event_id", "source_id", "event_type", "ts", "player_id", "session_id", "faction", "player_level", "player_rank", "payload", "educational_metadata", "content_flags", "significance_score", "processed_status", "created_at"] + COMMON_COLUMNS,
    "content_replays": ["replay_id", "source_id", "event_id", "kind", "meta", "data", "created_at"] + COMMON_COLUMNS,
    "content_briefs": ["record_id", "source_id", "event_id", "pillar", "platforms", "urgency", "angle", "format", "priority", "status", "created_at"] + COMMON_COLUMNS,
    "content_assets": ["record_id", "source_id", "brief_id", "event_id", "asset_type", "storage_path", "platform_variant", "meta", "created_at"] + COMMON_COLUMNS,
    "content_generated": ["record_id", "source_id", "brief_id", "platform", "body", "meta", "status", "created_at"] + COMMON_COLUMNS,
    "content_exports": ["record_id", "source_id", "platform", "event_count", "filter_json", "exported_at"] + COMMON_COLUMNS,
    "published_posts": ["record_id", "source_id", "asset_id", "platform", "post_url", "published_at"] + COMMON_COLUMNS,
    "performance_snapshots": ["record_id", "source_id", "post_id", "captured_at", "metrics"] + COMMON_COLUMNS,
    "content_records": ["source_table", "record_id", "source_id", "created_at", "updated_at"] + COMMON_COLUMNS,
    "admins": ["user_id", "email", "role", "added_at"] + COMMON_COLUMNS,
}


SCHEMA_SQL = r"""
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cq_migration_batches (
  batch_id TEXT PRIMARY KEY, source_system TEXT NOT NULL, source_manifest_sha256 TEXT NOT NULL,
  tool_version TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS cq_migration_source_rows (
  batch_id TEXT NOT NULL, source_schema TEXT NOT NULL, source_table TEXT NOT NULL,
  source_path TEXT NOT NULL, source_index INTEGER NOT NULL, source_pk TEXT,
  source_row_hash TEXT NOT NULL, source_row_json TEXT NOT NULL CHECK(json_valid(source_row_json)),
  disposition TEXT NOT NULL, target_table TEXT, target_key TEXT,
  PRIMARY KEY(batch_id,source_schema,source_table,source_path,source_index,source_row_hash)
);
CREATE TABLE IF NOT EXISTS cq_migration_quarantine (
  batch_id TEXT NOT NULL, reason TEXT NOT NULL, severity TEXT NOT NULL,
  source_schema TEXT, source_table TEXT, source_path TEXT, source_index INTEGER,
  source_row_hash TEXT, detail TEXT NOT NULL, row_json TEXT NOT NULL CHECK(json_valid(row_json)),
  PRIMARY KEY(batch_id,reason,source_path,source_index,source_row_hash)
);
CREATE TABLE IF NOT EXISTS cq_migration_conflicts (
  batch_id TEXT NOT NULL, target_table TEXT NOT NULL, target_key TEXT NOT NULL,
  incoming_hash TEXT, existing_hash TEXT, resolution TEXT NOT NULL,
  detected_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY(batch_id,target_table,target_key,incoming_hash)
);
CREATE TABLE IF NOT EXISTS cq_migration_before (
  batch_id TEXT NOT NULL, target_table TEXT NOT NULL, target_key TEXT NOT NULL,
  existed INTEGER NOT NULL, row_json TEXT, PRIMARY KEY(batch_id,target_table,target_key)
);
CREATE TABLE IF NOT EXISTS cq_migration_lineage (
  batch_id TEXT NOT NULL, target_table TEXT NOT NULL, target_key TEXT NOT NULL,
  source_row_hash TEXT NOT NULL, action TEXT NOT NULL,
  PRIMARY KEY(batch_id,target_table,target_key,source_row_hash)
);

CREATE TABLE IF NOT EXISTS beta_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, event_id TEXT NOT NULL UNIQUE,
  player_id TEXT NOT NULL, session_id TEXT NOT NULL, name TEXT NOT NULL, ts TEXT NOT NULL,
  props TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(props)), device TEXT, browser TEXT,
  os TEXT, screen TEXT, viewport TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS beta_surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT, response_id TEXT NOT NULL UNIQUE,
  player_id TEXT NOT NULL, session_id TEXT NOT NULL, q1_rating INTEGER NOT NULL,
  q2_hook TEXT NOT NULL, q3_improvement TEXT NOT NULL, q4_continue TEXT NOT NULL,
  q5_anything TEXT, seconds_taken INTEGER NOT NULL, created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL, ingest_source TEXT NOT NULL DEFAULT 'cloudflare'
);

CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY, email TEXT, phone TEXT, aud TEXT, role TEXT,
  app_metadata TEXT NOT NULL DEFAULT '{}', user_metadata TEXT NOT NULL DEFAULT '{}',
  is_anonymous INTEGER NOT NULL DEFAULT 0, created_at TEXT, updated_at TEXT,
  last_sign_in_at TEXT, confirmed_at TEXT, deleted_at TEXT,
  source_row_json TEXT, source_row_hash TEXT, source_updated_at TEXT,
  ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT
);
CREATE TABLE IF NOT EXISTS auth_identities (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, provider TEXT, provider_id TEXT,
  identity_data TEXT NOT NULL DEFAULT '{}', created_at TEXT, updated_at TEXT, last_sign_in_at TEXT,
  source_row_json TEXT, source_row_hash TEXT, source_updated_at TEXT,
  ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT
);
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY, shells INTEGER NOT NULL DEFAULT 0, player_level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0, display_name TEXT, faction TEXT, created_at TEXT, updated_at TEXT,
  source_row_json TEXT, source_row_hash TEXT, source_updated_at TEXT,
  ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT
);
CREATE TABLE IF NOT EXISTS journal_trades (
  row_key TEXT PRIMARY KEY, source_id TEXT, user_id TEXT NOT NULL, trade_id TEXT,
  trade_data TEXT NOT NULL CHECK(json_valid(trade_data)), created_at TEXT, updated_at TEXT,
  version_no INTEGER NOT NULL DEFAULT 1, is_current INTEGER NOT NULL DEFAULT 1,
  source_row_json TEXT, source_row_hash TEXT, source_updated_at TEXT,
  ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT
);
CREATE TABLE IF NOT EXISTS journal_notes (
  row_key TEXT PRIMARY KEY, source_id TEXT, user_id TEXT NOT NULL, note_id TEXT,
  note_data TEXT NOT NULL CHECK(json_valid(note_data)), created_at TEXT, updated_at TEXT,
  version_no INTEGER NOT NULL DEFAULT 1, is_current INTEGER NOT NULL DEFAULT 1,
  source_row_json TEXT, source_row_hash TEXT, source_updated_at TEXT,
  ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT
);
CREATE TABLE IF NOT EXISTS daily_streak (
  id TEXT PRIMARY KEY, streak INTEGER NOT NULL DEFAULT 0, best_streak INTEGER NOT NULL DEFAULT 0,
  last_drill_date TEXT, created_at TEXT, updated_at TEXT, source_row_json TEXT,
  source_row_hash TEXT, source_updated_at TEXT, ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT
);
CREATE TABLE IF NOT EXISTS player_mastery (
  player_id TEXT NOT NULL, category TEXT NOT NULL, source_category TEXT, score INTEGER NOT NULL,
  updated_at TEXT, source_row_json TEXT, source_row_hash TEXT, source_updated_at TEXT,
  ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT,
  PRIMARY KEY(player_id,category)
);
CREATE TABLE IF NOT EXISTS bug_reports (
  report_id TEXT PRIMARY KEY, source_id TEXT, user_id TEXT, message TEXT, context TEXT NOT NULL DEFAULT '{}',
  status TEXT, created_at TEXT, updated_at TEXT, source_row_json TEXT, source_row_hash TEXT,
  source_updated_at TEXT, ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT
);
CREATE TABLE IF NOT EXISTS site_visits (
  visit_id TEXT PRIMARY KEY, source_id TEXT, created_at TEXT, path TEXT, referrer TEXT,
  source_row_json TEXT, source_row_hash TEXT, source_updated_at TEXT,
  ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT
);
CREATE TABLE IF NOT EXISTS site_visits_daily (
  day TEXT PRIMARY KEY, visits INTEGER NOT NULL DEFAULT 0, updated_at TEXT,
  source_row_json TEXT, source_row_hash TEXT, source_updated_at TEXT,
  ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT
);
CREATE TABLE IF NOT EXISTS content_events (
  event_id TEXT PRIMARY KEY, source_id TEXT, event_type TEXT NOT NULL, ts TEXT, player_id TEXT,
  session_id TEXT, faction TEXT, player_level INTEGER, player_rank TEXT, payload TEXT NOT NULL DEFAULT '{}',
  educational_metadata TEXT NOT NULL DEFAULT '{}', content_flags TEXT NOT NULL DEFAULT '{}',
  significance_score INTEGER, processed_status TEXT, created_at TEXT, source_row_json TEXT,
  source_row_hash TEXT, source_updated_at TEXT, ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT
);
CREATE TABLE IF NOT EXISTS content_replays (
  replay_id TEXT PRIMARY KEY, source_id TEXT, event_id TEXT, kind TEXT, meta TEXT NOT NULL DEFAULT '{}',
  data TEXT NOT NULL DEFAULT '{}', created_at TEXT, source_row_json TEXT, source_row_hash TEXT,
  source_updated_at TEXT, ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT
);
CREATE TABLE IF NOT EXISTS content_briefs (
  record_id TEXT PRIMARY KEY, source_id TEXT, event_id TEXT, pillar TEXT, platforms TEXT NOT NULL DEFAULT '[]',
  urgency TEXT, angle TEXT, format TEXT, priority INTEGER, status TEXT, created_at TEXT,
  source_row_json TEXT, source_row_hash TEXT, source_updated_at TEXT,
  ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT
);
CREATE TABLE IF NOT EXISTS content_assets (
  record_id TEXT PRIMARY KEY, source_id TEXT, brief_id TEXT, event_id TEXT, asset_type TEXT,
  storage_path TEXT, platform_variant TEXT, meta TEXT NOT NULL DEFAULT '{}', created_at TEXT,
  source_row_json TEXT, source_row_hash TEXT, source_updated_at TEXT,
  ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT
);
CREATE TABLE IF NOT EXISTS content_generated (
  record_id TEXT PRIMARY KEY, source_id TEXT, brief_id TEXT, platform TEXT, body TEXT,
  meta TEXT NOT NULL DEFAULT '{}', status TEXT, created_at TEXT, source_row_json TEXT,
  source_row_hash TEXT, source_updated_at TEXT, ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT
);
CREATE TABLE IF NOT EXISTS content_exports (
  record_id TEXT PRIMARY KEY, source_id TEXT, platform TEXT, event_count INTEGER,
  filter_json TEXT NOT NULL DEFAULT '{}', exported_at TEXT, source_row_json TEXT,
  source_row_hash TEXT, source_updated_at TEXT, ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT
);
CREATE TABLE IF NOT EXISTS published_posts (
  record_id TEXT PRIMARY KEY, source_id TEXT, asset_id TEXT, platform TEXT, post_url TEXT,
  published_at TEXT, source_row_json TEXT, source_row_hash TEXT, source_updated_at TEXT,
  ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT
);
CREATE TABLE IF NOT EXISTS performance_snapshots (
  record_id TEXT PRIMARY KEY, source_id TEXT, post_id TEXT, captured_at TEXT,
  metrics TEXT NOT NULL DEFAULT '{}', source_row_json TEXT, source_row_hash TEXT,
  source_updated_at TEXT, ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT
);
CREATE TABLE IF NOT EXISTS content_records (
  source_table TEXT NOT NULL, record_id TEXT NOT NULL, source_id TEXT, created_at TEXT, updated_at TEXT,
  source_row_json TEXT, source_row_hash TEXT, source_updated_at TEXT,
  ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT,
  PRIMARY KEY(source_table,record_id)
);
CREATE TABLE IF NOT EXISTS admins (
  user_id TEXT PRIMARY KEY, email TEXT, role TEXT, added_at TEXT, source_row_json TEXT,
  source_row_hash TEXT, source_updated_at TEXT, ingest_source TEXT NOT NULL DEFAULT 'cloudflare', migration_batch TEXT
);

CREATE INDEX IF NOT EXISTS auth_identities_user_idx ON auth_identities(user_id);
CREATE INDEX IF NOT EXISTS journal_trades_user_current_idx ON journal_trades(user_id,is_current,created_at);
CREATE INDEX IF NOT EXISTS journal_notes_user_current_idx ON journal_notes(user_id,is_current,created_at);
CREATE INDEX IF NOT EXISTS player_mastery_player_idx ON player_mastery(player_id);
CREATE INDEX IF NOT EXISTS site_visits_created_idx ON site_visits(created_at);
CREATE INDEX IF NOT EXISTS content_replays_event_idx ON content_replays(event_id);
""".strip()


def _sql(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def _sql_insert(table: str, row: Mapping[str, Any], suffix: str = "") -> str:
    columns = TARGET_COLUMNS[table]
    return (
        f"INSERT INTO {table} ({','.join(columns)}) VALUES "
        f"({','.join(_sql(row.get(column)) for column in columns)}){suffix};"
    )


def emit_schema_sql() -> str:
    return SCHEMA_SQL + "\n"


def _beta_event_equal(alias: str, row: Mapping[str, Any]) -> str:
    fields = ["player_id", "session_id", "name", "ts", "props", "device", "browser", "os", "screen", "viewport", "created_at"]
    return " AND ".join(f"{alias}.{field} IS {_sql(row.get(field))}" for field in fields)


def _beta_survey_equal(alias: str, row: Mapping[str, Any]) -> str:
    fields = ["player_id", "session_id", "q1_rating", "q2_hook", "q3_improvement", "q4_continue", "q5_anything", "seconds_taken", "created_at", "updated_at", "ingest_source"]
    return " AND ".join(f"{alias}.{field} IS {_sql(row.get(field))}" for field in fields)


def emit_import_sql(
    normalized: Mapping[str, Sequence[Mapping[str, Any]]],
    archive: Sequence[Mapping[str, Any]],
    quarantine: Sequence[Mapping[str, Any]],
    batch_id: str,
    source_manifest_hash: str,
) -> str:
    lines = ["BEGIN TRANSACTION;", _sql_insert_batch(batch_id, source_manifest_hash)]
    for item in archive:
        values = [
            batch_id, item.get("source_schema"), item.get("source_table"), item.get("source_path"),
            item.get("source_index"), item.get("source_pk"), item.get("source_row_hash"),
            canonical_json(item.get("source_row")), item.get("disposition"), item.get("target_table"), item.get("target_key"),
        ]
        lines.append(
            "INSERT OR IGNORE INTO cq_migration_source_rows "
            "(batch_id,source_schema,source_table,source_path,source_index,source_pk,source_row_hash,source_row_json,disposition,target_table,target_key) VALUES "
            f"({','.join(_sql(value) for value in values)});"
        )
    for item in quarantine:
        qjson = canonical_json(item)
        values = [
            batch_id, item.get("reason"), item.get("severity"), item.get("source_schema"),
            item.get("source_table"), item.get("source_path"), item.get("source_index"),
            item.get("source_row_hash"), item.get("detail"), qjson,
        ]
        lines.append(
            "INSERT OR IGNORE INTO cq_migration_quarantine "
            "(batch_id,reason,severity,source_schema,source_table,source_path,source_index,source_row_hash,detail,row_json) VALUES "
            f"({','.join(_sql(value) for value in values)});"
        )

    for table in sorted(normalized):
        for row in normalized[table]:
            key = _target_key(table, row)
            key_fields = LOGICAL_TABLE_KEYS[table]
            where = " AND ".join(f"{field} IS {_sql(row.get(field))}" for field in key_fields)
            if table == "beta_events":
                existed_json = (
                    "(SELECT json_object('event_id',event_id,'player_id',player_id,'session_id',session_id,"
                    "'name',name,'ts',ts,'props',props,'device',device,'browser',browser,'os',os,"
                    "'screen',screen,'viewport',viewport,'created_at',created_at) FROM beta_events WHERE " + where + ")"
                )
                lines.append(
                    "INSERT OR IGNORE INTO cq_migration_before(batch_id,target_table,target_key,existed,row_json) "
                    f"VALUES({_sql(batch_id)},'beta_events',{_sql(key)},CASE WHEN EXISTS(SELECT 1 FROM beta_events WHERE {where}) THEN 1 ELSE 0 END,{existed_json});"
                )
                equal = _beta_event_equal("beta_events", row)
                lines.append(
                    "INSERT OR IGNORE INTO cq_migration_conflicts(batch_id,target_table,target_key,incoming_hash,existing_hash,resolution) "
                    f"SELECT {_sql(batch_id)},'beta_events',{_sql(key)},{_sql(stable_hash(row))},NULL,'existing_event_wins' "
                    f"WHERE EXISTS(SELECT 1 FROM beta_events WHERE {where} AND NOT ({equal}));"
                )
                lines.append(_sql_insert(table, row, " ON CONFLICT(event_id) DO NOTHING"))
                lines.append(
                    "INSERT OR REPLACE INTO cq_migration_lineage(batch_id,target_table,target_key,source_row_hash,action) "
                    f"SELECT {_sql(batch_id)},'beta_events',{_sql(key)},{_sql(stable_hash(row))},"
                    f"CASE WHEN (SELECT existed FROM cq_migration_before WHERE batch_id={_sql(batch_id)} AND target_table='beta_events' AND target_key={_sql(key)})=0 THEN 'inserted' "
                    f"WHEN EXISTS(SELECT 1 FROM beta_events WHERE {where} AND {equal}) THEN 'matched' ELSE 'skipped_conflict' END;"
                )
                continue
            if table == "beta_surveys":
                existed_json = (
                    "(SELECT json_object('response_id',response_id,'player_id',player_id,'session_id',session_id,"
                    "'q1_rating',q1_rating,'q2_hook',q2_hook,'q3_improvement',q3_improvement,"
                    "'q4_continue',q4_continue,'q5_anything',q5_anything,'seconds_taken',seconds_taken,"
                    "'created_at',created_at,'updated_at',updated_at,'ingest_source',ingest_source) "
                    "FROM beta_surveys WHERE " + where + ")"
                )
                lines.append(
                    "INSERT OR IGNORE INTO cq_migration_before(batch_id,target_table,target_key,existed,row_json) "
                    f"VALUES({_sql(batch_id)},'beta_surveys',{_sql(key)},CASE WHEN EXISTS(SELECT 1 FROM beta_surveys WHERE {where}) THEN 1 ELSE 0 END,{existed_json});"
                )
                equal = _beta_survey_equal("beta_surveys", row)
                lines.append(
                    "INSERT OR IGNORE INTO cq_migration_conflicts(batch_id,target_table,target_key,incoming_hash,existing_hash,resolution) "
                    f"SELECT {_sql(batch_id)},'beta_surveys',{_sql(key)},{_sql(stable_hash(row))},NULL,'live_target_wins' "
                    f"WHERE EXISTS(SELECT 1 FROM beta_surveys WHERE {where} AND ingest_source='cloudflare' AND NOT ({equal}));"
                )
                lines.append(
                    "INSERT OR IGNORE INTO cq_migration_conflicts(batch_id,target_table,target_key,incoming_hash,existing_hash,resolution) "
                    f"SELECT {_sql(batch_id)},'beta_surveys',{_sql(key)},{_sql(stable_hash(row))},NULL,'newer_history_target_wins' "
                    f"WHERE EXISTS(SELECT 1 FROM beta_surveys WHERE {where} AND ingest_source='supabase_history' "
                    f"AND updated_at>={_sql(row.get('updated_at'))} AND NOT ({equal}));"
                )
                suffix = (
                    " ON CONFLICT(response_id) DO UPDATE SET "
                    "player_id=excluded.player_id,session_id=excluded.session_id,q1_rating=excluded.q1_rating,"
                    "q2_hook=excluded.q2_hook,q3_improvement=excluded.q3_improvement,q4_continue=excluded.q4_continue,"
                    "q5_anything=excluded.q5_anything,seconds_taken=excluded.seconds_taken,created_at=excluded.created_at,"
                    "updated_at=excluded.updated_at,ingest_source='supabase_history' "
                    "WHERE beta_surveys.ingest_source='supabase_history' AND excluded.updated_at>beta_surveys.updated_at"
                )
                lines.append(_sql_insert(table, row, suffix))
                lines.append(
                    "INSERT OR REPLACE INTO cq_migration_lineage(batch_id,target_table,target_key,source_row_hash,action) "
                    f"SELECT {_sql(batch_id)},'beta_surveys',{_sql(key)},{_sql(stable_hash(row))},"
                    f"CASE WHEN (SELECT existed FROM cq_migration_before WHERE batch_id={_sql(batch_id)} AND target_table='beta_surveys' AND target_key={_sql(key)})=0 THEN 'inserted' "
                    f"WHEN json_extract((SELECT row_json FROM cq_migration_before WHERE batch_id={_sql(batch_id)} AND target_table='beta_surveys' AND target_key={_sql(key)}),'$.ingest_source')='cloudflare' THEN 'live_target_wins' "
                    f"WHEN EXISTS(SELECT 1 FROM beta_surveys WHERE {where} AND {equal}) THEN 'updated_or_matched' ELSE 'newer_target_wins' END;"
                )
                continue

            incoming_hash = str(row.get("source_row_hash"))
            lines.append(
                "INSERT OR IGNORE INTO cq_migration_conflicts(batch_id,target_table,target_key,incoming_hash,existing_hash,resolution) "
                f"SELECT {_sql(batch_id)},{_sql(table)},{_sql(key)},{_sql(incoming_hash)},source_row_hash,'existing_target_wins' "
                f"FROM {table} WHERE {where} AND source_row_hash IS NOT {_sql(incoming_hash)};"
            )
            key_clause = ",".join(key_fields)
            lines.append(_sql_insert(table, row, f" ON CONFLICT({key_clause}) DO NOTHING"))
            lines.append(
                "INSERT OR REPLACE INTO cq_migration_lineage(batch_id,target_table,target_key,source_row_hash,action) "
                f"SELECT {_sql(batch_id)},{_sql(table)},{_sql(key)},{_sql(incoming_hash)},"
                f"CASE WHEN source_row_hash IS {_sql(incoming_hash)} AND migration_batch IS {_sql(batch_id)} THEN 'inserted_or_same_batch' "
                f"WHEN source_row_hash IS {_sql(incoming_hash)} THEN 'matched' ELSE 'skipped_conflict' END FROM {table} WHERE {where};"
            )
    lines.extend(["COMMIT;", ""])
    return "\n".join(lines)


def _sql_insert_batch(batch_id: str, source_manifest_hash: str) -> str:
    return (
        "INSERT OR IGNORE INTO cq_migration_batches(batch_id,source_system,source_manifest_sha256,tool_version) VALUES"
        f"({_sql(batch_id)},{_sql(SOURCE_SYSTEM)},{_sql(source_manifest_hash)},{_sql(TOOL_VERSION)});"
    )


def emit_rollback_sql(normalized: Mapping[str, Sequence[Mapping[str, Any]]], batch_id: str) -> str:
    lines = [
        "-- Reversible only while imported rows remain unchanged. Drift is quarantined, never overwritten.",
        "BEGIN TRANSACTION;",
    ]
    for table in sorted(normalized, reverse=True):
        for row in reversed(list(normalized[table])):
            key = _target_key(table, row)
            key_fields = LOGICAL_TABLE_KEYS[table]
            where = " AND ".join(f"{field} IS {_sql(row.get(field))}" for field in key_fields)
            if table == "beta_events":
                equal = _beta_event_equal("beta_events", row)
                lines.append(
                    "INSERT OR IGNORE INTO cq_migration_conflicts(batch_id,target_table,target_key,incoming_hash,existing_hash,resolution) "
                    f"SELECT {_sql(batch_id)},'beta_events',{_sql(key)},{_sql(stable_hash(row))},NULL,'rollback_drift_kept' "
                    f"WHERE (SELECT existed FROM cq_migration_before WHERE batch_id={_sql(batch_id)} AND target_table='beta_events' AND target_key={_sql(key)})=0 "
                    f"AND EXISTS(SELECT 1 FROM beta_events WHERE {where} AND NOT ({equal}));"
                )
                lines.append(
                    f"DELETE FROM beta_events WHERE {where} AND {equal} AND "
                    f"(SELECT existed FROM cq_migration_before WHERE batch_id={_sql(batch_id)} AND target_table='beta_events' AND target_key={_sql(key)})=0;"
                )
            elif table == "beta_surveys":
                equal = _beta_survey_equal("beta_surveys", row)
                lines.append(
                    f"DELETE FROM beta_surveys WHERE {where} AND {equal} AND "
                    f"(SELECT existed FROM cq_migration_before WHERE batch_id={_sql(batch_id)} AND target_table='beta_surveys' AND target_key={_sql(key)})=0;"
                )
                before = (
                    f"(SELECT row_json FROM cq_migration_before WHERE batch_id={_sql(batch_id)} "
                    f"AND target_table='beta_surveys' AND target_key={_sql(key)})"
                )
                # Restore a historical row that this batch updated, but only if
                # nobody has changed the imported value since the apply.
                restore_columns = TARGET_COLUMNS["beta_surveys"]
                restore_values = [f"json_extract({before},'$.{column}')" for column in restore_columns]
                lines.append(
                    f"INSERT OR REPLACE INTO beta_surveys ({','.join(restore_columns)}) SELECT {','.join(restore_values)} "
                    f"WHERE (SELECT existed FROM cq_migration_before WHERE batch_id={_sql(batch_id)} AND target_table='beta_surveys' AND target_key={_sql(key)})=1 "
                    f"AND (SELECT action FROM cq_migration_lineage WHERE batch_id={_sql(batch_id)} AND target_table='beta_surveys' AND target_key={_sql(key)} LIMIT 1)='updated_or_matched' "
                    f"AND EXISTS(SELECT 1 FROM beta_surveys WHERE {where} AND {equal});"
                )
            else:
                incoming_hash = str(row.get("source_row_hash"))
                equal = " AND ".join(
                    f"{table}.{column} IS {_sql(row.get(column))}"
                    for column in TARGET_COLUMNS[table] if column != "migration_batch"
                )
                lines.append(
                    "INSERT OR IGNORE INTO cq_migration_conflicts(batch_id,target_table,target_key,incoming_hash,existing_hash,resolution) "
                    f"SELECT {_sql(batch_id)},{_sql(table)},{_sql(key)},{_sql(incoming_hash)},source_row_hash,'rollback_drift_kept' "
                    f"FROM {table} WHERE {where} AND migration_batch={_sql(batch_id)} AND NOT ({equal});"
                )
                lines.append(
                    f"DELETE FROM {table} WHERE {where} AND migration_batch={_sql(batch_id)} "
                    f"AND source_row_hash={_sql(incoming_hash)} AND {equal};"
                )
    lines.extend([
        f"DELETE FROM cq_migration_lineage WHERE batch_id={_sql(batch_id)};",
        f"DELETE FROM cq_migration_before WHERE batch_id={_sql(batch_id)};",
        f"DELETE FROM cq_migration_conflicts WHERE batch_id={_sql(batch_id)};",
        f"DELETE FROM cq_migration_quarantine WHERE batch_id={_sql(batch_id)};",
        f"DELETE FROM cq_migration_source_rows WHERE batch_id={_sql(batch_id)};",
        f"DELETE FROM cq_migration_batches WHERE batch_id={_sql(batch_id)};",
        "COMMIT;",
        "",
    ])
    return "\n".join(lines)


def build_bundle(input_path: Path) -> Dict[str, Any]:
    sources, initial_issues, manifest_hash, redactions, source_contract = load_source(input_path)
    batch_id = "supa-" + stable_hash({
        "source_manifest": manifest_hash,
        "rows": [(row.source_schema, row.source_table, row.source_path, row.source_index, row.row_hash) for row in sources],
        "tool_version": TOOL_VERSION,
    })[:24]
    logical, quarantine = resolve_candidates(sources, batch_id, initial_issues)
    initial_archive = [source.archive() for source in sources]
    normalized, quarantine, projection = project_to_canonical(
        logical, initial_archive, quarantine, batch_id
    )
    archive = projection["archive"]
    audit_plan = projection["audit_plan"]
    report = build_report(normalized, archive, quarantine, batch_id, manifest_hash, redactions)
    # Daily-rollup overlap is a source-level fact. The canonical APP_DB target
    # intentionally omits a daily row when raw rows exist for that day, so use
    # the logical source view for this evidence instead of double-counting it.
    report["visits"] = _visit_report(logical)
    report["source_contract"] = source_contract
    report["ready_for_apply"] = bool(report["ready_for_apply"] and source_contract["complete"])
    report.pop("report_sha256", None)
    report["report_sha256"] = stable_hash(report)
    beta_tables = {
        table: normalized.get(table, [])
        for table in ("beta_events", "beta_surveys") if table in normalized
    }
    app_tables = {
        table: rows for table, rows in normalized.items() if table.startswith("app_")
    }
    normalized_doc = {
        "format": BUNDLE_FORMAT,
        "tool_version": TOOL_VERSION,
        "batch_id": batch_id,
        "source_manifest_sha256": manifest_hash,
        "redactions": redactions,
        "source_contract": source_contract,
        "tables": normalized,
        "databases": {
            "BETA_DB": {"tables": beta_tables},
            "APP_DB": {"tables": app_tables},
        },
        "logical_source_evidence": {
            table: {"rows": len(rows), "rows_sha256": rows_hash(rows)}
            for table, rows in sorted(logical.items())
        },
        "source_visit_report": report["visits"],
        "audit_plan": audit_plan,
        "source_archive": archive,
    }
    reverse_tables: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for item in archive:
        reverse_tables[f"{item['source_schema']}.{item['source_table']}"].append({
            "source_path": item["source_path"], "source_index": item["source_index"],
            "source_pk": item["source_pk"], "source_row_hash": item["source_row_hash"],
            "row": item["source_row"], "redacted_fields": item["redacted_fields"],
        })
    reverse_table_doc = dict(sorted(reverse_tables.items()))
    reverse = {
        "format": "chartquest-supabase-reverse-export-v1",
        "batch_id": batch_id,
        "source_manifest_sha256": manifest_hash,
        "credential_values_written": 0,
        "notice": "sanitized application-data reverse export; authentication secrets and sessions are intentionally absent",
        "row_count": len(archive),
        "rows_sha256": rows_hash(archive),
        "tables_sha256": stable_hash(reverse_table_doc),
        "tables": reverse_table_doc,
    }
    quarantine_doc = {
        "format": "chartquest-cloudflare-quarantine-v1",
        "batch_id": batch_id,
        "row_count": len(quarantine),
        "rows_sha256": rows_hash(quarantine),
        "rows": quarantine,
    }
    return {
        "normalized": normalized_doc,
        "report": report,
        "reverse": reverse,
        "quarantine": quarantine_doc,
        "beta_import_sql": emit_beta_import_sql(normalized, batch_id, manifest_hash),
        "app_import_sql": emit_app_import_sql(normalized, archive, quarantine, audit_plan, batch_id),
        "beta_rollback_sql": emit_beta_rollback_sql(normalized, batch_id),
        "app_rollback_sql": emit_app_rollback_sql(normalized, batch_id),
    }


def _write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + "\n", encoding="utf-8")


def write_bundle(bundle: Mapping[str, Any], output: Path, force: bool = False) -> None:
    files = {
        "cloudflare-import.json": ("json", bundle["normalized"]),
        "cloudflare-reconciliation.json": ("json", bundle["report"]),
        "cloudflare-reverse-export.json": ("json", bundle["reverse"]),
        "cloudflare-quarantine.json": ("json", bundle["quarantine"]),
        "cloudflare-import-beta.sql": ("text", bundle["beta_import_sql"]),
        "cloudflare-import-app.sql": ("text", bundle["app_import_sql"]),
        "cloudflare-rollback-beta.sql": ("text", bundle["beta_rollback_sql"]),
        "cloudflare-rollback-app.sql": ("text", bundle["app_rollback_sql"]),
    }
    output.mkdir(parents=True, exist_ok=True)
    legacy = [name for name in ("cloudflare-import.sql", "cloudflare-rollback.sql") if (output / name).exists()]
    if legacy:
        raise ImportFailure(
            "output contains legacy combined-database SQL "
            f"({', '.join(legacy)}); use a new/empty output directory so BETA_DB and APP_DB scripts cannot be confused"
        )
    existing = [name for name in files if (output / name).exists()]
    if existing and not force:
        raise ImportFailure(f"output already contains bundle files ({', '.join(existing)}); use --force to replace only those files")
    for name, (kind, value) in files.items():
        if kind == "json":
            _write_json(output / name, value)
        else:
            (output / name).write_text(str(value), encoding="utf-8")
    readme = (
        "ChartQuest Supabase -> Cloudflare offline migration bundle\n\n"
        f"Batch: {bundle['normalized']['batch_id']}\n"
        f"Source project ref: {bundle['normalized']['source_contract']['expected_project_ref']} "
        f"(verified: {str(bundle['normalized']['source_contract']['project_ref_verified']).lower()})\n"
        f"Source export evidence verified: "
        f"{str(bundle['normalized']['source_contract']['source_export_proof']['verified']).lower()}\n"
        f"Ready for apply: {str(bundle['report']['ready_for_apply']).lower()}\n"
        f"Blocking quarantines: {bundle['report']['quarantine']['blocking']}\n\n"
        "1. Review cloudflare-reconciliation.json and cloudflare-quarantine.json.\n"
        "2. Back up both databases. Apply cloudflare-import-beta.sql only to BETA_DB.\n"
        "3. Apply cloudflare-import-app.sql only to APP_DB after migration 0002_app.sql.\n"
        "4. Runs remain imported/pending. Export every affected business and migration-audit D1 table.\n"
        "5. Run scripts/cloudflare_reconcile.py with --target-export and --mark-reconciled-sql.\n"
        "6. Apply mark-reconciled SQL to APP_DB only if the external comparison passed.\n"
        "7. The two rollback files remove only unchanged rows proven absent before this batch.\n\n"
        "No provider credential, password hash, auth token, session, or MFA secret is in this bundle.\n"
    )
    (output / "README.txt").write_text(readme, encoding="utf-8")


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Create an idempotent, auditable D1 import bundle from a complete Supabase JSON export."
    )
    parser.add_argument("input", help="Supabase JSON export file or directory")
    parser.add_argument("--out", help="output directory (default: <input-name>.cloudflare-import)")
    parser.add_argument("--force", action="store_true", help="replace only known bundle files in an existing output directory")
    args = parser.parse_args(argv)
    input_path = Path(args.input).expanduser().resolve()
    default_name = input_path.name + ".cloudflare-import"
    output = Path(args.out).expanduser().resolve() if args.out else input_path.parent / default_name
    try:
        bundle = build_bundle(input_path)
        write_bundle(bundle, output, args.force)
    except (ImportFailure, OSError) as exc:
        sys.stderr.write(f"cloudflare_import: {exc}\n")
        return 2
    report = bundle["report"]
    sys.stdout.write(
        f"bundle={output}\n"
        f"batch={bundle['normalized']['batch_id']}\n"
        f"source_rows={report['source']['rows']} normalized_rows={report['target']['rows']} "
        f"quarantine={report['quarantine']['rows']} blocking={report['quarantine']['blocking']}\n"
    )
    return 0 if report["ready_for_apply"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
