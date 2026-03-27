---
description: "End-to-end test expert — writes real E2E tests that exercise full user flows. Detects frameworks, maps journeys, enforces anti-smoke-test rules. Use --audit to review existing tests."
argument-hint: "[path or feature] [--framework playwright|cypress|selenium] [--audit]"
---

# e2e-test-expert: E2E Test Expert

**Load the e2e-test-expert skill first** using the Skill tool.

## Starting Context

`$ARGUMENTS` contains an optional path/feature, optional `--framework` flag, and optional `--audit` flag. Pass the full `$ARGUMENTS` string to the skill.

- `--framework playwright|cypress|selenium` — force a specific framework
- `--audit` — review existing E2E tests for smoke-test masquerading
- No flags — auto-detect framework, write new E2E tests for the specified feature/path

## Run the Full Workflow

Execute every phase in the skill without skipping. No phase is optional.

**Critical rule**: Every E2E test must exercise a complete user journey through the real system. Tests that only check page loads, mock the backend, or assert on implementation details are NOT E2E tests and must be rewritten.
