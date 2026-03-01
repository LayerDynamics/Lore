#!/usr/bin/env bash
# post-web-intercept-log.sh — PostToolUse hook for browser navigation
# Tracks navigation history and logs intercepted URLs
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json, os
from datetime import datetime

data = json.loads(sys.stdin.read())
tool_name = data.get('tool_name', '')

browser_tools = ['WebFetch', 'WebSearch', 'mcp__browserx']
if not any(t in tool_name for t in browser_tools):
    sys.exit(0)

ti = data.get('tool_input', {})
url = ti.get('url', ti.get('query', ''))
session_id = os.environ.get('CLAUDE_SESSION_ID', 'unknown')

log_dir = os.path.expanduser('~/.claude/browserx-log')
os.makedirs(log_dir, exist_ok=True)

entry = {
    'ts': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
    'session_id': session_id,
    'tool': tool_name,
    'target': url[:500] if url else '',
}

log_file = os.path.join(log_dir, f'{datetime.utcnow().strftime(\"%Y-%m-%d\")}.jsonl')
with open(log_file, 'a') as f:
    f.write(json.dumps(entry) + '\n')
" <<< "$INPUT" 2>/dev/null || true

exit 0
