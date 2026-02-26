---
name: frame-task
description: Frame a task for scale review — define scope, constraints, and success criteria before evaluating scalability.
user_invocable: true
argument-hint: <task description or file path>
allowed-tools: ["Read", "Grep", "Glob"]
---

# Frame Task for Scale Review

Define the boundaries and context of a task before evaluating how it scales.

**Arguments:** $ARGUMENTS

## Workflow

### Step 1: Identify the Task

If `$ARGUMENTS` is a file path, read the file to understand the task context.
If it's a description, use it directly.

### Step 2: Define Scope Boundaries

Determine and document:

1. **Input scope**: What data/files/components does this task operate on?
2. **Output scope**: What does this task produce or modify?
3. **Dependency scope**: What external systems, APIs, or services does it depend on?
4. **User scope**: Who triggers this and how often?

### Step 3: Identify Constraints

List the constraints that affect scalability:

- **Time constraints**: Must complete within X seconds/minutes?
- **Resource constraints**: Memory limits, CPU budget, API rate limits?
- **Concurrency constraints**: Can multiple instances run simultaneously?
- **Data constraints**: Maximum input size, file count, record count?

### Step 4: Define Success Criteria

State what "works at scale" means for this specific task:

- At 10x current load, what should still hold true?
- At 100x, what is acceptable to degrade?
- What is the hard failure point?

### Step 5: Output the Frame

Present a structured task frame:

```
## Task Frame: [Name]

**Scope**: [1-2 sentence summary]

**Inputs**: [list]
**Outputs**: [list]
**Dependencies**: [list]

**Constraints**:
- Time: [bound]
- Resources: [bound]
- Concurrency: [bound]
- Data: [bound]

**Scale Success Criteria**:
- 10x: [expectation]
- 100x: [expectation]
- Failure point: [description]
```

This frame feeds into `/scale-review:evaluate` and `/scale-review:test-scaling`.
