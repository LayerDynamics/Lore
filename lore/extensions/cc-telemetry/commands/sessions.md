---
name: sessions
description: List recent Claude Code sessions with metrics
allowed-tools: [Bash]
---

Show recent Claude Code sessions with telemetry metrics including tool call counts, error rates, duration, and performance scores.

Usage: `/cc-telemetry:sessions [--tail N]`

Execute the telemetry CLI to fetch session data:

!`python3 ~/claude-code-dev/tooling/cc-telemetry/bin/cc-telemetry sessions $ARGUMENTS 2>&1`

The output shows:
- Session slug (human-readable name)
- Started timestamp
- Total tool calls
- Error count
- Current working directory

Use this to identify sessions for deeper analysis with other commands.
