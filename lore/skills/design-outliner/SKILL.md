---
name: design-outliner
description: This skill should be used when the user needs a system design outline before implementation — defining components, interfaces, data flow, and dependencies at an architectural level. Use when the user asks to "outline the design", "design this system", "sketch the architecture", "what components do I need", "map out the structure", "design outline for X", "how should this be organized", or when brainstorming is complete and a concrete design document is needed before writing an implementation blueprint.
version: 1.0.0
---

# Design Outliner

## Purpose

Produce a structured system design outline that defines **what the components are, how they connect, and what data flows between them** — without specifying implementation-level details like exact file paths or line-by-line code changes. This is the architectural layer between brainstorming (idea exploration) and blueprinting (file-level build plan).

## When to Use This Skill

- After brainstorming has identified what to build, but before writing an implementation blueprint
- When the user needs to see the shape of a system before committing to implementation
- When there are multiple modules, services, or components that need to be designed together
- When interfaces between components need to be defined upfront
- When data flow and state management decisions must be made before coding

## Skill Chain Position

```
brainstorming → design-outliner → implementation-blueprint → code
     (why)          (what)              (how)              (build)
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

- [Constraint from existing system, e.g., "must use existing auth middleware"]
- [Constraint from requirements, e.g., "must handle 1000 events/sec"]
- [Constraint from technology, e.g., "browser environment, no Node APIs"]
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
→ Use `implementation-blueprint` to convert this design into file-level build plan
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

## Prohibited Patterns

| Pattern | Why |
|---------|-----|
| "This component handles everything related to X" | Too broad — split into focused components |
| Interfaces with no error cases | Production will find errors you didn't design for |
| Data flow with unnamed intermediate state | If data exists, name it and define its shape |
| Components with no dependents and no owned state | Likely unnecessary — justify or remove |
| "Implementation detail — decided later" for interfaces | Interfaces are the design; they can't be deferred |
| Copying architecture from a different project without justification | Design for this system's constraints |

## Diagram Conventions

When ASCII diagrams aid clarity, use them:

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client   │────▶│   API    │────▶│  Service │
└──────────┘     └────┬─────┘     └────┬─────┘
                      │                │
                      ▼                ▼
                 ┌─────────┐     ┌─────────┐
                 │  Cache   │     │   DB    │
                 └─────────┘     └─────────┘
```

Every box must correspond to a defined component. Every arrow must correspond to a defined interface.

## Remember

**A design outline is a contract between thinking and building. It answers "what are the parts and how do they connect" so that the blueprint can answer "what files and what code."**
