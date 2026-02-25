import { Command } from "@cliffy/command";
import { join } from "@std/path";
import { exists, readFile, writeFile } from "../../../core/fs.ts";
import { parse as parseJsonc } from "@std/jsonc";
import type { FindLazyConfig } from "../../../core/config.ts";

export const ignoreCommand = new Command()
  .name("ignore")
  .description("Manage ignore patterns")
  .action(() => {
    ignoreCommand.showHelp();
  });

// Add pattern to ignore list
const addCommand = new Command()
  .name("add")
  .description("Add pattern to ignore list")
  .arguments("<pattern:string>")
  .option("-g, --global", "Add to global config")
  .action(async (options, pattern) => {
    try {
      const configPath = options.global
        ? join(Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || "~", ".findlazy", "config.json")
        : join(Deno.cwd(), "findlazy.json");

      let config: Partial<FindLazyConfig>;

      if (await exists(configPath)) {
        const content = await readFile(configPath);
        config = parseJsonc(content) as Partial<FindLazyConfig>;
      } else {
        config = {
          version: "1.0",
          ignorePatterns: [],
        };
      }

      // Initialize ignorePatterns if not exists
      if (!config.ignorePatterns) {
        config.ignorePatterns = [];
      }

      // Check if pattern already exists
      if (config.ignorePatterns.includes(pattern)) {
        await Deno.stdout.write(new TextEncoder().encode(`Pattern already in ignore list: ${pattern}\n`));
        return;
      }

      // Add pattern
      config.ignorePatterns.push(pattern);

      // Save config
      await writeFile(configPath, JSON.stringify(config, null, 2));

      await Deno.stdout.write(new TextEncoder().encode(`Added to ignore list: ${pattern}\n`));
      await Deno.stdout.write(new TextEncoder().encode(`Config: ${configPath}\n`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await Deno.stderr.write(new TextEncoder().encode(`Error: ${message}\n`));
      Deno.exit(1);
    }
  });

// Remove pattern from ignore list
const removeCommand = new Command()
  .name("remove")
  .description("Remove pattern from ignore list")
  .arguments("<pattern:string>")
  .option("-g, --global", "Remove from global config")
  .action(async (options, pattern) => {
    try {
      const configPath = options.global
        ? join(Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || "~", ".findlazy", "config.json")
        : join(Deno.cwd(), "findlazy.json");

      if (!(await exists(configPath))) {
        await Deno.stdout.write(new TextEncoder().encode("No config file found\n"));
        return;
      }

      const content = await readFile(configPath);
      const config = parseJsonc(content) as Partial<FindLazyConfig>;

      if (!config.ignorePatterns || config.ignorePatterns.length === 0) {
        await Deno.stdout.write(new TextEncoder().encode("No ignore patterns found\n"));
        return;
      }

      // Remove pattern
      const index = config.ignorePatterns.indexOf(pattern);
      if (index === -1) {
        await Deno.stdout.write(new TextEncoder().encode(`Pattern not found in ignore list: ${pattern}\n`));
        return;
      }

      config.ignorePatterns.splice(index, 1);

      // Save config
      await writeFile(configPath, JSON.stringify(config, null, 2));

      await Deno.stdout.write(new TextEncoder().encode(`Removed from ignore list: ${pattern}\n`));
      await Deno.stdout.write(new TextEncoder().encode(`Config: ${configPath}\n`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await Deno.stderr.write(new TextEncoder().encode(`Error: ${message}\n`));
      Deno.exit(1);
    }
  });

// List ignore patterns
const listCommand = new Command()
  .name("list")
  .description("List ignore patterns")
  .option("-g, --global", "List global config patterns")
  .action(async (options) => {
    try {
      const configPath = options.global
        ? join(Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || "~", ".findlazy", "config.json")
        : join(Deno.cwd(), "findlazy.json");

      if (!(await exists(configPath))) {
        await Deno.stdout.write(new TextEncoder().encode("No config file found\n"));
        return;
      }

      const content = await readFile(configPath);
      const config = parseJsonc(content) as Partial<FindLazyConfig>;

      if (!config.ignorePatterns || config.ignorePatterns.length === 0) {
        await Deno.stdout.write(new TextEncoder().encode("No ignore patterns found\n"));
        return;
      }

      await Deno.stdout.write(new TextEncoder().encode(`Ignore patterns (${configPath}):\n`));
      for (let index = 0; index < config.ignorePatterns.length; index++) {
        const pattern = config.ignorePatterns[index];
        await Deno.stdout.write(new TextEncoder().encode(`  ${index + 1}. ${pattern}\n`));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await Deno.stderr.write(new TextEncoder().encode(`Error: ${message}\n`));
      Deno.exit(1);
    }
  });

// Add subcommands
ignoreCommand
  .command("add", addCommand)
  .command("remove", removeCommand)
  .command("list", listCommand);

export { addCommand, removeCommand, listCommand };
