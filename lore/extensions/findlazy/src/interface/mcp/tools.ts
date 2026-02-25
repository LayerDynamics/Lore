import { loadConfig, getEnabledExtensions } from "../../core/config.ts";
import { walkDirectory, readFile, writeFile, getCacheDir, ensureDir } from "../../core/fs.ts";
import { formatResult, type Finding, type ScanResult } from "../../core/reporter.ts";
import { TypeScriptScanner } from "../../scanners/typescript.ts";
import { PythonScanner } from "../../scanners/python.ts";
import { PatternMatcher } from "../../parsers/pattern-matcher.ts";
import { join } from "@std/path";

/**
 * Scan codebase tool
 */
export async function scanTool(args: Record<string, unknown>): Promise<{ content: Array<{ type: string; text: string }> }> {
  const path = (args.path as string) || ".";
  const format = (args.format as "table" | "json" | "text" | "compact") || "json";

  try {
    const startTime = Date.now();
    const config = await loadConfig(path, {
      output: {
        format,
        groupBy: "file" as const,
        showContext: true,
        contextLines: 2,
        colors: false,
      },
    });

    // Initialize scanners
    const scanners = [new TypeScriptScanner(), new PythonScanner()];
    const extensions = getEnabledExtensions(config);

    // Collect findings
    const allFindings: Finding[] = [];
    let totalFiles = 0;
    let scannedFiles = 0;

    for await (const file of walkDirectory(path, { extensions, exclude: config.exclude })) {
      totalFiles++;

      const scanner = scanners.find((s) => s.supports(file.path));
      if (!scanner) continue;

      try {
        const content = await readFile(file.path);
        const findings = await scanner.scan({ config, filePath: file.path, content });
        allFindings.push(...findings);
        scannedFiles++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const errorText = `Error scanning ${file.path}: ${message}\n`;
        await Deno.stderr.write(new TextEncoder().encode(errorText));
      }
    }

    // Calculate stats
    const duration = Date.now() - startTime;
    const stats = {
      totalFiles,
      scannedFiles,
      totalFindings: allFindings.length,
      errors: allFindings.filter((f) => f.severity === "error").length,
      warnings: allFindings.filter((f) => f.severity === "warning").length,
      info: allFindings.filter((f) => f.severity === "info").length,
    };

    const result: ScanResult = { findings: allFindings, stats, duration };

    // Save latest findings to cache
    const cacheDir = getCacheDir();
    await ensureDir(cacheDir);
    await writeFile(join(cacheDir, "latest-findings.json"), JSON.stringify(result, null, 2));

    // Format output
    const output = format === "json" ? JSON.stringify(result, null, 2) : formatResult(result, config);

    return {
      content: [{ type: "text", text: output }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
    };
  }
}

/**
 * Trace pattern tool
 */
export async function traceTool(args: Record<string, unknown>): Promise<{ content: Array<{ type: string; text: string }> }> {
  const pattern = args.pattern as string;
  const path = (args.path as string) || ".";
  const regex = (args.regex as boolean) || false;
  const ignoreCase = (args.ignoreCase as boolean) || false;

  if (!pattern) {
    return {
      content: [{ type: "text", text: "Error: Pattern is required" }],
    };
  }

  try {
    const config = await loadConfig(path);
    const matcher = new PatternMatcher();

    const results: Array<{ file: string; line: number; column: number; text: string }> = [];

    for await (const file of walkDirectory(path, { exclude: config.exclude })) {
      try {
        const content = await readFile(file.path);
        let matches;

        if (regex) {
          const re = new RegExp(pattern, ignoreCase ? "gi" : "g");
          matches = matcher.matchRegex(content, re, 0);
        } else {
          matches = matcher.matchExact(content, pattern, ignoreCase, 0);
        }

        for (const match of matches) {
          results.push({
            file: file.path,
            line: match.line,
            column: match.column,
            text: match.matchedText,
          });
        }
      } catch (error) {
        // Skip files that can't be read, but log the error for debugging
        const message = error instanceof Error ? error.message : String(error);
        const errorText = `Warning: Could not read ${file.path}: ${message}\n`;
        await Deno.stderr.write(new TextEncoder().encode(errorText));
        continue;
      }
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          pattern,
          matchCount: results.length,
          matches: results,
        }, null, 2),
      }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
    };
  }
}

/**
 * Get config tool
 */
export async function getConfigTool(args: Record<string, unknown>): Promise<{ content: Array<{ type: string; text: string }> }> {
  const path = (args.path as string) || ".";

  try {
    const config = await loadConfig(path);

    return {
      content: [{ type: "text", text: JSON.stringify(config, null, 2) }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
    };
  }
}
