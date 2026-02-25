import { walk } from "@std/fs";
import { join, resolve } from "@std/path";

export interface FileEntry {
  path: string;
  name: string;
  isFile: boolean;
  isDirectory: boolean;
  size?: number;
  extension?: string;
}

export interface WalkOptions {
  include?: string[];
  exclude?: string[];
  extensions?: string[];
  maxDepth?: number;
  followSymlinks?: boolean;
}

/**
 * Walk through a directory and return matching files
 */
export async function* walkDirectory(
  rootPath: string,
  options: WalkOptions = {},
): AsyncGenerator<FileEntry> {
  const {
    include = [],
    exclude = [],
    extensions = [],
    maxDepth = Infinity,
    followSymlinks = false,
  } = options;

  const resolvedRoot = resolve(rootPath);

  // Build skip patterns
  const skipPatterns = [
    /node_modules/,
    /\.git/,
    /dist/,
    /build/,
    /vendor/,
    /\.cache/,
    ...exclude.map((pattern) => new RegExp(pattern.replace(/\*/g, ".*"))),
  ];

  try {
    for await (
      const entry of walk(resolvedRoot, {
        maxDepth,
        followSymlinks,
        skip: skipPatterns,
      })
    ) {
      if (!entry.isFile) continue;

      const relativePath = entry.path.replace(resolvedRoot + "/", "");

      // Check extensions if specified
      if (extensions.length > 0) {
        const ext = entry.name.substring(entry.name.lastIndexOf("."));
        if (!extensions.includes(ext)) continue;
      }

      // Check include patterns if specified
      if (include.length > 0) {
        const matches = include.some((pattern) => {
          const regex = new RegExp(pattern.replace(/\*/g, ".*"));
          return regex.test(relativePath);
        });
        if (!matches) continue;
      }

      const fileInfo = await Deno.stat(entry.path);

      yield {
        path: entry.path,
        name: entry.name,
        isFile: entry.isFile,
        isDirectory: entry.isDirectory,
        size: fileInfo.size,
        extension: entry.name.substring(entry.name.lastIndexOf(".")),
      };
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`Directory not found: ${rootPath}`);
    }
    if (error instanceof Deno.errors.PermissionDenied) {
      throw new Error(`Permission denied: ${rootPath}`);
    }
    throw error;
  }
}

/**
 * Read file contents
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    return await Deno.readTextFile(filePath);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`File not found: ${filePath}`);
    }
    if (error instanceof Deno.errors.PermissionDenied) {
      throw new Error(`Permission denied: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Write file contents
 */
export async function writeFile(
  filePath: string,
  content: string,
): Promise<void> {
  try {
    await Deno.writeTextFile(filePath, content);
  } catch (error) {
    if (error instanceof Deno.errors.PermissionDenied) {
      throw new Error(`Permission denied: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Check if a path exists
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

/**
 * Ensure a directory exists, create if it doesn't
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    const stat = await Deno.stat(dirPath);
    if (!stat.isDirectory) {
      throw new Error(`Path exists but is not a directory: ${dirPath}`);
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      await Deno.mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

/**
 * Expand home directory tilde
 */
export function expandHome(path: string): string {
  if (path.startsWith("~/") || path === "~") {
    const home = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
    if (!home) {
      throw new Error("Could not determine home directory");
    }
    return join(home, path.slice(2));
  }
  return path;
}

/**
 * Get the home directory path
 */
export function getHomeDir(): string {
  const home = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
  if (!home) {
    throw new Error("Could not determine home directory");
  }
  return home;
}

/**
 * Get FindLazy config directory (~/.findlazy)
 */
export function getConfigDir(): string {
  return join(getHomeDir(), ".findlazy");
}

/**
 * Get FindLazy cache directory (~/.findlazy/cache)
 */
export function getCacheDir(): string {
  return join(getConfigDir(), "cache");
}
