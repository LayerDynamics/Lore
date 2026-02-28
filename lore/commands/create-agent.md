---
name: create-agent
description: Create a new autonomous agent in the lore framework with dispatch examples and tool configuration.
argument-hint: <agent-name> [--description "description"]
---

# Lore: Create Agent

Create a new autonomous agent in the lore framework.

## Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- **Agent name** (required): kebab-case name (e.g., `security-scanner`)
- **Description** (optional): `--description "..."` — what the agent does

If agent name is missing, ask the user:
> What should the agent be named? (use kebab-case, e.g., `security-scanner`)

Validate the name:
- Must be kebab-case
- Must not conflict with an existing agent in `lore/agents/`

## Step 2: Gather Agent Details

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

## Step 3: Read the Agent Template

Read the agent template:
```
lore/templates/agent/agent-template.md
```

## Step 4: Create the Agent File

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
model: inherit
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

## Step 5: Confirm

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
