#!/usr/bin/env -S deno run -A

/**
 * Package binaries for distribution
 *
 * Creates compressed archives and SHA256 checksums for all binaries:
 * - Unix platforms (macOS, Linux): tar.gz
 * - Windows: zip
 */

import { ensureDir } from "@std/fs";
import { join, basename } from "@std/path";
import { crypto } from "@std/crypto";
import { encodeHex } from "@std/encoding/hex";

const DIST_DIR = "./dist";

interface Binary {
  name: string;
  platform: string;
  archiveFormat: "tar.gz" | "zip";
}

async function getBinaries(): Promise<Binary[]> {
  const binaries: Binary[] = [];

  try {
    for await (const entry of Deno.readDir(DIST_DIR)) {
      if (!entry.isFile) continue;

      const name = entry.name;

      // Skip already packaged files
      if (name.endsWith(".tar.gz") || name.endsWith(".zip") || name.endsWith(".sha256")) {
        continue;
      }

      // Determine platform and format
      let platform: string;
      let archiveFormat: "tar.gz" | "zip";

      if (name.includes("windows")) {
        platform = "windows";
        archiveFormat = "zip";
      } else if (name.includes("macos")) {
        platform = "macos";
        archiveFormat = "tar.gz";
      } else if (name.includes("linux")) {
        platform = "linux";
        archiveFormat = "tar.gz";
      } else {
        continue; // Unknown platform
      }

      binaries.push({ name, platform, archiveFormat });
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      await Deno.stderr.write(
        new TextEncoder().encode(`Error: ${DIST_DIR} directory not found. Run build:binaries first.\n`),
      );
      Deno.exit(1);
    }
    throw error;
  }

  return binaries;
}

async function createTarGz(binaryPath: string, outputPath: string): Promise<void> {
  const binaryName = basename(binaryPath);

  const command = new Deno.Command("tar", {
    args: [
      "-czf",
      outputPath,
      "-C",
      DIST_DIR,
      binaryName,
    ],
    stdout: "inherit",
    stderr: "inherit",
  });

  const { code } = await command.output();

  if (code !== 0) {
    throw new Error(`Failed to create tar.gz archive: ${outputPath}`);
  }
}

async function createZip(binaryPath: string, outputPath: string): Promise<void> {
  const binaryName = basename(binaryPath);

  const command = new Deno.Command("zip", {
    args: [
      "-j", // junk paths (don't include directory structure)
      outputPath,
      binaryPath,
    ],
    stdout: "inherit",
    stderr: "inherit",
  });

  const { code } = await command.output();

  if (code !== 0) {
    throw new Error(`Failed to create zip archive: ${outputPath}`);
  }
}

async function generateChecksum(filePath: string): Promise<string> {
  const file = await Deno.readFile(filePath);
  const hash = await crypto.subtle.digest("SHA-256", file);
  return encodeHex(hash);
}

async function saveChecksum(filePath: string, checksum: string): Promise<void> {
  const checksumPath = `${filePath}.sha256`;
  const checksumContent = `${checksum}  ${basename(filePath)}\n`;
  await Deno.writeTextFile(checksumPath, checksumContent);
  await Deno.stdout.write(
    new TextEncoder().encode(`  ✓ Checksum: ${checksumPath}\n`),
  );
}

async function packageBinary(binary: Binary): Promise<void> {
  const binaryPath = join(DIST_DIR, binary.name);
  const archiveName = binary.archiveFormat === "tar.gz"
    ? `${binary.name}.tar.gz`
    : `${binary.name}.zip`;
  const archivePath = join(DIST_DIR, archiveName);

  await Deno.stdout.write(
    new TextEncoder().encode(`\nPackaging ${binary.name}...\n`),
  );

  // Create archive
  if (binary.archiveFormat === "tar.gz") {
    await createTarGz(binaryPath, archivePath);
  } else {
    await createZip(binaryPath, archivePath);
  }

  await Deno.stdout.write(
    new TextEncoder().encode(`  ✓ Archive: ${archiveName}\n`),
  );

  // Generate checksum
  const checksum = await generateChecksum(archivePath);
  await saveChecksum(archivePath, checksum);
}

async function main(): Promise<void> {
  await Deno.stdout.write(
    new TextEncoder().encode("Packaging FindLazy binaries...\n"),
  );

  await ensureDir(DIST_DIR);

  const binaries = await getBinaries();

  if (binaries.length === 0) {
    await Deno.stderr.write(
      new TextEncoder().encode("No binaries found in dist/. Run build:binaries first.\n"),
    );
    Deno.exit(1);
  }

  await Deno.stdout.write(
    new TextEncoder().encode(`Found ${binaries.length} binaries to package\n`),
  );

  let successCount = 0;
  let failureCount = 0;

  for (const binary of binaries) {
    try {
      await packageBinary(binary);
      successCount++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await Deno.stderr.write(
        new TextEncoder().encode(`✗ Error packaging ${binary.name}: ${message}\n`),
      );
      failureCount++;
    }
  }

  // Summary
  await Deno.stdout.write(
    new TextEncoder().encode(
      `\n${"=".repeat(60)}\nPackaging Summary:\n${"=".repeat(60)}\n`,
    ),
  );
  await Deno.stdout.write(
    new TextEncoder().encode(`Total binaries: ${binaries.length}\n`),
  );
  await Deno.stdout.write(
    new TextEncoder().encode(`Successful: ${successCount}\n`),
  );
  await Deno.stdout.write(
    new TextEncoder().encode(`Failed: ${failureCount}\n`),
  );

  if (failureCount > 0) {
    await Deno.stdout.write(
      new TextEncoder().encode("\n⚠️  Some packages failed. Check errors above.\n"),
    );
    Deno.exit(1);
  }

  await Deno.stdout.write(
    new TextEncoder().encode("\n✓ All binaries packaged successfully!\n"),
  );
  await Deno.stdout.write(
    new TextEncoder().encode(`\nPackages are in: ${DIST_DIR}/\n`),
  );
}

if (import.meta.main) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    Deno.stderr.write(new TextEncoder().encode(`Fatal error: ${message}\n`));
    Deno.exit(1);
  });
}
