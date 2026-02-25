# Lore Architecture

## Overview

Lore is a Claude Code plugin — a directory with a `.claude-plugin/plugin.json` manifest and component directories that Claude Code discovers automatically.

## Directory Structure

```
lore/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest (name, version, description)
├── skills/                   # Automatic workflow matching
│   └── <skill-name>/
│       └── SKILL.md         # Skill definition with YAML frontmatter
├── commands/                 # User-invokable slash commands
│   └── <namespace>/
│       └── <command>.md     # Command with frontmatter
├── agents/                   # Subagent definitions
│   └── <agent-name>.md     # Agent with frontmatter (tools, when-to-use)
├── hooks/
│   ├── hooks.json           # Hook definitions (SessionStart, Stop)
│   └── *.sh                 # Hook scripts
├── lib/                      # Shared conventions and references
├── templates/                # Scaffolding templates
├── extensions/               # Optional sub-plugins
│   └── <ext-name>/
│       ├── .claude-plugin/plugin.json
│       └── ...              # Same structure as root
├── docs/                     # Documentation
├── bin/install.sh            # Manual installer
└── package.json              # npm distribution
```

## How It Works

### Skill Matching
Claude Code reads all `skills/*/SKILL.md` files and matches them to user tasks based on the `description` frontmatter field. When a match is found, the skill content is loaded into context.

### Command Discovery
Commands in `commands/<namespace>/<command>.md` become available as `/namespace:command` slash commands.

### Agent Dispatch
Agents are registered and available for dispatch via the Task tool. Claude uses the `when-to-use` frontmatter to decide when to launch each agent.

### Hooks
- `SessionStart` — Runs when a Claude Code session begins
- `Stop` — Runs when Claude is about to stop (used for verification enforcement)

### Extensions
Extensions are sub-plugins with their own `.claude-plugin/plugin.json`. They're discovered automatically and their components are merged into the main plugin's namespace.

## Design Principles

1. **Convention over configuration** — Follow the directory structure, no config needed
2. **Composable** — Use only what you need, ignore the rest
3. **Portable** — Pure markdown, no build step, works via symlink or npm
4. **Deterministic** — Skills enforce repeatable workflows, not ad-hoc responses
