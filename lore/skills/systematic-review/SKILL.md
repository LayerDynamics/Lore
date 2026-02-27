---
name: systematic-review
description: This skill should be used when conducting a comprehensive, multi-pass review of an entire module, service, or codebase — not just a single file or PR. Use when the user asks to "review the whole module", "audit this service", "full codebase review", "systematic review", "review everything in src/", "deep audit", "comprehensive review", or when reviewing scope spans more than 3 files and needs structured tracking to avoid missed areas.
version: 1.0.0
---

# Systematic Review

## Purpose

Conduct a structured, multi-pass review of an entire module or codebase where every file is read, every dimension is evaluated, and nothing is skipped. This skill prevents the common failure mode of reviewing a few files deeply while silently ignoring the rest.

## When to Use This Skill

- Reviewing an entire module, service, or directory tree
- Auditing a codebase before a release, handoff, or migration
- The review scope exceeds 3 files
- You need to guarantee full coverage (no file left unread)
- Single-file review skills (code-review-methodology, pr-style-review) are insufficient for the scope

## Core Principles

1. **Every file read**: No file in scope is skipped — each is opened and reviewed
2. **Multi-pass**: Separate passes for different concerns prevent tunnel vision
3. **Tracked coverage**: Maintain an explicit checklist of files reviewed vs. remaining
4. **Evidence-based**: Every finding cites file:line — no vague claims
5. **Severity-scored**: Findings are ranked so the most important issues surface first

## Workflow

### Phase 1: Scope and Inventory

Map every file in the review scope:

```
Glob("src/<module>/**/*.*")
```

Build the **review manifest** — the complete list of files to review:

```markdown
## Review Manifest: <module>

| # | File | Status | Pass 1 | Pass 2 | Pass 3 | Findings |
|---|------|--------|--------|--------|--------|----------|
| 1 | src/module/index.ts | pending | - | - | - | 0 |
| 2 | src/module/handler.ts | pending | - | - | - | 0 |
| 3 | src/module/utils.ts | pending | - | - | - | 0 |
...
```

**Do NOT start reviewing until the manifest is complete.**

### Phase 2: Pass 1 — Structural and Correctness Review

Read each file. For every file, evaluate:

- **Exports and API surface**: What does this file expose? Is the interface clean?
- **Logic correctness**: Are there bugs, off-by-one errors, race conditions, unreachable code?
- **Error handling**: Are errors caught, propagated, or silently swallowed?
- **Type safety**: Are types accurate, or are there `any`, unsafe casts, missing null checks?
- **Dead code**: Unused imports, unreachable branches, commented-out blocks

After reviewing each file, update the manifest status and record finding count.

### Phase 3: Pass 2 — Security and Boundary Review

Re-read each file with a security lens:

- **Input validation**: Is external input validated at entry points?
- **Injection vectors**: SQL, command, path traversal, template injection
- **Authentication/Authorization**: Are permission checks present where needed?
- **Secrets**: Hardcoded credentials, tokens, API keys
- **Data exposure**: Is sensitive data logged, returned in errors, or leaked?
- **Dependency risk**: Are imports from trusted sources? Known vulnerabilities?

### Phase 4: Pass 3 — Architecture and Integration Review

Evaluate cross-file concerns:

- **Module boundaries**: Are dependencies between files clean and unidirectional?
- **Coupling**: Are files tightly coupled or properly decoupled?
- **Consistency**: Do files follow the same patterns, naming, and conventions?
- **Duplication**: Is logic duplicated across files that should share a common function?
- **Test coverage**: Which exported functions lack corresponding tests?
- **Configuration**: Are magic numbers, hardcoded URLs, or environment-dependent values properly externalized?

### Phase 5: Synthesize Findings

Collect all findings into a single structured report.

#### Severity Levels

| Severity | Criteria | Action |
|----------|----------|--------|
| **Critical** | Data loss, security vulnerability, crash in production path | Must fix before ship |
| **High** | Bug in common path, missing error handling on external calls, auth gap | Fix in current cycle |
| **Medium** | Code smell, moderate duplication, inconsistent patterns, missing validation | Fix when touching file |
| **Low** | Style nit, naming improvement, minor dead code | Optional cleanup |

#### Finding Format

```markdown
### [SEVERITY] Short title

**File:** `src/module/file.ts:42`
**Pass:** 1 (Correctness) | 2 (Security) | 3 (Architecture)

**Issue:**
[What the code does wrong — cite the exact lines]

**Evidence:**
```<language>
// The problematic code, copied from the file
```

**Recommendation:**
[Specific fix, not vague advice]
```

#### Report Structure

```markdown
# Systematic Review: <module>

## Summary

- **Files reviewed:** X / X (100%)
- **Critical:** N | **High:** N | **Medium:** N | **Low:** N
- **Strengths:** [Top 3 things done well]

## Critical Findings
[Findings sorted by severity, then by file order]

## High Findings
...

## Medium Findings
...

## Low Findings
...

## Strengths
[Specific things the code does well — cite files]

## Coverage Manifest
[Final manifest table showing all files reviewed]
```

### Phase 6: Verify Coverage

Before finalizing the report:

- [ ] Every file in the manifest is marked as reviewed across all 3 passes
- [ ] No file in scope was skipped
- [ ] Every finding has a file:line reference
- [ ] No finding contains "likely", "probably", "might", or "should" without evidence
- [ ] Severity ratings are justified by the criteria table
- [ ] Strengths section is populated (reviews that only criticize are incomplete)

## Parallel Execution

For large codebases, dispatch parallel agents per subdirectory:

```
Agent 1: src/module/auth/**
Agent 2: src/module/api/**
Agent 3: src/module/data/**
```

Each agent runs the full 3-pass workflow on their scope. The parent agent synthesizes findings into the final report.

Use the `superpowers:dispatching-parallel-agents` skill when the file count exceeds 15.

## Prohibited Patterns

| Pattern | Why |
|---------|-----|
| "I reviewed the key files" | All files must be reviewed, not just "key" ones |
| "The rest of the files look similar" | Each file is read individually |
| "This module generally follows good practices" | Cite specific evidence |
| Skipping test files | Tests are in scope — review them too |
| Reviewing only changed files | Systematic = full scope, not just diffs |
| "No major issues found" without manifest | Prove coverage before claiming clean |

## Integration with Other Skills

- **Before this skill**: Use `verify-before-documenting` if you need to understand what exists
- **During Pass 1-3**: Use `code-review-methodology` criteria as the evaluation framework per file
- **After this skill**: Use `pr-style-review` format if findings need to be presented as a formal review
- **For fixes**: Chain into `writing-plans` to turn critical/high findings into an implementation plan

## Quick Reference

```
1. Inventory  →  List every file in scope
2. Pass 1     →  Correctness and logic (per file)
3. Pass 2     →  Security and boundaries (per file)
4. Pass 3     →  Architecture and integration (cross-file)
5. Synthesize →  Severity-scored findings with evidence
6. Verify     →  100% coverage confirmed via manifest
```

## Remember

**A review that skips files is worse than no review — it creates false confidence. Read everything. Track everything. Report everything.**
