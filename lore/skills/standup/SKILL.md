---
name: standup
description: Generate a concise daily standup update from recent git commits and current working state. Shows what was done, what's in progress, and any blockers.
argument-hint: Optional time range (e.g. "yesterday", "last 2 days", "since Monday")
---

# Standup Generator

Generate a professional standup update from git history and working state.

## What Makes a Good Standup

A standup communicates three things clearly:
1. **Yesterday**: Concrete completed work (not "worked on X", but "implemented X" or "fixed Y in Z")
2. **Today**: What's next — specific tasks, not vague "continue working"
3. **Blockers**: What is stopping progress (or "none")

Total length: 6-10 bullets. Readable in 30 seconds.

## Step 1: Get Recent Commits

```bash
# Get commits from the relevant time range
# Default: since yesterday 6pm (captures today's morning commits too)
git log --oneline --since="yesterday 6pm" --author="$(git config user.email)" 2>/dev/null || \
git log --oneline -20
```

If `$ARGUMENTS` specifies a range (e.g. "last 2 days"), adjust `--since` accordingly.

## Step 2: Check Working State

```bash
# What's currently in progress (unstaged/staged changes)
git status --short
git diff --stat HEAD 2>/dev/null | tail -5
```

Unstaged changes = "in progress today" material.

## Step 3: Check Open PRs / Branches

```bash
# Current branch and any recent pushes
git branch --show-current
git log --oneline origin/$(git branch --show-current)..HEAD 2>/dev/null | head -5
```

## Step 4: Translate Commits to Bullets

Each commit message becomes a bullet after translation:
- `feat: add JWT verification` → "Implemented JWT token verification in auth module"
- `fix: null pointer in fetchUser` → "Fixed null pointer exception in user fetch (auth.ts)"
- `refactor: split CompositorLayer` → "Refactored CompositorLayer into separate render and compose phases"

### Translation Rules

1. Drop ticket numbers, issue IDs, PR numbers (unless team wants them)
2. Expand abbreviations — "feat" → "implemented", "fix" → "fixed", "refactor" → "refactored"
3. Add context — not just "fixed bug" but "fixed null pointer in fetchUser when user ID not found"
4. Group related commits into one bullet if they're part of the same feature

## Step 5: Generate Standup

Format as a concise standup:

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

## Anti-Patterns to Avoid

These phrases must never appear in a standup bullet:
- "worked on" (too vague)
- "continued" (what specifically?)
- "various fixes" (name them)
- "miscellaneous" (never)

## Style Rules

- Each bullet is one sentence, action-oriented
- Name the specific thing done, not "worked on X" but "implemented X" or "fixed Y in Z"
- Keep each bullet under 15 words
- If no blockers, write "None"
- Total output: 6-10 bullets max

## What Counts as a Blocker

A blocker is:
- Waiting for someone else's PR/review
- Missing credentials, access, or information
- A bug in a dependency blocking progress
- An unclear requirement that needs decision

"None" is a valid and common answer. Don't invent blockers.

If $ARGUMENTS is provided (e.g. "yesterday", "last 3 days"), expand the git log range accordingly and include more commits.
