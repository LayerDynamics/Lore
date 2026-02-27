---
name: hone
description: Hone a component for scale — apply targeted optimizations based on evaluation findings to improve scalability.
user_invocable: true
argument-hint: <path or component> [--findings <evaluation output>]
allowed-tools: ["Read", "Grep", "Glob", "Edit", "Write", "Bash"]
---

# Hone for Scale

Apply targeted scalability optimizations based on evaluation findings.

**Arguments:** $ARGUMENTS

## Workflow

### Step 1: Review Findings

If evaluation findings are provided (from `/scale-review:evaluate`), prioritize by severity:
1. Critical findings first (blocks scaling)
2. Important findings second (degrades at scale)
3. Minor findings last (optimization opportunity)

If no findings are provided, run a quick evaluation scan on the target.

### Step 2: Apply Fixes by Category

For each finding, apply the appropriate optimization:

#### Time Complexity Fixes
- Replace nested loops with Map/Set lookups
- Add early returns and short-circuit evaluation
- Replace O(n) searches with indexed access
- Break large operations into chunks with bounded iteration

#### Space Complexity Fixes
- Replace in-memory accumulation with streaming/generators
- Add pagination to data queries
- Implement LRU or bounded caches instead of unbounded Maps
- Use typed arrays instead of generic arrays for numeric data

#### I/O Efficiency Fixes
- Parallelize independent I/O operations with `Promise.all`
- Add connection pooling for database/HTTP clients
- Batch multiple small operations into single calls
- Add streaming for large file reads/writes

#### Data Structure Fixes
- Replace array lookups with Map/Set for O(1) access
- Use array-join patterns instead of string concatenation
- Replace deep clones with structural sharing or immutable updates
- Add size bounds to dynamic collections

#### Architecture Fixes
- Externalize state from process memory to persistent store
- Add queue/backpressure between producers and consumers
- Make operations idempotent for safe retry
- Add circuit breakers for external service calls

### Step 3: Verify Each Fix

After each optimization:
1. Confirm the fix doesn't change behavior (run tests if available)
2. Verify the performance characteristic actually improved
3. Check for unintended side effects

### Step 4: Summary

```markdown
## Hone Report: [Component]

**Findings addressed**: [X] of [Y]

### Changes Made
1. [file:line] — [what changed and why]
2. [file:line] — [what changed and why]

### Skipped (needs discussion)
- [finding] — [reason it wasn't addressed]

### Verification
- Tests: [pass/fail/none]
- Behavior: [unchanged/changed — explain]
```

After honing, run `/scale-review:test-scaling` to validate improvements.
