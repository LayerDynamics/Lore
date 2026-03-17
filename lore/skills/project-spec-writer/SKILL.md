---
name: project-spec-writer
description: Use when the user wants to write a project specification, define a new project from scratch, create a technical spec document, or formalize project requirements into a structured specification. Produces a complete, production-grade project spec through guided discovery.
argument-hint: [project-name-or-description] [--from <file-or-url>]
---

# Project Spec Writer

You are writing a complete project specification. This skill produces a structured, comprehensive spec document through systematic discovery — either by extracting from existing materials or by guiding the user through targeted questions.

**Input:** `$ARGUMENTS` describes the project or points to source material.

## Gate

**Do NOT generate the spec document until all discovery phases are complete.** Incomplete specs cause more rework than thorough upfront discovery. If the user tries to skip ahead, tell them which sections still need input.

## Phase 1: Gather Source Material

### Step 1: Check for Existing Context

Parse `$ARGUMENTS` for a `--from` flag pointing to a file or URL. Also check automatically:

**Actions:**
1. If `--from <path>` is given, read the file or fetch the URL
2. Check the project root for: `README.md`, `docs/`, `wiki/`, `CLAUDE.md`, `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `.env.example`
3. Check `docs/specs/` for existing specs (to assign the next spec number and avoid overlap)
4. Check `git log --oneline -20` for project history
5. If the project has code, scan the structure with `Glob` to understand scope

**If substantial materials exist:** Extract answers to spec sections from them. Present a summary of what you found and ask the user to confirm, correct, or expand before proceeding.

**If starting from scratch:** Proceed to Phase 2.

### Step 2: Establish Spec Identity

Determine:
- **Spec number:** Check `docs/specs/` for existing `SPEC-<n>-*.md` files. Use the next sequential number.
- **Project name:** From `$ARGUMENTS` or ask the user.
- **One-line description:** What this project does in a single sentence.

## Phase 2: Structured Discovery

Work through each section by asking the user **2-3 targeted questions per message**. Use multiple-choice options where possible to reduce friction. Never ask more than 4 questions in a single message.

### 2a. Problem and Context

Ask:
- What problem does this solve? What pain point or gap does it address?
- What exists today? Why is it insufficient?
- Who are the primary users or consumers of this system?
- Why build this now? What's the urgency or opportunity?

### 2b. Core Capabilities (Functional Requirements)

Work through capabilities using MoSCoW prioritization:

**Message 1 — Must-haves:**
- What are the absolute minimum capabilities for this to be useful?
- What does the happy path look like end-to-end?

**Message 2 — Should-haves and nice-to-haves:**
- What capabilities would make this significantly better but aren't launch-blocking?
- Any features explicitly out of scope for V1?

Format each requirement as a testable statement:
```
FR-1 [MUST]: The system MUST <specific, verifiable behavior>
FR-2 [SHOULD]: The system SHOULD <specific, verifiable behavior>
FR-3 [COULD]: The system COULD <specific, verifiable behavior>
FR-4 [WONT]: The system WILL NOT <explicitly excluded scope>
```

### 2c. Quality Attributes (Non-Functional Requirements)

**Message 1 — Performance and reliability:**
- Latency targets? (e.g., p95 < 200ms)
- Throughput targets? (e.g., 1000 req/s)
- Availability target? (e.g., 99.9%)
- Recovery time objective? (minutes? hours?)

**Message 2 — Security and compliance:**
- Authentication model? (OAuth, API keys, JWT, SSO)
- Authorization model? (RBAC, ABAC, simple)
- Data sensitivity level? (PII, PHI, financial, public)
- Compliance requirements? (SOC2, GDPR, HIPAA, none)
- Audit logging needs?

**Message 3 — Scalability and operations:**
- Expected initial load? (users, requests, data volume)
- Expected growth trajectory? (10x in what timeframe?)
- Monitoring and alerting requirements?
- Disaster recovery needs?

### 2d. Technical Architecture

**Message 1 — Stack and topology:**
- Language(s) and runtime(s)?
- Framework(s)?
- Database(s) and storage?
- Cloud provider / hosting?
- Monolith vs microservices vs serverless?

**Message 2 — Communication and integration:**
- How do components communicate? (REST, gRPC, events, queues, WebSocket)
- External integrations? (third-party APIs, services, data sources)
- Data flow direction? (pull, push, bidirectional)

**Message 3 — Data model:**
- Key entities and their relationships?
- Data lifecycle? (creation, mutation, archival, deletion)
- Consistency requirements? (strong, eventual, per-entity)

**Message 4 — Resilience:**
- Failure handling strategy? (retries, circuit breakers, dead letter queues)
- Caching strategy? (what, where, TTL, invalidation)
- Rate limiting? Backpressure?

### 2e. Implementation Strategy

**Message 1 — Phases:**
- How should this be built incrementally? (What's phase 1 vs phase 2 vs phase 3?)
- What's the MVP that proves the concept works?

**Message 2 — Testing and deployment:**
- Testing strategy? (unit, integration, e2e, load, security)
- CI/CD approach?
- Deployment strategy? (canary, blue-green, rolling, feature flags)
- Rollback plan?

**Message 3 — Team and timeline:**
- Who is building this? (solo, team, distributed)
- Timeline constraints?
- Budget constraints?
- Definition of "done"?

### 2f. Milestones

Based on the implementation strategy, propose milestones:
- Key checkpoints with exit criteria
- Dependencies between milestones
- Target timeframes (if timeline was provided)
- Ownership (if team was described)

Present milestones to the user for confirmation before proceeding.

### 2g. Success Criteria

- How will you know this project succeeded after launch?
- What metrics will you track?
- What dashboards or reports are needed?
- Review cadence? (weekly, monthly, quarterly)
- What triggers remediation? (error rate > X%, latency > Yms)

### 2h. Risks and Open Questions

Present identified risks from the discovery process:
- Technical risks (novel technology, complex integration, scale unknowns)
- Organizational risks (timeline, resources, dependencies on other teams)
- Product risks (user adoption, market timing)

Ask: Are there additional risks or open questions you're aware of?

### 2i. Appendices Selection

Ask which appendices apply to this project:
- [ ] Glossary (domain-specific terms)
- [ ] API contracts (endpoint definitions)
- [ ] Data migration plan
- [ ] Security threat model
- [ ] Capacity model
- [ ] Cost model
- [ ] Decision log
- [ ] Runbooks
- [ ] Risk register

Gather content for selected appendices.

## Phase 3: Generate the Spec Document

Once all discovery sections are confirmed, assemble the complete spec.

### Document Structure

```markdown
# SPEC-<n>: <Project Name>

> <One-line description>

**Date:** <today's date>
**Author:** <user + Claude>
**Status:** Draft
**Version:** 1.0

---

## 1. Background

### 1.1 Problem Statement
<What problem this solves and why it matters>

### 1.2 Current State
<What exists today and why it's insufficient>

### 1.3 Target Users
<Who uses this and what they need>

### 1.4 Motivation
<Why now — business driver, technical driver, or opportunity>

### 1.5 Assumptions
<Key assumptions this spec rests on>

---

## 2. Requirements

### 2.1 Functional Requirements

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-1 | MUST | ... |
| FR-2 | MUST | ... |
| FR-3 | SHOULD | ... |

### 2.2 Non-Functional Requirements

#### Performance
| Metric | Target | Measurement |
|--------|--------|-------------|

#### Reliability
| Metric | Target |
|--------|--------|

#### Security & Compliance
<Auth model, data classification, compliance>

#### Scalability
<Growth targets, scaling approach>

### 2.3 Constraints
<Hard constraints: language, infrastructure, regulatory, timeline, budget>

### 2.4 Explicit Non-Goals
<What this project will NOT do in this version>

---

## 3. Architecture

### 3.1 System Overview
<High-level description + ASCII diagram>

### 3.2 Component Design

#### Component: <Name>
- **Responsibility:** <single sentence>
- **Technology:** <stack>
- **Interfaces:** <what it exposes>
- **Dependencies:** <what it requires>

<Repeat for each component>

### 3.3 Data Model
<Key entities, relationships, schema outline>

### 3.4 API & Interface Design
<Endpoint specifications, event schemas, protocol choices>

### 3.5 Data Flow
<Major workflows traced step-by-step through components>

### 3.6 Integration Points
<External systems, APIs, data sources>

### 3.7 Security Architecture
<Auth flow, encryption, access control, secrets management>

### 3.8 Resilience Design
<Failure handling, retries, circuit breakers, caching, rate limiting>

### 3.9 Observability
<Logging, metrics, tracing, alerting strategy>

### 3.10 Infrastructure & Deployment
<Hosting, CI/CD, environments, deployment strategy>

---

## 4. Implementation Plan

### 4.1 Build Phases

#### Phase 1: <Name>
- **Goal:** <what this achieves>
- **Scope:** <what's included>
- **Exit criteria:** <how to know it's done>

<Repeat for each phase>

### 4.2 Testing Strategy
<Unit, integration, e2e, load, security testing approach>

### 4.3 Rollout Strategy
<Deployment approach, feature flags, canary, rollback>

### 4.4 Operational Readiness
<What must be true before production: monitoring, runbooks, on-call>

---

## 5. Milestones

| Milestone | Goal | Exit Criteria | Target Date | Owner |
|-----------|------|---------------|-------------|-------|

### Dependency Graph
<ASCII diagram showing milestone dependencies>

---

## 6. Success Criteria

### 6.1 Launch Metrics
| Metric | Target | Measurement Method |
|--------|--------|--------------------|

### 6.2 Ongoing Monitoring
<Dashboards, alerts, review cadence>

### 6.3 Remediation Triggers
<What thresholds trigger action>

---

## 7. Risks

| ID | Risk | Impact | Likelihood | Mitigation | Contingency |
|----|------|--------|-----------|------------|-------------|

---

## 8. Open Questions

| # | Question | Owner | Due Date |
|---|----------|-------|----------|

---

## Appendices

<Selected appendices from 2i>
```

## Phase 4: Write and Validate

### Step 1: Write the Document

1. Create `docs/specs/` directory if it doesn't exist
2. Write to `docs/specs/SPEC-<n>-<slug>.md`
3. Use the slug derived from the project name (lowercase, hyphens)

### Step 2: Validate Completeness

Before presenting to the user, verify:

- [ ] Every section has real content (no empty sections)
- [ ] All functional requirements are testable statements with MoSCoW priority
- [ ] All non-functional requirements have measurable targets
- [ ] Architecture section includes at least one diagram
- [ ] Every component has a single responsibility
- [ ] Data model covers all entities mentioned in requirements
- [ ] Security section addresses auth, encryption, and access control
- [ ] At least 3 risks are identified with mitigations
- [ ] Milestones have exit criteria
- [ ] Success metrics are measurable
- [ ] Open questions have owners

### Step 3: Present Summary

```
Spec written to: docs/specs/SPEC-<n>-<slug>.md

## Summary
- **Project:** <name>
- **Sections:** <count> sections completed
- **Requirements:** <count> functional, <count> non-functional
- **Components:** <count> components defined
- **Milestones:** <count> milestones
- **Risks:** <count> risks identified
- **Open questions:** <count>

## Gaps
<Any sections marked TBD or incomplete>
```

### Step 4: Iterate

Ask if any section needs revision. Apply changes and rewrite the document.

## Rules

1. **Never skip a section.** If information is unavailable, write `TBD — <what is needed to complete this>` so gaps are visible and trackable.
2. **Never fabricate requirements or decisions.** Only document what the user confirmed or what was extracted from existing materials.
3. **Never generate the spec until discovery is complete** (see Gate).
4. **Every requirement must be testable.** If you can't write a test for it, it's not a requirement — it's a wish.
5. **Replace vague terms with measurable targets.** Not "fast" but "p95 < 200ms". Not "scalable" but "handles 10x current load". Not "secure" but "OWASP Top 10 mitigated + SOC2 compliant".
6. **Prefer extraction over interrogation.** If existing docs have the answer, use it. Don't ask the user what's already written down.
7. **Use diagrams where they clarify.** ASCII diagrams for architecture overview, component relationships, data flow, and milestone dependencies.
8. **Maintain traceability.** Requirements should be referenced in architecture decisions. Architecture should map to implementation phases. Milestones should trace back to requirements.
9. **Ask, don't guess.** If something is ambiguous and affects the spec, ask the user. A spec built on assumptions is a spec that will be rewritten.
10. **One spec, one project.** Don't combine multiple projects into a single spec. If the user describes multiple projects, write separate specs.

## Output

A complete project specification document at `docs/specs/SPEC-<n>-<slug>.md` containing:
- Full background and problem context
- Prioritized functional and non-functional requirements
- Architecture with components, data model, API design, and diagrams
- Implementation plan with phased delivery
- Milestones with exit criteria and dependencies
- Success metrics and monitoring strategy
- Risk register with mitigations
- Open questions with owners
- Selected appendices
