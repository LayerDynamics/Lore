#!/usr/bin/env python3
"""PostToolUse hook: log tool name + duration + success/fail."""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from logger import make_event, write_event, read_stdin_json, truncate_value

def main():
    try:
        ctx = read_stdin_json()
        # CC hook fields: tool_name, tool_input, tool_result, session_id, hook_event_name
        tool_name = ctx.get("tool_name", "unknown")
        tool_result = ctx.get("tool_result")  # the actual CC field name

        # Detect error: CC doesn't set a separate error field; check if result looks like an error
        # tool_result is a string for most tools, or structured for some
        result_str = truncate_value(tool_result, max_len=200) if tool_result is not None else None
        is_error = False
        if isinstance(tool_result, str):
            lower = tool_result.lower()
            is_error = (
                lower.startswith("error") or
                "error:" in lower[:100] or
                lower.startswith("traceback") or
                lower.startswith("exception")
            )
        status = "error" if is_error else "ok"

        meta = {}
        if result_str:
            meta["result_preview"] = result_str
        if is_error:
            meta["error_detected"] = True

        event = make_event(
            event_type="PostToolUse",
            tool=tool_name,
            status=status,
            meta=meta,
        )
        write_event(event)
    except Exception:
        pass
    sys.exit(0)

if __name__ == "__main__":
    main()
