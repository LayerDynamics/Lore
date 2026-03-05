# Comprehensive Research: External Triggers for MCP Flows and VS Code Automation

**Research Date:** February 16, 2026
**Purpose:** Automate MCP flows (like daily routines) with time-based and event-based triggers

---

## Executive Summary

Based on comprehensive research, here are the **top solutions** for automating MCP flows and VS Code interactions:

### Quick Recommendations

**For DefTrello Morning Planning**:
- **Best Option**: `mcp-cron` MCP server + system cron for VS Code launching
- **Alternative**: `schedule-task-mcp` with MCP sampling support

### Key Tools Discovered

1. **mcp-cron** (https://github.com/jolks/mcp-cron)
   - MCP server that schedules shell commands AND AI tasks
   - Cron expression support
   - SQLite persistence
   - Multi-instance safe

2. **claude-mcp-scheduler** (https://github.com/tonybentley/claude-mcp-scheduler)
   - Autonomous Claude Code worker system
   - Task queue architecture
   - Structured prompts pattern
   - Full automation guide

3. **schedule-task-mcp** (https://github.com/liao1fan/schedule-task-mcp)
   - Natural language scheduling
   - MCP sampling (callback to client)
   - Multiple trigger types
   - LobeHub community project

4. **VS Code Tasks** (https://code.visualstudio.com/docs/debugtest/tasks)
   - Built-in task automation
   - External trigger support
   - Extension API available

5. **Windmill** (https://www.windmill.dev/docs/core_concepts/mcp)
   - Enterprise workflow automation
   - MCP server integration
   - Visual workflow builder

---

## Solution 1: mcp-cron

**Repository**: https://github.com/jolks/mcp-cron
**Stars**: 17 | **License**: MIT

### Features

- ✅ Schedule shell commands OR AI prompts using cron expressions
- ✅ AI tasks can access other MCP servers
- ✅ Task execution with command output capture
- ✅ SQLite persistence across restarts
- ✅ Multi-instance safe (shared database)
- ✅ Both SSE and stdio transport modes

### Installation

```bash
# Quick start
npx -y mcp-cron

# Add to Claude Code
claude mcp add mcp-cron -- npx -y mcp-cron

# Add to Claude Desktop (macOS)
# Edit: ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "mcp-cron": {
      "command": "npx",
      "args": ["-y", "mcp-cron"]
    }
  }
}
```

### Available MCP Tools

1. `list_tasks` - List all tasks
2. `get_task` - Get specific task by ID
3. `add_task` - Add new shell command task
4. `add_ai_task` - Add new AI task with prompt
5. `update_task` - Update existing task
6. `remove_task` - Remove task by ID
7. `run_task` - Execute task immediately
8. `enable_task` / `disable_task` - Control task execution
9. `get_task_result` - Get execution results

### Example Usage

**Create AI task for morning planning**:
```
User: "Create a scheduled task that runs my morning planning every day at 9am"

Claude uses add_ai_task:
{
  "name": "Morning DefTrello Planning",
  "schedule": "0 9 * * *",
  "prompt": "Run /mcp__deftrello__morning_planning command",
  "enabled": true
}
```

### Cron Schedule Examples

```
*/5 * * * *       # Every 5 minutes
0 * * * *         # Every hour
30 9 * * *        # Every day at 9:30 AM
0 9 * * 1-5       # Every weekday at 9 AM
0 0 1 * *         # First day of month at midnight
*/15 9-17 * * 1-5 # Every 15 min, 9-5, weekdays
```

---

## Solution 2: claude-mcp-scheduler

**Repository**: https://github.com/tonybentley/claude-mcp-scheduler
**Blog Guide**: https://www.blle.co/blog/automated-claude-code-workers

### Architecture

```
System Cron → Worker Script → Claude Code → MCP Servers
     ↓
Task Queue MCP (pending/in-progress/done)
```

### Components

1. **Worker Script** - Shell wrapper that launches Claude
2. **Structured Prompts** - Task-specific prompt files
3. **Task Queue** - MCP server managing tasks
4. **Cron Scheduler** - Triggers worker periodically

### Worker Script Pattern

```bash
#!/bin/bash
set -euo pipefail

LOG_FILE="/var/log/claude-worker.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

source_environment() {
    [[ -f "$HOME/.zshrc" ]] && source "$HOME/.zshrc"
    if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
        source "$HOME/.nvm/nvm.sh"
        nvm use default
    fi
}

main() {
    log "Starting worker"
    source_environment

    claude -p "/process-next-task" \
        --output-format=stream-json \
        -dangerously-skip-permissions

    log "Worker completed"
}

main "$@"
```

### Structured Prompt Example

**Master Prompt**: `/opt/claude-prompts/process-next-task.md`
```markdown
# Process Next Task

1. Connect to task management MCP server
2. Fetch next pending task
3. If no tasks: exit gracefully
4. Mark task as "in-progress"
5. Route to appropriate handler
6. On error: mark task as "failed"

Task routing:
- `morning-planning` → Use /morning-planning-task prompt
- `crash-recovery` → Use /crash-recovery-task prompt

Execute now.
```

### Cron Configuration

```bash
# Edit crontab
crontab -e

# Run every 10 minutes
*/10 * * * * /bin/zsh -l -c '/path/to/worker.sh' >> /var/log/worker.log 2>&1
```

---

## Solution 3: schedule-task-mcp

**NPM**: https://www.npmjs.com/package/schedule-task-mcp
**GitHub**: https://github.com/liao1fan/schedule-task-mcp

### Unique Features

- ✅ **MCP Sampling** - Server calls back to client for AI execution
- ✅ Natural language scheduling
- ✅ SQLite persistence
- ✅ Rich Markdown summaries
- ✅ Multiple trigger types: interval, cron, date, delay

### Installation

```bash
npm install -g schedule-task-mcp

# Or use npx
{
  "mcpServers": {
    "schedule-task-mcp": {
      "command": "npx",
      "args": ["-y", "schedule-task-mcp"],
      "env": {
        "SCHEDULE_TASK_TIMEZONE": "America/New_York",
        "SCHEDULE_TASK_DB_PATH": "~/.deftrello/tasks.db"
      }
    }
  }
}
```

### MCP Sampling Workflow

```
1. User: "Every day at 9am, run my morning planning"
2. Agent creates task:
   - trigger: cron "0 9 * * *"
   - agent_prompt: "Run morning planning workflow"
3. At 9am:
   - Server sends sampling request to client
   - Client receives agent_prompt
   - Claude executes the workflow
   - Result stored in history
```

### Available Tools

| Tool | Purpose |
|------|---------|
| `create_task` | Create scheduled task |
| `list_tasks` | Display all tasks |
| `get_task` | Inspect single task |
| `update_task` | Modify task |
| `delete_task` | Remove task |
| `pause_task` | Temporarily disable |
| `resume_task` | Re-enable task |
| `execute_task` | Run immediately |

### Trigger Types

**Interval**:
```json
{
  "trigger_type": "interval",
  "trigger_config": { "minutes": 30 }
}
```

**Cron**:
```json
{
  "trigger_type": "cron",
  "trigger_config": { "expression": "0 9 * * *" }
}
```

**One-time Date**:
```json
{
  "trigger_type": "date",
  "trigger_config": { "delay_minutes": 10 }
}
```

---

## Solution 4: VS Code Tasks + System Cron

**Docs**: https://code.visualstudio.com/docs/debugtest/tasks

### VS Code Task Definition

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Morning DefTrello Planning",
      "type": "shell",
      "command": "claude",
      "args": ["-p", "/mcp__deftrello__morning_planning"],
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    }
  ]
}
```

### Opening VS Code from Cron

**Launcher Script**:
```bash
#!/bin/bash
# open-vscode-planning.sh

# Open VS Code
code /path/to/deftrello

# Wait for load
sleep 3

# Run task
code --command workbench.action.tasks.runTask "Morning DefTrello Planning"
```

**Crontab**:
```bash
0 9 * * * /bin/bash /path/to/open-vscode-planning.sh >> /var/log/vscode.log 2>&1
```

### macOS launchd (Better than cron)

**Create**: `~/Library/LaunchAgents/com.deftrello.morning.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.deftrello.morning</string>

    <key>ProgramArguments</key>
    <array>
        <string>/bin/zsh</string>
        <string>-l</string>
        <string>-c</string>
        <string>/usr/local/bin/launch-deftrello.sh</string>
    </array>

    <key>StartCalendarInterval</key>
    <array>
        <dict>
            <key>Hour</key><integer>9</integer>
            <key>Minute</key><integer>0</integer>
            <key>Weekday</key><integer>1</integer>
        </dict>
        <!-- Repeat for Tue-Fri -->
    </array>

    <key>StandardOutPath</key>
    <string>/tmp/deftrello.log</string>
</dict>
</plist>
```

**Load**:
```bash
launchctl load ~/Library/LaunchAgents/com.deftrello.morning.plist
launchctl start com.deftrello.morning
```

---

## Solution 5: Windmill + MCP

**Website**: https://www.windmill.dev/docs/core_concepts/mcp

### Features

- Visual workflow builder
- CRON scheduling
- MCP server integration
- Worker pools
- Self-hostable

### Example Workflow

```python
# windmill_morning_planning.py
import wmill

def main():
    # Call MCP servers from Windmill
    snapshot = wmill.call_mcp_server(
        "deftrello",
        "get_board_snapshot",
        {}
    )

    planning = wmill.call_mcp_server(
        "deftrello",
        "get_daily_planning_context",
        {"energy_filter": 3}
    )

    return {
        "snapshot": snapshot,
        "planning": planning
    }

# Schedule: 0 9 * * *
```

---

## Comparison Matrix

| Solution | Complexity | MCP Native | Sampling | UI | Best Use Case |
|----------|-----------|------------|----------|-----|--------------|
| **mcp-cron** | Low | ✅ | ❌ | ❌ | Simple MCP scheduling |
| **claude-mcp-scheduler** | Medium | ✅ | ❌ | ❌ | Autonomous workers |
| **schedule-task-mcp** | Low | ✅ | ✅ | ❌ | Natural language + callbacks |
| **VS Code Tasks** | Medium | ❌ | ❌ | ✅ | VS Code integration |
| **Windmill** | High | Partial | ❌ | ✅ | Enterprise workflows |

---

## Recommended Implementation for DefTrello

### Hybrid Approach

Combine **mcp-cron** (for MCP scheduling) + **system cron** (for VS Code launching):

```
System Cron (macOS launchd)
├─ 0 9 * * * → Open VS Code + trigger morning planning
├─ */30 * * * * → Check for crash recovery
└─ 0 18 * * 5 → Weekly review

mcp-cron (for AI tasks)
└─ Schedule AI prompts within MCP protocol
```

### Why This Works

1. **System cron/launchd** handles application launching
2. **mcp-cron** handles MCP-specific scheduling
3. **Structured prompts** keep logic organized
4. **DefTrello MCP** provides all task operations
5. **Worker scripts** provide error handling

---

## Implementation Quick Start

### Step 1: Install mcp-cron

```bash
claude mcp add mcp-cron -- npx -y mcp-cron
```

### Step 2: Create Morning Planning Task

From Claude:
```
"Create a task that runs my morning planning every day at 9am using DefTrello MCP"
```

Claude will use `add_ai_task`:
```json
{
  "name": "Daily Morning Planning",
  "schedule": "0 9 * * *",
  "prompt": "Run my DefTrello morning planning. Use get_board_snapshot and get_daily_planning_context with energy level 3.",
  "enabled": true
}
```

### Step 3: Verify

```
"List all my scheduled tasks"
"Run the morning planning task now to test"
```

---

## Additional Resources

- **mcp-cron**: https://github.com/jolks/mcp-cron
- **claude-mcp-scheduler**: https://github.com/tonybentley/claude-mcp-scheduler
- **schedule-task-mcp**: https://github.com/liao1fan/schedule-task-mcp
- **Crontab Guru**: https://crontab.guru/
- **VS Code Tasks**: https://code.visualstudio.com/docs/debugtest/tasks
- **Windmill**: https://www.windmill.dev/

---

## Conclusion

**Best choice for DefTrello**: Start with **mcp-cron** for simplicity and MCP-native integration. Add system cron/launchd if you need VS Code automation.

This gives you:
- ✅ MCP-native scheduling
- ✅ AI task execution
- ✅ SQLite persistence
- ✅ Simple setup
- ✅ Scalable to complex workflows
