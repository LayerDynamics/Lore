#!/usr/bin/env bash
# branch-protection.sh — PreToolUse hook for Bash
# Prevents push to protected branches
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json, re

data = json.loads(sys.stdin.read())
tool_name = data.get('tool_name', '')

if tool_name != 'Bash':
    sys.exit(0)

command = data.get('tool_input', {}).get('command', '')

# Detect git push
push_match = re.search(r'git\s+push\s+(\S+)?\s*(\S+)?', command)
if not push_match:
    sys.exit(0)

remote = push_match.group(1) or ''
branch = push_match.group(2) or ''

protected = ['main', 'master', 'production', 'release', 'staging']

# Check if pushing to a protected branch
if branch in protected:
    print(f'BLOCKED: Push to protected branch \"{branch}\" detected. Use a feature branch.', file=sys.stderr)
    sys.exit(2)

# Check for force push to any branch
if re.search(r'--force|-f\b', command) and branch not in ['']:
    print(f'Warning: Force push detected to {branch or \"current branch\"}. Proceed with caution.')
" <<< "$INPUT"
