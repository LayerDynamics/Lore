---
name: request-context-gatherer
description: Ensures the model reviews all files associated with or related to a request and its downstream effects before making changes. Use when starting any code modification task to prevent blind edits.
---

# Request Context Gatherer

Before touching any code, understand everything the change will affect.

## The Problem This Solves

Claude frequently:
- Edits a file without reading its imports, callers, or dependents
- Breaks downstream code because it didn't check what depends on the changed code
- Misses that a function is used in 5 other places
- Changes an interface without updating its implementations
- Modifies a module without checking its tests
- Makes changes that work in isolation but break the system

## The Rule

**Before modifying any file, read that file AND every file connected to it. Trace the impact before making the change.**

## Workflow

### Step 1: Read the Target File

Read the file you're about to modify. Fully. Not just the function — the whole file.

```
Read the entire file, noting:
- All exports (functions, classes, types, constants)
- All imports (what this file depends on)
- The module's role in the system
```

### Step 2: Find Everything That Imports or Uses It

Search for all consumers of the file/module you're changing:

```
Grep for:
- The filename in import statements
- Exported function/class/type names used elsewhere
- The module path referenced in configs, tests, or other files
```

Every file returned is a potential downstream impact. Read each one to understand how it uses the thing you're changing.

### Step 3: Find What It Depends On

Read the files this module imports from. If your change alters how a dependency is used, make sure the dependency supports it.

### Step 4: Find the Tests

Search for test files related to the module:

```
Look for:
- test files with the same name (foo.test.ts, test_foo.py)
- test files that import the module
- integration tests that exercise the code path
```

Read the tests to understand expected behavior before changing it.

### Step 5: Trace the Call Chain

For the specific function/method being changed, trace who calls it and what it calls:

```
1. Find all callers of the function (Grep for function name)
2. Read each caller to understand what arguments they pass and what they expect back
3. Check if any caller depends on specific return shape, side effects, or error behavior
4. Find what the function calls internally — will your change affect those downstream calls?
```

### Step 6: Check for Interface Contracts

If you're changing:
- **A function signature** — find every call site and update them all
- **A type/interface** — find every implementation and usage
- **A config shape** — find every place it's read
- **An API endpoint** — find every client that calls it
- **A database schema** — find every query that touches those columns

### Step 7: Map the Impact

Before writing any code, you should be able to answer:

1. **What files will this change touch directly?** (list them)
2. **What files might break if I get this wrong?** (list them)
3. **What tests cover this code path?** (list them)
4. **Are there any callers that assume specific behavior I'm about to change?** (list them)
5. **Does this change require updates to types, configs, docs, or tests?** (list what)

If you can't answer these, you haven't gathered enough context. Keep reading.

## Minimum Context by Change Type

### Renaming a function/variable
- Read: the file, all files that import/use it, all test files
- Update: every reference

### Changing a function's signature
- Read: the file, every call site, every test
- Update: every caller, every test, any documentation

### Modifying return values or behavior
- Read: the file, every caller (to see what they expect), all tests
- Update: callers if the contract changed, tests to match new behavior

### Adding a new dependency/import
- Read: the dependency's API/docs, the file you're adding it to
- Verify: the dependency is installed, the import path is correct

### Deleting code
- Read: the file, search for all references to the deleted code
- Verify: nothing else depends on it — if it does, update or ask first

### Changing configuration
- Read: every file that reads the config value
- Verify: all consumers handle the new shape/value

## Anti-Patterns

### Editing blind
Making a change without reading the file first. Never acceptable.

### Reading only the target
Reading the file you're changing but not its callers/dependents. Leads to breakage.

### Assuming no downstream impact
"It's just a small change" — small changes in shared code have large blast radius. Verify.

### Skipping tests
Not reading or running tests after a change. Tests exist to catch exactly the kind of breakage context-gathering prevents.

## Quick Reference

For every change:
1. Read the target file (fully)
2. Grep for imports/usages of what you're changing
3. Read every file that uses it
4. Read the tests
5. Trace the call chain
6. Map the impact
7. THEN make the change
8. Run the tests after
