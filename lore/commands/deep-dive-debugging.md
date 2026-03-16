---
name: deep-dive-debugging
description: "Heavy-weight debugging for stubborn, complex, or cross-cutting bugs. Combines exhaustive code investigation with systematic hypothesis testing and a mandatory verification loop. Use when standard debugging has failed or the bug spans multiple modules."
argument-hint: "<bug description or failing test/command>"
---

# Deep Dive Debugging: $ARGUMENTS

This is the nuclear option for debugging. Use when:
- Standard `/lore:debug` hasn't solved it
- The bug spans multiple modules, services, or layers
- Previous fix attempts have made things worse
- You don't understand WHY the bug exists, not just WHAT it is
- The error message doesn't point to the actual root cause

## Phase 1: Stabilize the Scene

Before touching anything:

1. **Capture the current state**
   ```bash
   git status
   git stash list
   git log --oneline -5
   ```
   Document exactly what branch you're on and whether there are uncommitted changes.

2. **Record the exact failure**
   - Run the failing command/test and capture the FULL output
   - Save the exact error message, stack trace, exit code
   - Note the timestamp and any environment details that might matter
   - This is your baseline — you'll compare against it after every fix attempt

3. **Identify what SHOULD happen**
   - Read the test expectations or specification
   - Read the function's documentation or comments about intent
   - If neither exists, ask the user what the expected behavior is
   - You cannot debug toward "working" if you don't know what "working" means

## Phase 2: Exhaustive Root Cause Analysis

This goes deeper than standard Phase 1. You are not looking for THE cause — you are cataloging ALL possible causes and then eliminating them with evidence.

### 2a. Trace the Full Execution Path

Starting from the entry point that triggers the bug:
1. Read every function call on the path, following into each definition
2. At each step document: file:line, inputs, outputs, side effects
3. Mark where actual behavior DIVERGES from expected behavior
4. Do not stop when you find the first divergence — there may be multiple contributing factors

### 2b. Construct a Fault Tree

Build a tree of everything that COULD cause this bug:

```
Bug: [describe the symptom]
├── Hypothesis A: [description]
│   ├── Evidence for: [what supports this]
│   └── Evidence against: [what contradicts this]
├── Hypothesis B: [description]
│   ├── Evidence for: ...
│   └── Evidence against: ...
├── Hypothesis C: [description]
│   ├── Evidence for: ...
│   └── Evidence against: ...
└── Unknown factors: [things you can't determine from code alone]
```

**Generate at least 3 hypotheses.** If you can only think of one, you haven't investigated deeply enough.

### 2c. Eliminate Hypotheses with Evidence

For each hypothesis:
- Add instrumentation (log statements, assertions) to confirm or deny
- Run the failing scenario with instrumentation
- Read the output and mark the hypothesis as CONFIRMED, DENIED, or INCONCLUSIVE
- Do NOT skip this. Do NOT reason about it — RUN THE CODE and observe.

### 2d. Check for Compound Causes

Some bugs require multiple conditions to trigger:
- Is this a race condition? (timing-dependent)
- Is this an order-of-operations issue? (works in isolation, fails in sequence)
- Is this an environmental issue? (works locally, fails in CI, or vice versa)
- Is this a state accumulation issue? (works on first run, fails on second)

If you suspect a compound cause, design a test that isolates each condition independently.

## Phase 3: Surgical Fix Design

Only enter this phase when you have:
- A confirmed root cause with evidence (not just a hypothesis)
- Understanding of WHY the bug exists (not just WHERE)
- Knowledge of what other code depends on the buggy code

### 3a. Design the Fix

1. **State the root cause in one sentence**
   - "The bug occurs because [X] when [Y], which causes [Z]"

2. **Identify the minimal change**
   - What is the smallest code change that addresses the root cause?
   - What are the side effects of this change on other callers?

3. **Write the regression test FIRST**
   - A test that fails now and will pass after the fix
   - This test should encode the EXPECTED behavior, not just "not the bug"
   - Include edge cases that are adjacent to the bug

### 3b. Implement the Fix

- Make ONE change at a time
- If the fix requires changes in multiple files, make them all before testing
- Do not add unrelated improvements, refactors, or cleanups

## Phase 4: Verification Gauntlet (MANDATORY — NO EXCEPTIONS)

**You are not done until you pass EVERY gate below.**

### Gate 1: Direct Verification
Run the exact command/test that was failing.
- Compare output against the baseline captured in Phase 1
- The original error must be GONE, not just different
- **If it fails:** return to Phase 2 with new evidence. Your root cause analysis was incomplete.

### Gate 2: Regression Test
Run the regression test you wrote in Phase 3a.
- It must pass
- **If it fails:** your fix doesn't actually address what you think it does. Return to Phase 3.

### Gate 3: Broader Test Suite
Run all tests in the affected module, then the full test suite.
```bash
# Module tests first (fast feedback)
# Then full suite
```
- No new failures allowed
- Any new failure is YOUR regression — fix it before proceeding
- **If regressions appear:** you missed a side effect. Analyze what broke and extend your fix.

### Gate 4: Edge Case Verification
Re-run with edge cases related to the bug:
- Empty inputs, null values, boundary conditions
- The scenarios from your fault tree that were adjacent to the root cause
- Any compound-cause scenarios identified in Phase 2d

### Gate 5: Clean State Verification
- Remove all instrumentation/debug logging added in Phase 2
- Run the full verification again on clean code
- Verify git diff shows ONLY the fix and the new test — nothing else

**Only after ALL FIVE gates pass can you proceed to Phase 5.**

If any gate fails:
1. Do NOT add a quick patch to make it pass
2. Return to the appropriate earlier phase
3. Your understanding of the bug is incomplete — gather more evidence
4. Every failed gate gives you new information — use it

## Phase 5: Documentation and Closure

1. **Summarize for the user:**
   - Root cause (one sentence)
   - What evidence confirmed it
   - What the fix does
   - What tests verify it
   - Show the passing gate outputs

2. **Clean up:**
   - Remove any temporary debug code
   - Ensure the regression test is well-named and documents the bug it prevents
   - Verify the diff is clean and minimal

## Escalation Protocol

If after Phase 2 you have:
- Eliminated all hypotheses without finding the root cause
- Found a root cause that requires architectural changes beyond a bug fix
- Discovered the bug is in a third-party dependency

**STOP and report to the user** with:
- What you investigated (with evidence)
- What you eliminated and why
- What remains unexplained
- Your recommendation for next steps

Do NOT keep attempting fixes when you don't understand the cause. That is the definition of thrashing.
