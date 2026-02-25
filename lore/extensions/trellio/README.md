# Trellio Plugin

Global Trellio commands and MCP integration for task management.

## Setup

Set these environment variables in your shell profile (~/.zshrc or ~/.bashrc):

```bash
# Trello API Credentials
export TRELLO_API_KEY="your-trello-api-key"
export TRELLO_TOKEN="your-trello-token"

# Trello Board Configuration
export TRELLO_BOARD_ID="your-board-id"
export TRELLO_LIST_REFERENCE_ID="your-list-id"
export TRELLO_LIST_THIS_WEEK_ID="your-list-id"
export TRELLO_LIST_TODAY_ID="your-list-id"
export TRELLO_LIST_DOING_ID="your-list-id"
export TRELLO_LIST_DONE_ID="your-list-id"

# Trello Labels
export TRELLO_LABEL_HIGH_PRIORITY_ID="your-label-id"
export TRELLO_LABEL_MEDIUM_PRIORITY_ID="your-label-id"
export TRELLO_LABEL_LOW_PRIORITY_ID="your-label-id"
export TRELLO_LABEL_SIMPLE_TASKS_ID="your-label-id"
export TRELLO_LABEL_DUE_SOON_ID="your-label-id"

# n8n Integration (optional)
export N8N_BASE_URL="https://your-n8n-instance.example.com"
export N8N_API_KEY="your-n8n-api-key"

# Project Directory
export PROJECT_DIR="/path/to/your/trellio"
```

After setting these, restart your terminal or run:
```bash
source ~/.zshrc  # or source ~/.bashrc
```

## Available Commands

### Daily Workflow
- `/using-trellio` - Complete reference guide for all Trellio commands
- `/trellio-planning` - Morning planning workflow with task prioritization
- `/trellio-board` - View current board snapshot
- `/trellio-add` - Quick add task with priority assignment
- `/trellio-priority` - Get tasks matched to your current priorities
- `/trellio-recovery` - Task recovery workflow with smallest actions
- `/trellio-cleanup` - Clean up and organize board
- `/trellio-status` - Check task status and what's in progress
- `/trellio-weekly` - Weekly review and statistics

### Codebase Backfilling
- `/trellio-backfill` - **Comprehensive backfill** - Analyze codebase and populate all tasks
- `/trellio-analyze-code` - Analyze code structure and generate tasks
- `/trellio-extract-todos` - Extract TODO/FIXME comments and create cards
- `/trellio-audit-docs` - Compare documentation to code and create gap tasks

### Project-Specific Commands
- `/defcad-board` - View board snapshot with task status
- `/defcad-add` - Add a new task
- `/defcad-planning` - Daily planning workflow
- `/defcad-cleanup` - Organize board
- `/defcad-status` - Check task status and what's in progress

## Global Access

This plugin is installed in `~/.claude/plugins/trellio/` and works from **any directory**.

## MCP Server

The plugin bundles the Trellio MCP server, providing tools like:
- `trellio_get_board_snapshot`
- `trellio_quick_add_task`
- `trellio_get_priority_matched_tasks`
- `trellio_clean_up_board`
- And 40+ more...

All tools are prefixed as `mcp__plugin_trellio_trellio__*` in Claude Code.

## Documentation

- `README.md` - This file (overview and setup)
- `GETTING_STARTED.md` - Quick start guide
- `MCP_TOOLS_REFERENCE.md` - Complete MCP tools reference
- `commands/` - Slash command definitions
- `plugin.json` - Plugin configuration
