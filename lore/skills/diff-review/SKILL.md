---
description: Review all current git changes (staged + unstaged) before committing. Checks for bugs, security issues, unfinished code, and style inconsistencies. Focuses on the DIFF, not the whole codebase.
argument-hint: Optional focus area (e.g. "security", "performance", "logic") or --quick for fast pre-commit sanity check
---

# Diff Review

Review all current changes before they are committed. Supports two modes: Quick Mode for a fast pre-commit sanity check, and Full Mode for comprehensive diff analysis.

If `$ARGUMENTS` contains `--quick`, run Quick Mode only. Otherwise run Full Mode (which includes the quick checks).

---

## Quick Mode — Pre-Commit Sanity Check (2-5 minutes)

### The Mindset

A pre-commit review is NOT a full code review — it's a last-chance sanity check on the specific diff before it becomes permanent.

Focus on:
1. **Accidents** — things left in that shouldn't be (debug logs, temp code, credentials)
2. **Obvious bugs** — logic errors visible in the diff without deep context
3. **Completeness** — nothing half-finished or stubbed

Skip deep architectural review at this stage — that belongs in the PR review.

### Step Q1: Get the Diff

```bash
git diff HEAD --stat
git status --short
```

### Step Q2: Secrets and Credentials (30 seconds)

Highest priority — if a secret goes in, it needs to come out immediately.

Look for:
- API keys, tokens, passwords in strings
- `.env` file modifications with real values
- Hardcoded IP addresses or connection strings with credentials
- Any base64 blob that could be encoded credentials

```bash
git diff HEAD | grep -E "(password|secret|api_key|token|private_key)\s*=\s*['\"][^'\"]{8,}" -i
```

### Step Q3: Debug Code Left In (30 seconds)

- `console.log`, `print()`, `dbg!()`, `fmt.Println` that are clearly debug-only
- Commented-out code blocks (not intentional TODOs, just noise)
- Test data hardcoded into production paths

### Step Q4: Placeholder and Stub Check (30 seconds)

- `unimplemented!()`, `todo!()`, `NotImplementedError`, `raise NotImplementedError`
- `// TODO: implement` without the implementation
- Return values of `null`, `None`, `[]`, `{}` where real data is expected
- Comments saying "for now" or "in a real implementation"

### Step Q5: The Logic Spot-Check (2-3 minutes)

For each changed function, check:
- Does the function still correctly handle its inputs at the boundaries?
- If there's a new conditional branch, does the else/default case make sense?
- If something is now called in a loop, is that intentional?
- If an error is now caught and handled, is the handler correct?

### Step Q6: Test Coverage (1 minute)

- For each new or modified function: is there a corresponding test change?
- For bug fixes: is there a regression test?
- "I'll add tests later" = not ready to commit

### Quick Mode Verdict

```
Pre-commit check: [CLEAN / ISSUES FOUND]

Blockers (do not commit):
- [issue]

Warnings (commit with caution):
- [issue]

Notes (consider for follow-up):
- [issue]
```

If clean: "No issues found. Diff looks ready to commit."

If `$ARGUMENTS` is `--quick`, stop here.

### Common Pre-Commit Failures

**"Just a quick fix" that isn't:**
A 2-line fix that required understanding a complex system — worth a second pair of eyes.

**Mixed commits:**
Whitespace cleanup mixed with logic changes makes the diff hard to review. Separate them.

**Partial features:**
The new code is wired in but the integration isn't complete. It compiles but doesn't actually work end-to-end.

---

## Full Mode — Comprehensive Diff Analysis

### Step 1: Get the Full Diff

```bash
git diff --cached
git diff
git diff HEAD --stat
git log --oneline -5
git status --short
```

For any file with complex changes (>30 lines), read the full file to understand context.

### Step 2: Review Checklist

Check every changed section against:

#### Logic & Correctness
- [ ] No off-by-one errors in loops or array indexing
- [ ] Edge cases handled (null, empty, zero, negative values)
- [ ] Error paths don't swallow exceptions silently
- [ ] Async operations handled correctly, no unhandled rejections
- [ ] No race conditions introduced

#### Security
- [ ] No credentials, API keys, or secrets in the diff
- [ ] User input is validated/sanitized before use
- [ ] No injection vectors introduced (SQL, shell, path)
- [ ] File paths don't allow traversal with `..`

#### Completeness
- [ ] No TODO/FIXME comments left in changed code
- [ ] No unimplemented!(), todo!(), NotImplementedError in diff
- [ ] No placeholder return values (null/None/empty)
- [ ] No deceptive comments ("for now", "in a real implementation")
- [ ] No debug print/log/dbg! statements left in

#### Tests
- [ ] Changed logic has corresponding test changes
- [ ] New public functions have at least one test path covered

### Step 3: Report

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
