---
name: testing
description: Use for all testing workflows — test-driven development (write test first, watch fail, implement), test coverage analysis (find untested code, prioritize what to test), and scale testing (verify behavior under load). Trigger phrases include "write tests", "TDD", "check coverage", "find untested code", "test at scale", "load test", "what needs tests".
argument-hint: [--mode tdd|coverage|scale] [path or component]
---

# Testing

Unified testing skill covering test-driven development, coverage analysis, and scale testing.

## Mode Selection

If `$ARGUMENTS` includes `--mode`, use that mode. Otherwise:
- If the user asks to "write tests", "TDD", "test first", "red green refactor" → **TDD Mode**
- If the user asks to "check coverage", "find untested code", "what needs tests", "coverage gaps" → **Coverage Mode**
- If the user asks to "test at scale", "load test", "test under load", "scaling test" → **Scale Mode**
- If unclear, ask the user which mode to use.

---

# TDD Mode

## The Discipline

Write the test first. Watch it fail. Write the minimum code to pass. Clean up. Repeat.

If you did not see the test fail, you do not know whether it tests the right thing.

## When to Apply

Always, for:
- New features
- Bug fixes
- Refactoring with behavior changes
- Any production code

Exceptions require explicit human approval:
- Throwaway prototypes
- Generated code
- Configuration-only changes

## The Rule

```
No production code without a failing test first.
```

Wrote code before the test? Delete it. Start fresh from the test. Do not keep it as reference. Do not adapt it. Delete means delete.

## Red-Green-Refactor

### RED: Write a Failing Test

Write one test for one behavior.

Requirements:
- Descriptive name that states the expected behavior
- Tests real code, not mocks (unless external dependencies make it unavoidable)
- One assertion per concept

```typescript
test('rejects empty email with validation error', async () => {
  const result = await submitForm({ email: '' });
  expect(result.error).toBe('Email required');
});
```

### Verify RED: Run It and Confirm Failure

This step is mandatory. Never skip it.

```bash
# Run the specific test
npm test path/to/test.test.ts
```

Confirm:
- The test fails (not errors from syntax or imports)
- The failure message matches what you expect
- It fails because the feature is missing, not because of a typo

If the test passes immediately, you are testing existing behavior. Rewrite the test.

### GREEN: Write the Minimum Code

Write the simplest code that makes the test pass. Nothing more.

Do not add features the test does not require. Do not refactor other code. Do not "improve" beyond what the test demands.

### Verify GREEN: Run It and Confirm Pass

Mandatory.

```bash
npm test path/to/test.test.ts
```

Confirm:
- The new test passes
- All existing tests still pass
- No errors or warnings in output

If the test fails, fix the code. Do not modify the test.

### REFACTOR: Clean Up While Green

Only after all tests pass:
- Remove duplication
- Improve naming
- Extract helpers

Keep tests green throughout. Do not add new behavior during refactoring.

### Repeat

Write the next failing test for the next behavior.

## Writing Good Tests

| Quality | Looks Like | Does Not Look Like |
|---------|------------|-------------------|
| Minimal | Tests one thing. If "and" appears in the name, split it. | `test('validates email and domain and whitespace')` |
| Clear | Name describes the behavior under test | `test('test1')` |
| Intentional | Demonstrates the desired API | Obscures what the code should do |

## Why Order Matters

**"I will write tests after to verify it works"** — Tests written after code pass immediately. A test that passes immediately proves nothing. You never saw it catch the bug it was meant to prevent.

**"I already manually tested the edge cases"** — Manual testing is unrepeatable. No record of what was covered. Cannot re-run when code changes. Automated tests run the same way every time.

**"Deleting hours of work is wasteful"** — Sunk cost fallacy. The time is gone. The choice now is between high-confidence code written test-first and low-confidence code you cannot trust.

**"TDD is too rigid"** — TDD is pragmatic. It finds bugs before commit, prevents regressions, documents behavior, and enables fearless refactoring. Skipping it means debugging in production.

## Red Flags: Stop and Start Over

- Code written before the test
- Test passes on first run
- Cannot explain why the test failed
- Rationalizing "just this once"
- "Keep as reference" or "adapt existing code"
- "Tests after achieve the same purpose"

All of these mean: delete the code, start over with TDD.

## Bug Fix Workflow

Bug reported: empty email accepted.

**RED:**
```typescript
test('rejects empty email', async () => {
  const result = await submitForm({ email: '' });
  expect(result.error).toBe('Email required');
});
```

**Verify RED:** `FAIL: expected 'Email required', got undefined`

**GREEN:**
```typescript
function submitForm(data: FormData) {
  if (!data.email?.trim()) {
    return { error: 'Email required' };
  }
  // ...existing logic
}
```

**Verify GREEN:** `PASS`

**REFACTOR:** Extract validation if multiple fields need similar checks.

## TDD Completion Checklist

Before marking work done:

- [ ] Every new function has a test
- [ ] Watched each test fail before implementing
- [ ] Each failure was for the expected reason
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass
- [ ] Output is clean (no errors, no warnings)
- [ ] Tests use real code (mocks only when unavoidable)
- [ ] Edge cases and error paths are covered

Cannot check every box? You skipped TDD. Start over.

## When Stuck

| Problem | Response |
|---------|----------|
| Do not know how to test | Write the API you wish existed. Start with the assertion. |
| Test is too complicated | The design is too complicated. Simplify the interface. |
| Must mock everything | Code is too coupled. Introduce dependency injection. |
| Setup is enormous | Extract helpers. Still complex? Simplify the design. |

---

# Coverage Mode

## Two Types of Coverage

**Line coverage** — automated metrics from tools (Istanbul, tarpaulin, coverage.py). Measures which lines ran during tests.

**Meaningful coverage** — what actually matters: are the important behaviors and edge cases tested? A function can have 100% line coverage with tests that don't verify correctness.

This mode focuses on meaningful coverage, not just line counts.

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

---

# Scale Mode

Generate and run scaling tests to verify a component behaves correctly under load.

**Arguments:** $ARGUMENTS

## Scale Workflow

### Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- **Target**: path to the component or module to test
- **Scale level**: `--level 10x` (default), `100x`, or `1000x`

### Step 2: Analyze the Component

Read the target component and identify:
- Entry point functions (what gets called under load)
- Input parameters (what varies with scale)
- Expected outputs (what to assert)
- Side effects (files written, network calls, state changes)

### Step 3: Generate Scale Test

Create a test script that:

1. **Generates scaled input data**
   - For 10x: 10x the typical input size
   - For 100x: 100x the typical input size
   - Use realistic data distributions, not just duplicated records

2. **Measures key metrics**
   - Wall clock time
   - Memory usage (before and after)
   - Output correctness (spot-check results)

3. **Runs progressively**
   - 1x baseline first
   - Then target scale level
   - Compare metrics between runs

### Step 4: Write the Test Script

Write a test file at `<target-dir>/scale-test.mjs`:

```javascript
// Scale test for [component]
// Generated by testing skill (scale mode)

const SCALE = parseInt(process.env.SCALE || '10', 10);

async function generateInput(scale) {
  // Generate realistic input at given scale
}

async function measureRun(label, input) {
  const memBefore = process.memoryUsage();
  const start = performance.now();

  const result = await runComponent(input);

  const elapsed = performance.now() - start;
  const memAfter = process.memoryUsage();

  console.log(`[${label}] Time: ${elapsed.toFixed(0)}ms`);
  console.log(`[${label}] Heap: +${((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024).toFixed(1)}MB`);

  return { elapsed, memDelta: memAfter.heapUsed - memBefore.heapUsed, result };
}

const baseInput = await generateInput(1);
const baseline = await measureRun('1x', baseInput);

const scaledInput = await generateInput(SCALE);
const scaled = await measureRun(`${SCALE}x`, scaledInput);

const timeRatio = scaled.elapsed / baseline.elapsed;
const memRatio = scaled.memDelta / (baseline.memDelta || 1);

console.log(`\nScaling factor: ${SCALE}x`);
console.log(`Time grew: ${timeRatio.toFixed(1)}x (ideal: ${SCALE}x linear)`);
console.log(`Memory grew: ${memRatio.toFixed(1)}x`);

if (timeRatio > SCALE * 2) {
  console.log('WARNING: Super-linear time growth detected');
}
if (memRatio > SCALE * 2) {
  console.log('WARNING: Super-linear memory growth detected');
}
```

### Step 5: Run and Report

Execute the test with `node scale-test.mjs` and present results:

```markdown
## Scale Test Results: [Component]

**Scale level**: [10x | 100x | 1000x]

| Metric | 1x (baseline) | [N]x (scaled) | Growth |
|--------|---------------|---------------|--------|
| Time | Xms | Xms | X.Xx |
| Memory | XMB | XMB | X.Xx |
| Correctness | pass | pass/fail | — |

**Verdict**: [scales-linearly | super-linear-time | super-linear-memory | fails-at-scale]

**Bottleneck**: [identified component or path if growth is super-linear]
```

If super-linear growth is detected, recommend running `/scale-review:hone` on the specific bottleneck.
