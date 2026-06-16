#!/bin/bash
cd "$(dirname "$0")"

echo "=== Checking for Node.js ==="
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js is not installed."
  echo "   Install it from https://nodejs.org (LTS version), then re-run this script."
  open "https://nodejs.org"
  read -p "Press Enter to close..."
  exit 1
fi

echo "✓ Node found: $(node --version)"
echo ""

echo "=== Installing javascript-obfuscator (one-time) ==="
npm install javascript-obfuscator --no-save

echo ""
echo "=== Running build.js ==="
node build.js

echo ""
read -p "Press Enter to close..."
