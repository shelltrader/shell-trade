#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "=== Cleaning up node_modules from the git repo ==="
echo ""

echo "[1/5] Writing .gitignore..."
cat > .gitignore << 'EOF'
node_modules/
*.log
.DS_Store
EOF

echo "[2/5] Removing node_modules from git tracking (keeping the files on disk)..."
git rm -r --cached node_modules > /dev/null 2>&1 || echo "  (already untracked)"

echo "[3/5] Staging changes..."
git add -A

echo "[4/5] Committing..."
git commit -m "Remove node_modules from repo, add .gitignore" || echo "  (nothing new to commit)"

echo "[5/5] Pushing to GitHub..."
git push origin HEAD:main

echo ""
echo "✅ Done! node_modules is now ignored and removed from the repo history's latest commit."
echo "   Test at: https://shelltrader.github.io/shell-trade/"
echo ""
read -p "Press Enter to close..."
