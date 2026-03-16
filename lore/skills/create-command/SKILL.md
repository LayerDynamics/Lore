---
name: create-command
description: Create a new command in the lore framework with proper frontmatter, namespace, and structure.
argument-hint: <command-name> [--namespace <ns>] [--description "description"]
---

# Lore: Create Command

Create a new user-invocable command in the lore framework.

## Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- **Command name** (required): kebab-case name (e.g., `run-tests`)
- **Namespace** (optional): `--namespace <ns>` — command group (e.g., `quality`, `local`, `lore`)
- **Description** (optional): `--description "..."` — one-line description

If command name is missing, ask the user:
> What should the command be named? (use kebab-case, e.g., `run-tests`)

## Step 2: Determine Namespace

If no `--namespace` was provided:

1. Glob `lore/commands/*/` to discover existing namespaces
2. Ask the user which namespace to use or create a new one:

> Which namespace should this command belong to?
> - lore (framework commands)
> - local (project-local utilities)
> - quality (code quality tools)
> - code-intel (code investigation)
> - research (codebase analysis)
> - planning-ext (planning workflows)
> - (create new namespace)

## Step 3: Gather Command Details

If no `--description` was provided, ask:

1. **What does this command do?** (becomes the description)
2. **Does it take arguments?** If yes, what format? (becomes `argument-hint`)
3. **What tools does it need?** Common options:
   - Read, Write, Glob, Grep (file operations)
   - Bash (shell commands)
   - AskUserQuestion (interactive)
   - Task (subagent dispatch)
   - Skill (load skills)

## Step 4: Read the Command Template

Read the command template:
```
lore/templates/command/command-template.md
```

## Step 5: Create the Command File

Create the namespace directory if it does not exist:
```
lore/commands/<namespace>/
```

Create `lore/commands/<namespace>/<command-name>.md`:

```markdown
---
name: <command-name>
description: <description>
user_invocable: true
argument-hint: <argument-hint or remove if none>
allowed-tools: [<selected-tools>]
---

# <Title>

<Brief description of what this command does.>

## Step 1: <First Step>

<Instructions for Claude to follow.>

## Step 2: <Second Step>

<Instructions for Claude to follow.>

## Step 3: Confirm

Output the result to the user.
```

## Step 6: Confirm

Output:

```
Command created: /<namespace>:<command-name>

Created:
  lore/commands/<namespace>/<command-name>.md

Usage:
  /<namespace>:<command-name> <arguments>

Next steps:
  1. Edit the command to fill in the step-by-step instructions
  2. Instructions are written FOR Claude (Claude executes them when the user runs the command)
  3. Test by running /<namespace>:<command-name> in a Claude Code session
  4. Run /lore:list to verify the command appears in the inventory
```
