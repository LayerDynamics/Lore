#!/usr/bin/env bash
# on-plan-created.sh — PostToolUse hook for Write tool
# Validates plan structure when writing to docs/plans/
set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")

if [ "$TOOL_NAME" != "Write" ]; then
  exit 0
fi

FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data.get('tool_input', {}).get('file_path', ''))
" 2>/dev/null || echo "")

# Only fire for plan files
if ! echo "$FILE_PATH" | grep -qE '(docs/plans/|plans/).*\.(md|txt)$'; then
  exit 0
fi

# Validate plan structure
echo "$INPUT" | python3 -c "
import sys, json, re

data = json.load(sys.stdin)
content = data.get('tool_input', {}).get('content', '')
file_path = data.get('tool_input', {}).get('file_path', '')

warnings = []

# Check for required sections
required = ['## ', 'Task', 'Step']
has_heading = bool(re.search(r'^##?\s', content, re.MULTILINE))
has_tasks = bool(re.search(r'(?i)(task|step|phase|todo|\[ \])', content))
has_scope = bool(re.search(r'(?i)(scope|goal|objective|summary)', content))

if not has_heading:
    warnings.append('No markdown headings found')
if not has_tasks:
    warnings.append('No tasks/steps/phases detected')
if not has_scope:
    warnings.append('No scope/goal/objective section')

if warnings:
    print(f'Plan validation warnings for {file_path}: ' + '; '.join(warnings))
else:
    print(f'Plan created: {file_path}')
" 2>/dev/null || true

exit 0
