---
name: cc-telemetry
description: Query Claude Code telemetry. Shows real-time tool call history, session stats, error rates, hook events, and timing data from the cc-telemetry daemon watching ~/.claude/projects/ transcripts. Use to debug plugin issues, understand usage patterns, or audit what tools Claude called.
---

Query telemetry. Available commands: sessions, tools, stats, errors, hooks, live, daemon

!`python3 ~/claude-code-dev/tooling/cc-telemetry/bin/cc-telemetry $ARGUMENTS 2>&1`
