#!/usr/bin/env bash
# lazy-dead-code-scan.sh — Stop hook
# Reports potential dead code introduced during session
set -euo pipefail

INPUT=$(cat)

python3 -c "
import os, json
from datetime import datetime

session_id = os.environ.get('CLAUDE_SESSION_ID', 'unknown')

# Check tool audit log for files modified in this session
audit_dir = os.path.expanduser('~/.claude/tool-audit')
today = datetime.utcnow().strftime('%Y-%m-%d')
audit_file = os.path.join(audit_dir, f'{today}.jsonl')

if not os.path.exists(audit_file):
    sys.exit(0)

import sys
modified_files = set()
with open(audit_file) as f:
    for line in f:
        try:
            entry = json.loads(line)
            if entry.get('session_id') == session_id and entry.get('tool') in ('Write', 'Edit'):
                fp = entry.get('file_path', '')
                if fp:
                    modified_files.add(fp)
        except (json.JSONDecodeError, ValueError):
            continue

if modified_files:
    print(f'findlazy: {len(modified_files)} files modified this session. Consider running dead code analysis.')
" 2>/dev/null || true

exit 0
