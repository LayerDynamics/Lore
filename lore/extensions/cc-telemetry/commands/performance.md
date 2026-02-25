---
name: performance
description: Show performance analysis with latency percentiles, outliers, and slow tools
allowed-tools: [Bash]
---

Display comprehensive performance metrics for Claude Code tool usage including latency percentiles (p50/p95/p99), outlier detection, and slowest tools.

Usage: `/cc-telemetry:performance [--tail N] [--session <id>]`

!`python3 ~/claude-code-dev/tooling/cc-telemetry/bin/cc-telemetry tools $ARGUMENTS 2>&1`

Shows:
- Tool call history with timing
- Duration in milliseconds or seconds
- Status (ok/ERROR)
- Result preview

Use `--session <slug>` to filter by specific session.
