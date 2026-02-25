# cc-telemetry

> Deep telemetry and observability for Claude Code

## Overview

cc-telemetry provides comprehensive monitoring and analysis of your Claude Code usage. It captures every tool call, plugin invocation, skill usage, error, and performance metric, storing them in a local SQLite database for rich querying and insights.

## Features

- **📊 Rich Metrics** - Track tools, plugins, skills, commands, errors, performance, tokens, cache hits
- **🔍 Deep Analysis** - Understand usage patterns, detect inefficiencies, identify bottlenecks
- **🐛 Error Intelligence** - Full error context with thinking blocks, tool chains, and recovery attempts
- **⚡ Performance Insights** - Latency percentiles (p50/p95/p99), outliers, timeout patterns
- **🔌 Plugin Observability** - Track plugin usage, errors, enabled-but-unused plugins
- **🎯 Skill Analytics** - Monitor skill invocations, load times, effectiveness
- **💬 Command Tracking** - Measure command usage, success rates, completion times
- **🤖 AI-Powered Insights** - Autonomous analysis agent detects patterns and suggests optimizations

## Components

### Skills

- **telemetry-analysis** - Help Claude interpret telemetry data and answer usage questions
- **session-debugging** - Diagnose specific session issues with full error context
- **workflow-optimization** - Suggest improvements based on usage patterns

### Commands

- `/cc-telemetry:sessions` - List recent sessions with metrics
- `/cc-telemetry:performance` - Show performance analysis (latency, outliers)
- `/cc-telemetry:errors` - Display error log with context
- `/cc-telemetry:patterns` - Detect tool chains and workflow patterns
- `/cc-telemetry:plugins` - Plugin usage and health metrics
- `/cc-telemetry:skills` - Skill invocation analysis
- `/cc-telemetry:commands` - Command usage statistics
- `/cc-telemetry:compare` - Compare sessions or time periods
- `/cc-telemetry:health` - Overall system health score
- `/cc-telemetry:insights` - AI-generated insights
- `/cc-telemetry:live` - Real-time tool call monitoring
- `/cc-telemetry:replay` - Full session replay with thinking blocks
- `/cc-telemetry:search-errors` - Find errors matching patterns
- `/cc-telemetry:daemon` - Manage background daemon

### Agent

- **telemetry-analyzer** - Autonomous analysis of performance regressions, error patterns, and workflow inefficiencies

## Architecture

```
┌─────────────────┐
│ Claude Code     │ Writes transcript JSONL files
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Daemon Process  │ Watches ~/.claude/projects/**/*.jsonl
│  - Parses events│ Extracts: tools, errors, thinking, metadata
│  - Enriches data│ Computes: latency, patterns, classifications
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SQLite Database │ ~/.claude/telemetry/telemetry.db
│  - Sessions     │ Rich queryable storage
│  - Tool calls   │
│  - Errors       │
│  - Thinking     │
│  - API metadata │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Plugin Commands │ Query interface for Claude
│ & Skills        │
└─────────────────┘
```

## Installation

1. **Install daemon** (if not already installed):
   ```bash
   bash ~/claude-code-dev/tooling/cc-telemetry/install.sh
   ```

2. **Enable plugin**:
   - Add to `~/.claude/settings.json`:
     ```json
     {
       "enabledPlugins": {
         "cc-telemetry@local": true
       }
     }
     ```
   - Or use: `cc plugin install ~/claude-code-dev/tooling/cc-telemetry`

3. **Restart Claude Code**

## Configuration

Create `~/.claude/cc-telemetry.local.md` for custom settings:

```markdown
---
poll_interval: 1.0
db_path: ~/.claude/telemetry/telemetry.db
log_level: INFO
retention_days: 90
performance_threshold_ms: 1000
error_rate_threshold: 0.1
auto_start_daemon: true
---
```

All settings are optional with sensible defaults.

## Usage

### Query Telemetry

```
/cc-telemetry:sessions
/cc-telemetry:performance --tail 20
/cc-telemetry:errors --full
/cc-telemetry:plugins
```

### Get Insights

```
"What tools am I using most?"
"Why was my last session slow?"
"Show me error patterns from today"
"Which plugins are enabled but never used?"
```

### Debug Issues

```
/cc-telemetry:replay <session-id>
/cc-telemetry:search-errors "timeout"
/cc-telemetry:compare <session-1> <session-2>
```

### Analyze Performance

```
/cc-telemetry:performance --p95
/cc-telemetry:health
/cc-telemetry:insights
```

## Database Schema

See `daemon/db.py` for complete schema. Key tables:

- `sessions` - Session metadata and metrics
- `tool_calls` - Every tool invocation with timing
- `errors` - Full error context with stack traces
- `thinking_blocks` - Claude's reasoning before actions
- `system_messages` - Hook feedback, skill loads, system events
- `api_metadata` - Request IDs, token usage, cache hits
- `hook_events` - Hook execution logs
- `messages` - User/assistant message history

## CLI Tool

The plugin uses the existing `cc-telemetry` CLI tool:

```bash
cc-telemetry sessions
cc-telemetry tools --session <id>
cc-telemetry stats
cc-telemetry errors
cc-telemetry live
cc-telemetry daemon status
```

## Development

### Project Structure

```
cc-telemetry/
├── .claude-plugin/
│   └── plugin.json      # Plugin manifest
├── commands/            # Slash commands
├── agents/              # Subagents
├── skills/              # Agent skills
├── daemon/              # Background daemon
│   ├── daemon.py
│   ├── db.py           # Database layer
│   ├── parser.py       # Transcript parser
│   └── watcher.py      # File watcher
├── bin/
│   └── cc-telemetry    # CLI tool
└── launchd/
    └── *.plist         # Auto-start config
```

### Adding Metrics

1. Extend database schema in `daemon/db.py`
2. Update parser in `daemon/parser.py` to extract data
3. Add query functions in `daemon/db.py`
4. Expose via commands or skills

## Troubleshooting

**Plugin not loading:**
```bash
# Check plugin is registered
cc plugin list

# Verify daemon is running
cc-telemetry daemon status

# Check logs
tail -f ~/.claude/telemetry/daemon.log
```

**No data captured:**
```bash
# Trigger a manual poll
python3 ~/claude-code-dev/tooling/cc-telemetry/daemon/daemon.py --once

# Check database
sqlite3 ~/.claude/telemetry/telemetry.db "SELECT COUNT(*) FROM tool_calls;"
```

## License

MIT
