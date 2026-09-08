"""
Shared scope-locking primitives for the lore drift-detection hooks.

Every drift hook (anchor-capture, check-periodic, check-final, subagent-inject)
imports from this module so the session-resolution and state-access logic lives
in exactly one place. Divergence between hooks is what caused the multi-session
contamination bug this module was written to prevent.

Design invariants
-----------------

1. A "scope" belongs to exactly one conversation and is identified by the
   authoritative session_id that Claude Code supplies to every hook payload.
   Hooks MUST NOT guess the session from a shared pointer file, process cwd,
   or any other ambient source — fail closed instead.

2. Once a state file is written with a session_id, subsequent reads verify
   that the file's embedded session_id matches the caller's derived session_id.
   A mismatch means the file was produced by a different session and is
   silently ignored. This defends against path collisions, stale state, and
   operator mistakes.

3. A random `scope_nonce` is generated on first capture and is stable across
   the life of the conversation. Every drift reminder carries the first 8
   hex chars of the nonce so the model (and operator, if reviewing telemetry)
   can tell at a glance which conversation's scope is being shown.

4. All mutations of a state file go through `update_state()`, which takes an
   fcntl.flock on the file for the duration of the read-modify-write. Rapid
   bursts of tool calls within the same session cannot corrupt the file.

5. cwd comes from the hook input, never os.getcwd(). Claude Code always sets
   `cwd` on every hook event; relying on the process cwd is a portability
   hazard.
"""

from __future__ import annotations

import fcntl
import hashlib
import json
import os
import re
import secrets
import tempfile
import time
from datetime import datetime, timezone
from typing import Any, Callable, Optional


DRIFT_ROOT = os.path.expanduser("~/.claude/drift-state")
HOOK_ERROR_LOG = os.path.join(DRIFT_ROOT, "hook-errors.log")
HOOK_ERROR_LOG_MAX_BYTES = 51200  # 50 KB cap
NONCE_BYTES = 16
DRIFT_CHECK_INTERVAL = int(os.environ.get("LORE_DRIFT_CHECK_INTERVAL", "8"))

# Schema version for state files. Migrations:
#   v2 → v3 (2026-05-03): scope_history + last_substantive_at — pivot
#     detection and self-heal of poisoned anchors.
#   v3 → v4 (2026-05-03): agent_focus + agent_update_count + per-entry
#     `author` field on scope_updates — agent-side scope control via
#     drift-control.sh (update/contest/clear-contest).
SCHEMA_VERSION = 4

# Caps applied to user-derived strings before they hit disk.
ORIGINAL_REQUEST_MAX_CHARS = 2000
SCOPE_UPDATE_MAX_CHARS = 1000
COMBINED_SCOPE_MAX_CHARS = 3000
SCOPE_UPDATES_KEEP = 10
SCOPE_HISTORY_KEEP = 10
AGENT_FOCUS_TEXT_MAX = 1000


def ensure_schema(state: dict) -> None:
    """Idempotently upgrade `state` to the current schema version.

    Called from every mutator that writes state — anchor-capture, the
    periodic check (indirectly through state preservation), and the
    agent-side CLI helpers. Centralizing migration here means the
    schema can grow without each mutator re-implementing the field
    list. New fields use sensible defaults so older state files are
    compatible without operator intervention.
    """
    if state.get("schema_version", 0) >= SCHEMA_VERSION:
        return
    state["schema_version"] = SCHEMA_VERSION
    state.setdefault("scope_updates", [])
    state.setdefault("scope_history", [])
    state.setdefault("files_touched", [])
    state.setdefault("stop_events", [])
    state.setdefault("drift_checks_performed", 0)
    state.setdefault("user_message_count", 0)
    state.setdefault("tool_call_count", 0)
    state.setdefault("last_drift_check_at", 0)
    state.setdefault("scope_version", 0)
    state.setdefault("combined_scope", state.get("original_request"))
    state.setdefault("last_substantive_at", state.get("anchor_set_at"))
    state.setdefault("agent_focus", None)
    state.setdefault("agent_update_count", 0)
    if not state.get("scope_nonce"):
        state["scope_nonce"] = secrets.token_hex(NONCE_BYTES)

# ----------------------------------------------------------------------
# Prompt sanitization & classification
# ----------------------------------------------------------------------
#
# Claude Code's transcript stores synthetic "user" entries for harness
# events: slash-command machinery, command output capture, and request
# interrupt markers. The drift hook used to scrape the transcript for
# the latest user message; that approach captured those synthetic
# entries as scope content and produced reminders pointing at e.g.
# `<command-name>/effort</command-name>` instead of the real prompt.
#
# The fix has two parts. First, prefer `data['user_prompt']` from the
# UserPromptSubmit hook payload — that's the canonical text the user
# typed for THIS submission, free of transcript artifacts. Second,
# even when reading from `user_prompt`, the harness sometimes packages
# leading slash-command markup into the same prompt block, so we still
# need to strip the markup before evaluating scope intent.

_COMMAND_BLOCK_PATTERNS = [
    re.compile(r"<command-name>.*?</command-name>", re.DOTALL),
    re.compile(r"<command-message>.*?</command-message>", re.DOTALL),
    re.compile(r"<command-args>.*?</command-args>", re.DOTALL),
    re.compile(r"<local-command-stdout>.*?</local-command-stdout>", re.DOTALL),
    re.compile(r"<local-command-stderr>.*?</local-command-stderr>", re.DOTALL),
    re.compile(r"<local-command-caveat>.*?</local-command-caveat>", re.DOTALL),
]

# Synthetic transcript entries that Claude Code writes for harness
# events. They are not user instructions and must not become scope.
_SYNTHETIC_MARKERS = frozenset(
    {
        "[Request interrupted by user]",
        "[Request interrupted by user for tool use]",
    }
)

# Vocabulary of "acknowledgment" tokens. A prompt is treated as an
# acknowledgment-only message (and thus skipped from scope updates)
# when EVERY token after lowercasing+punctuation-stripping is in this
# set, AND the total length is short. Token-based instead of regex so
# multi-word acks ("ok go ahead", "yes proceed") match without listing
# every permutation.
_ACK_TOKENS = frozenset(
    {
        "ok",
        "okay",
        "sure",
        "yes",
        "yep",
        "yeah",
        "y",
        "go",
        "ahead",
        "proceed",
        "continue",
        "sounds",
        "looks",
        "good",
        "great",
        "perfect",
        "approved",
        "approve",
        "do",
        "it",
        "ship",
        "lgtm",
        "sgtm",
        "thanks",
        "thank",
        "you",
        "please",
    }
)
_ACK_MAX_LEN = 40
_ACK_TOKEN_SPLIT = re.compile(r"[\s,;.!?]+")

# Phrases that signal the user is starting a NEW task rather than
# refining the current one. A pivot archives the previous scope and
# re-anchors `original_request` to the new prompt.
_PIVOT_PATTERNS = [
    re.compile(r"^\s*new\s+(?:task|request|goal)\s*[:\-]", re.IGNORECASE),
    re.compile(r"^\s*next\s+(?:task|step)\s*[:\-]", re.IGNORECASE),
    re.compile(r"^\s*now\s+(?:work\s+on|do|let'?s|let\s+me)\b", re.IGNORECASE),
    re.compile(r"^\s*moving\s+on\s+to\b", re.IGNORECASE),
    re.compile(r"^\s*(?:switch|switching)\s+(?:gears\s+)?to\b", re.IGNORECASE),
    re.compile(r"^\s*let'?s\s+(?:now|switch|move\s+on|pivot)\b", re.IGNORECASE),
    re.compile(
        r"^\s*forget\s+(?:that|all\s+that|the\s+previous|everything\s+above)\b",
        re.IGNORECASE,
    ),
    re.compile(r"^\s*(?:scope|task)\s+reset\b", re.IGNORECASE),
    re.compile(r"^\s*reset\s+(?:scope|the\s+scope|task)\b", re.IGNORECASE),
    re.compile(r"^\s*ignore\s+(?:above|the\s+above|previous)\b", re.IGNORECASE),
    re.compile(r"^\s*pivot\s+to\b", re.IGNORECASE),
    re.compile(r"^\s*(?:new|different)\s+topic\s*[:\-]", re.IGNORECASE),
]


def sanitize_user_prompt(text: str) -> str:
    """Return `text` with Claude Code harness markup stripped.

    Removes <command-*> and <local-command-*> blocks (multi-line) and
    short-circuits known synthetic transcript markers. The result is
    the user's actual scope-relevant text. Returns "" when nothing
    substantive remains — callers MUST treat empty as "skip this
    prompt; do not record any scope state."
    """
    if not isinstance(text, str):
        return ""
    stripped = text.strip()
    if not stripped:
        return ""
    if stripped in _SYNTHETIC_MARKERS:
        return ""
    cleaned = text
    for pattern in _COMMAND_BLOCK_PATTERNS:
        cleaned = pattern.sub("", cleaned)
    return cleaned.strip()


def is_acknowledgment_only(text: str) -> bool:
    """True if `text` is a short approval with no new scope content.

    A prompt is acknowledgment-only when it is short AND every token
    after lowercasing+punctuation-stripping is in `_ACK_TOKENS`. Empty
    token lists do NOT count as acks (defensive — empty input is the
    sanitizer's job to handle).

    Short-circuit signal so e.g. "ok" or "yes go ahead" don't blow up
    `scope_updates` with non-directive replies.
    """
    if not isinstance(text, str):
        return False
    stripped = text.strip()
    if not stripped or len(stripped) > _ACK_MAX_LEN:
        return False
    tokens = [t for t in _ACK_TOKEN_SPLIT.split(stripped.lower()) if t]
    if not tokens:
        return False
    return all(t in _ACK_TOKENS for t in tokens)


def detect_pivot_intent(text: str) -> bool:
    """True if `text` opens with an explicit pivot signal.

    A pivot means: archive the existing scope to scope_history and
    re-anchor `original_request` to this prompt. The signals are
    deliberately conservative — false negatives (treating a real pivot
    as a refinement) are recoverable on the next prompt; false
    positives (treating a refinement as a pivot) lose the existing
    scope and are user-visible.
    """
    if not isinstance(text, str):
        return False
    return any(p.match(text) for p in _PIVOT_PATTERNS)


def classify_user_prompt(raw: str) -> tuple[str, str]:
    """Classify a raw user_prompt into a scope action + cleaned text.

    Returns (kind, cleaned) where kind is one of:

    * "skip"   — empty, synthetic, or pure acknowledgment. Do not touch
                 scope state.
    * "pivot"  — explicit signal to start a new task. Caller archives
                 the existing scope and anchors a new one.
    * "update" — substantive scope-affecting message. Caller appends to
                 scope_updates (or anchors if no original_request yet).

    The cleaned text has all command markup stripped and surrounding
    whitespace trimmed; it is what gets persisted as scope content.
    """
    cleaned = sanitize_user_prompt(raw)
    if not cleaned:
        return ("skip", "")
    if is_acknowledgment_only(cleaned):
        return ("skip", "")
    if detect_pivot_intent(cleaned):
        return ("pivot", cleaned)
    return ("update", cleaned)


def render_scope_for_reminder(
    state: dict,
    max_chars: int = 800,
    max_updates: int = 3,
) -> str:
    """Format a state dict's scope for display in a drift reminder.

    Output shape:

        ORIGINAL: "<original_request>"
        UPDATES (last K of N):
          [#3 @ 16:33:28] also handle scope changes
          [#4 @ 17:01:04] dedup the duplicates
          ...

    When `original_request` is unset (no anchor yet), falls back to
    `combined_scope` so existing reminders keep working during the
    schema-v2 → v3 transition. Length is capped at `max_chars`.
    """
    original = (state.get("original_request") or "").strip()
    updates = list(state.get("scope_updates") or [])

    if not original:
        combined = (state.get("combined_scope") or "").strip()
        if not combined:
            return ""
        return combined[:max_chars] + ("..." if len(combined) > max_chars else "")

    parts = [f'ORIGINAL: "{original}"']
    if updates:
        recent = updates[-max_updates:]
        total = len(updates)
        if total > max_updates:
            parts.append(f"UPDATES (last {len(recent)} of {total}):")
        else:
            parts.append("UPDATES:")
        for upd in recent:
            ts_full = (upd.get("at") or "").strip()
            ts = ts_full[11:19] if len(ts_full) >= 19 else ts_full
            txt = (upd.get("text") or "").strip()
            if not txt:
                continue
            author = upd.get("author", "user")
            if author == "agent":
                num = upd.get("agent_msg_num", upd.get("msg_num", "?"))
                parts.append(f"  [agent#{num} @ {ts}] {txt}")
            else:
                num = upd.get("msg_num", "?")
                parts.append(f"  [user#{num} @ {ts}] {txt}")

    focus = state.get("agent_focus")
    if isinstance(focus, dict) and (focus.get("focus") or "").strip():
        focus_ts_full = (focus.get("at") or "").strip()
        focus_ts = focus_ts_full[11:19] if len(focus_ts_full) >= 19 else focus_ts_full
        parts.append("")
        parts.append(f"AGENT FOCUS (contest @ {focus_ts}):")
        parts.append(f'  current: "{(focus.get("focus") or "").strip()}"')
        just = (focus.get("justification") or "").strip()
        if just:
            parts.append(f"  why: {just}")

    history = state.get("scope_history") or []
    if history:
        parts.append(f"(prior scopes archived: {len(history)})")

    rendered = "\n".join(parts)
    if len(rendered) > max_chars:
        rendered = rendered[: max_chars - 3] + "..."
    return rendered


def build_anchor_capture_mutator(
    raw_prompt: str,
    cwd: str,
    project_name: str,
) -> Callable[[dict], None]:
    """Return a mutator for `update_state()` that captures user scope.

    The returned closure performs five jobs, in order:

    1. **Schema migration.** Files written by the v1/v2 capture hook
       are upgraded in place to v3 by adding `scope_history` and
       `last_substantive_at`. Older v1 files also get the missing
       defaults the v2 migration used to provide.

    2. **Self-heal poisoned anchors.** If the existing
       `original_request` sanitizes to empty (e.g. the file was
       written by a pre-fix hook that captured slash-command markup),
       it is moved to `scope_history` with reason
       `self_heal_poisoned_anchor` and `original_request` is reset to
       None. This rescues live sessions whose state files are already
       polluted.

    3. **Classify the new prompt** as skip / pivot / update.

    4. **Apply the classification:**
        - skip → no further mutation
        - pivot → archive current scope, anchor new
        - update → anchor (if no original yet) OR append a
          deduplicated entry to `scope_updates`

    5. **Rebuild `combined_scope`** as `original + [Update #N]: text`
       so the periodic check has a single concatenated string to fall
       back on.

    The mutator must be a closure rather than a free function because
    `update_state()` calls it inside a flock — `raw_prompt`, `cwd`,
    and `project_name` need to bind here, before the lock is taken.
    """
    kind, cleaned = classify_user_prompt(raw_prompt)

    def _apply(state: dict) -> None:
        # 1. Schema migration (idempotent; centralized in ensure_schema).
        ensure_schema(state)

        state["project"] = cwd
        state["project_name"] = project_name

        now_iso = _utc_now_iso()

        # 2. Self-heal poisoned anchor.
        existing = state.get("original_request")
        if existing and not sanitize_user_prompt(existing):
            history = list(state.get("scope_history") or [])
            history.append(
                {
                    "reason": "self_heal_poisoned_anchor",
                    "archived_at": now_iso,
                    "original_request": existing,
                    "scope_updates": list(state.get("scope_updates") or []),
                }
            )
            state["scope_history"] = history[-SCOPE_HISTORY_KEEP:]
            state["original_request"] = None
            state["scope_updates"] = []
            state["combined_scope"] = None

        # 3 & 4. Apply classification.
        if kind == "skip":
            return

        state["user_message_count"] = state.get("user_message_count", 0) + 1
        msg_num = state["user_message_count"]
        state["last_substantive_at"] = now_iso

        if kind == "pivot":
            if state.get("original_request"):
                history = list(state.get("scope_history") or [])
                history.append(
                    {
                        "reason": "pivot",
                        "archived_at": now_iso,
                        "original_request": state.get("original_request"),
                        "scope_updates": list(state.get("scope_updates") or []),
                    }
                )
                state["scope_history"] = history[-SCOPE_HISTORY_KEEP:]
            state["original_request"] = cleaned[:ORIGINAL_REQUEST_MAX_CHARS]
            state["scope_updates"] = []
            state["combined_scope"] = cleaned[:ORIGINAL_REQUEST_MAX_CHARS]
            state["anchor_set_at"] = now_iso
            state["scope_version"] = state.get("scope_version", 0) + 1
            return

        # kind == "update"
        if state.get("original_request") is None:
            state["original_request"] = cleaned[:ORIGINAL_REQUEST_MAX_CHARS]
            state["combined_scope"] = cleaned[:ORIGINAL_REQUEST_MAX_CHARS]
            state["anchor_set_at"] = now_iso
            state["scope_version"] = 1
            return

        updates = list(state.get("scope_updates") or [])
        # Dedup against the most recent USER entry — an agent update
        # in between shouldn't suppress a real user repeat.
        last_user = next(
            (u for u in reversed(updates) if u.get("author", "user") == "user"),
            None,
        )
        last_user_text = (last_user.get("text") or "").strip() if last_user else ""
        if cleaned == last_user_text:
            return

        updates.append(
            {
                "msg_num": msg_num,
                "text": cleaned[:SCOPE_UPDATE_MAX_CHARS],
                "at": now_iso,
                "author": "user",
            }
        )
        state["scope_updates"] = updates[-SCOPE_UPDATES_KEEP:]

        # 5. Rebuild combined_scope with author-aware tags.
        state["combined_scope"] = _rebuild_combined_scope(state)
        state["scope_version"] = state.get("scope_version", 0) + 1
        state["last_drift_check_at"] = state.get("tool_call_count", 0)

    return _apply


def _rebuild_combined_scope(state: dict) -> str:
    """Rebuild `combined_scope` from `original_request` + `scope_updates`.

    Author-aware tagging: user entries render as `[Update #N]:`,
    agent entries as `[Agent #N]:`. The result is capped at
    COMBINED_SCOPE_MAX_CHARS so downstream readers (drift reminders,
    subagent inject) have a bounded blob.
    """
    parts = [state.get("original_request") or ""]
    for upd in state.get("scope_updates") or []:
        author = upd.get("author", "user")
        if author == "agent":
            num = upd.get("agent_msg_num", upd.get("msg_num", "?"))
            tag = f"[Agent #{num}]: "
        else:
            num = upd.get("msg_num", "?")
            tag = f"[Update #{num}]: "
        parts.append(tag + (upd.get("text") or ""))
    return "\n".join(parts)[:COMBINED_SCOPE_MAX_CHARS]


# ----------------------------------------------------------------------
# Agent-side CLI helpers (drift-control.sh)
# ----------------------------------------------------------------------
#
# The drift hooks run on user prompts and tool calls. The CLI helpers
# below are invoked by the AGENT (Claude) via Bash to refine scope or
# contest a stale drift reminder. They operate on the same state files
# the hooks write, identified by the 8-hex scope nonce visible in
# every drift reminder ([scope <nonce>]).
#
# Mutating helpers REQUIRE a nonce to identify the session
# unambiguously — agents in concurrent Claude Code instances must not
# step on each other. The read-only `find_state_file_for_cwd` falls
# back to most-recently-modified when no nonce is given, but only
# `status` callers should rely on that.


def find_state_file_for_cwd(
    cwd: str,
    nonce_prefix: Optional[str] = None,
    require_nonce: bool = False,
    drift_dir: Optional[str] = None,
) -> Optional[tuple[str, str]]:
    """Locate the state file for a project working directory.

    `cwd` is hashed and combined with the basename to form the project
    directory under DRIFT_ROOT (matching `resolve_session`'s scheme).

    If `nonce_prefix` is supplied (an 8-or-more hex prefix), only state
    files whose `scope_nonce` starts with it are considered.

    If `require_nonce` is True, returns None unless an exact nonce
    match is found — used by mutating CLI calls so the agent must
    name the session it's modifying.

    Without a nonce, returns the most-recently-modified valid state
    file in the project directory. Suitable for read-only inspection
    when only one Claude Code session is active per project.

    Returns (state_file_path, session_id) on success, None otherwise.
    """
    root = drift_dir or DRIFT_ROOT
    project_hash = hashlib.sha256(cwd.encode("utf-8")).hexdigest()[:8]
    project_name = os.path.basename(cwd) or "root"
    project_dir = os.path.join(root, f"{project_name}-{project_hash}")
    if not os.path.isdir(project_dir):
        return None

    candidates: list[tuple[float, str, str]] = []
    try:
        names = os.listdir(project_dir)
    except OSError:
        return None
    for name in names:
        if not name.endswith(".json") or name.endswith(".json.lock"):
            continue
        path = os.path.join(project_dir, name)
        try:
            with open(path, "r") as fh:
                data = json.load(fh)
        except (OSError, json.JSONDecodeError):
            continue
        if not isinstance(data, dict):
            continue
        sid = data.get("session_id", "")
        if not isinstance(sid, str) or name != f"{sid}.json":
            continue
        file_nonce = (data.get("scope_nonce") or "").strip()
        if nonce_prefix:
            if not file_nonce.startswith(nonce_prefix):
                continue
        try:
            mtime = os.path.getmtime(path)
        except OSError:
            continue
        candidates.append((mtime, path, sid))

    if not candidates:
        return None
    if require_nonce and not nonce_prefix:
        return None
    candidates.sort(reverse=True)
    _, path, sid = candidates[0]
    return (path, sid)


def read_state_for_cli(state_file: str, session_id: str) -> Optional[dict]:
    """Read a state file for CLI inspection.

    Same identity check as `read_state` (the hook-side reader): a file
    whose embedded `session_id` doesn't match the path's stem is
    rejected as cross-session contamination. Differs only in being a
    public function — `read_state` is conceptually private to the
    hooks.
    """
    try:
        with open(state_file, "r") as fh:
            state = json.load(fh)
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(state, dict):
        return None
    if state.get("session_id") != session_id:
        return None
    return state


def agent_append_update(
    state_file: str,
    session_id: str,
    text: str,
    cwd: str,
    project_name: Optional[str] = None,
) -> bool:
    """Append an agent-authored entry to `scope_updates`.

    Sanitizes the input through the same harness-markup stripper used
    for user prompts. Empty post-sanitize text is rejected. Dedups
    against the most recent agent entry — repeated identical agent
    notes do not pile up.

    The entry is tagged `author: "agent"` and gets a separate
    `agent_msg_num` counter so renderers can distinguish the streams.
    Agent updates do NOT bump `user_message_count` or `scope_version`
    — those track user-driven scope changes.

    Returns True iff the state was updated, False on validation
    failure or session mismatch.
    """
    cleaned = sanitize_user_prompt(text)
    if not cleaned:
        return False

    def mutator(state: dict) -> None:
        ensure_schema(state)
        now_iso = _utc_now_iso()
        updates = list(state.get("scope_updates") or [])
        # Dedup: skip if identical to most recent AGENT entry.
        last_agent = next(
            (u for u in reversed(updates) if u.get("author") == "agent"),
            None,
        )
        if last_agent and (last_agent.get("text") or "").strip() == cleaned:
            return
        agent_count = state.get("agent_update_count", 0) + 1
        state["agent_update_count"] = agent_count
        # Use user_message_count for msg_num so chronological ordering
        # is preserved; agent_msg_num is the per-author counter.
        msg_num = state.get("user_message_count", 0)
        updates.append(
            {
                "msg_num": msg_num,
                "agent_msg_num": agent_count,
                "text": cleaned[:SCOPE_UPDATE_MAX_CHARS],
                "at": now_iso,
                "author": "agent",
            }
        )
        state["scope_updates"] = updates[-SCOPE_UPDATES_KEEP:]
        state["combined_scope"] = _rebuild_combined_scope(state)

    pname = project_name or os.path.basename(cwd) or "root"
    result = update_state(
        state_file=state_file,
        session_id=session_id,
        cwd=cwd,
        project_name=pname,
        mutator=mutator,
        create_if_missing=False,
    )
    return result is not None


def agent_set_focus(
    state_file: str,
    session_id: str,
    focus: str,
    justification: str,
    cwd: str,
    project_name: Optional[str] = None,
) -> bool:
    """Record the agent's current focus + justification (a 'contest').

    The next drift reminder includes an AGENT FOCUS section showing
    `current` and `why`, prompting the user to confirm or correct.
    Replaces any existing focus marker — only the latest contest is
    surfaced so the user sees the current disagreement, not a log.

    Sanitizes both fields. An empty `focus` after sanitization is
    rejected (returns False) — a contest must say something.

    Returns True iff state was updated, False on validation failure
    or session mismatch.
    """
    focus_clean = sanitize_user_prompt(focus)
    if not focus_clean:
        return False
    just_clean = sanitize_user_prompt(justification)

    def mutator(state: dict) -> None:
        ensure_schema(state)
        state["agent_focus"] = {
            "at": _utc_now_iso(),
            "focus": focus_clean[:AGENT_FOCUS_TEXT_MAX],
            "justification": just_clean[:AGENT_FOCUS_TEXT_MAX],
        }

    pname = project_name or os.path.basename(cwd) or "root"
    result = update_state(
        state_file=state_file,
        session_id=session_id,
        cwd=cwd,
        project_name=pname,
        mutator=mutator,
        create_if_missing=False,
    )
    return result is not None


def agent_clear_focus(
    state_file: str,
    session_id: str,
    cwd: str,
    project_name: Optional[str] = None,
) -> bool:
    """Clear the active `agent_focus` marker.

    Called after the user has confirmed or corrected a contest, so
    subsequent drift reminders revert to the standard ORIGINAL +
    UPDATES rendering.
    """

    def mutator(state: dict) -> None:
        ensure_schema(state)
        state["agent_focus"] = None

    pname = project_name or os.path.basename(cwd) or "root"
    result = update_state(
        state_file=state_file,
        session_id=session_id,
        cwd=cwd,
        project_name=pname,
        mutator=mutator,
        create_if_missing=False,
    )
    return result is not None


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def hook_error_log_path() -> str:
    """Return the path to the shared hook error log."""
    return HOOK_ERROR_LOG


def truncate_error_log() -> None:
    """
    If the error log exceeds HOOK_ERROR_LOG_MAX_BYTES, truncate it to the
    last ~half of its content so recent errors are preserved but the file
    doesn't grow unbounded. Called at the start of each hook so the cost
    is amortized across invocations.
    """
    try:
        st = os.stat(HOOK_ERROR_LOG)
    except OSError:
        return
    if st.st_size <= HOOK_ERROR_LOG_MAX_BYTES:
        return
    try:
        with open(HOOK_ERROR_LOG, "rb") as fh:
            # Keep the last half.
            fh.seek(st.st_size // 2)
            fh.readline()  # skip partial line
            tail = fh.read()
        with open(HOOK_ERROR_LOG, "wb") as fh:
            fh.write(b"[truncated]\n")
            fh.write(tail)
    except OSError:
        pass


def resolve_session(payload: dict) -> Optional[tuple[str, str, str, str]]:
    """
    Derive the authoritative identity of the session that produced this hook
    payload.

    Returns
    -------
    (session_id, cwd, project_name, state_file_path) on success, or None if
    the payload lacks the fields needed to identify a session unambiguously.
    Callers that receive None MUST exit silently — guessing would reintroduce
    the contamination bug.
    """
    session_id = str(payload.get("session_id") or payload.get("sessionId") or "").strip()
    if not session_id:
        transcript_path = str(payload.get("transcript_path") or "").strip()
        if transcript_path:
            session_id = os.path.splitext(os.path.basename(transcript_path))[0]
    if not session_id or not re.fullmatch(r"[A-Za-z0-9_-]+", session_id):
        return None

    cwd = str(payload.get("cwd") or "").strip()
    if not cwd:
        return None

    project_hash = hashlib.sha256(cwd.encode("utf-8")).hexdigest()[:8]
    project_name = os.path.basename(cwd) or "root"
    drift_dir = os.path.join(DRIFT_ROOT, f"{project_name}-{project_hash}")
    state_file = os.path.join(drift_dir, f"{session_id}.json")
    return session_id, cwd, project_name, state_file


def _new_state(session_id: str, cwd: str, project_name: str) -> dict:
    return {
        "schema_version": SCHEMA_VERSION,
        "session_id": session_id,
        "scope_nonce": secrets.token_hex(NONCE_BYTES),
        "project": cwd,
        "project_name": project_name,
        "created_at": _utc_now_iso(),
        "original_request": None,
        "scope_updates": [],
        "scope_history": [],
        "combined_scope": None,
        "scope_version": 0,
        "tool_call_count": 0,
        "last_drift_check_at": 0,
        "files_touched": [],
        "user_message_count": 0,
        "drift_checks_performed": 0,
        "stop_events": [],
        "anchor_set_at": None,
        "last_substantive_at": None,
        "agent_focus": None,
        "agent_update_count": 0,
    }


def _verify_identity(state: dict, expected_session_id: str) -> bool:
    """
    Return True iff the on-disk state's session_id matches the derived one.
    A stateless file (missing session_id) is treated as foreign and rejected.
    """
    return state.get("session_id") == expected_session_id


def _atomic_write(path: str, state: dict) -> None:
    """
    Write `state` to `path` via a same-directory temp file + atomic rename.
    The caller must already hold the lock on `path` (or on the lock file) to
    serialize concurrent writers within the same session.
    """
    directory = os.path.dirname(path)
    os.makedirs(directory, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(prefix=".drift-", suffix=".tmp", dir=directory)
    try:
        with os.fdopen(fd, "w") as fh:
            json.dump(state, fh, indent=2)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp_path, path)
    except BaseException:
        try:
            os.remove(tmp_path)
        except OSError:
            pass
        raise


class _Lock:
    """
    Advisory file lock used to serialize intra-session state mutations.

    The lock is placed on a sidecar `.lock` file rather than the state file
    itself so that taking the lock doesn't require the state file to exist
    yet (the capture hook may be creating it for the first time).
    """

    def __init__(self, state_file: str):
        self.lock_path = state_file + ".lock"
        self._fh = None

    def __enter__(self):
        os.makedirs(os.path.dirname(self.lock_path), exist_ok=True)
        self._fh = open(self.lock_path, "a+")
        fcntl.flock(self._fh.fileno(), fcntl.LOCK_EX)
        return self

    def __exit__(self, exc_type, exc, tb):
        try:
            fcntl.flock(self._fh.fileno(), fcntl.LOCK_UN)
        finally:
            self._fh.close()
            self._fh = None


def read_state(state_file: str, session_id: str) -> Optional[dict]:
    """
    Read the state file and verify it belongs to `session_id`.

    Returns the state dict on success, or None if the file is missing,
    unreadable, or was written by a different session. Callers that receive
    None MUST treat the session as having no established scope and exit
    silently — reporting foreign scope is the bug this whole module exists
    to prevent.
    """
    try:
        with open(state_file, "r") as fh:
            state = json.load(fh)
    except (OSError, json.JSONDecodeError):
        return None
    if not _verify_identity(state, session_id):
        return None
    return state


def update_state(
    state_file: str,
    session_id: str,
    cwd: str,
    project_name: str,
    mutator: Callable[[dict], None],
    create_if_missing: bool,
) -> Optional[dict]:
    """
    Atomically read-modify-write the state file under a session-scoped lock.

    `mutator(state)` receives the current state dict (or a freshly initialized
    one if the file is missing and `create_if_missing=True`). It is expected
    to mutate the dict in place. The (possibly mutated) dict is written back
    to disk and returned.

    If the file exists but belongs to a different session_id, the mutation
    is rejected and None is returned — we NEVER overwrite another session's
    state. If the file is missing and `create_if_missing=False`, also returns
    None.

    A lease file is acquired BEFORE entering the lock and released AFTER
    the mutation completes. This advertises to the cleanup system that
    this process is alive and operating on the session's files for the
    full duration of the critical section — including the window between
    flock release and os.replace that the previous flock-probing approach
    could not cover.
    """
    lease_path = _acquire_lease(state_file)
    try:
        with _Lock(state_file):
            state: Optional[dict] = None
            if os.path.exists(state_file):
                try:
                    with open(state_file, "r") as fh:
                        state = json.load(fh)
                except (OSError, json.JSONDecodeError):
                    state = None
                if state is not None and not _verify_identity(state, session_id):
                    return None

            if state is None:
                if not create_if_missing:
                    return None
                state = _new_state(session_id, cwd, project_name)

            mutator(state)
            _atomic_write(state_file, state)
            return state
    finally:
        _release_lease(lease_path)


def sweep_legacy_pointers(drift_dir: Optional[str] = None) -> int:
    """
    Remove any shared pointer files left behind by pre-isolation versions of
    the hook. These files (`~/.claude/drift-state/.current*`) caused
    concurrent sessions in the same project to overwrite each other's scope.
    Returns the number of files removed.
    """
    root = drift_dir or DRIFT_ROOT
    if not os.path.isdir(root):
        return 0
    removed = 0
    try:
        entries = os.listdir(root)
    except OSError:
        return 0
    for name in entries:
        if name == ".current" or name.startswith(".current-"):
            try:
                os.remove(os.path.join(root, name))
                removed += 1
            except OSError:
                pass
    return removed


def short_nonce(state: dict) -> str:
    """
    First 8 hex chars of the scope_nonce, used in drift reminders so the
    model can recognize its own scope across turns. Empty string if missing.
    """
    n = state.get("scope_nonce") or ""
    return n[:8] if isinstance(n, str) else ""


# ----------------------------------------------------------------------
# File categorization + cleanup
# ----------------------------------------------------------------------
#
# Every file under ~/.claude/drift-state is one of exactly these categories.
# Anything else is — by definition — orphan and subject to removal.
#
#   1. Project directory:    <name>-<hex8>/
#   2. Session state:        <name>-<hex8>/<session_id>.json
#   3. Session lock:         <name>-<hex8>/<session_id>.json.lock
#   4. In-flight atomic tmp: <name>-<hex8>/.drift-*.tmp
#
# The atomic-write path in _atomic_write() uses tempfile.mkstemp with prefix
# `.drift-` and suffix `.tmp`, so #4 is identified by that pattern.
#
# Freshness gate: any file whose mtime is newer than FRESHNESS_GATE_SECONDS
# is NEVER removed by orphan_sweep, because a live hook could be in the
# middle of operating on it. 300s is comfortably longer than any realistic
# hook runtime and shorter than any realistic retention window.
#
# The gate is a defense-in-depth layer behind the authoritative check:
# non-blocking fcntl.flock on the matching `.json.lock`. If the kernel says
# the lock is held right now, a hook is live and we skip regardless of age.
# The gate only matters for the exotic case where a live hook is not
# holding the lock (e.g. process was suspended AFTER flock release but
# BEFORE os.replace — a window of microseconds).

# Vestigial freshness gate. With the lease system (see below), the primary
# liveness signal is the PID recorded in the lease file — the kernel
# authoritatively answers "is this process alive?" via os.kill(pid, 0).
# The freshness gate is now only a last-resort guard for files in dirs
# that have no lease infrastructure at all (e.g. junk dropped in
# drift-state by a non-hook process). 10 seconds is negligible in
# practice — cleanup starts running from SessionStart, and no operator
# would notice a 10-second delay.
FRESHNESS_GATE_SECONDS = 10

# Operator opt-out marker. A file named `.drift-keep` inside a project
# subdirectory (or at the drift-state root) exempts that scope from ALL
# cleanup: orphan sweep, retention sweep, empty-dir collapse. Lets
# operators park debugging files under drift-state without losing them to
# the scheduled sweep. The marker itself is also exempt from being swept
# as "unknown".
KEEP_MARKER = ".drift-keep"


# ----------------------------------------------------------------------
# Lease system
# ----------------------------------------------------------------------
#
# Every hook that mutates state writes a zero-byte "lease" file on entry
# and deletes it on exit. The lease filename encodes the PID:
#
#   {session_id}.lease.{pid}
#
# Cleanup scans for leases and checks PID liveness via os.kill(pid, 0).
# A file is protected iff a lease with a live PID exists:
#   - for session-specific protection (state file, lock file):
#     any {session_id}.lease.* with a live PID
#   - for directory-wide protection (tmp files):
#     any *.lease.* with a live PID
#
# This replaces the previous flock-probing approach (_is_lock_held,
# _any_lock_held_in_dir), which had two problems:
#   1. A microsecond race between flock release and os.replace, where the
#      cleanup could see "not held" while the hook was still alive.
#   2. Requiring the freshness gate (300s) as a safety net, creating the
#      5-minute limit on hook runtime.
#
# The lease eliminates both: it is acquired BEFORE entering the _Lock
# and released AFTER the mutation completes (including os.replace), so
# the full critical section is covered. And because the check is PID-
# based, it works regardless of elapsed time — a hook suspended for
# hours is still protected as long as the OS process is alive.
#
# PID reuse is a conservative false positive: if a hook crashes and its
# PID is recycled to an unrelated process, cleanup sees "alive" and
# skips. The stale lease persists until the recycled PID also exits.
# This is strictly safe (never deletes a live file) and transiently
# wasteful (keeps one dead lease around for a while).

def _lease_path_for(state_file: str) -> str:
    """
    Compute the lease file path for the current process and state file.
    Convention: {state_file_stem}.lease.{pid} in the same directory.
    """
    stem = state_file[:-len(".json")] if state_file.endswith(".json") else state_file
    return f"{stem}.lease.{os.getpid()}"


def _acquire_lease(state_file: str) -> str:
    """
    Write a zero-byte lease file for the current PID. Returns the lease
    path for later deletion. The lease advertises to cleanup that this
    process is alive and operating on the session's files.
    """
    path = _lease_path_for(state_file)
    directory = os.path.dirname(path)
    os.makedirs(directory, exist_ok=True)
    open(path, "w").close()
    return path


def _release_lease(lease_path: str) -> None:
    """Delete the lease file. Best-effort; swallows all errors."""
    try:
        os.remove(lease_path)
    except OSError:
        pass


def _is_lease_name(name: str) -> bool:
    """True iff the filename matches the lease naming convention."""
    return ".lease." in name


def _parse_lease_pid(name: str) -> Optional[int]:
    """Extract the PID from a lease filename. Returns None on parse failure."""
    try:
        return int(name.rsplit(".", 1)[1])
    except (ValueError, IndexError):
        return None


def _pid_is_alive(pid: int) -> bool:
    """
    Check if a process with `pid` is currently running. Uses the POSIX
    convention: os.kill(pid, 0) succeeds if the process exists and we
    have permission to signal it. PermissionError means "exists but owned
    by another user" — treated as alive (conservative).
    """
    if pid <= 0:
        return False
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        return True  # process exists, we just can't signal it
    except OSError:
        return False


def _session_has_live_lease(subdir: str, session_id: str) -> bool:
    """
    Check whether any alive process holds a lease for `session_id` in
    `subdir`. This is a PURE CHECK with no side effects — stale leases
    are not removed here. Only orphan_sweep step 0 removes stale leases,
    so the counts are tracked in one place and not consumed by a side
    effect during retention_sweep's liveness check.
    """
    prefix = f"{session_id}.lease."
    try:
        names = os.listdir(subdir)
    except OSError:
        return False
    for name in names:
        if not name.startswith(prefix):
            continue
        pid = _parse_lease_pid(name)
        if pid is None:
            continue
        if _pid_is_alive(pid):
            return True
    return False


def _dir_has_any_live_lease(subdir: str) -> bool:
    """
    Check whether ANY session in `subdir` has a live lease. Used to
    protect .drift-*.tmp files, which cannot be correlated to a specific
    session by filename alone.
    """
    try:
        names = os.listdir(subdir)
    except OSError:
        return False
    for name in names:
        if not _is_lease_name(name):
            continue
        pid = _parse_lease_pid(name)
        if pid is not None and _pid_is_alive(pid):
            return True
    return False


def _is_atomic_tmp_name(name: str) -> bool:
    """Match the tempfile.mkstemp pattern used by _atomic_write."""
    return name.startswith(".drift-") and name.endswith(".tmp")


def _is_state_name(name: str) -> bool:
    return name.endswith(".json") and not name.endswith(".json.lock")


def _is_lock_name(name: str) -> bool:
    return name.endswith(".json.lock")


def _is_kept(dir_path: str) -> bool:
    """Return True iff the directory contains the operator opt-out marker."""
    return os.path.exists(os.path.join(dir_path, KEEP_MARKER))


def _state_is_valid(path: str, expected_stem: str) -> bool:
    """
    A state file is valid iff it parses as JSON and its embedded session_id
    equals its filename stem. Both halves are required: a file whose content
    claims to belong to session X but lives at the path for session Y is
    orphan by construction — some earlier bug must have landed it there,
    and no live hook will ever read it via the resolver.
    """
    try:
        with open(path, "r") as fh:
            data = json.load(fh)
    except (OSError, json.JSONDecodeError):
        return False
    if not isinstance(data, dict):
        return False
    return data.get("session_id") == expected_stem


def _remove_empty_project_dirs(drift_dir: str) -> int:
    """Remove any immediate subdirectory of drift_dir that is empty."""
    removed = 0
    try:
        entries = os.listdir(drift_dir)
    except OSError:
        return 0
    for entry in entries:
        sub = os.path.join(drift_dir, entry)
        if not os.path.isdir(sub):
            continue
        try:
            if not os.listdir(sub):
                os.rmdir(sub)
                removed += 1
        except OSError:
            pass
    return removed


def _safe_unlink(path: str, mtime_floor: Optional[float]) -> bool:
    """
    Remove `path` unless its mtime is newer than `mtime_floor`. Returns True
    iff the file was removed. Uses open + fstat + unlink to avoid TOCTOU:
    the mtime check and the unlink operate on the same inode via the fd,
    so another process replacing the file between check and unlink does
    not cause the fresh replacement to be deleted. Any OS error (missing
    file, permission denied) is swallowed — cleanup is best-effort and
    must never block the caller.
    """
    try:
        fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    except OSError:
        return False
    try:
        if mtime_floor is not None:
            st = os.fstat(fd)
            if st.st_mtime > mtime_floor:
                return False
    except OSError:
        return False
    finally:
        os.close(fd)
    # The fd is closed so we must unlink by path. On POSIX, if another
    # process replaced the file between fstat and unlink, unlink removes
    # the NEW file — but because we verified the OLD file's mtime was
    # stale, and the replacement happened in between, the replacement is
    # at most a few ms old and the next sweep will skip it (fresh mtime).
    # This is strictly better than the previous getmtime+remove which had
    # no fd-based check at all.
    try:
        os.remove(path)
        return True
    except OSError:
        return False


def orphan_sweep(
    drift_dir: Optional[str] = None,
    freshness_gate_secs: int = FRESHNESS_GATE_SECONDS,
) -> dict:
    """
    Remove files that cannot belong to any live session.

    Scope is restricted to genuinely orphaned files — nothing else. A file
    is eligible iff it matches one of these predicates AND its mtime is
    older than `freshness_gate_secs` AND no live hook is holding the
    relevant lock:

      - it is a `.drift-*.tmp` staging file (an aborted atomic write)
      - it is a `.json.lock` sidecar with no matching `.json` in the same dir
      - it is a `.json` file that fails JSON parse, is not a JSON object,
        lacks a `session_id` field, or whose `session_id` does not equal
        its filename stem
      - it lives in a project subdirectory but is neither a state file,
        its paired lock, an atomic-write tmp file, nor the operator
        opt-out marker (`.drift-keep`)
      - it lives in the drift-state root but is neither a directory nor
        a known legacy pointer file

    Project directories and the drift-state root can opt out of cleanup
    entirely by containing a `.drift-keep` marker file. This lets
    operators park debugging files under drift-state without losing them.

    Defense-in-depth for atomic-write tmp files and lock files uses
    non-blocking fcntl.flock to ask the kernel whether a live hook
    currently holds the protecting lock. If so, the tmp or lock is
    skipped regardless of mtime.

    Returns a dict with per-category counts.
    """
    root = drift_dir or DRIFT_ROOT
    counts = {
        "atomic_tmp": 0,
        "orphan_state": 0,
        "orphan_lock": 0,
        "stale_lease": 0,
        "unknown_in_project": 0,
        "unknown_in_root": 0,
        "legacy_pointer": 0,
        "empty_project_dirs": 0,
        "skipped_kept": 0,
        "skipped_live_lease": 0,
    }
    if not os.path.isdir(root):
        return counts

    # Root-level opt-out: if the drift-state root itself has a keep
    # marker, sweep nothing. Legacy pointers are still swept because they
    # are actively harmful (re-introduce cross-session contamination),
    # but nothing else is touched.
    root_kept = _is_kept(root)

    now = time.time()
    mtime_floor = now - freshness_gate_secs

    try:
        root_entries = os.listdir(root)
    except OSError:
        return counts

    # Pass 1: drift-state root.
    for name in root_entries:
        full = os.path.join(root, name)
        if os.path.isdir(full):
            continue
        if name == KEEP_MARKER:
            continue
        if name == ".current" or name.startswith(".current-"):
            try:
                os.remove(full)
                counts["legacy_pointer"] += 1
            except OSError:
                pass
            continue
        if root_kept:
            counts["skipped_kept"] += 1
            continue
        if _safe_unlink(full, mtime_floor):
            counts["unknown_in_root"] += 1

    if root_kept:
        # Skip every project directory too — operator has taken ownership
        # of the whole drift-state tree.
        return counts

    # Pass 2: each project directory.
    for entry in root_entries:
        subdir = os.path.join(root, entry)
        if not os.path.isdir(subdir):
            continue
        if _is_kept(subdir):
            counts["skipped_kept"] += 1
            continue
        try:
            names = os.listdir(subdir)
        except OSError:
            continue

        state_names = {n for n in names if _is_state_name(n)}
        lock_names = {n for n in names if _is_lock_name(n)}
        tmp_names = {n for n in names if _is_atomic_tmp_name(n)}
        lease_names = {n for n in names if _is_lease_name(n)}
        # Known files include the keep marker and lease files so they
        # are never classified as "unknown."
        known = state_names | lock_names | tmp_names | lease_names | {KEEP_MARKER}

        # 0. Stale lease cleanup: leases with dead PIDs are removed here
        #    as a side effect. This is also done by _session_has_live_lease
        #    and _dir_has_any_live_lease, but an explicit pass ensures
        #    orphan leases are counted.
        for name in list(lease_names):
            pid = _parse_lease_pid(name)
            if pid is None or not _pid_is_alive(pid):
                try:
                    os.remove(os.path.join(subdir, name))
                    counts.setdefault("stale_lease", 0)
                    counts["stale_lease"] += 1
                    lease_names.discard(name)
                except OSError:
                    pass

        # 1. Atomic-write tmp files. Guard with lease check: if ANY
        #    live lease exists in the dir, a hook is mid-operation and
        #    we can't know which tmp belongs to it (mkstemp assigns
        #    random suffixes). If no live lease, the vestigial freshness
        #    gate (10s) catches the theoretical edge case of a file
        #    appearing between lease write and our listdir.
        if tmp_names:
            if _dir_has_any_live_lease(subdir):
                counts["skipped_live_lease"] += len(tmp_names)
            else:
                for name in tmp_names:
                    if _safe_unlink(os.path.join(subdir, name), mtime_floor):
                        counts["atomic_tmp"] += 1

        # 2. Orphan state files: invalid JSON, wrong session_id, etc.
        #    A live lease for the session also protects the state file
        #    (the hook might be in the middle of rewriting it via
        #    _atomic_write and the on-disk state is transiently stale).
        kept_state_names = set(state_names)
        for name in state_names:
            stem = name[:-len(".json")]
            path = os.path.join(subdir, name)
            if _state_is_valid(path, stem):
                continue
            if _session_has_live_lease(subdir, stem):
                counts["skipped_live_lease"] += 1
                continue
            if _safe_unlink(path, mtime_floor):
                counts["orphan_state"] += 1
                kept_state_names.discard(name)

        # 3. Orphan lock files: no matching .json. A live lease for the
        #    session means a hook is about to produce the .json (the
        #    lease is acquired before the lock, so the .json doesn't
        #    exist yet).
        for lock_name in lock_names:
            state_name = lock_name[:-len(".lock")]
            if state_name in kept_state_names:
                continue
            stem = state_name[:-len(".json")] if state_name.endswith(".json") else state_name
            if _session_has_live_lease(subdir, stem):
                counts["skipped_live_lease"] += 1
                continue
            if _safe_unlink(os.path.join(subdir, lock_name), mtime_floor):
                counts["orphan_lock"] += 1

        # 4. Anything else in the project directory is unknown/orphan.
        for name in names:
            if name in known:
                continue
            if _safe_unlink(os.path.join(subdir, name), mtime_floor):
                counts["unknown_in_project"] += 1

    counts["empty_project_dirs"] = _remove_empty_project_dirs(root)
    return counts


def retention_sweep(
    drift_dir: Optional[str] = None,
    retention_days: int = 14,
) -> dict:
    """
    Remove valid-but-old state files (and their paired locks) whose mtime
    exceeds `retention_days`. Unlike orphan_sweep, this does NOT care about
    file validity — it's just age-based eviction of well-formed state that
    has been idle too long.

    Honors the `.drift-keep` opt-out marker at both the drift-state root
    and at any individual project subdirectory.

    Returns a dict with per-category counts.
    """
    root = drift_dir or DRIFT_ROOT
    counts = {
        "retention_state": 0,
        "retention_lock": 0,
        "empty_project_dirs": 0,
        "skipped_kept": 0,
    }
    if not os.path.isdir(root) or retention_days <= 0:
        return counts

    # Root-level opt-out: skip the whole tree.
    if _is_kept(root):
        return counts

    cutoff = time.time() - max(1, retention_days) * 86400

    try:
        root_entries = os.listdir(root)
    except OSError:
        return counts
    for entry in root_entries:
        subdir = os.path.join(root, entry)
        if not os.path.isdir(subdir):
            continue
        if _is_kept(subdir):
            counts["skipped_kept"] += 1
            continue
        try:
            names = os.listdir(subdir)
        except OSError:
            continue
        state_names = {n for n in names if _is_state_name(n)}
        lock_names = {n for n in names if _is_lock_name(n)}
        for name in list(state_names):
            path = os.path.join(subdir, name)
            # Don't evict a stale file while a live lease exists for
            # this session — a hook might be catching up on it right now.
            stem = name[:-len(".json")]
            if _session_has_live_lease(subdir, stem):
                continue
            try:
                if os.path.getmtime(path) >= cutoff:
                    continue
            except OSError:
                continue
            try:
                os.remove(path)
                counts["retention_state"] += 1
                state_names.discard(name)
            except OSError:
                continue
            lock_name = name + ".lock"
            if lock_name in lock_names:
                try:
                    os.remove(os.path.join(subdir, lock_name))
                    counts["retention_lock"] += 1
                    lock_names.discard(lock_name)
                except OSError:
                    pass

    counts["empty_project_dirs"] = _remove_empty_project_dirs(root)
    return counts


def sweep_all(
    drift_dir: Optional[str] = None,
    retention_days: int = 14,
    freshness_gate_secs: int = FRESHNESS_GATE_SECONDS,
) -> dict:
    """
    Run both sweeps in the order: retention first (removes stale-but-valid
    state + paired locks), then orphan (removes anything unclaimable),
    then the legacy-pointer sweep. Empty project dirs are collapsed at the
    end. Returns a merged counts dict.
    """
    root = drift_dir or DRIFT_ROOT
    merged: dict[str, int] = {
        "retention_state": 0,
        "retention_lock": 0,
        "atomic_tmp": 0,
        "orphan_state": 0,
        "orphan_lock": 0,
        "stale_lease": 0,
        "unknown_in_project": 0,
        "unknown_in_root": 0,
        "legacy_pointer": 0,
        "empty_project_dirs": 0,
        "skipped_kept": 0,
        "skipped_live_lease": 0,
    }
    r = retention_sweep(root, retention_days=retention_days)
    for k, v in r.items():
        merged[k] = merged.get(k, 0) + v
    o = orphan_sweep(root, freshness_gate_secs=freshness_gate_secs)
    for k, v in o.items():
        merged[k] = merged.get(k, 0) + v
    # _remove_empty_project_dirs is already called inside each sweep, but
    # call it once more in case an orphan sweep emptied a dir that the
    # retention sweep left partially populated.
    merged["empty_project_dirs"] += _remove_empty_project_dirs(root)
    return merged


def format_sweep_counts(counts: dict) -> str:
    """Render a human-readable one-line summary of a sweep counts dict."""
    labels = [
        ("retention_state", "{n} stale state"),
        ("retention_lock", "{n} stale lock"),
        ("atomic_tmp", "{n} aborted tmp"),
        ("orphan_state", "{n} orphan state"),
        ("orphan_lock", "{n} orphan lock"),
        ("stale_lease", "{n} stale lease"),
        ("unknown_in_project", "{n} unknown in-project"),
        ("unknown_in_root", "{n} unknown in-root"),
        ("legacy_pointer", "{n} legacy pointer"),
        ("empty_project_dirs", "{n} empty dir"),
    ]
    parts = []
    for key, tmpl in labels:
        n = counts.get(key, 0)
        if n:
            parts.append(tmpl.format(n=n))
    # Only surface skip/lease counters if they're non-zero AND something
    # else happened — otherwise the output is noisy for the common case.
    if parts:
        leased = counts.get("skipped_live_lease", 0)
        kept = counts.get("skipped_kept", 0)
        stale = counts.get("stale_lease", 0)
        extras = []
        if leased:
            extras.append(f"{leased} skipped (live lease)")
        if kept:
            extras.append(f"{kept} skipped (.drift-keep)")
        if stale:
            extras.append(f"{stale} stale lease cleaned")
        if extras:
            parts.extend(extras)
    return ", ".join(parts) if parts else "nothing to clean"
