---
name: codebase-pattern-analysis
description: This skill should be used when the user asks to "analyze patterns in a codebase", "understand how X works in this project", "find similar code to what I'm building", "what conventions does this project use", "where would I add a new feature", "find extension points in this code", or needs to understand an unfamiliar codebase's architecture before implementing something new.
version: 0.1.0
---

# Codebase Pattern Analysis

Systematic process for mapping an unfamiliar codebase's architecture, patterns, conventions, and extension points before implementing a new feature.

## Reading Order

Read a codebase top-down in three passes to avoid premature deep-diving:

**Pass 1 — Orientation (5 minutes):**
1. Read the root README, CLAUDE.md, or equivalent orientation document
2. Scan the top-level directory structure — note the major directories
3. Identify the entry points: `main.ts`, `mod.ts`, `index.ts`, `server.ts`, or whatever starts the system
4. Read the primary manifest: `package.json`, `deno.json`, `Cargo.toml` — look for task definitions and dependencies

**Pass 2 — Architecture Map (10-15 minutes):**
1. Identify the primary domain boundaries — these are usually top-level directories under `src/` or equivalent
2. Find the type system: look for `types.ts`, `types/`, or `interfaces/` — read 1-2 key type files
3. Trace one complete flow end-to-end (e.g., one HTTP request, one render cycle) to understand how layers connect
4. Identify shared infrastructure: event buses, logging, error handling, DI containers

**Pass 3 — Pattern Extraction (10-15 minutes):**
1. Find 2-3 existing features most similar to what needs to be built
2. Read those features deeply — trace from public API through to implementation
3. Extract the repeating patterns (see below)

## What to Extract

### Naming Conventions

Map the naming patterns from actual code:
- File names: kebab-case, PascalCase, snake_case?
- Class/interface names: `FooManager`, `FooService`, `FooController`, `IFoo`?
- Function names: `getFoo`, `fetchFoo`, `loadFoo`, `readFoo`?
- Event names: camelCase strings, SCREAMING_SNAKE, enum values?
- Test files: `foo.test.ts`, `foo.spec.ts`, `foo_test.ts`?

### Module and File Organization

- Where do interfaces/types live? Co-located or centralized?
- Where do tests live? Alongside source or in a separate `tests/` tree?
- How are re-exports organized? `mod.ts`, `index.ts`, barrel files?
- Are there domain-specific subdirectory patterns?

### Key Abstractions

Look for the repeating structural patterns:
- Base classes that features extend
- Interfaces that features implement
- Factory functions that create instances
- Registry patterns where things register themselves
- Pipeline stages that can be added

### Extension Points

These are the "hooks" where new features can be plugged in:
- Interfaces/abstract classes designed to be extended
- Configuration objects that accept arrays of things
- `register()`, `add()`, `use()` methods
- Plugin/middleware/handler registration points
- Feature flags or capability checks

### Error Handling

- What error types are thrown?
- Are errors wrapped in domain-specific classes?
- How are async errors surfaced?
- What's the boundary between "recoverable" and "fatal" errors?

### Testing Patterns

- Test file structure and helper patterns
- Common mock/stub setup patterns
- What gets unit-tested vs integration-tested?
- How are external dependencies mocked?

## Finding Similar Existing Features

Use these search strategies to find the best reference implementation:

```
# Find similar by concept
Grep for the conceptual keywords of the feature
Grep for types/interfaces that sound related

# Find similar by structure
Look for files in the same directory as where the feature would live
Look for existing implementations of the same base class/interface

# Find similar by usage
Find where the feature's natural home (service, manager, handler) is used
Trace from the public API inward
```

Once found, read the similar feature from **outside in**: public API → types → implementation → tests.

## Identifying the "Natural Home"

Every new feature has a natural place in the codebase. To find it:

1. Ask: What layer does this feature belong to? (network, storage, rendering, business logic, presentation)
2. Ask: Does a similar concept already have a home? (If there's an `AuthManager`, a new auth feature belongs near it)
3. Ask: What does this feature depend on, and what depends on it? (Place it close to its dependencies)
4. Ask: What directory naming convention would this follow?

If the answer is unclear, **choose the most conservative location** — close to existing similar code rather than creating new structure.

## Output Format

Produce findings in this structure:

```
## Codebase Pattern Analysis: [Feature Area]

### Architecture Style
[Brief description: layered, hexagonal, event-driven, pipeline, etc.]

### Similar Existing Features
- [Feature name]: [file path] — most similar because [reason]
- [Feature name]: [file path] — also relevant because [reason]

### Extension Points for This Feature
- [Extension point name]: [file path:line] — [how to use it]

### Naming Conventions
- Files: [pattern]
- Classes/interfaces: [pattern]
- Functions: [pattern]
- Events: [pattern]
- Tests: [pattern]

### Key Files to Read Next
[Ordered list of 5-10 files, most important first, with one-line reason each]

### Where to Add This Feature
[Specific directory path, with reasoning]

### Open Questions
[List of things that aren't clear from static analysis alone]
```

## Common Pitfalls

**Reading too deeply too fast** — resist the urge to fully understand one file before getting orientation. Breadth first, then depth.

**Assuming patterns from other projects** — every codebase has its own conventions. Extract from actual code, not assumptions.

**Missing the test patterns** — test structure reveals a lot about how the codebase thinks about components. Always check tests for similar features.

**Ignoring the type system** — in typed codebases, the types define the contracts. Read types before reading implementations.

## Additional Resources

- **`references/pattern-extraction-guide.md`** — Step-by-step checklist for extracting all pattern types from a codebase
- **`references/architecture-vocabulary.md`** — Reference of common architecture styles with code signatures to identify them