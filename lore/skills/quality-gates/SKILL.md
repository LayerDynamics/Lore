---
name: quality-gates
description: Use when reviewing code for merge readiness. Defines the gate system that code must pass before shipping.
---

# Quality Gates

## Purpose

Never ship code without passing all quality gates. Velocity without quality is net negative -- studies show that unchecked complexity gains cancel out productivity improvements entirely.

## The Gates

### Gate 1: Static Analysis

Run linters, type checkers, and static analysis tools. Zero tolerance for new warnings.

- ESLint, Pylint, CodeQL, or equivalent for the language
- Type checking must pass
- No new warnings introduced by the change

### Gate 2: Spec Compliance Review

**Does the code implement what was asked?**

Before reviewing code quality, verify that the implementation matches the specification:
- All required features are present
- Only required features are present (no scope creep)
- Edge cases from the spec are handled
- Tests verify spec requirements

Do not review code quality until spec compliance passes. Quality review of code that solves the wrong problem wastes effort.

### Gate 3: Code Quality Review

**Is the code well-built?**

Review for:
- Readability and maintainability
- Security vulnerabilities
- Performance concerns
- Error handling
- Project convention adherence

Use multiple independent reviewers when possible. Blind review (reviewers cannot see each other's findings) produces better results than sequential review.

### Gate 4: Anti-Sycophancy Check

If all reviewers unanimously approve, run a devil's advocate review. Unanimous approval without challenge is a red flag -- it may indicate reviewers are agreeing rather than critically evaluating.

The devil's advocate reviewer's sole purpose is to find problems the others missed.

### Gate 5: Severity-Based Blocking

| Severity | Action |
|----------|--------|
| Critical | Block. Fix immediately. |
| High | Block. Fix before commit. |
| Medium | Block. Fix before merge. |
| Low | Track as TODO. Fix later. |
| Cosmetic | Note. Optional fix. |

### Gate 6: Test Coverage

- All tests must pass (100% pass rate)
- Coverage must not decrease
- Minimum threshold: 80% for unit tests
- New code must have corresponding tests

### Gate 7: Test Integrity

Detect tests that appear to pass but prove nothing:
- Tests that never import the source code they claim to test
- Tautological assertions (asserting that a mock returns what it was told to return)
- Assertion values that changed alongside implementation changes (test fitting)
- Low assertion density (tests that execute code but check nothing)

## Two-Stage Review Protocol

Spec compliance and code quality are separate stages. Never combine them into a single review pass.

**Why they must be separate:**
- Mixed reviews produce "technically clean but wrong feature" approvals
- Quality reviewers approve beautiful code that does not match requirements
- "Three reviewers approved" means nothing if none checked the spec

**Stage 1:** Spec compliance. Must pass before proceeding.
**Stage 2:** Code quality. Only runs after Stage 1 passes.

If Stage 1 fails, return to implementation. Do not proceed to Stage 2.
If Stage 2 fails, fix quality issues and re-run Stage 2 only (spec compliance already verified).

## Velocity-Quality Balance

Every velocity gain must be accompanied by quality verification. Track these metrics over time:

- Static analysis warning count (must not increase)
- Cyclomatic complexity per file (must not increase more than 10% per commit)
- Test coverage percentage (must not decrease)
- Quality-to-velocity ratio (must stay positive)

If any threshold is violated, block the commit and fix before proceeding.

## Scaling Review

At low scale (few agents or contributors), full multi-reviewer blind review for every change is appropriate. At higher scale, prioritize review effort:

- **High risk** (security, auth, payments, data migrations): Full review
- **Medium risk** (new features, business logic): Reduced review with automated checks
- **Low risk** (bug fixes with tests, refactoring, docs): Automated checks with spot review

<!-- Inspired by Loki Mode quality gates system -->
