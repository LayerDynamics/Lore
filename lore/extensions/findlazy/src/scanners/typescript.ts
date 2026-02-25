import { BaseScanner, type ScanOptions } from "./base.ts";
import type { Finding } from "../core/reporter.ts";
import { TypeScriptParser } from "../parsers/typescript-parser.ts";
import { PatternMatcher, matchKeywords } from "../parsers/pattern-matcher.ts";
import { PatternManager } from "./patterns.ts";

/**
 * TypeScript/JavaScript scanner for detecting lazy code patterns
 */
export class TypeScriptScanner extends BaseScanner {
  name = "TypeScript/JavaScript Scanner";
  extensions = [".ts", ".tsx", ".js", ".jsx"];

  private parser: TypeScriptParser;
  private patternMatcher: PatternMatcher;
  private patternManager: PatternManager;

  constructor() {
    super();
    this.parser = new TypeScriptParser();
    this.patternMatcher = new PatternMatcher();
    this.patternManager = new PatternManager();
    // Initialize pattern manager (patterns loaded on demand)
    this.patternManager.loadCommonPatterns().catch(() => {
      // Patterns will be loaded when needed
    });
    this.patternManager.loadTypeScriptPatterns().catch(() => {
      // Patterns will be loaded when needed
    });
  }

  /**
   * Scan a TypeScript/JavaScript file
   */
  scan(options: ScanOptions): Promise<Finding[]> {
    const { config, filePath, content } = options;
    const findings: Finding[] = [];

    // Check if file should be ignored
    if (this.shouldIgnore(filePath, config)) {
      return Promise.resolve(findings);
    }

    // 1. Text-based pattern matching
    if (config.patterns.placeholders?.enabled) {
      findings.push(...this.scanPlaceholders(filePath, content, config.patterns.placeholders.severity));
    }

    if (config.patterns.mocks?.enabled) {
      findings.push(...this.scanMocks(filePath, content, config.patterns.mocks.severity));
    }

    // 2. AST-based pattern detection
    if (config.patterns.deceptive?.enabled) {
      findings.push(...this.scanDeceptive(filePath, content, config.patterns.deceptive.severity));
    }

    if (config.patterns.unused?.enabled) {
      findings.push(...this.scanUnused(filePath, content, config.patterns.unused.severity));
    }

    return Promise.resolve(findings);
  }

  /**
   * Scan for placeholder patterns (TODO, FIXME, etc.)
   */
  private scanPlaceholders(
    filePath: string,
    content: string,
    severity: "info" | "warning" | "error",
  ): Finding[] {
    const findings: Finding[] = [];

    // Common placeholder keywords
    const keywords = [
      "TODO",
      "FIXME",
      "HACK",
      "XXX",
      "TEMP",
      "temporary",
      "for now",
      "in a real",
      "placeholder",
      "mock implementation",
    ];

    const matches = matchKeywords(content, keywords, 2);

    for (const match of matches) {
      const options: { code: string; context?: string[]; suggestion: string } = {
        code: match.matchedText,
        suggestion: "Replace with actual implementation",
      };
      if (match.context) {
        options.context = match.context;
      }
      findings.push(
        this.createFinding(
          filePath,
          match.line,
          match.column,
          "placeholder",
          severity,
          `Placeholder comment found: "${match.matchedText}"`,
          options,
        ),
      );
    }

    return findings;
  }

  /**
   * Scan for mock/stub patterns
   */
  private scanMocks(
    filePath: string,
    content: string,
    severity: "info" | "warning" | "error",
  ): Finding[] {
    const findings: Finding[] = [];

    // Mock/stub function name patterns
    const mockPattern = /\b(mock|stub|fake|dummy|placeholder)\w*/gi;
    const matches = this.patternMatcher.matchRegex(content, mockPattern, 2);

    for (const match of matches) {
      const options: { code: string; context?: string[]; suggestion: string } = {
        code: match.matchedText,
        suggestion: "Replace mock with real implementation",
      };
      if (match.context) {
        options.context = match.context;
      }
      findings.push(
        this.createFinding(
          filePath,
          match.line,
          match.column,
          "mock",
          severity,
          `Mock/stub implementation detected: "${match.matchedText}"`,
          options,
        ),
      );
    }

    return findings;
  }

  /**
   * Scan for deceptive patterns using AST
   */
  private scanDeceptive(
    filePath: string,
    content: string,
    severity: "info" | "warning" | "error",
  ): Finding[] {
    const findings: Finding[] = [];

    try {
      const deceptivePatterns = this.parser.detectDeceptivePatterns(content, filePath);

      for (const pattern of deceptivePatterns) {
        const message = pattern.description;
        let suggestion = "";

        switch (pattern.type) {
          case "empty-function":
            suggestion = "Add implementation to function body";
            break;
          case "null-return":
            suggestion = "Return actual value or remove function";
            break;
          case "any-cast":
            suggestion = "Use proper type instead of 'any'";
            break;
          case "no-implementation":
            suggestion = "Add actual implementation";
            break;
        }

        findings.push(
          this.createFinding(
            filePath,
            pattern.line,
            pattern.column,
            "deceptive",
            severity,
            message,
            {
              code: pattern.text,
              suggestion,
            },
          ),
        );
      }
    } catch (error) {
      // If AST parsing fails, log but don't fail the scan
      const message = error instanceof Error ? error.message : String(error);
      const warnText = `Warning: Failed to parse ${filePath}: ${message}\n`;
      Deno.stderr.write(new TextEncoder().encode(warnText)).catch(() => {});
    }

    return findings;
  }

  /**
   * Scan for unused imports
   */
  private scanUnused(
    filePath: string,
    content: string,
    severity: "info" | "warning" | "error",
  ): Finding[] {
    const findings: Finding[] = [];

    try {
      const unusedImports = this.parser.findUnusedImports(content, filePath);

      for (const unused of unusedImports) {
        const options: { code: string; context?: string[]; suggestion: string } = {
          code: unused.matchedText,
          suggestion: "Remove unused import or implement the feature",
        };
        if (unused.context) {
          options.context = unused.context;
        }
        findings.push(
          this.createFinding(
            filePath,
            unused.line,
            unused.column,
            "unused",
            severity,
            `Unused import: "${unused.matchedText}"`,
            options,
          ),
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const warnText = `Warning: Failed to detect unused imports in ${filePath}: ${message}\n`;
      Deno.stderr.write(new TextEncoder().encode(warnText)).catch(() => {});
    }

    return findings;
  }
}
