import { resolve, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Resolve path segments to an absolute path.
 */
export function resolvePath(...segments) {
  return resolve(...segments);
}

/**
 * Find the lore plugin root by walking up from the current file
 * looking for `.claude-plugin/plugin.json`.
 */
export function loreRoot() {
  let dir = __dirname;
  while (true) {
    const candidate = resolve(dir, '.claude-plugin', 'plugin.json');
    if (existsSync(candidate)) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error('Could not find lore plugin root (.claude-plugin/plugin.json)');
    }
    dir = parent;
  }
}

/**
 * Find nearest plugin root from startDir by walking up looking for
 * `.claude-plugin/plugin.json`.
 */
export function pluginRoot(startDir) {
  let dir = resolve(startDir);
  while (true) {
    const candidate = resolve(dir, '.claude-plugin', 'plugin.json');
    if (existsSync(candidate)) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error('Could not find plugin root from ' + startDir);
    }
    dir = parent;
  }
}
