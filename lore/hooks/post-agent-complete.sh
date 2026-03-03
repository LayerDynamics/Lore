#!/usr/bin/env bash
# post-agent-complete.sh — PostToolUse hook for Task tool
# Tracks agent completion with span correlation, duration, and telemetry
set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")

if [ "$TOOL_NAME" != "Task" ]; then
  exit 0
fi

echo "$INPUT" | python3 -c "
import sys, json, os, time, shutil, fcntl
from datetime import datetime, timezone

data = json.load(sys.stdin)
tool_input = data.get('tool_input', {})
tool_result = str(data.get('tool_result', ''))

agent_type = tool_input.get('subagent_type', tool_input.get('description', 'unknown'))
session_id = os.environ.get('CLAUDE_SESSION_ID', 'unknown')
now = datetime.now(timezone.utc)
timestamp = now.strftime('%Y-%m-%dT%H:%M:%SZ')

# Detect errors in result
has_error = any(kw in tool_result.lower() for kw in ['error', 'failed', 'exception', 'traceback'])
status = 'error' if has_error else 'ok'

# Find matching span state file for correlation
span_id = None
dispatch_ts = None
duration_ms = None
dispatch_id = None
span_dir = '/tmp/lore-agent-spans'

if os.path.isdir(span_dir):
    wip_file = f'/tmp/lore-wip-{session_id}'
    matched_dispatch_id = None
    if os.path.exists(wip_file):
        with open(wip_file, 'r') as f:
            for line in f:
                parts = line.strip().split('|')
                if len(parts) >= 3 and agent_type in parts[2]:
                    matched_dispatch_id = parts[0]
                    break

    if matched_dispatch_id:
        span_file = os.path.join(span_dir, matched_dispatch_id)
        if os.path.exists(span_file):
            dispatch_id = matched_dispatch_id
            with open(span_file, 'r') as f:
                for line in f:
                    if line.startswith('SPAN_ID='):
                        span_id = line.strip().split('=', 1)[1]
                    elif line.startswith('DISPATCH_TS='):
                        dispatch_ts = line.strip().split('=', 1)[1]
            # Compute duration
            if dispatch_ts:
                try:
                    dt = datetime.strptime(dispatch_ts, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
                    duration_ms = int((now - dt).total_seconds() * 1000)
                except Exception:
                    pass
            # Clean up span file
            try:
                os.remove(span_file)
            except OSError:
                pass

# Log agent completion to agent-logs
log_dir = os.path.expanduser('~/.claude/agent-logs')
os.makedirs(log_dir, exist_ok=True)

entry = {
    'ts': timestamp,
    'session_id': session_id,
    'agent': agent_type,
    'status': status,
    'result_length': len(tool_result),
    'span_id': span_id,
    'duration_ms': duration_ms,
}

log_file = os.path.join(log_dir, f'{now.strftime(\"%Y-%m-%d\")}.jsonl')
with open(log_file, 'a') as f:
    f.write(json.dumps(entry) + '\n')

# Emit AgentComplete telemetry event
telem_dir = os.path.expanduser('~/.claude/telemetry')
os.makedirs(telem_dir, exist_ok=True)
telem_event = {
    'ts': timestamp,
    'session_id': session_id,
    'event': 'AgentComplete',
    'agent_name': agent_type,
    'span_id': span_id,
    'tool': 'Task',
    'status': status,
    'duration_ms': duration_ms,
    'meta': {
        'dispatch_id': dispatch_id,
        'result_length': len(tool_result),
    }
}

telem_file = os.path.join(telem_dir, f'{now.strftime(\"%Y-%m-%d\")}.jsonl')
with open(telem_file, 'a') as f:
    fcntl.flock(f, fcntl.LOCK_EX)
    f.write(json.dumps(telem_event) + '\n')
    fcntl.flock(f, fcntl.LOCK_UN)

# Clean up WIP tracking
wip_file = f'/tmp/lore-wip-{session_id}'
lock_dir = f'{wip_file}.lock'
if os.path.exists(wip_file):
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
        remaining = []
        removed = False
        for line in lines:
            if not removed and agent_type in line:
                removed = True
                continue
            remaining.append(line)
        if not removed and remaining:
            remaining = remaining[1:]
        with open(wip_file, 'w') as f:
            f.writelines(remaining)
    finally:
        shutil.rmtree(lock_dir, ignore_errors=True)

dur_str = f' {duration_ms}ms' if duration_ms else ''
print(f'Agent completed: {agent_type} [{status}]{dur_str} span={span_id or \"?\"}')
" 2>/dev/null || true

exit 0
