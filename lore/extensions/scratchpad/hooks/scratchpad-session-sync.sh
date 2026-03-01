#!/usr/bin/env bash
# scratchpad-session-sync.sh — SessionStart hook
# Loads last session's scratchpad state if available
set -euo pipefail

SCRATCH_STATE="$HOME/.claude/scratchpad-state.json"

if [ -f "$SCRATCH_STATE" ]; then
  echo "Scratchpad: Previous session state available"
fi

exit 0
