---
name: create-plugin
description: Guided end-to-end plugin creation workflow — from concept through implementation, validation, and documentation.
argument-hint: [plugin description or name]
---

# Lore: Create Plugin

Guide the user through creating a complete Claude Code plugin from initial concept to tested implementation. Follow a systematic phased approach.

**Initial request:** $ARGUMENTS

---

## Phase 1: Discovery

**Goal**: Understand what plugin needs to be built.

1. If plugin purpose is clear from arguments:
   - Summarize understanding
   - Identify plugin type (integration, workflow, analysis, toolkit)
2. If unclear, ask:
   - What problem does this plugin solve?
   - Who will use it?
   - Any similar plugins to reference?
3. Confirm understanding with user before proceeding.

---

## Phase 2: Component Planning

**Goal**: Determine needed components.

1. Analyze requirements and determine:
   - **Skills**: Specialized knowledge? (patterns, conventions)
   - **Commands**: User-initiated actions? (`/deploy`, `/configure`)
   - **Agents**: Autonomous tasks? (validation, generation)
   - **Hooks**: Event-driven automation? (pre-commit, post-tool)
   - **MCP Servers**: External service integration? (APIs, databases)
2. Present component plan as table:
   ```
   | Component | Count | Purpose |
   |-----------|-------|---------|
   | Skills    | N     | ...     |
   | Commands  | N     | ...     |
   | Agents    | N     | ...     |
   | Hooks     | N     | ...     |
   | MCP       | N     | ...     |
   ```
3. Get user confirmation.

---

## Phase 3: Detailed Design

**Goal**: Resolve all ambiguities before implementation.

For each planned component, identify underspecified aspects and ask the user:

- **Skills**: What triggers them? How detailed? Rigid or flexible?
- **Commands**: What arguments? What tools? Interactive or automated?
- **Agents**: Proactive or on-demand? What tools? Output format?
- **Hooks**: Which events? Prompt or command type?
- **MCP**: What runtime? What tools exposed? Auth needed?

Present all questions organized by component type. Wait for answers before proceeding.

---

## Phase 4: Plugin Structure

**Goal**: Create directory structure and manifest.

1. Determine plugin name (kebab-case)
2. Ask where to create it:
   - `lore/extensions/<name>/` (as lore extension)
   - `./<name>/` (standalone in current directory)
   - Custom path
3. Create structure:
   ```bash
   mkdir -p <plugin-path>/.claude-plugin
   mkdir -p <plugin-path>/skills     # if needed
   mkdir -p <plugin-path>/commands   # if needed
   mkdir -p <plugin-path>/agents     # if needed
   mkdir -p <plugin-path>/hooks      # if needed
   ```
4. Create `.claude-plugin/plugin.json`:
   ```json
   {
     "name": "<plugin-name>",
     "version": "0.1.0",
     "description": "<description>",
     "author": { "name": "LayerDynamics" }
   }
   ```

---

## Phase 5: Component Implementation

**Goal**: Create each component following lore conventions.

Read `lore/lib/conventions.md` before implementing any component.

### Skills
- Read `lore/templates/skill/SKILL.md` for structure
- Create `skills/<name>/SKILL.md` with frontmatter (`name`, `description`)
- Description is "Use when..." trigger phrase (third-person)
- Body in imperative form, 1500-2000 words max

### Commands
- Read `lore/templates/command/command-template.md` for structure
- Create `commands/<name>.md` with frontmatter (`name`, `description`, `user_invocable: true`)
- Instructions written FOR Claude to execute
- Specify minimal `allowed-tools`

### Agents
- Read `lore/templates/agent/agent-template.md` for structure
- Create `agents/<name>.md` with frontmatter (`name`, `description` with `<example>` blocks)
- Include concrete dispatch examples
- Specify tools list

### Hooks
- Create `hooks/hooks.json` with hook configuration
- Use `${CLAUDE_PLUGIN_ROOT}` for portability
- Prefer prompt-based hooks for complex logic

### MCP Servers
- Create `.mcp.json` with server configuration
- Use `${CLAUDE_PLUGIN_ROOT}` for command paths
- Document required environment variables

---

## Phase 6: Validation

**Goal**: Verify plugin quality.

1. Check all files exist and have correct structure
2. Verify frontmatter in all commands, skills, agents
3. Verify `.claude-plugin/plugin.json` is valid JSON
4. Verify `.mcp.json` is valid (if present)
5. Check naming conventions (kebab-case everywhere)
6. Report findings and fix any issues

---

## Phase 7: Documentation

**Goal**: Document the plugin.

1. Create `README.md` with:
   - Overview and purpose
   - Installation instructions
   - Available commands, skills, agents
   - Configuration (env vars, settings)
2. If plugin is a lore extension, offer to add it to the marketplace:
   - Read `.claude-plugin/marketplace.json` at the lore repo root
   - Add plugin entry with source, description, tags
3. Present creation summary:
   - Plugin name and purpose
   - Components created (counts)
   - Key files and structure
   - Testing instructions

---

## Key Principles

- Ask clarifying questions before implementing — do not assume
- Wait for user confirmation at each phase transition
- Follow lore conventions from `lore/lib/conventions.md`
- Use existing templates from `lore/templates/`
- Use `${CLAUDE_PLUGIN_ROOT}` for portability in hooks and MCP configs
- No placeholders or TODOs in shipped code
- Every component must have correct frontmatter

---

**Begin with Phase 1: Discovery**
