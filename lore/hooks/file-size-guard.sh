#!/usr/bin/env bash
# file-size-guard.sh — PreToolUse hook for Write
# Warns when writing files exceeding size threshold
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json

data = json.loads(sys.stdin.read())
tool_name = data.get('tool_name', '')

if tool_name != 'Write':
    sys.exit(0)

content = data.get('tool_input', {}).get('content', '')
file_path = data.get('tool_input', {}).get('file_path', '')
max_size = 50000  # 50KB threshold

if len(content) > max_size:
    print(f'Warning: Writing {len(content)} chars to {file_path} (threshold: {max_size}). Consider splitting into smaller files.')
" <<< "$INPUT" 2>/dev/null || true

exit 0
