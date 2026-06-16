#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "=== Deploying Chart Quest fixes ==="
echo ""

echo "[1/4] Clearing any stale git lock..."
rm -f .git/index.lock

echo "[2/4] Staging changes..."
git add -A

echo "[3/4] Committing..."
git commit -m "Fix wrong coin logos (vector icons) + fix render-loop crash (SANS2 undefined var was killing turtle/portal rendering)" || echo "  (nothing new to commit)"

echo "[4/4] Pushing to GitHub..."
git push origin HEAD:main

echo ""
echo "Done. GitHub Pages will update in ~60 seconds."
echo "Test at: https://shelltrader.github.io/shell-trade/"
echo ""
read -p "Press Enter to close..."
