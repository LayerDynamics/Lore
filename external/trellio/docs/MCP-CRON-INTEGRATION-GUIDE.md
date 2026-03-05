# MCP-Cron Integration Guide for DefTrello

## Overview

This guide explains how to use mcp-cron with DefTrello to schedule automated workflows.

## Setup Status

✅ **Completed Steps**:
- mcp-cron added to `.mcp.json` configuration
- Database directory created at `.mcp-cron/`
- Setup script created at `scripts/setup-mcp-cron.sh`

🔄 **Next Step**: Restart Claude Code to load mcp-cron

---

## Quick Start

### 1. Verify Setup

Run the setup script:
```bash
./scripts/setup-mcp-cron.sh
```

### 2. Restart Claude Code

Exit and restart Claude Code in this directory:
```bash
cd /Users/ryanoboyle/deftrello
claude
```

### 3. Verify mcp-cron is Loaded

In the new Claude Code session, ask:
```
"List all available MCP servers"
```

You should see both `deftrello` and `mcp-cron` in the list.

---

## Example Scheduled Tasks

### Task 1: Daily Morning Planning (9 AM Every Day)

```
"Create a scheduled task called 'Daily Morning Planning' that runs every day at 9am. The task should:
1. Get my board snapshot using deftrello MCP
2. Get daily planning context with medium energy level
3. Provide me with a plan for the day"
```

**Expected cron**: `0 9 * * *`

---

### Task 2: Crash Recovery Check (Every 30 Minutes)

```
"Create a scheduled task called 'Crash Recovery Check' that runs every 30 minutes. The task should:
1. Check the board for stale cards (no activity in 2+ days)
2. If found, run the crash recovery flow
3. Report the status"
```

**Expected cron**: `*/30 * * * *`

---

### Task 3: Weekly Review (Friday at 6 PM)

```
"Create a scheduled task called 'Weekly Review' that runs every Friday at 6pm. The task should:
1. Get all completed tasks from the Done list
2. Generate a summary of the week's accomplishments
3. Save the summary to a file"
```

**Expected cron**: `0 18 * * 5`

---

### Task 4: WIP Limit Reminder (Every Hour During Work Hours)

```
"Create a scheduled task called 'WIP Limit Check' that runs every hour from 9am to 5pm on weekdays. The task should:
1. Check if WIP limits are exceeded in Doing or Today lists
2. If exceeded, create a notification
3. Suggest which tasks to move back to This Week"
```

**Expected cron**: `0 9-17 * * 1-5`

---

## MCP-Cron Commands Reference

### Creating Tasks

**AI Task (recommended for DefTrello)**:
```
"Add an AI task with:
- Name: <task-name>
- Schedule: <cron-expression>
- Prompt: <what the AI should do>"
```

**Shell Command Task**:
```
"Add a shell task with:
- Name: <task-name>
- Schedule: <cron-expression>
- Command: <shell-command>"
```

### Managing Tasks

**List all tasks**:
```
"List all scheduled tasks"
```

**Get task details**:
```
"Show me details for task <id>"
```

**Run task immediately**:
```
"Run task <id> now"
```

**Enable/Disable task**:
```
"Disable task <id>"
"Enable task <id>"
```

**Remove task**:
```
"Delete task <id>"
```

**Get task results**:
```
"Show me the latest results for task <id>"
```

---

## Cron Expression Cheat Sheet

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

### Common Patterns

| Pattern | Description |
|---------|-------------|
| `* * * * *` | Every minute |
| `*/5 * * * *` | Every 5 minutes |
| `0 * * * *` | Every hour |
| `0 9 * * *` | Every day at 9 AM |
| `30 9 * * *` | Every day at 9:30 AM |
| `0 9 * * 1-5` | Weekdays at 9 AM |
| `0 9 * * 1` | Every Monday at 9 AM |
| `0 18 * * 5` | Every Friday at 6 PM |
| `0 0 1 * *` | First day of month at midnight |
| `0 9-17 * * 1-5` | Every hour from 9 AM-5 PM on weekdays |

**Tip**: Use https://crontab.guru/ to validate and explain cron expressions

---

## Advanced Integration Examples

### Morning Routine Workflow

This creates a comprehensive morning workflow:

```
"Create an AI task called 'Complete Morning Routine' that runs weekdays at 9am with this workflow:

1. Get board snapshot
2. Get daily planning context for medium energy (level 3)
3. Check for any overdue tasks and move them to Today
4. Check WIP limits
5. Generate a morning briefing with:
   - Tasks in Today list
   - Recommended tasks to pull from This Week
   - WIP status
   - Any alerts or reminders
6. Save the briefing to .deftrello/briefings/YYYY-MM-DD.md
7. Return a summary"
```

### Evening Wrap-up

```
"Create an AI task called 'Evening Wrap-up' that runs weekdays at 6pm:

1. Move all tasks from Doing back to Today if not completed
2. Archive all Done tasks to a separate list
3. Generate an end-of-day summary:
   - Tasks completed today
   - Tasks still in progress
   - Tomorrow's priorities
4. Save to .deftrello/daily-logs/YYYY-MM-DD-evening.md"
```

### Smart Task Routing

```
"Create an AI task called 'Smart Task Router' that runs every 2 hours during work hours:

1. Get current time and energy estimates
2. For each task in This Week:
   - Check if it matches current energy level
   - Check if it's due soon
   - Check if it's blocking other tasks
3. Auto-move high-priority, energy-matched tasks to Today (respecting WIP limits)
4. Log any routing decisions"
```

---

## Troubleshooting

### mcp-cron not showing in MCP servers list

1. Check `.mcp.json` has the correct configuration
2. Restart Claude Code completely
3. Check logs: `tail -f ~/.claude/logs/mcp-cron.log` (if logging is enabled)

### Tasks not executing

1. List tasks: `"List all scheduled tasks"`
2. Check if task is enabled: `"Show me details for task <id>"`
3. Enable if needed: `"Enable task <id>"`
4. Test manually: `"Run task <id> now"`
5. Check task results: `"Show me the latest results for task <id>"`

### Database location

Default location: `/Users/ryanoboyle/deftrello/.mcp-cron/tasks.db`

To view tasks directly:
```bash
sqlite3 .mcp-cron/tasks.db "SELECT * FROM tasks;"
```

### Permission issues

If mcp-cron can't write to database:
```bash
chmod 755 .mcp-cron
touch .mcp-cron/tasks.db
chmod 644 .mcp-cron/tasks.db
```

---

## Database Schema

mcp-cron uses SQLite with this structure:

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  schedule TEXT,
  command TEXT,
  prompt TEXT,
  type TEXT NOT NULL, -- 'shell_command' or 'ai_task'
  description TEXT,
  enabled INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE task_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  executed_at TEXT,
  status TEXT,
  output TEXT,
  error TEXT,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

---

## Next Steps

1. **Restart Claude Code** to load mcp-cron
2. **Create your first task** using one of the examples above
3. **Test the task** by running it manually
4. **Monitor results** to ensure tasks execute correctly
5. **Expand automation** by adding more scheduled workflows

---

## Additional Resources

- **mcp-cron GitHub**: https://github.com/jolks/mcp-cron
- **Cron Expression Tester**: https://crontab.guru/
- **DefTrello MCP Documentation**: `./README.md`
- **MCP Automation Research**: `./docs/MCP-AUTOMATION-RESEARCH.md`

---

## Questions?

After restarting Claude Code, you can ask:

- "What scheduled tasks do I have?"
- "Create a new scheduled task for..."
- "Run my morning planning task now"
- "Show me the results from my last task execution"
- "Disable the task that runs every hour"
