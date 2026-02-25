import { Command } from "@cliffy/command";
import { scanCommand, traceCommand, ignoreCommand, clearCommand } from "./commands/mod.ts";

export const cli = new Command()
  .name("findlazy")
  .version("0.1.0")
  .description(
    "FindLazy - Detect lazy, incomplete, and deceptive code patterns left by AI agents",
  )
  .meta("Author", "FindLazy Contributors")
  .meta("Repository", "https://github.com/findlazy/findlazy")
  .globalOption("-v, --verbose", "Enable verbose output")
  .globalOption("--no-color", "Disable colored output")
  .command("scan", scanCommand)
  .command("trace", traceCommand)
  .command("ignore", ignoreCommand)
  .command("clear", clearCommand);

/**
 * Run the CLI
 */
export async function runCLI(args: string[]): Promise<void> {
  try {
    await cli.parse(args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const errorText = `Error: ${message}\n`;
    await Deno.stderr.write(new TextEncoder().encode(errorText));
    Deno.exit(1);
  }
}
