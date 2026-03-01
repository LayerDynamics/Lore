#!/usr/bin/env bash
# post-agent-complete.sh — PostToolUse hook for Task tool
# Tracks agent success/failure rates, logs duration, cleans up WIP tracking
set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")

if [ "$TOOL_NAME" != "Task" ]; then
  exit 0
fi

echo "$INPUT" | python3 -c "
import sys, json, os
from datetime import datetime

data = json.load(sys.stdin)
tool_input = data.get('tool_input', {})
tool_result = str(data.get('tool_result', ''))

agent_type = tool_input.get('subagent_type', tool_input.get('description', 'unknown'))
session_id = os.environ.get('CLAUDE_SESSION_ID', 'unknown')
timestamp = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')

# Detect errors in result
has_error = any(kw in tool_result.lower() for kw in ['error', 'failed', 'exception', 'traceback'])
status = 'error' if has_error else 'ok'

# Log agent completion
log_dir = os.path.expanduser('~/.claude/agent-logs')
os.makedirs(log_dir, exist_ok=True)

entry = {
    'ts': timestamp,
    'session_id': session_id,
    'agent': agent_type,
    'status': status,
    'result_length': len(tool_result),
}

log_file = os.path.join(log_dir, f'{datetime.utcnow().strftime(\"%Y-%m-%d\")}.jsonl')
with open(log_file, 'a') as f:
    f.write(json.dumps(entry) + '\n')

# Clean up WIP tracking with mkdir lock + agent-type-correlated removal
wip_file = f'/tmp/lore-wip-{session_id}'
lock_dir = f'{wip_file}.lock'
if os.path.exists(wip_file):
    import time, shutil
    # Acquire mkdir-based lock
    for attempt in range(50):
        try:
            os.mkdir(lock_dir)
            break
        except FileExistsError:
            if attempt == 49:
                shutil.rmtree(lock_dir, ignore_errors=True)
                os.mkdir(lock_dir)
            else:
                time.sleep(0.05)
    try:
        with open(wip_file, 'r') as f:
            lines = f.readlines()
        # Remove first entry matching this agent type
        remaining = []
        removed = False
        for line in lines:
            if not removed and agent_type in line:
                removed = True
                continue
            remaining.append(line)
        # If no match found, remove oldest as fallback
        if not removed and remaining:
            remaining = remaining[1:]
        with open(wip_file, 'w') as f:
            f.writelines(remaining)
    finally:
        shutil.rmtree(lock_dir, ignore_errors=True)

print(f'Agent completed: {agent_type} [{status}]')
" 2>/dev/null || true

exit 0
