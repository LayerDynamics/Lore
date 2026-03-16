---
name: implementation-blueprint
description: This skill should be used when the user asks to "create an implementation blueprint", "turn this research into a plan", "write up the implementation approach", "generate a blueprint for X", "document the implementation path for X", or needs to convert research findings into a concrete, file-level, step-by-step implementation plan before writing code.
version: 0.1.0
---

# Implementation Blueprint

Process for converting feature research findings into a precise, executable implementation blueprint. A blueprint is the bridge between research and code — it specifies exactly what to build before anyone writes a line.

## What a Blueprint Must Answer

A blueprint is only useful if it answers these questions unambiguously:

1. **What files get created?** (exact paths, not "somewhere in src/")
2. **What files get modified?** (exact paths, and specifically what changes)
3. **What new types/interfaces are introduced?** (with signatures)
4. **How does data flow through the new code?** (input → transformation → output)
5. **How is the feature tested?** (what's unit vs integration vs e2e)
6. **What could go wrong?** (risk register with severity)
7. **What's still unknown?** (open questions the blueprint can't answer yet)

If any of these can't be answered, the research phase wasn't complete. Note the gaps explicitly rather than hand-waving.

## Blueprint Structure

```markdown
# Implementation Blueprint: [Feature Name]
Date: YYYY-MM-DD  Source: [research report filename]

## Context
[1-2 sentences: what this feature does and why it's being added]

## Files to Create
For each new file:
- **Path**: [exact path from project root]
- **Purpose**: [one sentence]
- **Key exports**: [main functions/classes/types it will export]
- **Dependencies**: [what it imports from]

## Files to Modify
For each modified file:
- **Path**: [exact path]
- **Changes**: [bullet list of specific changes — not "update X" but "add method Y to class Z that does W"]
- **Impact**: [what breaks or changes behavior for callers]

## New Interfaces and Types
[Exact TypeScript/Rust/etc. signatures for all new types]

## Data Flow
[Text diagram or step-by-step: input → step1 → step2 → output]
Show both the happy path and the main error path.

## Test Strategy
For each new file:
- Unit tests: [what to test, what to mock]
- Integration tests: [what to test end-to-end]
- Skip testing: [if truly not testable, say why]

## Implementation Order
[Ordered list: file 1 first because it has no deps, file 2 next because it needs file 1, etc.]

## Risk Register
| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| [Risk] | High/Med/Low | High/Med/Low | [How to reduce] |

## Open Questions
[Numbered list of things the blueprint can't answer — things that will be resolved during implementation]
```

## Making Tasks Atomic

Every "file to create" and "file to modify" entry must be independently verifiable. A task is atomic when:

- It can be written and tested in isolation
- Its completion is objectively measurable (the tests pass)
- A developer can pick it up without context from other tasks

If a task is too large to be atomic, split it. If it can't be split (genuine circular dependency), note the coupling explicitly.

## Flagging Unknowns vs. Decisions

Distinguish clearly between:

**Decisions** (made during research): "We will use X pattern because Y. Alternative Z was rejected because W."

**Unknowns** (discovered during research): "The optimal buffer size for X is unclear — start with N and measure."

Unknowns are not failures. A blueprint that honestly lists its unknowns is more useful than one that hides them with false confidence.

## Risk Classification

Classify each risk by:

**Severity** (if it occurs):
- High: blocks users, corrupts data, breaks other features
- Medium: degrades performance or UX, causes bugs in edge cases
- Low: cosmetic, narrow scope, easy to fix

**Likelihood** (probability):
- High: likely given the implementation approach
- Medium: possible but requires specific conditions
- Low: unlikely but worth noting

**Mitigation**: What to do to reduce likelihood or severity. "Add a test" is not a mitigation — it's detection. A mitigation reduces the probability or blast radius.

## Test Strategy Guidance

For each new file, specify:

**Unit tests** — test one function/class in isolation with all external dependencies mocked:
- What inputs and expected outputs?
- What error cases?
- What invariants must hold?

**Integration tests** — test multiple components together with real (not mocked) dependencies:
- What flows need to be tested end-to-end?
- What external services or files need to be present?

**When to skip testing**:
- Pure wrappers with no logic (e.g., re-exporting another module)
- Generated code
- Configuration files

Never skip testing for code that has business logic, data transformation, or error handling.

## Implementation Order Rationale

Order tasks by dependency graph:
1. Types and interfaces first (no dependencies)
2. Core implementation files (depend only on types)
3. Integration files (depend on core)
4. Command/entrypoint files (depend on everything)
5. Tests (depend on implementation, written before implementation in TDD)

Note when parallel implementation is possible (independent files can be done simultaneously).

## Additional Resources

- **`references/blueprint-template.md`** — Complete filled-out blueprint example for a real feature
- **`references/risk-assessment-guide.md`** — How to identify and classify implementation risks