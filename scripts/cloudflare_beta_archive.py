#!/usr/bin/env python3
"""Build an auditable, offline Cloudflare BETA_DB import from recovered snapshots.

This tool is deliberately narrower than ``cloudflare_import.py``.  It accepts
only the established ``beta_pull.py`` snapshot shape, never contacts either
provider, and never weakens the complete-export requirements used for account
and application-data retirement.

Original snapshots remain the source of truth.  The generated bundle is a
temporary, owner-only transport artifact containing private beta data.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import stat
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, Sequence, Tuple

from cloudflare_import_canonical import (
    BETA_AUDIT_SCHEMA_SQL,
    emit_beta_import_sql,
    emit_beta_rollback_sql,
)
from cloudflare_reconcile import canonical_json, rows_hash, stable_hash


FORMAT = "chartquest-recovered-beta-archive-v1"
PROJECT_REF = "ymxppzhczvmiuoncuqqu"
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


class ArchiveError(Exception):
    pass


@dataclass(frozen=True)
class SourceRow:
    snapshot: str
    snapshot_sha256: str
    pulled_at: str
    table: str
    source_index: int
    source_id: str
    row: Dict[str, Any]


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _parse_time(value: Any, field: str) -> datetime:
    if not isinstance(value, str) or not value.strip():
        raise ArchiveError(f"{field} must be a non-empty timestamp")
    text = value.strip().replace(" ", "T", 1)
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError as error:
        raise ArchiveError(f"{field} is not an ISO timestamp: {value!r}") from error
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _bounded_text(value: Any, field: str, limit: int, *, required: bool = False) -> Any:
    if value is None and not required:
        return None
    if not isinstance(value, str):
        raise ArchiveError(f"{field} must be text")
    if required and not value.strip():
        raise ArchiveError(f"{field} must not be blank")
    if len(value) > limit:
        raise ArchiveError(f"{field} exceeds {limit} characters")
    return value


def _event(row: Mapping[str, Any], source: str) -> Dict[str, Any]:
    event_id = _bounded_text(row.get("event_id"), f"{source}.event_id", 80, required=True)
    player_id = _bounded_text(row.get("player_id"), f"{source}.player_id", 64, required=True)
    session_id = _bounded_text(row.get("session_id"), f"{source}.session_id", 64, required=True)
    name = _bounded_text(row.get("name"), f"{source}.name", 64, required=True)
    if name not in EVENT_NAMES:
        raise ArchiveError(f"{source}.name is not in the closed event vocabulary: {name!r}")
    ts = _bounded_text(row.get("ts"), f"{source}.ts", 40, required=True)
    created_at = _bounded_text(row.get("created_at"), f"{source}.created_at", 48, required=True)
    _parse_time(ts, f"{source}.ts")
    _parse_time(created_at, f"{source}.created_at")
    props = row.get("props")
    if not isinstance(props, dict):
        raise ArchiveError(f"{source}.props must be a JSON object")
    props_json = json.dumps(props, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    if len(props_json) > 4096:
        raise ArchiveError(f"{source}.props exceeds the BETA_DB limit")
    return {
        "event_id": event_id,
        "player_id": player_id,
        "session_id": session_id,
        "name": name,
        "ts": ts,
        "props": props_json,
        "device": _bounded_text(row.get("device"), f"{source}.device", 16),
        "browser": _bounded_text(row.get("browser"), f"{source}.browser", 32),
        "os": _bounded_text(row.get("os"), f"{source}.os", 32),
        "screen": _bounded_text(row.get("screen"), f"{source}.screen", 24),
        "viewport": _bounded_text(row.get("viewport"), f"{source}.viewport", 24),
        "created_at": created_at,
    }


def _survey(row: Mapping[str, Any], source: str) -> Dict[str, Any]:
    response_id = _bounded_text(row.get("response_id"), f"{source}.response_id", 80, required=True)
    player_id = _bounded_text(row.get("player_id"), f"{source}.player_id", 64, required=True)
    session_id = _bounded_text(row.get("session_id"), f"{source}.session_id", 64, required=True)
    rating = row.get("q1_rating")
    seconds = row.get("seconds_taken")
    if not isinstance(rating, int) or isinstance(rating, bool) or not 1 <= rating <= 10:
        raise ArchiveError(f"{source}.q1_rating must be an integer from 1 to 10")
    if not isinstance(seconds, int) or isinstance(seconds, bool) or not 0 <= seconds <= 86400:
        raise ArchiveError(f"{source}.seconds_taken is outside the accepted range")
    continuation = _bounded_text(row.get("q4_continue"), f"{source}.q4_continue", 32, required=True)
    if continuation not in CONTINUE_VALUES:
        raise ArchiveError(f"{source}.q4_continue is invalid: {continuation!r}")
    created_at = _bounded_text(row.get("created_at"), f"{source}.created_at", 48, required=True)
    updated_at = row.get("updated_at") or created_at
    updated_at = _bounded_text(updated_at, f"{source}.updated_at", 48, required=True)
    _parse_time(created_at, f"{source}.created_at")
    _parse_time(updated_at, f"{source}.updated_at")
    return {
        "response_id": response_id,
        "player_id": player_id,
        "session_id": session_id,
        "q1_rating": rating,
        "q2_hook": _bounded_text(row.get("q2_hook"), f"{source}.q2_hook", 2000, required=True),
        "q3_improvement": _bounded_text(row.get("q3_improvement"), f"{source}.q3_improvement", 2000, required=True),
        "q4_continue": continuation,
        "q5_anything": _bounded_text(row.get("q5_anything"), f"{source}.q5_anything", 2000),
        "seconds_taken": seconds,
        "created_at": created_at,
        "updated_at": updated_at,
        "ingest_source": "supabase_history",
    }


def _source_rows(path: Path) -> Tuple[Dict[str, Any], List[SourceRow]]:
    try:
        document = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ArchiveError(f"cannot read a complete JSON snapshot at {path}: {error}") from error
    if not isinstance(document, dict):
        raise ArchiveError(f"{path} is not a snapshot object")
    if document.get("truncated") is not False:
        raise ArchiveError(f"{path} is not explicitly marked truncated=false")
    if document.get("warnings") not in ([], None):
        raise ArchiveError(f"{path} contains source warnings and must be reviewed first")
    pulled_at = document.get("pulled_at")
    _parse_time(pulled_at, f"{path}.pulled_at")
    snapshot_hash = _sha256(path)
    sources: List[SourceRow] = []
    for table, keys in (("beta_events", ("events", "prev_events")), ("beta_surveys", ("surveys", "prev_surveys"))):
        seen_ids: set[str] = set()
        index = 0
        for key in keys:
            rows = document.get(key, [])
            if not isinstance(rows, list):
                raise ArchiveError(f"{path}.{key} must be an array")
            for raw in rows:
                if not isinstance(raw, dict):
                    raise ArchiveError(f"{path}.{key}[{index}] must be an object")
                source_id = str(raw.get("id"))
                if source_id in ("", "None"):
                    raise ArchiveError(f"{path}.{key}[{index}] has no source id")
                if source_id in seen_ids:
                    raise ArchiveError(f"{path} repeats source {table} id {source_id}")
                seen_ids.add(source_id)
                sources.append(SourceRow(
                    snapshot=str(path.resolve()), snapshot_sha256=snapshot_hash,
                    pulled_at=pulled_at, table=table, source_index=index,
                    source_id=source_id, row=dict(raw),
                ))
                index += 1
    metadata = {
        "path": str(path.resolve()),
        "sha256": snapshot_hash,
        "size": path.stat().st_size,
        "pulled_at": pulled_at,
        "events": sum(1 for row in sources if row.table == "beta_events"),
        "surveys": sum(1 for row in sources if row.table == "beta_surveys"),
    }
    return metadata, sources


def _same_event(left: Mapping[str, Any], right: Mapping[str, Any]) -> bool:
    fields = (
        "event_id", "player_id", "session_id", "name", "props", "device",
        "browser", "os", "screen", "viewport",
    )
    return all(left.get(field) == right.get(field) for field in fields) and (
        _parse_time(left.get("ts"), "event.ts") == _parse_time(right.get("ts"), "event.ts")
    )


def _choose_event(rows: Sequence[Tuple[SourceRow, Dict[str, Any]]]) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    first = rows[0][1]
    if any(not _same_event(first, row) for _, row in rows[1:]):
        raise ArchiveError(f"event_id {first['event_id']!r} has conflicting semantic payloads")
    chosen_source, chosen = min(rows, key=lambda item: _parse_time(item[1]["created_at"], "event.created_at"))
    provenance = [{
        "snapshot": source.snapshot,
        "snapshot_sha256": source.snapshot_sha256,
        "source_id": source.source_id,
        "source_index": source.source_index,
        "created_at": row["created_at"],
        "selected": source is chosen_source,
    } for source, row in rows]
    return chosen, provenance


def _choose_survey(rows: Sequence[Tuple[SourceRow, Dict[str, Any]]]) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    first = rows[0][1]
    created_at = _parse_time(first["created_at"], "survey.created_at")
    for _, row in rows[1:]:
        if (
            row["player_id"] != first["player_id"]
            or row["session_id"] != first["session_id"]
            or _parse_time(row["created_at"], "survey.created_at") != created_at
        ):
            raise ArchiveError(
                f"response_id {first['response_id']!r} is reused by a different survey identity"
            )

    newest = max(_parse_time(row["updated_at"], "survey.updated_at") for _, row in rows)
    candidates = [
        (source, row) for source, row in rows
        if _parse_time(row["updated_at"], "survey.updated_at") == newest
    ]

    def same_version(left: Mapping[str, Any], right: Mapping[str, Any]) -> bool:
        fields = tuple(key for key in left if key not in ("created_at", "updated_at"))
        return (
            all(left.get(field) == right.get(field) for field in fields)
            and _parse_time(left["created_at"], "survey.created_at")
            == _parse_time(right["created_at"], "survey.created_at")
            and _parse_time(left["updated_at"], "survey.updated_at")
            == _parse_time(right["updated_at"], "survey.updated_at")
        )

    if any(not same_version(candidates[0][1], row) for _, row in candidates[1:]):
        raise ArchiveError(
            f"response_id {first['response_id']!r} has conflicting latest survey payloads"
        )
    chosen_source, chosen = min(
        candidates,
        key=lambda item: (
            item[0].snapshot_sha256,
            item[0].source_id,
            item[0].source_index,
            item[0].snapshot,
        ),
    )
    provenance = [{
        "snapshot": source.snapshot,
        "snapshot_sha256": source.snapshot_sha256,
        "source_id": source.source_id,
        "source_index": source.source_index,
        "updated_at": row["updated_at"],
        "selected": source is chosen_source,
    } for source, row in rows]
    return chosen, provenance


def build(snapshot_paths: Sequence[Path], project_ref: str) -> Tuple[Dict[str, Any], Dict[str, List[Dict[str, Any]]]]:
    if project_ref != PROJECT_REF:
        raise ArchiveError(f"wrong project ref: expected {PROJECT_REF}, received {project_ref}")
    if len(snapshot_paths) < 1:
        raise ArchiveError("at least one snapshot is required")
    metadata: List[Dict[str, Any]] = []
    all_rows: List[SourceRow] = []
    seen_paths: set[str] = set()
    for path in snapshot_paths:
        resolved = str(path.resolve())
        if resolved in seen_paths:
            raise ArchiveError(f"snapshot repeated: {resolved}")
        seen_paths.add(resolved)
        item, rows = _source_rows(path)
        metadata.append(item)
        all_rows.extend(rows)

    event_groups: Dict[str, List[Tuple[SourceRow, Dict[str, Any]]]] = {}
    survey_groups: Dict[str, List[Tuple[SourceRow, Dict[str, Any]]]] = {}
    for source in all_rows:
        location = f"{source.snapshot}:{source.table}:{source.source_index}"
        if source.table == "beta_events":
            row = _event(source.row, location)
            event_groups.setdefault(row["event_id"], []).append((source, row))
        else:
            row = _survey(source.row, location)
            survey_groups.setdefault(row["response_id"], []).append((source, row))

    events: List[Dict[str, Any]] = []
    surveys: List[Dict[str, Any]] = []
    event_provenance: Dict[str, Any] = {}
    survey_provenance: Dict[str, Any] = {}
    for key in sorted(event_groups):
        row, provenance = _choose_event(event_groups[key])
        events.append(row)
        if len(provenance) > 1:
            event_provenance[key] = provenance
    for key in sorted(survey_groups):
        row, provenance = _choose_survey(survey_groups[key])
        surveys.append(row)
        if len(provenance) > 1:
            survey_provenance[key] = provenance

    tables = {"beta_events": events, "beta_surveys": surveys}
    source_manifest = {
        "format": FORMAT,
        "project_ref": project_ref,
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "snapshots": sorted(metadata, key=lambda item: (item["pulled_at"], item["path"])),
        "physical_source_rows": {
            "beta_events": sum(item["events"] for item in metadata),
            "beta_surveys": sum(item["surveys"] for item in metadata),
        },
        "canonical_rows": {"beta_events": len(events), "beta_surveys": len(surveys)},
        "canonical_hashes": {
            "beta_events": rows_hash(events), "beta_surveys": rows_hash(surveys),
        },
        "duplicate_event_ids": len(event_provenance),
        "versioned_response_ids": len(survey_provenance),
        "event_provenance": event_provenance,
        "survey_provenance": survey_provenance,
        "limitations": [
            "Supabase numeric ids are snapshot-local metadata and are not D1 identities.",
            "The archive is bounded at the newest supplied snapshot; later production writes require a delta pull.",
            "Source snapshots are process evidence, not a source-signed complete project export.",
        ],
    }
    source_manifest["manifest_sha256"] = stable_hash({
        key: value for key, value in source_manifest.items()
        if key not in ("created_at", "manifest_sha256")
    })
    return source_manifest, tables


def _write_private(path: Path, value: str) -> None:
    path.write_text(value, encoding="utf-8")
    path.chmod(stat.S_IRUSR | stat.S_IWUSR)


def _wrangler_file(sql: str) -> str:
    """Return D1's file-import form.

    ``wrangler d1 execute --file`` wraps an import in its own transaction.  An
    explicit BEGIN/COMMIT pair therefore causes the documented nested-
    transaction failure.  The canonical emitter retains those statements for
    local SQLite/Studio use; this derivative removes only the two standalone
    transaction-control lines and leaves every audited mutation unchanged.
    """
    prefix = BETA_AUDIT_SCHEMA_SQL + "\nBEGIN TRANSACTION;\n"
    suffix = "\nCOMMIT;\n"
    if not sql.startswith(prefix) or not sql.endswith(suffix):
        raise ArchiveError("generated beta SQL does not have the expected outer transaction boundary")
    body = sql[len(prefix):-len(suffix)]
    return BETA_AUDIT_SCHEMA_SQL + "\n" + body + "\n"


def write_bundle(out_dir: Path, manifest: Mapping[str, Any], tables: Mapping[str, Sequence[Mapping[str, Any]]]) -> None:
    out_dir.mkdir(parents=True, exist_ok=False)
    out_dir.chmod(stat.S_IRUSR | stat.S_IWUSR | stat.S_IXUSR)
    manifest_hash = str(manifest["manifest_sha256"])
    batch_id = f"beta-archive-{manifest_hash[:24]}"
    canonical = {
        "format": FORMAT,
        "project_ref": manifest["project_ref"],
        "manifest_sha256": manifest_hash,
        "events": list(tables["beta_events"]),
        "surveys": list(tables["beta_surveys"]),
    }
    verification = f"""-- Read-only post-import checks for {batch_id}\n""" + "\n".join((
        "SELECT run_id,source_count,status,source_manifest_sha256 FROM beta_migration_runs "
        f"WHERE run_id='{batch_id}';",
        "SELECT target_table,count(*) AS audited,sum(existed_before) AS preexisting "
        "FROM beta_migration_import_state "
        f"WHERE run_id='{batch_id}' GROUP BY target_table ORDER BY target_table;",
        "SELECT target_table,reason,count(*) AS conflicts FROM beta_migration_conflicts "
        f"WHERE run_id='{batch_id}' GROUP BY target_table,reason ORDER BY target_table,reason;",
        "SELECT (SELECT count(*) FROM beta_events) AS events_total, "
        "(SELECT count(*) FROM beta_surveys) AS surveys_total;",
        "PRAGMA foreign_key_check;",
        "",
    ))
    _write_private(out_dir / "manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    _write_private(out_dir / "canonical-beta.json", json.dumps(canonical, ensure_ascii=False, separators=(",", ":")) + "\n")
    import_sql = emit_beta_import_sql(tables, batch_id, manifest_hash)
    rollback_sql = emit_beta_rollback_sql(tables, batch_id)
    _write_private(out_dir / "cloudflare-import-beta.sql", import_sql)
    _write_private(out_dir / "cloudflare-import-beta-wrangler.sql", _wrangler_file(import_sql))
    _write_private(out_dir / "cloudflare-rollback-beta.sql", rollback_sql)
    _write_private(out_dir / "cloudflare-rollback-beta-wrangler.sql", _wrangler_file(rollback_sql))
    _write_private(out_dir / "cloudflare-verify-beta.sql", verification)


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("snapshots", nargs="+", type=Path)
    parser.add_argument("--project-ref", required=True)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args(argv)
    try:
        manifest, tables = build(args.snapshots, args.project_ref)
        write_bundle(args.out, manifest, tables)
    except (ArchiveError, OSError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print(json.dumps({
        "ok": True,
        "out": str(args.out.resolve()),
        "events": len(tables["beta_events"]),
        "surveys": len(tables["beta_surveys"]),
        "manifest_sha256": manifest["manifest_sha256"],
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
