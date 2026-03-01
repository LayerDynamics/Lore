#!/usr/bin/env bash
# plan-task-complete.sh — PostToolUse hook for TaskUpdate
# Tracks plan progress when tasks are completed
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json, os
from datetime import datetime

data = json.loads(sys.stdin.read())
tool_name = data.get('tool_name', '')

if tool_name != 'TaskUpdate':
    sys.exit(0)

ti = data.get('tool_input', {})
status = ti.get('status', '')
task_id = ti.get('taskId', '')

if status != 'completed':
    sys.exit(0)

session_id = os.environ.get('CLAUDE_SESSION_ID', 'unknown')

log_dir = os.path.expanduser('~/.claude/plan-progress')
os.makedirs(log_dir, exist_ok=True)

entry = {
    'ts': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
    'session_id': session_id,
    'task_id': task_id,
    'event': 'task-completed',
}

log_file = os.path.join(log_dir, f'{datetime.utcnow().strftime(\"%Y-%m-%d\")}.jsonl')
with open(log_file, 'a') as f:
    f.write(json.dumps(entry) + '\n')

print(f'Plan progress: task {task_id} completed')
" <<< "$INPUT" 2>/dev/null || true

exit 0
