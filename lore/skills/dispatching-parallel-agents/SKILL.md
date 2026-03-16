---
name: dispatching-parallel-agents
description: Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies. Guides how to split work, write agent prompts, launch agents concurrently, and collect results. Use when the user asks to "run these in parallel", "do these at the same time", "parallelize this work", or when you identify independent subtasks that would benefit from concurrent execution.
version: 1.0.0
---

# Dispatching Parallel Agents

## Purpose

Split independent work into concurrent agents that run simultaneously, then collect and integrate their results. This skill defines **when** to parallelize, **how** to write agent prompts, and **how** to handle results — preventing the common failures of under-specified prompts, conflicting edits, and lost results.

## When to Use This Skill

- You have 2+ tasks with **no shared state or sequential dependency**
- Research across multiple unrelated areas
- Reviewing multiple independent files or modules
- Implementing changes in separate, non-overlapping files
- Running searches across different dimensions simultaneously

## When NOT to Parallelize

- Tasks that depend on each other's output
- Changes to the same file (merge conflicts)
- Tasks where one might invalidate another's approach
- Single tasks that are fast enough to do inline

**If in doubt, run sequentially.** Bad parallelization is slower than sequential execution due to conflict resolution.

## Core Principles

1. **Independence verified**: Every parallel task must operate on non-overlapping scope
2. **Self-contained prompts**: Each agent gets everything it needs — no assumptions about shared context
3. **Defined deliverables**: Each agent knows exactly what to return
4. **Integration planned**: Know how results combine before dispatching

## Workflow

### Step 1: Identify Independent Tasks

From your current work, list candidate tasks:

```markdown
| Task | Reads | Writes | Independent? |
|------|-------|--------|-------------|
| Review auth module | src/auth/** | (none — read-only) | Yes |
| Review api module | src/api/** | (none — read-only) | Yes |
| Implement feature A | src/feature-a/** | src/feature-a/** | Yes |
| Implement feature B | src/feature-b/** | src/feature-b/** | Yes |
| Update shared types | src/types/** | src/types/** | NO — others depend on this |
```

**Independence test**: If task A's output could change how you'd approach task B, they are NOT independent.

### Step 2: Write Agent Prompts

Each agent prompt must be **self-contained**. Include:

1. **Goal**: What the agent must accomplish (one sentence)
2. **Scope**: Exact files/directories the agent should work within
3. **Context**: Any background information needed (don't say "see above" — the agent has no "above")
4. **Constraints**: Rules the agent must follow
5. **Deliverable**: Exact format of what the agent must return

**Good prompt:**
```
Review all files in src/auth/ for security issues.

Context: This is a Node.js Express app using JWT authentication.
The auth module handles login, token refresh, and middleware.

Scope: Only files in src/auth/ — do not review other directories.

For each issue found, report:
- File path and line number
- Severity (Critical/High/Medium/Low)
- Description of the issue
- Recommended fix

Return findings as a markdown list sorted by severity.
```

**Bad prompt:**
```
Review the auth code for issues.
```

### Step 3: Choose Agent Type and Configuration

| Work Type | Agent Type | Notes |
|-----------|-----------|-------|
| Research / search / read-only analysis | `Explore` | Fast, read-only tools |
| Code review with structured output | `general-purpose` | Full tool access |
| Implementation (writing code) | `general-purpose` with `isolation: "worktree"` | Prevents file conflicts |
| Simple file search | Don't use an agent | Use Glob/Grep directly |

**Use `isolation: "worktree"`** when multiple agents write code to prevent conflicts.

**Use `run_in_background: true`** when you have your own work to do while agents run.

### Step 4: Dispatch Agents

Launch all independent agents in a **single message** with multiple Task tool calls:

```
// In one message, dispatch all agents:
Task({ description: "Review auth module", prompt: "...", subagent_type: "..." })
Task({ description: "Review api module", prompt: "...", subagent_type: "..." })
Task({ description: "Review data module", prompt: "...", subagent_type: "..." })
```

**Critical**: All parallel Task calls must be in the **same message**. Sequential messages mean sequential execution.

### Step 5: Collect Results

When agents return, collect each result. For each agent:

1. **Verify completeness**: Did the agent address the full scope?
2. **Check for conflicts**: Does this result conflict with another agent's result?
3. **Extract deliverables**: Pull out the structured output you requested

### Step 6: Integrate Results

Combine agent outputs into a unified result:

```markdown
## Combined Results

### From Agent 1: Auth Module Review
[results]

### From Agent 2: API Module Review
[results]

### Integration Notes
- [Any cross-cutting concerns discovered]
- [Conflicts between agent findings, if any]
- [Items that need sequential follow-up]
```

If agents produced code changes in worktrees, integrate them sequentially — apply one, verify, then apply the next.

## Prompt Templates

### Research Agent

```
Research: [topic]

Find information about [specific question].

Search in: [directories or file patterns]
Look for: [keywords, patterns, or structures]

Return:
- Summary of findings (2-3 sentences)
- Relevant file paths with line numbers
- Key code excerpts (keep brief)
```

### Review Agent

```
Review all files in [directory] for [dimension].

Context: [project description, tech stack, relevant architecture]

Scope: [exact files/directories — be explicit]

Evaluate:
- [criterion 1]
- [criterion 2]
- [criterion 3]

For each finding, report:
- File:line
- Severity
- Issue description
- Recommended fix

Sort findings by severity. Include a "Strengths" section.
```

### Implementation Agent

```
Implement [feature] in [directory].

Context: [what this feature does, why it's needed]

Existing code to integrate with:
- [file]: [what it provides]
- [file]: [interface to conform to]

Requirements:
1. [requirement]
2. [requirement]

Constraints:
- Only modify files in [directory]
- Follow existing patterns in [reference file]
- Include tests

When done, report what files were created/modified.
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Launching agents sequentially in separate messages | Put all Task calls in one message |
| Vague prompts like "look at the code" | Specify scope, criteria, and output format |
| Two agents writing to the same file | Use worktree isolation or make scopes non-overlapping |
| Not verifying independence before dispatching | Fill out the independence table first |
| Forgetting to integrate results | Plan the integration step before dispatching |
| Dispatching 10+ agents at once | Diminishing returns — batch into groups of 3-5 |

## Sizing Guide

| File Count | Approach |
|------------|----------|
| 1-3 files | Don't parallelize — do it inline |
| 4-10 files | 2-3 agents, split by module/directory |
| 11-25 files | 3-5 agents, split by module |
| 25+ files | 5 agents max, each covering a subtree |

More agents does not mean faster. Each agent has startup overhead. The sweet spot is **3-5 agents** for most work.

## Integration with Other Skills

- **systematic-review**: Dispatches parallel agents for multi-module reviews (one agent per module)
- **subagent-development**: Sequential task execution with review — use when tasks depend on each other
- **writing-plans**: Can produce task lists where independent tasks are flagged for parallel dispatch

## Remember

**Parallel agents are multipliers, not magic. Bad prompts run in parallel produce bad results faster. Write each prompt as if the agent knows nothing except what you tell it.**
