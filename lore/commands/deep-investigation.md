---
name: deep-investigation
description: Use when tracing how something works in the codebase, investigating an execution path, understanding service integration, or preparing for a code review. Trigger phrases include: "how does X work", "trace the flow of", "investigate how", "understand the code path", "follow what happens when", "where is X called", "what does X do"
---

# Deep Investigation

## When to Use This Skill

Load this skill before any deep codebase exploration. It gives you a systematic methodology for tracing code in the pew.news multi-service architecture — following call chains across service boundaries, understanding data transformations, and surfacing the findings needed for a review.

Chain with the `superpowers:dispatching-parallel-agents` skill (from the superpowers plugin) when you have 3+ independent paths to investigate simultaneously. Chain with the `code-intel:pr-style-review` skill when you have findings ready to format into a structured review.

## Phase 1: Orient

Before reading any code, identify the scope.

**Determine which service owns the entry point.** The pew.news project has 10 services — never assume. Check the service directory map in `references/pewnews-service-map.md` and match the subject to the correct service path.

**Identify the entry point type:**
- Agent? → Start in `services/agents/src/agents/` and find the agent's `execute()` function
- HTTP endpoint? → Grep the route path in `src/routes/` of the identified service
- Scheduled job? → Check `services/agents/src/index.js` for cron registrations
- NLP processor? → Start in `services/nlp/app/processors/`
- Go connector? → Start in `services/ingest/internal/connector/`
- React-style UI component? → Start in `services/web/src/pages/` or `services/web/src/components/`

**State your entry point** before reading further. This prevents drift into adjacent code that isn't relevant.

## Phase 2: Map the Call Chain

Follow the execution path one step at a time.

**Use Grep, not guessing.** Before assuming a function is called, grep for it. Before assuming a file imports something, read the import block.

**At each step, document:**
1. The file path and line number
2. What function or method is being called
3. What parameters are passed in
4. What is returned or what side effect occurs

**Follow until you hit a terminal side effect:**
- A SQL query or ORM call (something written to or read from the database)
- An HTTP response sent to the caller
- A Redis operation (GET, SET, DEL, PUBLISH)
- An outbound HTTP call to another service
- A file write
- A structured log with no further code path

Never stop mid-chain at a function call without following it. If a function calls another function, follow the next one.

**Track cross-service boundaries.** When a `fetch(` or HTTP call appears, this is a boundary. Document the full URL, HTTP method, request body shape, and error handling. Then switch context to the receiving service and follow the handler there.

## Phase 3: Verify at Boundaries

Cross-service boundaries are where integration bugs live. At every boundary, verify four things:

1. **Request shape matches handler expectation.** Read both the caller (what it sends) and the handler (what it expects). Compare them explicitly.

2. **Error handling exists and is specific.** A bare `catch(e) {}` is not error handling. Look for: status code checks, retry logic, circuit breaking, and fallback behavior.

3. **Authentication is applied.** Internal services use `x-internal-token` header. Check that it's sent by the caller and validated by the receiver.

4. **Timeouts are configured.** Unbounded HTTP calls can hang indefinitely. Check for `signal: AbortSignal.timeout()` or equivalent.

## Phase 4: Read Tests

After mapping the execution path, find the test files for the source files you read.

Tests reveal two things: what the code is supposed to do (invariants), and what scenarios aren't tested (gaps). Both are useful for a code review.

**For Node.js/TS:** Look for `*.test.ts` or `*.spec.ts` adjacent to the source file.
**For Python:** Look in `services/nlp/tests/`.
**For Go:** Look for `*_test.go` adjacent to source.

Read the test to understand what the author intended. Note any scenario that is conspicuously absent.

## Phase 5: Check Patterns

After mapping the execution path, compare against established pew.news conventions. See `references/pewnews-service-map.md` for the full pattern list.

Key patterns to check:
- **Agent shape**: Does the agent export `{ id, name, execute(input, { pool, logger, logAction }) }`?
- **API envelope**: Does every HTTP handler return `{ ok: true, data: {...} }` (or `{ ok: false, error: "..." }`)?
- **Editorial integration**: Does the service call `POST /api/rules/evaluate-and-execute` with `{ agentName, articleId, signals }`?
- **NLP caching**: Does the Python processor use instance-level caching (not module-level globals)?
- **DB access**: Does the agents service use raw `pool.query()` (not Drizzle)?

Deviations from established patterns are candidates for review findings.

## Phase 6: Synthesize

After completing Phase 1-5, synthesize your findings into the standard output structure:

1. **Entry Point** — one file:line, one sentence
2. **Execution Path** — ordered list, each step with file:line and what happens
3. **Data Transformations** — how the key data shape changes at each boundary
4. **Cross-Service Boundaries** — table with from, to, method+URL, auth, error handling
5. **Pattern Notes** — ✅ for conformant, ⚠️ for deviation
6. **Test Coverage** — what's tested and what's missing
7. **Open Questions** — things you cannot determine from code alone

## What to Avoid

Do not read every file in a service looking for something interesting. Stay on the call chain. If you drift to adjacent code, stop and ask: "Is this on the path from entry point to terminal side effect?"

Do not propose fixes during investigation. Investigation is read-only. Findings go to the review phase.

Do not stop when you find the first issue. Complete the full execution trace. Many issues are only visible at the end of the chain.

## References

- `references/pewnews-service-map.md` — complete service directory and pattern reference
- `references/investigation-patterns.md` — grep patterns for common investigation tasks
