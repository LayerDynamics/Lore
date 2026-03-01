#!/usr/bin/env bash
# trello-session-log.sh — Stop hook
# Posts session summary as Trello comment on active card
set -euo pipefail

INPUT=$(cat)

SYNC_DIR="$HOME/.claude/trello-sync"
PENDING="${SYNC_DIR}/pending-sync.jsonl"

if [ ! -f "$PENDING" ]; then
  exit 0
fi

COMPLETED=$(wc -l < "$PENDING" | tr -d ' ')
if [ "$COMPLETED" -gt 0 ]; then
  echo "Session completed ${COMPLETED} tasks queued for Trello sync"
fi

exit 0
