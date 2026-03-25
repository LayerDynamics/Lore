# Scope Examples: Well-Scoped vs Poorly-Scoped Changes

This document provides examples of well-scoped and poorly-scoped requests to illustrate how to establish clear scope boundaries — applicable to any codebase.

---

## What Makes Good Scope?

**Well-scoped changes:**
- Clear boundaries (what's in, what's out)
- Single concern or tightly related concerns
- Testable in isolation
- Reversible if problematic
- Limited blast radius

**Poorly-scoped changes:**
- Vague language ("improve", "enhance", "fix")
- Multiple unrelated concerns
- Hard to test comprehensively
- Cascading dependencies
- Unclear success criteria

---

## Example 1: Vague Feature Request

### ❌ Poorly Scoped

**Request:** "Improve the authentication"

**Problems:**
- Which part of auth? Login? Token refresh? Session management?
- Improve how? Security? Performance? UX?
- Scope is unbounded

**Result:** Would require extensive clarification before any analysis is useful.

### ✅ Well Scoped

**Request:** "Add rate limiting to the login endpoint — max 5 failed attempts per IP per 15 minutes"

**Why better:**
- Specific endpoint: login only
- Specific behavior: rate limiting on failures
- Measurable constraint: 5 attempts / 15 min / IP
- Clear boundary: doesn't affect other auth flows

**Scope clarity:**
```
IN SCOPE:
- Login endpoint: failed attempt tracking per IP
- Lockout logic after 5 failures
- Lockout duration: 15 minutes
- Tests for rate limit enforcement

OUT OF SCOPE:
- Successful login rate limiting (not requested)
- Password reset / signup endpoints
- Existing session validation
- IP allowlist/blocklist management
```

---

## Example 2: Broad Feature Addition

### ❌ Poorly Scoped

**Request:** "Add caching"

**Problems:**
- Where? API layer? Database queries? Static assets?
- What kind? In-memory? Redis? HTTP headers?
- For what data? All responses? Specific routes?

**Result:** Could mean anything from a 20-line middleware to a distributed caching architecture.

### ✅ Well Scoped

**Request:** "Add in-memory LRU cache for GET /products and GET /categories responses with 5-minute TTL"

**Why better:**
- Where: API layer, specific routes
- What: GET responses only (not mutations)
- How: In-memory LRU with TTL
- Constraint: 5-minute TTL defined

**Scope clarity:**
```
IN SCOPE:
- Cache middleware for /products and /categories
- LRU eviction policy
- 5-minute TTL per cached response
- Cache bypass on POST/PUT/DELETE to same resources
- Hit/miss metrics logging

OUT OF SCOPE:
- Redis or persistent cache (in-memory only)
- Other routes or endpoints
- Cache invalidation on data write (TTL-based only)
- HTTP Cache-Control header parsing
```

---

## Example 3: Error Handling Improvement

### ❌ Poorly Scoped

**Request:** "Fix error handling"

**Problems:**
- Which component? All of them?
- What errors? Network? Validation? Database?
- What does "fix" mean? Better messages? Recovery? Logging?

**Result:** Scope encompasses potentially the entire codebase.

### ✅ Well Scoped

**Request:** "Add retry with exponential backoff for database connection failures — 3 retries, starting at 200ms"

**Why better:**
- Where: Database connection layer
- What: Retry logic specifically
- How: Exponential backoff algorithm
- Trigger: Connection failures only (not query errors)

**Scope clarity:**
```
IN SCOPE:
- DB connection retry logic: 3 attempts
- Backoff: 200ms, 400ms, 800ms
- Log each retry attempt
- Tests for retry behavior and exhaustion

OUT OF SCOPE:
- Query error retries (different category)
- Application-level retry (e.g., HTTP client)
- Permanent error codes (no retry)
- Circuit breaker pattern (future consideration)
```

---

## Example 4: Performance Optimization

### ❌ Poorly Scoped

**Request:** "Make it faster"

**Problems:**
- Make what faster? Page load? Query? Build time?
- How much faster? 10%? 2x?
- At what cost? Memory? Complexity?

**Result:** Impossible to start without profiling and much more context.

### ✅ Well Scoped

**Request:** "Optimize the product search query — it's timing out at 30s for catalogs with >10,000 items; target <500ms"

**Why better:**
- Where: Product search query
- What: Query performance
- Target: <500ms (from current 30s)
- Scenario: Large catalogs (>10,000 items)

**Scope clarity:**
```
IN SCOPE:
- Product search SQL/query optimization
- Index creation for search columns
- Benchmark tests for 10,000+ item catalogs
- Query plan analysis

OUT OF SCOPE:
- Frontend search UI
- Caching layer (separate concern)
- Other search endpoints (category, user search)
- Full-text search engine migration (future)
```

---

## Example 5: Cross-Cutting Feature

### ❌ Poorly Scoped

**Request:** "Add observability"

**Problems:**
- Which layer? API? Database? Background jobs?
- What kind? Logs? Metrics? Traces?
- What level of detail?

**Result:** "Observability" spans every module and has no natural boundary.

### ✅ Well Scoped (Option A)

**Request:** "Add structured logging to all HTTP request handlers — log method, path, status code, and duration"

**Scope clarity:**
```
IN SCOPE:
- Request logging middleware
- Structured JSON log format
- Fields: method, path, status, duration_ms
- Tests for log output format

OUT OF SCOPE:
- Database query logging (separate concern)
- Background job logging
- Error alerting / external log shipping
- Request body logging (PII risk)
```

### ✅ Well Scoped (Option B)

**Request:** "Add Prometheus metrics endpoint — expose request count and p99 latency per route"

**Scope clarity:**
```
IN SCOPE:
- /metrics endpoint
- Request count counter per route
- Latency histogram per route (p50, p95, p99)
- Prometheus text format

OUT OF SCOPE:
- Alerting rules / dashboards
- Infrastructure metrics (CPU, memory)
- Database query metrics
- Business metrics (orders, revenue)
```

**Note:** Options A and B both add observability but solve different problems. Without clarification, you can't choose between them.

---

## Example 6: Refactoring Request

### ❌ Poorly Scoped

**Request:** "Refactor the user module"

**Problems:**
- Refactor how? Split into smaller files? Change abstractions?
- Why? Performance? Maintainability? Testing?
- What's the target state?

### ✅ Well Scoped

**Request:** "Extract the password hashing logic from `UserService` into a dedicated `PasswordHasher` class to make it independently testable"

**Why better:**
- What to extract: password hashing logic only
- From where: `UserService`
- Into what: new `PasswordHasher` class
- Why: testability (measurable goal)

**Scope clarity:**
```
IN SCOPE:
- Extract hash/verify methods from UserService
- Create PasswordHasher class with same interface
- Update UserService to use PasswordHasher
- Add unit tests for PasswordHasher in isolation

OUT OF SCOPE:
- Changing the hashing algorithm
- Other parts of UserService
- Auth tokens or session management
- Password policy validation
```

---

## Red Flags for Poorly-Scoped Requests

### Vague Verbs
- "Improve…"
- "Enhance…"
- "Fix…" (without specifics)
- "Optimize…" (without a target)
- "Support…" (without scope)

### Missing Constraints
- "Add authentication" — where? what kind? what flows?
- "Implement caching" — for what? which layer? what TTL?
- "Make it work with X" — which part? how integrated?

### Unbounded Reach
- "Update all handlers…"
- "Refactor the entire module…"
- "Add logging everywhere…"

### Multiple Concerns
- "Add auth and caching and metrics" → three separate scopes
- "Fix bugs and add features" → separate concerns
- "Optimize and refactor" → different goals, different risks

---

## Converting Poor Scope to Good Scope

### Pattern: Vague → Specific

| Before | After |
|--------|-------|
| "Improve the parser" | "Add support for optional chaining (`?.`) syntax to the expression parser" |
| "Add metrics" | "Add request count and latency histogram to the API gateway middleware" |
| "Fix navigation" | "Fix the router to handle trailing slashes in URL paths as equivalent to without" |

### Pattern: Unbounded → Bounded

| Before | After |
|--------|-------|
| "Add logging everywhere" | "Add structured error logging to the payment processing module" |
| "Make tests better" | "Increase unit test coverage of the `OrderCalculator` class from 40% to 80%" |
| "Refactor database code" | "Extract raw SQL queries from `UserRepository` into named query constants" |

### Pattern: Multiple → Single

**Before:** "Add auth, caching, and rate limiting"

**After (3 separate scopes):**
1. "Add JWT token validation middleware to the API"
2. "Add LRU cache for product listing responses"
3. "Add rate limiting (100 req/min per user) to the API gateway"

---

## Key Takeaways

**Good scope has:**
- Specific component or file targets
- Clear inclusion/exclusion boundaries
- Measurable success criteria
- Single concern or tightly related concerns
- Isolated testability

**Poor scope has:**
- Vague language ("improve", "enhance", "fix", "optimize")
- Unbounded reach ("all", "entire", "everywhere")
- Multiple unrelated concerns bundled together
- Missing context on how/where/what
- Unclear success criteria

**When scope is unclear:**
1. Analyze code (≤5 files)
2. Identify specific integration points
3. Surface concrete clarifying questions
4. Get boundaries defined before proceeding
