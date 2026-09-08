#!/usr/bin/env bash
# drift-anchor-capture.sh — UserPromptSubmit hook
#
# Captures user prompts to build a cumulative scope for drift detection,
# locked to a single conversation via the authoritative session_id from
# the hook payload. Downstream hooks (periodic, final, subagent-inject)
# read the same state file using the same session_id — the ONLY
# mechanism by which they find the right scope, so concurrent sessions
# in the same project cannot contaminate each other.
#
# Source of truth for the prompt is the UserPromptSubmit payload:
# Claude Code uses `user_prompt`; Codex uses `prompt`. The transcript is
# consulted only as a fallback for the session-resume-from-compaction case
# where the platform's prompt field arrives empty.
#
# All classification, sanitization, dedup, pivot detection, and self-
# heal of poisoned anchors live in `_drift_common.build_anchor_capture_mutator`
# so they can be unit-tested independently of the shell wrapper.
#
# INVARIANT (do not remove): every reminder emitted downstream of this
# hook begins with a stable first-line prefix (see DRIFT_README.md
# "Trust boundary of <system-reminder>"). Hooks that do not currently
# emit additionalContext MUST add the prefix the moment they start.
#
set -euo pipefail
export PYTHONDONTWRITEBYTECODE=1

INPUT=$(cat)
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="$HOOK_DIR${PYTHONPATH:+:$PYTHONPATH}"
DRIFT_ERR_LOG="${HOME}/.claude/drift-state/hook-errors.log"
mkdir -p "$(dirname "$DRIFT_ERR_LOG")" 2>/dev/null || true

python3 -c "
import sys, json, os
from _drift_common import (
    resolve_session,
    update_state,
    sweep_legacy_pointers,
    sanitize_user_prompt,
    build_anchor_capture_mutator,
)

data = json.loads(sys.stdin.read())
sweep_legacy_pointers()

resolved = resolve_session(data)
if resolved is None:
    sys.exit(0)
session_id, cwd, project_name, state_file = resolved

# Primary source: the platform-specific prompt field. Both are canonical,
# race-free, and free of the synthetic transcript entries (caveats,
# interrupt markers) that polluted the previous transcript-scraping approach.
raw_prompt = data.get('user_prompt') or data.get('prompt') or ''

# Fallback: the transcript. Only triggers when the prompt is absent
# (e.g. session resume from compaction). Iterates user-role entries,
# sanitizes harness markup, picks the most recent that retains
# substantive content. Synthetic markers and pure command blocks
# sanitize to empty and are skipped automatically.
if not raw_prompt.strip():
    transcript_path = data.get('transcript_path') or ''
    if transcript_path and os.path.exists(transcript_path):
        try:
            candidates = []
            with open(transcript_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                    except (json.JSONDecodeError, KeyError):
                        continue
                    msg = entry.get('message', {}) if isinstance(entry, dict) else {}
                    if msg.get('role') != 'user':
                        continue
                    content = msg.get('content', '')
                    if isinstance(content, list):
                        text_parts = []
                        for block in content:
                            if isinstance(block, dict) and block.get('type') == 'text':
                                text_parts.append(block.get('text', ''))
                            elif isinstance(block, str):
                                text_parts.append(block)
                        content = ' '.join(text_parts)
                    if not isinstance(content, str):
                        continue
                    if not sanitize_user_prompt(content):
                        continue
                    candidates.append(content)
            if candidates:
                raw_prompt = candidates[-1]
        except OSError:
            pass

mutator = build_anchor_capture_mutator(raw_prompt, cwd, project_name)
update_state(
    state_file=state_file,
    session_id=session_id,
    cwd=cwd,
    project_name=project_name,
    mutator=mutator,
    create_if_missing=True,
)
" <<< "$INPUT" 2>>"$DRIFT_ERR_LOG" || true

exit 0
