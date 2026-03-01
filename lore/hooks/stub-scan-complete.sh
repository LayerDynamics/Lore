#!/usr/bin/env bash
# stub-scan-complete.sh — PostToolUse hook for Task tool
# Auto-suggests stub-implementer when stub-scanner finds stubs
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json

data = json.loads(sys.stdin.read())
tool_name = data.get('tool_name', '')

if tool_name != 'Task':
    sys.exit(0)

ti = data.get('tool_input', {})
agent_type = ti.get('subagent_type', '')
result = str(data.get('tool_result', ''))

if 'stub-scanner' not in agent_type:
    sys.exit(0)

# Check if stubs were found
stub_indicators = ['stub', 'placeholder', 'not implemented', 'todo', 'fixme']
has_stubs = any(kw in result.lower() for kw in stub_indicators)

if has_stubs:
    print('Stubs detected. Consider running stub-implementer agent to resolve them.')
" <<< "$INPUT" 2>/dev/null || true

exit 0
