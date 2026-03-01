#!/usr/bin/env bash
# tdd-phase-tracker.sh — PostToolUse hook for Bash
# Tracks TDD red/green/refactor cycle phases
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json, re, os
from datetime import datetime

data = json.loads(sys.stdin.read())
tool_name = data.get('tool_name', '')

if tool_name != 'Bash':
    sys.exit(0)

tool_input = data.get('tool_input', {})
command = tool_input.get('command', '')
result = str(data.get('tool_result', ''))

# Detect test runs
is_test = any(kw in command for kw in ['pytest', 'jest', 'mocha', 'npm test', 'npm run test', 'vitest', 'cargo test', 'go test'])
if not is_test:
    sys.exit(0)

session_id = os.environ.get('CLAUDE_SESSION_ID', 'unknown')

# Determine test result
tests_passed = any(kw in result.lower() for kw in ['passed', 'tests passed', 'ok', '0 failed', 'all tests'])
tests_failed = any(kw in result.lower() for kw in ['failed', 'failure', 'error', 'fail'])

phase = 'green' if tests_passed and not tests_failed else 'red' if tests_failed else 'unknown'

log_dir = os.path.expanduser('~/.claude/tdd-cycle')
os.makedirs(log_dir, exist_ok=True)

entry = {
    'ts': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
    'session_id': session_id,
    'phase': phase,
    'command': command[:200],
}

log_file = os.path.join(log_dir, f'{datetime.utcnow().strftime(\"%Y-%m-%d\")}.jsonl')
with open(log_file, 'a') as f:
    f.write(json.dumps(entry) + '\n')

print(f'TDD phase: {phase}')
" <<< "$INPUT" 2>/dev/null || true

exit 0
