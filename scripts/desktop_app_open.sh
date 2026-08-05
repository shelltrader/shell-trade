#!/bin/bash
# ChartQuest — open the Beta Test QA dashboard.
#
# Invoked by the Desktop app bundle (scripts/make_beta_qa_app.py builds it), and safe to run
# directly:  scripts/beta_qa_open.sh
#
# WHY THIS IS NOT JUST A .webloc / URL SHORTCUT
# beta-qa.html loads its three engines with <script src> and fetches the snapshot, both of which
# file:// blocks — so the page MUST come off an http server. A plain shortcut would open a blank
# dashboard whenever the server happened not to be running, which is most of the time.
#
# WHY IT TALKS IN DIALOGS
# It runs from an .app bundle, so there is no Terminal to print into. A silent failure would look
# exactly like "the dashboard is broken". Every exit path either opens the page or says why not.

set -uo pipefail

ROOT="__CQ_ROOT__"
PORT=8798
URL="http://localhost:${PORT}/beta-qa.html"
LOG="${TMPDIR:-/tmp}/chartquest-beta-qa-server.log"

say() {  # a dialog, because there is no terminal
  /usr/bin/osascript -e "display dialog \"$1\" with title \"ChartQuest — Beta Test QA\" buttons {\"OK\"} default button 1 with icon ${2:-note}" >/dev/null 2>&1 || true
}

[ -d "$ROOT" ] || { say "The project folder has moved.\n\nExpected:\n$ROOT\n\nRe-run scripts/make_beta_qa_app.py from the repo to rebuild this icon." stop; exit 1; }
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
if [ -n "${SUPABASE_SERVICE_KEY:-}" ]; then
  "$PY" scripts/beta_pull.py --days 0 >/dev/null 2>&1 || true
fi

/usr/bin/open "$URL" || { say "Could not open:\n$URL" stop; exit 1; }
