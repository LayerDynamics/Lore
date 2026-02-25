---
name: code-review-methodology
description: "This skill should be used when performing code reviews without git context, reviewing code objectively from a fresh perspective, auditing code quality standalone, analyzing code for bugs/security/architecture/performance issues, or when asked to look at code with new eyes. Trigger phrases include: 'review this code', 'code audit', 'fresh eyes review', 'objective code review', 'analyze code quality', 'local code review', 'review without git'."
---

# Local Code Review Methodology

Perform objective, git-free code reviews that evaluate code as-is without relying on diffs, PRs, or history.

## Review Dimensions

Evaluate every review target across these six dimensions:

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
- Inefficient algorithms where better alternatives exist (O(n^2) when O(n log n) is available)
- Resource leaks — unclosed handles, connections, streams

### 5. Testing Gaps
- Critical business logic without test coverage
- Error/exception paths not tested
- Edge cases missing (empty inputs, boundary values, concurrent access)
- Tests that test implementation details instead of behavior
- Missing integration tests for key workflows
- Brittle tests coupled to internal structure

### 6. Documentation Gaps
- Public API functions without documented contracts (params, return, errors)
- Complex algorithms without explanatory comments
- Outdated comments that contradict the code
- Missing README or setup instructions for runnable projects
- Unclear error messages that don't help users fix the issue

## Severity Scoring

| Level | Criteria | Action |
|-------|----------|--------|
| **Critical** | Bugs, security vulns, data loss risk, crashes | Must fix immediately |
| **High** | Significant quality/arch issues, reliability risks | Fix soon |
| **Medium** | Code smells, moderate improvements, maintainability | Fix when touching this code |
| **Low** | Style nits, minor suggestions, polish | Nice to have |

## Strengths

Always identify what the code does well. Look for:
- Clean, readable abstractions
- Thorough error handling
- Good test coverage
- Consistent patterns and style
- Thoughtful API design
- Proper use of language/framework features
- Security best practices followed

## Review Principles

1. **Be specific**: Always cite `file:line`. Never say "some files have issues."
2. **Explain why**: Don't just flag — explain the impact and risk.
3. **Be constructive**: Suggest how to fix, not just what's wrong.
4. **Be proportional**: Don't nitpick style in code with critical bugs.
5. **Stay objective**: No assumptions about intent. Judge the code as written.
6. **Fresh perspective**: You have no history with this code. That's a feature, not a bug.