---
description: Convert research notes or findings into a structured implementation blueprint. Use when research is complete and a developer needs a precise, file-level implementation plan.
argument-hint: <feature-description> [--output markdown|json]
---

# Implementation Blueprint Generator

Convert research findings into a precise, file-level implementation blueprint.

**Arguments:** $ARGUMENTS

## Workflow

### Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- Feature description (required)
- Output format: `--output markdown` (default) or `--output json`

### Step 2: Load the Implementation Blueprint Skill

Invoke the `feature-research:implementation-blueprint` skill for blueprint structure and quality standards.

### Step 3: Find Existing Research

Check `.feature-research/` for research findings:

```
Glob: .feature-research/*.md
```

- If files exist matching the feature description: read them — they are the primary input
- If no matching files exist: ask the user to provide research context, or offer to run `/feature-research:research` first

### Step 4: Launch implementation-blueprint-generator Agent

Provide the agent with:
- The feature description
- All research findings found in Step 3 (or provided by user)
- The requested output format

The agent will produce the complete blueprint and save it to `.feature-research/[feature-name]-blueprint-[YYYY-MM-DD].md`.

### Step 5: Present Summary

After the blueprint is saved, report to the user:

1. Blueprint location
2. Files to create: count and list
3. Files to modify: count and list
4. Top 3 risks from the risk register
5. Open questions (numbered list) — **flag any that need user input before implementation can begin**

If open questions require user input, ask them before ending the session.

## Tips

- Run `/feature-research:research` before this command for comprehensive research + blueprint in one workflow
- Use this command alone when you've done your own research and need it structured
- The blueprint references specific files — verify file paths exist before implementation starts
- If a blueprint already exists for this feature, the agent will note what's changed since last time
