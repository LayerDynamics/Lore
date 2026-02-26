---
name: deep-research
description: Multi-source deep research combining codebase analysis, external documentation, academic papers, and community knowledge. Use for complex topics requiring thorough understanding before implementation — goes deeper and wider than standard research.
user_invocable: true
argument-hint: <topic or question> [--sources code|web|all] [--output <path>]
allowed-tools: ["Glob", "Grep", "Read", "WebFetch", "WebSearch", "Task", "Write", "AskUserQuestion"]
---

# Deep Research

Conduct comprehensive, multi-source research on a topic, producing a structured research document with citations and confidence assessments.

**Arguments:** $ARGUMENTS

## Workflow

### Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- Research topic or question (required — everything before flags)
- Sources: `--sources code` (codebase only), `--sources web` (external only), `--sources all` (default — both)
- Output path: `--output <path>` (default: `.feature-research/deep-[topic]-[YYYY-MM-DD].md`)

If the topic is absent or ambiguous, ask for clarification:
> What specific question are you trying to answer? For example:
> - "How do other projects implement plugin hot-reloading?"
> - "What are the security implications of WebSocket authentication?"
> - "Best practices for CLI plugin architectures in Node.js"

### Step 2: Frame the Research

Before searching, define the research frame:

1. **Core question**: Restate the topic as a precise, answerable question
2. **Sub-questions**: Break into 3-5 specific sub-questions that, answered together, fully address the core question
3. **Known context**: What do we already know from the codebase or conversation?
4. **Knowledge gaps**: What specific information is missing?

Present the frame to the user for confirmation before proceeding.

### Step 3: Codebase Research (if sources include code)

Launch the `codebase-pattern-scout` agent with:
- The core question and sub-questions
- Instruction to find all relevant patterns, implementations, and conventions

Additionally, search directly for:
- Related configuration files
- Existing documentation on the topic
- Test files that demonstrate expected behavior
- Comments or TODOs mentioning the topic

### Step 4: External Research (if sources include web)

For each sub-question, search for authoritative sources:

#### 4a. Documentation and Standards
- Official documentation for relevant frameworks/libraries
- RFCs, specifications, or standards documents
- API documentation

#### 4b. Community Knowledge
- GitHub issues and discussions in relevant repositories
- Stack Overflow answers with high vote counts
- Blog posts from recognized experts or official project blogs

#### 4c. Academic and Technical Papers
- Search for relevant papers if the topic has academic depth
- Look for benchmarks, comparisons, or formal analyses

For each source found:
- Extract the key findings relevant to our sub-questions
- Note the source URL and date
- Assess credibility (official docs > expert blog > random post)

### Step 5: Synthesize Findings

Combine codebase and external findings into a structured analysis:

For each sub-question:
1. **What the codebase shows**: Current implementation patterns and conventions
2. **What external sources say**: Best practices, common approaches, gotchas
3. **Conflicts or gaps**: Where codebase practice diverges from external recommendations
4. **Confidence level**: High (multiple sources agree) / Medium (some agreement) / Low (conflicting or sparse info)

### Step 6: Produce Recommendations

Based on the synthesis:

1. **Recommended approach**: The approach best supported by evidence, adapted to the codebase's existing patterns
2. **Alternative approaches**: Other viable options with trade-off analysis
3. **Risks and mitigations**: What could go wrong and how to handle it
4. **Open questions**: What we still don't know and how to find out

### Step 7: Write Research Document

Save to the output path with this structure:

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
- [Source 2](URL) — [what it contributed]
- [Codebase: file:line] — [what it showed]

## Open Questions
- [Question that needs further investigation or user input]
```

### Step 8: Present Summary

After saving the document:

1. **Key findings** (3-5 bullet points)
2. **Primary recommendation** (1 sentence)
3. **Top risk** (1 sentence)
4. **Document location**
5. **Suggested next steps**:
   - "Run `/research:blueprint [topic]` to generate an implementation plan from these findings"
   - "Ask me to deep-dive into any specific sub-question"
   - "Run `/research:analyze [path]` to explore the codebase patterns further"
