---
name: insights
description: Generate AI-powered insights from telemetry data
allowed-tools: [Bash, Read]
---

Analyze telemetry data and generate insights about usage patterns, performance issues, and optimization opportunities.

Usage: `/cc-telemetry:insights [--session <id>]`

First, gather the data:

!`python3 ~/claude-code-dev/tooling/cc-telemetry/bin/cc-telemetry stats $ARGUMENTS 2>&1`

Then analyze the patterns and provide insights about:
- Most/least used tools
- Performance bottlenecks
- Error patterns
- Optimization opportunities
- Unusual usage patterns

For autonomous deep-dive analysis, consider using the telemetry-analyzer agent.
