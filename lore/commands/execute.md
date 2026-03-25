---
description: Execute an implementation plan task-by-task with verification at every step. Supports resuming from a checkpoint, inline execution, or dispatching subagents per task with two-stage review. Does not stop until every task is proven complete.
argument-hint: "<plan-file> [--mode inline|subagent] [--from <task-number>]"
---

# execute: Execute

**Load the execute skill first** using the Skill tool.

## Starting Context

`$ARGUMENTS` contains the plan file path and optional flags (`--mode inline|subagent`, `--from <task-number>`). Pass the full `$ARGUMENTS` string to the skill.

If no plan file is specified, the skill scans `docs/plans/` for available plans and asks which to resume.

## Run the Full Workflow

Execute every step in the skill without skipping:

1. Find or resume the plan
2. Parse and track tasks
3. Execute tasks with verification (inline or subagent mode)
4. Completion gate — confirm all tasks verified before reporting done

No phase is optional. No task is skippable. No task is complete until verified.
