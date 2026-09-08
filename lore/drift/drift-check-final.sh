#!/usr/bin/env bash
# drift-check-final.sh — Stop hook
#
# Records a stop event into this conversation's state file so drift-stats.sh
# can report session-end metrics. Session is resolved exclusively via the
# authoritative session_id from the hook payload; state files belonging to
# other sessions are refused. Stop hooks cannot inject context, so this
# produces no stdout.
#
# INVARIANT (do not remove): every reminder emitted by this hook begins
# with a stable first-line prefix (see DRIFT_README.md "Trust boundary
# of <system-reminder>"). Hooks that do not currently emit
# additionalContext MUST add the prefix the moment they start.
#
set -euo pipefail
export PYTHONDONTWRITEBYTECODE=1

INPUT=$(cat)
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="$HOOK_DIR${PYTHONPATH:+:$PYTHONPATH}"
DRIFT_ERR_LOG="${HOME}/.claude/drift-state/hook-errors.log"
mkdir -p "$(dirname "$DRIFT_ERR_LOG")" 2>/dev/null || true

python3 -c "
import sys, json
from datetime import datetime, timezone
from _drift_common import resolve_session, update_state

data = json.loads(sys.stdin.read())
resolved = resolve_session(data)
if resolved is None:
    sys.exit(0)
session_id, cwd, project_name, state_file = resolved


def apply(state):
    scope_text = state.get('combined_scope') or state.get('original_request') or ''
    tool_call_count = state.get('tool_call_count', 0)
    if not scope_text or tool_call_count < 10:
        # Session hasn't done meaningful work — leave state untouched.
        return
    stops = list(state.get('stop_events') or [])
    stops.append({
        'at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'tool_call_count': tool_call_count,
        'files_touched_count': len(state.get('files_touched') or []),
        'drift_checks_at_stop': state.get('drift_checks_performed', 0),
        'scope_updates_at_stop': len(state.get('scope_updates') or []),
    })
    state['stop_events'] = stops[-20:]


update_state(
    state_file=state_file,
    session_id=session_id,
    cwd=cwd,
    project_name=project_name,
    mutator=apply,
    create_if_missing=False,
)
" <<< "$INPUT" 2>>"$DRIFT_ERR_LOG" || true

exit 0
