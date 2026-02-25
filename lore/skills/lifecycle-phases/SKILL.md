---
name: lifecycle-phases
description: Use when managing project execution through structured phases. Provides the Clarify-Plan-Execute-Review lifecycle with wave-based parallel execution.
---

# Lifecycle Phases

## Purpose

Structure project execution into discrete phases, each following a Clarify-Plan-Execute-Review cycle. Within execution, group tasks into waves for parallel work where dependencies allow.

## The Lifecycle

Every phase moves through four stages:

### 1. Clarify

Establish what this phase delivers before planning how to deliver it.

- Define the phase boundary (what is in scope, what is not)
- Lock in implementation decisions through discussion
- Capture constraints, preferences, and deferred ideas
- Document decisions so downstream work does not require re-asking the human

The output is a context document with concrete decisions, not vague aspirations. "Card-based layout, not timeline" is a decision. "Should feel modern" is not.

### 2. Plan

Research and decompose the phase into executable tasks.

- Research relevant patterns, libraries, and approaches
- Create tasks with clear objectives and success criteria
- Identify dependencies between tasks
- Group tasks into waves: Wave 1 has no dependencies, Wave 2 depends on Wave 1, and so on
- Validate the plan (does it cover all requirements? are tasks appropriately sized?)

### 3. Execute

Run each wave in sequence. Within a wave, tasks can run in parallel if they are independent.

**Per wave:**
1. Describe what is being built and why, before starting
2. Dispatch agents or execute tasks
3. Each task: implement, test, commit atomically
4. Verify completion (check that claimed outputs actually exist)
5. Report what was built and what it enables for the next wave

**Handling failures:**
- If a task fails, report which task and why
- Offer to retry or continue with remaining waves
- Dependent tasks in later waves may also fail if their prerequisite failed

**Checkpoints:**
- Tasks requiring human input pause and present the decision needed
- Other parallel tasks continue while waiting
- Fresh agents resume from checkpoints (do not rely on serialized state)

### 4. Review

Verify the phase achieved its goal, not just that tasks completed.

- Check requirements against actual implementation
- Every requirement ID must be accounted for
- Categorize the result:
  - **Passed:** All requirements verified. Advance to next phase.
  - **Gaps found:** Document what is missing. Plan targeted gap-closure work.
  - **Human verification needed:** Automated checks passed but some items need manual testing.

Gap closure follows the same lifecycle: clarify the gaps, plan fixes, execute, review again.

## Phase Transitions

A phase is complete only when review passes. No skipping review. No advancing with known gaps unless explicitly choosing to defer them.

After review passes:
- Update tracking documents with completion status
- Advance project state to the next phase
- The next phase begins its own Clarify stage

## Principles

- **Orchestrator coordinates, does not execute.** Keep the coordinator lean. Delegate actual work to agents with fresh context.
- **Wave-based parallelism.** Independent tasks run simultaneously. Dependent tasks wait for their prerequisites.
- **Atomic commits per task.** Every completed task is a checkpoint that can be rolled back to.
- **Verify claims.** When a task reports completion, spot-check that outputs exist before proceeding.
- **Context efficiency.** Orchestrators pass paths and summaries. Executors load full context fresh.

<!-- Inspired by GSD (get-shit-done) phase system -->
