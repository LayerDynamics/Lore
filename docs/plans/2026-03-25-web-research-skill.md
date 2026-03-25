# Implementation Plan: Web Research Skill

**Date:** 2026-03-25
**Spec:** docs/specs/SPEC-1-web-research-skill.md
**Goal:** Build `lore/skills/web-research/SKILL.md` — a deep multi-agent web research skill that mirrors Claude's browser research mode. Dispatches a QueryExpander agent, minimum 4 parallel Research Agents (each reading ≥10 pages per query), and a concurrent ResearchReportWriter agent that produces a Draft and Final report. All agent logic is inline in the SKILL.md (no separate agent files). Output goes to `.web-research/{{topic-slug}}/`.

---

## Decisions Recorded

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Agent files | Inline in SKILL.md only | No separate .md files; all agent instructions embedded in the skill workflow |
| Configurability | Hardcoded minimums (4 agents, 10 pages), `--agents N` and `--depth N` optional | Sensible defaults, power-user override |
| .gitignore | Add `.web-research/` to root `.gitignore` | Research artifacts are large and local-only |
| Command entry | Skill only | No separate command file needed |
| Report writer timing | Concurrent — dispatched alongside research agents, uses Glob/Read to poll for completed findings files | User wants live draft updates while research runs |
| Report output | Both `Report-Draft.md` (incremental) and `Report-Final.md` (post-completion polished) | Draft shows progress; Final is the deliverable |

---

## Tasks

### Task 1: Add `.web-research/` to .gitignore

**File:** `/Users/ryanoboyle/lore/.gitignore`
**What:** Append `.web-research/` to the root `.gitignore` so research output directories are never committed.
**Acceptance:** `cat .gitignore` shows `.web-research/` entry.

---

### Task 2: Write the SKILL.md — Frontmatter, Purpose, and Argument Parsing

**File:** `lore/skills/web-research/SKILL.md`
**What:** Write the complete skill file from scratch. This task covers:
- Frontmatter: `name`, `description` (trigger phrases: "research", "look up", "find everything about", "deep research", "web research"), `argument-hint`
- Purpose statement and "when to use" section
- Argument parsing: extract topic string, derive slug (lowercase hyphens), parse `--agents N` (default 4) and `--depth N` (default 10) and `--focus <angle>` optional flag
- Output directory setup instruction: create `.web-research/{{slug}}-{{YYYY-MM-DD}}/` if it does not exist
- Clear statement that every step is mandatory every invocation

**Acceptance:** Frontmatter is valid (no IDE diagnostics), argument parsing section covers all three optional flags with documented defaults.

---

### Task 3: Write the QueryExpander Agent section in SKILL.md

**File:** `lore/skills/web-research/SKILL.md`
**What:** The first agent section. Inline agent instructions (no separate file) covering:
- **Role:** Given the root topic, perform initial web searches to identify ≥5 related/adjacent/prerequisite topics
- **Process:**
  1. Run 3–5 WebSearch queries on the root topic
  2. Read the top results to understand the topic's domain, terminology, and adjacent subjects
  3. Score each related topic by relevance: High / Medium / Low
  4. Assign a distinct query angle to each Research Agent slot (Agent 1 = fundamentals/docs, Agent 2 = implementations/examples, Agent 3 = pitfalls/gotchas/criticism, Agent 4 = alternatives/ecosystem, Agent 5+ = one per High-relevance expanded topic)
  5. Write `ExpandedSearches.md` with the relevance table and angle assignments
- **Output format** for `ExpandedSearches.md` (exact markdown schema as in spec Appendix B)
- **Gate:** Skill does not dispatch Research Agents until `ExpandedSearches.md` exists

**Acceptance:** Section instructs the agent to write ExpandedSearches.md with a relevance-scored table and numbered agent angle assignments.

---

### Task 4: Write the Research Agent section in SKILL.md

**File:** `lore/skills/web-research/SKILL.md`
**What:** Inline agent instructions for the N Research Agents (same instructions, different angle per agent). Covers:
- **Context each agent receives:** root topic, expanded searches (read from `ExpandedSearches.md`), assigned query angle (from angle assignment table), agent number N, output path `Agent{N}Findings.md`, minimum page depth (default 10, overridden by `--depth`)
- **Per-agent process:**
  1. Read `ExpandedSearches.md` to get full context and assigned angle
  2. Construct 3–5 search queries that cover the assigned angle AND weave in the High-relevance expanded topics
  3. For each query: run WebSearch, enumerate results, read ≥10 result pages with WebFetch (not just snippets — full page content)
  4. For each page read: extract and record findings inline; immediately append the URL to `Sources.md`
  5. After all queries complete: write `Agent{N}Findings.md` with full structured findings (schema from spec section 3.3)
  6. Write a `## COMPLETE` marker at the end of the findings file so the ResearchReportWriter can detect completion
- **URL source logging:** append-only writes to `Sources.md` — format: `- [title](url)` under an `## Agent N` section header
- **Minimum depth enforcement:** agent must not stop at fewer than `--depth` (default 10) pages per query
- **Parallel dispatch:** all N research agents are dispatched in parallel via the Task tool's background mode

**Acceptance:** Section specifies the `## COMPLETE` marker convention, the append-to-Sources.md protocol, and the minimum page depth requirement.

---

### Task 5: Write the ResearchReportWriter Agent section in SKILL.md

**File:** `lore/skills/web-research/SKILL.md`
**What:** Inline agent instructions for the ResearchReportWriter, dispatched concurrently alongside Research Agents. Covers:
- **Context received:** topic slug, output directory path, expected agent count N, list of expected findings file paths
- **Phase A — Incremental Draft:**
  1. Poll using Glob for completed findings files: check for `## COMPLETE` marker at end of each `Agent{N}Findings.md`
  2. After first findings file is complete: read it, write initial `Report-Draft.md` with available content
  3. After each subsequent findings file completes: read it, re-read all previous findings, update `Report-Draft.md`
  4. Mark draft header: `[DRAFT — N of M agents complete]`
  5. Continue polling until all M findings files contain the `## COMPLETE` marker
- **Phase B — Final Report (gate: ALL findings complete):**
  1. Confirm all M expected findings files exist and contain `## COMPLETE`
  2. Read all findings files fresh (do not rely on in-memory state from draft phase)
  3. Read `Sources.md` for full citation list
  4. Write `Report-Final.md` with:
     - Executive Summary (synthesized from all agents, 3–5 paragraphs)
     - Key Findings (top 10 cross-agent insights, each with inline citation)
     - Deep Dives by subtopic (organized thematically — not by agent — with citations)
     - Conflicts and Contradictions (where agents found conflicting information)
     - Conclusion and Recommendations
     - Full References section (all URLs from Sources.md, deduplicated and sorted)
- **Polling mechanism:** use Glob to check for existence of each findings file; use Read to check for the `## COMPLETE` marker; repeat until all found
- **Hard gate:** never write `Report-Final.md` if any expected findings file is missing or lacks `## COMPLETE`

**Acceptance:** Phase A and Phase B are clearly separated; the `## COMPLETE` gate is explicit; the final report structure matches the spec; polling via Glob/Read is documented.

---

### Task 6: Write the Completion Section in SKILL.md

**File:** `lore/skills/web-research/SKILL.md`
**What:** After all agents complete, the skill presents a summary to the user:
- Lists all output files created with their paths
- Shows agent count, pages read (if available from findings files), source count from `Sources.md`
- Shows final report path
- Notes any agents that failed or produced incomplete findings
- Standard completion format block (as per other lore skills)

Also include:
- **Red Flags section** — conditions that mean research is not complete (missing `## COMPLETE` markers, Report-Final.md not yet written, Sources.md empty)
- **Note on timing** — explicitly state the skill is designed to take a long time; thoroughness is the goal

**Acceptance:** Completion block, Red Flags section, and timing note are all present.

---

### Task 7: Validate the complete SKILL.md

**What:**
1. Check IDE diagnostics on the file (zero errors required)
2. Read the file back top-to-bottom and verify:
   - All 6 steps are present (query expansion → research agents → report writer → completion)
   - Frontmatter is valid and description covers all trigger phrases
   - `## COMPLETE` marker convention is consistent across Task 4 and Task 5 sections
   - Sources.md append protocol is consistent across all agent sections
   - No empty sections, no placeholder text, no "TODO" comments
3. Verify `.gitignore` contains `.web-research/`

**Acceptance:** Zero diagnostics, all cross-references consistent, no stubs.

---

## Execution Order

```
Task 1 (gitignore)  ──────────────────────────────────────────► done
Task 2 (frontmatter + arg parsing)  ──────────────────────────► done
Task 3 (QueryExpander section)       depends on Task 2 ────────► done
Task 4 (Research Agent section)      depends on Task 3 ────────► done
Task 5 (ReportWriter section)        depends on Task 4 ────────► done
Task 6 (Completion section)          depends on Task 5 ────────► done
Task 7 (Validation)                  depends on Tasks 1–6 ─────► done
```

Tasks 2–6 are sequential writes to the same file — each builds on the previous.
Task 1 is independent and can run in parallel with Task 2.

---

## File Inventory

| File | Action |
|------|--------|
| `lore/skills/web-research/SKILL.md` | Write (currently empty) |
| `.gitignore` | Edit — append `.web-research/` |

No other files are created or modified. Agent logic is entirely inline in SKILL.md.

---

## Definition of Done

- [ ] `lore/skills/web-research/SKILL.md` is complete with no stubs, no placeholders, no empty sections
- [ ] All five inline agent sections are present: QueryExpander, Research Agent (×N), ResearchReportWriter (Phase A + Phase B)
- [ ] `## COMPLETE` marker convention documented in both Research Agent and ResearchReportWriter sections
- [ ] Sources.md append protocol documented in Research Agent section
- [ ] Report-Draft.md and Report-Final.md both produced by ResearchReportWriter
- [ ] `.gitignore` contains `.web-research/`
- [ ] Zero IDE diagnostics on the skill file
- [ ] No TODOs, no "implement later", no placeholder text anywhere in the file
