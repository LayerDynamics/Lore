import type { Finding } from "../core/reporter.ts";
import type { FindLazyConfig } from "../core/config.ts";

export interface ScanOptions {
  config: FindLazyConfig;
  filePath: string;
  content: string;
}

export interface Scanner {
  /**
   * Scanner name
   */
  name: string;

  /**
   * Supported file extensions
   */
  extensions: string[];

  /**
   * Scan a file and return findings
   */
  scan(options: ScanOptions): Promise<Finding[]>;

  /**
   * Check if this scanner supports a given file
   */
  supports(filePath: string): boolean;
}

/**
 * Base scanner class implementing common functionality
 */
export abstract class BaseScanner implements Scanner {
  abstract name: string;
  abstract extensions: string[];

  /**
   * Scan implementation (must be implemented by subclasses)
   */
  abstract scan(options: ScanOptions): Promise<Finding[]>;

  /**
   * Check if this scanner supports a given file
   */
  supports(filePath: string): boolean {
    return this.extensions.some((ext) => filePath.endsWith(ext));
  }

  /**
   * Check if a file should be ignored based on config
   */
  protected shouldIgnore(filePath: string, config: FindLazyConfig): boolean {
    // Check if file matches ignore patterns
    if (config.ignoreInTests) {
      for (const pattern of config.ignorePatterns) {
        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        if (regex.test(filePath)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Generate a unique finding ID
   */
  protected generateFindingId(filePath: string, line: number, column: number): string {
    return `${filePath}:${line}:${column}`;
  }

  /**
   * Create a finding object
   */
  protected createFinding(
    file: string,
    line: number,
    column: number,
    type: Finding["type"],
    severity: Finding["severity"],
    message: string,
    options: {
      code?: string;
      context?: string[];
      suggestion?: string;
    } = {},
  ): Finding {
    const finding: Finding = {
      id: this.generateFindingId(file, line, column),
      file,
      line,
      column,
      type,
      severity,
      message,
    };

    if (options.code !== undefined) {
      finding.code = options.code;
    }
    if (options.context !== undefined) {
      finding.context = options.context;
    }
    if (options.suggestion !== undefined) {
      finding.suggestion = options.suggestion;
    }

    return finding;
  }
}
