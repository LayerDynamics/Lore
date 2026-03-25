# SPEC-1: Web Research Skill

> A deep web research skill that dispatches multiple parallel search agents to exhaustively investigate a topic, expand into related subjects, and synthesize findings into a structured final report — modeled after Claude's browser research mode but as a deterministic, repeatable lore skill.

**Date:** 2026-03-25
**Author:** LayerDynamics + Claude
**Status:** Draft
**Version:** 1.0

---

## 1. Background

### 1.1 Problem Statement

Claude's built-in research mode (available in the browser at claude.ai) performs deep multi-source web research. That capability does not exist as a reproducible, configurable skill inside Claude Code. Users who want thorough, citable research on a technical topic — libraries, protocols, patterns, competitive analysis, architecture decisions — must either manually search or rely on the browser product, which is not available inside the CLI environment.

### 1.2 Current State

The existing `external-research-synthesizer` agent does single-topic library documentation lookups. It runs one agent, searches a few pages, and returns a synthesis. It is not designed for exhaustive multi-agent research with query expansion, related topic discovery, or parallel deep crawls. There is no skill that mirrors the depth of Claude's browser research feature.

### 1.3 Target Users

- Developers using Claude Code who need deep research on a topic before implementing a feature
- Users who want to research architecture patterns, libraries, protocols, or competitive landscape
- Anyone who wants a thorough, citable, multi-source research report — not a quick summary

### 1.4 Motivation

Claude's browser research feature is one of its most powerful capabilities. Bringing equivalent depth to the CLI skill system means every lore user has access to serious research workflows without leaving their terminal. The skill intentionally takes a long time — thoroughness is the feature, not a bug.

### 1.5 Assumptions

- `WebSearch` and `WebFetch` tools are available to agents dispatched by this skill
- The skill runs inside Claude Code where subagents can be dispatched via the `Task` tool
- Researched output is written to the local filesystem at `.web-research/{{topic}}/`
- The user accepts that this skill takes significant time (many web searches, many page reads, many agents)
- No external APIs or credentials beyond what Claude Code already has are required

---

## 2. Requirements

### 2.1 Functional Requirements

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-1 | MUST | The skill MUST accept a topic string as its primary argument and use it as the root research subject |
| FR-2 | MUST | The skill MUST dispatch a dedicated QueryExpander Agent before any research begins |
| FR-3 | MUST | The QueryExpander Agent MUST identify related and adjacent topics, scored by relevance to the root topic, and write them to `.web-research/{{topic}}/ExpandedSearches.md` |
| FR-4 | MUST | The skill MUST dispatch a minimum of 4 Research Agents per invocation |
| FR-5 | MUST | Each Research Agent MUST enumerate and read a minimum of 10 search result pages per query |
| FR-6 | MUST | Each Research Agent MUST write its findings to a dedicated file: `.web-research/{{topic}}/Agent{N}Findings.md` |
| FR-7 | MUST | ALL URLs read by any agent during research MUST be appended to `.web-research/{{topic}}/Sources.md` |
| FR-8 | MUST | The skill MUST dispatch a ResearchReportWriter Agent after research agents begin working |
| FR-9 | MUST | The ResearchReportWriter Agent MUST create an initial draft report as agents complete, updating the draft incrementally as each agent's findings file is written |
| FR-10 | MUST | The ResearchReportWriter Agent MUST NOT finalize the report until ALL Research Agent findings files are complete |
| FR-11 | MUST | The ResearchReportWriter Agent MUST produce a final polished report only after reading all findings files in their completed state |
| FR-12 | MUST | Every step (query expansion, parallel research, incremental draft, final report) MUST execute on every invocation — no steps may be skipped |
| FR-13 | MUST | Research Agents MUST include the expanded related topics from `ExpandedSearches.md` in their search queries, not just the root topic |
| FR-14 | MUST | The final report MUST cite sources from `Sources.md` with inline references |
| FR-15 | SHOULD | Research Agents SHOULD be dispatched in parallel where possible to reduce total elapsed time |
| FR-16 | SHOULD | The skill SHOULD support an optional `--agents N` argument to increase the minimum 4 agents to a higher number for broader coverage |
| FR-17 | SHOULD | The skill SHOULD support an optional `--depth N` argument to increase the minimum 10 pages per query |
| FR-18 | COULD | The skill COULD support a `--focus` flag to bias research toward a specific angle (e.g., `--focus security`, `--focus performance`) |

### 2.2 Non-Functional Requirements

#### Thoroughness
| Metric | Target |
|--------|--------|
| Minimum search result pages read per agent | 10 |
| Minimum research agents dispatched | 4 |
| Related topics discovered and included | ≥ 5 per root topic |
| Sources logged | All — no URL read during research may be omitted |

#### Output quality
| Metric | Target |
|--------|--------|
| Final report structure | Sections: Executive Summary, Key Findings, Deep Dives per subtopic, Synthesis, Sources |
| Source citations | Every factual claim in the final report must be traceable to a URL in Sources.md |
| Conflicting findings | Identified and noted explicitly — not silently resolved |

#### Reliability
| Metric | Target |
|--------|--------|
| Partial failure handling | If one Research Agent fails, others continue; failure is noted in report |
| Source deduplication | Sources.md must not contain duplicate URLs |
| Incomplete research gate | Final report may not be written while any agent's findings file is still incomplete |

### 2.3 Constraints

- Must work with only `WebSearch` and `WebFetch` tools (no external APIs, no credentials)
- All output files live in `.web-research/{{topic}}/` — the topic slug is derived from the user's input (lowercase, hyphens, no special characters)
- The skill is a markdown workflow file (`SKILL.md`) — agents are described declaratively as subagents dispatched via the Task tool protocol
- Must follow lore skill frontmatter conventions (name, description, argument-hint)

### 2.4 Explicit Non-Goals

- **WONT:** Real-time streaming of research results to the terminal during execution
- **WONT:** Persistent research history across sessions (each invocation is self-contained)
- **WONT:** Authenticated research behind paywalls or login walls
- **WONT:** PDF or binary file parsing (text/HTML web pages only)
- **WONT:** Automatic re-research or polling for updated information on a schedule
- **WONT:** Integration with external knowledge bases, vector stores, or embeddings

---

## 3. Architecture

### 3.1 System Overview

```
User invokes: /lore:web-research <topic>
                        │
                        ▼
            ┌─────────────────────┐
            │   Skill Orchestrator │  (main skill process)
            │   (SKILL.md logic)  │
            └──────────┬──────────┘
                       │
          ┌────────────▼────────────┐
          │   QueryExpander Agent   │  Step 1 — runs first, blocks research start
          │   Finds related topics  │
          │   Writes ExpandedSearches.md
          └────────────┬────────────┘
                       │ ExpandedSearches.md ready
                       │
        ┌──────────────▼──────────────────┐
        │    Dispatch Research Agents     │  Step 2 — parallel dispatch (min 4)
        │  (each gets topic + expansions) │
        └──┬──────────┬──────────┬────┬──┘
           │          │          │    │
    ┌──────▼──┐ ┌─────▼───┐ ┌───▼──┐ ┌▼──────┐
    │Agent 1  │ │Agent 2  │ │Agent3│ │Agent N│  Each: min 10 pages/query
    │Findings │ │Findings │ │Find..│ │Find.. │  Appends to Sources.md
    │  .md    │ │  .md    │ │  .md │ │  .md  │  Writes AgentNFindings.md
    └──────┬──┘ └─────┬───┘ └───┬──┘ └┬──────┘
           │          │          │     │
           └──────────┴────┬─────┴─────┘
                           │ (each agent writes findings as it completes)
                           ▼
            ┌──────────────────────────┐
            │  ResearchReportWriter    │  Step 3 — starts after first agent done
            │  Agent                  │  Updates draft as each agent finishes
            │  Polls for completed    │  GATES final report until ALL done
            │  findings files         │
            └──────────────┬──────────┘
                           │
                    ┌──────▼──────┐
                    │  Final      │
                    │  Report.md  │
                    └─────────────┘
```

### 3.2 Component Design

#### Component: Skill Orchestrator (SKILL.md)

- **Responsibility:** Parse arguments, derive topic slug, create output directory, enforce execution order, dispatch all agents in the correct sequence
- **Technology:** Lore SKILL.md markdown workflow
- **Interfaces:** Accepts `$ARGUMENTS` containing the research topic and optional flags (`--agents N`, `--depth N`, `--focus <angle>`)
- **Dependencies:** Task tool (for subagent dispatch), filesystem (for output directory creation)

#### Component: QueryExpander Agent

- **Responsibility:** Given a root topic, perform initial web searches to identify related, adjacent, and prerequisite topics; score each by relevance to the root; write the full list to `ExpandedSearches.md`
- **Technology:** Subagent with `WebSearch`, `WebFetch`, `Write` tools
- **Interfaces:** Input: root topic string. Output: `.web-research/{{topic}}/ExpandedSearches.md`
- **Dependencies:** WebSearch, WebFetch

#### Component: Research Agent (× N, minimum 4)

- **Responsibility:** Each agent is assigned a query angle (derived from root topic + expanded searches). It searches the web, reads a minimum of 10 result pages per query, and writes all findings to its assigned findings file. It appends every URL it reads to `Sources.md`.
- **Technology:** Subagent with `WebSearch`, `WebFetch`, `Read`, `Write` tools
- **Interfaces:**
  - Input: root topic, expanded searches from `ExpandedSearches.md`, assigned query angle, agent number N, output paths
  - Output: `.web-research/{{topic}}/Agent{N}Findings.md`, appends to `.web-research/{{topic}}/Sources.md`
- **Dependencies:** WebSearch, WebFetch, ExpandedSearches.md

#### Component: ResearchReportWriter Agent

- **Responsibility:** Monitor findings files as they are written by research agents. After the first agent completes, begin drafting the report. Incrementally update the draft as additional agents complete. After ALL findings files are confirmed complete, write the final polished report with proper citations, synthesis, and conclusions.
- **Technology:** Subagent with `Read`, `Glob`, `Write`, `WebFetch` tools
- **Interfaces:**
  - Input: topic slug, expected agent count, path to all Agent{N}Findings.md files, Sources.md path
  - Output: `.web-research/{{topic}}/Report-Draft.md` (incremental), `.web-research/{{topic}}/Report-Final.md` (completed)
- **Dependencies:** All Agent{N}Findings.md files (reads them as they complete), Sources.md

### 3.3 Data Model

#### Output Directory Structure

```
.web-research/
└── {{topic-slug}}/
    ├── ExpandedSearches.md      # QueryExpander output — related topics by relevance
    ├── Agent1Findings.md        # Research Agent 1 findings
    ├── Agent2Findings.md        # Research Agent 2 findings
    ├── Agent3Findings.md        # Research Agent 3 findings
    ├── Agent4Findings.md        # Research Agent 4 findings
    ├── Agent{N}Findings.md      # Additional agents if --agents > 4
    ├── Sources.md               # ALL URLs read by all agents, deduplicated
    ├── Report-Draft.md          # Incremental draft (written/updated during research)
    └── Report-Final.md          # Final report (written only after all agents complete)
```

#### ExpandedSearches.md Schema

```markdown
# Expanded Searches: {{topic}}

## Root Topic
{{root topic as entered by user}}

## Related Topics (by relevance)

| Relevance | Topic | Rationale |
|-----------|-------|-----------|
| High      | ...   | Why this is closely related |
| High      | ...   | ... |
| Medium    | ...   | ... |
| Low       | ...   | ... |

## Assigned Query Angles

Agent 1: {{angle description}}
Agent 2: {{angle description}}
Agent 3: {{angle description}}
Agent 4: {{angle description}}
```

#### Agent{N}Findings.md Schema

```markdown
# Agent {N} Findings: {{topic}}

## Query Angle
{{what this agent was tasked to research}}

## Queries Run
1. "{{exact search query}}" — {{N}} pages read
2. "{{exact search query}}" — {{N}} pages read
...

## Findings

### {{Subtopic or Source}}
{{Detailed notes from this source — not a summary, actual findings}}
Source: {{URL}}

### {{Subtopic or Source}}
...

## Key Takeaways
- {{Bullet of most important finding}}
- {{Bullet of most important finding}}

## Conflicts or Contradictions
- {{Any finding that contradicts another source}}
```

#### Sources.md Schema

```markdown
# Sources

All URLs read during research on: {{topic}}
Generated: {{date}}

## Agent 1
- {{URL}} — {{page title or brief description}}

## Agent 2
- {{URL}} — ...

## All Sources (deduplicated)
{{Full deduplicated list sorted alphabetically}}
```

### 3.4 Agent Query Assignment Strategy

The skill must distribute query angles across agents so they cover different facets of the topic. Given N agents and a topic, the orchestrator assigns angles as follows:

- **Agent 1:** Core fundamentals, definitions, official documentation
- **Agent 2:** Practical implementations, tutorials, code examples
- **Agent 3:** Pitfalls, limitations, known issues, criticism, edge cases
- **Agent 4:** Related tools, alternatives, comparisons, ecosystem
- **Agent 5+ (if --agents > 4):** Derived from expanded searches — one agent per high-relevance related topic

### 3.5 Data Flow

#### Full Research Execution Flow

```
1. User: /lore:web-research "topic string" [flags]

2. Skill: Parse arguments → derive topic slug → create .web-research/{{slug}}/

3. Skill: Dispatch QueryExpander Agent
   → Agent searches web for root topic
   → Agent identifies ≥5 related topics, scores by relevance
   → Agent writes ExpandedSearches.md with assigned query angles
   → Skill waits for ExpandedSearches.md to exist before continuing

4. Skill: Read ExpandedSearches.md → extract query angle assignments

5. Skill: Dispatch Research Agent 1..N in parallel (minimum 4)
   Each agent:
   a. Receives: root topic, expanded searches, assigned angle, output path
   b. Constructs search queries from angle + expanded topics
   c. Runs WebSearch → reads ≥10 result pages per query
   d. For each page: reads content with WebFetch, extracts findings
   e. Appends each URL to Sources.md (with mutex awareness — append only, no overwrites)
   f. Writes completed findings to Agent{N}Findings.md

6. Skill: Dispatch ResearchReportWriter Agent (starts after first agent completes)
   a. Checks which Agent{N}Findings.md files exist
   b. Reads all available findings files
   c. Writes initial Report-Draft.md
   d. Periodically checks for newly completed findings files
   e. Updates Report-Draft.md as each new agent completes
   f. Checks that ALL expected findings files are present and complete
   g. Only then: reads all findings + Sources.md → writes Report-Final.md

7. Skill: Confirm Report-Final.md exists → present summary to user
```

### 3.6 ResearchReportWriter — Draft-to-Final Protocol

The report writer follows a strict two-phase protocol:

**Phase A — Incremental Draft:**
- Begin draft after first AgentNFindings.md appears
- Draft structure: Executive Summary (preliminary), Findings per query angle, Sources (partial)
- Update draft each time a new findings file appears
- Clearly mark draft as `[DRAFT — N of M agents complete]`

**Phase B — Final Report:**
- Triggered only when all M expected findings files exist and are non-empty
- Read all findings files fresh (do not rely on previous draft reading)
- Read Sources.md for full citation list
- Write Report-Final.md with:
  - Executive Summary (synthesized from all agents)
  - Key Findings (cross-agent synthesis)
  - Deep Dives by subtopic (organized thematically, not by agent)
  - Conflicts and Contradictions (where agents found differing information)
  - Conclusion and Recommendations
  - Full source citations with inline references

### 3.7 Security and Safety

- No credentials, tokens, or API keys are used
- All data written to `.web-research/` which is local and gitignored by convention
- WebFetch only reads public web pages — no authenticated sessions
- The `.web-research/` directory should be added to `.gitignore` to prevent accidental commit of research artifacts

---

## 4. Implementation Plan

### 4.1 Build Phases

#### Phase 1: SKILL.md Core Skeleton and Agent Definitions

- **Goal:** Working skill file with correct frontmatter, argument parsing, directory setup, and agent dispatch protocol
- **Scope:** `lore/skills/web-research/SKILL.md` — complete skill with all steps documented
- **Exit criteria:** Skill can be invoked, creates output directory, dispatches QueryExpander Agent with correct context

#### Phase 2: QueryExpander Agent

- **Goal:** Agent reliably expands a root topic into related topics, assigns query angles, writes ExpandedSearches.md
- **Scope:** QueryExpander agent definition embedded in SKILL.md agent dispatch instructions
- **Exit criteria:** Given "WebSockets", agent produces ExpandedSearches.md containing related topics (HTTP/2 push, SSE, long polling, etc.) with relevance scores and agent angle assignments

#### Phase 3: Research Agents (parallel, minimum 4)

- **Goal:** Each research agent runs ≥10 pages per query, writes full findings, appends sources
- **Scope:** Research agent instructions in SKILL.md, per-agent context injection protocol
- **Exit criteria:** 4 agents run in parallel, each produces a complete Agent{N}Findings.md with actual web content (not summaries), Sources.md contains all URLs

#### Phase 4: ResearchReportWriter Agent

- **Goal:** Writer agent reads all findings, produces draft during research, produces final report after all agents complete
- **Scope:** ResearchReportWriter agent instructions in SKILL.md, polling/gating protocol
- **Exit criteria:** Report-Final.md contains: executive summary, thematic synthesis across all agents, inline citations, contradiction notes, full source list

#### Phase 5: Integration and Validation

- **Goal:** Full end-to-end run produces all expected output files with real content
- **Scope:** Test invocation on a known topic; verify all output files exist and are substantive
- **Exit criteria:** Running `/lore:web-research "server-sent events"` produces: ExpandedSearches.md, 4+ AgentFindings.md files, Sources.md with ≥40 URLs, Report-Draft.md, Report-Final.md with citations

### 4.2 Testing Strategy

- **Smoke test:** Invoke on a narrow topic ("fetch API abort signals") — verify all output files created
- **Depth test:** Verify Sources.md contains ≥10 URLs per agent (min 40 total for 4 agents)
- **Completeness gate test:** Manually delete one AgentFindings.md and verify Report-Final.md is not written until it reappears
- **Related topics test:** Verify ExpandedSearches.md contains topics adjacent to but not identical to the root

### 4.3 Rollout Strategy

The skill is a markdown file — deployment is simply writing the file to `lore/skills/web-research/SKILL.md`. No build step required. Immediately available after the lore plugin reloads.

---

## 5. Milestones

| Milestone | Goal | Exit Criteria | Owner |
|-----------|------|---------------|-------|
| M1 | SKILL.md core structure | File exists, invocable, directory created, QueryExpander dispatched | LayerDynamics |
| M2 | QueryExpander working | ExpandedSearches.md produced with ≥5 related topics and angle assignments | LayerDynamics |
| M3 | Research Agents working | 4 agents run in parallel, each produces complete findings file | LayerDynamics |
| M4 | ResearchReportWriter working | Report-Draft.md and Report-Final.md both produced with citations | LayerDynamics |
| M5 | Full end-to-end validation | All output files present for a test topic with substantive content | LayerDynamics |

### Dependency Graph

```
M1 → M2 → M3 → M4 → M5
```

M2 depends on M1 (orchestrator must exist to dispatch QueryExpander).
M3 depends on M2 (ExpandedSearches.md must exist before research agents are dispatched).
M4 depends on M3 (report writer needs findings files to exist).
M5 validates the full chain M1–M4 together.

---

## 6. Success Criteria

### 6.1 Launch Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Output files produced per run | 7+ (ExpandedSearches, 4× Findings, Sources, Report-Final) | `ls .web-research/{{topic}}/` after run |
| Sources logged per run | ≥ 40 (10 pages × 4 agents minimum) | `wc -l Sources.md` |
| Related topics discovered | ≥ 5 | Count rows in ExpandedSearches.md table |
| Final report contains citations | 100% of factual claims | Manual review of Report-Final.md |
| Report-Final.md written before all agents complete | Never | Manual gating test |

### 6.2 Quality Indicators

- Report-Final.md reads as a coherent, well-structured research document (not a dump of agent notes)
- Conflicting information across sources is explicitly called out, not silently resolved
- Sources.md is deduplicated
- Each AgentFindings.md reflects genuine page-by-page reading (not summarized from search snippets)

---

## 7. Risks

| ID | Risk | Impact | Likelihood | Mitigation | Contingency |
|----|------|--------|------------|------------|-------------|
| R1 | WebSearch rate limits interrupt research midway | High — incomplete findings | Medium | Space agent queries; handle errors gracefully; log partial findings before failing | Mark agent as partially complete; ResearchReportWriter notes gap in report |
| R2 | WebFetch fails on certain URLs (paywalls, 403s, redirects) | Low — some sources unreadable | High | Skip unreadable URLs; log as "attempted, unreadable" in Sources.md; continue to next result | Minimum pages met by reading additional results |
| R3 | ResearchReportWriter writes final report before all agents complete | High — incomplete report | Low | Gate is enforced: writer checks expected agent count vs. available findings files before writing final | Explicit check with Glob/Read on all expected paths |
| R4 | Topic slug collisions (two different topics produce same slug) | Medium — file overwrites | Low | Include timestamp suffix in directory name: `.web-research/{{slug}}-{{YYYY-MM-DD}}/` | Manual rename |
| R5 | Agent context window exhausted on very broad topics | High — incomplete research | Medium | Agents write findings incrementally as they read each page, not holding everything in memory | `--focus` flag to narrow scope |

---

## 8. Open Questions

| # | Question | Owner | Notes |
|---|----------|-------|-------|
| 1 | Should `.web-research/` be added to the lore `.gitignore` template automatically? | LayerDynamics | Research artifacts are typically large and local-only |
| 2 | Should the skill support resuming a previous research run (some agents already complete)? | LayerDynamics | Would require detecting existing output files and skipping completed agents |
| 3 | What is the maximum practical number of agents before context/rate limits become a bottleneck? | LayerDynamics | Empirically test at 4, 8, 12 agents |
| 4 | Should `--focus` accept multiple values to create a focused multi-angle research? | LayerDynamics | e.g., `--focus security,performance` |

---

## Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| Topic slug | The root research topic converted to lowercase-hyphens for use as a directory name |
| Query angle | A specific facet or perspective assigned to a research agent to ensure agents do not duplicate effort |
| Expanded search | A related topic discovered by the QueryExpander that is adjacent or prerequisite to the root topic |
| Findings file | The markdown file written by a single Research Agent: `Agent{N}Findings.md` |
| Draft report | The work-in-progress report written incrementally as agents complete — marked as draft |
| Final report | The polished, fully-cited report written only after all agents have completed |
| Page depth | The number of search result pages (URLs) read per query by a research agent — minimum 10 |

### Appendix B: File Path Reference

| File | Path | Written By | Read By |
|------|------|------------|---------|
| Expanded searches | `.web-research/{{slug}}/ExpandedSearches.md` | QueryExpander | Orchestrator, Research Agents |
| Agent findings | `.web-research/{{slug}}/Agent{N}Findings.md` | Research Agent N | ResearchReportWriter |
| Source log | `.web-research/{{slug}}/Sources.md` | All Research Agents (append) | ResearchReportWriter |
| Draft report | `.web-research/{{slug}}/Report-Draft.md` | ResearchReportWriter | User (optional) |
| Final report | `.web-research/{{slug}}/Report-Final.md` | ResearchReportWriter | User |

### Appendix C: Decision Log

| Decision | Rationale | Alternatives Rejected |
|----------|-----------|----------------------|
| Minimum 4 agents | Ensures distinct query angles cover fundamentals, implementation, pitfalls, and ecosystem | 2 agents (too shallow), unlimited (no minimum guarantees) |
| Minimum 10 pages per query | Matches depth of Claude's browser research mode; ensures findings aren't just search snippets | 5 pages (too shallow for authoritative synthesis) |
| Draft-then-final report protocol | Gives user visibility into progress for long-running research; final gate ensures completeness | Final-only (no visibility); streaming (complex to implement in skill format) |
| `.web-research/{{topic}}/` output dir | Centralized, discoverable, easy to gitignore, parallel-safe per topic | Single flat directory (collision risk), project docs folder (pollutes project) |
| QueryExpander runs first and blocks | Research agents need expanded topics to assign query angles; running without expansion produces narrow results | Expand asynchronously (agents would start before angles are assigned) |
