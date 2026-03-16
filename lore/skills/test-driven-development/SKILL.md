---
name: test-driven-development
description: Use when implementing any feature, bug fix, or behavior change. Write the test first, watch it fail, then implement.
---

# Test-Driven Development

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

**"I will write tests after to verify it works"** -- Tests written after code pass immediately. A test that passes immediately proves nothing. You never saw it catch the bug it was meant to prevent.

**"I already manually tested the edge cases"** -- Manual testing is unrepeatable. No record of what was covered. Cannot re-run when code changes. Automated tests run the same way every time.

**"Deleting hours of work is wasteful"** -- Sunk cost fallacy. The time is gone. The choice now is between high-confidence code written test-first and low-confidence code you cannot trust.

**"TDD is too rigid"** -- TDD is pragmatic. It finds bugs before commit, prevents regressions, documents behavior, and enables fearless refactoring. Skipping it means debugging in production.

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

## Completion Checklist

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

<!-- Inspired by Superpowers TDD skill (obra) -->
