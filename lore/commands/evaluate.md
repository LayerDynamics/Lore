---
name: evaluate
description: Evaluate a component or system for scalability — analyze code paths, data structures, and architecture against scale criteria.
user_invocable: true
argument-hint: <path or component> [--frame <frame output>]
allowed-tools: ["Read", "Grep", "Glob", "Bash", "Task"]
---

# Scale Evaluation

Perform a detailed scalability evaluation of a component or system.

**Arguments:** $ARGUMENTS

## Workflow

### Step 1: Gather Context

If a frame exists (from `/scale-review:frame-task`), use its constraints and criteria.
Otherwise, read the target path and infer scope.

### Step 2: Analyze Code Paths

For each critical code path, evaluate:

#### 2a. Time Complexity
- Identify loops, nested loops, recursive calls
- Check for O(n^2) or worse patterns (nested array searches, repeated string concatenation)
- Flag any path where complexity grows faster than linearly with input

#### 2b. Space Complexity
- Check for in-memory accumulation (growing arrays, maps, buffers)
- Identify places where entire datasets are loaded (no streaming/pagination)
- Flag unbounded caches or memoization without eviction

#### 2c. I/O Patterns
- Sequential vs parallel I/O calls
- Missing connection pooling
- Unbatched database/API operations
- File handles not properly closed or streamed

### Step 3: Analyze Data Structures

Check for:
- **Arrays used as lookup tables**: Should be Maps/Sets for O(1) access
- **Unbounded growth**: Collections without size limits
- **Deep cloning**: Unnecessary copying of large objects
- **String building**: Repeated concatenation vs template/join

### Step 4: Analyze Architecture

Check for:
- **Horizontal scaling readiness**: Can multiple instances run without conflict?
- **State management**: Is state in-memory (non-scalable) or externalized?
- **Queue/backpressure**: Are producers and consumers decoupled?
- **Idempotency**: Can operations be safely retried?

### Step 5: Score and Report

Rate each dimension on a 1-5 scale:

| Dimension | Score | Notes |
|-----------|-------|-------|
| Time complexity | /5 | |
| Space complexity | /5 | |
| I/O efficiency | /5 | |
| Data structure fitness | /5 | |
| Architecture readiness | /5 | |

**Overall**: [score]/25

```markdown
## Scale Evaluation: [Component]

**Score**: [X]/25
**Verdict**: [scale-ready | needs-optimization | needs-redesign]

### Findings

#### Critical (blocks scaling)
- [finding with file:line]

#### Important (degrades at scale)
- [finding with file:line]

#### Minor (optimization opportunity)
- [finding with file:line]

### Recommendations
1. [prioritized action]
2. [prioritized action]
```

Feed results into `/scale-review:hone` for targeted fixes.
