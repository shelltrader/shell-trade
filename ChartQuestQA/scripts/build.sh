#!/usr/bin/env bash
# Builds ChartQuest QA into ./ChartQuestQA.app (ad-hoc signed, runs locally).
set -euo pipefail
cd "$(dirname "$0")/.."

# Make Homebrew tools findable even from a non-login shell (Apple Silicon + Intel).
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

CONFIG="${CONFIG:-Release}"

# Auto-install xcodegen if missing.
if ! command -v xcodegen >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "→ Installing xcodegen (one-time)…"
    brew install xcodegen
  else
    echo "✗ Need xcodegen, and Homebrew was not found on PATH."
    exit 1
  fi
fi

echo "→ Generating Xcode project from project.yml…"
xcodegen generate

# ---- Stable local code signing (no Apple account / no password needed) ----
# macOS ties every permission (Screen Recording, Files & Folders, Microphone)
# to the app's signature. Ad-hoc signing changes every build, so the OS forgets
# the grants. We sign every build with the SAME self-signed certificate (by its
# hash, so it needs no trust/password) — the signature, and therefore the
# granted permissions, stay stable across rebuilds.
IDENTITY="ChartQuestQA Local Signing"
LOGIN_KC="$HOME/Library/Keychains/login.keychain-db"
cert_hash() { security find-certificate -Z -c "$IDENTITY" "$LOGIN_KC" 2>/dev/null | awk '/SHA-1 hash:/{print $NF; exit}'; }
CERT_HASH="$(cert_hash || true)"
if [ -z "$CERT_HASH" ]; then
  echo "→ Creating a one-time stable signing certificate…"
  TMP="$(mktemp -d)"
  cat > "$TMP/cq.cnf" <<EOF
[req]
distinguished_name=dn
x509_extensions=v3
prompt=no
[dn]
CN=$IDENTITY
[v3]
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature
extendedKeyUsage=critical,codeSigning
EOF
  openssl req -x509 -newkey rsa:2048 -nodes -days 3650 -keyout "$TMP/cq.key" -out "$TMP/cq.crt" -config "$TMP/cq.cnf" >/dev/null 2>&1 || true
  openssl pkcs12 -export -inkey "$TMP/cq.key" -in "$TMP/cq.crt" -out "$TMP/cq.p12" -name "$IDENTITY" -passout pass:cq >/dev/null 2>&1 || true
  security import "$TMP/cq.p12" -k "$LOGIN_KC" -P cq -A >/dev/null 2>&1 || true
  rm -rf "$TMP"
  CERT_HASH="$(cert_hash || true)"
fi
[ -n "$CERT_HASH" ] && echo "→ Stable signing cert: $CERT_HASH" || echo "→ No stable cert; app will be ad-hoc signed."

echo "→ Building ($CONFIG)…"
xcodebuild \
  -project ChartQuestQA.xcodeproj \
  -scheme ChartQuestQA \
  -configuration "$CONFIG" \
  -derivedDataPath build \
  CODE_SIGN_STYLE=Manual \
  CODE_SIGN_IDENTITY="-" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=YES \
  DEVELOPMENT_TEAM="" \
  PROVISIONING_PROFILE_SPECIFIER="" \
  build

APP_SRC="build/Build/Products/$CONFIG/ChartQuestQA.app"
[ -d "$APP_SRC" ] || { echo "✗ Build produced no app at $APP_SRC"; exit 1; }

echo "→ Installing to project folder…"
rm -rf "ChartQuestQA.app"
ditto "$APP_SRC" "ChartQuestQA.app"

# Re-sign the final bundle with the stable identity (by hash → no trust needed)
# so the granted macOS permissions survive every future rebuild.
if [ -n "${CERT_HASH:-}" ]; then
  echo "→ Re-signing with stable identity…"
  if codesign --force --options runtime \
       --entitlements "Sources/App/ChartQuestQA.entitlements" \
       -s "$CERT_HASH" "ChartQuestQA.app"; then
    echo "→ Signature authority:"
    codesign -dvv "ChartQuestQA.app" 2>&1 | grep -iE "authority=|identifier=" | head -3 || true
  else
    echo "→ Stable re-sign failed; app remains ad-hoc."
  fi
fi
xattr -dr com.apple.quarantine "ChartQuestQA.app" 2>/dev/null || true

echo "✓ Built: $(pwd)/ChartQuestQA.app"
