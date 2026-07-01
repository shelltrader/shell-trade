#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  OPTIONAL — run this ONCE if you want macOS to STOP re-asking
#  for Screen Recording / Microphone permission after rebuilds.
#
#  It creates a stable local code-signing certificate and trusts
#  it. macOS will ask for YOUR Mac password one time (to trust
#  the certificate) — type it in the window that appears.
#
#  After it finishes: double-click "Launch ChartQuest QA.command"
#  to rebuild, then grant Screen Recording one last time. Done.
# ─────────────────────────────────────────────────────────────
set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "$(dirname "$0")"

IDENTITY="ChartQuestQA Local Signing"
LOGIN_KC="$HOME/Library/Keychains/login.keychain-db"

echo "════════════════════════════════════════════════"
echo "   Make ChartQuest QA's signature permanent"
echo "════════════════════════════════════════════════"
echo

# Clean up any leftover (untrusted, duplicate) copies first.
echo "• Cleaning up old copies…"
for _ in 1 2 3 4 5 6 7 8 9 10; do
  security find-certificate -c "$IDENTITY" "$LOGIN_KC" >/dev/null 2>&1 || break
  security delete-certificate -c "$IDENTITY" "$LOGIN_KC" >/dev/null 2>&1 || break
done

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

echo "• Creating a fresh certificate…"
openssl req -x509 -newkey rsa:2048 -nodes -days 3650 \
  -keyout "$TMP/cq.key" -out "$TMP/cq.crt" -config "$TMP/cq.cnf" >/dev/null 2>&1
openssl pkcs12 -export -inkey "$TMP/cq.key" -in "$TMP/cq.crt" \
  -out "$TMP/cq.p12" -name "$IDENTITY" -passout pass:cq >/dev/null 2>&1

echo "• Importing into your login keychain…"
security import "$TMP/cq.p12" -k "$LOGIN_KC" -P cq -A >/dev/null 2>&1

echo
echo "• Trusting it for code signing."
echo "  >>> macOS will now pop up and ask for YOUR Mac password. <<<"
echo
security add-trusted-cert -r trustRoot -p codeSign -k "$LOGIN_KC" "$TMP/cq.crt"

rm -rf "$TMP"

echo
if security find-identity -v -p codesigning 2>/dev/null | grep -q "$IDENTITY"; then
  echo "✓ Success — stable signing identity is ready."
  echo "  Next: double-click 'Launch ChartQuest QA.command' to rebuild with it,"
  echo "  then grant Screen Recording ONE more time. It will stick from now on."
else
  echo "✗ Couldn't create a trusted identity (no problem — the app still works ad-hoc)."
  echo "  In that case just avoid rebuilding and the permission you grant will stay."
fi
echo
read -n1 -r -p "Press any key to close…"
