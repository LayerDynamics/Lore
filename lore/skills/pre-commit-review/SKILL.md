---
name: pre-commit-review
description: This skill should be used when the user asks to "review my changes before committing", "check this before I push", "pre-commit check", "review the diff", "is this ready to commit", "pre-PR review", or when about to create a commit or PR and wanting to verify quality first.
---

# Pre-Commit Review

## The Mindset

A pre-commit review is NOT a full code review — it's a last-chance sanity check on the specific diff before it becomes permanent. It should take 2-5 minutes, not 20.

Focus on:
1. **Accidents** — things left in that shouldn't be (debug logs, temp code, credentials)
2. **Obvious bugs** — logic errors visible in the diff without deep context
3. **Completeness** — nothing half-finished or stubbed

Skip deep architectural review at this stage — that belongs in the PR review.

## Quick Scan Order

### 1. Secrets and Credentials (30 seconds)
Highest priority — if a secret goes in, it needs to come out immediately.

Look for:
- API keys, tokens, passwords in strings
- `.env` file modifications with real values
- Hardcoded IP addresses or connection strings with credentials
- Any base64 blob that could be encoded credentials

```bash
git diff HEAD | grep -E "(password|secret|api_key|token|private_key)\s*=\s*['\"][^'\"]{8,}" -i
```

### 2. Debug Code Left In (30 seconds)
- `console.log`, `print()`, `dbg!()`, `fmt.Println` that are clearly debug-only
- Commented-out code blocks (not intentional TODOs, just noise)
- Test data hardcoded into production paths

### 3. Placeholder and Stub Check (30 seconds)
- `unimplemented!()`, `todo!()`, `NotImplementedError`, `raise NotImplementedError`
- `// TODO: implement` without the implementation
- Return values of `null`, `None`, `[]`, `{}` where real data is expected
- Comments saying "for now" or "in a real implementation"

### 4. The Logic Spot-Check (2-3 minutes)
For each changed function, check:
- Does the function still correctly handle its inputs at the boundaries?
- If there's a new conditional branch, does the else/default case make sense?
- If something is now called in a loop, is that intentional?
- If an error is now caught and handled, is the handler correct?

### 5. Test Coverage (1 minute)
- For each new or modified function: is there a corresponding test change?
- For bug fixes: is there a regression test?
- "I'll add tests later" = not ready to commit

## Common Pre-Commit Failures

**"Just a quick fix" that isn't:**
A 2-line fix that required understanding a complex system — worth a second pair of eyes.

**Mixed commits:**
Whitespace cleanup mixed with logic changes makes the diff hard to review. Separate them.

**Partial features:**
The new code is wired in but the integration isn't complete. It compiles but doesn't actually work end-to-end.

## Verdict Format

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