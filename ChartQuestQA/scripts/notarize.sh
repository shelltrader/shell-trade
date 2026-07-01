#!/usr/bin/env bash
# Archive → export (Developer ID) → notarize → staple.
# Prereqs (one-time):
#   • An Apple Developer account + Developer ID Application certificate in your keychain.
#   • Edit ExportOptions.plist: set teamID to your Team ID.
#   • Store notary credentials: xcrun notarytool store-credentials "CQ_NOTARY" \
#         --apple-id you@apple.com --team-id TEAMID --password <app-specific-password>
# Usage:  NOTARY_PROFILE=CQ_NOTARY TEAM_ID=ABCDE12345 ./scripts/notarize.sh
set -euo pipefail
cd "$(dirname "$0")/.."

: "${NOTARY_PROFILE:?Set NOTARY_PROFILE to your notarytool keychain profile name}"
TEAM_ID="${TEAM_ID:-}"

command -v xcodegen >/dev/null 2>&1 || { echo "Install xcodegen: brew install xcodegen"; exit 1; }
xcodegen generate

echo "→ Archiving…"
xcodebuild -project ChartQuestQA.xcodeproj -scheme ChartQuestQA -configuration Release \
  ${TEAM_ID:+DEVELOPMENT_TEAM="$TEAM_ID"} \
  -archivePath build/ChartQuestQA.xcarchive archive

echo "→ Exporting Developer ID app…"
xcodebuild -exportArchive -archivePath build/ChartQuestQA.xcarchive \
  -exportOptionsPlist ExportOptions.plist -exportPath build/export

APP="build/export/ChartQuestQA.app"
[ -d "$APP" ] || { echo "✗ Export produced no app"; exit 1; }

echo "→ Zipping for the notary service…"
ditto -c -k --keepParent "$APP" build/ChartQuestQA.zip

echo "→ Submitting to Apple (this can take a few minutes)…"
xcrun notarytool submit build/ChartQuestQA.zip --keychain-profile "$NOTARY_PROFILE" --wait

echo "→ Stapling the ticket…"
xcrun stapler staple "$APP"

echo "✓ Notarized: $APP"
echo "  Next: ./scripts/make-dmg.sh \"$APP\""
