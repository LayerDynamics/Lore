#!/usr/bin/env bash
# spec-skill-complete.sh — PostToolUse hook for Skill tool
# Reminds user of next steps after project-spec-planning skill completes
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json

data = json.loads(sys.stdin.read())
tool_name = data.get('tool_name', '')

if tool_name != 'Skill':
    sys.exit(0)

ti = data.get('tool_input', {})
skill_name = ti.get('skill', '')

if 'project-spec-planning' not in skill_name and 'spec-planning' not in skill_name:
    sys.exit(0)

print('Spec planning complete. Next steps:')
print('  1. Review the generated spec for accuracy')
print('  2. Fill in any TBD sections')
print('  3. Run /lore:plan to create an implementation plan from the spec')
print('  4. Run /lore:blueprint to convert into actionable tasks')
" <<< "$INPUT" 2>/dev/null || true

exit 0
