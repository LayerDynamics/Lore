# FindLazy

> Detect lazy, incomplete, and deceptive code patterns in your codebase

[![JSR](https://jsr.io/badges/@findlazy/findlazy)](https://jsr.io/@findlazy/findlazy)
[![JSR Score](https://jsr.io/badges/@findlazy/findlazy/score)](https://jsr.io/@findlazy/findlazy)

FindLazy is a code analysis tool and MCP (Model Context Protocol) server that scans codebases for incomplete work, placeholder comments, mock implementations, and deceptive patterns that might have been left by AI assistants or developers.

## Quick Start with Deno

```bash
# Run directly from JSR (no installation needed)
deno run -A jsr:@findlazy/findlazy scan ./src

# Scan for TODOs
deno run -A jsr:@findlazy/findlazy scan --pattern="TODO|FIXME" ./src

# Start as MCP server
deno run -A jsr:@findlazy/findlazy --mcp
```

## Installation

### For Deno Projects

Add to your `deno.json`:

```json
{
  "imports": {
    "@findlazy/findlazy": "jsr:@findlazy/findlazy@^0.1.0"
  }
}
```

### For Node.js Projects (via JSR npm compatibility)

```bash
# Using the jsr CLI
npx jsr add @findlazy/findlazy

# Manual with npm
npm install @jsr/findlazy__findlazy
```

## Usage

### Command Line

```bash
# Basic scan
deno run -A jsr:@findlazy/findlazy scan

# Scan specific directory
deno run -A jsr:@findlazy/findlazy scan ./src

# Different output formats
deno run -A jsr:@findlazy/findlazy scan --format=json ./src
deno run -A jsr:@findlazy/findlazy scan --format=table ./src

# Trace specific patterns
deno run -A jsr:@findlazy/findlazy trace "TODO" ./src
deno run -A jsr:@findlazy/findlazy trace "mock" --regex ./src

# Get configuration
deno run -A jsr:@findlazy/findlazy config
```

### Programmatic Usage (Deno)

```typescript
import { runCLI } from "jsr:@findlazy/findlazy/cli";
import { FindLazyMCPServer } from "jsr:@findlazy/findlazy/mcp";
import { loadConfig } from "jsr:@findlazy/findlazy/core";

// Run CLI programmatically
await runCLI(["scan", "./src"]);

// Start MCP server
const server = new FindLazyMCPServer();
await server.start();

// Load configuration
const config = await loadConfig("./path/to/project");
```

### Programmatic Usage (Node.js)

```typescript
import { runCLI } from "@jsr/findlazy__findlazy/cli";
import { FindLazyMCPServer } from "@jsr/findlazy__findlazy/mcp";

// Same API as Deno
await runCLI(["scan", "./src"]);

const server = new FindLazyMCPServer();
await server.start();
```

## MCP Server Setup

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "findlazy": {
      "command": "deno",
      "args": [
        "run",
        "-A",
        "jsr:@findlazy/findlazy@^0.1.0",
        "--mcp"
      ]
    }
  }
}
```

### MCP Capabilities

**Tools:**
- `scan_codebase` - Scan for lazy/incomplete code patterns
- `trace_pattern` - Search for specific patterns in code
- `get_config` - Get current FindLazy configuration
- `validate_config` - Validate findlazy.json configuration

**Resources:**
- `findlazy://findings/latest` - Latest scan results
- `findlazy://config/current` - Current configuration
- `findlazy://patterns/all` - All detection patterns

**Prompts:**
- `scan-todos` - Quick scan for TODO/FIXME markers
- `find-mocks` - Find mock implementations
- `security-check` - Security-focused scan
- `onboard-codebase` - Comprehensive scan with explanations
- `pre-commit-check` - Fast scan for critical issues
- `unused-code-sweep` - Deep unused code analysis

## Detection Capabilities

FindLazy detects:

- **Placeholders**: TODO, FIXME, HACK, XXX, TEMP comments
- **Mocks**: mock_, stub_, fake_, dummy_ patterns in code
- **Deceptive Patterns**:
  - Empty functions
  - Pass-only blocks (Python)
  - Null/None returns
  - Not implemented errors
- **Unused Code**:
  - Unused imports
  - Unused variables (AST-based)
  - Dead code paths

### Supported Languages

- TypeScript (.ts, .tsx)
- JavaScript (.js, .jsx)
- Python (.py)

## Configuration

Create `findlazy.json` in your project root:

```json
{
  "version": "1.0",
  "include": ["src/**/*.ts", "src/**/*.py"],
  "exclude": ["**/*.test.ts", "node_modules/**"],
  "patterns": {
    "placeholders": {
      "enabled": true,
      "severity": "warning"
    },
    "mocks": {
      "enabled": true,
      "severity": "error"
    },
    "deceptive": {
      "enabled": true,
      "severity": "error"
    },
    "unused": {
      "enabled": true,
      "severity": "info"
    }
  }
}
```

See `findlazy.schema.json` for full configuration options.

## Examples

### Scan a TypeScript Project

```bash
deno run -A jsr:@findlazy/findlazy scan ./src
```

Output:
```
╔════════════════════════════════════════════════════════════╗
║ FindLazy Scan Results                                      ║
╠════════════════════════════════════════════════════════════╣
║ Files Scanned: 45                                          ║
║ Findings: 12 (3 errors, 7 warnings, 2 info)                ║
╚════════════════════════════════════════════════════════════╝

src/api.ts:23:5
  ERROR [mock] Mock implementation detected: "mockAuth"
  > const mockAuth = () => true;
  Suggestion: Replace mock with real implementation

src/utils.ts:67:3
  WARNING [placeholder] Placeholder comment: "TODO: Implement"
  > // TODO: Implement error handling
  Suggestion: Replace with actual implementation
```

### Find All TODOs

```bash
deno run -A jsr:@findlazy/findlazy trace "TODO" ./src
```

### Use in CI/CD

```yaml
# .github/workflows/code-quality.yml
name: Code Quality

on: [push, pull_request]

jobs:
  findlazy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
      - name: Scan for lazy code
        run: deno run -A jsr:@findlazy/findlazy scan
```

## Permissions

FindLazy requires the following Deno permissions:

- `--allow-read`: Read source files and configuration
- `--allow-write`: Write cache and results
- `--allow-env`: Read environment variables for configuration

You can grant all permissions with `-A` or specify individually:

```bash
deno run --allow-read --allow-write --allow-env jsr:@findlazy/findlazy scan
```

## Why FindLazy?

When working with AI assistants, it's easy for incomplete code, placeholders, and mock implementations to slip into your codebase. FindLazy helps you:

- **Catch incomplete work** before it reaches production
- **Improve code quality** by identifying deceptive patterns
- **Maintain standards** across your team
- **Integrate with Claude** via MCP for AI-assisted code review

## Links

- [npm Package](https://www.npmjs.com/package/@findlazy/findlazy)
- [GitHub Repository](https://github.com/LayerDynamics/findlazy)
- [Full Documentation](https://github.com/LayerDynamics/findlazy/blob/main/README.md)
- [MCP Specification](https://modelcontextprotocol.io/)

## License

MIT - See LICENSE file for details
