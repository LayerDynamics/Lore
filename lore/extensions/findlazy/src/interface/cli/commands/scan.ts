import { Command } from "@cliffy/command";
import { loadConfig, getEnabledExtensions } from "../../../core/config.ts";
import { walkDirectory, readFile } from "../../../core/fs.ts";
import { formatResult, type Finding, type ScanResult } from "../../../core/reporter.ts";
import { TypeScriptScanner } from "../../../scanners/typescript.ts";
import { PythonScanner } from "../../../scanners/python.ts";

export const scanCommand = new Command()
  .name("scan")
  .description("Scan codebase for lazy/incomplete code patterns")
  .arguments("[path:string]")
  .option("-c, --config <path:string>", "Path to config file")
  .option("-f, --format <format:string>", "Output format (table, json, text, compact)", {
    default: "table",
  })
  .option("--no-color", "Disable colored output")
  .option("-v, --verbose", "Verbose output")
  .action(async (options, path = ".") => {
    const startTime = Date.now();

    try {
      // Load configuration
      const config = await loadConfig(path, {
        output: {
          format: options.format as "table" | "json" | "text" | "compact",
          colors: options.color !== false,
          groupBy: "file" as const,
          showContext: true,
          contextLines: 2,
        },
      });

      await Deno.stdout.write(new TextEncoder().encode(`Scanning: ${path}\n`));
      if (options.verbose) {
        await Deno.stdout.write(new TextEncoder().encode(`Config loaded from: ${path}\n`));
      }

      // Initialize scanners
      const scanners = [
        new TypeScriptScanner(),
        new PythonScanner(),
      ];

      // Get enabled extensions
      const extensions = getEnabledExtensions(config);

      // Collect all findings
      const allFindings: Finding[] = [];
      let totalFiles = 0;
      let scannedFiles = 0;

      // Walk through files
      for await (
        const file of walkDirectory(path, {
          extensions,
          exclude: config.exclude,
        })
      ) {
        totalFiles++;

        // Find appropriate scanner
        const scanner = scanners.find((s) => s.supports(file.path));
        if (!scanner) continue;

        try {
          const content = await readFile(file.path);
          const findings = await scanner.scan({
            config,
            filePath: file.path,
            content,
          });

          allFindings.push(...findings);
          scannedFiles++;

          if (options.verbose && findings.length > 0) {
            await Deno.stdout.write(new TextEncoder().encode(`Found ${findings.length} issues in ${file.path}\n`));
          }
        } catch (error) {
          if (options.verbose) {
            const message = error instanceof Error ? error.message : String(error);
            await Deno.stderr.write(new TextEncoder().encode(`Error scanning ${file.path}: ${message}\n`));
          }
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

      const result: ScanResult = {
        findings: allFindings,
        stats,
        duration,
      };

      // Format and output results
      const output = formatResult(result, config);
      await Deno.stdout.write(new TextEncoder().encode("\n" + output + "\n"));

      // Exit with error code if issues found
      if (stats.errors > 0) {
        Deno.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await Deno.stderr.write(new TextEncoder().encode(`Error: ${message}\n`));
      if (options.verbose && error instanceof Error) {
        await Deno.stderr.write(new TextEncoder().encode((error.stack || "") + "\n"));
      }
      Deno.exit(1);
    }
  });
