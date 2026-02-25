/**
 * MCP Prompts - Templated workflows for common FindLazy use cases
 *
 * Provides pre-configured scanning prompts that can be invoked from MCP clients
 * like Claude Desktop for quick, focused code analysis.
 */

import type { Prompt, PromptMessage } from "@modelcontextprotocol/sdk/types";

export interface PromptDefinition {
  name: string;
  title: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}

/**
 * Available FindLazy prompts
 */
export const PROMPTS: PromptDefinition[] = [
  {
    name: "scan-todos",
    title: "Scan for TODOs and Incomplete Work",
    description: "Quick scan focusing only on TODO, FIXME, HACK, and WIP markers to identify incomplete work",
    arguments: [
      {
        name: "path",
        description: "Path to scan (defaults to current directory)",
        required: false,
      },
    ],
  },
  {
    name: "find-mocks",
    title: "Find Mock Implementations",
    description: "Detect mock_, stub_, fake_, and dummy_ patterns that may indicate placeholder implementations",
    arguments: [
      {
        name: "path",
        description: "Path to scan (defaults to current directory)",
        required: false,
      },
    ],
  },
  {
    name: "security-check",
    title: "Security-Focused Scan",
    description: "Deep scan for deceptive patterns, empty error handlers, and potential security issues",
    arguments: [
      {
        name: "path",
        description: "Path to scan (defaults to current directory)",
        required: false,
      },
    ],
  },
  {
    name: "onboard-codebase",
    title: "Comprehensive Codebase Onboarding",
    description: "Full scan with explanations to understand code quality, technical debt, and areas needing attention",
    arguments: [
      {
        name: "path",
        description: "Path to scan (defaults to current directory)",
        required: false,
      },
    ],
  },
  {
    name: "pre-commit-check",
    title: "Pre-Commit Quick Check",
    description: "Fast scan for critical issues only (errors and mocks) - ideal for git hooks",
    arguments: [
      {
        name: "path",
        description: "Path to scan (defaults to current directory)",
        required: false,
      },
    ],
  },
  {
    name: "unused-code-sweep",
    title: "Deep Unused Code Analysis",
    description: "Thorough scan focusing on unused imports, variables, and dead code paths",
    arguments: [
      {
        name: "path",
        description: "Path to scan (defaults to current directory)",
        required: false,
      },
    ],
  },
];

/**
 * Get prompt definition by name
 */
export function getPromptDefinition(name: string): PromptDefinition | undefined {
  return PROMPTS.find((p) => p.name === name);
}

/**
 * Build configuration overrides for a specific prompt
 */
function buildPromptConfig(name: string): Record<string, unknown> {
  switch (name) {
    case "scan-todos":
      return {
        patterns: {
          placeholders: { enabled: true, severity: "warning" },
          mocks: { enabled: false },
          deceptive: { enabled: false },
          unused: { enabled: false },
        },
      };

    case "find-mocks":
      return {
        patterns: {
          placeholders: { enabled: false },
          mocks: { enabled: true, severity: "error" },
          deceptive: { enabled: false },
          unused: { enabled: false },
        },
      };

    case "security-check":
      return {
        patterns: {
          placeholders: { enabled: true, severity: "warning" },
          mocks: { enabled: true, severity: "error" },
          deceptive: { enabled: true, severity: "error" },
          unused: { enabled: false },
        },
      };

    case "onboard-codebase":
      // Enable everything for comprehensive scan
      return {
        patterns: {
          placeholders: { enabled: true, severity: "warning" },
          mocks: { enabled: true, severity: "warning" },
          deceptive: { enabled: true, severity: "warning" },
          unused: { enabled: true, severity: "info" },
        },
      };

    case "pre-commit-check":
      return {
        patterns: {
          placeholders: { enabled: false },
          mocks: { enabled: true, severity: "error" },
          deceptive: { enabled: true, severity: "error" },
          unused: { enabled: false },
        },
      };

    case "unused-code-sweep":
      return {
        patterns: {
          placeholders: { enabled: false },
          mocks: { enabled: false },
          deceptive: { enabled: false },
          unused: { enabled: true, severity: "warning" },
        },
      };

    default:
      return {};
  }
}

/**
 * Build prompt message for a specific prompt
 */
function buildPromptMessage(name: string, path?: string): string {
  const targetPath = path || ".";

  switch (name) {
    case "scan-todos":
      return `Scan the codebase at "${targetPath}" for TODO, FIXME, HACK, and WIP markers.

This will identify:
- Incomplete features or implementations
- Areas marked for future work
- Known issues documented in comments
- Temporary solutions

Focus only on placeholder comments and skip other pattern types.`;

    case "find-mocks":
      return `Scan the codebase at "${targetPath}" for mock implementations.

This will detect:
- mock_, mockAuth, mockData patterns
- stub_, stubUser, stubAPI patterns
- fake_, fakeService patterns
- dummy_, dummyHandler patterns

These often indicate placeholder code that should be replaced with real implementations before production.`;

    case "security-check":
      return `Perform a security-focused scan of the codebase at "${targetPath}".

This will identify:
- Deceptive patterns (empty functions, pass-only blocks)
- Mock implementations that may bypass security
- Null/None returns that could cause issues
- Not implemented errors

Focus on patterns that could hide security vulnerabilities or incomplete security implementations.`;

    case "onboard-codebase":
      return `Perform a comprehensive scan of the codebase at "${targetPath}" to understand its quality and technical debt.

This will analyze:
- Placeholder comments (TODOs, FIXMEs)
- Mock implementations
- Deceptive patterns (empty functions, stub returns)
- Unused code (imports, variables)

Use this for onboarding to a new codebase or getting a quality overview. The results will help identify areas needing attention.`;

    case "pre-commit-check":
      return `Quick pre-commit check for critical issues in "${targetPath}".

This fast scan identifies:
- Mock implementations (error severity)
- Deceptive patterns (error severity)

Skips warnings and info-level findings for speed. Use this in git hooks to prevent committing problematic code.`;

    case "unused-code-sweep":
      return `Deep analysis of unused code in the codebase at "${targetPath}".

This will find:
- Unused imports
- Unused variables
- Dead code paths
- Unreachable code

Focus on identifying code that can be safely removed to improve maintainability.`;

    default:
      return `Scan the codebase at "${targetPath}" with FindLazy.`;
  }
}

/**
 * Get prompt content for MCP protocol
 */
export function getPrompt(name: string, args: Record<string, unknown>): Prompt {
  const definition = getPromptDefinition(name);
  if (!definition) {
    throw new Error(`Unknown prompt: ${name}`);
  }

  const path = typeof args.path === "string" ? args.path : undefined;
  const config = buildPromptConfig(name);
  const message = buildPromptMessage(name, path);

  const messages: PromptMessage[] = [
    {
      role: "user",
      content: {
        type: "text",
        text: message,
      },
    },
  ];

  // Add configuration hint as system context
  if (Object.keys(config).length > 0) {
    messages.push({
      role: "user",
      content: {
        type: "text",
        text: `Configuration for this scan:\n${JSON.stringify(config, null, 2)}`,
      },
    });
  }

  return {
    messages,
    description: definition.description,
  };
}

/**
 * List all available prompts
 */
export function listPrompts(): PromptDefinition[] {
  return PROMPTS;
}
