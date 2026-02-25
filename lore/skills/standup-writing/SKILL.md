---
name: standup-writing
description: This skill should be used when the user asks to "generate a standup", "write my standup", "create a status update", "what did I work on", "summarize my work", "daily update", or any request to produce a progress summary from git history or recent activity.
---

# Writing Effective Standups

## What Makes a Good Standup

A standup communicates three things clearly:
1. **Yesterday**: Concrete completed work (not "worked on X", but "implemented X" or "fixed Y in Z")
2. **Today**: What's next — specific tasks, not vague "continue working"
3. **Blockers**: What is stopping progress (or "none")

Total length: 6-10 bullets. Readable in 30 seconds.

## Reading Git History for Standups

Use git log to extract meaningful commits:

```bash
# Yesterday's work (adjust range as needed)
git log --oneline --since="yesterday 6pm" --until="now"

# Work since last Monday
git log --oneline --since="last Monday"

# Work by specific author
git log --oneline --since="yesterday" --author="$(git config user.email)"
```

Each commit message becomes a bullet after translation:
- `feat: add JWT verification` → "Implemented JWT token verification in auth module"
- `fix: null pointer in fetchUser` → "Fixed null pointer exception in user fetch (auth.ts)"
- `refactor: split CompositorLayer` → "Refactored CompositorLayer into separate render and compose phases"

## Translation Rules

**From commit to standup bullet:**
1. Drop ticket numbers, issue IDs, PR numbers (unless team wants them)
2. Expand abbreviations — "feat" → "implemented", "fix" → "fixed", "refactor" → "refactored"
3. Add context — not just "fixed bug" but "fixed null pointer in fetchUser when user ID not found"
4. Group related commits into one bullet if they're part of the same feature

**Avoid these phrases:**
- "worked on" (too vague)
- "continued" (what specifically?)
- "various fixes" (name them)
- "miscellaneous" (never)

## Check In-Progress Work

Also check git status for what's actively being worked on:
```bash
git status --short
git diff --stat HEAD | tail -3
```

Unstaged changes = "in progress today" material.

## Blockers

A blocker is:
- Waiting for someone else's PR/review
- Missing credentials, access, or information
- A bug in a dependency blocking progress
- An unclear requirement that needs decision

"None" is a valid and common answer. Don't invent blockers.

## Format Reference

```
Yesterday:
- Implemented [specific thing] in [module/file]
- Fixed [specific bug] causing [specific symptom]
- Reviewed [PR/code] for [person/team]

Today:
- Implementing [specific next step]
- Investigating [specific issue] in [module]

Blockers:
- None
```