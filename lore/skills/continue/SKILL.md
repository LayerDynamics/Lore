---
description: Resume an existing plan at the next incomplete task. If no plan file is specified, scans docs/plans/ and prompts you to choose.
argument-hint: optional path to plan file (e.g. docs/plans/2026-02-17-auth.md)
---

# writing-plans: Continue

Resume an existing implementation plan from where it left off.

## Step 1: Identify the Plan

If `$ARGUMENTS` is provided, treat it as the path to a plan file. Read it immediately.

If `$ARGUMENTS` is empty:
1. Run: `ls -t docs/plans/*.md 2>/dev/null`
2. Present the list to the user with AskUserQuestion — which plan to resume?
3. Read the selected plan.

## Step 2: Find the Next Incomplete Task

Read the full plan. Identify the next task that has NOT been committed/completed:
- Check `git log --oneline` for commit messages matching plan task names
- Or look for any checked-off markers in the plan file itself
- The first task with no matching commit is the next task

## Step 3: Present the Task in Full

Show the complete task block to the user — all steps, all file paths, all code. Do not summarize. The user must see the full task before execution begins.

Confirm: "Ready to execute Task N: [name]? (yes to proceed)"

## Step 4: Execute

Hand off to execution:
- If staying in this session: invoke `superpowers:subagent-driven-development`
- If opening a new session: guide user to open new session and invoke `superpowers:executing-plans`

Do not skip either the confirmation in Step 3 or the execution handoff in Step 4.
