---
description: Analyze codebase architecture, patterns, and conventions — orient in unfamiliar code, map patterns and conventions, and assess architecture quality. Use when a developer needs to understand an existing codebase's structure before implementing something.
argument-hint: [path] [--focus <area>] [--phase orient|patterns|architecture|all]
---

# Codebase Analysis

Perform structured codebase analysis across three phases: orientation, pattern mapping, and architectural assessment.

**Arguments:** $ARGUMENTS

## Workflow

### Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- Target path: explicit path provided, or use the current working directory
- Focus area: `--focus <area>` (e.g., `--focus middleware`, `--focus authentication`) — optional
- Phase: `--phase orient`, `--phase patterns`, `--phase architecture`, or `--phase all` (default: `all`)

### Step 2: Execute Phases

Run the requested phase(s) in order. Each phase builds on the previous.

---

## Phase 1: Orient

Rapidly orient in the codebase to understand what it is and how it's structured.

### 1a. Read Entry Points

Before reading any source files, orient with project-level documents:

1. **`CLAUDE.md`** — Claude-specific project context (always read if present)
2. **`README.md`** — Public project description
3. **`package.json` / `Cargo.toml` / `pyproject.toml` / `deno.json`** — Dependencies reveal what the project uses
4. **Main entry points** — `main.ts`, `index.ts`, `main.rs`, `app.py`, etc.

This takes 5 minutes and gives 80% of the orientation needed.

### 1b. Map the Structure

Scan the top-level directory structure and note the major directories. Identify:
- Entry points: `main.ts`, `mod.ts`, `index.ts`, `server.ts`, or whatever starts the system
- The primary manifest and its task definitions / dependencies
- The biggest files (usually the most important)

### 1c. Trace a Request / Data Flow

Follow one complete path from input to output:

1. Find where user input enters (HTTP handler, CLI arg, event listener)
2. Follow the function call chain one step at a time
3. Note where data transforms, where side effects happen, where errors branch
4. Note what exits (response, file, event)

Use Grep to follow call chains — find where functions are called, where types are used.

### 1d. Readiness Check

Stop orienting when you can answer:
1. Where does the code I need to understand live?
2. What inputs does it receive and what does it return?
3. What are the major layers / boundaries?
4. Are there tests I should look at?

**Output**: Brief summary of project purpose, tech stack, entry points, and directory structure.

---

## Phase 2: Map Patterns

Systematically extract the codebase's conventions and repeating patterns.

### 2a. Naming Conventions

Map the naming patterns from actual code:
- File names: kebab-case, PascalCase, snake_case?
- Class/interface names: `FooManager`, `FooService`, `FooController`, `IFoo`?
- Function names: `getFoo`, `fetchFoo`, `loadFoo`, `readFoo`?
- Event names: camelCase strings, SCREAMING_SNAKE, enum values?
- Test files: `foo.test.ts`, `foo.spec.ts`, `foo_test.ts`?

### 2b. Module and File Organization

- Where do interfaces/types live? Co-located or centralized?
- Where do tests live? Alongside source or in a separate `tests/` tree?
- How are re-exports organized? `mod.ts`, `index.ts`, barrel files?
- Are there domain-specific subdirectory patterns?

### 2c. Key Abstractions

Look for repeating structural patterns:
- Base classes that features extend
- Interfaces that features implement
- Factory functions that create instances
- Registry patterns where things register themselves
- Pipeline stages that can be added

### 2d. Extension Points

Find the "hooks" where new features can be plugged in:
- Interfaces/abstract classes designed to be extended
- Configuration objects that accept arrays of things
- `register()`, `add()`, `use()` methods
- Plugin/middleware/handler registration points
- Feature flags or capability checks

### 2e. Error Handling Patterns

- What error types are thrown?
- Are errors wrapped in domain-specific classes?
- How are async errors surfaced?
- What's the boundary between "recoverable" and "fatal" errors?

### 2f. Testing Patterns

- Test file structure and helper patterns
- Common mock/stub setup patterns
- What gets unit-tested vs integration-tested?
- How are external dependencies mocked?

### 2g. Finding Similar Existing Features

Use these search strategies to find reference implementations:

- **By concept**: Grep for conceptual keywords, related types/interfaces
- **By structure**: Look for files in the same directory, existing implementations of the same base class/interface
- **By usage**: Find where the feature's natural home is used, trace from public API inward

Once found, read similar features from **outside in**: public API → types → implementation → tests.

**Output**: Tables of naming patterns, list of key abstractions and extension points, similar features with file paths.

---

## Phase 3: Analyze Architecture

Assess the overall architecture, component relationships, and quality.

### 3a. Launch codebase-pattern-scout Agent

Launch the `codebase-pattern-scout` agent with:
- The target path
- The focus area (if provided)
- Instruction to produce the full structured output format

Wait for the agent to return findings.

### 3b. Read Key Files

Read the 5-10 key files the agent identified as most important. Don't rely solely on the agent's summaries — reading actual code reveals details that are missed in summaries.

### 3c. Identify the Natural Home

For any new feature being considered, determine where it belongs:
1. What layer does it belong to? (network, storage, rendering, business logic, presentation)
2. Does a similar concept already have a home?
3. What does it depend on, and what depends on it?
4. What directory naming convention would it follow?

If unclear, choose the most conservative location — close to existing similar code rather than creating new structure.

### 3d. Synthesize and Present

Present structured findings:

```
## Codebase Analysis: [Target / Focus Area]

### Architecture Style
[Brief description: layered, hexagonal, event-driven, pipeline, etc.]

### Domain Boundaries
[The major areas and how they're separated]

### Similar Features Found
- [Feature name]: [file path] — most similar because [reason]

### Extension Points
- [Extension point name]: [file path:line] — [how to use it]

### Naming Conventions
| Category | Pattern | Example |
|----------|---------|---------|
| Files | [pattern] | [example] |
| Classes | [pattern] | [example] |
| Functions | [pattern] | [example] |
| Tests | [pattern] | [example] |

### Testing Patterns
[How similar features are tested]

### Key Files to Read
[Ordered list of 5-10 files, most important first, with one-line reason each]

### Where to Add New Features
[Specific directory path, with reasoning]

### Open Questions
[Things that aren't clear from static analysis alone]
```

---

## Common Pitfalls

**Reading too deeply too fast** — resist the urge to fully understand one file before getting orientation. Breadth first, then depth.

**Assuming patterns from other projects** — every codebase has its own conventions. Extract from actual code, not assumptions.

**Missing the test patterns** — test structure reveals a lot about how the codebase thinks about components. Always check tests for similar features.

**Ignoring the type system** — in typed codebases, the types define the contracts. Read types before reading implementations.

**Over-researching** — spending more than 20 minutes reading before writing usually means diminishing returns. Make a change, run the tests, iterate.

## Tips

- `--focus` narrows the search to a specific concept (e.g., `--focus storage` focuses on storage-related code)
- Without `--focus`, the analysis maps the full architecture
- `--phase orient` is fastest — use when you just need to get your bearings
- `--phase patterns` is useful when you know the codebase but need convention reference
- Results can feed directly into the `research` skill or implementation work
- To search for where a specific concept appears: use `Grep` directly before launching analysis
