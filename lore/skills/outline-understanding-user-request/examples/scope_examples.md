# Scope Examples: Well-Scoped vs Poorly-Scoped Changes

This document provides examples of well-scoped and poorly-scoped changes in BrowserX to illustrate effective scope boundaries.

## What Makes Good Scope?

**Well-scoped changes:**
- Clear boundaries (what's in, what's out)
- Single concern or tightly related concerns
- Testable in isolation
- Reversible if problematic
- Limited cross-layer impact

**Poorly-scoped changes:**
- Vague boundaries
- Multiple unrelated concerns
- Hard to test comprehensively
- High blast radius if wrong
- Cascading dependencies

## Example 1: DevTools Domain Enhancement

### ❌ Poorly Scoped

**User Request:** "Improve DevTools"

**Problems:**
- What aspect of DevTools? All 14 domains?
- Improve how? Performance? Features? API?
- Scope is unbounded

**Result:** Would drain context trying to understand what "improve" means across massive scope.

### ✅ Well Scoped

**User Request:** "Add console.table() support to Console domain"

**Why better:**
- Specific domain: Console (1 of 14)
- Specific feature: console.table()
- Clear boundary: Doesn't affect other domains
- Testable: Can verify console.table() works

**Scope clarity:**
```
IN SCOPE:
- Console domain: ConsoleMessage handling
- Add table formatting logic
- Tests for console.table()

OUT OF SCOPE:
- Other console methods (log, warn, etc.) - already exist
- Other domains - not affected
- MCP server tools - no changes needed
```

## Example 2: Caching Feature

### ❌ Poorly Scoped

**User Request:** "Add caching"

**Problems:**
- Where? Browser, Proxy, Query, or all three?
- What kind? Memory, disk, distributed?
- For what data? HTTP responses, DNS, connections?

**Result:** Too many unknowns, would need extensive clarification before understanding scope.

### ✅ Well Scoped

**User Request:** "Add LRU cache middleware for HTTP responses in proxy engine with max 100MB memory"

**Why better:**
- Where: Proxy engine, specifically middleware
- What: HTTP responses only (not WebSocket/SSE)
- How: LRU eviction policy
- Constraint: 100MB memory limit

**Scope clarity:**
```
IN SCOPE:
- ProxyEngine middleware pipeline
- Cache class extension/usage
- HTTP response caching only
- Memory-based LRU eviction
- Metrics for hit/miss rates

OUT OF SCOPE:
- Browser engine caching (separate concern)
- WebSocket/SSE caching (not HTTP)
- Disk-based caching (memory only)
- Distributed cache (single instance)
- Query result caching (different layer)
```

## Example 3: Authentication Feature

### ❌ Poorly Scoped

**User Request:** "Add auth"

**Problems:**
- Auth for what? Browser HTTP requests? Proxy? MCP server?
- What kind? Basic, Bearer, OAuth, cookies?
- Where stored? In-memory, persistent, encrypted?

**Result:** Massive scope uncertainty; could mean anything from simple Basic auth to full OAuth flow with session management.

### ✅ Well Scoped (Option A)

**User Request:** "Add HTTP Basic authentication support to browser engine's HttpClient for per-request auth headers"

**Why better:**
- Where: Browser engine, HttpClient class
- What: HTTP Basic auth only
- How: Per-request (not session-based)
- Storage: No credential storage (passed per request)

**Scope clarity:**
```
IN SCOPE:
- HttpClient.makeRequest() accept auth option
- Base64 encode username:password
- Add Authorization header to request
- Tests for auth header injection

OUT OF SCOPE:
- OAuth/Bearer tokens (different auth scheme)
- Credential storage/management (passed in)
- Session/cookie-based auth (stateless)
- Proxy authentication (different layer)
- DevTools auth inspection (future feature)
```

### ✅ Well Scoped (Option B)

**User Request:** "Add Bearer token support to MCP browser_navigate tool with token stored in session metadata"

**Why better:**
- Where: MCP server, browser_navigate tool
- What: Bearer tokens only
- Storage: Session metadata (already exists)
- Lifetime: Per-session (cleared on session end)

**Scope clarity:**
```
IN SCOPE:
- MCP tool option: { auth: { bearer: "token" } }
- Session.metadata storage for tokens
- Pass token to HttpClient
- Clear token on session close

OUT OF SCOPE:
- Basic auth (different scheme)
- Token refresh/expiry (static tokens)
- Encrypted storage (session metadata is in-memory)
- Multi-user auth (single session owner)
```

**Note:** Options A and B are both well-scoped but solve different problems. Without clarification, can't choose between them.

## Example 4: Error Handling Improvement

### ❌ Poorly Scoped

**User Request:** "Improve error handling"

**Problems:**
- Which component? All 5 layers?
- Which errors? Network? Parse? Runtime?
- Improve how? Better messages? Recovery? Logging?

**Result:** Scope encompasses potentially hundreds of error paths across entire codebase.

### ✅ Well Scoped

**User Request:** "Add retry logic with exponential backoff for DNS resolution failures in the browser network stack"

**Why better:**
- Where: Browser engine, DNS resolution
- What: Retry logic specifically
- How: Exponential backoff algorithm
- Trigger: DNS failures only (not all network errors)

**Scope clarity:**
```
IN SCOPE:
- DnsResolver.resolve() retry logic
- Exponential backoff: 100ms, 200ms, 400ms, 800ms
- Max 3 retries before final failure
- Tests for retry behavior
- Metrics for retry attempts

OUT OF SCOPE:
- TCP connection retries (separate concern)
- HTTP error retries (different layer)
- TLS handshake failures (different protocol)
- Parser errors (not network errors)
- Other DNS operations (reverse lookup, etc.)
```

## Example 5: Performance Optimization

### ❌ Poorly Scoped

**User Request:** "Make it faster"

**Problems:**
- Make what faster? Page load? Query execution? Proxy routing?
- How much faster? 10%? 2x? Microseconds matter or seconds?
- At what cost? Memory? Code complexity?

**Result:** Impossible to start without extensive profiling and clarification.

### ✅ Well Scoped

**User Request:** "Optimize rendering pipeline layout stage to reduce reflow time from 50ms to <30ms for pages with 1000+ DOM nodes"

**Why better:**
- Where: Rendering pipeline, layout stage specifically
- What: Reflow performance
- Target: <30ms (from current 50ms)
- Scenario: Pages with 1000+ nodes

**Scope clarity:**
```
IN SCOPE:
- Layout engine box model calculations
- DOM tree traversal optimization
- Benchmark tests for 1000+ node pages
- Timing metrics in RenderingResult

OUT OF SCOPE:
- Parse stage optimization (separate)
- Paint stage optimization (separate)
- Network performance (different layer)
- JavaScript execution speed (different subsystem)
- Pages with <1000 nodes (already fast enough)
```

## Example 6: BrowserX-Specific: Multi-Layer Features

### ❌ Poorly Scoped

**User Request:** "Add screenshot capability"

**Problems:**
- Which layer? Browser (rendering), MCP (tool), Query (SELECT)?
- What format? PNG, JPEG, raw pixels?
- Full page or viewport? Element-specific?

**Result:** Could mean:
1. Browser compositor generating pixels
2. MCP tool exposing screenshots to AI
3. Query syntax like `SELECT screenshot FROM url`
4. All of the above (massive scope)

### ✅ Well Scoped (Option A: Browser Layer)

**User Request:** "Add getScreenshot() method to Compositor returning PNG bytes of current viewport"

**Scope clarity:**
```
IN SCOPE:
- CompositorThread.getScreenshot()
- Convert pixels to PNG format
- Viewport only (not full page scroll)
- Return Uint8Array

OUT OF SCOPE:
- MCP tool integration (separate PR)
- Query engine syntax (separate feature)
- JPEG format (PNG only for now)
- Full page screenshots (viewport only)
- Element screenshots (entire viewport)
```

### ✅ Well Scoped (Option B: MCP Layer)

**User Request:** "Add browser_screenshot tool to MCP server that captures viewport and returns base64 PNG"

**Scope clarity:**
```
IN SCOPE:
- New MCP tool: browser_screenshot
- Call existing Compositor.getScreenshot()
- Convert PNG bytes to base64
- Return in tool response

OUT OF SCOPE:
- Compositor implementation (already exists)
- Query engine integration (different interface)
- Full page scroll capture (use existing method)
- Element selection (viewport only)
```

**Note:** Option A changes Browser layer, Option B uses existing Browser capability to add MCP tool. Both valid, different scopes.

## Example 7: Plugin System Integration

### ❌ Poorly Scoped

**User Request:** "Make this work with plugins"

**Problems:**
- Make what work? Entire browser? Specific domain?
- How? Extension points? Hooks? Both?
- Which plugin APIs? All of them?

**Result:** "Pluggable" could mean anything from a single hook to complete architectural overhaul.

### ✅ Well Scoped

**User Request:** "Add onBeforeNavigate and onAfterNavigate lifecycle hooks to Runtime plugin API"

**Why better:**
- Where: Runtime plugin system
- What: Two specific lifecycle hooks
- Event timing: Before/after navigation

**Scope clarity:**
```
IN SCOPE:
- Plugin API: onBeforeNavigate(url) hook
- Plugin API: onAfterNavigate(url, response) hook
- EventCoordinator emit events
- Plugin types for hook signatures
- Tests for hook invocation

OUT OF SCOPE:
- Other lifecycle hooks (onPageLoad, etc.)
- DevTools domain hooks (separate system)
- Proxy middleware hooks (different layer)
- Plugin discovery/loading (already exists)
```

## Red Flags for Poorly-Scoped Requests

Watch for these patterns that indicate scope needs clarification:

### 🚩 Vague Verbs
- "Improve..."
- "Enhance..."
- "Fix..." (without specifics)
- "Add..." (without details)
- "Optimize..."
- "Support..." (without scope)

### 🚩 Missing Context
- "Add authentication" (where? what kind?)
- "Implement caching" (for what? where?)
- "Make it work with X" (work how? which part?)

### 🚩 Unbounded Scope
- "Update all domains..."
- "Refactor the entire..."
- "Rewrite the..." (without boundaries)

### 🚩 Multiple Concerns
- "Add auth and caching and metrics"
- "Fix bugs and add features"
- "Optimize and refactor"

## Converting Poor Scope to Good Scope

### Pattern: Vague → Specific

**Before:** "Improve query parser"
**After:** "Add support for JOIN syntax in query parser SELECT statements"

**Before:** "Add metrics"
**After:** "Add request count and latency histogram metrics to ProxyGateway"

**Before:** "Fix navigation"
**After:** "Fix browser navigation to properly handle 302 redirects by updating HttpClient redirect following"

### Pattern: Unbounded → Bounded

**Before:** "Add logging everywhere"
**After:** "Add error logging to DevTools domain method handlers with log level filtering"

**Before:** "Make tests better"
**After:** "Increase Console domain test coverage from 21 to 35 tests by adding edge case tests"

**Before:** "Refactor network code"
**After:** "Extract DNS caching logic from DnsResolver into separate DnsCache class"

### Pattern: Multiple → Single

**Before:** "Add auth, caching, and rate limiting"
**After (3 separate scopes):**
1. "Add HTTP Basic auth to browser HttpClient"
2. "Add LRU cache middleware to ProxyEngine"
3. "Add rate limiting middleware to ProxyGateway"

## Key Takeaways

**Good scope has:**
- ✅ Specific component/file targets
- ✅ Clear inclusion/exclusion boundaries
- ✅ Measurable success criteria
- ✅ Single concern or tightly related concerns
- ✅ Isolated testability

**Poor scope has:**
- ❌ Vague language ("improve", "enhance", "fix")
- ❌ Unbounded reach ("all", "entire", "everywhere")
- ❌ Multiple unrelated concerns
- ❌ Missing context on how/where/what
- ❌ Unclear success criteria

**When scope is unclear:**
- Stop and analyze code (<5 files)
- Identify specific integration points
- Form targeted clarifying questions
- Get boundaries defined before proceeding
