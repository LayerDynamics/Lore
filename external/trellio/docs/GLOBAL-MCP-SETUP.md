# Global MCP Setup - DefTrello & mcp-cron

## ✅ What's Configured

Both **DefTrello** and **mcp-cron** are now globally accessible from **any directory**.

**Configured Board:** DefCad 3.0 Development Stages (`6991a7d595883f5d05fbb90d`)

### Configuration Locations

1. **Claude Code** (CLI): `~/.claude.json` (global config)
2. **Claude Desktop** (GUI): `~/Library/Application Support/Claude/claude_desktop_config.json`
3. **Database**: `~/.claude/mcp-cron/tasks.db`

**Note:** Project-specific `.mcp.json` files are disabled to prevent configuration conflicts.

---

## 🌍 How It Works

### From Any Directory

You can now:
- Go to **any directory** (deftrello, defcad, anywhere)
- Use DefTrello commands
- Manage scheduled tasks with mcp-cron
- Everything follows you

### Example

```bash
# In defcad directory
cd ~/defcad
claude

# Inside Claude Code:
"List my scheduled tasks"
"Add a task to my Trello board"
"Get my board snapshot"
```

All DefTrello and mcp-cron commands work!

---

## 📋 Current Scheduled Tasks

### Daily Morning Planning
- **Schedule**: Every day at 9:00 AM
- **Type**: Shell command (no API key needed)
- **What it does**:
  - Runs Claude Code with DefTrello MCP
  - Gets board snapshot
  - Generates daily planning briefing
  - Logs output to `~/.claude/mcp-cron/morning-planning.log`

---

## 🎯 Common Commands (Work from Anywhere!)

### Manage Scheduled Tasks

```
"List all my scheduled tasks"
"Create a task that runs every hour"
"Run the morning planning task now"
"Show me the results from the last run"
"Disable the morning planning task"
```

### Use DefTrello

```
"Add a task to This Week"
"Get my board snapshot"
"Get daily planning context with medium energy"
"Move card X to Today"
```

---

## 🔧 File Locations

| What | Where |
|------|-------|
| Global Claude Code MCP config | `~/.claude.json` (global MCP servers section) |
| Claude Desktop MCP config | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| mcp-cron database | `~/.claude/mcp-cron/tasks.db` |
| Morning planning logs | `~/.claude/mcp-cron/morning-planning.log` |
| DefTrello MCP server | `/Users/ryanoboyle/deftrello/mcp-server/dist/index.js` |
| Project .mcp.json | `/Users/ryanoboyle/deftrello/.mcp.json` (DISABLED) |

---

## ✨ Benefits

✅ **Work from anywhere** - deftrello, defcad, or any project
✅ **One Trello board** - always connected to your main board
✅ **Scheduled automation** - tasks run globally, not per-project
✅ **No duplication** - same config everywhere
✅ **No API keys needed** - uses shell commands with Claude Code

---

## 🚀 Next Steps

1. **Test it**: Go to a different directory and try it
2. **Add more tasks**: Create additional scheduled automation
3. **Customize**: Modify schedules or add new workflows

---

## 📚 Related Docs

- `MCP-CRON-INTEGRATION-GUIDE.md` - Full integration guide
- `MCP-AUTOMATION-RESEARCH.md` - Research and options
- `MCP-CRON-QUICK-REFERENCE.md` - Quick command reference
