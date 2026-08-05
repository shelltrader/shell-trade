#!/bin/bash
# ChartQuest — open a founder tool in the browser, starting the local server if needed.
#
# TEMPLATE. scripts/make_desktop_apps.py substitutes __CQ_ROOT__ / __CQ_PAGE__ / __CQ_TITLE__ and
# writes the result into each .app bundle. Safe to run directly after substitution.
#
# WHY THIS IS NOT JUST A .webloc / URL SHORTCUT
# Both dashboards load scripts and fetch data relative to their origin, which file:// blocks, so
# the page MUST come off an http server — and the server is usually not running. A plain shortcut
# would open a blank dashboard most of the time, which is worse than no icon at all.
#
# WHY IT TALKS IN DIALOGS
# It runs from an .app bundle, so there is no Terminal to print into. A silent failure would look
# exactly like "the dashboard is broken". Every exit path either opens the page or says why not.

set -uo pipefail

ROOT="__CQ_ROOT__"
PORT=8798
PAGE="__CQ_PAGE__"
TITLE="__CQ_TITLE__"
URL="http://localhost:${PORT}/${PAGE}"
# One shared server for every tool, so two icons never fight over the port.
LOG="${TMPDIR:-/tmp}/chartquest-desktop-server.log"

say() {  # a dialog, because there is no terminal
  /usr/bin/osascript -e "display dialog \"$1\" with title \"ChartQuest — ${TITLE}\" buttons {\"OK\"} default button 1 with icon ${2:-note}" >/dev/null 2>&1 || true
}

[ -d "$ROOT" ] || { say "The project folder has moved.\n\nExpected:\n$ROOT\n\nRe-run scripts/make_desktop_apps.py from the repo to rebuild these icons." stop; exit 1; }
cd "$ROOT" || exit 1

# An .app launches with a minimal PATH — the user's shell profile is never sourced — so python3
# cannot be assumed to be on it. Look in the usual places before giving up.
PY=""
for c in /opt/homebrew/bin/python3 /usr/local/bin/python3 /usr/bin/python3; do
  [ -x "$c" ] && { PY="$c"; break; }
done
[ -n "$PY" ] || PY="$(command -v python3 2>/dev/null || true)"
[ -n "$PY" ] || { say "Could not find python3 on this Mac, so the local server cannot start." stop; exit 1; }

listening() { /usr/sbin/lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; }

if ! listening; then
  # Detached and nohup'd: the server must outlive this launcher, or the page dies the moment the
  # icon's process exits.
  nohup "$PY" scripts/serve_nocache.py "$PORT" >"$LOG" 2>&1 &
  for _ in $(seq 1 40); do            # up to ~8s
    listening && break
    sleep 0.2
  done
  if ! listening; then
    say "The local server did not start on port $PORT.\n\nLast output:\n$(tail -n 6 "$LOG" 2>/dev/null)" stop
    exit 1
  fi
fi

# Refresh the snapshot only if a key is available. Without one this is a no-op by design: the
# dashboard renders the snapshot's age in its header, so stale data announces itself rather than
# silently pretending to be current. Never block opening the page on a network call.
if [ -n "${SUPABASE_SERVICE_KEY:-}" ] && [ "$PAGE" = "beta-qa.html" ]; then
  "$PY" scripts/beta_pull.py --days 0 >/dev/null 2>&1 || true
fi

/usr/bin/open "$URL" || { say "Could not open:\n$URL" stop; exit 1; }
