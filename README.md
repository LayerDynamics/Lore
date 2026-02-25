# Lore

**Opinionated meta skills & plugin framework for deterministic results with Claude Code.**

Lore bundles battle-tested skills, commands, agents, and workflows into a single Claude Code plugin. It provides structured approaches to common development tasks — from TDD and debugging to code review, feature research, and security scanning — so Claude follows repeatable, high-quality processes instead of improvising.

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/LayerDynamics/lore/main/install.sh | bash
```

The installer clones the repo into `~/.claude/plugins/_src/lore`, symlinks the plugin into `~/.claude/plugins/lore`, optionally sets up extensions (browserx, trellio, cc-telemetry, findlazy, mcp-trigger-gateway, scratchpad), and offers to launch Claude Code with a guided tour.

Verify the installation:

```bash
# In a Claude Code session:
/lore:list
```

## Quick Start

Once installed, Lore's skills and commands are available in any Claude Code session.

**List everything available:**

```text
/lore:list
```

**Run a security scan on your project:**

```text
/security-check:scan
```

**Start a TDD workflow:**

```text
Use the test-driven-development skill to implement [your feature]
```

**Plan a multi-step feature:**

```text
/planning-ext:plan
```

**Deep-dive into unfamiliar code:**

```text
/code-intel:investigate how does authentication work in this project?
```

**Research before building:**

```text
/research:research how to add WebSocket support --depth deep
```

**Review code without git:**

```text
/local:local-code-review src/
```

**Audit dependencies and configs:**

```text
/security-check:audit
```

---

## Skills (25)

Skills are the core abstraction — structured markdown workflows (each a `SKILL.md`) that guide Claude through complex tasks deterministically. Skills are invoked by name in conversation or triggered automatically based on context.

### Process & Execution Skills

| Skill | What It Does | When to Use |
| ----- | ------------ | ----------- |
| `brainstorming` | Collaborative dialogue to explore intent, requirements, and design before implementation. Proposes 2-3 approaches with trade-offs, gets approval, then writes a design doc. | Before any creative or feature work — always brainstorm first |
| `lifecycle-phases` | Enforces a Clarify → Plan → Execute → Review lifecycle with wave-based parallel execution for each phase. | Managing project execution through structured phases |
| `rarv-cycle` | Core execution loop: Reason → Act → Reflect → Verify. Every autonomous action follows this cycle — no step is optional. | Any autonomous or semi-autonomous work |
| `staying-on-request` | Enforces task boundaries — do exactly what was asked, nothing more. Surfaces adjacent issues as TODOs without fixing them. | When you discover adjacent issues or feel tempted to refactor |
| `context-engineering` | Manages agent context windows, preserves state across sessions, coordinates information flow between agents. | When context is getting large or coordinating multiple agents |
| `subagent-development` | Executes implementation plans by dispatching a fresh subagent per task with two-stage review (spec compliance + code quality) after each. | Executing implementation plans with independent tasks |
| `writing-plans` | Guided discovery followed by a structured implementation plan. Reads project context, asks about inclusions and dev practices, writes a bite-sized plan to `docs/plans/`. | When you have a spec or requirements for a multi-step task |

### Debugging & Investigation Skills

| Skill | What It Does | When to Use |
| ----- | ------------ | ----------- |
| `debug` | General debugging with root cause investigation. No fixes without understanding the cause first. | Encountering bugs, test failures, or unexpected behavior |
| `systematic-debugging` | Four-phase investigation methodology: reproduce → isolate → identify root cause → fix. Random fixes waste time. | Any bug or test failure — must complete all phases before proposing fixes |
| `deep-investigation` | Traces execution paths, follows call chains, maps service integrations, reads tests, surfaces exact `file:line` references. | Tracing how something works, investigating execution paths, preparing for code review |
| `reading-unfamiliar-code` | Efficiently orients in unfamiliar projects. Starts with entry points and project-level docs before reading source files. | New to a project, need to understand architecture before making changes |
| `outline-understanding-user-request` | Analyzes actual code (not docs) to understand ambiguous requests. Identifies affected systems and formulates clarifying questions. | Ambiguous requests that would drain context to understand |

### Code Quality & Review Skills

| Skill | What It Does | When to Use |
| ----- | ------------ | ----------- |
| `code-review-methodology` | Objective, git-free code review across six dimensions: quality, security, architecture, performance, testing gaps, documentation gaps. | Code reviews without git context, fresh-eyes audits |
| `pr-style-review` | Synthesizes investigation findings into a structured review with Critical/Important/Minor severity scoring. Only includes issues at 75%+ confidence. | Presenting technical findings as a structured code review |
| `pre-commit-review` | Last-chance sanity check on the specific diff before it becomes permanent. Scoped to the changes, not the whole codebase. | Before committing or creating PRs |
| `quality-gates` | Defines the gate system code must pass before shipping. | Reviewing code for merge readiness |
| `no-placeholders` | Zero tolerance for incomplete code. Scans for stubs, mocks, TODOs, deceptive comments, and language-native stubs. | Before claiming a feature is complete, during code reviews |
| `verify-before-documenting` | Ensures claims about code are verified against the actual implementation before documenting. | Code reviews, gap analysis, documentation audits |
| `verification-before-completion` | Requires running verification commands and reading actual output before making any success claim. | Before claiming work is complete, fixed, or passing |

### Research & Planning Skills

| Skill | What It Does | When to Use |
| ----- | ------------ | ----------- |
| `feature-research` | Five-phase pre-implementation research: orient → codebase analysis → external research → synthesis → blueprint. | Before implementing a new feature or integration |
| `codebase-pattern-analysis` | Systematic mapping of architecture, conventions, extension points, and similar features in an unfamiliar codebase. | Understanding codebase patterns before implementing something new |
| `implementation-blueprint` | Converts research findings into a precise, file-level, step-by-step implementation plan with risk register. | After research is complete and you need a concrete build plan |
| `test-driven-development` | Red → Green → Refactor. Write the test first, watch it fail, implement minimum passing code, then clean up. | Implementing any feature, bug fix, or behavior change |
| `test-coverage-analysis` | Analyzes both automated line-coverage metrics and behavioral coverage to find gaps. | Checking coverage, finding untested code, before adding tests |
| `standup-writing` | Generates standup updates from git history and current working state. | Daily standups, status updates |

---

## Commands (33 across 8 namespaces)

Commands are slash-command entry points that orchestrate skills and agents into specific workflows. Each command has a description, accepted arguments, and a defined set of allowed tools.

### `/lore:` — Framework Management (7 commands)

| Command | Arguments | What It Does |
| ------- | --------- | ------------ |
| `/lore:list` | — | Lists all available skills, commands, and agents with descriptions. Globs all component directories and extracts frontmatter. |
| `/lore:init` | — | Initializes lore in a project by creating/updating `.claude/settings.local.json` to include the lore plugin path. |
| `/lore:create-skill` | `<name> [--description "..."]` | Creates a new skill from template. Validates kebab-case naming, asks rigid vs. flexible, generates `skills/<name>/SKILL.md`. |
| `/lore:create-command` | `<name> [--namespace <ns>]` | Creates a new command. Discovers existing namespaces, lets you pick or create one, generates command `.md` with correct frontmatter. |
| `/lore:create-agent` | `<name> [--description "..."]` | Creates a new agent with dispatch examples and tool configuration. Generates `agents/<name>.md` with frontmatter and example blocks. |
| `/lore:create-mcp` | `<name> [--type stdio\|sse]` | Creates a new MCP server integration. Gathers runtime choice (Node/Python/Deno/Go), tools to expose, env vars needed, generates full directory structure. |
| `/lore:create-plugin` | `[description or name]` | Guided 7-phase plugin creation: discovery → component planning → design → structure → implementation → validation → documentation. |

### `/code-intel:` — Deep Code Investigation (2 commands)

| Command | Arguments | What It Does |
| ------- | --------- | ------------ |
| `/code-intel:investigate` | `<what to investigate>` | Dispatches a `code-explorer` agent to trace execution paths. Returns raw structured findings: entry points, execution paths, key `file:line` references, open questions. |
| `/code-intel:review` | `<topic to review>` | Decomposes the subject into 2-3 angles, dispatches `code-explorer` and `integration-mapper` in parallel, then hands findings to `review-synthesizer` for a PR-style review with Critical/Important/Minor/Strengths. |

### `/local:` — Local Development Tools (5 commands)

| Command | Arguments | What It Does |
| ------- | --------- | ------------ |
| `/local:local-code-review` | `[paths...] [--file]` | Dispatches parallel `code-reviewer` agents covering six review dimensions. Synthesizes into a unified review. Writes to `REVIEW.md` with `--file`. |
| `/local:review-files` | `<path> [path2...] [--file]` | Targeted code review on specific files/directories. Same six dimensions, scoped to exact paths. |
| `/local:explain` | `<file, function, or concept>` | Locates the target, reads supporting context (callers, types, tests), presents a layered explanation: what, why, how, dependencies, edge cases. |
| `/local:standup` | `[time range]` | Generates a standup from `git log` and `git status`. Produces Yesterday/Today/Blockers bullets — each under 15 words, 6-10 total. |
| `/local:diff-review` | `[focus area]` | Reviews all staged + unstaged git changes against checklists for logic, security, completeness, and tests. Returns READY or FIX BEFORE COMMITTING. |

### `/planning-ext:` — Implementation Planning (5 commands)

| Command | Arguments | What It Does |
| ------- | --------- | ------------ |
| `/planning-ext:plan` | `[task description]` | Loads the `writing-plans` skill. Silently reads project context, asks inclusion/practice questions, writes plan to `docs/plans/YYYY-MM-DD-<name>.md`, offers execution handoff. |
| `/planning-ext:continue` | `[path to plan file]` | Resumes an existing plan at the next incomplete task. Cross-references git log against plan tasks. Hands off to `subagent-driven-development` or `executing-plans`. |
| `/planning-ext:scope` | — | Audits the current git diff against the active plan. Reports in-scope changes, out-of-scope drift, completed tasks, remaining tasks. Verdicts: CLEAN / MINOR DRIFT / SIGNIFICANT DRIFT. |
| `/planning-ext:focus` | `[description of drift]` | Resets scope when Claude has drifted from the original request. Loads `staying-on-request`, re-anchors to the original ask. |
| `/planning-ext:list` | — | Lists all plans in `docs/plans/` sorted by date with goal, task count, and last-modified date. |

### `/research:` — Feature Research (4 commands)

| Command | Arguments | What It Does |
| ------- | --------- | ------------ |
| `/research:analyze` | `[path] [--focus <area>]` | Launches `codebase-pattern-scout` on the target. Presents architecture style, domain boundaries, similar features, extension points, naming conventions, testing patterns, and a 10-file reading order. |
| `/research:research` | `<feature> [--depth quick\|standard\|deep]` | Full feature research workflow. Quick: codebase only. Standard: codebase + external docs + blueprint. Deep: multiple architectural comparisons, risk matrix, rollout implications. Saves to `.feature-research/`. |
| `/research:blueprint` | `<feature> [--output markdown\|json]` | Converts existing research into an implementation blueprint. Launches `implementation-blueprint-generator`. Saves to `.feature-research/<feature>-blueprint-<date>.md`. |
| `/research:deep-research` | `<topic> [--sources code\|web\|all]` | Multi-source deep research combining codebase analysis, official docs, GitHub issues, Stack Overflow, and academic papers. Assesses source credibility. Saves to `.feature-research/deep-<topic>-<date>.md`. |

### `/quality:` — Code Quality (2 commands)

| Command | Arguments | What It Does |
| ------- | --------- | ------------ |
| `/quality:scan` | `[path]` | Five-pass grep scan for TODO/FIXME, stubs, deceptive phrases, language-native stubs, and empty function bodies. Structured report by severity with CLEAN or ISSUES FOUND verdict. |
| `/quality:fix` | `[path]` | Guided remediation session. Discovers all placeholders, triages each (implement now / ask user / skip test doubles), works through each in severity order, re-scans to confirm zero remain. |

### `/scale-review:` — Scaling and Load Review (5 commands)

| Command | Arguments | What It Does |
| ------- | --------- | ------------ |
| `/scale-review:frame-task` | `<task or file path>` | Defines scope boundaries (input, output, dependencies, user scope), identifies constraints (time, resource, concurrency, data), states what "works at scale" means at 10x and 100x with a hard failure point. Outputs a Task Frame for other scale-review commands. |
| `/scale-review:outline-load` | `<component path>` | Maps traffic patterns, data growth, resource consumption. Identifies entry points, traces ingress/processing/egress. Estimates load dimensions at current/10x/100x. Identifies bottlenecks (N+1, unbounded collections, global state). |
| `/scale-review:evaluate` | `<path> [--frame <frame>]` | Analyzes time complexity, space complexity, I/O patterns, data structures, and architecture. Scores each 1-5 for a /25 overall score. Produces Critical/Important/Minor findings. |
| `/scale-review:hone` | `<path> [--findings <eval>]` | Applies targeted optimizations based on evaluation findings: Map/Set replacements, streaming, connection pooling, batching, circuit breakers. Verifies each fix preserves behavior. |
| `/scale-review:test-scaling` | `<path> [--level 10x\|100x\|1000x]` | Generates a `scale-test.mjs` with realistic scaled data, runs baseline then target scale level, measures wall clock time and memory. Flags super-linear growth. |

### `/security-check:` — Security Scanning (3 commands)

| Command | Arguments | What It Does |
| ------- | --------- | ------------ |
| `/security-check:scan` | `[path]` | 10-pass vulnerability scan: hardcoded secrets, passwords, private keys, SQL injection, XSS, command injection, HTTP URLs, insecure configs, path traversal, weak crypto. Severity-stratified report. |
| `/security-check:audit` | `[path]` | 9-step dependency/config audit: npm audit, pip-audit, .env in VCS, sensitive files in git, file permissions, deprecated TLS/SSL, disabled cert verification, Docker security, missing security headers. Each finding includes remediation steps. |
| `/security-check:fix` | `[--severity critical\|high\|all]` | Guided remediation of scan findings. Walks through each by severity: secrets → env vars, SQL → parameterized queries, XSS → output encoding, weak hashing → bcrypt/argon2. Re-scans after all fixes. |

---

## Agents (9)

Agents are specialized subagents dispatched for parallel work. Each has a defined toolset and produces structured output. They are dispatched by commands or by the `subagent-development` skill.

### Investigation Agents

| Agent | Tools | What It Does |
| ----- | ----- | ------------ |
| `code-explorer` | Glob, Grep, Read, Bash | Traces execution paths from trigger to terminal side effect. Follows call chains across service boundaries, reads tests to identify edge cases, checks patterns against conventions. Returns: entry point, execution path, data transformations, cross-service boundaries, test coverage, open questions. |
| `integration-mapper` | Glob, Grep, Read, Bash | Maps all integration points: outbound HTTP calls (URL, method, auth, error handling), inbound endpoints, database access (table, operation, columns, transactions), Redis operations (key pattern, TTL), events. Flags gaps in error handling, fallbacks, and timeouts. |
| `codebase-pattern-scout` | Glob, Grep, Read, Bash | Maps architecture before implementation. Orients via README/manifests, identifies domain boundaries, traces end-to-end flows, discovers similar features, extracts naming/testing patterns, finds extension points. Returns a prioritized 10-file reading list. |

### Review Agents

| Agent | Tools | What It Does |
| ----- | ----- | ------------ |
| `review-synthesizer` | Read, Grep | Synthesizes investigation findings into a PR-style review. Assigns confidence scores (0-100), only surfaces issues at 75%+. Categorizes: Critical (90%+), Important (80%+), Minor (75%+). Every issue requires a `file:line` reference. |
| `code-reviewer` | Read, Glob, Grep, Bash | Deep code review across six dimensions (quality, security, architecture, performance, testing gaps, documentation gaps) without git context. Scores findings Critical/High/Medium/Low. Always includes Strengths. Uses Sonnet model for cost efficiency. |

### Research Agents

| Agent | Tools | What It Does |
| ----- | ----- | ------------ |
| `external-research-synthesizer` | WebFetch, WebSearch, Read | Researches external docs and APIs. Tries context7 MCP first for authoritative docs, falls back to WebSearch. Synthesizes: authoritative API, recommended approach, known failure modes, version caveats, working code example. |
| `implementation-blueprint-generator` | Read, Write | Converts research into a file-level blueprint: files to create/modify, new interfaces and types, data flow (happy + error path), test strategy, risk register, open questions. Saves to `.feature-research/`. |

### Stub Management Agents

| Agent | Tools | What It Does |
| ----- | ----- | ------------ |
| `stub-scanner` | Glob, Grep, Read, Bash | Multi-pass scan for incomplete code: language-native stubs (Critical), TODO/FIXME (High), placeholder returns (High), deceptive comments (Medium), stub variable names (Low). Exempts legitimate test doubles. Returns severity-stratified report with CLEAN or ISSUES FOUND verdict. |
| `stub-implementer` | Read, Edit, Write, Grep, Glob, Bash | Replaces stubs with real code. Triages each as implementable/needs-input/test-double. Reads full context (callers, types, patterns) before writing. Uses same conventions as the codebase. Verifies no stub patterns remain. Returns: files modified, stubs replaced, blockers. |

---

## Extensions (6)

Extensions are self-contained sub-plugins with their own MCP servers, commands, skills, and hooks. They are installed during the initial setup or individually via their `install.sh`/`postinstall.sh` scripts.

### browserx — Browser Automation

**Runtime:** Deno | **MCP Server:** Yes (stdio)

Full browser automation with three categories of MCP tools:

- **Query Tools** — SQL-like declarative queries against web pages (`browserx_query`, `browserx_query_async`, `browserx_query_explain`)
- **Browser Tools** — Session-based automation (`browser_navigate`, `browser_click`, `browser_type`, `browser_screenshot`, `browser_pdf`, `browser_evaluate`, `browser_query_dom`, `browser_wait`)
- **Proxy Tools** — Network caching and request interception (`proxy_cache_get/set/clear`, `proxy_add_interceptor`)

**Commands:** `/browse <url>`, `/screenshot <url>`, `/query <sql>`

**Hooks:** Intercepts `WebFetch` and `WebSearch` calls to route them through BrowserX instead.

```text
/query SELECT title, price FROM "https://example.com/products" WHERE price < 50
/browse https://docs.example.com
/screenshot https://example.com --full-page
```

**Setup:** Requires BrowserX repo. The postinstall script clones `github.com/LayerDynamics/BrowserX` and caches Deno dependencies.

---

### trellio — Trello Task Management

**Runtime:** Node.js | **MCP Server:** Yes (stdio)

Full Trello + n8n task management system with 40+ MCP tools and 18 slash commands. Wraps the Trello API with a structured 5-list pipeline: `reference → this_week → today → doing → done`.

**MCP Tool Categories:**

- **Board:** `trellio_get_board_snapshot`, `trello_get_board`, `trello_get_board_activity`
- **Tasks:** `trellio_quick_add_task`, `trellio_move_card_through_pipeline`, `trellio_batch_update_cards`
- **Coach:** `coach_assess_crash_state`, `coach_get_smallest_next_action`, `coach_generate_accountability_message`, `coach_weekly_completion_stats`
- **Search:** `trello_search_cards`, `trellio_get_energy_matched_tasks`
- **n8n Automation:** `n8n_list_workflows`, `n8n_trigger_workflow`, `n8n_get_execution_log`
- **Codebase:** `codebase_read_file`, `codebase_search`, `codebase_run_script`
- **Git:** `git_status`, `git_diff`, `git_log`, `git_commit`, `git_branch`

**Commands:** `/trellio-planning`, `/trellio-board`, `/trellio-add`, `/trellio-priority`, `/trellio-recovery`, `/trellio-cleanup`, `/trellio-status`, `/trellio-weekly`, `/trellio-backfill`, `/trellio-analyze-code`, `/trellio-extract-todos`, `/trellio-audit-docs`

**Setup:** Requires `TRELLO_API_KEY`, `TRELLO_TOKEN`, `TRELLO_BOARD_ID`, list IDs, and label IDs in environment. Run `setup-env.sh` for guided configuration.

---

### scratchpad — Collaborative Visual Canvas

**Runtime:** Node.js (TypeScript) | **MCP Server:** Yes (stdio)

Real-time collaborative visual canvas. Runs an HTTP + WebSocket server (port 9400) serving a browser UI where both Claude and the user can simultaneously interact with a shared canvas.

**Capabilities:** Draw shapes, add text, place images, create ASCII art, render markdown — all synced in real-time via WebSocket.

**Architecture:** Express HTTP server + WebSocket bridge between MCP and browser. Canvas state is maintained in-process.

**Setup:** Requires `npm run build` to compile TypeScript. Can run standalone with `--standalone` flag for browser-only mode.

---

### cc-telemetry — Session Analytics and Observability

**Runtime:** Python (daemon) | **MCP Server:** No (uses hooks + SQLite)

Comprehensive observability for Claude Code sessions. A background Python daemon watches `~/.claude/projects/**/*.jsonl` transcript files, parses every event, and stores them in SQLite (`~/.claude/telemetry/telemetry.db`).

**What it captures:** Tool calls, errors, thinking blocks, API metadata, hook events, messages, skill invocations, plugin usage.

**Hooks:** All 5 hook points wired — SessionStart, PreToolUse, PostToolUse, UserPromptSubmit, Stop.

**Commands (14):** `/cc-telemetry:sessions`, `/cc-telemetry:performance`, `/cc-telemetry:errors`, `/cc-telemetry:patterns`, `/cc-telemetry:plugins`, `/cc-telemetry:skills`, `/cc-telemetry:commands`, `/cc-telemetry:compare`, `/cc-telemetry:health`, `/cc-telemetry:insights`, `/cc-telemetry:live`, `/cc-telemetry:replay`, `/cc-telemetry:search-errors`, `/cc-telemetry:daemon`

**Skills (3):** `cc-telemetry` (data interpretation), `session-debugging` (diagnose session issues), `workflow-optimization` (usage-based improvement suggestions)

**CLI:** `cc-telemetry sessions`, `cc-telemetry tools`, `cc-telemetry stats`, `cc-telemetry errors`, `cc-telemetry live`, `cc-telemetry daemon status`

**Setup:** `install.sh` creates telemetry directory, symlinks CLI to `~/.local/bin/`, installs a launchd plist for macOS daemon autostart.

---

### mcp-trigger-gateway — Automation Trigger Engine

**Runtime:** Node.js (TypeScript) | **MCP Server:** Yes (stdio)

Event-driven automation gateway. Define triggers (cron, webhook, event, file watcher, manual) that fire actions (call MCP servers, make HTTP requests, run shell commands, chain triggers).

**MCP Tools (7):** `create_trigger`, `list_triggers`, `get_trigger`, `update_trigger`, `delete_trigger`, `fire_event`, `execute_trigger`

**Trigger types:** `cron` (scheduled), `webhook` (HTTP endpoint), `event` (custom named events), `watch` (file system changes), `manual` (on-demand)

**Action types:** `mcp_call` (invoke another MCP tool), `http` (REST API call), `shell` (run command), trigger chains

**Persistence:** Triggers stored in `~/.mcp-trigger-gateway/triggers.json`.

**Examples included:** Daily backup, API health monitor, GitHub deployment automation.

**Setup:** `postinstall.sh` runs `npm install` and compiles TypeScript. `service/install.sh` installs as a launchd agent (macOS) or systemd unit (Linux).

---

### findlazy — AI-Generated Code Smell Detection

**Runtime:** Deno | **MCP Server:** Yes (stdio)

Static analysis tool specifically designed to catch AI-generated code smells — placeholder logic, stub implementations, deceptive patterns that make code appear complete without being functional. Catches patterns like "for now", "in a real app", mock/simulated returns, `return None` stubs, and structurally sound dead code that evades linters.

**Dual interface:** CLI and MCP server modes.

**CLI commands:** `scan` (scan codebase), `trace` (trace specific pattern), `config` (manage configuration), `ignore` (add to ignore list), `clear` (clear cache)

**Supported languages:** TypeScript/Deno/Node, Python.

**Pattern files:** `patterns/common.json`, `patterns/python.json`, `patterns/typescript.json` — extensible pattern definitions.

**Configuration:** `findlazy.json` at project root (schema: `findlazy.schema.json`).

**Setup:** Requires Deno. `postinstall.sh` caches Deno dependencies.

---

## MCP Gateway

The Lore Gateway is a zero-dependency Node.js MCP server that exposes 44 tools over stdio JSON-RPC 2.0. It provides programmatic access to the entire framework.

### Tool Categories

| Category | Count | Examples |
| -------- | ----- | ------- |
| **Skills** | 13 | `lore_list_skills`, `lore_skill_info`, `lore_diagnose_skill`, `lore_repair_skill`, `lore_install_skill`, `lore_uninstall_skill`, `lore_backup_skill` |
| **Commands & Agents** | 2 | `lore_list_commands`, `lore_list_agents` |
| **Registry** | 5 | `lore_registry_register`, `lore_registry_get`, `lore_registry_list`, `lore_registry_unregister`, `lore_registry_clear` |
| **Filesystem** | 13 | `lore_tree`, `lore_locate`, `lore_read_file`, `lore_read_json`, `lore_write_file`, `lore_write_json`, `lore_append_file`, `lore_read_frontmatter`, `lore_file_exists` |
| **Paths** | 5 | `lore_root`, `lore_plugin_root`, `lore_resolve_skill_dir`, `lore_resolve_path`, `lore_list_skill_paths` |
| **Runner** | 6 | `lore_run_tool`, `lore_run_tool_async`, `lore_run_script`, `lore_start_mcp_server`, `lore_stop_mcp_server`, `lore_test_mcp_server` |
| **Logging** | 1 | `lore_log` |

---

## Hooks

Lore installs two hooks that run automatically during Claude Code sessions:

| Hook | Type | What It Does |
| ---- | ---- | ------------ |
| `start-session.sh` | SessionStart | Displays a welcome banner with framework version, checks extension availability, verifies MCP gateway and extension repos, reports status. |
| `verify-completion.sh` | Stop | Soft guardrail that checks if completion claims include verification evidence (test output, confirmed results). Warns but never blocks. |

---

## Project Structure

```text
lore/
├── .claude-plugin/
│   ├── plugin.json              # Plugin manifest (name, version, description)
│   └── marketplace.json         # Full plugin catalog (core + 6 extensions)
├── skills/                      # 25 workflow skills
│   └── <skill-name>/SKILL.md    # Each skill is a structured markdown workflow
├── commands/                    # 33 slash commands across 8 namespaces
│   ├── lore/                    # Framework management (7)
│   ├── code-intel/              # Deep code investigation (2)
│   ├── local/                   # Local development tools (5)
│   ├── planning-ext/            # Implementation planning (5)
│   ├── research/                # Feature research (4)
│   ├── quality/                 # Code quality (2)
│   ├── scale-review/            # Scaling and load review (5)
│   └── security-check/          # Security scanning (3)
├── agents/                      # 9 subagent definitions (.md)
├── hooks/                       # Session hooks
│   ├── hooks.json               # Hook configuration
│   ├── start-session.sh         # Welcome banner + extension checks
│   └── verify-completion.sh     # Completion verification guardrail
├── lib/                         # Shared utilities (zero dependencies)
│   ├── fs/                      # File system (read, write, tree, locate, find_configs)
│   ├── io/                      # I/O (echo, append, stdin, stdout)
│   ├── path/                    # Path resolution (resolve_path, resolve_skill, resolve_tool)
│   ├── run/                     # Runners (run_tool, run_mcp)
│   └── skills/                  # Skill management (list, info, doctor, repair, install, uninstall)
├── mcp/lore/gateway.js          # MCP Gateway server (44 tools, pure Node.js)
├── templates/                   # Scaffolding templates
│   ├── agent/                   # Agent template
│   ├── command/                 # Command template
│   ├── plugin/                  # Plugin template
│   └── skill/                   # Skill template
├── extensions/                  # Optional sub-plugins
│   ├── browserx/                # Browser automation (Deno + MCP)
│   ├── trellio/                 # Trello task management (Node.js + MCP)
│   ├── scratchpad/              # Visual canvas (Node.js + WebSocket + MCP)
│   ├── cc-telemetry/            # Session analytics (Python daemon + SQLite)
│   ├── mcp-trigger-gateway/     # Automation triggers (Node.js + MCP)
│   └── findlazy/                # AI code smell detection (Deno + MCP)
├── bin/install.sh               # Symlink installer (used by top-level install.sh)
├── postinstall.sh               # Extension setup runner
└── package.json                 # npm package (lore-framework)
```

## Customization

Create new components using the scaffolding commands:

```text
/lore:create-skill <name>       # New workflow skill from template
/lore:create-command <name>     # New slash command with namespace
/lore:create-agent <name>       # New subagent with dispatch examples
/lore:create-mcp <name>         # New MCP server integration
/lore:create-plugin             # Guided end-to-end plugin creation
```

Templates for each component type are in `templates/`. All generated components follow the conventions defined in `lib/conventions.md`.

## Credits

Lore reimplements and extends patterns from several excellent frameworks:

- [Superpowers](https://github.com/superpowers) — TDD, brainstorming, subagent-driven development, verification
- [GSD](https://github.com/gsd) — Lifecycle phases, context engineering, wave-based execution
- [Loki Mode](https://github.com/loki-mode) — RARV cycle, quality gates, memory patterns
- [SuperClaude](https://github.com/superclaude) — Confidence checking, self-check protocol

## License

MIT
