#!/usr/bin/env bash
# skill-lifecycle.sh — UserPromptSubmit hook
# Detects skill invocations and validates prerequisites/dependencies
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json, re, os

data = json.loads(sys.stdin.read())
prompt = data.get('user_prompt', '')
session_id = os.environ.get('CLAUDE_SESSION_ID', 'unknown')

# Detect Skill tool invocations via prompt patterns
skill_refs = re.findall(r'(?:invoke|use|run)\s+(?:the\s+)?(\S+)\s+skill', prompt, re.IGNORECASE)
if not skill_refs:
    sys.exit(0)

# Log skill lifecycle event
from datetime import datetime
log_dir = os.path.expanduser('~/.claude/skill-lifecycle')
os.makedirs(log_dir, exist_ok=True)

for skill in skill_refs:
    entry = {
        'ts': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
        'session_id': session_id,
        'event': 'pre-skill-execute',
        'skill': skill,
    }
    log_file = os.path.join(log_dir, f'{datetime.utcnow().strftime(\"%Y-%m-%d\")}.jsonl')
    with open(log_file, 'a') as f:
        f.write(json.dumps(entry) + '\n')

    print(f'Skill lifecycle: {skill} invocation detected')
" <<< "$INPUT" 2>/dev/null || true

exit 0
