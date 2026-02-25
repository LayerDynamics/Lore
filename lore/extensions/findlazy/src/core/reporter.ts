import { Table } from "@cliffy/table";
import { bold, red, yellow, blue, green, dim } from "@std/fmt/colors";
import type { FindLazyConfig } from "./config.ts";

export interface Finding {
  id: string;
  file: string;
  line: number;
  column: number;
  type: "placeholder" | "mock" | "unused" | "deceptive" | "custom";
  severity: "info" | "warning" | "error";
  message: string;
  code?: string;
  context?: string[];
  suggestion?: string;
}

export interface ScanResult {
  findings: Finding[];
  stats: {
    totalFiles: number;
    scannedFiles: number;
    totalFindings: number;
    errors: number;
    warnings: number;
    info: number;
  };
  duration: number;
}

/**
 * Format findings as a table
 */
export function formatTable(
  result: ScanResult,
  config: FindLazyConfig,
): string {
  if (result.findings.length === 0) {
    return green("✓ No lazy code patterns found!");
  }

  const useColors = config.output.colors;
  const groupBy = config.output.groupBy;

  let output = "";

  // Group findings
  const grouped = groupFindings(result.findings, groupBy);

  for (const [group, findings] of Object.entries(grouped)) {
    const header = useColors ? bold(group) : group;
    output += `\n${header}\n${"=".repeat(group.length)}\n\n`;

    const table = new Table()
      .header([
        "Line:Col",
        "Type",
        "Severity",
        "Message",
      ]);

    for (const finding of findings) {
      const location = `${finding.line}:${finding.column}`;
      const type = finding.type;
      const severity = formatSeverity(finding.severity, useColors);
      const message = finding.message;

      table.push([location, type, severity, message]);

      // Show context if enabled
      if (config.output.showContext && finding.context) {
        const contextStr = finding.context
          .map((line, idx) => {
            const lineNum = finding.line - Math.floor(finding.context!.length / 2) + idx;
            const prefix = lineNum === finding.line ? ">" : " ";
            return `${prefix} ${lineNum} | ${line}`;
          })
          .join("\n");
        table.push([useColors ? dim(contextStr) : contextStr]);
      }

      // Show suggestion if available
      if (config.reporting.showSuggestions && finding.suggestion) {
        const suggestionText = useColors
          ? blue(`💡 ${finding.suggestion}`)
          : `💡 ${finding.suggestion}`;
        table.push([suggestionText]);
      }
    }

    output += table.toString() + "\n";
  }

  // Add stats if enabled
  if (config.reporting.includeStats) {
    output += "\n" + formatStats(result, useColors) + "\n";
  }

  return output;
}

/**
 * Format findings as JSON
 */
export function formatJson(result: ScanResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Format findings as compact text
 */
export function formatCompact(
  result: ScanResult,
  config: FindLazyConfig,
): string {
  if (result.findings.length === 0) {
    return "✓ No issues found";
  }

  const useColors = config.output.colors;
  const lines: string[] = [];

  for (const finding of result.findings) {
    const severity = formatSeverity(finding.severity, useColors);
    const location = `${finding.file}:${finding.column}:${finding.column}`;
    lines.push(`${severity} ${location} - ${finding.message}`);
  }

  if (config.reporting.includeStats) {
    lines.push("");
    lines.push(formatStats(result, useColors));
  }

  return lines.join("\n");
}

/**
 * Format findings as plain text
 */
export function formatText(
  result: ScanResult,
  config: FindLazyConfig,
): string {
  if (result.findings.length === 0) {
    return "No lazy code patterns found!";
  }

  const useColors = config.output.colors;
  const lines: string[] = [];

  for (const finding of result.findings) {
    const severity = formatSeverity(finding.severity, useColors);
    lines.push(
      `\n${severity} ${finding.type} in ${finding.file}:${finding.line}:${finding.column}`,
    );
    lines.push(`  ${finding.message}`);

    if (config.output.showContext && finding.context) {
      lines.push("\n  Context:");
      finding.context.forEach((line, idx) => {
        const lineNum = finding.line - Math.floor(finding.context!.length / 2) + idx;
        const prefix = lineNum === finding.line ? ">" : " ";
        lines.push(`    ${prefix} ${lineNum} | ${line}`);
      });
    }

    if (config.reporting.showSuggestions && finding.suggestion) {
      lines.push(`\n  💡 Suggestion: ${finding.suggestion}`);
    }
  }

  if (config.reporting.includeStats) {
    lines.push("\n" + formatStats(result, useColors));
  }

  return lines.join("\n");
}

/**
 * Format scan result based on config
 */
export function formatResult(
  result: ScanResult,
  config: FindLazyConfig,
): string {
  switch (config.output.format) {
    case "table":
      return formatTable(result, config);
    case "json":
      return formatJson(result);
    case "compact":
      return formatCompact(result, config);
    case "text":
      return formatText(result, config);
    default:
      return formatTable(result, config);
  }
}

/**
 * Group findings by specified criteria
 */
function groupFindings(
  findings: Finding[],
  groupBy: "file" | "type" | "severity",
): Record<string, Finding[]> {
  const groups: Record<string, Finding[]> = {};

  for (const finding of findings) {
    let key: string;
    switch (groupBy) {
      case "file":
        key = finding.file;
        break;
      case "type":
        key = finding.type;
        break;
      case "severity":
        key = finding.severity;
        break;
      default:
        key = finding.file; // Default to file grouping
        break;
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key]!.push(finding);
  }

  return groups;
}

/**
 * Format severity with colors
 */
function formatSeverity(
  severity: "info" | "warning" | "error",
  useColors: boolean,
): string {
  if (!useColors) {
    return severity.toUpperCase();
  }

  switch (severity) {
    case "error":
      return red("ERROR");
    case "warning":
      return yellow("WARN");
    case "info":
      return blue("INFO");
  }
}

/**
 * Format statistics summary
 */
function formatStats(result: ScanResult, useColors: boolean): string {
  const { stats, duration } = result;
  const lines: string[] = [];

  lines.push("Statistics:");
  lines.push(`  Files scanned: ${stats.scannedFiles}/${stats.totalFiles}`);
  lines.push(`  Total findings: ${stats.totalFindings}`);

  if (stats.errors > 0) {
    const errStr = useColors
      ? red(`${stats.errors} errors`)
      : `${stats.errors} errors`;
    lines.push(`  ${errStr}`);
  }

  if (stats.warnings > 0) {
    const warnStr = useColors
      ? yellow(`${stats.warnings} warnings`)
      : `${stats.warnings} warnings`;
    lines.push(`  ${warnStr}`);
  }

  if (stats.info > 0) {
    const infoStr = useColors
      ? blue(`${stats.info} info`)
      : `${stats.info} info`;
    lines.push(`  ${infoStr}`);
  }

  const durationSec = (duration / 1000).toFixed(2);
  lines.push(`  Duration: ${durationSec}s`);

  return lines.join("\n");
}

/**
 * Generate a unique finding ID
 */
export function generateFindingId(
  file: string,
  line: number,
  column: number,
): string {
  return `${file}:${line}:${column}`;
}
