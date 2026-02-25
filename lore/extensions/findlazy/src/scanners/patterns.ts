import { join } from "@std/path";
import { parse as parseJsonc } from "@std/jsonc";
import { exists, readFile } from "../core/fs.ts";

export interface PatternDefinition {
  name: string;
  pattern: string;
  type: "regex" | "keyword" | "ast";
  severity: "info" | "warning" | "error";
  message: string;
  category: "placeholder" | "mock" | "unused" | "deceptive";
  suggestion?: string;
  enabled?: boolean;
}

export interface PatternFile {
  version: string;
  language?: string;
  patterns: PatternDefinition[];
}

/**
 * Pattern manager for loading and accessing detection patterns
 */
export class PatternManager {
  private patterns: Map<string, PatternDefinition[]> = new Map();
  private patternsDir: string;

  constructor(patternsDir?: string) {
    // Default to patterns/ directory in project root
    this.patternsDir = patternsDir || join(Deno.cwd(), "patterns");
  }

  /**
   * Load patterns from a JSON file
   */
  async loadPatterns(filename: string): Promise<PatternDefinition[]> {
    const filePath = join(this.patternsDir, filename);

    if (!(await exists(filePath))) {
      throw new Error(`Pattern file not found: ${filePath}`);
    }

    const content = await readFile(filePath);
    const patternFile = parseJsonc(content) as unknown as PatternFile;

    // Filter out disabled patterns
    const enabledPatterns = patternFile.patterns.filter((p) => p.enabled !== false);

    return enabledPatterns;
  }

  /**
   * Load common patterns (shared across all languages)
   */
  async loadCommonPatterns(): Promise<void> {
    const patterns = await this.loadPatterns("common.json");
    this.patterns.set("common", patterns);
  }

  /**
   * Load TypeScript-specific patterns
   */
  async loadTypeScriptPatterns(): Promise<void> {
    const patterns = await this.loadPatterns("typescript.json");
    this.patterns.set("typescript", patterns);
  }

  /**
   * Load Python-specific patterns
   */
  async loadPythonPatterns(): Promise<void> {
    const patterns = await this.loadPatterns("python.json");
    this.patterns.set("python", patterns);
  }

  /**
   * Load all pattern files
   */
  async loadAll(): Promise<void> {
    await Promise.all([
      this.loadCommonPatterns(),
      this.loadTypeScriptPatterns(),
      this.loadPythonPatterns(),
    ]);
  }

  /**
   * Get patterns for a specific language
   */
  getPatterns(language: "common" | "typescript" | "python"): PatternDefinition[] {
    return this.patterns.get(language) || [];
  }

  /**
   * Get all patterns for a language including common patterns
   */
  getAllPatterns(language: "typescript" | "python"): PatternDefinition[] {
    const common = this.getPatterns("common");
    const specific = this.getPatterns(language);
    return [...common, ...specific];
  }

  /**
   * Get patterns by category
   */
  getPatternsByCategory(
    language: "typescript" | "python",
    category: "placeholder" | "mock" | "unused" | "deceptive",
  ): PatternDefinition[] {
    const allPatterns = this.getAllPatterns(language);
    return allPatterns.filter((p) => p.category === category);
  }

  /**
   * Get patterns by type
   */
  getPatternsByType(
    language: "typescript" | "python",
    type: "regex" | "keyword" | "ast",
  ): PatternDefinition[] {
    const allPatterns = this.getAllPatterns(language);
    return allPatterns.filter((p) => p.type === type);
  }

  /**
   * Get regex patterns for text-based scanning
   */
  getRegexPatterns(language: "typescript" | "python"): Map<string, RegExp> {
    const patterns = this.getPatternsByType(language, "regex");
    const regexMap = new Map<string, RegExp>();

    for (const pattern of patterns) {
      try {
        regexMap.set(pattern.name, new RegExp(pattern.pattern, "gi"));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const warnText = `Warning: Invalid regex pattern '${pattern.name}': ${message}\n`;
        Deno.stderr.write(new TextEncoder().encode(warnText)).catch(() => {});
      }
    }

    return regexMap;
  }

  /**
   * Get keyword patterns for keyword matching
   */
  getKeywordPatterns(language: "typescript" | "python"): string[] {
    const patterns = this.getPatternsByType(language, "keyword");
    return patterns.map((p) => p.pattern);
  }

  /**
   * Get pattern definition by name
   */
  getPatternByName(name: string): PatternDefinition | undefined {
    for (const patterns of this.patterns.values()) {
      const pattern = patterns.find((p) => p.name === name);
      if (pattern) return pattern;
    }
    return undefined;
  }

  /**
   * Clear all loaded patterns
   */
  clear(): void {
    this.patterns.clear();
  }
}

/**
 * Create a default pattern manager instance
 */
export function createPatternManager(patternsDir?: string): PatternManager {
  return new PatternManager(patternsDir);
}
