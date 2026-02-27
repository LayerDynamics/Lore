---
name: debug
description: Use when encountering bugs, test failures, or unexpected behavior. Systematic root cause investigation before attempting any fixes.
---

# Systematic Debug Skill

Use this skill when encountering bugs, test failures, or unexpected behavior.

## Core Principle

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST**

If you haven't completed Phase 1, you cannot propose fixes.

## Phase 1: Root Cause Investigation

Before attempting ANY fix:

1. **Read Error Messages Carefully**
   - Don't skip past errors or warnings
   - Read stack traces completely
   - Note line numbers, file paths, error codes

2. **Reproduce Consistently**
   - Can you trigger it reliably?
   - What are the exact steps?
   - If not reproducible → gather more data, don't guess

3. **Check Recent Changes**
   ```bash
   git log --oneline -10
   git diff HEAD~3
   ```
   - What changed that could cause this?

4. **Gather Evidence in Multi-Component Systems**
   - Log what data enters/exits each component
   - Verify environment/config propagation
   - Run once to gather evidence showing WHERE it breaks
   - THEN analyze to identify failing component

5. **Trace Data Flow**
   - Where does bad value originate?
   - Keep tracing up until you find the source
   - Fix at source, not at symptom

## Phase 2: Pattern Analysis

1. Find working examples in same codebase
2. Compare against references - read COMPLETELY, don't skim
3. Identify differences between working and broken
4. Understand dependencies and assumptions

## Phase 3: Hypothesis and Testing

1. **Form Single Hypothesis**
   - State clearly: "I think X is the root cause because Y"

2. **Test Minimally**
   - Make SMALLEST possible change to test hypothesis
   - One variable at a time

3. **Verify Before Continuing**
   - Did it work? Yes → Phase 4
   - Didn't work? Form NEW hypothesis
   - DON'T add more fixes on top

## Phase 4: Implementation

1. **Create Failing Test Case** - Simplest possible reproduction
2. **Implement Single Fix** - ONE change at a time
3. **Verify Fix** - Run actual tests/commands

4. **If 3+ Fixes Failed: Question Architecture**
   - Each fix reveals new problem in different place = wrong architecture
   - STOP and question fundamentals before more fixes

## Red Flags - STOP and Return to Phase 1

If you catch yourself thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "I don't fully understand but this might work"
- "Here are the main problems: [lists fixes without investigation]"
- Proposing solutions before tracing data flow

## Verification Before Completion

**NEVER claim a fix works without running verification:**

```bash
# For TypeScript/Deno
deno task check
deno test --allow-all path/to/relevant/tests

# For the actual scenario
# Run the exact command that was failing
```

Show the actual output. No assumptions.