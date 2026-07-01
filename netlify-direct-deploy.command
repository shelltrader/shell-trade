#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Direct Netlify deploy — bypasses build minutes entirely.
# Uses the Netlify Files API (zip upload), not the build system.
#
# HOW TO USE:
#  Your token lives in the .netlify-token file next to this script.
#  To replace it: paste a new token into that file. Then just
#  double-click this file to deploy.
# ─────────────────────────────────────────────────────────────

# Token is read from a sibling file (.netlify-token) so it never lives inside
# this script and can never be published with the site.
TOKEN_FILE="$(dirname "$0")/.netlify-token"
NETLIFY_TOKEN="$(cat "$TOKEN_FILE" 2>/dev/null | tr -d '[:space:]')"
SITE_ID="5130714b-3220-4f17-98b8-9a2bc612f518"
ZIP_FILE="$(dirname "$0")/deploy.zip"

if [ -z "$NETLIFY_TOKEN" ]; then
  echo "❌ No token found. Put your Netlify token in the .netlify-token file next to this script."
  echo "   Get one at: https://app.netlify.com/user/applications"
  read -p "Press Enter to open that page..." _
  open "https://app.netlify.com/user/applications"
  exit 1
fi

# Rebuild the deploy zip fresh from the folder so any boss art you dropped into
# /bosses/ is always included. Add new top-level files to the list if needed.
DIR="$(dirname "$0")"
cd "$DIR" || exit 1
echo "📦 Packing files (incl. /bosses/ art) ..."
rm -f "$ZIP_FILE"
FILES="index.html chart-quest.html dashboard.html sw.js manifest.json icon-192.png icon-512.png logo.png Market-maker-cinematic.mp4"
zip -q "$ZIP_FILE" $FILES
[ -d bosses ] && zip -qr "$ZIP_FILE" bosses -x "bosses/README.txt" "bosses/*.png" "bosses/.DS_Store"

echo "📦 Deploying $(basename "$ZIP_FILE") to chart-quest-game.netlify.app ..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $NETLIFY_TOKEN" \
  -H "Content-Type: application/zip" \
  --data-binary "@$ZIP_FILE" \
  "https://api.netlify.com/api/v1/sites/$SITE_ID/deploys")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  DEPLOY_URL=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('ssl_url','https://chart-quest-game.netlify.app'))" 2>/dev/null || echo "https://chart-quest-game.netlify.app")
  echo "✅ Deploy successful!"
  echo "   Live at: $DEPLOY_URL"
  open "$DEPLOY_URL"
else
  echo "❌ Deploy failed (HTTP $HTTP_CODE)"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
fi

read -p "Press Enter to close..." _
