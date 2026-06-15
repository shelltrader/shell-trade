#!/bin/bash
# Chart Quest — push local changes to GitHub
set -e

cd "$(dirname "$0")"

echo "=== Chart Quest — GitHub Push ==="
echo ""

# Init git if not already a repo
if [ ! -d ".git" ]; then
  echo "[1/5] Initialising git repo..."
  git init
  git remote add origin https://github.com/shelltrader/chart-quest.git
else
  echo "[1/5] Git repo already initialised."
  # Make sure remote is set
  git remote get-url origin 2>/dev/null || git remote add origin https://github.com/shelltrader/chart-quest.git
fi

echo "[2/5] Staging all files..."
git add -A

echo "[3/5] Committing..."
git commit -m "Rename: Shell Trade → Chart Quest throughout all files" || echo "Nothing new to commit."

echo "[4/5] Pushing to GitHub (you may be prompted for your GitHub username + token)..."
git push -u origin main 2>/dev/null || git push -u origin master 2>/dev/null || {
  echo ""
  echo "Push failed. If prompted, enter:"
  echo "  Username: your GitHub username (shelltrader)"
  echo "  Password: your GitHub Personal Access Token (not your password)"
  git push -u origin HEAD
}

echo ""
echo "[5/5] ✓ Done! Netlify will auto-deploy in ~60 seconds."
echo "      Live URL: https://chart-quest-game.netlify.app"
echo ""
read -p "Press any key to close..."
