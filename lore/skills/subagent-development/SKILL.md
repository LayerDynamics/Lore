---
name: subagent-development
description: Use when executing implementation plans with independent tasks. Dispatches fresh subagents per task with two-stage review after each.
---

# Subagent Development

## Purpose

Execute an implementation plan by dispatching a fresh subagent for each task. After each task, run a two-stage review: first spec compliance, then code quality. Fresh context per task prevents cross-contamination.

## When to Use

- You have an implementation plan with defined tasks
- Tasks are mostly independent (not tightly coupled)
- You want to stay in the current session
- You want automated review checkpoints between tasks

## The Process

### Setup

1. Read the plan file once
2. Extract all tasks with their full text and context
3. Track progress across tasks

### Per Task

```
1. Dispatch implementer subagent
   - Provide full task text and surrounding context
   - Do not make the subagent read the plan file (provide the content)

2. If subagent asks questions:
   - Answer clearly and completely
   - Provide additional context as needed
   - Do not rush into implementation

3. Subagent implements, tests, commits, and self-reviews

4. Dispatch spec compliance reviewer
   - Does the code implement what the spec requires?
   - Does it implement ONLY what the spec requires?
   - Spec review must pass before quality review

5. If spec issues found:
   - Implementer fixes gaps
   - Spec reviewer reviews again
   - Repeat until compliant

6. Dispatch code quality reviewer
   - Is the code readable, maintainable, secure?
   - Performance concerns?
   - Project convention adherence?

7. If quality issues found:
   - Implementer fixes issues
   - Quality reviewer reviews again
   - Repeat until approved

8. Mark task complete, proceed to next
```

### After All Tasks

Dispatch a final reviewer across the entire implementation, then finalize the branch.

## Two-Stage Review

The two stages must remain separate. Mixing them causes "technically correct but wrong feature" failures where clean code that solves the wrong problem gets approved.

**Stage 1 -- Spec Compliance:** Does this code do what was asked? Nothing more, nothing less.

**Stage 2 -- Code Quality:** Is this code well-built? Readable, secure, performant, following project patterns.

Stage 1 must pass before Stage 2 begins. Quality review of code that does not meet the spec wastes effort.

## Rules

- Fresh subagent per task (no context pollution between tasks)
- Never skip either review stage
- Never proceed with unfixed issues
- Do not dispatch multiple implementer subagents in parallel (conflict risk)
- Provide full task text to subagents (do not make them read files)
- Include scene-setting context (where the task fits in the larger plan)
- If a subagent fails, dispatch a fix subagent with specific instructions rather than fixing manually (avoids context pollution)

## Trade-offs

**Advantages:**
- Fresh context per task prevents confusion
- Two-stage review catches both spec drift and quality issues
- Subagents can ask questions before starting work
- Review loops ensure issues are actually fixed

**Costs:**
- More subagent invocations (implementer + 2 reviewers per task)
- Controller does more preparation work
- Review loops add iterations
- But catches issues early, which is cheaper than debugging later

<!-- Inspired by Superpowers Subagent-Driven Development skill (obra) -->
