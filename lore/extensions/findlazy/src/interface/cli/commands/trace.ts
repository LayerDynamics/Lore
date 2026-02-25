import { Command } from "@cliffy/command";
import { loadConfig } from "../../../core/config.ts";
import { walkDirectory, readFile } from "../../../core/fs.ts";
import { PatternMatcher } from "../../../parsers/pattern-matcher.ts";
import { bold, yellow, dim } from "@std/fmt/colors";

export const traceCommand = new Command()
  .name("trace")
  .description("Trace specific pattern in codebase")
  .arguments("<pattern:string> [path:string]")
  .option("-i, --ignore-case", "Case insensitive search")
  .option("-r, --regex", "Treat pattern as regex")
  .option("-c, --context <lines:number>", "Number of context lines", { default: 2 })
  .option("--no-color", "Disable colored output")
  .action(async (options, pattern, path = ".") => {
    try {
      const config = await loadConfig(path);
      const matcher = new PatternMatcher();
      const useColors = options.color !== false;

      let matchCount = 0;
      let fileCount = 0;

      await Deno.stdout.write(new TextEncoder().encode(`Tracing pattern: ${useColors ? bold(pattern) : pattern}\n`));
      await Deno.stdout.write(new TextEncoder().encode(`Path: ${path}\n\n`));

      // Walk through all files
      for await (const file of walkDirectory(path, { exclude: config.exclude })) {
        try {
          const content = await readFile(file.path);
          let matches;

          if (options.regex) {
            const regex = new RegExp(
              pattern,
              options.ignoreCase ? "gi" : "g",
            );
            matches = matcher.matchRegex(content, regex, options.context);
          } else {
            matches = matcher.matchExact(
              content,
              pattern,
              options.ignoreCase || false,
              options.context,
            );
          }

          if (matches.length > 0) {
            fileCount++;
            matchCount += matches.length;

            // Print file header
            await Deno.stdout.write(new TextEncoder().encode((useColors ? bold(`\n${file.path}:`) : `\n${file.path}:`) + "\n"));

            // Print each match
            for (const match of matches) {
              const location = `Line ${match.line}, Column ${match.column}`;
              await Deno.stdout.write(new TextEncoder().encode(
                (useColors ? yellow(`  ${location}:`) : `  ${location}:`) + "\n",
              ));

              // Print context
              if (match.context && match.context.length > 0) {
                const startLine = match.line - Math.floor(match.context.length / 2);
                match.context.forEach(async (line, idx) => {
                  const lineNum = startLine + idx;
                  const prefix = lineNum === match.line ? ">" : " ";
                  const lineText = `    ${prefix} ${lineNum} | ${line}`;
                  await Deno.stdout.write(new TextEncoder().encode((useColors && lineNum === match.line ? bold(lineText) : useColors ? dim(lineText) : lineText) + "\n"));
                });
              }
            }
          }
        } catch (error) {
          // Skip files that can't be read, but log the error for debugging
          const message = error instanceof Error ? error.message : String(error);
          await Deno.stderr.write(new TextEncoder().encode(`Warning: Could not read ${file.path}: ${message}\n`));
          continue;
        }
      }

      await Deno.stdout.write(new TextEncoder().encode(`\n${useColors ? bold("Summary:") : "Summary:"}\n`));
      await Deno.stdout.write(new TextEncoder().encode(`  Found ${matchCount} matches in ${fileCount} files\n`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await Deno.stderr.write(new TextEncoder().encode(`Error: ${message}\n`));
      Deno.exit(1);
    }
  });
