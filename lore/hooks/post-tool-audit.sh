#!/usr/bin/env bash
# post-tool-audit.sh — PostToolUse hook (general)
# Logs tool results, detects errors, tracks tool chains
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json, os
from datetime import datetime

data = json.loads(sys.stdin.read())
tool_name = data.get('tool_name', '')
tool_input = data.get('tool_input', {})
tool_result = str(data.get('tool_result', ''))
session_id = os.environ.get('CLAUDE_SESSION_ID', 'unknown')

# Detect errors
has_error = any(kw in tool_result.lower() for kw in ['error:', 'failed:', 'exception:', 'traceback', 'command failed'])

# Log to audit trail
audit_dir = os.path.expanduser('~/.claude/tool-audit')
os.makedirs(audit_dir, exist_ok=True)

entry = {
    'ts': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
    'session_id': session_id,
    'tool': tool_name,
    'input_keys': list(tool_input.keys()) if isinstance(tool_input, dict) else [],
    'result_length': len(tool_result),
    'status': 'error' if has_error else 'ok',
}

# Add file_path if present
fp = tool_input.get('file_path', '') if isinstance(tool_input, dict) else ''
if fp:
    entry['file_path'] = fp

audit_file = os.path.join(audit_dir, f'{datetime.utcnow().strftime(\"%Y-%m-%d\")}.jsonl')
with open(audit_file, 'a') as f:
    f.write(json.dumps(entry) + '\n')

if has_error:
    print(f'Tool audit: {tool_name} completed with errors')
" <<< "$INPUT" 2>/dev/null || true

exit 0
