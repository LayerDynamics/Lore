---
name: plugins
description: Show plugin usage metrics, enabled-but-unused plugins, and plugin health
allowed-tools: [Bash, Read]
---

Analyze plugin usage across all sessions to identify most-used plugins, enabled-but-unused plugins, and plugin-specific errors.

Usage: `/cc-telemetry:plugins [--session <id>]`

Query tool calls for plugin tools (MCP tools with `mcp__` prefix):

!`python3 ~/claude-code-dev/tooling/cc-telemetry/bin/cc-telemetry tools $ARGUMENTS 2>&1 | grep -E "(mcp__|Plugin)" || echo "Analyzing plugin usage from database..."`

Then analyze the results to show:
- Most active plugins (by tool call count)
- Plugin error rates
- Enabled plugins that were never invoked
- Plugin-specific performance metrics

For detailed plugin health, check system messages and hook events related to plugin loading and MCP server status.
