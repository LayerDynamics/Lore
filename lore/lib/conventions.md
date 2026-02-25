# Lore Conventions

## Skill Conventions

- Every skill lives in its own directory: `skills/<skill-name>/SKILL.md`
- Skill names use kebab-case
- Every SKILL.md starts with YAML frontmatter: `name`, `description`
- The `description` field is used for automatic skill matching — write it as a "when to use" trigger
- Skills are either **rigid** (follow exactly) or **flexible** (adapt principles to context)
- Mark which type in the skill content

## Command Conventions

- Commands are markdown files in `commands/<namespace>/<command>.md`
- Commands use frontmatter: `name`, `description`, `user_invocable: true`
- Namespaces group related commands (e.g., `lore/`, `quality/`, `research/`)
- Commands are user-facing slash commands — keep instructions actionable

## Agent Conventions

- Agents are markdown files in `agents/<agent-name>.md`
- Agent frontmatter: `name`, `description`, `when-to-use` (examples of when the agent should be dispatched)
- Agents are dispatched by the Task tool, not invoked directly by users
- Write clear tool access lists in agent definitions

## Hook Conventions

- Hooks live in `hooks/hooks.json`
- Shell scripts for hooks go in `hooks/`
- Use `${CLAUDE_PLUGIN_ROOT}` for paths within the plugin

## Extension Conventions

- Extensions are sub-plugins in `extensions/<name>/`
- Each extension has its own `.claude-plugin/plugin.json`
- Extensions can have their own commands, agents, skills, and MCP configs

## Coding Style

- Prefer clarity over cleverness
- If something is called but missing, implement it — don't remove the call
- Unused variables, methods, or imports should be used as intended, not deleted
- No placeholders, stubs, or TODO comments in shipped code
