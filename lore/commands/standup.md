---
description: Generate a concise daily standup update from recent git commits and current working state. Shows what was done, what's in progress, and any blockers.
argument-hint: Optional time range (e.g. "yesterday", "last 2 days", "since Monday")
---

# Standup Generator

Generate a professional standup update from git history and working state.

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

## Step 3: Check Open PRs / Branches

```bash
# Current branch and any recent pushes
git branch --show-current
git log --oneline origin/$(git branch --show-current)..HEAD 2>/dev/null | head -5
```

## Step 4: Generate Standup

Format as a concise standup:

```
**Yesterday / Since last standup:**
- [Concrete accomplishment from commits]
- [Another accomplishment]

**Today:**
- [In-progress work from git status / recent commits]
- [Planned next steps]

**Blockers:**
- [Any blockers you're aware of from the conversation context, or "None"]
```

**Style rules:**
- Each bullet is one sentence, action-oriented
- Name the specific thing done, not "worked on X" but "implemented X" or "fixed Y in Z"
- Keep each bullet under 15 words
- If no blockers, write "None"
- Total output: 6-10 bullets max

If $ARGUMENTS is provided (e.g. "yesterday", "last 3 days"), expand the git log range accordingly and include more commits.
