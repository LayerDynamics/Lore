---
name: reading-unfamiliar-code
description: This skill should be used when the user asks to "understand this codebase", "explain how this works", "I'm new to this project", "trace how X flows through the system", "what does this module do", "map the architecture", or when Claude needs to quickly orient in an unfamiliar project before making changes.
---

# Reading Unfamiliar Code Efficiently

## Entry Points — Read These First

Before reading any source files, orient with project-level documents:

1. **`CLAUDE.md`** — Claude-specific project context (always read if present)
2. **`README.md`** — Public project description
3. **`package.json` / `Cargo.toml` / `pyproject.toml` / `deno.json`** — Dependencies reveal what the project uses
4. **Main entry points** — `main.ts`, `index.ts`, `main.rs`, `app.py`, etc.

This takes 5 minutes and gives 80% of the orientation needed.

## Map the Structure Before Reading Files

```bash
# Top-level directory shape
ls -la

# Find entry points
find . -name "main.*" -o -name "index.*" -o -name "mod.rs" | grep -v "node_modules\|.git\|target\|dist" | head -20

# Find the biggest files (usually the most important)
find . -name "*.ts" -o -name "*.py" -o -name "*.rs" | grep -v "node_modules\|.git\|target\|dist" | xargs wc -l 2>/dev/null | sort -rn | head -10
```

## Trace a Request / Data Flow

The most efficient way to understand a system is to follow one complete path from input to output:

1. Find where user input enters (HTTP handler, CLI arg, event listener)
2. Follow the function call chain one step at a time
3. Note where data transforms, where side effects happen, where errors branch
4. Note what exits (response, file, event)

Use Grep to follow call chains:
```bash
# Find where a function is called
grep -rn "functionName(" --include="*.ts" --include="*.rs" .

# Find where a type is used
grep -rn ": TypeName\|<TypeName>" --include="*.ts" .
```

## Pattern Recognition Shortcuts

**Layer architecture** (most backends):
- `routes/` or `handlers/` = HTTP boundary
- `services/` or `domain/` = business logic
- `repositories/` or `storage/` = data access
- `types/` or `models/` = data shapes

**Event-driven systems:**
- Find the event bus / emitter
- Map: which events exist, who emits them, who listens
- Events are the "seams" — understand them, understand the system

**State machines:**
- Find enum or const with state names
- Find transition logic (usually a switch/match on current state)
- Draw the state diagram mentally: what triggers what

## When to Stop Reading and Start Writing

Stop researching when you can answer these:
1. Where does the code I need to change live?
2. What inputs does it receive and what does it return?
3. What are the 2-3 most likely consequences of changing it?
4. Are there tests I should run after changing it?

Spending more than 20 minutes reading before writing usually means over-researching. Make the change, run the tests, iterate.