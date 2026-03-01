#!/usr/bin/env bash
# agent-quality-gate.sh — PostToolUse hook for Task tool
# Ensures code-reviewer agent findings are addressed
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

if 'code-reviewer' not in agent_type and 'review' not in agent_type:
    sys.exit(0)

# Check if review found issues
issue_indicators = ['critical', 'high', 'must fix', 'blocking', 'security', 'vulnerability']
has_critical = any(kw in result.lower() for kw in issue_indicators)

if has_critical:
    print('Quality gate: Code review found critical/high issues. Address findings before proceeding.')
" <<< "$INPUT" 2>/dev/null || true

exit 0
