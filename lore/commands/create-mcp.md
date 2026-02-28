---
name: create-mcp
description: Create a new MCP server integration in the lore framework with transport configuration and tool registration.
argument-hint: <server-name> [--type stdio|sse]
---

# Lore: Create MCP

Create a new MCP (Model Context Protocol) server integration in the lore framework.

## Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- **Server name** (required): kebab-case name (e.g., `database-tools`)
- **Transport type** (optional): `--type stdio` or `--type sse` (defaults to `stdio`)

If server name is missing, ask the user:
> What should the MCP server be named? (use kebab-case, e.g., `database-tools`)

## Step 2: Gather MCP Details

Ask the user:

1. **What does this MCP server provide?** (tools, resources, or both)
2. **What runtime?** Options:
   - Node.js (TypeScript/JavaScript)
   - Python
   - Deno
   - Go
3. **Where should it live?**
   - As a new lore extension: `lore/extensions/<server-name>/`
   - In the current project
   - Custom path
4. **What tools will it expose?** List the tool names and brief descriptions.
5. **Does it need environment variables?** (API keys, config paths, etc.)

## Step 3: Create the Directory Structure

Based on runtime selection, create:

### For Node.js (TypeScript):
```
<target-dir>/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json
├── src/
│   └── index.ts
├── package.json
└── tsconfig.json
```

### For Deno:
```
<target-dir>/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json
├── src/
│   └── server.ts
└── Deno.json
```

### For Python:
```
<target-dir>/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json
├── src/
│   └── server.py
└── requirements.txt
```

## Step 4: Create the Plugin Manifest

Create `.claude-plugin/plugin.json`:

```json
{
  "name": "<server-name>",
  "description": "<description>",
  "version": "0.1.0",
  "author": {
    "name": "LayerDynamics"
  }
}
```

## Step 5: Create the MCP Configuration

Create `.mcp.json`:

### For stdio transport:
```json
{
  "mcpServers": {
    "<server-name>": {
      "command": "<runtime-command>",
      "args": [<runtime-args>],
      "cwd": "."
    }
  }
}
```

### For SSE transport:
```json
{
  "mcpServers": {
    "<server-name>": {
      "type": "sse",
      "url": "http://localhost:<port>/sse"
    }
  }
}
```

Use `${CLAUDE_PLUGIN_ROOT}` for paths that reference files within the plugin directory.

## Step 6: Create the Server Skeleton

Generate a minimal MCP server using `@modelcontextprotocol/sdk` that registers the user's specified tools. Each tool should have:
- A descriptive name
- Input schema with proper validation
- A handler function with implementation

Include proper imports, server initialization, and transport setup for the chosen runtime.

## Step 7: Confirm

Output:

```
MCP server created: <server-name>

Created:
  <target-dir>/.claude-plugin/plugin.json
  <target-dir>/.mcp.json
  <target-dir>/src/<entry-file>
  <target-dir>/<config-file>

Tools registered:
  - <tool-1>: <description>
  - <tool-2>: <description>

Next steps:
  1. Implement the tool handlers in src/<entry-file>
  2. Install dependencies: <install-command>
  3. Test the server: <start-command>
  4. Add to lore marketplace if distributing: edit .claude-plugin/marketplace.json
```
