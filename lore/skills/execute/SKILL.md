---
name: execute
description: Execute implementation plans task-by-task with verification. Supports resuming from a checkpoint, inline execution, or dispatching subagents per task with two-stage review.
argument-hint: <plan-file> [--mode inline|subagent] [--from <task-number>]
---

# Execute

Take an implementation plan, find where you left off (or start fresh), execute each task with verification, and do not stop until every task is proven complete. Optionally dispatch subagents per task with two-stage review.

## The Discipline

Plans fail in execution, not in writing. The gap between "planned" and "done" is where details get dropped, steps get skipped, and shortcuts creep in. This skill closes that gap by enforcing a strict loop: parse, execute, verify, repeat.

## When to Use This Skill

- You have a plan file (from `/lore:plan`, `/lore:blueprint`, or any structured markdown plan)
- You need to resume a partially-completed plan
- You want tracked progress with verification at every step
- You want optional subagent isolation per task with two-stage review

## Step 1: Find or Resume the Plan

### If `$ARGUMENTS` includes a plan file path:
Read it immediately with the `Read` tool.

### If no plan file is specified:
1. Run: `ls -t docs/plans/*.md 2>/dev/null`
2. Present the list to the user — which plan to resume?
3. Read the selected plan.

### Determine starting point:

If `--from <task-number>` is specified, skip to that task.

Otherwise, detect progress automatically:
- Check `git log --oneline` for commit messages matching plan task names
- Check for checked-off markers in the plan file itself
- Check `TaskList` for previously created tasks with completed status
- The first task with no matching commit or completion marker is the starting point

Present what was found:

```
Plan: [plan file path]
Total tasks: [N]
Completed: [N] (tasks 1-K)
Resuming from: Task [K+1]: [task name]
```

## Step 2: Parse and Track Tasks

Read the plan and extract every discrete task from the resume point forward.

1. **Extract tasks** — each must have:
   - A clear, actionable subject (imperative form: "Add auth middleware")
   - A description with enough detail to execute without re-reading the plan
   - An activeForm for progress display ("Adding auth middleware")
   - Acceptance criteria — how do you know this task is done?

2. **Identify dependencies** — which tasks must complete before others can start
3. **Create all tasks** using `TaskCreate` for each extracted task
4. **Set dependencies** using `TaskUpdate` with `addBlockedBy` where ordering matters

Present the parsed task list for confirmation before executing:

```
Parsed [N] tasks from plan:

1. [Task subject] — [brief description]
   Depends on: [none | task IDs]
   Verified by: [acceptance criteria]

2. [Task subject] — ...
```

### Determine execution mode:

- If `--mode subagent` is specified, use subagent mode (Step 2A)
- If `--mode inline` is specified, use inline mode (Step 2B)
- Default: inline mode for tightly-coupled tasks, subagent mode for independent tasks

---

### Step 2A: Execute Tasks — Subagent Mode

For each task in dependency order:

**1. Dispatch implementer subagent**
- Provide full task text and surrounding context (do not make the subagent read the plan file)
- Include scene-setting context — where the task fits in the larger plan
- Fresh subagent per task prevents cross-contamination

**2. If subagent asks questions:**
- Answer clearly and completely
- Provide additional context as needed
- Do not rush into implementation

**3. Subagent implements, tests, commits, and self-reviews**

**4. Two-Stage Review** (see Step 3 below)

**5. Mark task complete, proceed to next**

Subagent rules:
- Fresh subagent per task (no context pollution between tasks)
- Do not dispatch multiple implementer subagents in parallel (conflict risk)
- If a subagent fails, dispatch a fix subagent with specific instructions rather than fixing manually

---

### Step 2B: Execute Tasks — Inline Mode

Work through tasks in dependency order (lowest ID first when no dependencies block).

**For each task:**

1. **Claim the task** — `TaskUpdate` set status to `in_progress`, `TaskGet` for full context

2. **Execute the work**
   - Perform the implementation as described
   - Follow all project conventions (read existing code first, match patterns)
   - Write real code — no stubs, no placeholders, no "implement later" comments
   - If creating files, use `Write`
   - If modifying files, use `Read` first then `Edit`
   - If running commands, use `Bash`

3. **Verify** (see Step 3 below)

4. **Mark complete** — only after verification passes: `TaskUpdate` set status to `completed`

5. **Next task** — `TaskList` to find the next unblocked pending task

Execution rules:
- **One task at a time** — finish and verify before moving to the next
- **No skipping** — if a task is blocked, resolve the blocker first
- **No partial completion** — fully done and verified, or still in progress
- **Errors are your problem** — if something fails, fix it immediately
- **Stay on scope** — only do what the task describes. Discover extra work? Create a new task.

## Step 3: Verify Every Task

Every task must pass verification before it can be marked complete. This is not optional.

### In subagent mode — Two-Stage Review:

**Stage 1 — Spec Compliance:** Does this code do what was asked? Nothing more, nothing less.
- Dispatch a spec compliance reviewer subagent
- If issues found: implementer fixes, reviewer reviews again, repeat until compliant
- Stage 1 must pass before Stage 2 begins

**Stage 2 — Code Quality:** Is this code well-built? Readable, secure, performant, following project patterns.
- Dispatch a code quality reviewer subagent
- If issues found: implementer fixes, reviewer reviews again, repeat until approved

The two stages must remain separate. Mixing them causes "technically correct but wrong feature" failures.

### In inline mode — Verification Checklist:

**For code changes:**
- [ ] File exists at the expected path
- [ ] Read the file back and confirm the code is correct
- [ ] No syntax errors — run linter/compiler if available
- [ ] No stub code, placeholder comments, or empty function bodies
- [ ] Imports are correct and used
- [ ] Matches project conventions

**For new files:**
- [ ] File created at the correct path
- [ ] Content is complete — not a skeleton
- [ ] Integrated with the codebase (imported, registered where needed)

**For test tasks:**
- [ ] Tests run and pass
- [ ] Tests actually assert the expected behavior
- [ ] Edge cases covered if specified

**For configuration:**
- [ ] Config file is valid (parseable)
- [ ] Values are correct, not placeholders
- [ ] Referenced paths/URLs/keys exist or are documented

**For deletion/removal:**
- [ ] Target is actually removed
- [ ] No remaining references (`Grep` to confirm)
- [ ] No broken imports or calls

### Verification Failure Protocol

1. Identify exactly what failed and why
2. Fix the issue in the current task — do not create a new task for it
3. Re-run verification from the top
4. Repeat until all checks pass
5. Only then mark the task complete

Never rationalize a failure:
- "It's close enough" — No. Fix it.
- "The user can handle that part" — No. You handle it.
- "It works for the common case" — No. It must work for the specified case.
- "I'll fix it in the next task" — No. Fix it now.

## Step 4: Completion Gate

After all tasks show `completed` status:

1. **Run `TaskList`** — confirm zero pending or in_progress tasks

2. **Final integration check**:
   - In subagent mode: dispatch a final reviewer across the entire implementation
   - In inline mode: read key files modified across tasks, verify they work together
   - Run tests if a test suite exists
   - Run the build if a build system exists

3. **Produce completion summary**:

```
## Plan Execution Complete

**Plan**: [plan file or description]
**Mode**: [inline | subagent]
**Tasks**: [N] total, [N] completed, [0] remaining

### Completed Tasks
1. [x] Task subject — verified
2. [x] Task subject — verified
...

### Files Created
- path/to/new/file.ts

### Files Modified
- path/to/changed/file.ts

### Verification Results
- [x] All tasks individually verified
- [x] Integration check passed
- [x] Tests pass (if applicable)
- [x] Build succeeds (if applicable)

### Notes
[Observations, decisions made during execution, or follow-up recommendations]
```

4. **Do not stop early** — if any task failed verification, the plan is not complete. Go back and fix it.

## Handling Plan Gaps

If during execution you discover the plan is missing steps:

1. Create a new task with `TaskCreate`
2. Set appropriate dependencies
3. Inform the user: "Discovered additional step needed: [description]"
4. Execute through the same loop

If the plan is fundamentally wrong:

1. Stop execution
2. Explain what's wrong and why
3. Ask the user how to proceed

## Red Flags: You Are Not Done

Stop and go back if any of these are true:

- A task is marked complete but you didn't verify the output
- You skipped verification because "the edit tool said it succeeded"
- You marked a task complete after encountering an error you didn't fix
- You're about to report completion but haven't run `TaskList` to confirm
- You created a file but didn't read it back
- Tests exist but you didn't run them
- You told the user "you may need to..." instead of doing it yourself
