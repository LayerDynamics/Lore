#!/usr/bin/env python3
"""PostToolUse hook — estimates and tracks session token/cost usage."""
import sys
import json
import os
from datetime import datetime

def main():
    try:
        data = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, ValueError):
        return

    tool_name = data.get('tool_name', '')
    tool_result = str(data.get('tool_result', ''))
    session_id = os.environ.get('CLAUDE_SESSION_ID', 'unknown')

    # Rough token estimation (4 chars ~ 1 token)
    result_tokens = len(tool_result) // 4

    cost_dir = os.path.expanduser('~/.claude/cost-tracking')
    os.makedirs(cost_dir, exist_ok=True)

    entry = {
        'ts': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
        'session_id': session_id,
        'tool': tool_name,
        'est_tokens': result_tokens,
    }

    cost_file = os.path.join(cost_dir, f'{datetime.utcnow().strftime("%Y-%m-%d")}.jsonl')
    with open(cost_file, 'a') as f:
        f.write(json.dumps(entry) + '\n')

    # Warn at thresholds
    total_tokens = 0
    with open(cost_file) as f:
        for line in f:
            try:
                e = json.loads(line)
                if e.get('session_id') == session_id:
                    total_tokens += e.get('est_tokens', 0)
            except (json.JSONDecodeError, ValueError):
                continue

    threshold = int(os.environ.get('LORE_TOKEN_THRESHOLD', '500000'))
    if total_tokens > threshold:
        print(f'Cost tracker: ~{total_tokens} estimated tokens in session (threshold: {threshold})')

if __name__ == '__main__':
    main()
