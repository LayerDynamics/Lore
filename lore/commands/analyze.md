---
description: Analyze codebase architecture and patterns — maps conventions, extension points, and similar features without external research. Use when a developer needs to understand an existing codebase's structure before implementing something.
argument-hint: [path] [--focus <area>]
---

# Codebase Analysis

Perform a focused codebase pattern analysis. No external research — pure codebase exploration.

**Arguments:** $ARGUMENTS

## Workflow

### Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- Target path: explicit path provided, or use the current working directory
- Focus area: `--focus <area>` (e.g., `--focus middleware`, `--focus authentication`, `--focus rendering`) — optional

### Step 2: Load the Codebase Pattern Analysis Skill

Invoke the `feature-research:codebase-pattern-analysis` skill for orientation and extraction methodology.

### Step 3: Launch codebase-pattern-scout Agent

Launch the `codebase-pattern-scout` agent with:
- The target path
- The focus area (if provided)
- Instruction to produce the full structured output format

Wait for the agent to return findings.

### Step 4: Read Key Files

Read the 5-10 key files the agent identified as most important. Don't rely solely on the agent's summaries — reading actual code reveals details that are missed in summaries.

### Step 5: Synthesize and Present

Present the structured findings from the agent plus insights from the direct file reads:

1. **Architecture Style**: What architectural pattern the codebase uses
2. **Domain Boundaries**: The major areas and how they're separated
3. **Similar Features Found**: Exact file paths, what makes them similar
4. **Extension Points**: Where a new feature would plug in
5. **Naming Conventions**: Tables showing actual patterns from the code
6. **Testing Patterns**: How similar features are tested
7. **Key Files**: Ordered list for a developer to read to get oriented

## Tips

- `--focus` narrows the search to a specific concept (e.g., `--focus storage` focuses on storage-related code)
- Without `--focus`, the agent maps the full architecture
- Results can feed directly into `/feature-research:research` or `/feature-research:blueprint`
- To search for where a specific concept appears: use `Grep` directly before launching the agent
