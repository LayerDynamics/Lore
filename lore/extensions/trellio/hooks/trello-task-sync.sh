#!/usr/bin/env bash
# trello-task-sync.sh — PostToolUse hook for TaskUpdate
# Syncs task completion status to active Trello card
set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")

if [ "$TOOL_NAME" != "TaskUpdate" ]; then
  exit 0
fi

python3 -c "
import sys, json, os

data = json.loads(sys.stdin.read())
ti = data.get('tool_input', {})
status = ti.get('status', '')
task_id = ti.get('taskId', '')
subject = ti.get('subject', '')

if status != 'completed':
    sys.exit(0)

# Log task completion for Trello sync
# The actual Trello API call would go through the MCP tools
# This hook records completions for batch sync
sync_dir = os.path.expanduser('~/.claude/trello-sync')
os.makedirs(sync_dir, exist_ok=True)

from datetime import datetime
entry = {
    'ts': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
    'task_id': task_id,
    'subject': subject,
    'status': status,
    'session_id': os.environ.get('CLAUDE_SESSION_ID', 'unknown'),
}

sync_file = os.path.join(sync_dir, 'pending-sync.jsonl')
with open(sync_file, 'a') as f:
    f.write(json.dumps(entry) + '\n')

print(f'Task {task_id} completion queued for Trello sync')
" <<< "$INPUT" 2>/dev/null || true

exit 0
