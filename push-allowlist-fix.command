#!/bin/bash
cd "$(dirname "$0")"
git add index.html chart-quest.html
git commit -m "Fix: add shelltrader.github.io to domain allowlist" || echo "Nothing to commit."
git push origin main
echo ""
echo "Done! GitHub Pages will update in ~60 seconds."
echo "Test at: https://shelltrader.github.io/shell-trade/"
read -p "Press Enter to close..."
