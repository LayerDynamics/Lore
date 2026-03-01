#!/usr/bin/env bash
# test-regression-check.sh — PostToolUse hook for Edit
# Reminds to run tests after editing source files
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json, os

data = json.loads(sys.stdin.read())
tool_name = data.get('tool_name', '')

if tool_name != 'Edit':
    sys.exit(0)

file_path = data.get('tool_input', {}).get('file_path', '')
if not file_path:
    sys.exit(0)

# Only fire for source code files
code_exts = ['.js', '.ts', '.py', '.rs', '.go', '.java', '.rb', '.tsx', '.jsx']
if not any(file_path.endswith(ext) for ext in code_exts):
    sys.exit(0)

# Skip test files themselves
if any(kw in file_path for kw in ['test', 'spec', '__test__', '__mock__']):
    sys.exit(0)

basename = os.path.basename(file_path)
print(f'Source file modified: {basename} — consider running related tests')
" <<< "$INPUT" 2>/dev/null || true

exit 0
