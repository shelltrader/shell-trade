#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Direct Netlify deploy — bypasses build minutes entirely.
# Uses the Netlify Files API (zip upload), not the build system.
#
# HOW TO USE:
#  1. Go to: https://app.netlify.com/user/applications
#  2. Click "New access token", give it any name, copy the token
#  3. Paste it below (replace YOUR_TOKEN_HERE)
#  4. Double-click this file to run it
# ─────────────────────────────────────────────────────────────

NETLIFY_TOKEN="nfp_nEsS94sygP7oiEa9UCEx4yaXGG6cza9V470f"
SITE_ID="5130714b-3220-4f17-98b8-9a2bc612f518"
ZIP_FILE="$(dirname "$0")/deploy.zip"

if [ "$NETLIFY_TOKEN" = "YOUR_TOKEN_HERE" ]; then
  echo "❌ You need to set your Netlify personal access token in this file first."
  echo "   Get one at: https://app.netlify.com/user/applications"
  read -p "Press Enter to open that page..." _
  open "https://app.netlify.com/user/applications"
  exit 1
fi

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
  DEPLOY_URL=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('deploy_ssl_url','https://chart-quest-game.netlify.app'))" 2>/dev/null || echo "https://chart-quest-game.netlify.app")
  echo "✅ Deploy successful!"
  echo "   Live at: $DEPLOY_URL"
  open "$DEPLOY_URL"
else
  echo "❌ Deploy failed (HTTP $HTTP_CODE)"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
fi

read -p "Press Enter to close..." _
