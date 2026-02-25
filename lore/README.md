# Lore

Opinionated meta skills & plugin framework for deterministic results with Claude Code.

Lore bundles battle-tested skills, commands, agents, and workflows into a single Claude Code plugin. It provides structured approaches to common development tasks — from TDD and debugging to code review and feature research.

## Installation

### Option 1: Claude Code Plugin (Recommended)

```bash
claude plugin install lore
```

### Option 2: npm

```bash
npx lore-framework
```

### Option 3: Git Clone

```bash
git clone https://github.com/LayerDynamics/lore.git
cd lore/lore
./bin/install.sh
```

### Option 4: Direct Plugin Directory

```bash
claude --plugin-dir /path/to/lore/lore
```

## What's Included

### Skills (24)

Structured workflows that guide Claude through complex tasks:

| Skill | Purpose |
|-------|---------|
| `test-driven-development` | Red-green-refactor TDD workflow |
| `systematic-debugging` | Methodical bug investigation |
| `brainstorming` | Structured exploration before building |
| `verification-before-completion` | Verify before claiming done |
| `lifecycle-phases` | Clarify → Plan → Execute → Review |
| `quality-gates` | Quality checkpoints throughout work |
| `rarv-cycle` | Reason → Act → Reflect → Verify |
| `context-engineering` | Manage context window effectively |
| `subagent-development` | Parallel task execution with subagents |
| `code-review-methodology` | Git-free code review approach |
| `feature-research` | Research before implementing |
| `no-placeholders` | No stubs, mocks, or TODO code |
| `writing-plans` | Structured implementation planning |
| `debug` | General debugging skill |
| And more... | |

### Commands (20+)

Slash commands organized by namespace:

- `/lore:init`, `/lore:list`, `/lore:scaffold-skill`
- `/code-intel:investigate`, `/code-intel:review`
- `/local:local-code-review`, `/local:review-files`, `/local:explain`, `/local:standup`, `/local:diff-review`
- `/planning-ext:plan`, `/planning-ext:continue`, `/planning-ext:scope`, `/planning-ext:focus`, `/planning-ext:list`
- `/research:analyze`, `/research:research`, `/research:blueprint`
- `/quality:scan`, `/quality:fix`

### Agents (9)

Specialized subagents for parallel work:

- `code-explorer` — Deep codebase exploration
- `review-synthesizer` — PR-style review synthesis
- `integration-mapper` — Map integration points
- `code-reviewer` — Standalone code review
- `external-research-synthesizer` — Research external docs
- `implementation-blueprint-generator` — Generate blueprints
- `codebase-pattern-scout` — Find codebase patterns
- `stub-scanner` — Find placeholder code
- `stub-implementer` — Replace stubs with real code

### Extensions

Optional modules for specific tooling:

- `trellio` — Trello integration via MCP
- `browserx` — Browser automation via MCP

## Customization

See [Team Configuration](templates/team-config.md) for how to adapt Lore for your team.

See [Skill Authoring](docs/skill-authoring.md) for creating new skills.

## Project Structure

```
lore/
├── .claude-plugin/plugin.json    # Plugin manifest
├── commands/                     # Slash commands (grouped by namespace)
├── skills/                       # Workflow skills (SKILL.md each)
├── agents/                       # Subagent definitions
├── hooks/                        # Session and stop hooks
├── lib/                          # Conventions and templates
├── templates/                    # Scaffolding templates
├── extensions/                   # Optional sub-plugins
├── docs/                         # Documentation
├── bin/install.sh                # Manual installer
└── package.json                  # npm distribution
```

## Credits

Lore reimplements patterns inspired by several excellent frameworks:

- [Superpowers](https://github.com/superpowers) — TDD, brainstorming, subagent-driven-dev, verification
- [GSD](https://github.com/gsd) — Lifecycle phases, context engineering, wave-based execution
- [Loki Mode](https://github.com/loki-mode) — RARV cycle, quality gates, memory patterns
- [SuperClaude](https://github.com/superclaude) — Confidence checking, self-check protocol

## License

MIT
