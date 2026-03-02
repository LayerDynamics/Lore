---
description: Scan the codebase for technical debt — TODOs, FIXMEs, HACKs, deprecated usage, dead code, and complexity hotspots. Produces a prioritized catalog.
argument-hint: Optional path or scope (e.g. "src/", "critical-only")
---

# Tech Debt Catalog

Scan for and catalog technical debt in the codebase.

## Step 1: Scan for Markers

Search the codebase (or `$ARGUMENTS` path if provided) for debt markers:

```
TODO, FIXME, HACK, XXX, WORKAROUND, TEMP, TEMPORARY
@deprecated, DEPRECATED
"for now", "in a real implementation", "placeholder"
NotImplementedError, unimplemented!, todo!(), panic!("not implemented")
```

Exclude: `node_modules/`, `vendor/`, `.git/`, build output, lock files.

## Step 2: Detect Structural Debt

Look for:
- **Dead exports** — exported functions with zero internal callers
- **Duplicate logic** — near-identical blocks across files
- **Large files** — files over 500 lines that likely need splitting
- **Deep nesting** — functions with 4+ levels of indentation
- **Missing error handling** — bare catches, empty catch blocks, swallowed errors
- **Outdated dependencies** — if package.json/Cargo.toml/requirements.txt exists, note obviously old major versions

## Step 3: Prioritize

Score each item:

| Priority | Criteria |
|----------|----------|
| **P0 — Critical** | Security risk, data loss potential, broken functionality |
| **P1 — High** | Blocks feature work, causes recurring bugs, confuses every new reader |
| **P2 — Medium** | Slows development, adds cognitive load, will get worse over time |
| **P3 — Low** | Cosmetic, minor cleanup, nice-to-have |

## Step 4: Report

```
## Tech Debt Report — [scope]

### Summary
- P0: N items
- P1: N items
- P2: N items
- P3: N items

### P0 — Critical
[file:line — description — suggested fix]

### P1 — High
[file:line — description — suggested fix]

### P2 — Medium
[file:line — description]

### P3 — Low
[file:line — description]

### Quick Wins (< 30 min each)
[items that can be fixed immediately]
```

If `$ARGUMENTS` includes "critical-only", only report P0 and P1.
