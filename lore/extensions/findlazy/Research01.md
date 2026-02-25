# FindLazy Implementation Research - Deno Stack

**Research Date:** January 11, 2026
**Target Platform:** Deno 2.0+
**Primary Languages:** TypeScript (for tool), Python/JavaScript analysis (target codebases)

---

## Executive Summary

This research document outlines the technical approach and dependencies required to implement FindLazy - a CLI and MCP server for detecting incomplete, mock, and deceptive code patterns left by AI agents in codebases.

---

## 1. Deno CLI Development

### Best Practices

**Dependency Management:**
- Dependencies managed through `deno.json` or `package.json`
- Use `deno install` with `--entrypoint` flag to install only necessary dependencies
- ALL dependencies MUST be versioned for production (no unversioned packages)
- Use URL imports to import only what you need (reduces compiled file size)

**Security:**
- Never embed secrets in code
- Use `Deno.env.get()` for environment variables (requires permission)
- Leverage Deno's granular permission system (`--allow-read`, `--allow-write`, etc.)

**Entry Point Pattern:**
- Use `import.meta.main` idiom to specify entry points in executable scripts

**Compilation & Distribution:**
- Compile to portable executable binaries with `deno compile`
- Use `--lite` flag for 40-60% smaller binaries (runtime-only)
- Zero config, all-in-one modern tooling

### Recommended CLI Frameworks

1. **Cliffy** - Simple and type-safe command-line framework (recommended)
2. **Yargs** - Modern CLI argument parser
3. **Denomander** - Commander.js-inspired framework

**Sources:**
- [Deno Install Documentation](https://docs.deno.com/runtime/reference/cli/install/)
- [Build a Cross-Platform CLI with Deno](https://deno.com/blog/build-cross-platform-cli)
- [Build a Command-Line Application With Deno 2.0](https://reverentgeek.com/build-a-command-line-application-with-deno-2/)
- [Manage Dependencies Manual](https://deno.land/manual/examples/manage_dependencies)

---

## 2. MCP (Model Context Protocol) Implementation

### Official TypeScript SDK

**Status (2026):**
- Stable v2 release anticipated Q1 2026
- v1.x remains recommended for production until then
- Active development through January 10, 2026

**SDK Features:**
- Full MCP specification implementation
- Expose resources, prompts, and tools
- Build MCP clients to connect to any MCP server
- Standard transports: stdio and Streamable HTTP

**Package:**
```bash
deno add npm:@modelcontextprotocol/sdk
```

### Deno-Specific MCP Implementation

**deno-mcp** (github.com/alexcong/deno-mcp):
- Secure MCP server implementation for Deno
- Execute TypeScript/JavaScript through Deno runtime
- Configurable permissions set at server startup
- MCP compliance for seamless AI assistant integration

**Distribution Advantage:**
- Compile to executable binary for easy distribution of shareable/runnable MCP servers

**Sources:**
- [TypeScript SDK for MCP](https://github.com/modelcontextprotocol/typescript-sdk)
- [@modelcontextprotocol/sdk - npm](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [Exploring MCP with Deno 2](https://www.shruggingface.com/microblog/2024/12/02/exploring-the-model-context-protocol-with-deno-2-and-playwright)
- [Build an MCP server](https://modelcontextprotocol.io/docs/develop/build-server)
- [Deno MCP Repository](https://github.com/alexcong/deno-mcp)

---

## 3. Code Scanning & AST Parsing

### TypeScript/JavaScript Analysis

**deno_ast** (Official Deno AST Library):
- Source text parsing, lexing, and AST functionality
- Built for Deno's internal use
- Repository: github.com/denoland/deno_ast

**ts-codebase-analyzer**:
- Parse and analyze TypeScript/JavaScript codebases using TypeScript AST
- Generate hierarchical representation of:
  - Modules, classes, functions, properties
  - Interfaces, enums, dependencies
  - Code structure and relationships

**TypeScript Compiler API:**
- Parses TypeScript into AST before type-checking
- TypeScript Type Checker for advanced analysis beyond AST
- Can analyze imported files and runtime-constructed types

**Deno Lint:**
- Official linter written in Rust
- Fast, zero-configuration
- Designed for TypeScript and JavaScript

### Python Analysis

**@kriss-u/py-ast** (JSR Package):
- Comprehensive TypeScript-based Python parser
- Generates ASTs following Python ASDL grammar specification
- Available via JSR (JavaScript Registry)

**python-ast**:
- Python 3 parser for JavaScript/TypeScript
- Based on antlr4ts
- Repository: github.com/lexanth/python-ast

**Package Installation:**
```bash
deno add jsr:@kriss-u/py-ast
```

### Development Tools

**AST Explorer** (astexplorer.net):
- Online AST visualization tool
- Useful for understanding AST structures
- Supports multiple languages

**Sources:**
- [Deno AST Repository](https://github.com/denoland/deno_ast)
- [ts-codebase-analyzer](https://github.com/olasunkanmi-SE/ts-codebase-analyzer)
- [@kriss-u/py-ast on JSR](https://jsr.io/@kriss-u/py-ast)
- [Python AST Parser](https://github.com/lexanth/python-ast)
- [TypeScript AST and Type Checker](https://www.satellytes.com/blog/post/typescript-ast-type-checker/)
- [Static Analysis Tools List](https://github.com/analysis-tools-dev/static-analysis)

---

## 4. File System Traversal

### Recommended Approach: Standard Library `walk()`

**Primary Method:**
```typescript
import { walk } from "jsr:@std/fs/walk";

for await (const dirEntry of walk(".")) {
  console.log("Recursive walking:", dirEntry.name);
}
```

**Features:**
- Async iterable interface
- Built-in filtering capabilities
- Part of Deno standard library

### Filtering Options

1. **File Extensions:**
   - `exts` filter takes an array of strings
   - Example: `exts: [".ts", ".js", ".py"]`

2. **Regex Matching:**
   - `match` option to include specific paths
   - Include paths matching specified regexes

3. **Regex Exclusion:**
   - `skip` option to exclude paths
   - Common pattern: skip `node_modules`, `.git`, etc.

4. **Directory Inclusion:**
   - `includeDirs` option controls directory results
   - Set to `false` to get only files

### Alternative Methods

**Built-in Deno.readDir():**
- For simple, non-recursive cases
- Single directory level only

**Third-Party Libraries:**
- `recursive_readdir` - Simple recursive directory reading
- `getfiles` - Include/exclude patterns with file info

### Permission Requirements

All file system operations require explicit permissions:
- `--allow-read` for reading files/directories
- `--allow-write` for modifications
- Can specify specific paths: `--allow-read=/path/to/project`

**Sources:**
- [Walking Directories - Deno Docs](https://docs.deno.com/examples/walking_directories/)
- [Recursively Process a Directory](https://medium.com/deno-the-complete-reference/recursively-process-a-directory-in-deno-828c943c6cd1)
- [Deno File System Documentation](https://docs.deno.com/api/deno/file-system)
- [Working with File System in Deno](https://www.sitepoint.com/deno-file-system/)
- [recursive_readdir Module](https://deno.land/x/recursive_readdir@v2.0.0)

---

## 5. Recommended Dependencies

### Core Dependencies

```bash
# CLI Framework
deno add jsr:@cliffy/command
deno add jsr:@cliffy/table  # For formatting output

# MCP Server
deno add npm:@modelcontextprotocol/sdk

# File System
deno add jsr:@std/fs
deno add jsr:@std/path

# Python AST Parsing
deno add jsr:@kriss-u/py-ast

# TypeScript/JavaScript Analysis
deno add npm:typescript  # For TypeScript compiler API
deno add npm:@typescript/analyze-trace  # Optional: performance analysis

# Pattern Matching
deno add jsr:@std/regexp

# Configuration Management
deno add jsr:@std/jsonc  # For JSON with comments support
deno add jsr:@std/yaml   # If using YAML config

# Output Formatting
deno add jsr:@std/fmt/colors  # Terminal colors
```

### Development Dependencies

```bash
# Testing
deno add --dev jsr:@std/testing
deno add --dev jsr:@std/assert

# Code Quality
# (Deno Lint is built-in, no installation needed)
```

---

## 6. Implementation Strategy

### Architecture Overview

```
findlazy/
├── main.ts                  # Main entry point
├── main.test.ts            # Main tests
├── Deno.json               # Deno configuration
├── README.md               # Project documentation
├── Research01.md           # Implementation research
│
├── .claude/                # Claude Code configuration
│   └── settings.local.json
│
├── patterns/               # Pattern definitions
│   ├── common.json         # Common patterns across languages
│   ├── typescript.json     # TypeScript-specific patterns
│   └── python.json         # Python-specific patterns
│
├── tests/                  # Test files
│
└── src/
    ├── mod.ts              # Main module exports
    │
    ├── interface/          # User-facing interfaces
    │   ├── mod.ts          # Interface module exports
    │   ├── io.ts           # Input/output handling
    │   │
    │   ├── cli/            # Command-line interface
    │   │   ├── mod.ts      # CLI module exports
    │   │   ├── index.ts    # CLI entry point
    │   │   └── commands/   # CLI commands
    │   │       ├── mod.ts  # Commands module exports
    │   │       ├── scan.ts # Main scanning command
    │   │       ├── trace.ts # Trace specific patterns
    │   │       ├── ignore.ts # Ignore pattern management
    │   │       └── clear.ts # Clear cache/results
    │   │
    │   └── mcp/            # Model Context Protocol interface
    │       ├── mod.ts      # MCP module exports
    │       ├── server.ts   # MCP server implementation
    │       ├── tools.ts    # MCP tools (scan, trace, etc.)
    │       └── resources.ts # MCP resources
    │
    ├── core/               # Core utilities and configuration
    │   ├── mod.ts          # Core module exports
    │   ├── fs.ts           # File system utilities
    │   ├── config.ts       # Configuration loading
    │   └── reporter.ts     # Results formatting/reporting
    │
    ├── parsers/            # Language parsers
    │   ├── mod.ts          # Parsers module exports
    │   ├── typescript-parser.ts # TS AST parsing
    │   ├── python-parser.ts # Python AST parsing
    │   └── pattern-matcher.ts # Pattern matching engine
    │
    └── scanners/           # Code scanners
        ├── mod.ts          # Scanners module exports
        ├── base.ts         # Base scanner interface
        ├── typescript.ts   # TypeScript/JavaScript scanner
        ├── python.ts       # Python scanner
        └── patterns.ts     # Pattern scanning logic
```

**Architecture Notes:**
- **src/interface/**: Contains all user-facing interfaces (CLI and MCP)
- **src/core/**: Core utilities shared across the application
- **src/parsers/**: Language-specific AST parsing and pattern matching
- **src/scanners/**: Scanner implementations that detect lazy/deceptive code
- **mod.ts files**: Module re-exports for clean public API
- **patterns/**: JSON configuration files defining detection patterns

### Key Detection Patterns to Implement

**Placeholder Code:**
- Comments: "TODO", "FIXME", "for now", "in a real", "placeholder"
- String literals: "mock", "simulated", "temporary"
- Function names: `mockFetch()`, `stubData()`, `temporaryFix()`

**Deceptive Patterns:**
- Functions that return None/null/undefined immediately
- Empty try-catch blocks
- Unused imports that suggest intended functionality
- Structured code that's never called
- Variables assigned but never used (non-linter-triggering patterns)

**TypeScript/JavaScript Specific:**
- `return null as any` (type assertion abuse)
- Empty Promise resolutions
- Async functions with no await
- Exported but unused functions

**Python Specific:**
- `pass` statements in implemented functions
- `return None` as only statement
- `NotImplementedError` with no context
- Docstrings claiming functionality not present

### Scanning Algorithm

1. **File Discovery:**
   - Use `walk()` from `@std/fs`
   - Filter by supported extensions
   - Respect `.gitignore` and custom ignore patterns

2. **AST Parsing:**
   - Parse files into AST using language-specific parsers
   - Extract semantic information (functions, classes, imports, etc.)

3. **Pattern Detection:**
   - Text-based pattern matching for comments/strings
   - AST-based detection for code structure issues
   - Cross-reference imports with usage

4. **Reporting:**
   - Group findings by severity
   - Provide file path and line numbers
   - Suggest fixes where applicable

### Configuration File Structure

```jsonc
// findlazy.json
{
  "include": ["src/**/*", "lib/**/*"],
  "exclude": ["node_modules", "dist", ".git"],
  "languages": ["typescript", "python"],
  "patterns": {
    "placeholders": true,
    "mocks": true,
    "unused": true,
    "deceptive": true
  },
  "customPatterns": [
    {
      "pattern": "\\b(mock|stub|fake)\\w+",
      "severity": "warning",
      "message": "Potential mock implementation detected"
    }
  ],
  "ignore": [
    "test/**/*",  // Mocks are expected in tests
    "**/*.test.ts"
  ]
}
```

---

## 7. MCP Integration Approach

### MCP Tools to Expose

1. **scan_codebase:**
   - Input: directory path, options
   - Output: findings report
   - Purpose: Full codebase scan

2. **trace_pattern:**
   - Input: specific pattern to trace
   - Output: all occurrences
   - Purpose: Find specific deceptive patterns

3. **get_suggestions:**
   - Input: finding ID
   - Output: suggested fixes
   - Purpose: Help AI agents understand issues

4. **validate_fix:**
   - Input: file path, line number
   - Output: validation result
   - Purpose: Verify if issue was properly resolved

### MCP Resources to Provide

1. **findings_report:** Latest scan results
2. **pattern_database:** All known deceptive patterns
3. **config:** Current configuration
4. **ignore_list:** Files/patterns being ignored

---

## 8. Performance Considerations

- Use async iterators for file traversal (non-blocking)
- Implement caching for parsed ASTs
- Process files in parallel where possible (worker threads)
- Provide progress indicators for large codebases
- Support incremental scanning (only changed files)

---

## 9. Testing Strategy

- Unit tests for pattern matchers
- Integration tests with sample codebases
- Test against known AI-generated code samples
- Benchmark performance on large codebases
- Test MCP server integration with Claude

---

## 10. Distribution

**CLI Distribution:**
```bash
deno compile --lite --allow-read --allow-write -o findlazy main.ts
```

**MCP Server Distribution:**
- Compile to binary for easy integration
- Provide installation script for Claude Desktop
- Document configuration in MCP settings

---

## Conclusion

Deno 2.0+ provides an excellent foundation for building FindLazy with:
- Modern TypeScript support out of the box
- Built-in security through permissions system
- Rich standard library for file system operations
- Growing ecosystem of AST parsing tools
- Official MCP SDK support
- Easy compilation to distributable binaries

The recommended stack prioritizes official Deno tools where available, falling back to well-maintained third-party libraries for specialized functionality like Python AST parsing.
