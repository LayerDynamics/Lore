---
description: Use when Claude is ignoring, dismissing, reinterpreting, or failing to acknowledge what the user actually said. Forces the model to address the user's exact words before doing anything else.
---

# ignoring-user-request: Ignoring User Request

**Load the ignoring-user-request skill first** using the Skill tool.

## Starting Context

`$ARGUMENTS` may contain the user's original request that was ignored. If provided, pass it to the skill as the statement to address.

## Run the Full Workflow

Execute every step in the skill without skipping. The skill requires addressing the user's exact words completely and literally before taking any other action.
