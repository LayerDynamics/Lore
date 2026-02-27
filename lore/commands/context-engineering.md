---
name: context-engineering
description: Use when managing agent context windows, preserving state across sessions, or coordinating information flow between agents.
---

# Context Engineering

## Purpose

Context windows are finite. Every token loaded is a token unavailable for reasoning. Manage context deliberately: load what is needed, discard what is not, and preserve state for continuity.

## Principles

### Load Only What You Need

- Read indexes and summaries first, not full documents
- Load 1-2 relevant modules at a time, not the entire skill library
- When the task category changes, swap modules (old context is no longer useful)

### Preserve State Explicitly

Agents lose all state between sessions. Working memory must be written to files.

**At the start of every turn:**
- Read the working memory file to orient
- Check project state and pending tasks
- Reference working memory throughout reasoning

**At the end of every turn:**
- Update working memory with progress, decisions, and next steps
- Record what was accomplished
- Note blockers and open questions

### Working Memory Template

```markdown
# Working Memory
Last Updated: [timestamp]
Current Phase: [phase name]

## Active Goal
[1-2 sentences: what we are trying to accomplish]

## Current Task
- ID: [task identifier]
- Status: [in-progress | blocked | reviewing]
- Description: [what we are doing]

## Just Completed
- [Most recent accomplishment]
- [Previous accomplishment]

## Next Actions
1. [Immediate next step]
2. [Following step]

## Blockers
- [Current blockers or waiting items]

## Decisions Made
- [Decision]: [Rationale] - [timestamp]

## Mistakes and Learnings
- **What failed:** [specific error]
- **Why:** [root cause]
- **Prevention:** [concrete action for the future]
```

### Delegate to Preserve Context

Use subagents for exploration, research, and isolated tasks. The orchestrator's context stays lean while subagents use their own full context windows.

- Subagents read files themselves (pass paths, not content)
- Subagent context is discarded after the task completes
- The orchestrator receives only the result

### Monitor Context Usage

When context is running low:
- **Warning threshold (35% remaining):** Wrap up the current task. Do not start new complex work.
- **Critical threshold (25% remaining):** Stop immediately. Save state to working memory. The next session picks up from the saved state.

Stale context (information no longer relevant to the current task) should be noted and mentally discarded. If context feels heavy, signal for a fresh session.

### Progressive Disclosure

Structure information in layers:
1. **Index layer:** What exists and where to find it (always loaded)
2. **Summary layer:** Key facts and recent events (loaded on demand)
3. **Detail layer:** Full content (loaded only when actively needed)

This pattern applies to memory systems, documentation, and project state. Never load the detail layer when the summary layer answers the question.

## Anti-Patterns

- Loading all documentation at session start "just in case"
- Passing full file contents to subagents instead of paths
- Keeping exploration context after the exploration is complete
- Not saving state before a context-heavy operation
- Ignoring context pressure warnings and continuing complex work

<!-- Inspired by GSD context management and Loki Mode context engineering -->
