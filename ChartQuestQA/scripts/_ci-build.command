#!/usr/bin/env bash
# Non-interactive build runner: writes full output to ../build.log and exits
# (no "press any key" pause). Used for automated build-and-read iteration.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "$(dirname "$0")/.."
echo "ChartQuest QA build — $(date)" > build.log
{ bash scripts/build.sh; echo "___BUILD_EXIT___=$?"; } >> build.log 2>&1
tail -n 3 build.log
echo "(full log written to build.log)"
sleep 1
