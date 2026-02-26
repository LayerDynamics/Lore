---
description: List all implementation plans in docs/plans/ sorted by date, showing goal and task count for each.
argument-hint: ""
allowed-tools: ["Bash", "Read", "Glob"]
---

# writing-plans: List Plans

Show all saved implementation plans. Every plan is listed — nothing filtered.

## Step 1: Find All Plans

Run:
```bash
ls -lt docs/plans/*.md 2>/dev/null
```

If no plans found, output: "No plans found in docs/plans/. Run /writing-plans:plan to create one."
Then stop.

## Step 2: Read Each Plan

For each file, extract:
1. **Filename** (= date + feature name)
2. **Goal** — the line starting with `**Goal:**`
3. **Task count** — count lines matching `### Task `
4. **Last modified** — from `ls -lt` output

## Step 3: Output the List

```
## Implementation Plans

| Plan | Goal | Tasks | Date |
|------|------|-------|------|
| 2026-02-17-auth.md | Add OAuth login to the API | 6 | 2026-02-17 |
| 2026-02-15-search.md | Implement full-text search | 4 | 2026-02-15 |
```

List all plans, sorted by date descending (newest first). Do not omit any.

After the table, output the count: "**[N] plan(s) found.**"
