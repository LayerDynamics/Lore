# Extending Lore

## Adding Skills

Create a new directory in `skills/` with a `SKILL.md`:

```bash
mkdir skills/my-skill
```

Use `/lore:scaffold-skill` or copy from `templates/skill/SKILL.md`.

## Adding Commands

Create a markdown file in `commands/<namespace>/`:

```bash
mkdir -p commands/my-namespace
```

Add frontmatter with `user_invocable: true` to make it a slash command.

## Adding Agents

Create a markdown file in `agents/`:

```bash
touch agents/my-agent.md
```

Define the agent's role, tools, and when-to-use conditions in frontmatter.

## Creating Extensions

Extensions are self-contained sub-plugins:

```ascii
extensions/my-extension/
├── .claude-plugin/
│   └── plugin.json
├── commands/
├── skills/
├── agents/
└── .mcp.json        # Optional MCP server config
```

## Adding MCP Servers

Create a `.mcp.json` in an extension directory:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "my-mcp-server"],
      "env": {
        "API_KEY": "..."
      }
    }
  }
}
```

## Publishing

### As npm Package

Update `package.json` version and publish:

```bash
npm publish
```

### As Git Repository

Push to GitHub and share the clone URL.

### To Marketplace

Follow Claude Code marketplace submission guidelines.
