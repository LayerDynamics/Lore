import { renameSync, mkdirSync, readdirSync, copyFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Rename/move a directory.
 */
export function renameDir(oldPath, newPath) {
  renameSync(oldPath, newPath);
}

/**
 * Recursively copy directory contents from src to dest.
 */
export function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Recursively remove a directory.
 */
export function removeDir(dirPath) {
  rmSync(dirPath, { recursive: true, force: true });
}
