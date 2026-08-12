#!/usr/bin/env python3
"""ChartQuest beta-360 loopback-only browser QA server."""
from __future__ import annotations

import argparse
import hashlib
import http.server
import mimetypes
from pathlib import Path, PurePosixPath
import re
import sys
from urllib.parse import parse_qs, unquote, urlsplit

HOST = "127.0.0.1"
PORT = 0
ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / "chart-quest.html"
HARNESS = ROOT / ".chartquest/qa/BETA360_BROWSER_HARNESS.html"
BRIDGE = ROOT / ".chartquest/qa/beta360-bridge.js"
SURVEY = ROOT / "website/survey.html"
HARNESS_URL = "/.chartquest/qa/BETA360_BROWSER_HARNESS.html"
BRIDGE_URL = "/.chartquest/qa/beta360-bridge.js"
SURVEY_URL = "/survey.html"
SURVEY_DEPENDENCIES = {
    "/assets/cq-track.js": ROOT / "website/assets/cq-track.js",
    "/assets/pwa/icon-180.png": ROOT / "website/assets/pwa/icon-180.png",
    "/assets/pwa/icon-192.png": ROOT / "website/assets/pwa/icon-192.png",
}
CSP = "; ".join((
    "default-src 'self' data: blob:",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'none'",
    "frame-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'self'",
))
REMOTE_SUPABASE = (
    '<script src="https://cdn.jsdelivr.net/npm/@supabase/'
    'supabase-js@2/dist/umd/supabase.min.js"></script>'
)
LOCAL_SUPABASE = '<script src="/__qa__/supabase-offline-stub.js"></script>'
ROOT_FILES = {
    "/icon-192.png", "/icon-512.png", "/manifest.json", "/journal-book.webp",
    "/logo-512.jpg", "/logo-512.webp", "/mm-poster.jpg",
    "/Market-maker-cinematic.mp4",
}
ASSET_DIRS = ("/finn/", "/bosses/")
ASSET_EXT = {
    ".png", ".webp", ".jpg", ".jpeg", ".gif", ".svg", ".mp3", ".m4a",
    ".wav", ".ogg", ".mp4", ".webm", ".json", ".txt",
}
DENY_PARTS = {
    ".git", ".codex", ".env", ".ssh", ".aws", ".npmrc", ".netrc",
    "node_modules", "secrets", "credentials", "tokens",
}
SECRET_NAME = re.compile(r"(?:^|[._-])(secret|token|credential|private[-_]?key)(?:[._-]|$)", re.I)


def source_bytes():
    return GAME.read_bytes()


def source_hash():
    return hashlib.sha256(source_bytes()).hexdigest()


def qa_game():
    raw = source_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    text = raw.decode("utf-8")
    if text.count(REMOTE_SUPABASE) != 1:
        raise RuntimeError("expected one canonical Supabase CDN tag")
    text = text.replace(REMOTE_SUPABASE, LOCAL_SUPABASE, 1)
    early = (
        '<meta name="beta360-canonical-sha256" content="' + digest + '">\n'
        '<meta name="beta360-network-policy" content="connect-src none; loopback assets only">\n'
        "<script>window.__BETA360_EARLY_ERRORS__=[];window.__BETA360_CONSOLE_ERRORS__=[];"
        "(function(c){console.error=function(){var a=[];for(var i=0;i<arguments.length;i++){"
        "try{a.push(typeof arguments[i]==='string'?arguments[i]:JSON.stringify(arguments[i]));}"
        "catch(_){a.push(String(arguments[i]));}}window.__BETA360_CONSOLE_ERRORS__.push(a.join(' '));"
        "return c.apply(console,arguments);};})(console.error);"
        "addEventListener('error',function(e){__BETA360_EARLY_ERRORS__.push(String(e.message||e.error||'error'));});"
        "addEventListener('unhandledrejection',function(e){__BETA360_EARLY_ERRORS__.push(String(e.reason||'rejection'));});"
        "</script>\n"
    )
    if "<head>" not in text:
        raise RuntimeError("canonical game has no head")
    return text.replace("<head>", "<head>\n" + early, 1).encode()


def normalized(raw):
    try:
        value = unquote(raw, errors="strict")
    except (UnicodeDecodeError, ValueError):
        return None
    if not value.startswith("/") or "\x00" in value or "\\" in value:
        return None
    parts = PurePosixPath(value).parts
    if any(part in (".", "..") for part in parts):
        return None
    return "/" + "/".join(part for part in parts if part != "/")


def denied(path):
    parts = [p.lower() for p in PurePosixPath(path).parts if p != "/"]
    if any(p in DENY_PARTS for p in parts):
        return True
    if any(p.startswith(".") for p in parts):
        return path not in (HARNESS_URL, BRIDGE_URL)
    name = parts[-1] if parts else ""
    return bool(SECRET_NAME.search(name) or name.endswith((".pem", ".key", ".p12", ".pfx")))


def game_mode(query):
    """Accept only isolated QA/fresh URLs; QA and fresh may never be combined."""
    if query == {"qa": ["1"], "mute": ["1"]}:
        return "qa"
    if query == {"fresh": ["1"]}:
        return "fresh"
    if query == {"fresh": ["1"], "mute": ["1"]}:
        return "fresh-muted"
    return None


def asset(path):
    if path in ROOT_FILES:
        candidate = ROOT / path.lstrip("/")
    elif path.startswith(ASSET_DIRS) and Path(path).suffix.lower() in ASSET_EXT:
        candidate = ROOT / path.lstrip("/")
    else:
        return None
    try:
        resolved = candidate.resolve(strict=True)
    except OSError:
        return None
    return resolved if resolved.is_file() and ROOT in resolved.parents else None


class Handler(http.server.BaseHTTPRequestHandler):
    server_version = "ChartQuestBeta360QA/1"
    sys_version = ""

    def log_message(self, fmt, *args):
        if not getattr(self.server, "quiet", False):
            sys.stderr.write("[beta360-qa] " + fmt % args + "\n")

    def send_common_headers(self, ctype, size):
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(size))
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Content-Security-Policy", CSP)
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")

    def send_bytes(self, status, body, ctype, extra=None):
        self.send_response(status)
        self.send_common_headers(ctype, len(body))
        for key, value in (extra or {}).items():
            self.send_header(key, value)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def reject(self, status=404):
        self.send_bytes(status, b"request refused\n", "text/plain; charset=utf-8")

    def do_HEAD(self):
        self.do_GET()

    def do_POST(self):
        self.reject(405)

    def do_GET(self):
        parsed = urlsplit(self.path)
        path = normalized(parsed.path)
        if path is None or denied(path):
            return self.reject()
        if path == "/":
            self.send_response(302)
            self.send_common_headers("text/plain; charset=utf-8", 0)
            self.send_header("Location", HARNESS_URL)
            self.end_headers()
            return
        if path == "/chart-quest.html":
            query = parse_qs(parsed.query, keep_blank_values=True)
            mode = game_mode(query)
            if mode is None:
                return self.reject(400)
            body = qa_game()
            return self.send_bytes(200, body, "text/html; charset=utf-8", {
                "X-ChartQuest-Canonical-SHA256": source_hash(),
                "X-ChartQuest-QA-Rewrite": "offline-supabase+early-errors",
                "X-ChartQuest-Test-Mode": mode,
            })
        if path == HARNESS_URL:
            return self.serve_file(HARNESS)
        if path == BRIDGE_URL:
            return self.serve_file(BRIDGE)
        # The canonical game is tested from the repository root, while production serves its
        # byte-identical mirror as website/game.html beside website/survey.html. Preserve that
        # deployed sibling topology locally so the real beta-complete handoff can be exercised
        # without broadening the server's allowlist beyond this single explicit file.
        if path == SURVEY_URL:
            return self.serve_file(SURVEY)
        if path in SURVEY_DEPENDENCIES:
            return self.serve_file(SURVEY_DEPENDENCIES[path])
        if path == "/__qa__/supabase-offline-stub.js":
            return self.send_bytes(200, b"'use strict';window.__BETA360_SUPABASE_OFFLINE_STUB__=true;\n", "text/javascript")
        if path == "/sw.js":
            body = (
                b"'use strict';self.addEventListener('install',function(){self.skipWaiting();});"
                b"self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim());});\n"
            )
            return self.send_bytes(200, body, "text/javascript")
        if path == "/favicon.ico":
            return self.send_bytes(204, b"", "image/x-icon")
        candidate = asset(path)
        if candidate is None:
            return self.reject()
        self.serve_file(candidate)

    def serve_file(self, path):
        try:
            body = path.read_bytes()
        except OSError:
            return self.reject()
        ctype = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        if path.suffix == ".js":
            ctype = "text/javascript; charset=utf-8"
        elif path.suffix == ".html":
            ctype = "text/html; charset=utf-8"
        self.send_bytes(200, body, ctype)


def self_test():
    failures = []
    def check(ok, label):
        if not ok:
            failures.append(label)
    check(HOST == "127.0.0.1" and PORT == 0, "loopback/random-port defaults")
    check("connect-src 'none'" in CSP, "zero-connect CSP")
    check("headers" not in Handler.__dict__ and "send_common_headers" in Handler.__dict__,
          "request header field is not shadowed")
    raw = source_bytes()
    rewritten = qa_game()
    check(raw == source_bytes(), "canonical bytes unchanged")
    check(source_hash().encode() in rewritten, "canonical hash reported")
    check(REMOTE_SUPABASE.encode() not in rewritten and LOCAL_SUPABASE.encode() in rewritten, "offline CDN rewrite")
    check(b"__BETA360_CONSOLE_ERRORS__" in rewritten and b"console.error=function" in rewritten,
          "early console.error capture")
    check(game_mode(parse_qs("qa=1&mute=1")) == "qa", "strict QA query")
    check(game_mode(parse_qs("fresh=1")) == "fresh", "strict unmuted fresh query")
    check(game_mode(parse_qs("fresh=1&mute=1")) == "fresh-muted", "strict muted fresh query")
    check(game_mode(parse_qs("qa=1&fresh=1&mute=1")) is None, "reject combined QA/fresh query")
    check(game_mode(parse_qs("fresh=1&mute=1&extra=1")) is None, "reject extra game query")
    for path in ("/.git/config", "/.codex/config.toml", "/.env", "/token.json", "/package.json", "/scripts/x.py"):
        value = normalized(path)
        check(value is None or denied(value) or asset(value) is None, "deny " + path)
    check(asset("/finn/run.png") is not None, "allow Finn asset")
    check(asset("/Market-maker-cinematic.mp4") is not None, "allow opening cinematic")
    for path in (HARNESS, BRIDGE, SURVEY, *SURVEY_DEPENDENCIES.values()):
        check(path.is_file(), "present " + path.name)
    check(SURVEY_URL == "/survey.html" and SURVEY == ROOT / "website/survey.html",
          "production-equivalent survey sibling mapping")
    check(set(SURVEY_DEPENDENCIES) == {
        "/assets/cq-track.js", "/assets/pwa/icon-180.png", "/assets/pwa/icon-192.png"
    }, "exact survey dependency allowlist")
    check(all(asset(path) is None for path in SURVEY_DEPENDENCIES),
          "survey dependencies stay outside the generic asset allowlist")
    if HARNESS.is_file():
        text = HARNESS.read_text()
        low = text.lower()
        check("chart-quest.html?qa=1&amp;mute=1" in text and "fresh=1" not in low, "safe iframe URL")
        check(all(x not in low for x in ("localstorage", "indexeddb", "document.cookie")), "harness avoids storage APIs")
        check("run all" in low and "expected" in low and "actual" in low, "visible report")
    if BRIDGE.is_file():
        text = BRIDGE.read_text()
        low = text.lower()
        check(all(x in low for x in ("127.0.0.1", "localhost", "window._cq_dev", "window.qa", "window.parent.location.origin", "window.qabeta360")), "bridge guards")
        check(all(x not in low for x in ("localstorage", "indexeddb", "document.cookie", "resolvetrade('loss')", 'resolvetrade("loss")')), "bridge forbidden operations")
        check("tradetouchcheck" in low and "tradedrivencandle" in low, "real stop path")
    for failure in failures:
        print("FAIL", failure)
    if not failures:
        print("PASS beta360 QA local-only contracts · " + source_hash())
    return 1 if failures else 0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=PORT)
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        return self_test()
    if not (0 <= args.port <= 65535) or not HARNESS.is_file() or not BRIDGE.is_file():
        return 2
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    with http.server.ThreadingHTTPServer((HOST, args.port), Handler) as server:
        server.quiet = args.quiet
        url = f"http://{HOST}:{server.server_address[1]}{HARNESS_URL}"
        fresh_url = f"http://{HOST}:{server.server_address[1]}/chart-quest.html?fresh=1"
        print("BETA360_QA_URL=" + url, flush=True)
        print("BETA360_FRESH_URL=" + fresh_url, flush=True)
        try:
            server.serve_forever(poll_interval=0.2)
        except KeyboardInterrupt:
            pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
