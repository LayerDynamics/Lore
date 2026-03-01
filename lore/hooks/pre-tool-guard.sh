#!/usr/bin/env bash
# pre-tool-guard.sh — PreToolUse hook (general)
# Enforces tool usage policies (e.g., warn when Bash used for file operations)
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json, re

data = json.loads(sys.stdin.read())
tool_name = data.get('tool_name', '')
tool_input = data.get('tool_input', {})

if tool_name != 'Bash':
    sys.exit(0)

command = tool_input.get('command', '')

# Warn when Bash is used for operations that have dedicated tools
warnings = []

# File reading via cat/head/tail
if re.search(r'\bcat\s+\S', command) and not re.search(r'\bcat\s+<<', command):
    warnings.append('Use Read tool instead of cat')

# File searching via find
if re.search(r'\bfind\s+\S', command):
    warnings.append('Use Glob tool instead of find')

# Content searching via grep/rg
if re.search(r'\b(grep|rg)\s+', command) and '|' not in command:
    warnings.append('Use Grep tool instead of grep/rg')

# File editing via sed
if re.search(r'\bsed\s+-i', command):
    warnings.append('Use Edit tool instead of sed -i')

if warnings:
    print('Tool policy: ' + '; '.join(warnings))
" <<< "$INPUT" 2>/dev/null || true

exit 0
