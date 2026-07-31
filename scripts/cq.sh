#!/bin/bash
# ChartQuest dev helper — automates the per-change loop so steps aren't missed.
# Usage:  scripts/cq.sh <check | verify | mirror | site | tag | ship | serve [port] | qr [port] | desktop-qr [port]>
#   check   syntax-check the inline game <script> (node --check)
#   verify  run the full regression gate (scripts/verify.js) — prints PASS/FAIL
#   mirror  copy chart-quest.html -> index.html (the deployed mirror) + verify identical
#   site    refresh website/game.html + assets so the marketing site shows the latest build
#   tag     print the current BUILD_TAG
#   ship    mirror + verify + site + tag + desktop-qr  (run before every commit; STOPS on a gate FAIL)
#   serve   start the no-cache LAN preview server (default port 8795)
#   qr      print a scannable LAN QR to the beginner-mode URL (?fresh=1)
#   desktop-qr  refresh ~/Desktop/ChartQuest-Test-QR.svg (labelled with the build + LAN URL); auto-runs on ship
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
    "$0" mirror && node scripts/verify.js && "$0" site && echo -n "build tag: " && "$0" tag && "$0" desktop-qr
    ;;
  desktop-qr)
    # Refresh the always-current test QR on the Desktop (labelled with the build + LAN URL).
    # Never fails the ship: the helper exits 0 even if qrencode is missing.
    python3 scripts/desktop_qr.py "${2:-8795}" || true
    ;;
  serve)
    python3 scripts/serve_nocache.py "${2:-8795}"
    ;;
  qr)
    # ── BUILD-IDENTITY GUARD (build 304) ────────────────────────────────────────────────
    # A founder playtest was silently run against the WRONG BUILD: another worktree had a
    # server already listening on 8795, so the QR pointed at feature/home-market-ceremony
    # (build 307) while the work under test sat in main (build 302). Nothing anywhere said so.
    # The QR now refuses to print unless the server on that port is serving THIS checkout:
    # it compares the BUILD_TAG on the wire against the BUILD_TAG on disk.
    IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo 127.0.0.1)"
    P="${2:-8795}"; URL="http://$IP:$P/chart-quest.html?fresh=1&mute=1"
    # Must read the BUILD_TAG LINE specifically — a bare `grep "build [0-9]"` matches prose in
    # older comments ("build 262 …") and would happily "verify" two unrelated checkouts as equal.
    # Must read the BUILD_TAG LINE specifically — a bare `grep "build [0-9]"` matches prose in
    # older comments ("build 262 …") and would "verify" two unrelated checkouts as equal.
    # And the digits must be [0-9]+, never [0-9]*: with `*` the pattern matches the bare word
    # "build ", so both sides come back empty and empty==empty passes the guard silently.
    DISK="$(grep "BUILD_TAG =" chart-quest.html | grep -oE "build [0-9]+" | head -1)"
    # `|| true` is load-bearing: this script runs under `set -euo pipefail`, so an unreachable
    # port would abort the whole command silently instead of reaching the friendly error below.
    WIRE="$(curl -s --max-time 4 "http://127.0.0.1:$P/chart-quest.html" 2>/dev/null | grep "BUILD_TAG =" | grep -oE "build [0-9]+" | head -1 || true)"
    if [ -z "$WIRE" ]; then
      echo "✗ nothing is serving port $P."
      echo "  start this checkout with:  scripts/cq.sh serve $P"
      exit 1
    fi
    if [ "$WIRE" != "$DISK" ]; then
      echo "✗ PORT $P IS SERVING A DIFFERENT CHECKOUT — refusing to print a misleading QR."
      echo "    on the wire : $WIRE"
      echo "    in this dir : $DISK   ($(pwd))"
      SERVER_CWD="$(lsof -a -d cwd -Fn -p "$(lsof -nP -tiTCP:"$P" -sTCP:LISTEN 2>/dev/null | head -1)" 2>/dev/null | grep '^n' | cut -c2- || true)"
      [ -n "$SERVER_CWD" ] && echo "    that port is being served from: $SERVER_CWD"
      echo "  serve THIS checkout on a free port, e.g.:  scripts/cq.sh qr 8799"
      exit 1
    fi
    echo "SCAN (beginner mode, muted) — verified $WIRE from $(pwd):"; echo "$URL"; echo
    command -v qrencode >/dev/null 2>&1 && qrencode -t ANSIUTF8 "$URL" || echo "(brew install qrencode for the QR)"
    ;;
  *)
    echo "usage: scripts/cq.sh <check | verify | mirror | site | tag | ship | serve [port] | qr [port]>"
    ;;
esac
