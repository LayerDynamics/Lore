---
description: Full research workflow with three depth modes — quick codebase-only analysis, standard five-phase feature research with blueprints, or deep multi-source investigation with external docs, papers, and community knowledge. Use when a developer needs to understand how to implement something before writing code.
argument-hint: <topic or feature> [--depth quick|standard|deep] [--sources code|web|all] [--output <path>]
---

# Research

Conduct structured research to understand how to implement a feature or investigate a topic. Supports three depth modes from lightweight codebase analysis to comprehensive multi-source investigation.

**Initial request:** $ARGUMENTS

## Workflow

### Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- Topic or feature description (required — everything before flags)
- Depth: `--depth quick`, `--depth standard`, or `--depth deep` (default: `standard`)
- Sources (deep mode only): `--sources code`, `--sources web`, `--sources all` (default: `all`)
- Output path: `--output <path>` (default: `.feature-research/[kebab-topic]-[YYYY-MM-DD].md`)

If the topic is absent or ambiguous, ask for clarification before proceeding.

### Step 2: Route to Depth Mode

Based on `--depth`, follow the appropriate workflow below.

---

## Quick Mode (`--depth quick`)

Lightweight codebase-only research. Use for small features, time-constrained research, or when you just need to know where things are.

### Q1. Frame the Question
- Write a one-sentence definition of what you're researching
- Identify 2-3 specific unknowns

### Q2. Codebase Analysis
Launch the `codebase-pattern-scout` agent with:
- The topic and specific unknowns
- The most relevant area of the codebase

Get back: architecture style, similar features (with file paths), extension points, naming conventions, key files to read.

### Q3. Read Key Files
Read the files the agent identified. Don't rely on summaries alone.

### Q4. Produce Simplified Blueprint
Use the `blueprint-generator` agent to produce:
- Files to touch + rough approach
- Key conventions to follow
- Immediate next step

Save to `.feature-research/[topic]-[YYYY-MM-DD].md`.

### Q5. Present Summary
- What was found (2-3 bullets)
- Location of the report
- Suggested next step

---

## Standard Mode (`--depth standard`)

Full five-phase feature research. Default for most features — produces a research report and implementation blueprint.

### S1. Frame the Research Question

Before touching any code or docs, clarify:

1. **What is the feature?** Write a one-sentence definition: "This feature [verb] [object] so that [user/system benefit]."
2. **What does "done" look like?** Identify the acceptance criteria or observable behavior.
3. **What's the scope?** New file(s) only, or modifying existing behavior? Does it touch the public API?
4. **What's unknown?** List the things you don't know yet.

If the feature description is ambiguous, ask the user for clarification. A clear question is faster than wrong research.

### S2. Codebase Analysis

**Invoke the `codebase-pattern-scout` agent** with:
- The feature description from S1
- The specific unknowns from S1
- Which area of the codebase seems most relevant

Get back: architecture style, domain boundaries, similar features with file paths, extension points, naming conventions, key files to read.

After the agent returns, **read the key files it identified**. Use Grep for concept keywords, Glob for file patterns, Read for specific files.

### S3. External Research

**Invoke the `external-research-synthesizer` agent** when the feature involves:
- Integrating a third-party library or framework
- Implementing an external protocol (WebSocket, OAuth, etc.)
- Applying a pattern from outside the codebase
- Using browser/platform APIs

Skip for pure internal business logic.

Get back: best practices, relevant API signatures, working code examples, known pitfalls, recommended approach.

### S4. Synthesize Findings

Compare codebase analysis against external research:

1. **Identify alignment** — where external best practices match existing code
2. **Identify gaps** — where external practices require new patterns
3. **Identify conflicts** — where external patterns would break conventions
4. **Resolve gaps and conflicts** — adapt, introduce with documentation, or find native alternatives

Document all decisions and reasoning. These are the most important outputs.

### S5. Produce Blueprint

**Invoke the `blueprint-generator` agent** with synthesized findings.

The blueprint includes:
- Files to create (full paths and purpose)
- Files to modify (specific change descriptions)
- New interfaces/types to define
- Function signatures for main new functions
- Data flow description
- Test strategy
- Risk register
- Open questions

Save research report and blueprint to `.feature-research/`.

### Present Summary
- Key findings (2-3 bullets)
- Location of report and blueprint
- Top 1-3 risks identified
- Open questions needing user input
- Suggested next step

---

## Deep Mode (`--depth deep`)

Comprehensive multi-source research combining codebase analysis, external documentation, academic papers, and community knowledge. Use for complex topics, architectural changes, or high-risk additions.

### D1. Frame the Research

1. **Core question**: Restate the topic as a precise, answerable question
2. **Sub-questions**: Break into 3-5 specific sub-questions that together fully address the core question
3. **Known context**: What do we already know from the codebase or conversation?
4. **Knowledge gaps**: What specific information is missing?

Present the frame to the user for confirmation before proceeding.

### D2. Codebase Research (if sources include code)

Launch the `codebase-pattern-scout` agent with:
- The core question and sub-questions
- Instruction to find all relevant patterns, implementations, and conventions

Additionally, search directly for:
- Related configuration files
- Existing documentation on the topic
- Test files that demonstrate expected behavior
- Comments or TODOs mentioning the topic

### D3. External Research (if sources include web)

For each sub-question, search for authoritative sources:

#### Documentation and Standards
- Official documentation for relevant frameworks/libraries
- RFCs, specifications, or standards documents
- API documentation

#### Community Knowledge
- GitHub issues and discussions in relevant repositories
- Stack Overflow answers with high vote counts
- Blog posts from recognized experts or official project blogs

#### Academic and Technical Papers
- Search for relevant papers if the topic has academic depth
- Look for benchmarks, comparisons, or formal analyses

For each source:
- Extract key findings relevant to sub-questions
- Note the source URL and date
- Assess credibility (official docs > expert blog > random post)

### D4. Synthesize Findings

For each sub-question:
1. **What the codebase shows**: Current implementation patterns and conventions
2. **What external sources say**: Best practices, common approaches, gotchas
3. **Conflicts or gaps**: Where codebase practice diverges from external recommendations
4. **Confidence level**: High (multiple sources agree) / Medium (some agreement) / Low (conflicting or sparse info)

Compare multiple architectural approaches. Produce a full risk matrix.

### D5. Produce Recommendations

1. **Recommended approach**: Best supported by evidence, adapted to codebase patterns
2. **Alternative approaches**: Other viable options with trade-off analysis
3. **Risks and mitigations**: Full risk matrix with likelihood, impact, and mitigation
4. **Migration/rollout considerations**: How to introduce the change safely
5. **Open questions**: What we still don't know

### D6. Write Research Document

Save to output path:

```markdown
# Deep Research: [Topic]
**Date**: [YYYY-MM-DD]
**Confidence**: [High | Medium | Low]

## Research Question
[Core question]

## Key Findings

### [Sub-question 1]
**Finding**: [summary]
**Evidence**: [codebase patterns, external sources with URLs]
**Confidence**: [level]

### [Sub-question 2]
...

## Synthesis
[How findings fit together, conflicts resolved, overall picture]

## Recommendations
1. [Primary recommendation with rationale]
2. [Alternative with trade-offs]

## Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| ... | ... | ... | ... |

## Sources
- [Source 1](URL) — [what it contributed]
- [Codebase: file:line] — [what it showed]

## Open Questions
- [Question that needs further investigation or user input]
```

### Present Summary
- Key findings (3-5 bullets)
- Primary recommendation (1 sentence)
- Top risk (1 sentence)
- Document location
- Suggested next steps

---

## Output Location

All research outputs go to `.feature-research/` in the project root:
- Quick/Standard reports: `.feature-research/[kebab-topic]-[YYYY-MM-DD].md`
- Blueprints: `.feature-research/[kebab-topic]-blueprint-[YYYY-MM-DD].md`
- Deep research: `.feature-research/deep-[kebab-topic]-[YYYY-MM-DD].md`

## Tips

- For internal-only features, skip external research even in standard mode
- The research report is a durable artifact — reference it across sessions
- If existing research exists in `.feature-research/`, load it before running new research to avoid redundant work
- Quick mode takes minutes; standard takes 15-20 minutes; deep can take 30+ minutes
- Use `--sources code` in deep mode when external research isn't relevant
- Results feed directly into implementation — follow the blueprint
