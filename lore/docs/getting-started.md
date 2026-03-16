# Getting Started with Lore

## Prerequisites

- [Claude Code](https://claude.com/claude-code) CLI installed
- A project to work on

## Installation

### Quick Start

```bash
git clone https://github.com/LayerDynamics/lore.git
cd lore/lore
./bin/install.sh
```

Then start a new Claude Code session. Lore loads automatically.

### Verify Installation

In a Claude Code session, run:

```regex
/lore:list
```

You should see all available skills, commands, and agents.

## Your First Skill

Try the TDD workflow on a new feature:

1. Start Claude Code in your project
2. Ask Claude to implement a feature
3. Claude will automatically use `test-driven-development` to write tests first

Or invoke explicitly:

```regex
/lore:scaffold-skill my-custom-skill
```

## Key Concepts

### Skills

Structured workflows that guide Claude through complex tasks. Skills are automatically matched based on context, or you can reference them explicitly.

### Commands

Slash commands you invoke directly: `/local:standup`, `/quality:scan`, `/research:analyze`.

### Agents

Specialized subagents dispatched for parallel work. You don't invoke these directly — Claude dispatches them via the Task tool.

### Extensions

Optional sub-plugins for specific integrations (Trello, browser automation).

## Next Steps

- [Skill Authoring](skill-authoring.md) — Create your own skills
- [Architecture](architecture.md) — Understand how Lore is structured
- [Extending Lore](extending-lore.md) — Add extensions and customizations
