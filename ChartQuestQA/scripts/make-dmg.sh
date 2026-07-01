#!/usr/bin/env bash
# Package a (notarized) .app into a distributable DMG with an Applications shortcut.
# Usage:  ./scripts/make-dmg.sh [path/to/ChartQuestQA.app]
set -euo pipefail
cd "$(dirname "$0")/.."

APP="${1:-build/export/ChartQuestQA.app}"
[ -d "$APP" ] || { echo "✗ App not found: $APP — build or notarize first."; exit 1; }

STAGE="$(mktemp -d)"
cp -R "$APP" "$STAGE/ChartQuest QA.app"
ln -s /Applications "$STAGE/Applications"

mkdir -p dist
rm -f dist/ChartQuestQA.dmg
hdiutil create -volname "ChartQuest QA" -srcfolder "$STAGE" -ov -format UDZO dist/ChartQuestQA.dmg
rm -rf "$STAGE"

echo "✓ dist/ChartQuestQA.dmg — drag-to-Applications installer ready to share."
