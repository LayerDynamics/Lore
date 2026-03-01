#!/usr/bin/env python3
"""Stop hook — aggregates skill effectiveness metrics for the session."""
import sys
import json
import os
from datetime import datetime

def main():
    try:
        data = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, ValueError):
        data = {}

    session_id = os.environ.get('CLAUDE_SESSION_ID', 'unknown')
    telemetry_dir = os.path.expanduser('~/.claude/telemetry')
    today = datetime.utcnow().strftime('%Y-%m-%d')
    log_file = os.path.join(telemetry_dir, f'{today}.jsonl')

    if not os.path.exists(log_file):
        return

    skills_used = {}
    with open(log_file) as f:
        for line in f:
            try:
                entry = json.loads(line)
                if entry.get('session_id') != session_id:
                    continue
                skill = entry.get('skill')
                if skill:
                    skills_used[skill] = skills_used.get(skill, 0) + 1
            except (json.JSONDecodeError, ValueError):
                continue

    if skills_used:
        analytics_dir = os.path.expanduser('~/.claude/skill-analytics')
        os.makedirs(analytics_dir, exist_ok=True)

        summary = {
            'ts': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
            'session_id': session_id,
            'skills': skills_used,
            'total_invocations': sum(skills_used.values()),
        }

        analytics_file = os.path.join(analytics_dir, f'{today}.jsonl')
        with open(analytics_file, 'a') as f:
            f.write(json.dumps(summary) + '\n')

        print(f'Skills used: {", ".join(f"{k}({v}x)" for k, v in skills_used.items())}')

if __name__ == '__main__':
    main()
