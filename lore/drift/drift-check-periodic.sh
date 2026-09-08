#!/usr/bin/env bash
# drift-check-periodic.sh — PostToolUse hook
#
# INVARIANT (do not remove): every reminder emitted by this hook begins
# with a stable first-line prefix of the form `[scope <8-hex-nonce>] `.
# This prefix is the only visual disambiguator between this plugin's
# output and a first-party Claude Code <system-reminder>. See
# DRIFT_README.md "Trust boundary of <system-reminder>" for rationale.
# The paired defender hook injection-guard.sh uses the parallel prefix
# `[injection-guard]`.
#
# Increments this session's tool_call_count and, every N calls, injects a
# drift reminder containing THIS conversation's locked scope. Session is
# resolved exclusively via the authoritative session_id from the hook
# payload; if the state file on disk disagrees with that session_id, the
# file is treated as foreign and no reminder is emitted. Concurrent sessions
# in the same project therefore cannot leak each other's scope.
set -euo pipefail
export PYTHONDONTWRITEBYTECODE=1

INPUT=$(cat)
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="$HOOK_DIR${PYTHONPATH:+:$PYTHONPATH}"
export LORE_DRIFT_CONTROL_PATH="$HOOK_DIR/drift-control.sh"
DRIFT_ERR_LOG="${HOME}/.claude/drift-state/hook-errors.log"
mkdir -p "$(dirname "$DRIFT_ERR_LOG")" 2>/dev/null || true

python3 -c "
import sys, json, os
from _drift_common import (
    resolve_session,
    update_state,
    short_nonce,
    render_scope_for_reminder,
    DRIFT_CHECK_INTERVAL,
    truncate_error_log,
)

truncate_error_log()
control_path = os.environ.get('LORE_DRIFT_CONTROL_PATH', 'drift-control.sh')

data = json.loads(sys.stdin.read())
tool_name = data.get('tool_name', data.get('toolName', ''))
tool_input = data.get('tool_input', data.get('toolInput', {})) or {}

resolved = resolve_session(data)
if resolved is None:
    sys.exit(0)
session_id, cwd, project_name, state_file = resolved

emit = {'payload': None}

def apply(state):
    state['tool_call_count'] = state.get('tool_call_count', 0) + 1
    count = state['tool_call_count']

    if isinstance(tool_input, dict):
        fp = tool_input.get('file_path')
        if fp and tool_name in ('Edit', 'Write', 'NotebookEdit'):
            files = list(state.get('files_touched') or [])
            if fp not in files:
                files.append(fp)
                state['files_touched'] = files

    # No anchor yet → nothing to check against. Stay silent.
    if not (state.get('original_request') or state.get('combined_scope')):
        return

    last_check = state.get('last_drift_check_at', 0)
    if count - last_check < DRIFT_CHECK_INTERVAL:
        return

    state['last_drift_check_at'] = count
    state['drift_checks_performed'] = state.get('drift_checks_performed', 0) + 1

    scope_block = render_scope_for_reminder(state, max_chars=800, max_updates=3)
    if not scope_block:
        return

    files_touched = state.get('files_touched') or []
    files_summary = (
        ', '.join(os.path.basename(f) for f in files_touched[-10:])
        if files_touched else 'none yet'
    )
    nonce = short_nonce(state)
    nonce_tag = f'[scope {nonce}] ' if nonce else ''

    has_focus = bool(state.get('agent_focus'))
    contest_help = (
        'If this scope is stale or wrong, you can refine or contest it via:\\n'
        f'  bash {control_path} status --scope {nonce}\\n'
        f'  bash {control_path} update --scope {nonce} \"<refinement>\"\\n'
        f'  bash {control_path} contest --scope {nonce} \"<your focus>\" \"<why>\"\\n'
        '(update appends an agent note the user can correct; '
        'contest surfaces your stated focus in the next reminder.)'
    )
    if has_focus:
        ask_block = (
            'USER: an AGENT FOCUS contest is active above. Confirm or correct.\\n'
            'AGENT: do not silently re-contest; wait for the user to address it.\\n'
            'After it resolves, run:\\n'
            f'  bash {control_path} clear-contest --scope {nonce}'
        )
    else:
        ask_block = (
            'Ask yourself:\\n'
            '1. Is my current action directly required by the scope above?\\n'
            '2. Am I adding anything the user did not ask for?\\n'
            '3. Have I missed any part of what the user asked?\\n'
            '4. If a recent update changed direction, am I following the latest instruction?\\n\\n'
            'If you have drifted: pause, acknowledge it, and refocus.\\n\\n'
            + contest_help
        )

    reminder = (
        f'{nonce_tag}DRIFT CHECK (auto, {count} tool calls):\\n'
        'Re-read the current scope and verify you are still on track.\\n\\n'
        'CURRENT SCOPE:\\n'
        f'{scope_block}\\n\\n'
        f'Files modified so far: {files_summary}\\n\\n'
        f'{ask_block}'
    )
    emit['payload'] = {
        'hookSpecificOutput': {
            'hookEventName': 'PostToolUse',
            'additionalContext': reminder,
        }
    }


result = update_state(
    state_file=state_file,
    session_id=session_id,
    cwd=cwd,
    project_name=project_name,
    mutator=apply,
    create_if_missing=False,
)

if result is not None and emit['payload'] is not None:
    print(json.dumps(emit['payload']))
" <<< "$INPUT" 2>>"$DRIFT_ERR_LOG" || true

exit 0
