---
description: Explain any code, file, function, concept, or architecture in the current project. Reads the target and gives a clear, layered explanation — from purpose down to implementation details.
argument-hint: File path, function name, concept, or question to explain
allowed-tools: ["Read", "Grep", "Glob", "Bash"]
---

# Explain

Give a clear explanation of whatever `$ARGUMENTS` refers to.

## Determine What to Explain

`$ARGUMENTS` can be:
- A file path (`src/auth/session.ts`)
- A function or class name (`SessionManager`, `verifyToken`)
- An architectural concept (`how does the proxy cache work?`)
- A question (`why does the render pipeline need a compositor?`)
- Empty (explain the current project/working directory)

## Step 1: Locate the Target

**If a file path:** Read it directly.

**If a function/class name:**
```bash
grep -rn "class $ARGUMENTS\|function $ARGUMENTS\|fn $ARGUMENTS\|def $ARGUMENTS\|const $ARGUMENTS\|let $ARGUMENTS" \
  --include="*.ts" --include="*.js" --include="*.py" --include="*.rs" . 2>/dev/null | head -10
```
Then read the file(s) found.

**If a concept or question:** Read CLAUDE.md, README.md, and any relevant architecture docs first, then find the relevant source files.

**If empty:** Explain the project at a high level using CLAUDE.md and the top-level directory structure.

## Step 2: Read Supporting Context

- Read callers of the function (how is it used?)
- Read types/interfaces it depends on
- Read tests that validate it

## Step 3: Explain in Layers

Structure the explanation:

```
## [Target Name]

**What it is**: [One sentence — the role it plays in the system]

**Why it exists**: [The problem it solves / why this approach was chosen]

**How it works**: [Step-by-step walkthrough of the key logic, referencing
actual line numbers and variable names from the code]

**Key dependencies**: [What it relies on, what relies on it]

**Edge cases / gotchas**: [Anything non-obvious, footguns, or important
behavior that isn't obvious from the signature alone]
```

**Depth calibration:**
- Simple utility function: 3-5 sentences total
- Module/component: full structured explanation
- Architecture concept: paragraph per layer, with code references
- Empty $ARGUMENTS (whole project): architecture diagram in text + 3-5 key design decisions

Use code snippets from the actual file to illustrate, not invented examples.
