---
description: Connect and wire code components so every part of the system is reachable, callable, and operational. Use when integrating new code, connecting disconnected modules, or auditing for orphaned exports and unregistered handlers.
argument-hint: "<path or component> [--audit]"
---

# electrician: Electrician

**Load the electrician skill first** using the Skill tool.

## Starting Context

`$ARGUMENTS` contains the path or component to wire, and optionally `--audit` to scan the entire project for orphaned/disconnected code. Pass the full `$ARGUMENTS` string to the skill.

If `$ARGUMENTS` is empty, the skill runs in audit mode — scanning for any unconnected components across the project.

## Run the Full Workflow

Execute every step in the skill without skipping. No phase is optional.
