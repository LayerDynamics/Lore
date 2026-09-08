#!/usr/bin/env bash
# drift-control.sh — agent-side scope control CLI
#
# Invoked by the AGENT (Claude) via the Bash tool to inspect, refine,
# or contest the current drift scope. The four operations:
#
#   status       Print the current scope as the renderer sees it.
#                Read-only; safe to call any time.
#
#   update       Append an agent-authored note to scope_updates. Use
#                when the agent wants to record its evolved
#                understanding ("focusing on the auth router only,
#                not touching tests"). Visible in the next drift
#                reminder so the user can correct.
#
#   contest      Set agent_focus to (current focus, justification).
#                Use when a drift reminder appears stale but the
#                agent IS on-task. The next reminder shows an
#                AGENT FOCUS section asking the user to confirm or
#                correct.
#
#   clear-contest  Drop the active agent_focus marker after the
#                  user has acknowledged or corrected.
#
# Session identification: every drift reminder begins with
# `[scope <8hex>]`. Pass that prefix as `--scope <8hex>`. Mutating
# operations require it; read-only `status` falls back to the most-
# recently-modified state file in the cwd's project directory.
#
# Exit codes:
#   0   success
#   1   usage / argument error
#   2   no matching session found
#   3   internal error (state read/write failure)

set -euo pipefail
export PYTHONDONTWRITEBYTECODE=1

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="$HOOK_DIR${PYTHONPATH:+:$PYTHONPATH}"

usage() {
    cat <<'USAGE'
drift-control.sh — agent-side drift scope control

Usage:
  drift-control.sh status [--scope <8hex>] [--cwd <path>]
  drift-control.sh update --scope <8hex> "<refinement text>" [--cwd <path>]
  drift-control.sh contest --scope <8hex> "<current focus>" "<justification>" [--cwd <path>]
  drift-control.sh clear-contest --scope <8hex> [--cwd <path>]

The 8-hex scope prefix appears in every drift reminder, e.g.
[scope fe06373e].

Notes:
- `status` without --scope returns the most-recently-modified state
  in the current project. Mutating operations always require --scope.
- `--cwd` defaults to $(pwd). Pass it explicitly when running from
  somewhere other than the project root.

Examples:
  # Inspect what scope the drift system is holding me to.
  drift-control.sh status --scope fe06373e

  # Record a refinement: I now think the user wants only X.
  drift-control.sh update --scope fe06373e \
      "narrowed scope: only routers/auth.py — not touching tests yet"

  # Contest a stale reminder: the scope shows old, but I'm doing the
  # right new thing.
  drift-control.sh contest --scope fe06373e \
      "implementing the parity test fix the user just asked for" \
      "scope still shows the migration ask but user pivoted at 19:42"

  # User confirmed; clear the focus marker.
  drift-control.sh clear-contest --scope fe06373e
USAGE
}

if (( $# == 0 )); then
    usage
    exit 1
fi

ACTION="$1"
shift

SCOPE_NONCE=""
CWD_OVERRIDE=""
ARGS=()

while (( $# > 0 )); do
    case "$1" in
        --scope)
            if (( $# < 2 )); then
                echo "error: --scope requires an argument" >&2
                exit 1
            fi
            SCOPE_NONCE="$2"
            shift 2
            ;;
        --scope=*) SCOPE_NONCE="${1#--scope=}"; shift ;;
        --cwd)
            if (( $# < 2 )); then
                echo "error: --cwd requires an argument" >&2
                exit 1
            fi
            CWD_OVERRIDE="$2"
            shift 2
            ;;
        --cwd=*) CWD_OVERRIDE="${1#--cwd=}"; shift ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            ARGS+=("$1")
            shift
            ;;
    esac
done

CWD="${CWD_OVERRIDE:-$(pwd)}"

case "$ACTION" in
    status)
        python3 - "$CWD" "$SCOPE_NONCE" <<'PYEOF'
import sys
from _drift_common import (
    find_state_file_for_cwd,
    read_state_for_cli,
    render_scope_for_reminder,
    short_nonce,
)

cwd, nonce = sys.argv[1], sys.argv[2]
nonce = nonce or None
result = find_state_file_for_cwd(cwd, nonce, require_nonce=False)
if result is None:
    sys.stderr.write(
        f"no drift state for project at {cwd}"
        + (f" matching scope {nonce}" if nonce else "")
        + "\n"
    )
    sys.exit(2)
state_file, session_id = result
state = read_state_for_cli(state_file, session_id)
if state is None:
    sys.stderr.write(f"could not read state for session {session_id}\n")
    sys.exit(3)

print(f"session_id:          {session_id}")
print(f"scope_nonce[:8]:     {short_nonce(state)}")
print(f"schema_version:      {state.get('schema_version')}")
print(f"created_at:          {state.get('created_at')}")
print(f"anchor_set_at:       {state.get('anchor_set_at')}")
print(f"last_substantive_at: {state.get('last_substantive_at')}")
print(f"user_message_count:  {state.get('user_message_count')}")
print(f"agent_update_count:  {state.get('agent_update_count')}")
print(f"tool_call_count:     {state.get('tool_call_count')}")
print(f"scope_updates:       {len(state.get('scope_updates') or [])}")
print(f"scope_history:       {len(state.get('scope_history') or [])} prior")
print()
rendered = render_scope_for_reminder(state, max_chars=4000, max_updates=20)
if rendered:
    print(rendered)
else:
    print("(no scope captured yet)")
PYEOF
        ;;
    update)
        if [[ -z "$SCOPE_NONCE" ]]; then
            echo "error: 'update' requires --scope <8hex> from the latest drift reminder" >&2
            exit 1
        fi
        if (( ${#ARGS[@]} == 0 )); then
            echo "error: 'update' requires the refinement text as a positional argument" >&2
            exit 1
        fi
        if (( ${#ARGS[@]} > 1 )); then
            echo "error: 'update' takes a single quoted text argument; got ${#ARGS[@]}" >&2
            exit 1
        fi
        TEXT="${ARGS[0]}"
        python3 - "$CWD" "$SCOPE_NONCE" "$TEXT" <<'PYEOF'
import sys
from _drift_common import find_state_file_for_cwd, agent_append_update

cwd, nonce, text = sys.argv[1], sys.argv[2], sys.argv[3]
result = find_state_file_for_cwd(cwd, nonce, require_nonce=True)
if result is None:
    sys.stderr.write(f"no state file matching scope {nonce} for project at {cwd}\n")
    sys.exit(2)
state_file, session_id = result
ok = agent_append_update(state_file, session_id, text, cwd)
if not ok:
    sys.stderr.write(
        "agent_append_update declined: text sanitized to empty, "
        "or duplicate of last agent entry\n"
    )
    sys.exit(3)
print(f"ok: appended agent update to session {session_id}")
PYEOF
        ;;
    contest)
        if [[ -z "$SCOPE_NONCE" ]]; then
            echo "error: 'contest' requires --scope <8hex>" >&2
            exit 1
        fi
        if (( ${#ARGS[@]} != 2 )); then
            echo "error: 'contest' takes exactly two args: <focus> <justification>; got ${#ARGS[@]}" >&2
            exit 1
        fi
        FOCUS="${ARGS[0]}"
        JUST="${ARGS[1]}"
        python3 - "$CWD" "$SCOPE_NONCE" "$FOCUS" "$JUST" <<'PYEOF'
import sys
from _drift_common import find_state_file_for_cwd, agent_set_focus

cwd, nonce, focus, just = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
result = find_state_file_for_cwd(cwd, nonce, require_nonce=True)
if result is None:
    sys.stderr.write(f"no state file matching scope {nonce}\n")
    sys.exit(2)
state_file, session_id = result
ok = agent_set_focus(state_file, session_id, focus, just, cwd)
if not ok:
    sys.stderr.write("agent_set_focus declined: focus text sanitized to empty\n")
    sys.exit(3)
print(f"ok: agent_focus recorded for session {session_id}")
print("the next drift reminder will surface this contest to the user")
PYEOF
        ;;
    clear-contest)
        if [[ -z "$SCOPE_NONCE" ]]; then
            echo "error: 'clear-contest' requires --scope <8hex>" >&2
            exit 1
        fi
        python3 - "$CWD" "$SCOPE_NONCE" <<'PYEOF'
import sys
from _drift_common import find_state_file_for_cwd, agent_clear_focus

cwd, nonce = sys.argv[1], sys.argv[2]
result = find_state_file_for_cwd(cwd, nonce, require_nonce=True)
if result is None:
    sys.stderr.write(f"no state file matching scope {nonce}\n")
    sys.exit(2)
state_file, session_id = result
ok = agent_clear_focus(state_file, session_id, cwd)
if not ok:
    sys.stderr.write("agent_clear_focus failed (state read or write error)\n")
    sys.exit(3)
print(f"ok: agent_focus cleared for session {session_id}")
PYEOF
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        echo "error: unknown action '$ACTION' (try: status, update, contest, clear-contest, help)" >&2
        exit 1
        ;;
esac
