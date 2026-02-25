---
name: daemon
description: Manage the cc-telemetry background daemon (start/stop/status/restart)
allowed-tools: [Bash]
---

Control the cc-telemetry background daemon that watches Claude Code transcripts and captures telemetry data.

Usage: `/cc-telemetry:daemon [start|stop|status|restart]`

!`python3 ~/claude-code-dev/tooling/cc-telemetry/bin/cc-telemetry daemon $ARGUMENTS 2>&1`

Operations:
- **status** - Check if daemon is running (default if no args)
- **start** - Start the daemon
- **stop** - Stop the daemon
- **restart** - Restart the daemon (apply config changes)

The daemon runs as a launchd agent and starts automatically on login. Check logs at `~/.claude/telemetry/daemon.log` if issues occur.
