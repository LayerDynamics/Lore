import { mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

/**
 * Create directory and all parents (like mkdir -p).
 */
export function mkdirp(dirPath) {
  mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

/**
 * Alias for mkdirp.
 */
export function ensureDir(dirPath) {
  return mkdirp(dirPath);
}

/**
 * Create a temporary directory with optional prefix.
 */
export function tempDir(prefix = 'lore-') {
  return mkdtempSync(join(tmpdir(), prefix));
}
