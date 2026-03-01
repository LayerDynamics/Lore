#!/usr/bin/env bash
# lazy-import-check.sh — PostToolUse hook for Write/Edit
# Detects potentially unused imports in modified files
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json, re, os

data = json.loads(sys.stdin.read())
tool_name = data.get('tool_name', '')

if tool_name not in ('Write', 'Edit'):
    sys.exit(0)

file_path = data.get('tool_input', {}).get('file_path', '')
if not file_path or not os.path.exists(file_path):
    sys.exit(0)

# Only check JS/TS/Python files
if not any(file_path.endswith(ext) for ext in ['.js', '.ts', '.tsx', '.jsx', '.py']):
    sys.exit(0)

with open(file_path) as f:
    content = f.read()

# Quick check for import lines
if file_path.endswith('.py'):
    imports = re.findall(r'(?:from\s+\S+\s+)?import\s+(\w+)', content)
else:
    imports = re.findall(r'import\s+(?:{[^}]+}|\w+)\s+from', content)

if len(imports) > 20:
    print(f'findlazy: {os.path.basename(file_path)} has {len(imports)} imports — consider reviewing for unused imports')
" <<< "$INPUT" 2>/dev/null || true

exit 0
