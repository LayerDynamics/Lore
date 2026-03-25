---
name: worktree
description: Use when starting isolated work on a branch, running parallel implementations without conflicts, experimenting safely, or when the user says "work in a worktree", "start a worktree", "isolate this work", or "use a worktree for this". Manages the full worktree lifecycle — creation, work, integration, and cleanup.
version: 1.0.0
---

# Local Worktrees

## Purpose

Worktrees create an isolated copy of the repository on a separate branch, letting you implement changes without touching the main working tree. When the work is done, changes integrate back via merge or cherry-pick. When discarded, the worktree is simply removed with no impact on the main tree.

Use worktrees when:
- Trying an approach that might not work out
- Running parallel implementations of the same feature
- Keeping the main working tree clean while experimenting
- Isolating a risky or large refactor

## When to Use This Skill

- User says "work in a worktree" or "start a worktree"
- You are about to implement something experimental or risky
- Multiple agents need to write to overlapping files (see: dispatching-parallel-agents)
- You need to compare two implementations side-by-side
- You want to prototype something without polluting the current branch

## Phase 1: Enter the Worktree

Use the `EnterWorktree` tool to create and switch into an isolated worktree:

```
EnterWorktree({ name: "<descriptive-name>" })
```

**Naming convention**: Use a short, hyphenated description of the work — e.g., `auth-refactor`, `feature-x-experiment`, `parallel-agent-2`. Avoid generic names like `test` or `temp`.

After entering:
- The session's working directory is now the worktree
- You are on a new branch based on HEAD
- The main working tree is untouched
- All file reads, edits, and writes operate within the worktree

Confirm the worktree is active before proceeding. Do not begin work until `EnterWorktree` succeeds.

## Phase 2: Implement in Isolation

Work normally within the worktree. All standard tools apply: `Read`, `Edit`, `Write`, `Bash`, `Glob`, `Grep`.

Rules while in the worktree:
- **Stay in scope**: Only work on the task this worktree was created for
- **Commit regularly**: Small, logical commits are easier to integrate later
- **No side effects**: Do not push, create PRs, or modify shared infrastructure from within a worktree
- **Track what changed**: Note every file created or modified for the integration step

At the end of each logical unit of work, run:
```bash
git add <files> && git commit -m "<description>"
```

Do not leave uncommitted changes when the implementation phase ends.

## Phase 3: Verify Within the Worktree

Before integrating, verify correctness in isolation:

1. **Run tests** — execute the test suite from within the worktree
2. **Build check** — run the build if a build system exists
3. **Read back key files** — confirm they contain the correct, complete implementation
4. **No stubs** — verify no placeholder code was left behind

If verification fails: fix it within the worktree. Do not carry broken code into the main tree.

## Phase 4: Integrate or Discard

### Integrating changes

Once verification passes, bring changes into the main working tree.

**Option A: Merge the worktree branch**

From the main working tree (not inside the worktree):
```bash
git merge <worktree-branch-name>
```
Use when all commits from the worktree should land in the main branch.

**Option B: Cherry-pick specific commits**

From the main working tree:
```bash
git cherry-pick <commit-hash>
```
Use when only some commits from the worktree should be applied.

**Option C: Patch / diff apply**

Generate a diff from the worktree and apply it manually:
```bash
git diff $(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')..<worktree-branch> > /tmp/changes.patch
git apply /tmp/changes.patch
```
Use when the branch history is messy but the final state is correct.

After integrating: run verification again in the main working tree to confirm correctness post-merge.

### Discarding changes

If the experiment failed or is no longer needed, exit the worktree and let it be cleaned up. The session will prompt whether to keep or remove the worktree on exit.

If discarding manually:
```bash
git worktree remove <worktree-path>
git branch -d <worktree-branch-name>
```

## Phase 5: Post-Integration

After changes land in the main tree:

1. **Verify again** — run tests and build in the main working tree
2. **Remove the worktree** — do not leave stale worktrees; they consume disk and create confusion
3. **Delete the branch** — once merged, delete the worktree branch to keep the branch list clean

```bash
git worktree list          # confirm worktree is removed
git branch                 # confirm branch is deleted
```

## Rules

- Never begin work before `EnterWorktree` succeeds
- Always verify within the worktree before integrating
- Always verify again in the main tree after integration
- Commit all changes before leaving the worktree
- Clean up worktrees after integration or discard — do not leave orphans
- One purpose per worktree — do not expand scope once created

## Integration with Other Skills

- **dispatching-parallel-agents**: Use `isolation: "worktree"` on Task calls when agents write to overlapping files. Each agent gets its own worktree automatically.
- **execute**: Can run plan tasks inside a worktree for risky multi-step implementations
- **debug**: Use a worktree to test fixes without polluting the main branch

## Output

When the skill completes successfully:
- Changes are verified and integrated (or cleanly discarded)
- Worktree is removed
- Worktree branch is deleted
- Main working tree is clean and passing verification
- Summary of what was implemented and how it was integrated
