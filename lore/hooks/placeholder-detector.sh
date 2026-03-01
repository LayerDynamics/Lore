#!/usr/bin/env bash
# placeholder-detector.sh — PostToolUse hook for Write/Edit
# Detects TODO, FIXME, placeholder, stub patterns in written content
set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")

if [ "$TOOL_NAME" != "Write" ] && [ "$TOOL_NAME" != "Edit" ]; then
  exit 0
fi

python3 -c "
import sys, json, re

data = json.loads(sys.stdin.read())
ti = data.get('tool_input', {})
content = ti.get('content', '') or ti.get('new_string', '')
file_path = ti.get('file_path', '')

# Skip non-code files
skip_exts = ['.md', '.txt', '.json', '.yml', '.yaml', '.toml', '.lock', '.csv']
if any(file_path.endswith(ext) for ext in skip_exts):
    sys.exit(0)

# Skip hook files themselves
if '/hooks/' in file_path:
    sys.exit(0)

findings = []

patterns = [
    (r'\bTODO\b', 'TODO'),
    (r'\bFIXME\b', 'FIXME'),
    (r'\bHACK\b', 'HACK'),
    (r'\bXXX\b', 'XXX'),
    (r'(?i)placeholder', 'placeholder'),
    (r'(?i)stub\b', 'stub'),
    (r'(?i)not\s+implemented', 'not implemented'),
    (r'(?i)implement\s+me', 'implement me'),
    (r'(?i)fill\s+in', 'fill in'),
    (r'pass\s*$', 'bare pass (Python stub)'),
    (r'throw\s+new\s+Error\([\"'\'']not\s+implemented', 'throw not implemented'),
]

for pattern, name in patterns:
    matches = re.findall(pattern, content)
    if matches:
        findings.append(f'{name} ({len(matches)}x)')

if findings:
    print(f'Placeholder patterns in {file_path}: ' + ', '.join(findings))
" <<< "$INPUT" 2>/dev/null || true

exit 0
