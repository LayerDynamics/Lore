#!/usr/bin/env bash
# gateway-event-relay.sh — PostToolUse hook
# Relays tool completion events to registered endpoints via the trigger gateway
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json, os
from datetime import datetime

data = json.loads(sys.stdin.read())
tool_name = data.get('tool_name', '')
tool_input = data.get('tool_input', {})
tool_result = str(data.get('tool_result', ''))[:500]
session_id = os.environ.get('CLAUDE_SESSION_ID', 'unknown')

# Write event to relay queue for the gateway to process
relay_dir = os.path.expanduser('~/.claude/gateway-events')
os.makedirs(relay_dir, exist_ok=True)

event = {
    'ts': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
    'type': 'PostToolUse',
    'session_id': session_id,
    'tool_name': tool_name,
    'tool_input_keys': list(tool_input.keys()) if isinstance(tool_input, dict) else [],
    'result_length': len(tool_result),
    'has_error': any(kw in tool_result.lower() for kw in ['error', 'failed', 'exception']),
}

event_file = os.path.join(relay_dir, f'{datetime.utcnow().strftime(\"%Y-%m-%d\")}.jsonl')
with open(event_file, 'a') as f:
    f.write(json.dumps(event) + '\n')
" <<< "$INPUT" 2>/dev/null || true

exit 0
