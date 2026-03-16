---
name: executing-plans
description: Use when executing an implementation plan. Parses the plan into tracked tasks, executes each one sequentially, and verifies completion before marking done. Never stops until all tasks pass verification.
argument-hint: <plan-file-path>
---

# Executing Plans

Take an implementation plan, decompose it into tracked tasks, execute each one, verify each one, and do not stop until every task is verified complete.

## The Discipline

Plans fail in execution, not in writing. The gap between "planned" and "done" is where details get dropped, steps get skipped, and shortcuts creep in. This skill closes that gap by enforcing a strict loop: parse, execute, verify, repeat — no task is complete until its output is proven correct.

## When to Use This Skill

- You have a plan file (from `/lore:plan`, `/lore:blueprint`, or any structured markdown plan)
- You have a list of implementation steps from the user
- You need to execute a multi-step task and guarantee nothing gets skipped
- You want tracked progress with verification at every step

## Phase 1: Parse the Plan

Read the plan file or input and extract every discrete task.

1. **Read the plan** using the `Read` tool — never summarize from memory
2. **Extract tasks** — each task must have:
   - A clear, actionable subject (imperative form: "Add auth middleware", not "Auth middleware")
   - A description with enough detail to execute without re-reading the plan
   - An activeForm for progress display ("Adding auth middleware")
   - Acceptance criteria — how do you know this task is done?

3. **Identify dependencies** — which tasks must complete before others can start
4. **Create all tasks** using `TaskCreate` for each extracted task
5. **Set dependencies** using `TaskUpdate` with `addBlockedBy` where ordering matters

Present the parsed task list to the user for confirmation before executing:

```
Parsed [N] tasks from plan:

1. [Task subject] — [brief description]
   Depends on: [none | task IDs]
   Verified by: [acceptance criteria]

2. [Task subject] — ...
```

If the user wants to adjust, modify, skip, or reorder tasks — do it before starting execution.

## Phase 2: Execute

Work through tasks in dependency order (lowest ID first when no dependencies block).

### For Each Task:

**Step 1: Claim the task**
- `TaskUpdate` — set status to `in_progress`
- Read the task description with `TaskGet` to get full context

**Step 2: Execute the work**
- Perform the implementation as described
- Follow all project conventions (read existing code first, match patterns)
- Write real code — no stubs, no placeholders, no "implement later" comments
- If the task involves creating files, use `Write`
- If the task involves modifying files, use `Read` first then `Edit`
- If the task involves running commands, use `Bash`

**Step 3: Verify before marking complete** (mandatory — see Phase 3)

**Step 4: Mark complete**
- Only after verification passes: `TaskUpdate` — set status to `completed`
- If verification fails: fix the issue and re-verify. Do NOT mark complete.

**Step 5: Check for next task**
- `TaskList` — find the next unblocked pending task
- Continue until no pending tasks remain

### Execution Rules

- **One task at a time** — finish and verify before moving to the next
- **No skipping** — if a task is blocked, resolve the blocker first
- **No partial completion** — a task is either fully done and verified, or still in progress
- **Errors are your problem** — if something fails during execution, fix it immediately. Do not mark the task complete and move on.
- **Stay on scope** — only do what the task describes. If you discover additional work needed, create a new task for it rather than scope-creeping the current one.

## Phase 3: Verify

Every task must pass verification before it can be marked complete. This is not optional.

### Verification Checklist (apply all that are relevant):

**For code changes:**
- [ ] File exists at the expected path
- [ ] Read the file back and confirm the code is correct (not just that the edit succeeded)
- [ ] No syntax errors — run the linter/compiler if available
- [ ] No stub code, placeholder comments, or empty function bodies
- [ ] Imports are correct and used
- [ ] Matches project conventions (naming, structure, patterns)

**For new files:**
- [ ] File created at the correct path
- [ ] Content is complete — not a skeleton or template
- [ ] Integrated with the rest of the codebase (imported where needed, registered if required)

**For test tasks:**
- [ ] Tests run and pass (`Bash` — execute the test command)
- [ ] Tests actually assert the expected behavior (read the test, don't just trust "pass")
- [ ] Edge cases covered if specified in the task

**For configuration/infrastructure:**
- [ ] Config file is valid (parseable JSON/YAML/TOML)
- [ ] Values are correct, not placeholder values
- [ ] Referenced paths/URLs/keys exist or are documented

**For deletion/removal:**
- [ ] Target is actually removed
- [ ] No remaining references to the removed code (use `Grep` to confirm)
- [ ] No broken imports or calls

### Verification Failure Protocol

If verification fails:

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

## Phase 4: Completion Gate

After all tasks show `completed` status:

1. **Run `TaskList`** — confirm zero pending or in_progress tasks
2. **Final integration check**:
   - Read key files that were created/modified across multiple tasks
   - Verify they work together (imports resolve, data flows correctly, no conflicts)
   - Run tests if a test suite exists
   - Run the build if a build system exists
3. **Produce completion summary**:

```
## Plan Execution Complete

**Plan**: [plan file or description]
**Tasks**: [N] total, [N] completed, [0] remaining

### Completed Tasks
1. [x] Task subject — verified
2. [x] Task subject — verified
...

### Files Created
- path/to/new/file.ts

### Files Modified
- path/to/changed/file.ts (lines X-Y)

### Verification Results
- [x] All tasks individually verified
- [x] Integration check passed
- [x] Tests pass (if applicable)
- [x] Build succeeds (if applicable)

### Notes
[Any observations, decisions made during execution, or follow-up recommendations]
```

4. **Do not stop early** — if any task failed verification, the plan is not complete. Go back and fix it.

## Red Flags: You Are Not Done

Stop and go back if any of these are true:

- A task is marked complete but you didn't read the output to verify it
- You skipped verification because "the edit tool said it succeeded"
- You marked a task complete after encountering an error you didn't fix
- You're about to report completion but haven't run `TaskList` to confirm
- You created a file but didn't read it back to verify contents
- Tests exist but you didn't run them
- You told the user "you may need to..." instead of doing it yourself

## Handling Plan Gaps

If during execution you discover the plan is missing steps:

1. **Do not improvise silently** — create a new task with `TaskCreate`
2. Set appropriate dependencies so it executes in the right order
3. Inform the user: "Discovered additional step needed: [description]"
4. Execute the new task through the same parse-execute-verify loop

If the plan is fundamentally wrong (e.g., wrong approach, missing prerequisite):

1. Stop execution
2. Explain what's wrong and why
3. Ask the user how to proceed — don't guess
