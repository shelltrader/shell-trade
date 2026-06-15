#!/bin/bash
cd "$(dirname "$0")"

echo "=== Git Status ==="
git status

echo ""
echo "=== Last 5 Commits ==="
git log --oneline -5

echo ""
echo "=== Diff vs GitHub (origin/main) ==="
git fetch origin 2>&1
git diff origin/main -- index.html | head -30

echo ""
echo "=== Pushing ==="
git push origin main

echo ""
read -p "Press Enter to close..."
