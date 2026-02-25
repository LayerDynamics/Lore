/**
 * Configuration Validation
 *
 * Validates FindLazy configuration files for correctness, best practices,
 * and performance optimizations.
 */

import type { FindLazyConfig } from "./config.ts";
import { exists } from "./fs.ts";
import { join } from "@std/path";

export interface ValidationError {
  field: string;
  message: string;
  severity: "error";
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: "warning";
  suggestion?: string;
}

export interface OptimizationSuggestion {
  field: string;
  message: string;
  severity: "info";
  impact: "low" | "medium" | "high";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  optimizations: OptimizationSuggestion[];
}

/**
 * Validate a FindLazy configuration
 */
export function validateConfiguration(config: FindLazyConfig): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const optimizations: OptimizationSuggestion[] = [];

  // 1. Schema validation
  validateSchema(config, errors);

  // 2. Pattern validation
  if (config.customPatterns) {
    validatePatterns(config.customPatterns, errors, warnings);
  }

  // 3. Path validation
  validatePaths(config.include, config.exclude, warnings);

  // 4. Severity validation
  validateSeverities(config, errors);

  // 5. Optimization suggestions
  suggestOptimizations(config, optimizations);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    optimizations,
  };
}

/**
 * Validate configuration schema
 */
function validateSchema(config: FindLazyConfig, errors: ValidationError[]): void {
  // Version check
  if (!config.version) {
    errors.push({
      field: "version",
      message: "Missing required field 'version'",
      severity: "error",
    });
  } else if (config.version !== "1.0") {
    errors.push({
      field: "version",
      message: `Unsupported version '${config.version}'. Expected '1.0'`,
      severity: "error",
    });
  }

  // Patterns check
  if (!config.patterns) {
    errors.push({
      field: "patterns",
      message: "Missing required field 'patterns'",
      severity: "error",
    });
  }

  // Include/exclude arrays
  if (config.include && !Array.isArray(config.include)) {
    errors.push({
      field: "include",
      message: "'include' must be an array of glob patterns",
      severity: "error",
    });
  }

  if (config.exclude && !Array.isArray(config.exclude)) {
    errors.push({
      field: "exclude",
      message: "'exclude' must be an array of glob patterns",
      severity: "error",
    });
  }
}

/**
 * Validate custom patterns
 */
function validatePatterns(
  patterns: Array<{ name: string; pattern: string; category: string }>,
  errors: ValidationError[],
  warnings: ValidationWarning[],
): void {
  if (!Array.isArray(patterns)) {
    errors.push({
      field: "customPatterns",
      message: "'customPatterns' must be an array",
      severity: "error",
    });
    return;
  }

  patterns.forEach((pattern, index) => {
    const prefix = `customPatterns[${index}]`;

    // Required fields
    if (!pattern.name) {
      errors.push({
        field: `${prefix}.name`,
        message: "Pattern must have a 'name' field",
        severity: "error",
      });
    }

    if (!pattern.pattern) {
      errors.push({
        field: `${prefix}.pattern`,
        message: "Pattern must have a 'pattern' field",
        severity: "error",
      });
    }

    if (!pattern.category) {
      errors.push({
        field: `${prefix}.category`,
        message: "Pattern must have a 'category' field",
        severity: "error",
      });
    }

    // Validate regex pattern
    if (pattern.pattern) {
      try {
        new RegExp(pattern.pattern);
      } catch (e) {
        errors.push({
          field: `${prefix}.pattern`,
          message: `Invalid regex pattern: ${e instanceof Error ? e.message : String(e)}`,
          severity: "error",
        });
      }
    }

    // Category validation
    const validCategories = ["placeholder", "mock", "deceptive", "unused", "custom"];
    if (pattern.category && !validCategories.includes(pattern.category)) {
      warnings.push({
        field: `${prefix}.category`,
        message: `Unknown category '${pattern.category}'. Known categories: ${validCategories.join(", ")}`,
        severity: "warning",
        suggestion: "Use a known category or 'custom' for better organization",
      });
    }
  });
}

/**
 * Validate include/exclude paths
 */
function validatePaths(
  include: string[] | undefined,
  exclude: string[] | undefined,
  warnings: ValidationWarning[],
): void {
  // Check for overly broad include patterns
  if (include) {
    const broadPatterns = ["**/*", "*", "**"];
    include.forEach((pattern, index) => {
      if (broadPatterns.includes(pattern)) {
        warnings.push({
          field: `include[${index}]`,
          message: `Very broad include pattern '${pattern}' may slow down scans`,
          severity: "warning",
          suggestion: "Use more specific patterns like 'src/**/*.ts' to improve performance",
        });
      }
    });
  }

  // Check for missing common excludes
  const recommendedExcludes = ["node_modules", "dist", "build", ".git"];
  if (exclude) {
    const missingExcludes = recommendedExcludes.filter(
      (recommended) =>
        !exclude.some((pattern) =>
          pattern.includes(recommended)
        ),
    );

    if (missingExcludes.length > 0) {
      warnings.push({
        field: "exclude",
        message: `Consider excluding common directories: ${missingExcludes.join(", ")}`,
        severity: "warning",
        suggestion: "Add patterns like 'node_modules/**', 'dist/**' to improve performance",
      });
    }
  } else {
    warnings.push({
      field: "exclude",
      message: "No exclude patterns defined",
      severity: "warning",
      suggestion: `Add exclude patterns for: ${recommendedExcludes.join(", ")}`,
    });
  }
}

/**
 * Validate severity settings
 */
function validateSeverities(config: FindLazyConfig, errors: ValidationError[]): void {
  const validSeverities = ["error", "warning", "info"];

  const checkSeverity = (field: string, severity: string | undefined) => {
    if (severity && !validSeverities.includes(severity)) {
      errors.push({
        field,
        message: `Invalid severity '${severity}'. Must be one of: ${validSeverities.join(", ")}`,
        severity: "error",
      });
    }
  };

  if (config.patterns.placeholders) {
    checkSeverity("patterns.placeholders.severity", config.patterns.placeholders.severity);
  }

  if (config.patterns.mocks) {
    checkSeverity("patterns.mocks.severity", config.patterns.mocks.severity);
  }

  if (config.patterns.deceptive) {
    checkSeverity("patterns.deceptive.severity", config.patterns.deceptive.severity);
  }

  if (config.patterns.unused) {
    checkSeverity("patterns.unused.severity", config.patterns.unused.severity);
  }
}

/**
 * Suggest performance and usability optimizations
 */
function suggestOptimizations(
  config: FindLazyConfig,
  optimizations: OptimizationSuggestion[],
): void {
  // Check if all patterns are enabled
  const allEnabled =
    config.patterns.placeholders?.enabled !== false &&
    config.patterns.mocks?.enabled !== false &&
    config.patterns.deceptive?.enabled !== false &&
    config.patterns.unused?.enabled !== false;

  if (allEnabled) {
    optimizations.push({
      field: "patterns",
      message: "All pattern types are enabled",
      severity: "info",
      impact: "medium",
    });
  }

  // Check output settings
  if (config.output?.format === "json") {
    optimizations.push({
      field: "output.format",
      message: "JSON format is optimal for MCP/programmatic use",
      severity: "info",
      impact: "low",
    });
  }

  // Check for empty include patterns
  if (!config.include || config.include.length === 0) {
    optimizations.push({
      field: "include",
      message: "No include patterns specified - scanning all files",
      severity: "info",
      impact: "high",
    });
  }

  // Suggest caching
  if (config.cache?.enabled === false) {
    optimizations.push({
      field: "cache.enabled",
      message: "Caching is disabled - scans may be slower on repeated runs",
      severity: "info",
      impact: "medium",
    });
  }
}

/**
 * Validate a configuration file at a given path
 */
export async function validateConfigFile(configPath: string): Promise<ValidationResult> {
  // Check if file exists
  if (!(await exists(configPath))) {
    return {
      valid: false,
      errors: [{
        field: "file",
        message: `Configuration file not found: ${configPath}`,
        severity: "error",
      }],
      warnings: [],
      optimizations: [],
    };
  }

  // Try to load and parse the config
  try {
    const content = await Deno.readTextFile(configPath);
    const config = JSON.parse(content) as FindLazyConfig;
    return validateConfiguration(config);
  } catch (error) {
    return {
      valid: false,
      errors: [{
        field: "file",
        message: `Failed to parse configuration: ${error instanceof Error ? error.message : String(error)}`,
        severity: "error",
      }],
      warnings: [],
      optimizations: [],
    };
  }
}

/**
 * Validate configuration in a project directory
 */
export async function validateProjectConfig(projectPath: string = "."): Promise<ValidationResult> {
  const configPath = join(projectPath, "findlazy.json");
  return await validateConfigFile(configPath);
}

/**
 * Format validation results as a human-readable string
 */
export function formatValidationResults(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push("Configuration Validation Results");
  lines.push("=".repeat(60));
  lines.push("");

  if (result.valid) {
    lines.push("✓ Configuration is valid");
  } else {
    lines.push("✗ Configuration has errors");
  }

  lines.push("");

  // Errors
  if (result.errors.length > 0) {
    lines.push(`Errors (${result.errors.length}):`);
    result.errors.forEach((error) => {
      lines.push(`  ✗ ${error.field}: ${error.message}`);
    });
    lines.push("");
  }

  // Warnings
  if (result.warnings.length > 0) {
    lines.push(`Warnings (${result.warnings.length}):`);
    result.warnings.forEach((warning) => {
      lines.push(`  ⚠ ${warning.field}: ${warning.message}`);
      if (warning.suggestion) {
        lines.push(`    → ${warning.suggestion}`);
      }
    });
    lines.push("");
  }

  // Optimizations
  if (result.optimizations.length > 0) {
    lines.push(`Optimizations (${result.optimizations.length}):`);
    result.optimizations.forEach((opt) => {
      const impactIcon = opt.impact === "high" ? "!" : opt.impact === "medium" ? "↑" : "→";
      lines.push(`  ${impactIcon} ${opt.field}: ${opt.message}`);
    });
    lines.push("");
  }

  return lines.join("\n");
}
