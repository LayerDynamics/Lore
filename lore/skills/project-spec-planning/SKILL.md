---
name: project-spec-planning
description: Use when the user wants to create a project specification, architecture document, or system design spec. Guides through structured discovery — reads existing docs or asks targeted questions — then produces a complete spec following the standard template.
---

# Project Spec Planning

## Purpose

Produce a complete architecture specification document by either extracting information from existing project documentation or guiding the user through structured discovery questions. The output follows the standard spec template bundled with this skill at `skills/project-spec-planning/SpecExpectations.md`.

## When to Use

- User wants to create a project spec, architecture doc, or system design document
- User says "spec out", "write a spec", "plan the architecture", "create a project plan"
- Starting a new project or major feature that needs formal specification
- Converting existing scattered docs/notes into a structured spec

## Gate

**Do not generate the spec document until all discovery sections (Steps 1-2) are complete.** If the user tries to skip ahead, remind them which sections still need input. Incomplete specs waste more time than thorough discovery.

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

Ask:
- What is this project/system called?
- One-sentence description of what it does
- Who is it for? (end users, internal teams, developers, etc.)

#### 2b. Background

Ask:
- What problem does this solve?
- What exists today and why is it insufficient?
- Why build this now?
- What are the key assumptions?

#### 2c. Requirements

Work through each requirement category across multiple messages. For each category, ask what applies and assign MoSCoW priority:

**Message 1 — Core capabilities:**
- **Functional**: What must the system do? (list core capabilities)
- **Non-functional**: What are the performance/availability/scale targets?

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
- What is the tech stack? (languages, frameworks, databases, cloud provider)
- Monolith vs microservices vs serverless vs hybrid?
- What are the major components/services?

**Message 2 — Communication and data:**
- How do components communicate? (REST, gRPC, events, queues)
- What is the data model? (key entities and relationships)
- What are the critical workflows? (step-by-step flows)

**Message 3 — Resilience and operations:**
- What security controls are needed?
- How does it handle failure? (retries, circuit breakers, DLQs)
- How does it scale? (horizontal, caching, partitioning)

**Message 4 — Observability and deployment:**
- How is it monitored? (metrics, logs, traces, alerts)
- How is it deployed? (CI/CD, environments, rollback)
- What alternatives were considered and why rejected?

#### 2e. Implementation Plan

Ask:
- What are the build phases? (foundation, core, integrations, hardening)
- What can be parallelized?
- What are the dependencies?
- Testing strategy? (unit, integration, e2e, load, security)
- Rollout strategy? (canary, blue-green, feature flags, gradual)
- What defines "ready for production"?

#### 2f. Milestones

Ask:
- What are the key checkpoints?
- What are the exit criteria for each?
- Target timeframes?
- Who owns each milestone?

#### 2g. Success Metrics and Validation

Ask:
- How do you measure success after launch?
- What dashboards or reports are needed?
- How will results be validated? (synthetic tests, SLA/SLO reporting, audit evidence, user feedback, incident reviews)
- What triggers corrective action?
- Review cadence? (1 week, 30 days, quarterly)

#### 2h. Appendices

Ask which appendices apply to this project:
- Assumptions log
- Glossary of terms
- Risk register
- Capacity model
- Security threat model
- Data migration plan
- API contracts
- Runbooks
- Cost model
- Decision log

For each selected appendix, gather the relevant details.

### 3. Generate the Spec Document

Once all sections are gathered and confirmed, produce the full spec document.

**Format:** Follow the structure in the bundled `SpecExpectations.md` template exactly:

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

1. Determine the output path. Default: `docs/specs/SPEC-<n>-<slug>.md` in the project root. Ask the user if they want a different location.
2. Assign the next spec number by checking existing specs in `docs/specs/`.
3. Write the complete document.
4. Present a summary of what was generated with section counts and completeness.
5. Ask if any section needs revision.

## Rules

- Never skip a section. If information is unavailable, write "TBD — [what is needed to complete this]" so gaps are visible.
- Never fabricate requirements or technical decisions. Only document what the user confirmed or what was extracted from existing docs.
- Do not generate the spec until all discovery steps are complete (see Gate).
- Use MoSCoW for all requirements.
- Keep the language concrete and specific. Replace vague terms ("fast", "secure", "scalable") with measurable targets.
- Every requirement must be testable.
- If the user provides a URL or file path as input, read it first before asking questions.
- Prefer extracting from docs over asking redundant questions.

## Output

A complete architecture specification document written to `docs/specs/SPEC-<n>-<title>.md` following the standard template, with all sections populated from discovered context or user responses. TBD markers for any gaps that need follow-up.
