---
name: deep-code-investigation
description: "Exhaustive multi-layer code investigation — traces execution paths across boundaries, maps all data transformations, catalogs integration points, and surfaces hidden dependencies. Goes deeper than /lore:investigate by covering the full dependency graph, not just the primary call chain."
argument-hint: "<subject> (e.g., 'how auth middleware propagates user context', 'what happens when a webhook payload arrives')"
---

# Deep Code Investigation: $ARGUMENTS

You are performing an exhaustive, multi-layer investigation into the codebase. This is NOT a surface scan — you trace every path, follow every dependency, and document what you find with file:line precision.

## When to Use

- Understanding how a complex feature works end-to-end
- Preparing for a major refactor and need a complete map
- Investigating a subtle bug that spans multiple modules
- Auditing how data flows through the entire system
- Onboarding onto an unfamiliar part of the codebase

## Phase 1: Define the Investigation Scope

Parse the subject from `$ARGUMENTS`.

If `$ARGUMENTS` is empty, ask:
> What would you like me to investigate? Describe the feature, flow, or question you want answered.

Before reading any code, answer these framing questions:
1. **What is the entry point?** — The file/function/endpoint where execution begins
2. **What is the terminal effect?** — The database write, API response, file output, or side effect at the end
3. **What boundaries will be crossed?** — Module boundaries, service boundaries, process boundaries, network boundaries
4. **What am I looking for?** — State the specific questions this investigation should answer

Write these down before proceeding. They prevent scope drift.

## Phase 2: Primary Execution Trace

Follow the main execution path from entry point to terminal effect.

**At every step, document:**
- File path and line number
- Function/method name
- Input parameters (types and shapes)
- Output/return value (types and shapes)
- Side effects (DB writes, cache updates, events emitted, logs written)

**Rules:**
- Use Grep to find call sites — never assume
- Read import blocks to verify what's actually imported
- Follow every function call to its definition — do not stop at the interface
- When you hit an async boundary (event emitter, message queue, callback), trace BOTH sides
- When you hit a cross-module import, note the boundary and continue into the imported module

## Phase 3: Dependency Graph Expansion

After tracing the primary path, expand outward:

1. **What else calls these functions?**
   - Grep for every function you documented in Phase 2
   - Catalog all callers — these are alternate entry points and potential interaction bugs

2. **What configuration drives behavior?**
   - Trace every environment variable, config file read, or feature flag
   - Document default values and what happens when config is missing

3. **What error paths exist?**
   - At every try/catch, conditional, or validation check — trace the error branch
   - Where do errors propagate to? Are they swallowed, logged, re-thrown, or transformed?
   - Document any silent failures (catch blocks that don't re-throw or log)

4. **What shared state is involved?**
   - Global variables, singletons, caches, database connections
   - Mutable state that multiple code paths read/write
   - Race condition potential in concurrent access patterns

## Phase 4: Data Shape Analysis

Map how the primary data structure transforms as it moves through the system:

```
[Entry] → shape A
  ↓ function_1()
[Layer 1] → shape B (what changed and why)
  ↓ function_2()
[Layer 2] → shape C (what changed and why)
  ↓ ...
[Terminal] → shape N (final form)
```

For each transformation:
- What fields are added, removed, or renamed?
- What validation occurs?
- What defaults are applied?
- Are there lossy transformations (data that can't be recovered)?

## Phase 5: Boundary Audit

For every boundary crossed (module, service, process, network):

| # | From | To | Mechanism | Auth | Error Handling | Timeout | Data Contract |
|---|------|----|-----------|------|----------------|---------|---------------|
| 1 | ... | ... | ... | ... | ... | ... | ... |

Check at each boundary:
- Does the sender's output match the receiver's expected input?
- Is authentication/authorization enforced?
- What happens on timeout or network failure?
- Is there retry logic? Is it idempotent-safe?
- Are there version mismatches in shared types or schemas?

## Phase 6: Test Coverage Mapping

For every file touched in Phases 2-3:
1. Find the corresponding test file
2. Read the test to understand what scenarios are covered
3. Identify gaps — what execution paths have NO test coverage?
4. Note any tests that test the wrong thing (testing mocks instead of real behavior)

## Phase 7: Synthesize Findings

Present a structured report:

### 1. Executive Summary
2-3 sentences: what this code does, how it works at a high level, and the most important finding.

### 2. Entry Points
List all entry points discovered (primary + alternate callers from Phase 3).

### 3. Execution Trace
Ordered list with file:line at every step.

### 4. Data Flow
The transformation map from Phase 4.

### 5. Boundary Analysis
The boundary table from Phase 5.

### 6. Dependency Graph
What this code depends on, and what depends on this code.

### 7. Risk Areas
- Silent failures or swallowed errors
- Missing validation at boundaries
- Shared mutable state
- Missing test coverage for critical paths
- Configuration that could break things if changed

### 8. Open Questions
Things that cannot be determined from code alone (need runtime data, production logs, or human knowledge).

## What to Avoid

- **Do not propose fixes.** This is investigation, not remediation. Document findings only.
- **Do not stop at the first interesting thing.** Complete the full trace.
- **Do not skim test files.** Read them completely — test gaps are high-value findings.
- **Do not guess at runtime behavior.** If you can't determine it from code, list it as an open question.
- **Do not summarize without evidence.** Every claim needs a file:line citation.
