---
name: design
description: Architecture design, specification writing, and implementation planning. Three modes — outline (components, interfaces, data flow), spec (complete architecture document), and roadmap (milestones, trade-offs, task breakdown).
argument-hint: <feature> [--mode outline|spec|roadmap]
---

# Design

You are conducting a design session. The mode determines the depth and output format.

**Input:** `$ARGUMENTS` describes the feature, system, or task to design.

## Mode Selection

Parse `$ARGUMENTS` for a `--mode` flag:

- `--mode outline` → **Mode 1: Design Outline**
- `--mode spec` → **Mode 2: Full Spec**
- `--mode roadmap` → **Mode 3: Implementation Roadmap**
- No flag → Ask the user which mode they want, briefly describing each:
  1. **Outline** — Components, interfaces, data flow, high-level structure. Best when you need to see the shape before committing.
  2. **Spec** — Complete architecture specification with all sections. Best for formal documentation and team handoff.
  3. **Roadmap** — Strategy evaluation, trade-offs, milestones, task breakdown. Best when you need an actionable execution plan.

After selecting a mode, follow ONLY that mode's workflow below. Do not mix modes.

---

# Mode 1: Design Outline

Produce a structured system design outline that defines **what the components are, how they connect, and what data flows between them** — without specifying implementation-level details. This is the architectural layer between brainstorming and implementation.

## Skill Chain Position

```
brainstorming → design --mode outline → blueprint → code
     (why)            (what)                    (how)              (build)
```

## Core Principles

1. **Components, not files**: Define logical components — the blueprint decides where they live
2. **Interfaces first**: Define what crosses boundaries before defining internals
3. **Data flow explicit**: Every piece of data has a named origin, path, and destination
4. **Dependencies visible**: Every component's dependencies are listed — no hidden coupling
5. **Grounded in codebase**: If a project already exists, the design must account for existing architecture

## Workflow

### Step 1: Understand Existing Context

If this is a new feature in an existing project, read the codebase first:

```
Glob("src/**/*.*")   — map the current structure
Read key entry points — understand existing architecture
```

Capture:
- **Existing components** the design must integrate with
- **Existing patterns** the design should follow (or explicitly deviate from)
- **Existing interfaces** the new design must conform to

If this is a greenfield project, skip to Step 2.

### Step 2: Define Components

List every component the system needs. For each:

```markdown
### Component: <Name>

**Responsibility:** [Single sentence — what this component does]
**Owns:** [What data or state this component is the source of truth for]
**Depends on:** [Other components it requires]
**Depended on by:** [Other components that require it]
```

Rules:
- Each component has **one responsibility** — if you write "and", consider splitting
- Every component must appear in at least one other component's dependency list (no orphans)
- If a component owns no data and has no dependents, question whether it should exist

### Step 3: Define Interfaces

For every boundary where components communicate, define the interface:

```markdown
### Interface: <ComponentA> → <ComponentB>

**Method/Event:** `actionName(input: InputType): OutputType`
**Direction:** A calls B | B emits to A | Bidirectional
**Data crossing boundary:**
  - Request: [exact shape]
  - Response: [exact shape]
**Error cases:** [what happens when this call fails]
**Contract:** [invariants that must hold — e.g., "never called before init"]
```

Rules:
- Every arrow between components in a diagram must have a corresponding interface definition
- Interfaces define **what** crosses the boundary, not **how** it's implemented
- Error cases are mandatory — "happy path only" designs fail in production

### Step 4: Map Data Flow

For each major operation the system performs, trace the data path:

```markdown
### Flow: <Operation Name>

**Trigger:** [What initiates this flow — user action, cron, event, API call]

1. **<ComponentA>** receives `<input>`
2. **<ComponentA>** validates and transforms to `<intermediate>`
3. **<ComponentA>** calls **<ComponentB>**.`method(intermediate)`
4. **<ComponentB>** persists to `<store>`, returns `<result>`
5. **<ComponentA>** emits `<event>` with `<result>`

**State changes:** [What is different after this flow completes]
**Failure modes:**
- Step 3 fails: [what happens]
- Step 4 fails: [what happens]
```

Rules:
- Every flow starts with an external trigger and ends with a visible outcome
- Every step names the component responsible
- Failure modes for each step where external calls or I/O occur

### Step 5: Identify State and Storage

Define where state lives:

```markdown
### State: <Name>

**Owned by:** <Component>
**Type:** persistent (DB) | ephemeral (memory) | cached | derived
**Shape:** [data structure or schema]
**Written by:** [which flows write to it]
**Read by:** [which flows read from it]
**Consistency:** eventual | strong | doesn't matter
```

Rules:
- Every piece of state has exactly one owner
- If two components write to the same state, that's a design smell — resolve it
- Derived state must list its source state

### Step 6: Capture Constraints and Decisions

Document non-obvious design decisions and constraints:

```markdown
## Design Decisions

### Decision: <Short title>
**Options considered:**
1. [Option A] — [trade-off]
2. [Option B] — [trade-off]

**Chosen:** [Option N]
**Reason:** [Why — grounded in requirements, not preference]

## Constraints

- [Constraint from existing system]
- [Constraint from requirements]
- [Constraint from technology]
```

### Step 7: Produce the Design Outline Document

Assemble into a single document:

```markdown
# Design Outline: <Feature/System Name>

## Overview
[2-3 sentences: what this system does and its primary value]

## Components
[From Step 2 — all components with responsibilities and dependencies]

## Interfaces
[From Step 3 — all cross-component contracts]

## Data Flows
[From Step 4 — major operation flows with failure modes]

## State Model
[From Step 5 — where data lives and who owns it]

## Design Decisions
[From Step 6 — key choices and their rationale]

## Constraints
[From Step 6 — hard constraints the implementation must satisfy]

## Open Questions
[Anything the design cannot resolve — these become research tasks]

## Next Step
→ Use `blueprint` to convert this design into file-level build plan
```

### Step 8: Validate the Design

Before presenting to the user, verify:

- [ ] Every component has a clear single responsibility
- [ ] Every component appears in at least one interface definition
- [ ] Every interface defines error cases
- [ ] Every data flow traces from trigger to outcome
- [ ] Every piece of state has exactly one owner
- [ ] No circular dependencies between components (or cycles are explicitly justified)
- [ ] Open questions are listed — not hidden
- [ ] If existing codebase: design accounts for existing architecture

## Diagram Conventions

When ASCII diagrams aid clarity, use them:

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client   │────>│   API    │────>│  Service │
└──────────┘     └────┬─────┘     └────┬─────┘
                      │                │
                      v                v
                 ┌─────────┐     ┌─────────┐
                 │  Cache   │     │   DB    │
                 └─────────┘     └─────────┘
```

Every box must correspond to a defined component. Every arrow must correspond to a defined interface.

## Prohibited Patterns

| Pattern | Why |
|---------|-----|
| "This component handles everything related to X" | Too broad — split into focused components |
| Interfaces with no error cases | Production will find errors you didn't design for |
| Data flow with unnamed intermediate state | If data exists, name it and define its shape |
| Components with no dependents and no owned state | Likely unnecessary — justify or remove |
| "Implementation detail — decided later" for interfaces | Interfaces are the design; they can't be deferred |

---

# Mode 2: Full Spec

Produce a complete architecture specification document by either extracting information from existing project documentation or guiding the user through structured discovery questions.

## Gate

**Do not generate the spec document until all discovery sections are complete.** If the user tries to skip ahead, remind them which sections still need input. Incomplete specs waste more time than thorough discovery.

## Process

### 1. Discover Existing Context

Before asking any questions, search for existing documentation that may contain spec-relevant information.

**Actions:**
1. Check for README, docs/, wiki/, or any markdown files in the project root
2. Check for existing specs, RFCs, ADRs, or design docs
3. Check package.json, Cargo.toml, go.mod, etc. for project metadata
4. Check git log for project history and scope
5. Read any files the user points to

**If substantial docs exist:** Extract answers to the spec sections from them. Present what you found and ask the user to confirm or correct before proceeding.

**If no docs exist:** Proceed to Step 2.

### 2. Structured Discovery

Work through each spec section by asking the user targeted questions. Ask **2-3 questions per message** — enough to make progress without overwhelming. Use multiple-choice options when possible.

#### 2a. Identity and Scope
- What is this project/system called?
- One-sentence description of what it does
- Who is it for?

#### 2b. Background
- What problem does this solve?
- What exists today and why is it insufficient?
- Why build this now?
- What are the key assumptions?

#### 2c. Requirements

Work through each requirement category across multiple messages with MoSCoW priority:

**Message 1 — Core capabilities:**
- **Functional**: What must the system do?
- **Non-functional**: Performance/availability/scale targets?

**Message 2 — Security and data:**
- **Security & Compliance**: Auth model? Data regulations? Audit needs?
- **Data**: What data is stored? Source of truth? Retention?

**Message 3 — Integration and operations:**
- **Integration**: What external systems connect?
- **Operational**: Monitoring? DR? On-call?
- **Delivery constraints**: Timeline? Team size? Budget? Hosting?

#### 2d. Method (Technical Design)

Break into sub-groups across multiple messages:

**Message 1 — Stack and structure:**
- Tech stack? (languages, frameworks, databases, cloud provider)
- Monolith vs microservices vs serverless vs hybrid?
- Major components/services?

**Message 2 — Communication and data:**
- How do components communicate? (REST, gRPC, events, queues)
- Data model? (key entities and relationships)
- Critical workflows? (step-by-step flows)

**Message 3 — Resilience and operations:**
- Security controls needed?
- Failure handling? (retries, circuit breakers, DLQs)
- Scaling approach? (horizontal, caching, partitioning)

**Message 4 — Observability and deployment:**
- Monitoring? (metrics, logs, traces, alerts)
- Deployment? (CI/CD, environments, rollback)
- Alternatives considered and why rejected?

#### 2e. Implementation Plan
- Build phases? (foundation, core, integrations, hardening)
- Parallelization opportunities?
- Dependencies?
- Testing strategy? (unit, integration, e2e, load, security)
- Rollout strategy? (canary, blue-green, feature flags)
- Definition of "ready for production"?

#### 2f. Milestones
- Key checkpoints?
- Exit criteria for each?
- Target timeframes?
- Ownership?

#### 2g. Success Metrics and Validation
- How to measure success after launch?
- Dashboards or reports needed?
- Validation methods? (synthetic tests, SLA/SLO reporting, user feedback)
- Remediation triggers?
- Review cadence?

#### 2h. Appendices

Ask which appendices apply: assumptions log, glossary, risk register, capacity model, security threat model, data migration plan, API contracts, runbooks, cost model, decision log.

### 3. Generate the Spec Document

Once all sections are gathered and confirmed, produce the full spec document following this structure:

```
# SPEC-<n>-<title>

## Background
## Requirements
  ### Functional requirements
  ### Non-functional requirements
  ### Security and compliance requirements
  ### Data requirements
  ### Integration requirements
  ### Operational requirements
  ### Delivery constraints
## Method
  ### 1. System architecture overview
  ### 2. Architectural style and rationale
  ### 3. Component responsibilities
  ### 4. Data design and schema model
  ### 5. API and interface design
  ### 6. Workflow and sequence logic
  ### 7. Algorithms and business rules
  ### 8. Consistency and transaction strategy
  ### 9. Security architecture
  ### 10. Reliability and resilience design
  ### 11. Performance and scalability approach
  ### 12. Observability design
  ### 13. Infrastructure and deployment topology
  ### 14. Tradeoffs and rejected alternatives
  ### 15. Architecture diagrams in PlantUML
## Implementation
  ### Build phases
  ### Workstreams
  ### Dependencies
  ### Testing strategy
  ### Rollout strategy
  ### Operational readiness
## Milestones
## Gathering Results
  ### Success metrics
  ### Validation methods
  ### Post-production review cadence
  ### Remediation triggers
## Appendices (as selected)
```

### 4. Write and Confirm

1. Determine the output path. Default: `docs/specs/SPEC-<n>-<slug>.md`. Ask the user if they want a different location.
2. Assign the next spec number by checking existing specs in `docs/specs/`.
3. Write the complete document.
4. Present a summary of what was generated with section counts and completeness.
5. Ask if any section needs revision.

## Rules

- Never skip a section. If information is unavailable, write "TBD — [what is needed]" so gaps are visible.
- Never fabricate requirements or technical decisions. Only document what the user confirmed or what was extracted from existing docs.
- Do not generate the spec until all discovery steps are complete (see Gate).
- Use MoSCoW for all requirements.
- Keep language concrete and specific. Replace vague terms ("fast", "secure", "scalable") with measurable targets.
- Every requirement must be testable.
- If the user provides a URL or file path as input, read it first before asking questions.
- Prefer extracting from docs over asking redundant questions.

---

# Mode 3: Implementation Roadmap

Produce a comprehensive, actionable plan document that covers strategy evaluation, requirements, milestones, and language-specific caveats.

Follow every phase in order. Do NOT skip phases. Do NOT start writing the plan until all research phases are complete.

## Phase 1: Understand the Request

### Step 1: Parse the Task

Read `$ARGUMENTS` carefully. Identify:
- **What** is being built or changed
- **Why** it matters (infer from context if not stated)
- **Who** the audience or consumers are
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
   - `git log --oneline -20` for recent context
   - `git log --oneline --all --grep="<keyword>"` for related past work

### Step 3: Clarify Ambiguity

If the task is ambiguous or underspecified, ask the user to clarify:
- Scope boundaries (what's in, what's out)
- Performance requirements
- Compatibility constraints
- Timeline expectations
- Preferred approaches

Do NOT guess. Ask.

## Phase 2: Research Implementation Strategies

### Step 1: Identify Candidate Strategies

Identify 2-4 distinct implementation strategies. Each should represent a genuinely different approach, not variations of the same idea.

For each strategy, research:
1. **How it works** — the core mechanism and architecture
2. **Precedent** — where this approach has been used successfully
3. **Dependencies** — what libraries, services, or infrastructure it requires
4. **Complexity** — rough effort estimate (small/medium/large)

### Step 2: Evaluate Trade-offs

For each strategy, assess:

| Dimension | Questions to Answer |
|-----------|-------------------|
| **Correctness** | Does it fully solve the problem? Any edge cases it misses? |
| **Performance** | Runtime/memory characteristics? Bottlenecks? |
| **Maintainability** | How easy to understand, modify, and debug? |
| **Testability** | How easy to write comprehensive tests? |
| **Scalability** | Does it hold up under 10x/100x load? |
| **Security** | What attack surface does it introduce? |
| **Migration** | How disruptive to adopt? Incremental rollout possible? |
| **Ecosystem fit** | Does it align with existing codebase patterns? |

### Step 3: Research External Resources

If the task involves technologies or APIs you need to verify:
- Use `WebSearch` for current documentation, best practices, and known issues
- Use `WebFetch` to read specific docs pages
- Look for migration guides, breaking changes, or deprecation notices

### Step 4: Select Recommended Strategy

State clearly:
- **Which strategy** and why
- **What you're trading off** by choosing it
- **What would change your recommendation**

## Phase 3: Define Requirements

### Step 1: Functional Requirements

List every functional requirement as a concrete, testable statement using RFC 2119 language:

```
FR-1: The system MUST <do something specific>
FR-2: The system SHOULD <nice to have>
```

### Step 2: Non-Functional Requirements

Address each that applies: performance, reliability, security, compatibility, accessibility, observability, documentation.

### Step 3: Constraints

List hard constraints: language/framework requirements, infrastructure limitations, regulatory/compliance, timeline, budget/resources.

### Step 4: Acceptance Criteria

Define completion criteria: specific tests, metrics, demonstrable behaviors, required documentation.

## Phase 4: Language-Specific Caveats

Based on the identified language(s) and framework(s), document caveats:

1. **Idiomatic patterns** — How should this be built to feel native to the ecosystem?
2. **Common pitfalls** — Memory management, concurrency/async gotchas, type system quirks, dependency issues
3. **Ecosystem tools** — Standard libraries and tools for this task
4. **Performance considerations** — GC pauses, event loop blocking, thread safety, serialization costs
5. **Testing patterns** — Standard test frameworks and approaches
6. **Deployment considerations** — Bundle size, binary compilation, virtual environments, container optimization
7. **Version compatibility** — Known issues with specific runtime versions
8. **Security patterns** — Input validation, dependency scanning, secrets management

## Phase 5: Build the Roadmap

### Step 1: Break Into Milestones

Divide into 2-6 milestones. Each should:
- Deliver independently testable value
- Be completable in a focused work session
- Have clear entry and exit criteria
- Build on previous milestones

### Step 2: Define Each Milestone

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

Identify sequential vs. parallelizable milestones. Draw the dependency graph:

```
Milestone 1 → Milestone 2 → Milestone 4
                    ↘
              Milestone 3 → Milestone 5
```

### Step 4: Identify Risks and Mitigations

For each significant risk:
- **Risk:** What could go wrong
- **Impact:** How bad is it
- **Likelihood:** High/medium/low
- **Mitigation:** How to reduce the risk
- **Contingency:** What to do if the risk materializes

## Phase 6: Write the Plan Document

### Step 1: Assemble the Document

```markdown
# Implementation Plan: <Title>

**Date:** <today's date>
**Author:** <user + Claude>
**Status:** Draft

## Executive Summary
<3-5 sentence overview>

## Background & Context
<Why this work is needed>

## Implementation Strategy

### Recommended Approach: <Strategy Name>
<Description>

### Alternatives Considered
| Strategy | Pros | Cons | Verdict |
|----------|------|------|---------|

### Trade-off Analysis
<Key trade-offs and why they're acceptable>

## Requirements

### Functional Requirements
### Non-Functional Requirements
### Constraints
### Acceptance Criteria

## Language & Framework Caveats
<All caveats organized by topic>

## Roadmap

### Overview
<Milestone dependency diagram>

### Milestone 1: <Name>
...

## Risks & Mitigations
| Risk | Impact | Likelihood | Mitigation | Contingency |
|------|--------|-----------|------------|-------------|

## Open Questions

## References
```

### Step 2: Save the Document

Save to `docs/plans/` in the project root (create the directory if needed):

```
Write: docs/plans/<slug-from-title>.md
```

### Step 3: Present Summary

```
Plan saved to: docs/plans/<filename>.md

## Summary
- **Strategy:** <recommended approach in 1 line>
- **Milestones:** <count> milestones
- **Key risk:** <highest risk in 1 line>
- **First milestone:** <name and goal>
```
