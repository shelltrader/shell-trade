#!/usr/bin/env python3
"""ChartQuest local preview server — no-cache, LAN-accessible.

Usage:  python3 scripts/serve_nocache.py [port]      (default 8795)

Serves the repo ROOT so chart-quest.html + finn/ + bosses/ load at a real
http:// URL. Binds 0.0.0.0 so a phone on the same Wi-Fi can scan a QR to it.
No-cache headers so every reload picks up the latest edit. Stable, repo-local
path — unlike the old per-session scratchpad servers that went dead each session.
"""
import http.server
import socketserver
import os
import sys

# Serve from the repo root (this file lives in scripts/).
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8795


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def log_message(self, *args):
        pass  # quiet


if __name__ == "__main__":
    with socketserver.TCPServer(("0.0.0.0", PORT), NoCacheHandler) as httpd:
        print(f"ChartQuest preview → http://127.0.0.1:{PORT}/chart-quest.html?fresh=1  (LAN on :{PORT})")
        httpd.serve_forever()
