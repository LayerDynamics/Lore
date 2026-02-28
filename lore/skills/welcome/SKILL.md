---
name: welcome
description: Comprehensive guide to the Lore plugin framework. Shows all skills, commands, agents, extensions, and MCP integrations with usage examples. Use --help <skill-name> for detailed help on a specific skill.
argument-hint: [--help <skill-name>]
user-invocable: true
allowed-tools: ["Read", "Glob", "Grep", "Bash"]
---

# Lore: Welcome

You are presenting the Lore plugin framework to the user. Parse `$ARGUMENTS` to determine mode:

- If `$ARGUMENTS` contains `--help` followed by a skill name → **Help Mode**
- Otherwise → **Welcome Mode**

---

## Welcome Mode

Present the full framework overview. Read files as needed to build accurate counts but do NOT dump raw file contents — synthesize into a polished guide.

### Step 1: Scan Plugin Contents

Run these in parallel to gather counts:

```
Glob: ${CLAUDE_PLUGIN_ROOT}/skills/*/SKILL.md
Glob: ${CLAUDE_PLUGIN_ROOT}/commands/*.md
Glob: ${CLAUDE_PLUGIN_ROOT}/agents/*.md
Glob: ${CLAUDE_PLUGIN_ROOT}/extensions/*/
```

### Step 2: Present the Welcome Guide

Output the following structure, filling in real counts and names from Step 1:

---

```markdown
# Welcome to Lore

**Lore** is a Claude Code plugin framework that bundles skills, commands, agents, hooks, and extensions into a single installable plugin. It gives Claude structured workflows for complex tasks — debugging, planning, code review, research, and more.

## Quick Start

| Command | What it does |
|---------|-------------|
| `/lore:welcome` | This guide |
| `/lore:welcome --help <name>` | Detailed help for any skill |
| `/lore:list` | Inventory of all components |
| `/lore:init` | Initialize lore in a new project |

## Skills — Structured Workflows

Skills are the core abstraction. Each is a step-by-step workflow that guides Claude through complex tasks deterministically. Invoke with `/lore:<skill-name>`.

### Development & Implementation

| Skill | When to use |
|-------|-------------|
| `plan` | Guided implementation planning with structured phases |
| `blueprint` | Generate implementation blueprint from requirements |
| `continue` | Resume an existing plan at the next incomplete task |
| `scope` | Audit git diff against active plan for drift |
| `focus` | Reset scope when Claude drifts from original request |
| `frame-task` | Break ambiguous requests into structured task definitions |

### Code Quality & Review

| Skill | When to use |
|-------|-------------|
| `review` | Deep investigation + PR-style code review |
| `local-code-review` | Comprehensive git-free code review |
| `review-files` | Targeted review on specific files |
| `diff-review` | Review staged + unstaged git changes before commit |
| `audit` | Full codebase audit for quality, security, architecture |
| `quality-scan` | Scan for code quality issues |
| `quality-fix` | Fix issues found by quality-scan |
| `pre-commit-review` | Review changes before committing |
| `code-review-methodology` | Objective code review methodology |
| `pr-style-review` | Synthesize findings into PR-style review format |

### Debugging & Investigation

| Skill | When to use |
|-------|-------------|
| `debug` | Systematic root cause investigation |
| `systematic-debugging` | Extended debugging with 4-phase methodology |
| `investigate` | Deep code exploration returning structured findings |
| `deep-investigation` | Trace execution paths across service boundaries |
| `explain` | Explain any code, function, or architecture |
| `reading-unfamiliar-code` | Systematic approach to understanding new codebases |

### Research & Analysis

| Skill | When to use |
|-------|-------------|
| `research` | Structured codebase research |
| `deep-research` | Multi-phase deep research with parallel agents |
| `feature-research` | Research how to implement a feature in the codebase |
| `codebase-pattern-analysis` | Analyze conventions, patterns, and extension points |
| `analyze` | General-purpose code analysis |
| `evaluate` | Evaluate approaches, trade-offs, and decisions |

### Testing

| Skill | When to use |
|-------|-------------|
| `test-driven-development` | TDD workflow: red, green, refactor |
| `test-coverage-analysis` | Find untested code and coverage gaps |
| `test-scaling` | Scale test suites for large codebases |

### Security

| Skill | When to use |
|-------|-------------|
| `security-check-scan` | Comprehensive security vulnerability scan |
| `security-check-fix` | Fix vulnerabilities found by security-check-scan |

### Planning & Process

| Skill | When to use |
|-------|-------------|
| `writing-plans` | Write structured implementation plans |
| `outline-load` | Load and apply an outline or spec as context |
| `outline-understanding-user-request` | Break down ambiguous requests into structured task definitions |
| `brainstorming` | Creative exploration before building |
| `staying-on-request` | Prevent scope drift |
| `lifecycle-phases` | Understand project lifecycle phases |
| `context-engineering` | Optimize context window usage |
| `design-outliner` | Outline system designs and architectures |

### Documentation & Reporting

| Skill | When to use |
|-------|-------------|
| `doc-writer` | Write documentation for code |
| `standup` | Generate daily standup from git history |
| `standup-writing` | Write standup updates |
| `verify-before-documenting` | Verify claims before documenting them |
| `hone` | Iteratively refine and improve content |

### Meta & Framework

| Skill | When to use |
|-------|-------------|
| `create-skill` | Create a new skill from template |
| `create-command` | Create a new command |
| `create-agent` | Create a new agent definition |
| `create-mcp` | Create a new MCP server integration |
| `create-plugin` | Guided end-to-end plugin creation |
| `no-placeholders` | Detect and replace placeholder/stub code |
| `subagent-development` | Build specialized subagents |
| `dispatching-parallel-agents` | Run 2+ independent tasks in parallel |
| `systematic-review` | Comprehensive systematic review process |
| `verification-before-completion` | Verify work is complete before claiming done |
| `rarv-cycle` | Read-Analyze-Respond-Verify cycle |
| `quality-gates` | Define and enforce quality gates |

## Agents — Specialized Subagents

Agents are dispatched by Claude for parallel or specialized work. They run autonomously and return findings.

| Agent | Specialization |
|-------|---------------|
| `code-explorer` | Fast codebase exploration and search |
| `code-reviewer` | Deep objective code review |
| `codebase-pattern-scout` | Find patterns and conventions in code |
| `external-research-synthesizer` | Research external docs and synthesize |
| `implementation-blueprint-generator` | Generate implementation blueprints |
| `integration-mapper` | Map cross-module dependencies |
| `review-synthesizer` | Synthesize review findings into reports |
| `stub-scanner` | Find placeholder/stub code |
| `stub-implementer` | Replace stubs with real implementations |

## Extensions — Optional Sub-Plugins

Extensions add specialized capabilities via MCP servers and integrations.

| Extension | What it adds |
|-----------|-------------|
| `browserx` | Browser automation engine |
| `cc-telemetry` | Deep telemetry and observability for Claude Code |
| `trellio` | Trello task management integration |
| `findlazy` | Detect placeholder/stub code left by AI agents |
| `mcp-trigger-gateway` | Cron, webhook, and file-watcher triggers via MCP |
| `scratchpad` | Ephemeral scratchpad workspace |

To set up extensions, run: `bash ~/.claude/plugins/_src/lore/lore/extensions/<name>/postinstall.sh`

## Hooks — Automatic Behaviors

| Hook | Trigger | Action |
|------|---------|--------|
| SessionStart | New session begins | Displays welcome message |
| Stop | Claude attempts to stop | Verifies tests pass and work is complete |

## Common Workflows

### Start a new feature
```
/lore:brainstorming Add user authentication
/lore:plan Add JWT-based auth with refresh tokens
/lore:continue
```

### Debug a failing test
```
/lore:debug
/lore:systematic-debugging
```

### Review code before committing
```
/lore:diff-review
/lore:pre-commit-review
```

### Research how something works
```
/lore:investigate how does the payment flow work
/lore:deep-research authentication architecture
```

### Create new plugin components
```
/lore:create-skill
/lore:create-agent
/lore:create-plugin
```

## Getting Help

- `/lore:welcome --help <skill-name>` — Detailed usage guide for any skill
- `/lore:list` — Full component inventory with metadata
- `/lore:explain <topic>` — Explain any code or concept
```

---

## Help Mode

When `$ARGUMENTS` contains `--help` followed by a skill name:

### Step 1: Parse the Skill Name

Extract the skill name from arguments. Strip any `lore:` prefix if present. Examples:
- `--help debug` → skill name is `debug`
- `--help lore:plan` → skill name is `plan`
- `--help systematic-debugging` → skill name is `systematic-debugging`

### Step 2: Find the Skill

Look for the skill in this order:
1. `${CLAUDE_PLUGIN_ROOT}/skills/<skill-name>/SKILL.md`
2. `${CLAUDE_PLUGIN_ROOT}/commands/<skill-name>.md`
3. `${CLAUDE_PLUGIN_ROOT}/agents/<skill-name>.md`

If not found, run:
```
Glob: ${CLAUDE_PLUGIN_ROOT}/skills/*/SKILL.md
Glob: ${CLAUDE_PLUGIN_ROOT}/commands/*.md
Glob: ${CLAUDE_PLUGIN_ROOT}/agents/*.md
```

Then list all available names and suggest the closest matches to what the user typed.

### Step 3: Read and Present

Read the full skill file. Extract:
- **Name** from frontmatter or first heading
- **Description** from frontmatter
- **Allowed tools** from frontmatter
- **Arguments** from `argument-hint` in frontmatter
- **Full workflow phases** from markdown headings

Present as a structured help page:

```markdown
# /lore:<skill-name>

> <description from frontmatter>

## Usage

/lore:<skill-name> <argument-hint or "no arguments required">

## What This Skill Does

<2-3 sentence summary synthesized from the skill content — not a copy-paste, a genuine summary>

## Workflow Phases

<Numbered list of each major phase/step from the skill, with 1-sentence summary each>

## Tools Used

<List of allowed tools and what they're used for in this skill's context>

## Related Skills

<List 2-4 skills that pair well with this one, with 1-line explanation of the pairing>

## Examples

<2-3 realistic example invocations with different argument patterns>
```

### Step 4: Suggest Next Steps

After presenting help, suggest:
- Related skills the user might want to explore next
- Common workflows that chain this skill with others
- A concrete next action the user could take right now
