#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  Double-click this to build (first time) and OPEN ChartQuest QA.
#  After the first build it only rebuilds when the code changes,
#  so day-to-day it just opens instantly.
# ─────────────────────────────────────────────────────────────
set -uo pipefail
cd "$(dirname "$0")"

# Make Homebrew tools findable even from a non-login shell (Apple Silicon + Intel).
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

clear
echo "════════════════════════════════════════════════"
echo "    🐢  ChartQuest QA & Design Review"
echo "════════════════════════════════════════════════"
echo

pause_exit() { echo; read -n1 -r -p "Press any key to close…"; exit "${1:-0}"; }

# 1) Xcode required to build a native macOS app
if ! /usr/bin/xcode-select -p >/dev/null 2>&1 || ! command -v xcodebuild >/dev/null 2>&1; then
  echo "✗ Xcode is required (one-time setup)."
  echo "  1. Install Xcode from the App Store (free)."
  echo "  2. Open it once and let it finish installing components."
  echo "  3. Double-click this file again."
  open "macappstore://apps.apple.com/app/xcode/id497799835" 2>/dev/null || true
  pause_exit 1
fi

# 2) XcodeGen (auto-install via Homebrew if missing)
if ! command -v xcodegen >/dev/null 2>&1; then
  echo "• Installing XcodeGen (one-time)…"
  if command -v brew >/dev/null 2>&1; then
    brew install xcodegen || { echo "✗ Could not install xcodegen."; pause_exit 1; }
  else
    echo "✗ Homebrew is needed to install XcodeGen automatically."
    echo "  Install Homebrew from https://brew.sh, then run this again."
    open "https://brew.sh" 2>/dev/null || true
    pause_exit 1
  fi
fi

# 3) Rebuild only if the app is missing or the source changed
APP="ChartQuestQA.app"
BIN="$APP/Contents/MacOS/ChartQuestQA"
NEEDS_BUILD=1
if [ -x "$BIN" ]; then
  if [ -z "$(find Sources project.yml scripts -newer "$BIN" 2>/dev/null | head -1)" ]; then
    NEEDS_BUILD=0
  fi
fi

if [ "$NEEDS_BUILD" -eq 1 ]; then
  echo "• Building ChartQuest QA — first run takes ~1 minute…"
  echo
  if ! bash scripts/build.sh 2>&1 | tee build.log; then
    echo
    echo "✗ Build failed. Scroll up to see the first error."
    pause_exit 1
  fi
  echo
else
  echo "• Already up to date — opening…"
fi

# Quit ALL running instances so the freshly-built version launches alone
# (multiple instances fight over the database and can show 0 reviews).
osascript -e 'tell application id "com.chartquest.qa" to quit' >/dev/null 2>&1 || true
sleep 1
pkill -f "ChartQuestQA.app/Contents/MacOS/ChartQuestQA" >/dev/null 2>&1 || true
sleep 1
open "$APP"
echo "✓ ChartQuest QA is open."
echo "  Tip: press ⌘⇧A anytime while playtesting to capture a review."
sleep 2
