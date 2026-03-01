#!/usr/bin/env bash
# dependency-audit.sh — PostToolUse hook for Bash
# Detects package installations and warns about auditing
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json, re

data = json.loads(sys.stdin.read())
tool_name = data.get('tool_name', '')

if tool_name != 'Bash':
    sys.exit(0)

command = data.get('tool_input', {}).get('command', '')

install_patterns = [
    (r'npm\s+install\s+', 'npm'),
    (r'yarn\s+add\s+', 'yarn'),
    (r'pip\s+install\s+', 'pip'),
    (r'pnpm\s+add\s+', 'pnpm'),
    (r'bun\s+add\s+', 'bun'),
    (r'cargo\s+add\s+', 'cargo'),
]

for pattern, pkg_mgr in install_patterns:
    if re.search(pattern, command):
        print(f'Dependency added via {pkg_mgr}. Consider running \"{pkg_mgr} audit\" to check for vulnerabilities.')
        break
" <<< "$INPUT" 2>/dev/null || true

exit 0
