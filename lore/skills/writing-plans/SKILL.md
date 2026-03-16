---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task and need a structured implementation plan — runs guided discovery before writing the plan
---

# Writing Plans

**Announce at start:** "Using writing-plans to create the implementation plan."

## Phase 1: Read Project Context (silent, no output)

Before asking anything:
1. Check for `CLAUDE.md` in the working directory and any parent up to `~/` — note the tech stack, conventions, testing approach, and any required patterns.
2. Run `git log --oneline -5` to understand recent work direction.
3. Identify the primary language/framework from file extensions in the working directory.

## Phase 2: Ask the User (AskUserQuestion — one at a time)

Ask these questions using the AskUserQuestion tool. Do NOT skip. Do NOT combine into one message.

**Question 1 — User-specified inclusions:**
Ask: "Are there specific skills, practices, or steps this plan must include or follow?"
- Build options dynamically from what you found in CLAUDE.md + project context
- Always offer: "No extras — just standard plan" and "Other (I'll type it)"
- Common options to offer when relevant: TDD, specific testing frameworks (Vitest, pytest, Go test), plugin-dev patterns, MCP integration, hook development, agent development, SDK app setup, architecture constraints

**Question 2 — Development practices:**
Ask: "Which development practices should this plan enforce?" (multiSelect: true)
- TDD (write failing test first, then implementation)
- Typed interfaces first (define types/schemas before logic)
- Contract-first (define API/interface before implementation)
- No specific practice required

**Question 3 — Skill inclusions (conditional):**
Only ask if the task involves any of: plugins, Claude Code extensions, MCP servers, agents, hooks, or SDK apps.
Ask: "Which plugin-dev skills should this plan reference?"
Map answers to @ syntax references for the plan:
- Plugin structure → `@plugin-dev:plugin-structure`
- Plugin settings → `@plugin-dev:plugin-settings`
- MCP integration → `@plugin-dev:mcp-integration`
- Hook development → `@plugin-dev:hook-development`
- Agent development → `@plugin-dev:agent-development`
- SDK app setup → `@agent-sdk-dev:new-sdk-app`

## Phase 3: Write the Plan

Save to `docs/plans/YYYY-MM-DD-<feature-name>.md`.

### Every plan MUST start with:

```markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **Scope guard:** Do ONLY what is listed here. If you discover adjacent issues, note them as a TODO and continue. Do NOT fix them.

**Goal:** [One sentence]
**Architecture:** [2-3 sentences]
**Tech Stack:** [Key technologies]
**Practices:** [TDD / typed-first / contract-first / none — from Phase 2 answers]
**Required skills:** [@ references from Phase 2 answers, or none]

---
```

### Task structure (bite-sized — each step 2-5 minutes):

For TDD tasks:

```markdown
### Task N: [Name]

**Files:**
- Create: `exact/path/file.ts`
- Modify: `exact/path/existing.ts:45-67`
- Test: `exact/path/test.ts`

**Step 1: Write the failing test**
[exact test code]

**Step 2: Run to verify it fails**
`[exact command]` → Expected: FAIL

**Step 3: Write minimal implementation**
[exact implementation code]

**Step 4: Run to verify it passes**
`[exact command]` → Expected: PASS

**Step 5: Commit**
`git add [files] && git commit -m "[type]: [description]"`
```

### Remember
- Exact file paths always (no "something like" or "e.g.")
- Complete code in the plan (not "add validation logic")
- Exact commands with expected output
- DRY, YAGNI — remove anything not strictly needed for the request
- Reference skills with @ syntax if they were requested

## Phase 4: Execution Handoff

After saving the plan, offer:

> **"Plan saved to `docs/plans/<filename>.md`. Two execution options:**
>
> **1. Subagent-Driven (this session)** — Fresh subagent per task, review between tasks
> **2. Parallel Session (separate)** — Open new session, use `superpowers:executing-plans`
>
> **Which?"**

- If Subagent-Driven → invoke `superpowers:subagent-driven-development`
- If Parallel Session → guide to new session with `superpowers:executing-plans`