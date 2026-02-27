---
name: init
description: Initialize lore in a project by creating .claude/settings.local.json pointing to the lore plugin.
user_invocable: true
allowed-tools: ["Bash", "Read", "Write", "Glob"]
---

# Lore: Init

Initialize the lore framework in the current project.

## Step 1: Check for Existing Configuration

Check if `.claude/settings.local.json` already exists in the current working directory.

If it exists, read it to check whether the lore plugin is already configured.

## Step 2: Determine Lore Plugin Path

The lore plugin lives at the path where this command is installed. Resolve the absolute path to the lore plugin root (the directory containing `.claude-plugin/plugin.json`).

Default expected path: `~/lore/lore`

## Step 3: Create or Update Configuration

Create `.claude/settings.local.json` (and the `.claude/` directory if needed) with the following structure:

```json
{
  "permissions": {
    "allow": []
  },
  "mcpServers": {},
  "plugins": [
    "/absolute/path/to/lore/lore"
  ]
}
```

If the file already exists:
- If `plugins` array exists and does NOT contain the lore path, append it
- If `plugins` array already contains the lore path, report that lore is already initialized
- Preserve all other existing settings

## Step 4: Confirm

Output:

```
Lore initialized in this project.

Plugin path: /absolute/path/to/lore/lore
Config file: .claude/settings.local.json

Available commands:
  /lore:list            — List all available lore skills, commands, and agents
  /lore:create-skill    — Create a new skill from template
  /lore:create-command  — Create a new command
  /lore:create-agent    — Create a new agent
  /lore:create-mcp      — Create a new MCP server integration
  /lore:create-plugin   — Guided end-to-end plugin creation
```

If lore was already configured, output:

```
Lore is already initialized in this project.
Config: .claude/settings.local.json
```
