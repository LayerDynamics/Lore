#!/usr/bin/env bash
# gateway-session-start.sh — SessionStart hook
# Notifies the trigger gateway of session start
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json, os
from datetime import datetime

data = json.loads(sys.stdin.read()) if sys.stdin.readable() else {}
session_id = os.environ.get('CLAUDE_SESSION_ID', 'unknown')
cwd = data.get('cwd', os.getcwd())

relay_dir = os.path.expanduser('~/.claude/gateway-events')
os.makedirs(relay_dir, exist_ok=True)

event = {
    'ts': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
    'type': 'SessionStart',
    'session_id': session_id,
    'cwd': cwd,
}

event_file = os.path.join(relay_dir, f'{datetime.utcnow().strftime(\"%Y-%m-%d\")}.jsonl')
with open(event_file, 'a') as f:
    f.write(json.dumps(event) + '\n')
" <<< "$INPUT" 2>/dev/null || true

exit 0
