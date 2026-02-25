---
name: errors
description: Show error log with full context including stack traces and tool chains
allowed-tools: [Bash]
---

Display errors with complete context including error messages, stack traces, tool inputs that caused errors, and preceding tool call chains.

Usage: `/cc-telemetry:errors [--tail N] [--session <id>]`

!`python3 ~/claude-code-dev/tooling/cc-telemetry/bin/cc-telemetry errors $ARGUMENTS 2>&1`

Shows:
- Error timestamp and session
- Tool that errored
- Error message preview
- Session context

For full error details including stack traces, thinking blocks, and context tool calls, query the errors table directly or use the session-debugging skill.
