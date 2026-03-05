# MCP-Cron Quick Reference

## Status
✅ Installed and configured
📍 Database: `.mcp-cron/tasks.db`

## 🚀 Getting Started (After Restart)

### 1. Verify mcp-cron is loaded
```
"List all available MCP servers"
```
Expected: See `deftrello` and `mcp-cron`

### 2. Create your first scheduled task
```
"Create a task that runs my morning planning every day at 9am"
```

### 3. List all tasks
```
"List all scheduled tasks"
```

---

## 📋 Common Commands

### Creating Tasks

**Morning Planning (Daily at 9 AM)**
```
"Create an AI task called 'Morning Planning' that runs at 9am every day.
It should get my board snapshot and daily planning context with medium energy."
```

**Crash Recovery Check (Every 30 Minutes)**
```
"Create a task that runs every 30 minutes to check for stale cards
and run crash recovery if needed"
```

**Weekly Review (Friday at 6 PM)**
```
"Create a weekly review task that runs every Friday at 6pm"
```

---

### Managing Tasks

| Action | Command |
|--------|---------|
| List all tasks | `"List all scheduled tasks"` |
| Get task details | `"Show me details for task <id>"` |
| Run task now | `"Run task <id> immediately"` |
| Enable task | `"Enable task <id>"` |
| Disable task | `"Disable task <id>"` |
| Delete task | `"Delete task <id>"` |
| Get task results | `"Show me results for task <id>"` |

---

## 🕐 Cron Patterns

| Pattern | Meaning |
|---------|---------|
| `0 9 * * *` | Every day at 9 AM |
| `*/30 * * * *` | Every 30 minutes |
| `0 9 * * 1-5` | Weekdays at 9 AM |
| `0 18 * * 5` | Every Friday at 6 PM |
| `0 9-17 * * *` | Every hour, 9 AM - 5 PM |

**Test patterns**: https://crontab.guru/

---

## 🔧 Troubleshooting

### Task not running?
1. Check if enabled: `"Show me task <id> details"`
2. Test manually: `"Run task <id> now"`
3. Check results: `"Show me task <id> results"`

### Can't see mcp-cron?
1. Restart Claude Code
2. Check `.mcp.json` has `mcp-cron` entry
3. Run `./scripts/setup-mcp-cron.sh`

---

## 📦 Example: Complete Morning Workflow

```
"Create an AI task called 'Complete Morning Routine' scheduled for 9am weekdays.

The task should:
1. Get my board snapshot
2. Get daily planning context with medium energy (level 3)
3. Check for overdue tasks
4. Check WIP limits
5. Generate a morning briefing with:
   - Current tasks in Today
   - Recommended tasks from This Week
   - WIP status
   - Any alerts
6. Return a summary"
```

---

## 🎯 Next Actions

**After restarting Claude Code:**
1. ✅ Verify: `"List all MCP servers"`
2. ✅ Create: `"Create morning planning task"`
3. ✅ Test: `"Run the task now"`
4. ✅ Monitor: `"Show me the results"`

---

## 📚 Full Documentation

- Setup Guide: `docs/MCP-CRON-INTEGRATION-GUIDE.md`
- Research: `docs/MCP-AUTOMATION-RESEARCH.md`
- mcp-cron GitHub: https://github.com/jolks/mcp-cron
