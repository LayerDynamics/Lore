---
description: Deep code exploration returning structured findings — file paths, execution traces, integration points — without PR-style review synthesis. Use when you want raw findings to build on, not a formatted review.
argument-hint: What to investigate (e.g., "how categorization service handles cache invalidation", "where quality_score column is written")
---

# Investigation: $ARGUMENTS

You are performing a focused deep-dive into the codebase. Return structured findings without review synthesis.

## Step 1: Parse Subject

The investigation subject is: `$ARGUMENTS`

If `$ARGUMENTS` is empty, ask the user:
> What would you like me to investigate? (e.g., "how taxonomy cache invalidation works", "what tables auto-publisher reads and writes")

## Step 2: Dispatch code-explorer

Launch a single **code-explorer** agent with:
- The investigation subject
- Instruction: "Trace the execution path, map all relevant code, and return structured findings with exact file:line references. Do not synthesize into a review — return raw exploration findings."

## Step 3: Present Findings

Present the agent's findings directly to the user. Include:
- The entry point discovered
- The execution path (ordered steps)
- Key files and line numbers
- Any open questions the agent flagged

After presenting, offer the user two follow-up options:
1. "Run `/code-intel:review $ARGUMENTS` to get a PR-style review of these findings"
2. "Ask me to investigate a specific aspect further"
