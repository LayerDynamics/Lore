#!/usr/bin/env bash
# session-summary.sh — Stop hook
# Generates session summary and parses JSON stdin properly
set -euo pipefail

INPUT=$(cat)

# Parse JSON properly (fixing the raw-text issue in verify-completion.sh)
echo "$INPUT" | python3 -c "
import sys, json, os
from datetime import datetime

try:
    raw = sys.stdin.read().strip()
    data = json.loads(raw) if raw else {}
except:
    data = {}

stop_reason = data.get('stop_reason', data.get('reason', 'unknown'))
session_id = os.environ.get('CLAUDE_SESSION_ID', 'unknown')
timestamp = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')

summary_dir = os.path.expanduser('~/.claude/session-summaries')
os.makedirs(summary_dir, exist_ok=True)

summary = {
    'session_id': session_id,
    'ended_at': timestamp,
    'stop_reason': stop_reason,
}

summary_file = os.path.join(summary_dir, f'{datetime.utcnow().strftime(\"%Y-%m-%d\")}.jsonl')
with open(summary_file, 'a') as f:
    f.write(json.dumps(summary) + '\n')

print(f'Session summary saved to {summary_file}')
" 2>/dev/null || true

exit 0
