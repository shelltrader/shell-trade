#!/usr/bin/env python3
"""Loopback-only synthetic-data server for founder dashboard visual QA."""
from __future__ import annotations

import argparse
import hashlib
import http.server
import json
import mimetypes
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).resolve().parents[1] / "website"
HOST = "127.0.0.1"

DATASETS = [
    "identities", "profiles", "journal_versions", "journal_trades", "journal_notes",
    "journal_changes", "streaks", "mastery", "mastery_quarantine", "bugs", "visits",
    "visit_days", "content_events", "content_replays", "content_briefs", "content_assets",
    "content_generated", "content_exports", "published_posts", "performance", "outbox",
    "migration_runs", "migration_ledger", "migration_quarantine", "reconciliation",
]


def fixture():
    events = []
    event_id = 0
    stages = [
        "session_start", "tutorial_started", "tutorial_completed", "first_trade_started",
        "boss_started", "boss_defeated", "journal_unlocked", "journal_discovery_completed",
        "beta_completed", "survey_started", "survey_submitted",
    ]
    reach = [10, 9, 8, 7, 7, 6, 6, 5, 5, 5, 5]
    for stage, count in zip(stages, reach):
        for index in range(count):
            event_id += 1
            events.append({
                "id": event_id, "event_id": f"evt-{event_id}", "player_id": f"p-{index + 1}",
                "session_id": f"s-{index + 1}", "name": stage,
                "ts": f"2026-08-22T10:{event_id % 60:02d}:00.000Z",
                "props": {"build": "368", "page": "game", "seconds": 520},
                "device": "mobile" if index < 8 else "desktop", "browser": "Safari" if index < 8 else "Chrome",
                "os": "iOS" if index < 8 else "macOS", "screen": "390x844", "viewport": "390x700",
                "created_at": f"2026-08-22T10:{event_id % 60:02d}:00.000Z",
            })
    event_id += 1
    events.append({
        "id": event_id, "event_id": f"evt-{event_id}", "player_id": "p-2", "session_id": "s-2",
        "name": "crash", "ts": "2026-08-22T10:59:00.000Z",
        "props": {"build": "368", "message": "TypeError: trade replay marker", "origin": "self"},
        "device": "mobile", "browser": "Safari", "os": "iOS", "created_at": "2026-08-22T10:59:00.000Z",
    })
    surveys = [
        {"id": 1, "response_id": "r-1", "player_id": "p-1", "session_id": "s-1", "q1_rating": 9, "q2_hook": "The trades", "q3_improvement": "Improve the music during trades", "q4_continue": "immediately", "q5_anything": "Great idea", "seconds_taken": 60, "created_at": "2026-08-22T11:00:00.000Z", "updated_at": "2026-08-22T11:00:00.000Z"},
        {"id": 2, "response_id": "r-2", "player_id": "p-2", "session_id": "s-2", "q1_rating": 8, "q2_hook": "Boss fight", "q3_improvement": "Music volume could be better", "q4_continue": "later", "q5_anything": "", "seconds_taken": 72, "created_at": "2026-08-22T11:02:00.000Z", "updated_at": "2026-08-22T11:02:00.000Z"},
        {"id": 3, "response_id": "r-3", "player_id": "p-3", "session_id": "s-3", "q1_rating": 9, "q2_hook": "Candles", "q3_improvement": "Make the controls clearer", "q4_continue": "immediately", "q5_anything": "", "seconds_taken": 55, "created_at": "2026-08-22T11:03:00.000Z", "updated_at": "2026-08-22T11:03:00.000Z"},
        {"id": 4, "response_id": "r-4", "player_id": "p-4", "session_id": "s-4", "q1_rating": 7, "q2_hook": "Journal", "q3_improvement": "More journal pages", "q4_continue": "later", "q5_anything": "", "seconds_taken": 80, "created_at": "2026-08-22T11:04:00.000Z", "updated_at": "2026-08-22T11:04:00.000Z"},
        {"id": 5, "response_id": "r-5", "player_id": "p-5", "session_id": "s-5", "q1_rating": 8, "q2_hook": "Learning", "q3_improvement": "", "q4_continue": "not_interested", "q5_anything": "Tutorial text felt small", "seconds_taken": 68, "created_at": "2026-08-22T11:05:00.000Z", "updated_at": "2026-08-22T11:05:00.000Z"},
    ]
    app = {name: [] for name in DATASETS}
    app["identities"] = [
        {"id": "11111111-1111-4111-8111-111111111111", "email_normalized": "alpha@example.com", "email_original": "alpha@example.com", "source_provider": "cloudflare", "status": "active", "created_at": "2026-08-21T08:00:00Z", "updated_at": "2026-08-22T08:00:00Z"},
        {"id": "22222222-2222-4222-8222-222222222222", "email_normalized": "beta@example.com", "email_original": "beta@example.com", "source_provider": "supabase", "status": "pending_claim", "created_at": "2026-08-21T08:00:00Z", "updated_at": "2026-08-22T08:00:00Z"},
    ]
    app["profiles"] = [
        {"user_id": app["identities"][0]["id"], "shells": 46, "player_level": 2, "xp": 85, "updated_at": "2026-08-22T08:00:00Z"},
        {"user_id": app["identities"][1]["id"], "shells": 18, "player_level": 1, "xp": 40, "updated_at": "2026-08-22T08:00:00Z"},
    ]
    uid = app["identities"][0]["id"]
    app["streaks"] = [{"user_id": uid, "streak": 3, "best_streak": 5, "updated_at": "2026-08-22T08:00:00Z"}]
    app["mastery"] = [{"owner_key": uid, "user_id": uid, "category_normalized": "trend", "score": 62}, {"owner_key": uid, "user_id": uid, "category_normalized": "risk_management", "score": 48}]
    app["journal_versions"] = [{"user_id": uid, "version": 2, "created_at": "2026-08-22T08:00:00Z"}]
    app["journal_trades"] = [{"user_id": uid, "trade_id": "trade-1", "trade_data": {"symbol": "ETH", "lesson": "momentum"}, "row_version": 2, "created_at": "2026-08-22T08:00:00Z", "updated_at": "2026-08-22T08:00:00Z", "deleted_at": None}]
    app["journal_notes"] = [{"user_id": uid, "note_id": "note-1", "note_data": {"text": "Wait for confirmation"}, "row_version": 2, "created_at": "2026-08-22T08:00:00Z", "updated_at": "2026-08-22T08:00:00Z", "deleted_at": None}]
    app["journal_changes"] = [{"user_id": uid, "operation": "upsert", "created_at": "2026-08-22T08:00:00Z"}]
    app["bugs"] = [{"status": "open", "player_id": "p-2", "message": "Replay marker stopped early", "context": {"build": "368"}, "created_at": "2026-08-22T11:10:00Z"}]
    app["visits"] = [{"player_id": f"p-{i}", "path": "/play", "device": "mobile", "created_at": "2026-08-22T09:00:00Z"} for i in range(1, 7)]
    app["visit_days"] = [{"visit_date": "2026-08-22", "path": "/play", "visit_count": 6, "first_seen_at": "2026-08-22T09:00:00Z", "last_seen_at": "2026-08-22T10:00:00Z"}]
    app["content_events"] = [{"event_type": "boss_win", "ts": "2026-08-22T10:40:00Z", "player_id": "p-1", "significance_score": 82, "processed_status": "new", "payload": {}, "educational_metadata": {}, "content_flags": {}}]
    app["content_briefs"] = [{"status": "proposed", "brief_key": "brief-001"}]
    app["outbox"] = [{"status": "pending", "outbox_id": "outbox-001"}]
    app["migration_runs"] = [{"dataset": "profiles", "status": "imported", "source_count": 2, "imported_count": 2, "quarantine_count": 0, "started_at": "2026-08-22T07:00:00Z", "finished_at": "2026-08-22T07:05:00Z"}]
    app["migration_ledger"] = [{"status": "imported"}, {"status": "imported"}]
    app["reconciliation"] = [{"dataset": "profiles", "source_count": 2, "target_count": 2, "quarantine_count": 0, "matched": 1, "checked_at": "2026-08-22T07:06:00Z"}]
    return events, surveys, app


EVENTS, SURVEYS, APP = fixture()


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *_args):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def json(self, payload, status=200):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlsplit(self.path)
        query = parse_qs(parsed.query)
        if parsed.path == "/founder/api/beta-data":
            name = query.get("dataset", [""])[0]
            source = EVENTS if name == "events" else SURVEYS if name == "surveys" else None
            if source is None:
                return self.json({"error": "unknown dataset"}, 400)
            cursor = int(query.get("cursor", ["0"])[0])
            selected = [row for row in source if int(row["id"]) > cursor]
            return self.json({"dataset": name, "rows": selected, "page": {"count": len(selected), "next_cursor": None, "has_more": False}})
        if parsed.path == "/founder/api/app-data":
            name = query.get("dataset", ["summary"])[0]
            if name == "summary":
                return self.json({"ok": True, "summary": {"datasets": DATASETS, "counts": {key: len(value) for key, value in APP.items()}}})
            if name == "snapshot":
                counts = {key: len(value) for key, value in APP.items()}
                digest_input = json.dumps(
                    {"snapshot_version": 1, "datasets": DATASETS, "rows": APP},
                    sort_keys=True, separators=(",", ":"),
                ).encode()
                return self.json({
                    "ok": True,
                    "snapshot": {
                        "version": 1,
                        "token": hashlib.sha256(digest_input).hexdigest(),
                        "datasets": DATASETS,
                        "counts": counts,
                        "total": sum(counts.values()),
                        "rows": APP,
                    },
                })
            if name not in APP:
                return self.json({"error": "unknown dataset"}, 400)
            cursor = int(query.get("cursor", ["0"])[0])
            limit = int(query.get("limit", ["500"])[0])
            selected = APP[name][cursor:cursor + limit]
            more = cursor + len(selected) < len(APP[name])
            return self.json({"dataset": name, "rows": selected, "page": {"cursor": cursor, "count": len(selected), "next_cursor": cursor + len(selected) if more else None, "has_more": more}})
        return super().do_GET()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8921)
    args = parser.parse_args()
    with http.server.ThreadingHTTPServer((HOST, args.port), Handler) as server:
        print(f"Founder dashboard QA → http://{HOST}:{args.port}/founder/beta.html", flush=True)
        server.serve_forever()


if __name__ == "__main__":
    main()
