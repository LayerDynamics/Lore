#!/usr/bin/env bash
# scratchpad-auto-save.sh — Stop hook
# Persists canvas state before session shutdown
set -euo pipefail

python3 -c "
import os, json
from datetime import datetime

state_dir = os.path.expanduser('~/.claude')
state_file = os.path.join(state_dir, 'scratchpad-state.json')

# Save a timestamp marker for session end
state = {
    'last_session_end': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
    'session_id': os.environ.get('CLAUDE_SESSION_ID', 'unknown'),
}

os.makedirs(state_dir, exist_ok=True)
with open(state_file, 'w') as f:
    json.dump(state, f)

print('Scratchpad state saved')
" 2>/dev/null || true

exit 0
