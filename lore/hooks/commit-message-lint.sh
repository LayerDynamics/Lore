#!/usr/bin/env bash
# commit-message-lint.sh — PreToolUse hook for Bash
# Validates commit message format on git commit commands
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json, re

data = json.loads(sys.stdin.read())
tool_name = data.get('tool_name', '')

if tool_name != 'Bash':
    sys.exit(0)

command = data.get('tool_input', {}).get('command', '')

# Detect git commit
if not re.search(r'git\s+commit', command):
    sys.exit(0)

# Extract commit message
msg_match = re.search(r'-m\s+[\"'\''](.*?)[\"'\'']', command)
if not msg_match:
    sys.exit(0)

msg = msg_match.group(1).split('\n')[0]  # First line only

warnings = []

if len(msg) > 72:
    warnings.append(f'Subject line too long ({len(msg)} chars, max 72)')

if msg and msg[0].islower():
    warnings.append('Subject should start with a capital letter')

if msg.endswith('.'):
    warnings.append('Subject should not end with a period')

if warnings:
    print('Commit message lint: ' + '; '.join(warnings))
" <<< "$INPUT" 2>/dev/null || true

exit 0
