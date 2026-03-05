# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trellio is a Trello MCP server providing full board management, task automation, energy-based task matching, and productivity tools. It works with any Trello board — just provide your API key and token.

## Common Commands

```bash
# Build the MCP server
cd mcp-server && npm run build

# Development mode (watch)
cd mcp-server && npm run dev

# Typecheck
cd mcp-server && npm run typecheck
```

## Architecture

```
MCP Server (TypeScript, stdio transport)
├── Trello CRUD — cards, lists, labels, checklists, boards
├── Trellio Tools — board snapshot, pipeline moves, quick-add, batch ops
├── Coach Tools — energy matching, capacity planning, crash recovery
└── Codebase Tools — file read/write/search within PROJECT_DIR
```

## Key Directories

- `mcp-server/src/` — TypeScript MCP server source
  - `trello/` — Trello API client, tool registry, helpers, resources, prompts
  - `coach/` — Productivity coaching tools (energy matching, capacity, accountability)
  - `codebase/` — File system tools scoped to PROJECT_DIR
- `commands/` — Slash commands for board management
- `skills/` — Workflow skills (board management, bulk ops, team productivity)
- `agents/` — Subagent definitions
- `hooks/` — Claude Code hooks

## Configuration

Only `TRELLO_API_KEY` and `TRELLO_TOKEN` are required. Board ID, list IDs, and label IDs are all optional — use `trellio_list_boards` and `trellio_get_board` to discover them dynamically.

## Not on Production

This is not running on a production server. All commands need to be provided explicitly.
