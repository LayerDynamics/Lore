---
description: Find all TODO, FIXME, HACK, and XXX comments in the codebase. Groups by file, shows context, and categorizes by urgency.
argument-hint: Optional path or filter (e.g. "src/", "FIXME-only")
---

# TODO Finder

Find and organize all task markers in the codebase.

## Step 1: Search

Search the codebase (or `$ARGUMENTS` path if provided) for:

```
TODO, FIXME, HACK, XXX, NOTE, OPTIMIZE, REFACTOR, REVIEW
```

Exclude: `node_modules/`, `vendor/`, `.git/`, build output, lock files, `*.min.*`.

If `$ARGUMENTS` includes a filter like "FIXME-only", only search for that marker.

## Step 2: Extract Context

For each match, capture:
- File path and line number
- The full comment text (may span multiple lines)
- The surrounding function or block name if identifiable
- Author/date if present in the comment (e.g., `TODO(ryan):` or `FIXME 2024-01-15`)

## Step 3: Categorize

| Category | Markers | Urgency |
|----------|---------|---------|
| **Bugs** | FIXME, BUG | High |
| **Security** | HACK, XXX with security context | High |
| **Tasks** | TODO | Medium |
| **Cleanup** | REFACTOR, OPTIMIZE, REVIEW | Low |
| **Notes** | NOTE | Info |

## Step 4: Report

```
## TODOs — [N items across M files]

### By Urgency

**High (N)**
- file:line — FIXME: description
- file:line — HACK: description

**Medium (N)**
- file:line — TODO: description

**Low (N)**
- file:line — REFACTOR: description

### By File
[grouped listing for navigation]

### Stats
- Total: N markers
- Oldest: [if datestamps found]
- Most cluttered file: [file with most markers]
```
