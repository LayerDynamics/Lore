---
name: health
description: Overall system health score with red flags and alerts
allowed-tools: [Bash]
---

Calculate overall Claude Code system health score based on multiple metrics including error rates, performance, daemon status, and plugin health.

Usage: `/cc-telemetry:health`

Gather all metrics:

!`python3 ~/claude-code-dev/tooling/cc-telemetry/bin/cc-telemetry stats 2>&1 && echo -e "\n--- Daemon Status ---" && python3 ~/claude-code-dev/tooling/cc-telemetry/bin/cc-telemetry daemon status 2>&1`

Calculate health score (0-100) based on:
- **Error rate** (>10% = critical, >5% = warning)
- **Performance** (p95 >2s = warning, >5s = critical)
- **Daemon status** (not running = critical)
- **Recent errors** (5+ in last hour = warning)
- **Tool diversity** (using <5 tools = info)

Present as:
```
Overall Health: [SCORE]/100 [HEALTHY|WARNING|CRITICAL]

✅ Daemon: Running
⚠️  Error Rate: 7.2% (above 5% threshold)
✅ Performance: p95 1.2s (within normal range)
✅ Tool Diversity: 12 tools used
```

Include actionable red flags if health is degraded.
