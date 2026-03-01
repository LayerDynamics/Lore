#!/usr/bin/env python3
"""PostToolUse hook — alerts when error rate exceeds threshold in session."""
import sys
import json
import os
from datetime import datetime

def main():
    try:
        data = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, ValueError):
        return

    tool_result = str(data.get('tool_result', ''))
    has_error = any(kw in tool_result.lower() for kw in ['error:', 'failed:', 'exception:', 'traceback'])

    if not has_error:
        return

    session_id = os.environ.get('CLAUDE_SESSION_ID', 'unknown')
    telemetry_dir = os.path.expanduser('~/.claude/telemetry')

    # Count errors in today's log
    today = datetime.utcnow().strftime('%Y-%m-%d')
    log_file = os.path.join(telemetry_dir, f'{today}.jsonl')

    if not os.path.exists(log_file):
        return

    error_count = 0
    total_count = 0

    with open(log_file) as f:
        for line in f:
            try:
                entry = json.loads(line)
                if entry.get('session_id') == session_id:
                    total_count += 1
                    if entry.get('status') == 'error':
                        error_count += 1
            except (json.JSONDecodeError, ValueError):
                continue

    threshold = int(os.environ.get('LORE_ERROR_THRESHOLD', '10'))

    if error_count >= threshold:
        print(f'ALERT: {error_count} errors in this session (threshold: {threshold}). Consider investigating.')

if __name__ == '__main__':
    main()
