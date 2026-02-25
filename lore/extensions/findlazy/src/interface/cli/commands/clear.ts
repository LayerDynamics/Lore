import { Command } from "@cliffy/command";
import { getCacheDir, exists } from "../../../core/fs.ts";
import { Confirm } from "@cliffy/prompt";

export const clearCommand = new Command()
  .name("clear")
  .description("Clear cache and temporary files")
  .option("-f, --force", "Skip confirmation prompt")
  .action(async (options) => {
    try {
      const cacheDir = getCacheDir();

      if (!(await exists(cacheDir))) {
        await Deno.stdout.write(new TextEncoder().encode("No cache directory found\n"));
        return;
      }

      // Confirm before clearing
      if (!options.force) {
        const confirmed = await Confirm.prompt({
          message: `Clear cache directory: ${cacheDir}?`,
          default: false,
        });

        if (!confirmed) {
          await Deno.stdout.write(new TextEncoder().encode("Cancelled\n"));
          return;
        }
      }

      // Remove cache directory
      await Deno.remove(cacheDir, { recursive: true });

      await Deno.stdout.write(new TextEncoder().encode(`Cache cleared: ${cacheDir}\n`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await Deno.stderr.write(new TextEncoder().encode(`Error: ${message}\n`));
      Deno.exit(1);
    }
  });
