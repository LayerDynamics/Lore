#!/usr/bin/env bash
# pre-verification.sh — UserPromptSubmit hook
# Detects completion language and reminds about verification-before-completion skill
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json, re

data = json.loads(sys.stdin.read())
prompt = data.get('user_prompt', '').lower()

completion_patterns = [
    r'\b(ship|deploy|merge|push)\s+(it|this|the|to)',
    r'\b(all\s+done|ready\s+to\s+merge|looks?\s+good)',
    r'\b(mark\s+as\s+complete|finish\s+up)',
]

for pattern in completion_patterns:
    if re.search(pattern, prompt):
        print('Reminder: Run verification-before-completion checks before finalizing.')
        break
" <<< "$INPUT" 2>/dev/null || true

exit 0
