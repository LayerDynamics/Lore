---
name: compare
description: Compare two sessions or time periods to detect changes
allowed-tools: [Bash]
---

Compare telemetry metrics between two sessions or time periods to identify changes in tool usage, performance, or error rates.

Usage: `/cc-telemetry:compare <session-1> <session-2>`

Fetch stats for both sessions and compare:

!`echo "Session 1:" && python3 ~/claude-code-dev/tooling/cc-telemetry/bin/cc-telemetry stats --session "$1" 2>&1 && echo -e "\nSession 2:" && python3 ~/claude-code-dev/tooling/cc-telemetry/bin/cc-telemetry stats --session "$2" 2>&1`

Then analyze the differences:
- Tool usage changes (which tools used more/less)
- Performance differences (faster/slower tools)
- Error rate changes
- Session duration differences

Provide delta metrics (e.g., "+15% error rate", "-200ms avg latency").
