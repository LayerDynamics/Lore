---
name: web-research
description: "Use this skill for deep, exhaustive web research on any topic. Trigger phrases: 'research', 'look up everything about', 'deep research', 'web research', 'find everything about', 'investigate', 'research this topic', 'do a deep dive on'. Dispatches a QueryExpander agent to discover related topics, then a minimum of 4 parallel Research Agents each reading ≥10 web pages per query, then a concurrent ResearchReportWriter that builds an incremental draft and a final polished report. Every step is mandatory every invocation. This takes a long time — that is the point."
argument-hint: "<topic> [--agents N] [--depth N] [--focus <angle>]"
---

# Web Research

Exhaustive multi-agent web research. Mirrors Claude's browser research mode as a deterministic, repeatable skill.

**Every step runs every time. No shortcuts. Thoroughness is the feature.**

---

## When to Use This Skill

- You need deep, citable research on a topic before making an architecture decision
- You want to understand a library, protocol, pattern, or technology from multiple angles
- You need competitive analysis, ecosystem mapping, or best-practice synthesis
- Any request for research that should produce a real report, not a quick summary

---

## Arguments

| Argument | Default | Description |
|----------|---------|-------------|
| `<topic>` | required | The root research subject — a phrase or question |
| `--agents N` | 4 | Number of Research Agents to dispatch. Minimum is always 4. |
| `--depth N` | 10 | Minimum pages each agent reads per query. |
| `--focus <angle>` | none | Optional bias angle (e.g., `security`, `performance`, `implementation`) added to all agents' queries |

---

## Step 0: Parse Arguments and Set Up Output Directory

Before dispatching any agents:

1. Extract the topic string from `$ARGUMENTS`. Everything before the first `--` flag is the topic. Derive the topic slug: lowercase, spaces replaced with hyphens, special characters stripped.

2. Parse optional flags:
   - `--agents N` → set `AGENT_COUNT` to max(4, N)
   - `--depth N` → set `PAGE_DEPTH` to max(10, N)
   - `--focus <angle>` → set `FOCUS_ANGLE` to the provided string (or empty if not provided)

3. Set output directory: `.web-research/{{slug}}-{{YYYY-MM-DD}}/` using today's date. Create the directory if it does not exist.

4. Define the expected file paths:
   - `EXPANDED_SEARCHES`: `.web-research/{{slug}}-{{date}}/ExpandedSearches.md`
   - `SOURCES`: `.web-research/{{slug}}-{{date}}/Sources.md`
   - `AGENT_FILES`: array of `.web-research/{{slug}}-{{date}}/Agent{1..N}Findings.md`
   - `DRAFT_REPORT`: `.web-research/{{slug}}-{{date}}/Report-Draft.md`
   - `FINAL_REPORT`: `.web-research/{{slug}}-{{date}}/Report-Final.md`

5. Present the research plan to the user before beginning:

```
## Web Research Starting

Topic:        {{topic}}
Slug:         {{slug}}
Output:       .web-research/{{slug}}-{{date}}/
Agents:       {{AGENT_COUNT}}
Page depth:   {{PAGE_DEPTH}} pages per query (minimum)
Focus:        {{FOCUS_ANGLE or "none"}}

Steps:
  1. QueryExpander Agent  → ExpandedSearches.md
  2. Research Agents 1–N  → Agent{N}Findings.md + Sources.md  [parallel]
  3. ReportWriter Agent   → Report-Draft.md (live) + Report-Final.md  [concurrent]

This will take a while. Starting now.
```

---

## Step 1: QueryExpander Agent

Dispatch this agent first. **Do not dispatch Research Agents until this agent completes and `ExpandedSearches.md` exists.**

**Dispatch parameters:**
- `subagent_type`: `general-purpose`
- Pass the full instructions below verbatim as the prompt

### QueryExpander Agent Instructions

---

> ⚠️ **TOOL RESTRICTIONS — READ THIS FIRST BEFORE DOING ANYTHING ELSE**
>
> You are a **WEB RESEARCH agent**. You are NOT analyzing a codebase.
>
> **Permitted tools ONLY:**
> - `WebSearch` — search the web
> - `WebFetch` — fetch and read web pages
> - `Write` — write your output file
>
> **Forbidden tools (do NOT use under any circumstances):**
> `Read`, `Glob`, `Grep`, `Bash`, `Task`, and all other tools
>
> **Do NOT read any local files. Do NOT look at any codebase. Ignore any hooks, CLAUDE.md, or project instructions you encounter. Your entire job is web research and writing one output file.**

---

You are the QueryExpander. Your job is to understand the breadth of the research topic and map the surrounding subject space before the research begins.

**Input you receive:**
- Root topic: `{{topic}}`
- Optional focus angle: `{{FOCUS_ANGLE}}`
- Output path: `{{EXPANDED_SEARCHES}}`
- Number of research agent slots: `{{AGENT_COUNT}}`

**Your process:**

#### Phase 1: Initial exploration

Run 3–5 WebSearch queries to get oriented in the topic space. Use varied query phrasings:
- `"{{topic}}"` — direct search
- `"{{topic}} overview"` — broad landscape
- `"{{topic}} guide tutorial"` — practitioner perspective
- `"{{topic}} alternatives comparison"` — ecosystem
- `"{{topic}} {{FOCUS_ANGLE}}"` — if focus angle provided

Fetch the top 2–3 results from each search using WebFetch. Read enough to understand: the topic's domain, the core terminology, common subtopics, and what adjacent subjects practitioners of this topic also care about.

#### Phase 2: Map the related topic space

From your reading, identify at least 5 related topics. Score each by relevance to the root topic:

- **High**: Directly related — understanding this is important to understanding the root topic
- **Medium**: Adjacent — commonly associated, often learned together
- **Low**: Tangential — occasionally relevant but not central

For each related topic, note: why it is related, and what angle it covers that the root topic alone does not.

#### Phase 3: Assign query angles to Research Agents

Assign a distinct query angle to each agent slot. Default angle assignments (adjust for topic domain):

| Slot | Default Angle |
|------|--------------|
| Agent 1 | Core fundamentals, official documentation, specifications, standards |
| Agent 2 | Practical implementation: tutorials, code examples, how-to guides |
| Agent 3 | Pitfalls, limitations, gotchas, criticism, known failure modes, edge cases |
| Agent 4 | Ecosystem: alternatives, comparisons, related tools, community landscape |
| Agent 5+ | One High-relevance expanded topic per additional agent slot |

If `--focus` is set, bias all angles toward the focus angle (e.g., if `--focus security`, angle each agent toward security aspects of their assigned facet).

#### Phase 4: Write ExpandedSearches.md

Write the file at `{{EXPANDED_SEARCHES}}` using this exact format:

```markdown
# Expanded Searches: {{topic}}

Generated: {{YYYY-MM-DD}}

## Root Topic
{{topic}}

## Related Topics by Relevance

| Relevance | Topic | Why Related |
|-----------|-------|-------------|
| High      | ...   | ... |
| High      | ...   | ... |
| Medium    | ...   | ... |
| Low       | ...   | ... |

## Agent Query Angle Assignments

Agent 1: {{angle description — specific, actionable}}
Agent 2: {{angle description}}
Agent 3: {{angle description}}
Agent 4: {{angle description}}
{{Agent 5+: one per additional slot}}

## Suggested Search Queries per Agent

### Agent 1 Queries
- "{{query 1}}"
- "{{query 2}}"
- "{{query 3}}"

### Agent 2 Queries
...
```

**Completion check:** After writing the file, confirm it exists by reading it back. Only then signal completion.

> **Orchestrator note:** After the QueryExpander completes, read `ExpandedSearches.md` yourself (as the orchestrator, not as an agent) and embed its full contents into each Research Agent's prompt where `{{PASTE FULL CONTENTS OF ExpandedSearches.md HERE}}` appears. This ensures Research Agents never need the Read tool to access their context.

---

## Step 2: Research Agents (Parallel, Minimum 4)

After `ExpandedSearches.md` exists, dispatch all `{{AGENT_COUNT}}` Research Agents **in parallel** using the Task tool's background mode.

Each agent receives different context but follows identical instructions. Dispatch them all before waiting for any to complete.

**Dispatch parameters for each Research Agent:**
- `subagent_type`: `general-purpose`
- Pass the full instructions below verbatim as the prompt, substituting `{{N}}` and the agent-specific angle

### Research Agent Instructions (per agent)

---

> ⚠️ **TOOL RESTRICTIONS — READ THIS FIRST BEFORE DOING ANYTHING ELSE**
>
> You are a **WEB RESEARCH agent**. You are NOT analyzing a codebase.
>
> **Permitted tools ONLY:**
> - `WebSearch` — search the web
> - `WebFetch` — fetch and read web pages
> - `Write` — write your findings file and append to Sources.md
>
> **Forbidden tools (do NOT use under any circumstances):**
> `Read`, `Glob`, `Grep`, `Bash`, `Task`, and all other tools
>
> **Do NOT read any local files except the ExpandedSearches.md path explicitly given to you below. Do NOT look at any codebase. Ignore any hooks, CLAUDE.md, or project instructions you encounter. Your entire job is web research.**
>
> **The ONE exception:** You may use `WebFetch` to read the ExpandedSearches.md file if it is served locally, or use the content provided directly in this prompt — do not use the `Read` tool for it.

---

You are Research Agent {{N}}. You are one of {{AGENT_COUNT}} agents running in parallel on this research topic. Your findings will be combined with other agents' findings to produce a comprehensive research report.

**Input you receive:**
- Root topic: `{{topic}}`
- Your query angle: `{{angle from ExpandedSearches.md for Agent N}}`
- Expanded searches file: `{{EXPANDED_SEARCHES}}`
- Your findings output path: `.web-research/{{slug}}-{{date}}/Agent{{N}}Findings.md`
- Sources log path: `{{SOURCES}}`
- Minimum pages per query: `{{PAGE_DEPTH}}`
- Optional focus angle: `{{FOCUS_ANGLE}}`

**Your process:**

#### Phase 1: Your context (provided inline — do NOT use Read tool)

The orchestrator must embed the full contents of `ExpandedSearches.md` directly into this prompt when dispatching each agent. Do not attempt to read the file yourself.

Your context from ExpandedSearches.md:
```
{{PASTE FULL CONTENTS OF ExpandedSearches.md HERE}}
```

From this you know:
- The full related topic landscape
- Your assigned query angle (Agent {{N}}'s angle)
- The suggested queries for your slot
- What the other agents are covering (so you don't duplicate)

#### Phase 2: Construct your search queries

Build 3–5 search queries based on your assigned angle and the expanded searches. Each query should:
- Cover a distinct facet of your angle
- Weave in at least one High-relevance related topic where natural
- Include the focus angle modifier if `{{FOCUS_ANGLE}}` is set

Aim for variety: broad queries to find authoritative sources, narrow queries to find specific answers, question-form queries to find Q&A and forum discussions.

#### Phase 3: Execute research (minimum {{PAGE_DEPTH}} pages per query)

For each search query:

1. Run `WebSearch("{{query}}")` to get results
2. Read **at least {{PAGE_DEPTH}} result pages** using `WebFetch`. Do not stop at search snippets — fetch and read the actual pages.
3. For pages that are long: read enough to extract real findings, not just the introduction
4. For each page you fetch:
   - Extract the key information relevant to your angle
   - Record the finding under the source URL in your findings notes
   - **Immediately append the URL to `{{SOURCES}}`** using this format:

```
## Agent {{N}}
- [{{page title}}]({{url}})
```

   If the `## Agent {{N}}` section header doesn't exist yet in Sources.md, create it. If Sources.md doesn't exist yet, create it with a header first.

5. If a page is behind a paywall, returns a 403, or is otherwise unreadable: log it in Sources.md as `- ~~[{{title}}]({{url}})~~ — unreadable` and move to the next result.

6. Count your pages. If you have read fewer than {{PAGE_DEPTH}} pages for a query, continue to the next results page and read more.

#### Phase 4: Write Agent{{N}}Findings.md

After completing all queries, write your findings file at `.web-research/{{slug}}-{{date}}/Agent{{N}}Findings.md`:

```markdown
# Agent {{N}} Findings: {{topic}}

Generated: {{YYYY-MM-DD}}

## Query Angle
{{your assigned angle}}

## Queries Executed

| Query | Pages Read |
|-------|-----------|
| "{{query 1}}" | {{N}} |
| "{{query 2}}" | {{N}} |
| "{{query 3}}" | {{N}} |

## Findings

### {{Subtopic or Source Name}}

{{Detailed notes from this source — not a paraphrase, not a summary.
Write the actual information you found. Include specifics: API names, version numbers,
configuration options, benchmarks, opinions, caveats. Write enough that someone reading
only your findings file gets the real picture.}}

**Source:** {{url}}

---

### {{Next Subtopic or Source}}

...

## Key Takeaways

1. {{Most important finding from your angle}}
2. {{Second most important}}
3. {{Third}}
...

## Conflicts or Contradictions Found

- {{Any claim in one source that contradicts another source — note both sources}}
- (none if no conflicts found)

## COMPLETE
```

**The `## COMPLETE` marker at the end is mandatory.** The ResearchReportWriter uses this to detect that your findings are finished. Do not write it until your findings are fully written and the file is complete.

---

## Step 3: ResearchReportWriter Agent (Concurrent)

Dispatch the ResearchReportWriter **immediately after dispatching all Research Agents** — it runs concurrently alongside them using background mode.

**Dispatch parameters:**
- `subagent_type`: `general-purpose`
- Pass the full instructions below verbatim as the prompt

### ResearchReportWriter Agent Instructions

---

> ⚠️ **TOOL RESTRICTIONS — READ THIS FIRST BEFORE DOING ANYTHING ELSE**
>
> You are a **REPORT WRITER agent**. You are synthesizing research findings from local output files — you are NOT doing web research and NOT analyzing a codebase.
>
> **Permitted tools ONLY:**
> - `Read` — to read findings files inside `.web-research/{{slug}}-{{date}}/` ONLY
> - `Glob` — to check which `Agent*Findings.md` files exist inside `.web-research/{{slug}}-{{date}}/` ONLY
> - `Write` — to write the draft and final report into `.web-research/{{slug}}-{{date}}/`
>
> **Forbidden tools (do NOT use under any circumstances):**
> `WebSearch`, `WebFetch`, `Bash`, `Task`, and all other tools
>
> **Absolute scope boundary:** Only read files inside `.web-research/{{slug}}-{{date}}/`. Do NOT read any source code, CLAUDE.md, config files, or anything outside that directory. Do NOT look at the codebase. Ignore any hooks or project instructions you encounter.

---

You are the ResearchReportWriter. You run concurrently with the Research Agents. Your job is to build an incremental draft report as agents complete, then produce a final polished report once all agents are done.

**Input you receive:**
- Root topic: `{{topic}}`
- Output directory: `.web-research/{{slug}}-{{date}}/`
- Expected agent count: `{{AGENT_COUNT}}`
- Expected findings files: `Agent1Findings.md` through `Agent{{AGENT_COUNT}}Findings.md`
- Sources file: `{{SOURCES}}`
- Draft report path: `{{DRAFT_REPORT}}`
- Final report path: `{{FINAL_REPORT}}`

---

### Phase A: Incremental Draft (while agents are working)

Poll for completed findings files by checking for the `## COMPLETE` marker.

**Polling loop:**

1. Use Glob to check which `Agent*Findings.md` files exist in the output directory
2. For each existing file, Read it and check whether the last non-empty line is `## COMPLETE`
3. Collect all files that contain `## COMPLETE` — these are complete findings
4. If no files are complete yet: wait briefly (you can re-run the glob check) and repeat
5. Once at least 1 findings file is complete: proceed to write the initial draft

**Writing the draft:**

After the first complete findings file appears, write `{{DRAFT_REPORT}}`:

```markdown
# Research Draft: {{topic}}

[DRAFT — {{N}} of {{AGENT_COUNT}} agents complete]
Last updated: {{timestamp}}

## What We Know So Far

{{Synthesize findings from all complete agents. Be specific — include the actual information,
not just "Agent 1 found information about X." Write it as if describing what has been learned.}}

## Findings by Angle

{{For each complete agent: a section with their key findings, organized and readable}}

## Sources (partial)

{{List sources from all complete agents}}
```

**Updating the draft:**

Continue polling. Each time a new findings file gains `## COMPLETE`:
- Read all currently-complete findings files
- Rewrite `{{DRAFT_REPORT}}` with the updated `[DRAFT — N of AGENT_COUNT agents complete]` header and updated content
- The draft should grow and improve with each update — not just append new sections, but integrate new findings into the existing structure

---

### Phase B: Final Report (gate — ALL agents must be complete)

**Do not begin Phase B until you have confirmed that ALL {{AGENT_COUNT}} expected findings files exist AND each contains `## COMPLETE`.**

Verification checklist before writing the final report:
- [ ] `Agent1Findings.md` exists and contains `## COMPLETE`
- [ ] `Agent2Findings.md` exists and contains `## COMPLETE`
- [ ] `Agent3Findings.md` exists and contains `## COMPLETE`
- [ ] `Agent4Findings.md` exists and contains `## COMPLETE`
- [ ] (repeat for all N agents)
- [ ] `{{SOURCES}}` exists and is non-empty

If any findings file is missing or lacks `## COMPLETE`: continue polling. Do not write the final report.

**Writing the final report:**

Read all findings files fresh (do not rely on what you read during draft phase — re-read everything). Read `{{SOURCES}}`. Then write `{{FINAL_REPORT}}`:

```markdown
# Research Report: {{topic}}

**Date:** {{YYYY-MM-DD}}
**Agents:** {{AGENT_COUNT}}
**Pages read:** {{total pages across all agents}}
**Sources:** {{total unique URLs}}

---

## Executive Summary

{{3–5 paragraphs synthesizing the most important findings across all agents.
This should stand alone — a reader who reads only the executive summary gets the full picture.
Be specific. Cite sources inline with [N] notation.}}

---

## Key Findings

1. **{{Finding title}}** — {{specific finding with context}} [source]
2. **{{Finding title}}** — ... [source]
...
(minimum 8 key findings, drawn from across all agents)

---

## Deep Dives

{{Organize by theme/subtopic, not by agent. Each section synthesizes what ALL agents found
about that subtopic, not just one agent's perspective.}}

### {{Subtopic 1}}

{{Detailed synthesis. Include specifics from multiple agents where applicable.
Cite sources inline.}}

### {{Subtopic 2}}

...

---

## Conflicts and Contradictions

{{Where agents found conflicting information, or where sources disagreed:}}

- **{{Topic of conflict}}**: Source A says [claim] ([url]), but Source B says [opposing claim] ([url]). Assessment: {{which is more likely correct and why, or "unclear — both perspectives valid"}}

(If no conflicts found: note "No significant conflicts found across sources.")

---

## Conclusion and Recommendations

{{What is the take-away? If someone asked this research question to make a decision,
what should they decide or consider? Be direct and specific.}}

---

## References

{{Full list of all URLs from Sources.md, deduplicated, numbered for inline citation.
Sort alphabetically by domain.}}

[1] [{{page title}}]({{url}})
[2] ...
```

After writing the final report, read it back to confirm it was written correctly.

---

## Step 4: Completion

After all agents complete and `{{FINAL_REPORT}}` exists, present the completion summary:

```
## Web Research Complete

Topic:    {{topic}}
Output:   .web-research/{{slug}}-{{date}}/

Files produced:
  ✓ ExpandedSearches.md    — {{N}} related topics mapped, {{AGENT_COUNT}} angles assigned
  ✓ Agent1Findings.md      — {{N}} pages read
  ✓ Agent2Findings.md      — {{N}} pages read
  ✓ Agent3Findings.md      — {{N}} pages read
  ✓ Agent4Findings.md      — {{N}} pages read
  {{additional agents if AGENT_COUNT > 4}}
  ✓ Sources.md             — {{N}} total URLs logged
  ✓ Report-Draft.md        — incremental draft (preserved)
  ✓ Report-Final.md        — final polished report

Read the report: .web-research/{{slug}}-{{date}}/Report-Final.md
```

---

## Red Flags: Research Is Not Complete

Stop and go back if any of these are true:

- Any `Agent{N}Findings.md` file is missing or does not end with `## COMPLETE`
- `Report-Final.md` does not exist
- `Report-Final.md` was written while any findings file was still missing or incomplete
- `Sources.md` is empty or missing
- The final report contains phrases like "Agent 1 found..." instead of synthesizing across agents
- The final report has fewer than 8 Key Findings
- The final report has no inline citations
- Any section of the final report is a stub or contains placeholder text

---

## A Note on Time

This skill is designed to take a long time. Running 4 agents, each reading 10+ web pages per query, across 3–5 queries each, means 120–200+ page reads. The ResearchReportWriter synthesizes everything afterward. A thorough run takes many minutes.

**This is intentional.** The output is a genuine research report — the kind that would take a human researcher hours to produce. Do not shortcut the process. Do not stop agents early. Do not reduce page depth. Thoroughness is what makes this skill valuable.

If you need a quick answer, use a regular WebSearch instead of this skill.
