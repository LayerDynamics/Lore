---
name: skills
description: Show skill invocation frequency, load times, and unused skills
allowed-tools: [Bash, Read]
---

Analyze skill usage patterns across sessions to identify most-invoked skills, skills that are enabled but never triggered, and skill load times.

Usage: `/cc-telemetry:skills [--session <id>]`

Query tool calls for Skill tool invocations:

!`python3 ~/claude-code-dev/tooling/cc-telemetry/bin/cc-telemetry tools --tool Skill $ARGUMENTS 2>&1`

Then analyze:
- Most frequently invoked skills
- Skill load times (duration of Skill tool calls)
- Skills that led to errors
- Enabled skills never triggered

Cross-reference with system messages to identify skill loading patterns and issues.
