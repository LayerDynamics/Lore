---
name: implementation-planner
description: Full implementation planning workflow — research strategies, evaluate trade-offs, document requirements, build roadmap with milestones, and surface language-specific caveats. Produces a comprehensive plan document ready for execution.
argument-hint: "<feature or task description>"
---

# Implementation Planner

You are conducting a full implementation planning session. The goal is to produce a comprehensive, actionable plan document that covers strategy, requirements, roadmap, milestones, and language-specific caveats.

**Input:** `$ARGUMENTS` describes the feature, system, or task to plan.

Follow every phase in order. Do NOT skip phases. Do NOT start writing the plan until all research phases are complete.

---

## Phase 1: Understand the Request

### Step 1: Parse the Task

Read `$ARGUMENTS` carefully. Identify:
- **What** is being built or changed
- **Why** it matters (infer from context if not stated)
- **Who** the audience or consumers are (users, developers, services)
- **Where** it lives in the existing codebase (if applicable)

### Step 2: Scan the Codebase

If working inside a project, gather context:

1. Read `CLAUDE.md`, `README.md`, `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, or equivalent to identify:
   - Primary language(s) and framework(s)
   - Existing architecture patterns
   - Build/test/deploy tooling
   - Dependencies and constraints

2. Search for related code:
   - `Grep` for keywords related to the task
   - `Glob` for files in the relevant domain
   - Read 2-3 files to understand existing patterns

3. Check git history for related work:
   - `Bash: git log --oneline -20` for recent context
   - `Bash: git log --oneline --all --grep="<keyword>"` for related past work

### Step 3: Clarify Ambiguity

If the task is ambiguous or underspecified, use `AskUserQuestion` to clarify:
- Scope boundaries (what's in, what's out)
- Performance requirements
- Compatibility constraints
- Timeline expectations
- Preferred approaches if any

Do NOT guess. Ask.

---

## Phase 2: Research Implementation Strategies

### Step 1: Identify Candidate Strategies

For the task at hand, identify 2-4 distinct implementation strategies. Each strategy should represent a genuinely different approach, not variations of the same idea.

For each strategy, research:
1. **How it works** — the core mechanism and architecture
2. **Precedent** — where this approach has been used successfully (in this codebase, in the ecosystem, in the industry)
3. **Dependencies** — what libraries, services, or infrastructure it requires
4. **Complexity** — rough effort estimate (small/medium/large) and where the complexity concentrates

### Step 2: Evaluate Trade-offs

For each strategy, assess:

| Dimension | Questions to Answer |
|-----------|-------------------|
| **Correctness** | Does it fully solve the problem? Any edge cases it misses? |
| **Performance** | What are the runtime/memory characteristics? Bottlenecks? |
| **Maintainability** | How easy is it to understand, modify, and debug? |
| **Testability** | How easy is it to write comprehensive tests? |
| **Scalability** | Does it hold up under 10x/100x load/data? |
| **Security** | What attack surface does it introduce? |
| **Migration** | How disruptive is it to adopt? Can it be rolled out incrementally? |
| **Ecosystem fit** | Does it align with existing patterns in the codebase? |

### Step 3: Research External Resources

If the task involves technologies, patterns, or APIs you need to verify:
- Use `WebSearch` to find current documentation, best practices, and known issues
- Use `WebFetch` to read specific docs pages
- Look for migration guides, breaking changes, or deprecation notices

### Step 4: Select Recommended Strategy

Based on the trade-off analysis, select a recommended strategy. State clearly:
- **Which strategy** and why
- **What you're trading off** by choosing it
- **What would change your recommendation** (conditions under which a different strategy is better)

---

## Phase 3: Define Requirements

### Step 1: Functional Requirements

List every functional requirement as a concrete, testable statement:

```
FR-1: The system MUST <do something specific>
FR-2: The system MUST <do something else>
FR-3: The system SHOULD <nice to have>
```

Use RFC 2119 language (MUST, SHOULD, MAY) to indicate priority.

### Step 2: Non-Functional Requirements

Address each that applies:

- **Performance** — response time, throughput, resource limits
- **Reliability** — uptime, failure modes, recovery
- **Security** — authentication, authorization, data protection
- **Compatibility** — browser support, API versions, backward compat
- **Accessibility** — WCAG level, screen reader support
- **Observability** — logging, metrics, alerting
- **Documentation** — what docs are needed for users/developers

### Step 3: Constraints

List hard constraints that cannot be violated:
- Language/framework requirements
- Infrastructure limitations
- Regulatory/compliance requirements
- Timeline constraints
- Budget/resource constraints

### Step 4: Acceptance Criteria

Define how you know the implementation is complete:
- Specific tests that must pass
- Metrics that must be met
- Behaviors that must be demonstrable
- Documentation that must exist

---

## Phase 4: Language-Specific Caveats

Based on the language(s) and framework(s) identified in Phase 1, document caveats that will affect implementation.

### For Each Language/Framework, Address:

1. **Idiomatic patterns** — How should this be built to feel native to the ecosystem? What patterns does the community expect?

2. **Common pitfalls** — What mistakes do developers commonly make when building this type of thing in this language?
   - Memory management issues (if applicable)
   - Concurrency/async gotchas
   - Type system limitations or quirks
   - Package manager/dependency issues

3. **Ecosystem tools** — What libraries, frameworks, or tools are standard for this task in this language? Are there well-known options to evaluate?

4. **Performance considerations** — Language-specific performance characteristics that affect the design:
   - GC pauses, event loop blocking, thread safety
   - Serialization/deserialization costs
   - Cold start times (for serverless)

5. **Testing patterns** — How is this type of thing typically tested in this ecosystem? What test frameworks/tools are standard?

6. **Deployment considerations** — Language-specific build, bundle, or deploy concerns:
   - Bundle size (JS/TS)
   - Binary compilation (Go/Rust)
   - Virtual environments (Python)
   - Container image optimization

7. **Version compatibility** — Any known issues with specific language/runtime versions? Minimum version requirements?

8. **Security patterns** — Language-specific security best practices:
   - Input validation patterns
   - Dependency vulnerability scanning tools
   - Secrets management approaches

---

## Phase 5: Build the Roadmap

### Step 1: Break Into Milestones

Divide the implementation into 2-6 milestones. Each milestone should:
- Deliver independently testable value
- Be completable in a focused work session (not multi-week epics)
- Have clear entry and exit criteria
- Build on previous milestones

### Step 2: Define Each Milestone

For each milestone:

```
### Milestone N: <Name>

**Goal:** <1 sentence>
**Entry criteria:** <what must be true before starting>
**Exit criteria:** <what must be true to call it done>

**Tasks:**
1. [ ] <specific, actionable task>
2. [ ] <specific, actionable task>
3. [ ] <specific, actionable task>

**Estimated scope:** <small/medium/large>
**Key risks:** <what could go wrong>
**Dependencies:** <what this blocks or is blocked by>
```

### Step 3: Define the Critical Path

Identify which milestones are sequential vs. parallelizable. Draw the dependency graph:

```
Milestone 1 → Milestone 2 → Milestone 4
                    ↘
              Milestone 3 → Milestone 5
```

### Step 4: Identify Risks and Mitigations

For each significant risk:
- **Risk:** What could go wrong
- **Impact:** How bad is it (blocks everything, delays one milestone, minor inconvenience)
- **Likelihood:** How likely (high/medium/low)
- **Mitigation:** What you do to reduce the risk
- **Contingency:** What you do if the risk materializes

---

## Phase 6: Write the Plan Document

### Step 1: Assemble the Document

Write the complete plan as a markdown document with this structure:

```markdown
# Implementation Plan: <Title>

**Date:** <today's date>
**Author:** <user + Claude>
**Status:** Draft

## Executive Summary

<3-5 sentence overview: what we're building, why, recommended strategy, and key milestones>

## Background & Context

<Why this work is needed. What exists today. What problem it solves.>

## Implementation Strategy

### Recommended Approach: <Strategy Name>

<Description of the chosen strategy>

### Alternatives Considered

| Strategy | Pros | Cons | Verdict |
|----------|------|------|---------|
| <name> | <pros> | <cons> | Recommended / Rejected because... |
| <name> | <pros> | <cons> | Rejected because... |

### Trade-off Analysis

<Key trade-offs of the chosen approach and why they're acceptable>

## Requirements

### Functional Requirements
<FR list from Phase 3>

### Non-Functional Requirements
<NFR list from Phase 3>

### Constraints
<Constraints from Phase 3>

### Acceptance Criteria
<Criteria from Phase 3>

## Language & Framework Caveats

<All caveats from Phase 4, organized by topic>

## Roadmap

### Overview

<Milestone dependency diagram>

### Milestone 1: <Name>
<Full milestone detail from Phase 5>

### Milestone 2: <Name>
...

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation | Contingency |
|------|--------|-----------|------------|-------------|
| ... | ... | ... | ... | ... |

## Open Questions

<Any unresolved questions that need answers before or during implementation>

## References

<Links to docs, PRs, issues, or external resources consulted>
```

### Step 2: Save the Document

Save to `docs/plans/` in the project root (create the directory if needed):

```
Write: docs/plans/<slug-from-title>.md
```

The filename should be a kebab-case slug of the title.

### Step 3: Present Summary

After saving, present a concise summary to the user:

```
Plan saved to: docs/plans/<filename>.md

## Summary
- **Strategy:** <recommended approach in 1 line>
- **Milestones:** <count> milestones
- **Key risk:** <highest risk in 1 line>
- **First milestone:** <name and goal>

Ready to start? Run `/lore:continue docs/plans/<filename>.md` to begin execution.
```
