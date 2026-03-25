---
description: Compare two versions of an application to verify feature parity, catch subtle regressions, and confirm intricate details are correctly rebuilt across versions.
argument-hint: "<original-path> <new-path> [--focus \"area\"] [--depth quick|standard|deep]"
---

# parity-check-audit: Parity Check Audit

**Load the parity-check-audit skill first** using the Skill tool.

## Starting Context

`$ARGUMENTS` contains the paths to the original and new versions, and optional flags (`--focus`, `--depth`). Pass the full `$ARGUMENTS` string to the skill.

If `$ARGUMENTS` is missing the two paths, ask: "What are the paths to the original and new versions to compare?"

## Run the Full Workflow

Execute every step in the skill without skipping. No phase is optional.
