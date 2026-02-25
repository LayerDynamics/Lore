---
name: rarv-cycle
description: Use as the core execution loop for any autonomous or semi-autonomous work. Every action follows Reason-Act-Reflect-Verify.
---

# RARV Cycle

## Purpose

Every action follows a four-step cycle: Reason, Act, Reflect, Verify. No step is optional. The cycle prevents drift, ensures quality, and builds learning into the execution loop.

## The Cycle

```
REASON --> ACT --> REFLECT --> VERIFY
  ^                              |
  |         [PASS] --> Mark complete, return to REASON
  |         [FAIL] --> Capture error, learn, retry from REASON
  +----------------------------------------------+
```

### Reason

Determine what to do next.

- Read working memory to understand current state
- Check past mistakes to avoid repeating them
- Identify the highest-priority unblocked task
- Plan the specific steps to complete it

**Pre-Act Attention Check:** Before acting, re-read the current task goal. Confirm that the planned action serves that goal. Context drift is silent -- agents do not notice they have drifted off-task. Forcing a goal re-read before each action catches misalignment before work is wasted.

If the planned action does not serve the task goal, log the drift and return to the beginning of Reason.

### Act

Execute the task.

- Write code, run commands, make changes
- Commit atomically (every completed unit of work is a checkpoint)
- Update task tracking

Keep actions focused. One task at a time. Do not bundle unrelated changes.

### Reflect

Evaluate what happened.

- Did the action succeed?
- Update working memory with progress
- Record decisions made and their rationale
- Check whether the overall goal is complete

If the goal is not complete, the next iteration of Reason picks up from the updated state.

### Verify

Prove the work is correct.

- Run automated tests (unit, integration, end-to-end as appropriate)
- Check that the build compiles without errors or warnings
- Validate against the specification
- Run linters and formatters

**On pass:**
- If the task produced a novel insight (non-obvious solution, reusable pattern, or unexpected root cause), extract it as a learning for future reference
- Mark the task complete
- Return to Reason for the next task

**On failure:**
1. Capture error details (stack trace, logs, context)
2. Analyze the root cause
3. Record the learning in working memory (what failed, why, how to prevent it)
4. Roll back to the last good checkpoint if needed
5. Return to Reason with the new understanding

**Failure escalation:**
- After 3 failures on the same task: try a fundamentally simpler approach
- After 5 failures: set the task aside in a dead-letter queue and move to the next task
- Do not keep retrying the same approach

## Autonomy Rules

When operating autonomously, the RARV cycle is governed by these rules:

| Rule | Meaning |
|------|---------|
| Decide and act | Make decisions. Do not ask questions. Do not stop. |
| Keep momentum | Do not pause for confirmation. Move to the next task. |
| Always verify | Code without tests is incomplete. Run tests after every change. |
| Always commit | Atomic commits after each task. Checkpoint progress. |
| Tests are sacred | If tests fail, fix the code. Never delete or skip failing tests. |

## Integration with Other Skills

- **Systematic Debugging:** When Verify fails, use the systematic debugging process for root cause investigation before retrying
- **Test-Driven Development:** The Act phase follows TDD discipline (test first, then implement)
- **Verification Before Completion:** The Verify phase requires actual evidence, not assumptions
- **Context Engineering:** Reason phase loads only needed context; Reflect phase saves state

<!-- Inspired by Loki Mode RARV cycle -->
