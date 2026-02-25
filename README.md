# Lore

**Opinionated meta skills & plugin framework for deterministic results with Claude Code.**

Lore bundles battle-tested skills, commands, agents, and workflows into a single Claude Code plugin. It provides structured approaches to common development tasks — from TDD and debugging to code review, feature research, and security scanning — so Claude follows repeatable, high-quality processes instead of improvising.

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/LayerDynamics/lore/main/install.sh | bash
```

This clones the repo into `~/.claude/plugins/_src/lore`, symlinks the plugin into `~/.claude/plugins/lore`, optionally sets up extensions, and offers to launch Claude Code with a guided tour. Verify with `/lore:list` in a Claude Code session.

## Quick Start

Once installed, Lore's skills and commands are available in any Claude Code session.

**List everything available:**
```
/lore:list
```

**Run a security scan on your project:**
```
/security-check:scan
```

**Start a TDD workflow:**
```
Use the test-driven-development skill to implement [your feature]
```

**Plan a multi-step feature:**
```
/planning-ext:plan
```

**Deep-dive into unfamiliar code:**
```
/code-intel:investigate how does authentication work in this project?
```

## What's Included

### Skills (25)

Structured markdown workflows that guide Claude through complex tasks deterministically.

| Skill | Purpose |
|-------|---------|
| `brainstorming` | Explore intent, requirements, and design before implementation |
| `code-review-methodology` | Git-free code review from a fresh perspective |
| `codebase-pattern-analysis` | Analyze conventions and extension points in unfamiliar codebases |
| `context-engineering` | Manage agent context windows and information flow |
| `debug` | General debugging — no fixes without root cause investigation |
| `deep-investigation` | Trace execution paths and service integrations |
| `feature-research` | Research implementation approaches before writing code |
| `implementation-blueprint` | Convert research into file-level implementation plans |
| `lifecycle-phases` | Clarify → Plan → Execute → Review lifecycle |
| `no-placeholders` | Scan and replace stubs, mocks, and TODO code with real implementations |
| `outline-understanding-user-request` | Clarify ambiguous requests before draining context |
| `pr-style-review` | Structured code review output with severity scoring |
| `pre-commit-review` | Review changes before committing or creating PRs |
| `quality-gates` | Quality checkpoints code must pass before shipping |
| `rarv-cycle` | Reason → Act → Reflect → Verify execution loop |
| `reading-unfamiliar-code` | Quickly orient in an unfamiliar project |
| `standup-writing` | Generate standup updates from git history |
| `staying-on-request` | Prevent scope creep and unnecessary refactoring |
| `subagent-development` | Dispatch fresh subagents per task with two-stage review |
| `systematic-debugging` | Four-phase investigation before proposing fixes |
| `test-coverage-analysis` | Find untested code and coverage gaps |
| `test-driven-development` | Red → Green → Refactor TDD workflow |
| `verification-before-completion` | Verify before claiming work is done |
| `verify-before-documenting` | Verify claims about code before documenting them |
| `writing-plans` | Structured implementation planning with guided discovery |

### Commands (30 across 8 namespaces)

Slash commands for common workflows:

**`/lore:`** — Framework management
- `init` · `list` · `create-skill` · `create-command` · `create-agent` · `create-mcp` · `create-plugin`

**`/code-intel:`** — Deep code investigation
- `investigate` · `review`

**`/local:`** — Local development tools
- `local-code-review` · `review-files` · `explain` · `standup` · `diff-review`

**`/planning-ext:`** — Implementation planning
- `plan` · `continue` · `scope` · `focus` · `list`

**`/research:`** — Feature research
- `analyze` · `research` · `blueprint` · `deep-research`

**`/quality:`** — Code quality
- `scan` · `fix`

**`/scale-review:`** — Scaling and load review
- `frame-task` · `outline-load` · `evaluate` · `hone` · `test-scaling`

**`/security-check:`** — Security scanning
- `scan` · `audit`

### Agents (9)

Specialized subagents for parallel work:

| Agent | Purpose |
|-------|---------|
| `code-explorer` | Deep codebase exploration |
| `code-reviewer` | Standalone code review |
| `codebase-pattern-scout` | Find codebase conventions and patterns |
| `external-research-synthesizer` | Research and synthesize external docs |
| `implementation-blueprint-generator` | Generate file-level implementation blueprints |
| `integration-mapper` | Map integration points between components |
| `review-synthesizer` | PR-style review synthesis |
| `stub-scanner` | Find placeholder and stub code |
| `stub-implementer` | Replace stubs with real implementations |

### Extensions (6)

Optional sub-plugins with their own MCP servers or integrations:

| Extension | Description |
|-----------|-------------|
| `browserx` | Native browser automation — SQL-like queries, screenshots, scraping, form filling, proxy control |
| `trellio` | Trello-based task management with board operations, planning workflows, and priority-matched task retrieval |
| `scratchpad` | Collaborative visual canvas — browser-based drawing, text, images, ASCII art, and markdown synced via WebSocket |
| `cc-telemetry` | Deep telemetry and observability — tool calls, plugin usage, skill invocations, errors, and performance metrics |
| `mcp-trigger-gateway` | Event-driven gateway that fires actions across MCP servers, HTTP endpoints, and shell commands |
| `findlazy` | Static analysis for lazy-loaded code patterns, dead code, placeholder stubs, and unused imports |

### MCP Gateway

The Lore Gateway MCP server exposes 44 tools over stdio JSON-RPC 2.0, providing programmatic access to skills, registry, file system utilities, path resolution, and process management.

## Project Structure

```
lore/
├── .claude-plugin/
│   ├── plugin.json           # Plugin manifest
│   └── marketplace.json      # Full plugin catalog
├── skills/                   # 25 workflow skills (SKILL.md each)
├── commands/                 # Slash commands (8 namespaces)
│   ├── lore/
│   ├── code-intel/
│   ├── local/
│   ├── planning-ext/
│   ├── research/
│   ├── quality/
│   ├── scale-review/
│   └── security-check/
├── agents/                   # 9 subagent definitions (.md)
├── hooks/                    # Session hooks (hooks.json)
├── lib/                      # Shared utilities and conventions
│   ├── fs/                   # File system operations
│   ├── io/                   # I/O utilities
│   ├── path/                 # Path resolution
│   ├── run/                  # Tool and MCP server runners
│   └── skills/               # Skill management (list, info, doctor, repair, install)
├── mcp/lore/gateway.js       # MCP Gateway server
├── templates/                # Scaffolding templates (agent, command, plugin, skill)
├── extensions/               # Optional sub-plugins
│   ├── browserx/
│   ├── trellio/
│   ├── scratchpad/
│   ├── cc-telemetry/
│   ├── mcp-trigger-gateway/
│   └── findlazy/
├── bin/install.sh            # Symlink installer
└── package.json              # npm distribution
```

## Customization

**Create a new skill:**
```
/lore:create-skill
```

**Create a new command:**
```
/lore:create-command
```

**Create a new agent:**
```
/lore:create-agent
```

Templates for each component type are in `templates/`.

## Credits

Lore reimplements and extends patterns from several excellent frameworks:

- [Superpowers](https://github.com/superpowers) — TDD, brainstorming, subagent-driven development, verification
- [GSD](https://github.com/gsd) — Lifecycle phases, context engineering, wave-based execution
- [Loki Mode](https://github.com/loki-mode) — RARV cycle, quality gates, memory patterns
- [SuperClaude](https://github.com/superclaude) — Confidence checking, self-check protocol

## License

MIT
