---
description: Guided implementation planning — reads project context, asks about inclusions and dev practices, writes a structured bite-sized plan. Arguments are optional; all workflow phases are mandatory.
argument-hint: optional task description
allowed-tools: ["Read", "Bash", "Write", "AskUserQuestion", "Glob", "Grep", "Skill"]
---

# writing-plans: Plan

**Load the writing-plans skill first** using the Skill tool.

## Starting Context

If `$ARGUMENTS` is provided, treat it as the task description — use it to pre-fill Phase 1 context in the skill. Do NOT skip any discovery phases; the arguments only provide a head start.

If `$ARGUMENTS` is empty, begin the skill from scratch with no pre-filled context.

## Run the Full Workflow

Execute all four phases of the writing-plans skill without skipping:

1. **Phase 1** — Read CLAUDE.md, git log, file types (silent)
2. **Phase 2** — Ask all inclusion/practice questions via AskUserQuestion
3. **Phase 3** — Write the plan to `docs/plans/YYYY-MM-DD-<name>.md`
4. **Phase 4** — Offer execution handoff (subagent-driven or parallel session)

No phase is optional. No question is skippable.
