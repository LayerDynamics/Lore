#!/usr/bin/env bash
# drift-subagent-inject.sh — PreToolUse hook (matcher: Task)
#
# Intercepts every subagent launch and prepends drift anchoring instructions
# plus THIS conversation's locked scope to the subagent's prompt. The parent
# session is resolved exclusively via the authoritative session_id from the
# hook payload; if the state file claims a different session_id, the subagent
# launch is left unmodified rather than risk injecting foreign scope.
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
import sys, json, hashlib
from datetime import datetime, timezone
from _drift_common import resolve_session, read_state, short_nonce

data = json.loads(sys.stdin.read())
tool_input = data.get('tool_input', data.get('toolInput', {})) or {}

prompt_key = 'prompt' if 'prompt' in tool_input else 'message'
prompt = tool_input.get(prompt_key, '')
if not prompt:
    sys.exit(0)

resolved = resolve_session(data)
if resolved is None:
    sys.exit(0)
session_id, cwd, project_name, state_file = resolved

state = read_state(state_file, session_id)
if state is None:
    sys.exit(0)

scope_text = state.get('combined_scope') or state.get('original_request') or ''
if not scope_text:
    sys.exit(0)

agent_type = tool_input.get('subagent_type', 'unknown')
description = tool_input.get('description', 'unspecified task')
raw_id = agent_type + ':' + description + ':' + datetime.now(timezone.utc).isoformat()
agent_id = hashlib.sha256(raw_id.encode()).hexdigest()[:8]

truncated = scope_text[:600]
if len(scope_text) > 600:
    truncated += '...'

nonce = short_nonce(state)
scope_tag = f'[parent scope {nonce}] ' if nonce else ''

NL = chr(10)
guard_lines = [
    '=== SUBAGENT DRIFT GUARD ===',
    scope_tag + 'AGENT ID: ' + agent_id,
    'AGENT TYPE: ' + agent_type,
    'ASSIGNED TASK: ' + description,
    '',
    'PARENT SESSION SCOPE:',
    truncated,
    '',
    'RULES:',
    '1. You are subagent ' + agent_id + '. Your ONLY job is the subtask below.',
    '2. Everything you do MUST serve the parent scope above.',
    '3. Do NOT fix, refactor, or improve anything outside your assigned subtask.',
    '4. Do NOT touch files unrelated to your subtask.',
    '5. SELF-CHECK: After every 5 tool calls, ask yourself: Am I still on my subtask? Have I touched anything outside scope? If no to either, stop and return what you have.',
    '6. Prefix your final response with: [Agent ' + agent_id + ' | ' + agent_type + ']',
    '=== END DRIFT GUARD ===',
    '',
    'YOUR SUBTASK: ',
]
guard = NL.join(guard_lines)

updated_input = dict(tool_input)
updated_input[prompt_key] = guard + prompt

output = {'hookSpecificOutput': {'hookEventName': 'PreToolUse', 'updatedInput': updated_input}}
print(json.dumps(output))
" <<< "$INPUT" 2>>"$DRIFT_ERR_LOG" || true

exit 0
