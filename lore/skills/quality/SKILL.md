---
name: quality
description: Use for code quality enforcement — scanning for placeholders/stubs, fixing incomplete implementations, and applying quality gates before shipping. Covers the full quality lifecycle from detection through remediation to merge readiness.
argument-hint: [--mode scan|fix|gates] [path or options]
---

# Quality

Unified code quality skill covering placeholder detection, guided remediation, and merge-readiness gates.

## Mode Selection

If `$ARGUMENTS` includes `--mode`, use that mode. Otherwise:
- If the user asks to "scan", "check for placeholders", "find stubs" → **Scan Mode**
- If the user asks to "fix placeholders", "implement stubs", "remove mocks" → **Fix Mode**
- If the user asks to "review for merge", "quality gates", "is this ready to ship" → **Gates Mode**
- If unclear, ask the user which mode to use.

---

## The Rule

Every function, method, variable, and code path written MUST be a real, working implementation. No exceptions. No stubs. No mocks. No "for now" shortcuts. No deferred implementation.

When writing code, there are exactly two acceptable outcomes:
1. **Implement it fully** — real logic, real data access, real error handling
2. **Tell the user it cannot be implemented** — explain why, what is blocking it, what they need to provide

"I'll implement it for real later" is not a real option.

Code status is binary:
- **Done** — real implementation, works as intended, no stubs
- **Not done** — which is fine to say clearly

There is no "mostly done". No "good enough for now".

---

# Scan Mode

Scan the project for ALL placeholder, stub, mock, dummy, and incomplete code patterns. Report every instance found.

## Scan Target

If `$ARGUMENTS` provides a path (beyond `--mode`), scan that path. Otherwise scan the current working directory.

## Forbidden Patterns

### In Source Code

**Explicit stub markers** — replace with real implementation:
```
// TODO: implement          # TODO: implement
unimplemented!()            // Rust
todo!()                     // Rust
raise NotImplementedError   // Python
throw new Error('Not implemented')    // JS/TS
throw new NotImplementedException     // C#/Java
```

**Placeholder return values** — must return real data:
```
return null;          return None
return [];            return {}
return "placeholder"  return "mock"
```

**Stub comments** — remove these by implementing real logic:
```
// for now               // placeholder
// dummy data            // mock response
// simulated             // hardcoded for now
// in a real implementation...
// in a production environment...
// this would normally fetch from...
// returns mock data
```

**Stub variable names** — rename and implement:
```
const dummyData = ...    let mockResponse = ...
var fakeValue = ...      dummy_result = ...
```

### In Text Responses

These phrases are forbidden when describing written code:

| Forbidden | Why |
|-----------|-----|
| "for now, I'll..." | Signals deferred real work |
| "in a real implementation..." | Admits this is fake |
| "in a production environment..." | Defers to hypothetical |
| "I've mocked/simulated..." | Admits not real |
| "returns mock/dummy/fake data" | Admits fake data |
| "simplified version" | Admits incomplete |
| "you would need to implement..." | Pushes work back to user |
| "hardcoded for now" | Admits placeholder |
| "not fully implemented" | Admits incomplete |
| "partial implementation" | Admits incomplete |

## Scan Steps

### Step 1: Find TODO/FIXME/HACK comments
```bash
grep -rn "TODO\|FIXME\|HACK" \
  --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" \
  --include="*.py" --include="*.rs" \
  --include="*.go" --include="*.java" \
  --include="*.cs" --include="*.swift" \
  --include="*.rb" --include="*.php" \
  --include="*.c" --include="*.cpp" --include="*.h" \
  ${ARGUMENTS:-.} 2>/dev/null | grep -v "node_modules\|.git\|target\|dist\|build\|__pycache__"
```

### Step 2: Find stub/placeholder/mock patterns
```bash
grep -rni "placeholder\|dummy\|mock\|stub\|fake\|simulated" \
  --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" \
  --include="*.py" --include="*.rs" \
  --include="*.go" --include="*.java" \
  --include="*.cs" --include="*.swift" \
  ${ARGUMENTS:-.} 2>/dev/null | grep -v "node_modules\|.git\|target\|dist\|build\|__pycache__\|test\|spec\|_test\|_spec"
```

### Step 3: Find deceptive phrases
```bash
grep -rni "for now\|in a real\|in a complete\|in a production\|hardcoded\|hard-coded\|returns mock\|returns dummy\|would normally\|would typically\|you would need to" \
  --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" \
  --include="*.py" --include="*.rs" \
  ${ARGUMENTS:-.} 2>/dev/null | grep -v "node_modules\|.git\|target\|dist\|build\|__pycache__"
```

### Step 4: Find language-native stubs
```bash
grep -rn "unimplemented!()\|todo!()\|NotImplementedError\|NotImplementedException\|fatalError.*not implemented\|throw.*Not implemented\|raise NotImplementedError\|pass  #\|pass\t#" \
  ${ARGUMENTS:-.} 2>/dev/null | grep -v "node_modules\|.git\|target\|dist\|build\|__pycache__"
```

### Step 5: Find suspiciously empty function bodies
Run a Read on any files with high counts from above to check for patterns like:
- Functions that only contain `return null`, `return None`, `return []`, `return {}`
- Functions with a single `pass` statement
- Functions that only throw `NotImplementedError`

All results should exclude: `node_modules`, `.git`, `target`, `dist`, `build`, `__pycache__`.
Test files (`*.test.*`, `*_spec.*`) are exempt — test doubles are legitimate.

## Scan Output Format

```
## Placeholder Scan Report

**Project**: [path scanned]
**Total issues found**: [count]

### Critical — Language-native stubs (must implement immediately)
[file:line] description

### High — Deceptive placeholder patterns
[file:line] description

### Medium — TODO/FIXME comments with missing implementation
[file:line] description

### Low — Naming issues (variables/functions named mock/dummy/stub)
[file:line] description

---
**Verdict**: [CLEAN / X ISSUES FOUND — IMPLEMENTATION REQUIRED]
```

After the report, if issues are found, ask the user:
> "I found [N] placeholder(s). Would you like me to fix them now, starting with the most critical?"

If the user says yes, switch to Fix Mode.

---

# Fix Mode

Guided, systematic session to eliminate every placeholder, stub, mock, dummy, and incomplete implementation from the codebase.

## Phase 1: Discovery

Run Scan Mode (above) to find all issues. Group by severity:
- **Critical**: Language-native stubs (`unimplemented!()`, `NotImplementedError`, etc.)
- **High**: Functions that return null/empty when real data is expected
- **Medium**: TODO comments marking missing implementation
- **Low**: Deceptive comments and variable names

## Phase 2: Triage

For each issue found, determine:
- **Can I implement this with available context?** → implement it now
- **Does this require user input (credentials, API keys, domain logic)?** → ask the user
- **Is this actually a test double in a test file?** → skip (test mocks are legitimate)

**Test file exception**: Stubs and mocks in `*.test.ts`, `*_test.py`, `*_spec.rb`, etc. are legitimate testing patterns. Do not modify test doubles.

## Phase 3: Fix Each Issue

For each fixable issue, in order of severity:

1. **Read the file** to understand full context
2. **Understand what the function/method is supposed to do** from:
   - Function name and signature
   - Surrounding code
   - Comments and documentation
   - How it's called from other code
3. **Implement the real logic** — no shortcuts
4. **Verify the implementation** makes sense given the context
5. **Remove the placeholder comment/marker**

The fix for every placeholder type is the same: implement the real logic. Do not delete the comment and leave an empty function — implement what the comment described.

### When You Need to Ask the User

If implementation requires domain knowledge or configuration the user must provide:

```
I found a placeholder in [file:line] that requires your input:

Function: `connectToDatabase()`
Missing: Database connection configuration

To implement this properly, I need:
1. What database are you using? (PostgreSQL, MySQL, SQLite, etc.)
2. How is the connection string configured? (env var, config file, etc.)
3. Any specific connection pool settings?
```

### When Fixing Requires Multiple Files

Some stubs represent missing modules or services. In that case:
1. Identify all files affected by the missing implementation
2. Create the implementation in the appropriate location
3. Update all files that reference it
4. Do NOT leave any TODO markers after you are done

### When Something Genuinely Cannot Be Implemented

Legitimate blocking cases exist:
- Missing credentials, API keys, or environment variables
- External service requiring setup not available in context
- Hardware-specific code requiring physical devices
- Third-party APIs requiring the user's account details

**The correct approach:**
1. Tell the user exactly what is missing — "This requires `OPENAI_API_KEY` in environment"
2. Write the skeleton with clear interface (inputs, outputs, types)
3. Make the integration point throw a clear, actionable error if unconfigured
4. Never pretend the code works

## Phase 4: Verify

After fixing all issues:
1. Re-run the scan to confirm zero placeholders remain
2. Check that the implementations are coherent and connected
3. Confirm no new stubs were introduced during fixing

## Fix Completion Criteria

The fix session is complete ONLY when:
- Scan reports zero placeholder patterns
- Every previously stubbed function has real, working code
- No TODO/FIXME comments remain that indicate missing implementation
- No deceptive phrases in code comments
- All implementations are connected and coherent (not just individually "fixed")

---

# Gates Mode

Quality gates that code must pass before shipping. Never ship code without passing all gates. Velocity without quality is net negative — unchecked complexity gains cancel out productivity improvements entirely.

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

### Gate 3: Placeholder Scan

Run Scan Mode to verify zero stubs, placeholders, or incomplete implementations remain in the changed code. This gate fails if any placeholder pattern is detected.

### Gate 4: Code Quality Review

**Is the code well-built?**

Review for:
- Readability and maintainability
- Security vulnerabilities
- Performance concerns
- Error handling
- Project convention adherence

Use multiple independent reviewers when possible. Blind review (reviewers cannot see each other's findings) produces better results than sequential review.

### Gate 5: Anti-Sycophancy Check

If all reviewers unanimously approve, run a devil's advocate review. Unanimous approval without challenge is a red flag — it may indicate reviewers are agreeing rather than critically evaluating.

The devil's advocate reviewer's sole purpose is to find problems the others missed.

### Gate 6: Severity-Based Blocking

| Severity | Action |
|----------|--------|
| Critical | Block. Fix immediately. |
| High | Block. Fix before commit. |
| Medium | Block. Fix before merge. |
| Low | Track as TODO. Fix later. |
| Cosmetic | Note. Optional fix. |

### Gate 7: Test Coverage

- All tests must pass (100% pass rate)
- Coverage must not decrease
- Minimum threshold: 80% for unit tests
- New code must have corresponding tests

### Gate 8: Test Integrity

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

**Stage 1:** Spec compliance (Gate 2). Must pass before proceeding.
**Stage 2:** Code quality (Gates 3-8). Only runs after Stage 1 passes.

If Stage 1 fails, return to implementation. Do not proceed to Stage 2.
If Stage 2 fails, fix quality issues and re-run Stage 2 only (spec compliance already verified).

## Velocity-Quality Metrics

Track these metrics over time:

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

---

## Integration with Other Workflows

### Writing Plans
- Plans must not contain tasks phrased as "mock X for now" or "stub Y temporarily"
- Every planned task must include a real implementation strategy
- "TBD" implementation details are not acceptable in plans

### Verify Before Documenting
- Scan for placeholder patterns before documenting any feature as complete
- Never document a stubbed function as "implemented"
- Any function containing TODO/stub/mock must be documented as "NOT IMPLEMENTED"
