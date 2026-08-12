#!/usr/bin/env python3
"""Allowlisted, no-cache ChartQuest mobile preview server.

Unlike the legacy repository-wide preview server, this listener exposes only the canonical game,
its explicitly allowlisted runtime assets, the production-equivalent survey sibling, and the
offline Supabase stub. Command-center files, Git data, scripts, reports, tokens, and the QA
harness/bridge are never served.
"""
from __future__ import annotations

import argparse
import http.server
from urllib.parse import parse_qs, urlsplit

from beta360_qa_server import (
    BRIDGE_URL,
    HARNESS_URL,
    Handler as AllowlistedHandler,
    denied,
    normalized,
    qa_game,
    source_hash,
)

HOST = "0.0.0.0"
DEFAULT_PORT = 8798
FRESH_URL = "/chart-quest.html?fresh=1"


def mobile_game_query(query):
    """A phone preview is fresh and music-on; QA and forced-mute modes stay loopback-only."""
    return query == {"fresh": ["1"]}


class MobilePreviewHandler(AllowlistedHandler):
    server_version = "ChartQuestMobilePreview/1"

    def do_GET(self):
        parsed = urlsplit(self.path)
        path = normalized(parsed.path)
        if path is None or denied(path):
            return self.reject()
        if path == "/":
            self.send_response(302)
            self.send_common_headers("text/plain; charset=utf-8", 0)
            self.send_header("Location", FRESH_URL)
            self.end_headers()
            return
        if path in (HARNESS_URL, BRIDGE_URL):
            return self.reject()
        if path == "/chart-quest.html":
            query = parse_qs(parsed.query, keep_blank_values=True)
            if not mobile_game_query(query):
                return self.reject(400)
            body = qa_game()
            return self.send_bytes(200, body, "text/html; charset=utf-8", {
                "X-ChartQuest-Canonical-SHA256": source_hash(),
                "X-ChartQuest-Preview": "allowlisted-offline-fresh-music-on",
            })
        return super().do_GET()


def self_test():
    checks = {
        "fresh music-on query": mobile_game_query(parse_qs("fresh=1")),
        "reject forced mute": not mobile_game_query(parse_qs("fresh=1&mute=1")),
        "reject QA": not mobile_game_query(parse_qs("qa=1&mute=1")),
        "reject extra query": not mobile_game_query(parse_qs("fresh=1&extra=1")),
        "Git denied": denied("/.git/config"),
        "Codex denied": denied("/.codex/config.toml"),
        "environment denied": denied("/.env"),
        "token denied": denied("/token.json"),
        "canonical hash present": source_hash().encode() in qa_game(),
        "QA surfaces distinct": HARNESS_URL != FRESH_URL and BRIDGE_URL != FRESH_URL,
    }
    failures = [label for label, ok in checks.items() if not ok]
    for label in failures:
        print("FAIL", label)
    if not failures:
        print("PASS mobile preview allowlist · " + source_hash())
    return 1 if failures else 0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        return self_test()
    if not 1024 <= args.port <= 65535:
        return 2
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    with http.server.ThreadingHTTPServer((HOST, args.port), MobilePreviewHandler) as server:
        server.quiet = args.quiet
        print(f"CHARTQUEST_MOBILE_PREVIEW=http://0.0.0.0:{args.port}{FRESH_URL}", flush=True)
        print("Scope: game + explicit runtime assets only; offline; no command-center files", flush=True)
        try:
            server.serve_forever(poll_interval=0.2)
        except KeyboardInterrupt:
            pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
