#!/usr/bin/env bash
# trello-card-context.sh — SessionStart hook
# Loads active Trello card context into the session
set -euo pipefail

INPUT=$(cat)

SYNC_DIR="$HOME/.claude/trello-sync"

if [ -f "${SYNC_DIR}/active-card.json" ]; then
  CARD=$(python3 -c "
import json
with open('${SYNC_DIR}/active-card.json') as f:
    card = json.load(f)
print(f\"Active Trello card: {card.get('name', 'unknown')} [{card.get('list', 'unknown')}]\")
" 2>/dev/null || echo "")
  if [ -n "$CARD" ]; then
    echo "$CARD"
  fi
fi

exit 0
