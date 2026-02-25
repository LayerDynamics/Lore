# Questioning Framework for Understanding User Requests

This framework provides structured templates for asking effective clarifying questions after analyzing code.

## When to Use This Framework

Use this framework when:
- User request is ambiguous or would drain context to understand
- Initial understanding proves insufficient after reviewing code (<5 files)
- Code analysis reveals complexity not evident in the request

## Three-Dimensional Questioning Approach

After analyzing the codebase, ask questions across three dimensions:

### 1. Scope Boundaries

**Purpose:** Define what's included vs excluded from the change

**Template Questions:**
```
Based on analyzing [X system/component], I see that [Y related functionality] exists.

Scope clarification needed:
- Should this change apply to [specific scenario A] or is that out of scope?
- I found [N instances/places] where similar logic exists. Should all be updated or only [specific subset]?
- Does this extend to [related feature/subsystem] or focus only on [primary area]?
```

**BrowserX-Specific Considerations:**
- **Multi-layer architecture**: Does change affect only Browser Engine, or also Proxy/Query/Runtime/MCP?
- **Plugin system**: Should this be pluggable or core functionality?
- **DevTools domains**: If touching one domain, do related domains need updates?
- **Test coverage**: Which test layers need updates (unit/integration/e2e)?

**Example:**
```
I see the Network domain handles HTTP requests. Should caching changes apply to:
- Only HTTP/1.1 or also HTTP/2 and HTTP/3?
- WebSocket connections as well as standard requests?
- Only browser requests or also proxy-level caching?
```

### 2. Integration Points

**Purpose:** Understand how changes connect to existing code

**Template Questions:**
```
Looking at the code, I see [component A] currently interacts with [component B] via [mechanism].

Integration questions:
- Should the new functionality integrate through the existing [pattern/interface] or introduce a new one?
- I noticed [X component] uses [EventBus/callbacks/direct calls]. Should this follow the same pattern?
- Does this need to coordinate with [related system], or can it operate independently?
```

**BrowserX-Specific Considerations:**
- **EventBus communication**: Should components communicate via events or direct calls?
- **State machines**: Does this fit into existing state machine patterns (Socket, TCP, TLS)?
- **Pipeline stages**: Where in the pipeline does this fit (Request, Rendering, Query execution)?
- **Resource management**: How does this integrate with BrowserPool, ConnectionPool, etc.?
- **Runtime lifecycle**: Does this participate in LifecycleManager, HealthChecker, or MetricsCollector?

**Example:**
```
The Rendering domain currently uses EventBus to notify other domains. Should the new
paint optimization:
- Emit events through the existing EventBus for other domains to react?
- Or operate silently within the Rendering domain only?
- Integrate with the existing MetricsCollector for performance tracking?
```

### 3. Requirements Clarity

**Purpose:** Clarify expected behavior and edge cases

**Template Questions:**
```
From the code, I see [current behavior] when [scenario X] occurs.

Behavioral clarification needed:
- What should happen when [edge case/error condition]?
- Should this [maintain backward compatibility/introduce breaking change]?
- What's the expected behavior if [dependency/resource unavailable]?
```

**BrowserX-Specific Considerations:**
- **Headless mode**: Should feature work in both GPU and headless modes?
- **Error handling**: Follow existing error recovery patterns (connection retry, graceful degradation)?
- **Performance constraints**: Are there latency/memory targets (like TLS handshake <100ms)?
- **Browser compatibility**: Should this match Chrome DevTools Protocol spec exactly?
- **Deno compatibility**: Any FFI or permission considerations?

**Example:**
```
The WebGPU rendering currently falls back to headless when GPU unavailable.
For the new compositor feature:
- Should it also gracefully degrade to headless?
- What's the expected behavior if shader compilation fails?
- Should it maintain the same performance target (<16ms frame time)?
```

## Question Quality Guidelines

### ✅ Good Questions

**Concrete and specific:**
```
Should the cache apply to WebSocket connections as well as HTTP requests?
```

**Grounded in code analysis:**
```
I see ConnectionPool has a maxConnections limit. Should the new proxy type respect this limit?
```

**Reveal true ambiguity:**
```
The current code handles errors by retrying 3 times. Should this new feature follow the same pattern?
```

**Offer informed options:**
```
I found two patterns: EventBus (async) and direct calls (sync). Which should this use?
```

### ❌ Poor Questions

**Too vague:**
```
How should this work?
```

**Not grounded in code:**
```
What do you want me to do?
```

**False dichotomies:**
```
Should I use a class or a function? (Missing context: what did code analysis reveal?)
```

**Assumptive:**
```
I'll add it to the Runtime. Is that okay? (Didn't analyze where it belongs)
```

## BrowserX Architecture Patterns to Consider

When analyzing code and forming questions, keep these patterns in mind:

### Pipeline Pattern
Many components use sequential stages with timing:
- Request Pipeline: DNS → TCP → TLS → HTTP
- Rendering Pipeline: Parse → Style → Layout → Paint → Composite
- Query Pipeline: Lex → Parse → Analyze → Optimize → Plan → Execute

**Question pattern:** "Which stage of the [X] pipeline should this integrate into?"

### State Machine Pattern
Components follow strict state transitions:
- Socket: CLOSED → OPENING → OPEN → CLOSING → CLOSED
- Lifecycle: STOPPED → STARTING → RUNNING → STOPPING → STOPPED

**Question pattern:** "Should this respect the [X] state machine transitions?"

### Event-Driven Pattern
EventBus for cross-component communication:
- Domains emit events for other domains
- Runtime coordinates via EventCoordinator

**Question pattern:** "Should this emit events through EventBus or operate synchronously?"

### Resource Pool Pattern
Managed resource lifecycle:
- BrowserPool: acquire() → use → release()
- ConnectionPool: checkout() → use → return()

**Question pattern:** "Should this integrate with [X]Pool for lifecycle management?"

### Domain Pattern (DevTools)
All domains extend BaseDomain:
- setup() → enable() → handle methods → disable() → dispose()

**Question pattern:** "Does this need a new DevTools domain or extend an existing one?"

## Putting It All Together

### Example Complete Analysis → Questions Flow

**User Request:**
"Add caching to the proxy engine"

**Code Analysis (after reading <5 files):**
```
ProxyEngine has middleware pipeline.
Cache exists with LRU/LFU/FIFO eviction.
ConnectionPool manages connections.
ProxyTypes include reverse, load-balance, auth.
```

**Structured Questions:**

**Scope:**
- Should caching apply to all proxy types (reverse, load-balance, auth) or specific ones?
- I see WebSocket and SSE proxy types. Should caching extend to those as well, or only HTTP?
- Should this be a new proxy type (CachingProxy) or middleware that any type can use?

**Integration:**
- Should this integrate with the existing Cache class in `cache/Cache.ts`?
- Should it participate in the ConnectionPool's health checking?
- Where in the middleware pipeline should caching occur (early for all requests, or late after auth)?

**Requirements:**
- What's the expected behavior for cache misses during network errors?
- Should cache respect upstream Cache-Control headers, or use fixed TTL?
- Are there memory limits for the cache, or use existing LRU eviction?

## Summary

Effective questions:
1. **Follow code analysis** - Questions reveal findings, not guesses
2. **Three dimensions** - Cover scope, integration, requirements
3. **Be specific** - Concrete scenarios from actual code
4. **Reveal options** - Show what analysis uncovered
5. **Match architecture** - Align with BrowserX patterns (pipelines, state machines, events, pools, domains)
