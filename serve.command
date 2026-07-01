#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Chart Quest — local preview server.
# Double-click this ONCE and leave the window open while you work.
# It serves the project folder so the game + dashboard run at a
# real http:// address that Claude can open and verify directly —
# no deploy needed to see changes. Press Ctrl+C (or close) to stop.
# ─────────────────────────────────────────────────────────────
cd "$(dirname "$0")" || exit 1
PORT=8765
echo "🐢 Chart Quest preview server"
echo ""
echo "   Dashboard + QA : http://localhost:$PORT/dashboard.html"
echo "   The game       : http://localhost:$PORT/index.html"
echo ""
echo "   Leave this window open. Reloads pick up your latest edits."
echo "   Press Ctrl+C to stop."
echo ""
if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PORT"
else
  python -m http.server "$PORT"
fi
