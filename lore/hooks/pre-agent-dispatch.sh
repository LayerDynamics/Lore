#!/usr/bin/env bash
# pre-agent-dispatch.sh — PreToolUse hook for Task tool
# Logs agent dispatches and enforces WIP limits
set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")

if [ "$TOOL_NAME" != "Task" ]; then
  exit 0
fi

# Extract agent/subagent info from tool_input
AGENT_TYPE=$(echo "$INPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
ti = data.get('tool_input', {})
print(ti.get('subagent_type', ti.get('description', 'unknown')))
" 2>/dev/null || echo "unknown")

SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# WIP limit tracking via temp file with mkdir lock for atomicity
WIP_FILE="/tmp/lore-wip-${SESSION_ID}"
LOCK_DIR="${WIP_FILE}.lock"
MAX_WIP=${LORE_MAX_AGENTS:-5}

# Generate unique dispatch ID for correlated cleanup
DISPATCH_ID="$$-$(date +%s%N 2>/dev/null || date +%s)-${RANDOM}"

# Acquire lock (mkdir is atomic on POSIX)
LOCK_ATTEMPTS=0
while ! mkdir "$LOCK_DIR" 2>/dev/null; do
  LOCK_ATTEMPTS=$((LOCK_ATTEMPTS + 1))
  if [ "$LOCK_ATTEMPTS" -ge 50 ]; then
    # Stale lock — remove and retry once
    rm -rf "$LOCK_DIR"
    mkdir "$LOCK_DIR" 2>/dev/null || true
    break
  fi
  sleep 0.05
done
trap 'rm -rf "$LOCK_DIR"' EXIT

touch "$WIP_FILE"
ACTIVE_COUNT=$(wc -l < "$WIP_FILE" | tr -d ' ')

if [ "$ACTIVE_COUNT" -ge "$MAX_WIP" ]; then
  echo "WIP limit reached: $ACTIVE_COUNT/$MAX_WIP active agents. Wait for agents to complete before dispatching more." >&2
  exit 2
fi

# Record this dispatch with unique ID for correlated cleanup
echo "${DISPATCH_ID}|${TIMESTAMP}|${AGENT_TYPE}" >> "$WIP_FILE"

echo "Agent dispatch: ${AGENT_TYPE} id=${DISPATCH_ID} (active: $((ACTIVE_COUNT + 1))/${MAX_WIP})"
exit 0
