#!/usr/bin/env python3
"""Stop hook: log session end + summary stats from this session's events."""

import sys
import os
import json
from collections import Counter

sys.path.insert(0, os.path.dirname(__file__))
from logger import make_event, write_event, read_stdin_json, get_log_path


def main():
    try:
        ctx = read_stdin_json()
        # CC hook fields: session_id (in env), hook_event_name, stop_reason (if provided)
        session_id = os.environ.get("CLAUDE_SESSION_ID")
        stop_reason = ctx.get("stop_reason") or ctx.get("reason")

        # Tally this session's events from today's log file
        log_path = get_log_path()
        tool_counts = Counter()
        event_counts = Counter()
        error_count = 0
        skill_invocations = []

        if log_path.exists():
            with open(log_path, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        ev = json.loads(line)
                        # Only count events from this session (if session_id known)
                        if session_id and ev.get("session_id") != session_id:
                            continue
                        ev_type = ev.get("event", "")
                        event_counts[ev_type] += 1
                        if ev_type == "PreToolUse":
                            tool = ev.get("tool")
                            if tool:
                                tool_counts[tool] += 1
                        if ev.get("status") == "error":
                            error_count += 1
                        if ev.get("skill"):
                            skill_invocations.append(ev["skill"])
                    except json.JSONDecodeError:
                        pass

        event = make_event(
            event_type="Stop",
            meta={
                "stop_reason": stop_reason,
                "session_tool_calls": tool_counts.most_common(10),
                "session_event_counts": dict(event_counts),
                "session_error_count": error_count,
                "session_skills_used": list(set(skill_invocations)),
                "total_tool_calls": sum(tool_counts.values()),
            }
        )
        write_event(event)
    except Exception:
        pass  # Never block on telemetry errors
    sys.exit(0)


if __name__ == "__main__":
    main()
