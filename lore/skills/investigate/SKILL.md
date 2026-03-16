---
name: investigate
description: Deep code exploration returning structured findings — file paths, execution traces, integration points. Use when tracing how something works, investigating an execution path, or understanding service integration.
argument-hint: What to investigate (e.g., "how categorization service handles cache invalidation", "where quality_score column is written")
---

# Investigation: $ARGUMENTS

## When to Use This Skill

Use this skill for any deep codebase exploration:
- "How does X work?"
- "Trace the flow of Y"
- "Where is X called?"
- "What does X do?"
- Understanding service integration
- Preparing for a code review

## Quick Mode

If the investigation subject is narrow and well-defined, use this streamlined dispatch:

1. Parse the subject from `$ARGUMENTS`. If empty, ask:
   > What would you like me to investigate?

2. Launch a **code-explorer** agent with the subject and instruction: "Trace the execution path, map all relevant code, and return structured findings with exact file:line references."

3. Present findings directly and offer follow-ups:
   - "Run `/code-intel:review $ARGUMENTS` for a PR-style review"
   - "Ask me to investigate a specific aspect further"

## Deep Mode (6-Phase Methodology)

For complex investigations spanning multiple services or requiring thorough tracing, use the full methodology below.

### Phase 1: Orient

Before reading any code, identify the scope.

**Determine which service owns the entry point.** In multi-service architectures, never assume. Check available service maps and match the subject to the correct service path.

**Identify the entry point type:**
- HTTP endpoint? → Grep the route path in route files
- Scheduled job? → Check cron registrations
- Agent/worker? → Find the agent's execute function
- CLI command? → Check command registration
- UI component? → Start in pages or components directories

**State your entry point** before reading further. This prevents drift into adjacent code that isn't relevant.

### Phase 2: Map the Call Chain

Follow the execution path one step at a time.

**Use Grep, not guessing.** Before assuming a function is called, grep for it. Before assuming a file imports something, read the import block.

**At each step, document:**
1. The file path and line number
2. What function or method is being called
3. What parameters are passed in
4. What is returned or what side effect occurs

**Follow until you hit a terminal side effect:**
- A database query (SQL or ORM)
- An HTTP response sent to the caller
- A cache operation (Redis, in-memory)
- An outbound HTTP call to another service
- A file write
- A structured log with no further code path

Never stop mid-chain at a function call without following it.

**Track cross-service boundaries.** When an HTTP call appears, document the full URL, HTTP method, request body shape, and error handling. Then switch context to the receiving service and follow the handler there.

### Phase 3: Verify at Boundaries

Cross-service boundaries are where integration bugs live. At every boundary, verify:

1. **Request shape matches handler expectation.** Read both the caller and the handler. Compare explicitly.
2. **Error handling exists and is specific.** A bare `catch(e) {}` is not error handling.
3. **Authentication is applied.** Check that auth tokens are sent and validated.
4. **Timeouts are configured.** Unbounded HTTP calls can hang indefinitely.

### Phase 4: Read Tests

After mapping the execution path, find the test files for the source files you read.

Tests reveal: what the code is supposed to do (invariants), and what scenarios aren't tested (gaps).

Look for test files adjacent to source (`*.test.ts`, `*.spec.ts`, `*_test.go`, `tests/` directories).

Read the tests to understand author intent. Note any scenario that is conspicuously absent.

### Phase 5: Check Patterns

After mapping the execution path, compare against established codebase conventions.

Deviations from established patterns are candidates for review findings.

### Phase 6: Synthesize

After completing Phases 1-5, synthesize findings into the standard output structure:

1. **Entry Point** — one file:line, one sentence
2. **Execution Path** — ordered list, each step with file:line and what happens
3. **Data Transformations** — how the key data shape changes at each boundary
4. **Cross-Service Boundaries** — table with from, to, method+URL, auth, error handling
5. **Pattern Notes** — conformant vs deviation
6. **Test Coverage** — what's tested and what's missing
7. **Open Questions** — things you cannot determine from code alone

## What to Avoid

- Do not read every file in a service looking for something interesting. Stay on the call chain.
- Do not propose fixes during investigation. Investigation is read-only.
- Do not stop when you find the first issue. Complete the full execution trace.
