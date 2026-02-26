---
description: Full feature research workflow — analyze codebase patterns, consult external docs, and produce an implementation blueprint. Use when a developer needs to understand how to implement a new feature before writing any code.
argument-hint: <feature-description> [--depth quick|standard|deep]
allowed-tools: ["Glob", "Grep", "Read", "WebFetch", "WebSearch", "Task", "Write"]
---

# Feature Research

Conduct structured research to understand how to implement a new feature. Save all outputs to `.feature-research/` in the current project directory.

**Initial request:** $ARGUMENTS

## Workflow

### Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- Feature description (required — everything before flags)
- Depth flag: `--depth quick`, `--depth standard`, or `--depth deep` (default: `standard`)

If the feature description is absent or ambiguous, ask for clarification before proceeding.

### Step 2: Load the Feature Research Skill

Invoke the `feature-research:feature-research` skill. Follow it exactly for the selected depth level.

### Step 3: Execute Research Phases

Follow the skill through all applicable phases for the selected depth:

**Quick** (--depth quick):
- Phase 1: Frame the research question
- Phase 2: Codebase analysis via `codebase-pattern-scout` agent only
- Skip Phase 3 (no external research)
- Simplified blueprint via `implementation-blueprint-generator` agent

**Standard** (default):
- Phase 1: Frame the research question
- Phase 2: Codebase analysis via `codebase-pattern-scout` agent
- Phase 3: External research via `external-research-synthesizer` agent (if external dependencies identified)
- Phase 4: Synthesize findings
- Phase 5: Full blueprint via `implementation-blueprint-generator` agent

**Deep** (--depth deep):
- All 5 phases
- Multiple architectural approaches compared in Phase 4
- Full risk matrix in the blueprint
- Consider migration/rollout implications

### Step 4: Save Research Output

Create the `.feature-research/` directory in the project root if it doesn't exist.

Save the research report to:
`.feature-research/[kebab-feature-name]-[YYYY-MM-DD].md`

The `implementation-blueprint-generator` agent will save the blueprint alongside it.

### Step 5: Present Summary

After completing research, summarize:
- What was found (2-3 bullet points of key findings)
- Location of the research report and blueprint
- Top 1-3 risks identified
- Any open questions that need user input before implementation
- Suggested next step: "Run `/feature-research:blueprint [feature]` to regenerate the blueprint, or begin implementation following the blueprint."

## Tips

- For internal-only features (no library/protocol integration), skip external research even in standard mode
- The research report is a durable artifact — reference it across sessions
- If existing research exists in `.feature-research/`, load it before running new research to avoid redundant work
