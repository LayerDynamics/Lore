---
name: verification-before-completion
description: Use before claiming any work is complete, fixed, or passing. Requires running verification commands and reading output before making success claims.
---

# Verification Before Completion

## The Discipline

Claiming work is done without verification is dishonesty, not efficiency.

Evidence before claims. Always.

## The Rule

```
No completion claims without fresh verification evidence.
```

If you have not run the verification command in this response, you cannot claim it passes.

## The Gate

Before claiming any status:

1. **Identify** -- What command proves this claim?
2. **Run** -- Execute the full command, fresh
3. **Read** -- Full output, check exit code, count failures
4. **Confirm** -- Does the output support the claim?
   - No: State the actual status with evidence
   - Yes: State the claim with evidence
5. **Then and only then:** Make the claim

Skip any step and the claim is unverified.

## What Counts as Verification

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output showing 0 failures | Previous run, "should pass" |
| Linter clean | Linter output showing 0 errors | Partial check, extrapolation |
| Build succeeds | Build command with exit code 0 | Linter passing, "looks good" |
| Bug fixed | Original failing scenario now passes | Code changed, assumed fixed |
| Requirements met | Line-by-line checklist against spec | Tests passing alone |
| Agent completed task | VCS diff showing actual changes | Agent self-report of "success" |

## Red Flags: Stop

If you notice yourself:
- Using "should", "probably", "seems to"
- Expressing satisfaction before running verification ("Done!", "Perfect!")
- About to commit or push without verifying
- Trusting a subagent's success report without independent check
- Relying on partial verification as if it were complete
- Thinking "just this once"

## Patterns

**Tests:**
```
Correct:  [run test command] -> [see: 34/34 pass] -> "All 34 tests pass"
Wrong:    "Should pass now" / "Looks correct"
```

**Build:**
```
Correct:  [run build] -> [see: exit 0] -> "Build succeeds"
Wrong:    "Linter passed so it should compile"
```

**Requirements:**
```
Correct:  Re-read spec -> Create checklist -> Verify each item -> Report status
Wrong:    "Tests pass, so requirements are met"
```

**Agent delegation:**
```
Correct:  Agent reports success -> Check diff -> Verify changes exist -> Report actual state
Wrong:    Trust agent report at face value
```

## Rationalizations

| Excuse | Reality |
|--------|---------|
| "Should work now" | Run the command |
| "I am confident" | Confidence is not evidence |
| "Just this once" | No exceptions |
| "Linter passed" | Linter is not the compiler |
| "Agent said success" | Verify independently |
| "Partial check is enough" | Partial proves nothing about the whole |

## The Standard

Run the command. Read the output. Then state the result.

No shortcuts. Non-negotiable.

<!-- Inspired by Superpowers Verification Before Completion skill (obra) -->
