---
description: Audit the current git diff against the active plan. Reports in-scope changes, out-of-scope drift, completed tasks, and remaining tasks.
argument-hint: ""
---

# writing-plans: Scope Audit

Run a full scope audit comparing what has actually changed in git against what the active plan says should change. Nothing is filtered or omitted from the report.

## Step 1: Get Current Diff

Run:
```bash
git diff --stat HEAD
```

Then:
```bash
git diff HEAD
```

Capture every file that has been modified, created, or deleted since the last commit.

## Step 2: Find the Active Plan

Run:
```bash
ls -t docs/plans/*.md 2>/dev/null | head -1
```

Read the full content of the most recently modified plan file.

## Step 3: Extract Plan File List

From the plan, collect every file path listed under **Files:** sections:
- Lines starting with `Create:`, `Modify:`, or `Test:`
- Strip line numbers (e.g. `existing.ts:45-67` → `existing.ts`)

## Step 4: Compare

For every file in the git diff:
- **In-scope**: file appears in the plan's file list
- **Out-of-scope**: file does NOT appear in the plan's file list

For every task in the plan:
- **Completed**: all its files have been modified AND a matching commit exists in `git log --oneline`
- **Remaining**: not yet committed

## Step 5: Report

Output a structured audit report:

```
## Scope Audit

**Active plan:** docs/plans/[filename]
**Files changed:** [count]

### In-Scope Changes ([count])
- [file] — Task N: [task name]

### Out-of-Scope Changes ([count]) ⚠️
- [file] — NOT in any plan task

### Task Progress
- ✅ Completed: [N tasks]
- ⏳ Remaining: [N tasks]

### Drift Assessment
[CLEAN / MINOR DRIFT / SIGNIFICANT DRIFT — with explanation]
```

Report every finding. Do not omit out-of-scope files. Do not downplay drift.
