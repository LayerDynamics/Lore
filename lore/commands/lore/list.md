---
name: list
description: List all available lore skills, commands, and agents registered in the lore framework.
user_invocable: true
allowed-tools: ["Glob", "Read", "Bash"]
---

# Lore: List

List all available lore skills, commands, and agents.

## Step 1: Discover All Components

Scan the lore plugin directory for:

### Commands
```
Glob: lore/commands/**/*.md
```

### Skills
```
Glob: lore/skills/*/SKILL.md
```

### Agents
```
Glob: lore/agents/*.md
```

## Step 2: Extract Metadata

For each component found, read the frontmatter to extract:
- **Name** (from filename or `name` field)
- **Description** (from `description` field)
- **Namespace** (from directory path for commands)

## Step 3: Present the Inventory

Output a structured list:

```
## Lore Inventory

### Commands

| Namespace | Command | Description |
|-----------|---------|-------------|
| lore | /lore:init | Initialize lore in a project |
| lore | /lore:list | List all available components |
| code-intel | /code-intel:investigate | Deep code exploration |
| ... | ... | ... |

### Skills

| Skill | Description |
|-------|-------------|
| outline-understanding | ... |
| verify-before-documenting | ... |

### Agents

| Agent | Description |
|-------|-------------|
| code-explorer | ... |
| review-synthesizer | ... |
| integration-mapper | ... |

**[N] commands, [N] skills, [N] agents available.**
```

List everything found. Do not omit any component.
