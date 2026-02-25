# Example: Good Analysis → Clarifying Questions

This example demonstrates effective code analysis leading to targeted clarifying questions.

## User Request

"Add caching to the proxy engine"

## Analysis Process

### Initial Assessment

**Trigger:** Ambiguous request - "caching" could mean many things, and scope is unclear

**Goal:** Read <5 files to understand:
- What proxy architecture exists
- Where caching would integrate
- What patterns to follow

### File 1: Entry Point Discovery

**Read:** `proxy-engine/src/gateway/ProxyGateway.ts`

**Findings:**
```typescript
// Line 45-89
async handleRequest(request: ProxyRequest): Promise<ProxyResponse> {
  const context = this.createContext(request);

  // Middleware pipeline
  await this.middlewarePipeline.execute(context);

  // Route to proxy type
  const proxyType = this.getProxyType(request);
  const response = await proxyType.handle(context);

  return response;
}
```

**Insights:**
- Middleware pipeline exists (line 67)
- Proxy types are pluggable (line 78)
- No caching currently happens
- Request/response flow is async

### File 2: Understanding Middleware

**Read:** `proxy-engine/src/middleware/MiddlewarePipeline.ts`

**Findings:**
```typescript
// Line 23-45
export class MiddlewarePipeline {
  private middlewares: Middleware[] = [];

  async execute(context: Context): Promise<void> {
    for (const middleware of this.middlewares) {
      await middleware.handle(context);
      if (context.completed) break;
    }
  }

  add(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }
}

// Line 67-78
export interface Middleware {
  handle(context: Context): Promise<void>;
}
```

**Insights:**
- Middleware is async
- Pipeline can short-circuit (context.completed)
- New middleware can be added
- Cache could be a middleware

### File 3: Existing Cache Implementation

**Read:** `proxy-engine/src/cache/Cache.ts`

**Findings:**
```typescript
// Line 12-34
export class Cache<K, V> {
  private storage = new Map<K, V>();
  private policy: EvictionPolicy;

  constructor(policy: 'LRU' | 'LFU' | 'FIFO' = 'LRU') {
    this.policy = createEvictionPolicy(policy);
  }

  set(key: K, value: V, ttl?: number): void {
    this.storage.set(key, value);
    this.policy.recordAccess(key);
    if (ttl) {
      this.scheduleEviction(key, ttl);
    }
  }

  get(key: K): V | undefined {
    const value = this.storage.get(key);
    if (value) this.policy.recordAccess(key);
    return value;
  }
}
```

**Insights:**
- Generic cache class exists
- Supports LRU/LFU/FIFO eviction
- Has TTL support
- NOT currently used in proxy pipeline

### File 4: Proxy Types

**Read:** `proxy-engine/src/types/ProxyTypes.ts`

**Findings:**
```typescript
// Line 89-112
export enum ProxyType {
  REVERSE = 'reverse',
  LOAD_BALANCE = 'load-balance',
  AUTH = 'auth',
  WEBSOCKET = 'websocket',
  SSE = 'sse',
  TLS_TERMINATION = 'tls-termination'
}

export interface ProxyTypeHandler {
  type: ProxyType;
  handle(context: Context): Promise<ProxyResponse>;
}
```

**Insights:**
- 6 different proxy types
- Each has own handler
- Question: Does caching apply to all types?
- WebSocket and SSE might not be cacheable

### File 5: Configuration

**Read:** `proxy-engine/src/config/ProxyConfig.ts`

**Findings:**
```typescript
// Line 23-45
export interface ProxyConfig {
  port: number;
  middleware?: MiddlewareConfig[];
  proxyTypes?: ProxyTypeConfig[];
  connectionPool?: ConnectionPoolConfig;
  metrics?: MetricsConfig;
  // No cache config currently
}
```

**Insights:**
- No cache configuration exists yet
- Would need to add CacheConfig
- Should it be top-level or middleware config?

## Data Flow Analysis

### Current Flow (without caching)

```
1. Request arrives
   ↓
2. ProxyGateway.handleRequest()
   ↓
3. Create Context
   ↓
4. Middleware Pipeline executes (auth, logging, etc.)
   ↓
5. Route to ProxyType handler
   ↓
6. Handler makes upstream request
   ↓
7. Response returned
```

**Data structures:**
- `ProxyRequest`: { method, url, headers, body }
- `ProxyResponse`: { statusCode, headers, body, timing }
- `Context`: { request, response, metadata, completed }

### Potential Flow (with caching)

**Option A: Cache as Middleware**
```
1. Request arrives
2. ProxyGateway.handleRequest()
3. Create Context
4. Middleware Pipeline:
   → CacheMiddleware checks cache
   → If HIT: set response, mark completed
   → If MISS: continue pipeline
5. Route to ProxyType handler (if not completed)
6. Handler makes upstream request
7. CacheMiddleware stores response
8. Response returned
```

**Option B: Cache within ProxyType**
```
[Same as current, but each ProxyType handles own caching]
- Issue: Duplication across types
- Issue: Can't disable caching globally
```

**Option C: Cache at Gateway level**
```
1. Request arrives
2. ProxyGateway checks cache first
3. If HIT: return immediately
4. If MISS: proceed with normal flow + cache response
- Issue: Bypasses middleware (auth might not run)
```

## Impact Analysis

### Files Requiring Modification

**Primary:**
1. `proxy-engine/src/gateway/ProxyGateway.ts` - Integrate cache
2. `proxy-engine/src/cache/Cache.ts` - Extend for HTTP caching
3. `proxy-engine/src/config/ProxyConfig.ts` - Add cache config

**Secondary (if cache as middleware):**
4. `proxy-engine/src/middleware/CacheMiddleware.ts` - NEW FILE
5. `proxy-engine/src/middleware/mod.ts` - Export new middleware

**Supporting:**
6. `proxy-engine/src/types.ts` - Add cache-related types
7. `proxy-engine/tests/cache.test.ts` - NEW TEST FILE

### Affected Systems

- **Proxy Engine**: Primary change ✓
- **ConnectionPool**: May need coordination (cache + connection reuse)
- **Metrics**: Should track cache hits/misses
- **Runtime**: May expose cache config in RuntimeConfig
- **MCP Server**: Proxy tools might get cache options

### Pattern Conflicts

**Async consistency:**
- Middleware: async ✓
- Cache.get(): synchronous ❌
- **Conflict:** Need async cache.get() for cache middleware

**Configuration pattern:**
- ProxyConfig uses plain objects ✓
- Cache uses constructor params ❌
- **Conflict:** Should CacheConfig be object-based?

**Lifecycle:**
- ConnectionPool has explicit checkout/return
- Cache has no cleanup mechanism
- **Conflict:** Who manages cache lifecycle?

## Complexity Assessment

**Scope:** Medium
- Touches multiple files (5-7)
- Requires new middleware or gateway modification
- Configuration changes needed

**Risk:** Medium
- Pattern conflict with async/sync cache
- Lifecycle management unclear
- Multiple integration approaches possible

**Unknowns:**
- Which proxy types should be cacheable?
- Should cache respect HTTP Cache-Control headers?
- Where should cache lifecycle be managed?
- How to handle cache invalidation?

## Clarifying Questions

Based on the analysis, here are targeted questions across three dimensions:

### 1. Scope Boundaries

**Q1:** Looking at the 6 proxy types (reverse, load-balance, auth, websocket, sse, tls-termination), which should support caching?

**Context:** WebSocket and SSE are bidirectional/streaming protocols that typically can't be cached. Should caching:
- Only apply to HTTP proxy types (reverse, load-balance)?
- Be opt-in per proxy type?
- Apply globally with type-specific behavior?

**Q2:** Should caching apply at the middleware level (before routing) or within specific proxy type handlers?

**Context:** I found three integration options:
- A: Cache as middleware (runs for all requests, can short-circuit)
- B: Cache within each ProxyType handler (type-specific behavior)
- C: Cache at gateway level (earliest possible, but bypasses other middleware)

Each has trade-offs for flexibility, performance, and complexity.

### 2. Integration Points

**Q3:** The current Cache class has synchronous get/set methods, but middleware is async. Should the cache:
- Be refactored to async get/set for consistency?
- Use sync methods with a Promise wrapper in middleware?
- Remain sync with the assumption that lookups are fast enough?

**Context:** MiddlewarePipeline.execute() is async and awaits each middleware. A sync cache.get() would block the event loop if the lookup is slow.

**Q4:** Should cache coordinate with ConnectionPool, or operate independently?

**Context:** ConnectionPool manages upstream connections with health checks. Cache might:
- Reuse ConnectionPool's health checking to invalidate cached responses from unhealthy upstreams
- Operate independently and cache regardless of connection state
- Participate in the connection lifecycle somehow

### 3. Requirements Clarity

**Q5:** Should the cache respect HTTP Cache-Control headers from upstream responses, or use fixed TTL?

**Context:** HTTP caching semantics are complex (Cache-Control, ETag, Last-Modified, Vary, etc.). The implementation could:
- Parse and respect Cache-Control directives (more work, standards-compliant)
- Use simple fixed TTL per cache entry (simpler, less correct)
- Hybrid: respect some headers, ignore others

**Q6:** What should happen when cache storage exceeds memory limits?

**Context:** The current Cache class uses LRU/LFU/FIFO eviction. For proxy caching:
- Is there a memory limit target (e.g., 100MB, 1GB)?
- Should it log when evicting entries?
- Should metrics track eviction rates?

**Q7:** How should cache keys be constructed?

**Context:** HTTP caching considers multiple factors:
- URL (obviously)
- Method (GET cacheable, POST usually not)
- Headers (Vary header specifies which request headers affect cache)
- Request body (for POST/PUT)

Should the cache key be:
- Simple: just URL
- Standard: URL + method + relevant headers
- Custom: user-defined key function

## Why This Is Good Analysis

**✅ Efficient:**
- Only read 5 files
- Each file had a clear purpose
- Stopped when questions became clear

**✅ Concrete:**
- Cited specific line numbers
- Showed actual code snippets
- Traced real data flow

**✅ Pattern-aware:**
- Identified async pattern conflict
- Found existing Cache class
- Understood middleware mechanism

**✅ Question quality:**
- Each question grounded in code findings
- Offers informed options
- Reveals real ambiguity (not guesses)
- Covers scope, integration, requirements

**✅ BrowserX-specific:**
- Considered multi-layer architecture
- Checked cross-component impacts
- Followed existing patterns

## Counter-example: What NOT to Do

❌ **Reading too many files:**
```
Read 15 files trying to understand entire proxy engine
before realizing request is ambiguous
```

❌ **Vague questions:**
```
"How should caching work?"
"Where should I put the cache?"
```

❌ **Guessing without reading:**
```
"I'll add a cache middleware that stores responses.
Is that okay?"
```

❌ **No data flow analysis:**
```
"I found a Cache class. Should I use it?"
[Without understanding where/how it would integrate]
```

❌ **Missing pattern conflicts:**
```
"I'll use the existing Cache class in middleware"
[Ignoring that Cache is sync but middleware is async]
```

## Key Takeaways

1. **Read code, not docs** - Real implementation reveals integration points
2. **<5 file rule** - Stop when questions emerge, don't exhaust context
3. **Trace data flow** - Understand how data moves through the system
4. **Identify patterns** - Check for conflicts with existing conventions
5. **Ask grounded questions** - Every question should reference specific code findings
