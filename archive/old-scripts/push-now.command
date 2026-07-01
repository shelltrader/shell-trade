#!/bin/bash
cd "$(dirname "$0")"

echo "=== Clearing stale git locks ==="
rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/*.lock .git/objects/maintenance.lock

echo "=== Committing + pushing latest fix ==="
git add -A
git commit -m "Fix visit-counter RPC call (thenable .catch() doesn't exist on supabase-js builder, was silently swallowed)" || echo "(nothing new to commit)"

echo "=== Pushing to GitHub ==="
git push origin HEAD:main

echo ""
echo "Done. GitHub Pages will update in ~60 seconds."
echo "Live at: https://shelltrader.github.io/shell-trade/"
echo ""
read -p "Press Enter to close..."
