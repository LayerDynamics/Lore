---
description: Review all current git changes (staged + unstaged) before committing. Checks for bugs, security issues, unfinished code, and style inconsistencies. Focuses on the DIFF, not the whole codebase.
argument-hint: Optional focus area (e.g. "security", "performance", "logic")
allowed-tools: ["Bash", "Read", "Grep"]
---

# Diff Review — Pre-Commit Quality Check

Review all current changes before they are committed.

## Step 1: Get the Full Diff

```bash
git diff --cached
git diff
git diff HEAD --stat
git log --oneline -5
git status --short
```

For any file with complex changes (>30 lines), read the full file to understand context.

## Step 2: Review Checklist

Check every changed section against:

### Logic & Correctness
- [ ] No off-by-one errors in loops or array indexing
- [ ] Edge cases handled (null, empty, zero, negative values)
- [ ] Error paths don't swallow exceptions silently
- [ ] Async operations handled correctly, no unhandled rejections
- [ ] No race conditions introduced

### Security
- [ ] No credentials, API keys, or secrets in the diff
- [ ] User input is validated/sanitized before use
- [ ] No injection vectors introduced (SQL, shell, path)
- [ ] File paths don't allow traversal with `..`

### Completeness
- [ ] No TODO/FIXME comments left in changed code
- [ ] No unimplemented!(), todo!(), NotImplementedError in diff
- [ ] No placeholder return values (null/None/empty)
- [ ] No deceptive comments ("for now", "in a real implementation")
- [ ] No debug print/log/dbg! statements left in

### Tests
- [ ] Changed logic has corresponding test changes
- [ ] New public functions have at least one test path covered

## Step 3: Report

If `$ARGUMENTS` specifies a focus area, weight that category higher.

Output:
```
## Diff Review — [N files, +X -Y lines]

### Passes
[What looks good]

### Issues
[file:line — description — severity: low/medium/high]

### Must Fix Before Commit
[Blocking issues only]

Verdict: READY TO COMMIT / FIX BEFORE COMMITTING
```

If no issues: "Diff looks clean. Ready to commit."
