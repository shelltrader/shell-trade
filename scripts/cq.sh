#!/bin/bash
# ChartQuest dev helper — automates the per-change loop so steps aren't missed.
# Usage:  scripts/cq.sh <check | mirror | tag | ship | serve [port] | qr [port]>
#   check   syntax-check the inline game <script> (node --check)
#   mirror  copy chart-quest.html -> index.html (the deployed mirror) + verify identical
#   tag     print the current BUILD_TAG
#   ship    check + mirror + tag  (run before every commit)
#   serve   start the no-cache LAN preview server (default port 8795)
#   qr      print a scannable LAN QR to the beginner-mode URL (?fresh=1)
set -euo pipefail
cd "$(dirname "$0")/.."

case "${1:-}" in
  check)
    node -e 'const fs=require("fs");const h=fs.readFileSync("chart-quest.html","utf8");const o=h.indexOf("<script>");const c=h.indexOf("</script>",o);fs.writeFileSync("/tmp/_cq_check.js",h.slice(o+8,c));'
    node --check /tmp/_cq_check.js && echo "✓ syntax OK"
    ;;
  mirror)
    cp chart-quest.html index.html
    if diff -q chart-quest.html index.html >/dev/null; then echo "✓ index.html mirrored from source"; else echo "✗ mirror MISMATCH"; exit 1; fi
    ;;
  tag)
    grep "BUILD_TAG =" chart-quest.html | grep -o "build [0-9][^']*" | head -1 || echo "(no BUILD_TAG found)"
    ;;
  ship)
    "$0" check && "$0" mirror && echo -n "build tag: " && "$0" tag
    ;;
  serve)
    python3 scripts/serve_nocache.py "${2:-8795}"
    ;;
  qr)
    IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo 127.0.0.1)"
    P="${2:-8795}"; URL="http://$IP:$P/chart-quest.html?fresh=1"
    echo "SCAN (beginner mode): $URL"; echo
    command -v qrencode >/dev/null 2>&1 && qrencode -t ANSIUTF8 "$URL" || echo "(brew install qrencode for the QR)"
    ;;
  *)
    echo "usage: scripts/cq.sh <check | mirror | tag | ship | serve [port] | qr [port]>"
    ;;
esac
