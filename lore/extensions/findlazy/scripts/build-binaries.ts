#!/usr/bin/env -S deno run -A

/**
 * Build standalone binaries for all platforms
 *
 * Creates both CLI and MCP server binaries for:
 * - macOS (ARM64 and x64)
 * - Linux (x64)
 * - Windows (x64)
 */

import { ensureDir } from "@std/fs";
import { join } from "@std/path";

interface BuildTarget {
  platform: string;
  arch: string;
  target: string;
  extension: string;
}

const TARGETS: BuildTarget[] = [
  {
    platform: "macos",
    arch: "arm64",
    target: "aarch64-apple-darwin",
    extension: "",
  },
  {
    platform: "macos",
    arch: "x64",
    target: "x86_64-apple-darwin",
    extension: "",
  },
  {
    platform: "linux",
    arch: "x64",
    target: "x86_64-unknown-linux-gnu",
    extension: "",
  },
  {
    platform: "windows",
    arch: "x64",
    target: "x86_64-pc-windows-msvc",
    extension: ".exe",
  },
];

const DIST_DIR = "./dist";

async function compileBinary(
  source: string,
  outputName: string,
  target: string,
  extension: string,
): Promise<void> {
  const output = `${outputName}${extension}`;
  const outputPath = join(DIST_DIR, output);

  await Deno.stdout.write(
    new TextEncoder().encode(`\nCompiling ${output} (${target})...\n`),
  );

  const command = new Deno.Command("deno", {
    args: [
      "compile",
      "--lite",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "--target",
      target,
      "--output",
      outputPath,
      source,
    ],
    stdout: "inherit",
    stderr: "inherit",
  });

  const { code } = await command.output();

  if (code !== 0) {
    throw new Error(`Failed to compile ${output}`);
  }

  await Deno.stdout.write(
    new TextEncoder().encode(`✓ Built ${output}\n`),
  );
}

async function main(): Promise<void> {
  await Deno.stdout.write(
    new TextEncoder().encode("Building FindLazy binaries for all platforms...\n"),
  );

  // Ensure dist directory exists
  await ensureDir(DIST_DIR);

  // Track success/failure
  let successCount = 0;
  let failureCount = 0;

  // Build for each target
  for (const target of TARGETS) {
    const baseName = `findlazy-${target.platform}-${target.arch}`;
    const mcpName = `findlazy-mcp-${target.platform}-${target.arch}`;

    try {
      // Compile CLI binary
      await compileBinary(
        "./main.ts",
        baseName,
        target.target,
        target.extension,
      );
      successCount++;

      // Compile MCP server binary
      await compileBinary(
        "./src/interface/mcp/server.ts",
        mcpName,
        target.target,
        target.extension,
      );
      successCount++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await Deno.stderr.write(
        new TextEncoder().encode(`✗ Error: ${message}\n`),
      );
      failureCount++;
    }
  }

  // Summary
  await Deno.stdout.write(
    new TextEncoder().encode(
      `\n${"=".repeat(60)}\nBuild Summary:\n${"=".repeat(60)}\n`,
    ),
  );
  await Deno.stdout.write(
    new TextEncoder().encode(`Total binaries: ${TARGETS.length * 2}\n`),
  );
  await Deno.stdout.write(
    new TextEncoder().encode(`Successful: ${successCount}\n`),
  );
  await Deno.stdout.write(
    new TextEncoder().encode(`Failed: ${failureCount}\n`),
  );

  if (failureCount > 0) {
    await Deno.stdout.write(
      new TextEncoder().encode("\n⚠️  Some builds failed. Check errors above.\n"),
    );
    Deno.exit(1);
  }

  await Deno.stdout.write(
    new TextEncoder().encode("\n✓ All binaries built successfully!\n"),
  );
  await Deno.stdout.write(
    new TextEncoder().encode(`\nBinaries are in: ${DIST_DIR}/\n`),
  );
}

if (import.meta.main) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    Deno.stderr.write(new TextEncoder().encode(`Fatal error: ${message}\n`));
    Deno.exit(1);
  });
}
