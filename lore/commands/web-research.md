---
description: Deep, exhaustive web research on any topic. Dispatches a QueryExpander agent, minimum 4 parallel Research Agents (each reading ≥10 pages per query), and a concurrent ResearchReportWriter that builds an incremental draft and a final polished report. Every step is mandatory. This takes a long time — that is the point.
argument-hint: "<topic> [--agents N] [--depth N] [--focus <angle>]"
---

# web-research: Web Research

**Load the web-research skill first** using the Skill tool.

## Starting Context

`$ARGUMENTS` contains the research topic and optional flags. Pass the full `$ARGUMENTS` string directly to the skill — do not modify or abbreviate it.

If `$ARGUMENTS` is empty, ask the user: "What topic do you want to research?"

## Run the Full Workflow

Execute every step in the skill without skipping:

1. **Step 0** — Parse arguments, derive topic slug, create output directory, present research plan
2. **Step 1** — QueryExpander Agent → `ExpandedSearches.md` (blocks research start)
3. **Step 2** — Research Agents 1–N in parallel → `Agent{N}Findings.md` + `Sources.md`
4. **Step 3** — ResearchReportWriter Agent concurrent → `Report-Draft.md` (live) + `Report-Final.md` (after all agents complete)
5. **Step 4** — Completion summary

No step is optional. No agent count reduction. No page depth reduction.
