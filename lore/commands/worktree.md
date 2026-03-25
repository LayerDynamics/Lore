---
description: Start isolated work on a branch using a git worktree — run parallel implementations without conflicts, experiment safely, or isolate risky changes. Manages the full worktree lifecycle from creation through integration and cleanup.
argument-hint: "[branch-name or description]"
---

# worktree: Worktree

**Load the worktree skill first** using the Skill tool.

## Starting Context

`$ARGUMENTS` contains an optional branch name or description of the work to be isolated. Pass the full `$ARGUMENTS` string to the skill.

If `$ARGUMENTS` is empty, the skill asks what work should be isolated and creates an appropriate branch name.

## Run the Full Workflow

Execute every step in the skill without skipping:

1. **Create** — set up the worktree on a new branch
2. **Work** — perform all changes in the isolated worktree
3. **Integrate** — merge or PR back to the base branch
4. **Cleanup** — remove the worktree after successful integration

No phase is optional.
