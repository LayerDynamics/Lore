---
description: Create a new skill, command, or agent in the lore framework with guided setup, templates, and validation.
argument-hint: "<type> <name> (e.g., \"skill dependency-analysis\", \"command review\", \"agent code-explorer\")"
---

# create: Create

**Load the create skill first** using the Skill tool.

## Starting Context

`$ARGUMENTS` specifies what to create: `<type> <name>` where type is `skill`, `command`, or `agent`. Pass the full `$ARGUMENTS` string to the skill.

If `$ARGUMENTS` is empty, ask: "What do you want to create? (skill / command / agent) and what should it be named?"

## Run the Full Workflow

Execute every step in the skill without skipping. No phase is optional.
