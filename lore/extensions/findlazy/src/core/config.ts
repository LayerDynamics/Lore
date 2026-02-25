import { parse as parseJsonc } from "@std/jsonc";
import { join } from "@std/path";
import { exists, readFile, expandHome, getConfigDir } from "./fs.ts";

export interface LanguageConfig {
  enabled: boolean;
  extensions: string[];
}

export interface PatternConfig {
  enabled: boolean;
  severity: "info" | "warning" | "error";
}

export interface CustomPattern {
  name: string;
  pattern: string;
  type: "regex" | "exact" | "ast";
  caseInsensitive?: boolean;
  severity: "info" | "warning" | "error";
  message: string;
}

export interface OutputConfig {
  format: "table" | "json" | "text" | "compact";
  groupBy: "file" | "type" | "severity";
  showContext: boolean;
  contextLines: number;
  colors: boolean;
}

export interface CacheConfig {
  enabled: boolean;
  location: string;
  ttl: number;
}

export interface ReportingConfig {
  includeStats: boolean;
  showSuggestions: boolean;
  verbosity: "quiet" | "normal" | "verbose" | "debug";
}

export interface FindLazyConfig {
  version: string;
  include: string[];
  exclude: string[];
  languages: {
    typescript?: LanguageConfig;
    python?: LanguageConfig;
  };
  patterns: {
    placeholders?: PatternConfig;
    mocks?: PatternConfig;
    unused?: PatternConfig;
    deceptive?: PatternConfig;
  };
  customPatterns?: CustomPattern[];
  ignoreInTests: boolean;
  ignorePatterns: string[];
  output: OutputConfig;
  cache: CacheConfig;
  reporting: ReportingConfig;
}

/**
 * Default configuration
 */
export const defaultConfig: FindLazyConfig = {
  version: "1.0",
  include: ["src/**/*", "lib/**/*", "*.ts", "*.py", "*.js", "*.jsx", "*.tsx"],
  exclude: [
    "node_modules/**",
    "dist/**",
    ".git/**",
    "vendor/**",
    "**/*.min.js",
    "**/*.bundle.js",
    "coverage/**",
    ".cache/**",
  ],
  languages: {
    typescript: {
      enabled: true,
      extensions: [".ts", ".tsx", ".js", ".jsx"],
    },
    python: {
      enabled: true,
      extensions: [".py"],
    },
  },
  patterns: {
    placeholders: {
      enabled: true,
      severity: "warning",
    },
    mocks: {
      enabled: true,
      severity: "warning",
    },
    unused: {
      enabled: true,
      severity: "error",
    },
    deceptive: {
      enabled: true,
      severity: "error",
    },
  },
  customPatterns: [],
  ignoreInTests: true,
  ignorePatterns: [
    "test/**/*",
    "tests/**/*",
    "**/*.test.ts",
    "**/*.test.js",
    "**/*.test.py",
    "**/*.spec.ts",
    "**/*.spec.js",
    "**/test_*.py",
  ],
  output: {
    format: "table",
    groupBy: "file",
    showContext: true,
    contextLines: 2,
    colors: true,
  },
  cache: {
    enabled: true,
    location: "~/.findlazy/cache",
    ttl: 3600,
  },
  reporting: {
    includeStats: true,
    showSuggestions: true,
    verbosity: "normal",
  },
};

/**
 * Load configuration from a file
 */
async function loadConfigFile(filePath: string): Promise<Partial<FindLazyConfig> | null> {
  const expandedPath = expandHome(filePath);

  if (!(await exists(expandedPath))) {
    return null;
  }

  try {
    const content = await readFile(expandedPath);
    const config = parseJsonc(content) as Partial<FindLazyConfig>;
    return config;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse config file ${filePath}: ${message}`);
  }
}

/**
 * Merge configurations with priority: project > global > default
 */
function mergeConfigs(...configs: Array<Partial<FindLazyConfig> | null>): FindLazyConfig {
  const merged = { ...defaultConfig };

  for (const config of configs) {
    if (!config) continue;

    Object.assign(merged, {
      ...config,
      languages: { ...merged.languages, ...config.languages },
      patterns: { ...merged.patterns, ...config.patterns },
      output: { ...merged.output, ...config.output },
      cache: { ...merged.cache, ...config.cache },
      reporting: { ...merged.reporting, ...config.reporting },
    });

    // Arrays should be replaced, not merged
    if (config.include) merged.include = config.include;
    if (config.exclude) merged.exclude = config.exclude;
    if (config.ignorePatterns) merged.ignorePatterns = config.ignorePatterns;
    if (config.customPatterns) merged.customPatterns = config.customPatterns;
  }

  return merged;
}

/**
 * Load configuration with hierarchy: default -> global -> project -> overrides
 */
export async function loadConfig(
  projectPath: string = ".",
  overrides: Partial<FindLazyConfig> = {},
): Promise<FindLazyConfig> {
  // Load global config from ~/.findlazy/config.json
  const globalConfigPath = join(getConfigDir(), "config.json");
  const globalConfig = await loadConfigFile(globalConfigPath);

  // Load project config from ./findlazy.json
  const projectConfigPath = join(projectPath, "findlazy.json");
  const projectConfig = await loadConfigFile(projectConfigPath);

  // Merge: default -> global -> project -> overrides
  return mergeConfigs(defaultConfig, globalConfig, projectConfig, overrides);
}

/**
 * Validate configuration
 */
export function validateConfig(config: FindLazyConfig): string[] {
  const errors: string[] = [];

  if (!config.version) {
    errors.push("Config version is required");
  }

  if (!config.include || config.include.length === 0) {
    errors.push("At least one include pattern is required");
  }

  if (config.output.contextLines < 0 || config.output.contextLines > 10) {
    errors.push("contextLines must be between 0 and 10");
  }

  if (config.cache.ttl < 0) {
    errors.push("cache.ttl must be non-negative");
  }

  return errors;
}

/**
 * Get enabled file extensions from config
 */
export function getEnabledExtensions(config: FindLazyConfig): string[] {
  const extensions: string[] = [];

  if (config.languages.typescript?.enabled) {
    extensions.push(...(config.languages.typescript.extensions || []));
  }

  if (config.languages.python?.enabled) {
    extensions.push(...(config.languages.python.extensions || []));
  }

  return [...new Set(extensions)]; // Remove duplicates
}
