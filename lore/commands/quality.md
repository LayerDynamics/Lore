---
description: Code quality enforcement — scan for placeholders and stubs, fix incomplete implementations, and apply quality gates before shipping. Covers the full quality lifecycle from detection through remediation to merge readiness.
argument-hint: "[--mode scan|fix|gates] [path or options]"
---

# quality: Quality

**Load the quality skill first** using the Skill tool.

## Starting Context

`$ARGUMENTS` contains an optional `--mode` flag and optional path. Pass the full `$ARGUMENTS` string to the skill.

- `--mode scan` — find all placeholder/stub/incomplete code
- `--mode fix` — guided remediation of found issues
- `--mode gates` — check merge readiness against quality gates
- No mode specified — skill selects based on context or asks

## Run the Full Workflow

Execute every step in the skill without skipping. No phase is optional.
