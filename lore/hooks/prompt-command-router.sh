#!/usr/bin/env bash
# prompt-command-router.sh — UserPromptSubmit hook
# Pre-validates /lore:* command args and logs command usage
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json, re, os
from datetime import datetime

data = json.loads(sys.stdin.read())
prompt = data.get('user_prompt', '')
session_id = os.environ.get('CLAUDE_SESSION_ID', 'unknown')

# Detect /namespace:command patterns
commands = re.findall(r'/([a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+)(?:\s+(.*))?', prompt)
if not commands:
    sys.exit(0)

# Log command usage
log_dir = os.path.expanduser('~/.claude/command-usage')
os.makedirs(log_dir, exist_ok=True)

for cmd, args in commands:
    entry = {
        'ts': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
        'session_id': session_id,
        'command': cmd,
        'has_args': bool(args.strip()),
        'arg_length': len(args.strip()),
    }
    log_file = os.path.join(log_dir, f'{datetime.utcnow().strftime(\"%Y-%m-%d\")}.jsonl')
    with open(log_file, 'a') as f:
        f.write(json.dumps(entry) + '\n')
" <<< "$INPUT" 2>/dev/null || true

exit 0
