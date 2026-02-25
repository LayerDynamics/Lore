# Code Analysis Template for Understanding User Requests

This template provides a structured approach to analyzing code when understanding user requests.

## Analysis Goals

1. **Map data/code flow** in context of user request
2. **Identify changes required** and what files/functions would be affected
3. **Identify affected systems/processes** across the architecture

## The <5 File Rule

**Start small:** Read fewer than 5 files initially to get oriented. Only expand if truly necessary.

**Why:** Context efficiency - early understanding often reveals whether request is clear or needs clarification.

## Analysis Process

### Phase 1: Entry Point Identification (1-2 files)

**Goal:** Find where the user's request would intersect with the codebase

**Questions to answer:**
- What component/module is this request about?
- Where is the entry point for this functionality?
- What file would I modify first?

**BrowserX-Specific Entry Points:**
- **Browser Engine**: `browser/src/engine/` - Network, Rendering, JavaScript, Storage subsystems
- **Proxy Engine**: `proxy-engine/src/` - Gateway, middleware, cache, connection pool
- **Query Engine**: `query-engine/src/` - Lexer, parser, executor
- **Runtime**: `runtime/src/` - BrowserXRuntime, lifecycle, plugins
- **MCP Server**: `mcp-server/src/` - Tools, session management
- **DevTools**: `dev-tools/src/domains/` - CDP domain implementations

**Tools:**
```bash
# Find entry points
glob "pattern/**/*.ts" | grep "keyword"
grep "class ClassName" --type ts
```

**Output:**
```
Entry point: [file_path:line_number]
Primary component: [name]
```

### Phase 2: Data Flow Tracing (2-3 files)

**Goal:** Understand how data flows through the system in the context of the request

**Questions to answer:**
- What's the current data flow path?
- What functions/methods are involved?
- What data structures are passed between components?
- Are there state transitions involved?

**BrowserX Architecture Patterns to Trace:**

**Pipeline Pattern:**
```
Current flow: Stage1 → Stage2 → Stage3
Data passed: [type/structure at each stage]
Timing tracked: [where timing is recorded]
```

**State Machine Pattern:**
```
Current states: STATE_A → STATE_B → STATE_C
Transitions: [what triggers each transition]
Error states: [how errors are handled]
```

**Event-Driven Pattern:**
```
Event emitters: [which components emit]
Event listeners: [which components listen]
Event types: [what events are relevant]
```

**Example Analysis:**
```markdown
## Data Flow for "Add caching to proxy"

Entry point: `proxy-engine/src/gateway/ProxyGateway.ts:45`

Current flow:
1. Request arrives → ProxyGateway.handleRequest() (line 45)
2. Middleware pipeline executes → middlewarePipeline.execute() (line 67)
3. Proxy type routing → getProxyType().handle() (line 89)
4. Response returned → via callback (line 120)

Data structures:
- ProxyRequest: { method, url, headers, body }
- ProxyResponse: { statusCode, headers, body, timing }
- Context: { request, response, metadata }

State tracking:
- ConnectionPool tracks IDLE → ACTIVE → IDLE
- No caching state machine currently exists
```

### Phase 3: Impact Analysis (1-2 files)

**Goal:** Identify what would be affected by implementing the request

**Questions to answer:**
- What files would need modification?
- What other components depend on this?
- Are there tests that would need updates?
- Does this affect multiple layers of the architecture?

**BrowserX Multi-Layer Considerations:**

```
Check if change affects:
□ Browser Engine only
□ Proxy Engine
□ Query Engine
□ Runtime (orchestration layer)
□ MCP Server (AI tools)
□ DevTools (CDP domains)
□ Tests (unit/integration/e2e)
□ Plugin system
```

**Dependency Analysis:**
```bash
# Find files that import the target
grep "import.*from.*target-file" --type ts

# Find usages of specific function
grep "functionName(" --type ts
```

**Example Impact Analysis:**
```markdown
## Impact Analysis for "Add caching to proxy"

Files requiring modification:
1. `proxy-engine/src/gateway/ProxyGateway.ts` - Add cache check before request
2. `proxy-engine/src/cache/Cache.ts` - Extend for proxy-specific caching
3. `proxy-engine/src/types.ts` - Add cache options to ProxyConfig

Affected components:
- ConnectionPool: Need to coordinate cache with connection reuse
- Middleware: Cache middleware needs to run early in pipeline
- ProxyTypes: All types (reverse, load-balance, etc.) affected

Cross-layer impacts:
- Runtime: RuntimeConfig may need cache options
- MCP Server: Proxy tool options might expose cache settings
- Tests: proxy-engine/tests/ needs cache test cases

Pattern conflicts:
- Existing middleware is synchronous, cache lookups might be async
- Need to resolve: callback-based vs Promise-based API
```

### Phase 4: Pattern & Convention Check (within same files)

**Goal:** Understand existing patterns to maintain consistency

**Questions to answer:**
- What patterns does the codebase use?
- How are similar features implemented?
- What conventions should be followed?

**BrowserX Patterns to Check:**

**Error Handling:**
```
Current pattern: [try/catch, Result type, error callbacks?]
Example from code: [line reference]
```

**Async Operations:**
```
Current pattern: [Promises, async/await, callbacks?]
Example from code: [line reference]
```

**Configuration:**
```
Current pattern: [Config objects, builder pattern, defaults?]
Example from code: [line reference]
```

**Resource Management:**
```
Current pattern: [Manual cleanup, dispose(), RAII pattern?]
Example from code: [line reference]
```

**Example Pattern Check:**
```markdown
## Patterns in ProxyEngine

Error handling:
- Uses try/catch with Result<T, Error> wrapper (line 34)
- Errors bubble up to ProxyGateway for logging (line 156)

Async operations:
- Callback-based for middleware (line 78)
- Promise-based for connection pool (line 92)
- Mixed pattern detected ⚠️

Configuration:
- ProxyConfig object with defaults (line 23)
- Builder pattern NOT used
- Options passed as plain objects

Resource management:
- ConnectionPool has explicit checkout/return (line 45, 67)
- No automatic cleanup
- Follows acquire/release pattern
```

## Synthesis: Putting It Together

After analyzing <5 files, synthesize findings:

### Template:

```markdown
## Code Analysis Summary

**User Request:** [original request]

**Entry Point:**
- File: [path:line]
- Component: [name]

**Current Data Flow:**
1. [Step 1] → [Step 2] → [Step 3]
2. Data structures: [types involved]
3. Patterns: [pipeline/state machine/events]

**Required Changes:**
- Primary: [main file:line changes]
- Secondary: [supporting file changes]
- Tests: [test file updates needed]

**Affected Systems:**
- [X] Browser/Proxy/Query/Runtime/MCP/DevTools
- Cross-layer impacts: [description]

**Pattern Alignment:**
- Error handling: [follows existing pattern?]
- Async: [matches convention?]
- Config: [consistent with codebase?]
- Resources: [proper lifecycle management?]

**Complexity Assessment:**
- Scope: [small/medium/large]
- Risk: [low/medium/high]
- Unknowns: [what's still unclear]

**Questions Needed:**
[List of clarifying questions from questioning_framework.md]
```

## Red Flags During Analysis

Stop and ask questions if you encounter:

### 🚩 Ambiguity Red Flags
- Multiple valid interpretations of the request
- Can't determine scope without guessing
- Request conflicts with existing patterns
- Edge cases are unclear

### 🚩 Complexity Red Flags
- Change would affect >3 major components
- Requires modifying core interfaces
- Introduces breaking changes
- No clear pattern to follow

### 🚩 Understanding Red Flags
- Initial reading reveals more questions than answers
- Code behavior doesn't match expectations
- Can't trace data flow within 5 files
- Found unexpected dependencies

**When red flags appear:** Stop expanding context and formulate clarifying questions.

## Example: Complete Analysis Flow

**User Request:** "Add authentication to the browser engine"

### Phase 1: Entry Point (1 file)
```
Read: browser/src/engine/network/http/HttpClient.ts

Finding: HTTP requests currently have no auth mechanism
Entry point: HttpClient.makeRequest() at line 234
```

### Phase 2: Data Flow (2 files)
```
Read:
- browser/src/engine/network/http/HttpClient.ts
- browser/src/engine/network/http/HttpRequest.ts

Flow:
1. HttpClient.makeRequest() creates HttpRequest (line 234)
2. HttpRequest built with headers/body (line 45-67)
3. Request sent via TlsSocket (line 289)

Data structures:
- HttpRequest: { method, url, headers, body }
- No auth field currently exists

Pattern: Request pipeline (DNS → TCP → TLS → HTTP)
```

### Phase 3: Impact (2 files)
```
Read:
- browser/src/types/http.ts (type definitions)
- browser/src/engine/network/network_manager.ts (might coordinate)

Changes needed:
1. Add auth to HttpRequest type (types/http.ts:23)
2. HttpClient accepts auth options (line 45)
3. NetworkManager might need auth storage

Affected:
- All HTTP methods (GET, POST, etc.) - 8 methods
- WebSocket connections (might need auth)
- Tests in browser/tests/http/

Cross-layer:
- MCP browser_navigate tool might need auth option
- Runtime BrowserConfig might include default auth
```

### Phase 4: Patterns (same files)
```
Pattern check within files already read:

Error handling:
- Uses try/catch with error propagation (line 267)

Async:
- Promise-based (async/await) throughout (line 234)

Configuration:
- Options objects with defaults (line 189)

Storage:
- No credential storage pattern found
- Need to check: where would credentials be stored?
```

### Synthesis
```markdown
## Analysis Summary

**Request:** Add authentication to browser engine

**Entry:** browser/src/engine/network/http/HttpClient.ts:234

**Flow:** HttpClient → HttpRequest → TlsSocket

**Changes:**
- types/http.ts - Add auth types
- HttpClient.ts - Accept & apply auth
- NetworkManager.ts (maybe) - Store credentials?

**Affected Systems:**
- Browser Engine ✓
- MCP Server tools (browser_navigate options)
- Runtime (BrowserConfig)
- Tests (http test suite)

**Patterns:**
- Async: async/await ✓
- Config: options objects ✓
- Storage: UNCLEAR ⚠️

**🚩 Red Flags:**
- Credential storage location unclear
- WebSocket auth not obvious
- Security implications unknown

**Questions Needed:**
1. Scope: HTTP only or also WebSocket/SSE?
2. Integration: Where should credentials be stored (NetworkManager, BrowserConfig, or per-request)?
3. Requirements: What auth schemes (Basic, Bearer, OAuth)?
```

## Usage Notes

**When to expand beyond 5 files:**
- Only if analysis reveals critical missing information
- After identifying specific file to read next
- When pattern understanding requires one more example

**When NOT to expand:**
- When questions are already clear
- When guessing which files to read
- When context is getting too large
- When red flags appear

**Key principle:** Efficient analysis that reveals clarification needs, not exhaustive code reading that drains context.
