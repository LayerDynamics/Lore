#!/usr/bin/env bash
# agent-concurrency-guard.sh — PreToolUse hook for Task tool
# Enforces max parallel agents (WIP limit)
# Note: This is a more strict version integrated with pre-agent-dispatch
set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")

if [ "$TOOL_NAME" != "Task" ]; then
  exit 0
fi

SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"
WIP_FILE="/tmp/lore-wip-${SESSION_ID}"

if [ ! -f "$WIP_FILE" ]; then
  exit 0
fi

LOCK_DIR="${WIP_FILE}.lock"
MAX_WIP=${LORE_MAX_AGENTS:-5}

# Read under mkdir lock for consistent snapshot
LOCK_ATTEMPTS=0
while ! mkdir "$LOCK_DIR" 2>/dev/null; do
  LOCK_ATTEMPTS=$((LOCK_ATTEMPTS + 1))
  if [ "$LOCK_ATTEMPTS" -ge 50 ]; then
    rm -rf "$LOCK_DIR"
    mkdir "$LOCK_DIR" 2>/dev/null || true
    break
  fi
  sleep 0.05
done
trap 'rm -rf "$LOCK_DIR"' EXIT

ACTIVE=$(wc -l < "$WIP_FILE" | tr -d ' ')

if [ "$ACTIVE" -ge "$MAX_WIP" ]; then
  echo "Concurrency guard: ${ACTIVE}/${MAX_WIP} agents active. Consider waiting for completions." >&2
  exit 2
fi

exit 0
