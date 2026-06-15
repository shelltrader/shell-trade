#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "=== Setting up git and pushing fixes to GitHub ==="
echo ""

# Initialize git if needed
if [ ! -d ".git" ]; then
  echo "[1/6] Initialising git repo..."
  git init
else
  echo "[1/6] Git already initialised."
fi

# Add remote
echo "[2/6] Setting remote origin..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/shelltrader/shell-trade.git

# Fetch so we have the remote history
echo "[3/6] Fetching from GitHub..."
git fetch origin

# Soft-reset to remote HEAD — keeps our local files as-is, builds on top of remote history
echo "[4/6] Aligning with remote history (keeping local file changes)..."
git reset --soft FETCH_HEAD

# Stage and commit
echo "[5/6] Committing local fixes..."
git add -A
git commit -m "Fix: shelltrader.github.io allowlist + irr→rr HUD fix" || echo "  (nothing new to commit — already up to date)"

# Push
echo "[6/6] Pushing to GitHub..."
git push origin HEAD:main

echo ""
echo "✅ Done! GitHub Pages will update in ~60 seconds."
echo "   Test at: https://shelltrader.github.io/shell-trade/"
echo ""
read -p "Press Enter to close..."
