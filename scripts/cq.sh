#!/bin/bash
# ChartQuest dev helper — automates the per-change loop so steps aren't missed.
# Usage:  scripts/cq.sh <check | verify | mirror | site | tag | ship | serve [port] | qr [port]>
#   check   syntax-check the inline game <script> (node --check)
#   verify  run the full regression gate (scripts/verify.js) — prints PASS/FAIL
#   mirror  copy chart-quest.html -> index.html (the deployed mirror) + verify identical
#   site    refresh website/game.html + assets so the marketing site shows the latest build
#   tag     print the current BUILD_TAG
#   ship    mirror + verify + site + tag  (run before every commit; STOPS on a gate FAIL)
#   serve   start the no-cache LAN preview server (default port 8795)
#   qr      print a scannable LAN QR to the beginner-mode URL (?fresh=1)
# For an approved protected-system change, run: CQ_ALLOW_PROTECTED=1 scripts/cq.sh ship
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
  verify)
    node scripts/verify.js
    ;;
  site)
    # Refresh the marketing-site embedded game so website/ ALWAYS shows the latest build.
    # website/game.html is a SELF-CONTAINED copy (the marketing site deploys separately and
    # can't reach the root game). Also mirror every asset the game loads at RUNTIME — sprite
    # and boss paths are built in JS, so copy the whole folders + auto-discovered top-level media.
    cp chart-quest.html website/game.html
    mkdir -p website/finn website/bosses
    cp -f finn/*.png    website/finn/   2>/dev/null || true
    cp -f bosses/*.webp website/bosses/ 2>/dev/null || true
    # top-level media the game references (auto-discovered so a NEW asset is never missed)
    media="$(grep -oE '[A-Za-z0-9][A-Za-z0-9._-]*\.(png|jpg|jpeg|webp|gif|svg|mp4|webm|mp3|ogg)' chart-quest.html | grep -vE '/' | sort -u || true)"
    for f in $media logo.png icon-192.png; do [ -f "$f" ] && cp -f "$f" website/ 2>/dev/null || true; done
    # guard: the sprite whose absence caused the "old procedural turtle" fallback MUST be present
    [ -f website/finn/run.png ] || { echo "✗ site: website/finn/run.png missing — game would fall back to the old turtle"; exit 1; }
    SRC="$(grep "BUILD_TAG =" chart-quest.html | grep -o "build [0-9][^']*" | head -1 || true)"
    SITE="$(grep "BUILD_TAG =" website/game.html | grep -o "build [0-9][^']*" | head -1 || true)"
    if [ -n "$SRC" ] && [ "$SRC" = "$SITE" ]; then echo "✓ website embed synced → $SITE (+ finn, bosses, logo, cinematic)"; else echo "✗ site: build-tag mismatch (source='$SRC' site='$SITE')"; exit 1; fi
    ;;
  ship)
    "$0" mirror && node scripts/verify.js && "$0" site && echo -n "build tag: " && "$0" tag
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
    echo "usage: scripts/cq.sh <check | verify | mirror | site | tag | ship | serve [port] | qr [port]>"
    ;;
esac
