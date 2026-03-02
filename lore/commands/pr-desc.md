---
description: Generate a pull request title and description from the current branch's diff against main. Produces a structured PR body ready to paste.
argument-hint: Optional base branch (default "main")
---

# PR Description Generator

Generate a structured pull request description from the current branch.

## Step 1: Gather Context

```bash
git log --oneline main..HEAD
git diff main...HEAD --stat
git diff main...HEAD
git branch --show-current
```

If `$ARGUMENTS` specifies a base branch, use that instead of `main`.

For large diffs (>500 lines), read the stat summary and focus on the most-changed files.

## Step 2: Analyze Changes

Categorize commits and changes:
- **New features** — new files, new exports, new endpoints
- **Bug fixes** — error handling changes, condition fixes
- **Refactors** — renames, restructuring, extraction
- **Tests** — new or modified test files
- **Config/docs** — non-code changes

## Step 3: Generate PR Description

Output:

```markdown
## Title
<concise title under 70 chars — imperative mood>

## Summary
<1-3 bullet points covering what changed and WHY>

## Changes
- <grouped by category from Step 2>

## Test Plan
- [ ] <how to verify each major change>

## Notes
<breaking changes, migration steps, or reviewer callouts — omit if none>
```

Keep it factual. Don't inflate small changes. If it's a one-liner fix, the description should be proportionally brief.
