---
name: create
description: Create a new skill, command, or agent in the lore framework with guided setup, templates, and validation.
argument-hint: <type> <name> (e.g., "skill dependency-analysis", "command review", "agent code-explorer")
---

# Lore: Create

Create new skills, commands, or agents in the lore framework with guided configuration.

## Step 1: Determine What to Create

Extract from `$ARGUMENTS`:
- **Type** (required): `skill`, `command`, or `agent`
- **Name** (required): kebab-case name (e.g., `dependency-analysis`)
- Any additional flags are passed through to the type-specific workflow below

If type is missing or unclear, ask the user:
> What are you creating?
> - **skill** — a structured workflow that guides Claude through a complex task
> - **command** — a user-invocable slash command
> - **agent** — an autonomous subagent dispatched for specialized work

If name is missing, ask the user:
> What should it be named? (use kebab-case, e.g., `dependency-analysis`)

Validate the name:
- Must be kebab-case (lowercase, hyphens only)

Then branch to the appropriate workflow below.

---

## Branch A: Create Skill

### A1: Parse Additional Arguments

Extract from remaining `$ARGUMENTS`:
- **Description** (optional): `--description "..."` — trigger description for automatic skill matching

### A2: Gather Skill Details

If no `--description` was provided, ask the user:

1. **What does this skill do?** (becomes the description trigger phrase)
2. **Is this skill rigid (follow exactly) or flexible (adapt to context)?**

### A3: Read the Skill Template

Read the skill template from the lore framework:
```
lore/templates/skill/SKILL.md
```

### A4: Create the Skill Directory and File

Create the directory:
```
lore/skills/<skill-name>/
```

Create `lore/skills/<skill-name>/SKILL.md` with:

```markdown
---
name: <skill-name>
description: Use when <trigger-description>
---

# <Skill Title>

## Purpose

<What this skill accomplishes — fill in>

## When to Use

- <Condition 1>
- <Condition 2>

## Process

### Step 1: Assess

Evaluate the situation before acting.

### Step 2: Execute

Perform the core work.

### Step 3: Verify

Confirm the outcome meets expectations.

## Rules

- <Rule 1>
- <Rule 2>

## Output

<What this skill produces when followed correctly>
```

Fill in the `name` and `description` from the user's input. Leave process/rules sections as skeleton for the user to complete.

### A5: Confirm

Output:

```
Skill created: <skill-name>

Created:
  lore/skills/<skill-name>/SKILL.md

Next steps:
  1. Edit SKILL.md to define the skill's process, rules, and output
  2. Add supporting files in lore/skills/<skill-name>/ if needed (references/, examples/)
  3. Test by asking Claude questions that match the trigger description
  4. Run /lore:list to verify the skill appears in the inventory
```

---

## Branch B: Create Command

### B1: Parse Additional Arguments

Extract from remaining `$ARGUMENTS`:
- **Namespace** (optional): `--namespace <ns>` — command group (e.g., `quality`, `local`, `lore`)
- **Description** (optional): `--description "..."` — one-line description

### B2: Determine Namespace

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

### B3: Gather Command Details

If no `--description` was provided, ask:

1. **What does this command do?** (becomes the description)
2. **Does it take arguments?** If yes, what format? (becomes `argument-hint`)
3. **What tools does it need?** Common options:
   - Read, Write, Glob, Grep (file operations)
   - Bash (shell commands)
   - AskUserQuestion (interactive)
   - Task (subagent dispatch)
   - Skill (load skills)

### B4: Read the Command Template

Read the command template:
```
lore/templates/command/command-template.md
```

### B5: Create the Command File

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

### B6: Confirm

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

---

## Branch C: Create Agent

### C1: Parse Additional Arguments

Extract from remaining `$ARGUMENTS`:
- **Description** (optional): `--description "..."` — what the agent does

### C2: Gather Agent Details

Ask the user (skip any already provided):

1. **What does this agent do?** (becomes the description)
2. **When should it be dispatched?** Provide 2-3 concrete example scenarios:
   - "User asks to [do X]" -> launch this agent
   - "Task requires [Y]" -> launch this agent
3. **What tools does it need?** Common options:
   - Read, Glob, Grep (read-only exploration)
   - Bash (command execution)
   - Write, Edit (file modification)
   - WebFetch, WebSearch (web access)
4. **Should it trigger proactively** (after certain events) **or only when explicitly requested?**

### C3: Read the Agent Template

Read the agent template:
```
lore/templates/agent/agent-template.md
```

### C4: Create the Agent File

Create `lore/agents/<agent-name>.md`:

```markdown
---
name: <agent-name>
description: "<description>

<example>
Context: <scenario 1>
user: \"<user message>\"
assistant: \"I'll use the <agent-name> agent to <action>.\"
<commentary>
<Why this agent is appropriate for this scenario.>
</commentary>
</example>

<example>
Context: <scenario 2>
user: \"<user message>\"
assistant: \"Let me launch the <agent-name> agent to <action>.\"
<commentary>
<Why this agent is appropriate.>
</commentary>
</example>"
model: opus
tools: [<selected-tools>]
---

# <Agent Title>

## Role

<Describe the agent's purpose and area of expertise.>

## Instructions

1. <First step the agent should take>
2. <Second step>
3. <Third step>
4. <Continue as needed>

## Output Format

<Describe what the agent should return when done.>
- Key findings or results
- File references with file:line format
- Actionable recommendations
```

Fill in all fields from the user's input. The `description` field MUST include `<example>` blocks — these are how Claude Code decides when to dispatch the agent.

### C5: Confirm

Output:

```
Agent created: <agent-name>

Created:
  lore/agents/<agent-name>.md

Dispatch examples:
  - <scenario 1 summary>
  - <scenario 2 summary>

Next steps:
  1. Refine the agent's instructions and output format
  2. Add more <example> blocks to improve dispatch accuracy
  3. Test by describing a scenario that matches the examples
  4. Run /lore:list to verify the agent appears in the inventory
```
