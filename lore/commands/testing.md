---
description: All testing workflows — test-driven development (write test first, watch fail, implement), coverage analysis (find untested code, prioritize what to test), and scale testing (verify behavior under load).
argument-hint: "[--mode tdd|coverage|scale] [path or component]"
---

# testing: Testing

**Load the testing skill first** using the Skill tool.

## Starting Context

`$ARGUMENTS` contains an optional `--mode` flag and optional path or component. Pass the full `$ARGUMENTS` string to the skill.

- `--mode tdd` — test-driven development: write failing test, implement, verify
- `--mode coverage` — find untested code, prioritize what to add
- `--mode scale` — generate and run scale tests at 10x/100x/1000x
- No mode — skill selects based on trigger phrases or asks

## Run the Full Workflow

Execute every step in the skill without skipping. No phase is optional. In TDD mode: no production code without a failing test first — this rule has no exceptions.
