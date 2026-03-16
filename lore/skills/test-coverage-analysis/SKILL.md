---
name: test-coverage-analysis
description: This skill should be used when the user asks to "check test coverage", "what's not tested", "find untested code", "improve test coverage", "which functions need tests", "coverage gaps", or when preparing to add tests to an existing codebase.
---

# Test Coverage Analysis

## Two Types of Coverage

**Line coverage** — automated metrics from tools (Istanbul, tarpaulin, coverage.py). Measures which lines ran during tests.

**Meaningful coverage** — what actually matters: are the important behaviors and edge cases tested? A function can have 100% line coverage with tests that don't verify correctness.

This skill focuses on meaningful coverage, not just line counts.

## Finding Untested Code Without a Coverage Tool

### Find Test Files and Map Them to Source

```bash
# Find all test files
find . -name "*.test.*" -o -name "*_test.*" -o -name "*.spec.*" | grep -v "node_modules\|.git\|target\|dist"

# Find all source files (non-test)
find . -name "*.ts" -o -name "*.py" -o -name "*.rs" | grep -v "node_modules\|.git\|target\|dist\|test\|spec"
```

For each source file, check if a corresponding test file exists. Source files without any test file are untested by default.

### Find Public Functions Without Tests

```bash
# TypeScript: exported functions
grep -rn "^export function\|^export const\|^export class\|^export async function" \
  --include="*.ts" . | grep -v "test\|spec\|.d.ts\|node_modules"
```

For each exported function, search test files to verify it appears there:
```bash
grep -rn "functionName" --include="*.test.*" --include="*.spec.*" .
```

## Prioritizing What to Test

Test coverage has diminishing returns. Focus on:

**High value (test these first):**
1. Core business logic — the functions that define what the product does
2. Error handling — paths that prevent data corruption or security issues
3. Public API surface — anything exported or exposed to external callers
4. Complex algorithms — anything with non-trivial conditionals or state

**Medium value:**
- Integration points (function that calls external service or DB)
- Data transformation functions
- Parsing and validation functions

**Lower value (don't force coverage for its own sake):**
- Trivial getters/setters
- Simple delegation (function that only calls another function)
- UI rendering details
- Pure configuration objects

## What Makes a Good Test

A test is meaningful if it:
1. **Verifies behavior, not implementation** — tests what the function does, not how
2. **Has a clear failure message** — when it fails, you know what's wrong
3. **Tests one thing** — one logical assertion per test case
4. **Covers the boundaries** — zero, one, many; null; empty; max value

Red flags in existing tests:
- Tests that only verify no exception is thrown (asserts nothing about output)
- Tests with no assertions at all
- Tests that mock everything (testing the mock, not the code)
- Tests named "test1", "testFoo", "testDefault" (too vague to be useful)

## Coverage Report Format

```
## Test Coverage Analysis — [path]

### Well-Covered (no action needed)
- [module] — [what's tested, briefly]

### Partially Covered (add edge case tests)
- [file:function] — existing tests cover happy path, missing: [edge cases]

### Not Covered (add tests)
- [file:function] — no tests found, priority: high/medium/low
  Suggested tests: [1-3 specific scenarios to test]

### Test Quality Issues
- [file:test] — [what's wrong with existing tests]

---
Top 3 highest-value additions:
1. [What to test, why it matters]
```