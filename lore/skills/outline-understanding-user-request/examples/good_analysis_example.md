# Example: Good Analysis → Clarifying Questions

This example demonstrates effective code analysis leading to targeted clarifying questions. The specifics are illustrative — the same pattern applies to any codebase.

---

## User Request

"Add caching to the API layer"

---

## Analysis Process

### Initial Assessment

**Trigger:** Ambiguous request — "caching" could mean many things, and scope is unclear.

**Goal:** Read ≤5 files to understand:
- What API layer exists and how requests flow through it
- Where caching would integrate
- What patterns the codebase already follows

---

### File 1: Entry Point Discovery

**Read:** `src/api/router.ts`

**Findings:**
```typescript
// Line 34-67
async handleRequest(req: Request): Promise<Response> {
  const context = this.buildContext(req);
  await this.middleware.run(context);
  const handler = this.routes.match(context.path);
  return handler.handle(context);
}
```

**Insights:**
- Middleware pipeline exists (line 44)
- Route handlers are separate from middleware
- No caching currently happens
- Request flow is async

---

### File 2: Middleware Structure

**Read:** `src/api/middleware/pipeline.ts`

**Findings:**
```typescript
// Line 12-38
export class MiddlewarePipeline {
  private stack: Middleware[] = [];

  async run(ctx: Context): Promise<void> {
    for (const mw of this.stack) {
      await mw.handle(ctx);
      if (ctx.done) break;
    }
  }

  use(mw: Middleware): void {
    this.stack.push(mw);
  }
}

export interface Middleware {
  handle(ctx: Context): Promise<void>;
}
```

**Insights:**
- Middleware is async and stackable
- Pipeline can short-circuit (`ctx.done`)
- A cache check could slot in as middleware
- Short-circuit means cache hits bypass downstream middleware

---

### File 3: Existing Cache Utility

**Read:** `src/utils/cache.ts`

**Findings:**
```typescript
// Line 8-29
export class LRUCache<K, V> {
  private store = new Map<K, V>();

  get(key: K): V | undefined { ... }
  set(key: K, value: V, ttlMs?: number): void { ... }
  has(key: K): boolean { ... }
  delete(key: K): void { ... }
}
```

**Insights:**
- Generic LRU cache exists but is NOT used in the API layer
- Supports TTL expiry
- Synchronous API — potential conflict with async middleware

---

### File 4: Route Handler Examples

**Read:** `src/api/routes/users.ts`

**Findings:**
```typescript
// Line 45-67
export class UsersRoute {
  async handle(ctx: Context): Promise<Response> {
    const users = await this.db.query('SELECT * FROM users');
    return Response.json(users);
  }
}
```

**Insights:**
- Handlers call the database directly
- No existing caching logic per handler
- Multiple similar routes likely have the same pattern

---

### File 5: Route Registration

**Read:** `src/api/routes/index.ts`

**Findings:**
```typescript
// Line 12-28
router.get('/users',    UsersRoute)
router.get('/products', ProductsRoute)
router.get('/orders',   OrdersRoute)
router.post('/users',   CreateUserRoute)
router.post('/orders',  CreateOrderRoute)
```

**Insights:**
- Mix of GET (likely cacheable) and POST (likely not cacheable) routes
- 5 routes currently — scope question: which ones?
- POST routes modify state, caching GET responses may not apply

---

## Data Flow Analysis

### Current Flow (no caching)
```
1. Request arrives
2. Router.handleRequest() builds context
3. Middleware pipeline runs (auth, logging, etc.)
4. Route handler executes
5. Handler queries database
6. Response returned
```

### Potential Cache Integration Options

**Option A: Cache middleware (before routing)**
```
1. Request arrives
2. Router.handleRequest()
3. Middleware runs → CacheMiddleware checks cache
   → HIT: set response + short-circuit (ctx.done = true)
   → MISS: continue pipeline
4. Route handler queries DB (on miss only)
5. CacheMiddleware stores response for next time
```

**Option B: Cache inside each route handler**
```
[Each handler individually checks/sets cache]
- Requires updating every handler
- Allows per-route cache configuration
- More duplication
```

**Option C: Cache at the router level (before middleware)**
```
[Router checks cache before even running middleware]
- Bypasses auth middleware — security risk
- Fastest path but most dangerous
```

---

## Impact Analysis

**Files to modify:**
1. `src/api/middleware/pipeline.ts` — add cache middleware hook point
2. `src/utils/cache.ts` — extend for HTTP response caching (async API?)
3. `src/api/router.ts` or individual routes — integrate cache

**Files to create:**
4. `src/api/middleware/cache.ts` — CacheMiddleware implementation
5. `src/api/middleware/cache.test.ts` — tests

**Pattern conflict found:**
- `LRUCache` has synchronous `get()` / `set()`
- Middleware pipeline `await`s each step
- If cache grows (e.g., disk-backed later), sync would block — needs resolution

---

## Complexity Assessment

**Scope:** Medium
- Touches 3–5 files
- Requires new middleware
- Configuration changes likely needed

**Risk:** Medium
- Async/sync conflict with existing cache utility
- POST routes must NOT be cached — easy to get wrong
- Cache invalidation not addressed in the request

**Unknowns:**
- Which routes should be cached?
- Should cache respect HTTP headers (Cache-Control, ETags)?
- What is the TTL?
- Who manages cache invalidation when data changes?

---

## Clarifying Questions

### Scope Boundaries

**Q1:** Looking at the 5 routes in `src/api/routes/index.ts`, which should be cached? The GET routes (`/users`, `/products`, `/orders`) seem like candidates, but the POST routes modify state. Should caching apply only to GET routes, or is there a specific subset?

**Q2:** Should caching happen at the middleware level (runs for all matched routes) or within individual route handlers (per-handler control)? I found three options — see data flow analysis above. The middleware approach is simpler but affects all routes at once.

### Integration Points

**Q3:** The existing `LRUCache` at `src/utils/cache.ts:8` has synchronous `get()`/`set()`. The middleware pipeline is async. Should the cache utility be extended with async methods, or is synchronous fine (assuming in-memory will remain fast)?

**Q4:** Cache option C (cache before middleware) would bypass the auth middleware at `src/api/middleware/auth.ts`. Should cached responses skip auth checks, or must auth always run (which rules out option C)?

### Requirements Clarity

**Q5:** What should happen when cached data becomes stale after a database write? The current routes don't emit any events when data changes. Should cache invalidation be:
- Time-based (TTL only — simplest, may serve stale data)
- Explicit (route handlers manually invalidate on write)
- Not handled in this change (TTL only for now)

**Q6:** Should the cache respect HTTP `Cache-Control` headers from clients, or use a fixed TTL defined in server config?

---

## Why This Is a Good Analysis

- **Efficient:** Only 5 files, each with a clear purpose
- **Concrete:** Cites specific line numbers throughout
- **Pattern-aware:** Found the async/sync conflict before writing a single line
- **Option-generating:** Identified 3 integration approaches with trade-offs
- **Question quality:** Every question references specific code findings and offers concrete options

---

## Counter-Example: What NOT to Do

❌ **Reading too many files:**
> "I'll read all 12 route handlers to understand the full picture before asking questions"

❌ **Vague questions:**
> "Where do you want caching?" / "How should it work?"

❌ **Guessing without reading:**
> "I'll add a cache decorator to each route. Is that okay?" (didn't read the middleware system first)

❌ **Missing pattern conflicts:**
> "I'll use LRUCache in the middleware" (without noticing it's synchronous in an async pipeline)

❌ **Describing instead of asking:**
> "I'll implement this as middleware. The middleware will check the cache. If there's a hit, it returns early. If not, it proceeds." (This is a plan, not a question — the ambiguities haven't been surfaced)
