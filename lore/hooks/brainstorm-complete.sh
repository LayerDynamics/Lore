#!/usr/bin/env bash
# brainstorm-complete.sh — PostToolUse hook for Skill tool
# Ensures brainstorming ideas are captured before implementation
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json, os

data = json.loads(sys.stdin.read())
tool_name = data.get('tool_name', '')

if tool_name != 'Skill':
    sys.exit(0)

ti = data.get('tool_input', {})
skill_name = ti.get('skill', '')

if 'brainstorm' not in skill_name.lower():
    sys.exit(0)

print('Brainstorming complete. Ensure ideas are captured before proceeding to implementation.')
" <<< "$INPUT" 2>/dev/null || true

exit 0
