#!/usr/bin/env bash
# pre-agent-dispatch.sh — PreToolUse hook for Task tool
# Logs agent dispatches with span tracking and telemetry
set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")

if [ "$TOOL_NAME" != "Task" ]; then
  exit 0
fi

# Extract agent/subagent info from tool_input
AGENT_INFO=$(echo "$INPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
ti = data.get('tool_input', {})
agent_type = ti.get('subagent_type', ti.get('description', 'unknown'))
description = ti.get('description', '')[:200]
print(agent_type)
print(description)
" 2>/dev/null || echo "unknown")

AGENT_TYPE=$(echo "$AGENT_INFO" | head -1)
DESCRIPTION=$(echo "$AGENT_INFO" | tail -1)

SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# WIP tracking via temp file with mkdir lock for atomicity
WIP_FILE="/tmp/lore-wip-${SESSION_ID}"
LOCK_DIR="${WIP_FILE}.lock"

# Generate unique dispatch ID for correlated cleanup
DISPATCH_ID="$$-$(date +%s%N 2>/dev/null || date +%s)-${RANDOM}"

# Generate span ID for telemetry correlation
SPAN_ID=$(python3 -c "import hashlib; print(hashlib.sha256('${DISPATCH_ID}-${TIMESTAMP}'.encode()).hexdigest()[:8])" 2>/dev/null || echo "${RANDOM}")

# Acquire lock (mkdir is atomic on POSIX)
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

touch "$WIP_FILE"
ACTIVE_COUNT=$(wc -l < "$WIP_FILE" | tr -d ' ')

# Record this dispatch with unique ID for correlated cleanup
echo "${DISPATCH_ID}|${TIMESTAMP}|${AGENT_TYPE}" >> "$WIP_FILE"

# Write dispatch state for post-hook correlation
SPAN_DIR="/tmp/lore-agent-spans"
mkdir -p "$SPAN_DIR"
cat > "${SPAN_DIR}/${DISPATCH_ID}" <<SPAN_EOF
SPAN_ID=${SPAN_ID}
DISPATCH_TS=${TIMESTAMP}
AGENT_TYPE=${AGENT_TYPE}
SPAN_EOF

# Emit AgentDispatch telemetry event
TELEM_DIR="${HOME}/.claude/telemetry"
mkdir -p "$TELEM_DIR"

python3 -c "
import json, os, fcntl
from datetime import datetime, timezone

event = {
    'ts': '${TIMESTAMP}',
    'session_id': os.environ.get('CLAUDE_SESSION_ID'),
    'event': 'AgentDispatch',
    'agent_name': '''${AGENT_TYPE}''',
    'span_id': '${SPAN_ID}',
    'tool': 'Task',
    'status': 'ok',
    'meta': {
        'dispatch_id': '${DISPATCH_ID}',
        'description': '''${DESCRIPTION}'''[:200],
        'active_count': $((ACTIVE_COUNT + 1)),
    }
}

telem_file = '${TELEM_DIR}/' + datetime.now(timezone.utc).strftime('%Y-%m-%d') + '.jsonl'
with open(telem_file, 'a') as f:
    fcntl.flock(f, fcntl.LOCK_EX)
    f.write(json.dumps(event) + '\n')
    fcntl.flock(f, fcntl.LOCK_UN)
" 2>/dev/null || true

echo "Agent dispatch: ${AGENT_TYPE} span=${SPAN_ID} id=${DISPATCH_ID} (active: $((ACTIVE_COUNT + 1)))"
exit 0
