# Team Configuration Guide

## Customizing Lore for Your Team

Lore is designed to be extended and customized. Here's how teams can adapt it.

## Approach 1: Plugin Settings (.local.md)

Create a `.local.md` file in the plugin root to add team-specific instructions:

```
lore/.local.md
```

This file is loaded into context and can override or extend default behavior.

## Approach 2: Selective Skill Adoption

Not every team needs every skill. To use only specific skills:

1. Fork or clone Lore
2. Remove skill directories you don't need
3. Add team-specific skills to `skills/`

## Approach 3: Extension Modules

Add team-specific tooling as extensions:

```
lore/extensions/your-team/
├── .claude-plugin/plugin.json
├── commands/
├── skills/
└── agents/
```

## Approach 4: Project-Level Overrides

Add project-specific CLAUDE.md instructions that reference Lore skills:

```markdown
# Project Instructions
- Always use the test-driven-development skill for new features
- Skip brainstorming for bugfixes under 20 lines
```
