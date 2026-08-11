#!/bin/sh
set -eu

# One-time, project-local bootstrap for a fresh or moved ChartQuest checkout.
# This changes only this repository's local Git configuration. It does not use
# the network, access credentials, push, merge, or deploy.

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "ChartQuest setup failed: run this script inside the repository." >&2
  exit 1
}
common_dir="$(git -C "$repo_root" rev-parse --path-format=absolute --git-common-dir)"
primary_root="$(dirname "$common_dir")"
if [ "$repo_root" != "$primary_root" ]; then
  echo "ChartQuest setup failed: run this once from the primary checkout, not a linked worktree." >&2
  echo "  primary checkout: $primary_root" >&2
  exit 1
fi

hook_dir="$repo_root/.githooks"
hook_file="$hook_dir/pre-push"
control_file="$repo_root/scripts/release_control.js"

if [ ! -x "$hook_file" ]; then
  echo "ChartQuest setup failed: $hook_file is missing or not executable." >&2
  exit 1
fi
if [ ! -f "$control_file" ]; then
  echo "ChartQuest setup failed: $control_file is missing." >&2
  exit 1
fi

sh -n "$hook_file"
node --check "$control_file"

git -C "$repo_root" config --local core.hooksPath "$hook_dir"
configured="$(git -C "$repo_root" config --local --get core.hooksPath)"
if [ "$configured" != "$hook_dir" ]; then
  echo "ChartQuest setup failed: the project-local hook path was not saved." >&2
  exit 1
fi

echo "ChartQuest command-center hooks are active for this repository."
echo "  core.hooksPath = $configured"
echo "  production deployment remains separately protected and unauthorized."
