---
description: Guided session to find and replace ALL placeholder, stub, mock, or dummy code in the project with real implementations. Works through each issue systematically.
argument-hint: Optional specific file or directory to fix
allowed-tools: ["Read", "Edit", "Write", "Grep", "Bash", "AskUserQuestion", "Skill", "Task"]
---

# No-Placeholders: Fix Session

**FIRST: Load the no-placeholders skill** using the Skill tool.

Start a guided, systematic session to eliminate every placeholder, stub, mock, dummy, and incomplete implementation from the codebase.

## Fix Process

### Phase 1: Discovery

First run the scan to find all issues:

1. Run `/no-placeholders:scan` logic (or use Grep directly) to find all placeholder instances
2. Group by severity:
   - **Critical**: Language-native stubs (`unimplemented!()`, `NotImplementedError`, etc.)
   - **High**: Functions that return null/empty when real data is expected
   - **Medium**: TODO comments marking missing implementation
   - **Low**: Deceptive comments and variable names

### Phase 2: Triage

For each issue found, determine:
- **Can I implement this with available context?** → implement it now
- **Does this require user input (credentials, API keys, domain logic)?** → ask the user
- **Is this actually a test double in a test file?** → skip (test mocks are legitimate)

**Test file exception**: Stubs and mocks in `*.test.ts`, `*_test.py`, `*_spec.rb`, etc. are legitimate testing patterns. Do not modify test doubles.

### Phase 3: Fix Each Issue

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

### Phase 4: Verify

After fixing all issues:
1. Re-run the scan to confirm zero placeholders remain
2. Check that the implementations are coherent and connected
3. Confirm no new stubs were introduced during fixing

## Special Cases

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

## Completion Criteria

The fix session is complete ONLY when:
- Scan reports zero placeholder patterns
- Every previously stubbed function has real, working code
- No TODO/FIXME comments remain that indicate missing implementation
- No deceptive phrases in code comments
- All implementations are connected and coherent (not just individually "fixed")

If `$ARGUMENTS` specifies a file or path, scope the fix to that location.
