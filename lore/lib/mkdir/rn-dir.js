import { renameSync, mkdirSync, readdirSync, copyFileSync, rmSync } from 'node:fs';
import { mkdir, readdir, copyFile } from 'node:fs/promises';
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
 * Recursively copy directory contents from src to dest (async).
 */
export async function copyDirAsync(src, dest) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirAsync(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

/**
 * Recursively remove a directory.
 */
export function removeDir(dirPath) {
  rmSync(dirPath, { recursive: true, force: true });
}
