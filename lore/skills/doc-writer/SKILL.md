---
name: doc-writer
description: This skill should be used when the user asks to "document code", "generate docs", "write documentation", "create docs for module", "document this file", "add API docs", or any request to produce documentation for source code. Enforces mirror-structure docs that are written solely from actual code content — never assumed or inferred.
version: 1.0.0
---

# Doc Writer

## Purpose

Generate documentation that mirrors the source directory structure and is written **exclusively from actual code content**. Every documented method, class, parameter, and return type must be verifiable by reading the source file. Nothing is assumed or inferred.

## When to Use This Skill

- Documenting a module, file, or entire codebase
- Generating API documentation from source
- Creating or updating docs that track source structure
- Any request involving writing documentation for code

## Core Principles

1. **Mirror structure**: `docs/` mirrors `src/` exactly — same modules, same files, `.md` extension
2. **Code-only truth**: Every statement in docs must come from reading the actual source file
3. **No inference**: If the code doesn't make something explicit, the docs don't claim it
4. **No invention**: Never add descriptions for behavior that isn't in the code

## Directory Structure Rule

```
project/
├── docs/
│   ├── module_a/
│   │   ├── handler.md        ← documents src/module_a/handler
│   │   └── utils.md          ← documents src/module_a/utils
│   └── module_b/
│       └── service.md        ← documents src/module_b/service
└── src/
    ├── module_a/
    │   ├── handler.ts
    │   └── utils.ts
    └── module_b/
        └── service.ts
```

**Rules:**
- Every source file gets a corresponding `docs/<module>/<file>.md`
- Directory nesting in `docs/` matches `src/` exactly
- No docs files without a corresponding source file
- Root-level docs (README.md, CONTRIBUTING.md, etc.) are NOT governed by this skill — only `docs/` subdirectories that mirror `src/`

## Workflow

### Step 1: Map the Source Tree

Scan `src/` to build the full file list:

```
Glob("src/**/*.*")
```

Build the target docs structure from this list. Every source file maps to `docs/<same-path>.md`.

### Step 2: Read Each Source File Completely

**MANDATORY**: Read the entire source file before writing any documentation for it.

```
Read({ file_path: "src/module/file.ts" })
```

Do NOT:
- Skim file names and guess contents
- Copy-paste from existing docs without re-reading source
- Document based on function names alone
- Infer behavior from parameter names

### Step 3: Extract Only What the Code Shows

For each file, extract:

| Element | Source of Truth |
|---------|----------------|
| Function/method name | Exact name from code |
| Parameters | Exact names, types, and defaults from signature |
| Return type | Explicit return type or literal return statements |
| Description | What the code **demonstrably does** (control flow, operations, calls) |
| Errors/exceptions | Only those explicitly thrown or caught in code |
| Side effects | Only those visible in the code (DB writes, API calls, file I/O) |

**NEVER document:**
- Intended behavior not reflected in code
- "Should" or "will" statements about unwritten logic
- Assumed error handling that doesn't exist
- Performance characteristics not measured
- Security properties not enforced in code

### Step 4: Write the Doc File

Each `docs/<module>/<file>.md` follows this format:

```markdown
# <file_name>

> Source: `src/<module>/<file_name>.<ext>`

## Overview

[1-2 sentences describing what this file does, derived from its exports and logic]

## Exports

### `functionName(param1: Type, param2: Type): ReturnType`

[Description of what the function does based on its implementation]

**Parameters:**
- `param1` (`Type`) — [what the code uses it for]
- `param2` (`Type`, optional, default: `value`) — [what the code uses it for]

**Returns:** `ReturnType` — [what is actually returned based on code]

**Throws:**
- `ErrorType` — [condition from code that triggers it]

---

### `ClassName`

[Description based on class implementation]

#### Constructor

`new ClassName(param: Type)`

#### Methods

##### `methodName(param: Type): ReturnType`

[Description from implementation]

---

## Internal Functions

### `_helperName(param: Type): ReturnType`

[Document private/internal functions too — they exist in the code]

## Constants / Configuration

| Name | Value | Usage |
|------|-------|-------|
| `CONSTANT_NAME` | `"value"` | [where it's used in this file] |
```

### Step 5: Verify Completeness

After writing docs for a file, verify:

- [ ] Every exported function/class/constant is documented
- [ ] Every parameter matches the actual signature exactly
- [ ] Every return type matches the code
- [ ] No descriptions claim behavior absent from the code
- [ ] The docs path mirrors the source path
- [ ] Internal/private functions are documented if they contain non-trivial logic

### Step 6: Create Missing Directories

Ensure the `docs/` directory tree mirrors `src/` before writing files:

```bash
# For each module directory in src/, ensure docs/ has a matching directory
mkdir -p docs/<module_path>
```

## Prohibited Patterns

These patterns are **NEVER** acceptable in doc-writer output:

| Pattern | Why It's Prohibited |
|---------|-------------------|
| "This function likely..." | Inference, not evidence |
| "Should return..." | Speculation about intent |
| "Handles errors gracefully" | Vague; cite specific error handling code |
| "Validates input" | Only if validation code exists; cite it |
| "Thread-safe" / "Performant" | Architectural claims require evidence |
| Documenting a method not in the file | Invention |
| Copying descriptions from README | README is not source code |
| "See also: ..." to non-existent docs | Only link to docs that exist |

## Updating Existing Docs

When docs already exist:

1. **Read the source file** (not the existing doc)
2. **Write the doc from scratch** based on current source
3. **Diff against existing doc** to catch removed/renamed items
4. If a function was removed from source, remove it from docs
5. If a function was added to source, add it to docs

Never preserve documentation for code that no longer exists.

## Multi-File Workflow

When documenting an entire module or codebase:

1. Map the full `src/` tree
2. Process files in directory order (parent modules before children)
3. For each file: read source → write doc → verify
4. After all files: verify `docs/` structure mirrors `src/` exactly
5. Report any source files without corresponding docs

## Quick Reference

```
Source file exists?  →  Doc file must exist at mirror path
Code has function?   →  Doc must document it
Code lacks feature?  →  Doc must NOT mention it
Code changed?        →  Doc must be rewritten from source
Code deleted?        →  Doc must be deleted
```

## Remember

**Read the code. Write what it does. Nothing more. Nothing less.**
