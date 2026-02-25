# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Lore is a Claude Code plugin framework that bundles skills, commands, agents, and hooks into a single installable plugin. The core plugin lives in `lore/` — the top-level repo is the development workspace.

## Dependencies

- Node.js
- Deno (for some extensions and resources)

## Installation (Development)

```bash
cd lore && ./bin/install.sh
```

This symlinks `lore/` into `~/.claude/plugins/lore`. Verify with `/lore:list` in a Claude Code session.

## Repository Layout

- `lore/` — The plugin itself (this is what gets installed)
  - `.claude-plugin/plugin.json` — Plugin manifest
  - `skills/` — Workflow skills (each subdirectory contains a `SKILL.md`)
  - `commands/` — Slash commands grouped by namespace (`lore`, `code-intel`, `local`, `planning-ext`, `research`, `quality`, `scale-review`, `security-check`)
  - `agents/` — Subagent definitions (`.md` files)
  - `hooks/` — Session hooks (`hooks.json`, `start-session.sh`, `verify-completion.sh`)
  - `lib/` — Shared conventions, utilities, and the skill template
  - `templates/` — Scaffolding templates for new agents, commands, plugins, skills
  - `extensions/` — Optional sub-plugins (trellio, browserx, scratchpad, mcp-trigger-gateway, findlazy, cc-telemetry)
- `resources/` — Reference implementations from upstream frameworks (superpowers, loki-mode, get-shit-done, SuperClaude)
- `research/` — Research notes and docs on Claude Code plugins, skills, and frameworks

## Architecture

Lore follows the Claude Code plugin structure: `plugin.json` declares the plugin, and Claude Code discovers skills, commands, agents, and hooks from their respective directories.

**Skills** are the core abstraction — structured markdown workflows (e.g., TDD, debugging, brainstorming) that guide Claude through complex tasks deterministically. Each skill lives in `skills/<name>/SKILL.md`.

**Commands** are slash-command entry points (e.g., `/lore:init`, `/code-intel:review`). Each namespace is a subdirectory under `commands/`.

**Agents** define specialized subagents for parallel work. They are markdown files in `agents/`.

**Extensions** are self-contained sub-plugins with their own MCP servers or integrations (e.g., trellio has Trello MCP tools, browserx has browser automation).

## Key Rules

- If something is called but missing, it should be implemented — not removed
- All commands must be provided explicitly (not running on production server)
- Unused variables, methods, or imports should always be used as intended — they are critical to operations
