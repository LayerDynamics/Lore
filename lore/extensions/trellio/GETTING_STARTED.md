# Trellio - Getting Started

Three ways to use Trellio for task management.

## What's Already Working

The Trellio MCP server is **running and connected**:
- Configured via `.mcp.json` in project root
- Connected to your Trello board
- All 40+ MCP tools available immediately
- No restart needed

## Three Ways to Use Trellio

### Option 1: Direct MCP Tools (Works Now!)

Use MCP tools directly without slash commands:

```bash
# View board
mcp__trellio__trellio_get_board_snapshot

# Add task
mcp__trellio__trellio_quick_add_task

# Move card
mcp__trellio__trellio_move_card_through_pipeline
```

**Pros:**
- Works immediately
- Full power of all MCP tools
- No installation needed

**Cons:**
- Longer command names
- Less convenient than slash commands

**See:** `MCP_TOOLS_REFERENCE.md` for complete tool list

---

### Option 2: Plugin Commands (Install Required)

Install the Trellio extension and get friendly slash commands:

```bash
./install.sh
# Then restart Claude Code
```

After install, use friendly slash commands:

```bash
/board      # View board snapshot
/add        # Add a new task
/planning   # Daily planning
/cleanup    # Organize board
/status     # Check task status
```

**Pros:**
- Short, memorable commands
- Priority-based task management

**Cons:**
- Requires installation
- Needs Claude Code restart

**See:** `commands/` directory for command definitions

---

### Option 3: Global Trellio Plugin

Use the original Trellio plugin globally:

The plugin at `~/.claude/plugins/trellio/` provides global access. Commands are prefixed with `/trellio-`:
- `/trellio-board`, `/trellio-planning`, `/trellio-add`, etc.

---

## Quick Reference

### Common Workflows

**Morning Planning:**
```
1. mcp__trellio__trellio_get_board_snapshot
2. Review Upcoming tasks
3. Move prioritized tasks to Today
```

**Add a Task:**
```
mcp__trellio__trellio_quick_add_task
-> Title: "Fix login bug"
-> List: today
-> Priority: High
-> Due date: (optional)
```

**Complete Work:**
```
1. mcp__trellio__trellio_move_card_through_pipeline
   -> card_id: <id>
   -> target_list: done
2. Pull next prioritized task from Today to Working on
```

---

## Recommended Approach

1. **Start with Option 1** (MCP tools) - works now
2. **Install Option 2** when convenient - nicer commands
3. **Use Option 3** for global access across projects

**Command reference:**
- MCP tools: See `MCP_TOOLS_REFERENCE.md`
- Slash commands: See `commands/` directory
- Installation: Run `./install.sh`

---

## Configuration

### MCP Server

Configuration (`.mcp.json`):
- Trello API credentials from environment variables
- Board/list/label IDs from environment variables

### Environment Variables

Set in your `~/.zshrc`:
- `TRELLO_API_KEY`
- `TRELLO_TOKEN`
- `TRELLO_BOARD_ID`
- `TRELLO_LIST_*_ID` (for each list)
- `TRELLO_LABEL_*_ID` (for each label)
- `N8N_BASE_URL` and `N8N_API_KEY` (optional)

---

## Task Management Approach

**Planning based on:**
- Task priorities (High/Medium/Low)
- Due dates
- Dependencies
- Current board state

---

## Documentation

- `README.md` - Overview and setup
- `GETTING_STARTED.md` - This file
- `MCP_TOOLS_REFERENCE.md` - Complete MCP tools list
- `commands/` - Slash command definitions
- `plugin.json` - Plugin configuration

---

## Next Steps

1. **Try it now:**
   ```
   mcp__trellio__trellio_get_board_snapshot
   ```

2. **Install commands (optional):**
   ```bash
   ./install.sh
   # Restart Claude Code
   ```

3. **Use it daily:**
   - Morning: `/planning` or MCP planning workflow
   - During work: Add tasks, move cards, check status
   - End of day: `/cleanup` or MCP cleanup
