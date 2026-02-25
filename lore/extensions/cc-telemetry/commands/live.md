---
name: live
description: Tail tool calls in real-time as they happen
allowed-tools: [Bash]
---

Watch tool calls as they're captured by the telemetry daemon in real-time.

Usage: `/cc-telemetry:live`

!`python3 ~/claude-code-dev/tooling/cc-telemetry/bin/cc-telemetry live 2>&1`

Press Ctrl-C to stop watching.
