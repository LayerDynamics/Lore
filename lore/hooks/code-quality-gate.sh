#!/usr/bin/env bash
# code-quality-gate.sh — PostToolUse hook for Write/Edit
# Runs basic quality checks on modified files
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json, os, subprocess

data = json.loads(sys.stdin.read())
tool_name = data.get('tool_name', '')

if tool_name not in ('Write', 'Edit'):
    sys.exit(0)

file_path = data.get('tool_input', {}).get('file_path', '')
if not file_path or not os.path.exists(file_path):
    sys.exit(0)

# Skip non-code files
skip = ['.md', '.txt', '.json', '.yml', '.yaml', '.toml', '.lock', '.csv', '.sh']
if any(file_path.endswith(ext) for ext in skip):
    sys.exit(0)

# Check file size
size = os.path.getsize(file_path)
if size > 100000:
    print(f'Quality: {os.path.basename(file_path)} is {size} bytes — consider refactoring')

# Check line count
with open(file_path) as f:
    lines = f.readlines()
if len(lines) > 500:
    print(f'Quality: {os.path.basename(file_path)} has {len(lines)} lines — consider splitting')
" <<< "$INPUT" 2>/dev/null || true

exit 0
