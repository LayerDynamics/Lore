---
name: welcome
description: Comprehensive guide to the Lore plugin framework. Shows all skills, commands, agents, extensions, and MCP integrations with usage examples and live demos. Use --help <skill-name> for detailed help on any specific component.
argument-hint: "--help <skill-name>"
---

# Lore: Welcome

Parse `$ARGUMENTS` to determine mode:

- If `$ARGUMENTS` is empty or missing → **Welcome Mode**
- If `$ARGUMENTS` contains `--help` followed by a name → **Help Mode**
- If `$ARGUMENTS` is just `--help` with no name → **Help Mode** listing all available skills

---

## Welcome Mode

You MUST dynamically discover and present every component. Do NOT use hardcoded lists. Follow each step exactly.

### Step 1: Discover All Components

Run ALL of these Glob calls in parallel:

1. `Glob: skills/*/SKILL.md` (from the lore plugin install path)
2. `Glob: commands/*.md` (from the lore plugin install path)
3. `Glob: agents/*.md` (from the lore plugin install path)

Also check for extensions and hooks:
4. `Bash: ls extensions/ 2>/dev/null` (from the lore plugin install path)
5. `Read: hooks/hooks.json` (from the lore plugin install path)

The plugin install path can be found by checking where this skill was loaded from. If `${CLAUDE_PLUGIN_ROOT}` is available, use it. Otherwise, check `~/.claude/plugins/cache/local/lore/` for the cached version.

### Step 2: Read Every Skill's Frontmatter

For EVERY skill found in Step 1, read the first 5 lines of each SKILL.md to extract the `name` and `description` fields from the YAML frontmatter. Read them in parallel batches of 10.

Do NOT skip any skills. Every single one must appear in the output.

### Step 3: Read Every Agent's Frontmatter

For EVERY agent `.md` file found, read the first 5 lines to extract `name` and `description` from frontmatter.

### Step 4: Categorize Skills

Group each skill into one of these categories based on its description:

- **Development & Implementation** — planning, blueprints, task framing, continuing plans
- **Code Quality & Review** — code review, auditing, quality scanning, PR review
- **Debugging & Investigation** — debugging, investigating, explaining, tracing
- **Research & Analysis** — research, analysis, pattern finding, evaluation
- **Testing** — TDD, test coverage, test scaling
- **Security** — security scanning, vulnerability fixing
- **Planning & Process** — writing plans, brainstorming, scoping, staying on track
- **Documentation & Reporting** — doc writing, standups, verification
- **Meta & Framework** — creating skills/commands/agents/plugins, no-placeholders

If a skill doesn't fit neatly, use your best judgment.

### Step 5: Present the Full Guide

Output this structure with ALL real data from the scans:

```
# Welcome to Lore

**Lore** is a Claude Code plugin framework — [N] skills, [N] agents, [N] extensions — that gives Claude structured, deterministic workflows for complex tasks.

## Quick Start

| Command | What it does |
|---------|-------------|
| `/lore:welcome` | This guide |
| `/lore:welcome --help <name>` | Detailed help for any skill |
| `/lore:list` | Full component inventory |
| `/lore:init` | Initialize lore in a new project |
| `/lore:create-skill` | Create a new skill |

## All Skills

[For each category, output a table with EVERY skill in that category:]

### [Category Name]

| Skill | Description |
|-------|-------------|
| `/lore:<name>` | <description from frontmatter> |
...

[Repeat for ALL categories. Every skill must appear exactly once.]

## Agents

| Agent | Description |
|-------|-------------|
| `<name>` | <description from frontmatter> |
...

## Extensions

| Extension | Description |
|-----------|-------------|
...

## Hooks

| Event | Action |
|-------|--------|
| <event name> | <what the hook does> |
...

## Common Workflows

### New Feature
1. `/lore:brainstorming` — explore the idea
2. `/lore:plan` — write implementation plan
3. `/lore:continue` — resume at next task
4. `/lore:scope` — check for drift
5. `/lore:verification-before-completion` — verify before calling it done

### Bug Fix
1. `/lore:debug` or `/lore:systematic-debugging` — find root cause
2. `/lore:test-driven-development` — write failing test first
3. `/lore:diff-review` — review changes before commit

### Code Review
1. `/lore:local-code-review` — full project review (no git needed)
2. `/lore:review-files <paths>` — targeted file review
3. `/lore:diff-review` — review staged changes
4. `/lore:quality-scan` → `/lore:quality-fix` — find and fix issues

### Research & Understanding
1. `/lore:investigate <question>` — deep code exploration
2. `/lore:deep-research <topic>` — multi-phase research
3. `/lore:explain <code>` — explain any code or concept
4. `/lore:reading-unfamiliar-code` — systematic codebase understanding

### Security Audit
1. `/lore:security-check-scan` — find vulnerabilities
2. `/lore:security-check-fix` — fix what was found

### Building Lore Plugins
1. `/lore:create-plugin` — guided plugin creation
2. `/lore:create-skill` — add a skill
3. `/lore:create-command` — add a command
4. `/lore:create-agent` — add an agent
5. `/lore:create-mcp` — add MCP integration

## Live Demo

Here are some things you can try right now:

- `/lore:explain` — I'll explain any file or function in this project
- `/lore:standup` — I'll generate a standup from recent git commits
- `/lore:list` — I'll show the full component inventory
- `/lore:welcome --help debug` — I'll show detailed help for the debug skill

## Getting Help

For detailed help on any skill: `/lore:welcome --help <skill-name>`
```

**IMPORTANT:** The output MUST include every skill discovered in Step 1. Count them and verify the count matches. If the count in the header doesn't match the number of rows in the tables, you have missed some — go back and find them.

---

## Help Mode

### If `$ARGUMENTS` is `--help` with no skill name

List ALL available skills, agents, and extensions as a quick reference:

```
# Lore: Available Components

## Skills ([N] total)
<bullet list of every skill name with 1-line description>

## Agents ([N] total)
<bullet list of every agent name with 1-line description>

## Extensions ([N] total)
<bullet list of every extension name>

Use `/lore:welcome --help <name>` for detailed help on any component.
```

### If `$ARGUMENTS` is `--help <skill-name>`

#### Step 1: Parse the Skill Name

Extract the skill name. Strip any `lore:` prefix. Examples:
- `--help debug` → `debug`
- `--help lore:plan` → `plan`
- `--help systematic-debugging` → `systematic-debugging`

#### Step 2: Find the Component

Search in this order:
1. `skills/<name>/SKILL.md`
2. `commands/<name>.md`
3. `agents/<name>.md`

If not found, scan all available components and suggest the closest matches.

#### Step 3: Read the Full File

Read the ENTIRE file — not just frontmatter. You need the full content to synthesize a proper help page.

#### Step 4: Present Structured Help

Output:

```
# /lore:<name>

> <description from frontmatter>

## Usage

/lore:<name> <argument-hint if present, otherwise "no arguments required">

## What This Skill Does

<2-3 sentence summary you write by reading and understanding the full skill content. NOT a copy-paste — a genuine synthesis explaining what the skill does and why it matters.>

## Workflow Phases

<Read the skill's ## headings and numbered steps. Present each phase as a numbered item with a 1-sentence summary:>

1. **<Phase name>** — <what happens in this phase>
2. **<Phase name>** — <what happens in this phase>
...

## Key Rules & Principles

<Extract the most important rules, constraints, or principles from the skill. These are the things that make this skill different from just "doing the task without a skill.">

## When to Use

- <situation 1 where this skill is the right choice>
- <situation 2>
- <situation 3>

## When NOT to Use

- <situation where a different skill would be better, and which one>

## Related Skills

- `/lore:<related>` — <why these pair well together>
- `/lore:<related>` — <why these pair well together>
- `/lore:<related>` — <why these pair well together>

## Examples

<3 realistic invocations showing different use cases:>

```
/lore:<name> <example args>
```
<1-line explanation of what this invocation would do>

```
/lore:<name> <different example>
```
<1-line explanation>

```
/lore:<name> <another example>
```
<1-line explanation>
```

#### Step 5: Offer Next Steps

After the help page, say:

> Want to try it? Just run `/lore:<name>` to start.
> For help on a related skill: `/lore:welcome --help <related-skill>`
