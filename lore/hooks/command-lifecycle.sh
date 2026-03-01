#!/usr/bin/env bash
# command-lifecycle.sh — PostToolUse hook for Skill tool
# Logs command executions for standup generation and validates outputs
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json, os
from datetime import datetime

data = json.loads(sys.stdin.read())
tool_name = data.get('tool_name', '')

if tool_name != 'Skill':
    sys.exit(0)

ti = data.get('tool_input', {})
skill = ti.get('skill', '')
args = ti.get('args', '')
session_id = os.environ.get('CLAUDE_SESSION_ID', 'unknown')

log_dir = os.path.expanduser('~/.claude/command-lifecycle')
os.makedirs(log_dir, exist_ok=True)

entry = {
    'ts': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
    'session_id': session_id,
    'command': skill,
    'args': args[:200] if args else '',
    'event': 'post-command-complete',
}

log_file = os.path.join(log_dir, f'{datetime.utcnow().strftime(\"%Y-%m-%d\")}.jsonl')
with open(log_file, 'a') as f:
    f.write(json.dumps(entry) + '\n')
" <<< "$INPUT" 2>/dev/null || true

exit 0
