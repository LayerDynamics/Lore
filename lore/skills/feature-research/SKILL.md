---
name: feature-research
description: This skill should be used when the user asks to "research how to implement a feature", "how would I add X to this codebase", "what's the best approach for implementing X", "help me research X before building it", "research X for this codebase", or needs to understand an implementation path before writing any code. This is the pre-implementation research phase, not the implementation phase.
version: 0.1.0
---

# Feature Research

Structured five-phase process for researching a new feature before implementation. Produces a research report and implementation blueprint as durable artifacts.

## When to Use This Skill

Use this skill at the start of any non-trivial feature. If the feature will touch more than 2-3 files or requires integrating a new library or pattern, research first. Research is fast; rework is slow.

## Output Location

Save all research outputs to `.feature-research/` in the project root:
- Research report: `.feature-research/[kebab-feature-name]-[YYYY-MM-DD].md`
- Blueprint (if generated): `.feature-research/[kebab-feature-name]-blueprint-[YYYY-MM-DD].md`

## Phase 1: Frame the Research Question

Before touching any code or docs, clarify:

1. **What is the feature?** Write a one-sentence definition: "This feature [verb] [object] so that [user/system benefit]."
2. **What does "done" look like?** Identify the acceptance criteria or observable behavior.
3. **What's the scope?** New file(s) only, or modifying existing behavior? Does it touch the public API?
4. **What's unknown?** List the things you don't know yet: Which library to use? Where to plug in? How to handle edge case X?

If the feature description is ambiguous, ask the user for clarification before proceeding. A clear question is faster than wrong research.

## Phase 2: Codebase Analysis

**Invoke the `codebase-pattern-scout` agent** with these inputs:
- The feature description from Phase 1
- The specific unknowns from Phase 1
- Which area of the codebase seems most relevant

What to get back from the agent:
- Architecture style and domain boundaries
- Similar existing features (with exact file paths)
- Extension points where the feature can plug in
- Naming conventions and file organization patterns
- A prioritized list of key files to read next

After the agent returns, **read the key files it identified**. Don't rely on the agent's summaries alone — reading the actual code reveals details that summaries miss.

For deep-dive search within the codebase, use:
- `Grep` for concept keywords across all files
- `Glob` for file patterns in the expected location
- `Read` for specific files identified as most similar

## Phase 3: External Research

**Invoke the `external-research-synthesizer` agent** when the feature involves:
- Integrating a third-party library or framework
- Implementing an external protocol (WebSocket, HTTP/2, OAuth, etc.)
- Applying a pattern from outside the codebase (rate limiting, circuit breaking, etc.)
- Using browser/platform APIs that have documented behavior

Skip external research for pure business logic that's entirely internal.

What to get back from the agent:
- Best practices summary for the specific technology
- Relevant APIs with their signatures
- Working code examples adapted to the codebase's style
- Known pitfalls and gotchas
- Recommended approach given the codebase constraints

## Phase 4: Synthesize Findings

Compare what was found in Phase 2 (codebase analysis) against Phase 3 (external research):

1. **Identify alignment** — where external best practices match what the codebase already does
2. **Identify gaps** — where external best practices require patterns the codebase doesn't yet have
3. **Identify conflicts** — where external patterns would break codebase conventions
4. **Resolve gaps and conflicts** — decide how to handle each one:
   - Adapt the external pattern to fit codebase conventions
   - Introduce the new pattern and document why
   - Find a codebase-native alternative

Document all decisions and the reasoning. These are the most important outputs of research — not just what to do, but why.

## Phase 5: Produce Blueprint

**Invoke the `implementation-blueprint-generator` agent** with the synthesized findings from Phase 4.

The blueprint should include:
- Files to create (with full paths and purpose)
- Files to modify (with specific change descriptions, not just "modify X")
- New interfaces/types to define
- Function signatures for the main new functions
- Data flow description
- Test strategy (what to unit test, what to integration test)
- Risk register (what could go wrong and why)
- Open questions (unknowns that implementation will reveal)

Save the blueprint alongside the research report in `.feature-research/`.

## Research Report Format

The research report captures findings in a durable, portable format:

```markdown
# Feature Research: [Feature Name]
**Date**: YYYY-MM-DD  **Depth**: quick|standard|deep  **Codebase**: [path or name]

## Summary
[2-3 sentences: what was researched, what was found, what's the recommended path]

## Codebase Findings
[From Phase 2: architecture, similar features, extension points, conventions]

## External Research Findings
[From Phase 3: best practices, APIs, examples, pitfalls — or "N/A: internal-only feature"]

## Synthesis
[From Phase 4: alignments, gaps, conflicts, decisions made]

## Implementation Blueprint
[From Phase 5: files to create/modify, interfaces, data flow, test strategy, risks]
```

## Research Depth Options

**Quick** (use for small features or time-constrained research):
- Phase 2 only (codebase analysis)
- No external research
- Simplified blueprint: files to touch + rough approach

**Standard** (default for most features):
- All 5 phases
- Full research report + complete blueprint

**Deep** (use for large features, architectural changes, or high-risk additions):
- All 5 phases
- Multiple architectural approaches compared
- Full risk matrix
- Migration/rollout considerations

## Additional Resources

- **`references/research-workflow.md`** — Detailed decision trees for each phase
- **`references/findings-template.md`** — Fully filled-out example research report