---
name: create-skill
description: Create a new skill from template with guided configuration. Replaces scaffold-skill.
user_invocable: true
argument-hint: <skill-name> [--description "description"]
allowed-tools: ["Read", "Write", "Glob", "Bash", "AskUserQuestion"]
---

# Lore: Create Skill

Create a new skill in the lore framework with guided setup.

## Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- **Skill name** (required): kebab-case name (e.g., `dependency-analysis`)
- **Description** (optional): `--description "..."` — trigger description for automatic skill matching

If `$ARGUMENTS` is empty, ask the user:
> What should the skill be named? (use kebab-case, e.g., `dependency-analysis`)

Validate the name:
- Must be kebab-case (lowercase, hyphens only)
- Must not conflict with an existing skill in `lore/skills/`

## Step 2: Gather Skill Details

If no `--description` was provided, ask the user:

1. **What does this skill do?** (becomes the description trigger phrase)
2. **Is this skill rigid (follow exactly) or flexible (adapt to context)?**

## Step 3: Read the Skill Template

Read the skill template from the lore framework:
```
lore/templates/skill/SKILL.md
```

## Step 4: Create the Skill Directory and File

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

## Step 5: Confirm

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
