---
description: "Comprehensive code review skill with multiple scope modes. Use --scope files for targeted file review, --scope module for multi-pass auditable review, --scope project for full-project review, or no scope for agent-dispatched topic review. Trigger phrases: 'review this code', 'code review', 'audit', 'review [topic]', 'review these files', 'systematic review', 'full codebase review'."
argument-hint: "<subject or paths> [--scope files|module|project] [--file]"
---

# Code Review: $ARGUMENTS

You are performing a structured code review. The scope mode determines the workflow. All modes share the same evaluation rubric and output format.

## Step 1: Determine Scope Mode

Parse `$ARGUMENTS` for `--scope`:

- `--scope files` — Targeted review of specific files/directories passed as arguments
- `--scope module` — 3-pass auditable review of a module or directory tree (every file read, tracked coverage)
- `--scope project` — Full-project review (discover project structure, dispatch parallel agents)
- **No --scope flag** — Agent-dispatched topic review (decompose subject, dispatch investigation agents, synthesize)

If `$ARGUMENTS` is empty, ask the user:
> What would you like me to review? Provide a topic, file paths, or module path. Optionally add `--scope files|module|project`.

---

## Shared Evaluation Rubric

All review modes evaluate across these six dimensions:

### 1. Code Quality
- Logic errors and bugs
- Anti-patterns and code smells (god functions, feature envy, primitive obsession)
- Cyclomatic complexity — flag functions with deeply nested branches
- Naming clarity — variables, functions, types should reveal intent
- Duplication — DRY violations across files
- Dead code — unreachable paths, unused exports, commented-out blocks
- Consistency — style and patterns should be uniform within a project

### 2. Security
- **Injection**: SQL, command, path traversal, template injection
- **XSS/CSRF**: Unescaped output, missing CSRF tokens
- **Authentication/Authorization**: Broken auth flows, missing permission checks
- **Secrets**: Hardcoded API keys, tokens, passwords, connection strings
- **Input validation**: Missing or insufficient validation at system boundaries
- **Dependencies**: Known vulnerable packages, outdated critical dependencies
- **Cryptography**: Weak algorithms, improper random generation, plaintext storage

### 3. Architecture
- Coupling — classes/modules that know too much about each other
- Cohesion — modules that mix unrelated responsibilities
- Dependency direction — higher-level modules depending on lower-level details
- Interface design — leaky abstractions, overly broad interfaces
- Pattern consistency — mixed paradigms without clear boundaries
- Circular dependencies — modules that reference each other

### 4. Performance
- N+1 query patterns in data access
- Unnecessary memory allocations in hot paths
- Synchronous blocking in async contexts
- Missing caching for expensive repeated operations
- Inefficient algorithms where better alternatives exist
- Resource leaks — unclosed handles, connections, streams

### 5. Testing Gaps
- Critical business logic without test coverage
- Error/exception paths not tested
- Edge cases missing (empty inputs, boundary values, concurrent access)
- Tests that test implementation details instead of behavior
- Missing integration tests for key workflows

### 6. Documentation Gaps
- Public API functions without documented contracts
- Complex algorithms without explanatory comments
- Outdated comments that contradict the code
- Unclear error messages that don't help users fix the issue

---

## Shared Severity & Confidence Scoring

For every potential issue, assign a confidence score (0-100):

| Score | Meaning |
|-------|---------|
| 90-100 | Directly visible in code. No ambiguity. |
| 80-89 | Strong evidence. Unlikely to be explained away. |
| 75-79 | Reasonable evidence. Worth surfacing. |
| Below 75 | Drop it. Not enough evidence. |

Severity levels (only include issues at >= 75% confidence):

| Severity | Criteria | Confidence | Action |
|----------|----------|------------|--------|
| **Critical** | Data loss, security vulns, crashes, silent production errors | >= 90% | Must fix immediately |
| **Important** | Significant quality/arch issues, pattern violations, reliability risks | >= 80% | Fix soon |
| **Minor** | Code smells, inconsistencies, clarity improvements | >= 75% | Fix when touching this code |

**Strengths**: Cite specific evidence of well-implemented code. Reinforce patterns worth repeating.

---

## Shared Output Format

All modes produce output in this structure:

```markdown
## Code Review: [Subject]

### Summary
[2-3 sentence overall assessment]
[Files reviewed: X / Y (coverage %)] — include for module and project scopes

### Critical
- **[Title]** (`file:line`, confidence: N%) — [Description, impact scenario]

### Important
- **[Title]** (`file:line`, confidence: N%) — [Description, risk]

### Minor
- **[Title]** (`file:line`, confidence: N%) — [Description]

### Strengths
- **[Title]** (`file:line`) — [What's done well and why it's notable]

### Verification Checklist
- [ ] [Runnable/checkable action tied to a specific finding]
- [ ] [Another verification step]

### Recommendations
[Prioritized list of suggested improvements]
```

Omit any severity section with no findings. Always include Strengths and Verification Checklist.

If `--file` is present in arguments, also write the review to `REVIEW.md` in the project root.

---

## Review Principles

1. **Be specific**: Always cite `file:line`. Never say "some files have issues."
2. **Explain why**: Don't just flag — explain the impact and risk.
3. **Be constructive**: Suggest how to fix, not just what's wrong.
4. **Be proportional**: Don't nitpick style in code with critical bugs.
5. **Stay objective**: No assumptions about intent. Judge the code as written.
6. **Evidence before assessment**: If you cannot point to exact code, do not include the issue.

---

## Mode: --scope files (Targeted File Review)

1. **Parse arguments**: Everything that isn't `--scope`, `--file`, or `files` is a review target path. If no targets, ask the user what to review.

2. **Read the targets**: Use Read to examine each file. For directories, use Glob to discover files, then read key files.

3. **Understand context**: Briefly check surrounding code (imports, callers, types) to understand how target code fits into the larger project. Don't review the entire project.

4. **Review**: For small reviews (1-3 files), review inline. For larger targeted reviews, dispatch parallel agents by focus area using the Task tool.

5. **Synthesize**: Produce findings using the shared output format.

---

## Mode: --scope module (3-Pass Auditable Review)

### Phase 1: Scope and Inventory

Map every file in the review scope:
```
Glob("<path>/**/*.*")
```

Build the **review manifest** — the complete list of files:

```markdown
| # | File | Pass 1 | Pass 2 | Pass 3 | Findings |
|---|------|--------|--------|--------|----------|
| 1 | src/module/index.ts | pending | pending | pending | 0 |
```

**Do NOT start reviewing until the manifest is complete.**

### Phase 2: Pass 1 — Structural and Correctness Review

Read each file. Evaluate:
- Exports and API surface
- Logic correctness (bugs, off-by-one, race conditions, unreachable code)
- Error handling (caught, propagated, or silently swallowed)
- Type safety (any casts, missing null checks)
- Dead code

Update manifest status after each file.

### Phase 3: Pass 2 — Security and Boundary Review

Re-read each file with a security lens:
- Input validation at entry points
- Injection vectors
- Authentication/Authorization checks
- Secrets and data exposure
- Dependency risk

### Phase 4: Pass 3 — Architecture and Integration Review

Evaluate cross-file concerns:
- Module boundaries and dependency direction
- Coupling and duplication
- Pattern and naming consistency
- Test coverage gaps
- Externalized configuration

### Phase 5: Synthesize

Produce findings using the shared output format. Include the coverage manifest showing all files reviewed across all 3 passes.

### Phase 6: Verify Coverage

Before finalizing:
- [ ] Every file in the manifest is marked reviewed across all 3 passes
- [ ] No file in scope was skipped
- [ ] Every finding has a file:line reference
- [ ] No finding uses "likely", "probably", "might" without evidence
- [ ] Strengths section is populated

For large codebases (>15 files), dispatch parallel agents per subdirectory, each running the full 3-pass workflow.

**A review that skips files is worse than no review — it creates false confidence.**

---

## Mode: --scope project (Full-Project Review)

1. **Discover the project**: Use Glob and Read to understand project structure, language(s), framework(s), and entry points. Check: package.json, Cargo.toml, go.mod, pyproject.toml, Makefile, README, etc.

2. **Dispatch parallel review agents**: Use the Task tool to run parallel reviews covering the entire project, scoped by subdirectory or concern area.

3. **Synthesize**: Collect all agent results and produce a unified review using the shared output format.

---

## Mode: Default (Agent-Dispatched Topic Review)

### Step 2: Decompose Into Investigation Angles

Decompose the subject into 2-3 independent investigation angles. For example:
- Subject: "quality scorer integration with auto-publisher"
  - Angle 1: Quality scorer implementation and execution path
  - Angle 2: Auto-publisher's consumption of quality scores and routing logic
  - Angle 3: Integration point between quality-scorer and editorial rules engine

### Step 3: Dispatch Parallel Agents

In a SINGLE message, launch agents simultaneously (multiple Task tool calls):

**Agent 1: code-explorer** — focused on the primary execution path
- Provide: the review subject + specific angle
- Ask it to: trace the execution path from entry point to terminal side effect

**Agent 2: integration-mapper** — focused on service boundaries
- Provide: the review subject + which services appear involved
- Ask it to: map all HTTP calls, database accesses, Redis operations, and events between services

If there is a third angle, dispatch a second **code-explorer** agent for it.

Wait for ALL agents to complete before synthesizing.

### Step 4: Synthesize Into Review

Collect all findings from dispatched agents. Produce the review using the shared output format. Only include issues with >= 75% confidence.

### Step 5: Present Results

Present the synthesized review directly. If no Critical or Important issues found:
> No Critical or Important issues found at >= 75% confidence. See Minor issues and Strengths below.
