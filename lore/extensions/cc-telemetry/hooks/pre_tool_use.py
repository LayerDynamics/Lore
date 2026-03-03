#!/usr/bin/env python3
"""PreToolUse hook: log tool name + truncated input."""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(__file__))
from logger import make_event, write_event, read_stdin_json, truncate_value

def main():
    try:
        ctx = read_stdin_json()
        # CC hook fields: tool_name, tool_input, session_id, hook_event_name, cwd
        tool_name = ctx.get("tool_name", "unknown")
        tool_input = ctx.get("tool_input") or {}

        # Build a concise preview of input (truncated per field)
        truncated_input = {}
        if isinstance(tool_input, dict):
            for k, v in tool_input.items():
                truncated_input[k] = truncate_value(v)
        else:
            truncated_input = {"raw": truncate_value(tool_input)}

        # Agent-specific telemetry for Task tool
        agent_name = None
        span_id = None
        if tool_name == "Task":
            import hashlib
            agent_name = tool_input.get("subagent_type") or tool_input.get("description", "")[:50] or None
            span_id = hashlib.sha256(json.dumps(tool_input, sort_keys=True).encode()).hexdigest()[:8]

        event = make_event(
            event_type="PreToolUse",
            tool=tool_name,
            agent_name=agent_name,
            span_id=span_id,
            meta={
                "cwd": ctx.get("cwd"),
                "input_keys": list(tool_input.keys()) if isinstance(tool_input, dict) else [],
                "input_preview": truncated_input,
            }
        )
        write_event(event)
    except Exception:
        pass
    sys.exit(0)

if __name__ == "__main__":
    main()
